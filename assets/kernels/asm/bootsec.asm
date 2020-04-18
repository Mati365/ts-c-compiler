; Tetris
[org 7c00h]

finit
fild word [b]
fild word [d]
ficom word [fi_int]
fnstsw ax
fnclex
; ; fstenv [env]
; fild word [d]
; fadd st0, st1
; fscale
; fldenv [env]
; mov ax, [output]
; fxch
; FYL2XP1
; fistp dword [output]
; mov ax, word [output]
xchg bx, bx
hlt

c: dw 0xFE
b: dq 0xFEFE
d: dq 0x123
fi_int: dw 0x151
output: dw 0
env: dq 0xF

; At the end we need the boot sector signature.
times 510-($-$$) db 0
	db 0x55
	db 0xaa
