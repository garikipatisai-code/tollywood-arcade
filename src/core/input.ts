export type Action = 'left' | 'right' | 'up' | 'down' | 'sting' | 'pause';

export type Bindings = Record<Action, string[]>;

export interface Axis {
  x: number;
  y: number;
}

export const DEFAULT_BINDINGS: Bindings = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  sting: ['Space', 'Enter'],
  pause: ['Escape', 'KeyP']
};

/** Player remaps extend the defaults instead of replacing them. */
export function bindingsFrom(remaps: Record<string, string[]> = {}): Bindings {
  const bindings: Bindings = {} as Bindings;

  for (const action of Object.keys(DEFAULT_BINDINGS) as Action[]) {
    const extra = remaps[action] ?? [];
    bindings[action] = [...new Set([...extra, ...DEFAULT_BINDINGS[action]])];
  }

  return bindings;
}

export function resolveAction(code: string, bindings: Bindings = DEFAULT_BINDINGS): Action | null {
  for (const action of Object.keys(bindings) as Action[]) {
    if (bindings[action].includes(code)) return action;
  }
  return null;
}

export function applyDeadzone(axis: Axis, deadzone = 0.25): Axis {
  const magnitude = Math.hypot(axis.x, axis.y);
  if (magnitude <= deadzone) return { x: 0, y: 0 };

  const scaled = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
  return {
    x: (axis.x / magnitude) * scaled,
    y: (axis.y / magnitude) * scaled
  };
}

/** Combine keyboard, touch and gamepad axes; clamp the result to unit length. */
export function mergeAxes(axes: Axis[]): Axis {
  let x = 0;
  let y = 0;

  for (const axis of axes) {
    x += axis.x;
    y += axis.y;
  }

  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }

  return { x, y };
}

/** Drag from the touch origin, normalised by the drag radius. */
export function pointerAxis(dx: number, dy: number, radius = 48): Axis {
  if (radius <= 0) return { x: 0, y: 0 };

  const magnitude = Math.hypot(dx, dy);
  if (magnitude === 0) return { x: 0, y: 0 };

  const scale = Math.min(1, magnitude / radius) / magnitude;
  return { x: dx * scale, y: dy * scale };
}

export function gamepadAxis(pad: Pick<Gamepad, 'axes'>, deadzone = 0.25): Axis {
  return applyDeadzone({ x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 }, deadzone);
}

/**
 * Keyboard/touch binding table with a pressed set. Kept DOM-light so unit tests
 * can drive it without a browser; `attach` is the only browser-facing method.
 */
export class InputMap {
  private readonly pressed = new Set<Action>();

  constructor(public bindings: Bindings = DEFAULT_BINDINGS) {}

  press(code: string): Action | null {
    const action = resolveAction(code, this.bindings);
    if (action) this.pressed.add(action);
    return action;
  }

  release(code: string): Action | null {
    const action = resolveAction(code, this.bindings);
    if (action) this.pressed.delete(action);
    return action;
  }

  isDown(action: Action): boolean {
    return this.pressed.has(action);
  }

  clear(): void {
    this.pressed.clear();
  }

  keyboardAxis(): Axis {
    return {
      x: (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0),
      y: (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0)
    };
  }

  attach(target: Pick<Window, 'addEventListener' | 'removeEventListener'>): () => void {
    const onKeyDown = (event: Event) => {
      const key = event as KeyboardEvent;
      if (key.repeat) return;
      this.press(key.code);
      if (this.bindings.pause.includes(key.code)) event.preventDefault();
    };
    const onKeyUp = (event: Event) => this.release((event as KeyboardEvent).code);
    const onBlur = () => this.clear();

    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    target.addEventListener('blur', onBlur);

    return () => {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
    };
  }
}
