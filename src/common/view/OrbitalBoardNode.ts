/**
 * OrbitalBoardNode — the orbital diagram drawn as a schematic energy staircase.
 *
 * Subshells sit at increasing heights in filling order (1s at the bottom, 4s just below 3d), in columns by
 * l (s, p, d), so the filling order is visible without text. Boxes are tinted by block, with a capacity
 * bar under each subshell.
 *
 * Editing (Fill the Orbitals, Detective repair/move): click a box to cycle empty → ↑ → ↑↓ → empty; drag
 * ↑/↓ from the tray onto a box; drag an arrow to another box, or off the diagram to remove it. Keyboard:
 * Space/Enter cycles, U adds ↑, D adds ↓, Delete/Backspace removes. Read-only boards still let a box be
 * selected so its quantum numbers can be shown.
 *
 * Feedback is drawn on the diagram: Pauli rejections shake the box, newly placed arrows pop in, and
 * per-subshell marks (after Check, or the Cr/Cu note) outline the subshell.
 */
import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, DragListener, KeyboardListener, Node, Rectangle, Text, type TPaint, VBox } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import Colors from "../../ElectronConfigurationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ConfigurationModel, Spin } from "../model/ConfigurationModel.js";
import {
  configuration,
  type Diagram,
  ORBITALS,
  SUBSHELL_ORBITALS,
  SUBSHELLS,
  type SubshellMark,
  subshellCounts,
} from "../model/Configurations.js";

const BOX_WIDTH = 32;
const BOX_HEIGHT = 30;
const BOX_SPACING = 4;
const LEVEL_HEIGHT = 38;
const AXIS_X = 8;
/** Left edge of the s, p, d and f columns. */
const COLUMN_X = [44, 112, 236, 448];
const columnWidth = (l: number) => (2 * l + 1) * (BOX_WIDTH + BOX_SPACING) - BOX_SPACING;
const ARROW_FONT = new PhetFont({ size: 20, weight: "bold" });
const DRAG_THRESHOLD = 6;
const SHAKE_TIME = 0.4;
const POP_TIME = 0.25;
const FLY_TIME = 0.55;

/** Block tint for a subshell with orbital quantum number l. */
export const blockColor = (l: number): TPaint =>
  [Colors.sBlockColorProperty, Colors.pBlockColorProperty, Colors.dBlockColorProperty, Colors.fBlockColorProperty][l] ??
  Colors.dBlockColorProperty;
const markColor = (mark: SubshellMark): TPaint =>
  mark === "ok"
    ? Colors.okColorProperty
    : mark === "fault"
      ? Colors.faultColorProperty
      : mark === "note"
        ? Colors.noteColorProperty
        : null;

export type OrbitalBoardOptions = {
  /** Enables editing (while `editableProperty` is true). Without it the board is read-only. */
  model?: ConfigurationModel | null;
  editableProperty?: TReadOnlyProperty<boolean>;
  selectedProperty?: NumberProperty | null;
  marksProperty?: TReadOnlyProperty<readonly SubshellMark[]> | null;
  /** Subshell to glow (the one being filled), or null. */
  highlightProperty?: TReadOnlyProperty<number | null> | null;
  /** How many subshells, from the bottom, to draw. */
  levels?: number;
  /** Replaces the spin tray in the top-right corner (e.g. the ion screen's "surroundings"). The board owns it. */
  trayNode?: Node | null;
  /** Placed in the empty bottom-right corner of the staircase (e.g. the shell view). The board owns it. */
  insetNode?: Node | null;
  /** Draw the energy axis (off for small comparison boards). */
  axis?: boolean;
  /**
   * False for reference pictures (the neutral-atom comparison): boxes are not focusable or pickable, and
   * screen readers get one paragraph `label: configuration` instead of a duplicate set of orbital buttons.
   */
  interactive?: boolean;
  label?: TReadOnlyProperty<string> | null;
};

type Animation = { node: Node; time: number; duration: number; update: (fraction: number) => void };

