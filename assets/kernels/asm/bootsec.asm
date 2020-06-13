        ;
        ; Pillman
        ;
        ; by Oscar Toledo G.
        ; http://nanochess.org/
        ;
        ; (c) Copyright 2019 Oscar Toledo G.
        ;
        ; Creation date: Jun/11/2019.
        ; Revision date: Jun/12/2019. Draws level.
        ; Revision date: Jun/13/2019. Pillman can move.
        ; Revision date: Jun/14/2019. Now ghosts don't get stuck. Ghost are
        ;                             transparent. Pillman doesn't leave
        ;                             trash.
        ; Revision date: Jun/15/2019. Ghosts can catch pillman. Optimized.
        ;                             509 bytes.
        ; Revision date: Jul/09/2019. Self-modifying code, move subroutine,
        ;                             cache routine address (Peter Ferrie).
        ;                             504 bytes.
        ; Revision date: Jul/22/2019. Added Esc key to exit.
        ;

        cpu 8086

    %ifndef com_file            ; If not defined create a boot sector
com_file:       equ 0
    %endif

base:           equ 0xf9fe      ; Memory base (same segment as video)
intended_dir:   equ base+0x00   ; Next direction for player
frame:          equ base+0x01   ; Current video frame
x_player:       equ base+0x02   ; Saved X-coordinate of player
y_player:       equ ms6+0x01    ; Saved Y-coordinate of player
old_time:       equ base+0x06   ; Old time

        ;
        ; Maze should start at x,y coordinate multiple of 8
        ;
BASE_MAZE:      equ 16*X_OFFSET+32
pos1:           equ BASE_MAZE+21*8*X_OFFSET

X_OFFSET:       equ 0x0140

MAZE_COLOR:     equ 0x37        ; No color should be higher or equal value
PILL_COLOR:     equ 0x02        ; Color for pill
PLAYER_COLOR:   equ 0x0e        ; Should be unique

        ;
        ; XOR combination of these plus PILL_COLOR shouldn't
        ; result in PLAYER_COLOR
        ;
GHOST1_COLOR:   equ 0x21        ; Ghost 1 color
GHOST2_COLOR:   equ 0x2e        ; Ghost 2 color
GHOST3_COLOR:   equ 0x28        ; Ghost 3 color
GHOST4_COLOR:   equ 0x34        ; Ghost 4 color

    %ifdef com_file
        org 0x0100              ; Start address for COM file
    %else
        org 0x7c00              ; Start address for boot sector
    %endif
restart:
        mov ax,0x0013           ; Set mode 0x13 (320x200x256 VGA)
        int 0x10                ; Call BIOS
        cld
        mov ax,0xa000           ; Video segment
        mov ds,ax               ; Use as source data segment
        mov es,ax               ; Use as target data segment
        ;
        ; Draw the maze
        ;
        mov si,maze             ; SI = Address of maze data
        mov di,BASE_MAZE        ; DI = Address for drawing maze
draw_maze_row:
        cs lodsw                ; Load one word of data from Code Segment
        xchg ax,cx              ; Put into AX
        mov bx,30*8             ; Offset of mirror position
draw_maze_col:
        shl cx,1                ; Extract one tile of maze
        mov ax,MAZE_COLOR*0x0100+0x18   ; Carry = 0 = Wall
        jnc dm1                 ; If bit was zero, jump to dm1
        mov ax,PILL_COLOR*0x0100+0x38   ; Carry = 1 = Pill
dm1:    call draw_sprite        ; Draw tile
        add di,bx               ; Go to mirror position
        sub bx,16               ; Mirror finished?
        jc dm2                  ; Yes, jump
        call draw_sprite        ; Draw tile
        sub di,bx               ; Restore position
        sub di,8                ; Advance tile
        jmp draw_maze_col       ; Repeat until finished

        ;
        ; Move ghost
        ; bh = color
        ;
move_ghost:
        lodsw                   ; Load screen position
        xchg ax,di
        lodsw                   ; Load direction
        test ah,ah
        xchg ax,bx              ; Color now in ah
        mov al,0x30
        push ax
        mov byte [si-1],0x02    ; Remove first time setup flag
        call move_sprite3
        pop ax
        ;
        ; Draw the sprite/tile
        ;
        ; ah = sprite color
        ; al = sprite (x8)
        ; di = Target address
draw_sprite:
        push ax
        push bx
        push cx
        push di
ds0:    push ax
        mov bx,bitmaps-8
        cs xlat                 ; Extract one byte from bitmap
        xchg ax,bx
        mov cx,8
