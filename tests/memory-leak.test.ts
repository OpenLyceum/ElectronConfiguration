import { NumberProperty, Property, StringProperty } from "scenerystack/axon";
import { Node } from "scenerystack/scenery";
import { describe, expect, it } from "vitest";
import { ConfigurationModel } from "../src/common/model/ConfigurationModel.js";
import { type Diagram, emptyDiagram } from "../src/common/model/Configurations.js";
import { TableExtent } from "../src/common/model/TableExtent.js";
import { ChargeTallyNode } from "../src/common/view/ChargeTallyNode.js";
import { ConfigurationNode } from "../src/common/view/ConfigurationNode.js";
import { ConfigurationSummary } from "../src/common/view/ConfigurationSummary.js";
import { OrbitalBoardNode } from "../src/common/view/OrbitalBoardNode.js";
import { ShellNode } from "../src/common/view/ShellNode.js";
import { ConfigurationDetectiveModel } from "../src/configuration-detective/model/ConfigurationDetectiveModel.js";
import { FillTheOrbitalsModel } from "../src/fill-orbitals/model/FillTheOrbitalsModel.js";
import { StringManager } from "../src/i18n/StringManager.js";
import { MakeAnIonModel } from "../src/ions/model/MakeAnIonModel.js";
import { createIonsTrayNode } from "../src/ions/view/IonsScreenContent.js";
import { PatternsInTheTableModel } from "../src/periodic-patterns/model/PatternsInTheTableModel.js";
import { describeDisposalLeaks, forceGC, listenerCount } from "./helpers/memoryLeak.js";

// The four screen models are thin `super(kind, extent)` wrappers; each screen constructs its own,
// so list the real classes (the base class runs through every one of them).
const screenModels = [
  FillTheOrbitalsModel,
  PatternsInTheTableModel,
  MakeAnIonModel,
  ConfigurationDetectiveModel,
] as const;
describeDisposalLeaks(screenModels.map((Model) => ({ name: Model.name, create: () => new Model() })));

// Models linked to a shared, long-lived table-extent preference must unlink from it on dispose.
const sharedExtent = new Property(TableExtent.XENON);
describeDisposalLeaks(
  screenModels.map((Model) => ({
    name: `${Model.name} with shared extent`,
    create: () => new Model(sharedExtent),
    keepAlive: () => [sharedExtent],
  })),
);

// Keep sources alive so stale listeners cannot hide inside an unreachable model/board cycle.
const externalDiagram = new Property<Diagram>(emptyDiagram());
const externalSelection = new NumberProperty(0);
const externalModel = new ConfigurationModel("detective");
const externalHighlight = new Property<number | null>(2);
const externalCounts = new Property<readonly number[]>([2, 2, 2]);
const externalLabel = new StringProperty("Configuration");
const externalZ = new NumberProperty(26);
const externalCharge = new NumberProperty(3);
describeDisposalLeaks([
  {
    name: "editable orbital board",
    create: () =>
      new OrbitalBoardNode(externalModel.diagramProperty, {
        model: externalModel,
        selectedProperty: externalSelection,
        marksProperty: externalModel.marksProperty,
        highlightProperty: externalHighlight,
        insetNode: new ShellNode(externalDiagram, externalZ, 7),
        levels: TableExtent.RADON.levels,
      }),
  },
  {
    name: "read-only reference board",
    create: () => new OrbitalBoardNode(externalDiagram, { axis: false, interactive: false, label: externalLabel }),
  },
  { name: "configuration chips", create: () => new ConfigurationNode(externalCounts, true, externalLabel) },
  { name: "shell view", create: () => new ShellNode(externalDiagram, externalZ) },
  { name: "charge tally", create: () => new ChargeTallyNode(externalZ, externalCharge) },
  { name: "screen summary", create: () => new ConfigurationSummary(externalModel) },
]);

// memory-leak-covers: SurroundingsNode (file-private; built by createIonsTrayNode)
// Make an Ion rebuilds its orbital board, and the surroundings tray the board owns, whenever the
// table extent changes (ConfigurationScreenView.buildBoard). The old tray must let go of the model's
// charge and the localized "Surroundings" label, and be collected with its board.
describe("Make an Ion surroundings tray rebuilt on extent change", () => {
  it("releases the old tray's charge and label listeners and is collected", async () => {
    const extent = new Property(TableExtent.RADON);
    const model = new MakeAnIonModel(extent);
    const surroundings = StringManager.getInstance().getStrings().common.surroundingsStringProperty;
    const slot = new Node();
    const build = (levels: number): WeakRef<Node>[] => {
      const tray = createIonsTrayNode(model);
      const board = new OrbitalBoardNode(model.diagramProperty, { levels, trayNode: tray });
      slot.children = [board];
      return [new WeakRef(tray), new WeakRef<Node>(board)];
    };
    const rebuild = (levels: number): WeakRef<Node>[] => {
      const old = slot.children[0];
      const refs = build(levels);
      old?.dispose();
      return refs;
    };
    const tracked = build(extent.value.levels - 1);
    const chargeBefore = listenerCount(model.chargeProperty);
    const labelBefore = listenerCount(surroundings);
    const staleRefs: WeakRef<Node>[] = [...tracked];
    for (const next of [TableExtent.KRYPTON, TableExtent.XENON, TableExtent.RADON]) {
      extent.value = next;
      staleRefs.push(...rebuild(next.levels - 1));
    }
    // Every build but the current one is stale.
    const current = staleRefs.splice(-2);
    model.chargeProperty.value = 2;
    expect(listenerCount(model.chargeProperty), "old trays still listen to the charge").toBe(chargeBefore);
    expect(listenerCount(surroundings), "old tray labels still listen to the string").toBe(labelBefore);
    await forceGC(staleRefs);
    expect(staleRefs.filter((ref) => ref.deref() !== undefined).length, "old trays/boards retained").toBe(0);
    expect(current.every((ref) => ref.deref() !== undefined)).toBe(true);
    slot.children[0]?.dispose();
    model.dispose();
    extent.dispose();
  });

  it("a tray disposed on its own releases the charge and the localized label", async () => {
    const model = new MakeAnIonModel();
    const surroundings = StringManager.getInstance().getStrings().common.surroundingsStringProperty;
    const chargeBefore = listenerCount(model.chargeProperty);
    const labelBefore = listenerCount(surroundings);
    const ref = (() => {
      const tray = createIonsTrayNode(model);
      tray.dispose();
      return new WeakRef(tray);
    })();
    expect(listenerCount(model.chargeProperty)).toBe(chargeBefore);
    expect(listenerCount(surroundings)).toBe(labelBefore);
    await forceGC(ref);
    expect(ref.deref(), "tray retained by the live model").toBeUndefined();
    model.dispose();
  });
});
