# Phase 5 — RN 0.70.6 → 0.71.19 → 0.72.17

Branch `phase5-rn072` off Phase 3 `789b946`. Run 2026-09-17/18. Both hops were
built and validated separately; the tree left in the working copy is hop 2.

## Results

| Check | 0.71.19 | 0.72.17 | Baseline |
|---|---|---|---|
| V1 bundle bytes | 5 641 896 | 5 615 371 | 5 913 234 (Phase 0) |
| V2 `tsc` errors | 504 | **504** (error set identical to Phase 3 at message level) | 504 |
| V3 Jest | 52/52 | 52/52 | 52 |
| V4 | 8/8 | 8/8 | — |
| V5 vs golden | see below | see below | — |
| V6 install-over (Realm 11 file) | boot, login, rows, draft, duplicate, validate, send→ERREUR, search | + vendored stepper incl. tap-to-jump patch | — |
| V7 payloads | — | **birth identical apart from `externalId`; death byte-identical** | Phase 0 captures |

V5 deltas (prod release) are all RN runtime or intended bumps: manifest +
`com.facebook.soloader.enabled=false` (0.72 plugin); permissions unchanged since
Phase 3; `lib/`: `libhermes-executor-release` → `libhermes_executor`,
`libcxxcomponents` (0.71) → `librrc_legacyviewmanagerinterop` (0.72),
`libreact_newarchdefaults` added; vector-icons 10 adds FontAwesome6 fonts + 5
res XMLs. Release APK 92 → 110 MB: RN 0.72 runtime libs +10.7 MB (Hermes alone
doubled) and Realm 11.10.2 +7.4 MB; native libs are stored uncompressed in both
golden and new, so `lib/` size maps 1:1 to APK size.

## Changes beyond the plan's list — all toolchain-forced

| Change | Why |
|---|---|
| `realm` 11.3.0 → **11.10.2** (exact pin) | 11.3.0's prebuilt `librealm.so` SIGSEGVs in JSI on RN 0.71 (`RealmReactModule.install`), same failure as the Phase 4 spike saw on 0.73. 11.10.2 opens the existing Realm-11.3 file **without a format upgrade** (no `.backup.realm` written), so this step is two-way in the field. |
| `jest`/`babel-jest`/`@types/jest` 26 → 29 | RN 0.71's Jest preset needs Jest 29 (`testEnvironmentOptions`). Pulled forward from Phase 7. |
| `react-native-vector-icons` 9.2 → 10.3 + npm `overrides` for `react-native-numeric-input`'s `^9` peer | 9.2's `fonts.gradle` has an undeclared task dependency that Gradle 8 turns into a build error; 10.x fixed it. The override avoids `--legacy-peer-deps`. |
| `@types/node` pinned `^18.19` | Metro 0.76 drags in `@types/node@26`, whose syntax TypeScript 4.9 cannot parse; a `.d.ts` syntax error aborts `tsc` (count drops to 50 — a false green). Lifts with TS 5 in Phase 7. |
| `i18next` added as a direct dependency | It was only ever installed as `react-i18next`'s auto-peer. |
| `prop-types` added as a direct dependency | Used by the vendored progress-steps. |
| `react { debuggableVariants = [devDebug, quaDebug, preprodDebug, prodDebug] }` | The plugin default is `["debug"]`; with flavors every debug APK was getting a production bundle and would not load from Metro. |
| Two `patches/` deleted | They targeted RN 0.70 tooling (cli-server-api 9.2.1, metro-inspector-proxy 0.72.3); `patch-package` failed on install. Re-evaluate the debugger fix in Phase 7. |
| `@babel/core` 7.20 → 7.29 | Required by the 0.72 Babel preset. |

Native set pinned to the 0.72 era (exact): screens 3.22.1, safe-area-context
4.6.4, gesture-handler 2.12.1, svg 13.9.0, datetimepicker 7.4.2, async-storage
1.19.8. `align-deps` was not used for the write: it floats to latest majors that
need AGP 8.2+ (spike finding). `react-native-permissions` (4.1.x),
`background-actions` (3.0.x), `get-random-values` (1.8) unchanged.

The Phase 3 `jsBundleDir*` / `compressAssets` workarounds are gone with
`react.gradle`; `react-native.config.js` (`packageName`) is now redundant but
kept.

## Process notes

- Regenerating `package-lock.json` from scratch floated every caret dependency
  (axios, react-hook-form, moment, paper, redux…). Undone by restoring the Phase
  3 lockfile and re-running `npm install`; only the 17 intended direct deps
  differ. Never delete the lockfile mid-phase.
- The dev gateway answered 401 for the sends (the fabricated `testuser` token,
  as in Phase 0), once "Network Error" while DNS was down. Payload files are
  written before the POST, so V7 does not depend on the response.
- Emulator: `default.realm` was restored from
  `SenegalMigration\corpus-emulator\realm-backup-before-realm12\` before V6, so
  the file is Realm-11 format again. It now holds 8 declarations (test copies).
