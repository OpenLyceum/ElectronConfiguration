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

/** Settings for common/ElectronConfigurationControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ELECTRON_CONFIGURATION_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** Electron configuration number control options scale (dimensionless). */
  ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  ELECTRON_CONFIGURATION_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  ELECTRON_CONFIGURATION_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/ElectronConfigurationScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ELECTRON_CONFIGURATION_SCREEN_ICONS_SETTINGS = {
  CONTENT_WIDTH: 548,
  CONTENT_HEIGHT: 373,
  BOX_Y: 110,
  BOX_WIDTH: 130,
  BOX_HEIGHT: 150,
  BOX_LINE_WIDTH: 5,
  GLYPH_FONT_SIZE: 65,
  MAKE_ICON_FONT_SIZE: 40,
  MAKE_ICON_CENTER_X: 274,
  MAKE_ICON_TOP: 285,
} as const;

/** Settings for common/model/ConfigurationModel.ts. */
export const CONFIGURATION_MODEL_SETTINGS = {
  /** Seconds per element while stepping through the table, and the longer pause on Cr and Cu. */
  AUTOPLAY_STEP: 0.9,
  /** Seconds per element while stepping through the table, and the longer pause on Cr and Cu. */
  AUTOPLAY_EXCEPTION_PAUSE: 2.6,
} as const;

/** Settings for common/model/Configurations.ts. */
export const CONFIGURATIONS_SETTINGS = {
  /** Last element with reference data. */
  MAX_Z: 86,
  /** La–Lu are drawn in a detached row under period 6, starting under group 3. */
  FIRST_LANTHANIDE: 57,
  /** La–Lu are drawn in a detached row under period 6, starting under group 3. */
  LAST_LANTHANIDE: 71,
} as const;

/** Settings for common/view/ChargeTallyNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CHARGE_TALLY_NODE_SETTINGS = {
  SQUARE: 6,
  GAP: 1.5,
  PER_GROUP: 5,
  /** Squares per row before wrapping (Pb has 82 protons). */
  PER_ROW: 30,
  LABEL_OPTIONS_FONT_SIZE: 13,
  LABEL_OPTIONS_MAX_WIDTH: 90,
  NET_TEXT_FONT_SIZE: 17,
  NET_TEXT_MAX_WIDTH: 360,
  ROW_SPACING: 8,
  SPACING: 6,
} as const;

