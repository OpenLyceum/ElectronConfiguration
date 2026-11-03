/**
 * Simulation-specific preferences (Preferences → Simulation). Each Property takes its initial value from
 * the matching query parameter.
 */
import { EnumerationProperty } from "scenerystack/axon";
import { TableExtent } from "../common/model/TableExtent.js";
import query from "./electronConfigurationQueryParameters.js";

export class ElectronConfigurationPreferencesModel {
  /** How much of the periodic table is offered; initial value from the `maxZ` query parameter. */
  public readonly tableExtentProperty = new EnumerationProperty(TableExtent.fromMaxZ(query.maxZ));

  public reset(): void {
    this.tableExtentProperty.reset();
  }
}
