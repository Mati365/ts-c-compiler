import {ccompiler} from './frontend';

ccompiler(
  null,
  `
    int main() {
      int a = 3;
      int b = 4;

      return a + b;
    }
  `,
)
  .unwrap()
  .dump();
