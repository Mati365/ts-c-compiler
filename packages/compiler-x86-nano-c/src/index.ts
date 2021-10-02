import {ccompiler} from './frontend';

ccompiler(
  null,
  'a *= 2;',
  // `int main(const int arg1, float arg2) {
  //   int a = 2, b;
  //   float abc = 3;
  //   if (2 + 2 > 4) {
  //     float dupa = 3;
  //   }

  //   return (2+2);
  // }`,
)
  .unwrap()
  .dump();
