/** Callbacks */
export type UnmountCallback = () => void;

/** Utils */
export type ID = string | number;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type CanBeArray<T> = T | T[];
export type Newable<T, A extends Array<any> = any> = {
  new (...args: A): T;
};

export type Range<T = number> = {
  from: T;
  to: T;
};

/** Size types */
export type RectangleDimensions = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
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
  constructor(public x: number, public y: number) {}
}

/**
 * Struct that holds color data
 */
export class RGBColor {
  readonly hex: string;

  constructor(readonly r: number, readonly g: number, readonly b: number) {
    // cache for canvas
    this.hex = `#${[r, g, b]
      .map(str => str.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  toNumber(): number {
    const { r, g, b } = this;

    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
  }

  /**
   * Creates color from HEX
   */
  static fromNumber(num: number): RGBColor {
    return new RGBColor((num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff);
  }
}

/**
 * Holds width and height of object
 */
export class Size {
  constructor(public w: number, public h: number) {}

  assign({ w, h }: Size): void {
    this.w = w;
    this.h = h;
  }

  clone() {
    const { w, h } = this;

    return new Size(w, h);
  }
}
