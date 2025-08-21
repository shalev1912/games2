import React, { useEffect, useMemo, useRef, useState } from 'react'

type Player = { name: string; score: number }
type Snapshot = {
  players: Player[]
  category: string
  current: { masked: string; hint: string; endsAt: number } | null
}

export default function App() {
  const defaultWs = useMemo(() => {
    const { protocol, hostname } = window.location
    const wsProto = protocol === 'https:' ? 'wss' : 'ws'
    return `${wsProto}://${hostname}:8080`
  }, [])
  const [serverUrl, setServerUrl] = useState(defaultWs)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'Food'|'Animals'|'Transport'|'All'>('All')
  const [connected, setConnected] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [current, setCurrent] = useState<Snapshot['current']>(null)
  const [endsIn, setEndsIn] = useState<number>(0)
  const wsRef = useRef<WebSocket | null>(null)
  const [view, setView] = useState<'login'|'lobby'|'game'>('login')
  const [guess, setGuess] = useState('')

  useEffect(() => {
    let id: number | undefined
    if (current?.endsAt) {
      const tick = () => {
        setEndsIn(Math.max(0, current.endsAt - Date.now()))
        id = requestAnimationFrame(tick)
      }
      id = requestAnimationFrame(tick)
    }
    return () => { if (id) cancelAnimationFrame(id) }
  }, [current?.endsAt])

  const connect = () => {
    const ws = new WebSocket(serverUrl)
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', name, category }))
      setView('lobby')
    }
    ws.onclose = () => { setConnected(false); setView('login') }
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'welcome') {
        const snap: Snapshot = msg.data
        setPlayers(snap.players)
        setCurrent(snap.current)
      } else if (msg.type === 'players_update') {
        setPlayers(msg.data)
      } else if (msg.type === 'round_start') {
        setCurrent(msg.data)
        setView('game')
      } else if (msg.type === 'round_end') {
        setCurrent(null)
      }
    }
  }

  const sendStart = () => {
    wsRef.current?.send(JSON.stringify({ type: 'start' }))
  }

  const sendGuess = () => {
    const text = guess.trim()
    if (!text) return
    wsRef.current?.send(JSON.stringify({ type: 'guess', text }))
    setGuess('')
  }

  const timerPct = useMemo(() => {
    const total = 30000
    const left = Math.min(Math.max(endsIn, 0), total)
    return (left / total) * 100
  }, [endsIn])

  return (
    <div className="min-h-full p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Russian Learning Game</h1>
          <div className="text-slate-400 text-sm">{connected ? 'Online' : 'Offline'}</div>
        </header>

        {view === 'login' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card space-y-3">
              <div>
                <label className="block mb-1 text-sm text-slate-300">Server (WS)</label>
                <input className="input" value={serverUrl} onChange={e=>setServerUrl(e.target.value)} placeholder="ws://localhost:8080" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Player name</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">Category</label>
                <select className="input" value={category} onChange={e=>setCategory(e.target.value as any)}>
                  <option value="All">All</option>
                  <option value="Food">Food</option>
                  <option value="Animals">Animals</option>
                  <option value="Transport">Transport</option>
                </select>
              </div>
              <button className="btn btn-primary w-full" onClick={connect} disabled={!name.trim()}>
                Connect
              </button>
            </div>
            <div className="card">
              <h2 className="font-semibold mb-2">How to play?</h2>
              <p className="text-slate-300 text-sm">Join a room by category and guess the hidden Russian word using the hint.</p>
            </div>
          </div>
        )}

        {view === 'lobby' && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card md:col-span-2">
              <h2 className="font-semibold mb-3">Online players</h2>
              <ul className="space-y-2">
                {players.map(p => (
                  <li key={p.name} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-slate-400 text-sm">{p.score} pts</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card space-y-3">
              <button className="btn btn-success w-full" onClick={sendStart}>Start game</button>
            </div>
          </div>
        )}

        {view === 'game' && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card md:col-span-2 space-y-4">
              <div className="text-3xl tracking-widest text-center">{current?.masked ?? '—'}</div>
              <div className="text-center text-slate-300">{current?.hint}</div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{width: `${timerPct}%`}} />
              </div>
              <div className="flex gap-2">
                <input className="input" value={guess} onChange={e=>setGuess(e.target.value)} placeholder="Your guess in Russian..." onKeyDown={e=>{ if(e.key==='Enter') sendGuess() }} />
                <button className="btn btn-primary" onClick={sendGuess}>Send</button>
              </div>
            </div>
            <div className="card">
              <h2 className="font-semibold mb-3">Scoreboard</h2>
              <ul className="space-y-2">
                {players.map(p => (
                  <li key={p.name} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-slate-400 text-sm">{p.score} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}


