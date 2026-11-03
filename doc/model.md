# Electron configuration model

This simulation supports first-semester general chemistry. It complements QuantumAtom3D's hydrogenic wavefunctions with a symbolic many-electron occupancy model.

## Representation

Each orbital holds two spin-projection bits. The view permits a maximum of one electron of each spin per orbital. Empty, singly occupied and paired orbitals are explicit. Orbitals within a subshell have no preferred spatial orientation. Their displayed m labels are one conventional basis.

Subshells are drawn as a schematic energy staircase: heights increase in the introductory filling order (1s at the bottom, 4s just below 3d, 6s below 4f below 5d) up to the last subshell the table extent needs (4p, 5p or 6p), plus the next s subshell (5s, 6s or 7s) for an allowed promoted arrangement, in columns by l (s, p, d, f). Larger extents scale the diagram down to fit. The axis is labelled "Energy (schematic)": heights encode order only, not measured energies or spacings, and the 4s/3d order shown is the filling guide, not the ordering in the resulting atom or ion. The model computes no energies, shapes, trajectories, spectra, or electron correlations.

## Neutral atoms

The supported range is H–Rn (Z = 1–86) by default. As in PeriodicTrends, Preferences → Simulation (or `?maxZ=36` / `?maxZ=54` / `?maxZ=86`) limits the sim to H–Kr, H–Xe or H–Rn; narrowing it clamps Z and the ion choice, and clears Fill the Orbitals work that uses subshells the smaller diagram no longer draws. The periodic table shows La–Lu in a detached f row with a 57–71 placeholder in group 3 of period 6.

A capacity-filling prediction is displayed separately from reference configurations. Thirteen neutral ground states through Rn differ from it (NIST Atomic Spectra Database): Cr [Ar] 3d⁵ 4s¹, Cu [Ar] 3d¹⁰ 4s¹, Nb [Kr] 4d⁴ 5s¹, Mo [Kr] 4d⁵ 5s¹, Ru [Kr] 4d⁷ 5s¹, Rh [Kr] 4d⁸ 5s¹, Pd [Kr] 4d¹⁰, Ag [Kr] 4d¹⁰ 5s¹, La [Xe] 5d¹ 6s², Ce [Xe] 4f¹ 5d¹ 6s², Gd [Xe] 4f⁷ 5d¹ 6s², Pt [Xe] 4f¹⁴ 5d⁹ 6s¹ and Au [Xe] 4f¹⁴ 5d¹⁰ 6s¹. These are reference overrides, not deductions from a universal half-filled/full-filled stability rule (Nb, Ru, Rh, Pd and Pt do not fit that slogan). Patterns outlines exactly the subshells each exception changes. Configuration notation uses increasing n and l; the diagram follows the filling guide.

The guided Next electron button rebuilds the diagram with one more electron than it currently holds. Intermediate counts follow the simple filling rule (so building Cr passes through the Ca-like 4s² arrangement); the final step shows the observed reference, so the Cr and Cu 4s/3d rearrangement appears on the last press with an explanatory message. It can replace a manual arrangement. It does not simulate a physical addition process or charge-dependent atomic relaxation.

## Checking

Wrong electron count, nonreference subshell occupation, and a mismatch with the introductory Hund pattern receive separate feedback. A same-spin duplicate in one orbital is blocked by Pauli. Nonreference configurations can still satisfy Pauli; they are not called impossible. Correct reference occupation and maximum parallel unpaired spins pass regardless of degenerate orbital permutation or spin reversal. This is a configuration/Hund exercise, not a complete multiplet or atomic term classification. After Check, each subshell is outlined: green when its count and Hund pattern match the reference, red when its count differs or it breaks the Hund pattern.

## Ions

Only the listed common ions and steps between their neutral and target charge are exposed. Electrons are removed by descending n, then l; for the selected transition-metal cations, 4s is removed before 3d. Anions fill available orbitals. Nuclear charge stays fixed. The proton and electron tallies show one square per particle; electrons that leave are animated to the surroundings from the orbital the removal rule empties. This algorithm must not be generalized to arbitrary ions: ion configurations can require separate experimental references. Chemical ions such as oxide do not imply a stable isolated gas-phase atom with that charge.

Beyond krypton the curated list adds Rb⁺, Sr²⁺, Ag⁺ and Cd²⁺ (filled 4d¹⁰), Sn²⁺ and Sn⁴⁺ (5p, then 5s removed), I⁻, Cs⁺, Ba²⁺ and Pb²⁺ (which keeps 6s²). The list is ordered so each table extent offers a prefix of it.

## Sources

- [OpenStax Chemistry 2e, 6.4](https://openstax.org/books/chemistry-2e/pages/6-4-electronic-structure-of-atoms-electron-configurations): Aufbau, Pauli, Hund, periodic patterns, ions, and exceptions.
- [NIST chromium](https://physics.nist.gov/PhysRefData/Handbook/Tables/chromiumtable1.htm): neutral chromium reference.
- [NIST copper](https://physics.nist.gov/PhysRefData/Handbook/Tables/coppertable1.htm): neutral copper and Cu+ reference.
- [NIST Atomic Spectra Database, ground levels](https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html): neutral ground configurations Rb–Rn, including the 4d/5d/4f exceptions listed above (the same list PeriodicTrends uses).

Tests contain independent expected notation fixtures for C, N, O, Cr, Cu, Kr, every exception above with regular neighbours (Tc, Pr, Tb, Lu, Hg, Pb, Rn), and representative main-group, transition-metal and post-transition ions (Ag⁺, Cd²⁺, Sn²⁺, Sn⁴⁺, I⁻, Ba²⁺, Pb²⁺), plus conservation for all 86 neutral atoms and interaction regressions.

Noble-gas shorthand always uses a core strictly smaller than the species, so noble gases are not written circularly: Ne is [He] 2s² 2p⁶ and Kr is [Ar] 3d¹⁰ 4s² 4p⁶; the isoelectronic ions O²⁻ and Al³⁺ likewise read [He] 2s² 2p⁶.

## Optional shell view

"Show electrons by shell" draws a nucleus labelled +Z with electrons grouped on evenly spaced rings by principal quantum number n. It is a counting aid for valence (outermost-shell) electrons and is captioned as "a counting view, not orbits": ring radii, spacing, and electron positions carry no physical meaning, and the view is off by default.
