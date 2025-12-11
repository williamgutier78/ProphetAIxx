'use client'

import { useEffect, useState, useRef } from 'react'

// Types for PumpPortal data
interface TokenData {
  mint: string
  name: string
  symbol: string
  uri?: string
  timestamp: number
}

// Configuration
const CONFIG = {
  TOKEN_CA: 'PROPHET...XXXXX', // Your token CA - replace with real one
  X_LINK: 'https://x.com/ProphetAI_Sol', // Your X/Twitter link
}

export default function Home() {
  const [recentTokens, setRecentTokens] = useState<TokenData[]>([])
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [oracleMessages, setOracleMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: 'Welcome to the Prophecy Oracle. I am monitoring Pumpfun launches in real-time. Watch the feed for new token launches.', isUser: false }
  ])
  const [oracleInput, setOracleInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Matrix Rain Effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789$PROPHETAI'
    const charArray = chars.split('')
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = fontSize + 'px Share Tech Mono'

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * 0.5 + 0.5})`
        ctx.fillText(char, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(drawMatrix, 50)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // PumpPortal WebSocket Connection
  useEffect(() => {
    const connectWebSocket = () => {
      setWsStatus('connecting')
      
      const ws = new WebSocket('wss://pumpportal.fun/api/data')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to PumpPortal')
        setWsStatus('connected')
        
        // Subscribe to new token launches only
        ws.send(JSON.stringify({ method: 'subscribeNewToken' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle new token creation
          if (data.mint && data.name) {
            const newToken: TokenData = {
              mint: data.mint,
              name: data.name || 'Unknown',
              symbol: data.symbol || '???',
              uri: data.uri,
              timestamp: Date.now()
            }

            setRecentTokens(prev => {
              // Add new token at the beginning, keep only last 4
              const updated = [newToken, ...prev].slice(0, 4)
              return updated
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsStatus('disconnected')
      }

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...')
        setWsStatus('disconnected')
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Oracle chat handler
  const handleOracleQuery = () => {
    if (!oracleInput.trim()) return

    const query = oracleInput.trim()
    setOracleMessages(prev => [...prev, { text: query, isUser: true }])
    setOracleInput('')

    setTimeout(() => {
      let response = ''
      const queryLower = query.toLowerCase()

      // Check if asking about a recent token
      const matchedToken = recentTokens.find(t => 
        t.name.toLowerCase().includes(queryLower) || 
        t.symbol.toLowerCase().includes(queryLower) ||
        t.mint.toLowerCase().includes(queryLower)
      )

      if (matchedToken) {
        response = `$${matchedToken.symbol} (${matchedToken.name})

CA: ${matchedToken.mint}

This token was recently launched on Pumpfun. Always DYOR before trading.`
      } else if (queryLower.includes('recent') || queryLower.includes('new') || queryLower.includes('launch')) {
        if (recentTokens.length > 0) {
          response = `Recent launches:\n\n` + 
            recentTokens.map((t, i) => `${i + 1}. $${t.symbol} - ${t.name}`).join('\n')
        } else {
          response = 'Waiting for new launches...'
        }
      } else {
        response = `Currently monitoring Pumpfun for new launches.

${recentTokens.length} recent tokens tracked.