class OrbitalBox extends Node {
  public readonly index: number;
  public readonly up: Text;
  public readonly down: Text;
  public constructor(index: number, fill: TPaint) {
    super({ cursor: "pointer" });
    this.index = index;
    const background = new Rectangle(0, 0, BOX_WIDTH, BOX_HEIGHT, 4, 4, {
      fill,
      stroke: Colors.controlSurfaceTextColorProperty,
      lineWidth: 1,
    });
    this.up = new Text("↑", { font: ARROW_FONT, fill: Colors.controlSurfaceTextColorProperty });
    this.down = new Text("↓", { font: ARROW_FONT, fill: Colors.controlSurfaceTextColorProperty });
    this.up.center = background.center.plusXY(-6, 0);
    this.down.center = background.center.plusXY(6, 0);
    this.children = [background, this.up, this.down];
  }
  public show(bits: number): void {
    this.up.visible = (bits & 1) !== 0;
    this.down.visible = (bits & 2) !== 0;
    // A lone arrow sits in the middle; a pair sits side by side.
    const center = BOX_WIDTH / 2;
    this.up.centerX = bits === 3 ? center - 6 : center;
    this.down.centerX = bits === 3 ? center + 6 : center;
  }
}

export class OrbitalBoardNode extends Node {
  private readonly boxes: OrbitalBox[] = [];
  /** Box position (top-left) in board coordinates, per orbital index; undefined above `levels`. */
  private readonly positions: (Vector2 | undefined)[] = [];
  private readonly floating = new Text("", { font: ARROW_FONT, fill: Colors.accentColorProperty, pickable: false });
  private readonly flyLayer = new Node({ pickable: false });
  private readonly animations: Animation[] = [];
  private readonly trayCenter: Vector2;
  private readonly disposeBoard: () => void;
  private previous: Diagram;

