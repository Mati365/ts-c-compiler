# ts-c-compiler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/mati365/i8086.js?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/mati365/i8086.js?style=flat-square)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Known Vulnerabilities](https://snyk.io/test/github/Mati365/i8086.js/badge.svg?targetFile=package.json&style=flat-square)](https://snyk.io/test/github/Mati365/i8086.js?targetFile=package.json)

16 bit ANSI C99 x86 compiler, assembler and virtual machine written entirely in TypeScript. It is designed to help with prototyping small bootsector (or bigger) real mode games 🎮 and apps 💻.

JavaScript 16bit x86 assembler bundled in emulator is designed to be fully binarny compatible with 16bit NASM compiler.

<img src="/doc/editor.png" align="right" />

## Running

```bash
yarn run develop
```

## What can be currently compiled?

It will print rainbow list of `Hello World` in 16bit Real Mode.

```c
int strlen(const char* str) {
  for (int i = 0;;++i) {
    if (*(str + i) == 0) {
      return i;
    }
  }

  return -1;
}

void clear_screen() {
  asm(
    "mov cx, 0x7d0\n"
    "mov ax, 0xF00\n"
    "mov dx, 0xB800\n"
    "mov es, dx\n"
    "xor di, di\n"
    "rep stosw\n"
  );
}

void printf(int x, int y, char color, const char* str) {
  int len = strlen(str);
  int origin = (y * 80 + x) * 2;

  asm(
    "mov ax, 0xB800\n"
    "mov gs, ax\n"
    :::"ax"
  );

  for (int i = 0; i < len; ++i) {
    const char c = str[i];
    const int offset = origin + i * 2;

    asm(
      "mov dl, %[color]\n"
      "mov bx, %[offset]\n"
      "mov byte [gs:bx + 1], dl\n"
      "mov byte [gs:bx], %[c]\n"
      :: [c] "r" (c), [offset] "r" (offset), [color] "m" (color)
      : "dl"
    );
  }
}

void main() {
  clear_screen();

  for (int i = 0; i < 0xf; ++i) {
    printf(0, i, i + 1, "Hello world!");
  }
}
```

IR output:

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


# --- Block clear_screen ---
def clear_screen():
  asm "mov cx, 0x7d0
mov ax, 0xF00
mov dx, 0xB800
mov es, dx
xor di, di
rep stosw
"
  ret
  end-def


# --- Block printf ---
def printf(x{0}: int*2B, y{0}: int*2B, color{0}: char*2B, str{1}: const char**2B):
  len{0}: int*2B = alloca int2B
  %t{10}: const char*2B = load str{1}: const char**2B
  %t{11}: int2B = call label-offset strlen :: (%t{10}: const char*2B)
  *(len{0}: int*2B) = store %t{11}: int2B
  origin{0}: int*2B = alloca int2B
  %t{12}: int2B = load y{0}: int*2B
  %t{13}: int2B = %t{12}: int2B mul %80: char1B
  %t{14}: int2B = load x{0}: int*2B
  %t{15}: int2B = %t{13}: int2B plus %t{14}: int2B
  %t{16}: int2B = %t{15}: int2B mul %2: char1B
  *(origin{0}: int*2B) = store %t{16}: int2B
  asm "mov ax, 0xB800
mov gs, ax
"
  i{0}: int*2B = alloca int2B
  *(i{0}: int*2B) = store %0: int2B
  L6:
  %t{17}: int2B = load i{0}: int*2B
  %t{18}: int2B = load len{0}: int*2B
  %t{19}: i1:zf = icmp %t{17}: int2B less_than %t{18}: int2B
  br %t{19}: i1:zf, true: L7, false: L8
  L7:
  c{0}: const char*2B = alloca const char1B
  %t{22}: const char*2B = load str{1}: const char**2B
  %t{23}: int2B = load i{0}: int*2B
  %t{25}: const char*2B = %t{22}: const char*2B plus %t{23}: int2B
  %t{26}: const char1B = load %t{25}: const char*2B
  *(c{0}: const char*2B) = store %t{26}: const char1B
  offset{0}: const int*2B = alloca const int2B
  %t{27}: int2B = load origin{0}: int*2B
  %t{29}: int2B = %t{23}: int2B mul %2: char1B
  %t{30}: int2B = %t{27}: int2B plus %t{29}: int2B
  *(offset{0}: const int*2B) = store %t{30}: int2B
  %t{31}: const char1B = load c{0}: const char*2B
  %t{32}: const int2B = load offset{0}: const int*2B
  %t{33}: char1B = load color{0}: char*2B
  asm "mov dl, %[color]