/** Settings for common/view/ConfigurationNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CONFIGURATION_NODE_SETTINGS = {
  FONT_FONT_SIZE: 15,
  BACKGROUND_CORNER_X: 5,
  BACKGROUND_CORNER_Y: 5,
  DEFAULT_WRAP_WIDTH: 320,
  CHIPS_SPACING: 4,
  LABEL_FONT_SIZE: 13,
  LABEL_MAX_WIDTH: 140,
  SPACING: 8,
} as const;

/** Settings for common/view/ConfigurationScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CONFIGURATION_SCREEN_VIEW_SETTINGS = {
  TITLE_WIDTH: 380, // px
  TITLE_SIZE: 20, // px
  SELECTED_NODE_SIZE: 13, // px
  ELEMENT_TEXT_WIDTH: 170, // px
  ION_TEXT_WIDTH: 170, // px
  SPACING: 8, // px
  PROPERTY_TEXT_WIDTH: 410, // px
  PROPERTY_TEXT_SIZE: 14, // px
  DETAILS_TEXT_WIDTH: 180, // px
  DETAILS_TEXT_SIZE: 13, // px
  SHELLS_TEXT_WIDTH: 200, // px
  SHELLS_TEXT_SIZE: 13, // px
  SCALE_TO_FIT_WIDTH: 260, // px
  SCALE_TO_FIT_HEIGHT: 190, // px
  SPECIFIC_FONT_SIZE: 13, // px
  BUILD_TABLE_DILATION: 2, // px
  LEGEND_FONT_SIZE: 12, // px
  EXCEPTION_TEXT_SIZE: 13, // px
  TEXT_SIZE: 14, // px
  CORE_TEXT_SIZE: 13, // px
  CHOICE_LABEL_FONT_SIZE: 13, // px
  CHOICE_TILE_SPACING: 2, // px
  CHOICES_FONT_SIZE: 11, // px
  STAR_OUTER_RADIUS: 10, // px
  STAR_INNER_RADIUS: 5, // px
  PROMPT_TEXT_SIZE: 15, // px
  SURROUNDINGS_LABEL_FONT_SIZE: 12, // px
  DOTS_RADIUS: 5, // px

  INFO_BUTTON_LINE_WRAP: 560, // px
  INFO_BUTTON_SIZE: 20, // px
  ACTION_ROW_SPACING: 8, // px
  DETAILS_SHELLS_ROW_SPACING: 20, // px
  BUILD_TABLE_LEFT_FACTOR: 26, // dimensionless
  BUILD_TABLE_SPACING: 5, // px
  LABEL_LINE_WRAP: 130, // px
  CREATE_DETECTIVE_SIZE: 24, // px
  UPDATE_STARS_SPACING: 3, // px
  FRAME_LINE_DASH_DASH: 4, // px
  FRAME_LINE_DASH_GAP: 3, // px

  RIGHT: 510,
  TEXT_WIDTH: 440,
  DEFAULT_SIZE: 14,
  BUTTON_FONT_SIZE: 13,
  BUTTON_MAX_WIDTH: 240,
  SPINNER_FONT_SIZE: 15,
  /** Info button scale (dimensionless). */
  INFO_BUTTON_SCALE: 0.42,
  INFO_BUTTON_SPACING: 12,
  INFO_BUTTON_FONT_SIZE: 15,
  TITLE_SPACING: 10,
  ACTIONS_SPACING: 6,
  SPINNER_ROW_SPACING: 12,
  LEFT_SPACING: 8,
  LEFT_TOP: 14,
  CHILDREN_RADIUS: 11,
  CHILDREN_FONT_SIZE: 15,
  STATUS_NODE_SPACING: 8,
  CHECKBOX_OPTIONS_BOX_WIDTH: 16,
  COMMON_INFO_SPACING: 9,
  SPECIFIC_SPACING: 10,
  CHILDREN_SPACING: 4,
  RIGHT_SPACING: 14,
  RIGHT_TOP: 16,
  LEGEND_SPACING: 14,
  PICK_FONT_SIZE: 11,
  PICK_MIN_WIDTH: 23,
  BUILD_TABLE_LINE_WIDTH: 2.5,
  PLACEHOLDER_WIDTH: 23,
  PLACEHOLDER_CORNER_X: 3,
  PLACEHOLDER_CORNER_Y: 3,
  /** Placeholder opacity (dimensionless). */
  PLACEHOLDER_OPACITY: 0.5,
  BUILD_TABLE_FONT_SIZE: 7,
  BUILD_TABLE_MAX_WIDTH: 21,
  CHILDREN_WIDTH: 14,
  CHILDREN_HEIGHT: 14,
  CHILDREN_CORNER_X: 3,
  CHILDREN_CORNER_Y: 3,
  CHILDREN_MAX_WIDTH: 90,
  AUTOPLAY_SPACING: 8,
  AUTOPLAY_RADIUS: 15,
  AUTOPLAY_FONT_SIZE: 13,
  AUTOPLAY_MAX_WIDTH: 200,
  CREATE_PATTERNS_SPACING: 6,
  TILE_MIN_WIDTH: 64,
  TILE_MIN_HEIGHT: 64,
  CHOICES_SPACING: 12,
  LABEL_SPACING: 8,
  LABEL_FONT_SIZE: 26,
  STARS_SPACING: 4,
  UNDERLINE_WIDTH: 18,
  UNDERLINE_HEIGHT: 3,
  PROGRESS_ROW_SPACING: 14,
  CREATE_DETECTIVE_SPACING: 10,
  DOTS_SPACING: 3,
  FRAME_WIDTH: 170,
  FRAME_HEIGHT: 26,
  FRAME_CORNER_X: 6,
  FRAME_CORNER_Y: 6,
  LABEL_MAX_WIDTH: 90,
  ROW_SPACING: 8,
  LEFT_LEFT: 8,
  /** Largest board size (width, height) per screen kind before scale-to-fit (px). */
  BOARD_AREA: {
    fill: [470, 400],
    patterns: [470, 440],
    ions: [470, 380],
    detective: [470, 420],
  },
} as const;

