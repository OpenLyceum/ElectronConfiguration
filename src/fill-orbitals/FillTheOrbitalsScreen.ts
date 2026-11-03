/**
 * FillTheOrbitalsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createFillTheOrbitalsIcon() in src/common/ElectronConfigurationScreenIcons.ts
 * (see doc/implementation-notes.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createFillTheOrbitalsIcon } from "../common/ElectronConfigurationScreenIcons.js";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { FillTheOrbitalsModel } from "./model/FillTheOrbitalsModel.js";
import { FillTheOrbitalsKeyboardHelpContent } from "./view/FillTheOrbitalsKeyboardHelpContent.js";
import { FillTheOrbitalsScreenView } from "./view/FillTheOrbitalsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type FillTheOrbitalsScreenOptions = ScreenOptions & { tandem: Tandem };

export class FillTheOrbitalsScreen extends Screen<FillTheOrbitalsModel, FillTheOrbitalsScreenView> {
  public constructor(options: FillTheOrbitalsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new FillTheOrbitalsModel(),
      // View factory — receives the model instance
      (model) =>
        new FillTheOrbitalsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<FillTheOrbitalsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new FillTheOrbitalsKeyboardHelpContent(),
          homeScreenIcon: createFillTheOrbitalsIcon(),
          navigationBarIcon: createFillTheOrbitalsIcon(),
        },
        options,
      ),
    );
  }
}
