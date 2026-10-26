// Checks every skill and agent package in the registry, then compares (or writes) index.json.
// Runs on every pull request (.github/workflows/check.yml) and locally:
//   npm run check   check everything, fail if index.json is out of date
//   npm run index   check everything, then rewrite index.json
// Errors block the merge. Warnings don't, but the reviewer must read each one before merging.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const INDEX = join(ROOT, "index.json")
const WRITE = process.argv.includes("--write-index")

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SEMVER = /^\d+\.\d+\.\d+$/
const LICENSES = new Set(["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MPL-2.0", "CC0-1.0", "CC-BY-4.0"])
const RUNTIMES = ["claude", "openclaw", "hermes"]
const PERMISSIONS = ["email.read", "email.send", "calendar.read", "calendar.write", "files.read", "files.write", "web", "network", "shell"]
const CATEGORIES = ["skill", "workflow", "knowledge"]
const TONES = ["friendly", "neutral", "formal"]
const LENGTHS = ["short", "detailed"]
const TEXT_FILES = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".csv", ".py", ".sh", ".js", ".mjs", ".ts"])
const SCRIPTS = new Set([".py", ".sh", ".js", ".mjs", ".ts"])

const LIMITS = {
  nameLength: 64,
  skillDescription: 1024,
  agentDescription: 300,
  compatibility: 500,
  skillMd: 30_000,
  // Same limit as the instructions a user writes on Agentic, so a package runs there unchanged.
  instructions: 1000,
  personalityName: 30,
  author: 60,
  file: 100_000,
  skillTotal: 300_000,
}

