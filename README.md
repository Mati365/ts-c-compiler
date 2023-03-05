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
