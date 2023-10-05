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
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        popin: 'popin 1s',
        swing: 'swing 1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both',
        jello: 'jello 1s ease 0s 1 normal forwards',
        random: 'random 2s ease 0s 1 normal forwards',
        show: 'show 0.7s',
        flip: 'flip 0.5s linear both',
        tilt: 'tilt 10s infinite linear'
      },

      keyframes: {
        tilt: {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)'
          },
          '25%': {
            transform: 'rotate(1deg)'
          },
          '75%': {
            transform: 'rotate(-1deg)'
          }
        },

        flip: {
          '0%': {
            transform: 'scale(1) rotateY(0)',
          },
          '50%': {
            transform: 'scale(2.5) rotateY(180deg)',
          },
          '100%': {
            transform: 'scale(1) rotateY(0)',
          },
        },

        show: {
          '0%, 49.99%': { opacity: 0, 'z-index': 10 },
          '50%, 100%': { opacity: 1, 'z-index': 50 },
        },
        random: {
          '0%, 100%': {
            transform: 'scale3d(1, 1, 1)',
          },
          '25%': {
            transform: `scale3d(${Math.random().toFixed(2) + 1}, ${
              Math.random().toFixed(2) + 1
            }, ${Math.random().toFixed(2)}+1)`,
          },
          '50%': {
            transform: `scale3d(${Math.random().toFixed(
              2
            )}, ${Math.random().toFixed(2)}, ${Math.random().toFixed(2)})`,
          },
          '75%': {
            transform: `scale3d(${Math.random().toFixed(2) + 1}, ${
              Math.random().toFixed(2) + 1
            }, ${Math.random().toFixed(2) + 1})`,
          },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        jello: {
          '0%': {
            transform: 'scale3d(1, 1, 1)',
          },
          '30%': {
            transform: 'scale3d(1.25, 0.75, 1)',
          },
          '40%': {
            transform: 'scale3d(0.75, 1.25, 1)',
          },
          '50%': {
            transform: 'scale3d(1.15, 0.85, 1)',
          },
          '65%': {
            transform: 'scale3d(0.95, 1.05, 1)',
          },
          '75%': {
            transform: 'scale3d(1.05, 0.95, 1)',
          },
          '100%': {
            transform: 'scale3d(1, 1, 1)',
          },
        },
        swing: {
          '0%': {
            transform: 'rotateX(180deg)',
            transformOrigin: 'top',
          },
          '100%': {
            transform: 'rotateX(0)',
            transformOrigin: 'top',
          },
        },
        popin: {
          '0%': {
            transform: 'scale3d(0, 0, 0)',
            opacity: 0,
          },
          '20%': {
            opacity: 1,
          },
          '40%': {
            transitionTimingFunction: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
            transform: 'scale3d(1.08, 1.08, 1.08)',
          },
          '60%': {
            transitionTimingFunction: 'cubic-bezier(0.42, 0, 0.58, 1)',
            transform: 'scale3d(1, 1, 1)',
          },
          '80%': {
            transitionTimingFunction: 'cubic-bezier(0.42, 0, 0.58, 1)',
            transform: 'scale3d(1.03, 1.03, 1.03)',
          },
          '100%': {
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transform: 'scale3d(1, 1, 1)',
          },
        },
      },
    },
  },
}
