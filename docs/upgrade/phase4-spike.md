# Phase 4 spike — can Realm and the AGP-8 orphans survive RN 0.73?

Branch `spike/rn073` (throwaway, off Phase 3 `e4ccbde`). Run 2026-09-17.
Target: RN 0.73.11 · Gradle 8.3 · AGP 8.1.1 · Kotlin 1.8.0 · JDK 17.
Validation done: V1 (bundle), V4 (`assembleDevRelease` only), V6 boot + export
+ login + Dashboard + draft reopen on the emulator over existing data.

## Decision

**Outcome A′ — better than A on the build side, worse on Realm.**

1. **No `patch-package` patches are needed for any of the four orphans.**
   RN's Gradle plugin (≥ 0.71) contains `configureNamespaceForLibraries`
   (`@react-native/gradle-plugin/…/AgpConfiguratorUtils.kt`): for every
   `com.android.library` subproject without a `namespace`, it reads `package=`
   from that library's manifest and sets the namespace itself. Verified present
   in the plugin for RN 0.73, 0.74, 0.75, 0.76 and 0.81. Realm 11.3.0,
   `react-native-sqlite-storage@6.0.1`, `react-native-build-config@0.3.2` and
   `bcrypt-react-native@1.1.1` all **configure and compile unpatched** under
   AGP 8.1.1. Their `package=` attributes must stay — the shim depends on them.
2. **Realm 11 does not run on RN 0.73.** Its prebuilt `librealm.so` is tied to
   the JSI ABI it was compiled against, not to the legacy/new architecture:
   - `realm@11.3.0`: SIGSEGV (null deref in `libhermes_executor.so`, called from
     `RealmReactModule.install`) at startup.
   - `realm@11.10.2` (last 11.x): loads, then Realm's native side reads a JS
     string property as `undefined` (`bundleId must be of type 'string'`) — same
     mismatch, non-fatal, app unusable.
   So **the Realm 11 ceiling is RN 0.72, not 0.75**. The plan's Part 1 endpoint
   (RN 0.74/0.75 + JDK 21 with Realm 11) is not reachable.
3. **Realm 12 works on RN 0.73.** `realm@12.13.1` + `@realm/react@0.6.2` builds
   (compiles its JNI from source: needs NDK 25.1.8937393 + CMake 3.22.1, both
   installed), boots, opens the existing encrypted Realm-11 file (format
   upgrade), and the Phase 0 export (`writeCopyTo`) succeeds. Two consequences:
   - The **`embeded: true` typo is rejected** as an unknown schema key
     (`Unexpected field(s) found on the schema for object 'INFO_DEC_FATHER':
     'embeded'`). Appendix D's prescribed fix — delete the 22 lines — was
     applied on the spike and is required. It changes nothing on disk (the key
     was always ignored).
   - The **file-format upgrade is one-way**. See "Rollback" below.

### What this means for the plan

- Phases 5 (RN 0.71 → 0.72) can stay on Realm 11.
- Phase 6 (RN 0.73) must **bump Realm to 12.x in the same phase** and delete
  the `embeded` lines. That is a JS-API-compatible bump for this code base
  (same `Realm.open`, `Realm.BSON.ObjectId`, `RealmProvider`, `writeCopyTo`),
  but it upgrades every device's Realm file on first launch.
- Because the format upgrade is irreversible, the RN 0.73 release becomes a
  **one-way door in the field**: a device that has run it cannot go back to a
  Realm 11 build without losing the Realm file. Rule 2 (install over in both
  directions) stops holding at that boundary. Treat the Phase 6 build like the
  Phase 12 bridge release: canary it, and keep the Phase 0 export as the way
  out.
- Alternatively bring Phase 12 (replace Realm) forward to *before* RN 0.73, so
  no Realm 12 ever ships. That trades a bigger Phase 6 for never doing the
  Realm 12 migration on field devices. Decide before starting Phase 5.

**Decision (2026-09-18): keep Realm, bump to Realm 12 at RN 0.73 in Phase 6, treat
the Phase 6 release as a one-way, canaried step.** Phase 12 stays where it is.

## Answers to the four questions

| # | Question | Answer |
|---|---|---|
| 1 | Does adding `namespace 'io.realm.react'` make Realm configure under AGP 8.1? | Not needed — RN's Gradle plugin sets it from `package=` automatically. |
| 2 | Leftover matching `package=` once `namespace` is set — warning or error? | **Warning** only: *"Setting the namespace via the package attribute … is no longer supported, and the value is ignored"*, one per library. Harmless. |
| 3 | Does Realm's hardcoded AGP 3.2.1 sub-`buildscript` trip AGP 8's consistency check? | No. Realm 11 and 12 both configure and build. |
| 4 | Does `com.facebook.react:react-native:+` still resolve? | Yes — the RN plugin's `dependencySubstitution` maps it to `react-android`. |

## Other findings that Phases 5–7 must absorb

