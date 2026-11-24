/**
 * ShellNode — an optional counting view: electrons grouped by principal quantum number n around a
 * nucleus labelled with its charge ("+?" while the element is hidden).
 *
 * Deliberately labelled as a counting view, not orbits: rings are evenly spaced and electrons are spread
 * evenly around each ring, with no implied radius, path or energy. It complements the orbital diagram for
 * counting valence (outermost-shell) electrons.
 */
import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Circle, Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import Colors from "../../ElectronConfigurationColors.js";
import { SHELL_NODE_SETTINGS } from "../../ElectronConfigurationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type Diagram, SUBSHELLS, subshellCounts } from "../model/Configurations.js";

const NUCLEUS_RADIUS: number = SHELL_NODE_SETTINGS.NUCLEUS_RADIUS;
const RING_SPACING: number = SHELL_NODE_SETTINGS.RING_SPACING;
const ELECTRON_RADIUS: number = SHELL_NODE_SETTINGS.ELECTRON_RADIUS;
/** Highest shell any configuration through Rn (plus a promoted 7s electron) can reach. */
const MAX_N: number = SHELL_NODE_SETTINGS.MAX_N;

/**
 * Electrons per principal quantum number n (index n − 1).
 * @internal Exported for unit tests; not part of the application API.
 */
export function shellCounts(diagram: Diagram): number[] {
  const counts = subshellCounts(diagram);
  const shellsProperty = Array.from({ length: MAX_N }, () => 0);
  SUBSHELLS.forEach((s, i) => {
    shellsProperty[s.n - 1] = (shellsProperty[s.n - 1] ?? 0) + (counts[i] ?? 0);
  });
  return shellsProperty;
}

export class ShellNode extends VBox {
  private readonly disposeShellNode: () => void;
  /** @param maxN - outermost shell the current table can reach; sets the fixed footprint so rings never jump */
  public constructor(
    diagramProperty: TReadOnlyProperty<Diagram>,
    zProperty: TReadOnlyProperty<number | null>,
    maxN: number = SHELL_NODE_SETTINGS.DEFAULT_MAX_N,
  ) {
    const strings = StringManager.getInstance().getStrings();
    const atom = new Node();
    const caption = new Text(strings.common.shellCaptionStringProperty, {
      font: new PhetFont(SHELL_NODE_SETTINGS.CAPTION_FONT_SIZE),
      fill: Colors.textColorProperty,
      maxWidth: 2 * (NUCLEUS_RADIUS + maxN * RING_SPACING),
    });
    const shellsProperty = new DerivedProperty([diagramProperty], shellCounts);
    const paragraphProperty = new DerivedProperty(
      [shellsProperty, caption.stringProperty],
      (counts, text) =>
        `${text} ${counts
          .map((c, i) => (c > 0 ? `n=${i + 1}: ${c}` : ""))
          .filter(Boolean)
          .join(", ")}`,
    );
    super({
      spacing: SHELL_NODE_SETTINGS.SPACING,
      children: [atom, caption],
      accessibleParagraph: paragraphProperty,
    });
    const multilink = Multilink.multilink([shellsProperty, zProperty], (counts, z) => {
      for (const child of atom.children.slice()) {
        child.dispose();
      }
      const outer = Math.max(
        1,
        counts.reduce((max, c, i) => (c > 0 ? i + 1 : max), 0),
      );
      const children: Node[] = [];
      for (let n = 1; n <= outer; n++) {
        const radius = NUCLEUS_RADIUS + n * RING_SPACING;
        children.push(
          new Circle(radius, {
            stroke: Colors.panelBorderColorProperty,
            lineWidth: SHELL_NODE_SETTINGS.MULTILINK_LINE_WIDTH,
          }),
        );
        const count = counts[n - 1] ?? 0;
        for (let k = 0; k < count; k++) {
          const angle = -Math.PI / 2 + (2 * Math.PI * k) / count;
          children.push(
            new Circle(ELECTRON_RADIUS, {
              fill: Colors.electronColorProperty,
              x: radius * Math.cos(angle),
              y: radius * Math.sin(angle),
            }),
          );
        }
        children.push(
          new Text(`n=${n}`, {
            font: new PhetFont(SHELL_NODE_SETTINGS.MULTILINK_FONT_SIZE),
            fill: Colors.textColorProperty,
            centerX: 0,
            bottom: -radius + RING_SPACING - SHELL_NODE_SETTINGS.MULTILINK_BOTTOM_OFFSET,
          }),
        );
      }
      children.push(new Circle(NUCLEUS_RADIUS, { fill: Colors.protonColorProperty }));
      children.push(
        new Text(`+${z ?? "?"}`, {
          font: new PhetFont({ size: SHELL_NODE_SETTINGS.MULTILINK_SIZE, weight: "bold" }),
          fill: Colors.controlSurfaceTextColorProperty,
          centerX: 0,
          centerY: 0,
        }),
      );
      // Keep the full-size footprint so the layout doesn't jump as rings appear.
      children.unshift(new Circle(NUCLEUS_RADIUS + Math.max(maxN, outer) * RING_SPACING + 4, { pickable: false }));
      atom.children = children;
    });
    this.disposeShellNode = () => {
      multilink.dispose();
      paragraphProperty.dispose();
      shellsProperty.dispose();
      caption.dispose();
    };
  }
  public override dispose(): void {
    this.disposeShellNode();
    super.dispose();
  }
}
