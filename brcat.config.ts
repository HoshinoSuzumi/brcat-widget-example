interface BrcatUserConfig {
  name?: string
  homepage?: string
  icon?: string
  widget?: {
    window?: {
      defaultWidth?: number
      defaultHeight?: number
      minWidth?: number
      minHeight?: number
      resizable?: boolean
      alwaysOnTop?: boolean
      transparent?: boolean
    }
  }
  streaming?: {
    viewport?: {
      width?: number
      height?: number
    }
  }
  permissions?: string[]
  settings?: Record<string, unknown>
}

const config: BrcatUserConfig = {
  name: 'HeartBeat Cat 示例插件',
  icon: 'favicon_256.ico',
  widget: {
    window: {
      defaultWidth: 200,
      defaultHeight: 150,
      minWidth: 80,
      minHeight: 80,
      resizable: true,
      alwaysOnTop: true,
    },
  },

  // 推流插件配置（暂无此能力，留空则不会生成 streaming 入口）
  // streaming: {
  //   viewport: { width: 1920, height: 1080 },
  // },

  // 事件订阅
  permissions: [
    'heart-rate',
    'device-connected',
    'device-disconnected',
  ],

  // 自定义设置
  settings: {
    type: 'object',
    properties: {
      displayUnit: {
        type: 'string',
        enum: ['bpm', 'percentage'],
        default: 'bpm',
        title: '显示单位',
      },
    },
  },
}

export default config
