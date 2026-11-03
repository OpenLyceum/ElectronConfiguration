import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { Checkbox, NumberSpinner, RectangularPushButton } from "scenerystack/sun";
import Colors from "../../ElectronConfigurationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../ElectronConfigurationButtonOptions.js";
import type { ConfigurationModel } from "../model/ConfigurationModel.js";
import {
  configuration,
  fillingPrediction,
  IONS,
  ORBITALS,
  referenceCounts,
  referenceDiagram,
  SUBSHELLS,
  SYMBOLS,
  species,
  subshellCounts,
} from "../model/Configurations.js";
import { ConfigurationSummary, statusText } from "./ConfigurationSummary.js";
import { OrbitalBoardNode } from "./OrbitalBoardNode.js";
import { ResponsiveScreenView } from "./ResponsiveScreenView.js";

export class ConfigurationScreenView extends ResponsiveScreenView {
  public constructor(model: ConfigurationModel, options?: ScreenViewOptions) {
    super({ ...options, screenSummaryContent: new ConfigurationSummary(model) });
    const strings = StringManager.getInstance().getStrings(),
      s = strings.common;
    const text = (value: string | TReadOnlyProperty<string>, width = 350, size = 14) =>
      new RichText(value, {
        accessibleParagraph: value,
        font: new PhetFont(size),
        fill: Colors.textColorProperty,
        lineWrap: width,
        maxWidth: width,
      });
    const button = (label: TReadOnlyProperty<string>, action: () => void) =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        content: new RichText(label, {
          font: new PhetFont(13),
          fill: Colors.controlSurfaceTextColorProperty,
          maxWidth: 170,
        }),
        accessibleName: label,
        listener: action,
      });
    const spinner = (property: NumberProperty, name: TReadOnlyProperty<string>) =>
      new NumberSpinner(property, property.rangeProperty, {
        arrowsPosition: "leftRight",
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        numberDisplayOptions: { textOptions: { font: new PhetFont(15) }, minBackgroundWidth: 35 },
        accessibleName: name,
      });
    const title = text(strings.lessons[`${model.kind}StringProperty`], 350, 20);
    const elementControl = new HBox({
      spacing: 12,
      children: [text(s.elementStringProperty, 170), spinner(model.zProperty, s.elementStringProperty)],
    });
    elementControl.visible = model.kind === "fill" || model.kind === "patterns";
    const target = new DerivedProperty(
      [
        model.zProperty,
        model.chargeProperty,
        model.challengeIndexProperty,
        model.kind === "ions" ? s.currentStringProperty : s.targetStringProperty,
        s.unknownStringProperty,
      ],
      (z, q, _c, p, unknown) =>
        model.kind === "detective" && model.challenge?.kind === "identify"
          ? unknown
          : StringUtils.fillIn(p, { species: species(z, q), electrons: z - q }),
    );
    const selected = new DerivedProperty(
      [model.selectedProperty, model.detailsProperty, s.selectedStringProperty],
      (index, details, p) => {
        const orbital = ORBITALS[index];
        return StringUtils.fillIn(p, {
          orbital: orbital
            ? `${SUBSHELLS[orbital.subshell]?.name}, ${orbital.index + 1}${details ? ` · n=${orbital.n}, l=${orbital.l}, mₗ=${orbital.m}; mₛ=±½` : ""}`
            : "",
        });
      },
    );
    const board = new OrbitalBoardNode(model.diagramProperty, model.selectedProperty, model.kind === "ions");
    const editable = model.kind === "fill" || model.kind === "detective";
    const actions = new VBox({
      align: "left",
      spacing: 7,
      children: [
        new HBox({
          spacing: 8,
          children: [
            button(s.addUpStringProperty, () => model.add(1)),
            button(s.addDownStringProperty, () => model.add(2)),
            button(s.removeStringProperty, () => model.remove()),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            button(s.undoStringProperty, () => model.undo()),
            button(s.clearStringProperty, () => model.clear()),
            button(s.checkStringProperty, () => model.check()),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            button(s.nextElectronStringProperty, () => model.nextElectron()),
            button(s.groundStringProperty, () => model.showGround()),
          ],
        }),
      ],
    });
    if (model.kind === "detective") {
      model.challengeIndexProperty.link(() => {
        actions.visible = model.challenge?.kind === "repair";
      });
    } else {
      actions.visible = editable;
    }
    // Guided filling is for neutral construction only; repair challenges keep the reveal button but no next-electron shortcut.
    if (model.kind === "detective") {
      const last = actions.children[2];
      if (last) {
        const next = last.children[0];
        if (next) {
          next.visible = false;
        }
      }
    }
    const left = new VBox({
      align: "left",
      spacing: 10,
      children: [title, elementControl, text(target, 350), board, text(selected, 350, 12), actions],
      excludeInvisibleChildrenFromBounds: true,
      left: 20,
      top: 20,
    });
    const status = statusText(model);
    const statusNode = text(status.property, 350, 14);
    statusNode.accessibleParagraph = status.property;
    const full = new DerivedProperty(
      [model.diagramProperty, s.fullStringProperty],
      (d, label) => `${label}: ${configuration(subshellCounts(d))}`,
    );
    const shorthand = new DerivedProperty(
      [model.diagramProperty, s.shortStringProperty],
      (d, label) => `${label}: ${configuration(subshellCounts(d), true)}`,
    );
    const detailsControl = new Checkbox(model.detailsProperty, text(s.detailsStringProperty, 260), {
      accessibleName: s.detailsStringProperty,
      checkboxColor: Colors.textColorProperty,
    });
    const explanation = text(model.kind === "ions" ? s.ionRuleStringProperty : s.rulesStringProperty, 350, 13);
    const commonInfo = new VBox({
      align: "left",
      spacing: 10,
      children: [statusNode, text(full), text(shorthand), detailsControl, explanation],
    });
    const specific = new VBox({ align: "left", spacing: 12 });
    if (model.kind === "patterns") {
      const positions = SYMBOLS.map((_, i) => {
        const z = i + 1;
        if (z === 1) {
          return [0, 0];
        }
        if (z === 2) {
          return [17, 0];
        }
        if (z <= 10) {
          return [z <= 4 ? z - 3 : z + 7, 1];
        }
        if (z <= 18) {
          return [z <= 12 ? z - 11 : z - 1, 2];
        }
        return [z - 19, 3];
      });
      const table = new Node();
      SYMBOLS.forEach((symbol, i) => {
        const position = positions[i];
        if (!position) {
          return;
        }
        const pick = new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          content: new Text(symbol, { font: new PhetFont(11), fill: Colors.controlSurfaceTextColorProperty }),
          minWidth: 23,
          minHeight: 28,
          xMargin: 1,
          yMargin: 2,
          accessibleName: `${i + 1} ${symbol}`,
          listener: () => {
            model.zProperty.value = i + 1;
          },
        });
        pick.left = (position[0] ?? 0) * 26;
        pick.top = (position[1] ?? 0) * 32;
        table.addChild(pick);
      });
      const predicted = new DerivedProperty([model.zProperty, s.predictionStringProperty], (z, p) =>
        StringUtils.fillIn(p, { configuration: configuration(fillingPrediction(z), true) }),
      );
      const note = new DerivedProperty(
        [model.zProperty, s.exceptionStringProperty, s.sameStringProperty],
        (z, exception, same) => (z === 24 || z === 29 ? exception : same),
      );
      const core = new DerivedProperty([model.zProperty, s.coreStringProperty], (z, p) => {
        const counts = referenceCounts(z);
        let n = 0;
        counts.forEach((count, i) => {
          if (count > 0) {
            n = Math.max(n, SUBSHELLS[i]?.n ?? 0);
          }
        });
        const outer = counts.reduce((sum, c, i) => sum + ((SUBSHELLS[i]?.n ?? 0) === n ? c : 0), 0);
        return StringUtils.fillIn(p, { core: z - outer, outer });
      });
      specific.children = [
        table,
        text(core),
        text(s.transitionStringProperty, 350, 12),
        text(predicted, 350, 13),
        text(note, 350, 13),
      ];
    }
    if (model.kind === "ions") {
      const targetIon = new DerivedProperty([model.ionIndexProperty, s.ionStringProperty], (i, label) => {
        const ion = IONS[i];
        return `${label}: ${ion ? species(ion.z, ion.q) : ""}`;
      });
      const charge = new DerivedProperty([model.zProperty, model.chargeProperty, s.chargeStringProperty], (z, q, p) =>
        StringUtils.fillIn(p, { z, electrons: z - q, charge: q > 0 ? `+${q}` : q }),
      );
      const controls = new VBox({
        spacing: 8,
        align: "left",
        children: [
          text(targetIon),
          spinner(model.ionIndexProperty, s.ionStringProperty),
          new HBox({
            spacing: 8,
            children: [
              button(s.addElectronStringProperty, () => model.moveIon(-1)),
              button(s.loseElectronStringProperty, () => model.moveIon(1)),
            ],
          }),
          text(charge),
        ],
      });
      left.insertChild(2, controls);
      const neutral = new DerivedProperty([model.zProperty], (z) => referenceDiagram(z));
      specific.children = [
        text(s.neutralStringProperty),
        new OrbitalBoardNode(neutral, null, true),
        text(s.ionScopeStringProperty, 350, 12),
      ];
    }
    if (model.kind === "detective") {
      const prompt = new DynamicPrompt(model);
      specific.addChild(text(prompt.property));
      const choices = new VBox({ spacing: 10, align: "left" });
      const update = () => {
        for (const child of choices.children.slice()) {
          child.disposeSubtree();
        }
        choices.children = [];
        const c = model.challenge;
        if (!c) {
          return;
        }
        if (c.kind === "classify") {
          choices.children = [
            button(s.groundChoiceStringProperty, () => model.answer(0)),
            button(s.higherChoiceStringProperty, () => model.answer(1)),
          ];
        } else if (c.options) {
          choices.children = c.options.map(
            (z) =>
              new RectangularPushButton({
                ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
                content: new Text(SYMBOLS[z - 1] ?? "", {
                  font: new PhetFont(16),
                  fill: Colors.controlSurfaceTextColorProperty,
                }),
                accessibleName: SYMBOLS[z - 1] ?? "",
                listener: () => model.answer(z),
              }),
          );
        }
      };
      model.challengeIndexProperty.link(update);
      specific.addChild(choices);
      specific.addChild(button(s.nextChallengeStringProperty, () => model.nextChallenge()));
    }
    if (model.kind === "fill") {
      specific.children = [text(s.capacityStringProperty, 350, 13), text(s.helpStringProperty, 350, 13)];
    }
    const right = new VBox({ align: "left", spacing: 10, children: [specific, commonInfo], left: 510, top: 24 });
    const note = text(s.schematicStringProperty, 350, 11);
    right.addChild(note);
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => model.reset(),
      right: this.layoutBounds.maxX - 20,
      bottom: this.layoutBounds.maxY - 20,
    });
    left.left = 20;
    left.top = 20;
    right.top = 24;
    const content = new Node({ children: [left, right, reset] });
    this.addChild(content);
    this.pdomPlayAreaNode.pdomOrder = [left];
    this.pdomControlAreaNode.pdomOrder = [right, reset];
    this.setResponsiveContent(content, [
      [left],
      ...specific.children.map((child) => [child]),
      [commonInfo],
      [note],
      [reset],
    ]);
  }
}

// The challenge prompt remains localized when either its kind or the language changes.

class DynamicPrompt {
  public readonly property: TReadOnlyProperty<string>;
  public constructor(model: ConfigurationModel) {
    const strings = StringManager.getInstance().getStrings();
    this.property = new DerivedProperty(
      [
        model.challengeIndexProperty,
        strings.prompts.repairStringProperty,
        strings.prompts.identifyStringProperty,
        strings.prompts.isoelectronicStringProperty,
        strings.prompts.classifyStringProperty,
      ],
      () => strings.prompts[`${model.challenge?.kind ?? "repair"}StringProperty`].value,
    );
  }
}
