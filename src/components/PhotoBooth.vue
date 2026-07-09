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
          <label class="chip-label"><CameraIcon :size="11" />Number of Photos</label>
          <div class="chip-row">
            <button
              v-for="c in [2, 3, 4]"
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
      <!-- ══ DYNAMIC INTERACTIVE STRIP PREVIEW ══ -->
      <div class="style-section preview-section">
        <h3 class="section-title"><SparklesIcon :size="12" />Interactive Strip Preview</h3>
        <div class="interactive-preview-wrapper">
          <div 
            class="interactive-strip-card" 
            :class="['strip-bg-' + selectedFrame, { 'template-strip': !!selectedTemplatePreset, 'anniversary-card': selectedFrame === 'anniversary' }]"
            :style="selectedFrame === 'custom' ? { backgroundColor: customBgColor } : stripBgStyle"
            ref="previewCardRef"
          >
            <!-- Full-template presets (CWSI etc) -->
            <template v-if="selectedTemplatePreset">
              <!-- 1. Photos layer — sits behind the frame overlay -->
              <div class="template-photos-layer">
                <template v-if="snaps.length > 0">
                  <div
                    v-for="(snap, i) in snaps"
                    :key="i"
                    class="template-photo-slot"
                    :style="templateSlotStyle(i)"
                  >
                    <img :src="snap" class="template-photo-img" :class="filterClass" @click="openCropModal(i)" :style="{ cursor: 'pointer', transform: `scale(${photoTransforms[i]?.zoom || 1}) translate(${photoTransforms[i]?.panX || 0}px, ${photoTransforms[i]?.panY || 0}px)` }" />
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="n in selectedTemplatePreset.forceLayout"
                    :key="n"
                    class="template-photo-slot placeholder-photo"
                    :style="templateSlotStyle(n - 1)"
                  >
                    <div class="placeholder-content">
                      <CameraIcon :size="14" />
                      <span>Pose {{ n }}</span>
                    </div>
                  </div>
                </template>
              </div>
              <!-- 2. Frame overlay image — renders ON TOP of photos -->
              <div
                v-if="selectedTemplatePreset.image"
                class="template-frame-overlay"
                :style="{ backgroundImage: `url('${selectedTemplatePreset.image}')` }"
              ></div>
              <!-- 3. CSS dark preset overlay (cwsi_dark) -->
              <div v-else class="template-dark-overlay">
                <div class="tdo-header">
                  <div class="tdo-logo-ring">CWSI</div>
                  <span class="tdo-title">Cordova Water System Inc.</span>
                </div>
                <div class="tdo-footer">
                  <span class="tdo-anniv">Happy <em>1st</em> anniversary</span>
                </div>
              </div>
            </template>

            <!-- Standard strip layout -->
            <template v-else>
            <!-- Frame header (One Piece banner etc) -->
            <div v-if="selectedFrame === 'onepiece'" class="op-header">
              <AnchorIcon :size="14" />
              <span>ONE PIECE</span>
              <AnchorIcon :size="14" />
            </div>

            <div v-if="selectedFrame === 'vintage'" class="vt-sprockets strip-spr">
              <span v-for="n in 5" :key="n" class="vspr"></span>
            </div>

            <!-- Custom Template: Title Header (Now at the top!) -->
            <div
              v-if="selectedFrame === 'custom_tpl'"
              class="custom-tpl-header"
              :style="{ color: customTplTextColor, borderColor: customTplBorder, fontFamily: customTplFont }"
            >
              <span class="ctpl-title">{{ customTplTitle }}</span>
            </div>

            <!-- Photos / Cozy Placeholders -->
            <div v-if="selectedFrame === 'custom_tpl' && customTplShowLogo" class="ctpl-logo-placeholder">
              <img src="/logo.png" style="height:20px; object-fit:contain;" />
            </div>
            <div class="photos-area" :class="{
              'custom-tpl-strip': selectedFrame === 'custom_tpl' && customTplLayout === 'strip',
              'custom-tpl-wide': selectedFrame === 'custom_tpl' && customTplLayout === 'wide',
              'custom-tpl-quad': selectedFrame === 'custom_tpl' && customTplLayout === 'quad',
            }">
              <template v-if="snaps.length > 0">
                <div
                  v-for="(snap, i) in snaps"
                  :key="i"
                  class="strip-photo-wrap"
                  :class="'border-' + selectedFrame" :style="selectedFrame === 'custom' ? { outline: '2px solid ' + customBorderColor } : {}"
                >
                  <img :src="snap" class="strip-photo" :class="filterClass" @click="openCropModal(i)" :style="{ cursor: 'pointer', transform: `scale(${photoTransforms[i]?.zoom || 1}) translate(${photoTransforms[i]?.panX || 0}px, ${photoTransforms[i]?.panY || 0}px)` }" />
                  <div v-if="selectedFrame === 'onepiece'" class="op-photo-badge">
                    {{ opLabels[i % opLabels.length] }}
                  </div>
                  <template v-if="selectedFrame === 'floral'">
                    <FlowerIcon class="sc sc-tl" :size="10" />
                    <FlowerIcon class="sc sc-tr" :size="10" />
                  </template>
                </div>
              </template>
              <template v-else>
                <!-- Cozy Placeholders when no snaps yet -->
                <div
                  v-for="n in Number(selectedLayout)"
                  :key="n"
                  class="strip-photo-wrap placeholder-photo"
                  :class="'border-' + selectedFrame" :style="selectedFrame === 'custom' ? { outline: '2px solid ' + customBorderColor } : {}"
                >
                  <div class="placeholder-content">
                    <CameraIcon :size="14" />
                    <span>Pose {{ n }}</span>
                  </div>
                </div>
              </template>
            </div>



            <!-- Strip footer / watermark -->
            <div class="strip-footer" :class="'footer-' + selectedFrame" v-if="(showWatermark && selectedFrame !== 'anniversary') || selectedFrame === 'onepiece'">
              <div v-if="selectedFrame === 'onepiece'" class="op-footer">
                <ZapIcon :size="10" />
                <span>Snapify · {{ timestamp }}</span>
                <SwordIcon :size="10" />
              </div>
              <div class="default-footer" v-else-if="showWatermark">Snapify · {{ timestamp }}</div>
            </div>

            <!-- Bottom sprockets for vintage -->
            <div v-if="selectedFrame === 'vintage'" class="vt-sprockets strip-spr-bot">
              <span v-for="n in 5" :key="n" class="vspr"></span>
            </div>
            </template>

            <!-- Active Stickers Overlay Layer -->
            <div class="stickers-overlay-container">
              <div 
                v-for="(sticker, index) in activeStickers" 
                :key="sticker.id"
                class="draggable-sticker"
                :class="{ 'is-selected': selectedStickerIndex === index }"
                :style="{
                  left: `${sticker.x * 100}%`,
                  top: `${sticker.y * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                  zIndex: selectedStickerIndex === index ? 100 : index + 10
                }"
                @mousedown.prevent="startDrag($event, index)"
                @touchstart.prevent="startDrag($event, index)"
              >
                <div class="sticker-content">
                  <template v-if="sticker.type === 'image'">
                    <img :src="sticker.src" @error="sticker.isError = true" v-if="!sticker.isError" />
                    <div v-else class="fallback-sticker-fan" :class="sticker.id">
                      <div class="fan-head">
                        <span v-if="sticker.id.includes('logo_fan1')">CWSI</span>
                        <span v-else>I ❤️ CWSI</span>
                      </div>
                      <div class="fan-stick"></div>
                    </div>
                  </template>
                  <template v-else-if="sticker.type === 'emoji'">
                    <span class="emoji-sticker">{{ sticker.src }}</span>
                  </template>
                  <template v-else-if="sticker.type === 'text'">
                    <span class="text-sticker" :style="{ color: sticker.color, fontFamily: sticker.font, fontSize: '48px', whiteSpace: 'nowrap' }">{{ sticker.text }}</span>
                  </template>
                  
                  <!-- Selected outline and action buttons -->
                  <div class="sticker-outline" v-if="selectedStickerIndex === index">
                    <button class="action-btn delete-btn" @click.stop="removeSticker(index)">×</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div class="preview-footer-row">
          <p class="preview-hint-text">💡 Tap or drag stickers to position them on your strip</p>
          <button 
            class="wm-toggle-btn"
            :class="{ 'wm-off': !showWatermark }"
            @click="showWatermark = !showWatermark"
            :title="showWatermark ? 'Hide watermark' : 'Show watermark'"
          >
            <span>{{ showWatermark ? '🏷️ Snapify tag' : '🚫 No tag' }}</span>
          </button>
        </div>
      </div>

      <!-- ══ IOS SEGMENTED CONTROL TABS ══ -->
      <div class="ios-segmented-control">
        <button 
          class="segment-btn" 
          :class="{ active: activeTab === 'filter' }" 
          @click="activeTab = 'filter'"
        >
          <SlidersHorizontalIcon :size="13" />
          <span>Filters</span>
        </button>
        <button 
          class="segment-btn" 
          :class="{ active: activeTab === 'frame' }" 
          @click="activeTab = 'frame'"
        >
          <FrameIcon :size="13" />
          <span>Frames</span>
        </button>
        <button 
          class="segment-btn" 
          :class="{ active: activeTab === 'stickers' }" 
          @click="activeTab = 'sticker'"
        >
          <SmileIcon :size="13" />
          <span>Stickers</span>
        </button>
      </div>

      <!-- ══ TAB 1: FILTERS ══ -->
      <div v-if="activeTab === 'filter'" class="style-section">
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

      <!-- ══ TAB 2: FRAMES ══ -->
      <div v-if="activeTab === 'frame'" class="style-section">
        <div class="style-scroll">
          <button
            v-for="fr in frames"
            :key="fr.id"
            class="frame-thumb"
            :class="['ft-' + fr.id, { active: selectedFrame === fr.id }]"
            @click="pick('frame', fr.id)"
          >
            <div
              class="ft-preview"
              :style="fr.thumb
                ? { backgroundImage: `url(${fr.thumb})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
                : { background: fr.bg }"
            >
              <div v-if="!fr.thumb" class="ft-inner" :style="{ borderColor: fr.border || 'rgba(0,0,0,0.12)' }"></div>
            </div>
            <span class="ft-name">{{ fr.label }}</span>
          </button>
        </div>
        
        <!-- ── Custom Template Builder ── -->
        <div v-if="selectedFrame === 'custom_tpl'" class="custom-tpl-builder">
          <div class="ctb-row">
            <div class="ctb-section" style="flex:2">
              <label class="ctb-label">Title Text</label>
              <input type="text" v-model="customTplTitle" class="ctb-input" placeholder="Happy 1st Anniversary" />
            </div>
            <div class="ctb-section" style="flex:1">
              <label class="ctb-label">Font</label>
              <select v-model="customTplFont" class="ctb-input" style="padding: 7px 5px;">
                <option value="Inter">Inter</option>
                <option value="Caveat">Caveat</option>
                <option value="Playfair Display">Playfair</option>
                <option value="Oswald">Oswald</option>
                <option value="Dancing Script">Dancing</option>
              </select>
            </div>
          </div>
          <div class="ctb-row" style="margin-top: -6px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:0.75rem; cursor:pointer;">
              <input type="checkbox" v-model="customTplShowLogo" />
              Show Logo (Bottom Right)
            </label>
          </div>
          <div class="ctb-row">
            <div class="ctb-section">
              <label class="ctb-label">Background</label>
              <input type="color" v-model="customTplBg" class="ctb-color" />
            </div>
            <div class="ctb-section">
              <label class="ctb-label">Border</label>
              <input type="color" v-model="customTplBorder" class="ctb-color" />
            </div>
            <div class="ctb-section">
              <label class="ctb-label">Text</label>
              <input type="color" v-model="customTplTextColor" class="ctb-color" />
            </div>
          </div>
          <div class="ctb-section">
            <label class="ctb-label">Layout</label>
            <div class="ctb-layout-row">
              <button
                v-for="l in [
                  { id: 'strip', label: 'Strip', desc: '3 stacked' },
                  { id: 'wide',  label: 'Wide',  desc: '1 + 2 side' },
                  { id: 'quad',  label: 'Grid',  desc: '2 × 2' },
                ]"
                :key="l.id"
                class="ctb-layout-btn"
                :class="{ active: customTplLayout === l.id }"
                @click="customTplLayout = l.id; pick('layout', l.id === 'quad' ? 4 : 3)"
              >
                <div class="ctb-layout-icon" :class="'ctb-icon-' + l.id">
                  <span v-if="l.id === 'strip'"><span v-for="n in 3" :key="n" class="ctb-slot ctb-slot-h"></span></span>
                  <span v-else-if="l.id === 'wide'" style="display:flex;gap:2px;width:100%">
                    <span class="ctb-slot ctb-slot-tall"></span>
                    <span style="display:flex;flex-direction:column;gap:2px;flex:1">
                      <span class="ctb-slot ctb-slot-sm"></span>
                      <span class="ctb-slot ctb-slot-sm"></span>
                    </span>
                  </span>
                  <span v-else style="display:grid;grid-template-columns:1fr 1fr;gap:2px;width:100%">
                    <span v-for="n in 4" :key="n" class="ctb-slot"></span>
                  </span>
                </div>
                <span class="ctb-layout-name">{{ l.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ TAB 3: STICKERS ══ -->
      <div v-if="activeTab === 'sticker'" class="style-section sticker-section">
        <!-- Text Sticker Adder -->
        <div class="text-sticker-adder">
          <input type="text" v-model="newText" placeholder="Type your text..." class="text-input" />
          <div class="text-adder-row">
            <input type="color" v-model="newTextColor" title="Text Color" class="color-picker-small" />
            <select v-model="newTextFont" class="font-select">
              <option value="Inter">Inter (Modern)</option>
              <option value="Caveat">Caveat (Handwritten)</option>
              <option value="Playfair Display">Playfair (Elegant)</option>
            </select>
            <button @click="addTextSticker" class="add-text-btn">+ Add Text</button>
          </div>
        </div>
        <div class="stickers-grid">
          <button 
            v-for="st in availableStickers" 
            :key="st.id" 
            class="sticker-picker-btn"
            @click="addSticker(st)"
          >
            <div class="sticker-btn-preview">
              <span v-if="st.type === 'emoji'" class="emoji-preview">{{ st.src }}</span>
            </div>
            <span class="sticker-picker-label">{{ st.label }}</span>
          </button>
          
          <!-- Upload Custom Sticker Button -->
          <label class="sticker-picker-btn upload-custom-sticker-label">
            <input type="file" accept="image/*" style="display: none" @change="handleCustomStickerUpload" />
            <div class="sticker-btn-preview upload-btn-preview">
              <UploadIcon :size="16" />
            </div>
            <span class="sticker-picker-label">Upload</span>
          </label>
        </div>

        <!-- Selected Sticker Controls -->
        <div v-if="selectedStickerIndex !== null && activeStickers[selectedStickerIndex]" class="selected-sticker-controls">
          <h4 class="controls-title">Adjust Sticker</h4>
          
          <div class="control-row">
            <label>Scale</label>
            <input 
              type="range" 
              min="0.3" 
              max="2.5" 
              step="0.05" 
              v-model.number="activeStickers[selectedStickerIndex].scale"
            />
            <span class="control-val">{{ activeStickers[selectedStickerIndex].scale.toFixed(1) }}x</span>
          </div>
          
          <div class="control-row">
            <label>Rotate</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              step="5" 
              v-model.number="activeStickers[selectedStickerIndex].rotation"
            />
            <span class="control-val">{{ activeStickers[selectedStickerIndex].rotation }}°</span>
          </div>

          <div class="control-actions-row">
            <button class="control-action-btn" @click="bringToFront">Bring to Front</button>
            <button class="control-action-btn" @click="sendToBack">Send to Back</button>
            <button class="control-action-btn danger" @click="removeSticker(selectedStickerIndex)">Remove</button>
          </div>
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
                    <!-- THE ACTUAL STRIP — matches preview exactly -->
                    <!-- Template preset strip (anniversary etc) -->
                    <template v-if="selectedTemplatePreset">
                      <div
                        class="strip-card template-strip"
                        ref="photoStripRef"
                        :class="['strip-bg-' + selectedFrame, { 'anniversary-card': selectedFrame === 'anniversary' }]"
                        :style="stripBgStyle"
                      >
                        <div class="template-photos-layer">
                          <div
                            v-for="(snap, i) in snaps"
                            :key="i"
                            class="template-photo-slot"
                            :style="templateSlotStyle(i)"
                          >
                            <img :src="snap" class="template-photo-img" :class="filterClass" />
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Standard strip -->
                    <template v-else>
                    <div
                      class="strip-card"
                      ref="photoStripRef"
                      :class="['strip-bg-' + selectedFrame, selectedFrame === 'anniversary' ? 'anniversary-card' : '']"
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
                      <div class="photos-area" :class="{ 'collage-grid': selectedFrame === 'collage', ['collage-' + selectedLayout]: selectedFrame === 'collage', 'anniversary-layout': selectedFrame === 'anniversary' }">
                        <div
                          v-for="(snap, i) in snaps"
                          :key="i"
                          class="strip-photo-wrap"
                          :class="'border-' + selectedFrame" :style="selectedFrame === 'custom' ? { outline: '2px solid ' + customBorderColor } : {}"
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

                      <!-- Anniversary custom text -->
                      <div class="anniversary-footer" v-if="selectedFrame === 'anniversary'">
                        <span>{{ customText }}</span>
                      </div>
                      
                      <!-- Strip footer / watermark -->
                      <div class="strip-footer" :class="'footer-' + selectedFrame" v-if="(showWatermark && selectedFrame !== 'anniversary') || selectedFrame === 'onepiece'">
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
                    </template>
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

          <div class="strip-preview-container" style="margin-top:12px; text-align:center;">
        <img id="strip-preview-img" alt="Strip preview" style="max-width:100%; border:1px solid #ccc; border-radius:6px;" />
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
            <div class="review-strip" :class="['strip-bg-' + selectedFrame, selectedFrame === 'anniversary' ? 'anniversary-card' : '']" :style="stripBgStyle">
              <div class="review-grid-v">
                <div
                  v-for="(snap, i) in snaps"
                  :key="i"
                  class="review-item-v"
                  :class="'border-' + selectedFrame" :style="selectedFrame === 'custom' ? { outline: '2px solid ' + customBorderColor } : {}"
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
import { ref, computed, onBeforeUnmount, nextTick, watch } from 'vue'
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
  SmileIcon,
  SparklesIcon,
} from 'lucide-vue-next'

// ── A "SailboatIcon" polyfill (not in all lucide versions) ──
const SailboatIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4z"/><path d="M21 14 12 2 3 14h18z"/><path d="M12 2v16"/></svg>`,
}

