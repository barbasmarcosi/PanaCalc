# PanaCalc V2 — Design Specification

Date: 2026-10-05
Status: Design approved; written specification pending user review
Repository: `barbasmarcosi/PanaCalc`
Base release: PanaCalc V1 at commit `1b9836678bac81ee4a415ac2cc1ee9222b43c188`

## 1. Product intent

PanaCalc V2 extends the existing offline-first baker's-percentage calculator without introducing a backend, accounts, cloud synchronization, or any runtime dependency on remote services.

V2 keeps V1's core promise: calculations must remain trustworthy, fast, usable on a phone, and available offline.

The primary additions are:

- first-class mass unit conversion;
- dough-piece / dough-ball calculation;
- explicit recipe scaling;
- preferment support;
- local fermentation schedule planning;
- improved organization of saved formulas;
- safe migration from V1 storage;
- a parallel beta deployment that does not replace the existing V1 URL until V2 is accepted.

Import/export is explicitly excluded from V2.

## 2. Non-negotiable constraints

V2 must remain:

- 100% frontend;
- deployable as static files;
- PWA-capable and offline after the first successful load;
- functional without authentication;
- functional without any backend API;
- functional without cloud storage;
- compatible with the existing V1 formula semantics.

Any feature that would require accounts, server-side data, cloud synchronization, or third-party runtime APIs is out of scope.

## 3. Architectural model

V2 separates three concepts that were partially combined in V1.

### 3.1 Formula

A formula defines recipe composition independently of batch size.

It contains:

- flour as the fixed baker's-percentage reference at 100%;
- water as the fixed hydration ingredient, percentage-based and non-removable;
- custom ingredients;
- optional preferments;
- formula metadata used by saved presets.

### 3.2 Production

Production describes how much dough to make.

Supported production modes:

- target total dough mass;
- known flour mass;
- dough pieces / balls: count × target mass per piece.

Production also owns:

- selected input mass units;
- result display unit;
- explicit scale multiplier when used.

### 3.3 Planning

Planning is optional scheduling metadata layered on top of a formula and production target.

It contains user-defined preparation / fermentation stages with durations and a desired completion or bake time.

Planning does not alter the dough composition unless a future specification explicitly adds such behavior.

## 4. Mass units

### 4.1 Internal canonical unit

All domain calculations use grams internally.

Unit conversion is restricted to the input/output boundary. No dough calculation operates directly in kilograms, ounces, or pounds.

This avoids repeated conversion and prevents unit-specific calculation branches.

### 4.2 V2 supported mass units

V2 supports:

- grams: `g`
- kilograms: `kg`
- ounces: `oz`
- pounds: `lb`

Canonical conversion factors:

```
1 kg = 1000 g
1 oz = 28.349523125 g
1 lb = 453.59237 g
```

Conversion functions must preserve useful numeric precision internally and round only for display.

### 4.3 Units deliberately excluded

V2 does not support volume units such as:

- millilitres;
- cups;
- tablespoons;
- teaspoons.

Those conversions require ingredient density and would no longer be pure mass conversion.

### 4.4 Unit UX

Every mass input that represents an absolute mass may expose a unit selector.

Examples include:

- total dough target;
- flour amount;
- dough-piece weight;
- custom ingredients whose formula unit is absolute mass.

A user may therefore enter:

```
2.5 kg total dough
3 lb flour
1.5 oz fixed oil
```

The domain layer normalizes each value to grams before calculation.

### 4.5 Result display

V2 provides a global preferred result unit.

The minimum supported behavior is:

- `g`
- `kg`
- `oz`
- `lb`

Input fields retain their selected unit independently from the global result-display unit.

Display formatting may adapt decimal precision to the selected unit, but calculations must never round intermediate values.

## 5. Formula scaling semantics

The V1 distinction remains authoritative:

- percentage ingredients are scalable;
- absolute-mass ingredients are fixed.

This rule also applies to V2's explicit scale control.

If an ingredient is entered as `15 g`, applying `×2` does not change that ingredient to `30 g`.

If an ingredient is entered as `2%`, its calculated grams follow the flour amount and therefore scale.

The UI must make this distinction clear because an explicit scale multiplier does not necessarily multiply the final total mass exactly when fixed absolute ingredients are present.

## 6. Dough pieces / balls

V2 adds a third production mode: `pieces`.

Inputs:

- positive integer number of pieces;
- positive target mass per piece;
- selected unit for piece mass.

The derived total dough target is:

```
totalTargetGrams = pieceCount * pieceMassInGrams
```

That derived target then enters the same total-mass calculation engine used by the existing total-dough mode.

The feature must work for:

- pizza dough balls;
- bread loaves;
- baguettes;
- rolls;
- any other equal-mass pieces.

Validation:

- piece count must be an integer greater than zero;
- piece mass must be greater than zero;
- invalid/transient input must suppress misleading results rather than crash.

## 7. Explicit recipe scaling

V2 exposes convenient explicit scale controls, initially:

- ×0.5
- ×2
- ×3
- custom positive multiplier

Scaling is a production convenience, not a mutation of the stored formula definition.

