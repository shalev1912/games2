const http = require('http');
const os = require('os');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Simple word bank by categories
const WORDS = {
	"אוכל": [
		{ ru: "яблоко", hint: "תפוח / Apple" },
		{ ru: "хлеб", hint: "לחם / Bread" },
		{ ru: "сыр", hint: "גבינה / Cheese" },
	],
	"חיות": [
		{ ru: "кошка", hint: "חתול / Cat" },
		{ ru: "собака", hint: "כלב / Dog" },
		{ ru: "птица", hint: "ציפור / Bird" },
	],
	"תחבורה": [
		{ ru: "машина", hint: "מכונית / Car" },
		{ ru: "поезд", hint: "רכבת / Train" },
		{ ru: "самолет", hint: "מטוס / Airplane" },
	],
};

const ALL_CATEGORIES = Object.keys(WORDS);

function pickWord(category) {
	let pool = [];
	if (category && WORDS[category]) {
		pool = WORDS[category];
	} else {
		pool = ALL_CATEGORIES.flatMap((c) => WORDS[c]);
	}
	return pool[Math.floor(Math.random() * pool.length)];
}

function maskWord(word) {
	// Replace each letter (Cyrillic) with underscore
	return word.replace(/[^\s]/g, '_');
}

// Room state (single global room per category selection for simplicity)
const state = {
	players: new Map(), // ws -> { name, category, score }
	current: null, // { ru, hint, masked, endsAt }
	category: 'הכל',
	timerMs: 30000,
};

function broadcast(obj) {
	const msg = JSON.stringify(obj);
	for (const ws of serverWss.clients) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(msg);
		}
	}
}

function sendTo(ws, obj) {
	if (ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(obj));
	}
}

function snapshot() {
	return {
		players: Array.from(state.players.values()).map((p) => ({ name: p.name, score: p.score })),
		category: state.category,
		current: state.current ? { masked: state.current.masked, hint: state.current.hint, endsAt: state.current.endsAt } : null,
	};
}

function startRound() {
	const chosen = pickWord(state.category === 'הכל' ? null : state.category);
	const masked = maskWord(chosen.ru);
	state.current = {
		ru: chosen.ru,
		hint: chosen.hint,
		masked,
		endsAt: Date.now() + state.timerMs,
	};
	broadcast({ type: 'round_start', data: { masked: state.current.masked, hint: state.current.hint, endsAt: state.current.endsAt } });
	// Schedule end
	if (state.currentTimeout) clearTimeout(state.currentTimeout);
	state.currentTimeout = setTimeout(endRoundTimeUp, state.timerMs);
}

function endRoundTimeUp() {
	if (!state.current) return;
	broadcast({ type: 'round_end', data: { reason: 'time_up', answer: state.current.ru } });
	state.current = null;
	setTimeout(startRound, 1000);
}

function handleGuess(ws, text) {
	if (!state.current) return;
	const guess = String(text || '').trim().toLowerCase();
	if (!guess) return;
	if (guess === state.current.ru.toLowerCase()) {
		const player = state.players.get(ws);
		if (player) player.score += 1;
		broadcast({ type: 'round_end', data: { reason: 'guessed', by: player ? player.name : 'unknown', answer: state.current.ru, scores: snapshot().players } });
		state.current = null;
		if (state.currentTimeout) clearTimeout(state.currentTimeout);
		setTimeout(startRound, 1000);
	}
}

const httpServer = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end('WebSocket server for Russian game is running. Connect via WS.');
});

const serverWss = new WebSocket.Server({ server: httpServer });

serverWss.on('connection', (ws) => {
	// Expect first message to be a join payload
	ws.on('message', (raw) => {
		try {
			const msg = JSON.parse(raw.toString());
			if (msg.type === 'join') {
				const name = String(msg.name || '').trim() || 'שחקן';
				const category = ['אוכל', 'חיות', 'תחבורה'].includes(msg.category) ? msg.category : 'הכל';
				state.players.set(ws, { name, category, score: 0 });
				state.category = category; // simple: room category follows last join
				sendTo(ws, { type: 'welcome', data: snapshot() });
				broadcast({ type: 'players_update', data: snapshot().players });
				if (!state.current) startRound();
			} else if (msg.type === 'guess') {
				handleGuess(ws, msg.text);
			} else if (msg.type === 'start' && !state.current) {
				startRound();
			}
		} catch (e) {
			// ignore malformed
		}
	});

	ws.on('close', () => {
		state.players.delete(ws);
		broadcast({ type: 'players_update', data: snapshot().players });
	});
});

httpServer.listen(PORT, '0.0.0.0', () => {
	const ifaces = os.networkInterfaces();
	const addrs = [];
	for (const name of Object.keys(ifaces)) {
		for (const info of ifaces[name] || []) {
			if (info.family === 'IPv4' && !info.internal) addrs.push(info.address);
		}
	}
	console.log(`WS server listening on 0.0.0.0:${PORT}`);
	if (addrs.length) {
		console.log('Accessible on LAN:');
		for (const a of addrs) console.log(`  ws://${a}:${PORT}`);
	}
});


