[bits 16]	;tells the assembler that its a 16 bit code
[org 0x7c00]	;origin, tell the assembler that where the code will

mov si, hellostring ;store string pointer to si
call printstring	;call print string procedure
hlt

printcharacter:	;procedure to print character on screen
xchg bx, bx
mov ah, 0x0e	;tell bios that we need to print one charater on screen.

mov bh, 0x00	;page no.
mov bl, 0x07	;text attribute 0x07 is lightgrey font on black background

int 0x10	;call video interrupt
ret		;return to calling procedure

printstring:	;procedure to print string on screen
next_character:	;lable to fetch next character from string
mov al, [si]	;get a byte from string and store in al register
inc si		;increment si pointer
or al, al	;check if value in al is zero (end of string)
jz exit_function ;if end then return
call printcharacter ;else print the character which is in al register
jmp next_character	;fetch next character from string
exit_function:	;end label

ret


;data
hellostring db 'hello world', 0	;helloworld string ending with 0

times 510 - ($ - $$) db 0	;fill the rest of sector with 0
dw 0xaa55			;add boot signature at the end of bootloader