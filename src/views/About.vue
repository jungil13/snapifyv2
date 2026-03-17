<template>
  <div class="about-page">
    <div class="content-card">
      <div class="card-header">
        <SparklesIcon class="header-icon" :size="32" />
        <h1 class="title">About Snapify</h1>
        <p class="subtitle">Capturing cozy moments, one strip at a time.</p>
      </div>

      <div class="card-body">
        <section class="info-section">
          <h2 class="section-title">What is Snapify?</h2>
          <p class="text">
            Snapify is your personal, vintage-inspired photobooth designed to bring back the charm
            of film strips. We believe that memories are best preserved in simple, beautiful layouts
            that feel warm and personal.
          </p>
          <p class="text">
            Whether you're using our mobile-friendly camera or uploading your own favorite photos,
            Snapify makes it effortless to create aesthetic photo strips with just a few clicks.
          </p>
        </section>

        <section class="info-section">
          <h2 class="section-title">Key Features</h2>
          <div class="features-grid">
            <div class="feature-item">
              <CameraIcon class="feature-icon" :size="20" />
              <span>Multiple Layouts (2-6 photos)</span>
            </div>
            <div class="feature-item">
              <SlidersHorizontalIcon class="feature-icon" :size="20" />
              <span>Vintage & Artistic Filters</span>
            </div>
            <div class="feature-item">
              <FrameIcon class="feature-icon" :size="20" />
              <span>Custom Frame Backgrounds</span>
            </div>
            <div class="feature-item">
              <PrinterIcon class="feature-icon" :size="20" />
              <span>HQ Downloads & Prints</span>
            </div>
          </div>
        </section>

        <section class="info-section">
          <h2 class="section-title">The "Nakama" Spirit</h2>
          <p class="text">
            For those who seek adventure, don't miss our exclusive <strong>One Piece</strong> theme!
            Join the crew and customize your strips with pirate-inspired badges and gold accents.
          </p>
        </section>

        <footer class="card-footer">
          <p class="contact-label">Want to say hi?</p>
          <a href="mailto:support@snapify.com" class="contact-link">
            <MailIcon :size="16" />
            <span>support@snapify.com</span>
          </a>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  SparklesIcon,
  CameraIcon,
  SlidersHorizontalIcon,
  FrameIcon,
  PrinterIcon,
  MailIcon,
} from 'lucide-vue-next'
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: #fdf6f0;
  background-image: radial-gradient(#d9c5b2 0.5px, transparent 0.5px);
  background-size: 20px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px 100px;
  font-family: 'Inter', sans-serif;
}

.content-card {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(194, 130, 90, 0.15);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #fffcf9 0%, #f7e9dd 100%);
  padding: 40px 30px;
  text-align: center;
  border-bottom: 1px solid rgba(194, 130, 90, 0.1);
}

.header-icon {
  color: #c2825a;
  margin-bottom: 16px;
}

.title {
  font-family: 'DM Serif Display', serif;
  font-size: 2.5rem;
  color: #6b2e0e;
  margin-bottom: 8px;
}

.subtitle {
  color: #a07060;
  font-style: italic;
  font-family: 'Playfair Display', serif;
}

.card-body {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem;
  color: #8b4513;
  display: flex;
  align-items: center;
  gap: 10px;
}

.text {
  color: #5a4030;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fffcf9;
  border: 1px solid rgba(194, 130, 90, 0.1);
  border-radius: 12px;
  color: #7a4020;
  font-size: 0.9rem;
  font-weight: 500;
}

.feature-icon {
  color: #c2825a;
}

.card-footer {
  margin-top: 10px;
  padding-top: 25px;
  border-top: 1px dashed rgba(194, 130, 90, 0.2);
  text-align: center;
}

.contact-label {
  font-size: 0.85rem;
  color: #a07060;
  margin-bottom: 8px;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #c2825a;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.contact-link:hover {
  color: #8b4513;
}

@media (max-width: 640px) {
  .title {
    font-size: 2rem;
  }
}
</style>
