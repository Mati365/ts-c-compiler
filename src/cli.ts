import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo:
  // sprawdź co ładuje do: int k =0x6; char i = k;
  // mamy little endian!

  // int strlen(const char* str) {
  //   for (int i = 0;;++i) {
  //     if (*(str + i) == '0') {
  //       // todo: Add!
  //       return i;
  //     }
  //   }

  //   return -1;
  // }

  // void main() {
  //   int len = strlen("Hello world!");
  // }

  struct Vec2 {
    int x, y;
  };

  struct Vec2 sum(int x, int y) {
    struct Vec2 sum_1 = { .x = 0, .y = 0 };
    struct Vec2 sum_2 = { .x = 1, .y = 1 };

    // if (x > 2) {
    //   return sum_1;
    // }

    return sum_2;
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
