<p align='center'>
  <img src='doc/logo.png' alt='Banner' width='168px'>
</p>

# ts-c-compiler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/mati365/i8086.js?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/mati365/i8086.js?style=flat-square)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Known Vulnerabilities](https://snyk.io/test/github/Mati365/i8086.js/badge.svg?targetFile=package.json&style=flat-square)](https://snyk.io/test/github/Mati365/i8086.js?targetFile=package.json)

Multipass portable C lang compiler toolkit with IR code generator including backend, frontend, and optimizer phases. Designed to simple prototyping 16bit toy operating systems and games.

**🚧 Warn! The project is unstable so please do not use it on production!**

## What does it offer? ⭐

1. Reasonable assembly code quality in NASM syntax
2. Simple prototyping boot sector games
3. Designed especially for old-school 16bit computers with Intel 80286 (and newer) CPU and produces only simple ASM instructions
4. Backend / Frontend architecture that allows you to add new backends in TypeScript (especially useful for homebrew FPGA CPU)
5. Peephole optimization of IR code, precompute of constant expressions during compile time and optimizer phase
6. Slow compile times - feel the vibe of old computing

## Install

```bash
yarn add @ts-c-compiler/cli
```

```bash
Usage: ts-c [options] <source>

Arguments:
  source                 Relative or absolute path to source file

Options:
  -o, --output <string>  Relative path to your output binary
  -ps, --print-assembly  Print assembly output
  -d, --debug            Print AST tree and assembly output
  -b, --bootsector       Generate 512B bootsector output. Remember to have main entrypoint.
  -h, --help             display help for command
```

### Example

Compile `main.c` to x86-16 binary:

```bash
npx ts-c ./main.c -o ./output.bin
```

Print assembly output without generate binary file:

```bash
npx ts-c ./main.c -ps

0x000000                      55                            push bp
0x000001                      89 e5                         mov bp, sp
0x000003                      83 ec 02                      sub sp, 0x2
0x000006                      c7 46 fe 04 00                mov word [bp-2], 0x4
0x00000b                      89 ec                         mov sp, bp
0x00000d                      5d                            pop bp
0x00000e                      c3                            ret
```

## What can be currently compiled?

### Advanced array / pointers / ternary expressions

```c
  int strlen(const char* str) {
    for (int i = 0;;++i) {
      if (*(str + i) == 0) {
        return i;
      }
    }

    return -1;
  }

  typedef struct Box {
    int x, y;
    const char* str;
  } box_t;

  int max (int a, int b) {
    return a > b ? a : b;
  }

  void main() {
    box_t vec[] = { { .y = 5 }, { .x = 4, .str = "ABC" } };

    vec[0].str = "Hello world!";
    vec[0].y++;
    vec[1].x += 3;

    int k = vec[1].x * vec[0].y + strlen(vec[0].str);
    int d = max(666, k * 20);

    asm("xchg dx, dx");
  }
```

<details>
  <summary><strong>IR Output</strong></summary>

```ruby
# --- Block strlen ---
def strlen(str{0}: const char**2B): [ret: int2B]
  i{0}: int*2B = alloca int2B
  *(i{0}: int*2B) = store %0: int2B
  L1:
  %t{2}: const char*2B = load str{0}: const char**2B
  %t{3}: int2B = load i{0}: int*2B
  %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
  %t{5}: const char1B = load %t{4}: const char*2B
  %t{6}: i1:zf = icmp %t{5}: const char1B equal %0: char1B
  br %t{6}: i1:zf, false: L4
  L5:
  %t{7}: int2B = load i{0}: int*2B
  ret %t{7}: int2B
  L4:
  %t{0}: int2B = load i{0}: int*2B
  %t{1}: int2B = %t{0}: int2B plus %1: int2B
  *(i{0}: int*2B) = store %t{1}: int2B
  jmp L1
  L3:
  ret %-1: char1B
  end-def


# --- Block max ---
def max(a{0}: int*2B, b{0}: int*2B): [ret: int2B]
  %t{9}: int2B = alloca int2B
  %t{10}: int2B = load a{0}: int*2B
  %t{11}: int2B = load b{0}: int*2B
  %t{12}: i1:zf = icmp %t{10}: int2B greater_than %t{11}: int2B
  br %t{12}: i1:zf, false: L8
  L7:
  %t{15}: int2B = load a{0}: int*2B
  %t{13}: int2B = assign:φ %t{15}: int2B
  jmp L6
  L8:
  %t{16}: int2B = load b{0}: int*2B
  %t{14}: int2B = assign:φ %t{16}: int2B
  L6:
  %t{9}: int2B = φ(%t{13}: int2B, %t{14}: int2B)
  ret %t{9}: int2B
  end-def


# --- Block main ---
def main():
  vec{0}: struct Box[3]*2B = alloca struct Box[3]18B
  *(vec{0}: struct Box[3]*2B + %2) = store %5: int2B
  *(vec{0}: struct Box[3]*2B + %6) = store %4: int2B
  *(vec{0}: int*2B + %10) = store %16961: int2B
  *(vec{0}: int*2B + %12) = store %67: int2B
  %t{17}: struct Box[3]*2B = lea vec{0}: struct Box[3]*2B
  %t{20}: const char**2B = label-offset c{0}
  %t{21}: const char*2B = load %t{20}: const char**2B
  *(vec{0}: struct Box[3]*2B + %4) = store %t{21}: const char*2B
  %t{24}: int*2B = %t{17}: struct Box[3]*2B plus %2: int2B
  %t{25}: int2B = load %t{24}: int*2B
  %t{26}: int2B = %t{25}: int2B plus %1: int2B
  *(vec{0}: struct Box[3]*2B + %2) = store %t{26}: int2B
  %t{28}: struct Box[3]*2B = %t{17}: struct Box[3]*2B plus %6: int2B
  %t{29}: int2B = load %t{28}: int*2B
  %t{30}: int2B = %t{29}: int2B plus %3: char1B
  *(vec{0}: struct Box[3]*2B + %6) = store %t{30}: int2B
  k{0}: int*2B = alloca int2B
  %t{32}: struct Box[3]*2B = %t{17}: struct Box[3]*2B plus %6: int2B
  %t{33}: int2B = load %t{32}: int*2B
  %t{36}: int*2B = %t{17}: struct Box[3]*2B plus %2: int2B
  %t{37}: int2B = load %t{36}: int*2B
  %t{38}: int2B = %t{33}: int2B mul %t{37}: int2B
  %t{42}: const char**2B = %t{17}: struct Box[3]*2B plus %4: int2B
  %t{43}: const char*2B = load %t{42}: const char**2B
  %t{44}: int2B = call label-offset strlen :: (%t{43}: const char*2B)
  %t{45}: int2B = %t{38}: int2B plus %t{44}: int2B
  *(k{0}: int*2B) = store %t{45}: int2B
  d{0}: int*2B = alloca int2B
  %t{47}: int2B = load k{0}: int*2B
  %t{48}: int2B = %t{47}: int2B mul %20: char1B
  %t{49}: int2B = call label-offset max :: (%666: int2B, %t{48}: int2B)
  *(d{0}: int*2B) = store %t{49}: int2B
  asm "xchg dx, dx"
  ret
  end-def

# --- Block Data ---
  c{0}: const char**2B = const { Hello world! }
```

