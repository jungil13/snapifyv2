<template>
  <div class="booth-root">
    <!-- ══ LEFT COL: Camera ══ -->
    <div class="col-camera">
      <!-- Steps guide -->
      <div class="steps-bar">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="step-item"
          :class="{ active: appStep >= s.n, done: appStep > s.n }"
        >
          <div class="step-bubble">
            <CheckIcon v-if="appStep > s.n" :size="10" />
            <span v-else>{{ s.n }}</span>
          </div>
          <span class="step-lbl">{{ s.label }}</span>
          <span v-if="i < steps.length - 1" class="step-line"></span>
        </div>
      </div>

      <!-- Viewfinder -->
      <div class="vf-wrap">
        <div class="vf-box" :class="[frameClass, { 'retake-focus': retakeIndex !== null }]">
          <!-- Retake Indicator -->
          <div v-if="retakeIndex !== null" class="retake-indicator">
            <RefreshCwIcon :size="14" />
            <span>Retaking Pose #{{ retakeIndex + 1 }}</span>
          </div>
          <template v-if="selectedFrame === 'floral'">
            <FlowerIcon class="fc fc-tl" :size="22" /><FlowerIcon class="fc fc-tr" :size="22" />
            <FlowerIcon class="fc fc-bl" :size="22" /><FlowerIcon class="fc fc-br" :size="22" />
          </template>
          <template v-if="selectedFrame === 'hearts'">
            <HeartIcon class="fc fc-tl" :size="18" /><HeartIcon class="fc fc-tr" :size="18" />
            <HeartIcon class="fc fc-bl" :size="18" /><HeartIcon class="fc fc-br" :size="18" />
          </template>
          <template v-if="selectedFrame === 'onepiece'">
            <AnchorIcon class="fc fc-tl op-icon" :size="18" /><SailboatIcon
              class="fc fc-tr op-icon"
              :size="18"
            />
            <SwordIcon class="fc fc-bl op-icon" :size="16" /><ZapIcon
              class="fc fc-br op-icon"
              :size="18"
            />
          </template>
          <template v-if="selectedFrame === 'vintage'">
            <div class="sprockets top-row"><span v-for="n in 7" :key="n" class="spr"></span></div>
            <div class="sprockets bot-row"><span v-for="n in 7" :key="n" class="spr"></span></div>
          </template>

          <video ref="video" autoplay playsinline muted class="vf-video" :class="filterClass" />

          <transition name="pop">
            <div v-if="countdown > 0" class="countdown-box">
              <div class="ct-ring">
                <span class="ct-num">{{ countdown }}</span>
              </div>
            </div>
          </transition>
          <div v-if="showFlash" class="vf-flash"></div>
          <div v-if="!cameraActive" class="no-cam">
            <CameraOffIcon :size="44" />
            <p>Tap <strong>Open Camera</strong> to start</p>
          </div>
        </div>

        <!-- Review Grid -->
        <!-- (Removed from here, now in Modal) -->

        <!-- Snap dots -->
        <div class="prog-dots">
          <span
            v-for="n in Number(selectedLayout)"
            :key="n"
            class="prog-dot"
            :class="{ filled: snaps.length >= n, pulsing: snaps.length === n - 1 && capturing }"
          >
          </span>
        </div>
      </div>

      <!-- Photo / Timer chips -->
      <div class="chips-panel">
        <div class="chip-group">
          <label class="chip-label"><CameraIcon :size="11" />Photos</label>
          <div class="chip-row">
            <button
              v-for="c in [2, 3, 4, 6]"
              :key="c"
              class="chip"
              :class="{ active: selectedLayout == c }"
              @click="pick('layout', c)"
            >
              {{ c }}
            </button>
          </div>
        </div>
        <div class="chip-group">
          <label class="chip-label"><TimerIcon :size="11" />Timer</label>
          <div class="chip-row">
            <button
              v-for="s in [3, 5, 10]"
              :key="s"
              class="chip"
              :class="{ active: countdownSeconds == s }"
              @click="pick('timer', s)"
            >
              {{ s }}s
            </button>
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="action-bar">
        <!-- Hidden file input for photo upload -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="doUploadPhotos"
          id="upload-input"
        />
        <button class="act-btn" @click="doStartCamera" :disabled="cameraActive" id="open-cam-btn">
          <VideoIcon :size="18" /><span>Camera</span>
        </button>
        <button
          class="shutter-btn"
          @click="doCapture"
          :disabled="capturing || (!cameraActive && !snaps.length)"
          id="shutter-btn"
        >
          <span class="sh-ring"></span>
          <div class="sh-body">
            <Aperture :size="26" v-if="!capturing" />
            <Loader2Icon :size="26" class="spin-anim" v-else />
          </div>
        </button>
        <button
          class="act-btn"
          @click="doRetake"
          :disabled="!snaps.length && !stripReady"
          id="retake-btn"
        >
          <RotateCcwIcon :size="18" /><span>Retake</span>
        </button>
      </div>

      <!-- Upload alternative -->
      <div class="upload-row">
        <span class="upload-or">or</span>
        <button class="upload-btn" @click="fileInput.click()" :disabled="capturing" id="upload-btn">
          <UploadIcon :size="15" />
          <span>Upload Photos ({{ selectedLayout }})</span>
        </button>
      </div>
    </div>

    <!-- ══ RIGHT COL: Styles + Strip ══ -->
    <div class="col-styles">
      <!-- Filters -->
      <div class="style-section">
        <h3 class="section-title"><SlidersHorizontalIcon :size="12" />Filter</h3>
        <div class="style-scroll">
          <button
            v-for="f in filters"
            :key="f.id"
            class="filter-pill"
            :class="{ active: selectedFilter === f.id }"
            @click="pick('filter', f.id)"
          >
            <span class="fw-swatch" :style="{ background: f.color }"></span>
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Frames -->
      <div class="style-section">
        <h3 class="section-title"><FrameIcon :size="12" />Frame &amp; Background</h3>
        <div class="style-scroll">
          <button
            v-for="fr in frames"
            :key="fr.id"
            class="frame-thumb"
            :class="['ft-' + fr.id, { active: selectedFrame === fr.id }]"
            @click="pick('frame', fr.id)"
          >
            <div class="ft-preview" :style="{ background: fr.bg }">
              <div class="ft-inner" :style="{ borderColor: fr.border || 'rgba(0,0,0,0.12)' }"></div>
            </div>
            <span class="ft-name">{{ fr.label }}</span>
          </button>
        </div>
      </div>

      <!-- ══ DELIVERY AREA ══ -->
      <transition name="delivery-in">
        <div v-if="developing || stripReady" class="delivery-wrap" ref="deliverySectionRef">
          <!-- Delivery sign -->
          <div class="sign-board">
            <div class="sdots"><span v-for="n in 4" :key="n"></span></div>
            <div class="sign-text">
              <p class="sign-h1">PHOTOS</p>
              <p class="sign-h2">DELIVERED HERE</p>
              <p class="sign-h3">
                IN <span class="sign-count">{{ developing ? devCountdown : 0 }}</span> SECONDS
              </p>
            </div>
            <ArrowDownIcon :size="20" />
            <div class="sdots"><span v-for="n in 4" :key="n"></span></div>
          </div>

          <!-- Film developing progress -->
          <transition name="fade-t">
            <div v-if="developing" class="dev-panel">
              <div class="dev-film-bar">
                <span v-for="n in 10" :key="n" class="dev-hole"></span>
                <div class="dev-progress" :style="{ width: devProgress + '%' }"></div>
              </div>
              <p class="dev-label">Developing your photos...</p>
            </div>
          </transition>

          <!-- Slot machine -->
          <transition name="fade-t">
            <div v-if="stripReady" class="slot-machine">
              <div class="slot-body">
                <div class="slot-rails">
                  <div class="rail l"></div>
                  <div class="rail r"></div>
                </div>
                <div class="slot-track">
                  <div class="strip-slide" :class="{ 'strip-out': stripSliding }">
                    <!-- THE ACTUAL STRIP — this is what gets captured for download/print -->
                    <div
                      class="strip-card"
                      ref="photoStripRef"
                      :class="'strip-bg-' + selectedFrame"
                      :style="stripBgStyle"
                    >
                      <!-- Frame header (One Piece banner etc) -->
                      <div v-if="selectedFrame === 'onepiece'" class="op-header">
                        <AnchorIcon :size="14" />
                        <span>ONE PIECE</span>
                        <AnchorIcon :size="14" />
                      </div>
                      <div v-if="selectedFrame === 'vintage'" class="vt-sprockets strip-spr">
                        <span v-for="n in 5" :key="n" class="vspr"></span>
                      </div>

                      <!-- Photos -->
                      <div class="photos-area">
                        <div
                          v-for="(snap, i) in snaps"
                          :key="i"
                          class="strip-photo-wrap"
                          :class="'border-' + selectedFrame"
                        >
                          <img :src="snap" class="strip-photo" :class="filterClass" />
                          <!-- One Piece overlay label -->
                          <div v-if="selectedFrame === 'onepiece'" class="op-photo-badge">
                            {{ opLabels[i % opLabels.length] }}
                          </div>
                          <!-- Floral corner overlay -->
                          <template v-if="selectedFrame === 'floral'">
                            <FlowerIcon class="sc sc-tl" :size="10" />
                            <FlowerIcon class="sc sc-tr" :size="10" />
                          </template>
                        </div>
                      </div>

                      <!-- Strip footer / watermark -->
                      <div class="strip-footer" :class="'footer-' + selectedFrame">
                        <div v-if="selectedFrame === 'onepiece'" class="op-footer">
                          <ZapIcon :size="10" />
                          <span>Snapify · {{ timestamp }}</span>
                          <SwordIcon :size="10" />
                        </div>
                        <div v-else class="default-footer">Snapify · {{ timestamp }}</div>
                      </div>

                      <!-- Bottom sprockets for vintage -->
                      <div v-if="selectedFrame === 'vintage'" class="vt-sprockets strip-spr-bot">
                        <span v-for="n in 5" :key="n" class="vspr"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <!-- Pick Up Button -->
          <transition name="pop-up">
            <div v-if="showPickup" class="pickup-cta-wrap">
              <button class="pickup-cta-btn" @click="openModal" id="pickup-btn">
                <HandIcon :size="20" />
                <span>Pick Up Your Strip!</span>
              </button>
              <p class="pickup-hint">Your photos are ready</p>
            </div>
          </transition>
        </div>
      </transition>
    </div>
  </div>

  <!-- ══ STRIP PREVIEW MODAL ══ -->
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">Your Photostrip</h2>
            <button class="modal-close" @click="closeModal" aria-label="Close">
              <XIcon :size="20" />
            </button>
          </div>

          <!-- Strip preview (large) -->
          <div class="modal-strip-wrap">
            <div class="modal-strip" :class="'strip-bg-' + selectedFrame" :style="stripBgStyle">
              <!-- One Piece header -->
              <div v-if="selectedFrame === 'onepiece'" class="op-header op-header-lg">
                <AnchorIcon :size="16" /><span>ONE PIECE</span><AnchorIcon :size="16" />
              </div>
              <!-- Vintage sprockets top -->
              <div v-if="selectedFrame === 'vintage'" class="vt-sprockets strip-spr">
                <span v-for="n in 6" :key="n" class="vspr"></span>
              </div>
              <!-- Photos -->
              <div class="modal-photos-area">
                <div
                  v-for="(snap, i) in snaps"
                  :key="i"
                  class="modal-photo-wrap"
                  :class="'border-' + selectedFrame"
                >
                  <img :src="snap" class="modal-photo" :class="filterClass" />
                  <div v-if="selectedFrame === 'onepiece'" class="op-photo-badge-lg">
                    {{ opLabels[i % opLabels.length] }}
                  </div>
                  <template v-if="selectedFrame === 'floral'">
                    <FlowerIcon class="sc sc-tl" :size="12" />
                    <FlowerIcon class="sc sc-tr" :size="12" />
                  </template>
                  <template v-if="selectedFrame === 'hearts'">
                    <HeartIcon class="sc sc-tl" :size="11" style="color: #f4a4c8" />
                    <HeartIcon class="sc sc-tr" :size="11" style="color: #f4a4c8" />
                  </template>
                </div>
              </div>
              <!-- Vintage sprockets bottom -->
              <div v-if="selectedFrame === 'vintage'" class="vt-sprockets strip-spr-bot">
                <span v-for="n in 6" :key="n" class="vspr"></span>
              </div>
              <!-- Footer watermark -->
              <div class="modal-strip-footer" :class="'footer-' + selectedFrame">
                <div v-if="selectedFrame === 'onepiece'" class="op-footer">
                  <ZapIcon :size="11" /><span>Snapify · {{ timestamp }}</span
                  ><SwordIcon :size="11" />
                </div>
                <div v-else class="default-footer">Snapify · {{ timestamp }}</div>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="modal-actions">
            <button class="ma-btn primary" @click="doDownload" id="modal-download-btn">
              <DownloadIcon :size="16" /><span>Save HD</span>
            </button>
            <button v-if="canShare" class="ma-btn" @click="doShare" id="modal-share-btn">
              <Share2Icon :size="16" /><span>Share</span>
            </button>
            <button class="ma-btn" @click="doPrint" id="modal-print-btn">
              <PrinterIcon :size="16" /><span>Print</span>
            </button>
            <button class="ma-btn danger" @click="doRetake" id="modal-new-btn">
              <RefreshCwIcon :size="16" /><span>New Session</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ══ REVIEW MODAL ══ -->
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="reviewModalOpen" class="modal-backdrop review-backdrop" @click.self="closeReviewModal">
        <div class="modal-card review-card">
          <div class="modal-header">
            <h2 class="modal-title">Review Your Session</h2>
            <button class="modal-close" @click="closeReviewModal">
              <XIcon :size="20" />
            </button>
          </div>

          <p class="review-subtitle">Click any photo to retake it</p>

          <div class="review-strip-wrap">
            <div class="review-strip" :class="'strip-bg-' + selectedFrame" :style="stripBgStyle">
              <div class="review-grid-v">
                <div
                  v-for="(snap, i) in snaps"
                  :key="i"
                  class="review-item-v"
                  :class="'border-' + selectedFrame"
                  @click="doRetakePose(i)"
                >
                  <img :src="snap" class="review-img-v" :class="filterClass" />
                  <div class="review-item-overlay">
                    <RefreshCwIcon :size="24" />
                    <span>Retake #{{ i + 1 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="ma-btn primary wide-btn" @click="doConfirmReview">
              <CheckCircleIcon :size="18" />
              <span>Confirm &amp; Develop Strip</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
