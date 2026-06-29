import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        red: {
          650: '#ef4444', // Premium red
          655: '#e03a3a',
          750: '#dc2626', // Darker red on hover
          755: '#c21d1d',
        },
        slate: {
          150: '#f1f5f9', // Intermediate gray
          250: '#e2e8f0',
          350: '#cbd5e1',
          450: '#94a3b8',
          550: '#64748b',
          650: '#475569',
          750: '#334155',
          805: '#1e293b',
          850: '#1e293b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
