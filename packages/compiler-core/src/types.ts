/** Callbacks */
export type UnmountCallback = () => void;

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

  /**
   * Creates color from HEX
   *
   * @static
   * @param {number} hex
   * @returns {RGBColor}
   * @memberof RGBColor
   */
  static fromHex(hex: number): RGBColor {
    return new RGBColor(
      (hex >> 16) & 0xFF,
      (hex >> 8) & 0xFF,
      hex & 0xFF,
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
