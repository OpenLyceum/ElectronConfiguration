/**
 * Element Z spinner used by Fill the Orbitals and Patterns in the Table.
 */
import { HBox, type Node } from "scenerystack/scenery";
import { CONFIGURATION_SCREEN_VIEW_SETTINGS } from "../../ElectronConfigurationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ConfigurationModel } from "../model/ConfigurationModel.js";
import type { ConfigurationScreenHelpers } from "./ConfigurationScreenHelpers.js";

export const createElementLeftControls = (model: ConfigurationModel, helpers: ConfigurationScreenHelpers): Node[] => {
  const s = StringManager.getInstance().getStrings().common;
  return [
    new HBox({
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        helpers.text(s.elementStringProperty, CONFIGURATION_SCREEN_VIEW_SETTINGS.ELEMENT_TEXT_WIDTH),
        helpers.spinner(model.zProperty, s.elementStringProperty),
      ],
    }),
  ];
};
