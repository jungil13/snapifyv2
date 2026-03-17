<template>
  <div class="faq-page">
    <div class="content-card">
      <div class="card-header">
        <HelpCircleIcon class="header-icon" :size="32" />
        <h1 class="title">Frequently Asked Questions</h1>
        <p class="subtitle">Everything you need to know about Snapify.</p>
      </div>

      <div class="card-body">
        <div class="faq-list">
          <div
            v-for="(item, index) in faqs"
            :key="index"
            class="faq-item"
            :class="{ active: activeIndex === index }"
          >
            <button class="faq-question" @click="toggleFAQ(index)">
              <span>{{ item.question }}</span>
              <ChevronDownIcon
                class="chevron-icon"
                :size="18"
                :class="{ rotated: activeIndex === index }"
              />
            </button>
            <transition name="expand">
              <div v-show="activeIndex === index" class="faq-answer">
                <p>{{ item.answer }}</p>
              </div>
            </transition>
          </div>
        </div>

        <footer class="card-footer">
          <p class="contact-label">Still have questions?</p>
          <a href="mailto:support@snapify.com" class="contact-link">
            <MailIcon :size="16" />
            <span>Contact Support</span>
          </a>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { HelpCircleIcon, ChevronDownIcon, MailIcon } from 'lucide-vue-next'

const activeIndex = ref(0) // Open the first one by default

const faqs = [
  {
    question: 'How do I take a photo?',
    answer:
      "Getting started is easy! Click 'Open Camera' in the Booth, choose your favorite frame and filter, then hit the big Shutter button. Our timer will give you a few seconds to pose!",
  },
  {
    question: 'How do I apply filters?',
    answer:
      "You can apply filters anytime before or after taking your photos. Simply scroll through the 'Filter' pills in the Booth to see a live preview on the camera or on your captured snaps.",
  },
  {
    question: 'Can I change the strip layout?',
    answer:
      "Yes! Use the 'Photos' chip selector to choose between 2, 3, 4, or 6 snaps. This determines how many pictures will appear on your final photostrip.",
  },
  {
    question: 'How do I download or print my strip?',
    answer:
      "After the development animation finishes, click 'Pick Up Your Strip!'. A high-quality preview will appear where you can find 'Save HD' and 'Print' buttons.",
  },
  {
    question: 'What is the One Piece theme?',
    answer:
      "It's our special limited-edition frame! It features a navy and gold nautical design, One Piece character badges, and anchor icons. Perfect for fans of the high seas!",
  },
  {
    question: 'Can I use my own photos?',
    answer:
      "Absolutely! If you don't want to use the camera, look for the 'Upload Photos' option below the camera controls. You can select multiple images from your device to create a strip.",
  },
]

const toggleFAQ = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index
}
</script>

<style scoped>
.faq-page {
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
  max-width: 650px;
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
  font-size: 2rem;
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
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  border: 1px solid rgba(194, 130, 90, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fffcf9;
}

.faq-item.active {
  background: white;
  border-color: rgba(194, 130, 90, 0.3);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.05);
}

.faq-question {
  width: 100%;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  color: #7a4020;
  font-size: 1rem;
}

.chevron-icon {
  color: #c2825a;
  transition: transform 0.3s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 20px 20px;
  color: #5a4030;
  line-height: 1.6;
  font-size: 0.95rem;
}

.card-footer {
  margin-top: 30px;
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

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 200px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 640px) {
  .title {
    font-size: 1.75rem;
  }
}
</style>
