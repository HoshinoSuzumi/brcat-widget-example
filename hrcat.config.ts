interface HrcatUserConfig {
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

const config: HrcatUserConfig = {
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
    viewport: { width: 260, height: 260 },
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
        minimum: 100,
        maximum: 255,
        default: 200,
        title: '最大心率',
      },
    },
  },
}

export default config
