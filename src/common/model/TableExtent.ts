/**
 * TableExtent.ts
 *
 * How much of the periodic table the sim offers (a preference, as in PeriodicTrends): through krypton
 * (Z = 1–36, the usual first-semester scope), through xenon (1–54, adding the second transition series),
 * or through radon (1–86, adding the lanthanides and the third transition series). It bounds the element
 * spinner, the periodic table, the curated ions, and how many subshells the orbital diagram draws.
 */
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { fillingPrediction, ionsThrough, SUBSHELLS } from "./Configurations.js";

export class TableExtent extends EnumerationValue {
  public static readonly KRYPTON = new TableExtent(36);
  public static readonly XENON = new TableExtent(54);
  public static readonly RADON = new TableExtent(86);

  public static readonly enumeration = new Enumeration(TableExtent);

  /** Last element offered. */
  public readonly maxZ: number;
  /**
   * Subshells the orbital diagram draws, from 1s: those the last element fills, plus one more so a
   * promoted electron has somewhere to go (through 5s for Kr, 6s for Xe, 7s for Rn).
   */
  public readonly levels: number;
  /** Number of curated ions available (a prefix of IONS). */
  public readonly ionCount: number;

  public constructor(maxZ: number) {
    super();
    this.maxZ = maxZ;
    const lastFilled = fillingPrediction(maxZ).reduce((last, count, i) => (count > 0 ? i : last), 0);
    this.levels = Math.min(SUBSHELLS.length, lastFilled + 2);
    this.ionCount = ionsThrough(maxZ).length;
  }

  /** The extent whose last element is `maxZ`, or radon when none matches. */
  public static fromMaxZ(maxZ: number): TableExtent {
    return TableExtent.enumeration.values.find((extent) => extent.maxZ === maxZ) ?? TableExtent.RADON;
  }
}
