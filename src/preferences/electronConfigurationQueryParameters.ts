/**
 * Sim-specific startup query parameters (public, for sharing links).
 *
 * Usage: `?maxZ=36` limits the sim to H–Kr (also available in Preferences → Simulation); `?z=26` starts the
 * neutral exploration screens at iron.
 */
import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import { ELECTRON_CONFIGURATION_QUERY_PARAMETERS_SETTINGS } from "../ElectronConfigurationConstants.js";
import ElectronConfigurationNamespace from "../ElectronConfigurationNamespace.js";

const electronConfigurationQueryParameters = QueryStringMachine.getAll({
  /** Starting element on Fill the Orbitals and Patterns in the Table (clamped to `maxZ`). */
  z: {
    type: "number",
    defaultValue: ELECTRON_CONFIGURATION_QUERY_PARAMETERS_SETTINGS.DEFAULT_Z,
    public: true,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 1 && value <= 86,
  },
  /** Last element offered: 36 (through Kr), 54 (through Xe) or 86 (through Rn, the default). */
  maxZ: {
    type: "number",
    defaultValue: ELECTRON_CONFIGURATION_QUERY_PARAMETERS_SETTINGS.DEFAULT_MAX_Z,
    validValues: [36, 54, 86],
    public: true,
  },
});

ElectronConfigurationNamespace.register("electronConfigurationQueryParameters", electronConfigurationQueryParameters);
logGlobal("phet.chipper.queryParameters");

export default electronConfigurationQueryParameters;
