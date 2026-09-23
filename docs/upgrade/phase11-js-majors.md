# Phase 11 — deferred JS majors (redux set, i18next, jwt-decode, flat, paper 5)

Working tree on `feature/phase1` off `3ec7f8b` (Phase 10). Run 2026-09-22.
Toolchain unchanged from Phase 9/10: RN 0.75.5 · Gradle 8.8 · AGP 8.5.0 · Kotlin
1.9.25 · JDK 21 · compileSdk 34 · targetSdk 33 · Realm 12.13.1. No native change:
every bump below is pure JS, so V6 ran through Metro against the Phase 10 dev build.

Steps were applied and checked one at a time (V1–V3 after each, tsc error set
diffed against the Phase 10 baseline, not just counted), in the plan's order.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 358 354 B (Phase 10: 5 254 595; +104 kB, of which +100 kB react-native-paper 5, +7 kB RTK 2 / react-redux 9, i18next 25 and flat 6 ≈ ±2 kB) |
| V2 `tsc` | **482** on TypeScript 5.9.3 (Phase 10: 513 on 5.0.4) — re-baselined, see below. No TS2307/TS2305/TS2724 beyond the 4 pre-existing ones. |
| V3 Jest | 57/57 (payload tests exercise `flatten` from flat 6 — same 31 dotted keys) |
| V4 | **8/8** APKs, `BUILD SUCCESSFUL in 9m 44s` (one `assembleRelease assembleDebug` run). Release 121.94 MB every flavour (Phase 10: 121.93 MB); debug 214.20 MB (dev 217.59). prod release SHA-256 `38bf13edd4cd65a8f673537baa5aa006ded46674306f695580bd68f20ce4d00a`. |
| V5 | **identical** against a true like-for-like reference: the Phase 10 build was pulled back off the emulator (`adb shell pm path` → `adb pull`) and compared with the new dev-debug APK. Permissions (17), `lib/` contents (213 entries) and the full merged manifest all diff clean. The only differing bytes in the whole APK are `librealm.so` in the four ABIs — see below. Against the Phase 0 golden the diff is the documented RN 0.70→0.75 lib churn plus `POST_NOTIFICATIONS` (Phase 3), `WRITE_INTERNAL_STORAGE` removed and `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` added. |
| V6 re-run on the Phase 11 **APK** | after V4, the new dev-debug APK was installed over the existing data (`adb install -r`, never uninstalled): clean boot, login, 17 rows, row dialog, duplicate → save (18), export (`dbSenegal.db` 573 440 B, `declarations.realm` 28 672 B, `manifest.txt`). This is what proves the freshly compiled `librealm.so` opens the existing encrypted Realm. |
| V6 Metro on the Phase 10 dev build (Realm 12 data, 15 rows) | boot with clean logcat, agent login, dashboard, FAB group with labels (the paper 4 patch path — no error), birth 5 pages → save `BROUILLON` (16), reopen through 4 pages (nested `FATHER.NATIONAL_ID`, radios, dates), edit `FATHER.FIRSTNAME` → save (logged), duplicate → save (17), VALIDER, Validé filter = exactly 1 row, long-press → select → ENVOYER → `ERREUR` (dev gateway 401, expected), search Phase/Babs/date/nonsense = 1/11/11/0, death form page 1, home-dialog, paper-dates TimePickerModal (only paper-dates component; themed green), logout, export (`dbSenegal.db` 573 440 B = 2026-09-21 export, `integrity_check` ok, `declarations.realm` 28 672 B, `manifest.txt`) |
| V7 | payload key set identical to the Phase 10 capture (31 keys; only `FATHER.NATIONAL_ID` vs `NUM_IDENT`, which is the NNI radio answer, not code). Byte-diff against the archived goldens not reproducible on this emulator's data — same caveat as Phase 10. |

Screens compared by eye against Phase 10 screenshots (`scripts/validate/out/01-*`, `p11-*`):
dashboard, FAB group, birth form pages 1–5, autocomplete dropdown, row dialog,
menu/filters, send result, death page 1, time picker, login. MD2 theme keeps the
Phase 10 look pixel-for-pixel on the dashboard; no visual difference found elsewhere.

