# Phase 0 baseline — RN 0.70.6 / Gradle 7.5.1 / AGP 7.2.1 / JDK 11

Reference numbers for the validation toolkit (V1–V7) of the React Native →
0.75 / JDK 21 upgrade plan. Every later phase compares itself to this file.

Recorded 2026-09-11 on branch `feature/senegal-rn-75`.

## V2 — `tsc` ratchet

| Point | `error TS` count |
| --- | --- |
| Before Phase 0 (`44b2f50`) | **515** |
| After the six `new Realm.BSON.ObjectId()` fixes (`99fb475`) | **509** |
| End of Phase 0 code changes | **509** |
| Phase 2 (`@types` of React Navigation v6) | **504** |
| Phase 5 (RN 0.72; `@types/react-native` removed, types now in `react-native`) | **504** |
| Phase 6 (Realm 12 typings on the two Appendix-D calls) | **505** |
| Phase 7 (TypeScript 5.0.4 + `@react-native/typescript-config`) | **506** |
| Phase 8 (RN 0.74) | **506** |
| Phase 9 (RN 0.75: paper 4 `$RemoveChildren<typeof View>` vs `tvParallaxProperties` removed from `ViewProps`, ×8) | **513** |
| Phase 10 (safe library bumps; react-native-logs 5.6 generics absorbed in `Logger.tsx`) — **current baseline** | **513** |

Count with:

```
npx tsc --noEmit --pretty false 2>&1 | find /c "error TS"
```

Fail only if the count rises. It is a ratchet, not a gate.

## V1 — release JS bundle

```
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output %TEMP%\bundle.js
```

| Metric | Value |
| --- | --- |
| Metro | 0.72.3 |
| Bundle size | **5 913 234 bytes** (5.64 MB) |
| Acceptable range for later phases (±20 %) | 4.73 – 7.10 MB |

## V3 — Jest

`npx jest` → 4 suites, 52 tests, all passing:

- `__tests__/sendDeclaration.test.ts` — wire payload, idempotency key, ARCHIVE/ERREUR transitions, ObjectId conversion
- `__tests__/formatDataForBack.test.ts` — `formatDataForBackBirth` / `formatDataForBackDeath` field-removal rules
- `__tests__/getRealm.test.ts` — `getRealm()` rejects when no key is stored
- `__tests__/exportDatabases.test.ts` — Realm `writeCopyTo` export path

## V4 — build matrix

`scripts\build.ps1 -Flavor <dev|qua|preprod|prod> [-BuildType Debug]` on JDK 11
(`JAVA_HOME=C:\Program Files\Amazon Corretto\jdk11.0.21_9`).

All four release flavors build (2–3 min each, warm cache):

| Flavor (release) | APK | Size |
| --- | --- | --- |
| dev | `senegal-civil-registry-1.1.4-dev.apk` | 119.12 MB |
| qua | `senegal-civil-registry-1.1.4-test.apk` | 119.12 MB |
| preprod | `senegal-civil-registry-1.1.4-preprod.apk` | 119.12 MB |
| prod | `senegal-civil-registry-1.1.4.apk` | 119.12 MB |

The SHA-256 differs per build even for identical sources (timestamps in the
APK), so compare manifests, permissions and `lib/` (V5), not hashes.

## V5 — golden APK

Produce with:

```
.\scripts\build.ps1 -Flavor prod -Clean -Archive <restricted evidence location>\golden-1.1.4
```

This writes the APK, `.sha256`, `build-info.txt` and — once *Android SDK
Command-line Tools* are installed (`cmdline-tools\latest\bin\apkanalyzer.bat`)
— `manifest.xml`, `permissions.txt` and `files.txt`.

**Status: archived 2026-09-11; manifest/permission/file listings added 2026-09-17** (outside the repository).

| Item | Value |
| --- | --- |
| Golden `prodRelease` SHA-256 | `4b5d4c2aa96eb782623534700dd6038ce793f5f3c39fc6903e1d68058e7217bd` |
| Size | 124 901 509 bytes |
| Git SHA it was built from | `8da7cde` (clean tree) |
| Built on | PC-DFI3, JDK 11.0.21 (Amazon Corretto), 2026-09-11T17:59+02:00 |
| Location | `C:\Users\D.Finlay\Digitech\SenegalMigration\golden-1.1.4\` |
| Files present | `senegal-civil-registry-1.1.4.apk`, `.apk.sha256`, `build-info.txt`, `manifest.xml`, `permissions.txt`, `files.txt` |

An earlier SHA (`f748c269…`, built from `a5f0793`) was recorded here by
mistake: the folder was re-archived from `8da7cde` after the doc was written.
The values above match the file on disk (re-hashed 2026-09-17).

`apkanalyzer` needs **JDK 17+** (`JAVA_HOME` to Corretto 17); under JDK 11 it
writes only *"Java version 17 or higher is required"* into the three files.
The listings were produced against the archived APK without rebuilding:

```
apkanalyzer manifest print       <apk>  > manifest.xml
apkanalyzer manifest permissions <apk>  > permissions.txt
apkanalyzer files list           <apk>  > files.txt
```

Reference points for V5 in later phases: 15 permissions (incl. the bogus
`WRITE_INTERNAL_STORAGE`, no `POST_NOTIFICATIONS`); `lib/` has four ABIs
(arm64-v8a, armeabi-v7a, x86, x86_64) × 54 `.so`, including `librealm.so`,
`libreanimated.so` (goes in Phase 1) and `libsqlite3x.so` (sqlite-2, Phase 1).

## V6 / corpus — device data export

Long-press the build ID on the login screen → *Exporter*. Files land in

```
/sdcard/Android/data/<applicationId>/files/export/<timestamp>/
    manifest.txt            package, flavor, version, git SHA, time
    dbSenegal.db (+sidecars) SQLite: reference data and users
    declarations.realm      Realm copy via writeCopyTo(), encrypted with the app key