// html2canvas removed — strip is generated via pure Canvas 2D API
import {
  CheckIcon,
  CameraIcon,
  CameraOffIcon,
  VideoIcon,
  TimerIcon,
  SlidersHorizontalIcon,
  FrameIcon,
  FlowerIcon,
  HeartIcon,
  Aperture,
  Loader2Icon,
  RotateCcwIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  PrinterIcon,
  Share2Icon,
  RefreshCwIcon,
  AnchorIcon,
  ZapIcon,
  SwordIcon,
  HandIcon,
  XIcon,
  UploadIcon,
  CheckCircleIcon,
} from 'lucide-vue-next'

// ── A "SailboatIcon" polyfill (not in all lucide versions) ──
const SailboatIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4z"/><path d="M21 14 12 2 3 14h18z"/><path d="M12 2v16"/></svg>`,
}

// ── State ──────────────────────────────────────────────────
const modalOpen = ref(false)

const openModal = () => {
  playClick()
  modalOpen.value = true
  // Prevent body scroll while modal open
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  modalOpen.value = false
  document.body.style.overflow = ''
}

// ── State ──
const video = ref(null)
const photoStripRef = ref(null)
const deliverySectionRef = ref(null)
const fileInput = ref(null) // hidden file input for uploads
const snaps = ref([])
const stream = ref(null)
const countdown = ref(0)
const capturing = ref(false)
const showFlash = ref(false)
const cameraActive = ref(false)
const developing = ref(false)
const devProgress = ref(0)
const devCountdown = ref(5)
const stripReady = ref(false)
const stripSliding = ref(false)
const showPickup = ref(false)
const appStep = ref(1)
const reviewModalOpen = ref(false)
const retakeIndex = ref(null)
const timestamp = ref(
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
)

