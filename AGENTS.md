# AGENTS.md — Electron Configuration

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Four-screen first-semester general chemistry simulation: **Fill the Orbitals**, **Patterns in the Table**, **Make an Ion**, and **Configuration Detective**. Symbolic orbital occupancy (not a full atomic-term solver). Created from SceneryStackTemplate.

Chemistry scope and sources: `doc/model.md`.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/Configurations.ts` | Pure orbital occupancy, neutral references, notation, curated ions and challenges |
| `src/common/model/ConfigurationModel.ts` | Independent mutable state per screen; history, checking, ion steps, challenges |
| `src/common/model/TableExtent.ts` | Through Kr / Xe / Rn (as in PeriodicTrends); bounds Z, ions and diagram subshells |
| `src/common/view/ConfigurationScreenView.ts` | Shared screen composition; screen-specific wrappers live in each screen folder |
| `src/common/view/OrbitalBoardNode.ts` | Localized orbital buttons and reference diagrams; rebuilt/scaled when extent changes |
| `src/common/view/ConfigurationSummary.ts` | Live accessible description, masking identity challenges |
| `src/common/view/ResponsiveScreenView.ts` | Portrait scrolling (adapted from QuantumAtom3D) |
| `src/fill-orbitals/FillTheOrbitalsScreen.ts` | Fill the Orbitals screen |
| `src/periodic-patterns/PatternsInTheTableScreen.ts` | Patterns in the Table screen |
| `src/ions/MakeAnIonScreen.ts` | Make an Ion screen |
| `src/configuration-detective/ConfigurationDetectiveScreen.ts` | Configuration Detective screen |
| `src/i18n/StringManager.ts` | English, French, Spanish strings |

## Chemistry scope

H–Rn neutral atoms by default (Preferences → Simulation or `?maxZ=36|54|86` narrows to Kr or Xe), with the thirteen NIST ground-configuration exceptions listed in `FILLING_EXCEPTIONS`. Ion formation is limited to the curated common ions; the ns-first rule is not a general atomic-ion solver. See `doc/model.md` for assumptions and sources.
Arrows are spin projections; box rows are a filling guide without measured energy spacing. Assessment compares configurations and introductory Hund patterns, not complete atomic term eigenstates. Accept permutations and whole-subshell spin reversal.

## Testing

Run `npm run lint && npm run check && npm run build && npm test`, then `npm run test:fuzz:quick`. Add meaningful chemistry fixtures and model actions to `tests/Configurations.test.ts`; list linked disposable models/views in `tests/memory-leak.test.ts`.

## Compliance carve-outs

- **No TimeModel:** static occupancy simulation; no play/pause clock.
- **Rename/scaffold scripts removed:** one-shot template generator scripts and their generator tests are gone after bootstrap.
- **Preferences:** custom preferences model holds only the table extent; standard Visual and Localization preferences provide projector mode and language.
- **Screen summaries:** shared `ConfigurationSummary` (extends `ScreenSummaryContent`) constructed in `ConfigurationScreenView`, not per-screen `*ScreenSummaryContent.ts` stubs.
