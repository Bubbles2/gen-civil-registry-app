# Phase 9 — RN 0.74.7 → 0.75.5 — **end of Part 1**

Branch `phase9-rn075` off Phase 8 `41dc8c1`. Run 2026-09-18.
Toolchain: Gradle 8.8 · AGP 8.5.0 · Kotlin 1.9.25 · JDK 21 · compileSdk 34 ·
targetSdk 33 · Java 17 bytecode · legacy architecture · Realm 12.13.1.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 325 389 B (baseline 5 913 234; −9.9 %) |
| V2 `tsc` | **513 — new baseline** (506 + 8 identical `tvParallaxProperties` typings from react-native-paper 4 against RN 0.75's `ViewProps` − 1; resolved by paper 5 in Phase 11) |
| V3 Jest | 57/57 |
| V4 | 8/8 clean on JDK 21; release 122 MB |
| V5 vs Phase 8 | manifest and permissions identical; receivers/services 14; `lib/`: RN 0.75 runtime additions (`libreact_nativemodule_*`, `libreact_performance_timeline`, `libreact_render_*consistency`, `librrc_textinput`), `libreact_cxxreactpackage`/`libreactperfloggerjni` folded away; `librealm.so` present — **no `useLegacyPackaging` needed** |
| V6 install-over (Realm 12 data) | boot, login, 10 → 11 rows, draft nested data, FAB, duplicate/save, validate → send → `ERREUR`, search, export |
| V7 | birth identical apart from `externalId`; death byte-identical |
| `newArchEnabled` | `false`, verified in `gradle.properties` |

## Changes

| Change | Note |
|---|---|
| `react-native` 0.74.7 → 0.75.5; `react` 18.2 → 18.3.1; `react-test-renderer` 18.3.1; `@react-native/*` 0.75.5 | Template. |
| Gradle 8.8, AGP 8.5.0, Kotlin 1.9.25 | Template (0.75.7). |
| **Autolinking moved into the RN Gradle plugin**: `settings.gradle` uses the `com.facebook.react.settings` plugin + `autolinkLibrariesFromCommand()`; `app/build.gradle` `react { autolinkLibrariesWithApp() }`; `native_modules.gradle` gone from both | Template. The CLI's `react-native.config.js` (`packageName`) is still read by the plugin. |
| Natives: screens 3.34.0, safe-area-context 4.11.1, gesture-handler 2.18.1, async-storage 1.24.0 | datetimepicker stays 8.0.1 — 8.2 drags optional web/expo peers that want React 19. |
| `ndkVersion 25.1.8937393` declared (root ext + app) and pinned for every library via `gradle.beforeProject` in `settings.gradle` | AGP 8.5 defaults to NDK 26.1, not installed; `realm` and `react-native-screens` now compile native code and `realm` ignores the root `ext`. `subprojects { afterEvaluate }` cannot be used because the RN root plugin evaluates children first. Phase 3 had removed `ndkVersion` when nothing compiled native code. |
| Not taken from the template | `targetSdk` 34, `minSdk` 23. |

The RN 0.73-era `W NativeCrashHandlerImpl … libnative_crash_handler_jni.so`
warning is back in logcat at 0.75 (absent at 0.74). Warning only.

## Part 1 status

Reached: RN 0.75 · JDK 21 for Gradle · AGP 8.5 · Java 17 bytecode · legacy
architecture. Divergences from the plan's Part 1 end state, all documented in
the phase notes: Realm is **12.13.1**, not 11 (Realm 11 could not run past RN
0.72); one `patch-package` patch exists (`react-native-paper` 4 shadow, Android
only); Flipper is gone; Be-Bound is gated; ESLint is 8, not 9.

Tag `part1-complete` and the canary rollout are the user's (rule 7). Remember:
the field transition from any pre-Phase-6 build to this one is the one-way Realm
12 format upgrade.