</details>

<details open>
  <summary><strong>Binary output</strong></summary>

```asm
0x000000  <────╮              55                            push bp
0x000001       │              89 e5                         mov bp, sp
0x000003       │              83 ec 02                      sub sp, 0x2
0x000006       │              c7 46 fe 00 00                mov word [bp-2], 0x0
0x00000b  <──╮ │              8b 5e 04                      mov bx, word [bp+4]
0x00000e     │ │              03 5e fe                      add bx, word [bp-2]
0x000011     │ │              8a 07                         mov al, byte [bx]
0x000013     │ │              3c 00                         cmp al, 0x0
0x000015  ─╮ │ │              75 09                         jnz 0x20
0x000017   │ │ │              8b 46 fe                      mov ax, word [bp-2]
0x00001a   │ │ │              89 ec                         mov sp, bp
0x00001c   │ │ │              5d                            pop bp
0x00001d   │ │ │              c2 02 00                      ret 0x2
0x000020  <╯ │ │              8b 46 fe                      mov ax, word [bp-2]
0x000023     │ │              05 01 00                      add ax, 0x1
0x000026     │ │              89 46 fe                      mov word [bp-2], ax
0x000029  ───╯ │              eb e0                         jmp 0xb
0x00002b       │              b8 ff ff                      mov ax, -0x1
0x00002e       │              89 ec                         mov sp, bp
0x000030       │              5d                            pop bp
0x000031       │              c2 02 00                      ret 0x2
0x000034  <────┼─╮            55                            push bp
0x000035       │ │            89 e5                         mov bp, sp
0x000037       │ │            83 ec 02                      sub sp, 0x2
0x00003a       │ │            8b 46 06                      mov ax, word [bp+6]
0x00003d       │ │            39 46 04                      cmp word [bp+4], ax
0x000040  ─╮   │ │            7e 05                         jng 0x47
0x000042   │   │ │            8b 46 04                      mov ax, word [bp+4]
0x000045  ─┼─╮ │ │            eb 03                         jmp 0x4a
0x000047  <╯ │ │ │            8b 46 06                      mov ax, word [bp+6]
0x00004a  <──╯ │ │            89 ec                         mov sp, bp
0x00004c       │ │            5d                            pop bp
0x00004d       │ │            c2 04 00                      ret 0x4
0x000050       │ │            55                            push bp
0x000051       │ │            89 e5                         mov bp, sp
0x000053       │ │            83 ec 16                      sub sp, 0x16
0x000056       │ │            c7 46 f0 05 00                mov word [bp-16], 0x5
0x00005b       │ │            c7 46 f4 04 00                mov word [bp-12], 0x4
0x000060       │ │            c7 46 f8 41 42                mov word [bp-8], 0x4241
0x000065       │ │            c7 46 fa 43 00                mov word [bp-6], 0x43
0x00006a       │ │            8d 5e ee                      lea bx, word [bp-18]
0x00006d       │ │            a1 cc 00                      mov ax, ds:@@_c_0_
0x000070       │ │            89 46 f2                      mov word [bp-14], ax
0x000073       │ │            89 d9                         mov cx, bx
0x000075       │ │            83 c3 02                      add bx, 0x2
0x000078       │ │            8b 17                         mov dx, word [bx]
0x00007a       │ │            83 c2 01                      add dx, 0x1
0x00007d       │ │            89 56 f0                      mov word [bp-16], dx
0x000080       │ │            89 c8                         mov ax, cx
0x000082       │ │            83 c1 06                      add cx, 0x6
0x000085       │ │            89 cf                         mov di, cx
0x000087       │ │            8b 1d                         mov bx, word [di]
0x000089       │ │            83 c3 03                      add bx, 0x3
0x00008c       │ │            89 5e f4                      mov word [bp-12], bx
0x00008f       │ │            89 c1                         mov cx, ax
0x000091       │ │            05 06 00                      add ax, 0x6
0x000094       │ │            89 c6                         mov si, ax
0x000096       │ │            8b 14                         mov dx, word [si]
0x000098       │ │            89 c8                         mov ax, cx
0x00009a       │ │            83 c1 02                      add cx, 0x2
0x00009d       │ │            89 cf                         mov di, cx
0x00009f       │ │            8b 1d                         mov bx, word [di]
0x0000a1       │ │            0f af d3                      imul dx, bx
0x0000a4       │ │            05 04 00                      add ax, 0x4
0x0000a7       │ │            89 c6                         mov si, ax
0x0000a9       │ │            8b 0c                         mov cx, word [si]
0x0000ab       │ │            52                            push dx
0x0000ac       │ │            51                            push cx
0x0000ad  ─────╯ │            e8 50 ff                      call 0x0
0x0000b0         │            5a                            pop dx
0x0000b1         │            01 c2                         add dx, ax
0x0000b3         │            89 56 ec                      mov word [bp-20], dx
0x0000b6         │            8b 5e ec                      mov bx, word [bp-20]
0x0000b9         │            6b db 14                      imul bx, bx, 0x14
0x0000bc         │            53                            push bx
0x0000bd         │            68 9a 02                      push 0x29a
0x0000c0  ───────╯            e8 71 ff                      call 0x34
0x0000c3                      89 46 ea                      mov word [bp-22], ax
0x0000c6                      87 d2                         xchg dx, dx
0x0000c8                      89 ec                         mov sp, bp
0x0000ca                      5d                            pop bp
0x0000cb                      c3                            ret
0x0000cc                      ce 00                         dw @@_c_0_@str$0_0
0x0000ce                      48 65 6c 6c 6f 20 77 6f       db "hello world!", 0x0
          72 6c 64 21 00 00
```

