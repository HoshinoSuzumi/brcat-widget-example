<script setup lang="ts">
import { useHeartRate } from '../../shared/composables/useHeartRate'

const { hr } = useHeartRate()
const imageUrl = `${import.meta.env.BASE_URL}favicon_256.ico`
</script>

<template>
  <div
    class="widget"
    data-tauri-drag-region
  >
    <img
      :src="imageUrl"
      alt="HeartBeat Cat"
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
  border-radius: 10vmin;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
  }

  div {
    position: absolute;
    font-size: 30vmin;
    font-weight: bold;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }
}
</style>
