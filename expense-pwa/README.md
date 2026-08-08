# Income & Expense Tracker (PWA)

A private, offline-first Progressive Web App for tracking personal income and expenses in Mongolian Tugrik (₮). Includes a salary calculator with SI/WHT deductions and field allowance.

Data is stored **only in your browser** (localStorage) — nothing leaves your device. Export JSON regularly as backup.

---

## Files

**Deploy the whole `expense-pwa` folder.** Every file below ships; `sw.js`
caches all of them and `manifest.json` references four of the icons. Listing a
subset here is what let an earlier version of this README tell people to upload
four files and leave the rest 404ing.

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML + CSS + JS in one file) |
| `manifest.json` | Makes it installable on your phone |
| `sw.js` | Service worker — enables offline use |
| `icon.svg` | App icon, "any" purpose — rounded square, drawn edge to edge |
| `icon-maskable.svg` | App icon, "maskable" — mark inside the platform safe zone |
| `icon-180.png` | apple-touch-icon; iOS ignores SVG here |
| `icon-192.png` | Raster maskable icon, used by most Android launchers |
| `icon-512.png` | Raster maskable icon, install prompts and splash |
| `README.md`, `VERIFICATION.md` | Documentation; harmless to ship, not required |

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

**There are two versions of this, and picking the wrong one publishes things you
did not mean to publish.** Which one you want depends on what you are holding.

#### A1 — you have only the `expense-pwa` folder

1. Create a free GitHub account if you don't have one.
2. Create a new **public** repository (e.g. `expense-tracker`).
3. Upload the **entire contents of `expense-pwa`** to the repo root. Not a
   hand-picked list — the app ships eight files, and a partial upload leaves the
   icons 404ing, which is exactly how the installed app ended up with a blank
   tile.
4. **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**.
5. Wait ~1 minute. Live at `https://<your-username>.github.io/expense-tracker/`.

#### A2 — you have the whole project repo (the one with `reports/` and `tools/`)

**Do not follow A1 with this repo.** Serving the branch root would put
`reports/`, `knowledge/`, `tools/` and `CLAUDE.md` — the entire review history
and engineering process — on the public URL, and it would leave the app at
`/expense-pwa/index.html` instead of at the top of the site.

`.github/workflows/deploy.yml` exists for exactly this and already solves both
halves: it publishes **`expense-pwa/` only**, at the **site root**, and it
refuses to publish a tree where `npm run verify` fails.

1. Create a new **public** repository. **A new one** — pushing this project into
   a repo that already holds a hand-uploaded copy of the app would overwrite
   that repo's history.
2. Push this project to it.
3. **Settings → Pages → Source: GitHub Actions.** Not "Deploy from a branch" —
   that setting bypasses the workflow and lands you back in the A1 problem.
4. **Actions → Deploy → Run workflow.** The deploy is manual on purpose; see
   `sw.js:1` and the header of the workflow for why.
5. Live at `https://<your-username>.github.io/<repo>/`, with the app at the top
   of the site.

#### Then, on the phone

1. Open the URL on your phone's browser (Chrome/Edge on Android, Safari on iOS).
2. **Android/Chrome:** menu → *Install app* / *Add to Home screen*.
3. **iOS/Safari:** share button → *Add to Home Screen*. See `DEPLOY-IOS.md` for
   the iOS-specific traps and the one open status-bar question.

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
- **Analytics** — daily breakdown, calendar heatmap, category chips, monthly trend
- **Budget Planning** — planned expenses, one-off or recurring, vs actual spend
- **Savings Goals** — target, deadline, contributions, progress and pace
- **Reminders** — upcoming planned expenses, goal deadlines and recurring items
- **Currency Converter** — rates cached for offline use, stale rates labelled
- **Settings** — sixteen themes behind a picker (top-right icon), export/import/reset

---

## Backup

**Settings → Export JSON.** Save the file somewhere safe (email it to yourself, cloud drive, etc.). If you ever clear browser data or switch phones, use **Import JSON** to restore.

---

## Cloud Sync (optional, needs setup — read the warning first)

Cloud sync ships **disabled and hidden**. The `firebaseConfig` object in `index.html` is empty, so the Cloud Sync card does not appear in Settings and none of the sync code runs. This is deliberate: enabling it means editing the source, which is not something to put in front of someone just tracking their expenses.

> **Warning — do not enable this yet.**
> The current sync writes the entire database to one Firestore document with `set()`, last-write-wins, and only reads at sign-in. Two devices signed into the same account will each overwrite the other with no conflict prompt: add expenses on your phone, open the app on a tablet that was left running, and the phone's entries are gone. Sync failures are also invisible — the Settings card keeps showing the previous success timestamp.
>
> These are **preconditions** for turning sync on, not follow-ups. Stated as conditions rather than as ticket ids, because the ids move between rounds and this paragraph was still citing two that no longer describe it: cloud data must be routed through the same import validation and migration that local data goes through — today `loadFromCloud()` assigns the database directly and writes the raw string to storage, so none of it runs — and a sync failure must be visible rather than leaving the previous success timestamp on screen. Until both hold, use **Settings → Export JSON** for backup. It works, and it is the honest answer to "what if I lose my phone".

If you understand the above and still want it on:

1. **Create a Firebase project.** Go to `console.firebase.google.com` → sign in with Google → **Add project** → give it any name → skip Analytics → Create.

2. **Add a Web App.** In the project overview, click the `</>` web icon → name it "expense-tracker" → skip Hosting → Register app. Copy the config object shown (it looks like `{ apiKey: "...", ... }`).

3. **Enable Google Sign-In.** Left sidebar → **Authentication** → **Get started** → Sign-in method tab → **Google** → Enable → Save.

4. **Enable Firestore.** Left sidebar → **Firestore Database** → Create database → nearest location → **Production mode** → Create.

5. **Set Firestore rules.** Rules tab → replace with the following, then Publish:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

6. **Authorize your domain.** Authentication → Settings → Authorized domains → **Add domain** → paste your `<username>.github.io`.

7. **Paste your config into `index.html`.** Find `const firebaseConfig = {` near the top of the `<script>` block and replace the empty values with the ones from step 2. Save and re-upload.

8. **Reload the app.** The Cloud Sync card now appears in Settings. Sign in with Google.

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
- No multi-user or sync out of the box — this is a personal single-device app. Cloud sync exists in the source but ships disabled and is not safe to enable yet; see **Cloud Sync** above.
