/** Callbacks */
export type UnmountCallback = () => void;

/** Utils */
export type CanBeArray<T> = T | T[];
export type Newable<T, A extends Array<any> = any> = {
  new(...args: A): T,
};

/** Size types */
export type RectangleDimensions = {
  x?: number,
  y?: number,
  w?: number,
  h?: number,
};

export class Rectangle implements RectangleDimensions {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
  ) {}
}

export class Vec2D {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

/**
 * Struct that holds color data
 *
 * @export
 * @class RGBColor
 */
export class RGBColor {
  public readonly hex: string;

  constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number,
  ) {
    // cache for canvas
    this.hex = `#${[r, g, b].map((str) => str.toString(16).padStart(2, '0')).join('')}`;
  }

  toNumber(): number {
    const {r, g, b} = this;

    return (
      ((r & 0xFF) << 16)
        | ((g & 0xFF) << 8)
        | (b & 0xFF)
    );
  }

  /**
   * Creates color from HEX
   *
   * @static
   * @param {number} num
   * @returns {RGBColor}
   * @memberof RGBColor
   */
  static fromNumber(num: number): RGBColor {
    return new RGBColor(
      (num >> 16) & 0xFF,
      (num >> 8) & 0xFF,
      num & 0xFF,
    );
  }
}

/**
 * Holds width and height of object
 *
 * @export
 * @class Size
 */
export class Size {
  constructor(
    public w: number,
    public h: number,
  ) {}

  assign({w, h}: Size): void {
    this.w = w;
    this.h = h;
  }

  clone() {
    const {w, h} = this;

    return new Size(w, h);
  }
}
