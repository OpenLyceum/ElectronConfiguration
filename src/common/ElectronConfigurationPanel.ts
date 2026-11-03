/**
 * ElectronConfigurationPanel.ts
 *
 * A pre-themed Panel that automatically uses ElectronConfigurationColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { ElectronConfigurationPanel } from "../../common/ElectronConfigurationPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new ElectronConfigurationPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new ElectronConfigurationPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new ElectronConfigurationPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { PANEL_CORNER_RADIUS } from "../ElectronConfigurationConstants.js";

export type ElectronConfigurationPanelOptions = PanelOptions;

export class ElectronConfigurationPanel extends Panel {
  public constructor(content: Node, providedOptions?: ElectronConfigurationPanelOptions) {
    const options = optionize<ElectronConfigurationPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: ElectronConfigurationColors.panelBackgroundColorProperty,
        stroke: ElectronConfigurationColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