// Credentials that must never be published.
const SECRETS = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/, "an Anthropic API key"],
  [/\bsk-(?!ant-)(proj-)?[A-Za-z0-9_-]{32,}/, "an OpenAI-style API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "an AWS access key"],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, "a GitHub token"],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, "a Slack token"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "a Google API key"],
  [/\b\d{8,10}:[A-Za-z0-9_-]{35}\b/, "a Telegram bot token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
]

// Invisible characters can hide instructions from a human reviewer while the agent still reads them.
const HIDDEN = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/

// Script patterns a reviewer must look at closely.
const RISKY = [
  [/\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, "pipes a download into a shell"],
  [/\beval\s*\(|\bexec\s*\(/, "evaluates code built at run time"],
  [/base64\s+(-d|--decode)|\batob\s*\(|b64decode/, "decodes base64 (often used to hide code)"],
  [/\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/, "deletes files recursively"],
  [/\bsudo\b/, "asks for admin rights"],
  [/\/dev\/tcp\/|\bnc\s+-[a-z]*e\b/, "opens a raw network shell"],
  [/~\/\.ssh|id_rsa|\.aws\/credentials|\.env\b/, "reads credential files"],
]
const NETWORK = /\b(fetch|axios|requests\.|urllib|http\.client|curl|wget)\b|https?:\/\//

const errors = []
const warnings = []
const err = (where, message) => errors.push(`${where}: ${message}`)
const warn = (where, message) => warnings.push(`${where}: ${message}`)

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n")
const rel = (path) => relative(ROOT, path).split(sep).join("/")
const words = (value) => (typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean) : [])

function listDirs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((entry) => {
    if (statSync(join(dir, entry)).isDirectory()) return true
    if (entry !== ".gitkeep") err(rel(join(dir, entry)), "only folders belong here, one per entry")
    return false
  })
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

// The YAML block between the first two `---` lines of a SKILL.md.
function frontmatter(text, where) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!match) {
    err(where, "must start with a YAML frontmatter block between two --- lines")
    return null
  }
  try {
    const data = parse(match[1])
    if (!data || typeof data !== "object") throw new Error("empty")
    return { data, body: text.slice(match[0].length) }
  } catch (e) {
    err(where, `frontmatter is not valid YAML (${e.message})`)
    return null
  }
}

function checkText(text, where, isScript, permissions) {
  for (const [pattern, what] of SECRETS) if (pattern.test(text)) err(where, `looks like it contains ${what}. Remove it and revoke it.`)
  if (HIDDEN.test(text)) err(where, "contains invisible Unicode characters. Remove them: hidden text is not allowed.")
  if (extname(where) === ".md" && text.includes("<!--")) warn(where, "has an HTML comment: the agent reads it, the page doesn't show it. Check what it says.")
  if (!isScript) return
  for (const [pattern, what] of RISKY) if (pattern.test(text)) warn(where, `script ${what}`)
  if (NETWORK.test(text) && !permissions.includes("network") && !permissions.includes("web"))
    err(where, 'script reaches the network: declare "network" or "web" in permissions')
}

function checkName(name, folder, where) {
  if (typeof name !== "string" || !NAME.test(name) || name.length > LIMITS.nameLength)
    err(where, `name must be lowercase letters, digits and single hyphens, ${LIMITS.nameLength} characters max`)
  else if (name !== folder) err(where, `name "${name}" must match its folder "${folder}"`)
}

function checkLicense(license, where) {
  if (!LICENSES.has(license)) err(where, `license must be one of: ${[...LICENSES].join(", ")}`)
}

function checkPermissions(list, where) {
  for (const p of list) if (!PERMISSIONS.includes(p)) err(where, `unknown permission "${p}". Allowed: ${PERMISSIONS.join(", ")}`)
}

function checkSkill(folder) {
  const dir = join(ROOT, "skills", folder)
  const where = `skills/${folder}/SKILL.md`
  const skillMd = join(dir, "SKILL.md")
  if (!existsSync(skillMd)) {
    err(`skills/${folder}`, "is missing its SKILL.md")
    return null
  }
  const text = read(skillMd)
  const parsed = frontmatter(text, where)
  if (!parsed) return null
  const { data, body } = parsed
  const meta = data.metadata && typeof data.metadata === "object" ? data.metadata : {}

  checkName(data.name, folder, where)
  if (typeof data.description !== "string" || !data.description.trim() || data.description.length > LIMITS.skillDescription)
    err(where, `description is required, ${LIMITS.skillDescription} characters max. Say what the skill does and when to use it.`)
  checkLicense(data.license, where)
  if (data.compatibility !== undefined && (typeof data.compatibility !== "string" || data.compatibility.length > LIMITS.compatibility))
    err(where, `compatibility must be text, ${LIMITS.compatibility} characters max`)
  for (const [key, value] of Object.entries(meta)) if (typeof value !== "string") err(where, `metadata.${key} must be a string (quote it)`)
  if (typeof meta.author !== "string" || !meta.author.trim() || meta.author.length > LIMITS.author) err(where, "metadata.author is required")
  if (!SEMVER.test(meta.version ?? "")) err(where, 'metadata.version must look like "1.0.0" (quoted)')
  if (meta.category !== undefined && !CATEGORIES.includes(meta.category)) err(where, `metadata.category must be one of: ${CATEGORIES.join(", ")}`)
  const runtimes = words(meta.runtimes)
  if (runtimes.length === 0) err(where, `metadata.runtimes must list the engines it was tested on: ${RUNTIMES.join(" ")}`)
  for (const r of runtimes) if (!RUNTIMES.includes(r)) err(where, `unknown runtime "${r}". Allowed: ${RUNTIMES.join(", ")}`)
  const permissions = meta.permissions === "none" ? [] : words(meta.permissions)
  if (meta.permissions === undefined) err(where, 'metadata.permissions is required: "none", or a space-separated list')
  checkPermissions(permissions, where)
  if (text.length > LIMITS.skillMd) err(where, `is ${text.length} characters, ${LIMITS.skillMd} max. Move details into reference files.`)
  if (!body.trim()) err(where, "has no instructions after the frontmatter")

  let total = 0
  const files = listFiles(dir).map((path) => {
    const name = rel(path)
    const size = statSync(path).size
    total += size
    if (!TEXT_FILES.has(extname(path).toLowerCase())) err(name, `file type not allowed. Allowed: ${[...TEXT_FILES].join(" ")}`)
    else {
      if (size > LIMITS.file) err(name, `is ${size} bytes, ${LIMITS.file} max`)
      checkText(read(path), name, SCRIPTS.has(extname(path).toLowerCase()), permissions)
    }
    return relative(dir, path).split(sep).join("/")
  })
  if (total > LIMITS.skillTotal) err(`skills/${folder}`, `weighs ${total} bytes, ${LIMITS.skillTotal} max`)

  return {
    id: folder,
    title: /^#\s+(.+)$/m.exec(body)?.[1].trim() ?? folder,
    description: data.description,
    license: data.license,
    author: meta.author,
    version: meta.version,
    category: meta.category ?? "skill",
    runtimes,
    permissions,
    compatibility: data.compatibility ?? null,
    files: files.sort(),
    content: text,
  }
}

function checkAgent(folder, skills) {
  const dir = join(ROOT, "agents", folder)
  const where = `agents/${folder}/agent.yaml`
  const yamlPath = join(dir, "agent.yaml")
  const instructionsPath = join(dir, "AGENTS.md")
  if (!existsSync(yamlPath)) {
    err(`agents/${folder}`, "is missing its agent.yaml")
    return null
  }
  let data
  try {
    data = parse(read(yamlPath))
    if (!data || typeof data !== "object") throw new Error("empty")
  } catch (e) {
    err(where, `is not valid YAML (${e.message})`)
    return null
  }

  checkName(data.name, folder, where)
  if (typeof data.title !== "string" || !data.title.trim() || data.title.length > 60) err(where, "title is required, 60 characters max")
  if (typeof data.description !== "string" || !data.description.trim() || data.description.length > LIMITS.agentDescription)
    err(where, `description is required, ${LIMITS.agentDescription} characters max`)
  if (!SEMVER.test(String(data.version ?? ""))) err(where, 'version must look like "1.0.0"')
  if (typeof data.author !== "string" || !data.author.trim() || data.author.length > LIMITS.author) err(where, "author is required")
  checkLicense(data.license, where)
  if (!RUNTIMES.includes(data.runtime)) err(where, `runtime must be one of: ${RUNTIMES.join(", ")}`)

  const p = data.personality ?? {}
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > LIMITS.personalityName)
    err(where, `personality.name is required, ${LIMITS.personalityName} characters max`)
  if (!TONES.includes(p.tone)) err(where, `personality.tone must be one of: ${TONES.join(", ")}`)
  if (!LENGTHS.includes(p.length)) err(where, `personality.length must be one of: ${LENGTHS.join(", ")}`)

  const permissions = Array.isArray(data.permissions) ? data.permissions : []
  if (!Array.isArray(data.permissions)) err(where, "permissions must be a list ([] when it needs none)")
  checkPermissions(permissions, where)

  const skillIds = Array.isArray(data.skills) ? data.skills : []
  if (!Array.isArray(data.skills)) err(where, "skills must be a list ([] when it has none)")
  for (const id of skillIds) {
    const skill = skills.get(id)
    if (!skill) {
      err(where, `skill "${id}" is not in this registry. Add it under skills/ first.`)
      continue
    }
    if (!skill.runtimes.includes(data.runtime)) err(where, `skill "${id}" isn't marked as working on ${data.runtime}`)
    for (const need of skill.permissions)
      if (!permissions.includes(need)) err(where, `skill "${id}" needs the "${need}" permission: add it to permissions`)
  }

  let instructions = ""
  if (!existsSync(instructionsPath)) err(`agents/${folder}`, "is missing its AGENTS.md (the agent's instructions)")
  else {
    instructions = read(instructionsPath).trim()
    if (!instructions) err(`agents/${folder}/AGENTS.md`, "is empty")
    if (instructions.length > LIMITS.instructions)
      err(`agents/${folder}/AGENTS.md`, `is ${instructions.length} characters, ${LIMITS.instructions} max. Put the know-how in skills.`)
  }
  for (const path of listFiles(dir)) {
    const name = rel(path)
    if (path !== yamlPath && path !== instructionsPath) err(name, "an agent package only holds agent.yaml and AGENTS.md. Put files in a skill.")
    else checkText(read(path), name, false, permissions)
  }

  return {
    id: folder,
    title: data.title,
    description: data.description,
    license: data.license,
    author: data.author,
    version: String(data.version),
    runtime: data.runtime,
    personality: { name: p.name, tone: p.tone, length: p.length },
    instructions,
    skills: skillIds,
    permissions,
  }
}

const skillEntries = listDirs(join(ROOT, "skills")).sort().map(checkSkill).filter(Boolean)
const skills = new Map(skillEntries.map((s) => [s.id, s]))
const agentEntries = listDirs(join(ROOT, "agents")).sort().map((folder) => checkAgent(folder, skills)).filter(Boolean)
for (const a of agentEntries) if (skills.has(a.id)) err(`agents/${a.id}`, "a skill already has this name: pick another one")

const index = `${JSON.stringify({ schema: 1, skills: skillEntries, agents: agentEntries }, null, 2)}\n`

for (const w of warnings) console.log(`warning  ${w}`)
for (const e of errors) console.log(`error    ${e}`)

if (errors.length === 0) {
  if (WRITE) writeFileSync(INDEX, index)
  else if (!existsSync(INDEX) || read(INDEX) !== index) {
    console.log("error    index.json is out of date: run `npm run index` and commit it")
    process.exit(1)
  }
}
console.log(`\n${skillEntries.length} skills, ${agentEntries.length} agents · ${errors.length} errors · ${warnings.length} warnings`)
process.exit(errors.length ? 1 : 0)