const selectedLayout = ref(4)
const countdownSeconds = ref(3)
const selectedFilter = ref('none')
const selectedFrame = ref('classic')

// ── Step labels ────────────────────────────────────────────
const steps = [
  { n: 1, label: 'Camera' },
  { n: 2, label: 'Style' },
  { n: 3, label: 'Snap!' },
  { n: 4, label: 'Collect' },
]

// ── One Piece photo labels ──────────────────────────────────
const opLabels = ['NAKAMA', 'GOMU GOMU', 'YOHOHO!', 'ZORO LOST', 'NAMI BERI']

// ── Filters ────────────────────────────────────────────────
const filters = [
  { id: 'none', label: 'Color', color: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' },
  { id: 'bw', label: 'B&W', color: 'linear-gradient(135deg,#111 50%,#eee 50%)' },
  { id: 'sepia', label: 'Sepia', color: '#c9a478' },
  { id: 'faded', label: 'Faded', color: 'linear-gradient(135deg,#d8d2c8,#b0a898)' },
  { id: 'cartoon', label: 'Cartoon', color: 'linear-gradient(135deg,#f66 50%,#fd0 50%)' },
  { id: 'warm', label: 'Warm', color: 'linear-gradient(135deg,#ffb347,#f08050)' },
]

// ── Frames — each has id, label, bg (strip background), border color ──
const frames = [
  { id: 'classic', label: 'Classic', bg: '#ffffff', border: '#e8e0d8' },
  { id: 'vintage', label: 'Film', bg: '#1a1210', border: '#554030' },
  { id: 'floral', label: 'Floral', bg: '#fde8f2', border: '#f4b8cc' },
  { id: 'pastel', label: 'Pastel', bg: '#e8f4fc', border: '#bcd8ef' },
  { id: 'minimal', label: 'Minimal', bg: '#fafafa', border: '#222222' },
  { id: 'hearts', label: 'Hearts', bg: '#fce4f0', border: '#f4a4c8' },
  { id: 'onepiece', label: 'One Piece', bg: '#1a3a6e', border: '#e8a020' },
]

// Computed strip background style (for the strip card)
const stripBgStyle = computed(() => {
  const fr = frames.find((f) => f.id === selectedFrame.value)
  return { background: fr ? fr.bg : '#ffffff' }
})

const filterClass = computed(
  () =>
    ({
      none: '',
      bw: 'f-bw',
      sepia: 'f-sepia',
      faded: 'f-faded',
      cartoon: 'f-cartoon',
      warm: 'f-warm',
    })[selectedFilter.value] || '',
)

const frameClass = computed(() => `fr-${selectedFrame.value}`)
const canShare = computed(() => !!navigator.share)

// ── Audio ──────────────────────────────────────────────────
let audioCtx = null
const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}
const playTone = (f, d, v = 0.1) => {
  try {
    const ctx = getCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.frequency.setValueAtTime(f, ctx.currentTime)
    g.gain.setValueAtTime(v, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d)
    o.start()
    o.stop(ctx.currentTime + d)
  } catch (_) {}
}
const playClick = () => playTone(680, 0.07, 0.1)
const playSelect = () => playTone(880, 0.06, 0.08)
const playShutter = () => {
  try {
    const a = new Audio('/shutter.mp3')
    a.volume = 0.85
    a.play()
  } catch (_) {
    playTone(180, 0.2, 0.15)
  }
}

// ── Picker ─────────────────────────────────────────────────
const pick = (type, val) => {
  playSelect()
  if (type === 'layout') {
    selectedLayout.value = val
    appStep.value = Math.max(appStep.value, 2)
  }
  if (type === 'timer') {
    countdownSeconds.value = val
  }
  if (type === 'filter') {
    selectedFilter.value = val
    appStep.value = Math.max(appStep.value, 2)
  }
  if (type === 'frame') {
    selectedFrame.value = val
    appStep.value = Math.max(appStep.value, 2)
  }
}

// ── Camera ─────────────────────────────────────────────────
const doStartCamera = async () => {
  playClick()
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 960 },
        aspectRatio: { ideal: 4 / 3 },
      },
      audio: false,
    })
    video.value.srcObject = stream.value
    cameraActive.value = true
    appStep.value = 2
  } catch (e) {
    alert('Camera access denied:\n' + e.message)
  }
}

