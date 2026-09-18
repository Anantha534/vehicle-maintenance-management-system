/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#dfede4',
          200: '#c1dbc9',
          300: '#98c1a7',
          400: '#6ea382',
          500: '#4a8563',
          600: '#386a4d',
          700: '#2d543e',
          800: '#254433',
          900: '#1e3a2b',
          950: '#112219',
        },
        cream: {
          50: '#faf9f6',
          100: '#f4f3ef',
          200: '#e8e6df',
          300: '#d7d4c8',
        },
        charcoal: {
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