/** Settings for common/view/OrbitalBoardNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITAL_BOARD_NODE_SETTINGS = {
  UP_ARROW_X_OFFSET: -6, // px
  DOWN_ARROW_X_OFFSET: 6, // px
  MARKS_X_DILATION: 5, // px
  MARKS_Y_DILATION: 4, // px
  ON_HIGHLIGHT_X_DILATION: 7, // px
  ON_HIGHLIGHT_Y_DILATION: 6, // px
  DILATED_DILATION: 4, // px

  SHOW_CENTER_X_FACTOR: 3, // dimensionless
  SHOW_CENTER_X_OFFSET: 6, // px
  AXIS_LABEL_MAX_WIDTH_FACTOR: 0.6, // dimensionless
  AXIS_LABEL_RIGHT_GAP: 4, // px
  ON_MARKS_LINE_DASH_DASH: 6, // px
  ON_MARKS_LINE_DASH_GAP: 4, // px
  CREATE_SPIN_TRAY_LEFT_OFFSET: 14, // px
  SHAKE_X_FACTOR: 5, // dimensionless

  BOX_WIDTH: 32,
  BOX_HEIGHT: 30,
  BOX_SPACING: 4,
  LEVEL_HEIGHT: 38,
  AXIS_X: 8,
  ARROW_FONT_SIZE: 20,
  /** Left edge of the s, p, d and f columns (px). */
  COLUMN_X: [44, 112, 236, 448],
  /** Pointer move (px) before a press counts as a drag. */
  DRAG_THRESHOLD: 6,
  /** Duration of the Pauli-violation shake animation (s). */
  SHAKE_TIME: 0.4,
  /** Duration of the arrow pop animation (s). */
  POP_TIME: 0.25,
  /** Duration of the electron fly-to-box animation (s). */
  FLY_TIME: 0.55,
  BACKGROUND_CORNER_X: 4,
  BACKGROUND_CORNER_Y: 4,
  AXIS_END_Y: -4,
  AXIS_HEAD_HEIGHT: 9,
  AXIS_HEAD_WIDTH: 9,
  AXIS_TAIL_WIDTH: 2,
  AXIS_LABEL_FONT_SIZE: 11,
  SUBSHELL_LABEL_FONT_SIZE: 13,
  TRACK_HEIGHT: 3,
  FILL_HEIGHT: 3,
  CHILDREN_Y: 6,
  CHILDREN_WIDTH: 6,
  CHILDREN_LINE_WIDTH: 3,
  GLOW_CORNER_X: 6,
  GLOW_CORNER_Y: 6,
  /** Glow opacity (dimensionless). */
  GLOW_OPACITY: 0.35,
  OUTLINE_X: -3,
  OUTLINE_Y: -3,
  OUTLINE_CORNER_X: 6,
  OUTLINE_CORNER_Y: 6,
  OUTLINE_LINE_WIDTH: 2,
  /** Opacity of the orbital box while its electron is being dragged (dimensionless). */
  DRAG_PREVIEW_OPACITY: 0.3,
  NODE_RADIUS: 17,
  NODE_LINE_WIDTH: 2,
  NODE_MIN_X: -17,
  NODE_MIN_Y: -17,
  NODE_MAX_X: 17,
  NODE_MAX_Y: 17,
  LABEL_FONT_SIZE: 12,
  LABEL_MAX_WIDTH: 170,
  TRAY_SPACING: 6,
  FLASH_CORNER_X: 4,
  FLASH_CORNER_Y: 4,
  TOKEN_RADIUS: 12,
  /** Token opacity (dimensionless). */
  TOKEN_OPACITY: 0.35,
  TOKEN_MIN_X: -12,
  TOKEN_MIN_Y: -12,
  TOKEN_MAX_X: 12,
  TOKEN_MAX_Y: 12,
} as const;

/** Settings for common/view/ResponsiveScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RESPONSIVE_SCREEN_VIEW_SETTINGS = {
  DIMENSION2_WIDTH: 24, // px
  DIMENSION2_HEIGHT: 40, // px

  LAYOUT_CENTER_X_OFFSET: 16, // px

  PORTRAIT_WIDTH: 400,
  MARGIN: 16,
  CONTENT_WIDTH: 350,
  SECTION_GAP: 24,
  SCROLL_MARGIN: 12,
  SCROLL_BAR_WIDTH: 3,
  SCROLL_BAR_HEIGHT: 200,
  /** Scroll bar keyboard step (dimensionless). */
  SCROLL_BAR_KEYBOARD_STEP: 0.06,
  /** Scroll bar shift keyboard step (dimensionless). */
  SCROLL_BAR_SHIFT_KEYBOARD_STEP: 0.015,
} as const;

/** Settings for common/view/ShellNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SHELL_NODE_SETTINGS = {
  MULTILINK_BOTTOM_OFFSET: 3, // px
  MULTILINK_SIZE: 13, // px

  NUCLEUS_RADIUS: 18,
  RING_SPACING: 17,
  ELECTRON_RADIUS: 3.5,
  /** Highest shell any configuration through Rn (plus a promoted 7s electron) can reach. */
  MAX_N: 7,
  DEFAULT_MAX_N: 5,
  CAPTION_FONT_SIZE: 10,
  SPACING: 4,
  MULTILINK_LINE_WIDTH: 1.5,
  MULTILINK_FONT_SIZE: 9,
} as const;

/** Settings for preferences/ElectronConfigurationPreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ELECTRON_CONFIGURATION_PREFERENCES_NODE_SETTINGS = {
  ITEM_2_SPACING: 6, // px

  OPTION_TEXT_FONT_SIZE: 14,
  OPTION_TEXT_MAX_WIDTH: 430,
  EXTENT_RADIO_SPACING: 6,
  EXTENT_RADIO_RADIUS: 7,
  SPACING: 12,
  TITLE_FONT_SIZE: 18,
  RADIO_INDENT_X: 10,
} as const;

/** Defaults for public query parameters `z` and `maxZ`. */
export const ELECTRON_CONFIGURATION_QUERY_PARAMETERS_SETTINGS = {
  /** Starting atomic number on Fill the Orbitals and Patterns in the Table. */
  DEFAULT_Z: 6,
  /** Default last element offered (Rn). */
  DEFAULT_MAX_Z: 86,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const MAIN_SETTINGS = {
  SELECTOR_FONT_SIZE: 15, // px
  SELECTOR_MAX_WIDTH: 280, // px
} as const;

ElectronConfigurationNamespace.register("ElectronConfigurationConstants", {
  SCREEN_VIEW_MARGIN,
});