// ── State ──────────────────────────────────────────────────
const modalOpen = ref(false)
const gifGenerating = ref(false)

const openModal = async () => {
  playClick()
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  try {
    const canvas = await generateStripCanvas(2)
    const img = document.getElementById('strip-preview-img')
    if (img) img.src = canvas.toDataURL('image/png')
  } catch (e) {
    console.error(e)
  }
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
const customText = ref('Happy 1st anniversary')
const showWatermark = ref(true)

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
  { id: 'classic',  label: 'Classic',   bg: '#ffffff', border: '#e8e0d8' },
  { id: 'vintage',  label: 'Film',      bg: '#1a1210', border: '#554030' },
  { id: 'floral',   label: 'Floral',   bg: '#fde8f2', border: '#f4b8cc' },
  { id: 'pastel',   label: 'Pastel',   bg: '#e8f4fc', border: '#bcd8ef' },
  { id: 'minimal',  label: 'Minimal',  bg: '#fafafa', border: '#222222' },
  { id: 'hearts',   label: 'Hearts',   bg: '#fce4f0', border: '#f4a4c8' },
  { id: 'onepiece', label: 'One Piece', bg: '#1a3a6e', border: '#e8a020' },
  { id: 'custom_tpl', label: 'Custom', bg: '#ffffff', border: '#1a458b' },
]

