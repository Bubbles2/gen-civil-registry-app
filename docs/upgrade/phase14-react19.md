# Phase 14 — RN 0.78, React 19, React Navigation v7, permissions 5

Working tree on `feature/phase1` off Phase 13. Run 2026-09-22. Nothing committed.

| | Before | After |
|---|---|---|
| React Native | 0.76.9 | **0.78.3** |
| React | 18.3.1 | **19.0.0** |
| Gradle / AGP | 8.10.2 / 8.6.1 | **8.12 / 8.8.0** |
| Kotlin | 1.9.25 | **2.0.21** |
| `@react-navigation/*` | 6.0.14 / 6.9.2 | **7.4.1 / 7.19.2** |
| `react-native-permissions` | 4.1.5 | **5.3.0** |
| NDK | 27.1.12297006 | 27.1.12297006 (unchanged) |
| compileSdk / targetSdk | 35 / 33 | 35 / 33 (unchanged) |
| Metro | 0.81.3 | 0.81.5 |

## Why this is one phase and not two

Phase 13 carried forward "`@react-navigation` v7, `react-native-permissions` 5 and
React 19 are Phase 14". React 19 is not a JS-only bump: **RN 0.77 still peers
`react@^18.2.0`, and `^19.0.0` starts at RN 0.78**, so the React 19 item forces a
native RN bump with it. 0.78 is the *first* version that peers React 19, so it is
the smallest step that discharges the whole carry-forward, and it keeps the
project's one-minor-at-a-time cadence.

ESLint 9 stays deferred. Phase 7 filed it as "arrives with the RN 0.79+ template
in Phase 14"; 0.78's template still ships `eslint@^8.19.0`, so there is nothing to
pick up yet. It belongs with whichever phase reaches 0.79.

## Versions came from align-deps, then were pinned

`npx @rnx-kit/align-deps --requirements react-native@0.78` is the authority for
the native-module window, as in Phase 13. Its 0.78 profile asked for:

| Package | Window | Pinned to |
|---|---|---|
| `react` | `19.0.0` | **19.0.0** |
| `react-test-renderer` | `19.0.0` | **19.0.0** |
| `react-native-screens` | `>=4.5 <4.14.0` | **4.9.2** |
| `react-native-safe-area-context` | `^5.2.0` | **5.3.0** |
| `react-native-gesture-handler` | `^2.24.0` | **2.24.0** |
| `@react-navigation/native` | `^7.1.14` | `^7.1.34` → resolves **7.4.1** |
| `react-native-svg` | `^15.11.2` | 15.12.1 (already inside) |
| `@react-native-async-storage/async-storage` | `^2.0.0` | 2.1.2 (already inside) |
| `@react-native-community/datetimepicker` | `^8.0.0` | 8.0.1 (already inside) |

Exact pins again sit **inside** the window rather than at the top of the caret
range: npm would otherwise have taken screens 4.13.1 and safe-area-context 5.10,
neither of which is what the 0.78 profile was tested against.

A re-run of align-deps after the install reports only exact-pin-vs-caret
formatting differences — every installed version satisfies its range. `react` and
`react-test-renderer` drop off the report entirely, which is the check that React
19 landed correctly.

`@react-native-community/cli` stays at **15.0.1**, pinned exactly. The 0.78
template still ships 15.0.1; CLI 16 belongs to 0.79.

`@op-engineering/op-sqlite` stays at **14.1.0** and its Phase 12 CMake patch
still applies unchanged.

## Android: Gradle 8.12, AGP 8.8.0, Kotlin 2.0.21

Taken from the RN 0.78.3 template and `@react-native/gradle-plugin@0.78.3`'s
`libs.versions.toml` (`agp = "8.8.0"`, `kotlin = "2.0.21"`), not guessed. NDK
27.1.12297006 is unchanged — 0.78 pins the same one 0.76 did, so the Phase 13
reasoning about folly and C++20 concepts still holds and needed no revisiting.

Kotlin 2.0.21 matters beyond the template: screens 4.9 and gesture-handler 2.24
ship Kotlin 2 metadata, which a 1.9.25 compiler will not read.

**`android/.kotlin/` is new.** Kotlin 2.0 writes per-build session state there.
It is regenerable, like `android/.gradle` and `android/app/.cxx`, and is now in
`.gitignore`.

## React 19's removals are the real content of this phase

