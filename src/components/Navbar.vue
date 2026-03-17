<template>
  <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
    <router-link to="/" class="nav-item" exact-active-class="active" id="nav-home">
      <HomeIcon :size="22" class="nav-icon" />
      <span class="nav-lbl">Home</span>
    </router-link>
    <router-link to="/photobooth" class="nav-item" active-class="active" id="nav-booth">
      <CameraIcon :size="22" class="nav-icon" />
      <span class="nav-lbl">Booth</span>
    </router-link>
  </nav>
</template>

<script setup>
import { HomeIcon, CameraIcon, SparklesIcon, MessageCircleIcon } from 'lucide-vue-next'
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(253, 246, 238, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(194, 130, 90, 0.18);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 24px rgba(139, 69, 19, 0.07);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  text-decoration: none;
  flex: 1;
  padding: 4px 0;
  transition: transform 0.15s ease;
  position: relative;
}
.nav-item:active {
  transform: scale(0.9);
}

.nav-icon {
  color: #b8957a;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-lbl {
  font-family: 'Inter', sans-serif;
  font-size: 0.62rem;
  font-weight: 500;
  color: #b07050;
  letter-spacing: 0.3px;
  transition: color 0.2s;
}

.nav-item.active .nav-icon {
  color: #8b4513;
  transform: scale(1.18) translateY(-2px);
}
.nav-item.active .nav-lbl {
  color: #6b2e0e;
  font-weight: 700;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #c2825a;
  border-radius: 2px 2px 0 0;
}
</style>
