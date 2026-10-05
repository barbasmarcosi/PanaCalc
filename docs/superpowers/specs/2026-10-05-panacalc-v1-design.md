# PanaCalc V1 — Design Specification

Date: 2026-10-05
Status: Design approved; written specification pending user review
Repository: `barbasmarcosi/PanaCalc`

## 1. Product intent

PanaCalc is a mobile-first dough calculator for home bakers and pizza makers.

The app must let a user calculate:

- the flour required for a desired total dough mass; or
- the total dough mass and ingredient quantities from a known flour quantity.

The app must work primarily on phones, remain useful offline after first load, require no backend or account, and be deployable for free as a static frontend.

## 2. Core domain model

### 2.1 Flour

Flour is the reference ingredient and always represents 100% in baker's percentages.

It is not treated as a freely removable ingredient.

### 2.2 Default ingredients

A new formula starts with:

- Flour — fixed reference at 100%
- Water — percentage-based, 70% default hydration, editable

Water is present by default and is not removable in V1. A recipe that does not use water can set it to 0%. Additional ingredients are user-defined.

### 2.3 Additional ingredients

Users can add a free-form list of ingredients such as:

- salt
- oil
- yeast
- sugar
- honey
- sourdough starter
- seeds
- any other named ingredient

Each additional ingredient has:

- stable id
- name
- quantity
- unit mode

Supported unit modes:

- `percent`: baker's percentage relative to flour
- `grams`: absolute grams

Percentage is the default mode for new ingredients.

### 2.4 Absolute grams semantics

Ingredients entered in grams are absolute values.

They do not scale when the flour amount or target dough mass changes.

If a user wants an ingredient to scale proportionally, they must define it as a percentage.

## 3. Calculation modes

The UI exposes two mutually exclusive input modes.

### 3.1 Total dough mass mode

The user provides:

- desired total dough mass in grams
- the formula

The app calculates:

- flour grams
- grams for every percentage-based ingredient
- total grams for every absolute ingredient
- final total dough mass

Let:

- `T` = desired total dough mass
- `G` = sum of all absolute-gram ingredients
- `P` = sum of all non-flour percentage ingredients expressed as a decimal

Then:

```
flour = (T - G) / (1 + P)
```

For each percentage ingredient:

```
ingredientGrams = flour * percentage / 100
```

Absolute-gram ingredients remain unchanged.

### 3.2 Flour mode

The user provides:

- flour grams
- the formula

For each percentage ingredient:

```
ingredientGrams = flour * percentage / 100
```

Absolute-gram ingredients remain unchanged.

Total dough mass is:

```
total = flour + sum(calculated percentage ingredient grams) + sum(absolute grams)
```

## 4. Precision and display

Calculations use normal JavaScript numeric precision and are not rounded during intermediate steps.

Rounding is applied only for presentation.

Default display behavior:

- show up to one decimal place
- omit trailing `.0`
- use locale-friendly formatting in the UI where appropriate

The application must not round individual ingredients before computing totals.

## 5. Validation

The calculator must remain usable and predictable for malformed input.

Rules:

- target dough mass must be greater than zero
- flour input must be greater than zero
- percentages cannot be negative
- absolute grams cannot be negative
- ingredient names cannot be empty
- percentages may exceed 100%; no arbitrary upper limit is imposed
- decimal values are supported
- in total-dough mode, the sum of absolute-gram ingredients must be lower than the target dough mass
- empty/transient input states must not crash the app

Invalid states must produce a clear inline validation message and must not emit misleading calculated results.

## 6. Presets / saved formulas

A preset stores a formula, not a batch size.

A saved preset contains:

- id
- name
- ingredient definitions
- created timestamp
- updated timestamp
- schema version as needed by storage

Loading a preset replaces the current formula while preserving the current calculator mode and current target input.

Supported preset operations in V1:

- save
- load/use
- edit
- rename
- duplicate
- delete

Preset names must not be empty.

## 7. Session persistence

The current working session is persisted independently from presets.

The session includes at least:

- calculation mode
- current target value
- current formula

Closing and reopening PanaCalc should restore the previous working state when possible.

Persistence failures must never prevent calculations from working.

If local storage is unavailable, corrupt, or contains invalid data, the app falls back safely and continues as a calculator.

## 8. Storage

Use versioned `localStorage`.

Initial keys:

```
panacalc.presets.v1
panacalc.session.v1
```

Storage access must be isolated behind a small persistence layer rather than spread through React components.

The storage layer is responsible for:

- serialization
- parsing
- schema validation / defensive recovery
- future migrations

No IndexedDB, backend database, authentication, or cloud sync is required in V1.

