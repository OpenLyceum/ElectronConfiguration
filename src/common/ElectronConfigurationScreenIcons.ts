import { Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import Colors from "../ElectronConfigurationColors.js";
import { ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS } from "../ElectronConfigurationConstants.js";

function makeIcon(kind: number): ScreenIcon {
  const content = new Node({
    children: [
      new Rectangle(
        0,
        0,
        ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.CONTENT_WIDTH,
        ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.CONTENT_HEIGHT,
        { fill: Colors.backgroundColorProperty },
      ),
    ],
  });
  const labels =
    kind === 0 ? ["↑↓", "↑", "↑"] : kind === 1 ? ["s", "p", "d"] : kind === 2 ? ["↑↓", "↑↓", "↑"] : ["↑↓", "↑↓", "?"];
  labels.forEach((label, i) => {
    const box = new Rectangle(
      50 + i * 160,
      ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.BOX_Y,
      ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.BOX_WIDTH,
      ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.BOX_HEIGHT,
      {
        fill: Colors.controlSurfaceColorProperty,
        stroke: Colors.accentColorProperty,
        lineWidth: ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.BOX_LINE_WIDTH,
      },
    );
    const glyph = new Text(label, {
      font: new PhetFont(ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.GLYPH_FONT_SIZE),
      fill: Colors.controlSurfaceTextColorProperty,
      centerX: box.centerX,
      centerY: box.centerY,
    });
    content.addChild(box);
    content.addChild(glyph);
  });
  if (kind === 2) {
    content.addChild(
      new Text("− e⁻", {
        font: new PhetFont(ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.MAKE_ICON_FONT_SIZE),
        fill: Colors.textColorProperty,
        centerX: ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.MAKE_ICON_CENTER_X,
        top: ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS.MAKE_ICON_TOP,
      }),
    );
  }
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: Colors.backgroundColorProperty,
  });
}
export const createFillTheOrbitalsIcon = (): ScreenIcon => makeIcon(0);
export const createPatternsInTheTableIcon = (): ScreenIcon => makeIcon(1);
export const createMakeAnIonIcon = (): ScreenIcon => makeIcon(2);
export const createConfigurationDetectiveIcon = (): ScreenIcon => makeIcon(3);
