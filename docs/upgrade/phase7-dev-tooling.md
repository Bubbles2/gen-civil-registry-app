# Phase 7 — Dev tooling (RN 0.73)

Branch `phase7-dev-tooling` off Phase 6 `d1e1a02`. Run 2026-09-18.

Jest 29 and `@react-native/babel-preset` had already been forced in Phases 5 and
6, so this phase is TypeScript, ESLint and their configs.

## Changes

| Change | Note |
|---|---|
| `typescript` 4.9.3 → **5.0.4** | Exact template pin for RN 0.73 (0.74 and 0.75 templates use the same). |
| `@tsconfig/react-native` 2 → **`@react-native/typescript-config` 0.73.1** | RN's own base config, what the 0.73 template extends; same role as the plan's "v3". `tsconfig.json` keeps `skipLibCheck`. |
| `eslint` 7 → **8.57**, `@react-native-community/eslint-config` 2 → **`@react-native/eslint-config` 0.73.2**, explicit `prettier` 2.8.8; explicit `@typescript-eslint/*` 5 lines removed (the config brings 5.62) | `.eslintrc.js` now `extends: '@react-native'` with the project's existing TS overrides. |
| `@types/react` → 18.3.x | Template range `^18.2.6`. |

**Deliberate deviation:** not ESLint 9 / flat config. `@react-native/eslint-config`
is eslintrc-shaped up to RN 0.78 (peer `eslint >=8`); running it under ESLint 9
means `FlatCompat` plus plugin-redefinition fights for a lint the plan itself
treats as cosmetic. ESLint 9 arrives with the RN 0.79+ template in Phase 14.

`@types/node` stays pinned to 18: TypeScript 5.0.4 cannot parse `@types/node` 26
either. The pin lifts once a template moves TypeScript past 5.6.

## Results

| Check | Result |
|---|---|
| V1 bundle | 5 289 209 B |
| V2 `tsc` | **506 — new baseline** (505 → 506: `TS1323` on Dashboard's dynamic `import()` under the RN base config's `module` setting; the three `stripUndefined` test typings are gone) |
| V3 Jest | 57/57 |
| Lint (no gate) | 4406 findings (813 errors, 3593 warnings), 4030 auto-fixable — recorded as the baseline, not acted on |

V4–V7 not required for this phase (no runtime change); the lockfile diff was
checked: only the 10 intended direct devDependencies changed.

## Process note

Swapping lint packages left the lockfile's root entry declaring the old
devDependencies, so `npm install` kept resolving ESLint 7 and failed on peers.
Fixed by syncing `packages[""]` in `package-lock.json` to `package.json` and
deleting only the stale lint/TS entries (53), then `npm install` — not by
regenerating the lockfile, which floats every caret dependency.