## Changes

| Package | From | To | Note |
|---|---|---|---|
| `@reduxjs/toolkit` | ^1.9.0 | ^2.12.0 | As a set with react-redux/redux. No `createStore`, `extraReducers` object form or `getDefaultMiddleware` in the app; slices unchanged. Same 10 tsc sites, reworded (`WritableDraft`→`WritableNonArrayDraft`, TS2554→TS2345). Immer 11. |
| `react-redux` | ^8.0.5 | ^9.3.0 | `connect`/`useStore` imports in Dashboard are unused; still exported anyway. |
| `redux` | ^4.2.0 | ^5.0.1 | |
| `react-i18next` | ^12.1.4 | ^15.7.4 | 15.7.4 is built against i18next ^25.5, hence i18next 25. `DefaultTFuncReturn` gone → the DateInput.tsx:92 error disappears. |
| `i18next` | ^22.4.9 | ^25.10.10 | `compatibilityJSON: 'v3'` removed from `src/core/i18n.tsx` — v24 dropped JSON-v3 plurals and the option no longer exists in `InitOptions`; the app has no plural keys, resources are keyed `fr-FR`/`en-EN` and `lng` is `fr-FR`, so nothing else changes. |
| `jwt-decode` | ^3.1.2 | ^4.0.0 | Default export → named `jwtDecode` (LoginScreen.tsx). v4 types the result, so the call is typed with the gateway claims the app reads (`roles`, `code`, `cpc`); this surfaces 3 real `decoded.exp` possibly-undefined findings that are left as is (rule 5). |
| `flat` | ^5.0.2 | ^6.0.1 | ESM-only, named export → `import { flatten }` (SendDeclarationService.ts). Algorithm is byte-identical to 5.0.2 (diffed). Metro resolves it without `unstable_enablePackageExports`; Jest needed `flat` added to `transformIgnorePatterns` in package.json. Return type is generic in v6, so the call is typed `flatten<any, Record<string, any>>`. Not inlined. |
| `react-native-paper` | ^4.12.5 (+ patch) | ^5.15.3 | Theme switched to `MD2LightTheme` (`src/core/theme.tsx`, `version: 2`) to keep the Material 2 look; MD3 is a later, visual-only change. Only app-side API change: `TextInput.Icon` lost the legacy `name` prop (DateInput/TimeInput already passed `icon`). No `Button color`, `IconButton color`, `Menu.Item icon` or `FAB small` usages. `patches/react-native-paper+4.12.5.patch` deleted: paper 5's `MD2Surface`/`v2Shadow` still build an animated `shadowOffset` from a Card's `Animated.Value` elevation (FAB.Group labels), but on RN 0.75 the FAB group opens with both labels and no native-animated error, so the patch is not re-created. `patches/` is now empty. |
| `react-native-paper-dates` 0.9.2 | — | — | Kept. Only `TimePickerModal` is used; it reads the MD2 theme through paper's `useTheme` and renders correctly on paper 5. |
| `typescript` (dev) | 5.0.4 | 5.9.3 | Required by paper 5: its components are typed as returning `ReactNode`, which TS < 5.1 rejects as a JSX component (36 × TS2786). 5.9.3 is the last 5.x; `latest` is now 7.0 (native port) and 6.0 deprecates tsconfig options — both a separate step. V2 re-baselined 513 → 482 (TS2786 gone, TS 5.9 moved others both ways; no new file:line sites except the LoginScreen shift from one added comment line). |

`package-lock.json` updated in place (`npm install`, no delete). `scripts/validate/static-checks.sh`
baselines: tsc 482, bundle 5 358 354.

## Not done (deliberately)

| Item | Why |
|---|---|
| `react-native-permissions` 4 → 5 | Plan: "if the RN version needs it". RN 0.75 runs 4.1.5 (already latest 4.x). v5 is a native module (would change V5) — do it with the RN hop that requires it (Phase 13/14). |
| `react-native-svg` 15, `@react-native-community/datetimepicker` 8.2+ | Native modules; datetimepicker 8.2+ peer-pins React 19. Belong to the RN hops in Phase 13/14, not to this JS-only phase. |
| `i18next` 26 / `react-i18next` 16–17 | Plan targets react-i18next 15; going further is a later minor step once React 19 is in. |
| MD3 (`theme.version: 3`) | Visual redesign of every screen; do it on its own once Part 2 is done, if wanted. |

