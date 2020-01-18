import * as R from 'ramda';

export default class Cursor {
  static Type = {
    FULL_BLOCK: 219,
    UNDERLINE: 95,
  };

  constructor(
    {
      x = 0,
      y = 0,
      w = 8,
      h = 16,
      info = {
        character: Cursor.Type.UNDERLINE,
        visible: true,
        blink: true,
      },
    } = {},
  ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.info = info;
    this.saved = [];
  }

  clone() {
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

  save() {
    this.saved.push(
      this.clone(),
    );
  }

  restore() {
    const {saved} = this;
    if (!saved.length)
      return;

    Object.assign(this, saved.pop());
  }
}
