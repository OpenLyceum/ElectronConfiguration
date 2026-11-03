/**
 * Preferences → Simulation: how much of the periodic table the sim offers. The dialog is always white, so
 * text uses the dark light-control-surface colour in both colour profiles.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { TableExtent } from "../common/model/TableExtent.js";
import ElectronConfigurationColors from "../ElectronConfigurationColors.js";
import { StringManager } from "../i18n/StringManager.js";
import type { ElectronConfigurationPreferencesModel } from "./ElectronConfigurationPreferencesModel.js";

export class ElectronConfigurationPreferencesNode extends VBox {
  public constructor(preferences: ElectronConfigurationPreferencesModel, _tandem?: Tandem) {
    const strings = StringManager.getInstance().getPreferences();
    const optionText = (text: TReadOnlyProperty<string>) =>
      new Text(text, {
        font: new PhetFont(14),
        fill: ElectronConfigurationColors.controlSurfaceTextColorProperty,
        maxWidth: 430,
      });
    const extentRadio = new AquaRadioButtonGroup(
      preferences.tableExtentProperty,
      [
        { value: TableExtent.KRYPTON, label: strings.throughKryptonStringProperty },
        { value: TableExtent.XENON, label: strings.throughXenonStringProperty },
        { value: TableExtent.RADON, label: strings.throughRadonStringProperty },
      ].map(({ value, label }) => ({ value, createNode: () => optionText(label), options: { accessibleName: label } })),
      {
        spacing: 6,
        radioButtonOptions: { radius: 7, selectedColor: ElectronConfigurationColors.controlSurfaceTextColorProperty },
        accessibleName: strings.tableExtentStringProperty,
      },
    );
    super({
      align: "left",
      spacing: 12,
      children: [
        new Text(strings.titleStringProperty, {
          font: new PhetFont({ size: 18, weight: "bold" }),
          fill: ElectronConfigurationColors.controlSurfaceTextColorProperty,
        }),
        new VBox({
          align: "left",
          spacing: 6,
          children: [optionText(strings.tableExtentStringProperty), new Node({ children: [extentRadio], x: 10 })],
        }),
        optionText(strings.noteStringProperty),
      ],
    });
  }
}
