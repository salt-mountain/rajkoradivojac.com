/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#8B6914',
        accent: '#6B4F10',
        honey: {
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE699',
          300: '#FFD966',
          400: '#FFCC33',
          500: '#F5B800',
          600: '#D4A017',
          700: '#B8860B',
          800: '#8B6914',
          900: '#5C4A1E',
        },
        dark: {
          900: '#2C1A00',
          800: '#3D2600',
          700: '#4E3200',
          600: '#5C4A1E',
          500: '#7A6530',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
