/**
 * MakeAnIonScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createMakeAnIonIcon() in src/common/ElectronConfigurationScreenIcons.ts
 * (see doc/implementation-notes.md).
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createMakeAnIonIcon } from "../common/ElectronConfigurationScreenIcons.js";
import type { TableExtent } from "../common/model/TableExtent.js";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { MakeAnIonModel } from "./model/MakeAnIonModel.js";
import { MakeAnIonKeyboardHelpContent } from "./view/MakeAnIonKeyboardHelpContent.js";
import { MakeAnIonScreenView } from "./view/MakeAnIonScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type MakeAnIonScreenOptions = ScreenOptions & { tandem: Tandem };
/** Shared preference: how much of the periodic table the sim offers. */
type ExtentProperty = TReadOnlyProperty<TableExtent>;

export class MakeAnIonScreen extends Screen<MakeAnIonModel, MakeAnIonScreenView> {
  public constructor(options: MakeAnIonScreenOptions, tableExtentProperty?: ExtentProperty) {
    super(
      // Model factory — called once when the screen is first shown
      () => new MakeAnIonModel(tableExtentProperty),
      // View factory — receives the model instance
      (model) =>
        new MakeAnIonScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<MakeAnIonScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new MakeAnIonKeyboardHelpContent(),
          homeScreenIcon: createMakeAnIonIcon(),
          navigationBarIcon: createMakeAnIonIcon(),
        },
        options,
      ),
    );
  }
}
