# games2

## מערכת סנכרון אוטומטי לגיטהאב (Windows)

המאגר כולל מערכת פשוטה לעדכון אוטומטי של כל שינוי מקומי לגיטהאב: הוספה, קומיט ודחיפה (push) בפקודה אחת, ואפשר גם לתזמן הרצה כל X דקות.

### מה כלול
- `scripts/git-sync.ps1` — סקריפט PowerShell שמבצע add/commit/pull --rebase/push בצורה מסודרת.
- `scripts/git-sync.bat` — עטיפה להפעלה כפולה (Double‑Click) או מהרצת CMD.
- `scripts/setup-git-sync-task.ps1` — יצירת Scheduled Task שמריץ סנכרון אוטומטי כל מספר דקות.

### דרישות מקדימות
- Git מותקן על המחשב (`git --version`).
- המאגר מאותחל כ־git repo ויש Remote מוגדר (למשל `origin`). אם אין:
  1. פתח PowerShell בתיקיית הפרויקט (`games2`).
  2. הרץ: `git init`
  3. הוסף רימוט: `git remote add origin <URL-של-המאגר-בגיטהאב>`
  4. אם זו הפעם הראשונה: `git pull origin main --rebase` (או שם ברנץ' אחר)

### שימוש ידני (Commit & Push)
1. פתח PowerShell בתיקיית `games2/scripts` או לחץ פעמיים על `git-sync.bat`.
2. לביצוע סנכרון עם הודעת קומיט מותאמת:
   - PowerShell:
     - `powershell -NoProfile -ExecutionPolicy Bypass -File .\git-sync.ps1 "הודעת קומיט"`
   - CMD/Double‑Click:
     - `git-sync.bat "הודעת קומיט"`
3. ללא הודעה — יווצר מסר ברירת מחדל עם זמן: `chore(sync): update at <timestamp>`

מה הסקריפט עושה:
- Pull עם rebase כדי למזער קונפליקטים.
- `git add -A` לכל הקבצים.
- קומיט רק אם יש שינויים.
- Push לרימוט הקיים.

### תזמון אוטומטי כל X דקות (Scheduled Task)
ניתן להקים משימה מתוזמנת שתבצע סנכרון קבוע.

יצירה כל 10 דקות (ברירת מחדל):
```
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-git-sync-task.ps1
```

שינוי התדירות (למשל כל 5 דקות):
```
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-git-sync-task.ps1 -EveryMinutes 5
```

הסרה של המשימה המתוזמנת:
```
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-git-sync-task.ps1 -Remove
```

המשימה מריצה את `git-sync.ps1` עם הודעת קומיט כללית "scheduled sync". אפשר תמיד להריץ ידנית עם הודעה מפורטת כשצריך.

### טיפים
- מומלץ להגדיר `.gitignore` כדי לא להעלות קבצים מיותרים.
- אם יש שינויים מרובים מרחוק וקונפליקטים, הסקריפט יכשל בזמן rebase ותידרש התערבות ידנית לפתרון הקונפליקטים ואז להריץ שוב.
- ודא שלרימוט יש הרשאות Push (SSH/Token) בהתאם להגדרות המאגר בגיטהאב.

## פריסה לאתר (GitHub Pages) — ידני ואוטומטי, רק `main`

הוגדר Workflow שמפרסם את התוכן של התיקייה `site/` ל־GitHub Pages:

- מתי נפרס אוטומטית: בכל Push ל־`main` לקבצים תחת `site/`.
- הרצה ידנית: בלשונית Actions ב־GitHub → "Deploy to GitHub Pages" → Run workflow.
- הקבצים באתר תמיד מגיעים מתיקיית `site/` בלבד, וכך הפריסה ספציפית ל־`games2` ול־branch `main`.

### שלבים ראשונים
1. פתחו ב־GitHub את Settings → Pages ובחרו Source: GitHub Actions.
2. עדכנו קבצים ב־`site/` והריצו `scripts/git-sync.bat "עדכון אתר"`.
3. המתינו דקה-שתיים עד שה־Action יסיים. כתובת האתר תופיע בסוף ה־Action.

### שינויים שוטפים
- כל שינוי בקבצי `site/` + סנכרון (`git-sync`) יפרוס אתר אוטומטית.
- אם אין שינוי אך רוצים לבנות מחדש, הפעילו ידנית את ה־Workflow.