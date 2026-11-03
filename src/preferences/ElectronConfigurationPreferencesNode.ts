import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { Tandem } from "scenerystack/tandem";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { StringManager } from "../i18n/StringManager.js";
import type { ElectronConfigurationPreferencesModel } from "./ElectronConfigurationPreferencesModel.js";
export class ElectronConfigurationPreferencesNode extends VBox {
  public constructor(_preferences: ElectronConfigurationPreferencesModel, _tandem?: Tandem) {
    super({
      children: [
        new Text(StringManager.getInstance().getPreferences().noteStringProperty, {
          font: new PhetFont(14),
          fill: ElectronConfigurationColors.controlSurfaceTextColorProperty,
          maxWidth: 430,
        }),
      ],
    });
  }
}
