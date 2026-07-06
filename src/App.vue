<script setup>
import { ref, onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { CameraIcon } from 'lucide-vue-next'

const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 1600)
})
</script>

<template>
  <div class="app-root">
    <transition name="loader-fade">
      <div v-if="isLoading" class="loader-screen">
        <div class="loader-content">
          <div class="loader-ring">
            <div class="ring-inner">
              <CameraIcon :size="30" color="#ff4d7d" />
            </div>
          </div>
          <p class="loader-brand">Snapify</p>
          <p class="loader-sub">warming up your booth...</p>
          <div class="loader-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    </transition>

    <div v-if="!isLoading" class="main-wrapper">
      <RouterView />
    </div>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body, button, a, input, select, textarea, [role="button"] {
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23ff69b4' stroke='white' stroke-width='2.5'><path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/></svg>") 12 12, auto !important;
}
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #fff0f3;
  color: #1c1c1e;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.app-root {
  min-height: 100dvh;
}
.main-wrapper {
  padding-bottom: 72px;
  min-height: 100dvh;
}

/* Loader */
.loader-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(155deg, #fff0f3 0%, #ffe3e8 55%, #ffd1dc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.loader-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255, 77, 125, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: ring-spin 1.6s linear infinite;
}
.loader-ring::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #ff4d7d;
  animation: ring-spin 1.2s ease-in-out infinite;
}
@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}
.ring-inner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 77, 125, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-brand {
  font-family: 'DM Serif Display', system-ui, serif;
  font-size: 2.2rem;
  color: #d81b60;
  letter-spacing: 2px;
}
.loader-sub {
  font-size: 0.78rem;
  color: #ff4d7d;
}
.loader-dots {
  display: flex;
  gap: 6px;
}
.loader-dots span {
  width: 7px;
  height: 7px;
  background: #ff4d7d;
  border-radius: 50%;
  animation: dot-b 1.2s ease-in-out infinite;
}
.loader-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.loader-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes dot-b {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loader-fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.loader-fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>