ds1:    mov al,bh
        shl bl,1                ; Extract one bit
        jc ds2
        xor ax,ax               ; Background color
ds2:
        cmp bh,0x10             ; Color < 0x10
        jc ds4                  ; Yes, jump
        cmp byte [di],PLAYER_COLOR      ; "Eats" player?
        je restart              ; Yes, it should crash after several hundred games
ds3:
        xor al,[di]             ; XOR ghost again pixel
ds4:
        stosb
        loop ds1
        add di,X_OFFSET-8       ; Go to next video line
        pop ax
        inc ax                  ; Next bitmap byte
        test al,7               ; Sprite complete?
        jne ds0                 ; No, jump
        pop di
        pop cx
        pop bx
        pop ax
        ret

dm2:
        add di,X_OFFSET*8-15*8  ; Go to next row
        cmp si,setup_data       ; Maze completed?
        jne draw_maze_row       ; No, jump

        ;
        ; Setup characters
        ;
        ; CX is zero at this point
        ; DI is equal to pos1 at this point
       ;mov di,pos1
        mov cl,5                ; 5 elements (player + ghosts)
        mov ax,2                ; Going to right
dm3:
        cs movsw                ; Copy position from Code Segment
        stosw                   ; Store desired direction
        loop dm3                ; Loop

        ;
        ; Main game loop
        ;
game_loop:
        mov ah,0x00
        int 0x1a                ; BIOS clock read
        cmp dx,[old_time]       ; Wait for time change
        je game_loop
        mov [old_time],dx       ; Save new time

        mov ah,0x01             ; BIOS Key available
        int 0x16
        mov ah,0x00             ; BIOS Read Key
        je no_key
        int 0x16
no_key:
        mov al,ah
        cmp al,0x01             ; Esc key
        jne no_esc
        int 0x20
no_esc:
        sub al,0x48             ; Code for arrow up?
        jc no_key2              ; Out of range, jump.
        cmp al,0x09             ; Farther than arrow down?
        jnc no_key2             ; Out of range, jump.
        mov bx,dirs
        cs xlat                 ; Translate direction to internal code
        mov [intended_dir],al   ; Save as desired direction
no_key2:
        mov si,pos1             ; SI points to data for player
        lodsw                   ; Load screen position
        xchg ax,di
        lodsw                   ; Load direction/type
        xchg ax,bx
        xor ax,ax               ; Delete pillman
        call move_sprite2       ; Move
        xor byte [frame],0x80   ; Alternate frame
        mov ax,0x0e28           ; Closed mouth
        js close_mouth          ; Jump if sign set.
        mov al,[pos1+2]         ; Using current direction
        mov cl,3                ; Multiply by 8
        shl al,cl               ; Show open mouth
close_mouth:
        call draw_sprite        ; Draw
        ;
        ; Move ghosts
        ;
        mov bp, move_ghost
        mov bh,GHOST1_COLOR
        call bp
        mov bh,GHOST2_COLOR
        call bp
        mov bh,GHOST3_COLOR
        call bp
        mov bh,GHOST4_COLOR
        call bp
        jmp game_loop

        ;
        ; DI = address on the screen
        ; BL = wanted direction
        ;
move_sprite3:
        je move_sprite          ; If zero, won't remove first time
move_sprite2:
        call draw_sprite        ; Remove ghost
move_sprite:
        mov ax,di               ; Prepare to extract pixel row/column
        xor dx,dx
        mov cx,X_OFFSET
        div cx
                                ; Now AX = Row, DX = Column
        mov ah,dl
        or ah,al
        and ah,7                ; Both aligned at 8 pixels?
        jne ms0                 ; No, jump because cannot change direction.
        ; AH is zero already
       ;mov ah,0
        ;
        ; Get available directions
        ;
        mov ch,MAZE_COLOR
        cmp [di-0x0001],ch      ; Left
        adc ah,ah               ; AH = 0000 000L
        cmp [di+X_OFFSET*8],ch  ; Down
        adc ah,ah               ; AH = 0000 00LD
        cmp [di+0x0008],ch      ; Right
        adc ah,ah               ; AH = 0000 0LDR
        cmp [di-X_OFFSET],ch    ; Up
        adc ah,ah               ; AH = 0000 LDRU

        test bh,bh              ; Is it pillman?
        je ms4                  ; Yes, jump

        ;
        ; Ghost
        ;
        test bl,0x05            ; Test BL for .... .D.U
        je ms6                  ; No, jump
        ; Current direction is up/down
        cmp dx,[x_player]       ; Compare X coordinate with player
        mov al,0x02             ; Go right
        jc ms8                  ; Jump if X ghost < X player
        mov al,0x08             ; Go left
        jmp ms8

        ; Current direction is left/right