The preferred implementation keeps the formula stable and applies the multiplier to the scalable production basis.

Fixed absolute ingredients remain unchanged according to Section 5.

A scale multiplier must be persisted as session/production state only if doing so improves continuity; it is not inherently part of a saved formula.

## 8. Preferments

### 8.1 Goal

Preferments must be represented explicitly enough that PanaCalc can distinguish flour and water already contained in a preferment from flour and water still required in the final mix.

V2 should support common patterns including:

- poolish;
- biga;
- sourdough starter / levain;
- custom named preferments.

### 8.2 Preferment model

A preferment contains at minimum:

- stable id;
- name;
- flour mass contribution;
- water mass contribution;
- optional additional ingredients only if the implementation can preserve clarity.

Preferment flour and water count toward the overall formula totals.

For example:

```
overall flour required: 1000 g
overall water required: 700 g

preferment:
  flour: 200 g
  water: 200 g

final mix:
  flour remaining: 800 g
  water remaining: 500 g
```

The result view must make clear:

- total flour;
- total water;
- preferment contribution;
- remaining final-mix flour/water.

### 8.3 Baker's-percentage consistency

Overall baker's percentages remain referenced to total formula flour, including flour contained in preferments.

Preferment calculations must not double-count flour or water.

### 8.4 Scope guard

V2 does not attempt to mathematically predict fermentation performance from inoculation, temperature, flour type, pH, or microbial activity.

Preferments are composition structures, not biological simulation.

## 9. Fermentation / preparation planner

V2 provides a deterministic local schedule calculator.

A plan consists of ordered stages such as:

- mixing / preparation;
- bulk fermentation;
- division / shaping;
- cold fermentation;
- tempering;
- final proof;
- baking preparation.

Each stage has:

- stable id;
- name;
- duration.

The user can provide a target completion / bake date and time.

PanaCalc works backward through the stage durations to calculate the required starting date/time and each stage boundary.

Example:

```
Bake: Sunday 20:30

Tempering          2 h
Cold fermentation 24 h
Bulk fermentation  2 h
Preparation       30 min

=> calculated start and stage timestamps
```

All scheduling is local to the device.

V2 does not claim that these durations are scientifically predicted. They are user-defined planning inputs.

## 10. Saved formula organization

Saved formulas remain local.

V2 adds:

- favorite flag;
- optional single category;
- manual ordering;
- search by name.

Suggested categories are a UI convenience only. Users may provide their own category names.

V2 does not add:

- cloud folders;
- shared collections;
- social features;
- multi-user collaboration.

Existing operations remain available:

- save;
- use/load;
- rename;
- update from current formula;
- duplicate;
- delete.

## 11. Storage V2

### 11.1 Production namespace

The production V2 application uses versioned keys such as:

```
panacalc.session.v2
panacalc.presets.v2
panacalc.preferences.v2
```

Exact key decomposition may be refined in the implementation plan.

### 11.2 V1 migration

When V2 is promoted to the main PanaCalc deployment, it must safely read V1 keys:

```
panacalc.session.v1
panacalc.presets.v1
```

and migrate valid data into V2 structures.

Requirements:

- never delete V1 data as part of normal migration;
- migration is idempotent;
- invalid V1 data falls back safely;
- valid V1 formulas retain their existing meaning;
- water remains percentage-based;
- V1 absolute grams remain fixed absolute grams;
- migration failure must never block the calculator.

### 11.3 Preview storage isolation

The beta preview and V1 production URLs are both hosted under the same browser origin:

```
https://barbasmarcosi.github.io/
```

Browser `localStorage` is origin-scoped, not path-scoped. Therefore:

```
/PanaCalc/
/PanaCalc-V2/
```

share the same underlying `localStorage`.

The V2 beta MUST NOT use production V2 keys.

The preview build uses a distinct namespace, for example:

```
panacalc.preview.session.v2
panacalc.preview.presets.v2
panacalc.preview.preferences.v2
```

The preview application must not mutate V1 keys.

This prevents beta testing from affecting V1 production state.

When V2 is eventually promoted to `/PanaCalc/`, the production build uses the production V2 namespace and performs the V1-to-V2 migration described above.

## 12. Parallel V2 beta deployment

### 12.1 Goal

V1 remains live and unchanged while V2 is developed and tested.

Production V1 remains:

```
https://barbasmarcosi.github.io/PanaCalc/
```

V2 beta is published separately at:

```
https://barbasmarcosi.github.io/PanaCalc-V2/
```

### 12.2 Source of truth

Product development remains in:

```
barbasmarcosi/PanaCalc
```

on the feature branch / PR used for V2.

The separate preview repository is a deployment target, not an independent source-of-truth codebase.

Target preview repository:

```
barbasmarcosi/PanaCalc-V2
```

### 12.3 Preview publication

The implementation plan must choose the simplest reliable method to publish the V2 build to the preview repository while preserving the main source repository as authoritative.

The preview deployment must:

- build from V2 source;
- use base path `/PanaCalc-V2/`;
- use preview storage keys;
- keep PWA service-worker scope under `/PanaCalc-V2/`;
- not modify or redeploy V1.

### 12.4 Promotion

