; 16 bits, starting at 0x7C00.
BITS 16
ORG 0x7C00

BSS             EQU 0x504     ; The byte at 0x500 is also used, so align on next dword bound.
BSS_SIZE        EQU 438

CUR_TETRAMINO   EQU BSS       ; 16 bytes.
ROT_TETRAMINO   EQU BSS + 16  ; 16 bytes.
OFFSET          EQU BSS + 32  ; 2 bytes.
STACK           EQU BSS + 38  ; 4 bytes reserved in beginning, 400 bytes.

LEFT_SCANCODE   EQU 75
RIGHT_SCANCODE  EQU 77

UP_SCANCODE     EQU 72
DOWN_SCANCODE   EQU 80

SCORE_DIGITS    EQU 5

CPU 686

; Entry point.
;     cs:ip -> linear address (usually 0x7C00, but irrelevant because we are position independent).
start:
    ; Set up segments.
    xor ax, ax

    ; Stack.
    mov ss, ax
    mov sp, 0xB800 ;why not

    mov ds, ax
    mov es, ax

    ; Clear direction flag.
    cld

    ; Clear BSS
    mov di, BSS
    mov cx, di ;at least BSS_SIZE
    rep stosb
    ; Set to mode 0x03, or 80x25 text mode (ah is zero from above).
    mov al, 0x03
    int 0x10

    ; Hide the hardware cursor.
    mov ch, 0x26
    mov ax, 0x103                ; Some BIOS crash without the 03.
    int 0x10

    mov es, sp
    mov fs, sp

    ; White spaces on black background.
    xor di, di
    mov ax, 0x0F00
    mov cx, ax                   ; At least 80x25x2.
    rep stosw
    call pop_check

; Detects if CUR_TETRAMINO at OFFSET is colliding with any thing.
;     si -> OFFSET.
; Output:
;     Carry set if colliding.
tetramino_collision_check:

    lea bx, [bp + check_collision - tetramino_collision_check]

; Processes the current tetramino, calling bx per "tetramino pixel".
;     bx -> where to call to; al contains tetramino pixel, di the address into stack.
tetramino_process:
    pusha

; Gets the offset into stack (i.e., address) into di.
;    si  -> points at OFFSET.
; Output:
;     si -> points at CUR_TETRAMINO.
;     di -> address into stack.
;     Trashes ax.

    ; Calculate first index into screen.
    lodsw
    aad 0x10
    cmp byte [si-1], 0x10
    sbb ah, ah
    xchg bx, ax
    lea di, [si + (STACK - OFFSET) + 0xFE + bx]
    xchg bx, ax

    mov si, CUR_TETRAMINO

    mov cl, 0x10

    .loop:
        test cl, 0x13;0b1011
        jnz .load_loop

        ; Go to next line in stack.
        add di, 16 - 4

        .load_loop:
            lodsb

            ; Call wherever the caller wants us to go.
            call bx

            inc di
            loop .loop

            popa
            ret

check_collision:
    cmp al, 0xDB
    jnz .clear_carry

    cmp di, STACK + 400
    jae .colliding

    cmp al, [di]

    .clear_carry:
        clc

    jne .next_iter

    ; Colliding!
    .colliding:

        stc
        mov cl, 1
    .next_iter:
        ret

; Used by the stack joining part.
merge:
    or [di], al
    ret

; All tetraminos in bitmap format.
tetraminos:
    db 0xF0;0b11110000   ; I
    db 0xE2;0b11100010   ; J
    db 0x2E;0b00101110   ; L
    db 0x66;0b01100110   ; O
    db 0x36;0b00110110   ; S
    db 0xE4;0b11100100   ; T
    db 0x63;0b01100011   ; Z

