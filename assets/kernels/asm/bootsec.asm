[org 0x7c00]

_start:
    mov ax, 0x0013
    int 0x10                ; set video 320x200x256 mode

    mov ax, 0xa000          ; 0xa000 video segment
    mov es, ax              ; setup extended segment

    mov al, 0x0f
    mov cx, screen_width*screen_height
    xor di, di
    rep stosb

    mov bx, 0x000f          ; page 0, white colour
    mov dx, 0x0c0f          ; cursor row and col
    mov ah, 0x02            ; set cursor
    int 0x10

    mov ah, 0x0e            ; print char interrupt
    mov cx, [message_len]              ; 10 chars
    mov si, message          ; point to game_over string

_go_l:
    lodsb                   ; get char
    int 0x10                ; print it
    loop _go_l

    jmp $


screen_width    equ 320
screen_height   equ 200
message db 'abcddef'
message_len db $ - message

times 510-($-$$) db 0
dw 0xaa55
