# Income & Expense Tracker (PWA)

A private, offline-first Progressive Web App for tracking personal income and expenses in Mongolian Tugrik (₮). Includes a salary calculator with SI/WHT deductions and field allowance.

Data is stored **only in your browser** (localStorage) — nothing leaves your device. Export JSON regularly as backup.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML + CSS + JS in one file) |
| `manifest.json` | Makes it installable on your phone |
| `sw.js` | Service worker — enables offline use |
| `icon.svg` | App icon |

---

## Run it locally (quick test)

Double-click `index.html`. It opens in your browser and works — but the **service worker won't register** from `file://`, so offline install won't work until you serve it over HTTP.

### Serve it with a local server

Any of these works. Pick one you have installed.

**Python (already on most systems):**
```powershell
cd D:\3_Claude\PowerApps\expense-pwa
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Node.js:**
```powershell
cd D:\3_Claude\PowerApps\expense-pwa
npx serve .
```

**VS Code:** install the "Live Server" extension, right-click `index.html` → *Open with Live Server*.

---

## Install it on your phone (free, forever)

To install on your phone, the app needs to be served over **HTTPS** on a public URL. Two free options:

### Option A — GitHub Pages (recommended)

1. Create a free GitHub account if you don't have one.
2. Create a new **public** repository (e.g. `expense-tracker`).
3. Upload all four files (`index.html`, `manifest.json`, `sw.js`, `icon.svg`) to the repo.
4. In the repo: **Settings → Pages → Source: main branch, folder: / (root) → Save**.
5. Wait ~1 minute. Your app is live at `https://<your-username>.github.io/expense-tracker/`.
6. Open that URL on your phone's browser (Chrome/Edge on Android, Safari on iOS).
7. **Android/Chrome:** menu → *Install app* / *Add to Home screen*.
8. **iOS/Safari:** share button → *Add to Home Screen*.

Done — it now behaves like a native app: full-screen, icon on home screen, works offline.

### Option B — Netlify Drop (30 seconds, no account needed for first deploy)

1. Go to https://app.netlify.com/drop
2. Drag the entire `expense-pwa` folder onto the page.
3. You get a live HTTPS URL immediately. Open on your phone → *Install*.

*(Free account recommended so you can update it later without a new URL.)*

---

## Features

- **Dashboard** — KPIs, needs/wants/savings donut, planned vs actual, category breakdown, 6-month trend
- **Salary Calculator** — hourly rate, normal/OT/NT/OT+NT hours, field allowance × days, SI %, WHT %; saves a record and auto-adds to Income
- **Income** — log entries with type + notes, filterable by month/year
- **Expenses** — actual and planned, categorized, filterable
- **Categories** — customize, tagged Needs / Wants / Savings
- **Settings** — dark mode toggle (top-right icon), export/import/reset

---

## Backup

**Settings → Export JSON.** Save the file somewhere safe (email it to yourself, cloud drive, etc.). If you ever clear browser data or switch phones, use **Import JSON** to restore.

---

## Customization notes

Common tweaks you might want later:

- **Currency:** search `₮` in `index.html` and swap.
- **Default SI/WHT:** change `value="11.5"` / `value="10"` in the Salary Calculator inputs.
- **Default field allowance:** change `value="50000"` in the same section.
- **Primary color:** change `--primary: #2563EB;` in the CSS `:root` block.

---

## Limitations to be aware of

- Data lives in one browser on one device. Backup regularly via Export.
- Clearing browser data / uninstalling the PWA erases your data.
- No multi-user or sync — this is a personal single-device app. If you want sync across devices, the next step would be swapping localStorage for Firebase Firestore (still free for personal use). Ask when you want that.
