/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        paper: {
          tissue: '#0284c7', // Sky / Cyan blue for Tissue
          cutting: '#ea580c', // Orange / Amber for Cutting & News
        }
      }
    },
  },
  plugins: [],
}
