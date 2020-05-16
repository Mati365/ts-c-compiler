import * as R from 'ramda';
import {Rectangle, RectangleDimensions} from '@compiler/core/types';

export enum CursorCharacter {
  FULL_BLOCK = 219,
  UNDERLINE = 95,
}

type CursorInfo = {
  character: CursorCharacter,
  visible?: boolean,
  blink?: boolean,
};

type CursorInitializer = RectangleDimensions & {
  info?: CursorInfo,
};

/**
 * Contains info about text-mode only cursor
 *
 * @export
 * @class Cursor
 * @extends {Rectangle}
 */
export class Cursor extends Rectangle {
  public info: CursorInfo;

  private saved: Cursor[] = [];

  constructor(
    {
      x = 0,
      y = 0,
      w = 8,
      h = 16,
      info = {
        character: CursorCharacter.UNDERLINE,
        visible: true,
        blink: true,
      },
    }: CursorInitializer = {},
  ) {
    super(x, y, w, h);
    this.info = info;
  }

  clone(): Cursor {
    const {x, y, w, h, info} = this;

    return new Cursor(
      {
        x,
        y,
        w,
        h,
        info: R.clone(info),
      },
    );
  }

  /**
   * Save cursor on cursors stack
   *
   * @returns {void}
   * @memberof Cursor
   */
  save(): void {
    this.saved.push(
      this.clone(),
    );
  }

  /**
   * Pops function from cursors stack
   *
   * @returns {void}
   * @memberof Cursor
   */
  restore(): void {
    const {saved} = this;
    if (!saved.length)
      return;

    Object.assign(this, saved.pop());
  }
}
