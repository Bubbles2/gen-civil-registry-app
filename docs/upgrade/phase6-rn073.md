# Phase 6 — RN 0.72.17 → 0.73.11, AGP 8.1.1, Realm 12 — **JDK 17 checkpoint**

Branch `phase6-rn073` off Phase 5 `f8c2d9c`. Run 2026-09-18.
Decision applied (2026-09-18): Realm 11.10.2 → **12.13.1** in this phase; the
release is a **one-way door** (file-format upgrade) and must be canaried.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 286 771 B (Realm 12's JS is smaller; baseline 5 913 234) |
| V2 `tsc` | **505** (504 + 2 Realm-12 typings on the Appendix-D `Realm.open({config,…})` / `createRealmContext(config)` calls − 1) |
| V3 Jest | 57/57 (5 new: `stripUndefined` / `applySchemaDefaults`) |
| V4 | 8/8 on Gradle 8.3 / AGP 8.1.1 / Kotlin 1.8.0 / JDK 17; release 113 MB, debug 191 MB (Flipper gone) |
| V5 vs golden | permissions: `POST_NOTIFICATIONS` + the standard `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (androidx.core on compileSdk 34); manifest receivers/services identical set (14); `lib/`: RN 0.73 runtime additions; `dex`: Realm Java layer 22 → 5 classes, Be-Bound 85 unchanged, no Flipper; resources: large obfuscated-name churn from the Material Components bump RN 0.73 pulls |
| V6 install-over (Realm 11 file) | boot, no `librealm` `UnsatisfiedLinkError`, **format upgrade with all rows intact**, offline login (bcrypt), reference data (sqlite-storage), draft, duplicate → save, validate → send → `ERREUR`, FAB, search, export, Dashboard after export |
| V7 | birth identical apart from `externalId`; death byte-identical to the Phase 0 goldens |

## Toolchain-forced changes beyond the plan's list

| Change | Why |
|---|---|
| **`patches/react-native-paper+4.12.5.patch`** (Android-only, 3 files) | RN 0.73 throws where 0.72 warned: paper 4's animated iOS `shadowOffset` reaches the native animated module through `FAB.Group` → *"Style property 'shadowOffset' is not supported by native animated module"*, crash on the Dashboard. Android draws depth from `elevation`, so the patch returns no shadow styles on Android. Goes away with paper 5 (Phase 11). |
| `src/core/services/realmInput.ts` (`stripUndefined` + `applySchemaDefaults`) used by `addOrUpdateForm` | Realm 12 rejects a create where a non-optional property is `undefined` *or absent inside a nested object* (*"Missing value for property 'FORWARDING_ADDRESS'"*). Realm 11 applied the schema `default`. The shim applies the app's own schema defaults (from `realmSchema/Forms.tsx` — `realm.schema` strips them) before `realm.create`, so the stored result is what Realm 11 produced. |
| `exportService.ts` no longer closes the Realm; tests inverted | Realm 12 shares one instance per path; the `close()` closed `RealmProvider`'s Realm (spike finding). Verified: export → login → Dashboard renders. |
| 22 `embeded: true` lines removed; `import Realm from "realm"` added to 32 files | Realm 12 rejects the unknown key; the `Realm` global is deprecated. |
| `react-native-get-random-values` imported first in `index.js` | Realm 12's `bson` checks `crypto.getRandomValues` at import; the existing imports ran after `realm` loaded (BSON warning, weaker ObjectId randomness). |
| `androidx.work:work-runtime-ktx:2.7.1` **kept** | Not used by our code, but `RxLogs` (PLog) pulls WorkManager 2.3.4, which crashes on `PendingIntent` mutability with targetSdk 31+. The explicit line is what holds it at 2.7.1. |
| `react-native-background-actions` 4.0.1 | 4.1 needs compileSdk 35. |
| compileSdk 33 → 34 (targetSdk stays 33) | RN 0.73's `react-android` requires it. Plan had 34 at Phase 9. |
| `MainApplication`/`MainActivity` 0.73 shape, Java | `getReactHost()` added; `DefaultReactActivityDelegate` 3-arg. |

## Native dependency audit (step 6) — done against the extracted AAR class files

| Dependency | Verdict | Evidence |
|---|---|---|
| `androidx.room:room-compiler` (annotationProcessor) | **removed** — the JDK 21 risk | no Room annotations in `src/main/java`; `bbbb-debug.aar` ships its own generated `ProviderDao_Impl` |
| `room-common` / `room-ktx` 2.2.6 | removed | redundant pins; 2.3.0 comes with `room-runtime`, no `RoomDatabaseKt` refs |
| `room-runtime` 2.3.0 | keep | `bbbb` references `RoomDatabase`, `RoomOpenHelper`, … (11 classes) |
| Guava | keep | `bbbb` → `com.google.common.primitives.Bytes` |
| Jackson | keep | `bbbb` → `ObjectMapper`, `JsonProperty` |
| EventBus | keep | `konnect` → `EventBus`, `Subscribe`, `ThreadMode` |
| Gson | keep | `be_bound`, `sdk`, app sources |
| RxLogs (PLog) | keep | `bbbb`, `sdk`, app sources |
| materialish-progress | keep | `sweet_alert` layout inflates `ProgressWheel` (Phase 3) |
| `androidx.work` | keep (see above) | transitive floor for RxLogs |
| `swiperefreshlayout` | removed | `react-android` brings it |

`android.support` references: none in any AAR (real check this time — the Phase 3
scan grepped the zipped `classes.jar` and was void; `checkJetifier` had covered it).

Be-Bound: `BeBound.init` + `C.APP_UUID` gated on `useBebound` in `MainApplication`;
the four Be-Bound `@ReactMethod`s early-return with a log; the loader/alert/Realm-key
methods untouched. `provider(...)`, the only subscription path, was already dead
(called from commented code). **Appendix C q3 answered:** the merged manifest
contains no Be-Bound SMS receivers at all — `bbbb` registers them dynamically —
so the `targetSdk 34` `registerReceiver` rule only applies when Be-Bound runs.

## Realm 12 on device

- First launch over a Realm-11 file upgrades it in place (36 864 B, same size);
  Realm keeps `default.v23.backup.realm` + `default.realm.backup-log` alongside.
- All 8 pre-existing declarations survived; 9 after this phase's duplicate.
- RN 0.73 logs `W NativeCrashHandlerImpl: UnsatisfiedLinkError … libnative_crash_handler_jni.so`
  at startup. That is RN's optional crash handler, a warning, unrelated to Realm.

## Rollout note

This build is the one-way door: a device that has run it cannot go back to a
Phase 5 build without restoring `default.v23.backup.realm`. dev phone → qua →
preprod → one low-volume office, Phase 0 export as the way out.
