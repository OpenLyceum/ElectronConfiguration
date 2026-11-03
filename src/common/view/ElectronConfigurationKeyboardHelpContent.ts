/**
 * Keyboard help shared by all screens: the orbital-diagram keys, then spinner, combo box and basic actions.
 */
import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  LetterKeyNode,
  SpinnerControlsKeyboardHelpSection,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class ElectronConfigurationKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const k = StringManager.getInstance().getStrings().keyboard;
    const orbitals = new KeyboardHelpSection(k.headingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        k.cycleStringProperty,
        KeyboardHelpIconFactory.iconOrIcon(TextKeyNode.space(), TextKeyNode.enter()),
      ),
      KeyboardHelpSectionRow.labelWithIcon(k.upStringProperty, new LetterKeyNode("U")),
      KeyboardHelpSectionRow.labelWithIcon(k.downStringProperty, LetterKeyNode.d()),
      KeyboardHelpSectionRow.labelWithIcon(
        k.removeStringProperty,
        KeyboardHelpIconFactory.iconOrIcon(TextKeyNode.delete(), TextKeyNode.backspace()),
      ),
    ]);
    super(
      [orbitals, new SpinnerControlsKeyboardHelpSection()],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