  public constructor(diagramProperty: TReadOnlyProperty<Diagram>, providedOptions?: OrbitalBoardOptions) {
    super();
    const options = {
      model: null,
      selectedProperty: null,
      marksProperty: null,
      highlightProperty: null,
      levels: SUBSHELLS.length,
      trayNode: null,
      insetNode: null,
      axis: true,
      interactive: true,
      label: null,
      ...providedOptions,
    };
    const strings = StringManager.getInstance().getStrings();
    const owned: { dispose(): void }[] = [];
    const levels = Math.min(options.levels, SUBSHELLS.length);
    const height = levels * LEVEL_HEIGHT;
    const levelTop = (subshell: number) => (levels - 1 - subshell) * LEVEL_HEIGHT;
    const model = options.model;
    const editable = options.editableProperty ?? new DerivedProperty([diagramProperty], () => model !== null);
    if (!options.editableProperty) {
      owned.push(editable);
    }
    const canEdit = () => model !== null && editable.value;

    // ── Energy axis ─────────────────────────────────────────────────────────
    if (options.axis) {
      const axis = new ArrowNode(AXIS_X, height, AXIS_X, -4, {
        headHeight: 9,
        headWidth: 9,
        tailWidth: 2,
        fill: Colors.textColorProperty,
        stroke: null,
      });
      const axisLabel = new Text(strings.common.energyAxisStringProperty, {
        font: new PhetFont(11),
        fill: Colors.textColorProperty,
        rotation: -Math.PI / 2,
        maxWidth: height * 0.6,
      });
      axisLabel.boundsProperty.link(() => {
        axisLabel.right = AXIS_X - 4;
        axisLabel.centerY = height / 2;
      });
      this.addChild(axis);
      this.addChild(axisLabel);
    }

    // ── Subshell groups ─────────────────────────────────────────────────────
    const groups = new Node();
    const marks = new Node();
    const highlights = new Node();
    this.addChild(highlights);
    this.addChild(marks);
    this.addChild(groups);
    const groupBounds: Bounds2[] = [];
    SUBSHELLS.slice(0, levels).forEach((s, subshell) => {
      const x = COLUMN_X[s.l] ?? 0,
        y = levelTop(subshell);
      const indices = SUBSHELL_ORBITALS[subshell] ?? [];
      const width = indices.length * (BOX_WIDTH + BOX_SPACING) - BOX_SPACING;
      groupBounds[subshell] = new Bounds2(x, y, x + width, y + BOX_HEIGHT + 6);
      groups.addChild(
        new Text(s.name, {
          font: new PhetFont(13),
          fill: Colors.textColorProperty,
          right: x - 5,
          centerY: y + BOX_HEIGHT / 2,
        }),
      );
      // Capacity bar: fills as the subshell fills (2, 6 or 10 electrons).
      const capacity = 2 * indices.length;
      const track = new Rectangle(x, y + BOX_HEIGHT + 3, width, 3, { fill: Colors.panelBorderColorProperty });
      const fill = new Rectangle(x, y + BOX_HEIGHT + 3, 0, 3, { fill: blockColor(s.l) });
      const fillWidth = new DerivedProperty(
        [diagramProperty],
        (diagram) => (width * (subshellCounts(diagram)[subshell] ?? 0)) / capacity,
      );
      fillWidth.link((w) => fill.setRectWidth(w));
      owned.push(fillWidth);
      groups.addChild(track);
      groups.addChild(fill);
      indices.forEach((index, j) => {
        const box = new OrbitalBox(index, blockColor(s.l));
        const position = new Vector2(x + j * (BOX_WIDTH + BOX_SPACING), y);
        box.translation = position;
        this.positions[index] = position;
        this.boxes[index] = box;
        groups.addChild(box);
      });
    });

    // Mark outlines (after Check) and the glow on the subshell being filled.
    const onMarks = (values: readonly SubshellMark[]) => {
      for (const child of marks.children.slice()) {
        child.dispose();
      }
      marks.children = groupBounds.flatMap((bounds, subshell) => {
        const color = markColor(values[subshell] ?? null);
        return color
          ? [
              new Rectangle(bounds.dilatedXY(5, 4), 6, 6, {
                stroke: color,
                lineWidth: 3,
                lineDash: values[subshell] === "note" ? [6, 4] : [],
              }),
            ]
          : [];
      });
    };
    if (options.marksProperty) {
      const marksProperty = options.marksProperty;
      marksProperty.link(onMarks);
      owned.push({ dispose: () => marksProperty.unlink(onMarks) });
    }
    if (options.highlightProperty) {
      const highlightProperty = options.highlightProperty;
      const glow = new Rectangle(0, 0, 1, 1, 6, 6, { fill: Colors.noteColorProperty, opacity: 0.35 });
      highlights.addChild(glow);
      const onHighlight = (subshell: number | null) => {
        const bounds = subshell === null ? undefined : groupBounds[subshell];
        glow.visible = bounds !== undefined;
        if (bounds) {
          glow.setRectBounds(bounds.dilatedXY(7, 6));
        }
      };
      highlightProperty.link(onHighlight);
      owned.push({ dispose: () => highlightProperty.unlink(onHighlight) });
    }

    // ── Tray (top of the rightmost column: above 3d through Xe, above 4f through Rn) ──
    const drawn = SUBSHELLS.slice(0, levels);
    const maxL = Math.max(...drawn.map((sub) => sub.l));
    const trayLeft = COLUMN_X[maxL] ?? 0;
    const trayTop = 0;
    let tray = options.trayNode;
    if (!tray && model) {
      tray = this.createSpinTray(model, editable, owned);
    }
    if (tray) {
      tray.left = trayLeft;
      tray.top = trayTop;
      this.addChild(tray);
    }
    this.trayCenter = tray ? tray.center : this.localBounds.rightTop;

    // ── Inset (bottom-right corner, below 3d) ───────────────────────────────
    const dLevel = SUBSHELLS.findIndex((sub) => sub.l === 2);
    if (options.insetNode && dLevel >= 0 && dLevel < levels) {
      const inset = options.insetNode;
      // Below 3d, from the d column to the board's right edge (which includes the f column through Rn).
      const dLeft = COLUMN_X[2] ?? 0;
      const right = Math.max(dLeft + columnWidth(2), (COLUMN_X[maxL] ?? 0) + columnWidth(maxL));
      const area = new Bounds2(dLeft, levelTop(dLevel) + LEVEL_HEIGHT + 6, right, height);
      const place = () => {
        inset.setScaleMagnitude(1);
        const scale = Math.min(1, area.width / inset.width, area.height / inset.height);
        inset.setScaleMagnitude(scale);
        inset.centerX = area.centerX;
        inset.bottom = area.bottom;
      };
      inset.localBoundsProperty.lazyLink(place);
      place();
      this.addChild(inset);
      owned.push({ dispose: () => inset.localBoundsProperty.unlink(place) });
    }

    // Fix the layout bounds so animations and drags never nudge the surrounding layout.
    const fixedBounds = this.localBounds.copy();
    this.addChild(this.flyLayer);
    this.addChild(this.floating);
    this.floating.visible = false;
    this.localBounds = fixedBounds;

    if (!options.interactive) {
      this.pickable = false;
      const label = options.label;
      const paragraph = label
        ? new DerivedProperty(
            [diagramProperty, label],
            (diagram, text) => `${text}: ${configuration(subshellCounts(diagram))}`,
          )
        : new DerivedProperty([diagramProperty], (diagram) => configuration(subshellCounts(diagram)));
      this.accessibleParagraph = paragraph;
      owned.push(paragraph);
    }

    // ── Per-box state, names and interaction ────────────────────────────────
    for (const box of this.boxes) {
      if (!(box && options.interactive)) {
        continue;
      }
      const index = box.index;
      const orbital = ORBITALS[index];
      const name = new DerivedProperty(
        [
          diagramProperty,
          strings.common.orbitalStringProperty,
          strings.states.emptyStringProperty,
          strings.states.upStringProperty,
          strings.states.downStringProperty,
          strings.states.pairStringProperty,
        ],
        (diagram, pattern, e, u, down, pair) =>
          StringUtils.fillIn(pattern, {
            subshell: SUBSHELLS[orbital?.subshell ?? 0]?.name ?? "",
            index: (orbital?.index ?? 0) + 1,
            state: [e, u, down, pair][diagram[index] ?? 0],
          }),
      );
      owned.push(name);
      box.mutate({ tagName: "button", focusable: true, accessibleName: name });
      if (options.selectedProperty) {
        const selected = options.selectedProperty;
        const outline = new Rectangle(-3, -3, BOX_WIDTH + 6, BOX_HEIGHT + 6, 6, 6, {
          stroke: Colors.accentColorProperty,
          lineWidth: 2,
          pickable: false,
        });
        box.addChild(outline);
        const onSelected = (i: number) => {
          outline.visible = i === index;
        };
        selected.link(onSelected);
        owned.push({ dispose: () => selected.unlink(onSelected) });
      }
      const activate = () => {
        if (model && canEdit()) {
          model.cycle(index);
        } else if (options.selectedProperty) {
          options.selectedProperty.value = index;
        }
      };
      // Pointer: a press without movement is a click; with movement it carries an electron.
      let dragged = false;
      let start: Vector2 | null = null;
      const drag = new DragListener({
        start: (event) => {
          dragged = false;
          start = this.globalToLocalPoint(event.pointer.point);
        },
        drag: (event) => {
          const point = this.globalToLocalPoint(event.pointer.point);
          if (!dragged && start && point.distance(start) > DRAG_THRESHOLD && model && canEdit()) {
            const spin = model.carriedSpin(index);
            if (spin !== null) {
              dragged = true;
              this.beginCarry(spin, point);
              (spin === 1 ? box.up : box.down).opacity = 0.3;
            }
          }
          if (dragged) {
            this.floating.center = point;
          }
        },
        end: (event) => {
          box.up.opacity = box.down.opacity = 1;
          if (dragged && model) {
            this.floating.visible = false;
            const point = event ? this.globalToLocalPoint(event.pointer.point) : null;
            const target = point ? this.boxAt(point) : null;
            if (target === null) {
              model.removeOne(index);
            } else {
              model.move(index, target);
            }
          } else if (event) {
            activate();
          }
          dragged = false;
        },
      });
      box.addInputListener(drag);
      // Keyboard: Space/Enter on the PDOM button; DragListener ignores PDOM clicks.
      box.addInputListener({ click: activate });
      const keys = new KeyboardListener({
        keys: ["u", "d", "delete", "backspace"] as const,
        fire: (_event, key) => {
          if (!(model && canEdit())) {
            return;
          }
          if (key === "u") {
            model.place(index, 1);
          } else if (key === "d") {
            model.place(index, 2);
          } else {
            model.removeOne(index);
          }
        },
      });
      box.addInputListener(keys);
      owned.push(drag, keys);
    }

    // ── Diagram changes: redraw and pop newly placed arrows ─────────────────
    this.previous = diagramProperty.value;
    const onDiagram = (diagram: Diagram) => {
      this.boxes.forEach((box, index) => {
        if (!box) {
          return;
        }
        const bits = diagram[index] ?? 0,
          before = this.previous[index] ?? 0;
        box.show(bits);
        const added = bits & ~before;
        if (added & 1) {
          this.pop(box.up);
        }
        if (added & 2) {
          this.pop(box.down);
        }
      });
      this.previous = diagram;
    };
    diagramProperty.link(onDiagram);
    owned.push({ dispose: () => diagramProperty.unlink(onDiagram) });

    // Pauli: shake the box that rejected the electron.
    if (model) {
      const onPauli = (index: number) => this.shake(index);
      model.pauliEmitter.addListener(onPauli);
      owned.push({ dispose: () => model.pauliEmitter.removeListener(onPauli) });
    }

    const onEditable = (on: boolean) => {
      for (const box of this.boxes) {
        if (box) {
          box.cursor = on || options.selectedProperty ? "pointer" : "default";
        }
      }
    };
    editable.link(onEditable);
    owned.push({ dispose: () => editable.unlink(onEditable) });

    this.disposeBoard = () => {
      // Unlink from external Properties before disposing the DerivedProperties that depend on them.
      for (const item of owned.slice().reverse()) {
        item.dispose();
      }
    };
  }