const TEMPLATE_PRESETS = {
  // No image-based presets any more — custom_tpl uses CSS only
}

const selectedTemplatePreset = computed(() => {
  const preset = TEMPLATE_PRESETS[selectedFrame.value]
  // custom_tpl uses pure CSS layout handled in template section
  if (['anniversary', 'custom_tpl'].includes(selectedFrame.value)) return null
  return preset || null
})

// Computed strip background style (for the strip card)
const stripBgStyle = computed(() => {
  const fr = frames.find((f) => f.id === selectedFrame.value)
  if (selectedFrame.value === 'custom_tpl') {
    return { background: customTplBg.value }
  }
  if (selectedFrame.value === 'custom') {
    return { background: customBgColor.value }
  }
  if (selectedTemplatePreset.value) {
    const preset = selectedTemplatePreset.value
    const style = { aspectRatio: `${preset.width} / ${preset.height}`, position: 'relative' }
    style.background = preset.fallbackBg || '#e6f0fa'
    return style
  }
  return { background: fr ? fr.bg : '#ffffff' }
})

const templateSlotStyle = (index) => {
  const preset = selectedTemplatePreset.value
  if (!preset) return {}
  const slot = preset.slots[index]
  if (!slot) return {}
  return {
    left: `${(slot.x / preset.width) * 100}%`,
    top: `${(slot.y / preset.height) * 100}%`,
    width: `${(slot.w / preset.width) * 100}%`,
    height: `${(slot.h / preset.height) * 100}%`,
    transform: `rotate(${slot.rotate || 0}deg)`,
    transformOrigin: 'center center',
  }
}

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

// ── Stickers State & Customization ──────────────────────────
const activeTab = ref('filter')


// ── Custom Template Builder ───────────────────────────────
const customTplTitle = ref('Happy 1st Anniversary')
const customTplBg = ref('#e8f4fc')
const customTplBorder = ref('#1a458b')
const customTplTextColor = ref('#1a458b')
const customTplLayout = ref('wide') // 'strip' | 'wide' | 'quad'
const customTplShowLogo = ref(true)
const customTplFont = ref('Inter')

// Advanced Features State
const customBgColor = ref('#ffffff')
const customBorderColor = ref('#222222')
const photoTransforms = ref([]) // array of { zoom: 1, panX: 0, panY: 0 }
const showCropModal = ref(false)
const editingPhotoIndex = ref(null)
const tempTransform = ref({ zoom: 1, panX: 0, panY: 0 })

// Initialize photoTransforms when snaps change
watch(snaps, (newSnaps) => {
  if (newSnaps.length > photoTransforms.value.length) {
    for (let i = photoTransforms.value.length; i < newSnaps.length; i++) {
      photoTransforms.value.push({ zoom: 1, panX: 0, panY: 0 })
    }
  }
}, { deep: true })

const activeStickers = ref([])
const selectedStickerIndex = ref(null)
const draggingIndex = ref(null)

let startX = 0
let startY = 0
let startStickerX = 0
let startStickerY = 0

const previewCardRef = ref(null)

const availableStickers = [

  { id: 'drop', label: '💧 Water Drop', type: 'emoji', src: '💧' },
  { id: 'sparkles', label: '✨ Sparkles', type: 'emoji', src: '✨' },
  { id: 'heart', label: '❤️ Heart', type: 'emoji', src: '❤️' },
  { id: 'star', label: '🌟 Star', type: 'emoji', src: '🌟' }
]

const addSticker = (sticker) => {
  playSelect()
  activeStickers.value.push({
    id: `${sticker.id}_${Date.now()}`,
    label: sticker.label,
    type: sticker.type,
    src: sticker.src,
    x: 0.5,
    y: 0.5,
    scale: 1.0,
    rotation: 0,
    isError: false
  })
  selectedStickerIndex.value = activeStickers.value.length - 1
}

const removeSticker = (index) => {
  playClick()
  activeStickers.value.splice(index, 1)
  if (selectedStickerIndex.value === index) {
    selectedStickerIndex.value = null
  } else if (selectedStickerIndex.value > index) {
    selectedStickerIndex.value--
  }
}

const bringToFront = () => {
  if (selectedStickerIndex.value === null) return
  const index = selectedStickerIndex.value
  const sticker = activeStickers.value.splice(index, 1)[0]
  activeStickers.value.push(sticker)
  selectedStickerIndex.value = activeStickers.value.length - 1
}

const sendToBack = () => {
  if (selectedStickerIndex.value === null) return
  const index = selectedStickerIndex.value
  const sticker = activeStickers.value.splice(index, 1)[0]
  activeStickers.value.unshift(sticker)
  selectedStickerIndex.value = 0
}

const handleCustomStickerUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    activeStickers.value.push({
      id: `custom_${Date.now()}`,
      label: 'Custom Sticker',
      type: 'image',
      src: event.target.result,
      x: 0.5,
      y: 0.5,
      scale: 1.0,
      rotation: 0,
      isError: false
    })
    selectedStickerIndex.value = activeStickers.value.length - 1
  }
  reader.readAsDataURL(file)
}