// ── Upload photos (alternative to camera) ──────────────────
const doUploadPhotos = async (e) => {
  const files = Array.from(e.target.files || []).slice(0, Number(selectedLayout.value))
  if (!files.length) return
  playClick()

  const fmap = {
    none: '',
    bw: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    faded: 'contrast(80%) brightness(1.1) saturate(60%)',
    cartoon: 'contrast(165%) saturate(195%)',
    warm: 'sepia(38%) saturate(145%) brightness(1.05)',
  }
  const filterStr = fmap[selectedFilter.value] || ''

  // Read each file → draw onto 4:3 canvas with filter
  const results = []
  for (const file of files) {
    await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          const W = 1280,
            H = 960
          const c = document.createElement('canvas')
          c.width = W
          c.height = H
          const ctx = c.getContext('2d')
          if (filterStr) ctx.filter = filterStr
          // Cover-fit: centre-crop to 4:3
          const srcRatio = img.naturalWidth / img.naturalHeight
          const dstRatio = W / H
          let sw, sh, sx, sy
          if (srcRatio > dstRatio) {
            sh = img.naturalHeight
            sw = sh * dstRatio
            sx = (img.naturalWidth - sw) / 2
            sy = 0
          } else {
            sw = img.naturalWidth
            sh = sw / dstRatio
            sx = 0
            sy = (img.naturalHeight - sh) / 2
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
          results.push(c.toDataURL('image/jpeg', 0.92))
          resolve()
        }
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Reset file input so same files can be re-selected
  if (fileInput.value) fileInput.value.value = ''

  // Pad with last image if fewer files than layout
  while (results.length < Number(selectedLayout.value)) results.push(results[results.length - 1])

  snaps.value = results
  appStep.value = 4

  // Trigger delivery flow
  stripReady.value = false
  stripSliding.value = false
  showPickup.value = false
  developing.value = false
  devProgress.value = 0
  devCountdown.value = 5

  await nextTick()
  developing.value = true
  await nextTick()
  deliverySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  const DEVELOP_MS = 5000
  const t0 = Date.now()
  await new Promise((resolve) => {
    const tick = () => {
      const el = Date.now() - t0
      devProgress.value = Math.min((el / DEVELOP_MS) * 100, 100)
      devCountdown.value = Math.max(0, Math.ceil((DEVELOP_MS - el) / 1000))
      if (el < DEVELOP_MS) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
  developing.value = false

  stripReady.value = true
  await nextTick()
  await new Promise((r) => setTimeout(r, 200))
  stripSliding.value = true
  await new Promise((r) => setTimeout(r, 4200))
  showPickup.value = true
  await nextTick()
  deliverySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

const openReviewModal = () => {
  playClick()
  reviewModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeReviewModal = () => {
  reviewModalOpen.value = false
  document.body.style.overflow = ''
}

const doRetakePose = (idx) => {
  playClick()
  retakeIndex.value = idx
  closeReviewModal()
  // Scroll back to camera
  window.scrollTo({ top: 0, behavior: 'smooth' })
}


// ── Capture ────────────────────────────────────────────────
const flashEffect = () => {
  showFlash.value = true
  setTimeout(() => (showFlash.value = false), 140)
}

const captureSnap = () => {
  const v = video.value
  if (!v?.videoWidth) return
  const c = document.createElement('canvas')
  c.width = v.videoWidth
  c.height = v.videoHeight
  const ctx = c.getContext('2d')

  const fmap = {
    none: '',
    bw: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    faded: 'contrast(80%) brightness(1.1) saturate(60%)',
    cartoon: 'contrast(165%) saturate(195%)',
    warm: 'sepia(38%) saturate(145%) brightness(1.05)',
  }
  ctx.filter = fmap[selectedFilter.value] || ''

  // The video preview is CSS-mirrored (scaleX(-1)) for a natural selfie feel.
  // Flip the canvas horizontally so the saved image is NOT mirrored.
  ctx.translate(c.width, 0)
  ctx.scale(-1, 1)

  ctx.drawImage(v, 0, 0)
  snaps.value.push(c.toDataURL('image/jpeg', 0.92))
  flashEffect()
  playShutter()
}

const runCountdown = () =>
  new Promise((resolve) => {
    countdown.value = Number(countdownSeconds.value)
    const iv = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(iv)
        resolve()
      }
    }, 1000)
  })

// ── MAIN CAPTURE FLOW ──────────────────────────────────────
const doCapture = async () => {
  playClick()
  
  if (retakeIndex.value !== null) {
    // SINGLE SHOT RETAKE MODE
    capturing.value = true
    await runCountdown()
    
    const v = video.value
    if (v?.videoWidth) {
      const c = document.createElement('canvas')
      c.width = v.videoWidth
      c.height = v.videoHeight
      const ctx = c.getContext('2d')
      const fmap = {
        none: '',
        bw: 'grayscale(100%)',
        sepia: 'sepia(100%)',
        faded: 'contrast(80%) brightness(1.1) saturate(60%)',
        cartoon: 'contrast(165%) saturate(195%)',
        warm: 'sepia(38%) saturate(145%) brightness(1.05)',
      }
      ctx.filter = fmap[selectedFilter.value] || ''
      ctx.translate(c.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(v, 0, 0)
      
      snaps.value[retakeIndex.value] = c.toDataURL('image/jpeg', 0.92)
      flashEffect()
      playShutter()
    }
    
    capturing.value = false
    retakeIndex.value = null
    openReviewModal()
    return
  }

  // NORMAL FULL SESSION MODE
  capturing.value = true
  snaps.value = []
  stripReady.value = false
  stripSliding.value = false
  showPickup.value = false
  developing.value = false
  devProgress.value = 0
  devCountdown.value = 5
  appStep.value = 3

  for (let i = 0; i < Number(selectedLayout.value); i++) {
    await runCountdown()
    captureSnap()
    if (i < Number(selectedLayout.value) - 1) await new Promise((r) => setTimeout(r, 400))
  }
  capturing.value = false
  appStep.value = 4
  openReviewModal()
}

const doConfirmReview = async () => {
  playClick()
  closeReviewModal()
  
  // Trigger delivery flow
  developing.value = true
  await nextTick()
  deliverySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  // 5-second developing animation (rAF-based, no lag)
  const DEVELOP_MS = 5000
  const t0 = Date.now()
  await new Promise((resolve) => {
    const tick = () => {
      const elapsed = Date.now() - t0
      devProgress.value = Math.min((elapsed / DEVELOP_MS) * 100, 100)
      devCountdown.value = Math.max(0, Math.ceil((DEVELOP_MS - elapsed) / 1000))
      if (elapsed < DEVELOP_MS) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
  developing.value = false

  // Show slot → wait one frame → start slide
  stripReady.value = true
  await nextTick()
  await new Promise((r) => setTimeout(r, 200))
  stripSliding.value = true

  // 4.2s slow slide → show pickup
  await new Promise((r) => setTimeout(r, 4200))
  showPickup.value = true
  await nextTick()
  deliverySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

const doRetake = () => {
  playClick()
  closeModal() // close modal if open
  snaps.value = []
  stripReady.value = false
  stripSliding.value = false
  showPickup.value = false
  reviewModalOpen.value = false
  retakeIndex.value = null

  developing.value = false
  devProgress.value = 0
  devCountdown.value = 5
  appStep.value = cameraActive.value ? 2 : 1
}

// ── Pure Canvas 2D Strip Generator (no external libs) ──────
const FRAME_BG = {
  classic: '#ffffff',
  vintage: '#1a1210',
  floral: '#fde8f2',
  pastel: '#e8f4fc',
  minimal: '#fafafa',
  hearts: '#ffccd5',
  onepiece: '#1a3a6e',
}
const FILTER_CSS = {
  none: '',
  bw: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  faded: 'contrast(80%) brightness(110%) saturate(60%)',
  cartoon: 'contrast(165%) saturate(195%)',
  warm: 'sepia(38%) saturate(145%) brightness(105%)',
}

// Draw a heart centred at (cx,cy) fitting in w×h
function heartClip(ctx, cx, cy, w, h) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + h * 0.35)
  ctx.bezierCurveTo(cx - w * 0.5, cy + h * 0.1, cx - w * 0.52, cy - h * 0.28, cx, cy - h * 0.05)
  ctx.bezierCurveTo(cx + w * 0.52, cy - h * 0.28, cx + w * 0.5, cy + h * 0.1, cx, cy + h * 0.35)
  ctx.closePath()
}

// Draw love doodles (decorative scatter) on a hearts strip
function drawDoodles(ctx, sw, sh) {
  ctx.save()
  ctx.strokeStyle = 'rgba(180,60,90,0.45)'
  ctx.fillStyle = 'rgba(220,80,110,0.35)'
  ctx.lineWidth = 2

  const doodles = [
    { x: sw * 0.12, y: sh * 0.08, s: 10 },
    { x: sw * 0.82, y: sh * 0.12, s: 8 },
    { x: sw * 0.08, y: sh * 0.35, s: 7 },
    { x: sw * 0.88, y: sh * 0.42, s: 9 },
    { x: sw * 0.15, y: sh * 0.62, s: 8 },
    { x: sw * 0.8, y: sh * 0.68, s: 7 },
    { x: sw * 0.1, y: sh * 0.88, s: 10 },
    { x: sw * 0.85, y: sh * 0.92, s: 8 },
  ]
  doodles.forEach(({ x, y, s }) => {
    heartClip(ctx, x, y, s * 1.8, s * 1.6)
    ctx.fill()
  })

  // small stars
  ctx.fillStyle = 'rgba(200,70,100,0.3)'
  const stars = [
    { x: sw * 0.72, y: sh * 0.28 },
    { x: sw * 0.2, y: sh * 0.75 },
  ]
  stars.forEach(({ x, y }) => {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
      const r = i % 2 === 0 ? 6 : 3
      if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
      else ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a))
    }
    ctx.closePath()
    ctx.fill()
  })
  ctx.restore()
}

// Sprocket holes for vintage strip
function drawSprockets(ctx, sw, y, count) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  const gap = sw / (count + 1)
  for (let i = 1; i <= count; i++) {
    ctx.beginPath()
    const rx = gap * i
    const ry = y
    ctx.roundRect(rx - 7, ry - 5, 14, 10, 3)
    ctx.fill()
  }
  ctx.restore()
}

// Load an image from a dataUrl and apply a CSS filter string via offscreen canvas
function loadFiltered(src, filter) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (!filter) {
        resolve(img)
        return
      }
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const c2 = c.getContext('2d')
      c2.filter = filter
      c2.drawImage(img, 0, 0)
      const img2 = new Image()
      img2.onload = () => resolve(img2)
      img2.src = c.toDataURL()
    }
    img.src = src
  })
}

