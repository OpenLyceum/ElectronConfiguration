/**
 * Make an Ion — left controls, surroundings tray, charge tally, and neutral comparison board.
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Circle, HBox, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { ConfigurationModel, Spin } from "../../common/model/ConfigurationModel.js";
import { IONS, referenceDiagram, species } from "../../common/model/Configurations.js";
import { ChargeTallyNode } from "../../common/view/ChargeTallyNode.js";
import type { ConfigurationScreenHelpers } from "../../common/view/ConfigurationScreenHelpers.js";
import { OrbitalBoardNode } from "../../common/view/OrbitalBoardNode.js";
import Colors from "../../ElectronConfigurationColors.js";
import { CONFIGURATION_SCREEN_VIEW_SETTINGS } from "../../ElectronConfigurationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

const scaleToFit = (node: Node, width: number, height: number) =>
  node.setScaleMagnitude(Math.min(1, width / node.width, height / node.height));

/** Make an Ion: one electron leaves for (or arrives from) the surroundings, animated per orbital. */
const stepIon = (model: ConfigurationModel, board: OrbitalBoardNode, direction: -1 | 1): void => {
  const before = model.diagramProperty.value;
  model.moveIon(direction);
  const after = model.diagramProperty.value;
  after.forEach((bits, index) => {
    const old = before[index] ?? 0;
    for (const spin of [1, 2] as Spin[]) {
      if (old & spin && !(bits & spin)) {
        board.fly(index, spin, true);
      } else if (!(old & spin) && bits & spin) {
        board.fly(index, spin, false);
      }
    }
  });
};

/** Ion picker and add/lose electron buttons. */
export const createIonsLeftControls = (model: ConfigurationModel, helpers: ConfigurationScreenHelpers): Node[] => {
  const s = StringManager.getInstance().getStrings().common;
  const { text, button, spinner, getBoard } = helpers;
  const ionName = (i: number) => {
    const ion = IONS[i];
    return ion ? species(ion.z, ion.q) : "";
  };
  return [
    new HBox({
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        text(s.ionStringProperty, CONFIGURATION_SCREEN_VIEW_SETTINGS.ION_TEXT_WIDTH),
        spinner(model.ionIndexProperty, s.ionStringProperty, ionName),
      ],
    }),
    new HBox({
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.SPACING,
      children: [
        button(s.addElectronStringProperty, () => {
          const board = getBoard();
          if (board) {
            stepIon(model, board, -1);
          }
        }),
        button(s.loseElectronStringProperty, () => {
          const board = getBoard();
          if (board) {
            stepIon(model, board, 1);
          }
        }),
      ],
    }),
  ];
};

/** Surroundings tray for the orbital board. */
export const createIonsTrayNode = (model: ConfigurationModel): Node => new SurroundingsNode(model.chargeProperty);

/** Right-column charge tally and neutral-atom comparison diagram. */
export const createIonsScreenContent = (model: ConfigurationModel, _helpers: ConfigurationScreenHelpers): Node[] => {
  const s = StringManager.getInstance().getStrings().common;
  const neutral = new DerivedProperty([model.zProperty], (z) => referenceDiagram(z));
  const neutralSlot = new Node();
  model.tableExtentProperty.link((extent) => {
    for (const child of neutralSlot.children.slice()) {
      child.dispose();
    }
    const neutralBoard = new OrbitalBoardNode(neutral, {
      levels: extent.levels - 1,
      axis: false,
      interactive: false,
      label: s.neutralStringProperty,
    });
    scaleToFit(
      neutralBoard,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.SCALE_TO_FIT_WIDTH,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.SCALE_TO_FIT_HEIGHT,
    );
    neutralSlot.children = [neutralBoard];
  });
  return [
    new ChargeTallyNode(model.zProperty, model.chargeProperty),
    new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_SPACING,
      // The visible label is decorative; the board's own paragraph reads "Neutral atom: …".
      children: [
        new Text(s.neutralStringProperty, {
          font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.SPECIFIC_FONT_SIZE),
          fill: Colors.textColorProperty,
        }),
        neutralSlot,
      ],
    }),
  ];
};

/** Make an Ion's tray: the electrons a cation has given up to its surroundings. */
class SurroundingsNode extends Node {
  private readonly disposeSurroundings: () => void;
  public constructor(chargeProperty: TReadOnlyProperty<number>) {
    const s = StringManager.getInstance().getStrings().common;
    const dots = new HBox({ spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.DOTS_SPACING });
    const frame = new Rectangle(
      0,
      0,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.FRAME_WIDTH,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.FRAME_HEIGHT,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.FRAME_CORNER_X,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.FRAME_CORNER_Y,
      {
        stroke: Colors.panelBorderColorProperty,
        lineDash: [
          CONFIGURATION_SCREEN_VIEW_SETTINGS.FRAME_LINE_DASH_DASH,
          CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_FRAME_LINE_DASH_DASH,
        ],
      },
    );
    const label = new Text(s.surroundingsStringProperty, {
      font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.LABEL_FONT_SIZE_SEGMENT_3),
      fill: Colors.textColorProperty,
      maxWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.LABEL_MAX_WIDTH,
    });
    const row = new HBox({ spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.ROW_SPACING, children: [label, dots] });
    super({ children: [frame, row] });
    const onCharge = (q: number) => {
      for (const child of dots.children.slice()) {
        child.dispose();
      }
      // Up to four electrons leave in the curated ions (Sn⁴⁺); anions bring theirs in from outside.
      dots.children = Array.from(
        { length: Math.max(0, q) },
        () => new Circle(CONFIGURATION_SCREEN_VIEW_SETTINGS.DOTS_RADIUS, { fill: Colors.electronColorProperty }),
      );
      row.left = CONFIGURATION_SCREEN_VIEW_SETTINGS.LEFT_LEFT;
      row.centerY = frame.centerY;
    };
    chargeProperty.link(onCharge);
    this.disposeSurroundings = () => {
      chargeProperty.unlink(onCharge);
      label.dispose();
    };
  }
  public override dispose(): void {
    this.disposeSurroundings();
    super.dispose();
  }
}
