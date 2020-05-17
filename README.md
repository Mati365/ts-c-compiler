# i8086.js

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/be3d3814d7ba44cab8adce2acfd485b4)](https://app.codacy.com/manual/Mati365/i8086.js?utm_source=github.com&utm_medium=referral&utm_content=Mati365/i8086.js&utm_campaign=Badge_Grade_Settings)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/mati365/i8086.js?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/mati365/i8086.js?style=flat-square)
[![HitCount](http://hits.dwyl.com/mati365/i8086js.svg)](http://hits.dwyl.com/mati365/i8086js)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

16bit x86 virtual machine written in modern JS ES6.

## Status

- [x] ASM Compiler
  - [x] NASM syntax instruction compiler matcher with expression eval `mov ax, byte [ds:label+bx+12+(1/3)]`
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
    - [x] Diassembler binary view
    - [x] Branch arrows (for JMP, CALL etc.)
- [ ] CPU Emulator
  - [x] FPU Support
    - [x] Assembler
    - [x] Emulator
  - [ ] Basic PIT/PIC support
    - [x] PIT
    - [ ] PIC
  - [ ] Graphics mode
    - [x] Basic canvas graphics driver
    - [ ] Text/Graphics VGA
- [ ] Nano 16bit C compiler
  - [ ] Frontend
    - [ ] Syntax parser
  - [ ] Backend
    - [ ] ASM emitter
- [ ] App frontend
  - [ ] Basic front CSS UI
  - [ ] Debugger

## Running

```bash
yarn run develop
```

## Screens

![Prototype](/doc/screen.gif)
![Prototype](/doc/screen-2.png)
![Tetris](/doc/screen-5.png)
![ASM Preprocessor](/doc/screen-4.png)
![ASM Compiler](/doc/screen-3.png)

## Docs

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
Copyright (c) 2020 Mateusz Bagiński

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