ms6:    cmp al,0x00             ; (SMC) Compare Y coordinate with player
        mov al,0x04             ; Go down
        jc ms8                  ; Jump if Y ghost < Y player
        mov al,0x01             ; Go up
ms8:
        test ah,al              ; Can it go in intended direction?
        jne ms1                 ; Yes, go in direction

        mov al,bl
ms9:    test ah,al              ; Can it go in current direction?
        jne ms1                 ; Yes, jump
        shr al,1                ; Try another direction
        jne ms9
        mov al,0x08             ; Cycle direction
        jmp ms9

        ;
        ; Pillman
        ;
ms4:
        mov [x_player],dx       ; Save current X coordinate
        cs mov [y_player],al    ; Save current Y coordinate

        mov al,[intended_dir]
        test ah,al              ; Can it go in intended direction?
        jne ms1                 ; Yes, go in that direction

ms5:    and ah,bl               ; Can it go in current direction?
        je ms2                  ; No, stops

ms0:    mov al,bl

ms1:    mov [si-2],al           ; Save new direction
        test al,5               ; If going up/down...
        mov bx,-X_OFFSET*2      ; ...bx = vertical movement
        jne ms3
        mov bx,1*2              ; ...bx = horizontal movement
ms3:
        test al,12
        je ms7
        neg bx                  ; Reverse direction
ms7:
        add di,bx               ; Do move
        mov [si-4],di           ; Save the new screen position
ms2:
        ret

        ;
        ; Game bitmaps
        ;
bitmaps:
        db 0x00,0x42,0xe7,0xe7,0xff,0xff,0x7e,0x3c      ; dir = 1
        db 0x3c,0x7e,0xfc,0xf0,0xf0,0xfc,0x7e,0x3c      ; dir = 2
        db 0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff      ; Maze
        db 0x3c,0x7e,0xff,0xff,0xe7,0xe7,0x42,0x00      ; dir = 4
        db 0x3c,0x7e,0xff,0xff,0xff,0xff,0x7e,0x3c      ; Closed mouth
        db 0x3c,0x7e,0xdb,0xdb,0xff,0xff,0xff,0xa5      ; Ghost
        db 0x00,0x00,0x00,0x18,0x18,0x00,0x00,0x00      ; Pill
        db 0x3c,0x7e,0x3f,0x0f,0x0f,0x3f,0x7e,0x3c      ; dir = 8

        ;
        ; Maze shape
        ;
maze:
        dw 0b0000_0000_0000_0000
        dw 0b0111_1111_1111_1110
        dw 0b0100_0010_0000_0010
        dw 0b0100_0010_0000_0010
        dw 0b0111_1111_1111_1111
        dw 0b0100_0010_0100_0000
        dw 0b0111_1110_0111_1110
        dw 0b0000_0010_0000_0010
        dw 0b0000_0010_0111_1111
        dw 0b0000_0011_1100_0000
        dw 0b0000_0010_0100_0000
        dw 0b0000_0010_0111_1111
        dw 0b0000_0010_0100_0000
        dw 0b0111_1111_1111_1110
        dw 0b0100_0010_0000_0010
        dw 0b0111_1011_1111_1111
        dw 0b0000_1010_0100_0000
        dw 0b0111_1110_0111_1110
        dw 0b0100_0000_0000_0010
        dw 0b0111_1111_1111_1111
        dw 0b0000_0000_0000_0000

        ;
        ; Starting positions
        ;
setup_data:
        dw BASE_MAZE+0x78*X_OFFSET+0x78
        dw BASE_MAZE+0x30*X_OFFSET+0x70
        dw BASE_MAZE+0x40*X_OFFSET+0x78
        dw BASE_MAZE+0x20*X_OFFSET+0x80
        dw BASE_MAZE+0x30*X_OFFSET+0x88

        ;
        ; Convert arrow codes to internal directions
        ;
dirs:
        db 0x01         ; 0x48 = Up arrow
        db 0x00
        db 0x00
        db 0x08         ; 0x4b = Left arrow
        db 0x00
        db 0x02         ; 0x4d = Right arrow
        db 0x00
        db 0x00
        db 0x04         ; 0x50 = Down arrow

    %ifdef com_file
    %else
        times 510-($-$$) db 0x4f
        db 0x55,0xaa            ; Make it a bootable sector
    %endif
