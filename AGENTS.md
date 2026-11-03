# Electron Configuration

General conventions: [OpenLyceum/.github](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

This is a four-screen first-semester general chemistry simulation, created from SceneryStackTemplate.
Screens are Fill the Orbitals, Patterns in the Table, Make an Ion, and Configuration Detective.

## Architecture

- `src/common/model/Configurations.ts`: pure orbital occupancy, neutral references, notation, curated ions and challenges.
- `src/common/model/ConfigurationModel.ts`: independent mutable state per screen; history, checking, ion steps, challenges.
- `src/common/view/ConfigurationScreenView.ts`: shared screen composition; screen-specific wrappers live in each screen folder.
- `src/common/model/TableExtent.ts`: through Kr / Xe / Rn (as in PeriodicTrends); bounds Z, ions and diagram subshells.
- `OrbitalBoardNode.ts`: localized orbital buttons and reference diagrams; rebuilt and scaled to fit when the extent changes.
- `ConfigurationSummary.ts`: live accessible description, masking identity challenges.
- `ResponsiveScreenView.ts`: portrait scrolling, adapted from QuantumAtom3D.
- `src/i18n/strings_*.json`: English, French, Spanish. All new UI copy belongs in all three locales.

## Chemistry scope

H–Rn neutral atoms by default (Preferences → Simulation or `?maxZ=36|54|86` narrows to Kr or Xe), with the thirteen NIST ground-configuration exceptions listed in `FILLING_EXCEPTIONS`. Ion formation is limited to the curated common ions; the ns-first rule is not a general atomic-ion solver. See `doc/model.md` for assumptions and sources.
Arrows are spin projections; box rows are a filling guide without measured energy spacing. Assessment compares configurations and introductory Hund patterns, not complete atomic term eigenstates. Accept permutations and whole-subshell spin reversal.

## Validation

Run `npm run lint`, `npm run check`, `npm test`, `npm run build`, and `npm run test:fuzz:quick`. Add meaningful chemistry fixtures and model actions to `tests/Configurations.test.ts`; list linked disposable models/views in `tests/memory-leak.test.ts`.

## Compliance carve-outs

No template infrastructure overrides. One-shot rename/scaffold scripts and their template-only generator tests are removed after creation. This static occupancy simulation has no TimeModel. The custom preferences model holds only the table extent; standard Visual and Localization preferences provide projector mode and language.
