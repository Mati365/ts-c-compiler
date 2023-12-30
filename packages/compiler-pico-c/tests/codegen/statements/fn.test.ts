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

  test('small variables using registers directly to initializer', () => {
    expect(/* cpp */ `
      char fn() {
        return 2;
      }

      int main() {
        char a = fn();
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def fn(): [ret: char1B]
      @@_fn_fn:
      push bp
      mov bp, sp
      mov al, byte 2
      mov sp, bp
      pop bp
      ret

      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 1
      call @@_fn_fn
      mov byte [bp - 1], al     ; *(a{0}: char*2B) = store %t{1}: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('small structures using registers directly to initializer', () => {
    expect(/* cpp */ `
      struct Data {
        char k;
      };

      struct Data fun() {
        struct Data tmp = {
          .k = 2
        };

        return tmp;
      };

      void main() {
        struct Data data = fun();
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def fun(): [ret: struct Data1B]
      @@_fn_fun:
      push bp
      mov bp, sp
      sub sp, 1
      mov byte [bp - 1], 2      ; *(tmp{0}: struct Data*2B) = store %2: char1B
      mov al, [bp - 1]
      mov sp, bp
      pop bp
      ret

      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 1
      call @@_fn_fun
      mov byte [bp - 1], al     ; *(data{0}: struct Data*2B) = store %t{2}: struct Data1B
      mov sp, bp
      pop bp
      ret
    `);
  });
});
