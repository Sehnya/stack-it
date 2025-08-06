/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.{html,js}',
    './static/**/*.{html,js}',
    './node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        scroll: 'scroll 60s linear infinite',
      },
      colors: {
        'coral': 'oklch(0.7039 0.1182 33.75)',
        'deep-orange': 'oklch(0.6124 0.1808 36.09)',
        'light-orange': '#EA9936',
        'deep-teal': '#397877',
        'teal-reg': '#4F9593',
      },
    },
  },
  plugins: [
      require(
          'flowbite/plugin',
          'flowbite/typography',
          '@tailwindcss/typography',
          )],
}
