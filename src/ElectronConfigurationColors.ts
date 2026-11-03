/**
 * ElectronConfigurationColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import ElectronConfigurationColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import ElectronConfigurationColors from "../../ElectronConfigurationColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: ElectronConfigurationColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the ElectronConfigurationColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import ElectronConfigurationNamespace from "./ElectronConfigurationNamespace.js";

const ElectronConfigurationColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(
    ElectronConfigurationNamespace,
    "controlSurfaceDisabled",
    {
      default: "#cccccc",
      projector: "#cccccc",
    },
  ),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Periodic-table blocks ────────────────────────────────────────────────────
  // Light tints for the s/p/d blocks on the Patterns screen. They sit behind dark
  // controlSurfaceText labels, so they stay light in both profiles.

  /** s-block element buttons (groups 1–2 and He). */
  sBlockColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "sBlock", {
    default: "#ffcf9e",
    projector: "#ffcf9e",
  }),

  /** p-block element buttons (groups 13–18). */
  pBlockColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "pBlock", {
    default: "#b9ecb0",
    projector: "#b9ecb0",
  }),

  /** d-block element buttons (Sc–Zn). */
  dBlockColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "dBlock", {
    default: "#a9cbff",
    projector: "#a9cbff",
  }),

  /** f-block element buttons (the lanthanide row, La–Lu). */
  fBlockColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "fBlock", {
    default: "#f4b6d2",
    projector: "#f4b6d2",
  }),

  // ── Feedback and particles ───────────────────────────────────────────────────
  // Drawn directly on the screen background, so projector values are darker for contrast on white.

  /** Subshell outline and status icon when a subshell matches the reference. */
  okColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "ok", {
    default: "#66d17a",
    projector: "#2e7d32",
  }),

  /** Subshell outline, status icon and Pauli flash when something is wrong. */
  faultColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "fault", {
    default: "#ff6b6b",
    projector: "#c62828",
  }),

  /** Neutral notice (Cr/Cu exception subshells, hovered element's filling subshell). */
  noteColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "note", {
    default: "#ffc35c",
    projector: "#e65100",
  }),

  /** Proton tally squares on Make an Ion. */
  protonColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "proton", {
    default: "#ff8a65",
    projector: "#d84315",
  }),

  /** Electron tally squares and shell-view dots. */
  electronColorProperty: new ProfileColorProperty(ElectronConfigurationNamespace, "electron", {
    default: "#4fc3f7",
    projector: "#0277bd",
  }),
};

export default ElectronConfigurationColors;
