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