</details>

### Printing BIOS charset

Printing BIOS charset:

```c
  const char* VRAM_ADDR = 0xB800;
  const char* KERNEL_INIT_MESSAGES[] = {
    "Tiny kernel!",
    "Charset table:"
  };

  struct Vec2 {
    int x, y;
  };

  struct Vec2 kernel_screen_cursor = {
    .x = 0,
    .y = 0,
  };

  int strlen(const char* str) {
    for (int i = 0;;++i) {
      if (*(str + i) == 0) {
        return i;
      }
    }

    return -1;
  }

  void kernel_screen_clear() {
    asm(
      "mov cx, 0x7d0\n"
      "mov ax, 0xF00\n"
      "mov dx, 0xB800\n"
      "mov es, dx\n"
      "xor di, di\n"
      "rep stosw\n"
    );
  }

  void kernel_print_char_at(int x, int y, char color, char letter) {
    const int offset = (y * 80 + x) * 2;

    asm(
      "mov gs, %[vram]\n"
      "mov dl, %[color]\n"
      "mov dh, %[letter]\n"
      "mov bx, %[offset]\n"
      "mov byte [gs:bx + 1], dl\n"
      "mov byte [gs:bx], dh\n"
      ::
        [vram] "r" (VRAM_ADDR),
        [offset] "m" (offset),
        [letter] "m" (letter),
        [color] "m" (color)
      : "dx", "bx", "gs"
    );
  }

  void kernel_screen_print_at(int x, int y, char color, const char* str) {
    const int len = strlen(str);

    for (int i = 0; i < len; ++i) {
      kernel_print_char_at(x + i, y, color, str[i]);
    }
  }

  void kernel_screen_newline() {
    kernel_screen_cursor.x = 0;
    kernel_screen_cursor.y++;
  }

  void kernel_screen_println(char color, const char* str) {
    kernel_screen_print_at(
      kernel_screen_cursor.x,
      kernel_screen_cursor.y,
      color,
      str,
    );

    kernel_screen_newline();
  }

  void main() {
    kernel_screen_clear();

    for (int i = 0; i < 0x2; ++i) {
      kernel_screen_println(0xF, KERNEL_INIT_MESSAGES[i]);
    }

    kernel_screen_newline();

    for (int x = 0; x < 0xFF; ++x) {
      kernel_print_char_at(x, kernel_screen_cursor.y, 0xF, 0x1 + x);
    }
  }
```

<details>
  <summary><strong>IR Output</strong></summary>

