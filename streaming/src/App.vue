<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type Theme = 'rose' | 'cyan' | 'lime'
type Unit = 'bpm' | 'percentage'
type Sample = { time: number; value: number }

interface StreamConfig {
  displayUnit: Unit
  maxHR: number
  colorTheme: Theme
  showTrend: boolean
  showMetrics: boolean
}

const apiBase = '/p/hrcat-widget-example'
const config = ref<StreamConfig>({
  displayUnit: 'bpm', maxHR: 200, colorTheme: 'rose', showTrend: true, showMetrics: true,
})
const heartRate = ref<number | null>(null)
const samples = ref<Sample[]>([])
const sessionPeak = ref<number | null>(null)
const transportConnected = ref(false)
const hasConnected = ref(false)
const lastSampleAt = ref(0)
const now = ref(Date.now())

let eventSource: EventSource | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null
let configTimer: ReturnType<typeof setInterval> | null = null

async function loadConfig() {
  try {
    const response = await fetch(`${apiBase}/config`, { cache: 'no-store' })
    if (!response.ok) return
    const value = await response.json() as Record<string, unknown>
    config.value = {
      displayUnit: value.displayUnit === 'percentage' ? 'percentage' : 'bpm',
      maxHR: typeof value.maxHR === 'number' && Number.isFinite(value.maxHR)
        ? Math.min(255, Math.max(100, value.maxHR)) : 200,
      colorTheme: value.colorTheme === 'cyan' || value.colorTheme === 'lime'
        ? value.colorTheme : 'rose',
      showTrend: typeof value.showTrend === 'boolean' ? value.showTrend : true,
      showMetrics: typeof value.showMetrics === 'boolean' ? value.showMetrics : true,
    }
  } catch {
    // 服务暂不可用时沿用上一次配置。
  }
}

function connect() {
  eventSource = new EventSource(`${apiBase}/events`)
  eventSource.onopen = () => {
    transportConnected.value = true
    hasConnected.value = true
  }
  eventSource.addEventListener('connected', () => {
    transportConnected.value = true
    hasConnected.value = true
  })
  eventSource.addEventListener('heart-rate', (event) => {
    try {
      const payload = JSON.parse((event as MessageEvent).data) as number | { value?: number }
      const value = typeof payload === 'number' ? payload : payload?.value
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 300) return
      const time = Date.now()
      now.value = time
      heartRate.value = value
      lastSampleAt.value = time
      sessionPeak.value = Math.max(sessionPeak.value ?? 0, value)
      samples.value = [...samples.value.filter(sample => time - sample.time <= 30_000), { time, value }]
    } catch {
      // 忽略格式异常的单条事件，不中断后续数据。
    }
  })
  eventSource.onerror = () => { transportConnected.value = false }
}

const isLive = computed(() =>
  transportConnected.value && heartRate.value !== null && now.value - lastSampleAt.value < 10_000,
)
const statusText = computed(() => !transportConnected.value
  ? hasConnected.value ? '重新连接' : '连接中'
  : isLive.value ? '实时监测' : '等待数据',
)
const percentage = computed(() => heartRate.value === null
  ? 0 : Math.round(heartRate.value / config.value.maxHR * 100),
)
const displayValue = computed(() => {
  if (!isLive.value || heartRate.value === null) return '—'
  return config.value.displayUnit === 'percentage'
    ? String(percentage.value) : String(Math.round(heartRate.value))
})

const recentSamples = computed(() => samples.value.filter(sample => now.value - sample.time <= 30_000))
const average = computed(() => recentSamples.value.length
  ? Math.round(recentSamples.value.reduce((sum, sample) => sum + sample.value, 0) / recentSamples.value.length)
  : null,
)
const change = computed(() => recentSamples.value.length >= 2
  ? Math.round(recentSamples.value[recentSamples.value.length - 1].value - recentSamples.value[0].value)
  : null,
)
const trendPath = computed(() => {
  const data = recentSamples.value
  if (data.length < 2) return ''
  const values = data.map(sample => sample.value)
  const lower = Math.min(...values) - 8
  const range = Math.max(20, Math.max(...values) + 8 - lower)
  return data.map((sample, index) => {
    const x = 4 + ((sample.time - (now.value - 30_000)) / 30_000) * 232
    const y = 82 - ((sample.value - lower) / range) * 70
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
})

function onVisibilityChange() {
  if (!document.hidden) void loadConfig()
}

onMounted(() => {
  void loadConfig()
  connect()
  clockTimer = setInterval(() => {
    now.value = Date.now()
    samples.value = samples.value.filter(sample => now.value - sample.time <= 30_000)
  }, 1000)
  configTimer = setInterval(() => { void loadConfig() }, 10_000)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  eventSource?.close()
  if (clockTimer) clearInterval(clockTimer)
  if (configTimer) clearInterval(configTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div class="overlay" :data-theme="config.colorTheme">
    <main class="panel">
      <header class="topline">
        <div class="brand">
          <span class="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20.5 8.6c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10a4.6 4.6 0 0 1 8.5-2.4 4.6 4.6 0 0 1 8.5 2.4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M5.1 11.4h3l1.4-2.2 2.1 4.4 1.5-2.2h5.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span>HEARTBEAT<span class="brand-light"> CAT</span></span>
        </div>
        <div class="signal" :class="{ active: isLive }">
          <span class="signal-dot" aria-hidden="true" />{{ statusText }}
        </div>
      </header>

      <div class="content" :class="{ 'without-trend': !config.showTrend }">
        <section class="reading" aria-label="实时心率">
          <div class="eyebrow">实时心率</div>
          <div class="reading-value">
            <span class="digits">{{ displayValue }}</span>
            <span class="unit">{{ config.displayUnit === 'percentage' ? '%' : 'BPM' }}</span>
          </div>
          <div class="reading-caption">
            {{ isLive ? `${percentage}% 最大心率` : '等待心率数据' }}
          </div>
        </section>

        <section v-if="config.showTrend" class="trend" aria-label="近三十秒心率趋势">
          <div class="trend-heading">
            <span>近 30 秒</span>
            <span v-if="isLive && change !== null" class="delta">{{ change > 0 ? '+' : '' }}{{ change }} BPM</span>
          </div>
          <svg class="chart" viewBox="0 0 240 92" preserveAspectRatio="none" aria-hidden="true">
            <path class="grid-line" d="M4 24H236 M4 57H236 M4 90H236" />
            <path v-if="trendPath" class="trend-line" :d="trendPath" />
          </svg>
          <div v-if="!trendPath" class="chart-empty">采集中</div>
        </section>
      </div>

      <footer class="footer">
        <div class="intensity">
          <div class="footer-label">相对最大心率</div>
          <div class="meter"><span :style="{ width: `${isLive ? Math.min(100, percentage) : 0}%` }" /></div>
        </div>
        <div v-if="config.showMetrics" class="metrics">
          <div><span class="footer-label">30 秒均值</span><strong>{{ average ?? '—' }}</strong></div>
          <div><span class="footer-label">本次峰值</span><strong>{{ sessionPeak ?? '—' }}</strong></div>
        </div>
      </footer>
    </main>
  </div>
</template>