  /** The ↑/↓ source tokens shown on editable boards. */
  private createSpinTray(
    model: ConfigurationModel,
    editable: TReadOnlyProperty<boolean>,
    owned: { dispose(): void }[],
  ): Node {
    const strings = StringManager.getInstance().getStrings();
    const token = (spin: Spin) => {
      const node = new Node({
        cursor: "pointer",
        children: [
          new Circle(17, {
            fill: Colors.controlSurfaceColorProperty,
            stroke: Colors.accentColorProperty,
            lineWidth: 2,
          }),
          new Text(spin === 1 ? "↑" : "↓", {
            font: ARROW_FONT,
            fill: Colors.controlSurfaceTextColorProperty,
            center: new Bounds2(-17, -17, 17, 17).center,
          }),
        ],
      });
      node.addInputListener(
        new DragListener({
          start: (event) => {
            if (editable.value) {
              this.beginCarry(spin, this.globalToLocalPoint(event.pointer.point));
            }
          },
          drag: (event) => {
            this.floating.center = this.globalToLocalPoint(event.pointer.point);
          },
          end: (event) => {
            if (!this.floating.visible) {
              return;
            }
            this.floating.visible = false;
            const target = event ? this.boxAt(this.globalToLocalPoint(event.pointer.point)) : null;
            if (target !== null) {
              model.place(target, spin);
            }
          },
        }),
      );
      return node;
    };
    const label = new Text(strings.common.trayStringProperty, {
      font: new PhetFont(12),
      fill: Colors.textColorProperty,
      maxWidth: 170,
    });
    const tray = new VBox({
      spacing: 6,
      align: "left",
      children: [label, new Node({ children: [token(1), token(2)] })],
    });
    const tokens = tray.children[1];
    if (tokens) {
      const [a, b] = tokens.children;
      if (a && b) {
        b.left = a.right + 14;
      }
    }
    const onEditable = (on: boolean) => {
      tray.opacity = on ? 1 : 0.35;
      tray.pickable = on;
    };
    editable.link(onEditable);
    owned.push({ dispose: () => editable.unlink(onEditable) });
    return tray;
  }

