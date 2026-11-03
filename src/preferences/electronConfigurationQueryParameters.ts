/**
 * Sim-specific startup query parameters (public, for sharing links).
 *
 * Usage: `?maxZ=36` limits the sim to H–Kr (also available in Preferences → Simulation); `?z=26` starts the
 * neutral exploration screens at iron.
 */
import { QueryStringMachine } from "scenerystack/query-string-machine";
export default QueryStringMachine.getAll({
  /** Starting element on Fill the Orbitals and Patterns in the Table (clamped to `maxZ`). */
  z: {
    type: "number",
    defaultValue: 6,
    public: true,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 1 && value <= 86,
  },
  /** Last element offered: 36 (through Kr), 54 (through Xe) or 86 (through Rn, the default). */
  maxZ: {
    type: "number",
    defaultValue: 86,
    validValues: [36, 54, 86],
    public: true,
  },
});
