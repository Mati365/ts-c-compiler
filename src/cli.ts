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

  // todo: b should be truncated
  // char b = 'b';
  // int c = 4;
  // c = c + 5 + (int) b;

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

  void strlen() {
    // todo: FIX!
    // add ax, byte [bp - 5]     ; %t{4}: char1B = %t{2}: int2B plus %t{3}: char1B
    // mov byte [bp - 7], ax     ; *(c{1}: int*2B) = store %t{4}: char1B
    char b = 'b';
    char c = 'c';
    char d = b + c;
    return -1;
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

/**
 * Optimize to AL:
 *
 * and ax, 0xff
 * mov word [bp - 12], ax    ; *(b{0}: char*2B) = store %t{1}: int2B
 */
