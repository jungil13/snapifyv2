<template>
    <div class="bg-white text-gray-900 min-h-screen mt-16">
      <div class="max-w-6xl mx-auto p-6 space-y-8">
        <h1 class="text-4xl font-semibold text-center text-blue-600">About Snapify</h1>
        
        <div class="flex flex-col md:flex-row gap-8">
          <div class="flex-1">
            <h2 class="text-2xl font-semibold text-blue-600">What is Snapify?</h2>
            <p class="text-gray-700 mt-4">
              Snapify is a fun and cozy photobooth-style app that lets you capture moments with customizable photo strips. Whether you want to take a few snaps with friends or add some quirky filters, Snapify gives you all the tools to make your memories unforgettable.
            </p>
  
            <p class="text-gray-700 mt-4">
              Choose from multiple photo layouts, apply unique filters, and download or share your photo strips with ease! It's designed to be simple, intuitive, and fun for everyone.
            </p>
          </div>
  
          <div class="flex-1">
            <h2 class="text-2xl font-semibold text-blue-600">Features</h2>
            <ul class="list-disc list-inside text-gray-700 mt-4">
              <li>Capture multiple photos with customizable layouts (2, 3, 4, or 6 photos).</li>
              <li>Apply creative filters like grayscale, sepia, or high contrast.</li>
              <li>Preview your photo strip and customize it before saving or sharing.</li>
              <li>Share your strips directly to Facebook, Instagram, or download them.</li>
              <li>Enjoy a cozy, user-friendly design with responsive features across all devices.</li>
            </ul>
          </div>
        </div>
  
        <div class="mt-12">
          <h2 class="text-2xl font-semibold text-blue-600">Get in Touch</h2>
          <p class="text-gray-700 mt-4">
            Have any questions, suggestions, or feedback? Feel free to reach out to us!
          </p>
          <p class="text-gray-700 mt-4">
            Email us at: <span class="font-semibold text-blue-600">support@snapify.com</span>
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // Script can remain empty if you don't need any dynamic content
  </script>
  
  <style scoped>
  /* Tailwind styles for responsive layout and typography */
  .bg-white {
    background-color: #ffffff;
  }
  .text-gray-900 {
    color: #1a202c;
  }
  .text-blue-600 {
    color: #3b82f6;
  }
  .text-gray-700 {
    color: #4a5568;
  }
  
  .max-w-6xl {
    max-width: 72rem;
  }
  .min-h-screen {
    min-height: 100vh;
  }
  
  .p-6 {
    padding: 1.5rem;
  }
  
  .space-y-8 {
    margin-bottom: 2rem;
  }
  
  .text-center {
    text-align: center;
  }
  
  .text-4xl {
    font-size: 2.25rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .font-semibold {
    font-weight: 600;
  }
  
  .md\:flex-row {
    flex-direction: row;
  }
  
  .flex-1 {
    flex: 1;
  }
  
  .list-disc {
    list-style-type: disc;
  }
  
  .list-inside {
    list-style-position: inside;
  }
  
  .mt-4 {
    margin-top: 1rem;
  }
  
  .mt-12 {
    margin-top: 3rem;
  }
  </style>
  