;= test: various long app with X87 calls
;= bin: b80113b86320eb5131c064c54704b102b90200b861632effafff008a07cd03eaff00007c2effafff0f268b4705ebee9090909090909090909089d889f0bb020031d2f7f3f7f329c87f0531d3e80300f4e2e98b4604eb02eb0031c0eba69bdbe3d9068200dd068200db2e8200d8c1d8c1dcc2dec0d8d1e88aff9031c0b88b00ba760090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090909090
[bits 16]
[org 0x0]
mov ax, test332 + 2
test332 equ 0x12FF
; dt 1.5
; dq 1.123
; dd 1.46
start:
mov ax, 'a '+2
jmp dupa
xor ax, ax
lds ax, [fs:bx+0x4]
mov cl, 2
  mov cx, 2
  mov ax, 'ac'
  jmp far [cs:bx+0xFF]
  mov byte al, [bx]
  .dupa2:
  int 3
  jmp word 0x7C00:0xFF
  jmp far word [cs:bx+0xFFF]
  mov ax, word [es:bx+0x5]
  jmp .dupa2
  stuff: times 10 nop
  mov ax, bx

alloc_byte:
  ; left border
  mov ax, si
  mov bx, 2
  xor dx, dx
  div bx
  ; cmp ax, 0x0
  div bx
  sub ax, cx
  jg .jesli_wieksze
  xor bx, dx
  call test_call
  .jesli_wieksze:
    hlt
  loop alloc_byte
test_call:
mov ax, [bp+0x4]
times 0x2 jmp dupa
dupa:
xor ax, ax
jmp start

;finit
finit
fld dword [val1]
fld qword [val1]
fld tword [val1]
fadd st1
fadd st0, st1
fadd st2, st0
faddp st0, st0
fcom

test_equ equ $
; val1: dq 0.1
call start
nop
test2:
xor ax, ax
mov ax, dupa3
dupa3 equ 4*4+5+test_equ
test3:

mov dx, test_equ
val1:
nop
times 512 - ($-$$) nop

;= test: example enter graphics mode app
;= bin: b80300cd10b8121130dbcd10bea501e83200b840008ed88ec0c7064a005a00c7064c00302ab90800bf500031c0f3abc70660000706c60684003bc606850008b8004ccd2156525150fcbac203aceeb90500b400bac40388e0eebac503aceefec4e2f1bad403b011eebad503ec247feebad403b003eebad503ec0c80ee8a4411247f8844118a44030c80884403b91900b400bad40388e0eebad503aceefec4e2f158595a5ec3e703010300026b595a82608d0b3e0047060700000000ea0cdf2d08e805a3ff
use16
;	VGA_AC_INDEX
;	VGA_AC_WRITE
;	VGA_AC_READ
VGA_MISC_WRITE		EQU	3C2h
VGA_SEQ_INDEX		EQU	3C4h
VGA_SEQ_DATA		EQU	3C5h
;	VGA_DAC-READ_INDEX
;	VGA_DAC_WRITE_INDEX
;	VGA_DAC_DATA
;	VGA_MISC_READ
VGA_CRTC_INDEX		EQU	3D4h
VGA_CRTC_DATA		EQU	3D5h
VGA_INSTAT_READ		EQU	3DAh

NUM_SEQ_REGS		EQU	5
NUM_CRTC_REGS		EQU	25
;	NUM_GC_REGS
;	NUM_AC_REGS

  ORG	100h

;	set	80x25	text	mode	so	we're	in	a	known	state,	and	to	set	8x16	font
  mov	ax,0003h
  int	10h

;	set	80x50	text	mode	and	8x8	font
  mov	ax,1112h
  xor	bl,bl
  int	10h

;	set	90x60	text	mode
  mov	si,regs_90x60
  call	write_regs

;	tell	the	BIOS	what	we've	done
  mov	ax,0040h
  mov	ds,ax
  mov	es,ax

  mov	word	[004Ah],90		;	columns	on	screen

  mov	word	[004Ch],90*60*2	;	framebuffer	size

  mov	cx,8
  mov	di,0050h
  xor	ax,ax
  rep	stosw			;	cursor	pos	for	8	pages

  mov	word	[0060h],0607h		;	cursor	shape

  mov	byte	[0084h],59		;	rows	on	screen,	minus	one

  mov	byte	[0085h],8		;	char	height,	in	scan-lines

;	done;	exit	to	DOS
  mov	ax,4C00h
  int	21h

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;	name:		write_regs
;	action:	writes	register	dump	to	VGA	registers
;	inputs:	SI->register	dump
;	outputs:	(nothing)
;	modifies:	(nothing)
;	minimum	CPU:	8088
;	notes:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

write_regs:
  push	si
  push	dx
  push	cx
  push	ax
    cld

;	write	MISC	register
    mov	dx,VGA_MISC_WRITE
    lodsb
    out	dx,al

;	write	SEQuencer	registers
    mov	cx,NUM_SEQ_REGS
    mov	ah,0
write_seq:
    mov	dx,VGA_SEQ_INDEX
    mov	al,ah
    out	dx,al

    mov	dx,VGA_SEQ_DATA
    lodsb
    out	dx,al

    inc	ah
    loop	write_seq

;	write	CRTC	registers
;	Unlock	CRTC	registers:	enable	writes	to	CRTC	regs	0-7
    mov	dx,VGA_CRTC_INDEX
    mov	al,17
    out	dx,al

    mov	dx,VGA_CRTC_DATA
    in	al,dx
    and	al,7Fh
    out	dx,al

;	Unlock	CRTC	registers:	enable	access	to	vertical	retrace	regs
    mov	dx,VGA_CRTC_INDEX
    mov	al,3
    out	dx,al

    mov	dx,VGA_CRTC_DATA
    in	al,dx
    or	al,80h
    out	dx,al

;	make	sure	CRTC	registers	remain	unlocked
    mov	al,[si	+	17]
    and	al,7Fh
    mov	[si	+	17],al

    mov	al,[si	+	3]
    or	al,80h
    mov	[si	+	3],al

;	now,	finally,	write	them
    mov	cx,NUM_CRTC_REGS
    mov	ah,0
write_crtc:
    mov	dx,VGA_CRTC_INDEX
    mov	al,ah
    out	dx,al

    mov	dx,VGA_CRTC_DATA
    lodsb
    out	dx,al

    inc	ah
    loop	write_crtc
  pop	ax
  pop	cx
  pop	dx
  pop	si
  ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;	data
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

regs_90x60:
;	MISC
  db	0E7h
;	SEQuencer
  db	03h,	01h,	03h,	00h,	02h
;	CRTC
  db		6Bh,	59h,		5Ah,	82h,	60h,		8Dh,	0Bh,		3Eh,
  db		00h,	47h,		06h,	07h,	00h,		00h,	00h,		00h,
  db	0EAh,	0Ch,	0DFh,	2Dh,	08h,	0E8h,	05h,	0A3h,
  db	0FFh
;	GC	(no)
;	AC	(no)
