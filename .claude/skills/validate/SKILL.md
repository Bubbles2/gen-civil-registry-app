---
name: validate
description: Run the app's V1–V7 validation toolkit (bundle size, tsc ratchet, Jest, Gradle build matrix, golden APK diff, on-device V6 walkthrough on the emulator, payload capture). Use when asked to "run the tests", "validate the app", "run V6", or after an upgrade phase.
---

# /validate — full validation run

Reference: `docs/upgrade/phase0-baseline.md` defines V1–V7; each phase doc
(`docs/upgrade/phase*.md`) records the results in a table. Produce the same table.

Arguments (optional): `static` = V1–V3 only · `device` = V6 only · `all` (default).

## 0. Bring the app up (nothing needs to be running beforehand)
```bash
scripts/validate/launch.sh            # emulator -> build+install dev flavour -> Metro :3000 -> launch
scripts/validate/launch.sh --no-build # skip gradlew: just start Metro and launch the installed app
```
Each step is skipped if already running. `launch.sh` stops Metro while `gradlew` runs because
Metro's file watcher locks `android/.gradle` (rename errors otherwise).
Emulator `Pixel_5_Save` (API 33), package `com.crseneagalmobile.dev`. All shell steps run from
Git Bash at the repo root.

**`Unable to establish loopback connection` is not the VPN.** Since JDK 16 the NIO selector's
wakeup pipe is an AF_UNIX socket in the directory named by `TEMP`, and AF_UNIX `connect()`
fails on this machine for any socket under the user profile (bind works; JDK 11/8 are
unaffected because they use TCP). Run Gradle with a plain temp dir and it works:
```bash
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew <task>
```
`scripts/build.ps1` already sets this itself. Never conclude "the VPN blocks V4/V5" — that
diagnosis was wrong and cost Phase 11 its first V4/V5 attempt.

## 1. Static checks — V1, V2, V3
```bash
scripts/validate/static-checks.sh
```
Prints PASS/FAIL per check against the baselines in the script (tsc 449 since Phase 13,
bundle ±20 %). Its last section tests `Selector.open()` with the current `TEMP`
and again with `C:\Temp`, and tells you which form of `gradlew` will work.

## 2. Build matrix and golden APK — V4, V5
One Gradle run builds all 8 (4 flavours × debug/release) and is much faster than 8:
```bash
npx kill-port 3000                                     # Metro locks android/.gradle
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew assembleRelease assembleDebug
```
`powershell -File scripts/build.ps1 -Flavor <f> -Archive <dir>` is still the way to produce
the archived evidence (SHA-256, build-info, manifest, permissions, file list) for one flavour.
Do not pipe it through `Select-Object` — that buffers the whole run and never returns.

**A debug APK needs the Metro port baked in.** The dev server port is an APK resource
(`react_native_dev_server_port`); `npm run android:dev` passes `--port 3000`, a plain
`assembleDebug` leaves 8081. A debug APK built without it cannot reach Metro and dies in a way that looks like
a native failure but is not. On the legacy architecture that was
`Missing Realm constructor` + `UnsatisfiedLinkError ... invalidateCaches`; under
the New Architecture it is
`SurfaceRegistryBinding::startSurface failed. Global was not installed.`
Either way, check for "The packager does not seem to be running" first:
```bash
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew :app:assembleDevDebug -PreactNativeDevServerPort=3000
```

For V5, the honest reference is the *previous phase's* build, not the Phase 0 golden. If the
previous build is still on the emulator, pull it and diff like for like:
```bash
adb pull "$(adb shell pm path com.crseneagalmobile.dev | tr -d '\r' | sed 's/package://')" old.apk
```
then `apkanalyzer manifest permissions|manifest print|files list` on both. Since Phase 13
expect **17 permissions** and **73 `lib/` entries** — RN 0.76 merges its native libraries into
one `libreactnative.so`, and `librealm.so` is gone with Realm. Always **re-run V6 on the newly
built APK** (`adb install -r`, never uninstall): a V6 done over Metro against the previously
installed build does not exercise the native libraries the new APKs ship.

`READ_/WRITE_EXTERNAL_STORAGE` still appear in the merged manifest even though the app
manifest no longer declares them: the merger implies them because a Be-Bound AAR has
`targetSdkVersion < 4` (see `app/build/outputs/logs/manifest-merger-*-report.txt`). Expected,
not a regression.

## 3. On-device walkthrough — V6

**The Phase 14 sequence is scripted** — prefer it over redriving by hand:
```bash
scripts/validate/v6-phase14.sh             # build + install + full walkthrough + V7
scripts/validate/v6-phase14.sh --no-build  # reuse the installed APK
scripts/validate/v6-phase14.sh --check     # boot/login/row-count only (~2 min)
```
It prints PASS/FAIL per step and exits non-zero on any failure. It asserts the
React 19 date-picker regression explicitly (see `patches/react-native-modal-datetime-picker`),
so run it after any React, RN or picker bump. Its coordinates assume
`Pixel_5_Save` at 1080x2340 and it refuses to run on any other screen size.

