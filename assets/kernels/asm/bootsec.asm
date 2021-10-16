;= test: bootman game
;= bin:

; Boot-Man
;
; (c) 2019 Guido van den Heuvel
;
; Boot-Man is a Pac-Man clone that fits (snugly) inside the Master Boot Record of a USB stick.
; A USB stick with Boot-Man on it boots into the game (hence the name). Unfortunately, however,
; Boot-Man leaves no room in the MBR for a partition table, which means that a USB stick with Boot-Man
; in its MBR cannot be used to store data. In fact, Windows does not recognize a USB stick with
; Boot-Man in its MBR as a valid storage medium.
;
; Controls of the game: you control Boot-Man using the WASD keys. No other user input is necessary. Some other
; keys can also be used to control Boot-Man, this is a side effect of coding my own keyboard handler in
; just a few bytes. There simply wasn't room for checking the validity of every key press.
;
; The game starts automatically, and when Boot-Man dies, a new game starts automatically within a couple of seconds.
;
;
; I've had to take a couple of liberties with the original Pac-Man game to fit Boot-Man inside the 510
; bytes available in the MBR:
;
; * The ghosts start in the four corners of the maze, they do not emerge from a central cage like in the original
;
; * There's just a single level. If you finish the level, the game keeps running with an empty maze. While
;   it is rather difficult to finish the game (which is intentional, because of the single level), it is possible.
;
; * Boot-Man only has 1 life. If Boot-Man dies, another game is started automatically (by re-reading the MBR
;   from disk, there simply isn't enough room to re-initialize the game in any other way)
;
; * Power pills function differently from the original. When Boot-Man eats a power pill, all ghosts become
;   ethereal (represented in game by just their eyes being visible) and cease to chase Boot-Man. While ethereal,
;   Boot-Man can walk through ghosts with no ill effects. While I would really like to include the "ghost hunting"
;   from the original, which I consider to be an iconic part of the game, this simply isn't possible in the little
;   space available.
;
; * There's no score, and no fruit to get bonus points from.
;
; * All ghosts, as well as Boot-Man itself, have the same, constant movement speed. In the original, the ghosts
;   run at higher speeds than Pac-Man, while Pac-Man gets delayed slightly when eating and ghosts get delayed when moving
;   through the tunnel connecting both sides of the maze. This leads to very interesting dynamics and strategies
;   in the original that Boot-Man, by necessity, lacks.
;
;
; Boot-Man runs in text mode. It uses some of the graphical characters found in IBM codepage 437 for its objects:
;   - Boot-Man itself is represented by the smiley face (☻), which is character 0x02 in the IBM charset
;   - The Ghosts are represented by the infinity symbol (∞), which is character 0xec. These represent
;     a ghost's eyes, with the ghost's body being represented simply by putting the character on a
;     coloured background
;   - The dots that represent Boot-Man's food are represented by the bullet character (•),
;     which is character 0xf9
;   - The power pills with which Boot-Man gains extra powers are represented by the diamond (♦),
;     which is character 0x04
;   - The walls of the maze are represented by the full block character (█), which is character 0xdb
;
; Boot-Man runs off int 8, which is connected to the timer interrupt. It should therefore run at the same speed
; on all PCs. It includes its own int 9 (keyboard) handler. The code is quite heavily optimized for size, so
; code quality is questionable at best, and downright atrocious at worst.


org 0x7c00                          ; The MBR is loaded at 0x0000:0x7c00 by the BIOS
bits 16                             ; Boot-Man runs in Real Mode. I am assuming that the BIOS leaves the CPU is Real Mode.
                                    ; This is true for the vast majority of PC systems. If your system's BIOS
                                    ; switches to Protected Mode or Long Mode during the boot process, Boot-Man
                                    ; won't run on your machine.

start:
    cli                             ; Disable interrupts, as we are going to set up interrupt handlers and a stack
    xor ax, ax
    mov ds, ax                      ; Set up a data segment that includes the Interrupt Vector Table and the Boot-Man code
    mov [0], dl             ; save the current drive number, which has been stored in dl by the BIOS
    mov ss, ax
    mov sp, 0x28                    ; Set up a temporary stack, within the interrupt vector table
    push ax                         ; This saves some bytes when setting up interrupt vectors
    push word int9handler           ; Set up my own int 9 (keyboard) handler
    push ax
    push word int8handler           ; Set up my own int 8 (timer interrupr) handler

    mov sp, ax                      ; Set up the real stack.

    inc ax                          ; int 0x10 / ah = 0: Switch video mode. Switch mode to 40x25 characters (al = 1).
    mov ah, 2
    int 0x10                        ; In this mode, characters are approximately square, which means that horizontal
                                    ; and vertical movement speeds are almost the same.
    xchg bx, bx
	jmp $

int9handler:
    pusha
    in al, 0x60                 ; We use the legacy I/O port for the keyboard. This code
                                ; would also work in an IBM PC from almost 40 years ago

    ; This code converts al from scancode to movement direction.
    ; Input:  0x11 (W),  0x1e (A),     0x1f (S),    0x20 (D)
    ; Output: 0xce (up), 0xca (right), 0xc6 (down), 0xc2 (left)
    ;
    ; Other scancodes below 0x21 are also mapped onto a movement direction
    ; Starting input:             0x11 0x1e 0x1f 0x20
    sub al, 0x21                ; 0xf0 0xfd 0xfe 0xff
    jnc intxhandler_end         ;                      if al >= 0x21, ignore scancode;
                                ;                      this includes key release events
    and al, 3                   ; 0x00 0x01 0x02 0x03
    shl al, 2                   ; 0x00 0x04 0x08 0x0c
    neg al                      ; 0x00 0xfc 0xf8 0xf4
    add al, 0xce                ; 0xce 0xca 0xc6 0xc2
    cmp al, [bootman_data + 2]  ; If the new direction is the same as the current direction, ignore it
    jz intxhandler_end
    mov [bootman_data + 3], al  ; Set new direction to the direction derived from the keyboard input

int8handler:
	nop

intxhandler_end:
    popa
    iret

bootman_data:
    db 0x0f, 0x0f               ; Boot-Man's x and y position
    db 0xca                     ; Boot-Man's direction
    db 0xca                     ; Boot-Man's future direction

pace_counter: db 0x10
ghost_timer:  db 0x0            ; if > 0 ghosts are invisible, and is counted backwards to 0

ghostdata:
    db 0xc2                     ; 1st ghost, direction
ghostpos:
    db 0x01, 0x01               ;            x and y position
ghostterrain:
    dw 0x0ff9                   ;            terrain underneath
ghostfocus:
    db 0x0, 0x0                 ;            focus point for movement
secondghost:
    db 0xce                     ; 2nd ghost, direction
    db 0x01, 0x17               ;            x and y position
    dw 0x0ff9                   ;            terrain underneath
    db 0x0, 0x4                 ;            focus point for movement
    db 0xca                     ; 3rd ghost, direction
    db 0x1e, 0x01               ;            x and y position
    dw 0x0ff9                   ;            terrain underneath
    db 0xfc, 0x0                ;            focus point for movement
    db 0xce                     ; 4th ghost, direction
    db 0x1e, 0x17               ;            x and y position
    dw 0x0ff9                   ;            terrain underneath
    db 0x4, 0x0                 ;            focus point for movement
lastghost:

bm_length           equ ghostdata    - bootman_data
gh_length           equ secondghost  - ghostdata
gh_offset_pos       equ ghostpos     - ghostdata
gh_offset_terrain   equ ghostterrain - ghostdata
gh_offset_focus     equ ghostfocus   - ghostdata
pace_offset         equ pace_counter - bootman_data
timer_offset        equ ghost_timer  - bootman_data

; The maze, as a bit array. Ones denote walls, zeroes denote food dots / corridors
; The maze is stored upside down to save one cmp instruction in buildmaze
maze: dw 0xffff, 0x8000, 0xbffd, 0x8081, 0xfabf, 0x8200, 0xbefd, 0x8001
      dw 0xfebf, 0x0080, 0xfebf, 0x803f, 0xaebf, 0xaebf, 0x80bf, 0xfebf
      dw 0x0080, 0xfefd, 0x8081, 0xbebf, 0x8000, 0xbefd, 0xbefd, 0x8001
      dw 0xffff
maze_length: equ $ - maze

; Collision detection flag. It is initialized by the code
collision_detect:

collision_offset equ collision_detect - bootman_data

times 510 - ($ - $$) db 0
db 0x55
db 0xaa