pop_check:
    pop bp                   ; Save some bytes.

    .borders:
        mov si, STACK - 3
        mov ax, 0xDBDB

    .borders_init:
        mov [si], ax
        mov [si + 2], ax
        mov [si + 4], ax

        add si, 16
        cmp si, STACK + 400 - 3
        jbe .borders_init

    ; Cleared dl implies "load new tetramino".
    xor dl, dl

    .event_loop:
        mov si, OFFSET

        mov bx, [0x046C]
        inc bx
        inc bx              ; Wait for 2 PIT ticks.

        .busy_loop:
            cmp [0x046C], bx
            jne .busy_loop

        ; If we don't need to load a new tetramino, yayy!
        test dl, dl
        jnz .input

        ; Load a tetramino to CUR_TETRAMINO, from the compressed bitmap format.

        .choose_tetramino:
        rdtsc

        ; Only 7 tetraminos, index as 1-7.
        and ax, 7
        je .choose_tetramino

        ; Get the address of the tetramino (in bitmap format).
        cwd
        xchg di, ax

        ; Load tetramino bitmap in dl.
        mov dl, [cs:bp + di + (tetraminos - tetramino_collision_check) - 1]
        shl dx, 4

        ; Convert from bitmap to array.
        mov di, CUR_TETRAMINO
        mov cl, 0x10

        .loop_bitmap:

            shl dx, 1

            ; If the bit we just shifted off was set, store 0xDB.
            sbb al, al
            and al, 0xDB
            mov [di], al
            inc di

            loop .loop_bitmap

        ; Loaded.
        mov dl, 6

        mov word [si], dx
        jmp .link_next_iter

        ; Check for input.
        .input:
            ; Check for keystroke.
            mov ah, 0x01
            int 0x16

            ; If no keystroke, increment vertical offset.
            jz .vertical_increment

            ; Clear the keyboard buffer.
            xor ah, ah
            int 0x16

        ; Go left.
        .left:
            cmp ah, LEFT_SCANCODE
            jne .right

            dec byte [si]
            jmp .call_bp

        ; Go right.
        .right:
            cmp ah, RIGHT_SCANCODE
            jne .rotate

            inc byte [si]

        .call_bp:
            xor ah, LEFT_SCANCODE ^ RIGHT_SCANCODE
            call bp
            jc .left

        ; Rotate it.
        .rotate:
            cmp ah, UP_SCANCODE
            jne .vertical_increment

            inc cx

            .rotate_loop:
                ; Rotates CUR_TETRAMINO 90 degrees clock-wise.
                ; Output:
                ;     CUR_TETRAMINO -> rotated tetramino.
                pusha
                push es

                ; Reset ES.
                push ds
                pop es

                mov si, CUR_TETRAMINO
                mov di, ROT_TETRAMINO + 3
                push si
                mov cl, 4

                .loop:
                    mov ch, 4

                    .tetramino_line:
                        movsb
                        scasw
                        inc di
                        dec ch
                        jnz .tetramino_line

                    sub di, 4*4+1
                    loop .loop

                pop di
                mov cl, 4*4/2       ; CH would be zero, from above.
                rep movsw

                pop es
                popa

                loop .rotate_loop

            call bp
            ; To restore, just rotate 3 more times.
            mov cl, 3
            jc .rotate_loop

        .vertical_increment:
            mov cl, 1
            call upd_score

            ; Check if we can go below one byte, successfully.
            inc byte [si + 1]
            call bp
        .link_next_iter:
            jnc .next_iter

            ; If we can't, we need a new tetramino.
            dec byte [si + 1]
            je $                        ; Game Over
            cwd

            ; Joins the current tetramino to the stack, and any complete lines together.
            ;     si -> OFFSET.
            push es

            push ds
            pop es

            lea bx, [bp + merge - tetramino_collision_check]
            call tetramino_process

            mov si, STACK + 15
            std

            .loop_lines:
                push si
                mov cl, 16

                .line:
                    lodsb
                    test al, al
                    loopnz .line        ; If it was a blank, exit loop to indicate failure.

                jz .next_line

                lea cx, [si - (STACK - 1)]
                lea di, [si + 16]
                rep movsb
                mov cl, 64
                call upd_score

                .next_line:
                    pop si
                    add si, 16
                    cmp si, STACK + 15 + 400
                    jb .loop_lines

            cld
            pop es

            jmp .borders

        .next_iter:
            ; Display the stack.
            push si

            ; Add 24 characters padding in the front.
            mov ah, 0x0F
            mov di, 48
            mov si, STACK

            .loop_stack_lines:
                ; Copy 32 characters.
                mov cl, 16

                .stack_line:
                    lodsb

                    ; Store one character as two -- to make stack "squarish" on 80x25 display.
                    stosw
                    stosw

                    loop .stack_line

                ; Handle remaining 24 characters in row, and starting 24 in next row.
                add di, 96
                cmp di, (25 * 160)          ; If we go beyond the last row, we're over.
                jb .loop_stack_lines

            pop si

            ; Displays CUR_TETRAMINO at current OFFSET.
            ;     si -> OFFSET.

            ; Calculate first index into screen.
            mov bx, [si]
            mov al, 40
            mul bh
            mov cl, 12
            add cl, bl
            add ax, cx

            ; One character takes 2 bytes in video memory.
            shl ax, 2
            xchg di, ax

            ; Loops for 16 input characters.
            mov cl, 0x10
            mov si, CUR_TETRAMINO

            mov ah, 0x0F

            .loop_tetramino:
                test cl, 0x13;0b1011
                jnz .load_tetramino

                ; Since each tetramino input is 4x4, we must go to next line
                ; at every multiple of 4.
                ; Since we output 2 characters for one input char, cover offset of 8.
                add di, (80 - 8) * 2

                .load_tetramino:
                    lodsb
                    test al, al

                    ; Output two characters for "squarish" output.
                    cmovz ax, [es:di]
                    stosw
                    stosw

                    loop .loop_tetramino

            jmp .event_loop

upd_score:
    mov bx, SCORE_DIGITS * 2

    .chk_score:
        dec bx
        dec bx
        js $
        mov al, '0'
        xchg [fs:bx], al
        or al, 0x30
        cmp al, '9'
        je .chk_score
        inc ax
        mov [fs:bx], al

    loop upd_score
    ret

; IT'S A SECRET TO EVERYBODY.
db "ShNoXgSo"

; Padding.
times 510 - ($ - $$)            db 0

BIOS_signature:
    dw 0xAA55

; Pad to floppy disk.
times (1440 * 1024) - ($ - $$)  db 0
