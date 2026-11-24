/**
 * ConfigurationScreenView — shared chrome for the four screens.
 *
 * Left: title (with an info button), screen controls, and the energy-staircase orbital diagram.
 * Right: screen-specific visuals (via per-screen content factories), a one-line status with
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
import { Circle, HBox, Node, RichText, Text, type TPaint, VBox } from "scenerystack/scenery";
import { InfoButton, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
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
import type { ConfigurationModel } from "../model/ConfigurationModel.js";
import { ORBITALS, SUBSHELLS, species, subshellCounts } from "../model/Configurations.js";
import { TableExtent } from "../model/TableExtent.js";
import { ConfigurationNode } from "./ConfigurationNode.js";
import type { ConfigurationScreenHelpers, ConfigurationScreenParts } from "./ConfigurationScreenHelpers.js";
import { ConfigurationSummary, type StatusKey, statusText } from "./ConfigurationSummary.js";
import { OrbitalBoardNode } from "./OrbitalBoardNode.js";
import { ResponsiveScreenView } from "./ResponsiveScreenView.js";
import { ShellNode } from "./ShellNode.js";

const LEFT = SCREEN_VIEW_MARGIN;
const RIGHT: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.RIGHT;
const TEXT_WIDTH: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_WIDTH;

const scaleToFit = (node: Node, width: number, height: number) =>
  node.setScaleMagnitude(Math.min(1, width / node.width, height / node.height));

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

  public constructor(model: ConfigurationModel, options?: ScreenViewOptions, parts: ConfigurationScreenParts = {}) {
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
    let board: OrbitalBoardNode | null = null;
    const helpers: ConfigurationScreenHelpers = {
      text,
      button,
      spinner,
      getBoard: () => board,
      previewZProperty,
    };

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
    const targetProperty = new DerivedProperty(
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
    const highlightProperty = parts.createHighlightProperty?.(previewZProperty, model.zProperty) ?? null;
    const editing = model.kind === "fill" || model.kind === "detective";
    // The diagram is rebuilt when the table extent changes: more subshells (and an f column) through Rn.
    // Detective challenges all sit within H–Kr, so its diagram keeps the krypton layout.
    // The +Z nucleus label would give away an identify challenge.
    const nucleusZProperty = new DerivedProperty([model.zProperty, model.identityHiddenProperty], (z, hidden) =>
      hidden ? null : z,
    );
    const boardSlot = new Node();
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
        nucleusZProperty,
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
        trayNode: parts.createTrayNode?.(model) ?? null,
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
    const selectedLabelProperty = new DerivedProperty(
      [model.selectedProperty, s.selectedStringProperty],
      (index, pattern) => {
        const orbital = ORBITALS[index];
        return StringUtils.fillIn(pattern, {
          orbital: orbital
            ? `${SUBSHELLS[orbital.subshell]?.name}, ${orbital.index + 1} · n=${orbital.n}, l=${orbital.l}, mₗ=${orbital.m}; mₛ=±½`
            : "",
        });
      },
    );
    const selectedNode = text(selectedLabelProperty, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.SELECTED_NODE_SIZE);
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
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.ACTION_ROW_SPACING,
          children: actionButtons.slice(0, 3),
        }),
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.ACTION_ROW_SPACING,
          children: actionButtons.slice(3),
        }),
      ],
    });
    actions.visibleProperty = editableProperty;

    const leftChildren: Node[] = [
      title,
      ...(parts.createLeftControls?.(model, helpers) ?? []),
      text(targetProperty, TEXT_WIDTH),
      boardSlot,
      selectedNode,
      actions,
    ];
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
    status.keyProperty.link((key) => {
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
    const countsProperty = new DerivedProperty([model.diagramProperty], (d) => subshellCounts(d));
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
    const showChips = parts.showConfigurationChips !== false;
    const commonInfo = new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.COMMON_INFO_SPACING,
      children: [
        statusNode,
        ...(showChips ? [fullNode, shortNode] : []),
        new HBox({
          spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.DETAILS_SHELLS_ROW_SPACING,
          children: [detailsControl, shellsControl],
        }),
      ],
    });

    // ── Screen-specific visuals ─────────────────────────────────────────────
    const specific = new VBox({ align: "left", spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.SPECIFIC_SPACING });
    specific.children = parts.createSpecific?.(model, helpers) ?? [];

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

  public override step(dt: number): void {
    for (const board of this.boards) {
      board.step(dt);
    }
  }
}
