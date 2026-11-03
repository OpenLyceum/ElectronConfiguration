/**
 * Occupancy model for H–Rn (Z = 1–86). Orbital arrows label spin projections, not moving electrons.
 * How much of the table a session shows (through Kr, Xe or Rn) is chosen by TableExtent.
 */
export const SYMBOLS = (
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr " +
  "Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe " +
  "Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn"
).split(" ");
export const MIN_Z = 1;
/** Last element with reference data. */
export const MAX_Z = 86;
/**
 * Subshells in the introductory (aufbau) filling order, as far as radon needs, plus 7s so a promoted
 * electron has somewhere to go. Appending keeps earlier orbital indices stable.
 */
export const SUBSHELLS = [
  { name: "1s", n: 1, l: 0 },
  { name: "2s", n: 2, l: 0 },
  { name: "2p", n: 2, l: 1 },
  { name: "3s", n: 3, l: 0 },
  { name: "3p", n: 3, l: 1 },
  { name: "4s", n: 4, l: 0 },
  { name: "3d", n: 3, l: 2 },
  { name: "4p", n: 4, l: 1 },
  { name: "5s", n: 5, l: 0 },
  { name: "4d", n: 4, l: 2 },
  { name: "5p", n: 5, l: 1 },
  { name: "6s", n: 6, l: 0 },
  { name: "4f", n: 4, l: 3 },
  { name: "5d", n: 5, l: 2 },
  { name: "6p", n: 6, l: 1 },
  { name: "7s", n: 7, l: 0 },
] as const;
export const ORBITALS = SUBSHELLS.flatMap((s, subshell) =>
  Array.from({ length: 2 * s.l + 1 }, (_, i) => ({ subshell, n: s.n, l: s.l, m: i - s.l, index: i })),
);
/** Bit 0: up projection; bit 1: down projection. 3 denotes a paired orbital. */
export type Diagram = readonly number[];
export const emptyDiagram = (): number[] => ORBITALS.map(() => 0);
export const electronCount = (diagram: Diagram): number =>
  diagram.reduce((sum, bits) => sum + (bits & 1) + ((bits >> 1) & 1), 0);
export const subshellCounts = (diagram: Diagram): number[] =>
  SUBSHELLS.map((_subshell, s) => electronCount(diagram.filter((_, i) => ORBITALS[i]?.subshell === s)));
const subshellIndex = (name: string): number => SUBSHELLS.findIndex((s) => s.name === name);
/** Electrons the diagram can hold in total. */
export const CAPACITY = SUBSHELLS.reduce((sum, s) => sum + 2 * (2 * s.l + 1), 0);
export function fillingPrediction(electrons: number): number[] {
  const result: number[] = [];
  let remaining = electrons;
  for (const s of SUBSHELLS) {
    const count = Math.max(0, Math.min(remaining, 2 * (2 * s.l + 1)));
    result.push(count);
    remaining -= count;
  }
  return result;
}
/**
 * Neutral ground-state configurations that differ from the simple filling rule (NIST Atomic Spectra
 * Database), as the subshell counts that change. Cr, Cu, Mo, Ag and Au move an s electron into d; Nb, Ru
 * and Rh also end with 5s¹; Pd has no 5s electron; Pt is 5d⁹ 6s¹; La, Ce and Gd put an electron in 5d
 * instead of 4f. These are reference data, not deductions from a half-filled/filled stability rule.
 */
