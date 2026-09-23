# Testing

How to run the tests in this repo, and what each one actually proves.

There are three layers: **unit tests** (Jest, no device), **static checks**
(bundle size, TypeScript, Jest), and an **end-to-end walkthrough** that drives the
real app on an emulator. The validation toolkit calls these V1–V7; the numbering
comes from `docs/upgrade/phase0-baseline.md` and every upgrade phase reports
against it.

---

## Quick reference

| Command | Covers | Needs a device | Time |
|---|---|---|---|
| `npx jest` | unit tests only (V3) | no | ~20 s |
| `scripts/validate/static-checks.sh` | V1 bundle, V2 tsc, V3 Jest | no | ~2 min |
| `scripts/validate/v6-phase14.sh --check` | boot, login, row count | yes | ~2 min |
| `scripts/validate/v6-phase14.sh --no-build` | full e2e walkthrough (V6 + V7) | yes | ~8 min |
| `scripts/validate/v6-phase14.sh` | build + install + full walkthrough | yes | ~12 min |
| `cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew assembleRelease assembleDebug` | V4 build matrix / V5 APK diff | no | ~25 min cold |
| `/validate` (in Claude Code) | the whole V1–V7 toolkit | yes | — |

**Every command in this document is Git Bash, run from the repo root.** The
`.sh` scripts need it. Windows PowerShell 5.1 will not parse most of them: it has
no `&&` statement separator and no inline `VAR=value cmd` syntax, so
`cd android && TEMP='C:\Temp' ... ./gradlew` is a parse error there rather than a
command that does something slightly different. PowerShell equivalents are given
for the cleanup commands below, which are the ones most likely to be run ad hoc.

Every script exits non-zero if anything regresses, so they can be chained or used
in CI.

---

## ⚠️ Important — running these tests eats tens of GB of disk

**Check free space before any run that builds.** A full build matrix plus a few
end-to-end runs takes the working tree from ~0.5 GB to **nearly 19 GB**, and
Gradle fails outright when the disk runs out — Phase 13 lost a build to this at
0.65 GB free, and Phase 14 hit it twice.

Measured after one V4 matrix and five e2e runs:

| | |
|---|---|
| `android/app/build` | 10.8 GB |
| `node_modules/@op-engineering/op-sqlite` | 3.9 GB |
| `android/app/.cxx` | 1.4 GB |
| `node_modules/react-native-screens` | 1.2 GB |
| `node_modules/react-native-gesture-handler` | 1.1 GB |
| **source, `.git`, docs, ios, scripts** | **~50 MB** |

Over 97 % of it is regenerable build output. It gets that large because
**4 flavours × debug/release × 4 ABIs is 32 combinations**, each keeping its own
copy of the native `.so` libraries — `merged_native_libs` alone holds 16 copies at
170–240 MB. On top of that, three native modules compile C++ **inside
`node_modules`**, where `npm install` never cleans up.

### Reclaiming it

Git Bash:

```bash
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew clean
```

PowerShell — `&&` is not a statement separator in Windows PowerShell 5.1, and it
has no inline `VAR=value cmd` syntax, so the Bash form above is a parse error
there:

```powershell
cd android; $env:TEMP='C:\Temp'; $env:TMP='C:\Temp'; .\gradlew clean; cd ..
```

This is the one to use: it reaches the `node_modules` build trees through the
autolinked projects, which a manual delete of `android/app/build` would miss. In
Phase 14 it took free space from 8.5 GB to 19 GB and shrank `node_modules` from
9.1 GB to 1.0 GB.

`clean` does **not** remove `.cxx`, so for the last GB or so:

```bash
rm -rf android/app/.cxx
```

```powershell
Remove-Item -Recurse -Force android\app\.cxx
```

The cost is a cold NDK rebuild (~25 min for the full matrix) next time. Worth
doing **before** a phase rather than after a build has already failed.

Cheap runs — `npx jest`, `static-checks.sh`, and `v6-phase14.sh --check` or
`--no-build` — add nothing meaningful, because they do not invoke Gradle. Only a
build grows the tree.

