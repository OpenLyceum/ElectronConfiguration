/** Occupancy model for H–Kr. Orbital arrows label spin projections, not moving electrons. */
export const SYMBOLS =
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr".split(" ");
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
/** Neutral atoms whose observed ground state differs from the simple filling rule (within H–Kr). */
export const isFillingException = (z: number): boolean => z === 24 || z === 29;
export function referenceCounts(z: number, charge = 0): number[] {
  if (!Number.isInteger(z) || z < 1 || z > 36 || !Number.isInteger(charge) || z - charge < 0 || z - charge > 38) {
    throw new Error("Unsupported atomic number or electron count");
  }
  const result = fillingPrediction(z);
  // Neutral reference exceptions, checked against NIST atomic data; not inferred from a half-filled slogan.
  if (isFillingException(z)) {
    result[5] = (result[5] ?? 0) - 1;
    result[6] = (result[6] ?? 0) + 1;
  }
  if (charge > 0) {
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
const S_BLOCK = new Set([1, 2, 3, 4, 11, 12, 19, 20]);
/** Periodic-table block (s, p or d) of element z within H–Kr; He is placed in the s block. */
export const block = (z: number): "s" | "p" | "d" => (S_BLOCK.has(z) ? "s" : z >= 21 && z <= 30 ? "d" : "p");
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
/** Marks the 4s and 3d subshells, where Cr and Cu depart from the simple filling rule. */
export function exceptionMarks(z: number): SubshellMark[] {
  return SUBSHELLS.map((s) => (isFillingException(z) && (s.name === "4s" || s.name === "3d") ? "note" : null));
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
    for (const candidate of [2, 10, 18, 36]) {
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
] as const;
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
