[bits 16]	;tells the assembler that its a 16 bit code
[org 0x7c00]	;origin, tell the assembler that where the code will

;test al, 0x1
;test ax, 0x1
mov byte [0x3], 0x1
test cl, [0x3]
;test ax, [0x0]
;test [0x0], ax

xchg bx, bx

times 510 - ($ - $$) db 0	;fill the rest of sector with 0
dw 0xaa55			;add boot signature at the end of bootloader