mov bx, %[offset]
mov byte [gs:bx + 1], dl
mov byte [gs:bx], %[c]
"
  %t{21}: int2B = %t{23}: int2B plus %1: int2B
  *(i{0}: int*2B) = store %t{21}: int2B
  jmp L6
  L8:
  ret
  end-def


# --- Block main ---
def main():
  call label-offset clear_screen :: ()
  i{0}: int*2B = alloca int2B
  *(i{0}: int*2B) = store %0: int2B
  L9:
  %t{35}: int2B = load i{0}: int*2B
  %t{36}: i1:zf = icmp %t{35}: int2B less_than %15: char1B
  br %t{36}: i1:zf, true: L10, false: L11
  L10:
  %t{40}: int2B = load i{0}: int*2B
  %t{42}: int2B = %t{40}: int2B plus %1: char1B
  %t{43}: const char**2B = alloca const char*2B
  %t{44}: const char*2B = lea c{0}: const char[13]13B
  *(%t{43}: const char**2B) = store %t{44}: const char*2B
  call label-offset printf :: (%0: char1B, %t{40}: int2B, %t{42}: int2B, %t{43}: const char**2B)
  %t{37}: int2B = load i{0}: int*2B
  %t{38}: int2B = %t{37}: int2B plus %1: int2B
  *(i{0}: int*2B) = store %t{38}: int2B
  jmp L9
  L11:
  ret
  end-def

# --- Block Data ---
  c{0}: const char[13]13B = const { 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33, 0 }
