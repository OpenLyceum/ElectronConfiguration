/**
 * ConfigurationDetectiveScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createConfigurationDetectiveIcon() in src/common/ElectronConfigurationScreenIcons.ts
 * (see doc/implementation-notes.md).
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createConfigurationDetectiveIcon } from "../common/ElectronConfigurationScreenIcons.js";
import type { TableExtent } from "../common/model/TableExtent.js";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { ConfigurationDetectiveModel } from "./model/ConfigurationDetectiveModel.js";
import { ConfigurationDetectiveKeyboardHelpContent } from "./view/ConfigurationDetectiveKeyboardHelpContent.js";
import { ConfigurationDetectiveScreenView } from "./view/ConfigurationDetectiveScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ConfigurationDetectiveScreenOptions = ScreenOptions & { tandem: Tandem };
/** Shared preference: how much of the periodic table the sim offers. */
type ExtentProperty = TReadOnlyProperty<TableExtent>;

export class ConfigurationDetectiveScreen extends Screen<
  ConfigurationDetectiveModel,
  ConfigurationDetectiveScreenView
> {
  public constructor(options: ConfigurationDetectiveScreenOptions, tableExtentProperty?: ExtentProperty) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ConfigurationDetectiveModel(tableExtentProperty),
      // View factory — receives the model instance
      (model) =>
        new ConfigurationDetectiveScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ConfigurationDetectiveScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ConfigurationDetectiveKeyboardHelpContent(),
          homeScreenIcon: createConfigurationDetectiveIcon(),
          navigationBarIcon: createConfigurationDetectiveIcon(),
        },
        options,
      ),
    );
  }
}
