import '../utils';

describe('Variables initialization', () => {
  describe('Initialization with provided values', () => {
    test('basic initializer', () => {
      expect(/* cpp */ `
        void main() {
          int a = 4;
          char b = 'a';
          int c = 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov word [bp - 2], 4      ; *(a{0}: int*2B) = store %4: int2B
        mov byte [bp - 3], 97     ; *(b{0}: char*2B) = store %97: char1B
        mov word [bp - 5], 2      ; *(c{0}: int*2B) = store %2: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('struct array initializer', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; } vecs[] = { { .x = 1, .y = 2 }, { .y = 4 }};
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 8
        mov word [bp - 8], 1      ; *(vecs{0}: struct Vec2[2]*2B) = store %1: int2B
        mov word [bp - 6], 2      ; *(vecs{0}: struct Vec2[2]*2B + %2) = store %2: int2B
        mov word [bp - 2], 4      ; *(vecs{0}: struct Vec2[2]*2B + %6) = store %4: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Missing initialization value', () => {
    test('second variable has proper stack offset if first is not initialized', () => {
      expect(/* cpp */ `
        void main() {
          int a;
          int b = 4;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 4
        mov word [bp - 4], 4      ; *(b{0}: int*2B) = store %4: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('multiple variable initialization results in proper offset', () => {
      expect(/* cpp */ `
        void main() {
          int a, b, c[2];
          int d = 4;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 10
        mov word [bp - 10], 4     ; *(d{0}: int*2B) = store %4: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Initialization with implicit casting', () => {
    test('int b = letters[0] + 2', () => {
      expect(/* cpp */ `
        void main() {
          char letters[] = "He";
          int a = letters[0] + 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov word [bp - 3], 25928  ; *(letters{0}: int*2B) = store %25928: int2B
        mov byte [bp - 1], 0      ; *(letters{0}: char[3]*2B + %2) = store %0: char1B
        lea bx, [bp - 3]          ; %t{0}: char[3]*2B = lea letters{0}: char[3]*2B
        mov al, [bx]              ; %t{2}: char1B = load %t{1}: char[3]*2B
        add al, 2                 ; %t{3}: char1B = %t{2}: char1B plus %2: char1B
        movzx cx, al
        mov word [bp - 5], cx     ; *(a{0}: int*2B) = store %t{3}: char1B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Initialization with explicit casting', () => {
    test('int a = (int) b + 3 + (int) b;', () => {
      expect(/* cpp */ `
        void main() {
          char b = 's';
          int a = (int) b + 3 + (int) b;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 3
        mov byte [bp - 1], 115    ; *(b{0}: char*2B) = store %115: char1B
        mov al, [bp - 1]
        mov ah, al                ; swap
        add al, 3                 ; %t{1}: char1B = %t{0}: char1B plus %3: char1B
        add al, ah                ; %t{3}: char1B = %t{1}: char1B plus %t{0}: char1B
        movzx bx, al
        mov word [bp - 3], bx     ; *(a{0}: int*2B) = store %t{3}: char1B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('int a = (int) b + 3 + (int) b + k;', () => {
      expect(/* cpp */ `
        void main() {
          char b = 's';
          int k = 1231;
          int a = (int) b + 3 + (int) b + k;
        }
      `).toCompiledAsmBeEqual(`
          cpu 386
          ; def main():
          @@_fn_main:
          push bp
          mov bp, sp
          sub sp, 5
          mov byte [bp - 1], 115    ; *(b{0}: char*2B) = store %115: char1B
          mov word [bp - 3], 1231   ; *(k{0}: int*2B) = store %1231: int2B
          mov al, [bp - 1]
          mov ah, al                ; swap
          add al, 3                 ; %t{1}: char1B = %t{0}: char1B plus %3: char1B
          add al, ah                ; %t{3}: char1B = %t{1}: char1B plus %t{0}: char1B
          movzx bx, al
          add bx, word [bp - 3]     ; %t{5}: int2B = %t{3}: char1B plus %t{4}: int2B
          mov word [bp - 5], bx     ; *(a{0}: int*2B) = store %t{5}: int2B
          mov sp, bp
          pop bp
          ret
      `);
    });
  });

  describe('Array initialization', () => {
    test('int[]', () => {
      expect(/* cpp */ `
        void main() {
          int arr[] = { 1 };
          int arr2[] = { 1, 2, 3, 4, 5 };
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 12
        mov word [bp - 2], 1      ; *(arr{0}: int[1]*2B) = store %1: int2B
        mov word [bp - 12], 1     ; *(arr2{0}: int[5]*2B) = store %1: int2B
        mov word [bp - 10], 2     ; *(arr2{0}: int[5]*2B + %2) = store %2: int2B
        mov word [bp - 8], 3      ; *(arr2{0}: int[5]*2B + %4) = store %3: int2B
        mov word [bp - 6], 4      ; *(arr2{0}: int[5]*2B + %6) = store %4: int2B
        mov word [bp - 4], 5      ; *(arr2{0}: int[5]*2B + %8) = store %5: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('const int[]', () => {
      expect(/* cpp */ `
        void main() {
          const int arr[] = { 1 };
          const int arr2[] = { 1, 2, 3, 4, 5 };
          const int arr3[] = { 1, 2 };
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 8
        mov word [bp - 2], 1      ; *(arr{0}: const int[1]*2B) = store %1: const int2B
        mov bx, @@_c_0_           ; %t{0}: const int*2B = lea c{0}: const int[5]*2B
        mov word [bp - 4], bx     ; *(arr2{0}: const int**2B) = store %t{0}: const int*2B
        mov word [bp - 8], 1      ; *(arr3{0}: const int[2]*2B) = store %1: const int2B
        mov word [bp - 6], 2      ; *(arr3{0}: const int[2]*2B + %2) = store %2: const int2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        dw 1, 2, 3, 4, 5
      `);
    });

    test('struct array', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; char z; } vec[] = { { .y = 4 }, { .x =  5, .z = 7 }};
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 10
        mov word [bp - 8], 4      ; *(vec{0}: struct Vec2[2]*2B + %2) = store %4: int2B
        mov word [bp - 5], 5      ; *(vec{0}: struct Vec2[2]*2B + %5) = store %5: int2B
        mov byte [bp - 1], 7      ; *(vec{0}: struct Vec2[2]*2B + %9) = store %7: char1B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Strings initialization', () => {
    test('const char* letters1 = "H";', () => {
      expect(/* cpp */ `
        void main() {
          const char* letters1 = "H";
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[1]*2B
        mov word [bp - 2], bx     ; *(letters1{0}: const char**2B) = store %t{0}: const char*2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        db "H"
      `);
    });

    test('const char* letters = "Hell";', () => {
      expect(/* cpp */ `
        void main() {
          const char* letters1 = "Hell";
          char* letters2 = "Hello";
          const char* letters3 = "Hello world";
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[1]*2B
        mov word [bp - 2], bx     ; *(letters1{0}: const char**2B) = store %t{0}: const char*2B
        mov di, @@_c_1_           ; %t{1}: char*2B = lea c{1}: char[1]*2B
        mov word [bp - 4], di     ; *(letters2{0}: char**2B) = store %t{1}: char*2B
        mov si, @@_c_2_           ; %t{2}: const char*2B = lea c{2}: const char[1]*2B
        mov word [bp - 6], si     ; *(letters3{0}: const char**2B) = store %t{2}: const char*2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        db "Hell"
        @@_c_1_:
        db "Hello"
        @@_c_2_:
        db "Hello world"
      `);
    });

    test('char letters1[] = "Hell";', () => {
      expect(/* cpp */ `
        void main() {
          char letters1[] = "Hell";
          const char letters2[] = "Hello!";
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 7
        mov word [bp - 5], 25928  ; *(letters1{0}: int*2B) = store %25928: int2B
        mov word [bp - 3], 27756  ; *(letters1{0}: int*2B + %2) = store %27756: int2B
        mov byte [bp - 1], 0      ; *(letters1{0}: char[5]*2B + %4) = store %0: char1B
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[1]*2B
        mov word [bp - 7], bx     ; *(letters2{0}: const char**2B) = store %t{0}: const char*2B
        mov sp, bp
        pop bp
        ret

        @@_c_0_:
        db "Hello!"
      `);
    });

    test('various array string initializers', () => {
      expect(/* cpp */ `
        int strlen(const char* str) {
          for (int i = 0;;++i) {
            if (*(str + i) == 0) {
              return i;
            }
          }

          return -1;
        }
        void main() {
          const char* HELLO_WORLD = "Hello world!";
          const char HELLO_WORLD2[] = "Hello world2!";
          const char* HELLO_WORLD3[] = { "Hello world3!", "Hello world45623!" }; // incorrect result

          int length = strlen(HELLO_WORLD);
          asm("xchg dx, dx");

          int length2 = strlen(HELLO_WORLD2);
          asm("xchg dx, dx");

          int length3 = strlen(HELLO_WORLD3[1]);
          asm("xchg dx, dx");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def strlen(str{0}: const char**2B): [ret: int2B]
        @@_fn_strlen:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
        @@_L1:
        mov bx, [bp + 4]          ; %t{2}: const char*2B = load str{0}: const char**2B
        add bx, word [bp - 2]     ; %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
        mov al, [bx]              ; %t{5}: const char1B = load %t{4}: const char*2B
        cmp al, 0                 ; %t{6}: i1:zf = icmp %t{5}: const char1B equal %0: char1B
        jnz @@_L4                 ; br %t{6}: i1:zf, false: L4
        @@_L5:
        mov ax, [bp - 2]
        mov sp, bp
        pop bp
        ret 2
        @@_L4:
        mov ax, [bp - 2]
        add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
        mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{1}: int2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        mov ax, word -1
        mov sp, bp
        pop bp
        ret 2
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 14
        mov bx, @@_c_0_           ; %t{9}: const char*2B = lea c{0}: const char[1]*2B
        mov word [bp - 2], bx     ; *(HELLO_WORLD{0}: const char**2B) = store %t{9}: const char*2B
        mov di, @@_c_1_           ; %t{10}: const char*2B = lea c{1}: const char[1]*2B
        mov word [bp - 4], di     ; *(HELLO_WORLD2{0}: const char**2B) = store %t{10}: const char*2B
        mov ax, word [@@_c_2_]    ; %t{12}: const char*2B = load %t{11}: const char**2B
        mov word [bp - 8], ax     ; *(HELLO_WORLD3{0}: const char*[2]*2B) = store %t{12}: const char*2B
        mov cx, word [@@_c_3_]    ; %t{14}: const char*2B = load %t{13}: const char**2B
        mov word [bp - 6], cx     ; *(HELLO_WORLD3{0}: const char*[2]*2B + %2) = store %t{14}: const char*2B
        mov si, [bp - 2]          ; %t{16}: const char*2B = load HELLO_WORLD{0}: const char**2B
        push si
        call @@_fn_strlen
        mov word [bp - 10], ax    ; *(length{0}: int*2B) = store %t{17}: int2B
        xchg dx, dx
        mov bx, [bp - 4]          ; %t{19}: const char*2B = load HELLO_WORLD2{0}: const char**2B
        push bx
        call @@_fn_strlen
        mov word [bp - 12], ax    ; *(length2{0}: int*2B) = store %t{20}: int2B
        xchg dx, dx
        lea bx, [bp - 8]          ; %t{22}: const char*[2]*2B = lea HELLO_WORLD3{0}: const char*[2]*2B
        add bx, 2                 ; %t{23}: const char*[2]*2B = %t{22}: const char*[2]*2B plus %2: int2B
        mov cx, [bx]              ; %t{24}: const char*2B = load %t{23}: const char*[2]*2B
        push cx
        call @@_fn_strlen
        mov word [bp - 14], ax    ; *(length3{0}: int*2B) = store %t{25}: int2B
        xchg dx, dx
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        db "Hello world!"
        @@_c_1_:
        db "Hello world2!"
        @@_c_2_:
        dw @@_c_2_@str$0_0
        @@_c_2_@str$0_0: db "Hello world3!"
        @@_c_3_:
        dw @@_c_3_@str$0_0
        @@_c_3_@str$0_0: db "Hello world45623!"
      `);
    });

    test('multidimensional access to string array', () => {
      expect(/* cpp */ `
        void main() {
          const char* str2[] = { "Hello world2!", "Hello world344!", 0x5 };
          char a = str2[1][10];
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 7
        mov ax, word [@@_c_0_]    ; %t{1}: const char*2B = load %t{0}: const char**2B
        mov word [bp - 6], ax     ; *(str2{0}: const char*[3]*2B) = store %t{1}: const char*2B
        mov bx, word [@@_c_1_]    ; %t{3}: const char*2B = load %t{2}: const char**2B
        mov word [bp - 4], bx     ; *(str2{0}: const char*[3]*2B + %2) = store %t{3}: const char*2B
        mov word [bp - 2], 5      ; *(str2{0}: const char*[3]*2B + %4) = store %5: const char*2B
        lea di, [bp - 6]          ; %t{4}: const char*[3]*2B = lea str2{0}: const char*[3]*2B
        add di, 2                 ; %t{5}: const char*[3]*2B = %t{4}: const char*[3]*2B plus %2: int2B
        mov cx, [di]              ; %t{6}: const char*[3]6B = load %t{5}: const char*[3]*2B
        add cx, 10                ; %t{7}: const char**2B = %t{6}: const char*[3]6B plus %10: int2B
        mov si, cx
        mov cx, [si]              ; %t{8}: const char*2B = load %t{7}: const char**2B
        mov byte [bp - 7], cl     ; *(a{0}: char*2B) = store %t{8}: const char*2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        dw @@_c_0_@str$0_0
        @@_c_0_@str$0_0: db "Hello world2!"
        @@_c_1_:
        dw @@_c_1_@str$0_0
        @@_c_1_@str$0_0: db "Hello world344!"
      `);
    });

    test('initialize literal inside function call', () => {
      expect(/* cpp */ `
        int strlen(const char* str) {
          for (int i = 0;;++i) {
            char s = str[i];

            if (s == 0) {
              return i;
            }
          }

          return -1;
        }

        void main() {
          int length2 = strlen("Hello world 34234!");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def strlen(str{0}: const char**2B): [ret: int2B]
        @@_fn_strlen:
        push bp
        mov bp, sp
        sub sp, 3
        mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
        @@_L1:
        mov bx, [bp + 4]          ; %t{2}: const char*2B = load str{0}: const char**2B
        mov ax, [bp - 2]
        add bx, ax                ; %t{5}: const char*2B = %t{2}: const char*2B plus %t{4}: const char*2B
        mov cl, [bx]              ; %t{6}: const char1B = load %t{5}: const char*2B
        mov byte [bp - 3], cl     ; *(s{0}: char*2B) = store %t{6}: const char1B
        cmp byte [bp - 3], 0      ; %t{8}: i1:zf = icmp %t{7}: char1B equal %0: char1B
        jnz @@_L4                 ; br %t{8}: i1:zf, false: L4
        @@_L5:
        mov ax, [bp - 2]
        mov sp, bp
        pop bp
        ret 2
        @@_L4:
        mov ax, [bp - 2]
        add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
        mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{1}: int2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        mov ax, word -1
        mov sp, bp
        pop bp
        ret 2
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov ax, word [@@_c_0_]    ; %t{13}: const char*2B = load %t{12}: const char**2B
        push ax
        call @@_fn_strlen
        mov word [bp - 2], ax     ; *(length2{0}: int*2B) = store %t{14}: int2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        dw @@_c_0_@str$0_0
        @@_c_0_@str$0_0: db "Hello world 34234!"
      `);
    });
  });
});
