/**
 * Shared factories and content-part hooks used by ConfigurationScreenView and per-screen content modules.
 */
import type { NumberProperty, Property, TReadOnlyProperty } from "scenerystack/axon";
import type { Node, RichText, TPaint } from "scenerystack/scenery";
import type { RectangularPushButton } from "scenerystack/sun";
import type { ConfigurationModel } from "../model/ConfigurationModel.js";
import type { OrbitalBoardNode } from "./OrbitalBoardNode.js";

type HighlightProperty = TReadOnlyProperty<number | null>;

export type TextFactory = (value: string | TReadOnlyProperty<string>, width?: number, size?: number) => RichText;

export type ButtonFactory = (
  label: TReadOnlyProperty<string>,
  action: () => void,
  baseColor?: TPaint,
) => RectangularPushButton;

export type SpinnerFactory = (
  property: NumberProperty,
  name: TReadOnlyProperty<string>,
  format?: ((value: number) => string) | null,
) => Node;

/** Helpers passed into screen-specific content builders. */
export type ConfigurationScreenHelpers = {
  text: TextFactory;
  button: ButtonFactory;
  spinner: SpinnerFactory;
  /** Current orbital board (null until the first build). */
  getBoard: () => OrbitalBoardNode | null;
  /** Patterns hover preview; other screens ignore it. */
  previewZProperty: Property<number | null>;
};

/**
 * Optional per-screen composition hooks. Wrappers pass these instead of relying on empty
 * `extends ConfigurationScreenView` subclasses that switch on `model.kind` for UI.
 */
export type ConfigurationScreenParts = {
  /** Controls inserted on the left after the title (element/ion pickers, ion step buttons). */
  createLeftControls?: (model: ConfigurationModel, helpers: ConfigurationScreenHelpers) => Node[];
  /** Right-column screen-specific visuals (table, charge tally, challenge tiles). */
  createSpecific?: (model: ConfigurationModel, helpers: ConfigurationScreenHelpers) => Node[];
  /** Replaces the spin tray on the orbital board (ions surroundings). */
  createTrayNode?: (model: ConfigurationModel) => Node | null;
  /** Board subshell highlight (Patterns: the shell being filled under hover/current Z). */
  createHighlightProperty?: (
    previewZProperty: Property<number | null>,
    zProperty: NumberProperty,
  ) => HighlightProperty | null;
  /** When false, hide the full/short configuration chips (Patterns shows its own). Default true. */
  showConfigurationChips?: boolean;
};