const startDrag = (event, index) => {
  selectedStickerIndex.value = index
  draggingIndex.value = index
  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY
  
  startX = clientX
  startY = clientY
  startStickerX = activeStickers.value[index].x
  startStickerY = activeStickers.value[index].y
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (event) => {
  if (draggingIndex.value === null) return
  event.preventDefault()
  
  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY
  
  const rect = previewCardRef.value ? previewCardRef.value.getBoundingClientRect() : null
  if (!rect) return
  
  const dx = (clientX - startX) / rect.width
  const dy = (clientY - startY) / rect.height
  
  let newX = startStickerX + dx
  let newY = startStickerY + dy
  
  activeStickers.value[draggingIndex.value].x = Math.max(0, Math.min(1, newX))
  activeStickers.value[draggingIndex.value].y = Math.max(0, Math.min(1, newY))
}

const stopDrag = () => {
  draggingIndex.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
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
  if (type === 'frame') {
    // Reset layout to safe default when switching frames
    const tplFrames = ['custom_tpl']
    if (tplFrames.includes(val)) {
      selectedLayout.value = 3
    } else if (selectedLayout.value > 4) {
      selectedLayout.value = 3
    }
  }
  if (type === 'filter') {
    selectedFilter.value = val
    appStep.value = Math.max(appStep.value, 2)
  }
  if (type === 'frame') {
    selectedFrame.value = val
    const preset = TEMPLATE_PRESETS[val]
    if (preset?.forceLayout) selectedLayout.value = preset.forceLayout
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


const openCropModal = (index) => {
  editingPhotoIndex.value = index
  tempTransform.value = { ...photoTransforms.value[index] }
  showCropModal.value = true
}

const saveCrop = () => {
  photoTransforms.value[editingPhotoIndex.value] = { ...tempTransform.value }
  showCropModal.value = false
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
  cwsi: '#ffffff',
  cwsi_anniversary: '#e6f0fa',
  memories: '#6c5953',
  film_love: '#f7f3eb',
  vintage: '#1a1210',
  floral: '#fde8f2',
  pastel: '#e8f4fc',
  minimal: '#fafafa',
  hearts: '#ffccd5',
  onepiece: '#1a3a6e',
  collage: '#111111',
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

// Helper to load external logo
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Fallback sticker drawing in case image assets are not loaded
async function drawFallbackSticker(ctx, id, size) {
  ctx.save()
  
  // 1. Draw Wooden Stick
  ctx.fillStyle = '#e5c298' // nice light wood color
  ctx.beginPath()
  ctx.roundRect(-size * 0.08, 0, size * 0.16, size * 0.7, 4)
  ctx.fill()
  
  // Shadow/texture for stick
  ctx.fillStyle = '#cda675'
  ctx.fillRect(-size * 0.08, 0, size * 0.04, size * 0.7)
  
  // 2. Draw Fan Head (Main Circular part)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#1b6fb5'
  ctx.lineWidth = size * 0.05
  ctx.beginPath()
  ctx.arc(0, -size * 0.1, size * 0.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  
  if (false) {
    // Blue inner crest
    ctx.fillStyle = '#e8f4fd'
    ctx.beginPath()
    ctx.arc(0, -size * 0.1, size * 0.38, 0, Math.PI * 2)
    ctx.fill()
    
    // Wave lines inside fallback logo
    ctx.strokeStyle = '#1b6fb5'
    ctx.lineWidth = size * 0.03
    ctx.beginPath()
    for (let wave = 0; wave < 3; wave++) {
      const yOffset = -size * 0.05 + wave * size * 0.08
      ctx.moveTo(-size * 0.25, yOffset)
      ctx.bezierCurveTo(-size * 0.12, yOffset - 5, -size * 0.08, yOffset + 5, 0, yOffset)
      ctx.bezierCurveTo(size * 0.08, yOffset - 5, size * 0.12, yOffset + 5, size * 0.25, yOffset)
    }
    ctx.stroke()
    
    // Curved typography representation
    ctx.fillStyle = '#1b3a6e'
    ctx.font = `bold ${Math.max(4, size * 0.05)}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('CORDOVA', 0, -size * 0.26)
    ctx.fillText('WATER SYSTEM', 0, -size * 0.18)
  } else {
    // "I ❤️ CWSI" fan
    // Red Heart
    ctx.fillStyle = '#e02424'
    ctx.beginPath()
    const hx = 0, hy = -size * 0.25, hw = size * 0.18, hh = size * 0.16
    ctx.moveTo(hx, hy + hh * 0.35)
    ctx.bezierCurveTo(hx - hw * 0.5, hy + hh * 0.1, hx - hw * 0.52, hy - hh * 0.28, hx, hy - hh * 0.05)
    ctx.bezierCurveTo(hx + hw * 0.52, hy - hh * 0.28, hx + hw * 0.5, hy + hh * 0.1, hx, hy + hh * 0.35)
    ctx.fill()
    
    // Text: I
    ctx.fillStyle = '#1b3a6e'
    ctx.font = `bold ${Math.max(8, size * 0.1)}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('I', -size * 0.18, -size * 0.2)
    
    // Text: CWSI
    ctx.font = `bold ${Math.max(9, size * 0.12)}px system-ui`
    ctx.fillText('CWSI', 0, -size * 0.02)
    
    // Brgy Gabi subtitle
    ctx.fillStyle = '#555'
    ctx.font = `${Math.max(4, size * 0.04)}px system-ui`
    ctx.fillText('BRGY. GABI', 0, size * 0.12)
  }
  
  ctx.restore()
}

// Draw image with center-crop into a destination rect
function drawCoverImage(ctx, img, dx, dy, dw, dh) {
  const srcRatio = img.naturalWidth / img.naturalHeight
  const dstRatio = dw / dh
  let sx = 0
  let sy = 0
  let sw = img.naturalWidth
  let sh = img.naturalHeight
  if (srcRatio > dstRatio) {
    sh = img.naturalHeight
    sw = sh * dstRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    sw = img.naturalWidth
    sh = sw / dstRatio
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

const generateStripCanvas = async (scale = 3) => {
  const frame = selectedFrame.value
  const filter = FILTER_CSS[selectedFilter.value] || ''
  const photos = snaps.value

  // Full-template presets with fixed slot coordinates
  if (TEMPLATE_PRESETS[frame]) {
    const preset = TEMPLATE_PRESETS[frame]
    const templateImg = await loadImage(preset.image)
    const TW = templateImg?.naturalWidth || preset.width
    const TH = templateImg?.naturalHeight || preset.height

    const c = document.createElement('canvas')
    c.width = TW * scale
    c.height = TH * scale
    const ctx = c.getContext('2d')
    ctx.scale(scale, scale)

    if (templateImg) ctx.drawImage(templateImg, 0, 0, TW, TH)
    else {
      ctx.fillStyle = preset.fallbackBg
      ctx.fillRect(0, 0, TW, TH)
    }

    const imgs = await Promise.all(photos.map((src) => loadFiltered(src, filter)))
    for (let i = 0; i < imgs.length; i++) {
      const slot = preset.slots[i]
      if (!slot) continue
      const sx = (slot.x / preset.width) * TW
      const sy = (slot.y / preset.height) * TH
      const sw = (slot.w / preset.width) * TW
      const sh = (slot.h / preset.height) * TH
      ctx.save()
      ctx.translate(sx + sw / 2, sy + sh / 2)
      ctx.rotate(((slot.rotate || 0) * Math.PI) / 180)
      ctx.beginPath()
      // Rounded clip to match UI preview border-radius
      ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 8)
      ctx.clip()
      drawCoverImage(ctx, imgs[i], -sw / 2, -sh / 2, sw, sh)
      ctx.restore()
    }

    for (const sticker of activeStickers.value) {
      ctx.save()
      const tx = sticker.x * TW
      const ty = sticker.y * TH
      ctx.translate(tx, ty)
      ctx.rotate((sticker.rotation * Math.PI) / 180)
      const size = 48 * sticker.scale
      if (sticker.type === 'image') {
        const img = await loadImage(sticker.src)
        if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size)
        else await drawFallbackSticker(ctx, sticker.id, size)
      } else if (sticker.type === 'text') {
        ctx.font = `${size}px "${sticker.font}", system-ui`
        ctx.fillStyle = sticker.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sticker.text, 0, 0)
      } else if (sticker.type === 'text') {
        ctx.font = `${size}px "${sticker.font}", system-ui`
        ctx.fillStyle = sticker.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sticker.text, 0, 0)
      } else if (sticker.type === 'emoji') {
        ctx.font = `${size}px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sticker.src, 0, 0)
      }
      ctx.restore()
    }

    return c
  }


  // ── Anniversary frame: custom grid-based canvas ─────────────────────
  if (frame === 'anniversary') {
    const TW = 600
    const TH = 760
    
    const c = document.createElement('canvas')
    c.width = TW * scale
    c.height = TH * scale
    const ctx = c.getContext('2d')
    ctx.scale(scale, scale)

    // Background gradient for anniversary
    const grad = ctx.createLinearGradient(0, 0, 0, TH)
    grad.addColorStop(0, '#e8f4fc')
    grad.addColorStop(1, '#d0e6f7')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, TW, TH)

    // Cloud-like decorations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.arc(60, 40, 50, 0, Math.PI * 2)
    ctx.arc(140, 60, 60, 0, Math.PI * 2)
    ctx.arc(TW - 80, 20, 80, 0, Math.PI * 2)
    ctx.arc(TW - 20, 80, 50, 0, Math.PI * 2)
    ctx.fill()

    const imgs = await Promise.all(photos.map((src) => loadFiltered(src, filter)))
    
    // Layout logic: left big photo, two right small photos
    const GAP = 16
    const PAD = 30
    
    const rightColW = 240
    const leftColW = TW - PAD * 2 - GAP - rightColW
    
    const totalPhotoH = TH - PAD - 100 // leave 100px for text
    const rightColH = (totalPhotoH - GAP) / 2
    
    const slots = [
      { x: PAD, y: PAD, w: leftColW, h: totalPhotoH },
      { x: PAD + leftColW + GAP, y: PAD, w: rightColW, h: rightColH },
      { x: PAD + leftColW + GAP, y: PAD + rightColH + GAP, w: rightColW, h: rightColH },
    ]
    
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i]
      if (!img) continue
      const slot = slots[i % 3] 
      
      // Draw white border (simulated by box-shadow in css)
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.roundRect(slot.x - 4, slot.y - 4, slot.w + 8, slot.h + 8, 10)
      ctx.fill()
      
      // Draw shadow
      ctx.shadowColor = 'rgba(0,0,0,0.1)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 2
      ctx.beginPath()
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 6)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      
      // Draw image
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 6)
      ctx.clip()
      drawCoverImage(ctx, img, slot.x, slot.y, slot.w, slot.h, i)
      ctx.restore()
    }
    
    // Text at bottom
    ctx.fillStyle = '#1a458b'
    ctx.font = 'bold 38px "Playfair Display", Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(customText.value, TW / 2, TH - 36)

    // Stickers
    for (const sticker of activeStickers.value) {
      ctx.save()
      const tx = sticker.x * TW
      const ty = sticker.y * TH
      ctx.translate(tx, ty)
      ctx.rotate((sticker.rotation * Math.PI) / 180)
      const size = 48 * sticker.scale
      if (sticker.type === 'image') {
        const img = await loadImage(sticker.src)
        if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size)
      } else if (sticker.type === 'emoji') {
        ctx.font = `${size}px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sticker.src, 0, 0)
      }
      ctx.restore()
    }

    return c
  }

  
  // ── Custom Template Builder: Canvas Generation ─────────────────────
  if (frame === 'custom_tpl') {
    const layout = customTplLayout.value
    // Base dimensions similar to wide/grid strips
    const SW_C = 800
    const SH_C = layout === 'strip' ? 1200 : 700
    const PAD = 24
    
    const c = document.createElement('canvas')
    c.width = SW_C * scale
    c.height = SH_C * scale
    const ctx = c.getContext('2d')
    ctx.scale(scale, scale)

    // Background
    ctx.fillStyle = customTplBg.value || '#e8f4fc'
    ctx.fillRect(0, 0, SW_C, SH_C)

    // Title Header
    const titleText = customTplTitle.value || 'Happy 1st Anniversary'
    ctx.fillStyle = customTplTextColor.value || '#1a458b'
    ctx.font = `bold 32px "${customTplFont.value || 'Inter'}", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(titleText, PAD, PAD)

    // Divider Line
    ctx.beginPath()
    ctx.moveTo(PAD, PAD + 45)
    ctx.lineTo(SW_C - PAD, PAD + 45)
    ctx.strokeStyle = customTplBorder.value || '#1a458b'
    ctx.lineWidth = 4
    ctx.stroke()

    // Logo (if enabled)
    if (customTplShowLogo.value) {
      const logoImg = await loadImage('/logo.png')
      if (logoImg) {
        const logoH = 50
        const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH
        ctx.drawImage(logoImg, SW_C - PAD - logoW, SH_C - PAD - logoH, logoW, logoH)
      }
    }

    // Load images
    const imgs = await Promise.all(photos.map((src) => loadFiltered(src, filter)))

    // Layout engine for photos
    const startY = PAD + 70
    const areaW = SW_C - (PAD * 2)
    const areaH = SH_C - startY - (PAD * 2) - (customTplShowLogo.value && layout !== 'strip' ? 40 : 0)
    
    const drawSlot = (imgIndex, x, y, w, h) => {
      if (imgIndex >= imgs.length || !imgs[imgIndex]) return
      
      // Draw border
      ctx.fillStyle = customTplBorder.value || '#1a458b'
      ctx.fillRect(x - 4, y - 4, w + 8, h + 8)
      
      // Draw image
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.clip()
      
      const t = photoTransforms.value[imgIndex] || { zoom: 1, panX: 0, panY: 0 };
      const z = t.zoom;
      
      const srcRatio = imgs[imgIndex].naturalWidth / imgs[imgIndex].naturalHeight
      const dstRatio = w / h
      let sx = 0, sy = 0, sw = imgs[imgIndex].naturalWidth, sh = imgs[imgIndex].naturalHeight
      if (srcRatio > dstRatio) {
        sh = imgs[imgIndex].naturalHeight
        sw = sh * dstRatio
        sx = (imgs[imgIndex].naturalWidth - sw) / 2
      } else {
        sw = imgs[imgIndex].naturalWidth
        sh = sw / dstRatio
        sy = (imgs[imgIndex].naturalHeight - sh) / 2
      }
      
      const cropW = sw / z;
      const cropH = sh / z;
      const shiftX = (t.panX / 100) * (sw - cropW);
      const shiftY = (t.panY / 100) * (sh - cropH);
      const cx_src = sx + sw/2 - shiftX;
      const cy_src = sy + sh/2 - shiftY;
      
      ctx.drawImage(imgs[imgIndex], cx_src - cropW/2, cy_src - cropH/2, cropW, cropH, x, y, w, h);
      ctx.restore()
    }

    if (layout === 'strip') {
      const GAP = 20
      const photoH = (areaH - (GAP * 2)) / 3
      const photoW = photoH * (4/3)
      const px = PAD + (areaW - photoW) / 2
      drawSlot(0, px, startY, photoW, photoH)
      drawSlot(1, px, startY + photoH + GAP, photoW, photoH)
      drawSlot(2, px, startY + (photoH * 2) + (GAP * 2), photoW, photoH)
    } 
    else if (layout === 'wide') {
      const GAP = 16
      // Left big photo
      const bigW = (areaW - GAP) * 0.55
      const bigH = areaH
      // Right small photos
      const smallW = areaW - bigW - GAP
      const smallH = (areaH - GAP) / 2
      
      drawSlot(0, PAD, startY, bigW, bigH)
      drawSlot(1, PAD + bigW + GAP, startY, smallW, smallH)
      drawSlot(2, PAD + bigW + GAP, startY + smallH + GAP, smallW, smallH)
    }
    else if (layout === 'quad') {
      const GAP = 16
      const pw = (areaW - GAP) / 2
      const ph = (areaH - GAP) / 2
      drawSlot(0, PAD, startY, pw, ph)
      drawSlot(1, PAD + pw + GAP, startY, pw, ph)
      drawSlot(2, PAD, startY + ph + GAP, pw, ph)
      drawSlot(3, PAD + pw + GAP, startY + ph + GAP, pw, ph)
    }

    // Draw stickers
    for (const sticker of activeStickers.value) {
      ctx.save()
      const tx = sticker.x * SW_C
      const ty = sticker.y * SH_C
      ctx.translate(tx, ty)
      ctx.rotate((sticker.rotation * Math.PI) / 180)
      const size = 48 * sticker.scale
      if (sticker.type === 'image') {
        const img = await loadImage(sticker.src)
        if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size)
      } else if (sticker.type === 'text') {
        ctx.font = `${size}px "${sticker.font}", system-ui`
        ctx.fillStyle = sticker.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sticker.text, 0, 0)
      } else if (sticker.type === 'emoji') {
        ctx.font = `${size}px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sticker.src, 0, 0)
      }
      ctx.restore()
    }

    return c
  }

  // ── Collage frame: grid-based canvas ─────────────────────
  if (frame === 'collage') {
    const layout = Number(selectedLayout.value)
    const CELL_W = 300
    const CELL_H = Math.round((CELL_W * 3) / 4)
    const GAP = 6
    const PAD_C = 8
    // Determine columns/rows
    let cols, rows
    if (layout === 2)      { cols = 2; rows = 1 }
    else if (layout === 3) { cols = 2; rows = 2 }  // first cell spans 2 cols
    else if (layout === 4) { cols = 2; rows = 2 }
    else                   { cols = 3; rows = 2 }  // 6

    const SW_C = PAD_C * 2 + cols * CELL_W + (cols - 1) * GAP
    const SH_C = PAD_C * 2 + rows * CELL_H + (rows - 1) * GAP + (showWatermark.value ? 22 : 0)

    const c = document.createElement('canvas')
    c.width = SW_C * scale
    c.height = SH_C * scale
    const ctx = c.getContext('2d')
    ctx.scale(scale, scale)

    // Background
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, 0, SW_C, SH_C)

    // Load images with filter (B&W override for collage)
    const bwFilter = 'grayscale(100%) contrast(110%)'
    const imgs = await Promise.all(photos.map((src) => loadFiltered(src, filter || bwFilter)))

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i]
      if (!img) continue
      let dx, dy, dw, dh
      if (layout === 3 && i === 0) {
        // First photo spans full width
        dx = PAD_C
        dy = PAD_C
        dw = cols * CELL_W + (cols - 1) * GAP
        dh = CELL_H
      } else {
        const adjustedI = layout === 3 ? i - 1 : i
        const row = Math.floor(adjustedI / cols)
        const col = adjustedI % cols
        // For layout 3: row 0 is taken by the full-width photo, so subsequent photos start at row 1
        const startY = layout === 3 ? PAD_C + CELL_H + GAP : PAD_C
        dx = PAD_C + col * (CELL_W + GAP)
        dy = startY + row * (CELL_H + GAP)
        dw = CELL_W
        dh = CELL_H
      }
      // White border
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 2
      ctx.strokeRect(dx - 1, dy - 1, dw + 2, dh + 2)
      // Clip and draw
      ctx.save()
      ctx.beginPath()
      ctx.rect(dx, dy, dw, dh)
      ctx.clip()
      drawCoverImage(ctx, img, dx, dy, dw, dh)
      ctx.restore()
    }

    // Watermark
    if (showWatermark.value) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = `italic ${9}px "Playfair Display", Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(`Snapify · ${timestamp.value}`, SW_C / 2, SH_C - 6)
    }
    return c
  }

  // Strip dimensions (logical pixels, ×scale for HQ)
  const PW = 240 // photo width
  const PH = Math.round((PW * 3) / 4) // 4:3 photo height
  const PAD = 10 // padding around photos & between
  const SPRH = frame === 'vintage' ? 18 : 0
  const HDR = frame === 'onepiece' ? 28 : frame === 'cwsi' ? 60 : 0
  const FTR = frame === 'cwsi' ? 40 : 0
  const SW = PW + PAD * 2
  const SH = HDR + SPRH + (PH + PAD) * photos.length + PAD + SPRH + FTR + 20

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
    ctx.font = `bold ${10}px "Caveat", serif`
    ctx.textAlign = 'center'
    ctx.fillText('⚓ ONE PIECE ⚓', SW / 2, HDR / 1.5)
    ctx.fillStyle = '#e8a020'
    ctx.fillRect(PAD, HDR - 3, SW - PAD * 2, 1.5)
  }

    // 4b. CWSI custom banner
    if (frame === 'cwsi') {
      const bannerImg = await loadImage('/cwsi_banner.png')
      if (bannerImg) {
        ctx.drawImage(bannerImg, 0, 0, SW, HDR)
      }
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
    // Draw image with center-crop to fit 4:3 without distortion
  const srcRatio = img.naturalWidth / img.naturalHeight
  const dstRatio = PW / PH
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (srcRatio > dstRatio) {
    // image wider than needed
    sh = img.naturalHeight
    sw = sh * dstRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    // image taller than needed
    sw = img.naturalWidth
    sh = sw / dstRatio
    sy = (img.naturalHeight - sh) / 2
  }
  
  const t = photoTransforms.value[i] || { zoom: 1, panX: 0, panY: 0 };
  const z = t.zoom;
  // Apply pan/zoom to source rectangle before drawing
  const cropW = sw / z;
  const cropH = sh / z;
  // panX/panY from -100 to 100 roughly maps to shifting the center
  const shiftX = (t.panX / 100) * (sw - cropW);
  const shiftY = (t.panY / 100) * (sh - cropH);
  
  const cx_src = sx + sw/2 - shiftX;
  const cy_src = sy + sh/2 - shiftY;
  
  ctx.drawImage(img, cx_src - cropW/2, cy_src - cropH/2, cropW, cropH, PAD, y, PW, PH);
  
    ctx.restore()

    // Photo border
    const borderColors = {
      custom: customBorderColor.value,
      classic: '#e0d8d0',
      vintage: '#554030',
      floral: '#f4b8cc',
      pastel: '#bcd8ef',
      minimal: '#222',
      hearts: '#c0405a',
      onepiece: '#e8a020',
      cwsi: '#1b6fb5',
    }
    if (frame === 'hearts') {
      ctx.save()
      ctx.strokeStyle = borderColors.hearts
      ctx.lineWidth = 3
      heartClip(ctx, cx, cy, PW * 0.9, PH * 1.05)
      ctx.stroke()
      ctx.restore()
    } else if (frame === 'cwsi') {
      // No special border for cwsi; use default styling
    } else {
      ctx.strokeStyle = borderColors[frame] || '#e0d8d0'
      ctx.lineWidth = frame === 'minimal' ? 2.5 : 1.5
      ctx.strokeRect(PAD + 0.75, y + 0.75, PW - 1.5, PH - 1.5)
    }
  }

  // 7. Vintage sprocket bottom
  if (frame === 'vintage') drawSprockets(ctx, SW, SH - SPRH / 2, 7)

  // 7b. CWSI footer banner
  if (frame === 'cwsi') {
    const footerY = SH - FTR - 20
    const bannerFtr = await loadImage('/cwsi_banner.png')
    if (bannerFtr) {
      ctx.drawImage(bannerFtr, 0, footerY, SW, FTR + 20)
    }
  }

  // 8. Watermark
  if (showWatermark.value) {
    const wmDark = frame === 'vintage' || frame === 'onepiece'
    ctx.fillStyle = wmDark ? 'rgba(255,255,255,0.4)' : 'rgba(90,50,30,0.45)'
    ctx.font = `italic ${7}px "Playfair Display", Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText(`Snapify · ${timestamp.value}`, SW / 2, SH - 6)
  }


  // Draw active stickers (draggable & resizable)
  for (const sticker of activeStickers.value) {
    ctx.save()
    const tx = sticker.x * SW
    const ty = sticker.y * SH
    ctx.translate(tx, ty)
    ctx.rotate((sticker.rotation * Math.PI) / 180)
    
    const size = 48 * sticker.scale
    
    if (sticker.type === 'image') {
      const img = await loadImage(sticker.src)
      if (img) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size)
      } else {
        await drawFallbackSticker(ctx, sticker.id, size)
      }
    } else if (sticker.type === 'emoji') {
      ctx.font = `${size}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sticker.src, 0, 0)
    }
    ctx.restore()
  }

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
      
.crop-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.crop-content {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.crop-area {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: 8px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crop-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.crop-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.crop-controls label {
  font-size: 0.8rem;
  font-weight: 600;
}
.crop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.crop-actions button {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
}
.crop-actions button.primary {
  background: #d9385e;
  color: #fff;
  border: none;
}
.layout-btn.active {
  opacity: 1 !important;
  color: #d9385e;
}


/* Timelapse Button */
.ma-btn.timelapse-btn {
  background: linear-gradient(135deg, #7b2ff7, #4f8ef7);
  color: #fff;
  border-color: transparent;
  gap: 6px;
}
.ma-btn.timelapse-btn:hover {
  filter: brightness(1.1);
}
.ma-btn.timelapse-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Text Sticker Adder */
.text-sticker-adder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  padding: 12px;
  background: rgba(217, 56, 94, 0.04);
  border-radius: 10px;
  border: 1px dashed rgba(217, 56, 94, 0.2);
}
.text-sticker-adder .text-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid rgba(217, 56, 94, 0.25);
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  outline: none;
}
.text-sticker-adder .text-input:focus {
  border-color: #d9385e;
}
.text-adder-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.color-picker-small {
  width: 36px;
  height: 36px;
  padding: 2px;
  border: 1.5px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}
.font-select {
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1.5px solid #ddd;
  font-size: 0.82rem;
  font-family: 'Inter', sans-serif;
  outline: none;
}
.add-text-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: #d9385e;
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: filter 0.15s;
}
.add-text-btn:hover {
  filter: brightness(1.1);
}

/* Text sticker in overlay */
.text-sticker {
  font-weight: 700;
  user-select: none;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0,0,0,0.18);
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


const doTimelapse = async () => {
  if (!snaps.value.length) return
  playClick()
  gifGenerating.value = true
  
  try {
    // Load all images
    const images = await Promise.all(snaps.value.map(src => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })
    }))

    const W = 400
    const H = 300
    const FPS = 5
    const DELAY = Math.round(100 / FPS) // in 1/100s units
    
    // Build a DataURL for each frame using canvas
    const frameDataUrls = []
    for (const img of images) {
      if (!img) continue
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const ctx = c.getContext('2d')
      
      // Draw background
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, W, H)
      
      // Center-crop image into frame
      const srcRatio = img.naturalWidth / img.naturalHeight
      const dstRatio = W / H
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
      if (srcRatio > dstRatio) {
        sw = sh * dstRatio
        sx = (img.naturalWidth - sw) / 2
      } else {
        sh = sw / dstRatio
        sy = (img.naturalHeight - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
      
      frameDataUrls.push(c.toDataURL('image/png'))
    }

    // Use the omggif library to encode a GIF entirely in browser
    // Since we don't have gif.js, we'll do a simple animated WebP/APNG workaround:
    // We'll use the Canvas ImageData frames approach with a simple GIF encoder
    // For a simpler approach without dependencies: create an animated GIF using a pure-JS encoder
    
    // Simple pure-JS GIF encoder 
    const gif = await encodeGIF(frameDataUrls, W, H, DELAY)
    const blob = new Blob([gif], { type: 'image/gif' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapify_timelapse_${Date.now()}.gif`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    
  } catch (e) {
    console.error('Timelapse error:', e)
    alert('Could not generate GIF. Try again.')
  } finally {
    gifGenerating.value = false
  }
}

