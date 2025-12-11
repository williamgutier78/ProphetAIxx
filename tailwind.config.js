/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'matrix-green': '#00ff41',
        'matrix-green-dim': '#00cc33',
        'matrix-green-dark': '#003300',
        'neon-blue': '#00d4ff',
        'neon-purple': '#bc00ff',
        'dark-bg': '#0a0a0a',
        'dark-card': '#0d1a0d',
        'dark-card-border': '#1a3a1a',
        'text-dim': '#66ff66',
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'glitch': 'glitch 3s infinite',
        'scan': 'scan 3s infinite',
        'ticker': 'ticker 30s linear infinite',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff41, 0 0 10px #00ff41' },
          '50%': { boxShadow: '0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 60px #00ff41' },
        },
        'glitch': {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '91%': { transform: 'translate(-2px, 1px)', filter: 'hue-rotate(90deg)' },
          '92%': { transform: 'translate(2px, -1px)' },
          '93%': { transform: 'translate(-1px, 2px)', filter: 'hue-rotate(0deg)' },
          '94%': { transform: 'translate(1px, -2px)' },
        },
        'scan': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}
