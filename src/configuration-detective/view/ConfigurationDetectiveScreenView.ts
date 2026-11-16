import type { ScreenViewOptions } from "scenerystack/sim";
import type { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import { ConfigurationScreenView } from "../../common/view/ConfigurationScreenView.js";
import { createDetectiveScreenContent } from "./DetectiveScreenContent.js";

/** Configuration Detective — challenge prompt, answer tiles, and progress stars. */
export class ConfigurationDetectiveScreenView extends ConfigurationScreenView {
  public constructor(model: ConfigurationModel, options?: ScreenViewOptions) {
    super(model, options, {
      createSpecific: createDetectiveScreenContent,
    });
  }
}
