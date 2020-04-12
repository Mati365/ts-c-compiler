; Tetris
[org 7c00h]

finit
fld qword [a]
fidiv dword [b]
; fstp st0

xchg bx, bx
hlt

a: dq 124.5
b: dd 2

output: dd 0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
