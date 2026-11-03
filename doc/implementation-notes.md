# Implementation notes

Four independently constructed screen models share the occupancy implementation. Reset affects only its screen. Models expose immutable diagram replacements so derived counts, notation, summaries and orbital labels update together.

Scenery/Sun controls provide keyboard activation. Orbital buttons expose subshell, orbital index and occupation. Screen summaries describe current count, charge, notation and feedback; identification challenges mask nuclear identity. Portrait layout uses a scrollable column with focus reveal.

English, French and Spanish copy changes live through LocalizedStringProperty. ProfileColorProperty controls simulation chrome and standard projector colors. Standard SceneryStack preferences provide Visual and Localization controls.

No general many-electron numerical solver or arbitrary ion configuration engine is implied. See model.md for chemistry limitations.


## State changes

Every action replaces the orbital array. Undo stores earlier arrays without mutating them.
Changing the target element keeps manual work (and undo history) on Fill the Orbitals, so students can step Z up and add one electron; Patterns in the Table loads the reference. Edits that change nothing (Remove on an empty orbital, Clear on an empty diagram) do not add undo steps.
Ion targets have fixed endpoints; gain/loss buttons cannot move outside the selected neutral-to-ion interval.
Challenge changes restore the specified starting diagram and clear prior feedback and undo history.
The chemistry model is independent of Scenery nodes so reference fixtures run without a rendering engine.
Disposal tests keep source properties alive while checking that linked boards and summaries are collected.
