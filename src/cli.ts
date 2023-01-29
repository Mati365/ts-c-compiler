import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo: letters[0] should be truncated
  // huge issue, truncating type in IR!
  // void main() {
  //   char letters[] = "Hello world";

  //   char b = letters[0];
  //   int a = letters[0] * 2;
  // }


  // todo: Optimize
  // add bx, 32                ; %t{3}: int*2B = %t{0}: int*2B plus %32: int2B
  // mov ax, [bx]              ; %t{4}: int2B = load %t{3}: int*2B
  // struct Point {
  //   int x, y;
  //   int dupa[10];
  //   char c;
  // };

  // void main() {
  //   struct Point point[] = { { .y = 6 }, { .x = 2 } };
  //   point[1].dupa[2]++;
  // }

  void main() {
  // struct Vec2 { int x, y; struct Rect { int s, w; } k; } vec = { .y = 5 };
  //   vec.y = 7;
  //   vec.k.w++;
    char arr[] = { 1, 2, 3, 4 };
    arr[1] = 2;
  }
`).match({
  ok: result => {
    result.dump();
  },
  err: (error: any) => {
    if (error?.[0]?.tree) {
      console.info(CCompilerOutput.serializeTypedTree(error[0].tree));
    }

    console.error(error);
  },
});
