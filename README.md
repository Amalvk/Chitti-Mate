# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Scheduled lot function

`netlify/functions/run-due-lots.mts` is a Netlify Scheduled Function (runs every minute) that draws the lot for any active cycle whose auction time has passed, regardless of whether anyone has the app open. It backstops `src/hooks/useLotAutoTrigger.ts`, which only fires from an open browser tab — without this function, a chitti nobody is looking at right at auction time would just sit undrawn until someone next opened it. Both call the same idempotent logic, so it's safe for either (or both) to run.

It authenticates with Firestore via a Firebase service account, passed as the `FIREBASE_SERVICE_ACCOUNT` environment variable (base64-encoded service account JSON — never the `VITE_`-prefixed client config, and never committed).

To set it up:

1. In the [Firebase console](https://console.firebase.google.com), open **Project settings → Service accounts → Generate new private key**. This downloads a JSON file — treat it like a password.
2. Base64-encode it to one line:
   - macOS/Linux: `base64 -i service-account.json | tr -d '\n'`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))`
3. In Netlify: **Site settings → Environment variables**, add `FIREBASE_SERVICE_ACCOUNT` with that value. (For local testing with `netlify dev`, put it in `.env.local` instead — it's already gitignored.)
4. Deploy. Netlify picks up the schedule from the function's own `config.schedule` export — no further dashboard configuration needed.
