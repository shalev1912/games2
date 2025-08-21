import React, { useEffect, useMemo, useRef, useState } from 'react'

type Player = { name: string; score: number }
type Snapshot = {
  players: Player[]
  category: string
  current: { masked: string; hint: string; endsAt: number } | null
}

export default function App() {
  const [serverUrl, setServerUrl] = useState('ws://localhost:8080')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'אוכל'|'חיות'|'תחבורה'|'הכל'>('הכל')
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
        // show answer quickly via hint replacement
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
          <h1 className="text-2xl font-bold">משחק לימוד רוסית</h1>
          <div className="text-slate-400 text-sm">{connected ? 'מחובר' : 'מנותק'}</div>
        </header>

        {view === 'login' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card space-y-3">
              <div>
                <label className="block mb-1 text-sm text-slate-300">שרת (WS)</label>
                <input className="input" value={serverUrl} onChange={e=>setServerUrl(e.target.value)} placeholder="ws://localhost:8080" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">שם שחקן</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="השם שלך" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-slate-300">קטגוריה</label>
                <select className="input" value={category} onChange={e=>setCategory(e.target.value as any)}>
                  <option value="הכל">הכל</option>
                  <option value="אוכל">אוכל</option>
                  <option value="חיות">חיות</option>
                  <option value="תחבורה">תחבורה</option>
                </select>
              </div>
              <button className="btn btn-primary w-full" onClick={connect} disabled={!name.trim()}>
                התחבר
              </button>
            </div>
            <div className="card">
              <h2 className="font-semibold mb-2">איך משחקים?</h2>
              <p className="text-slate-300 text-sm">התחבר, הצטרף לחדר לפי קטגוריה, ונחש את המילה המוסתרת ברוסית לפי הרמז בעברית/אנגלית.</p>
            </div>
          </div>
        )}

        {view === 'lobby' && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card md:col-span-2">
              <h2 className="font-semibold mb-3">שחקנים מחוברים</h2>
              <ul className="space-y-2">
                {players.map(p => (
                  <li key={p.name} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-slate-400 text-sm">{p.score} נק'</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card space-y-3">
              <button className="btn btn-success w-full" onClick={sendStart}>התחל משחק</button>
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
                <input className="input" value={guess} onChange={e=>setGuess(e.target.value)} placeholder="ניחוש ברוסית..." onKeyDown={e=>{ if(e.key==='Enter') sendGuess() }} />
                <button className="btn btn-primary" onClick={sendGuess}>שלח</button>
              </div>
            </div>
            <div className="card">
              <h2 className="font-semibold mb-3">לוח ניקוד</h2>
              <ul className="space-y-2">
                {players.map(p => (
                  <li key={p.name} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-slate-400 text-sm">{p.score} נק'</span>
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


