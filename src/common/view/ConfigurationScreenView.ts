/**
 * ConfigurationScreenView — shared view for the four screens.
 *
 * Left: title (with an info button), screen controls, and the energy-staircase orbital diagram.
 * Right: screen-specific visuals (periodic table, charge tallies, challenge tiles), a one-line status with
 * an icon, and the configuration as block-tinted chips. Rules, caveats and scope notes live in the info
 * dialog rather than on screen.
 */
import {
  BooleanProperty,
  DerivedProperty,
  type NumberProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, HBox, Node, Rectangle, RichText, Text, type TPaint, VBox } from "scenerystack/scenery";
import { InfoButton, PhetFont, PlayPauseButton, ResetAllButton, StarNode } from "scenerystack/scenery-phet";
import { Dialog, type ScreenViewOptions } from "scenerystack/sim";
import { Checkbox, NumberSpinner, RectangularPushButton } from "scenerystack/sun";
import Colors from "../../ElectronConfigurationColors.js";
import { CONFIGURATION_SCREEN_VIEW_SETTINGS, SCREEN_VIEW_MARGIN } from "../../ElectronConfigurationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../ElectronConfigurationButtonOptions.js";
import type { ConfigurationModel, Spin } from "../model/ConfigurationModel.js";
import {
  block,
  CHALLENGES,
  type Diagram,
  FIRST_LANTHANIDE,
  fillingPrediction,
  IONS,
  isFillingException,
  LAST_LANTHANIDE,
  ORBITALS,
  referenceCounts,
  referenceDiagram,
  SUBSHELLS,
  SYMBOLS,
  species,
  subshellCounts,
  tablePosition,
} from "../model/Configurations.js";
import { TableExtent } from "../model/TableExtent.js";
import { ChargeTallyNode } from "./ChargeTallyNode.js";
import { ConfigurationNode } from "./ConfigurationNode.js";
import { ConfigurationSummary, type StatusKey, statusText } from "./ConfigurationSummary.js";
import { OrbitalBoardNode } from "./OrbitalBoardNode.js";
import { ResponsiveScreenView } from "./ResponsiveScreenView.js";
import { ShellNode } from "./ShellNode.js";

const LEFT = SCREEN_VIEW_MARGIN;
const RIGHT: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.RIGHT;
const TEXT_WIDTH: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_WIDTH;

const blockColors = {
  s: Colors.sBlockColorProperty,
  p: Colors.pBlockColorProperty,
  d: Colors.dBlockColorProperty,
  f: Colors.fBlockColorProperty,
};
const scaleToFit = (node: Node, width: number, height: number) =>
  node.setScaleMagnitude(Math.min(1, width / node.width, height / node.height));

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

/** Status icon for each message: ✓ success, ! problem, ★ notable, i prompt. */
const STATUS_ICON: Record<StatusKey, { glyph: string; color: TPaint }> = {
  ground: { glyph: "✓", color: Colors.okColorProperty },
  correct: { glyph: "✓", color: Colors.okColorProperty },
  pauli: { glyph: "!", color: Colors.faultColorProperty },
  count: { glyph: "!", color: Colors.faultColorProperty },
  higher: { glyph: "!", color: Colors.faultColorProperty },
  hund: { glyph: "!", color: Colors.faultColorProperty },
  again: { glyph: "✗", color: Colors.faultColorProperty },
  limit: { glyph: "!", color: Colors.noteColorProperty },
  anomaly: { glyph: "★", color: Colors.noteColorProperty },
  solution: { glyph: "i", color: Colors.accentColorProperty },
  ready: { glyph: "i", color: Colors.accentColorProperty },
  explore: { glyph: "i", color: Colors.accentColorProperty },
  ionReady: { glyph: "i", color: Colors.accentColorProperty },
  choose: { glyph: "?", color: Colors.accentColorProperty },
};

export class ConfigurationScreenView extends ResponsiveScreenView {
  private readonly boards: OrbitalBoardNode[] = [];
  private readonly resetView: () => void;

