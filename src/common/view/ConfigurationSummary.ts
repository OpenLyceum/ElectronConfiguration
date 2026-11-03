import { DerivedProperty, DynamicProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { ConfigurationModel } from "../model/ConfigurationModel.js";
import { configuration, species, subshellCounts } from "../model/Configurations.js";
export function statusText(model: ConfigurationModel) {
  const strings = StringManager.getInstance().getStrings();
  const pattern = new DynamicProperty(model.messageProperty, {
    derive: (key: typeof model.messageProperty.value) => strings.messages[`${key}StringProperty`],
  });
  const property = new DerivedProperty(
    [pattern, model.countProperty, model.zProperty, model.chargeProperty],
    (p, count, z, q) => StringUtils.fillIn(p, { target: z - q, count }),
  );
  return {
    property,
    dispose: () => {
      property.dispose();
      pattern.dispose();
    },
  };
}
export class ConfigurationSummary extends ScreenSummaryContent {
  private readonly details: TReadOnlyProperty<string>;
  private readonly status: ReturnType<typeof statusText>;
  public constructor(model: ConfigurationModel) {
    const s = StringManager.getInstance().getStrings();
    const status = statusText(model);
    const details = new DerivedProperty(
      [
        model.zProperty,
        model.chargeProperty,
        model.countProperty,
        model.diagramProperty,
        status.property,
        s.a11y.detailsStringProperty,
        s.common.unknownStringProperty,
        model.challengeIndexProperty,
      ],
      (z, q, count, diagram, feedback, pattern, unknown) => {
        const hidden = model.kind === "detective" && model.challenge?.kind === "identify";
        return StringUtils.fillIn(pattern, {
          species: hidden ? unknown : species(z, q),
          z: hidden ? "?" : z,
          charge: q,
          count,
          configuration: configuration(subshellCounts(diagram)),
          status: feedback,
        });
      },
    );
    super({
      playAreaContent: s.a11y.playStringProperty,
      controlAreaContent: s.a11y.controlsStringProperty,
      currentDetailsContent: details,
      interactionHintContent: model.kind === "fill" ? s.common.helpStringProperty : s.a11y.controlsStringProperty,
    });
    this.details = details;
    this.status = status;
  }
  public override dispose(): void {
    this.setPlayAreaContent(null);
    this.setControlAreaContent(null);
    this.setCurrentDetailsContent(null);
    this.setInteractionHintContent(null);
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
    this.details.dispose();
    this.status.dispose();
  }
}
