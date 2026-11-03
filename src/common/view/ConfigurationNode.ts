/**
 * ConfigurationNode — a configuration written as block-tinted chips: [Ar] 3d⁶ 4s².
 *
 * Each subshell term carries the same s/p/d tint as its row in the orbital diagram and its block in the
 * periodic table, so students can match notation to diagram at a glance. Screen readers get the plain
 * string as a paragraph.
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { FlowBox, HBox, Node, Rectangle, Text, type TPaint } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import Colors from "../../ElectronConfigurationColors.js";
import { configuration, configurationParts } from "../model/Configurations.js";
import { blockColor } from "./OrbitalBoardNode.js";

const FONT = new PhetFont(15);
const chip = (text: string, fill: TPaint) => {
  const label = new Text(text, { font: FONT, fill: Colors.controlSurfaceTextColorProperty });
  const background = new Rectangle(0, 0, label.width + 10, label.height + 4, 5, 5, {
    fill,
    stroke: Colors.panelBorderColorProperty,
  });
  label.center = background.center;
  return new Node({ children: [background, label] });
};

export class ConfigurationNode extends HBox {
  private readonly disposeConfigurationNode: () => void;
  public constructor(
    countsProperty: TReadOnlyProperty<readonly number[]>,
    abbreviated: boolean,
    labelProperty: TReadOnlyProperty<string>,
    wrapWidth = 320,
  ) {
    // Long configurations (e.g. radon written in full) wrap onto further lines.
    const chips = new FlowBox({
      orientation: "horizontal",
      wrap: true,
      spacing: 4,
      lineSpacing: 4,
      justify: "left",
      preferredWidth: wrapWidth,
    });
    const label = new Text(labelProperty, { font: new PhetFont(13), fill: Colors.textColorProperty, maxWidth: 140 });
    const paragraph = new DerivedProperty(
      [countsProperty, labelProperty],
      (counts, text) => `${text} ${configuration(counts, abbreviated)}`,
    );
    super({
      spacing: 8,
      align: "top", // A plain Node keeps the HBox from shrinking the FlowBox to its minimum (one chip per line).
      children: [label, new Node({ children: [chips] })],
      accessibleParagraph: paragraph,
    });
    const onCounts = (counts: readonly number[]) => {
      for (const child of chips.children.slice()) {
        child.dispose();
      }
      const parts = configurationParts(counts, abbreviated);
      chips.children =
        parts.length === 0
          ? [new Text("—", { font: FONT, fill: Colors.textColorProperty })]
          : parts.map((part) =>
              chip(part.text, part.kind === "core" ? Colors.controlSurfaceColorProperty : blockColor(part.l)),
            );
    };
    countsProperty.link(onCounts);
    this.disposeConfigurationNode = () => {
      countsProperty.unlink(onCounts);
      paragraph.dispose();
      label.dispose();
    };
  }
  public override dispose(): void {
    this.disposeConfigurationNode();
    super.dispose();
  }
}
