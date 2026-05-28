/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#F5F5F7',
        surface:  '#FFFFFF',
        surface2: '#F5F5F7',
        offset:   '#F2F2F7',
        t1:       '#1C1C1E',
        t2:       '#3C3C43',
        t3:       '#8E8E93',
        t4:       '#C7C7CC',
        primary:  '#007AFF',
        green:    '#34C759',
        greensoft:'rgba(52,199,89,0.12)',
        greentext:'#248A3D',
        red:      '#FF3B30',
        redsoft:  'rgba(255,59,48,0.10)',
        redtext:  '#C0392B',
        amber:    '#FF9500',
        ambersoft:'rgba(255,149,0,0.10)',
        ambertext:'#C05E00',
        border:   'rgba(60,60,67,0.13)',
        divider:  'rgba(60,60,67,0.08)',
      },
      borderRadius: {
        xl:  '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        sm:   '0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
