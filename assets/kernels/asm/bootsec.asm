%define ABC(b) b*3
%if 3 & 1 == 1 && (1 > 2 || (ABC(3) == 9 && 3 == 2))
xor ax, ax
%endif
