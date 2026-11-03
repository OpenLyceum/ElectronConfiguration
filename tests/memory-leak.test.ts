import { NumberProperty, Property, StringProperty } from "scenerystack/axon";
import { ConfigurationModel } from "../src/common/model/ConfigurationModel.js";
import { type Diagram, emptyDiagram } from "../src/common/model/Configurations.js";
import { TableExtent } from "../src/common/model/TableExtent.js";
import { ChargeTallyNode } from "../src/common/view/ChargeTallyNode.js";
import { ConfigurationNode } from "../src/common/view/ConfigurationNode.js";
import { ConfigurationSummary } from "../src/common/view/ConfigurationSummary.js";
import { OrbitalBoardNode } from "../src/common/view/OrbitalBoardNode.js";
import { ShellNode } from "../src/common/view/ShellNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks(
  (["fill", "patterns", "ions", "detective"] as const).map((kind) => ({
    name: `ConfigurationModel: ${kind}`,
    create: () => new ConfigurationModel(kind),
  })),
);

// Models linked to a shared, long-lived table-extent preference must unlink from it on dispose.
const sharedExtent = new Property(TableExtent.XENON);
describeDisposalLeaks(
  (["fill", "patterns", "ions", "detective"] as const).map((kind) => ({
    name: `ConfigurationModel with shared extent: ${kind}`,
    create: () => new ConfigurationModel(kind, sharedExtent),
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
