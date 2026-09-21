# Phase 8 — RN 0.73.11 → 0.74.7, Gradle on **JDK 21**

Branch `phase8-rn074-jdk21` off Phase 7 `f8030c9`. Run 2026-09-18.
**The JDK 21 goal of the plan is reached here.**

## Results

| Check | Result |
|---|---|
| `gradlew --version` | Gradle 8.6 · **JVM 21.0.6 (Amazon Corretto)** · Kotlin 1.9.20 |
| V1 bundle | 5 333 622 B |
| V2 `tsc` | **506**, error set identical to Phase 7 |
| V3 Jest | 57/57 |
| V4 | 8/8, clean build entirely on JDK 21; release 114 MB |
| V5 vs Phase 6 | permissions identical; receivers/services 14; manifest differs only in resource-ID numbering; `lib/`: RN 0.74 folds ~20 small `libreact_render_*` / `librrc_*` libs into fewer ones and adds `libreact_featureflags*`, `libreact_cxxreactpackage`, `libreact_devsupportjni`; `librnscreens.so` from screens 3.31 |
| V6 install-over (Realm 12 data) | boot with **clean logcat** (the 0.73 crash-handler warning is gone), login, 9 → 10 rows, draft nested data, FAB, duplicate/save, validate → send → `ERREUR`, search, export |
| V7 | birth identical apart from `externalId`; death byte-identical |
| `annotationProcessor` on JDK 21 | none left — Phase 6 removed Room's compiler; nothing to run |

## Changes

| Change | Note |
|---|---|
| `react-native` 0.73.11 → 0.74.7; `@react-native/{babel-preset,eslint-config,metro-config,typescript-config}` 0.74.89 | Template versions. |
| Gradle 8.6, AGP 8.2.1, Kotlin 1.9.22 | Template. `compileOptions` **stay Java 17**; only the JDK running Gradle changed. |
| Natives to the 0.74 era: screens 3.31.1, safe-area-context 4.10.1, gesture-handler 2.16.2, async-storage 1.23.1, datetimepicker 8.0.1 | svg stays 14.1.0 (15 is a major); realm 12.13.1, paper patch unchanged. 10 direct deps changed, lockfile built on Phase 7's. |
| `scripts/build.ps1` `-JavaHome` default → Corretto **21.0.6_7** | The `TEMP=C:\Temp` Unix-domain-socket workaround applies to JDK 21 exactly as to 17. |
| Not taken from the template: `targetSdk` 34, `minSdk` 23, `ndkVersion` 26 | targetSdk stays 33 (plan); Realm 12's CMake uses AGP 8.2's default NDK 25.1.8937393, which is installed. |

No source changes. Java 17 bytecode target, legacy architecture, Realm 12,
Be-Bound gate, paper patch — all carried over untouched.

## Process note

The emulator stopped twice during this session (host-side; it had to be
relaunched with `emulator -avd Pixel_5_Save`). Not related to the build.
