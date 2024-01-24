import '../utils';

describe('For statement', () => {
  test('for loop with 0 constant as condition', () => {
    expect(/* cpp */ `
      int main(void) {
        for ( ; 0  ;) {
          asm("xchg bx, bx");
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(%t{0}: void*2B): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      @@_L1:
      jmp @@_L3                 ; jmp L3
      @@_L2:
      xchg bx, bx
      @@_L4:
      jmp @@_L1                 ; jmp L1
      @@_L3:
      mov sp, bp
      pop bp
      ret 2
    `);
  });

  test('for loop with 1 constant as condition', () => {
    expect(/* cpp */ `
      int main(void) {
        for ( ; 1  ;) {
          asm("xchg bx, bx");
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(%t{0}: void*2B): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      @@_L1:
      xchg bx, bx
      @@_L4:
      jmp @@_L1                 ; jmp L1
      @@_L3:
      mov sp, bp
      pop bp
      ret 2
    `);
  });

  test('for loop with string literal pointer increment', () => {
    expect(/* cpp */ `
      int main(void) {
        char *ptr = "123";

        for ( ; *ptr  ; ++ptr) {
          asm("xchg bx, bx");
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(%t{0}: void*2B): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov bx, @@_c_0_           ; %t{1}: char*2B = lea c{0}: char[4]*2B
      mov word [bp - 2], bx     ; *(ptr{0}: char**2B) = store %t{1}: char*2B
      @@_L1:
      mov bx, [bp - 2]          ; %t{2}: char*2B = load ptr{0}: char**2B
      mov al, [bx]              ; %t{3}: char1B = load %t{2}: char*2B
      movzx cx, al
      cmp cx, 0                 ; %t{4}: i1:zf = icmp %t{3}: char1B differs %0: int2B
      jz @@_L3                  ; br %t{4}: i1:zf, false: L3
      @@_L2:
      xchg bx, bx
      @@_L4:
      mov bx, [bp - 2]          ; %t{5}: char*2B = load ptr{0}: char**2B
      add bx, 1                 ; %t{6}: char*2B = %t{5}: char*2B plus %1: int2B
      mov word [bp - 2], bx     ; *(ptr{0}: char**2B) = store %t{6}: char*2B
      jmp @@_L1                 ; jmp L1
      @@_L3:
      mov sp, bp
      pop bp
      ret 2
      @@_c_0_:
      db "123", 0x0
    `);
  });
});