React 19 does not deprecate `defaultProps` and `propTypes` on function
components — it **ignores them outright**. Nothing warns at build time and
`tsc` cannot see it, so this is the part that a version table hides.

### The app's own eight components

`TextInput`, `DateInput`, `TimeInput`, `RadioButtons`, `NumericsInput`,
`NotificationNumberInput`, `Autocomplete` and `AutocompletePcs` all set
`defaultProps` and are all function components. The defaults that mattered were
the ones that default to **true**:

```
TextInput   editable: true, display: true
DateInput   visible: true
TimeInput   visible: true
```

Under React 19 those arrive as `undefined`, which is falsy — form fields would
have gone non-editable or invisible with no error anywhere.

All eight take an undestructured `(props: Props)`, so converting to destructured
default parameters would have meant rewriting every body. Instead
`src/components/common/withDefaults.ts` applies the rule React used to apply, and
only that rule: **a default fills in when the value is `undefined`, never when it
is `null`, `false`, `0` or `""`**. Spreading (`{...defaults, ...props}`) is *not*
equivalent — it lets an explicitly passed `undefined` beat the default, which
`defaultProps` did not.

The three `ProgressSteps` components keep their `defaultProps`: they are class
components, and React 19 still honours `defaultProps` on classes.

`propTypes` are left in place. React 19 ignores them too, but they were dev-only
validation — dropping them changes no behaviour, and removing eight more blocks
would have widened this phase for nothing.

### One library was actually broken: `react-native-modal-datetime-picker`

On Android `DateTimePickerModal` is `memo(fn)` — a function component — and
14.0.1 sets its defaults through `defaultProps`:

```js
DateTimePickerModal.defaultProps = {
  date: new Date(), isVisible: false, onHide: () => {},
};
```

`src/components/common/DateInput.tsx` passes **neither `date` nor `onHide`**. It
relied on those defaults. Worse, the memo comparator dereferences the prop
unconditionally:

```js
prevProps.date.getTime() === nextProps.date.getTime()
```

so under React 19 `date` is `undefined` and tapping the calendar icon throws
rather than degrading. That is the V6 step "tap the calendar icon and pick a day
in the native picker".

Upstream fixed it in **18.0.0** — default parameters plus `date?.getTime()`.
16.0.0 and 17.0.0 still carry the bug, so there is no small version bump that
fixes it. Rather than pull four majors of a picker into a phase that already
carries RN 0.78, React 19, navigation v7 and permissions 5, upstream's own fix is
applied as `patches/react-native-modal-datetime-picker+14.0.1.patch`. The project
already uses patch-package for op-sqlite.

`@react-native-community/datetimepicker >= 6.7.0` and `react-native >= 0.65.0` are
18.0.0's only peers, both already satisfied — so **moving to 18.0.0 and dropping
the patch is a clean follow-up** for a phase with room to re-test the picker.

### Everything else with `defaultProps` was checked and is fine

Every package in `dependencies` was scanned for the function-component form
(`X.defaultProps =`, not `static defaultProps`):

| Package | Verdict |
|---|---|
| `react-native-vector-icons` | `static` on `PureComponent` classes — safe |
| `react-native-keyboard-aware-scroll-view` | `static` in a class HOC — safe |
| `react-native-modal-datetime-picker` | **broken, patched** (above) |
| `react-native-numeric-input` | `NumericInput` is a class; its inner `Button` is a function, but all four `<Button>` sites pass `onPress` explicitly, so the default was already dead |
| `react-native-paper`, `-paper-dates`, `-dropdown-select-list`, `-detect-press-outside`, `-status-bar-height` | no `defaultProps` |

String refs, `contextTypes`/`childContextTypes`, `createFactory` and `findDOMNode`
— React 19's other removals — do not appear in the app at all.

## What React 19 and navigation v7 did to the `tsc` ratchet

The raw count went 449 → **453** on the upgrade alone, which understates the
churn. The composition:

| Change | Δ |
|---|---|
| `useRef()` with no argument — React 19 made the parameter required | **+37** |
| `JSX.Element` — React 19 removed the global `JSX` namespace | **+2** |
| `<Stack.Screen component={LoginScreen}>` — navigation v7 typing | **+1** |
| baseline errors that React 19 / v7 typings *resolved* | **−36** |
| | **+4** |

The −36 is arithmetic (449 + 40 − 453), not an enumeration: no per-error baseline
list is kept, only the count.

All three new classes were fixed rather than absorbed:

- **`useRef(undefined)`** at 37 sites, which is what React's own codemod does:
  same runtime behaviour, same resulting type.
- **`React.JSX.Element`** in `App.tsx` and `Logo.tsx`.
- **`LoginScreen`'s `login` prop is now optional.** v7 types a screen as
  `ScreenComponentType`, which supplies only `navigation`/`route`; a second
  *required* prop makes the component unassignable. Nothing ever passed `login`:
  the `props.login` reads in that file are inside `onLoginPressed(props)`, whose
  parameter **shadows** the component props and carries the react-hook-form
  values. So the declaration was vestigial, and the v7 types found it.

Final count **413**, 36 below the Phase 13 baseline of 449.

## Results

| Check | Result |
|---|---|
| V1 bundle | **5 235 187 B** (Phase 13: 5 083 633; **+151 554 B, +3.0 %**) — inside the ±20 % band (4.73–7.10 MB). Metro 0.81.5 |
| V2 `tsc` | **413** (Phase 13 baseline 449; ratchet passes, −36) |
| V3 Jest | **86/86 across 7 suites** — identical to Phase 13 |
| V4 build matrix | **8/8 APKs**, `BUILD SUCCESSFUL in 24m 16s` (cold NDK, 1395 tasks). Release **98.82 MB** every flavour (Phase 13: 98.91). Debug 183.89 MB dev / 182.74 others (Phase 13: 184.37 / 182.32) |
| V5 golden APK diff | permissions **identical**, merged manifest **identical**, `lib/` **identical** (73). +48 `/res/` drawables, **0 removed** — see below |
| V6 on-device walkthrough | **pass** — boot under bridgeless, offline login, 20 rows, full birth form across 5 pages with both date pickers and the time picker, validate, filter, send, export |
| V7 payload capture | metadata key **order identical** to Phase 13 across all 19 common keys; **0 new keys**; top-level keys identical |

ESLint is not a V-check and is not a gate here; `@react-native/eslint-config@0.78.3`
loads under ESLint 8, which is all that was in question.

### V5 in detail

Diffed against Phase 13's own archives (`scripts/validate/out/v5-p13-*`), like for
like. Phase 14's evidence is archived alongside as `v5-p14-*`.

- **Permissions identical.** The dev *debug* APK has 17 in both phases; the *release*
  APK has 16 in both. The difference is `android.permission.SYSTEM_ALERT_WINDOW`,
  which RN contributes from its **debug** manifest for the dev overlay. Worth
  writing down because comparing a debug list against a release list looks exactly
  like a dropped permission and is not one. (Phase 13's doc says "17"; its archived
  file holds 16 for release and 17 for debug — the doc quoted the debug number.)
- **Merged manifest byte-for-byte identical.**
- **`lib/` byte-for-byte identical**, 73 entries. No new native library despite
  RN 0.76 → 0.78, and no codegen library lost.
- **+48 files, all under `/res/`, nothing removed and nothing outside `/res/`.**
  They are `ic_call_answer*`, `ic_call_decline*` and
  `notification_oversize_large_icon_bg` across the density buckets — the
  `NotificationCompat.CallStyle` drawables from `androidx.core:core`, confirmed by
  locating them in the resolved AAR (`caches/8.12/transforms/…/core-1.13.1/res/`)
  rather than inferred. No dex, lib or manifest change accompanies them, and the
  release APK is 0.09 MB *smaller* overall, so this is resource packaging, not new
  behaviour.

### V6 in detail

Run on `Pixel_5_Save`, `adb install -r` over the Phase 13 build so the migrated
database survived — the build ID on screen read `1.1.4-dev · dev · 7f45f9f-dirty`.

| Step | Result |
|---|---|
| boot | bridgeless confirmed in logcat (`jni_lib_merge`, `BridgelessReact`), bundle served by Metro 0.81.5 |
| restart | `openDb: crsen.db ready (SQLCipher: true)` · `initDeclarationStore: already-migrated (183 ms)` |
| offline login | `connexion réussi` — bcrypt verified a pre-existing stored hash |
| Dashboard | **19 rows**, exactly the state Phase 13 left |
| new birth declaration | 5 pages: notification (ref, date, time), child (radios + name), birth (two pickers, conditional facility/address, weight, multiple-birth), father, mother → **Enregistrer** → **20 rows** |
| restart | still **20 rows** — the write committed |
| VALIDER → filter Validé only | **exactly 1 row**, green icon |
| long-press → select → ENVOYER | `Request failed with status code 401` (dev gateway, expected) |
| export | `Export terminé`; `crsen.db`, `dbSenegal.db`, `manifest.txt` — no `declarations.realm`; `PRAGMA integrity_check = ok` on `dbSenegal.db` |

