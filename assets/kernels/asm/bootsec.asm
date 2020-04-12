; Tetris
[org 7c00h]

finit
xor ax, ax
lea ax, [a]
fld qword [a]
fimul word [b]
; fstp st0

xchg bx, bx
hlt

a: dq 124.5
b: dw -4

output: dd 0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