| Finding | Where it bites | Action |
|---|---|---|
| `react-native-gesture-handler` ≥ 2.15 needs AGP 8.2 (`sourceSets…directories`). Pinned 2.14.1, screens 3.29.0, safe-area-context 4.8.2, svg 14.1.0, async-storage 1.21.0, datetimepicker 7.6.2, vector-icons 10.3.0, get-random-values 1.11.0. | Phase 5/6 `align-deps` | Pin to the RN-0.73-era versions above; `align-deps` alone picks latest and over-shoots. |
| `react-native-background-actions@4.1.0` needs compileSdk 35 (`Service.onTimeout(int,int)`). | Phase 6 | Use **4.0.1** (namespaced, compileSdk 34). |
| `react-native-numeric-input@1.9.1` peer-pins `vector-icons@^9`. | Phase 5/6 | `--legacy-peer-deps`, or replace numeric-input. It only imports `Icon`, which v10 still exports. |
| `i18next` is not a direct dependency — it was only ever installed as `react-i18next`'s auto-peer. `--legacy-peer-deps` drops it and Metro fails. | Phase 5 | Add `i18next` to `dependencies` (lockfile had 22.4.9). |
| The two `patches/` (cli-server-api 9.2.1, metro-inspector-proxy 0.72.3) target RN 0.70 tooling that no longer exists; `patch-package` errors on install. | Phase 5 (0.71) | Drop them; re-evaluate the debugger fix against RN 0.73's `@react-native/dev-middleware`. |
| RN 0.73 CLI reads `namespace` from `build.gradle`; `react-native.config.js` `packageName` becomes redundant. | Phase 5 | Keep it (harmless) or drop it. |
| The RN Gradle plugin's bundle task does **not** treat `node_modules` as an input: after `npm install` it stays UP-TO-DATE and the APK ships the previous JS. | Every phase from 5 on | Add `gradlew :app:createBundle<Variant>JsAndAssets --rerun-tasks` (or `clean`) to the cache-reset ritual; V6 catches it. |
| **Realm 12 caches instances per path**: `Realm.open()` in `getRealm()` now returns the *same* object as `RealmProvider`'s, so `exportService`'s `realm.close()` closes the provider's Realm and the next `useQuery` screen dies with *Cannot access realm that has been closed* (reproduced: export, then log in → Dashboard crash). Under Realm 11 the two were separate. | Phase 6 | Remove the `close()` in `exportService.ts` (only close() in `src/`), or use `useRealm()` from the context instead of `getRealm()`. Audit any future `close()`. |
| The app relies on the `Realm` global (deprecation warning from Realm 12; removed in v13). | Phase 6 | Import `Realm` explicitly where it is used as a global. |
| `JAVA_TOOL_OPTIONS` (Phase 3's JDK 17 workaround) makes every JVM print a banner to stderr, and AGP's **prefab** step treats any stderr as failure → CMake-based modules (Realm 12) cannot configure. | Phase 3 script | Use `TEMP=TMP=C:\Temp` for the Gradle process instead (`java.io.tmpdir` follows them; no banner). Verified for daemon, client and prefab. |
| `MainApplication` / `MainActivity` in the 0.73 shape, staying on Java, work unchanged with Be-Bound/PLog init and `MyAppPackage`. Flipper removed. | Phase 6 | Take the spike versions as-is. |
| `metro.config.js` as `mergeConfig(getDefaultConfig(__dirname), {…})` with the `customLibrary/` resolver hack kept works. | Phase 5 | Vendor progress-steps as planned, then drop the hack. |

## Rollback test

Not run end to end, but the on-device evidence answers most of it: when Realm 12
upgraded the file it wrote **`default.v23.backup.realm`** (byte-identical to the
pre-upgrade copy) and `default.realm.backup-log` next to `default.realm`. So a
device that has run a Realm 12 build still carries its Realm 11 file; a rollback
build could restore it by renaming, at the cost of everything written after the
upgrade. That is a possible escape hatch for the one-way door, not a substitute
for canarying.

## Still to do on the spike (cheap, decisive)

- [x] Logged in on the Realm 12 build: all 6 declarations present, a draft opens
      with its nested data, no JS errors. Data survives the format upgrade.
- [ ] Install the Phase 3 build (Realm 11.3.0) over the Realm-12-upgraded file
      and record what happens (expected: cannot open → white screen). Restore
      the backed-up `default.realm` afterwards
      (`SenegalMigration\corpus-emulator\realm-backup-before-realm12\`).

## Emulator state after the spike

The dev app's Realm file has been **upgraded to the Realm 12 format**. A
pre-upgrade copy is at
`C:\Users\D.Finlay\Digitech\SenegalMigration\corpus-emulator\realm-backup-before-realm12\default.realm`.
To go back to Phase 3 builds on this emulator, push that file back with
`adb root` (or clear the app's data — it is synthetic).