const generateStripCanvas = async (scale = 3) => {
  const frame = selectedFrame.value
  const filter = FILTER_CSS[selectedFilter.value] || ''
  const photos = snaps.value

  // Strip dimensions (logical pixels, ×scale for HQ)
  const PW = 240 // photo width
  const PH = Math.round((PW * 3) / 4) // 4:3
  const PAD = 10 // padding around photos & between
  const SPRH = frame === 'vintage' ? 18 : 0
  const HDR = frame === 'onepiece' ? 28 : 0
  const SW = PW + PAD * 2
  const SH = HDR + SPRH + (PH + PAD) * photos.length + PAD + SPRH + 20

  const c = document.createElement('canvas')
  c.width = SW * scale
  c.height = SH * scale
  const ctx = c.getContext('2d')
  ctx.scale(scale, scale)

  // 1. Background
  ctx.fillStyle = FRAME_BG[frame] || '#fff'
  ctx.fillRect(0, 0, SW, SH)

  // 2. Decorative doodles (hearts frame)
  if (frame === 'hearts') drawDoodles(ctx, SW, SH)

  // 3. Vintage sprocket top
  if (frame === 'vintage') drawSprockets(ctx, SW, SPRH / 2, 7)

  // 4. One Piece header
  if (frame === 'onepiece') {
    ctx.fillStyle = '#e8a020'
    ctx.font = `bold ${10}px "DM Serif Display", serif`
    ctx.textAlign = 'center'
    ctx.fillText('⚓ ONE PIECE ⚓', SW / 2, HDR / 1.5)
    ctx.fillStyle = '#e8a020'
    ctx.fillRect(PAD, HDR - 3, SW - PAD * 2, 1.5)
  }

  // 5. Load all images
  const imgs = await Promise.all(photos.map((src) => loadFiltered(src, filter)))

  // 6. Draw each photo
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i]
    const y = HDR + SPRH + PAD + i * (PH + PAD)
    const cx = SW / 2
    const cy = y + PH / 2

    ctx.save()
    if (frame === 'hearts') {
      // Heart-shaped clip
      heartClip(ctx, cx, cy, PW * 0.9, PH * 1.05)
      ctx.clip()
    } else if (frame === 'floral') {
      // Rounded square clip
      ctx.beginPath()
      ctx.roundRect(PAD, y, PW, PH, 16)
      ctx.clip()
    } else if (frame === 'pastel') {
      ctx.beginPath()
      ctx.roundRect(PAD, y, PW, PH, 12)
      ctx.clip()
    }
    ctx.drawImage(img, PAD, y, PW, PH)
    ctx.restore()

    // Photo border
    const borderColors = {
      classic: '#e0d8d0',
      vintage: '#554030',
      floral: '#f4b8cc',
      pastel: '#bcd8ef',
      minimal: '#222',
      hearts: '#c0405a',
      onepiece: '#e8a020',
    }
    if (frame === 'hearts') {
      ctx.save()
      ctx.strokeStyle = borderColors.hearts
      ctx.lineWidth = 3
      heartClip(ctx, cx, cy, PW * 0.9, PH * 1.05)
      ctx.stroke()
      ctx.restore()
    } else {
      ctx.strokeStyle = borderColors[frame] || '#e0d8d0'
      ctx.lineWidth = frame === 'minimal' ? 2.5 : 1.5
      ctx.strokeRect(PAD + 0.75, y + 0.75, PW - 1.5, PH - 1.5)
    }
  }

  // 7. Vintage sprocket bottom
  if (frame === 'vintage') drawSprockets(ctx, SW, SH - SPRH / 2, 7)

  // 8. Watermark
  const wmDark = frame === 'vintage' || frame === 'onepiece'
  ctx.fillStyle = wmDark ? 'rgba(255,255,255,0.4)' : 'rgba(90,50,30,0.45)'
  ctx.font = `italic ${7}px "Playfair Display", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText(`Snapify · ${timestamp.value}`, SW / 2, SH - 6)

  return c
}

const doDownload = async () => {
  playClick()
  try {
    const canvas = await generateStripCanvas(3)
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Could not generate image.')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `snapify_strip_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 3000)
    }, 'image/png')
  } catch (e) {
    console.error(e)
    alert('Download failed — try again.')
  }
}

