import {
  BooleanProperty,
  DerivedProperty,
  Emitter,
  NumberProperty,
  Property,
  StringUnionProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import query from "../../preferences/electronConfigurationQueryParameters.js";
import {
  assess,
  CHALLENGES,
  challengeDiagram,
  type Diagram,
  electronCount,
  emptyDiagram,
  exceptionMarks,
  guidedDiagram,
  IONS,
  isFillingException,
  MAX_Z,
  MIN_Z,
  noMarks,
  ORBITALS,
  referenceDiagram,
  type SubshellMark,
  subshellCounts,
  subshellMarks,
} from "./Configurations.js";
import { TableExtent } from "./TableExtent.js";
export type ScreenKind = "fill" | "patterns" | "ions" | "detective";
export const MESSAGES = [
  "ready",
  "pauli",
  "count",
  "higher",
  "hund",
  "ground",
  "correct",
  "again",
  "solution",
  "limit",
  "anomaly",
] as const;
export type Message = (typeof MESSAGES)[number];
const sameDiagram = (a: Diagram, b: Diagram): boolean => a.length === b.length && a.every((bits, i) => bits === b[i]);
/** Seconds per element while stepping through the table, and the longer pause on Cr and Cu. */
const AUTOPLAY_STEP = 0.9;
const AUTOPLAY_EXCEPTION_PAUSE = 2.6;
export type Spin = 1 | 2;
export class ConfigurationModel {
  public readonly kind: ScreenKind;
  /** Bounds Z, the curated ions and the diagram's subshells (Preferences → Simulation, `?maxZ`). */
  public readonly tableExtentProperty: TReadOnlyProperty<TableExtent>;
  public readonly zProperty = new NumberProperty(query.z, { range: new Range(MIN_Z, MAX_Z), numberType: "Integer" });
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
  public readonly messageProperty = new StringUnionProperty<Message>("ready", { validValues: MESSAGES });
  public readonly countProperty = new DerivedProperty([this.diagramProperty], electronCount);
  /** Per-subshell feedback drawn on the diagram after Check (and the Cr/Cu note on Patterns). */
  public readonly marksProperty = new Property<readonly SubshellMark[]>(noMarks());
  /** Fires with the orbital index when Pauli blocks an electron, so the view can shake that box. */
  public readonly pauliEmitter = new Emitter<[number]>({ parameters: [{ valueType: "number" }] });
  /** Detective: which challenges have been solved without revealing the answer. */
  public readonly solvedProperty = new Property<readonly boolean[]>(CHALLENGES.map(() => false));
  /** Patterns: step through the table automatically. */
  public readonly autoplayProperty = new BooleanProperty(false);
  /** Detective: true while an identify challenge hides the element, so no view may show Z or its symbol. */
  public readonly identityHiddenProperty: TReadOnlyProperty<boolean>;
  private history: Diagram[] = [];
  private revealed = false;
  private autoplayElapsed = 0;
  private readonly disposeExtent: () => void;
  public constructor(kind: ScreenKind, tableExtentProperty?: TReadOnlyProperty<TableExtent>) {
    this.kind = kind;
    this.identityHiddenProperty = new DerivedProperty(
      [this.challengeIndexProperty],
      () => kind === "detective" && this.challenge?.kind === "identify",
    );
    const ownedExtent = tableExtentProperty ? null : new Property(TableExtent.RADON);
    this.tableExtentProperty = tableExtentProperty ?? (ownedExtent as TReadOnlyProperty<TableExtent>);
    this.zProperty.lazyLink(() => {
      if (kind === "patterns") {
        this.chargeProperty.value = 0;
        this.clearHistory();
        this.diagramProperty.value = referenceDiagram(this.zProperty.value);
        this.marksProperty.value = exceptionMarks(this.zProperty.value);
      } else if (kind === "fill") {
        // Changing the target keeps the student's diagram (and undo history), so they can build C, then step
        // Z up to N and add one more electron — walking the table one element at a time. Check marks were
        // graded against the old target, so they go.
        this.messageProperty.value = "ready";
        this.marksProperty.value = noMarks();
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
    this.autoplayProperty.lazyLink((playing) => {
      this.autoplayElapsed = 0;
      if (playing && this.zProperty.value >= this.zProperty.range.max) {
        this.zProperty.value = this.zProperty.range.min;
      }
    });
    const onExtent = () => this.applyExtent();
    this.tableExtentProperty.lazyLink(onExtent);
    this.disposeExtent = () => {
      this.tableExtentProperty.unlink(onExtent);
      ownedExtent?.dispose();
    };
    this.applyExtent();
    this.initialize();
  }
  /**
   * Keeps Z, the ion list and Fill's diagram inside the current extent. Shrinking the table clamps Z (and
   * the ion), and clears a Fill diagram that uses subshells the smaller diagram no longer draws.
   */
  private applyExtent(): void {
    const extent = this.tableExtentProperty.value;
    if (this.kind !== "detective") {
      this.zProperty.setValueAndRange(Math.min(this.zProperty.value, extent.maxZ), new Range(MIN_Z, extent.maxZ));
    }
    if (this.kind === "ions") {
      const last = extent.ionCount - 1;
      this.ionIndexProperty.setValueAndRange(Math.min(this.ionIndexProperty.value, last), new Range(0, last));
    }
    if (
      this.kind === "fill" &&
      subshellCounts(this.diagramProperty.value).some((c, i) => c > 0 && i >= extent.levels)
    ) {
      this.clearHistory();
      this.diagramProperty.value = emptyDiagram();
    }
  }
  public get challenge() {
    return CHALLENGES[this.challengeIndexProperty.value] ?? CHALLENGES[0];
  }
  private clearHistory(): void {
    this.history = [];
    this.messageProperty.value = "ready";
    this.marksProperty.value = noMarks();
  }
  private initialize(): void {
    if (this.kind === "ions") {
      this.loadIon();
    } else if (this.kind === "detective") {
      this.loadChallenge();
    } else if (this.kind === "patterns") {
      this.diagramProperty.value = referenceDiagram(this.zProperty.value);
      this.marksProperty.value = exceptionMarks(this.zProperty.value);
    } else {
      this.diagramProperty.value = emptyDiagram();
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
    this.diagramProperty.value = challengeDiagram(c);
    this.revealed = false;
    this.clearHistory();
  }
  private bitsAt(index: number): number {
    return this.diagramProperty.value[index] ?? 0;
  }
  private rejectPauli(index: number): void {
    this.messageProperty.value = "pauli";
    this.pauliEmitter.emit(index);
  }
  /** Adds an electron with the given spin projection to an orbital; Pauli blocks a duplicate. */
  public place(index: number, spin: Spin): void {
    this.selectedProperty.value = index;
    const bits = this.bitsAt(index);
    if (bits & spin) {
      this.rejectPauli(index);
      return;
    }
    this.change(index, bits | spin);
  }
  /** Click/tap on an orbital box: empty → ↑ → ↑↓ → empty. */
  public cycle(index: number): void {
    this.selectedProperty.value = index;
    const bits = this.bitsAt(index);
    this.change(index, bits === 0 ? 1 : bits === 3 ? 0 : 3);
  }
  /** Removes one electron (the ↓ of a pair first). */
  public removeOne(index: number): void {
    this.selectedProperty.value = index;
    const bits = this.bitsAt(index);
    if (bits !== 0) {
      this.change(index, bits === 3 ? 1 : 0);
    }
  }
  /** The spin projection a drag picks up from an orbital: the ↓ of a pair, otherwise its only electron. */
  public carriedSpin(index: number): Spin | null {
    const bits = this.bitsAt(index);
    return bits === 0 ? null : bits === 1 ? 1 : 2;
  }
  /** Drags one electron from one orbital to another as a single undoable edit. */
  public move(from: number, to: number): void {
    const spin = this.carriedSpin(from);
    if (spin === null || from === to) {
      return;
    }
    this.selectedProperty.value = to;
    if (this.bitsAt(to) & spin) {
      this.rejectPauli(to);
      return;
    }
    const next = this.diagramProperty.value.slice();
    next[from] = this.bitsAt(from) & ~spin;
    next[to] = this.bitsAt(to) | spin;
    this.commit(next);
  }
  private change(index: number, bits: number): void {
    const next = this.diagramProperty.value.slice();
    next[index] = bits;
    this.commit(next);
  }
  /** Records an undoable edit; a no-op edit leaves the undo history untouched. */
  private commit(next: Diagram, message: Message = "ready"): void {
    if (!sameDiagram(next, this.diagramProperty.value)) {
      this.history.push(this.diagramProperty.value);
      this.diagramProperty.value = next;
      this.marksProperty.value = noMarks();
    }
    this.messageProperty.value = message;
  }
  public undo(): void {
    const previous = this.history.pop();
    if (previous) {
      this.diagramProperty.value = previous;
      this.messageProperty.value = "ready";
      this.marksProperty.value = noMarks();
    }
  }
  public clear(): void {
    this.commit(emptyDiagram());
  }
  /**
   * Guided aufbau step: rebuilds the diagram with one more electron by the simple filling rule. The final
   * step shows the observed reference, so for Cr and Cu the 4s/3d rearrangement appears on the last press.
   */
  public nextElectron(): void {
    const z = this.zProperty.value,
      count = Math.min(this.countProperty.value + 1, z);
    this.commit(guidedDiagram(z, count), count === z && isFillingException(z) ? "anomaly" : "ready");
  }
  public showGround(): void {
    this.revealed = true;
    this.commit(referenceDiagram(this.zProperty.value, this.chargeProperty.value), "solution");
  }
  public check(): void {
    const z = this.zProperty.value,
      q = this.chargeProperty.value,
      result = assess(this.diagramProperty.value, z, q);
    this.messageProperty.value = result;
    this.marksProperty.value = subshellMarks(this.diagramProperty.value, z, q);
    if (this.kind === "detective" && result === "ground" && !this.revealed) {
      this.markSolved();
    }
  }
  private markSolved(): void {
    const solved = this.solvedProperty.value.slice();
    solved[this.challengeIndexProperty.value] = true;
    this.solvedProperty.value = solved;
  }
  public moveIon(direction: -1 | 1): void {
    const ion = IONS[this.ionIndexProperty.value];
    if (!ion) {
      return;
    }
    const next = this.chargeProperty.value + direction;
    if (next < Math.min(0, ion.q) || next > Math.max(0, ion.q)) {
      this.messageProperty.value = "limit";
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
    if (correct) {
      this.markSolved();
    }
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
    this.solvedProperty.reset();
    this.autoplayProperty.reset();
    this.clearHistory();
    // Resetting restores the full initial ranges; narrow them again to the current extent.
    this.applyExtent();
    this.initialize();
  }
  /** The occupancy model has no time evolution; only the Patterns autoplay advances with time. */
  public step(dt: number): void {
    if (!this.autoplayProperty.value) {
      return;
    }
    this.autoplayElapsed += dt;
    const z = this.zProperty.value;
    if (this.autoplayElapsed >= (isFillingException(z) ? AUTOPLAY_EXCEPTION_PAUSE : AUTOPLAY_STEP)) {
      this.autoplayElapsed = 0;
      if (z < this.zProperty.range.max) {
        this.zProperty.value = z + 1;
      } else {
        this.autoplayProperty.value = false;
      }
    }
  }
  public dispose(): void {
    this.countProperty.dispose();
    this.identityHiddenProperty.dispose();
    this.zProperty.dispose();
    this.chargeProperty.dispose();
    this.diagramProperty.dispose();
    this.selectedProperty.dispose();
    this.detailsProperty.dispose();
    this.ionIndexProperty.dispose();
    this.challengeIndexProperty.dispose();
    this.messageProperty.dispose();
    this.marksProperty.dispose();
    this.pauliEmitter.dispose();
    this.solvedProperty.dispose();
    this.autoplayProperty.dispose();
    this.disposeExtent();
  }
}
