# Russian Learning Multiplayer Game

Project layout:
```
/russian
  /server
    package.json
    server.js
  /client
    package.json
    index.html
    tailwind.config.js
    postcss.config.js
    vite.config.ts
    tsconfig.json
    /src
      index.css
      main.tsx
      App.tsx
```

Run locally:
- Server:
```
cd russian/server
npm install
node server.js
```
- Client:
```
cd russian/client
npm install
npm run dev
```
Browser: http://localhost:5173

Default WS: ws://localhost:8080

Features:
- WebSocket server (ws) with categories, 30s timer, score and rounds management.
- React + Tailwind client with Login, Lobby and modern Game UI.