---

## Layer 1 — unit tests (V3)

```bash
npx jest
```

**86 tests across 7 suites.** These are pure logic — no emulator, no database
file, no network. They are the fastest signal and the first thing to run.

| Suite | Tests | What it pins down |
|---|---|---|
| `formatDataForBack.test.ts` | 27 | the field-removal rules that build the outbound declaration — which `FATHER.*` keys survive when `INDICATE_FATHER_y8n` is *Oui* vs *Non*, and the same for `MOTHER.*` and the death form |
| `declarationShape.test.ts` | 23 | the SQLite row shape: id generation (`hexId`, `newId`), `toStored`, `toRow`/`fromRow` round-trips, and `orderBySchema` — the thing that makes the wire payload's **key order** deterministic |
| `declarationQueries.test.ts` | 12 | the Dashboard's filters run as real SQL against a real SQLite engine (`sql.js`, via `__tests__/support/sqljsDb.ts`), including the collection-point scoping that decides which declarations an agent sees, and two Realm quirks the SQLite port had to keep: unticked status checkboxes pass `null` and must match nothing, and with every box unticked the list is empty rather than unfiltered |
| `sendDeclaration.test.ts` | 12 | `buildDeclarationPayload`, the idempotency key, and the BROUILLON → ARCHIVE / ERREUR status transitions in `sendBatch` |
| `formsSchema.test.ts` | 5 | `src/core/db/formsSchema.ts` is internally consistent — since Phase 13 it *is* the schema, not a copy of a Realm one |
| `stripUndefined.test.ts` | 5 | undefined-stripping before serialisation, so absent fields never reach the wire as `null` |
| `exportDatabases.test.ts` | 2 | the JS side of the export: it returns the directory the native module created, and propagates a native failure instead of returning an empty result. The actual file copying is native and is only covered end to end |

**What they do not cover:** anything involving React rendering, native modules,
SQLCipher, or the real gateway. There are no component tests and no snapshot
tests. That gap is what the e2e walkthrough exists to fill.

---

## Layer 2 — static checks (V1, V2, V3)

```bash
scripts/validate/static-checks.sh
```

Runs three checks and prints PASS/FAIL for each.

**V1 — release bundle size.** Builds the production Metro bundle and compares it
to a baseline within ±20 %. Catches a dependency accidentally pulling a large
transitive tree into the shipped JS.

**V2 — TypeScript ratchet.** Counts `error TS` lines from `tsc --noEmit`. The
codebase does not typecheck cleanly and is not expected to; the rule is **the
count must not rise**. It is a ratchet, not a gate. When a phase lowers it, the
baseline is tightened so the gains cannot be given back.

**V3 — Jest**, as above.

Current baselines, at the top of the script:

```
TSC_BASELINE=413        # Phase 14 (was 449)
BUNDLE_BASELINE=5235187 # bytes, Phase 14 (was 5 083 633)
```

The script also runs a **Gradle preflight** that tests `Selector.open()` with the
current `TEMP` and again with `C:\Temp`, and tells you which form of `gradlew`
will work on this machine. See "Known traps" below.

---

## Layer 3 — end-to-end walkthrough (V6 + V7)

```bash
scripts/validate/v6-phase14.sh --no-build
```

**This is the only test that exercises the real app**: the New Architecture
bridgeless runtime, the SQLCipher-encrypted store, the native date/time pickers,
React Navigation, and the outbound payload. It was written during the Phase 14
upgrade (RN 0.78 / React 19) and is verified green at **35 checks, 0 failures**.

### There is no e2e framework here

No Detox, no Appium, no Maestro. The script is:

- `adb shell input tap/swipe/text` to act on the app
- `uiautomator dump` to read the screen back — wrapped by `scripts/validate/ui.sh`
- `adb logcat` for assertions such as `SQLCipher: true` and `status code 401`
- a little Python to diff the outbound JSON payload

That is also how phases 11–13 were validated, by hand each time. This script just
stops the sequence having to be rediscovered.

