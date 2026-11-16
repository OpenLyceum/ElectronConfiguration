import type { ScreenViewOptions } from "scenerystack/sim";
import type { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import { ConfigurationScreenView } from "../../common/view/ConfigurationScreenView.js";
import { createElementLeftControls } from "../../common/view/ElementLeftControls.js";

/** Fill the Orbitals — shared chrome plus the element Z spinner. */
export class FillTheOrbitalsScreenView extends ConfigurationScreenView {
  public constructor(model: ConfigurationModel, options?: ScreenViewOptions) {
    super(model, options, {
      createLeftControls: createElementLeftControls,
    });
  }
}
