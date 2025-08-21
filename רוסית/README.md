# משחק לימוד רוסית מרובה משתתפים

מבנה הפרויקט:
```
/רוסית
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

הוראות הפעלה:
- שרת:
```
cd רוסית/server
npm install
node server.js
```
- קליינט:
```
cd רוסית/client
npm install
npm run dev
```
דפדפן: http://localhost:5173

ברירת מחדל WS: ws://localhost:8080

תכונות:
- שרת WebSocket (ws) עם קטגוריות, טיימר 30ש׳, ניקוד וניהול סבבים.
- קליינט React + Tailwind עם Login, Lobby ולוח משחק מודרני.