```ruby
# --- Block strlen ---
def strlen(str{0}: const char**2B): [ret: int2B]
  i{0}: int*2B = alloca int2B
  *(i{0}: int*2B) = store %0: int2B
  L1:
  %t{2}: const char*2B = load str{0}: const char**2B
  %t{3}: int2B = load i{0}: int*2B
  %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
  %t{5}: const char1B = load %t{4}: const char*2B
  %t{6}: i1:zf = icmp %t{5}: const char1B equal %0: char1B
  br %t{6}: i1:zf, false: L4
  L5:
  %t{7}: int2B = load i{0}: int*2B
  ret %t{7}: int2B
  L4:
  %t{0}: int2B = load i{0}: int*2B
  %t{1}: int2B = %t{0}: int2B plus %1: int2B
  *(i{0}: int*2B) = store %t{1}: int2B
  jmp L1
  L3:
  ret %-1: char1B
  end-def


# --- Block kernel_screen_clear ---
def kernel_screen_clear():
  asm "mov cx, 0x7d0
mov ax, 0xF00
mov dx, 0xB800
mov es, dx
xor di, di
rep stosw
"
  ret
  end-def


# --- Block kernel_print_char_at ---
def kernel_print_char_at(x{0}: int*2B, y{0}: int*2B, color{0}: char*2B, letter{0}: char*2B):
  offset{0}: const int*2B = alloca const int2B
  %t{9}: int2B = load y{0}: int*2B
  %t{10}: int2B = %t{9}: int2B mul %80: char1B
  %t{11}: int2B = load x{0}: int*2B
  %t{12}: int2B = %t{10}: int2B plus %t{11}: int2B
  %t{13}: int2B = %t{12}: int2B mul %2: char1B
  *(offset{0}: const int*2B) = store %t{13}: int2B
  %t{14}: const char**2B = label-offset c{0}
  %t{15}: const char*2B = load %t{14}: const char**2B
  %t{16}: const int2B = load offset{0}: const int*2B
  %t{17}: char1B = load letter{0}: char*2B
  %t{18}: char1B = load color{0}: char*2B
  asm "mov gs, %[vram]
mov dl, %[color]
mov dh, %[letter]
mov bx, %[offset]
mov byte [gs:bx + 1], dl
mov byte [gs:bx], dh
"
  ret
  end-def


# --- Block kernel_screen_print_at ---
def kernel_screen_print_at(x{1}: int*2B, y{1}: int*2B, color{1}: char*2B, str{1}: const char**2B):
  len{0}: const int*2B = alloca const int2B
  %t{20}: const char*2B = load str{1}: const char**2B
  %t{21}: int2B = call label-offset strlen :: (%t{20}: const char*2B)
  *(len{0}: const int*2B) = store %t{21}: int2B
  i{0}: int*2B = alloca int2B
  *(i{0}: int*2B) = store %0: int2B
  L6:
  %t{22}: int2B = load i{0}: int*2B
  %t{23}: const int2B = load len{0}: const int*2B
  %t{24}: i1:zf = icmp %t{22}: int2B less_than %t{23}: const int2B
  br %t{24}: i1:zf, true: L7, false: L8
  L7:
  %t{28}: int2B = load x{1}: int*2B
  %t{29}: int2B = load i{0}: int*2B
  %t{30}: int2B = %t{28}: int2B plus %t{29}: int2B
  %t{31}: int2B = load y{1}: int*2B
  %t{32}: char1B = load color{1}: char*2B
  %t{33}: const char*2B = load str{1}: const char**2B
  %t{35}: const char*2B = %t{29}: int2B mul %1: int2B
  %t{36}: const char*2B = %t{33}: const char*2B plus %t{35}: const char*2B
  %t{37}: const char1B = load %t{36}: const char*2B
  call label-offset kernel_print_char_at :: (%t{30}: int2B, %t{31}: int2B, %t{32}: char1B, %t{37}: const char1B)
  %t{26}: int2B = %t{29}: int2B plus %1: int2B
  *(i{0}: int*2B) = store %t{26}: int2B
  jmp L6
  L8:
  ret
  end-def


# --- Block kernel_screen_newline ---
def kernel_screen_newline():
  %t{38}: struct Vec2*2B = label-offset c{2}
  *(%t{38}: int*2B) = store %0: char1B
  %t{40}: int*2B = %t{38}: struct Vec2*2B plus %2: int2B
  %t{41}: int2B = load %t{40}: int*2B
  %t{42}: int2B = %t{41}: int2B plus %1: int2B
  *(%t{40}: int*2B) = store %t{42}: int2B
  ret
  end-def


# --- Block kernel_screen_println ---
def kernel_screen_println(color{1}: char*2B, str{1}: const char**2B):
  %t{44}: struct Vec2*2B = label-offset c{2}
  %t{45}: int2B = load %t{44}: int*2B
  %t{47}: int*2B = %t{44}: struct Vec2*2B plus %2: int2B
  %t{48}: int2B = load %t{47}: int*2B
  %t{49}: char1B = load color{1}: char*2B
  %t{50}: const char*2B = load str{1}: const char**2B
  call label-offset kernel_screen_print_at :: (%t{45}: int2B, %t{48}: int2B, %t{49}: char1B, %t{50}: const char*2B)
  call label-offset kernel_screen_newline :: ()
  ret
  end-def


# --- Block main ---
def main():
  call label-offset kernel_screen_clear :: ()
  i{0}: int*2B = alloca int2B
  *(i{0}: int*2B) = store %0: int2B
  L9:
  %t{53}: int2B = load i{0}: int*2B
  %t{54}: i1:zf = icmp %t{53}: int2B less_than %2: char1B
  br %t{54}: i1:zf, true: L10, false: L11
  L10:
  %t{58}: const char*[2]*2B = label-offset c{1}
  %t{59}: int2B = load i{0}: int*2B
  %t{60}: const char*[2]*2B = %t{59}: int2B mul %2: int2B
  %t{61}: const char*[2]*2B = %t{58}: const char*[2]*2B plus %t{60}: const char*[2]*2B
  %t{62}: const char*2B = load %t{61}: const char*[2]*2B
  call label-offset kernel_screen_println :: (%15: char1B, %t{62}: const char*2B)
  %t{56}: int2B = %t{59}: int2B plus %1: int2B
  *(i{0}: int*2B) = store %t{56}: int2B
  jmp L9
  L11:
  call label-offset kernel_screen_newline :: ()
  %1_x{0}: int*2B = alloca int2B
  *(%1_x{0}: int*2B) = store %0: int2B
  L12:
  %t{64}: int2B = load %1_x{0}: int*2B
  %t{65}: i1:zf = icmp %t{64}: int2B less_than %255: char1B
  br %t{65}: i1:zf, true: L13, false: L14
  L13:
  %t{69}: int2B = load %1_x{0}: int*2B
  %t{70}: struct Vec2*2B = label-offset c{2}
  %t{71}: int*2B = %t{70}: struct Vec2*2B plus %2: int2B
  %t{72}: int2B = load %t{71}: int*2B
  %t{74}: int2B = %t{69}: int2B plus %1: char1B
  call label-offset kernel_print_char_at :: (%t{69}: int2B, %t{72}: int2B, %15: char1B, %t{74}: int2B)
  %t{67}: int2B = %t{69}: int2B plus %1: int2B
  *(%1_x{0}: int*2B) = store %t{67}: int2B
  jmp L12
  L14:
  ret
  end-def

# --- Block Data ---
  c{0}: const char**2B = const { 47104 }
  c{1}: const char*[2]*2B = const { Tiny kernel!, Charset table: }
  c{2}: struct Vec2*2B = const { 0, 0 }
```

