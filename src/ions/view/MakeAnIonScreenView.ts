import type { ScreenViewOptions } from "scenerystack/sim";
import type { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import { ConfigurationScreenView } from "../../common/view/ConfigurationScreenView.js";
import { createIonsLeftControls, createIonsScreenContent, createIonsTrayNode } from "./IonsScreenContent.js";

/** Make an Ion — ion picker, surroundings tray, charge tally, and neutral comparison. */
export class MakeAnIonScreenView extends ConfigurationScreenView {
  public constructor(model: ConfigurationModel, options?: ScreenViewOptions) {
    super(model, options, {
      createLeftControls: createIonsLeftControls,
      createSpecific: createIonsScreenContent,
      createTrayNode: createIonsTrayNode,
    });
  }
}
