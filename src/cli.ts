import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sum() {
    struct Vec2 {
      int x, y;
      struct Color {
        int r, g, b;
      } color;
    } vec2;

    struct Vec2 vectors[] = { { .x = 1 }, { .y = 2 } };

    int cyferki[2][2][2] = { { { 1, 2 }, { 3, 4 } }};

    int c = vectors[1].color.g + cyferki[1][1][2];
    int cyferka = cyferki[1][c + 1][0] * 2;
  }
`).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error: any) => {
      if (error?.[0]?.tree) {
        console.info(
          CCompilerOutput.serializeTypedTree(error[0].tree),
        );
      }

      console.error(error);
    },
  },
);
