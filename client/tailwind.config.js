/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bus: '#2563eb',
        cantine: '#ea580c',
        garderie: '#7c3aed',
        recreation: '#16a34a',
        classe: '#4f46e5',
        parent: '#374151'
      }
    }
  },
  plugins: []
};
