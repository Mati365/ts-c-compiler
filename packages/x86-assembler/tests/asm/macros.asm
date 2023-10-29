;= test: defines advanced macro
;= bin: 6bc0f1b8ff00b80200b8300031db6bc30289d8b87b0031c9
[bits 16]
%define DUPA2(a, b) mov a, b
%define DUPA2(a, b, c) imul a, b, c
%define sum(a, b) (a+b)
%define minus(a, b) (a-b)
%define mul(a, b) (a*b)
%define div(a, b) (a/b)
%define DUPA -0xF
imul ax, DUPA

%define DUPA 0xFF
mov ax, DUPA

%undef DUPA
%define DUPA
%define DUPA3 2
%ifdef DUPA
  mov ax, DUPA3
%endif
mov ax, %[mul(div(4 / 2, 1 * 2), sum(2, 2)) + 4 * sum(4, 4)]
; mov ax, %[DUPA + 4]
%if mul(div(4 / 2, 1 * 2), sum(2, 2)) >= 229
  xor ax, ax
%elif 2 + 2 > sum(-1, 2)
  xor bx, bx
%endif

DUPA2(ax, bx, 0x2)
DUPA2(ax, bx)

%idefine dups 123
mov ax, DUPS

%ifn dups > 123
  xor cx, cx
%endif

;= test: add scopes ids replace
;= bin: eb0112ba0200b90100bbfe00b440cd21
[bits 16]
%macro  writefile 2
  jmp     %%endstr

  %%str:        db      %2
  %%endstr:
        mov     dx,%%str
        mov     cx,%%endstr-%%str
        mov     bx,%1
        mov     ah,0x40
        int     0x21
%endmacro

writefile 0xFE, 0x12

;= test: critical equ
;= bin: b80200b80c00bb1100b81f00bb0e00
%define abc 2
%define kupsztal iksde
%define putas equ
%define putas2 labelik
mov ax, abc
%ifdef abc3
 mov bx, 0x2
%endif
kupsztal: equ 12
kupsztal2: putas 17
mov ax, iksde
mov bx, kupsztal2

var1: equ 5+5+var2*5/1-1+12
var2: equ 2
mov ax, var1
abcdefe: equ 11*3+3-4-5-6-7
mov bx, abcdefe

;= test: advanced ifs
;= bin:
%if (12 + 3) > 10 && (12 < 3 || 4 > 5 || (2 * 2 > 1 && 1 > 2))
  xor ax, ax
%endif
