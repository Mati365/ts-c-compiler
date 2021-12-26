import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    enum ScreenMode {
      VGA,
      EGA,
    };

    struct Size {
      int w, h;
    };

    struct ScreenDriver {
      char mode;

      struct Size size;
      struct { int x, y; } cursor;
    } screenDriver;

    void init_screen(enum ScreenMode mode, struct Size size) {
    }
  `,
).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error) => {
      console.error(error);
    },
  },
);
