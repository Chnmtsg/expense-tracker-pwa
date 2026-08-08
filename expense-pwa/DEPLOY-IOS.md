# Shipping this app on iOS

There are two different things "launch on iOS" can mean, they cost wildly
different amounts, and **only one of them is blocked by anything real.**

| | Path A — install from Safari | Path B — the App Store |
|---|---|---|
| What the user gets | An app icon on the home screen, full screen, offline | An app icon on the home screen, full screen, offline |
| Apple Developer Program | not needed | **$99/year** |
| A Mac | not needed | **required** (or a paid cloud-Mac CI) |
| Apple review | none | 1–7 days, and it can be rejected |
| Time to first install | minutes after hosting | weeks |
| Blocked on | **HTTPS hosting — the only blocker** | HTTPS hosting, a Mac, $99, and review |

**Path A is a real launch.** It is not a lesser version of the app: same code,
same offline behaviour, same home-screen icon, no browser chrome. For an
offline-first personal finance tool with no payments and no push, it is the
whole product. **Do Path A first regardless**, because Path B needs it working
anyway.

**Nothing here can start until the app is live on HTTPS**, exactly as
`DEPLOY-ANDROID.md` says. That single step is what has been outstanding for the
whole life of this project, and it unblocks Android, iOS and the desktop install
at the same time.

---

## 0. What is already done

| Requirement | State |
|---|---|
| `manifest.json` with `name`, `short_name`, `id`, `start_url`, `scope` | done |
| `display: standalone` | done |
| `apple-touch-icon` at 180×180, rendered from the *non*-maskable art | done |
| `apple-mobile-web-app-capable` | done |
| `apple-mobile-web-app-title` (`Expenses`, matching `short_name`) | done |
| `viewport-fit=cover` | done |
| `env(safe-area-inset-*)` on header, tab bar, sheets and modals | done |
| Service worker, offline shell, cache-first | done |
| Persistent-storage request + a card that explains iOS eviction | done |

**The packaging inputs are complete for Path A.** What is missing is hosting.

---

## 1. Host it on HTTPS

Any static host. The app is four files and needs no build.

`README.md` documents GitHub Pages, and `.github/workflows/deploy.yml` already
publishes `expense-pwa/` to Pages gated on `npm run verify`. **It has never run,
because this repository has no remote.**

**Unlike Android, iOS needs no `assetlinks.json` and no origin-root file.** The
Digital Asset Links trap that decides which repo you use for a TWA does not
apply here at all — a subpath origin like
`https://<user>.github.io/expense-tracker/` is fine for Path A. If you only ever
want iOS, host it wherever is easiest.

One iOS-specific requirement: **the certificate must be valid and the origin must
be genuine HTTPS.** iOS will not register a service worker over http, over a
self-signed certificate, or from a `file://` URL. `localhost` is exempt for
desktop testing but you cannot install to an iPhone home screen from it.

---

## 2. Install it (Path A)

On the iPhone, in **Safari** — not Chrome, not in-app browsers:

1. Open the URL.
2. Share sheet → **Add to Home Screen**.
3. The caption is pre-filled `Expenses`; confirm.

It now launches full screen with no browser chrome and works offline.

**Traps worth knowing before you judge the result:**

- **Only Safari can install.** Chrome/Firefox/Edge on iOS are Safari underneath
  but do not offer Add to Home Screen. If the user is in one, they see a normal
  web page and conclude the app does not install.
- **Storage is evicted after ~7 days of no use** on iOS if the app is not
  installed to the home screen. Installed apps are treated better, and this is
  exactly why the Storage Status card exists and why it asks for persistent
  storage. **Export a backup before relying on it.**
- **Each install is its own store.** Safari-tab data and home-screen-app data
  are separate on iOS. Data entered before installing does not travel into the
  installed app. Export/import is the bridge.
- **No push notifications unless installed** (iOS 16.4+, home screen only). The
  app's OS-notification path degrades to the in-app bell, which is already how
  it is written.

---

## 3. The one open question, and it needs one screenshot

`apple-mobile-web-app-status-bar-style` is **deliberately not set**, and
`index.html` records why beside the tags.

The header already pads with `env(safe-area-inset-top)`, so the CSS is written
for `black-translucent` — the value that lets the web view extend under the
status bar. But whether that renders correctly on a notched iPhone is a question
about a render, and this project does not settle a render question by reading
markup. It has been wrong doing that before.

**What settles it:** install via Path A on any notched iPhone, screenshot the
Dashboard, and look at the top of the screen.

| What the screenshot shows | What to do |
|---|---|
| Header content sits clear of the clock and notch | Set `black-translucent` — the app gains the status bar strip and the padding is already correct |
| Header content collides with the clock, or there is a dead band above the header | Leave it unset. `default` is correct and the `safe-area-inset-top` padding is harmless |

Until that screenshot exists, `default` is the safe state: iOS reserves the
status bar and nothing can overlap.

---

## 4. Path B — the App Store

Only worth reading if you specifically need App Store presence. **It buys
distribution and search, not capability.** Everything the app does, it does in
Path A.

### The hard blockers, stated first

1. **A Mac.** Xcode runs only on macOS, and an App Store binary is built and
   signed with Xcode. **You are on Windows 11.** The workarounds are a cloud-Mac
   CI (Codemagic, Bitrise, MacStadium) or borrowing a Mac — all real, none free
   of setup.
2. **Apple Developer Program — $99/year**, renewed annually or the app is pulled.
3. **App Review Guideline 4.2 (Minimum Functionality).** Apple rejects apps that
   are "simply a web clipping or a repackaged website". A wrapper around a PWA is
   precisely the shape that guideline names. It is not an automatic rejection —
   apps that use native capability and feel native do pass — but **assume it will
   be challenged and budget for a rejection round.**

### What it would look like here, if you do it

The app itself **does not change** — the same rule `DEPLOY-ANDROID.md` states for
the TWA. No framework, no bundler, no build step is added to `expense-pwa/`.
Everything happens outside it, in a separate project that loads these files in a
`WKWebView`.

- **Capacitor** is the usual choice; it wraps the existing files and gives native
  storage, which is the one thing genuinely worth having, because it **removes
  the iOS eviction problem the Storage Status card exists to warn about.**
- **PWABuilder** generates an iOS package from the manifest with the least work
  and the highest 4.2 risk, because the output is the thinnest possible wrapper.

**This is an architectural decision and needs a ruling before anyone starts.**
The standing decision in `reports/chief-architect.md` puts "no framework, no
runtime build step, no bundler" in the not-open-for-discussion list. A wrapper
*outside* `expense-pwa/` is consistent with the Android precedent — but it adds a
second place the app can be built from, a second store seam if native storage is
used, and an annual bill. None of that should be started on a whim.

---

## 5. Recommended order

1. **Host on HTTPS.** Unblocks iOS, Android and desktop together. It is the only
   thing standing between this app and being installed on a phone today.
2. **Install via Path A** on the real device and use it for a week.
3. **Take the status-bar screenshot** and close §3 either way.
4. **Then decide about Path B**, with a week of real use to say whether App
   Store presence is worth a Mac, $99/year and a 4.2 argument.
