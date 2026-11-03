import { describe, expect, it } from "vitest";
import { ConfigurationModel } from "../src/common/model/ConfigurationModel.js";
import {
  assess,
  configuration,
  diagramForCounts,
  electronCount,
  fillingPrediction,
  IONS,
  referenceCounts,
  referenceDiagram,
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
    [36, 0, "[Kr]"],
    [26, 2, "[Ar] 3d⁶"],
    [26, 3, "[Ar] 3d⁵"],
    [29, 1, "[Ar] 3d¹⁰"],
    [29, 2, "[Ar] 3d⁹"],
    [24, 3, "[Ar] 3d³"],
    [8, -2, "[Ne]"],
    [13, 3, "[Ne]"],
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
