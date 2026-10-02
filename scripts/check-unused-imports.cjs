const fs = require('fs')
const path = require('path')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const importPattern = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+'[^']+'/g
let issues = 0

for (const file of walk('src')) {
  const source = fs.readFileSync(file, 'utf8')
  const body = source.replace(importPattern, '')

  for (const match of source.matchAll(importPattern)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop().trim()
      if (!name) continue
      const used = new RegExp(`\\b${name}\\b`).test(body)
      if (!used) {
        console.log(`${file} -> ${name}`)
        issues += 1
      }
    }
  }
}

console.log(`unused imports: ${issues}`)