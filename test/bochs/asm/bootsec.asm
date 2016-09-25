[bits 16]	;tells the assembler that its a 16 bit code
[org 0x7c00]	;origin, tell the assembler that where the code will

xor ax, ax
xor cx, cx
mov cx, 2
mov ax,
xchg bx, bx

times 510 - ($ - $$) db 0	;fill the rest of sector with 0
dw 0xaa55			;add boot signature at the end of bootloader