Try asking about "recent launches" or search for a specific token name.`
      }

      setOracleMessages(prev => [...prev, { text: response, isUser: false }])
    }, 500 + Math.random() * 1000)
  }

  // Auto-scroll oracle messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [oracleMessages])

  // Format CA for display
  const formatCA = (ca: string) => `${ca.slice(0, 6)}...${ca.slice(-4)}`

  // Copy CA to clipboard
  const copyCA = (ca: string) => {
    navigator.clipboard.writeText(ca)
  }

  // Time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  return (
    <main className="min-h-screen bg-black text-matrix-green">
      {/* Matrix Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-0 opacity-15 pointer-events-none"
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b border-matrix-green-dark backdrop-blur-md px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-matrix-green rounded-full flex items-center justify-center text-lg animate-pulse-glow">
              ◉
            </div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-widest glow-text">
              PROPHETAI
            </span>
          </div>

          {/* CA Display & X Button */}
          <div className="flex items-center gap-4">
            {/* Contract Address */}
            <div 
              className="hidden md:flex items-center gap-2 bg-dark-card border border-dark-card-border px-4 py-2 rounded cursor-pointer hover:border-matrix-green transition-all"
              onClick={() => copyCA(CONFIG.TOKEN_CA)}
              title="Click to copy CA"
            >
              <span className="font-mono text-xs text-text-dim">CA:</span>
              <span className="font-mono text-sm text-matrix-green">{CONFIG.TOKEN_CA}</span>
              <svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>

            {/* X/Twitter Button */}
            <a
              href={CONFIG.X_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-12 h-12 bg-matrix-green text-black font-bold text-xl rounded hover:shadow-[0_0_30px_#00ff41] transition-all hover:scale-105"
            >
              𝕏
            </a>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                wsStatus === 'connected' ? 'bg-matrix-green animate-blink' : 
                wsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="hidden md:block font-mono text-xs text-text-dim uppercase">
                {wsStatus}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile CA Display */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-dark-card/95 border-b border-dark-card-border px-4 py-2">
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => copyCA(CONFIG.TOKEN_CA)}
        >
          <span className="font-mono text-xs text-text-dim">CA:</span>
          <span className="font-mono text-sm text-matrix-green">{CONFIG.TOKEN_CA}</span>
          <svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-32 md:pt-20 relative z-10">
        <div className="max-w-4xl">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-wider glow-text animate-glitch">
            PROPHETAI
          </h1>
          <p className="font-mono text-sm md:text-base text-text-dim mt-4 tracking-widest">
            [ THE ORACLE OF PUMPFUN ]
          </p>
          <p className="text-lg md:text-xl text-[#aaffaa] max-w-2xl mx-auto mt-6 leading-relaxed">
            Real-time monitoring of every new Pumpfun launch. 
            Watch the latest tokens appear as they deploy.
          </p>

          {/* Live Stats */}
          <div className="flex justify-center gap-4 mt-8">
            <div className="bg-dark-card border border-dark-card-border rounded-lg px-6 py-4">
              <div className="font-display text-3xl md:text-4xl text-matrix-green">{recentTokens.length}</div>
              <div className="font-mono text-xs text-text-dim">RECENT</div>
            </div>
            <div className="bg-dark-card border border-dark-card-border rounded-lg px-6 py-4">
              <div className={`font-display text-3xl md:text-4xl ${wsStatus === 'connected' ? 'text-matrix-green' : 'text-red-500'}`}>
                {wsStatus === 'connected' ? 'LIVE' : 'OFF'}
              </div>
              <div className="font-mono text-xs text-text-dim">STATUS</div>
            </div>
          </div>
        </div>
      </section>

      {/* New Launches Feed - Fixed 4 cards */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            NEW LAUNCHES
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-8">
            [ LATEST PUMPFUN TOKENS ]
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTokens.length > 0 ? (
              recentTokens.map((token, index) => (
                <div 
                  key={token.mint + token.timestamp}
                  className="bg-dark-card border border-dark-card-border rounded-xl p-5 hover:border-matrix-green transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-matrix-green via-neon-blue to-matrix-green opacity-50" />
                  
                  {/* Rank Badge */}
                  <div className="absolute top-3 right-3 font-mono text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded border border-neon-blue/30">
                    #{index + 1}
                  </div>

                  {/* Token Info */}
                  <div className="mb-4">
                    <div className="font-display text-xl text-matrix-green">${token.symbol}</div>
                    <div className="font-mono text-xs text-text-dim truncate max-w-[180px]">{token.name}</div>
                  </div>

                  {/* Time */}
                  <div className="font-mono text-xs text-text-dim mb-3">
                    🕐 {timeAgo(token.timestamp)}
                  </div>

                  {/* Copy CA Button */}
                  <button 
                    onClick={() => copyCA(token.mint)}
                    className="w-full bg-black border border-matrix-green-dark rounded px-3 py-2 font-mono text-xs text-matrix-green hover:bg-matrix-green/10 hover:border-matrix-green transition-all"
                  >
                    📋 CA: {formatCA(token.mint)}
                  </button>
                </div>
              ))
            ) : (
              // Empty state - show 4 placeholder cards
              Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i}
                  className="bg-dark-card border border-dark-card-border rounded-xl p-5 relative overflow-hidden"
                >
                  <div className="absolute top-3 right-3 font-mono text-xs bg-dark-card-border text-text-dim px-2 py-1 rounded">
                    #{i + 1}
                  </div>
                  <div className="font-display text-xl text-text-dim animate-pulse">$???</div>
                  <div className="font-mono text-xs text-text-dim mt-1">Waiting...</div>
                  <div className="font-mono text-xs text-text-dim mt-4 mb-3">🕐 --</div>
                  <div className="w-full bg-dark-card-border rounded px-3 py-2 font-mono text-xs text-text-dim text-center">
                    Scanning...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Oracle Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            PROPHECY ORACLE
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-8">
            [ ASK ABOUT ANY TOKEN ]
          </p>

          <div className="bg-black border border-matrix-green rounded-xl overflow-hidden neon-border">
            {/* Oracle Header */}
            <div className="bg-gradient-to-r from-matrix-green-dark to-transparent px-4 py-3 border-b border-matrix-green-dark flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-matrix-green rounded-full flex items-center justify-center animate-pulse-glow">
                ◉
              </div>
              <span className="font-display text-sm tracking-widest">ORACLE TERMINAL</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-matrix-green rounded-full animate-blink" />
                <span className="font-mono text-xs text-text-dim">ONLINE</span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 font-mono text-sm space-y-4">
              {oracleMessages.map((msg, i) => (
                <div key={i} className={`message-animate ${msg.isUser ? 'text-neon-blue' : 'text-matrix-green pl-4 border-l-2 border-matrix-green-dark'}`}>
                  {msg.isUser ? '> ' : 'ORACLE: '}
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-matrix-green-dark p-4 flex gap-3">
              <input
                type="text"
                value={oracleInput}
                onChange={(e) => setOracleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleOracleQuery()}
                placeholder="Ask about recent launches..."
                className="flex-1 bg-dark-bg border border-matrix-green-dark rounded px-4 py-3 font-mono text-sm text-matrix-green placeholder-text-dim focus:border-matrix-green focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all"
              />
              <button
                onClick={handleOracleQuery}
                className="bg-matrix-green text-black px-6 py-3 font-mono text-sm hover:shadow-[0_0_30px_#00ff41] transition-all"
              >
                QUERY
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Access Tiers Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            ACCESS TIERS
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-8">
            [ HOLD $PROPHET TO UNLOCK FEATURES ]
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="bg-dark-card border border-dark-card-border rounded-xl p-6 hover:border-matrix-green-dark transition-all">
              <div className="font-display text-xl text-matrix-green mb-1">OBSERVER</div>
              <div className="font-display text-3xl text-matrix-green mb-2">FREE</div>
              <div className="font-mono text-xs text-text-dim mb-6">No tokens required</div>
              <ul className="space-y-3 mb-6">
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> View new launches
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Basic Oracle queries
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Community access
                </li>
              </ul>
              <button className="w-full border border-matrix-green-dark text-matrix-green font-mono py-3 rounded hover:bg-matrix-green/10 transition-all">
                CURRENT ACCESS
              </button>
            </div>

            {/* Prophet Tier */}
            <div className="bg-dark-card border-2 border-matrix-green rounded-xl p-6 relative overflow-hidden neon-border">
              <div className="absolute top-4 right-4 bg-matrix-green text-black font-mono text-xs px-2 py-1 rounded">
                POPULAR
              </div>
              <div className="font-display text-xl text-matrix-green mb-1">PROPHET</div>
              <div className="font-display text-3xl text-matrix-green mb-2">100K</div>
              <div className="font-mono text-xs text-text-dim mb-6">$PROPHET tokens</div>
              <ul className="space-y-3 mb-6">
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Priority feed
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Telegram alerts
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Unlimited Oracle
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Dev wallet checker
                </li>
              </ul>
              <button className="w-full bg-matrix-green text-black font-mono py-3 rounded hover:shadow-[0_0_30px_#00ff41] transition-all">
                CONNECT WALLET
              </button>
            </div>

            {/* Oracle Tier */}
            <div className="bg-dark-card border border-dark-card-border rounded-xl p-6 hover:border-matrix-green-dark transition-all">
              <div className="font-display text-xl text-matrix-green mb-1">ORACLE</div>
              <div className="font-display text-3xl text-matrix-green mb-2">500K</div>
              <div className="font-mono text-xs text-text-dim mb-6">$PROPHET tokens</div>
              <ul className="space-y-3 mb-6">
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Everything in Prophet
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> API access
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Private Discord
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Early features
                </li>
              </ul>
              <button className="w-full border border-matrix-green text-matrix-green font-mono py-3 rounded hover:bg-matrix-green/10 transition-all">
                CONNECT WALLET
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-matrix-green-dark relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 border border-matrix-green rounded-full flex items-center justify-center text-sm">◉</div>
                <span className="font-display text-lg tracking-widest">PROPHETAI</span>
              </div>
              <p className="font-mono text-sm text-text-dim">
                Real-time Pumpfun launch monitoring.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm text-matrix-green mb-4 tracking-widest">LINKS</h4>
              <div className="space-y-2">
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Dashboard</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Documentation</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">API</a>
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm text-matrix-green mb-4 tracking-widest">COMMUNITY</h4>
              <div className="space-y-2">
                <a href={CONFIG.X_LINK} target="_blank" rel="noopener noreferrer" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">X / Twitter</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Telegram</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Discord</a>
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm text-matrix-green mb-4 tracking-widest">CONTRACT</h4>
              <button 
                onClick={() => copyCA(CONFIG.TOKEN_CA)}
                className="font-mono text-sm text-text-dim hover:text-matrix-green transition-colors break-all text-left"
              >
                {CONFIG.TOKEN_CA}
              </button>
            </div>
          </div>

          <div className="border-t border-matrix-green-dark pt-6 text-center">
            <p className="font-mono text-xs text-text-dim mb-2">
              ⚠️ DISCLAIMER: ProphetAI provides data for informational purposes only. 
              Cryptocurrency trading involves substantial risk. Not financial advice. DYOR.
            </p>
            <p className="font-mono text-xs text-matrix-green-dark">
              © 2025 PROPHETAI. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
