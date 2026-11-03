/**
 * ChargeTallyNode — Make an Ion's proton and electron tallies, one square per particle.
 *
 * Protons stay fixed; electron squares are filled for electrons present, hollow for electrons a cation has
 * lost, and extra squares appear for electrons an anion has gained. The net charge is the visible difference.
 */
import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, Rectangle, Text, type TPaint, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import Colors from "../../ElectronConfigurationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { formatCharge, species } from "../model/Configurations.js";

const SQUARE = 6;
const GAP = 1.5;
const PER_GROUP = 5;
/** Squares in rows, with a small extra gap every five so counts can be read off. */
function tally(count: number, filled: number, fill: TPaint): Node {
  const node = new Node();
  for (let i = 0; i < count; i++) {
    const x = i * (SQUARE + GAP) + Math.floor(i / PER_GROUP) * 3;
    node.addChild(
      new Rectangle(x, 0, SQUARE, SQUARE * 2, {
        fill: i < filled ? fill : null,
        stroke: fill,
        lineWidth: 1,
      }),
    );
  }
  return node;
}

export class ChargeTallyNode extends VBox {
  private readonly disposeChargeTally: () => void;
  public constructor(zProperty: TReadOnlyProperty<number>, chargeProperty: TReadOnlyProperty<number>) {
    const s = StringManager.getInstance().getStrings().common;
    const labelOptions = { font: new PhetFont(13), fill: Colors.textColorProperty, maxWidth: 90 };
    const protonLabel = new Text(s.protonsStringProperty, labelOptions);
    const electronLabel = new Text(s.electronsStringProperty, labelOptions);
    const protonCount = new Text("", labelOptions);
    const electronCount = new Text("", labelOptions);
    const protonSquares = new Node();
    const electronSquares = new Node();
    const net = new DerivedProperty(
      [zProperty, chargeProperty, s.netChargeStringProperty],
      (z, q, pattern) => `${StringUtils.fillIn(pattern, { charge: formatCharge(q) })} → ${species(z, q)}`,
    );
    const netText = new Text(net, {
      font: new PhetFont({ size: 17, weight: "bold" }),
      fill: Colors.textColorProperty,
      maxWidth: 360,
    });
    const row = (label: Node, count: Node, squares: Node) =>
      new HBox({
        spacing: 8,
        children: [new Node({ children: [label] }), new Node({ children: [count] }), squares],
      });
    const paragraph = new DerivedProperty(
      [zProperty, chargeProperty, s.protonsStringProperty, s.electronsStringProperty, net],
      (z, q, protons, electrons, netString) => `${protons} ${z}, ${electrons} ${z - q}. ${netString}`,
    );
    super({
      align: "left",
      spacing: 6,
      children: [
        row(protonLabel, protonCount, protonSquares),
        row(electronLabel, electronCount, electronSquares),
        netText,
      ],
      accessibleParagraph: paragraph,
    });
    // Align the squares into a column regardless of label lengths.
    const labelWidth = () => Math.max(protonLabel.width, electronLabel.width);
    const multilink = Multilink.multilink([zProperty, chargeProperty], (z, q) => {
      const electrons = z - q;
      protonCount.string = `+${z}`;
      electronCount.string = `−${electrons}`;
      for (const child of [...protonSquares.children, ...electronSquares.children]) {
        child.dispose();
      }
      protonSquares.children = [tally(z, z, Colors.protonColorProperty)];
      electronSquares.children = [tally(Math.max(z, electrons), electrons, Colors.electronColorProperty)];
      const w = labelWidth();
      for (const label of [protonLabel, electronLabel]) {
        label.right = w;
      }
      protonCount.left = electronCount.left = 0;
    });
    this.disposeChargeTally = () => {
      multilink.dispose();
      paragraph.dispose();
      netText.dispose();
      net.dispose();
      protonLabel.dispose();
      electronLabel.dispose();
    };
  }
  public override dispose(): void {
    this.disposeChargeTally();
    super.dispose();
  }
}
