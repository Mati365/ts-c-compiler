import '../utils';

describe('Fn statement', () => {
  test('basic function with return', () => {
    expect(/* cpp */ `
      int test(int a, int b){
        a++;
        return a;
      }

      int main(){
        test(1,2);
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def test(a{0}: int*2B, b{0}: int*2B): [ret: int2B]
      @@_fn_test:
      push bp
      mov bp, sp
      mov ax, [bp + 4]
      add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
      mov word [bp + 4], ax     ; *(a{0}: int*2B) = store %t{1}: int2B
      mov sp, bp
      pop bp
      ret 4

      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      push 2
      push 1
      call @@_fn_test
      mov sp, bp
      pop bp
      ret
    `);
  });
});
