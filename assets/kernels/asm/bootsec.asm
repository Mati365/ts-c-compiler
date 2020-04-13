; Tetris
[org 7c00h]

finit
fild qword [b]
fild dword [c]
fild word [d]
fpatan
xchg bx, bx
hlt

a: dq 0.0
b: dq 36
c: dd 5
d: dw 3

output: dd 0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
