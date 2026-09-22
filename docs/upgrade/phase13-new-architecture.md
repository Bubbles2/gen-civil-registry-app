# Phase 13 — RN 0.76 and the New Architecture

Working tree on `feature/phase1` off Phase 12. Run 2026-09-22.

| | Before | After |
|---|---|---|
| React Native | 0.75.5 | **0.76.9** |
| Gradle / AGP | 8.8 / 8.5.0 | **8.10.2 / 8.6.1** |
| NDK | 25.1.8937393 | **27.1.12297006** |
| compileSdk / targetSdk | 34 / 33 | **35** / 33 |
| Architecture | legacy | **New Architecture (Fabric + TurboModules, bridgeless)** |
| Realm | 12.13.1 (bridge, migration only) | **removed** |
| React | 18.3.1 | 18.3.1 (0.76 still peers React 18) |

## Realm had to go first, and that is not a scheduling preference

`RealmReactModule.injectModuleIntoJSGlobal()` reaches the JS runtime through
`reactContext.getCatalystInstance()`. There is no CatalystInstance in bridgeless
mode, so Realm cannot initialise under the New Architecture at all — it is not a
question of an interop shim. Every other native module in the app was checked
for the same pattern and **only Realm uses it**:

```
realm                     BRIDGELESS RISK: binding/android/src/main/java/io/realm/react/RealmReactModule.java
react-native-sqlite-storage   ok      bcrypt-react-native        ok
react-native-build-config     ok      react-native-background-actions  ok
@op-engineering/op-sqlite     ok      react-native-screens       ok
... (15 modules scanned, 14 clean)
```

So this phase carries out the plan's step 85 (the Realm-removal release) as its
prerequisite. **That release can only ship once every office has migrated** —
the bridge build's `realm_migration_done` flag, reported at login, is the
evidence. A device that reaches this build without having migrated keeps its
Realm file untouched but shows an empty Dashboard until it is put back on a
bridge build.

### What Realm's removal took with it

| Removed | Note |
|---|---|
| `realm`, `@realm/react` | 29 npm packages, including `bson` |
| `src/realmSchema/` (28 files) | `src/core/db/formsSchema.ts` is now the schema, not a copy of one |
| `scripts/generate-forms-schema.js` and its drift test | nothing left to drift from |
| `src/core/db/migrateFromRealm.ts` + tests | the migration belongs to the bridge build |
| the Realm half of `databaseService.tsx` | 254 lines: `getRealm`, `addOrUpdateForm`, `updateStatusDb`, `getFormById`, `getAllForm*`, `getAllValidAct`, `deleteNotification`, `retrieveKeyDb` — all superseded by `src/core/db` in Phase 12 |
| the Realm copy in `exportService.ts` | the export is now the two SQLite databases |
| `librealm.so` | 44.5 MB of the APK |

`SdkJs.getRealmConfig()` keeps its name deliberately (plan step 85): it is now
the SQLCipher key. `src/core/RealmConfig.tsx` keeps its name for the same reason.

## What the New Architecture needed

**1. `SoLoader.init(this, OpenSourceMergedSoMapping)`** — RN 0.76 merges its
native libraries into one `libreactnative.so`; the old boolean overload does not
map the former library names.

**2. NDK 27.** The New Architecture compiles RN's codegen C++, which includes
folly's `F14Table.h`, which uses `std::regular` — a C++20 concept NDK 25's
clang 14 does not have:

```
F14Table.h:254:20: error: no member named 'regular' in namespace 'std'
```

The project was pinned to NDK 25.1 in Phase 8 *because Realm had been built with
it*. Realm is gone, so the pin went with it. 27.1.12297006 is what the RN 0.76
template uses.

**3. `@react-native-community/cli` 15.0.1.** Without it autolinking fails with
*"Could not find project.android.packageName in react-native config output"* —
the older CLI reads `package=` from the manifest, which Phase 3 removed in
favour of `namespace`.

**4. One invalid `@ReactMethod` in the app's own module.** `SdkJs.pushAlertError()`
is annotated `@ReactMethod` but returns a `SweetAlertDialog`. The old bridge
ignored it; the interop layer parses every `@ReactMethod` the first time the
module is touched and rejects the whole module:

```
Exception in HostObject::get for prop 'SdkJs': TurboModuleInteropUtils$ParsingException:
Unable to parse @ReactMethod annotation from native module method: SdkJs.pushAlertError().
Details: Unable to parse JNI signature. Detected unsupported return class: cn.pedant.SweetAlert.SweetAlertDialog
```

It could never have been called from JS (a non-void return cannot cross the
bridge) and nothing calls it, from JS or Java. The annotation was removed; the
method stays. This is exactly the check the plan's step 88 asks for, and the
app's own module was the only one that failed it.

## Native module bumps (align-deps)

| Package | From | To | Why |
|---|---|---|---|
| `react-native-screens` | 3.34.0 | 4.4.0 | Fabric; align-deps window for 0.76 is `>=4.0 <4.5` |
| `react-native-svg` | 14.1.0 | 15.12.1 | Fabric; window `>=15.8.0 <15.13.0` |
| `react-native-gesture-handler` | 2.18.1 | 2.21.2 | `^2.20.0` |
| `react-native-safe-area-context` | 4.11.1 | 4.14.1 | `^4.12.0` |
| `@react-native-async-storage/async-storage` | 1.24.0 | 2.1.2 | `^2.0.0` |
| `@babel/core`, `@babel/runtime` | ^7.12 | ^7.25 | per the 0.76 template |
| `@react-native-community/cli(-platform-android)` | — | 15.0.1 | see above |

Versions are pinned exactly, as the project does for every native module, and
chosen **inside** align-deps' tested window rather than at the top of the caret
range (npm would have resolved screens 4.28 and svg 15.15, both outside it).