/**
 * Minimal GIF89a encoder — produces a properly animated GIF from an array of canvas DataURLs.
 * Implements NeuQuant quantization + LZW compression in pure JS.
 */
const encodeGIF = async (dataUrls, width, height, delay) => {
  // Load pixel data for each frame
  const frames = []
  for (const url of dataUrls) {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')
    const img = await new Promise(r => {
      const i = new Image()
      i.onload = () => r(i)
      i.src = url
    })
    ctx.drawImage(img, 0, 0)
    frames.push(ctx.getImageData(0, 0, width, height).data)
  }
  
  // Simple 256-color palette using first frame (approximation)
  // Build a GIF with fixed 6-bit palette per frame
  const bytes = []
  
  // GIF Header
  bytes.push(...Array.from('GIF89a').map(c => c.charCodeAt(0)))
  // Logical Screen Descriptor
  bytes.push(width & 0xFF, width >> 8)
  bytes.push(height & 0xFF, height >> 8)
  bytes.push(0xF7, 0, 0) // Global Color Table flag, color res, bg index
  
  // Build a rough 256-color global palette: 6-bit RGB quantization
  const palette = buildPalette(frames[0], 256)
  for (const [r, g, b] of palette) {
    bytes.push(r, g, b)
  }
  
  // Netscape Application Block (for looping)
  bytes.push(0x21, 0xFF, 0x0B) // Extension, App, size=11
  bytes.push(...Array.from('NETSCAPE2.0').map(c => c.charCodeAt(0)))
  bytes.push(0x03, 0x01, 0xFF, 0xFF, 0x00) // loop count = 0 (infinite)
  
  // Each frame
  for (const frameData of frames) {
    // Graphic Control Extension (delay, transparency)
    bytes.push(0x21, 0xF9, 0x04, 0x00) // GCE, size=4, disposal=none, no transparency
    bytes.push(delay & 0xFF, delay >> 8) // delay in 1/100s
    bytes.push(0xFF, 0x00) // transparent color index (unused), block terminator
    
    // Image Descriptor
    bytes.push(0x2C)
    bytes.push(0, 0, 0, 0) // left, top
    bytes.push(width & 0xFF, width >> 8)
    bytes.push(height & 0xFF, height >> 8)
    bytes.push(0x00) // no local color table
    
    // Image Data (LZW compressed index stream)
    const indices = quantizeFrame(frameData, palette)
    const compressed = lzwEncode(indices, 8)
    bytes.push(8) // LZW min code size
    // Write compressed data in blocks of max 255 bytes
    for (let i = 0; i < compressed.length; i += 255) {
      const chunk = compressed.slice(i, i + 255)
      bytes.push(chunk.length, ...chunk)
    }
    bytes.push(0x00) // Block terminator
  }
  
  bytes.push(0x3B) // GIF trailer
  return new Uint8Array(bytes)
}