There is no e2e framework here (no Detox/Appium/Maestro): everything is
`adb shell input` + `uiautomator dump` + `adb logcat`.

Drive the emulator with `scripts/validate/ui.sh` (run it with no args for usage). Rules
learned the hard way:
- Tap by text (`ui.sh tap "CONNEXION"`), never by remembered coordinates — layouts shift.
- **Never press BACK to close the keyboard** — it pops the navigation stack. Use `ui.sh kbd`.
- Dev LogBox toasts sit over the bottom bar; use `ui.sh dismiss` (conditional) — a blind tap
  at that spot hits DÉCONNEXION when no toast is showing.
- Masked date/time inputs drop fast input: for dates tap the calendar icon
  (`ui.sh tapnth Button <n>` next to the field) and pick a day in the native picker, then OK.
  Times accept `ui.sh slowtype "0830"`.
- Radio groups: `ui.sh radio "<label>"` for a unique label; otherwise `ui.sh tapnth RadioButton <n>`
  and confirm with `ui.sh states`. Long forms scroll — swipe (`adb shell input swipe 540 1700 540 700 500`) and re-dump.
- The row dialog opens on a plain tap of a row cell; long-press toggles selection checkboxes.
- **`ui.sh` cannot see the app's dialogs** (Phase 14). The ⋮ filter menu and the row
  MODIFIER/VALIDER/DUPLIQUER/SUPPRIMER dialog are React Native overlays: they never appear
  in a `uiautomator dump`, and dumping *closes* them. Drive them by coordinates read off a
  screenshot (`adb exec-out screencap -p > x.png`). `v6-phase14.sh` keeps those in one
  OVERLAY BLOCK at the top.
- **Long-press only selects a `Validé` row** (Phase 14). Long-pressing a Brouillon row does
  nothing — no checkbox — and ENVOYER with nothing selected is a silent no-op that logs
  absolutely nothing. Order is VALIDER → filter to Validé → long-press → tick → ⋮ → ENVOYER.
- **Never `export MSYS_NO_PATHCONV=1` for a whole script.** It keeps `/sdcard` paths intact
  for `adb` but breaks `curl -o /dev/null`, which makes every Metro readiness check fail
  silently. Wrap adb instead: `adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }`.

Seed the login first (idempotent):
```bash
scripts/validate/seed-testuser.sh agent     # or admin
```
Credentials `testuser` / `test1234`. **Agent** is the right role to test: agents must see
declarations from their own collection point (fixed 2026-09-21; before that they saw none).

Steps and expected results:
| Step | Expect |
|---|---|
| `adb logcat -c`; login | "connexion réussi", Dashboard, N rows (note N) |
| FAB (+) → Naissance → 5 pages → Enregistrer | log shows `"STATUS": "BROUILLON"`; N+1 rows |
| tap row → MODIFIER → Suivant ×4 | every page shows the saved values (check `ui.sh edits` / `ui.sh states` on the father page: nested `FATHER.*`) |
| change a field → Enregistrer | value present in the logged object |
| tap row → DUPLIQUER → OUI → Enregistrer | N+2 rows |
| tap copy → VALIDER; menu ⋮ → tick Validé, untick Brouillon | exactly 1 row |
| long-press row → tick it → ⋮ → ENVOYER | log: `Request failed with status code 401` (dev gateway, expected); Erreur filter shows the row |
| search child first name / date / nonsense | hits / hits / 0 (search is on CHILD fields, case-sensitive) |
| DÉCONNEXION; long-press build ID → EXPORTER | "Export terminé"; `adb shell ls /sdcard/Android/data/com.crseneagalmobile.dev/files/export/*/` has `dbSenegal.db`, `crsen.db` (the encrypted declaration store) and `manifest.txt` — no `declarations.realm` since Phase 13; `adb pull` and `PRAGMA integrity_check` = ok on dbSenegal.db (crsen.db needs the SQLCipher key) |

Known dev-only noise (not failures): `defaultProps` deprecation, `SerializableStateInvariantMiddleware took …`,
`onPress in the scope of RadioButtonGroup`.

## 4. Payloads — V7
The strongest form: send the *same* declaration the previous phase sent and diff the logged
`notification : {...}` payload byte for byte (Phase 12 did this across the Realm -> SQLite
move). Otherwise compare the metadata key set and key *order* against the last capture in
`scripts/validate/out/payload-*.json.txt` — the order is the payload's field order and is what
a storage or schema change would silently break.

## 5. Report
Table with one row per V-check: result, comparison to the previous phase doc, and any new
findings (crashes, warnings, behaviour changes). Do not commit anything; list changed files.
