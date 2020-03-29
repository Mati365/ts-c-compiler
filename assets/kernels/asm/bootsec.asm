[bits 32]

%define dupa mov
%define test2(a, b) xor a, b
%define test2(a) mov bx, a

test2 ax, bx
test2 cx
dupa ax, %[3+4]
