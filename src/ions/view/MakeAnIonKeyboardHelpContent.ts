import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
export class MakeAnIonKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new ComboBoxKeyboardHelpSection()],
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
