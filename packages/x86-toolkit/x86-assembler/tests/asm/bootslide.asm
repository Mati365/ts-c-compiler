;= test: boot slide game
;= bin: 31c08ed88ed0bc009cb4b88ec0b003cd10b401b526cd10b9d0079831fff3abbd0900e4403c10771ca1e47d86e0a3e47dc606487cccc606b17d48c606c57d44c6063a7d40bfcc00b4ffbb1600c606d87d1ec606de7d64e87e01b1ff497417e4402403685b7c74423c01745d3c0274763c030f849c00e81201e8b900b401cd1674f798cd1668757c80fc48741d80fc50743780fc4b744f80fc4d747680fc017402cd19b80200cd10cd2089eb83fb0b0f87810083c3048a87e47dc687e47d0089dd83eb048887e47dc389eb83fb04726483eb048a87e47dc687e47d0089dd83c3048887e47dc389eb80fb03744780fb07744280fb0b743d80fb0f743880c3018a87e47dc687e47d0089dd80eb018887e47dc389ebf6c3017505f6c302741680eb018a87e47dc687e47d0089dd80c3018887e47dc3c331dbbfb402b4308a87e47d4304303c3a720204073c307505e81f00eb01ab83c70c83fb04740a83fb08740583fb0c750481c7e80283fb1075ccc35381ef460198bb0500c606d87d07c606de7d92e8530081efd8015bc3ba78febe040081c2f602e8160083c20ee8100083c20ee80a0083c20ee804004e75e4c389d7b8b113bb0500c606d87d07c606de7d92e8150089d7b433bb0400c606d87d06c606de7d94e80100c3b90000f3ab81c700004b75f4c3060e040805090c0f02000b030d0a07010000000000000000000055aa

;15 Number Slider Game
;  * Slide the numbers around until they are in order
;  * This is boot sector ( <512 bytes) game
;  * Controls to move are up/down/left/right
;  * Any other key rescrambles numbers
; Some Fuckery:
; Polymorphic
; Abuse of "Call"/Ret
;   * There are routines to move the tiles in the up/down/left/right direction,
;     They are controlled by the user AND the scrambling routines. There is a
;     'valid' way to conditionally call and then return, but this requires a
;     bit more space with all of the control/flow logic. I would rather just
;     manually set the corresponding return points once, and then just do a
;     bunch of conditional jumps, sort of evil, but less code.

[ORG 0x7c00]
LEFT EQU 75
RIGHT EQU 77
UP EQU 72
DOWN EQU 80

;Init the environment
xor ax, ax                ; make it zero
mov ds, ax                ; DS=0
mov ss, ax                ; stack starts at 0
mov sp, 0x9c00            ; 200h past code start
mov ah, 0xb8              ; text video memory
mov es, ax                ; ES=0xB800
mov al, 0x03
int 0x10
mov ah, 1
mov ch, 0x26
int 0x10
;Fill in all black
mov cx, 0x07d0            ; whole screens worth
cbw                       ; clear ax (black on black with null char)
xor di, di                ; first coordinate of video mem
rep stosw                 ; push it to video memory

mov bp, 0x9               ; blanklocation