If you want a real framework, **Maestro** is the one to look at — it handles React
Native overlays natively, which would remove the coordinate block described below.

### Modes

| Mode | What it does |
|---|---|
| `--check` | emulator, Metro, seed, boot assertions, offline login, row count. ~2 min. Cheap enough to run after any dependency change |
| `--no-build` | the full walkthrough against the installed APK |
| *(no flag)* | builds and installs `devDebug` first, then the full walkthrough |

### What it asserts, in order

**Boot** — bridgeless architecture confirmed in logcat (`BridgelessReact`), the
encrypted store opens (`openDb: crsen.db ready (SQLCipher: true)`), and the Realm
migration does **not** re-run (`already-migrated`). That last one matters: a
re-run would mean the migration flag was lost.

**Offline login** — `testuser` / `test1234`, seeded idempotently by
`seed-testuser.sh agent`. Agent is the right role to test because agents must see
declarations from their own collection point. A readable dashboard row count is
the proof the offline bcrypt check passed.

**A full birth declaration across five pages** — notification reference, both
pickers, child name and sex, birth date/time, place of birth, weight, multiple
birth, father, mother. This is the part that exercises every form component.

**The date picker, twice — this is the Phase 14 regression test.** Once on a field
that already holds a value, and once on an **empty** field. React 19 removed
`defaultProps` on function components, and `react-native-modal-datetime-picker`
14.0.1 used them for its `date` default while its memo comparator dereferences
`prevProps.date.getTime()` unconditionally. Unpatched, tapping the calendar icon
on an empty field **throws**. The fix lives in
`patches/react-native-modal-datetime-picker+14.0.1.patch`. Run this after any
React, React Native or picker bump.

**Persistence** — the row count goes N → N+1 on save, and survives a force-stop
and relaunch. That proves the write committed to the encrypted store rather than
just landing in Redux.

**Validate → filter → send** — VALIDER the record, filter to *Validé* only (must
isolate exactly one row), long-press to select it, ENVOYER. The expected result is
`Request failed with status code 401`: the dev gateway rejects the credentials,
which still proves the request was built and sent.

**V7, the payload comparison.** The logged `notification : {...}` payload is
diffed against `scripts/validate/out/payload-NAISSANCE-phase13.json.txt`:
top-level keys identical, all common metadata keys in **identical relative
order**, and no new keys. Key order is the thing a storage or schema change breaks
silently, so it is asserted rather than eyeballed. Keys absent because the form
was filled differently are listed as a note, not a failure.

**Export** — `crsen.db`, `dbSenegal.db` and `manifest.txt`, no Realm file (Realm
was removed in Phase 13), and `PRAGMA integrity_check = ok` on the reference
database.

### Two things that make this app hard to drive

**`ui.sh` cannot see the app's dialogs.** The ⋮ filter menu and the row
MODIFIER/VALIDER/DUPLIQUER/SUPPRIMER dialog are React Native overlays: they never
appear in a `uiautomator dump`, and dumping actually *closes* them. Those steps
are tapped at fixed coordinates, kept in one `OVERLAY BLOCK` at the top of the
script. They were read off `Pixel_5_Save`, and the script aborts on any screen
that is not 1080x2340 rather than tapping blind. If the dialog layout changes,
re-read the coordinates off a screenshot:

```bash
adb exec-out screencap -p > scripts/validate/out/screen.png
```

**Long-press only selects a `Validé` row.** On a Brouillon row it does nothing —
no checkbox appears — and ENVOYER with nothing selected is a silent no-op that
logs absolutely nothing. The order must be VALIDER → filter → long-press → tick →
⋮ → ENVOYER.

### Side effect

Every full run creates a real declaration, so the emulator's row count grows. The
assertions are relative (N → N+1), so this is harmless, but the database
accumulates test records over time.

---

## Layer 4 — build matrix and APK diff (V4, V5)

**This is the step that fills the disk** — see the disk-space note near the top.
Check you have well over 10 GB free before starting, and run `gradlew clean`
first if you do not.

