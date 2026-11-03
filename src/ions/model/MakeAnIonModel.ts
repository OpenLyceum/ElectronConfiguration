import type { TReadOnlyProperty } from "scenerystack/axon";
import { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import type { TableExtent } from "../../common/model/TableExtent.js";
export class MakeAnIonModel extends ConfigurationModel {
  public constructor(tableExtentProperty?: TReadOnlyProperty<TableExtent>) {
    super("ions", tableExtentProperty);
  }
}