export const FILLING_EXCEPTIONS: Readonly<Record<number, Readonly<Record<string, number>>>> = {
  24: { "4s": 1, "3d": 5 },
  29: { "4s": 1, "3d": 10 },
  41: { "5s": 1, "4d": 4 },
  42: { "5s": 1, "4d": 5 },
  44: { "5s": 1, "4d": 7 },
  45: { "5s": 1, "4d": 8 },
  46: { "5s": 0, "4d": 10 },
  47: { "5s": 1, "4d": 10 },
  57: { "4f": 0, "5d": 1 },
  58: { "4f": 1, "5d": 1 },
  64: { "4f": 7, "5d": 1 },
  78: { "6s": 1, "5d": 9 },
  79: { "6s": 1, "5d": 10 },
};
/** Neutral atoms whose observed ground state differs from the simple filling rule. */
export const isFillingException = (z: number): boolean => FILLING_EXCEPTIONS[z] !== undefined;
export function referenceCounts(z: number, charge = 0): number[] {
  if (
    !Number.isInteger(z) ||
    z < MIN_Z ||
    z > MAX_Z ||
    !Number.isInteger(charge) ||
    z - charge < 0 ||
    z - charge > CAPACITY
  ) {
    throw new Error("Unsupported atomic number or electron count");
  }
  const result = fillingPrediction(z);
  for (const [name, count] of Object.entries(FILLING_EXCEPTIONS[z] ?? {})) {
    result[subshellIndex(name)] = count;
  }
  if (charge > 0) {
    // Cations: remove from the highest n first, then the highest l (so ns before (n−1)d).
    const removal = SUBSHELLS.map((_, i) => i).sort(
      (a, b) => (SUBSHELLS[b]?.n ?? 0) - (SUBSHELLS[a]?.n ?? 0) || (SUBSHELLS[b]?.l ?? 0) - (SUBSHELLS[a]?.l ?? 0),
    );
    let remaining = charge;
    for (const i of removal) {
      const count = Math.min(remaining, result[i] ?? 0);
      result[i] = (result[i] ?? 0) - count;
      remaining -= count;
    }
  } else if (charge < 0) {
    let remaining = -charge;
    SUBSHELLS.forEach((s, i) => {
      const count = Math.min(remaining, 2 * (2 * s.l + 1) - (result[i] ?? 0));
      result[i] = (result[i] ?? 0) + count;
      remaining -= count;
    });
  }
  return result;
}

// ── Periodic-table layout (as in PeriodicTrends) ─────────────────────────────
/** Last Z of each period. */
export const PERIOD_ENDS = [2, 10, 18, 36, 54, 86] as const;
/** La–Lu are drawn in a detached row under period 6, starting under group 3. */
export const FIRST_LANTHANIDE = 57;
export const LAST_LANTHANIDE = 71;
export const isLanthanide = (z: number): boolean => z >= FIRST_LANTHANIDE && z <= LAST_LANTHANIDE;
export const periodOf = (z: number): number => PERIOD_ENDS.findIndex((end) => z <= end) + 1;
/** IUPAC group of element z, or null for a lanthanide. */
export function groupOf(z: number): number | null {
  if (z === 1) {
    return 1;
  }
  if (z === 2) {
    return 18;
  }
  if (isLanthanide(z)) {
    return null;
  }
  const period = periodOf(z);
  const column = z - (PERIOD_ENDS[period - 2] ?? 0);
  if (period <= 3) {
    return column <= 2 ? column : column + 10;
  }
  return period === 6 && z > LAST_LANTHANIDE ? column - 14 : column;
}
export type Block = "s" | "p" | "d" | "f";
/** Periodic-table block; He sits in the s block, and the whole lanthanide row (La–Lu) is drawn as f. */
export function block(z: number): Block {
  const group = groupOf(z);
  if (group === null) {
    return "f";
  }
  if (z === 2 || group <= 2) {
    return "s";
  }
  return group <= 12 ? "d" : "p";
}
/** Grid slot (0-based column 0–17, row 0–5 for periods, 6 for the lanthanide row). */
export function tablePosition(z: number): { column: number; row: number } {
  const group = groupOf(z);
  return group === null ? { column: 2 + z - FIRST_LANTHANIDE, row: 6 } : { column: group - 1, row: periodOf(z) - 1 };
}
/** Noble gases used as shorthand cores. */
export const NOBLE_GASES = [2, 10, 18, 36, 54, 86] as const;
export function diagramForCounts(counts: readonly number[], limit = Infinity): number[] {
  const result = emptyDiagram();
  let remaining = limit;
  SUBSHELLS.forEach((s, subshell) => {
    const indices = ORBITALS.map((o, i) => (o.subshell === subshell ? i : -1)).filter((i) => i >= 0);
    const count = counts[subshell] ?? 0,
      g = 2 * s.l + 1;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < g; j++) {
        if (pass * g + j < count && remaining > 0) {
          const index = indices[j];
          if (index !== undefined) {
            result[index] = (result[index] ?? 0) | (pass === 0 ? 1 : 2);
            remaining--;
          }
        }
      }
    }
  });
  return result;
}
export const referenceDiagram = (z: number, charge = 0): number[] => diagramForCounts(referenceCounts(z, charge));
/**
 * One step of guided (aufbau) construction toward neutral element z: intermediate electron counts follow
 * the simple filling rule, and the final step shows the observed reference (so Cr and Cu rearrange last).
 */
