# Phase 10 — safe library bumps (pure-JS / no native change)

Branch `phase10-safe-bumps` off Phase 9 `25d0f8f`. Run 2026-09-18.
Toolchain unchanged from Phase 9: RN 0.75.5 · Gradle 8.8 · AGP 8.5.0 · Kotlin
1.9.25 · JDK 21 · compileSdk 34 · targetSdk 33 · Realm 12.13.1.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 365 537 B (Phase 9: 5 325 389; +40 kB, axios 1.20 + react-hook-form 7.88) |
| V2 `tsc` | **513**, error set identical to Phase 9 (react-native-logs 5.6 generics absorbed, see below) |
| V3 Jest | 57/57 |
| V4 | 8/8; release 121.93 MB |
| V5 vs Phase 9 | manifest, permissions and file list **identical** — no native change |
| V6 install-over (Realm 12 data) | boot with clean logcat, login, 11 rows, draft reopen through all pages (nested `FATHER.NUM_IDENT`), FAB group, duplicate → save (12), validate copy, Doe death edit → save → validate, Validé filter, long-press select ×2 → ENVOYER → both `ERREUR` (dev gateway 401, expected), search "Doe" (1 hit), export (`dbSenegal.db` 565 248 B, `declarations.realm` 24 576 B, `manifest.txt`) |
| V7 | birth identical apart from `externalId`; death **byte-identical** to the Phase 0 goldens — axios 1.20 serialises the same body as 1.3 |

## Changes

| Package | From | To | Note |
|---|---|---|---|
| `axios` | ^1.3.4 | ^1.20.0 | JSON body on the wire unchanged (V7). |
| `react-hook-form` | ^7.40.0 | ^7.88.0 | Forms exercised end to end in V6 (birth 5 pages, death 4 pages, duplicate, edit-save). |
| `lodash` | ^4.17.21 | ^4.18.1 | |
| `papaparse` | ^5.4.1 | ^5.7.0 | |
| `react-native-logs` | ^5.0.1 | ^5.6.0 | 5.1 changed `createLogger`'s generics: first parameter is now the transport type, second the level union. `Logger.tsx` passes `transportFunctionType<any>` explicitly; the latent `"war"` level typo became `"warn"` (type-only, runtime levels come from `config`). |
| `react-native-permissions` | ^4.1.1 | ^4.1.5 | Patch; no manifest change (V5). |
| `@types/lodash` | ^4.14.192 | ^4.17.25 | |
| `@types/react-test-renderer` | ^18.0.0 | ^18.3.1 | Matches react-test-renderer 18.3.1. |

Lockfile built on Phase 9's (`npm install`, no delete). No Gradle, Java or native
change; no new `patches/`.

## Not bumped (deliberately)

| Package | Why |
|---|---|
| `@react-native-community/datetimepicker` 8.0.1 | 8.2+ peer-pins React 19. Phase 11. |
| `react-native-svg` 14.1.0 | 15 is a major. Phase 11. |
| `react-native-paper` 4.12.5 (+ patch) | 5 is the Phase 11 major; removes the `shadowOffset` patch and the 8 `tvParallaxProperties` tsc errors. |
| `@types/node` 18.x | TypeScript 5.0.4 cannot parse 26.x typings. |
| `typescript` 5.0.4 | Phase 7 choice; bumping is a separate step. |
