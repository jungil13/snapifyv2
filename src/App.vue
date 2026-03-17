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
              <CameraIcon :size="30" color="#c2825a" />
            </div>
          </div>
          <p class="loader-brand">Snapify</p>
          <p class="loader-sub">warming up your cozy booth...</p>
          <div class="loader-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    </transition>

    <div v-if="!isLoading" class="main-wrapper">
      <RouterView />
      <Navbar />
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
body {
  font-family: 'Inter', sans-serif;
  background: #fdf6ee;
  color: #3d2c2c;
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
  background: linear-gradient(155deg, #fff8f0 0%, #fde8d8 55%, #f9dccf 100%);
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
  border: 3px solid rgba(194, 130, 90, 0.2);
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
  border-top-color: #c2825a;
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
  background: rgba(194, 130, 90, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-brand {
  font-family: 'DM Serif Display', serif;
  font-size: 2.2rem;
  color: #8b4513;
  letter-spacing: 2px;
}
.loader-sub {
  font-size: 0.78rem;
  color: #b07050;
}
.loader-dots {
  display: flex;
  gap: 6px;
}
.loader-dots span {
  width: 7px;
  height: 7px;
  background: #c2825a;
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
