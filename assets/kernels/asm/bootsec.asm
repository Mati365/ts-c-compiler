%define ABC(b) b*3
%if 3 & 1 == 1 && (1 > 2 || (ABC(3) == 9 && 3 == 2))
xor ax, ax
%endif

field_left_col:  equ 13
field_width:     equ 14
inner_width:     equ 12
inner_first_col equ 14
start_row_col:   equ 0x0412

mov al, inner_first_col
