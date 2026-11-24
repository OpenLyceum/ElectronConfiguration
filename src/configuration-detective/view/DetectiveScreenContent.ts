/**
 * Configuration Detective — promptProperty, large answer tiles, and a progressProperty row of stars.
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, type Node, Rectangle, RichText, Text, type TPaint, VBox } from "scenerystack/scenery";
import { PhetFont, StarNode } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../common/ElectronConfigurationButtonOptions.js";
import type { ConfigurationModel } from "../../common/model/ConfigurationModel.js";
import { CHALLENGES, SYMBOLS } from "../../common/model/Configurations.js";
import type { ConfigurationScreenHelpers } from "../../common/view/ConfigurationScreenHelpers.js";
import Colors from "../../ElectronConfigurationColors.js";
import { CONFIGURATION_SCREEN_VIEW_SETTINGS } from "../../ElectronConfigurationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

const TEXT_WIDTH: number = CONFIGURATION_SCREEN_VIEW_SETTINGS.TEXT_WIDTH;

/** Right-column content for Configuration Detective. */
export const createDetectiveScreenContent = (
  model: ConfigurationModel,
  helpers: ConfigurationScreenHelpers,
): Node[] => {
  const { text, button } = helpers;
  const strings = StringManager.getInstance().getStrings(),
    s = strings.common;
  const promptProperty = new DerivedProperty(
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
              font: new PhetFont(CONFIGURATION_SCREEN_VIEW_SETTINGS.CHOICE_LABEL_FONT_SIZE),
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
            spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CHOICE_TILE_SPACING,
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
  const progressProperty = new DerivedProperty([model.solvedProperty, s.progressStringProperty], (solved, pattern) =>
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
  stars.accessibleParagraph = progressProperty;

  return [
    new VBox({
      align: "left",
      spacing: CONFIGURATION_SCREEN_VIEW_SETTINGS.CREATE_DETECTIVE_SPACING,
      excludeInvisibleChildrenFromBounds: true,
      children: [text(promptProperty, TEXT_WIDTH, CONFIGURATION_SCREEN_VIEW_SETTINGS.PROMPT_TEXT_SIZE), choices],
    }),
    progressRow,
  ];
};
