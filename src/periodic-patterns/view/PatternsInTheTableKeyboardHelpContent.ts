import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
export class PatternsInTheTableKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new ComboBoxKeyboardHelpSection()],
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
