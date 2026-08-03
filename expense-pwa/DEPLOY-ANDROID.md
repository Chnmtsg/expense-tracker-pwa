# Publishing to the Play Store (Trusted Web Activity)

A TWA is the real Android app wrapper around this PWA. The app itself does not
change — no framework, no bundler, no build step is added to `expense-pwa/`.
Everything below happens *outside* it.

**Nothing here can start until the app is live on HTTPS.** That is the one hard
prerequisite, and it is also the step that gets you a usable phone install
today, before any Play Store work.

---

## 0. What is already done

| Requirement | State |
|---|---|
| `manifest.json` with `name`, `short_name`, `id`, `start_url`, `scope` | done |
| `display: standalone`, `theme_color`, `background_color` | done |
| Maskable icons at 192 and 512 | done |
| **`purpose: "any"` raster at 512** — Bubblewrap uses it for the launcher icon | done (`icon-512-any.png`) |
| Service worker with a fetch handler and an offline shell | done (`sw.js`) |
| Works offline from cache | done |

So the packaging inputs are complete. What is missing is hosting and the
Play-side accounts, which are yours to provide.

---

## 1. Host it on HTTPS

Any static host works — the app is files. GitHub Pages is free and documented
in `README.md`.

### The one trap, and it decides which repo you use

Digital Asset Links must be served from the **origin root**:

```
https://<your-domain>/.well-known/assetlinks.json
```

Not from a subpath. So if you publish to `https://<user>.github.io/expense-tracker/`,
the origin is `<user>.github.io` and the file has to live in the repo that
serves that origin's root — the **`<user>.github.io` user-site repo** — not in
the project repo.

Two clean options:

- **User-site repo.** Put the app in `<user>.github.io/expense-tracker/` and
  `assetlinks.json` in `<user>.github.io/.well-known/`. Both are yours.
- **Your own domain** pointed at any static host. Simplest for asset links, and
  it is the option to pick if you ever want a second app on the same origin.

Verify before continuing — this must return JSON over HTTPS with no redirect:

```
curl -sSL https://<your-domain>/.well-known/assetlinks.json
```

---

## 2. Generate the Android project

[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) reads the manifest
and produces a signed APK/AAB.

```
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://<your-domain>/expense-tracker/manifest.json
bubblewrap build
```

Answers that matter when it prompts:

| Prompt | Use |
|---|---|
| Application ID | reverse-DNS you control, e.g. `com.<you>.expensetracker` — **permanent, cannot change after publishing** |
| Display mode | `standalone` |
| Status bar colour | `#2563EB` (matches `theme_color`) |
| Splash colour | `#F8FAFC` (matches `background_color`) |
| Signing key | create one, then **back it up** — see below |

### The keystore

`bubblewrap` creates `android.keystore`. **Back it up somewhere you will still
have in five years, with its passwords.** Losing it means you can never publish
an update to the listing — Google cannot recover it and the only remedy is a
new app listing with a new URL and zero installs.

Do not commit it. Add to `.gitignore`:

```
android.keystore
*.keystore
twa-manifest.json
android/
```

---

## 3. Digital Asset Links

`bubblewrap` prints the SHA-256 fingerprint of your signing key, or:

```
keytool -list -v -keystore android.keystore -alias android
```

Put this at `https://<your-domain>/.well-known/assetlinks.json`, substituting
your application ID and fingerprint:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.<you>.expensetracker",
    "sha256_cert_fingerprints": ["AA:BB:CC:..."]
  }
}]
```

**If Play App Signing is enabled** (it is, by default, for new apps), Google
re-signs your upload with *their* key. The fingerprint that belongs in this file
is then the one Play Console shows under **Release → Setup → App integrity**,
not your local keystore's. Getting this wrong is the single most common TWA
failure, and its symptom is the app opening with a browser address bar visible
instead of full-screen.

Verify with Google's own checker before you ship:
`https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://<your-domain>&relation=delegate_permission/common.handle_all_urls`

---

## 4. Play Console

- One-off US$25 developer registration.
- Upload the `.aab` from `bubblewrap build`.
- **A privacy policy URL is required** even for an app that collects nothing.
  Say plainly that all data stays on the device, the app has no accounts and no
  analytics, and the only network request is an exchange-rate lookup.
- Data safety form: no data collected, no data shared. That is accurate — the
  store is `localStorage` and there is no backend.
- Content rating questionnaire, store listing, screenshots.

---

## 5. After publishing

Update flow: change the app, bump `CACHE` in `sw.js`, redeploy the site. The
TWA loads the live site, so **most changes need no new APK at all** — that is
the main advantage of this packaging over a rewrite.

You only need a new Play release when the manifest identity changes: app name,
icons, application ID, or the target URL.

---

## Known limits, stated honestly

- **`localStorage` is the store**, and Android can evict it under storage
  pressure just as iOS can. The app already warns about this and offers Export
  JSON. Being installed as a TWA does not change that. Back-ups remain manual.
- **The rate lookup is a single third-party endpoint** with no key and no
  fallback. Offline it serves a cached rate with its date, which is honest, but
  a sustained outage means no fresh rates.
- **Play may flag a TWA as "just a website"** if the listing does not make the
  offline and install value clear. Write the listing around what it does on the
  device, not around the technology.
