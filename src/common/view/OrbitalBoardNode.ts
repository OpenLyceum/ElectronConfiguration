import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { AlignBox, HBox, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import Colors from "../../ElectronConfigurationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../ElectronConfigurationButtonOptions.js";
import { type Diagram, ORBITALS, SUBSHELLS } from "../model/Configurations.js";
export class OrbitalBoardNode extends VBox {
  private readonly owned: { dispose(): void }[];
  public constructor(diagram: TReadOnlyProperty<Diagram>, selected: NumberProperty | null = null, compact = false) {
    const strings = StringManager.getInstance().getStrings(),
      owned: { dispose(): void }[] = [];
    const rows = SUBSHELLS.map((s, subshell) => {
      const indices = ORBITALS.map((o, i) => (o.subshell === subshell ? i : -1)).filter((i) => i >= 0);
      const boxes = indices.map((index) => {
        const glyph = new DerivedProperty([diagram], (d) => ["", "↑", "↓", "↑↓"][d[index] ?? 0] ?? "");
        owned.push(glyph);
        const content = new Text(glyph, { font: new PhetFont(19), fill: Colors.controlSurfaceTextColorProperty });
        if (!selected) {
          return new Node({
            children: [
              new Rectangle(0, 0, 34, 30, {
                fill: Colors.controlSurfaceColorProperty,
                stroke: Colors.controlSurfaceTextColorProperty,
              }),
              new AlignBox(content, { alignBounds: new Bounds2(0, 0, 34, 30) }),
            ],
          });
        }
        const name = new DerivedProperty(
          [
            diagram,
            strings.common.orbitalStringProperty,
            strings.states.emptyStringProperty,
            strings.states.upStringProperty,
            strings.states.downStringProperty,
            strings.states.pairStringProperty,
          ],
          (d, p, e, u, down, pair) =>
            StringUtils.fillIn(p, {
              subshell: s.name,
              index: (ORBITALS[index]?.index ?? 0) + 1,
              state: [e, u, down, pair][d[index] ?? 0],
            }),
        );
        owned.push(name);
        const active = new DerivedProperty([selected], (i) => i === index);
        owned.push(active);
        const button = new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          content,
          minWidth: 32,
          minHeight: 30,
          xMargin: 3,
          yMargin: 2,
          accessibleName: name,
          listener: () => {
            selected.value = index;
          },
        });
        const border = new Rectangle(-2, -2, button.width + 4, button.height + 4, {
          stroke: Colors.accentColorProperty,
          lineWidth: 2,
          pickable: false,
          visibleProperty: active,
        });
        return new Node({ children: [button, border] });
      });
      const row = new HBox({
        spacing: 7,
        children: [new Text(s.name, { font: new PhetFont(14), fill: Colors.textColorProperty }), ...boxes],
      });
      if (compact) {
        const visible = new DerivedProperty([diagram], (d) => indices.some((i) => (d[i] ?? 0) > 0));
        owned.push(visible);
        row.visibleProperty = visible;
      }
      return row;
    });
    super({ align: "left", spacing: 5, children: rows, excludeInvisibleChildrenFromBounds: true });
    this.owned = owned;
  }
  public override dispose(): void {
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    for (const property of this.owned) {
      property.dispose();
    }
    super.dispose();
  }
}