```

Pull from a Git Bash or cmd prompt (never PowerShell 5.1 for binary streams):

```
adb pull /sdcard/Android/data/com.crseneagalmobile.prod/files/export/ .
```

**Status: mechanism verified on an emulator (2026-09-11); not yet pulled from a
field device — no physical device is available to the developer (2026-09-17), so
this stays open until someone with a field phone runs the export.**

Emulator run (`Pixel_5_Save`, Android 13, dev flavor `d58605a` installed over
an existing install): long-press → *Exporter* produced the four files;
`adb pull` succeeded; `dbSenegal.db` passes `PRAGMA integrity_check` (155
offices, 927 collection points, 3841 list values, 0 users — nobody had logged
in). Synthetic corpus kept at
`C:\Users\D.Finlay\Digitech\SenegalMigration\corpus-emulator\`. It contains no
declarations, so it is only useful for smoke-testing tooling.

**Open question (raise before Phase 12):** `declarations.realm` and the app's
own `default.realm` are both encrypted, but neither can be opened from Node
(`realm@11.3.0`) with the 64 UTF-8 bytes of `realmCode`, even though the app
opens them with exactly that key (AsyncStorage `keyDb` confirmed equal to
`realmCode`, and `Realm.open` in-app succeeds). A Node-created encrypted Realm
round-trips fine with the same key. So the bytes the RN/Hermes runtime hands to
Realm are not what Node sends. Consequences: (a) the corpus is only guaranteed
openable **inside the app**, which is what the Phase 12 migrator does; (b) Phase
12's plan to reuse `getRealmConfig()` as the SQLCipher key must first establish
what the on-device key bytes actually are. A cheap next step is to have the
export reopen its own copy in-app and report the object count.

## V7 — golden payloads

One birth and one death declaration, exact JSON request bodies saved next to
the golden APK, never in the repository (they contain personal data):

```
C:\Users\D.Finlay\Digitech\SenegalMigration\golden-1.1.4\payloads\
    birth-6aabf9598a72e443f88aaa32.json   DECL_NAISS, officeCode 777, 27 fields
    death-6aabd875419e4d5801cc2073.json   DECL_DECES, officeCode 777, 20 fields
    capture.patch                          temporary source change used to capture
    send-log.txt, README.txt               how, caveats, how to re-capture
```

**Status: captured 2026-09-17 against the dev gateway — server answered 401.**

- There is no qua server, so the capture ran against
  `senegal.digitech-development.com` with the dev flavor (`2062a59-dirty` =
  `2062a59` + `capture.patch`). The payload bytes come from the same code path
  regardless of environment.
- Capture method: `SdkJs.writeLog(JSON.stringify(convertedDecl), …)` right before
  `api.post()`; axios serialises the same object, so the file equals the request
  body. Logcat truncates at ~4 KB and release builds only persist `error` level,
  hence the temporary line rather than the existing debug log.
- **Not yet demonstrated: a successful send.** The emulator's only user
  (`testuser`) was inserted straight into the on-device SQLite by a debugging
  session and does not exist on the dev server, so its bearer token is
  fabricated and the gateway rejected both POSTs. Both rows went
  `VALIDE → ERREUR`. Re-run with a real dev-server account and replace the files.
- The `ERREUR` transition executed `new Realm.BSON.ObjectId(act.ID.toString())`
  on the post-send path (`Dashboard.tsx:471`), the same code as the `ARCHIVE`
  branch; the smoke-script item "row flips to `ARCHIVE`" stays open until a
  send succeeds.
- The `BROUILLON` "Dads Babs" draft on the emulator is the template: duplicate,
  validate and send it in later phases, then diff ignoring `externalId`.

## Build identification

`BuildConfig.GIT_SHA` (short SHA, `-dirty` suffix if the tree had uncommitted
changes) is shown on the login screen as `<versionName> · <flavor> · <sha>`.
`versionCode` is still 1 in every flavor (Appendix D of the plan).
