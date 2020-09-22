import {ccompiler} from './frontend';

ccompiler(
  null,
  `int main(int arg1, float arg2) {
    int a = 2, b;
    float abc = 3;
    if (2 + 2 > 4) {
      float dupa = 3;
    }

    return (2+2);
  }`,
)
  .unwrap()
  .dump();
