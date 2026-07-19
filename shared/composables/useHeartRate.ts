import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 心率数据 composable — 演示 widget 和 streaming 共享代码的模式
 *
 * 使用方式：
 *   import { useHeartRate } from '../../shared/composables/useHeartRate'
 *
 * 注意：此文件依赖 @tauri-apps/api，仅适用于 widget 环境。
 * 推流插件应使用 streaming 专用的版本。
 */

export function useHeartRate() {
  const hr = ref(0)
  let unlisten: (() => void) | null = null

  onMounted(async () => {
    try {
      const { listen } = await import('@tauri-apps/api/event')
      const unlistenFn = await listen<number>('heart-rate', (event) => {
        hr.value = event.payload
      })
      unlisten = unlistenFn
    } catch {
      console.warn('无法监听 Tauri 事件（可能在非 Tauri 环境中运行）')
    }
  })

  onUnmounted(() => {
    unlisten?.()
  })

  return { hr }
}
