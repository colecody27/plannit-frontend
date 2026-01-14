module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif']
      },
      boxShadow: {
        lift: '0 20px 40px -30px rgba(23, 60, 45, 0.55)',
        glow: '0 12px 30px -18px rgba(23, 230, 142, 0.7)'
      },
      backgroundImage: {
        'soft-radial': 'radial-gradient(circle at top, rgba(23, 230, 142, 0.18), rgba(246, 251, 248, 0) 45%)'
      }
    }
  },
  daisyui: {
    themes: [
      {
        plannit: {
          primary: '#17E68E',
          'primary-content': '#043822',
          secondary: '#9BE7FF',
          accent: '#FFD48A',
          neutral: '#1B2A26',
          'base-100': '#DDE9E1',
          'base-200': '#D0E1D6',
          'base-300': '#BDD3C6',
          'base-content': '#1F2E26',
          info: '#4D9DE0',
          success: '#23C16B',
          warning: '#FFB020',
          error: '#E35B5B'
        }
      },
      {
        'plannit-dark': {
          primary: '#17E68E',
          'primary-content': '#031F13',
          secondary: '#2BD3B0',
          accent: '#FFD48A',
          neutral: '#0B1411',
          'base-100': '#1B2B23',
          'base-200': '#213329',
          'base-300': '#2A4034',
          'base-content': '#E6F0EA',
          info: '#4D9DE0',
          success: '#23C16B',
          warning: '#FFB020',
          error: '#E35B5B'
        }
      }
    ]
  },
  plugins: [require('daisyui')]
};
