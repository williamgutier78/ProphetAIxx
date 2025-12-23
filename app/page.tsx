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
    { text: 'Welcome to the Prophecy Oracle. I am connected to real-time Pumpfun data streams and can analyze any token. Ask me about pump potential, risk assessment, or market sentiment.', isUser: false }
  ])
  const [oracleInput, setOracleInput] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        ws.send(JSON.stringify({ method: 'subscribeNewToken' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.mint && data.name) {
            const newToken: TokenData = {
              mint: data.mint,
              name: data.name || 'Unknown',
              symbol: data.symbol || '???',
              uri: data.uri,
              timestamp: Date.now()
            }

            setRecentTokens(prev => {
              const updated = [newToken, ...prev].slice(0, 4)
              return updated
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = () => {
        setWsStatus('disconnected')
      }

      ws.onclose = () => {
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

      const matchedToken = recentTokens.find(t => 
        t.name.toLowerCase().includes(queryLower) || 
        t.symbol.toLowerCase().includes(queryLower) ||
        t.mint.toLowerCase().includes(queryLower)
      )

      if (matchedToken) {
        response = `Analyzing $${matchedToken.symbol} (${matchedToken.name})...

CA: ${matchedToken.mint}

This token was recently launched on Pumpfun. Our AI is monitoring on-chain activity and social sentiment. Always DYOR before trading.`
      } else if (queryLower.includes('recent') || queryLower.includes('new') || queryLower.includes('launch')) {
        if (recentTokens.length > 0) {
          response = `Recent launches detected:\n\n` + 
            recentTokens.map((t, i) => `${i + 1}. $${t.symbol} - ${t.name}`).join('\n') +
            `\n\nClick on any token card to copy the CA.`
        } else {
          response = 'Scanning for new launches... Stand by.'
        }
      } else {
        response = `Oracle processing query: "${query}"

Currently monitoring Pumpfun in real-time. ${recentTokens.length} recent tokens in view.

Available commands:
• Ask about specific token names
• "recent launches" - see latest tokens
• "how does it work" - learn about ProphetAI

The Oracle sees all. Ask wisely.`
      }

      setOracleMessages(prev => [...prev, { text: response, isUser: false }])
    }, 500 + Math.random() * 1000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [oracleMessages])

  const formatCA = (ca: string) => `${ca.slice(0, 6)}...${ca.slice(-4)}`

  const copyCA = (ca: string) => {
    navigator.clipboard.writeText(ca)
  }

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="w-10 h-10 border-2 border-matrix-green rounded-full flex items-center justify-center text-lg animate-pulse-glow">
              ◉
            </div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-widest glow-text">
              PROPHETAI
            </span>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-6">
            <li><button onClick={() => scrollToSection('home')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">HOME</button></li>
            <li><button onClick={() => scrollToSection('launches')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">LAUNCHES</button></li>
            <li><button onClick={() => scrollToSection('oracle')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">ORACLE</button></li>
            <li><button onClick={() => scrollToSection('about')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">ABOUT</button></li>
            <li><button onClick={() => scrollToSection('pricing')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">PRICING</button></li>
            <li><button onClick={() => scrollToSection('blog')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">UPDATES</button></li>
            <li><button onClick={() => scrollToSection('contact')} className="font-mono text-sm text-text-dim hover:text-matrix-green transition-all">CONTACT</button></li>
          </ul>

          {/* Right Side - CA, X Button, Status */}
          <div className="flex items-center gap-3">
            {/* Contract Address */}
            <div 
              className="hidden md:flex items-center gap-2 bg-dark-card border border-dark-card-border px-3 py-2 rounded cursor-pointer hover:border-matrix-green transition-all"
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
              className="flex items-center justify-center w-11 h-11 bg-matrix-green text-black font-bold text-xl rounded hover:shadow-[0_0_30px_#00ff41] transition-all hover:scale-105"
            >
              𝕏
            </a>

            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                wsStatus === 'connected' ? 'bg-matrix-green animate-blink' : 
                wsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="font-mono text-xs text-text-dim uppercase">
                {wsStatus === 'connected' ? 'LIVE' : wsStatus}
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden flex flex-col gap-1 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="w-5 h-0.5 bg-matrix-green"></span>
              <span className="w-5 h-0.5 bg-matrix-green"></span>
              <span className="w-5 h-0.5 bg-matrix-green"></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 border-b border-matrix-green-dark p-4">
            <ul className="flex flex-col gap-3">
              <li><button onClick={() => scrollToSection('home')} className="font-mono text-sm text-text-dim hover:text-matrix-green">HOME</button></li>
              <li><button onClick={() => scrollToSection('launches')} className="font-mono text-sm text-text-dim hover:text-matrix-green">LAUNCHES</button></li>
              <li><button onClick={() => scrollToSection('oracle')} className="font-mono text-sm text-text-dim hover:text-matrix-green">ORACLE</button></li>
              <li><button onClick={() => scrollToSection('about')} className="font-mono text-sm text-text-dim hover:text-matrix-green">ABOUT</button></li>
              <li><button onClick={() => scrollToSection('pricing')} className="font-mono text-sm text-text-dim hover:text-matrix-green">PRICING</button></li>
              <li><button onClick={() => scrollToSection('blog')} className="font-mono text-sm text-text-dim hover:text-matrix-green">UPDATES</button></li>
              <li><button onClick={() => scrollToSection('contact')} className="font-mono text-sm text-text-dim hover:text-matrix-green">CONTACT</button></li>
            </ul>
            <div 
              className="mt-4 flex items-center gap-2 cursor-pointer"
              onClick={() => copyCA(CONFIG.TOKEN_CA)}
            >
              <span className="font-mono text-xs text-text-dim">CA:</span>
              <span className="font-mono text-sm text-matrix-green">{CONFIG.TOKEN_CA}</span>
            </div>
          </div>
        )}
      </nav>

      {/* Flywheel Tokenomics Banner */}
      <div className="fixed top-[73px] left-0 right-0 z-40 bg-gradient-to-r from-black via-matrix-green-dark/30 to-black border-b border-matrix-green/30 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,65,0.1)_50%,transparent_100%)] animate-pulse" />
        <div className="relative flex items-center justify-center gap-2 md:gap-6 py-2 px-4">
          {/* Animated rotating icon */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-2 border-matrix-green rounded-full animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-1 border border-matrix-green/50 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-matrix-green">⟳</div>
            </div>
            <span className="font-mono text-xs text-matrix-green uppercase tracking-wider">Flywheel Active</span>
          </div>
          
          <div className="hidden md:block w-px h-6 bg-matrix-green/30" />
          
          {/* Main message */}
          <div className="flex items-center gap-3 md:gap-4">
            <span className="font-mono text-[10px] md:text-xs text-text-dim">CREATOR FEES →</span>
            
            {/* 20% Burns */}
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 md:px-3 py-1 rounded">
              <span className="text-red-400 text-sm">🔥</span>
              <span className="font-mono text-xs md:text-sm font-bold text-red-400">20%</span>
              <span className="font-mono text-[10px] md:text-xs text-red-400/80">BURNS</span>
            </div>
            
            <span className="text-matrix-green text-lg">+</span>
            
            {/* 80% Market Making */}
            <div className="flex items-center gap-1.5 bg-matrix-green/10 border border-matrix-green/30 px-2 md:px-3 py-1 rounded">
              <span className="text-matrix-green text-sm">📈</span>
              <span className="font-mono text-xs md:text-sm font-bold text-matrix-green">80%</span>
              <span className="font-mono text-[10px] md:text-xs text-matrix-green/80">MM</span>
            </div>
          </div>
          
          <div className="hidden md:block w-px h-6 bg-matrix-green/30" />
          
          {/* Auto badge */}
          <div className="hidden sm:flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 bg-matrix-green rounded-full" />
            <span className="font-mono text-[10px] text-matrix-green uppercase tracking-wider">Auto</span>
          </div>
        </div>
        
        {/* Scanning line effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-green/20 to-transparent -translate-x-full animate-[flywheel-scan_3s_linear_infinite]" />
      </div>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-32 relative z-10">
        <div className="max-w-4xl">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-wider glow-text animate-glitch">
            PROPHETAI
          </h1>
          <p className="font-mono text-sm md:text-base text-text-dim mt-4 tracking-widest">
            [ THE ORACLE OF PUMPFUN ]
          </p>
          <p className="text-lg md:text-xl text-[#aaffaa] max-w-2xl mx-auto mt-6 leading-relaxed">
            Advanced AI-powered prediction engine that continuously monitors every coin launched on Pumpfun. 
            Analyzing market trends, social sentiment, and on-chain data to identify the next runner 
            before it pumps.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button 
              onClick={() => scrollToSection('launches')}
              className="px-8 py-4 bg-matrix-green text-black font-mono font-bold tracking-wider hover:shadow-[0_0_30px_#00ff41] transition-all"
            >
              VIEW LIVE LAUNCHES
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="px-8 py-4 border border-matrix-green text-matrix-green font-mono tracking-wider hover:bg-matrix-green/10 transition-all"
            >
              HOW IT WORKS
            </button>
          </div>

          {/* Live Stats */}
          <div className="flex justify-center gap-4 mt-10">
            <div className="bg-dark-card border border-dark-card-border rounded-lg px-6 py-4">
              <div className="font-display text-2xl md:text-3xl text-matrix-green">{recentTokens.length}</div>
              <div className="font-mono text-xs text-text-dim">RECENT</div>
            </div>
            <div className="bg-dark-card border border-dark-card-border rounded-lg px-6 py-4">
              <div className={`font-display text-2xl md:text-3xl ${wsStatus === 'connected' ? 'text-matrix-green' : 'text-red-500'}`}>
                {wsStatus === 'connected' ? 'LIVE' : 'OFF'}
              </div>
              <div className="font-mono text-xs text-text-dim">STATUS</div>
            </div>
            <div className="bg-dark-card border border-dark-card-border rounded-lg px-6 py-4">
              <div className="font-display text-2xl md:text-3xl text-neon-blue">24/7</div>
              <div className="font-mono text-xs text-text-dim">MONITORING</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-matrix-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* New Launches Feed */}
      <section id="launches" className="py-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            LIVE LAUNCHES
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-10">
            [ REAL-TIME PUMPFUN TOKEN FEED ]
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTokens.length > 0 ? (
              recentTokens.map((token, index) => (
                <div 
                  key={token.mint + token.timestamp}
                  className="bg-dark-card border border-dark-card-border rounded-xl p-5 hover:border-matrix-green transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-matrix-green via-neon-blue to-matrix-green opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute top-3 right-3 font-mono text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded border border-neon-blue/30">
                    #{index + 1}
                  </div>

                  <div className="mb-4">
                    <div className="font-display text-xl text-matrix-green">${token.symbol}</div>
                    <div className="font-mono text-xs text-text-dim truncate max-w-[180px]">{token.name}</div>
                  </div>

                  <div className="font-mono text-xs text-text-dim mb-3">
                    🕐 {timeAgo(token.timestamp)}
                  </div>

                  <button 
                    onClick={() => copyCA(token.mint)}
                    className="w-full bg-black border border-matrix-green-dark rounded px-3 py-2 font-mono text-xs text-matrix-green hover:bg-matrix-green/10 hover:border-matrix-green transition-all"
                  >
                    📋 CA: {formatCA(token.mint)}
                  </button>
                </div>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i}
                  className="bg-dark-card border border-dark-card-border rounded-xl p-5 relative overflow-hidden"
                >
                  <div className="absolute top-3 right-3 font-mono text-xs bg-dark-card-border text-text-dim px-2 py-1 rounded">
                    #{i + 1}
                  </div>
                  <div className="font-display text-xl text-text-dim animate-pulse">$???</div>
                  <div className="font-mono text-xs text-text-dim mt-1">Waiting for launch...</div>
                  <div className="font-mono text-xs text-text-dim mt-4 mb-3">🕐 --</div>
                  <div className="w-full bg-dark-card-border rounded px-3 py-2 font-mono text-xs text-text-dim text-center">
                    Scanning Pumpfun...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Oracle Section */}
      <section id="oracle" className="py-20 px-4 bg-gradient-to-b from-transparent via-dark-bg/50 to-transparent relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            PROPHECY ORACLE
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-10">
            [ ASK THE AI ABOUT ANY PUMPFUN TOKEN ]
          </p>

          <div className="bg-black border border-matrix-green rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,255,65,0.2)]">
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

            <div className="h-80 overflow-y-auto p-4 font-mono text-sm space-y-4">
              {oracleMessages.map((msg, i) => (
                <div key={i} className={`${msg.isUser ? 'text-neon-blue' : 'text-matrix-green pl-4 border-l-2 border-matrix-green-dark'}`}>
                  {msg.isUser ? '> ' : 'ORACLE: '}
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-matrix-green-dark p-4 flex gap-3">
              <input
                type="text"
                value={oracleInput}
                onChange={(e) => setOracleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleOracleQuery()}
                placeholder="Enter coin name or contract address..."
                className="flex-1 bg-dark-bg border border-matrix-green-dark rounded px-4 py-3 font-mono text-sm text-matrix-green placeholder-text-dim focus:border-matrix-green focus:outline-none transition-all"
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

      {/* About Section */}
      <section id="about" className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            HOW IT WORKS
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-10">
            [ ADVANCED AI PREDICTION METHODOLOGY ]
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-card border border-dark-card-border rounded-xl p-6 text-center hover:border-matrix-green transition-all">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-matrix-green rounded-full flex items-center justify-center text-2xl bg-matrix-green/5">
                ◈
              </div>
              <h3 className="font-display text-lg text-matrix-green mb-3 tracking-wider">DATA AGGREGATION</h3>
              <p className="text-text-dim text-sm leading-relaxed">
                ProphetAI monitors every new token launched on Pumpfun in real-time. 
                We aggregate data from on-chain transactions, social media APIs, and DEX activity.
              </p>
            </div>

            <div className="bg-dark-card border border-dark-card-border rounded-xl p-6 text-center hover:border-matrix-green transition-all">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-matrix-green rounded-full flex items-center justify-center text-2xl bg-matrix-green/5">
                ◇
              </div>
              <h3 className="font-display text-lg text-matrix-green mb-3 tracking-wider">ML ANALYSIS</h3>
              <p className="text-text-dim text-sm leading-relaxed">
                Our machine learning models are trained on historical pump patterns, 
                analyzing over 50,000 past token trajectories to identify early signals.
              </p>
            </div>

            <div className="bg-dark-card border border-dark-card-border rounded-xl p-6 text-center hover:border-matrix-green transition-all">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-matrix-green rounded-full flex items-center justify-center text-2xl bg-matrix-green/5">
                ◆
              </div>
              <h3 className="font-display text-lg text-matrix-green mb-3 tracking-wider">SENTIMENT ENGINE</h3>
              <p className="text-text-dim text-sm leading-relaxed">
                NLP scans Twitter, Telegram, and Discord in real-time. 
                We detect organic hype vs. bot activity and measure genuine community engagement.
              </p>
            </div>

            <div className="bg-dark-card border border-dark-card-border rounded-xl p-6 text-center hover:border-matrix-green transition-all">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-matrix-green rounded-full flex items-center justify-center text-2xl bg-matrix-green/5">
                ◎
              </div>
              <h3 className="font-display text-lg text-matrix-green mb-3 tracking-wider">RISK SCORING</h3>
              <p className="text-text-dim text-sm leading-relaxed">
                Every analysis includes risk assessment. We analyze dev wallets, 
                liquidity depth, holder distribution, and contract flags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-transparent via-dark-bg/50 to-transparent relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            ACCESS TIERS
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-10">
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
                  <span className="text-matrix-green">{'>'}</span> View live launches
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Basic Oracle queries
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Community access
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Weekly reports
                </li>
              </ul>
              <button className="w-full border border-matrix-green-dark text-matrix-green font-mono py-3 rounded hover:bg-matrix-green/10 transition-all">
                CURRENT ACCESS
              </button>
            </div>

            {/* Prophet Tier */}
            <div className="bg-dark-card border-2 border-matrix-green rounded-xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(0,255,65,0.2)]">
              <div className="absolute top-4 right-4 bg-matrix-green text-black font-mono text-xs px-2 py-1 rounded">
                POPULAR
              </div>
              <div className="font-display text-xl text-matrix-green mb-1">PROPHET</div>
              <div className="font-display text-3xl text-matrix-green mb-2">100K</div>
              <div className="font-mono text-xs text-text-dim mb-6">$PROPHET tokens</div>
              <ul className="space-y-3 mb-6">
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Priority launch feed
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Instant Telegram alerts
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Unlimited Oracle queries
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Dev wallet analysis
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Risk scoring access
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
                  <span className="text-matrix-green">{'>'}</span> Full API access
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Custom alert rules
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Private Discord
                </li>
                <li className="font-mono text-sm text-text-dim flex items-center gap-2">
                  <span className="text-matrix-green">{'>'}</span> Early feature access
                </li>
              </ul>
              <button className="w-full border border-matrix-green text-matrix-green font-mono py-3 rounded hover:bg-matrix-green/10 transition-all">
                CONNECT WALLET
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog/News Section */}
      <section id="blog" className="py-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            MARKET TRANSMISSIONS
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-10">
            [ LATEST UPDATES FROM THE ORACLE ]
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-card border border-dark-card-border rounded-xl overflow-hidden hover:border-matrix-green transition-all group">
              <div className="h-40 bg-gradient-to-br from-matrix-green-dark to-black flex items-center justify-center text-4xl relative overflow-hidden">
                ◉
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-green/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              <div className="p-5">
                <div className="font-mono text-xs text-neon-blue mb-2">DEC 10, 2025</div>
                <h3 className="font-display text-lg text-matrix-green mb-2">ProphetAI Launch Announcement</h3>
                <p className="text-text-dim text-sm leading-relaxed">
                  The Oracle is now live. Real-time monitoring of Pumpfun launches begins today.
                </p>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-card-border rounded-xl overflow-hidden hover:border-matrix-green transition-all group">
              <div className="h-40 bg-gradient-to-br from-matrix-green-dark to-black flex items-center justify-center text-4xl relative overflow-hidden">
                ◈
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-green/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              <div className="p-5">
                <div className="font-mono text-xs text-neon-blue mb-2">DEC 8, 2025</div>
                <h3 className="font-display text-lg text-matrix-green mb-2">AI Model v2.0 Upgrade</h3>
                <p className="text-text-dim text-sm leading-relaxed">
                  Enhanced sentiment analysis now detects coordinated shill campaigns with 94% accuracy.
                </p>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-card-border rounded-xl overflow-hidden hover:border-matrix-green transition-all group">
              <div className="h-40 bg-gradient-to-br from-matrix-green-dark to-black flex items-center justify-center text-4xl relative overflow-hidden">
                ◇
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-green/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              <div className="p-5">
                <div className="font-mono text-xs text-neon-blue mb-2">DEC 5, 2025</div>
                <h3 className="font-display text-lg text-matrix-green mb-2">Telegram Alerts Beta</h3>
                <p className="text-text-dim text-sm leading-relaxed">
                  Prophet tier holders now receive instant notifications for high-potential launches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-gradient-to-b from-transparent via-dark-bg/50 to-transparent relative z-10">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center glow-text tracking-widest mb-2">
            ESTABLISH CONNECTION
          </h2>
          <p className="font-mono text-sm text-text-dim text-center mb-10">
            [ REACH THE ORACLE ]
          </p>

          <div className="bg-dark-card border border-dark-card-border rounded-xl p-6">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-sm text-text-dim block mb-2">IDENTIFIER</label>
                <input 
                  type="text" 
                  placeholder="Your name or alias"
                  className="w-full bg-dark-bg border border-matrix-green-dark rounded px-4 py-3 font-mono text-sm text-matrix-green placeholder-text-dim focus:border-matrix-green focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="font-mono text-sm text-text-dim block mb-2">COMMUNICATION CHANNEL</label>
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  className="w-full bg-dark-bg border border-matrix-green-dark rounded px-4 py-3 font-mono text-sm text-matrix-green placeholder-text-dim focus:border-matrix-green focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="font-mono text-sm text-text-dim block mb-2">TRANSMISSION</label>
                <textarea 
                  placeholder="Enter your message to the Oracle..."
                  rows={4}
                  className="w-full bg-dark-bg border border-matrix-green-dark rounded px-4 py-3 font-mono text-sm text-matrix-green placeholder-text-dim focus:border-matrix-green focus:outline-none transition-all resize-none"
                />
              </div>
              <button className="w-full bg-matrix-green text-black font-mono py-3 rounded hover:shadow-[0_0_30px_#00ff41] transition-all">
                TRANSMIT MESSAGE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-matrix-green-dark relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 border border-matrix-green rounded-full flex items-center justify-center text-sm">◉</div>
                <span className="font-display text-lg tracking-widest">PROPHETAI</span>
              </div>
              <p className="font-mono text-sm text-text-dim leading-relaxed">
                The most advanced AI-powered prediction engine for Pumpfun tokens. 
                Identifying opportunities before they pump.
              </p>
              <div className="flex gap-3 mt-4">
                <a href={CONFIG.X_LINK} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-matrix-green-dark rounded flex items-center justify-center text-text-dim hover:border-matrix-green hover:text-matrix-green transition-all">
                  𝕏
                </a>
                <a href="#" className="w-10 h-10 border border-matrix-green-dark rounded flex items-center justify-center text-text-dim hover:border-matrix-green hover:text-matrix-green transition-all">
                  ✦
                </a>
                <a href="#" className="w-10 h-10 border border-matrix-green-dark rounded flex items-center justify-center text-text-dim hover:border-matrix-green hover:text-matrix-green transition-all">
                  ◉
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm text-matrix-green mb-4 tracking-widest">NAVIGATION</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('home')} className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Home</button>
                <button onClick={() => scrollToSection('launches')} className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Launches</button>
                <button onClick={() => scrollToSection('oracle')} className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Oracle</button>
                <button onClick={() => scrollToSection('about')} className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">About</button>
                <button onClick={() => scrollToSection('pricing')} className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Pricing</button>
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm text-matrix-green mb-4 tracking-widest">RESOURCES</h4>
              <div className="space-y-2">
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Documentation</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">API Reference</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Status Page</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Changelog</a>
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm text-matrix-green mb-4 tracking-widest">LEGAL</h4>
              <div className="space-y-2">
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Terms of Service</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Privacy Policy</a>
                <a href="#" className="block font-mono text-sm text-text-dim hover:text-matrix-green transition-colors">Risk Disclosure</a>
              </div>
              <div className="mt-4">
                <h4 className="font-display text-sm text-matrix-green mb-2 tracking-widest">CONTRACT</h4>
                <button 
                  onClick={() => copyCA(CONFIG.TOKEN_CA)}
                  className="font-mono text-xs text-text-dim hover:text-matrix-green transition-colors break-all text-left"
                >
                  {CONFIG.TOKEN_CA}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-matrix-green-dark pt-6 text-center">
            <p className="font-mono text-xs text-text-dim mb-2 max-w-3xl mx-auto">
              ⚠️ DISCLAIMER: ProphetAI provides AI-generated data for informational purposes only. 
              Cryptocurrency trading involves substantial risk of loss. Past performance does not guarantee 
              future results. Always do your own research (DYOR) and never invest more than you can afford to lose.
            </p>
            <p className="font-mono text-xs text-matrix-green-dark">
              © 2025 PROPHETAI. ALL RIGHTS RESERVED. NOT FINANCIAL ADVICE.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
