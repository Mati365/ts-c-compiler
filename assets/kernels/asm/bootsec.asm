; Tetris
[org 7c00h]

xor ax, ax
mov ax, 1
ror ax, 18
xchg bx, bx
; fld qword [val]
; fsqrt
; fstp qword [res]
hlt

val: dq 123.45
res: dq 0.0

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
