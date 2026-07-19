interface BrcatUserConfig {
  name?: string
  homepage?: string
  icon?: string
  widget?: {
    window?: {
      width?: number
      height?: number
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
      width: 100,
      height: 100,
      alwaysOnTop: true,
    },
  },

  streaming: {
    viewport: { width: 1920, height: 1080 },
  },

  permissions: [
    'heart-rate',
    'device-connected',
    'device-disconnected',
  ],

  settings: {
    type: 'object',
    properties: {
      displayUnit: {
        type: 'string',
        enum: ['bpm', 'percentage'],
        default: 'bpm',
        title: '显示单位',
      },
      maxHR: {
        type: 'number',
        minimum: 60,
        maximum: 240,
        default: 200,
        title: '最大心率',
      },
      showStatusBar: {
        type: 'boolean',
        default: true,
        title: '显示状态栏',
      },
    },
  },
}

export default config
