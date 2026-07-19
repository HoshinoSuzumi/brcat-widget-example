import { createLogger, defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pkg from './package.json'
import brcatCfg from './brcat.config'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

const logger = createLogger('info', { prefix: 'brcat' })

// ── 插件 ID（使用 package.json 的 name） ──
const pluginId = pkg.name

// ── 检测哪些能力目录存在 ──
const hasWidget = fs.existsSync(path.join(__dirname, 'widget'))
const hasStreaming = fs.existsSync(path.join(__dirname, 'streaming'))

// ── 桌面组件构建配置 ──
const widgetConfig: UserConfig = {
  base: `/p/${pluginId}/widget/`,
  root: path.join(__dirname, 'widget'),
  build: {
    outDir: path.join(__dirname, 'dist', pluginId, 'widget'),
    emptyOutDir: true,
  },
  plugins: [vue()],
}

// ── 推流插件构建配置 ──
const streamingConfig: UserConfig = {
  base: `/p/${pluginId}/streaming/`,
  root: path.join(__dirname, 'streaming'),
  build: {
    outDir: path.join(__dirname, 'dist', pluginId, 'streaming'),
    emptyOutDir: true,
  },
  plugins: [vue()],
}

// ── 单入口构建（兼容旧结构：src/ → widget/） ──
const legacyConfig: UserConfig = {
  base: `/p/${pluginId}/widget/`,
  build: {
    outDir: path.join(__dirname, 'dist', pluginId, 'widget'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'index.html'),
    },
  },
  plugins: [vue()],
}

// ── 生成 hbcat-manifest.json ──
function generateManifest() {
  const manifest: Record<string, unknown> = {
    manifestVersion: 1,
    plugin: {
      id: pluginId,
      name: brcatCfg.name ?? pkg.name,
      version: pkg.version,
      description: pkg.description,
      author: pkg.author ?? null,
      homepage: brcatCfg.homepage ?? null,
      icon: brcatCfg.icon ?? 'icon.png',
    },
    permissions: brcatCfg.permissions ?? [],
    settings: brcatCfg.settings ?? null,
  }

  if (hasWidget && brcatCfg.widget) {
    manifest.widget = {
      entry: 'widget/index.html',
      window: {
        defaultWidth: brcatCfg.widget.window?.defaultWidth ?? 200,
        defaultHeight: brcatCfg.widget.window?.defaultHeight ?? 150,
        minWidth: brcatCfg.widget.window?.minWidth ?? 80,
        minHeight: brcatCfg.widget.window?.minHeight ?? 80,
        resizable: brcatCfg.widget.window?.resizable ?? true,
        alwaysOnTop: brcatCfg.widget.window?.alwaysOnTop ?? true,
        transparent: brcatCfg.widget.window?.transparent ?? true,
      },
    }
  }

  if (hasStreaming && brcatCfg.streaming) {
    manifest.streaming = {
      entry: 'streaming/index.html',
      viewport: {
        width: brcatCfg.streaming.viewport?.width ?? 1920,
        height: brcatCfg.streaming.viewport?.height ?? 1080,
      },
    }
  }

  const manifestDir = path.join(__dirname, 'dist', pluginId)
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true })
  }

  // 复制图标
  const iconFile = brcatCfg.icon ?? 'icon.png'
  const iconSrc = path.join(__dirname, 'widget', 'public', iconFile)
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(manifestDir, iconFile))
  }

  fs.writeFileSync(
    path.join(manifestDir, 'hbcat-manifest.json'),
    JSON.stringify(manifest, null, 2),
  )
  logger.info(`Generated dist/${pluginId}/hbcat-manifest.json`)
}

// ── 打包 .brcp ──
function packagePlugin() {
  const sourceDir = path.join(__dirname, 'dist', pluginId)
  const output = fs.createWriteStream(
    path.join(__dirname, 'dist', `${pluginId}.brcp`),
  )
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.pipe(output)
  archive.on('error', (err: Error) => { throw err })
  archive.directory(sourceDir, false)
  archive.finalize().then(() => {
    logger.info(`Packaged dist/${pluginId}.brcp`)
  })
}

// ── 自定义 Vite 插件：构建完成后生成 manifest 并打包 ──
// 如果同时存在 widget 和 streaming，主构建完成后触发第二个构建
function brcatPostBuildPlugin() {
  let secondBuildDone = false

  return {
    name: 'brcat-post-build',
    async writeBundle() {
      // 如果同时需要构建 streaming 且尚未构建，先触发 streaming 构建
      if (hasWidget && hasStreaming && !secondBuildDone) {
        secondBuildDone = true
        const { build: viteBuild } = await import('vite')
        logger.info('Building streaming entry...')
        await viteBuild({
          ...streamingConfig,
          configFile: false,
          logLevel: 'info',
        } as any)
      }

      generateManifest()
      packagePlugin()
    },
  }
}

// ── 根据目录结构选择主构建配置 ──
function resolveConfig(): UserConfig {
  if (hasWidget) {
    return {
      ...widgetConfig,
      plugins: [...(widgetConfig.plugins ?? []), brcatPostBuildPlugin()],
    }
  }
  if (hasStreaming) {
    return {
      ...streamingConfig,
      plugins: [...(streamingConfig.plugins ?? []), brcatPostBuildPlugin()],
    }
  }
  // 兼容旧结构
  return {
    ...legacyConfig,
    plugins: [...(legacyConfig.plugins ?? []), brcatPostBuildPlugin()],
  }
}

export default defineConfig(resolveConfig() as any)

