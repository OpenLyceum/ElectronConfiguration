import { ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS } from "../ElectronConfigurationConstants.js";
/**
 * ElectronConfigurationControlOptions.ts
 *
 * Shared sizing and layout for panel controls (sliders, checkboxes, NumberControls).
 * Import these instead of repeating scale / track-size values in each screen view.
 *
 * Template-owned toolkit: each sim uses only some of these, so every export is tagged
 * `@public` to tell dead-code checkers (knip) that an unused one is not dead code.
 */

import { Dimension2 } from "scenerystack/dot";
import { NumberControl } from "scenerystack/scenery-phet";
import type { CheckboxOptions, HSliderOptions } from "scenerystack/sun";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "./ElectronConfigurationButtonOptions.js";

const SLIDER_THUMB_SIZE = new Dimension2(
  ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.SLIDER_THUMB_SIZE_WIDTH,
  ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.SLIDER_THUMB_SIZE_HEIGHT,
);
const STANDALONE_SLIDER_TRACK_SIZE = new Dimension2(
  ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.STANDALONE_SLIDER_TRACK_SIZE_WIDTH,
  ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.STANDALONE_SLIDER_TRACK_SIZE_HEIGHT,
);
const NUMBER_CONTROL_SLIDER_TRACK_SIZE = new Dimension2(
  ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH,
  ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT,
);
const CHECKBOX_BOX_WIDTH: number = ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.CHECKBOX_BOX_WIDTH;

/** Options for standalone HSlider instances in control panels. @public */
export const ELECTRON_CONFIGURATION_SLIDER_OPTIONS = {
  trackSize: STANDALONE_SLIDER_TRACK_SIZE,
  thumbSize: SLIDER_THUMB_SIZE,
  trackFillEnabled: ElectronConfigurationColors.textColorProperty,
} satisfies HSliderOptions;

/** Base NumberControl options; spread into each instance and add titleNodeOptions as needed. @public */
export const ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS = {
  arrowButtonOptions: {
    ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
    scale: ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_SCALE,
  },
  layoutFunction: NumberControl.createLayoutFunction4({
    sliderPadding:
      ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING,
    arrowButtonSpacing:
      ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING,
    verticalSpacing:
      ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING,
  }),
  sliderOptions: {
    trackSize: NUMBER_CONTROL_SLIDER_TRACK_SIZE,
    thumbSize: SLIDER_THUMB_SIZE,
    trackFillEnabled: ElectronConfigurationColors.textColorProperty,
  },
};

/**
 * Themed checkbox chrome on dark panel backgrounds.
 *
 * The box fill matches the panel so the control reads as part of the panel, and
 * the tick/border use {@link ElectronConfigurationColors.textColorProperty} (near-white in default
 * mode). Do not use {@link ElectronConfigurationColors.controlSurfaceColorProperty} here — that
 * colour is for white chrome (push buttons, combo lists, Preferences).
 *
 * @public
 */
export const ELECTRON_CONFIGURATION_CHECKBOX_OPTIONS = {
  boxWidth: CHECKBOX_BOX_WIDTH,
  spacing: ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS.ELECTRON_CONFIGURATION_CHECKBOX_OPTIONS_SPACING,
  checkboxColor: ElectronConfigurationColors.textColorProperty,
  checkboxColorBackground: ElectronConfigurationColors.panelBackgroundColorProperty,
} satisfies CheckboxOptions;