## Findings from the V4/V5 run

**1. `librealm.so` is rebuilt by every Gradle run, and V6 must be re-run on the APK.**
Realm 12 is not a prebuilt AAR: it is a Gradle subproject that compiles its C++ binding
with CMake (`node_modules/realm/binding/android/build/intermediates/cxx/...`). The four
`librealm.so` are therefore build outputs, and this run produced different bytes from the
Phase 10 build (−1.41 MB uncompressed; the Phase 10 copy still carries clang `.comment`
strings for NDK r23/r25, the new one is stripped of them). ELF `.dynsym` was checked on
x86_64 and arm64: `JNI_OnLoad`, `injectModuleIntoJSGlobal` and `invalidateCaches` are all
still exported, and the rebuilt library opens the existing encrypted Realm on device
(V6 re-run row above). Consequence for later phases: a V6 run over Metro against the
*previous* phase's installed build does not cover the native library the new APKs ship —
install the new APK and re-smoke, as was done here.

**2. `READ_/WRITE_EXTERNAL_STORAGE` are still in the shipped manifest.** The working-tree
change that removed them from `android/app/src/main/AndroidManifest.xml` does not remove
them from the APK: the manifest merger puts them back, and its report says why —
`IMPLIED ... reason: com.example.be_bound has a targetSdkVersion < 4` (one of the vendored
Be-Bound AARs). AGP applies the legacy rule (pre-Donut → implicit WRITE_EXTERNAL_STORAGE,
which implies READ). The runtime `PermissionsAndroid` request was removed from
`LoginScreen.tsx`, which is the part that caused the Android 13+ lockout, so behaviour is
fixed — but the permissions remain visible on the APK. Removing them needs explicit
`tools:node="remove"` entries in the app manifest. Logged as a ticket, not fixed here
(one kind of change per commit, and it is not a Phase 11 concern).

**3. The "Fortinet SSL VPN blocks loopback" diagnosis in the toolkit was wrong** and cost
this phase its first V4/V5 attempt. The failure is not TCP loopback and not the VPN: since
JDK 16 the NIO selector's wakeup pipe is an **AF_UNIX** socket whose directory comes from
the `TEMP` environment variable, and on this machine `connect()` on an AF_UNIX socket under
the user profile returns `Invalid argument` (bind succeeds; JDK 11 and 8 are unaffected
because they use TCP). `scripts/build.ps1` already worked around it by setting
`TEMP=C:\Temp` for every JVM it spawns — which is why building through it works while a
bare `gradlew` from Git Bash dies. `scripts/validate/static-checks.sh` now tests both and
says which case it is; run `gradlew` directly with `TEMP='C:\Temp' TMP='C:\Temp'`.

**4. `gradlew assembleDebug` bakes the wrong Metro port.** The dev-server port is compiled
into the APK as the `react_native_dev_server_port` integer resource (Phase 10 APK: 3000,
a plain `assembleDebug`: 8081), because `npm run android:dev` passes `--port 3000` and the
RN CLI turns that into `-PreactNativeDevServerPort=3000`. A debug APK built without it
cannot reach Metro on 3000, silently falls back to the cached dev bundle and then fails
with `Missing Realm constructor` + `UnsatisfiedLinkError: ... invalidateCaches` — which
looks exactly like a broken native library but is not. Build dev debug APKs with
`./gradlew :app:assembleDevDebug -PreactNativeDevServerPort=3000`.

## Open points carried forward

- Dev-only warnings unchanged from Phase 10: `defaultProps` deprecations,
  `SerializableStateInvariantMiddleware took 35ms`, RadioButtonGroup `onPress`, react-navigation
  "Non-serializable values were found in the navigation state" (functions/Realm objects in
  route params — pre-existing, worth a ticket before Phase 13).