; Evil?
in al,(0x40)              ; Get random
cmp al, 0x10              ; 1 in 16 chance it will be evil
ja draw_border            ; If above, then not evil
; Evil (Descending solvability)
mov ax, [boarddata]       ; Get first and second board number
xchg ah,al                ; And then swap them
mov [boarddata], ax       ; (now evil, can't solve in ascending order)
mov byte [border + 1], 0xcc       ; Change border color to light red
mov byte [tile1 + 2], 0x48        ; Change tile border to shaded red
mov byte [tile2 + 1], 0x44        ; Change tile to red
mov byte [number_color + 1], 0x40 ; Change number to black on red

;draw border
draw_border:
mov di, 1 * 160 + 44                   ; corner to start on
border: mov ah, 0xff                   ; white
mov bx, 22                             ; rows
mov byte [rectrow + 1], 30             ; columns
mov byte [nextline + 2], 0x64          ; value to get to next line
call drawrect

; Scramble
mov cl, 0xff              ; Init to 255 rounds of movement
scramble:
  dec cx
  je gameloop               ; Once done, go to main game loop
  in al,(0x40)              ; Get 'random' value
  and al, 3                 ; Only preserve last 2 bits (for 4 possible up/down/left/right moves)
  push word scramble        ; point of return instead of using call for the below jumps
  ; Do a random tile move based on random results
; cmp al, 0              ; and al,3 already did this comparison
  je up
  cmp al, 1
  je down
  cmp al, 2
  je left
  cmp al, 3
  je right

; The Main Game Loop
gameloop:
  call drawboard          ; Draw the blank tiles of the board
  waitkey:
  call displaytiles       ; Put the actual (hex) numbers into the tiles
  mov ah, 1               ; Is there a key
  int 0x16                ; ""
  jz waitkey              ; If not wait for a key
  cbw                     ; clear ax (Get the key)
  int 0x16                ; ""
  push word gameloop      ; point of return instead of using call
  ; Get the Keys
  cmp ah, UP
  je up
  cmp ah, DOWN
  je down
  cmp ah, LEFT
  je left
  cmp ah, RIGHT
  je right
  cmp ah, 0x01
  je exit
  int 0x19                ; A non-directional key was pressed (reboot/rescramble)
  exit:
    mov ax,0x0002         ; Clear screen
    int 0x10
    int 0x20              ; Return to bootOS
  up:
    mov bx, bp                   ; get blank tile location
    cmp bx, 0xb                  ; Out of bounds?
    ja keysdone                  ; Then return (don't move anything)
    add bx, 4                    ; get location above it
    mov al, [boarddata + bx]     ; get value above it
    mov byte [boarddata + bx], 0 ; make it the new blank
    mov bp, bx      ; update blank location
    sub bx, 4                    ; revert to old blank location
    mov [boarddata + bx], al     ; put new value in
    ret
  down:
    mov bx, bp      ; get blank tile location
    cmp bx, 4                    ; Out of bounds?
    jb keysdone                  ; Then return (don't move anything)
    sub bx, 4                    ; get location above it
    mov al, [boarddata + bx]     ; get value above it
    mov byte [boarddata + bx], 0 ; make it the new blank
    mov bp, bx      ; update blank location
    add bx, 4                    ; revert to old blank location
    mov [boarddata + bx], al     ; put new value in
    ret
  left:
    mov bx, bp      ; get blank tile location
    cmp bl, 3                    ; All the way to the left?
    je keysdone                  ; return without moving anything
    cmp bl, 7                    ; ""
    je keysdone                  ; ""
    cmp bl, 11                   ; ""
    je keysdone                  ; ""
    cmp bl, 15                   ; ""
    je keysdone                  ; ""
    add bl, 1                    ; get location above it
    mov al, [boarddata + bx]     ; get value above it
    mov byte [boarddata + bx], 0 ; make it the new blank
    mov bp, bx      ; update blank location
    sub bl, 1                    ; revert to old blank location
    mov [boarddata + bx], al     ; put new value in
    ret
  right:
    mov bx, bp      ; get blank tile location
    ; Test Right edge, this is aligned with positions 0, 4, 8, and 12.
    ; In binary, these are the only positions where the least significant
    ; bits are always 0, so the below instructions tests for this quality
    test bl, 0x1                 ; is the last bit a 1
    jne right_cont               ; if not (0), continue with movement
    test bl, 0x2                 ; is the next bit a 1
    je keysdone                  ; if so, don't move anything ... somehow this is the right logic
    right_cont:
    sub bl, 1                    ; get location above it
    mov al, [boarddata + bx]     ; get value above it
    mov byte [boarddata + bx], 0 ; make it the new blank
    mov bp, bx      ; update blank location
    add bl, 1                    ; revert to old blank location
    mov [boarddata + bx], al     ; put new value in
    ret
  keysdone:
  ret

displaytiles:
; This is a routine for displaying all of the tiles
  xor bx, bx
  mov di, 4 * 160 + 52    ; Position of top-left tile
  displaytilesloop:
    number_color: mov ah, 0x30          ; Black on light-blue background
    mov al, byte [boarddata + bx]  ; current number value in boarddata structure
    inc bx                ; next tile digit for next iteration
    add al, 0x30          ; 'Convert' to ASCII
    cmp al, 0x3A          ; Is it above '9'
    jb number             ; If its below (in range of number), skip adjustment
      add al, 7           ; Get it into the ASCII A-F range
    number:
    cmp al, 0x30          ; Check to see if it's 0 (our blank tile)
    jne next_a            ; Keep processing if it's not
    call blanktile        ; Otherwise, draw a blank (black) tile
    jmp next_b            ; Skip over normal printing of number

    next_a:
    stosw                 ; Print the Number

    next_b:
    add di, 12            ; Go to the next column
    cmp bx, 4             ; Check if it's the last column
    je nextrow            ; If so, do a row adjustment
    cmp bx, 8             ; ""
    je nextrow            ; ""
    cmp bx, 12            ; ""
    jne norows            ; ""
    nextrow:
      add di, 744         ; Coordinate adjustment for going to next row
    norows:
    cmp bx, 0x10          ; check to see if last tile has been printed
    jne displaytilesloop  ; otherwise keep getting and printing them
ret

blanktile:
  ; A Blank Tile for the '0' tile
  push bx                               ; Don't pave over bx, as other routines us it
  sub di, 326                           ; Adjust coord from middle to upper-left corner of tile
  cbw                                   ; clear ax (black)
  mov bx, 5                             ; rows
  mov byte [rectrow + 1], 7             ; columns
  mov byte [nextline + 2], 0x92         ; Value to get to next line
  call drawrect                         ; Draw the black rectangle
  sub di, 472                           ; Restore coordinate to middle of tile
  pop bx                                ; Restore bx
ret

drawboard:
; This routine graphically draws the tiles (without the numbers)
  mov dx, 2 * 160 + 46 - 758  ; This is much before the start position, helps keep a tighter loop
  mov si, 4                   ; 4 rows
  row:
    add dx, 758               ; Advance to next row
    call drawtile
    add dx, 14                ; next column
    call drawtile
    add dx, 14
    call drawtile
    add dx, 14
    call drawtile
    dec si
    jne row
ret

drawtile:
  ; Color 1
  mov di, dx
  tile1: mov ax, 0x13b1                 ; shaded corner border
  mov bx, 5                             ; rows
  mov byte [rectrow + 1], 7             ; columns
  mov byte [nextline + 2], 0x92         ; Value to get to next line
  call drawrect
  ; Color 2
  mov di, dx
  tile2: mov ah, 0x33                   ; inner light blue main part of tile
  mov bx, 4                             ; rows
  mov byte [rectrow + 1], 6             ; columns
  mov byte [nextline + 2], 0x94         ; Value to get to next line
  call drawrect
ret

drawrect:
  ; Draws rectangle
  rectrow: mov cx, 0         ; columns, self-modified by caller
  rep stosw
  ; add di, (next line value) (ammount self-modified by caller)
  nextline: db 0x81, 0xc7, 0x00, 0x00
  dec bx
  jne rectrow
ret

; Data structure for ordered game
boarddata:
db 0x06, 0x0e, 0x04, 0x08, 0x05, 0x09, 0x0c, 0x0f, 0x02, 0x00, 0x0b, 0x03, 0x0d, 0x0a, 0x07, 0x01

;BIOS sig and padding
times 510-($-$$) db 0
dw 0xAA55