export function guidedDiagram(z: number, electrons: number): number[] {
  const count = Math.max(0, Math.min(electrons, z));
  return count >= z ? referenceDiagram(z) : diagramForCounts(fillingPrediction(count));
}
/** Orbital indices (into ORBITALS / a Diagram) belonging to each subshell. */
export const SUBSHELL_ORBITALS: readonly (readonly number[])[] = SUBSHELLS.map((_, subshell) =>
  ORBITALS.flatMap((o, i) => (o.subshell === subshell ? [i] : [])),
);
/** Hund's rule within one subshell: maximum unpaired electrons, all with parallel spin projections. */
export function subshellFollowsHund(diagram: Diagram, subshell: number): boolean {
  const bits = (SUBSHELL_ORBITALS[subshell] ?? []).map((i) => diagram[i] ?? 0);
  const count = electronCount(bits),
    g = bits.length;
  const singles = bits.filter((b) => b === 1 || b === 2);
  return (
    singles.length === Math.min(count, 2 * g - count) &&
    (singles.every((b) => b === 1) || singles.every((b) => b === 2))
  );
}
export const followsHund = (diagram: Diagram): boolean =>
  SUBSHELLS.every((_, subshell) => subshellFollowsHund(diagram, subshell));
/** Per-subshell feedback drawn on the diagram: "fault" (wrong count or Hund), "ok", or a neutral "note". */
export type SubshellMark = "ok" | "fault" | "note" | null;
export function subshellMarks(diagram: Diagram, z: number, charge = 0): SubshellMark[] {
  const actual = subshellCounts(diagram),
    expected = referenceCounts(z, charge);
  return SUBSHELLS.map((_, i) => {
    if (actual[i] !== expected[i] || !subshellFollowsHund(diagram, i)) {
      return "fault";
    }
    return (actual[i] ?? 0) > 0 ? "ok" : null;
  });
}
export const noMarks = (): SubshellMark[] => SUBSHELLS.map(() => null);
/** Marks the subshells where an exception (Cr, Cu, Pd, Gd, …) departs from the simple filling rule. */
export function exceptionMarks(z: number): SubshellMark[] {
  const predicted = fillingPrediction(z),
    observed = referenceCounts(z);
  return SUBSHELLS.map((_, i) => (predicted[i] !== observed[i] ? "note" : null));
}
export type Assessment = "count" | "higher" | "hund" | "ground";
export function assess(diagram: Diagram, z: number, charge = 0): Assessment {
  if (electronCount(diagram) !== z - charge) {
    return "count";
  }
  const actual = subshellCounts(diagram),
    expected = referenceCounts(z, charge);
  if (!actual.every((c, i) => c === expected[i])) {
    return "higher";
  }
  return followsHund(diagram) ? "ground" : "hund";
}
const SUPER = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const toSuperscript = (digits: string): string =>
  digits
    .split("")
    .map((d) => SUPER[Number(d)])
    .join("");
/** One term of a configuration: a noble-gas core like [Ar], or a subshell term like 3d⁶. */
export type ConfigurationPart =
  | { kind: "core"; text: string }
  | { kind: "term"; text: string; subshell: number; l: number; count: number };