V2 replaces V1 only after explicit acceptance.

Promotion sequence:

1. V2 feature PR is green.
2. V2 beta is manually exercised at the preview URL.
3. User explicitly approves promotion.
4. V2 is merged into `main` of `PanaCalc`.
5. Production build uses `/PanaCalc/`.
6. Production storage uses V2 production keys and migrates V1 data safely.
7. Existing V1 URL now serves V2.
8. Preview repository may be archived, retained, or repurposed for later beta releases.

## 13. PWA behavior

V2 remains an installable PWA.

Both production and preview builds must have isolated service-worker scopes:

Production:

```
/PanaCalc/
```

Preview:

```
/PanaCalc-V2/
```

The preview service worker must not control production V1 pages, and vice versa.

Offline behavior remains required after a successful first load.

## 14. Validation and error handling

Existing V1 validation remains in force.

Additional V2 validation includes:

- unsupported mass unit rejected;
- non-finite conversion rejected;
- piece count must be a positive integer;
- piece mass must be positive;
- scale multiplier must be positive;
- preferment flour/water cannot be negative;
- preferment contribution cannot create impossible remaining flour/water values;
- stage duration cannot be negative;
- malformed migrated storage safely falls back;
- preview storage failures do not affect calculations.

Transient UI input states must not display stale or misleading calculations.

## 15. Testing strategy

### 15.1 Unit conversion tests

Cover:

- g ↔ kg;
- g ↔ oz;
- g ↔ lb;
- kg ↔ oz/lb;
- round trips within defined numeric tolerance;
- decimal comma parsing where existing UX supports it;
- invalid unit / invalid numeric input;
- no premature rounding.

### 15.2 Production-mode tests

Cover:

- total mass mode;
- flour mode;
- pieces mode;
- piece count × piece mass;
- all supported piece mass units;
- invalid count / mass;
- scale multiplier;
- fixed absolute ingredients remaining fixed during scaling.

### 15.3 Preferment tests

Cover:

- poolish-style equal flour/water contribution;
- lower-hydration biga;
- preferment deduction from final-mix flour/water;
- no double counting;
- impossible preferment contribution validation.

### 15.4 Planner tests

Cover:

- backward stage calculation;
- crossing midnight;
- crossing calendar days;
- zero-duration allowed if intentionally supported;
- local date/time handling;
- stage ordering.

### 15.5 Storage tests

Cover:

- V2 round trips;
- V1 → V2 session migration;
- V1 → V2 preset migration;
- idempotent migration;
- corrupt V1 and V2 data;
- storage exceptions;
- preview namespace isolation.

### 15.6 UI tests

Focus on critical workflows:

- switch among total/flour/pieces modes;
- switch input units;
- switch output unit;
- create piece target;
- apply scale multiplier;
- create/edit preferment;
- calculate a schedule;
- favorite/category/search/order presets;
- restore/migrate data;
- preview mode does not touch production keys.

## 16. UX principles

V2 remains mobile-first from approximately 320 px upward.

The UI should avoid turning the main calculator into a dense expert dashboard.

Progressive disclosure is preferred:

- core production controls remain immediately visible;
- advanced formula controls such as preferments can expand when needed;
- fermentation planning lives in a separate clearly labeled section;
- preset organization should not obstruct calculation.

Unit selection must be quick enough to be useful, especially on mobile.

## 17. Explicitly out of scope for V2

Do not add:

- backend services;
- user accounts;
- authentication;
- cross-device sync;
- cloud database;
- public recipe sharing;
- import/export;
- social features;
- remote ingredient databases;
- density-based volume conversions;
- automatic nutrition lookup;
- automatic ingredient pricing;
- biological fermentation prediction;
- automatic temperature/inoculation fermentation models.

Nutrition or cost features are excluded if they require external data. A future purely user-entered local cost model would require a separate design decision.

## 18. V2 completion criteria

V2 beta is implementation-complete when:

1. all V1 calculations remain valid;
2. users can enter absolute masses in g, kg, oz, and lb;
3. results can be displayed in a chosen mass unit;
4. pieces mode derives total dough from count × piece mass;
5. explicit scaling preserves fixed absolute ingredients;
6. preferments correctly contribute and deduct flour/water;
7. users can create a local backwards fermentation/preparation schedule;
8. presets support favorite, category, manual ordering, and name search;
9. valid V1 data can be migrated safely for production;
10. beta storage is isolated from V1 production storage;
11. V1 remains available at `/PanaCalc/`;
12. V2 beta is available at `/PanaCalc-V2/`;
13. both PWA scopes are isolated correctly;
14. lint, typecheck, tests, and production/preview builds are green;
15. V2 is not promoted to the V1 URL until explicit user acceptance.

## 19. Design principles

- grams remain the canonical calculation unit;
- unit conversion stays pure and isolated;
- formula and production remain separate concepts;
- planning does not pretend to predict fermentation biology;
- fixed grams stay fixed;
- V1 behavior remains backward-compatible;
- migration is additive and non-destructive;
- beta testing must not contaminate production state;
- no backend unless a future version explicitly changes that constraint;
- prefer focused domain modules over a single large state object.
