/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { 
            opacity: 1,
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
          },
          '50%': { 
            opacity: 0.9, 
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)'
          },
        },
      },
    },
  },
  plugins: [],
}
