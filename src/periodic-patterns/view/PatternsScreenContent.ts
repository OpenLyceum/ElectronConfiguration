/**
 * Patterns in the Table — block-coloured table with hover preview, autoplay, and prediction vs observation.
 */
import { DerivedProperty, type Property } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont, PlayPauseButton } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
} from "../../common/ElectronConfigurationButtonOptions.js";
import type { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import {
  block,
  FIRST_LANTHANIDE,
  fillingPrediction,
  isFillingException,
  LAST_LANTHANIDE,
  referenceCounts,
  SUBSHELLS,
  SYMBOLS,
  species,
  tablePosition,
} from "../../common/model/Configurations.js";
import type { TableExtent } from "../../common/model/TableExtent.js";
import { ConfigurationNode } from "../../common/view/ConfigurationNode.js";
import type { ConfigurationScreenHelpers } from "../../common/view/ConfigurationScreenHelpers.js";
import Colors from "../../ElectronConfigurationColors.js";
import { CONFIGURATION_SCREEN_VIEW_SETTINGS } from "../../ElectronConfigurationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

const TEXT_WIDTH: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_WIDTH;

const blockColors = {
  s: Colors.sBlockColorProperty,
  p: Colors.pBlockColorProperty,
  d: Colors.dBlockColorProperty,
  f: Colors.fBlockColorProperty,
};

/** The subshell an element is filling: the last one occupied in its filling-rule prediction. */
const fillingSubshell = (z: number): number => {
  const counts = fillingPrediction(z);
  let last = 0;
  counts.forEach((c, i) => {
    if (c > 0) {
      last = i;
    }
  });
  return last;
};

/** Right-column content for Patterns in the Table. */
export const createPatternsScreenContent = (model: ConfigurationModel, helpers: ConfigurationScreenHelpers): Node[] => {
  const { text, previewZProperty } = helpers;
  const s = StringManager.getInstance().getStrings().common;
  // Rebuilt when the extent changes: four periods through Kr, five through Xe, six plus the lanthanide
  // row through Rn (laid out as in PeriodicTrends, with a "57–71" placeholder in group 3 of period 6).
  const table = new Node();
  const legend = new HBox({ spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.LEGEND_SPACING });
  const owned: { dispose(): void }[] = [];
  const buildTable = (extent: TableExtent) => {
    for (const item of owned.splice(0)) {
      item.dispose();
    }
    for (const child of [...table.children, ...legend.children]) {
      child.disposeSubtree();
    }
    const large = extent.maxZ > 36;
    const pitch = large ? 25 : 32;
    const cellHeight = large ? 22 : 28;
    const rowTop = (row: number) => row * pitch + (row === 6 ? 8 : 0);
    for (let z = 1; z <= extent.maxZ; z++) {
      const symbol = SYMBOLS[z - 1] ?? "";
      const { column, row } = tablePosition(z);
      const pick = new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        baseColor: blockColors[block(z)],
        content: new Text(symbol, {
          font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.PICK_FONT_SIZE),
          fill: Colors.controlSurfaceTextColorProperty,
        }),
        minWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.PICK_MIN_WIDTH,
        minHeight: cellHeight,
        xMargin: 1,
        yMargin: 1,
        accessibleName: `${z} ${symbol}`,
        listener: () => {
          model.autoplayProperty.value = false;
          model.zProperty.value = z;
        },
      });
      pick.left = column * CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_LEFT_FACTOR;
      pick.top = rowTop(row);
      // Hover or focus previews the element without changing the diagram.
      const show = () => {
        previewZProperty.value = z;
      };
      const clear = () => {
        if (previewZProperty.value === z) {
          previewZProperty.value = null;
        }
      };
      pick.addInputListener({ over: show, focus: show, out: clear, blur: clear });
      const currentProperty = new DerivedProperty([model.zProperty], (value) => value === z);
      owned.push(currentProperty);
      table.addChild(pick);
      table.addChild(
        new Rectangle(pick.bounds.dilated(CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_DILATION), {
          stroke: Colors.accentColorProperty,
          lineWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_LINE_WIDTH,
          pickable: false,
          visibleProperty: currentProperty,
        }),
      );
    }
    if (extent.maxZ >= LAST_LANTHANIDE) {
      const placeholder = new Rectangle(
        2 * 26,
        rowTop(5),
        CONFIGURATION_SCREEN_VIEW_SETTINGS.PLACEHOLDER_WIDTH,
        cellHeight,
        CONFIGURATION_SCREEN_VIEW_SETTINGS.PLACEHOLDER_CORNER_X,
        CONFIGURATION_SCREEN_VIEW_SETTINGS.PLACEHOLDER_CORNER_Y,
        {
          fill: Colors.fBlockColorProperty,
          opacity: CONFIGURATION_SCREEN_VIEW_SETTINGS.PLACEHOLDER_OPACITY,
        },
      );
      table.addChild(placeholder);
      table.addChild(
        new Text(`${FIRST_LANTHANIDE}–${LAST_LANTHANIDE}`, {
          font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_FONT_SIZE),
          fill: Colors.controlSurfaceTextColorProperty,
          center: placeholder.center,
          maxWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_MAX_WIDTH,
        }),
      );
    }
    legend.children = (
      extent.maxZ >= FIRST_LANTHANIDE ? (["s", "p", "d", "f"] as const) : (["s", "p", "d"] as const)
    ).map(
      (b) =>
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_SPACING,
          children: [
            new Rectangle(
              0,
              0,
              CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_WIDTH,
              CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_HEIGHT,
              CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_CORNER_X,
              CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_CORNER_Y,
              { fill: blockColors[b], stroke: Colors.panelBorderColorProperty },
            ),
            new Text(s[`${b}BlockStringProperty`], {
              font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.LEGEND_FONT_SIZE),
              fill: Colors.textColorProperty,
              maxWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_MAX_WIDTH,
            }),
          ],
        }),
    );
  };
  model.tableExtentProperty.link(buildTable);
  const autoplay = new HBox({
    spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.AUTOPLAY_SPACING,
    children: [
      new PlayPauseButton(model.autoplayProperty, {
        radius: CONFIGURATION_SCREEN_VIEW_SETTINGS.AUTOPLAY_RADIUS,
        ...FLAT_BUTTON_APPEARANCE_OPTIONS,
        accessibleHelpText: s.autoplayStringProperty,
      }),
      new Text(s.autoplayStringProperty, {
        font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.AUTOPLAY_FONT_SIZE),
        fill: Colors.textColorProperty,
        maxWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.AUTOPLAY_MAX_WIDTH,
      }),
    ],
  });
  // The previewed element (hover/focus) or the currentProperty one.
  const shownZProperty = new DerivedProperty([previewZProperty, model.zProperty], (preview, z) => preview ?? z);
  const previewLabelProperty = new DerivedProperty([shownZProperty, s.previewStringProperty], (z, pattern) =>
    StringUtils.fillIn(pattern, { species: species(z), z, subshell: SUBSHELLS[fillingSubshell(z)]?.name ?? "" }),
  );
  const observed = new ConfigurationNode(
    new DerivedProperty([shownZProperty], (z) => referenceCounts(z)),
    true,
    s.observedStringProperty,
  );
  const predicted = new ConfigurationNode(
    new DerivedProperty([shownZProperty], (z) => fillingPrediction(z)),
    true,
    s.predictedStringProperty,
  );
  const exception = text(s.exceptionStringProperty, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.EXCEPTION_TEXT_SIZE);
  exception.visibleProperty = new DerivedProperty([shownZProperty], isFillingException);
  const coreProperty = new DerivedProperty([shownZProperty, s.coreStringProperty], (z, pattern) => {
    const counts = referenceCounts(z);
    let n = 0;
    counts.forEach((count, i) => {
      if (count > 0) {
        n = Math.max(n, SUBSHELLS[i]?.n ?? 0);
      }
    });
    const outer = counts.reduce((sum, c, i) => sum + ((SUBSHELLS[i]?.n ?? 0) === n ? c : 0), 0);
    return StringUtils.fillIn(pattern, { core: z - outer, outer });
  });
  return [
    new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CREATE_PATTERNS_SPACING,
      children: [table, legend],
    }),
    autoplay,
    new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CREATE_PATTERNS_SPACING,
      excludeInvisibleChildrenFromBounds: true,
      children: [
        text(previewLabelProperty, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_SIZE),
        observed,
        predicted,
        exception,
      ],
    }),
    text(coreProperty, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.CORE_TEXT_SIZE),
  ];
};

/** Highlight property for the orbital board: subshell being filled under hover/currentProperty Z. */
export const createPatternsHighlightProperty = (
  previewZProperty: Property<number | null>,
  zProperty: ConfigurationModel["zProperty"],
) => new DerivedProperty([previewZProperty, zProperty], (preview, z) => fillingSubshell(preview ?? z));
