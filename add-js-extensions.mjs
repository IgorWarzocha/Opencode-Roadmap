import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function addJsExtensions(dir) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      addJsExtensions(fullPath)
    } else if (item.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      
      // Fix relative imports to include .js extensions
      content = content.replace(
        /from\s+['"](\.\.?\/[^'"]+)['"]/g,
        (match, importPath) => {
          if (importPath.endsWith('.js')) {
            return match
          }
          
          // Check if it's a directory (needs index.js)
          const importFullPath = path.resolve(path.dirname(fullPath), importPath)
          if (fs.existsSync(importFullPath) && fs.statSync(importFullPath).isDirectory()) {
            return `from "${importPath}/index.js"`
          }
          
          return `from "${importPath}.js"`
        }
      )
      
      fs.writeFileSync(fullPath, content)
    }
  }
}

addJsExtensions('./dist')