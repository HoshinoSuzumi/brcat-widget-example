<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const hr = ref(0)
const unit = ref('bpm')
const maxHR = ref(200)
let eventSource: EventSource | null = null

// 插件 ID（构建时 base 路径已包含，此处用相对路径）
const pluginId = 'brcat-widget-example'

// 读取插件配置
async function loadConfig() {
  try {
    const res = await fetch(`/p/${pluginId}/config`)
    if (res.ok) {
      const cfg = await res.json()
      if (cfg.displayUnit) unit.value = cfg.displayUnit as string
      if (cfg.maxHR) maxHR.value = cfg.maxHR as number
    }
  } catch {
    // 使用默认值
  }
}

// 通过 SSE 接收实时数据
function connectSSE() {
  eventSource = new EventSource(`/p/${pluginId}/events`)

  eventSource.addEventListener('heart-rate', (e) => {
    hr.value = JSON.parse(e.data).value ?? JSON.parse(e.data)
  })

  eventSource.addEventListener('connected', () => {
    console.log('[Streaming] SSE 已连接')
  })

  eventSource.onerror = () => {
    console.warn('[Streaming] SSE 连接断开，5秒后重连...')
    eventSource?.close()
    setTimeout(connectSSE, 5000)
  }
}

const displayValue = () => {
  if (unit.value === 'percentage') {
    return `${Math.round((hr.value / maxHR.value) * 100)}%`
  }
  return `${hr.value}`
}

onMounted(async () => {
  await loadConfig()
  connectSSE()
})

onUnmounted(() => {
  eventSource?.close()
})
</script>

<template>
  <div class="streaming-overlay">
    <!-- 心率数值 -->
    <div class="hr-display">
      <div class="hr-ring" :style="{ '--fill': `${Math.min((hr / maxHR) * 100, 100)}%` }">
        <div class="hr-inner">
          <span class="hr-value">{{ displayValue() }}</span>
          <span class="hr-label" v-if="unit === 'bpm'">BPM</span>
        </div>
      </div>
    </div>
    <!-- 底部状态条 -->
    <div class="status-bar">
      <div class="pulse-dot" :class="{ active: hr > 0 }" />
      <span class="status-text">{{ hr > 0 ? '实时监测中' : '等待数据...' }}</span>
    </div>
  </div>
</template>

<style scoped>
.streaming-overlay {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: transparent;
  font-family: system-ui, sans-serif;
}

.hr-display {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hr-ring {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    #22c55e 0%,
    #22c55e var(--fill),
    rgba(255, 255, 255, 0.15) var(--fill),
    rgba(255, 255, 255, 0.15) 100%
  );
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.3);
}

.hr-inner {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
}

.hr-value {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}

.hr-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.status-bar {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: background 0.3s;

  &.active {
    background: #22c55e;
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.status-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
