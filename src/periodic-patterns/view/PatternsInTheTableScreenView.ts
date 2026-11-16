import type { ScreenViewOptions } from "scenerystack/sim";
import type { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import { ConfigurationScreenView } from "../../common/view/ConfigurationScreenView.js";
import { createElementLeftControls } from "../../common/view/ElementLeftControls.js";
import { createPatternsHighlightProperty, createPatternsScreenContent } from "./PatternsScreenContent.js";

/** Patterns in the Table — element spinner, periodic table, and observed vs predicted notation. */
export class PatternsInTheTableScreenView extends ConfigurationScreenView {
  public constructor(model: ConfigurationModel, options?: ScreenViewOptions) {
    super(model, options, {
      createLeftControls: createElementLeftControls,
      createSpecific: createPatternsScreenContent,
      createHighlightProperty: createPatternsHighlightProperty,
      showConfigurationChips: false,
    });
  }
}