  private beginCarry(spin: Spin, point: Vector2): void {
    this.floating.string = spin === 1 ? "↑" : "↓";
    this.floating.center = point;
    this.floating.visible = true;
  }

  /** The orbital index under a board-local point, or null. */
  private boxAt(point: Vector2): number | null {
    for (const box of this.boxes) {
      const position = box ? this.positions[box.index] : undefined;
      if (
        box &&
        position &&
        new Bounds2(position.x, position.y, position.x + BOX_WIDTH, position.y + BOX_HEIGHT)
          .dilated(4)
          .containsPoint(point)
      ) {
        return box.index;
      }
    }
    return null;
  }

  private pop(arrow: Node): void {
    this.animate(arrow, POP_TIME, (f) => arrow.setScaleMagnitude(1 + 0.7 * (1 - f)));
  }

  private shake(index: number): void {
    const box = this.boxes[index];
    const position = this.positions[index];
    if (!(box && position)) {
      return;
    }
    const flash = new Rectangle(0, 0, BOX_WIDTH, BOX_HEIGHT, 4, 4, {
      fill: Colors.faultColorProperty,
      pickable: false,
    });
    box.addChild(flash);
    this.animate(box, SHAKE_TIME, (f) => {
      box.x = position.x + 5 * Math.sin(f * Math.PI * 6) * (1 - f);
      flash.opacity = 0.6 * (1 - f);
      if (f >= 1) {
        box.removeChild(flash);
        flash.dispose();
      }
    });
  }

