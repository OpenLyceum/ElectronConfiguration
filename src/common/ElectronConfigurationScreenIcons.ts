import { Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import Colors from "../ElectronConfigurationColors.js";

function makeIcon(kind: number): ScreenIcon {
  const content = new Node({ children: [new Rectangle(0, 0, 548, 373, { fill: Colors.backgroundColorProperty })] });
  const labels =
    kind === 0 ? ["↑↓", "↑", "↑"] : kind === 1 ? ["s", "p", "d"] : kind === 2 ? ["↑↓", "↑↓", "↑"] : ["↑↓", "↑↓", "?"];
  labels.forEach((label, i) => {
    const box = new Rectangle(50 + i * 160, 110, 130, 150, {
      fill: Colors.controlSurfaceColorProperty,
      stroke: Colors.accentColorProperty,
      lineWidth: 5,
    });
    const glyph = new Text(label, {
      font: new PhetFont(65),
      fill: Colors.controlSurfaceTextColorProperty,
      centerX: box.centerX,
      centerY: box.centerY,
    });
    content.addChild(box);
    content.addChild(glyph);
  });
  if (kind === 2) {
    content.addChild(
      new Text("− e⁻", { font: new PhetFont(40), fill: Colors.textColorProperty, centerX: 274, top: 285 }),
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