const doShare = async () => {
  playClick()
  try {
    const canvas = await generateStripCanvas(3)
    canvas.toBlob(async (blob) => {
      if (!blob) {
        doDownload()
        return
      }
      const file = new File([blob], 'snapify_strip.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ title: 'My Snapify Strip', files: [file] })
      else doDownload()
    }, 'image/png')
  } catch (e) {
    if (e.name !== 'AbortError') console.error(e)
  }
}

const doPrint = async () => {
  playClick()
  try {
    const canvas = await generateStripCanvas(3)
    const dataUrl = canvas.toDataURL('image/png')
    // Aspect ratio of the strip to size it on the page
    const aspect = canvas.height / canvas.width
    const win = window.open('', '_blank')
    if (!win) {
      alert('Allow pop-ups to print.')
      return
    }
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Snapify Strip</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@1&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{width:100%;height:100%;background:#fff}
        .page{
          width:100vw;height:100vh;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:12px;
        }
        .strip{
          width:200px;
          height:${Math.round(200 * aspect)}px;
          object-fit:contain;
          box-shadow:0 4px 24px rgba(0,0,0,0.18);
        }
        .wm{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:11px;color:#a07060}
        @media print{
          .page{padding:0}
          .strip{box-shadow:none;width:170px;height:${Math.round(170 * aspect)}px}
        }
      </style></head><body>
      <div class="page">
        <img class="strip" src="${dataUrl}" />
        <p class="wm">Snapify · ${timestamp.value}</p>
      </div>
    </body></html>`)
    win.document.close()
    win.onload = () => {
      setTimeout(() => win.print(), 400)
    }
  } catch (e) {
    console.error(e)
    alert('Print failed.')
  }
}

const shareFb = () => {
  playClick()
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`,
    '_blank',
  )
}

onBeforeUnmount(() => {
  stream.value?.getTracks().forEach((t) => t.stop())
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})
</script>

<style scoped>
/* ════════════════════════════════════════
   ROOT LAYOUT — mobile stack, desktop 2-col
════════════════════════════════════════ */
.booth-root {
  min-height: 100dvh;
  background: linear-gradient(155deg, #fff8f0 0%, #fde8d8 55%, #f9dccf 100%);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px 14px 88px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 768px) {
  .booth-root {
    flex-direction: row;
    align-items: flex-start;
    padding: 28px 32px 44px;
    gap: 24px;
  }
}

/* Columns */
.col-camera {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1 1 auto;
  min-width: 0;
}
.col-styles {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}
@media (min-width: 768px) {
  .col-styles {
    width: 340px;
    flex-shrink: 0;
  }
}
@media (min-width: 1024px) {
  .col-styles {
    width: 380px;
  }
}

/* ════════════════════════════════════════
   STEPS BAR
════════════════════════════════════════ */
.steps-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(194, 130, 90, 0.16);
  border-radius: 14px;
  padding: 9px 14px;
  backdrop-filter: blur(10px);
  gap: 0;
}
.step-item {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.3;
  transition: opacity 0.3s;
  flex: 1;
  min-width: 0;
}
.step-item.active {
  opacity: 1;
}
.step-bubble {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #c2825a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 800;
  color: #8b4513;
  background: #fff;
  transition: all 0.3s;
  font-family: 'Inter', sans-serif;
}
.step-item.active .step-bubble {
  background: #c2825a;
  color: #fff;
}
.step-item.done .step-bubble {
  background: #5a9e52;
  color: #fff;
  border-color: #5a9e52;
}
.step-lbl {
  font-size: 0.6rem;
  font-weight: 700;
  color: #8b4513;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}
.step-line {
  flex: 1;
  height: 1.5px;
  background: rgba(194, 130, 90, 0.28);
  min-width: 10px;
}

/* ════════════════════════════════════════
   VIEWFINDER
════════════════════════════════════════ */
.vf-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.vf-box {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 14px;
  overflow: hidden;
  background: #0e0a06;
  box-shadow:
    0 8px 30px rgba(139, 69, 19, 0.22),
    0 2px 8px rgba(0, 0, 0, 0.14);
  contain: layout style;
}
/* Frame borders on viewfinder */
.fr-classic {
  border: 8px solid #fff;
}
.fr-vintage {
  border: 5px solid #1d0f05;
  border-radius: 3px;
}
.fr-floral {
  border: 8px solid #f4b8cc;
  border-radius: 20px;
}
.fr-pastel {
  border: 8px solid #bcd8ef;
  border-radius: 20px;
}
.fr-minimal {
  border: 2px solid #222;
  border-radius: 0;
}
.fr-hearts {
  border: 8px solid #f4a4c8;
  border-radius: 22px;
}
.fr-onepiece {
  border: 5px solid #e8a020;
  border-radius: 6px;
}

.vf-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* Mirror the front camera so it feels like a natural selfie */
  transform: scaleX(-1);
}

/* CSS filters - GPU only, no reflow */
.f-bw {
  filter: grayscale(100%);
}
.f-sepia {
  filter: sepia(100%);
}
.f-faded {
  filter: contrast(80%) brightness(1.1) saturate(60%);
}
.f-cartoon {
  filter: contrast(165%) saturate(195%);
}
.f-warm {
  filter: sepia(38%) saturate(145%) brightness(1.05);
}

/* Frame corners */
.fc {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}
.fc-tl {
  top: 6px;
  left: 6px;
}
.fc-tr {
  top: 6px;
  right: 6px;
}
.fc-bl {
  bottom: 6px;
  left: 6px;
}
.fc-br {
  bottom: 6px;
  right: 6px;
}
.fc.op-icon {
  color: #e8a020;
}
.fc:not(.op-icon) {
  color: #e888aa;
}

/* Sprockets */
.sprockets {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 3px 5px;
  z-index: 10;
  pointer-events: none;
}
.top-row {
  top: 0;
}
.bot-row {
  bottom: 0;
}
.spr {
  width: 14px;
  height: 9px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  flex-shrink: 0;
}

/* Countdown */
.countdown-box {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 20;
}
.ct-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ct-num {
  font-family: 'DM Serif Display', serif;
  font-size: 4.5rem;
  color: #fff;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  line-height: 1;
}
.pop-enter-active,
.pop-leave-active {
  transition: all 0.18s ease;
}
.pop-enter-from,
.pop-leave-to {
  transform: scale(0.4);
  opacity: 0;
}

.vf-flash {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: #fff;
  animation: flash-a 0.16s ease-out forwards;
}
@keyframes flash-a {
  0% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
  }
}

.no-cam {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.45);
  gap: 10px;
  font-size: 0.82rem;
  font-family: 'Inter', sans-serif;
  text-align: center;
  padding: 20px;
}
.no-cam strong {
  color: rgba(255, 255, 255, 0.72);
}

/* Review Area */
.review-area {
  position: absolute;
  inset: 0;
  background: rgba(255, 248, 240, 0.98);
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 15px;
  overflow-y: auto;
}
.review-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.4rem;
  color: #8b4513;
  margin-bottom: 5px;
}
.review-grid {
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 440px;
}
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(2, 1fr); }
.grid-6 { grid-template-columns: repeat(3, 1fr); }

.review-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
  border: 2px solid #fff;
  cursor: pointer;
  transition: all 0.3s;
}
.review-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(139, 69, 19, 0.25);
  border-color: #c2825a;
}
.review-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s;
}
.review-item:hover .review-img {
  filter: brightness(0.7) blur(1px);
}
.review-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(139, 69, 19, 0.4);
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}
.review-overlay span {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.review-item:hover .review-overlay {
  opacity: 1;
}
@keyframes rot-once {
  to { transform: rotate(360deg); }
}
.review-item:hover .review-overlay svg {
  animation: rot-once 0.6s ease-in-out;
}

.confirm-btn {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 99px;
  border: none;
  background: linear-gradient(135deg, #5a9e52, #3d7a36);
  color: #fff;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(90, 158, 82, 0.3);
  transition: all 0.2s;
}
.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(90, 158, 82, 0.4);
}
.confirm-btn:active {
  transform: scale(0.95);
}


/* Prog dots */
.prog-dots {
  display: flex;
  gap: 8px;
}
.prog-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #c2825a;
  background: transparent;
  transition: all 0.3s;
}
.prog-dot.filled {
  background: #c2825a;
  transform: scale(1.3);
}
.prog-dot.pulsing {
  animation: dot-p 0.75s ease-in-out infinite;
}
@keyframes dot-p {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.45);
  }
}

/* ════════════════════════════════════════
   CHIPS PANEL
════════════════════════════════════════ */
.chips-panel {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(194, 130, 90, 0.14);
  border-radius: 14px;
  padding: 12px 14px;
  backdrop-filter: blur(8px);
}
.chip-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
  min-width: 100px;
}
.chip-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: #9a6040;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Inter', sans-serif;
}
.chip-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.chip {
  padding: 5px 12px;
  border-radius: 99px;
  border: 1.5px solid rgba(194, 130, 90, 0.26);
  background: rgba(255, 255, 255, 0.75);
  font-size: 0.75rem;
  font-weight: 600;
  color: #8b4513;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
}
.chip:hover {
  background: rgba(194, 130, 90, 0.12);
}
.chip.active {
  background: linear-gradient(135deg, #c2825a, #8b4513);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.28);
}

/* ════════════════════════════════════════
   ACTION BAR
════════════════════════════════════════ */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.act-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border: 1.5px solid rgba(194, 130, 90, 0.26);
  background: rgba(255, 255, 255, 0.75);
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  color: #7a4020;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.06);
  min-width: 72px;
}
.act-btn span {
  font-size: 0.6rem;
  font-weight: 600;
  margin-top: 2px;
}
.act-btn:hover {
  background: rgba(194, 130, 90, 0.12);
  transform: translateY(-1px);
}
.act-btn:active {
  transform: scale(0.94);
}
.act-btn:disabled {
  opacity: 0.33;
  cursor: not-allowed;
  transform: none;
}

.shutter-btn {
  position: relative;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.12s;
  flex-shrink: 0;
}
.shutter-btn:active:not(:disabled) {
  transform: scale(0.87);
}
.shutter-btn:disabled {
  opacity: 0.33;
  cursor: not-allowed;
}
.sh-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid #c2825a;
  animation: sh-p 2.2s ease-in-out infinite;
}
@keyframes sh-p {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(194, 130, 90, 0.45);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(194, 130, 90, 0);
  }
}

.retake-focus {
  border: 4px solid #c2825a !important;
  box-shadow: 0 0 0 6px rgba(194, 130, 90, 0.25);
}

