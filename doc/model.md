# Electron configuration model

This simulation supports first-semester general chemistry. It complements QuantumAtom3D's hydrogenic wavefunctions with a symbolic many-electron occupancy model.

## Representation

Each orbital holds two spin-projection bits. The view permits a maximum of one electron of each spin per orbital. Empty, singly occupied and paired orbitals are explicit. Orbitals within a subshell have no preferred spatial orientation. Their displayed m labels are one conventional basis.

Rows follow the introductory filling order through 4p, plus 5s for an allowed promoted arrangement. Their vertical positions are not energy measurements. The model computes no energies, shapes, trajectories, spectra, or electron correlations.

## Neutral atoms

The supported range is H–Kr. A capacity-filling prediction is displayed separately from reference configurations. Cr is [Ar] 3d5 4s1 and Cu is [Ar] 3d10 4s1. These are reference overrides, not deductions from a universal half-filled/full-filled stability rule. Configuration notation uses increasing n and l; the diagram follows the filling guide.

The guided Next electron button rebuilds the diagram with one more electron than it currently holds. Intermediate counts follow the simple filling rule (so building Cr passes through the Ca-like 4s² arrangement); the final step shows the observed reference, so the Cr and Cu 4s/3d rearrangement appears on the last press with an explanatory message. It can replace a manual arrangement. It does not simulate a physical addition process or charge-dependent atomic relaxation.

## Checking

Wrong electron count, nonreference subshell occupation, and a mismatch with the introductory Hund pattern receive separate feedback. A same-spin duplicate in one orbital is blocked by Pauli. Nonreference configurations can still satisfy Pauli; they are not called impossible. Correct reference occupation and maximum parallel unpaired spins pass regardless of degenerate orbital permutation or spin reversal. This is a configuration/Hund exercise, not a complete multiplet or atomic term classification.

## Ions

Only the listed common ions and steps between their neutral and target charge are exposed. Electrons are removed by descending n, then l; for the selected transition-metal cations, 4s is removed before 3d. Anions fill available orbitals. Nuclear charge stays fixed. This algorithm must not be generalized to arbitrary ions: ion configurations can require separate experimental references. Chemical ions such as oxide do not imply a stable isolated gas-phase atom with that charge.

## Sources

- [OpenStax Chemistry 2e, 6.4](https://openstax.org/books/chemistry-2e/pages/6-4-electronic-structure-of-atoms-electron-configurations): Aufbau, Pauli, Hund, periodic patterns, ions, and exceptions.
- [NIST chromium](https://physics.nist.gov/PhysRefData/Handbook/Tables/chromiumtable1.htm): neutral chromium reference.
- [NIST copper](https://physics.nist.gov/PhysRefData/Handbook/Tables/coppertable1.htm): neutral copper and Cu+ reference.

Tests contain independent expected notation fixtures for C, N, O, Cr, Cu, Kr and representative main-group and transition-metal ions, plus conservation and interaction regressions.

Noble-gas shorthand always uses a core strictly smaller than the species, so noble gases are not written circularly: Ne is [He] 2s² 2p⁶ and Kr is [Ar] 3d¹⁰ 4s² 4p⁶; the isoelectronic ions O²⁻ and Al³⁺ likewise read [He] 2s² 2p⁶.
