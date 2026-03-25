# Natoli Truth Screening Engine

Binary screening of companies using Natoli's compaction process truths.

## Philosophy

**Natoli sells to process reality, not industry labels.**

A company qualifies only if it satisfies the truths that define real powder compaction operations.

## Truth System

Every company is evaluated against 8 non-negotiable truths:

1. **uses_powder_compaction** - Company compacts powders using mechanical force
2. **produces_pressed_solid** - Primary product is a tablet, pellet, or pressed solid
3. **tooling_impacts_outcome** - Tooling affects quality, yield, or consistency
4. **formulation_impacts_compaction** - Formulation affects compaction behavior
5. **scale_up_matters** - Scale-up affects compaction or tooling behavior
6. **process_is_press_based** - Process is press-based, not molded or liquid
7. **manufacturing_or_rnd_internal** - Manufacturing or R&D is performed internally
8. **performance_specs_exist** - Performance or regulatory specifications matter

## Tier Classification

| Tier | Truths Passed | Description |
|------|---------------|-------------|
| Tier 1 | 8/8 (100%) | Immediate Natoli Priority |
| Tier 2 | 6-7/8 (75%+) | High Potential / Emerging |
| Tier 3 | 4-5/8 (50%+) | Monitor |
| Tier 4 | <4/8 | Not a Fit |

## Available Engines

### 1. Truth Engine (`truth_engine.js`)
Binary truth screening for any company list.
```bash
node truth_engine.js input_companies.json
```

### 2. Rank Engine (`rank_engine.js`)
Rank and tier companies by truth score.
```bash
node rank_engine.js input_companies.json
```

### 3. Global Discovery (`global_discovery.js`)
Web search for emerging companies with compaction signals.
```bash
node global_discovery.js
```

### 4. Site Ingestion (`site_ingestion.js`)
Full discovery → evaluation → explanation → site-ready JSON output.
```bash
node site_ingestion.js
```
**Output:** `natoli_site_companies.json` - Ready for website rendering with "Why Natoli Fits" explanations.

### 5. Future Demand Scan (`deep_future_scan.js`)
Identify companies with leading indicators of future Natoli need.
```bash
node deep_future_scan.js
```

### 6. Apply to Territory (`apply_to_territory.js`)
Evaluate existing territory data against truths.
```bash
node apply_to_territory.js
```

### 7. Rank Territory (`rank_territory.js`)
Rank all territory companies by truth score.
```bash
node rank_territory.js
```

## Division Routing

Companies are automatically routed based on detected signals:

**Natoli Engineering:**
- tooling, tablet press, punch, die, compression force, tool wear

**Natoli Scientific:**
- formulation, characterization, analytical, usp, dissolution, r&d

## Global Exclusions

These industries are structurally incompatible with Natoli:
- Powder metallurgy
- Metal injection molding
- Structural ceramics
- Job shop / CNC machining
- Automotive/aerospace structural

## Why This Matters

When Dale asks:
> "Why are we calling this company?"

The answer is always:
> "Because they satisfy the compaction truths that predict real tooling and formulation needs."

That's unarguable. That's signal over noise.