</details>

<details>
  <summary><strong>Binary output</strong></summary>

```asm
0x000000  <────╮              55                            push bp
0x000001       │              89 e5                         mov bp, sp
0x000003       │              83 ec 02                      sub sp, 0x2
0x000006       │              c7 46 fe 00 00                mov word [bp-2], 0x0
0x00000b  <──╮ │              8b 5e 04                      mov bx, word [bp+4]
0x00000e     │ │              03 5e fe                      add bx, word [bp-2]
0x000011     │ │              8a 07                         mov al, byte [bx]
0x000013     │ │              3c 00                         cmp al, 0x0
0x000015  ─╮ │ │              75 09                         jnz 0x20
0x000017   │ │ │              8b 46 fe                      mov ax, word [bp-2]
0x00001a   │ │ │              89 ec                         mov sp, bp
0x00001c   │ │ │              5d                            pop bp
0x00001d   │ │ │              c2 02 00                      ret 0x2
0x000020  <╯ │ │              8b 46 fe                      mov ax, word [bp-2]
0x000023     │ │              05 01 00                      add ax, 0x1
0x000026     │ │              89 46 fe                      mov word [bp-2], ax
0x000029  ───╯ │              eb e0                         jmp 0xb
0x00002b       │              b8 ff ff                      mov ax, -0x1
0x00002e       │              89 ec                         mov sp, bp
0x000030       │              5d                            pop bp
0x000031       │              c2 02 00                      ret 0x2
0x000034  <────┼─────╮        55                            push bp
0x000035       │     │        89 e5                         mov bp, sp
0x000037       │     │        b9 d0 07                      mov cx, 0x7d0
0x00003a       │     │        b8 00 0f                      mov ax, 0xf00
0x00003d       │     │        ba 00 b8                      mov dx, 0xb800
0x000040       │     │        8e c2                         mov es, dx
0x000042       │     │        31 ff                         xor di, di
0x000044       │     │        f3 ab                         repz stosw
0x000046       │     │        89 ec                         mov sp, bp
0x000048       │     │        5d                            pop bp
0x000049       │     │        c3                            ret
0x00004a  <────┼─╮<──┼───╮    55                            push bp
0x00004b       │ │   │   │    89 e5                         mov bp, sp
0x00004d       │ │   │   │    83 ec 02                      sub sp, 0x2
0x000050       │ │   │   │    8b 46 06                      mov ax, word [bp+6]
0x000053       │ │   │   │    6b c0 50                      imul ax, ax, 0x50
0x000056       │ │   │   │    03 46 04                      add ax, word [bp+4]
0x000059       │ │   │   │    d1 e0                         shl ax, 0x1
0x00005b       │ │   │   │    89 46 fe                      mov word [bp-2], ax
0x00005e       │ │   │   │    8b 1e 7e 01                   mov bx, word [@@_c_0_]
0x000062       │ │   │   │    8e eb                         mov gs, bx
0x000064       │ │   │   │    8a 56 08                      mov dl, byte [bp+8]
0x000067       │ │   │   │    8a 76 0a                      mov dh, byte [bp+10]
0x00006a       │ │   │   │    8b 5e fe                      mov bx, word [bp-2]
0x00006d       │ │   │   │    65 88 57 01                   mov byte [gs:bx+1], dl
0x000071       │ │   │   │    65 88 37                      mov byte [gs:bx], dh
0x000074       │ │   │   │    89 ec                         mov sp, bp
0x000076       │ │   │   │    5d                            pop bp
0x000077       │ │   │   │    c2 08 00                      ret 0x8
0x00007a  <────┼─┼─╮ │   │    55                            push bp
0x00007b       │ │ │ │   │    89 e5                         mov bp, sp
0x00007d       │ │ │ │   │    83 ec 04                      sub sp, 0x4
0x000080       │ │ │ │   │    8b 5e 0a                      mov bx, word [bp+10]
0x000083       │ │ │ │   │    53                            push bx
0x000084  ─────╯ │ │ │   │    e8 79 ff                      call 0x0
0x000087         │ │ │   │    89 46 fe                      mov word [bp-2], ax
0x00008a         │ │ │   │    c7 46 fc 00 00                mov word [bp-4], 0x0
0x00008f  <────╮ │ │ │   │    8b 46 fe                      mov ax, word [bp-2]
0x000092       │ │ │ │   │    39 46 fc                      cmp word [bp-4], ax
0x000095  ─╮   │ │ │ │   │    7c 02                         jl 0x99
0x000097  ─┼─╮ │ │ │ │   │    7d 2c                         jge 0xc5
0x000099  <╯ │ │ │ │ │   │    8b 46 04                      mov ax, word [bp+4]
0x00009c     │ │ │ │ │   │    03 46 fc                      add ax, word [bp-4]
0x00009f     │ │ │ │ │   │    8b 5e 0a                      mov bx, word [bp+10]
0x0000a2     │ │ │ │ │   │    03 5e fc                      add bx, word [bp-4]
0x0000a5     │ │ │ │ │   │    8a 0f                         mov cl, byte [bx]
0x0000a7     │ │ │ │ │   │    0f b6 d1                      movzx dx, cl
0x0000aa     │ │ │ │ │   │    52                            push dx
0x0000ab     │ │ │ │ │   │    8b 4e 08                      mov cx, word [bp+8]
0x0000ae     │ │ │ │ │   │    81 e1 ff 00                   and cx, 0xff
0x0000b2     │ │ │ │ │   │    51                            push cx
0x0000b3     │ │ │ │ │   │    ff 76 06                      push word [bp+6]
0x0000b6     │ │ │ │ │   │    50                            push ax
0x0000b7  ───┼─┼─╯ │ │   │    e8 90 ff                      call 0x4a
0x0000ba     │ │   │ │   │    8b 46 fc                      mov ax, word [bp-4]
0x0000bd     │ │   │ │   │    05 01 00                      add ax, 0x1
0x0000c0     │ │   │ │   │    89 46 fc                      mov word [bp-4], ax
0x0000c3  ───┼─╯   │ │   │    eb ca                         jmp 0x8f
0x0000c5  <──╯     │ │   │    89 ec                         mov sp, bp
0x0000c7           │ │   │    5d                            pop bp
0x0000c8           │ │   │    c2 08 00                      ret 0x8
0x0000cb  <╮<──────┼─┼─╮ │    55                            push bp
0x0000cc   │       │ │ │ │    89 e5                         mov bp, sp
0x0000ce   │       │ │ │ │    c7 06 a2 01 00 00             mov word [@@_c_2_], 0x0
0x0000d4   │       │ │ │ │    b8 a2 01                      mov ax, 0x1a2
0x0000d7   │       │ │ │ │    05 02 00                      add ax, 0x2
0x0000da   │       │ │ │ │    89 c7                         mov di, ax
0x0000dc   │       │ │ │ │    8b 1d                         mov bx, word [di]
0x0000de   │       │ │ │ │    83 c3 01                      add bx, 0x1
0x0000e1   │       │ │ │ │    89 1d                         mov word [di], bx
0x0000e3   │       │ │ │ │    89 ec                         mov sp, bp
0x0000e5   │       │ │ │ │    5d                            pop bp
0x0000e6   │       │ │ │ │    c3                            ret
0x0000e7  <┼───╮   │ │ │ │    55                            push bp
0x0000e8   │   │   │ │ │ │    89 e5                         mov bp, sp
0x0000ea   │   │   │ │ │ │    a1 a2 01                      mov ax, ds:@@_c_2_
0x0000ed   │   │   │ │ │ │    bb a2 01                      mov bx, 0x1a2
0x0000f0   │   │   │ │ │ │    83 c3 02                      add bx, 0x2
0x0000f3   │   │   │ │ │ │    8b 0f                         mov cx, word [bx]
0x0000f5   │   │   │ │ │ │    8b 7e 06                      mov di, word [bp+6]
0x0000f8   │   │   │ │ │ │    57                            push di
0x0000f9   │   │   │ │ │ │    8b 56 04                      mov dx, word [bp+4]
0x0000fc   │   │   │ │ │ │    81 e2 ff 00                   and dx, 0xff
0x000100   │   │   │ │ │ │    52                            push dx
0x000101   │   │   │ │ │ │    51                            push cx
0x000102   │   │   │ │ │ │    50                            push ax
0x000103  ─┼───┼───╯ │ │ │    e8 74 ff                      call 0x7a
0x000106  ─╯   │     │ │ │    e8 c2 ff                      call 0xcb
0x000109       │     │ │ │    89 ec                         mov sp, bp
0x00010b       │     │ │ │    5d                            pop bp
0x00010c       │     │ │ │    c2 04 00                      ret 0x4
0x00010f       │     │ │ │    55                            push bp
0x000110       │     │ │ │    89 e5                         mov bp, sp
0x000112       │     │ │ │    83 ec 04                      sub sp, 0x4
0x000115  ─────┼─────╯ │ │    e8 1c ff                      call 0x34
0x000118       │       │ │    c7 46 fe 00 00                mov word [bp-2], 0x0
0x00011d  <────┼─╮     │ │    83 7e fe 02                   cmp word [bp-2], 0x2
0x000121  ─╮   │ │     │ │    7c 02                         jl 0x125
0x000123  ─┼─╮ │ │     │ │    7d 20                         jge 0x145
0x000125  <╯ │ │ │     │ │    8b 46 fe                      mov ax, word [bp-2]
0x000128     │ │ │     │ │    89 c3                         mov bx, ax
0x00012a     │ │ │     │ │    d1 e0                         shl ax, 0x1
0x00012c     │ │ │     │ │    b9 80 01                      mov cx, 0x180
0x00012f     │ │ │     │ │    01 c1                         add cx, ax
0x000131     │ │ │     │ │    89 cf                         mov di, cx
0x000133     │ │ │     │ │    8b 15                         mov dx, word [di]
0x000135     │ │ │     │ │    53                            push bx
0x000136     │ │ │     │ │    52                            push dx
0x000137     │ │ │     │ │    6a 0f                         push 0xf
0x000139  ───┼─╯ │     │ │    e8 ab ff                      call 0xe7
0x00013c     │   │     │ │    5b                            pop bx
0x00013d     │   │     │ │    83 c3 01                      add bx, 0x1
0x000140     │   │     │ │    89 5e fe                      mov word [bp-2], bx
0x000143  ───┼───╯     │ │    eb d8                         jmp 0x11d
0x000145  <──╯─────────╯ │    e8 83 ff                      call 0xcb
0x000148                 │    c7 46 fc 00 00                mov word [bp-4], 0x0
0x00014d  <────╮         │    81 7e fc ff 00                cmp word [bp-4], 0xff
0x000152  ─╮   │         │    7c 02                         jl 0x156
0x000154  ─┼─╮ │         │    7d 24                         jge 0x17a
0x000156  <╯ │ │         │    b8 a2 01                      mov ax, 0x1a2
0x000159     │ │         │    05 02 00                      add ax, 0x2
0x00015c     │ │         │    89 c7                         mov di, ax
0x00015e     │ │         │    8b 1d                         mov bx, word [di]
0x000160     │ │         │    8b 46 fc                      mov ax, word [bp-4]
0x000163     │ │         │    89 c1                         mov cx, ax
0x000165     │ │         │    05 01 00                      add ax, 0x1
0x000168     │ │         │    51                            push cx
0x000169     │ │         │    50                            push ax
0x00016a     │ │         │    6a 0f                         push 0xf
0x00016c     │ │         │    53                            push bx
0x00016d     │ │         │    51                            push cx
0x00016e  ───┼─┼─────────╯    e8 d9 fe                      call 0x4a
0x000171     │ │              59                            pop cx
0x000172     │ │              83 c1 01                      add cx, 0x1
0x000175     │ │              89 4e fc                      mov word [bp-4], cx
0x000178  ───┼─╯              eb d3                         jmp 0x14d
0x00017a  <──╯                89 ec                         mov sp, bp
0x00017c                      5d                            pop bp
0x00017d                      c3                            ret
0x00017e                      00 b8                         dw 47104
0x000180                      84 01                         dw @@_c_1_@str$0_0
0x000182                      92 01                         dw @@_c_1_@str$0_1
0x000184                      54 69 6e 79 20 6b 65 72       db "tiny kernel!", 0x0
          6e 65 6c 21 00 00
0x000192                      43 68 61 72 73 65 74 20       db "charset table:", 0x0
          74 61 62 6c 65 3a 00 00
0x0001a2                      00 00 00 00                   dw 0, 0
```

