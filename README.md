# Electron Configuration

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Build orbital diagrams, discover periodic-table patterns, form common ions, and
solve electron-configuration challenges for first-semester general chemistry.
Built with [SceneryStack](https://scenerystack.org/), Vite 8, TypeScript 7, and Biome 2.

## Features

- **Fill the Orbitals:** an energy-staircase orbital diagram you edit directly (click to cycle, drag electrons from a tray or between orbitals, U/D/Delete on the keyboard), Pauli shake, per-subshell feedback after Check, undo, and guided filling.
- **Patterns in the Table:** a block-coloured table (H–Rn, with the lanthanide row) with hover preview, "Step through the table" autoplay that pauses on the ground-state exceptions (Cr, Cu, Nb–Ag, La, Ce, Gd, Pt, Au), observed vs. filling-rule notation, and inner/outer shell counts.
- **Make an Ion:** twenty-five common ions (from Na⁺ to Pb²⁺), proton/electron tallies, electrons animated to and from the surroundings (4s empties before 3d), and a neutral comparison.
- **Configuration Detective:** eight repair, move-the-misplaced-electron, identify, isoelectronic, and classification challenges, with large answer tiles and a star per solved challenge.
- Block-tinted configuration chips, an optional count-by-shell view, rules in per-screen info dialogs, English/French/Spanish, keyboard access, live screen summaries, projector colors, and portrait scrolling.

This is a symbolic occupancy model. It checks introductory configuration and Hund patterns, not complete atomic term states. See [model and sources](doc/model.md).

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

Elements run H–Rn by default. Use Preferences → Simulation or `?maxZ=36` (through Kr) / `?maxZ=54` (through Xe) to limit the table, as in PeriodicTrends. Use `?z=26` to start the neutral exploration at iron. Standard SceneryStack parameters include `?locale=fr`, `?colorProfile=projector` and `?screens=2`.

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run build:single` | Build a self-contained HTML file |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run check:unused` / `npm run knip` | Report unused files, exports, and dependencies (manual check) |
| `npm run check:architecture` | dependency-cruiser layer and cycle rules on `src/` (manual check) |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

New sims start at `version: "0.0.0"` in `package.json`. Bump only when cutting a release (for example `npm version patch` and a matching git tag). Keep `name` in kebab-case; it is separate from the SceneryStack sim identifier in `src/init.ts`, which reads its `version` from `package.json`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates. Preserve the model scope and extend independent chemistry fixtures when adding species.
