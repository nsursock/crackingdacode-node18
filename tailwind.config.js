module.exports = {
  content: ['./src/**/*.{njk,html,js,md,twig,svg}'],
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-debug-screens'),
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
    },
    debugScreens: {
      position: ['bottom', 'right'],
    },
    extend: {
      fontFamily: {
        website: ['Aldrich', 'sans-serif'],
      },
    },
  },
}
