import { BooleanProperty, DerivedProperty, NumberProperty, Property, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import query from "../../preferences/electronConfigurationQueryParameters.js";
import {
  assess,
  CHALLENGES,
  type Diagram,
  diagramForCounts,
  electronCount,
  emptyDiagram,
  fillingPrediction,
  IONS,
  ORBITALS,
  referenceCounts,
  referenceDiagram,
} from "./Configurations.js";
export type ScreenKind = "fill" | "patterns" | "ions" | "detective";
export class ConfigurationModel {
  public readonly kind: ScreenKind;
  public readonly zProperty = new NumberProperty(query.z, { range: new Range(1, 36), numberType: "Integer" });
  public readonly chargeProperty = new NumberProperty(0);
  public readonly diagramProperty = new Property<Diagram>(emptyDiagram());
  public readonly selectedProperty = new NumberProperty(0, {
    range: new Range(0, ORBITALS.length - 1),
    numberType: "Integer",
  });
  public readonly detailsProperty = new BooleanProperty(false);
  public readonly ionIndexProperty = new NumberProperty(0, {
    range: new Range(0, IONS.length - 1),
    numberType: "Integer",
  });
  public readonly challengeIndexProperty = new NumberProperty(0, {
    range: new Range(0, CHALLENGES.length - 1),
    numberType: "Integer",
  });
  public readonly messageProperty = new StringUnionProperty<
    "ready" | "pauli" | "count" | "higher" | "hund" | "ground" | "correct" | "again" | "solution"
  >("ready", { validValues: ["ready", "pauli", "count", "higher", "hund", "ground", "correct", "again", "solution"] });
  public readonly countProperty = new DerivedProperty([this.diagramProperty], electronCount);
  private history: Diagram[] = [];
  public constructor(kind: ScreenKind) {
    this.kind = kind;
    this.zProperty.lazyLink(() => {
      if (kind === "fill" || kind === "patterns") {
        this.chargeProperty.value = 0;
        this.clearHistory();
        this.diagramProperty.value = kind === "fill" ? emptyDiagram() : referenceDiagram(this.zProperty.value);
      }
    });
    this.ionIndexProperty.lazyLink(() => {
      if (kind === "ions") {
        this.loadIon();
      }
    });
    this.challengeIndexProperty.lazyLink(() => {
      if (kind === "detective") {
        this.loadChallenge();
      }
    });
    this.initialize();
  }
  public get challenge() {
    return CHALLENGES[this.challengeIndexProperty.value] ?? CHALLENGES[0];
  }
  private clearHistory(): void {
    this.history = [];
    this.messageProperty.value = "ready";
  }
  private initialize(): void {
    if (this.kind === "ions") {
      this.loadIon();
    } else if (this.kind === "detective") {
      this.loadChallenge();
    } else {
      this.diagramProperty.value = this.kind === "patterns" ? referenceDiagram(this.zProperty.value) : emptyDiagram();
    }
  }
  private loadIon(): void {
    const ion = IONS[this.ionIndexProperty.value];
    if (ion) {
      this.zProperty.value = ion.z;
      this.chargeProperty.value = 0;
      this.diagramProperty.value = referenceDiagram(ion.z);
      this.clearHistory();
    }
  }
  private loadChallenge(): void {
    const c = this.challenge;
    if (!c) {
      return;
    }
    this.zProperty.value = c.z;
    this.chargeProperty.value = c.q;
    let diagram = referenceDiagram(c.z, c.q);
    if (c.fault === "pair") {
      diagram[2] = 3;
      diagram[3] = 0;
    }
    if (c.fault === "spin") {
      diagram[3] = 2;
    }
    if (c.fault === "promote") {
      diagram[2] = 1;
      diagram[5] = 1;
    }
    if (c.fault === "copper") {
      diagram = diagramForCounts(fillingPrediction(29));
    }
    this.diagramProperty.value = diagram;
    this.clearHistory();
  }
  public add(spin: 1 | 2): void {
    const index = this.selectedProperty.value,
      bits = this.diagramProperty.value[index] ?? 0;
    if (bits & spin) {
      this.messageProperty.value = "pauli";
      return;
    }
    this.change(index, bits | spin);
  }
  public remove(): void {
    const index = this.selectedProperty.value,
      bits = this.diagramProperty.value[index] ?? 0;
    this.change(index, bits === 3 ? 1 : 0);
  }
  private change(index: number, bits: number): void {
    this.history.push(this.diagramProperty.value);
    const next = this.diagramProperty.value.slice();
    next[index] = bits;
    this.diagramProperty.value = next;
    this.messageProperty.value = "ready";
  }
  public undo(): void {
    const previous = this.history.pop();
    if (previous) {
      this.diagramProperty.value = previous;
      this.messageProperty.value = "ready";
    }
  }
  public clear(): void {
    this.history.push(this.diagramProperty.value);
    this.diagramProperty.value = emptyDiagram();
    this.messageProperty.value = "ready";
  }
  public nextElectron(): void {
    this.history.push(this.diagramProperty.value);
    this.diagramProperty.value = diagramForCounts(
      referenceCounts(this.zProperty.value),
      Math.min(this.countProperty.value + 1, this.zProperty.value),
    );
    this.messageProperty.value = "ready";
  }
  public showGround(): void {
    this.history.push(this.diagramProperty.value);
    this.diagramProperty.value = referenceDiagram(this.zProperty.value, this.chargeProperty.value);
    this.messageProperty.value = "solution";
  }
  public check(): void {
    this.messageProperty.value = assess(this.diagramProperty.value, this.zProperty.value, this.chargeProperty.value);
  }
  public moveIon(direction: -1 | 1): void {
    const ion = IONS[this.ionIndexProperty.value];
    if (!ion) {
      return;
    }
    const next = this.chargeProperty.value + direction;
    if (next < Math.min(0, ion.q) || next > Math.max(0, ion.q)) {
      return;
    }
    this.chargeProperty.value = next;
    this.diagramProperty.value = referenceDiagram(ion.z, next);
    this.messageProperty.value = next === ion.q ? "correct" : "ready";
  }
  public answer(value: number): void {
    const c = this.challenge;
    if (!c) {
      return;
    }
    const correct =
      c.kind === "identify"
        ? value === c.z
        : c.kind === "isoelectronic"
          ? value === c.z - c.q
          : value === (assess(this.diagramProperty.value, c.z, c.q) === "ground" ? 0 : 1);
    this.messageProperty.value = correct ? "correct" : "again";
  }
  public nextChallenge(): void {
    this.challengeIndexProperty.value = (this.challengeIndexProperty.value + 1) % CHALLENGES.length;
  }
  public reset(): void {
    this.zProperty.reset();
    this.chargeProperty.reset();
    this.selectedProperty.reset();
    this.detailsProperty.reset();
    this.ionIndexProperty.reset();
    this.challengeIndexProperty.reset();
    this.clearHistory();
    this.initialize();
  }
  public step(_dt: number): void {
    /* Discrete occupancy model: no time evolution. */
  }
  public dispose(): void {
    this.countProperty.dispose();
    this.zProperty.dispose();
    this.chargeProperty.dispose();
    this.diagramProperty.dispose();
    this.selectedProperty.dispose();
    this.detailsProperty.dispose();
    this.ionIndexProperty.dispose();
    this.challengeIndexProperty.dispose();
    this.messageProperty.dispose();
  }
}
