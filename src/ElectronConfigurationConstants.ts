/**
 * ElectronConfigurationConstants.ts
 *
 * Named layout constants shared across the simulation. Colour strings live in
 * ElectronConfigurationColors.ts, not here.
 */

import ElectronConfigurationNamespace from "./ElectronConfigurationNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

ElectronConfigurationNamespace.register("ElectronConfigurationConstants", {
  SCREEN_VIEW_MARGIN,
});
