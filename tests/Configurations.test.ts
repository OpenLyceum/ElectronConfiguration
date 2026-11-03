import { describe, expect, it } from "vitest";
import { ConfigurationModel } from "../src/common/model/ConfigurationModel.js";
import {
  assess,
  configuration,
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
  it("rejects unsupported input", () => {
    expect(() => referenceCounts(37)).toThrow();
    expect(() => referenceCounts(1, 2)).toThrow();
  });
});
describe("student actions", () => {
  it("blocks duplicate spin, allows pairing, and supports undo", () => {
    const m = new ConfigurationModel("fill");
    m.add(1);
    const before = m.diagramProperty.value;
    m.add(1);
    expect(m.messageProperty.value).toBe("pauli");
    expect(m.diagramProperty.value).toBe(before);
    m.add(2);
    expect(m.countProperty.value).toBe(2);
    m.undo();
    expect(m.countProperty.value).toBe(1);
    m.dispose();
  });
  it("ignores no-op edits so Undo always reverses a visible change", () => {
    const m = new ConfigurationModel("fill");
    m.remove(); // empty orbital
    m.clear(); // already empty
    m.add(1);
    m.undo();
    expect(m.countProperty.value).toBe(0);
    m.add(1);
    m.add(2);
    m.remove();
    m.remove();
    m.remove(); // nothing left: must not add an undo step
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
  it("has repair, classify, identify and isoelectronic challenges", () => {
    const m = new ConfigurationModel("detective");
    m.check();
    expect(m.messageProperty.value).toBe("hund");
    m.showGround();
    m.check();
    expect(m.messageProperty.value).toBe("ground");
    m.challengeIndexProperty.value = 2;
    expect(assess(m.diagramProperty.value, 8)).toBe("higher");
    m.answer(0);
    expect(m.messageProperty.value).toBe("again");
    m.answer(1);
    expect(m.messageProperty.value).toBe("correct");
    m.nextChallenge();
    m.answer(12);
    expect(m.messageProperty.value).toBe("correct");
    m.nextChallenge();
    m.answer(10);
    expect(m.messageProperty.value).toBe("correct");
    m.nextChallenge();
    expect(m.diagramProperty.value).toEqual(diagramForCounts(fillingPrediction(29)));
    m.dispose();
  });
});