</details>

## ASM syntax

It's pretty similar to NASM syntax (including preprocessor), examples: <br>
[https://github.com/Mati365/i8086.js/tree/master/packages/x86-assembler/tests/asm](https://github.com/Mati365/ts-c-compiler/tree/master/packages/x86-toolkit/x86-assembler/tests/asm)

## Architecture

### Multipass steps

- [x] Frontend **([source](https://github.com/Mati365/ts-c-compiler/blob/master/packages/compiler-pico-c/src/frontend/cIRcompiler.ts))**

  - [x] Lexer **([source](https://github.com/Mati365/ts-c-compiler/blob/master/packages/compiler-pico-c/src/frontend/parser/lexer/clexer.ts#L37))**
  - [x] AST creator **([source](https://github.com/Mati365/ts-c-compiler/blob/master/packages/compiler-pico-c/src/frontend/parser/grammar/grammar.ts))**
  - [x] Type checking **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/compiler-pico-c/src/frontend/analyze))**
  - [x] IR generation **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/compiler-pico-c/src/frontend/ir))**

- [x] Backend **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/compiler-pico-c/src/backend))**
  - [x] X86 arch backend **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/compiler-pico-c/src/arch/x86))**
    - [x] X86 Register linear scan allocation **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/compiler-pico-c/src/arch/x86/backend/reg-allocator))**
    - [x] X86 ASM generators **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/compiler-pico-c/src/arch/x86/backend/compilers))**

