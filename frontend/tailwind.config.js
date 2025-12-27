/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a1a1a',
          hover: '#2a2a2a',
          active: '#ffffff',
          text: '#9ca3af',
          textActive: '#1a1a1a',
        }
      }
    },
  },
  plugins: [],
}