**`@react-navigation` stays on v6.** align-deps suggests v7 for the 0.76 profile,
but that is a JS major with breaking APIs and v6 works with screens 4.x
(`peerDependency: react-native-screens >= 3.0.0`). It belongs with Phase 14, not
with an architecture switch.

**`react-native-permissions` stays on 4.1.5.** Plan step 88 says bump to 5 "if
the RN version needs it" — 0.76 does not, and 4.1.5 has no bridgeless-incompatible
API. Deferred rather than done speculatively.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 083 633 B (Phase 12: 5 385 533; **−302 kB**, Realm's JS) |
| V2 `tsc` | **449** (Phase 12 baseline 480) |
| V3 Jest | **86/86** across 7 suites (Phase 12 had 109 across 9; the 23 removed were the migrator's and `getRealm`'s, which no longer exist) |
| V4 | **8/8** APKs. Release **98.91 MB** every flavour (Phase 12: 145.06 — Realm's removal takes out more than the New Architecture adds), debug 184.37 MB dev / 182.32 other |
| V5 vs Phase 12 | permissions **identical** (17). `lib/` goes 221 → 73 entries: RN 0.76 merges ~35 `libreact_*.so` into one `libreactnative.so`, `librealm.so` is gone, and four Fabric codegen libraries appear (`libappmodules.so`, `libreact_codegen_rnscreens/rnsvg/safeareacontext.so`). The merged manifest gains compileSdk 35 and one new component — see below |
| V6 on the migrated device | boot under bridgeless · `openDb: crsen.db ready (SQLCipher: true)` · `already-migrated` · **offline login** · Dashboard 18 rows · FAB group · new-birth form through 5 pages with native date and time pickers, radio groups and the city autocomplete · duplicate → save (19) · restart → still 19 · VALIDER · filters (1 Validé) · long-press → select → ENVOYER → `ERREUR` (dev gateway 401, expected) · search 4/0 · export (`crsen.db`, `dbSenegal.db`, `manifest.txt`) |
| V7 | payload **unchanged**: same 27 metadata keys in the same order as Phase 12's capture; the only differing value is the notification reference, because it is a different record |

Bridgeless and Fabric are confirmed in logcat, not assumed:

```
D jni_lib_merge: Preparing to register libfabricjni_so
D jni_lib_merge: Preparing to register libturbomodulejsijni_so
W unknown:BridgelessReact: ReactHost{0}.startSurface(surfaceId = 0): Schedule
```

No interop warnings for any module the project owns.

**The three dead-upstream legacy modules all work through the interop layer**,
as the plan predicted: `bcrypt-react-native` (offline login verified a
pre-existing stored hash), `react-native-sqlite-storage` (reference data loads)
and `react-native-build-config` (flavour config read at boot). Step 88's
suggestion to replace them was therefore not needed.

## The Metro-port trap looks different under bridgeless

Phase 11 recorded that a debug APK built without `-PreactNativeDevServerPort=3000`
bakes in 8081, cannot reach Metro and dies in a way that looks like a broken
native library. Under the New Architecture the same mistake produces a *new*
symptom, so it is worth writing down:

```
ReactHost{0}.handleHostException: SurfaceRegistryBinding::startSurface failed. Global was not installed.
The packager does not seem to be running ... (port 8081)
```

"Global was not installed" reads like a Fabric setup failure. It is not: the JS
never ran, so nothing installed the Fabric global. The fix is the same as
before — build dev debug APKs with
`./gradlew :app:assembleDevDebug -PreactNativeDevServerPort=3000`. The V4 matrix
(`assembleDebug`) does not pass it, so the debug APKs it produces are for the
build check, not for running against Metro.

## The one new manifest component

V5 caught an addition worth naming rather than waving through: RN 0.76 pulls in
AndroidX ProfileInstaller (baseline profiles for startup), which contributes

```xml
<receiver android:name="androidx.profileinstaller.ProfileInstallReceiver"
          android:permission="android.permission.DUMP"
          android:exported="true">
```

It is exported, but gated behind `android.permission.DUMP`, a signature/privileged
permission, so only the shell or a system component can reach it. No new app
permission appears in the APK (the list is still the same 17). Expected for
0.76, and now on the record.

## Open points carried forward

- **This build must not ship before every office has migrated.** It cannot read
  a Realm file at all.
- `react-native-sqlite-storage` and `bcrypt-react-native` survive on the interop
  layer, which RN will eventually remove. They are still dead upstream; folding
  the reference data into `crsen.db` (Phase 12's follow-up) removes the first,
  and the plan's own suggestion — a small `SdkJs` method over
  `at.favre.lib:bcrypt`, keeping the hash format — removes the second.
- `@react-navigation` v7, `react-native-permissions` 5 and React 19 are Phase 14.
- targetSdk stays 33 (Appendix C question 3: `registerReceiver` and the Be-Bound
  SMS receivers). compileSdk moved to 35 because RN 0.76's own AARs need it.
- Dev-only warnings unchanged: `defaultProps`, `SerializableStateInvariantMiddleware`,
  RadioButtonGroup `onPress`, react-navigation's non-serializable params notice.

## A note on the machine, not the code

The first attempt at the 0.76 build failed with *"Failed to create parent
directory"* in the Gradle cache. That is not a long-path problem (the paths were
~135 characters): **the disk was full**, 0.65 GB free. Reclaimed by deleting this
project's own regenerable build output (`android/app/build`) and the Phase 10 APK
that had been pulled off the emulator for the Phase 11 V5 diff. Shared caches
under `~/.gradle` were left alone — they hold Gradle distributions for the user's
other projects. Worth knowing before the next phase: a full 8-variant New
Architecture build needs several GB more than the legacy one, because of the
codegen C++ per ABI.
