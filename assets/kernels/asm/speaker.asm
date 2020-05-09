org 0x7c00

; note
mov ax, 9121

mov cx, ax			; Store note value for now
mov al, 182
out 43h, al
mov ax, cx			; Set up frequency
out 42h, al
mov al, ah
out 42h, al

in al, 61h			; Switch PC speaker on
or al, 03h
out 61h, al

mov ax, 1
call os_pause

; off
in al, 61h
and al, 0FCh
out 61h, al

hlt

os_pause:
	pusha
	cmp ax, 0
	je .time_up			; If delay = 0 then bail out

	mov cx, 0
	mov [.counter_var], cx		; Zero the counter variable

	mov bx, ax
	mov ax, 0
	mov al, 2			; 2 * 55ms = 110mS
	mul bx				; Multiply by number of 110ms chunks required
	mov [.orig_req_delay], ax	; Save it

	mov ah, 0
	int 1Ah				; Get tick count

	mov [.prev_tick_count], dx	; Save it for later comparison

.checkloop:
	mov ah,0
	int 1Ah				; Get tick count again

	cmp [.prev_tick_count], dx	; Compare with previous tick count

	jne .up_date			; If it's changed check it
	jmp .checkloop			; Otherwise wait some more

.time_up:
	popa
	ret

.up_date:
	mov ax, [.counter_var]		; Inc counter_var
	inc ax
	mov [.counter_var], ax

	cmp ax, [.orig_req_delay]	; Is counter_var = required delay?
	jge .time_up			; Yes, so bail out

	mov [.prev_tick_count], dx	; No, so update .prev_tick_count

	jmp .checkloop			; And go wait some more


	.orig_req_delay		dw	0
	.counter_var		dw	0
	.prev_tick_count	dw	0

token db 2
tmp	db 0

times 510-($-$$) db 0
dw 0xaa55