```

Binary output:

```asm
Assembly:

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
0x000037       │ │            b9 d0 07                      mov cx, 0x7d0
0x00003a       │ │            b8 00 0f                      mov ax, 0xf00
0x00003d       │ │            ba 00 b8                      mov dx, 0xb800
0x000040       │ │            8e c2                         mov es, dx
0x000042       │ │            31 ff                         xor di, di
0x000044       │ │            f3 ab                         repz stosw
0x000046       │ │            89 ec                         mov sp, bp
0x000048       │ │            5d                            pop bp
0x000049       │ │            c3                            ret
0x00004a  <────┼─┼─╮          55                            push bp
0x00004b       │ │ │          89 e5                         mov bp, sp
0x00004d       │ │ │          83 ec 09                      sub sp, 0x9
0x000050       │ │ │          8b 5e 0a                      mov bx, word [bp+10]
0x000053       │ │ │          53                            push bx
0x000054  ─────╯ │ │          e8 a9 ff                      call 0x0
0x000057         │ │          89 46 fe                      mov word [bp-2], ax
0x00005a         │ │          8b 5e 06                      mov bx, word [bp+6]
0x00005d         │ │          6b db 50                      imul bx, bx, 0x50
0x000060         │ │          03 5e 04                      add bx, word [bp+4]
0x000063         │ │          d1 e3                         shl bx, 0x1
0x000065         │ │          89 5e fc                      mov word [bp-4], bx
0x000068         │ │          b8 00 b8                      mov ax, 0xb800
0x00006b         │ │          8e e8                         mov gs, ax
0x00006d         │ │          c7 46 fa 00 00                mov word [bp-6], 0x0
0x000072  <────╮ │ │          8b 46 fe                      mov ax, word [bp-2]
0x000075       │ │ │          39 46 fa                      cmp word [bp-6], ax
0x000078  ─╮   │ │ │          7c 02                         jl 0x7c
0x00007a  ─┼─╮ │ │ │          7d 36                         jge 0xb2
0x00007c  <╯ │ │ │ │          8b 5e 0a                      mov bx, word [bp+10]
0x00007f     │ │ │ │          03 5e fa                      add bx, word [bp-6]
0x000082     │ │ │ │          8a 07                         mov al, byte [bx]
0x000084     │ │ │ │          88 46 f9                      mov byte [bp-7], al
0x000087     │ │ │ │          8b 4e fa                      mov cx, word [bp-6]
0x00008a     │ │ │ │          89 ca                         mov dx, cx
0x00008c     │ │ │ │          d1 e1                         shl cx, 0x1
0x00008e     │ │ │ │          8b 7e fc                      mov di, word [bp-4]
0x000091     │ │ │ │          01 cf                         add di, cx
0x000093     │ │ │ │          89 7e f7                      mov word [bp-9], di
0x000096     │ │ │ │          8a 66 f9                      mov ah, byte [bp-7]
0x000099     │ │ │ │          8b 76 f7                      mov si, word [bp-9]
0x00009c     │ │ │ │          52                            push dx
0x00009d     │ │ │ │          8a 56 08                      mov dl, byte [bp+8]
0x0000a0     │ │ │ │          89 f3                         mov bx, si
0x0000a2     │ │ │ │          65 88 57 01                   mov byte [gs:bx+1], dl
0x0000a6     │ │ │ │          65 88 27                      mov byte [gs:bx], ah
0x0000a9     │ │ │ │          5a                            pop dx
0x0000aa     │ │ │ │          83 c2 01                      add dx, 0x1
0x0000ad     │ │ │ │          89 56 fa                      mov word [bp-6], dx
0x0000b0  ───┼─╯ │ │          eb c0                         jmp 0x72
0x0000b2  <──╯   │ │          89 ec                         mov sp, bp
0x0000b4         │ │          5d                            pop bp
0x0000b5         │ │          c2 08 00                      ret 0x8
0x0000b8         │ │          55                            push bp
0x0000b9         │ │          89 e5                         mov bp, sp
0x0000bb         │ │          83 ec 04                      sub sp, 0x4
0x0000be  ───────╯ │          e8 73 ff                      call 0x34
0x0000c1           │          c7 46 fe 00 00                mov word [bp-2], 0x0
0x0000c6  <────╮   │          83 7e fe 0f                   cmp word [bp-2], 0xf
0x0000ca  ─╮   │   │          7c 02                         jl 0xce
0x0000cc  ─┼─╮ │   │          7d 23                         jge 0xf1
0x0000ce  <╯ │ │   │          8b 46 fe                      mov ax, word [bp-2]
0x0000d1     │ │   │          89 c3                         mov bx, ax
0x0000d3     │ │   │          05 01 00                      add ax, 0x1
0x0000d6     │ │   │          bf f5 00                      mov di, 0xf5
0x0000d9     │ │   │          89 7e fc                      mov word [bp-4], di
0x0000dc     │ │   │          ff 76 fc                      push word [bp-4]
0x0000df     │ │   │          50                            push ax
0x0000e0     │ │   │          53                            push bx
0x0000e1     │ │   │          6a 00                         push 0x0
0x0000e3  ───┼─┼───╯          e8 64 ff                      call 0x4a
0x0000e6     │ │              8b 46 fe                      mov ax, word [bp-2]
0x0000e9     │ │              05 01 00                      add ax, 0x1
0x0000ec     │ │              89 46 fe                      mov word [bp-2], ax
0x0000ef  ───┼─╯              eb d5                         jmp 0xc6
0x0000f1  <──╯                89 ec                         mov sp, bp
0x0000f3                      5d                            pop bp
0x0000f4                      c3                            ret
0x0000f5                      48 65 6c 6c 6f 20 77 6f       db 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33, 0
          72 6c 64 21 00
```

## ASM syntax

It's pretty similar to NASM syntax (including preprocessor), examples: <br>
https://github.com/Mati365/i8086.js/tree/master/packages/x86-assembler/tests/asm

## Testing

```bash
yarn run test
```

## Status

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
        - [ ] Compile xor / and / or / not
      - [x] Compile if stmts
      - [x] Compile `while {}`, `do { } while`, `for (...) {}` loops
      - [x] Compile pointers
        - [x] Basic pointer access `*k = 5`
        - [x] Array access `k[4]`
      - [x] Compile function calls
      - [ ] Compile `asm` tag
        - [x] Basic `asm` tag without args
        - [ ] `asm` tag with arguments
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
