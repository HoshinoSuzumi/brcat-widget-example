<script setup lang="ts">
import { ref } from 'vue'
import { listen } from '@tauri-apps/api/event'

const hr = ref(0)

listen('heart-rate', (event) => {
  hr.value = event.payload as number
})
</script>

<template>
  <div
    class="widget"
    data-tauri-drag-region
  >
    <img
      src="/favicon_256.ico"
      data-tauri-drag-region
    />
    <div data-tauri-drag-region>
      <span>{{ hr }}</span>
    </div>
  </div>
</template>

<style scoped>
.widget {
  width: 100%;
  height: 100%;
  /* background: #ffa1c6; */
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
  }

  div {
    position: absolute;
    font-size: 32px;
    padding-top: 4px;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font: bold;
    pointer-events: none;
  }
}
</style>
