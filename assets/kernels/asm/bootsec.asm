%define abc3 2

%if abc3 > 11
  nop
  nop
  nop
%elif 4 > 1
  mov ax, 0x123
%endif

%ifndef abc33
  sub bx, ax
%endif

%ifdef abc
  nop
%elifndef abc2
  xor bx, bx
%else
  mov bx, 2
%endif
