# Implementation notes

Four independently constructed screen models share the occupancy implementation. Reset affects only its screen. Models expose immutable diagram replacements so derived counts, notation, summaries and orbital labels update together.

Scenery/Sun controls provide keyboard activation. Orbital boxes are custom PDOM buttons that expose subshell, orbital index and occupation: Space/Enter cycles (empty → ↑ → ↑↓ → empty), U adds ↑, D adds ↓, Delete/Backspace removes; these keys are listed in the shared keyboard-help dialog. Pointer users click to cycle, drag ↑/↓ from the tray onto a box, drag an arrow to another box, or drag it off the diagram to remove it. `DragListener` ignores PDOM clicks, so keyboard activation uses a separate `click` listener. Reference pictures (the neutral-atom comparison on Make an Ion) are non-interactive and expose one summary paragraph instead of duplicate orbital buttons.

Rules, caveats and scope notes live in each screen's info dialog; the screen keeps a one-line status with an icon (✓ ! ★ i ?), configuration chips tinted by block, and per-subshell outlines after Check. Animations (Pauli shake, arrow pop-in, ion electrons flying to the surroundings) are view-only and stepped by `OrbitalBoardNode.step`; the board fixes its layout bounds so animations and drags never shift the surrounding layout.

Scenery PDOM caveat: an `accessibleParagraph` on a container that also holds a focusable child desynchronizes the PDOM tree when sibling content changes (assertion in `PDOMInstance.sortChildren`). Put paragraphs on leaf nodes (e.g. the progress stars), not on rows that contain buttons. Screen summaries describe current count, charge, notation and feedback; identification challenges mask nuclear identity. Portrait layout uses a scrollable column with focus reveal.

English, French and Spanish copy changes live through LocalizedStringProperty. ProfileColorProperty controls simulation chrome and standard projector colors. Standard SceneryStack preferences provide Visual and Localization controls.

No general many-electron numerical solver or arbitrary ion configuration engine is implied. See model.md for chemistry limitations.


## State changes

Every action replaces the orbital array. Undo stores earlier arrays without mutating them.
Changing the target element keeps manual work (and undo history) on Fill the Orbitals, so students can step Z up and add one electron; Patterns in the Table loads the reference. Edits that change nothing (Remove on an empty orbital, Clear on an empty diagram) do not add undo steps.
The table extent (a shared `EnumerationProperty<TableExtent>` from the preferences model) is passed to each screen's model. Models narrow Z and the ion index with `setValueAndRange`, and re-apply the extent after `reset()` because NumberProperty resets restore their initial ranges. Views rebuild the main diagram, the neutral comparison and the periodic table on extent changes, disposing the old ones; Detective keeps the krypton diagram because its challenges are all within H–Kr.
Ion targets have fixed endpoints; gain/loss buttons cannot move outside the selected neutral-to-ion interval.
Challenge changes restore the specified starting diagram and clear prior feedback and undo history.
The chemistry model is independent of Scenery nodes so reference fixtures run without a rendering engine.
Disposal tests keep source properties alive while checking that linked boards, chips, shell view, charge tallies and summaries are collected. The board owns (and disposes) the tray and inset nodes passed to it.
