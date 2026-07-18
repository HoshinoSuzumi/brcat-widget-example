import { createLogger, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pkg from './package.json'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

const brcatWidgetVitePlugin = () => {
  const logger = createLogger('info', {
    prefix: 'brcat-widget-vite-plugin',
  })

  return {
    name: 'brcat-widget-vite-plugin',
    writeBundle() {
      // create brcat-manifest.json
      const manifest = {
        type: 'widget',
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        author: pkg.author ?? null,
        widgetMeta: {
          index: 'index.html',
          width: 100,
          height: 100,
        }
      }
      const manifestPath = path.join(__dirname, `dist/${pkg.name}/brcat-manifest.json`)
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      logger.info(`dist/${pkg.name}/brcat-manifest.json`)

      // zip
      const output = fs.createWriteStream(
        path.join(__dirname, `dist/${pkg.name}.zip`)
      )
      const archive = archiver('zip', {
        zlib: { level: 9 },
      })
      archive.pipe(output)
      archive.on('error', (err: any) => {
        throw err
      })
      archive.directory(path.join(__dirname, `dist/${pkg.name}/`), false)
      archive.finalize().then(() => {
        logger.info(`dist/${pkg.name}.zip`)
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: `/widget/builtin/${pkg.name}/`,
  build: {
    outDir: `dist/${pkg.name}`,
  },
  plugins: [vue(), brcatWidgetVitePlugin()],
})
