; Tetris
[org 7c00h]

finit
fld qword [b]
fld qword [a]
fcompp

xchg bx, bx
hlt

a: dq 0.0
b: dq 124.5
c: dq 1.0
d: dq 1.0

output: dd 0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
