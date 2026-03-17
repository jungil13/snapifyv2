<template>
  <div class="home-page">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <!-- Petals — CSS only for perf -->
    <div v-for="n in 12" :key="n" class="petal" :class="`petal-${n}`"></div>

    <div class="grain-overlay"></div>

    <!-- PWA Install Banner -->
    <transition name="slide-down">
      <div v-if="showInstallBanner" class="install-banner">
        <div class="install-banner-left">
          <SmartphoneIcon :size="18" />
          <div>
            <p class="ib-title">Install Snapify</p>
            <p class="ib-sub">Add to home screen for the best experience</p>
          </div>
        </div>
        <div class="install-banner-right">
          <button class="ib-btn" @click="doInstall" id="install-btn">Install</button>
          <button class="ib-close" @click="showInstallBanner = false" aria-label="Dismiss">
            <XIcon :size="14" />
          </button>
        </div>
      </div>
    </transition>

    <div class="hero-content">
      <!-- Brand -->
      <div class="brand-block">
        <div class="brand-badge">
          <CameraIcon :size="12" />
          Free &amp; Cozy
        </div>
        <h1 class="brand-title">Snapify</h1>
        <p class="brand-sub">Your vintage photobooth, from home</p>
      </div>

      <!-- Polaroid stack -->
      <div class="polaroid-stack">
        <div class="polaroid p3">
          <img
            src="https://i.pinimg.com/736x/a2/a7/17/a2a717c69ab0f64f74ee7c11d2aa634c.jpg"
            alt="polaroid 3"
          />
          <p class="pol-label">memories</p>
        </div>
        <div class="polaroid p2">
          <img
            src="https://i.pinimg.com/736x/10/b5/8d/10b58d27a6f60915e048e65b9618728e.jpg"
            alt="polaroid 2"
          />
          <p class="pol-label">cozy vibes</p>
        </div>
        <div class="polaroid p1">
          <img
            src="https://i.pinimg.com/736x/12/20/b5/1220b562794722a481de6e359b5b8593.jpg"
            alt="polaroid 1"
          />
          <p class="pol-label">snapify</p>
        </div>
      </div>

      <!-- Feature chips -->
      <div class="feature-chips">
        <div class="feat-chip"><SlidersHorizontalIcon :size="13" /><span>Filters</span></div>
        <div class="feat-chip"><FrameIcon :size="13" /><span>Frames</span></div>
        <div class="feat-chip"><DownloadIcon :size="13" /><span>Download</span></div>
        <div class="feat-chip"><PrinterIcon :size="13" /><span>Print</span></div>
      </div>

      <!-- CTA -->
      <button @click="start" :disabled="loading" class="cta-btn" id="home-start-btn">
        <span class="cta-content">
          <Loader2Icon v-if="loading" :size="18" class="spin" />
          <CameraIcon v-else :size="18" />
          <span>{{ loading ? 'Loading...' : 'Start Booth' }}</span>
        </span>
      </button>
      <p class="cta-note">No sign-up needed · 100% Free</p>

      <!-- Footer -->
      <div class="home-footer">
        <div class="film-deco">
          <span v-for="n in 6" :key="n" class="film-hole"></span>
        </div>
        <p class="footer-txt">
          made with
          <HeartIcon :size="11" class="heart-icon" />
          by <span class="creator">𝓙𝓾𝓷 𝓖𝓲𝓵</span>
        </p>
        <p class="footer-copy">© 2025 Snapify · All rights reserved</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CameraIcon,
  SlidersHorizontalIcon,
  FrameIcon,
  DownloadIcon,
  PrinterIcon,
  HeartIcon,
  Loader2Icon,
  SmartphoneIcon,
  XIcon,
} from 'lucide-vue-next'

const router = useRouter()
const loading = ref(false)

// PWA Install
const showInstallBanner = ref(false)
let deferredPrompt = null

const doInstall = async () => {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  showInstallBanner.value = false
}

const start = () => {
  loading.value = true
  setTimeout(() => router.push('/photobooth'), 800)
}

onMounted(() => {
  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showInstallBanner.value = true
  })
})
</script>
<style scoped>
/* ── Install Banner ── */
.install-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 248, 240, 0.95);
  border: 1px solid rgba(194, 130, 90, 0.3);
  border-radius: 16px;
  padding: 10px 14px;
  box-shadow:
    0 8px 32px rgba(139, 69, 19, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(16px);
  width: calc(100% - 32px);
  max-width: 460px;
}
.install-banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7a4020;
}
.ib-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #6b2e0e;
  font-family: 'Inter', sans-serif;
}
.ib-sub {
  font-size: 0.68rem;
  color: #a07060;
  font-family: 'Inter', sans-serif;
}
.install-banner-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ib-btn {
  background: linear-gradient(135deg, #c2825a, #8b4513);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 7px 16px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 3px 10px rgba(139, 69, 19, 0.3);
  transition: all 0.12s;
}
.ib-btn:hover {
  background: linear-gradient(135deg, #d4936b, #9b5523);
  transform: translateY(-1px);
}
.ib-close {
  border: none;
  background: rgba(194, 130, 90, 0.12);
  border-radius: 8px;
  padding: 5px;
  cursor: pointer;
  color: #9a6040;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.ib-close:hover {
  background: rgba(194, 130, 90, 0.22);
}
.slide-down-enter-active {
  animation: slide-dn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-down-leave-active {
  animation: slide-dn 0.25s ease reverse;
}
@keyframes slide-dn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.home-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px 80px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(155deg, #fff8f0 0%, #fde8d8 45%, #f9dccf 100%);
}

/* blobs */
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  pointer-events: none;
}
.blob-1 {
  width: 320px;
  height: 320px;
  background: #f7c5ae;
  top: -80px;
  left: -80px;
  animation: blobf 9s ease-in-out infinite alternate;
}
.blob-2 {
  width: 240px;
  height: 240px;
  background: #fad4b4;
  bottom: 80px;
  right: -40px;
  animation: blobf 11s ease-in-out infinite alternate-reverse;
}
@keyframes blobf {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(18px, 28px);
  }
}

/* grain */
.grain-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
  background-size: 150px;
}