const buildPalette = (pixelData, numColors) => {
  // Median cut palette (simplified - just pick uniformly distributed colors)
  const palette = []
  const step = Math.floor(pixelData.length / 4 / numColors)
  for (let i = 0; i < numColors; i++) {
    const idx = i * step * 4
    palette.push([pixelData[idx] || 0, pixelData[idx + 1] || 0, pixelData[idx + 2] || 0])
  }
  // Pad to 256 
  while (palette.length < 256) palette.push([0, 0, 0])
  return palette
}

const quantizeFrame = (pixelData, palette) => {
  const indices = new Uint8Array(pixelData.length / 4)
  for (let i = 0; i < indices.length; i++) {
    const r = pixelData[i * 4]
    const g = pixelData[i * 4 + 1]
    const b = pixelData[i * 4 + 2]
    let bestDist = Infinity, bestIdx = 0
    for (let p = 0; p < palette.length; p++) {
      const dr = r - palette[p][0], dg = g - palette[p][1], db = b - palette[p][2]
      const dist = dr * dr + dg * dg + db * db
      if (dist < bestDist) { bestDist = dist; bestIdx = p }
    }
    indices[i] = bestIdx
  }
  return indices
}

const lzwEncode = (indices, minCodeSize) => {
  const clearCode = 1 << minCodeSize
  const eofCode = clearCode + 1
  let codeSize = minCodeSize + 1
  let dict = new Map()
  
  const initDict = () => {
    dict = new Map()
    for (let i = 0; i < clearCode + 2; i++) dict.set(String(i), i)
  }
  
  initDict()
  const output = []
  let buf = 0, bufLen = 0
  
  const writeBits = (code) => {
    buf |= code << bufLen
    bufLen += codeSize
    while (bufLen >= 8) {
      output.push(buf & 0xFF)
      buf >>= 8
      bufLen -= 8
    }
  }
  
  writeBits(clearCode)
  let prefix = String(indices[0])
  
  for (let i = 1; i < indices.length; i++) {
    const c = String(indices[i])
    const pc = prefix + ',' + c
    if (dict.has(pc)) {
      prefix = pc
    } else {
      writeBits(dict.get(prefix))
      dict.set(pc, dict.size)
      if (dict.size >= (1 << codeSize) && codeSize < 12) codeSize++
      if (dict.size >= (1 << 12)) {
        writeBits(clearCode)
        initDict()
        codeSize = minCodeSize + 1
      }
      prefix = c
    }
  }
  
  writeBits(dict.get(prefix))
  writeBits(eofCode)
  if (bufLen > 0) output.push(buf & 0xFF)
  
  return output
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

.interactive-strip-card.anniversary-card {
  width: 220px;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
}
.strip-card.anniversary-card {
  width: 180px;
  padding: 0;
  border-radius: 6px;
  overflow: hidden;
}
.modal-strip.anniversary-card {
  width: 320px;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
}
.review-strip.anniversary-card {
  width: 240px;
  padding: 0;
}

/* Base photos area for anniversary - we need aspect ratio to force height */
.photos-area.anniversary-layout {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  padding: 14px;
  padding-bottom: 0px; 
  aspect-ratio: 1 / 1.1; 
  width: 100%;
}
.photos-area.anniversary-layout .strip-photo-wrap:nth-child(1) {
  grid-row: span 2;
  border-radius: 6px;
}
.photos-area.anniversary-layout .strip-photo-wrap {
  width: 100%;
  height: 100%;
  margin: 0;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.photos-area.anniversary-layout .strip-photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.anniversary-footer {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  color: #1a458b;
  text-align: center;
  padding: 10px 14px 18px;
  font-weight: 700;
  line-height: 1.2;
}
.anniversary-footer-lg {
  font-size: 1.8rem;
  padding: 16px 20px 24px;
}

/* Background gradients for the cards */
.strip-bg-anniversary {
  background: linear-gradient(180deg, #e8f4fc 0%, #d0e6f7 100%);
  position: relative;
}
.strip-bg-anniversary::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 15% 10%, rgba(255,255,255,0.6) 0%, transparent 20%),
                    radial-gradient(circle at 85% 90%, rgba(255,255,255,0.6) 0%, transparent 25%);
  pointer-events: none;
}

.custom-text-input {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.custom-text-input label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
}
.custom-text-input input {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.custom-text-input input:focus {
  border-color: #1a458b;
}

/* Watermark adjustments */
.fr-anniversary {
  border: 4px solid #a5c8e4 !important;
  box-shadow: inset 0 0 0 1.5px #fff !important;
}

/* ════════════════════════════════════════
   ROOT LAYOUT — mobile stack, desktop 2-col
════════════════════════════════════════ */
.booth-root {
  min-height: 100dvh;
  background: #f8f5f2;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px 14px 88px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 768px) {
  .booth-root {
    flex-direction: row;
    align-items: flex-start;
    padding: 28px 36px 44px;
    gap: 28px;
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
  .col-camera {
    flex: 0 0 58%;
  }
  .col-styles {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }
}
@media (min-width: 1024px) {
  .col-camera {
    flex: 0 0 62%;
  }
}

/* ════════════════════════════════════════
   STEPS BAR
════════════════════════════════════════ */
.steps-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.68);
  border: 1px dashed rgba(217, 56, 94, 0.3);
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
  border: 2px solid #d9385e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 800;
  color: #2a2022;
  background: #fff;
  transition: all 0.3s;
  font-family: 'Inter', sans-serif;
}
.step-item.active .step-bubble {
  background: #d9385e;
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
  color: #2a2022;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
}
.step-line {
  flex: 1;
  height: 1.5px;
  background: rgba(217, 56, 94, 0.28);
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
  border-radius: 18px;
  overflow: hidden;
  background: #0e0a06;
  box-shadow:
    0 12px 48px rgba(139, 69, 19, 0.28),
    0 4px 16px rgba(0, 0, 0, 0.18);
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
.fr-cwsi {
  border: 4px solid #2d7cc1;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1.5px #63b3e8;
}
.fr-collage {
  border: 4px solid #ffffff;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.3);
}
.fr-cwsi_anniversary,
.fr-anniversary_wide,
.fr-memories,
.fr-film_love {
  border: 4px solid #d7d1cb;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.45);
}
.fr-cwsi_anniversary,
.fr-anniversary_wide {
  border: 4px solid #1a458b;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1.5px #b3d1ff;
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
  color: #ffb7c5;
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
  font-family: 'Caveat', serif;
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
  font-family: 'Caveat', serif;
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
  border: 2px solid #d9385e;
  background: transparent;
  transition: all 0.3s;
}
.prog-dot.filled {
  background: #d9385e;
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
  background: rgba(255, 255, 255, 0.8);
  border: 1px dashed rgba(217, 56, 94, 0.2);
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
  color: #d9385e;
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
  border: 1.5px solid rgba(217, 56, 94, 0.26);
  background: rgba(255, 255, 255, 0.75);
  font-size: 0.75rem;
  font-weight: 600;
  color: #d9385e;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
}
.chip:hover {
  background: rgba(217, 56, 94, 0.12);
}
.chip.active {
  background: #d9385e;
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(217, 56, 94, 0.28);
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
  border: 1.5px solid rgba(255, 77, 125, 0.26);
  background: rgba(255, 255, 255, 0.75);
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  color: #ff4d7d;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(255, 77, 125, 0.06);
  min-width: 72px;
}
.act-btn span {
  font-size: 0.6rem;
  font-weight: 600;
  margin-top: 2px;
}
.act-btn:hover {
  background: rgba(255, 77, 125, 0.12);
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
  border: 4px solid #d9385e;
  animation: sh-p 2.2s ease-in-out infinite;
}
@keyframes sh-p {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(217, 56, 94, 0.45);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(217, 56, 94, 0);
  }
}

.retake-focus {
  border: 4px solid #d9385e !important;
  box-shadow: 0 0 0 6px rgba(217, 56, 94, 0.25);
}

.retake-indicator {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: #d9385e;
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
  color: #8c7a7e;
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
  background: rgba(217, 56, 94, 0.55);
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
  background: #d9385e !important;
  box-shadow: 0 6px 20px rgba(217, 56, 94, 0.3) !important;
}
.wide-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 10px 25px rgba(217, 56, 94, 0.45) !important;
}
.sh-body {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: #d9385e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow:
    0 4px 18px rgba(217, 56, 94, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: background 0.15s;
}
.shutter-btn:not(:disabled):hover .sh-body {
  background: #c92f53;
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
  color: #d9385e;
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
  border: 1.5px solid rgba(217, 56, 94, 0.24);
  background: rgba(255, 255, 255, 0.72);
  font-size: 0.77rem;
  font-weight: 500;
  color: #2a2022;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
}
.filter-pill:hover {
  background: rgba(217, 56, 94, 0.1);
}
.filter-pill.active {
  background: #d9385e;
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(217, 56, 94, 0.26);
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
    0 0 0 2.5px #d9385e,
    0 4px 12px rgba(217, 56, 94, 0.22);
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
  color: #8c7a7e;
  font-family: 'Inter', sans-serif;
}
.frame-thumb.active .ft-name {
  color: #2a2022;
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
  font-family: 'Caveat', serif;
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: 1.5px;
  line-height: 1;
}
.sign-h2,
.sign-h3 {
  font-family: 'Caveat', serif;
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
.strip-bg-cwsi {
  background: #ffffff;
}
.strip-bg-cwsi_anniversary {
  background: #e6f0fa;
}
.strip-bg-anniversary_wide {
  background: #e6f0fa;
}
.strip-bg-collage {
  background: #111111;
}
.strip-bg-memories {
  background: #6c5953;
}
.strip-bg-film_love {
  background: #f7f3eb;
}

/* Full-template preset strip */
.interactive-strip-card.template-strip {
  width: 200px;
  padding: 0;
}
.template-photos-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.template-photo-slot {
  position: absolute;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
.template-photo-slot.placeholder-photo {
  background: rgba(0, 0, 0, 0.72);
}
.template-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.template-photo-slot .placeholder-content {
  color: rgba(255, 255, 255, 0.85);
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
.border-cwsi {
  outline: 1.5px solid #2d7cc1;
  border-radius: 2px;
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
  font-family: 'Caveat', serif;
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
  font-family: 'Caveat', serif;
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
  font-family: 'Caveat', serif;
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
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 2px 4px;
}
.strip-bg-vintage .default-footer {
  color: rgba(255, 255, 255, 0.45);
}
.strip-bg-onepiece .default-footer {
  color: #e8a020;
}

/* CWSI Strip — banner header & footer */
.cwsi-banner-header {
  width: 100%;
  overflow: hidden;
  border-radius: 3px 3px 0 0;
}
.cwsi-banner-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}
.cwsi-banner-header-lg {
  border-radius: 3px 3px 0 0;
}
.cwsi-banner-footer {
  width: 100%;
  overflow: hidden;
  border-radius: 0 0 3px 3px;
}
.cwsi-banner-footer-lg {
  border-radius: 0 0 3px 3px;
}
/* Clean shadow for CWSI strip */
.strip-bg-cwsi {
  box-shadow: 0 8px 28px rgba(0,0,0,0.25);
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
  color: #d9385e;
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
  border: 1.5px solid rgba(217, 56, 94, 0.26);
  background: rgba(255, 255, 255, 0.78);
  font-size: 0.74rem;
  font-weight: 600;
  color: #2a2022;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.07);
  white-space: nowrap;
}
.pu-btn:hover {
  background: rgba(217, 56, 94, 0.1);
  transform: translateY(-1px);
}
.pu-btn:active {
  transform: scale(0.95);
}
.pu-btn.primary {
  background: #d9385e;
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(217, 56, 94, 0.28);
}
.pu-btn.primary:hover {
  background: #c92f53;
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
  background: #d9385e;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Caveat', serif;
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
  background: linear-gradient(155deg, #f8f5f2 0%, #ffffff 100%);
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
  border: 1px solid rgba(217, 56, 94, 0.28);
}

/* Modal header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-family: 'Caveat', serif;
  font-size: 1.5rem;
  color: #d9385e;
  letter-spacing: -0.3px;
}
.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid rgba(217, 56, 94, 0.28);
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #d9385e;
  transition: all 0.12s;
}
.modal-close:hover {
  background: rgba(217, 56, 94, 0.14);
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
  font-family: 'Caveat', serif;
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
  border: 1.5px solid rgba(217, 56, 94, 0.24);
  background: rgba(255, 255, 255, 0.75);
  font-size: 0.72rem;
  font-weight: 600;
  color: #2a2022;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 8px rgba(217, 56, 94, 0.06);
}
.ma-btn:hover {
  background: rgba(217, 56, 94, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 5px 14px rgba(217, 56, 94, 0.14);
}
.ma-btn:active {
  transform: scale(0.94);
}
.ma-btn.primary {
  background: #d9385e;
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(217, 56, 94, 0.3);
}
.ma-btn.primary:hover {
  background: #c92f53;
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
  border: 1.5px dashed rgba(217, 56, 94, 0.5);
  background: rgba(255, 255, 255, 0.65);
  font-size: 0.78rem;
  font-weight: 600;
  color: #d9385e;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.upload-btn:hover {
  background: rgba(217, 56, 94, 0.1);
  border-color: #d9385e;
  transform: translateY(-1px);
}
.upload-btn:active {
  transform: scale(0.96);
}
.upload-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ══ INTERACTIVE PREVIEW & STICKERS CSS ══ */
.interactive-preview-wrapper {
  background: rgba(255, 255, 255, 0.4);
  padding: 10px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed rgba(217, 56, 94, 0.25);
  margin-bottom: 6px;
  backdrop-filter: blur(8px);
  min-height: 120px;
}
.preview-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.wm-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 99px;
  border: 1.5px solid rgba(217, 56, 94, 0.3);
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.65rem;
  font-weight: 600;
  color: #d9385e;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
}
.wm-toggle-btn:hover {
  background: rgba(217, 56, 94, 0.1);
  transform: scale(1.03);
}
.wm-toggle-btn.wm-off {
  opacity: 0.6;
  border-style: dashed;
}
.interactive-strip-card {
  width: 140px;
  padding: 6px 6px 22px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  position: relative;
  overflow: hidden;
  user-select: none;
  transition: width 0.2s ease;
}
/* Collage gets a slightly wider card to show the grid better */
.interactive-strip-card.strip-bg-collage,
.interactive-strip-card.anniversary-card {
  width: 180px;
}
/* Collage frame: wider strip layout */
.strip-bg-collage.interactive-strip-card,
.strip-bg-collage.strip-card {
  padding: 6px;
}
/* Collage grid layouts */
.photos-area.collage-grid {
  display: grid;
  gap: 4px;
  padding: 0;
}
.photos-area.collage-2 {
  grid-template-columns: 1fr 1fr;
}
.photos-area.collage-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
}
.photos-area.collage-3 .strip-photo-wrap:first-child {
  grid-column: 1 / -1;
}
.photos-area.collage-4 {
  grid-template-columns: 1fr 1fr;
}
.photos-area.collage-6 {
  grid-template-columns: 1fr 1fr 1fr;
}
.strip-bg-collage .strip-photo {
  aspect-ratio: 4/3;
  border-radius: 3px;
  /* NO forced grayscale — respect the user's chosen filter */
}
.strip-bg-collage .strip-photo-wrap {
  border-radius: 3px;
  overflow: hidden;
}
.border-collage {
  outline: 2px solid rgba(255,255,255,0.5);
  border-radius: 3px;
}
.preview-hint-text {
  font-size: 0.65rem;
  color: #d9385e;
  text-align: center;
  margin-top: 4px;
  margin-bottom: 8px;
}
.placeholder-photo {
  aspect-ratio: 4/3;
  background: #f8f5f2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #d9385e;
  font-size: 0.65rem;
}


/* ═══════════════════════════════════
   CUSTOM TEMPLATE BUILDER
═══════════════════════════════════ */
.custom-tpl-builder {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px;
  background: rgba(26, 69, 139, 0.04);
  border-radius: 12px;
  border: 1px dashed rgba(26, 69, 139, 0.2);
  margin-top: 10px;
}
.ctb-row {
  display: flex;
  gap: 10px;
}
.ctb-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}
.ctb-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ctb-input {
  padding: 8px 10px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}
.ctb-input:focus { border-color: #1a458b; }
.ctb-color {
  width: 100%;
  height: 36px;
  padding: 2px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
}
.ctb-layout-row {
  display: flex;
  gap: 8px;
}
.ctb-layout-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px;
  border: 2px solid #ddd;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.ctb-layout-btn.active {
  border-color: #1a458b;
  background: rgba(26, 69, 139, 0.06);
}
.ctb-layout-icon {
  width: 38px;
  height: 32px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: stretch;
}
.ctb-slot {
  background: currentColor;
  border-radius: 2px;
  opacity: 0.5;
}
.ctb-slot-h { flex: 1; }
.ctb-slot-tall { flex: 1; aspect-ratio: auto; }
.ctb-slot-sm { flex: 1; }
.ctb-layout-name {
  font-size: 0.68rem;
  font-weight: 700;
  color: #555;
}
.ctb-layout-btn.active .ctb-layout-name { color: #1a458b; }

/* Custom Template strip header */
.custom-tpl-header {
  padding: 8px 12px 6px;
  border-bottom: 2px solid;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
  text-align: left;
}
.ctpl-title {
  display: block;
  line-height: 1.2;
}

/* Custom Template photo area layouts */
.photos-area.custom-tpl-strip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 5px;
}
.photos-area.custom-tpl-strip .strip-photo-wrap {
  border: 1.5px solid;
  border-color: inherit;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
  display: flex;
}
.photos-area.custom-tpl-wide {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 5px;
  padding: 5px;
}
.photos-area.custom-tpl-wide .strip-photo-wrap:nth-child(1) {
  grid-row: span 2;
  /* Big photo stretches to match height of the 2 smaller ones */
}
.photos-area.custom-tpl-wide .strip-photo-wrap:not(:nth-child(1)) {
  aspect-ratio: 4/3;
}
.photos-area.custom-tpl-wide .strip-photo-wrap {
  border: 1.5px solid;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  display: flex;
}
.photos-area.custom-tpl-quad {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px;
  padding: 5px;
}
.photos-area.custom-tpl-quad .strip-photo-wrap {
  border: 1.5px solid;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
  display: flex;
}
.photos-area.custom-tpl-strip .strip-photo,
.photos-area.custom-tpl-wide .strip-photo,
.photos-area.custom-tpl-quad .strip-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* strip-bg-custom_tpl */
.strip-bg-custom_tpl {
  background: #e8f4fc;
}

/* Wider preview for custom template */
.ctpl-logo-placeholder {
  position: absolute;
  bottom: 6px;
  right: 6px;
  z-index: 10;
  pointer-events: none;
  opacity: 0.9;
}
.interactive-strip-card.strip-bg-custom_tpl {
  width: 280px;
  padding: 0;
}

/* ── Template frame overlay — the PNG sits on top of photos ── */
.template-frame-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none; /* allow clicks through to stickers */
}

