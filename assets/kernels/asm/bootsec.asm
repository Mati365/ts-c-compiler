%define DEBUG 1
%define CONSTM(x) x
%define ABC(b) b*CONSTM(4)

%if 3 & 1 == 1 && (1 > 2 || (ABC(3) == 9 && 3 == 3))
xor ax, ax
%endif

%macro beniz 2
  xor ax, DEBUG
  mov al, %1
  mov ah, %2
%endmacro

dupa:
jmp test_label2
field_left_col:  equ 13
field_width:     equ 14
inner_width:     equ 12
inner_first_col equ 14
start_row_col:   equ 0x0412

%if 2 + 2 > 3
  xor bx, bx
  mov bl, DEBUG
%endif

%ifdef DEBUG
  mov al, inner_first_col
%endif
jmp dupa
test_label2:
xor bx, bx
sub bx
inc ax
jmp dupa

beniz 2, 3