**The date picker is the step that mattered.** It was exercised twice: once on a
field that already held a value (22/09/2026 → 20/09/2026, round-tripping through
`onConfirm`) and once on an **empty** field on the birth page, where it opened on
"Tue, Sep 22". That second case is the proof the patch was needed and works — with
no incoming `date`, the default comes from the default parameter the patch added;
unpatched, React 19 would have left it `undefined` and `prevProps.date.getTime()`
in the memo comparator would have thrown on the calendar tap.

Every component whose `defaultProps` were migrated rendered and behaved: labelled
and editable text inputs, both pickers, radio groups, the conditional
facility/address swap, the weight numeric input and the autocomplete with its
required-field validation.

Two things learned about driving this app, worth adding to the `/validate` notes:

- **`ui.sh` cannot see the app's dialogs.** The ⋮ filter menu and the row
  MODIFIER/VALIDER/DUPLIQUER/SUPPRIMER dialog are React Native overlays that never
  appear in a `uiautomator dump`, and dumping *closes* them. They have to be driven
  by coordinates read off a screenshot.
- **Long-press only selects a `Validé` row.** Long-pressing a Brouillon row does
  nothing at all — no checkbox — so `ENVOYER` with nothing selected is a silent
  no-op. VALIDER first, then filter, then long-press.

### V7 in detail

The strongest form — re-sending the *same* record Phase 13 sent — was not
available: the send path only accepts a `Validé` row, and Phase 13's record is in
`ERREUR`. So this is the fallback the toolkit names: compare the metadata key set
and key **order**, which is what a storage or schema change would silently break.

| | |
|---|---|
| top-level keys (`officeCode`, `externalId`, `templateCode`, `metadata`) | **identical** |
| common metadata keys | **19 of 19, identical relative order** |
| keys new in Phase 14 | **0** |
| keys absent vs Phase 13 | 8, all explained by the form as filled |

The 8 absent keys are the six `FATHER.*` entries — the record was entered with
*Père connu = Non*, which collapses that whole section — plus `MOTHER.NUM_IDENT`
and `MOTHER.INFO_DOM.SAME_ADR`, two optional fields left empty. Nothing was
renamed, reordered, added or silently dropped by the upgrade. Captured as
`scripts/validate/out/payload-NAISSANCE-phase14.json.txt`.

### One non-fatal warning seen twice

```
E ReactNativeJNI: react_native_expect failure: value.hasType<std::vector<RawValue>>()
```

Logged twice while a dialog was opening and never again across the rest of the
walkthrough; nothing failed and no JS error accompanied it. It is a Fabric
prop-parsing soft assertion, not a crash. Recorded because it was not seen in
Phase 13 — worth watching rather than acting on.

## Re-running this phase's tests

The walkthrough above is scripted as `scripts/validate/v6-phase14.sh`, so it does
not have to be redriven by hand.

```bash
scripts/validate/v6-phase14.sh             # build + install + walkthrough + V7
scripts/validate/v6-phase14.sh --no-build  # reuse the installed APK (~7 min)
scripts/validate/v6-phase14.sh --check     # boot / login / row count only (~2 min)
```

PASS/FAIL per step, non-zero exit on any failure. Verified green end to end:
**35 passed, 0 failed**.

Getting there took five runs, and the four defects were all the same shape — a
check that passed while testing nothing. They are worth naming because the script
exists to catch regressions, and each of these would have hidden one:

| Defect | Why it mattered |
|---|---|
| `grep -q "CONNEXION"` also matches **DÉ**`CONNEXION` on the dashboard | the script asserted "back at the login screen", passed, then drove the export against a screen that was not there. Fixed with `grep -qx '"CONNEXION"'` |
| the export used the newest export directory | a **stale** directory from an earlier run satisfied every file check, so the step passed having exported nothing. Now it counts directories before and after |
| `integrity_check` printed PASS from inside python | the result never reached the tally, so a corrupt database would have been reported and the script would still have exited 0 |
| `export MSYS_NO_PATHCONV=1` globally | breaks `curl -o /dev/null`, so every Metro readiness check failed silently. `launch.sh` already carried this warning |

