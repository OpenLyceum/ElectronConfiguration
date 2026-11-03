import { Property } from "scenerystack/axon";
import { Text } from "scenerystack/scenery";
import { describe, expect, it } from "vitest";
import { ConfigurationModel } from "../src/common/model/ConfigurationModel.js";
import {
  assess,
  CHALLENGES,
  challengeDiagram,
  configuration,
  configurationParts,
  diagramForCounts,
  electronCount,
  fillingPrediction,
  formatCharge,
  guidedDiagram,
  IONS,
  referenceCounts,
  referenceDiagram,
  species,
  subshellCounts,
} from "../src/common/model/Configurations.js";
import { ShellNode, shellCounts } from "../src/common/view/ShellNode.js";

describe("reference configurations", () => {
  it.each(Array.from({ length: 36 }, (_, i) => i + 1))("neutral Z=%i conserves electrons and follows Hund", (z) => {
    const d = referenceDiagram(z);
    expect(electronCount(d)).toBe(z);
    expect(d.every((b) => b >= 0 && b <= 3)).toBe(true);
    expect(assess(d, z)).toBe("ground");
  });
  // Independent textbook/NIST fixtures, in spectroscopic shell order.
  it.each([
    [6, 0, "1s² 2s² 2p²"],
    [7, 0, "1s² 2s² 2p³"],
    [8, 0, "1s² 2s² 2p⁴"],
    [24, 0, "[Ar] 3d⁵ 4s¹"],
    [29, 0, "[Ar] 3d¹⁰ 4s¹"],
    [10, 0, "[He] 2s² 2p⁶"],
    [18, 0, "[Ne] 3s² 3p⁶"],
    [36, 0, "[Ar] 3d¹⁰ 4s² 4p⁶"],
    [26, 2, "[Ar] 3d⁶"],
    [26, 3, "[Ar] 3d⁵"],
    [29, 1, "[Ar] 3d¹⁰"],
    [29, 2, "[Ar] 3d⁹"],
    [24, 3, "[Ar] 3d³"],
    [8, -2, "[He] 2s² 2p⁶"],
    [13, 3, "[He] 2s² 2p⁶"],
    [11, 0, "[Ne] 3s¹"],
  ] as const)("Z=%i, q=%i", (z, q, expected) =>
    expect(configuration(referenceCounts(z, q), z > 8 || q !== 0)).toBe(expected),
  );
  it("separates a filling prediction from measured neutral exceptions", () => {
    expect(configuration(fillingPrediction(24), true)).toBe("[Ar] 3d⁴ 4s²");
    expect(configuration(fillingPrediction(29), true)).toBe("[Ar] 3d⁹ 4s²");
  });
  it("accepts permuted degenerate orbitals and reversed spin", () => {
    const d = referenceDiagram(6);
    d[2] = 0;
    d[3] = 2;
    d[4] = 2;
    expect(assess(d, 6)).toBe("ground");
  });
  it("distinguishes wrong count, Hund mismatch, and promoted occupancy", () => {
    const d = referenceDiagram(6);
    d[2] = 3;
    d[3] = 0;
    expect(assess(d, 6)).toBe("hund");
    d[2] = 1;
    expect(assess(d, 6)).toBe("count");
    d[5] = 1;
    expect(assess(d, 6)).toBe("higher");
  });
  it.each(IONS)("ion $z/$q conserves count", ({ z, q }) => expect(electronCount(referenceDiagram(z, q))).toBe(z - q));
  it("writes ion charges as chemists do", () => {
    expect(species(11, 1)).toBe("Na⁺");
    expect(species(26, 3)).toBe("Fe³⁺");
    expect(species(8, -2)).toBe("O²⁻");
    expect(species(17, -1)).toBe("Cl⁻");
    expect(species(6)).toBe("C");
    expect(formatCharge(-2)).toBe("−2");
    expect(formatCharge(3)).toBe("+3");
    expect(formatCharge(0)).toBe("0");
  });
  it("guided construction follows the filling rule until the last electron", () => {
    // Building Cr: 20 electrons look like Ca (4s²), not the final Cr counts truncated (4s¹ 3d¹).
    expect(configuration(subshellCounts(guidedDiagram(24, 20)), true)).toBe("[Ar] 4s²");
    expect(configuration(subshellCounts(guidedDiagram(24, 23)), true)).toBe("[Ar] 3d³ 4s²");
    expect(configuration(subshellCounts(guidedDiagram(24, 24)), true)).toBe("[Ar] 3d⁵ 4s¹");
    expect(guidedDiagram(6, 99)).toEqual(referenceDiagram(6));
  });
  it("splits a configuration into a core and block-tagged terms", () => {
    const parts = configurationParts(referenceCounts(26), true);
    expect(parts.map((p) => p.text)).toEqual(["[Ar]", "3d⁶", "4s²"]);
    expect(parts.map((p) => (p.kind === "term" ? p.l : -1))).toEqual([-1, 2, 0]);
    expect(configurationParts(referenceCounts(1, 1))).toEqual([]);
  });
  it("counts electrons by shell n for the shell view", () => {
    expect(shellCounts(referenceDiagram(26))).toEqual([2, 8, 14, 2, 0]);
    expect(shellCounts(referenceDiagram(36))).toEqual([2, 8, 18, 8, 0]);
  });
  it("rejects unsupported input", () => {
    expect(() => referenceCounts(37)).toThrow();
    expect(() => referenceCounts(1, 2)).toThrow();
  });
});
describe("student actions", () => {
  it("blocks duplicate spin, allows pairing, and supports undo", () => {
    const m = new ConfigurationModel("fill");
    m.place(0, 1);
    const before = m.diagramProperty.value;
    m.place(0, 1);
    expect(m.messageProperty.value).toBe("pauli");
    expect(m.diagramProperty.value).toBe(before);
    m.place(0, 2);
    expect(m.countProperty.value).toBe(2);
    m.undo();
    expect(m.countProperty.value).toBe(1);
    m.dispose();
  });
  it("ignores no-op edits so Undo always reverses a visible change", () => {
    const m = new ConfigurationModel("fill");
    m.removeOne(0); // empty orbital
    m.clear(); // already empty
    m.place(0, 1);
    m.undo();
    expect(m.countProperty.value).toBe(0);
    m.place(0, 1);
    m.place(0, 2);
    m.removeOne(0);
    m.removeOne(0);
    m.removeOne(0); // nothing left: must not add an undo step
    m.undo();
    expect(m.countProperty.value).toBe(1);
    m.dispose();
  });
  it("keeps the student's diagram when the target element changes", () => {
    const m = new ConfigurationModel("fill");
    for (let i = 0; i < 6; i++) {
      m.nextElectron();
    }
    m.zProperty.value = 7;
    expect(m.countProperty.value).toBe(6);
    m.nextElectron();
    m.check();
    expect(m.messageProperty.value).toBe("ground");
    m.undo();
    expect(m.countProperty.value).toBe(6);
    m.dispose();
  });
  it("flags the Cr/Cu rearrangement on the final guided step", () => {
    const m = new ConfigurationModel("fill");
    m.zProperty.value = 29;
    for (let i = 0; i < 28; i++) {
      m.nextElectron();
    }
    expect(m.messageProperty.value).toBe("ready");
    m.nextElectron();
    expect(m.messageProperty.value).toBe("anomaly");
    expect(configuration(subshellCounts(m.diagramProperty.value), true)).toBe("[Ar] 3d¹⁰ 4s¹");
    m.dispose();
  });
  it("explains why an ion step is refused", () => {
    const m = new ConfigurationModel("ions"); // Na⁺
    m.moveIon(-1);
    expect(m.messageProperty.value).toBe("limit");
    expect(m.chargeProperty.value).toBe(0);
    m.moveIon(1);
    expect(m.messageProperty.value).toBe("correct");
    m.moveIon(1);
    expect(m.messageProperty.value).toBe("limit");
    expect(m.chargeProperty.value).toBe(1);
    m.dispose();
  });
  it("guided filling stops at the neutral target and resets", () => {
    const m = new ConfigurationModel("fill");
    m.zProperty.value = 24;
    for (let i = 0; i < 30; i++) {
      m.nextElectron();
    }
    m.check();
    expect(m.messageProperty.value).toBe("ground");
    expect(m.countProperty.value).toBe(24);
    m.reset();
    expect(m.countProperty.value).toBe(0);
    m.dispose();
  });
  it("removes Fe 4s first, never changes Z, and limits charge to the target", () => {
    const m = new ConfigurationModel("ions");
    m.ionIndexProperty.value = 11;
    m.moveIon(1);
    expect(m.diagramProperty.value[9]).toBe(1);
    m.moveIon(1);
    expect(m.diagramProperty.value[9]).toBe(0);
    m.moveIon(1);
    m.moveIon(1);
    expect(m.chargeProperty.value).toBe(3);
    expect(m.zProperty.value).toBe(26);
    expect(m.countProperty.value).toBe(23);
    m.reset();
    expect(m.chargeProperty.value).toBe(0);
    m.dispose();
  });
  it("supports anion formation and reversing a step", () => {
    const m = new ConfigurationModel("ions");
    m.ionIndexProperty.value = 3;
    m.moveIon(-1);
    m.moveIon(-1);
    m.moveIon(-1);
    expect(m.chargeProperty.value).toBe(-2);
    expect(m.countProperty.value).toBe(10);
    m.moveIon(1);
    expect(m.countProperty.value).toBe(9);
    m.dispose();
  });
  it("has repair, classify, move, identify and isoelectronic challenges", () => {
    const m = new ConfigurationModel("detective");
    m.check();
    expect(m.messageProperty.value).toBe("hund");
    m.showGround();
    m.check();
    expect(m.messageProperty.value).toBe("ground");
    expect(m.solvedProperty.value[0]).toBe(false); // revealed answers earn no star
    m.challengeIndexProperty.value = 2;
    expect(assess(m.diagramProperty.value, 8)).toBe("higher");
    m.answer(0);
    expect(m.messageProperty.value).toBe("again");
    m.answer(1);
    expect(m.messageProperty.value).toBe("correct");
    expect(m.solvedProperty.value[2]).toBe(true);
    m.nextChallenge(); // Na: valence electron misplaced in 3p
    expect(m.challenge?.kind).toBe("move");
    m.move(6, 5);
    m.check();
    expect(m.messageProperty.value).toBe("ground");
    expect(m.solvedProperty.value[3]).toBe(true);
    m.nextChallenge();
    m.answer(12);
    expect(m.messageProperty.value).toBe("correct");
    m.nextChallenge();
    m.answer(10);
    expect(m.messageProperty.value).toBe("correct");
    m.nextChallenge(); // K: 19th electron misplaced in 3d
    m.move(10, 9);
    m.check();
    expect(m.messageProperty.value).toBe("ground");
    m.nextChallenge();
    expect(m.diagramProperty.value).toEqual(diagramForCounts(fillingPrediction(29)));
    m.reset();
    expect(m.solvedProperty.value.every((solved) => !solved)).toBe(true);
    m.dispose();
  });
  it.each(CHALLENGES.map((c, i) => [i, c] as const))("challenge %i starts with the target electron count", (_i, c) => {
    expect(electronCount(challengeDiagram(c))).toBe(c.z - c.q);
    // Every repair/move/classify challenge starts from something that is not ground-state filling.
    if (c.kind !== "identify" && c.kind !== "isoelectronic") {
      expect(assess(challengeDiagram(c), c.z, c.q)).not.toBe("ground");
    }
  });
  it("cycles a box empty → ↑ → ↑↓ → empty, and ↓ alone pairs up", () => {
    const m = new ConfigurationModel("fill");
    const bits = () => m.diagramProperty.value[2];
    m.cycle(2);
    expect(bits()).toBe(1);
    m.cycle(2);
    expect(bits()).toBe(3);
    m.cycle(2);
    expect(bits()).toBe(0);
    m.place(2, 2);
    m.cycle(2);
    expect(bits()).toBe(3);
    expect(m.selectedProperty.value).toBe(2);
    m.dispose();
  });
  it("moves one electron as a single undoable step and blocks Pauli violations with an event", () => {
    const m = new ConfigurationModel("fill");
    const rejected: number[] = [];
    m.pauliEmitter.addListener((i) => rejected.push(i));
    m.place(2, 1);
    m.place(2, 2);
    expect(m.carriedSpin(2)).toBe(2); // a pair gives up its ↓
    m.move(2, 3);
    expect([m.diagramProperty.value[2], m.diagramProperty.value[3]]).toEqual([1, 2]);
    m.place(4, 1);
    m.move(4, 2); // 2 already holds ↑
    expect(m.messageProperty.value).toBe("pauli");
    expect(rejected).toEqual([2]);
    m.undo(); // reverses place(4, 1); the rejected move recorded nothing
    m.undo(); // reverses the move as one step
    expect([m.diagramProperty.value[2], m.diagramProperty.value[3]]).toEqual([3, 0]);
    m.move(5, 6); // empty source: nothing to carry
    m.undo();
    expect(m.countProperty.value).toBe(1);
    m.dispose();
  });
  it("marks subshells after Check and clears the marks on the next edit", () => {
    const m = new ConfigurationModel("fill"); // C
    for (let i = 0; i < 4; i++) {
      m.nextElectron();
    }
    m.place(2, 1);
    m.place(2, 2); // 2p paired: Hund fault
    m.check();
    expect(m.marksProperty.value.slice(0, 4)).toEqual(["ok", "ok", "fault", null]);
    m.cycle(3);
    expect(m.marksProperty.value.every((mark) => mark === null)).toBe(true);
    m.dispose();
  });
  it("clears Check marks when the Fill target changes", () => {
    const m = new ConfigurationModel("fill"); // C
    for (let i = 0; i < 6; i++) {
      m.nextElectron();
    }
    m.check();
    expect(m.marksProperty.value.some((mark) => mark === "ok")).toBe(true);
    m.zProperty.value = 7; // the marks graded C, not N
    expect(m.marksProperty.value.every((mark) => mark === null)).toBe(true);
    m.dispose();
  });
  it("hides the element on identify challenges, including the shell view's nucleus label", () => {
    const m = new ConfigurationModel("detective");
    const identify = CHALLENGES.findIndex((c) => c.kind === "identify");
    expect(m.identityHiddenProperty.value).toBe(false);
    m.challengeIndexProperty.value = identify;
    expect(m.identityHiddenProperty.value).toBe(true);
    const fill = new ConfigurationModel("fill");
    expect(fill.identityHiddenProperty.value).toBe(false);
    fill.dispose();
    const labels = (z: number | null) => {
      const node = new ShellNode(m.diagramProperty, new Property<number | null>(z));
      const result = node.children[0]?.children.flatMap((c) => (c instanceof Text ? [c.string] : []));
      node.dispose();
      return result;
    };
    expect(labels(12)).toContain("+12");
    expect(labels(null)).toContain("+?");
    expect(labels(null)).not.toContain("+12");
    m.dispose();
  });
  it("notes the 4s and 3d subshells for Cr and Cu on Patterns", () => {
    const m = new ConfigurationModel("patterns");
    m.zProperty.value = 24;
    expect(m.marksProperty.value.filter((mark) => mark === "note")).toHaveLength(2);
    m.zProperty.value = 26;
    expect(m.marksProperty.value.every((mark) => mark === null)).toBe(true);
    m.dispose();
  });
  it("steps through the table, pausing longer on exceptions, and stops at Kr", () => {
    const m = new ConfigurationModel("patterns");
    m.zProperty.value = 23;
    m.autoplayProperty.value = true;
    m.step(1);
    expect(m.zProperty.value).toBe(24);
    m.step(1); // Cr pauses longer than one ordinary step
    expect(m.zProperty.value).toBe(24);
    m.step(2);
    expect(m.zProperty.value).toBe(25);
    m.zProperty.value = 36;
    m.step(1);
    expect(m.autoplayProperty.value).toBe(false);
    m.autoplayProperty.value = true; // restarting at the end starts again from H
    expect(m.zProperty.value).toBe(1);
    m.dispose();
  });
});