.retake-indicator {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: #c2825a;
  color: #fff;
  padding: 4px 12px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

.review-card {
  max-width: 440px;
  padding: 24px 24px 30px;
}
.review-subtitle {
  text-align: center;
  font-size: 0.85rem;
  color: #a07060;
  font-style: italic;
  margin: -5px 0 15px;
}
.review-strip-wrap {
  display: flex;
  justify-content: center;
  padding: 15px 0;
  max-height: 55vh;
  overflow-y: auto;
  background: rgba(0,0,0,0.03);
  border-radius: 16px;
  margin-bottom: 20px;
}
.review-strip {
  width: 200px;
  padding: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  border-radius: 4px;
}
.review-grid-v {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.review-item-v {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.review-item-v:hover {
  transform: scale(1.05) rotate(1deg);
  z-index: 5;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}
.review-img-v {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}
.review-item-overlay {
  position: absolute;
  inset: 0;
  background: rgba(139, 69, 19, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s;
  backdrop-filter: blur(2px);
}
.review-item-v:hover .review-item-overlay {
  opacity: 1;
}
.review-item-overlay span {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.wide-btn {
  width: 100%;
  padding: 16px !important;
  font-size: 0.9rem !important;
  margin-top: 10px;
  background: linear-gradient(135deg, #5a9e52 0%, #3d7a36 100%) !important;
  box-shadow: 0 6px 20px rgba(90, 158, 82, 0.3) !important;
}
.wide-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 10px 25px rgba(90, 158, 82, 0.45) !important;
}
.sh-body {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: linear-gradient(145deg, #c2825a, #8b4513);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow:
    0 4px 18px rgba(139, 69, 19, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: background 0.15s;
}
.shutter-btn:not(:disabled):hover .sh-body {
  background: linear-gradient(145deg, #d4936b, #9b5523);
}
.spin-anim {
  animation: spin-a 0.85s linear infinite;
}
@keyframes spin-a {
  to {
    transform: rotate(360deg);
  }
}

/* ════════════════════════════════════════
   STYLE SECTIONS
════════════════════════════════════════ */
.style-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-title {
  font-size: 0.62rem;
  font-weight: 700;
  color: #9a6040;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Inter', sans-serif;
}
.style-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  /* no overflow clipping — everything wraps and stays visible */
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 99px;
  flex-shrink: 0;
  border: 1.5px solid rgba(194, 130, 90, 0.24);
  background: rgba(255, 255, 255, 0.72);
  font-size: 0.77rem;
  font-weight: 500;
  color: #7a4020;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
}
.filter-pill:hover {
  background: rgba(194, 130, 90, 0.1);
}
.filter-pill.active {
  background: linear-gradient(135deg, #c2825a, #8b4513);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(139, 69, 19, 0.26);
}
.fw-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  flex-shrink: 0;
}

.frame-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.12s;
}
.frame-thumb:active {
  transform: scale(0.9);
}
.ft-preview {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;
}
.frame-thumb.active .ft-preview {
  box-shadow:
    0 0 0 2.5px #c2825a,
    0 4px 12px rgba(139, 69, 19, 0.22);
}
.ft-inner {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 2px solid;
  opacity: 0.45;
}
.ft-name {
  font-size: 0.58rem;
  font-weight: 600;
  color: #9a6040;
  font-family: 'Inter', sans-serif;
}
.frame-thumb.active .ft-name {
  color: #6b2e0e;
  font-weight: 700;
}

/* ════════════════════════════════════════
   DELIVERY SECTION
════════════════════════════════════════ */
.delivery-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  scroll-margin-top: 16px;
}
.delivery-in-enter-active {
  animation: deli-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes deli-in {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Sign */
.sign-board {
  background: #fff;
  border: 2.5px solid #1a1210;
  border-radius: 6px;
  padding: 10px 22px;
  box-shadow: 4px 4px 0 #1a1210;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 220px;
  color: #1a1210;
}
.sdots {
  display: flex;
  gap: 14px;
}
.sdots span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #1a1210;
}
.sign-text {
  text-align: center;
}
.sign-h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: 1.5px;
  line-height: 1;
}
.sign-h2,
.sign-h3 {
  font-family: 'DM Serif Display', serif;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
}
.sign-count {
  font-weight: 900;
  font-size: 1rem;
}

/* Dev panel */
.dev-panel {
  width: 220px;
  background: rgba(255, 248, 240, 0.95);
  border: 2px solid rgba(194, 130, 90, 0.28);
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.dev-film-bar {
  width: 100%;
  height: 20px;
  background: #1a1210;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
}
.dev-hole {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  z-index: 1;
}
.dev-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, #c2825a, #e8b060);
  border-radius: 4px;
  transition: width 0.1s linear;
}
.dev-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #9a6040;
  font-family: 'Inter', sans-serif;
  font-style: italic;
}
.fade-t-enter-active,
.fade-t-leave-active {
  transition: opacity 0.35s;
}
.fade-t-enter-from,
.fade-t-leave-to {
  opacity: 0;
}

/* Slot machine */
.slot-machine {
  width: 220px;
}
.slot-body {
  background: #e4dcd0;
  border: 2.5px solid #1a1210;
  border-top: none;
  border-radius: 0 0 8px 8px;
  display: flex;
  justify-content: center;
  padding: 10px 0 16px;
  min-height: 80px;
  position: relative;
  overflow: hidden;
}
.slot-rails {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  background: linear-gradient(#d0c4b0, #e0d4c0);
  border: 1.5px solid #1a1210;
}
.rail.l {
  left: 6px;
}
.rail.r {
  right: 6px;
}
.slot-track {
  width: 80px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
}

/* Strip slide */
.strip-slide {
  transform: translateY(-110%);
  display: flex;
  justify-content: center;
  width: 100%;
}
.strip-slide.strip-out {
  transform: translateY(0);
  transition: transform 3.8s cubic-bezier(0.08, 0.18, 0.28, 1); /* slow mechanical slide */
}

/* ════════════════
   THE PHOTO STRIP
════════════════ */
.strip-card {
  width: 72px;
  padding: 5px 5px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

/* Per-frame backgrounds (also set via :style) — these ensure the scoped class acts as fallback */
.strip-bg-classic {
  background: #ffffff;
}
.strip-bg-vintage {
  background: #1a1210;
}
.strip-bg-floral {
  background: #fde8f2;
}
.strip-bg-pastel {
  background: #e8f4fc;
}
.strip-bg-minimal {
  background: #fafafa;
}
.strip-bg-hearts {
  background: #ffccd5;
}
.strip-bg-onepiece {
  background: #1a3a6e;
}

/* Photo wrapper — per-frame border around each photo */
.photos-area {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.strip-photo-wrap {
  position: relative;
  overflow: hidden;
}
.border-classic {
  outline: 1.5px solid #e8e0d8;
}
.border-vintage {
  outline: 1.5px solid #554030;
}
.border-floral {
  outline: 1.5px solid #f4b8cc;
  border-radius: 2px;
}
.border-pastel {
  outline: 1.5px solid #bcd8ef;
  border-radius: 2px;
}
.border-minimal {
  outline: 2px solid #222;
}
.border-hearts {
  outline: 1.5px solid #f4a4c8;
  border-radius: 2px;
}
.border-onepiece {
  outline: 2px solid #e8a020;
}
.strip-photo {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}

/* Flower corner overlays on photos */
.sc {
  position: absolute;
  color: #e888aa;
  z-index: 5;
}
.sc-tl {
  top: 1px;
  left: 1px;
}
.sc-tr {
  top: 1px;
  right: 1px;
}

/* Vintage sprockets on strip */
.vt-sprockets {
  display: flex;
  justify-content: space-around;
  padding: 3px 2px;
}
.vspr {
  width: 10px;
  height: 7px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.strip-spr {
  background: rgba(0, 0, 0, 0.4);
}
.strip-spr-bot {
  background: rgba(0, 0, 0, 0.4);
}

/* One Piece strip header */
.op-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #e8a020;
  font-family: 'DM Serif Display', serif;
  font-size: 0.45rem;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 3px 0;
  border-bottom: 1px solid #e8a020;
  margin-bottom: 2px;
}
/* One Piece badge on each photo */
.op-photo-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(26, 58, 110, 0.85);
  color: #e8a020;
  font-size: 0.32rem;
  font-weight: 800;
  font-family: 'DM Serif Display', serif;
  letter-spacing: 0.5px;
  padding: 1px 3px;
  border-radius: 2px;
  z-index: 5;
  border: 0.5px solid #e8a020;
}

/* Strip footer */
.strip-footer {
  padding: 3px 0 0;
}
.op-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #e8a020;
  font-family: 'DM Serif Display', serif;
  font-size: 0.38rem;
  padding: 2px 0;
  border-top: 1px solid #e8a020;
}
.default-footer {
  text-align: center;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 0.32rem;
  color: #a07060;
  letter-spacing: 0.3px;
}
.strip-bg-vintage .default-footer {
  color: rgba(255, 255, 255, 0.45);
}
.strip-bg-onepiece .default-footer {
  color: #e8a020;
}

/* ════════════════════════════════════════
   PICKUP / ACTIONS
════════════════════════════════════════ */
.pop-up-enter-active {
  animation: pop-up-a 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop-up-a {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pickup-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
  padding: 0 4px;
}
.pickup-label {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 0.98rem;
  color: #6b2e0e;
  display: flex;
  align-items: center;
  gap: 5px;
}
.pu-arrow {
  color: #c2825a;
  animation: pu-b 1.2s ease-in-out infinite;
}
@keyframes pu-b {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.pu-actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}
.pu-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 13px;
  border-radius: 11px;
  border: 1.5px solid rgba(194, 130, 90, 0.26);
  background: rgba(255, 255, 255, 0.78);
  font-size: 0.74rem;
  font-weight: 600;
  color: #7a4020;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.07);
  white-space: nowrap;
}
.pu-btn:hover {
  background: rgba(194, 130, 90, 0.1);
  transform: translateY(-1px);
}
.pu-btn:active {
  transform: scale(0.95);
}
.pu-btn.primary {
  background: linear-gradient(135deg, #c2825a, #8b4513);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(139, 69, 19, 0.28);
}
.pu-btn.primary:hover {
  background: linear-gradient(135deg, #d4936b, #9b5523);
}
.pu-btn.danger {
  border-color: rgba(160, 50, 50, 0.26);
  color: #8b3030;
}
.pu-btn.danger:hover {
  background: rgba(160, 50, 50, 0.08);
}

/* ════════════════════════════════════════
   PICK UP CTA BUTTON
════════════════════════════════════════ */
.pickup-cta-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  width: 100%;
}
.pickup-cta-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 30px;
  border-radius: 99px;
  border: none;
  background: linear-gradient(135deg, #c2825a 0%, #8b4513 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  font-family: 'DM Serif Display', serif;
  letter-spacing: 0.5px;
  box-shadow:
    0 8px 24px rgba(139, 69, 19, 0.38),
    0 2px 8px rgba(0, 0, 0, 0.12);
  animation: cta-bounce 1.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.12s,
    box-shadow 0.12s;
}
.pickup-cta-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  transform: skewX(-20deg);
  animation: shimmer-btn 2s infinite;
}
@keyframes shimmer-btn {
  0% {
    left: -75%;
  }
  100% {
    left: 125%;
  }
}
@keyframes cta-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
  60% {
    transform: translateY(-3px);
  }
}
.pickup-cta-btn:hover {
  box-shadow: 0 12px 32px rgba(139, 69, 19, 0.45);
  animation: none;
  transform: translateY(-2px);
}
.pickup-cta-btn:active {
  transform: scale(0.95);
  animation: none;
}
.pickup-hint {
  font-size: 0.72rem;
  font-style: italic;
  color: #a07060;
  font-family: 'Inter', sans-serif;
}

/* ════════════════════════════════════════
   MODAL
════════════════════════════════════════ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(20, 10, 5, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}
.modal-fade-enter-active {
  animation: modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-fade-leave-active {
  animation: modal-in 0.22s ease reverse;
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-card {
  background: linear-gradient(155deg, #fff8f0 0%, #fde8d8 100%);
  border-radius: 24px;
  padding: 20px 20px 24px;
  width: 100%;
  max-width: 500px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.45),
    0 4px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 90dvh;
  overflow-y: auto;
  /* Fancy border */
  border: 1px solid rgba(194, 130, 90, 0.28);
}

/* Modal header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem;
  color: #6b2e0e;
  letter-spacing: -0.3px;
}
.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid rgba(194, 130, 90, 0.28);
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8b4513;
  transition: all 0.12s;
}
.modal-close:hover {
  background: rgba(194, 130, 90, 0.14);
  transform: scale(1.08);
}

/* Modal strip preview */
.modal-strip-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.modal-strip {
  display: flex;
  flex-direction: column;
  width: 180px;
  padding: 8px 8px 26px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.35),
    0 3px 12px rgba(0, 0, 0, 0.18);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}
.modal-photos-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-photo-wrap {
  position: relative;
  overflow: hidden;
}
.modal-photo {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
  image-rendering: high-quality;
}
.modal-strip-footer {
  padding: 4px 0 0;
}

/* Larger badge in modal */
.op-photo-badge-lg {
  position: absolute;
  bottom: 3px;
  right: 3px;
  background: rgba(26, 58, 110, 0.88);
  color: #e8a020;
  font-size: 0.42rem;
  font-weight: 800;
  font-family: 'DM Serif Display', serif;
  letter-spacing: 0.5px;
  padding: 2px 5px;
  border-radius: 3px;
  z-index: 5;
  border: 0.5px solid #e8a020;
}
.op-header-lg {
  font-size: 0.55rem;
  letter-spacing: 1.5px;
  border-bottom-width: 1.5px;
  margin-bottom: 3px;
  padding: 4px 0;
}

/* Modal action buttons */
.modal-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
@media (min-width: 400px) {
  .modal-actions {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
}
.ma-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 8px;
  border-radius: 14px;
  border: 1.5px solid rgba(194, 130, 90, 0.24);
  background: rgba(255, 255, 255, 0.75);
  font-size: 0.72rem;
  font-weight: 600;
  color: #7a4020;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.06);
}
.ma-btn:hover {
  background: rgba(194, 130, 90, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 5px 14px rgba(139, 69, 19, 0.14);
}
.ma-btn:active {
  transform: scale(0.94);
}
.ma-btn.primary {
  background: linear-gradient(135deg, #c2825a, #8b4513);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(139, 69, 19, 0.3);
}
.ma-btn.primary:hover {
  background: linear-gradient(135deg, #d4936b, #9b5523);
}
.ma-btn.danger {
  border-color: rgba(160, 50, 50, 0.24);
  color: #8b3030;
}
.ma-btn.danger:hover {
  background: rgba(160, 50, 50, 0.08);
}

/* ── Upload alternative ── */
.upload-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}
.upload-or {
  font-size: 0.7rem;
  color: #b0907a;
  font-family: 'Inter', sans-serif;
  font-style: italic;
}
.upload-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 99px;
  border: 1.5px dashed rgba(194, 130, 90, 0.5);
  background: rgba(255, 255, 255, 0.65);
  font-size: 0.78rem;
  font-weight: 600;
  color: #8b4513;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.upload-btn:hover {
  background: rgba(194, 130, 90, 0.1);
  border-color: #c2825a;
  transform: translateY(-1px);
}
.upload-btn:active {
  transform: scale(0.96);
}
.upload-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
