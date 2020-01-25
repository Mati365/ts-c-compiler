import * as R from 'ramda';
import {Rectangle, RectangleDimensions} from '../../shared/types';

export enum CursorCharacter {
  FULL_BLOCK = 219,
  UNDERLINE = 95,
};

type CursorInfo = {
  character: CursorCharacter,
  visible?: boolean,
  blink?: boolean,
};

type CursorInitializer = RectangleDimensions & {
  info?: CursorInfo,
};

export default class Cursor extends Rectangle {
  private info: CursorInfo;

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

  save(): void {
    this.saved.push(
      this.clone(),
    );
  }

  restore(): void {
    const {saved} = this;
    if (!saved.length)
      return;

    Object.assign(this, saved.pop());
  }
}