## 9. UX and mobile-first behavior

PanaCalc is designed from approximately 320 px wide upward.

Primary screen structure:

1. app title
2. mode selector: Total dough mass / Flour
3. target numeric input
4. ingredients editor
5. live results
6. save-formula action
7. saved formulas section

Core interactions:

- calculations update reactively; no Calculate button
- numeric inputs use mobile-friendly decimal keyboards
- touch targets are approximately 44 px or larger where practical
- no interaction depends on hover
- important result information stays close to the editor on small screens
- controls should be usable one-handed on a phone
- system light/dark preference is respected

Ingredient editor behavior:

- flour is displayed as 100%
- water exists by default
- additional ingredients can be added freely
- additional ingredients can be renamed and removed
- each additional ingredient can switch between `%` and `g`
- percentage is the default for newly added ingredients

## 10. PWA and offline behavior

PanaCalc ships as an installable Progressive Web App.

Requirements:

- web app manifest
- application icons
- service worker
- static application shell cached for offline use
- usable offline after the first successful load
- update behavior that does not leave users permanently stuck on stale assets
- correct base-path handling for GitHub Pages under `/PanaCalc/`

The app has no remote runtime API dependency in V1.

## 11. Technical architecture

Recommended stack:

- React
- TypeScript
- Vite
- Vitest
- Testing Library for critical UI flows
- CSS / CSS Modules without a heavyweight UI framework
- `vite-plugin-pwa`

Logical boundaries:

```
React UI
  |
  v
calculator state
  |
  v
pure dough calculation domain
  |
  v
calculated result

presets/session
  ^
  |
storage adapter
  ^
  |
localStorage
```

The calculation domain must remain framework-independent and testable as pure functions.

Storage code must remain separate from React presentation components.

## 12. Suggested source layout

Exact file names may evolve during implementation, but responsibilities should remain separated.

```
src/
  app/
  components/
  domain/
    dough/
  storage/
  types/
  styles/
```

Potential domain APIs include:

```ts
calculateFromTotalMass(...)
calculateFromFlour(...)
```

The implementation plan will define exact interfaces before product code is written.

## 13. Testing strategy

### 13.1 Domain tests

Cover at minimum:

- flour + water only
- multiple percentage ingredients
- mixed percentage and absolute-gram ingredients
- high percentages above 100%
- decimal inputs
- zero and invalid values
- total target lower than or equal to fixed grams
- precision / no premature rounding

Example:

```
flour = 600 g
water = 70%
salt = 2%
oil = 15 g

water => 420 g
salt  => 12 g
total => 1047 g
```

### 13.2 Storage tests

Cover:

- preset round trip
- session round trip
- corrupt JSON
- invalid schema-shaped data
- unavailable storage
- safe fallback behavior

### 13.3 UI tests

Keep UI tests focused on important user flows:

- switch calculation mode
- add/remove/rename ingredient
- switch ingredient unit
- live result update
- save and load preset
- validation presentation

## 14. CI and deployment

GitHub Actions must verify pull requests / implementation state with at least:

```
npm run lint
npm test
npm run build
```

A separate typecheck script may be added if not already covered by the build.

Production deployment:

- source branch: `main`
- provider: GitHub Pages
- delivery: GitHub Actions
- expected public path: `https://barbasmarcosi.github.io/PanaCalc/`

The deployment must be free and require no application backend.

## 15. V1 completion criteria

V1 is complete when a phone user can:

1. choose Total dough mass or Flour mode
2. enter the relevant target in grams
3. start with flour 100% and water
4. edit hydration
5. add freely named ingredients
6. define each added ingredient as percentage or absolute grams
7. rename and remove additional ingredients
8. see flour, every ingredient, and total dough mass calculated live
9. save the current formula as a preset
10. load, edit, duplicate, rename, and delete presets
11. close and reopen the app and recover the working session
12. install the app as a PWA
13. use the installed/cached app offline
14. use the UI comfortably from ~320 px width
15. access a working GitHub Pages deployment

Technical completion also requires a green lint, test, and production build.

## 16. Explicitly out of scope for V1

Do not add unless requirements change:

- backend
- user accounts
- cross-device sync
- cloud database
- public recipe sharing
- units other than grams
- nutrition calculations
- ingredient costs
- fermentation timers
- fermentation scheduling
- dough-ball count / weight calculator
- recipe categories
- folders
- favorites
- social features

## 17. Design principles

- mobile-first
- minimal interaction
- calculations must be trustworthy
- no unnecessary infrastructure
- offline-capable
- storage failures degrade gracefully
- domain logic stays pure
- avoid premature abstractions
- preserve room for future baker's-percentage features without complicating V1