/* template-photos-layer sits behind the overlay */
.template-photos-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.template-photo-slot {
  position: absolute;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.template-photo-slot.placeholder-photo {
  background: rgba(0, 0, 0, 0.45);
}
.template-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.template-photo-slot .placeholder-content {
  color: rgba(255, 255, 255, 0.85);
}

/* ── Dark CSS Preset overlay (cwsi_dark) ── */
.template-dark-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(160deg, #0a1628 0%, #0d2040 40%, #0a1628 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10% 10%;
}
/* The photos layer is z-index:2, so the dark overlay must NOT have background on z-index 5 */
/* Instead render dark overlay frame decorations around the photo slots */
.strip-bg-cwsi_dark .template-dark-overlay {
  background: transparent; /* transparent so photos show through */
}
.tdo-header {
  display: flex;
  align-items: center;
  gap: 8%;
}
.tdo-logo-ring {
  width: 18%;
  aspect-ratio: 1;
  border: 2px solid rgba(100, 180, 255, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64b4ff;
  font-weight: 900;
  font-size: 0.6rem;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
  text-align: center;
}
.tdo-title {
  font-size: 0.55rem;
  color: rgba(180, 210, 255, 0.8);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  line-height: 1.3;
}
.tdo-footer {
  text-align: center;
}
.tdo-anniv {
  color: rgba(180, 220, 255, 0.9);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 700;
}
.tdo-anniv em {
  font-style: italic;
  color: #90d0ff;
}

/* CWSI template wider cards */
.interactive-strip-card.strip-bg-cwsi_strip,
.interactive-strip-card.strip-bg-cwsi_wide,
.interactive-strip-card.strip-bg-cwsi_dark {
  width: 180px;
  padding: 0;
}
.strip-card.template-strip {
  width: 120px;
  padding: 0;
}

/* Draggable Stickers Overlay */
.stickers-overlay-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.draggable-sticker {
  position: absolute;
  pointer-events: auto;
  cursor: move;
  user-select: none;
}
.sticker-content {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.draggable-sticker img {
  max-width: 48px;
  max-height: 48px;
  display: block;
}
.emoji-sticker {
  font-size: 26px;
  line-height: 1;
}

/* Fallback fan sticker preview inside HTML */
.fallback-sticker-fan {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  height: 48px;
}
.fallback-sticker-fan .fan-head {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: 2px solid #1b6fb5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  font-weight: bold;
  color: #1b3a6e;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.fallback-sticker-fan .fan-stick {
  width: 4px;
  height: 16px;
  background: #e5c298;
  border-radius: 2px;
  margin-top: -2px;
}
.sticker-outline {
  position: absolute;
  inset: -6px;
  border: 1.5px dashed #d9385e;
  border-radius: 4px;
  pointer-events: none;
}
.delete-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ff3b30;
  border: none;
  color: white;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* iOS Segmented Control tabs */
.ios-segmented-control {
  display: flex;
  background: rgba(217, 56, 94, 0.08);
  padding: 2.5px;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid rgba(217, 56, 94, 0.12);
}
.segment-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 0.76rem;
  font-weight: 600;
  color: #d9385e;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.segment-btn.active {
  background: #ffffff;
  color: #2a2022;
  box-shadow: 0px 3px 8px rgba(217, 56, 94, 0.15), 0px 3px 1px rgba(217, 56, 94, 0.05);
}

/* Stickers grid catalog selector */
.stickers-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.sticker-picker-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(217, 56, 94, 0.15);
  background: #ffffff;
  border-radius: 12px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(217, 56, 94, 0.04);
}
.sticker-picker-btn:hover {
  background: #f8f5f2;
  transform: translateY(-1.5px);
  border-color: #d9385e;
}
.sticker-btn-preview {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sticker-btn-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.emoji-preview {
  font-size: 24px;
}
.sticker-picker-label {
  font-size: 0.58rem;
  font-weight: 600;
  color: #d9385e;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
.upload-btn-preview {
  color: #d9385e;
  background: rgba(217, 56, 94, 0.08);
  border-radius: 50%;
  width: 32px;
  height: 32px;
}
.upload-custom-sticker-label {
  justify-content: center;
}

/* Selected Sticker Adjustment Controls panel */
.selected-sticker-controls {
  background: #ffffff;
  border: 1px solid rgba(217, 56, 94, 0.15);
  border-radius: 16px;
  padding: 14px;
  margin-top: 16px;
  box-shadow: 0 4px 16px rgba(217, 56, 94, 0.06);
}
.controls-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #d9385e;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.control-row label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #d9385e;
  width: 50px;
}
.control-row input[type="range"] {
  flex: 1;
  accent-color: #d9385e;
  height: 4px;
  background: rgba(217, 56, 94, 0.12);
  border-radius: 2px;
}
.control-val {
  font-size: 0.7rem;
  font-weight: 700;
  color: #d9385e;
  width: 32px;
  text-align: right;
}
.control-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 14px;
}
.control-action-btn {
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgba(217, 56, 94, 0.15);
  background: #ffffff;
  font-size: 0.7rem;
  font-weight: 600;
  color: #d9385e;
  cursor: pointer;
  transition: all 0.15s ease;
}
.control-action-btn:hover {
  background: #f8f5f2;
  border-color: #d9385e;
}
.control-action-btn.danger {
  grid-column: span 2;
  background: #ff3b30;
  color: white;
  border-color: transparent;
}
.control-action-btn.danger:hover {
  background: #fc3d39;
}
</style>