One Gradle run builds all eight variants (4 flavours × debug/release) and is much
faster than eight separate ones:

```bash
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew assembleRelease assembleDebug
```

Stop Metro first — its file watcher locks `android/.gradle`:

```bash
npx kill-port 3000
```

**V5** compares the built APK against the previous phase's archived evidence in
`scripts/validate/out/v5-*`, using `apkanalyzer`:

```bash
apkanalyzer manifest permissions <apk>
```

Compare permissions, the merged manifest, and the `lib/` entry list. **Compare
like for like** — a debug APK has one more permission than a release one
(`SYSTEM_ALERT_WINDOW`, which React Native adds from its debug manifest for the
dev overlay), and mixing them up looks exactly like a dropped permission.

---

## Prerequisites

- **Emulator** `Pixel_5_Save` (API 33), package `com.crseneagalmobile.dev`. The
  e2e script boots it if it is not already running.
- **Metro on port 3000**, started by the script if needed. The port matters: it is
  baked into the APK as a resource, so a debug build must be made with
  `-PreactNativeDevServerPort=3000`.
- **JDK 21** for Gradle (`JAVA_HOME`).
- `adb` and `apkanalyzer` on `PATH`, from the Android SDK.
- **Disk space.** Well over 10 GB free for anything that builds — see the note
  near the top. This is a real prerequisite, not a nicety; Gradle fails hard when
  it runs out.

---

## Known traps

These all cost real debugging time. They are recorded in
`.claude/skills/validate/SKILL.md` too.

**`Unable to establish loopback connection` is not the VPN.** Since JDK 16 the NIO
selector's wakeup pipe is an AF_UNIX socket in the directory named by `TEMP`, and
AF_UNIX `connect()` fails on this machine for any socket under the user profile.
Run Gradle with a plain temp dir:

```bash
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew <task>
```

**A debug APK needs the Metro port baked in.** A plain `assembleDebug` leaves
8081. The resulting APK cannot reach Metro and dies in a way that looks like a
broken native library but is not — under the New Architecture it reports
`SurfaceRegistryBinding::startSurface failed. Global was not installed.` Check for
"The packager does not seem to be running" first.

**Never press BACK to close the keyboard** — it pops the navigation stack. Use
`ui.sh kbd`.

**Long forms scroll.** `uiautomator` only reports *rendered* nodes, so a field
below the fold is not in the tree at all. Swipe and re-dump:

```bash
adb shell input swipe 540 1700 540 800 400
```

**Never `export MSYS_NO_PATHCONV=1` for a whole script.** It keeps `/sdcard` paths
intact for `adb` but breaks `curl -o /dev/null`. Wrap adb instead:
`adbx(){ MSYS_NO_PATHCONV=1 adb "$@"; }`.

**`grep "CONNEXION"` also matches `DÉCONNEXION`.** The dashboard's logout button
contains the login button's label as a substring. Match the line exactly
(`grep -qx '"CONNEXION"'`) or the script will believe it is on the login screen
while sitting on the dashboard.

**Re-run the e2e walkthrough on the newly built APK** (`adb install -r`, never
uninstall — uninstalling destroys the migrated declaration store). A walkthrough
done over Metro against a previously installed build does not exercise the native
libraries the new APK ships.

---

## Writing a test that stays honest

Four defects found while building the e2e script were all the same shape: **a
check that passed while testing nothing.** Worth keeping in mind when extending
it.

- A stale export directory satisfied every file check, so the step passed having
  exported nothing. It now counts directories before and after.
- `PRAGMA integrity_check` printed PASS from inside Python, so its result never
  reached the pass/fail tally — a corrupt database would have been reported and
  the script would still have exited 0.
- A substring match (`CONNEXION` / `DÉCONNEXION`) made the script assert it was on
  a screen it was not on.
- `curl -o /dev/null` silently failed under `MSYS_NO_PATHCONV`, so a readiness
  check never actually checked anything.

Prefer assertions that fail loudly when the thing under test is absent, and make
sure every result reaches the exit code.