export function configurationParts(counts: readonly number[], abbreviated = false): ConfigurationPart[] {
  let core = 0;
  if (abbreviated) {
    const total = counts.reduce((sum, n) => sum + n, 0);
    // The core must be strictly smaller than the species, so Ne reads [He] 2s² 2p⁶ rather than a circular [Ne].
    for (const candidate of NOBLE_GASES) {
      const c = referenceCounts(candidate);
      if (candidate < total && c.every((n, i) => n <= (counts[i] ?? 0))) {
        core = candidate;
      }
    }
  }
  const baseline = core > 0 ? referenceCounts(core) : SUBSHELLS.map(() => 0);
  const indices = SUBSHELLS.map((_, i) => i).sort(
    (a, b) => (SUBSHELLS[a]?.n ?? 0) - (SUBSHELLS[b]?.n ?? 0) || (SUBSHELLS[a]?.l ?? 0) - (SUBSHELLS[b]?.l ?? 0),
  );
  const terms = indices.flatMap((i): ConfigurationPart[] => {
    const count = (counts[i] ?? 0) - (baseline[i] ?? 0);
    const s = SUBSHELLS[i];
    return count > 0 && s
      ? [{ kind: "term", text: `${s.name}${toSuperscript(String(count))}`, subshell: i, l: s.l, count }]
      : [];
  });
  return core > 0 ? [{ kind: "core", text: `[${SYMBOLS[core - 1]}]` }, ...terms] : terms;
}
export function configuration(counts: readonly number[], abbreviated = false): string {
  return (
    configurationParts(counts, abbreviated)
      .map((p) => p.text)
      .join(" ") || "—"
  );
}
export const IONS = [
  { z: 11, q: 1 },
  { z: 12, q: 2 },
  { z: 13, q: 3 },
  { z: 8, q: -2 },
  { z: 9, q: -1 },
  { z: 16, q: -2 },
  { z: 17, q: -1 },
  { z: 19, q: 1 },
  { z: 20, q: 2 },
  { z: 24, q: 3 },
  { z: 26, q: 2 },
  { z: 26, q: 3 },
  { z: 29, q: 1 },
  { z: 29, q: 2 },
  { z: 30, q: 2 },
  // Through Xe: s-block cations, Ag⁺/Cd²⁺ (filled 4d), tin's two common ions (5p then 5s removed), iodide.
  { z: 37, q: 1 },
  { z: 38, q: 2 },
  { z: 47, q: 1 },
  { z: 48, q: 2 },
  { z: 50, q: 2 },
  { z: 50, q: 4 },
  { z: 53, q: -1 },
  // Through Rn: Cs⁺, Ba²⁺, and Pb²⁺, which keeps its 6s² pair.
  { z: 55, q: 1 },
  { z: 56, q: 2 },
  { z: 82, q: 2 },
] as const;
/** The curated ions available when the table runs through `maxZ`: always a prefix of IONS. */
export const ionsThrough = (maxZ: number) => IONS.filter((ion) => ion.z <= maxZ);
/** Chemical notation with a superscript charge, e.g. Na⁺, Fe³⁺, O²⁻. */
export function species(z: number, q = 0): string {
  const magnitude = Math.abs(q) === 1 ? "" : toSuperscript(String(Math.abs(q)));
  return `${SYMBOLS[z - 1] ?? "?"}${q === 0 ? "" : `${magnitude}${q > 0 ? "⁺" : "⁻"}`}`;
}
/** Signed charge with a true minus sign: 0, +2, −1. */
export const formatCharge = (q: number): string => (q > 0 ? `+${q}` : q < 0 ? `−${-q}` : "0");
/**
 * A Configuration Detective task. Repair/move/classify challenges start from the reference diagram with
 * `edits` applied ([orbital index, occupancy bits]); `fillingRule` starts from the simple filling-rule
 * prediction instead (Cu). Orbital indices: 0 1s · 1 2s · 2–4 2p · 5 3s · 6–8 3p · 9 4s · 10–14 3d.
 */
export type Challenge = {
  kind: "repair" | "move" | "identify" | "isoelectronic" | "classify";
  z: number;
  q: number;
  edits?: readonly (readonly [number, number])[];
  fillingRule?: boolean;
  options?: readonly number[];
};
export const CHALLENGES: readonly Challenge[] = [
  // C: two 2p electrons paired instead of spread out (Hund).
  {
    kind: "repair",
    z: 6,
    q: 0,
    edits: [
      [2, 3],
      [3, 0],
    ],
  },
  // N: one 2p arrow reversed (Hund, parallel spins).
  { kind: "repair", z: 7, q: 0, edits: [[3, 2]] },
  // O: a 2p electron promoted to 3s — allowed but excited.
  {
    kind: "classify",
    z: 8,
    q: 0,
    edits: [
      [2, 1],
      [5, 1],
    ],
  },
  // Na: the valence electron placed in 3p instead of 3s.
  {
    kind: "move",
    z: 11,
    q: 0,
    edits: [
      [5, 0],
      [6, 1],
    ],
  },
  { kind: "identify", z: 12, q: 0, options: [10, 12, 13] },
  { kind: "isoelectronic", z: 11, q: 1, options: [10, 11, 18] },
  // K: the 19th electron placed in 3d instead of 4s.
  {
    kind: "move",
    z: 19,
    q: 0,
    edits: [
      [9, 0],
      [10, 1],
    ],
  },
  // Cu: the filling-rule prediction 3d⁹ 4s² instead of the observed 3d¹⁰ 4s¹.
  { kind: "repair", z: 29, q: 0, fillingRule: true },
];
/** The starting diagram for a challenge. */
export function challengeDiagram(c: Challenge): number[] {
  const diagram = c.fillingRule ? diagramForCounts(fillingPrediction(c.z - c.q)) : referenceDiagram(c.z, c.q);
  for (const [index, bits] of c.edits ?? []) {
    diagram[index] = bits;
  }
  return diagram;
}
