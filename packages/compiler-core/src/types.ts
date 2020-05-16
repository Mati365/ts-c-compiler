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
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

/**
 * Struct that holds color data
 *
 * @export
 * @class RGBColor
 */
export class RGBColor {
  constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number,
  ) {}
}

/**
 * Holds width and height of object
 *
 * @export
 * @class Size
 */
export class Size {
  constructor(
    public readonly w: number,
    public readonly h: number,
  ) {}
}
