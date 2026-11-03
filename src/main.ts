/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { Property } from "scenerystack/axon";
import { HBox, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { ComboBox } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { ConfigurationDetectiveScreen } from "./configuration-detective/ConfigurationDetectiveScreen.js";
import ElectronConfigurationColors from "./ElectronConfigurationColors.js";
import { FillTheOrbitalsScreen } from "./fill-orbitals/FillTheOrbitalsScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { MakeAnIonScreen } from "./ions/MakeAnIonScreen.js";
import { PatternsInTheTableScreen } from "./periodic-patterns/PatternsInTheTableScreen.js";
import { ElectronConfigurationPreferencesModel } from "./preferences/ElectronConfigurationPreferencesModel.js";
import { ElectronConfigurationPreferencesNode } from "./preferences/ElectronConfigurationPreferencesNode.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from electronConfigurationQueryParameters.
  const simPreferences = new ElectronConfigurationPreferencesModel();

  const screens = [
    new FillTheOrbitalsScreen({
      name: stringManager.getScreenNames().fillOrbitalsStringProperty,
      tandem: Tandem.ROOT.createTandem("fillOrbitalsScreen"),
      backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
    }),
    new PatternsInTheTableScreen({
      name: stringManager.getScreenNames().periodicPatternsStringProperty,
      tandem: Tandem.ROOT.createTandem("periodicPatternsScreen"),
      backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
    }),
    new MakeAnIonScreen({
      name: stringManager.getScreenNames().ionsStringProperty,
      tandem: Tandem.ROOT.createTandem("ionsScreen"),
      backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
    }),
    new ConfigurationDetectiveScreen({
      name: stringManager.getScreenNames().configurationDetectiveStringProperty,
      tandem: Tandem.ROOT.createTandem("configurationDetectiveScreen"),
      backgroundColorProperty: ElectronConfigurationColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new ElectronConfigurationPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  // Full-size screen switching in portrait, after lazy screen views have initialized.
  let toolsReady = false;
  sim.screenBoundsProperty.lazyLink((bounds) => {
    if (!bounds || toolsReady) {
      return;
    }
    toolsReady = true;
    for (const screen of screens) {
      if (!sim.simScreens.includes(screen)) {
        continue;
      }
      const selected = new Property(sim.simScreens[0] ?? screen);
      sim.selectedScreenProperty.link((value) => {
        if (sim.simScreens.includes(value)) {
          selected.value = value;
        }
      });
      selected.lazyLink((value) => {
        sim.selectedScreenProperty.value = value;
      });
      const selector = new ComboBox(
        selected,
        sim.simScreens.map((value) => ({
          value,
          createNode: () =>
            new RichText(value.nameProperty, {
              font: new PhetFont(15),
              fill: ElectronConfigurationColors.controlSurfaceTextColorProperty,
              maxWidth: 280,
            }),
        })),
        screen.view,
        { accessibleName: stringManager.getStrings().common.mobile.screenStringProperty },
      );
      screen.view.setPortraitTools(new HBox({ children: [selector] }));
    }
  });
  sim.start();
});
