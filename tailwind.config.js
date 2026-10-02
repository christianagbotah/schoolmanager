/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./application/views/**/*.php",
    "./assets/**/*.{js,html}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
  safelist: [
    // Core sizing and spacing
    'text-xl', 'text-2xl', 'text-base',
    'px-4', 'py-5', 'px-6', 'py-4', 'px-10',
    'mb-2.5', 'gap-5',
    // Borders and backgrounds
    'border-2', 'border-blue-500',
    'bg-white', 'bg-gradient-to-r', 'from-blue-600', 'to-blue-700',
    // Typography
    'font-bold', 'font-semibold', 'font-medium',
    // Colors
    'text-gray-700', 'text-gray-600', 'text-white', 'text-blue-600',
    // Focus states
    'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500',
    // Grid and layout
    'md:grid-cols-2',
    // Utilities
    'border-b-2', 'rounded-lg', 'rounded-full', 'shadow-md'
  ]
}