Two real UI behaviours also had to be encoded: selecting *Domicile* on page 3
inserts an address field that pushes `Naissance multiple *` below the fold, and
`uiautomator` only reports rendered nodes — so the page must be scrolled or the
radio simply is not there, and the form stalls with no error modal. And a fixed
`sleep` after a relaunch under-waits a cold JS reload; it polls now.

The static checks (V1–V3) and the build matrix (V4/V5) stay where they were:

```bash
scripts/validate/static-checks.sh                     # V1 bundle, V2 tsc, V3 jest
cd android && TEMP='C:\Temp' TMP='C:\Temp' ./gradlew assembleRelease assembleDebug
```

Two notes on what the script is and is not. **There is no e2e framework in this
project** — no Detox, Appium or Maestro. Every step is `adb shell input` driving the
real app, `uiautomator dump` reading the screen back through `ui.sh`, and `adb logcat`
for assertions. And the ⋮ menu and row dialog are React Native overlays that
`uiautomator` cannot see at all, so those few steps are tapped at fixed coordinates
kept in one OVERLAY BLOCK at the top of the script; it refuses to run on anything
other than `Pixel_5_Save` at 1080x2340 rather than tapping blind.

The script asserts the React 19 date-picker regression directly — it opens the
picker on both a populated and an **empty** date field and fails if either throws.
That is the check to run after any future React, RN or picker bump, and the one that
would catch the `defaultProps` removal coming back.

`--check` is deliberately cheap enough to run after any dependency change: it proves
the app boots bridgeless, opens SQLCipher, does not re-run the Realm migration, and
logs in offline.

## The disk problem Phase 13 warned about came true

Phase 13 closed with "a full 8-variant New Architecture build needs several GB
more than the legacy one". Before this phase the working tree was **19.7 GB** with
**8.5 GB free** on C:, which is not enough:

| | |
|---|---|
| `android/app/build` | 10.5 GB |
| `node_modules/@op-engineering/op-sqlite/android/build` | 3.9 GB |
| `node_modules/react-native-screens/android/build` | 3.1 GB |
| `node_modules/react-native-gesture-handler/android/build` | 1.1 GB |
| `android/app/.cxx` | 0.7 GB |
| `node_modules/@op-engineering/op-sqlite/android/.cxx` | 0.4 GB |
| source, `.git`, docs, ios, scripts | ~50 MB |

It multiplies because 4 flavours × debug/release × 4 ABIs is 32 combinations and
each keeps its own copy of the native libraries: `merged_native_libs` alone held
16 copies at 170–240 MB. The three native modules compile C++ **inside
`node_modules`**, where `npm install` never cleans them.

`cd android && ./gradlew clean` reclaims all of it — including the `node_modules`
trees, which it reaches through the autolinked projects (`node_modules` went
9.1 GB → 1.02 GB). **Free space went 8.5 GB → 19 GB.** `android/app/.cxx` is the
one thing `clean` leaves behind.

Worth doing before every phase, not after the build fails.

## Open points carried forward

- **Still must not ship before every office has migrated** (Phase 13): this build
  cannot read a Realm file.
- **Move `react-native-modal-datetime-picker` to 18.0.0 and delete the patch.**
  Peers are already satisfied; it needs a phase with room to re-test the date
  picker.
- `react-native-permissions` 5 needs a `setup_permissions` block in `ios/Podfile`
  for iOS. **Not done**: iOS is unmaintained here (no `Podfile.lock`, and V1–V7 is
  Android-only). Android needs no Podfile equivalent, and
  `src/core/permission/Permissions.tsx` uses only `requestMultiple`/`RESULTS`,
  which are unchanged in v5.
- ESLint 9 with the 0.79+ template.
- `@react-navigation` v8 is in alpha; v7 is the stable line.
- `react-native-sqlite-storage` and `bcrypt-react-native` still survive on the
  interop layer and are still dead upstream (Phase 13).
- `android/app/src/main/jni/` (8 files: `MainApplicationTurboModuleManagerDelegate`,
  `MainComponentsRegistry`, `OnLoad.cpp`, `CMakeLists.txt`) is **dead**: no
  `externalNativeBuild` block references it, and RN's gradle plugin builds
  `libappmodules.so` itself. Left alone this phase; a candidate for deletion.
- targetSdk stays 33 (Appendix C question 3).
