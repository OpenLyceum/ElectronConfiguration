import { DerivedProperty, DynamicProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { ConfigurationModel, Message } from "../model/ConfigurationModel.js";
import { configuration, formatCharge, species, subshellCounts } from "../model/Configurations.js";

/** Model messages plus the screen-specific idle prompts that stand in for "ready". */
export type StatusKey = Message | "explore" | "ionReady" | "choose";
export function statusText(model: ConfigurationModel) {
  const strings = StringManager.getInstance().getStrings();
  // "ready" is the idle prompt; its wording depends on what the screen (or current challenge) asks for, so
  // screens without a Check button never invite the student to "check your prediction".
  const key = new DerivedProperty([model.messageProperty, model.challengeIndexProperty], (message): StatusKey => {
    if (message !== "ready") {
      return message;
    }
    if (model.kind === "patterns") {
      return "explore";
    }
    if (model.kind === "ions") {
      return "ionReady";
    }
    const challenge = model.kind === "detective" ? model.challenge?.kind : undefined;
    return challenge === "identify" || challenge === "isoelectronic" || challenge === "classify" ? "choose" : "ready";
  });
  const pattern = new DynamicProperty(key, {
    derive: (k: typeof key.value) => strings.messages[`${k}StringProperty`],
  });
  const property = new DerivedProperty(
    [pattern, model.countProperty, model.zProperty, model.chargeProperty],
    (p, count, z, q) => StringUtils.fillIn(p, { target: z - q, count }),
  );
  return {
    key: key as TReadOnlyProperty<StatusKey>,
    property,
    dispose: () => {
      property.dispose();
      pattern.dispose();
      key.dispose();
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
          charge: formatCharge(q),
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
