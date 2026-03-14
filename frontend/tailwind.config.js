/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        platform: {
          bg: '#FFFFFF',
          bgSoft: '#F5F6F8',
          accent: '#4F46E5',
          accent2: '#0EA5E9',
          glow: '#4338CA',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(79,70,229,0.2), 0 4px 24px rgba(79,70,229,0.12)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      },
      backgroundImage: {
        'mesh-gradient':
          'radial-gradient(circle at 16% 20%, rgba(79,70,229,0.06), transparent 34%), radial-gradient(circle at 88% 18%, rgba(14,165,233,0.05), transparent 33%), radial-gradient(circle at 52% 80%, rgba(79,70,229,0.04), transparent 36%)',
      },
      animation: {
        pulseSlow: 'pulseSlow 2.8s ease-in-out infinite',
        flow: 'flow 3.5s linear infinite',
        float: 'float 7s ease-in-out infinite',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        flow: {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
