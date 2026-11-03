# Electron Configuration

Build orbital diagrams, discover periodic-table patterns, form common ions, and solve electron-configuration challenges for first-semester general chemistry.

## Features

- **Fill the Orbitals:** manual spin placement, Pauli feedback, undo, guided filling, and ground-state checks.
- **Patterns in the Table:** H–Kr, full and noble-gas notation, inner/outer shell counts, and Cr/Cu reference exceptions.
- **Make an Ion:** fifteen common ions, a fixed nucleus, neutral comparison, and 4s-before-3d removal.
- **Configuration Detective:** six repair, identify, isoelectronic, and classification challenges.
- English, French, Spanish, keyboard access, live screen summaries, projector colors, and portrait scrolling.

This is a symbolic occupancy model. It checks introductory configuration and Hund patterns, not complete atomic term states. See [model and sources](doc/model.md).

## Quick Start

Requires Node 26 or later.

```sh
npm ci
npm start
```

Use `?z=26` to start the neutral exploration at iron. Standard SceneryStack parameters include `?locale=fr`, `?colorProfile=projector` and `?screens=2`.

## Scripts

- `npm run check` — TypeScript checks.
- `npm run lint` / `npm run fix` — Biome checking and fixes.
- `npm test` — chemistry, model actions and disposal regressions.
- `npm run build` / `npm run build:single` — production PWA / single HTML build.
- `npm run test:fuzz:quick` — short browser fuzz test.
- `npm run icons` — generate icons from the source SVG.

## Tech Stack

TypeScript 7, SceneryStack 3, Vite 8, Vitest, Playwright, and Biome. Created from [SceneryStackTemplate](https://github.com/OpenLyceum/SceneryStackTemplate).

## License

AGPL-3.0-or-later. See the [OpenLyceum license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contribution guidance](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Preserve the model scope and extend independent chemistry fixtures when adding species.