  public constructor(model: ConfigurationModel, options?: ScreenViewOptions) {
    super({ ...options, screenSummaryContent: new ConfigurationSummary(model) });
    const strings = StringManager.getInstance().getStrings(),
      s = strings.common;

    // ── Small factories ─────────────────────────────────────────────────────
    const text = (
      value: string | TReadOnlyProperty<string>,
      width = TEXT_WIDTH,
      size: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.DEFAULT_SIZE,
    ) =>
      new RichText(value, {
        accessibleParagraph: value,
        font: new PhetFont(size),
        fill: Colors.textColorProperty,
        lineWrap: width,
        maxWidth: width,
      });
    const button = (label: TReadOnlyProperty<string>, action: () => void, baseColor?: TPaint) =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        ...(baseColor ? { baseColor } : {}),
        content: new RichText(label, {
          font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.BUTTON_FONT_SIZE),
          fill: Colors.controlSurfaceTextColorProperty,
          maxWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.BUTTON_MAX_WIDTH,
        }),
        accessibleName: label,
        listener: action,
      });
    const spinner = (
      property: NumberProperty,
      name: TReadOnlyProperty<string>,
      format: ((value: number) => string) | null = null,
    ) =>
      new NumberSpinner(property, property.rangeProperty, {
        arrowsPosition: "leftRight",
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        numberDisplayOptions: {
          textOptions: { font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.SPINNER_FONT_SIZE) },
          minBackgroundWidth: format ? 55 : 35,
          numberFormatter: format,
        },
        // Screen readers announce the formatted value (e.g. "Fe³⁺"), not an internal index.
        ...(format ? { pdomCreateAriaValueText: (value: number) => format(value) } : {}),
        accessibleName: name,
      });

    // ── View-only state ─────────────────────────────────────────────────────
    const showShellsProperty = new BooleanProperty(false);
    const previewZProperty = new Property<number | null>(null);

    // ── Title with info dialog ──────────────────────────────────────────────
    const infoParagraphs: Record<typeof model.kind, TReadOnlyProperty<string>[]> = {
      fill: [s.helpStringProperty, s.rulesStringProperty, s.capacityStringProperty, s.schematicStringProperty],
      patterns: [
        s.rulesStringProperty,
        s.transitionStringProperty,
        s.exceptionStringProperty,
        s.schematicStringProperty,
      ],
      ions: [s.ionRuleStringProperty, s.ionScopeStringProperty, s.schematicStringProperty],
      detective: [s.helpStringProperty, s.rulesStringProperty, s.schematicStringProperty],
    };
    let dialog: Dialog | null = null;
    const infoButton = new InfoButton({
      ...FLAT_BUTTON_APPEARANCE_OPTIONS,
      iconFill: Colors.accentColorProperty,
      scale: CONFIGURATION_SCREEN_VIEW_SETTINGS.INFO_BUTTON_SCALE,
      accessibleName: s.infoStringProperty,
      listener: () => {
        dialog ??= new Dialog(
          new VBox({
            align: "left",
            spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.INFO_BUTTON_SPACING,
            children: infoParagraphs[model.kind].map(
              (paragraph) =>
                new RichText(paragraph, {
                  font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.INFO_BUTTON_FONT_SIZE),
                  fill: Colors.controlSurfaceTextColorProperty,
                  lineWrap: CONFIGURATION_SCREEN_VIEW_SETTINGS.INFO_BUTTON_LINE_WRAP,
                  accessibleParagraph: paragraph,
                }),
            ),
          }),
          {
            title: new Text(s.infoStringProperty, {
              font: new PhetFont({ size: CONFIGURATION_SCREEN_VIEW_SETTINGS.INFO_BUTTON_SIZE, weight: "bold" }),
            }),
            fill: Colors.controlSurfaceColorProperty,
          },
        );
        dialog.show();
      },
    });
    const title = new HBox({
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.TITLE_SPACING,
      children: [
        text(
          strings.lessons[`${model.kind}StringProperty`],
          CONFIGURATION_SCREEN_VIEW_SETTINGS.TITLE_WIDTH,
          CONFIGURATION_SCREEN_VIEW_SETTINGS.TITLE_SIZE,
        ),
        infoButton,
      ],
    });

    // ── Target line ─────────────────────────────────────────────────────────
    const target = new DerivedProperty(
      [
        model.zProperty,
        model.chargeProperty,
        model.challengeIndexProperty,
        model.kind === "ions" ? s.currentStringProperty : s.targetStringProperty,
        s.unknownStringProperty,
        s.targetSpeciesStringProperty,
      ],
      (z, q, _c, p, unknown, speciesOnly) => {
        const kind = model.kind === "detective" ? model.challenge?.kind : undefined;
        // Identify hides the element; isoelectronic hides the electron count, which is the answer.
        return kind === "identify"
          ? unknown
          : StringUtils.fillIn(kind === "isoelectronic" ? speciesOnly : p, {
              species: species(z, q),
              electrons: z - q,
            });
      },
    );

    // ── Orbital diagram ─────────────────────────────────────────────────────
    const editableProperty = new DerivedProperty([model.challengeIndexProperty], () => {
      const kind = model.challenge?.kind;
      return model.kind === "fill" || (model.kind === "detective" && (kind === "repair" || kind === "move"));
    });
    const highlightProperty =
      model.kind === "patterns"
        ? new DerivedProperty([previewZProperty, model.zProperty], (preview, z) => fillingSubshell(preview ?? z))
        : null;
    const editing = model.kind === "fill" || model.kind === "detective";
    // The diagram is rebuilt when the table extent changes: more subshells (and an f column) through Rn.
    // Detective challenges all sit within H–Kr, so its diagram keeps the krypton layout.
    // The +Z nucleus label would give away an identify challenge.
    const nucleusZ = new DerivedProperty([model.zProperty, model.identityHiddenProperty], (z, hidden) =>
      hidden ? null : z,
    );
    const boardSlot = new Node();
    let board: OrbitalBoardNode | null = null;
    const buildBoard = (extent: TableExtent) => {
      if (board) {
        this.boards.splice(this.boards.indexOf(board), 1);
        board.dispose(); // also disposes the shell view and surroundings it owns
      }
      const levels =
        model.kind === "detective"
          ? TableExtent.KRYPTON.levels
          : model.kind === "fill"
            ? extent.levels
            : extent.levels - 1;
      const shells = new ShellNode(
        model.diagramProperty,
        nucleusZ,
        Math.max(...SUBSHELLS.slice(0, levels).map((sub) => sub.n)),
      );
      shells.visibleProperty = showShellsProperty;
      board = new OrbitalBoardNode(model.diagramProperty, {
        model: editing ? model : null,
        editableProperty,
        selectedProperty: model.selectedProperty,
        marksProperty: model.marksProperty,
        highlightProperty,
        levels,
        trayNode: model.kind === "ions" ? new SurroundingsNode(model.chargeProperty) : null,
        insetNode: shells,
      });
      const [width, height] = CONFIGURATION_SCREEN_VIEW_SETTINGS.BOARD_AREA[model.kind];
      scaleToFit(board, width, height);
      boardSlot.children = [board];
      this.boards.push(board);
    };
    if (model.kind === "detective") {
      buildBoard(TableExtent.KRYPTON);
    } else {
      model.tableExtentProperty.link(buildBoard);
    }

    // Quantum numbers of the selected orbital, shown only when asked for.
    const selected = new DerivedProperty([model.selectedProperty, s.selectedStringProperty], (index, pattern) => {
      const orbital = ORBITALS[index];
      return StringUtils.fillIn(pattern, {
        orbital: orbital
          ? `${SUBSHELLS[orbital.subshell]?.name}, ${orbital.index + 1} · n=${orbital.n}, l=${orbital.l}, mₗ=${orbital.m}; mₛ=±½`
          : "",
      });
    });
    const selectedNode = text(selected, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.SELECTED_NODE_SIZE);
    selectedNode.visibleProperty = model.detailsProperty;

    // ── Edit actions ────────────────────────────────────────────────────────
    const actionButtons = [
      button(s.undoStringProperty, () => model.undo()),
      button(s.clearStringProperty, () => model.clear()),
      ...(model.kind === "fill" ? [button(s.nextElectronStringProperty, () => model.nextElectron())] : []),
      button(s.checkStringProperty, () => model.check(), Colors.noteColorProperty),
      button(s.groundStringProperty, () => model.showGround()),
    ];
    const actions = new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.ACTIONS_SPACING,
      children: [
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_ACTIONS_SPACING,
          children: actionButtons.slice(0, 3),
        }),
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_ACTIONS_SPACING,
          children: actionButtons.slice(3),
        }),
      ],
    });
    actions.visibleProperty = editableProperty;

    const leftChildren: Node[] = [title];
    if (model.kind === "fill" || model.kind === "patterns") {
      leftChildren.push(
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_SPACING,
          children: [
            text(s.elementStringProperty, CONFIGURATION_SCREEN_VIEW_SETTINGS.ELEMENT_TEXT_WIDTH),
            spinner(model.zProperty, s.elementStringProperty),
          ],
        }),
      );
    }
    if (model.kind === "ions") {
      const ionName = (i: number) => {
        const ion = IONS[i];
        return ion ? species(ion.z, ion.q) : "";
      };
      leftChildren.push(
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
            button(s.addElectronStringProperty, () => board && this.stepIon(model, board, -1)),
            button(s.loseElectronStringProperty, () => board && this.stepIon(model, board, 1)),
          ],
        }),
      );
    }
    leftChildren.push(text(target, TEXT_WIDTH), boardSlot, selectedNode, actions);
    const left = new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.LEFT_SPACING,
      children: leftChildren,
      excludeInvisibleChildrenFromBounds: true,
      left: LEFT,
      top: CONFIGURATION_SCREEN_VIEW_SETTINGS.LEFT_TOP,
    });

    // ── Right column: status, configuration chips, display options ──────────
    const status = statusText(model);
    const icon = new Node();
    status.key.link((key) => {
      const { glyph, color } = STATUS_ICON[key];
      icon.children = [
        new Circle(CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_RADIUS, { fill: color }),
        new Text(glyph, {
          font: new PhetFont({ size: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHILDREN_FONT_SIZE, weight: "bold" }),
          fill: Colors.backgroundColorProperty,
          centerX: 0,
          centerY: 0,
        }),
      ];
    });
    const statusNode = new HBox({
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.STATUS_NODE_SPACING,
      align: "top",
      children: [
        icon,
        text(
          status.property,
          CONFIGURATION_SCREEN_VIEW_SETTINGS.PROPERTY_TEXT_WIDTH,
          CONFIGURATION_SCREEN_VIEW_SETTINGS.PROPERTY_TEXT_SIZE,
        ),
      ],
    });
    const countsProperty = new DerivedProperty([model.diagramProperty], (d: Diagram) => subshellCounts(d));
    const fullNode = new ConfigurationNode(countsProperty, false, s.fullStringProperty);
    const shortNode = new ConfigurationNode(countsProperty, true, s.shortStringProperty);
    const checkboxOptions = {
      checkboxColor: Colors.textColorProperty,
      boxWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHECKBOX_OPTIONS_BOX_WIDTH,
    };
    const detailsControl = new Checkbox(
      model.detailsProperty,
      text(
        s.detailsStringProperty,
        CONFIGURATION_SCREEN_VIEW_SETTINGS.DETAILS_TEXT_WIDTH,
        CONFIGURATION_SCREEN_VIEW_SETTINGS.DETAILS_TEXT_SIZE,
      ),
      {
        ...checkboxOptions,
        accessibleName: s.detailsStringProperty,
      },
    );
    const shellsControl = new Checkbox(
      showShellsProperty,
      text(
        s.shellsStringProperty,
        CONFIGURATION_SCREEN_VIEW_SETTINGS.SHELLS_TEXT_WIDTH,
        CONFIGURATION_SCREEN_VIEW_SETTINGS.SHELLS_TEXT_SIZE,
      ),
      {
        ...checkboxOptions,
        accessibleName: s.shellsStringProperty,
      },
    );
    const commonInfo = new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.COMMON_INFO_SPACING,
      children: [
        statusNode,
        // Patterns already shows the observed and filling-rule notation next to its table.
        ...(model.kind === "patterns" ? [] : [fullNode, shortNode]),
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_COMMON_INFO_SPACING,
          children: [detailsControl, shellsControl],
        }),
      ],
    });

    // ── Screen-specific visuals ─────────────────────────────────────────────
    const specific = new VBox({ align: "left", spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.SPECIFIC_SPACING });
    if (model.kind === "patterns") {
      specific.children = this.createPatterns(model, previewZProperty, text);
    }
    if (model.kind === "ions") {
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
      specific.children = [
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
    }
    if (model.kind === "detective") {
      specific.children = this.createDetective(model, text, button);
    }

    const right = new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.RIGHT_SPACING,
      children: [specific, commonInfo],
      left: RIGHT,
      top: CONFIGURATION_SCREEN_VIEW_SETTINGS.RIGHT_TOP,
    });
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.resetView();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.resetView = () => {
      showShellsProperty.reset();
      previewZProperty.reset();
    };
    const content = new Node({ children: [left, right, reset] });
    this.addChild(content);
    this.pdomPlayAreaNode.pdomOrder = [left];
    this.pdomControlAreaNode.pdomOrder = [right, reset];
    this.setResponsiveContent(content, [[left], ...specific.children.map((child) => [child]), [commonInfo], [reset]]);
  }

  /** Make an Ion: one electron leaves for (or arrives from) the surroundings, animated per orbital. */
  private stepIon(model: ConfigurationModel, board: OrbitalBoardNode, direction: -1 | 1): void {
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
  }

  /** Patterns in the Table: block-coloured table with hover preview, autoplay, and prediction vs observation. */
  private createPatterns(
    model: ConfigurationModel,
    previewZProperty: Property<number | null>,
    text: (value: TReadOnlyProperty<string>, width?: number, size?: number) => Node,
  ): Node[] {
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
        const current = new DerivedProperty([model.zProperty], (value) => value === z);
        owned.push(current);
        table.addChild(pick);
        table.addChild(
          new Rectangle(pick.bounds.dilated(CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_DILATION), {
            stroke: Colors.accentColorProperty,
            lineWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.BUILD_TABLE_LINE_WIDTH,
            pickable: false,
            visibleProperty: current,
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
    // The previewed element (hover/focus) or the current one.
    const shownZ = new DerivedProperty([previewZProperty, model.zProperty], (preview, z) => preview ?? z);
    const previewLabel = new DerivedProperty([shownZ, s.previewStringProperty], (z, pattern) =>
      StringUtils.fillIn(pattern, { species: species(z), z, subshell: SUBSHELLS[fillingSubshell(z)]?.name ?? "" }),
    );
    const observed = new ConfigurationNode(
      new DerivedProperty([shownZ], (z) => referenceCounts(z)),
      true,
      s.observedStringProperty,
    );
    const predicted = new ConfigurationNode(
      new DerivedProperty([shownZ], (z) => fillingPrediction(z)),
      true,
      s.predictedStringProperty,
    );
    const exception = text(
      s.exceptionStringProperty,
      TEXT_WIDTH,
      CONFIGURATION_SCREEN_VIEW_SETTINGS.EXCEPTION_TEXT_SIZE,
    );
    exception.visibleProperty = new DerivedProperty([shownZ], isFillingException);
    const core = new DerivedProperty([shownZ, s.coreStringProperty], (z, pattern) => {
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
          text(previewLabel, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_SIZE),
          observed,
          predicted,
          exception,
        ],
      }),
      text(core, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_SIZE_SEGMENT_2),
    ];
  }

  /** Configuration Detective: prompt, large answer tiles, and a progress row of stars. */
  private createDetective(
    model: ConfigurationModel,
    text: (value: TReadOnlyProperty<string>, width?: number, size?: number) => Node,
    button: (label: TReadOnlyProperty<string>, action: () => void) => Node,
  ): Node[] {
    const strings = StringManager.getInstance().getStrings(),
      s = strings.common;
    const prompt = new DerivedProperty(
      [
        model.challengeIndexProperty,
        strings.prompts.repairStringProperty,
        strings.prompts.moveStringProperty,
        strings.prompts.identifyStringProperty,
        strings.prompts.isoelectronicStringProperty,
        strings.prompts.classifyStringProperty,
      ],
      () => strings.prompts[`${model.challenge?.kind ?? "repair"}StringProperty`].value,
    );
    const tile = (content: Node, fill: TPaint, name: string | TReadOnlyProperty<string>, answer: number) =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        baseColor: fill,
        content,
        minWidth: CONFIGURATION_SCREEN_VIEW_SETTINGS.TILE_MIN_WIDTH,
        minHeight: CONFIGURATION_SCREEN_VIEW_SETTINGS.TILE_MIN_HEIGHT,
        accessibleName: name,
        listener: () => model.answer(answer),
      });
    const choices = new HBox({ spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHOICES_SPACING });
    model.challengeIndexProperty.link(() => {
      for (const child of choices.children.slice()) {
        child.disposeSubtree();
      }
      const c = model.challenge;
      if (c?.kind === "classify") {
        const label = (glyph: string, name: TReadOnlyProperty<string>) =>
          new HBox({
            spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.LABEL_SPACING,
            children: [
              new Text(glyph, {
                font: new PhetFont({ size: CONFIGURATION_SCREEN_VIEW_SETTINGS.LABEL_FONT_SIZE, weight: "bold" }),
                fill: Colors.controlSurfaceTextColorProperty,
              }),
              new RichText(name, {
                font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.LABEL_FONT_SIZE_SEGMENT_2),
                fill: Colors.controlSurfaceTextColorProperty,
                lineWrap: CONFIGURATION_SCREEN_VIEW_SETTINGS.LABEL_LINE_WRAP,
              }),
            ],
          });
        choices.children = [
          tile(
            label("✓", s.groundChoiceStringProperty),
            Colors.controlSurfaceColorProperty,
            s.groundChoiceStringProperty,
            0,
          ),
          tile(
            label("↗", s.higherChoiceStringProperty),
            Colors.controlSurfaceColorProperty,
            s.higherChoiceStringProperty,
            1,
          ),
        ];
      } else {
        choices.children = (c?.options ?? []).map((z) =>
          tile(
            new VBox({
              spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHOICES_SPACING_VARIANT_2,
              children: [
                new Text(String(z), {
                  font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.CHOICES_FONT_SIZE),
                  fill: Colors.controlSurfaceTextColorProperty,
                }),
                new Text(SYMBOLS[z - 1] ?? "", {
                  font: new PhetFont({
                    size: CONFIGURATION_SCREEN_VIEW_SETTINGS.CREATE_DETECTIVE_SIZE,
                    weight: "bold",
                  }),
                  fill: Colors.controlSurfaceTextColorProperty,
                }),
              ],
            }),
            // Neutral tiles: block colours would give the answer away (e.g. only Mg is in the s block).
            Colors.controlSurfaceColorProperty,
            SYMBOLS[z - 1] ?? "",
            z,
          ),
        );
      }
    });
    choices.visibleProperty = new DerivedProperty(
      [model.challengeIndexProperty],
      () => (model.challenge?.options?.length ?? 0) > 0 || model.challenge?.kind === "classify",
    );

    // Progress: a star per challenge, filled once solved; the current one is underlined.
    const stars = new HBox({ spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.STARS_SPACING, align: "bottom" });
    const progress = new DerivedProperty([model.solvedProperty, s.progressStringProperty], (solved, pattern) =>
      StringUtils.fillIn(pattern, { solved: solved.filter(Boolean).length, total: CHALLENGES.length }),
    );
    const updateStars = () => {
      for (const child of stars.children.slice()) {
        child.dispose();
      }
      stars.children = model.solvedProperty.value.map((solved, i) => {
        const star = new StarNode({
          value: solved ? 1 : 0,
          starShapeOptions: {
            outerRadius: CONFIGURATION_SCREEN_VIEW_SETTINGS.STAR_OUTER_RADIUS,
            innerRadius: CONFIGURATION_SCREEN_VIEW_SETTINGS.STAR_INNER_RADIUS,
          },
        });
        const underline = new Rectangle(
          0,
          0,
          CONFIGURATION_SCREEN_VIEW_SETTINGS.UNDERLINE_WIDTH,
          CONFIGURATION_SCREEN_VIEW_SETTINGS.UNDERLINE_HEIGHT,
          {
            fill: Colors.accentColorProperty,
            // Opacity, not visibility, so every star keeps the same footprint in the row.
            opacity: i === model.challengeIndexProperty.value ? 1 : 0,
          },
        );
        return new VBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.UPDATE_STARS_SPACING,
          children: [star, underline],
        });
      });
    };
    model.solvedProperty.link(updateStars);
    model.challengeIndexProperty.lazyLink(updateStars);
    const progressRow = new HBox({
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.PROGRESS_ROW_SPACING,
      children: [button(s.nextChallengeStringProperty, () => model.nextChallenge()), stars],
    });
    // The paragraph goes on the stars, not the row: a paragraph on a container that also holds a focusable
    // button desynchronizes scenery's PDOM tree when sibling content changes.
    stars.accessibleParagraph = progress;

    return [
      new VBox({
        align: "left",
        spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CREATE_DETECTIVE_SPACING,
        excludeInvisibleChildrenFromBounds: true,
        children: [text(prompt, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_SIZE_SEGMENT_3), choices],
      }),
      progressRow,
    ];
  }

  public override step(dt: number): void {
    for (const board of this.boards) {
      board.step(dt);
    }
  }
}

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
