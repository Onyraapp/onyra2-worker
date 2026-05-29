module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#FFFFFF',
        surface:  '#FFFFFF',
        surface2: '#F5F5F7',
        offset:   '#F5F5F7',
        t1:       '#1C1C1E',
        t2:       '#3C3C43',
        t3:       '#8E8E93',
        t4:       '#C7C7CC',
        primary:  '#2D6B8C',
        green:    '#2D6B8C',
        greensoft:'rgba(45,107,140,0.10)',
        greentext:'#1A4F6A',
        red:      '#FF3B30',
        redsoft:  'rgba(255,59,48,0.08)',
        redtext:  '#C0392B',
        amber:    '#FF9500',
        ambersoft:'rgba(255,149,0,0.10)',
        ambertext:'#C05E00',
        border:   'rgba(60,60,67,0.12)',
        divider:  'rgba(60,60,67,0.08)',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(60,60,67,0.10)',
        sm:   '0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
