# ProphetAI v2 - Simplified Launch Monitor

Real-time monitoring of new Pumpfun token launches. Shows the **last 4 tokens** launched - no volume calculations or filtering.

## What Changed in V2

- ✅ Removed buggy volume calculations
- ✅ Fixed to always show exactly 4 cards
- ✅ Just shows new launches as they happen
- ✅ Removed "25+ SOL" threshold text
- ✅ Cleaner, simpler UI

## Deploy to Vercel

1. Upload all files to GitHub (drag & drop)
2. Import repo in Vercel
3. If files are in a subfolder, set **Root Directory** to that folder name
4. Deploy!

## Configuration

Edit `app/page.tsx` to update:

```typescript
const CONFIG = {
  TOKEN_CA: 'YOUR_REAL_CA_HERE',  // Your contract address
  X_LINK: 'https://x.com/YOUR_HANDLE',  // Your X link
}
```

## Files

```
prophetai-v2/
├── app/
│   ├── globals.css      # Styles
│   ├── layout.tsx       # Layout wrapper
│   └── page.tsx         # Main page with WebSocket
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## How It Works

1. Connects to PumpPortal WebSocket (`wss://pumpportal.fun/api/data`)
2. Subscribes to `subscribeNewToken` event
3. Shows the 4 most recent token launches
4. Each card shows: Symbol, Name, Time ago, CA (click to copy)

No volume tracking, no filtering - just pure new launches.
