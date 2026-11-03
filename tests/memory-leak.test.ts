import { NumberProperty, Property } from "scenerystack/axon";
import { ConfigurationModel } from "../src/common/model/ConfigurationModel.js";
import { type Diagram, emptyDiagram } from "../src/common/model/Configurations.js";
import { ConfigurationSummary } from "../src/common/view/ConfigurationSummary.js";
import { OrbitalBoardNode } from "../src/common/view/OrbitalBoardNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks(
  (["fill", "patterns", "ions", "detective"] as const).map((kind) => ({
    name: `ConfigurationModel: ${kind}`,
    create: () => new ConfigurationModel(kind),
  })),
);

// Keep sources alive so stale listeners cannot hide inside an unreachable model/board cycle.
const externalDiagram = new Property<Diagram>(emptyDiagram());
const externalSelection = new NumberProperty(0);
const externalModel = new ConfigurationModel("detective");
describeDisposalLeaks([
  { name: "selectable orbital board", create: () => new OrbitalBoardNode(externalDiagram, externalSelection) },
  { name: "compact reference board", create: () => new OrbitalBoardNode(externalDiagram, null, true) },
  { name: "screen summary", create: () => new ConfigurationSummary(externalModel) },
]);