/* petals */
.petal {
  position: absolute;
  top: -20px;
  pointer-events: none;
  z-index: 0;
  width: 10px;
  height: 10px;
  border-radius: 50% 0 50% 0;
  background: rgba(240, 170, 180, 0.65);
  animation: petalfall 13s linear infinite;
}
@keyframes petalfall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 0.8;
  }
  100% {
    transform: translateY(110vh) rotate(380deg);
    opacity: 0;
  }
}
.petal-1 {
  left: 5%;
  animation-delay: 0s;
  animation-duration: 11s;
}
.petal-2 {
  left: 14%;
  animation-delay: 2.2s;
  animation-duration: 14s;
}
.petal-3 {
  left: 24%;
  animation-delay: 4s;
  animation-duration: 10s;
}
.petal-4 {
  left: 35%;
  animation-delay: 1s;
  animation-duration: 13s;
}
.petal-5 {
  left: 46%;
  animation-delay: 3s;
  animation-duration: 12s;
}
.petal-6 {
  left: 56%;
  animation-delay: 5s;
  animation-duration: 9s;
}
.petal-7 {
  left: 66%;
  animation-delay: 2.5s;
  animation-duration: 15s;
}
.petal-8 {
  left: 76%;
  animation-delay: 4.5s;
  animation-duration: 11s;
}
.petal-9 {
  left: 85%;
  animation-delay: 1.5s;
  animation-duration: 13s;
}
.petal-10 {
  left: 94%;
  animation-delay: 3.5s;
  animation-duration: 10s;
}
.petal-11 {
  left: 20%;
  animation-delay: 6.5s;
  animation-duration: 12s;
}
.petal-12 {
  left: 70%;
  animation-delay: 0.7s;
  animation-duration: 11s;
}

/* hero */
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

/* brand */
.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.brand-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #c2825a;
  background: rgba(194, 130, 90, 0.1);
  border: 1px solid rgba(194, 130, 90, 0.28);
  border-radius: 99px;
  padding: 4px 13px;
  font-family: 'Inter', sans-serif;
}
.brand-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(3rem, 13vw, 4.2rem);
  color: #6b2e0e;
  line-height: 1;
  letter-spacing: -1px;
  text-shadow: 0 2px 10px rgba(107, 46, 14, 0.12);
}
.brand-sub {
  font-size: 0.92rem;
  color: #9a6040;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}

/* polaroids */
.polaroid-stack {
  position: relative;
  height: 210px;
  width: 190px;
  margin: 0 auto;
}
.polaroid {
  position: absolute;
  background: #fff;
  padding: 8px 8px 30px;
  box-shadow:
    0 8px 28px rgba(139, 69, 19, 0.16),
    0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  width: 156px;
  transition: transform 0.3s ease;
}
.polaroid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}
.pol-label {
  position: absolute;
  bottom: 7px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 0.7rem;
  color: #8b6050;
}
.p1 {
  transform: rotate(-2.5deg) translate(10px, 10px);
  z-index: 3;
}
.p2 {
  transform: rotate(3deg) translate(-5px, 4px);
  z-index: 2;
}
.p3 {
  transform: rotate(-7deg) translate(-18px, -4px);
  z-index: 1;
  filter: brightness(0.92);
}
.polaroid-stack:hover .p1 {
  transform: rotate(-2deg) translate(10px, -12px) scale(1.03);
}
.polaroid-stack:hover .p2 {
  transform: rotate(4.5deg) translate(-5px, 0);
}
.polaroid-stack:hover .p3 {
  transform: rotate(-9deg) translate(-22px, 0);
}

/* chips */
.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.feat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(194, 130, 90, 0.24);
  border-radius: 99px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #8b4513;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  font-family: 'Inter', sans-serif;
}

/* CTA */
.cta-btn {
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #c2825a 0%, #8b4513 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 15px 38px;
  border-radius: 99px;
  box-shadow:
    0 6px 22px rgba(139, 69, 19, 0.32),
    0 2px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.12s,
    box-shadow 0.12s;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}
.cta-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  transform: skewX(-20deg);
  animation: shimmer 2.5s infinite;
}
@keyframes shimmer {
  0% {
    left: -75%;
  }
  100% {
    left: 125%;
  }
}
.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(139, 69, 19, 0.38);
}
.cta-btn:active {
  transform: scale(0.97);
}
.cta-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.cta-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spin {
  animation: spin-a 0.8s linear infinite;
}
@keyframes spin-a {
  to {
    transform: rotate(360deg);
  }
}
.cta-note {
  font-size: 0.7rem;
  color: #b07060;
  font-family: 'Inter', sans-serif;
  margin-top: -10px;
}

/* footer */
.home-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}
.film-deco {
  display: flex;
  gap: 8px;
}
.film-hole {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(194, 130, 90, 0.35);
  border-radius: 2px;
}
.footer-txt {
  font-size: 0.78rem;
  color: #a07060;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Inter', sans-serif;
}
.heart-icon {
  color: #c2825a;
}
.creator {
  background: rgba(194, 130, 90, 0.12);
  border-radius: 99px;
  padding: 1px 10px;
  color: #8b4513;
}
.footer-copy {
  font-size: 0.68rem;
  color: #b8927a;
  font-family: 'Inter', sans-serif;
}
</style>
