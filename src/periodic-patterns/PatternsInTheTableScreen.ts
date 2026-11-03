/**
 * PatternsInTheTableScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createPatternsInTheTableIcon() in src/common/ElectronConfigurationScreenIcons.ts
 * (see doc/implementation-notes.md).
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createPatternsInTheTableIcon } from "../common/ElectronConfigurationScreenIcons.js";
import type { TableExtent } from "../common/model/TableExtent.js";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { PatternsInTheTableModel } from "./model/PatternsInTheTableModel.js";
import { PatternsInTheTableKeyboardHelpContent } from "./view/PatternsInTheTableKeyboardHelpContent.js";
import { PatternsInTheTableScreenView } from "./view/PatternsInTheTableScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type PatternsInTheTableScreenOptions = ScreenOptions & { tandem: Tandem };
/** Shared preference: how much of the periodic table the sim offers. */
type ExtentProperty = TReadOnlyProperty<TableExtent>;

export class PatternsInTheTableScreen extends Screen<PatternsInTheTableModel, PatternsInTheTableScreenView> {
  public constructor(options: PatternsInTheTableScreenOptions, tableExtentProperty?: ExtentProperty) {
    super(
      // Model factory — called once when the screen is first shown
      () => new PatternsInTheTableModel(tableExtentProperty),
      // View factory — receives the model instance
      (model) =>
        new PatternsInTheTableScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<PatternsInTheTableScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new PatternsInTheTableKeyboardHelpContent(),
          homeScreenIcon: createPatternsInTheTableIcon(),
          navigationBarIcon: createPatternsInTheTableIcon(),
        },
        options,
      ),
    );
  }
}