### X86 Arch support

- [x] 16bit real mode X86 arch support

  - [x] X86 16bit Multipass Assembler compatible with NASM syntax **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/x86-toolkit/x86-assembler))**

    - [x] Preprocessor **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/x86-toolkit/x86-assembler/src/preprocessor))** compatible with NASM that supports:
      - [x] Conditions and definitions: `%if`, `%ifn`, `%ifdef`, `%ifndef`, `%else`, `%elif`, `%elifndef`, `%elifdef`, `%elifn`, `%define`, `%undef`
      - [x] Macros: `%macro`, `%define`, `%imacro`
      - [x] Predefined variables: `__TIMES__`
      - [x] Inline expressions calls: `%[__TIMES__]`

  - [x] X86 CPU 16bit Intel 8086 virtual machine **([source](https://github.com/Mati365/ts-c-compiler/tree/master/packages/x86-toolkit/x86-cpu))**
    - [x] VGA graphical mode support **([source](https://github.com/Mati365/ts-c-compiler/blob/master/packages/x86-toolkit/x86-cpu/src/devices/Video/Renderers/VGAGraphicsModeCanvasRenderer.ts))**
    - [x] VGA text mode support **([source](https://github.com/Mati365/ts-c-compiler/blob/master/packages/x86-toolkit/x86-cpu/src/devices/Video/Renderers/VGATextModeCanvasRenderer.ts))**

## Current progress

- [ ] C compiler
  - [x] Frontend
    - [x] Syntax parser
    - [x] Typechecker
    - [x] IR code generator
  - [x] Backend
    - [x] IR optimizer
    - [x] X86-16 Code generator
      - [x] Register allocator
        - [x] Basic allocation using ownership checking
        - [x] Spilling regs and detection lifetime of IR vars
      - [x] Compile math integer instruction
        - [x] Compile `*`, `+`, `-`, `/`
        - [x] Compile `<<`, `>>`
        - [x] Compile xor / and / or / not
      - [x] Compile if stmts
      - [x] Compile loops `while {}`, `do { } while`, `for (...) {}`
      - [x] Compile typedefs
      - [x] Compile pointers
        - [x] Basic pointer access `*k = 5`
        - [x] Array access `k[4]`
      - [x] Compile function calls
      - [x] Compile `asm` tag
        - [x] Basic `asm` tag without args
        - [x] `asm` tag with arguments
      - [ ] Unions
      - [ ] Preprocessor
      - [ ] Stdlib
- [x] ASM Compiler
  - [x] NASM syntax instruction compiler matcher with expression eval `mov ax, byte [ds:label+bx+12+(1/3)]`
  - [x] Instruction prefix support `rep movsw`
  - [x] Compiler bits/org config `[bits 16]`, `[org 0x7C00]`
  - [x] Labels support `jmp_label:`
  - [x] Data define support `db`, `dw`, `dd`, `dq`, `dt`
  - [x] `EQU`, `times` support
  - [x] Floating point numbers support
  - [x] Preprocessor
    - [x] Basic lang keywords support: `%if`, `%ifn`, `%ifdef`, `%ifndef`, `%else`, `%elif`, `%elifndef`, `%elifdef`, `%elifn`, `%define`, `%undef`
    - [x] Macros support: `%macro`, `%define`, `%imacro`
    - [x] Predefined macros like `__TIMES__`
    - [x] Inline expressions calls `%[__TIMES__]`
  - [x] Output logger
    - [x] Basic logger binary blob serializer helpers
    - [x] Diassembler binary view
    - [x] Branch arrows (for `jmp`, `call`, `jz` etc.)
- [ ] CPU Emulator
  - [x] Magic breakpoint support `xchg bx, bx`
  - [x] Interrupts handlers support
  - [x] Basic Intel ~80186 instructions set
  - [x] ALU instructions support
  - [x] FPU Support
    - [x] Assembler
    - [x] Emulator
  - [ ] Basic PIT/PIC support
    - [x] PIT
    - [ ] PIC
    - [ ] IDE
    - [ ] PS2
  - [ ] Graphics mode
    - [x] Basic canvas graphics driver
    - [x] Text Mode
    - [x] Graphics VGA
    - [x] VGA IO ports bindings
  - [ ] BIOS
    - [x] Basic bios interrupt handlers
- [ ] App frontend
  - [ ] Basic front CSS UI
  - [ ] Debugger

## Screens

![C Compiler Hello World](/doc/screen-13.png)
![C Compiler Advanced Expressions](/doc/screen-12.png)
![C Compiler Assembly](/doc/screen-11.png)
![C Compiler IR](/doc/screen-10.png)
![C Compiler IR](/doc/screen-9.png)
![Pillman](/doc/screen-6.png)
![Space invaders](/doc/screen-7.png)
![Prototype](/doc/screen.gif)
![Prototype](/doc/screen-2.png)
![Tetris](/doc/screen-5.png)
![ASM Preprocessor](/doc/screen-4.png)
![ASM Compiler](/doc/screen-3.png)
![C Compiler](/doc/screen-8.png)

## Docs

<https://cs.lmu.edu/~ray/notes/ir/>

<https://www.youtube.com/watch?v=yTXCPGAD3SQ>

<https://books.google.pl/books?id=Lq4yDwAAQBAJ&pg=PA120&lpg=PA120&dq=chain4+mode&source=bl&ots=Eun_wNFE7b&sig=ACfU3U37tSXE7qOZn0AKGeFwaaNLS4nrKg&hl=pl&sa=X&ved=2ahUKEwjlupT5-u_pAhVNxhoKHVfRA7YQ6AEwAnoECAoQAQ#v=onepage&q=chain4%20mode&f=false>

<https://bellard.org/otcc/otccn.c>

<https://bellard.org/otcc/>

<https://gist.github.com/nikAizuddin/0e307cac142792dcdeba>

<http://www.plantation-productions.com/Webster/www.artofasm.com/Windows/HTML/RealArithmetica3.html>

<https://gist.github.com/mikesmullin/6259449>

<http://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt>

<http://ece425web.groups.et.byu.net/stable/labs/8086Assembly.html>

<http://dsearls.org/courses/C391OrgSys/IntelAL/8086_instruction_set.html>

<https://pdos.csail.mit.edu/6.828/2008/readings/i386/s17_02.htm>

<https://xem.github.io/minix86/manual/intel-x86-and-64-manual-vol1/o_7281d5ea06a5b67a-194.html>

<https://johnloomis.org/ece314/notes/fpu/fpu.pdf>

<https://www.felixcloutier.com/x86/index.html>

<https://c9x.me/x86/html/file_module_x86_id_87.html>

<http://www.osdever.net/FreeVGA/vga/graphreg.htm#06>

<http://www.osdever.net/FreeVGA/vga/vgamem.htm>

<http://www.osdever.net/FreeVGA/home.htm>

## License

The MIT License (MIT)
Copyright (c) 2021 Mateusz Bagiński

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
