import '../utils';

describe('VA Lists', () => {
  test('VA list getter in loop', () => {
    expect(/* cpp */ `
      #include <stdarg.h>

      int sum_vector(int total_args, ...) {
        va_list ap;
        va_start(ap, total_args);

        int sum = 0;

        for (int i = 0; i < total_args; ++i) {
          sum += va_arg(ap, int);
        }

        va_end(ap);
        return sum;
      }

      void main() {
        int result = sum_vector(3, 5, 8, 10);
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum_vector(total_args{0}: int*2B, ...): [ret: int2B]
      @@_fn_sum_vector:
      push bp
      mov bp, sp
      sub sp, 8
      lea bx, [bp - 2]          ; %t{1}: struct __builtin_va_list**2B = lea ap{0}: struct __builtin_va_list*2B
      lea di, [bp + 4]          ; %t{2}: int**2B = lea total_args{0}: int*2B
      mov [bx], di
      mov word [bp - 4], 0      ; *(sum{0}: int*2B) = store %0: int2B
      mov word [bp - 6], 0      ; *(i{0}: int*2B) = store %0: int2B
      @@_L1:
      mov ax, [bp + 4]
      cmp word [bp - 6], ax     ; %t{5}: i1:zf = icmp %t{3}: int2B less_than %t{4}: int2B
      jge @@_L3                 ; br %t{5}: i1:zf, false: L3
      @@_L2:
      lea bx, [bp - 2]          ; %t{9}: struct __builtin_va_list**2B = lea ap{0}: struct __builtin_va_list*2B
      lea di, [bp - 8]          ; %t{11}: char[2]*2B = lea %t{10}: char[2]*2B
      ; VA arg getter - start - 2B
      mov si, [bx]
      add si, 2
      mov ax, [si]
      mov [di], ax
      mov [bx], si
      ; VA arg getter - end
      mov ax, [bp - 4]
      add ax, word [bp - 8]     ; %t{13}: int2B = %t{12}: int2B plus %t{10}: char[2]*2B
      mov word [bp - 4], ax     ; *(sum{0}: int*2B) = store %t{13}: int2B
      @@_L4:
      mov ax, [bp - 6]
      add ax, 1                 ; %t{7}: int2B = %t{6}: int2B plus %1: int2B
      mov word [bp - 6], ax     ; *(i{0}: int*2B) = store %t{7}: int2B
      jmp @@_L1                 ; jmp L1
      @@_L3:
      mov ax, [bp - 4]
      mov sp, bp
      pop bp
      ret 2
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      push word 10
      push word 8
      push word 5
      push word 3
      call @@_fn_sum_vector
      add sp, 6
      mov word [bp - 2], ax     ; *(result{0}: int*2B) = store %t{17}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });
});