  /**
   * Animates an electron leaving an orbital for the tray (out = true) or arriving from it, along a gentle arc.
   * Used on Make an Ion so 4s visibly empties before 3d.
   */
  public fly(index: number, spin: Spin, out: boolean): void {
    const position = this.positions[index];
    if (!position) {
      return;
    }
    const boxCenter = position.plusXY(BOX_WIDTH / 2, BOX_HEIGHT / 2);
    const from = out ? boxCenter : this.trayCenter;
    const to = out ? this.trayCenter : boxCenter;
    const token = new Node({
      children: [
        new Circle(12, { fill: Colors.electronColorProperty, opacity: 0.35 }),
        new Text(spin === 1 ? "↑" : "↓", {
          font: ARROW_FONT,
          fill: Colors.electronColorProperty,
          center: new Bounds2(-12, -12, 12, 12).center,
        }),
      ],
    });
    token.center = from;
    this.flyLayer.addChild(token);
    this.animate(token, FLY_TIME, (f) => {
      const eased = f * f * (3 - 2 * f);
      token.center = from.blend(to, eased).plusXY(0, -40 * Math.sin(Math.PI * eased));
      if (f >= 1) {
        this.flyLayer.removeChild(token);
        token.dispose();
      }
    });
  }

  private animate(node: Node, duration: number, update: (fraction: number) => void): void {
    // Finish an animation already running on the same node, so repeated presses don't stack offsets.
    const existing = this.animations.findIndex((a) => a.node === node);
    if (existing >= 0) {
      this.animations[existing]?.update(1);
      this.animations.splice(existing, 1);
    }
    this.animations.push({ node, time: 0, duration, update });
  }

  public step(dt: number): void {
    for (const animation of this.animations.slice()) {
      animation.time = Math.min(animation.duration, animation.time + dt);
      const fraction = animation.time / animation.duration;
      animation.update(fraction);
      if (fraction >= 1) {
        this.animations.splice(this.animations.indexOf(animation), 1);
      }
    }
  }

  public override dispose(): void {
    this.disposeBoard();
    // Labels bound to global string Properties (axis, tray), and the owned tray/inset, must be disposed too.
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
