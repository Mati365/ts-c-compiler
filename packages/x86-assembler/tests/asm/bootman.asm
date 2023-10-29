;= test: bootman game
;= bin: fa31c08ed88816747c8ed0bc280050688e7d5068607c89c440cd10b90020b401cd10fcb800b88ec0bf8807becb7dbafa05b93c00add1e050b8db01720bb8f90f39d77504b600b004ab5701cfab5f5883e90479e183ef7079d8fbb020e620ebfa60bea97dfe4c04741461cf1e07b80102b90100ba8000bb007ccd13eb83c64404038a44038b14e8e20074038844028a44028b14e8d5007411b8200f26803d0475038844058714e8e000bb1b00887c54bdffff8a20807c0520740380f408b0ce8b50013b1475038844545238e07431e89a00742cb9100c387c0575058b0c0348055028d128f50fbec10fafc00fbecd0fafc901c15839e9730789cd88008950015a2c043cc273c38b4003e87d0083eb07799e8b50083b147503884454e85500268b0589400a83c30783fb1b75e5b8ec2fb110387c057517387c5474198b14b80f0ee84600005c04c606687c02eb5afe4c05b40fb1008b5001e82f0000cc83eb0779f3b8020e8b14e82000eb3ca26f7dfec280e21f520fb6fe6bff28b60001d783c704d1e75a26803ddbc3e8e7ffabc360e4602c2173122403c0e002f6d804ce3a06ab7d7403a2ac7d61cf0f0fcaca1000c20101f90f0000ce0117f90f0004ca1e01f90ffc00ce1e17f90f0400ffff0080fdbf8180bffa0082fdbe0180bffe8000bffe3f80bfaebfaebf80bffe8000fdfe8180bfbe0080fdbefdbe0180ffff0055aa

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
    mov [bootdrive], dl             ; save the current drive number, which has been stored in dl by the BIOS
    mov ss, ax
    mov sp, 0x28                    ; Set up a temporary stack, within the interrupt vector table
    push ax                         ; This saves some bytes when setting up interrupt vectors
    push word int9handler           ; Set up my own int 9 (keyboard) handler
    push ax
    push word int8handler           ; Set up my own int 8 (timer interrupr) handler

    mov sp, ax                      ; Set up the real stack.

    inc ax                          ; int 0x10 / ah = 0: Switch video mode. Switch mode to 40x25 characters (al = 1).
    int 0x10                        ; In this mode, characters are approximately square, which means that horizontal
                                    ; and vertical movement speeds are almost the same.

    mov cx, 0x2000                  ; int 0x10 / ah = 1: Determine shape of hardware cursor.
    mov ah, 0x01                    ; With cx = 0x2000, this removes the hardware cursor from the screen altogether
    int 0x10


    cld                             ; Clear the direction flag. We use string instructions a lot as they have one-byte codes
    mov ax, 0xb800
    mov es, ax                      ; Set up the es segment to point to video RAM


;-----------------------------------------------------------------------------------------------------
; buildmaze: builds the maze. The maze is stored in memory as a bit array, with 1 representing a wall
;            and 0 representing a food dot. Since the maze is left-right symmetrical, only half of the
;            maze is stored in memory. The positions of the power pills is hard-coded in the code.
;            Adding the power pills to the bit array would have necessitated 2 bits for every
;            character, increasing its size drastically.
;
;            Both sides of the maze are drawn simultaneously. The left part is drawn left to right,
;            while the right part is drawn right to left. For efficiency reasons, the entire maze
;            is built from the bottom up. Therefore, the maze is stored upside down in memory
;-----------------------------------------------------------------------------------------------------
buildmaze:
    mov di, 0x0788                  ; Lower left corner of maze in video ram
    mov si, maze                    ; The first byte of the bit array containing the maze
    mov dx, 0x05fa                  ; Address in video ram of the lower left powerpill
.maze_outerloop:
    mov cx, 0x003c                  ; The distance between a character in the maze and its
                                    ; symmetric counterpart. Also functions as loop counter
    lodsw                           ; Read 16 bits from the bit array, which represents one
                                    ; 32 character-wide row of the maze
.maze_innerloop:
    shl ax, 1                       ; shift out a single bit to determine whether a wall or dot must be shown
    push ax
    mov ax, 0x01db                  ; Assume it is a wall character (0x01: blue; 0xdb: full solid block)
    jc .draw                        ; Draw the character if a 1 was shifted out
    mov ax, 0x0ff9                  ; otherwise, assume a food character (0x0f: white; x0f9: bullet)
    cmp di, dx                      ; See if instead of food we need to draw a power pill
    jnz .draw
    mov dh, 0x00                    ; Update powerpill address to draw remaining powerpills
    mov al, 0x04                    ; powerpill character (0x04: diamond - no need to set up colour again)
.draw:
    stosw                           ; Store character + colour in video ram
    push di
    add di, cx                      ; Go to its symmetric counterpart
    stosw                           ; and store it as well
    pop di
    pop ax
    sub cx, 4                       ; Update the distance between the two sides of the maze
    jns .maze_innerloop             ; As long as the distance between the two halves is positive, we continue

    sub di, 0x70                    ; Go to the previous line on the screen in video RAM.
    jns .maze_outerloop             ; Keep going as long as this line is on screen.


    sti                             ; Initialization is complete, hence we can enable interrupts

.end:                               ; Idle loop, as everything else is done in the interrupt handlers.
                                    ; Unfortunately there's no room for a hlt here so the CPU keeps running 100%.
    mov al, 0x20                    ; Continuously write "end of interrupt". This saves a few bytes in the
    out 0x20, al                    ; interrupt handlers themselves, as we have to do it only once, here.
    jmp .end                        ; Overall, not a good way to implement an idle loop, its only saving grace
                                    ; being that it is so short.


;-----------------------------------------------------------------------------------------------------
; int8handler: The main loop of the game. Tied to int 8 (the timer interrupt, which fires 18x per
;              second by default), to ensure that the game runs at the same speed on all machines
;
;              The code first updates Boot-Man's position according to its movement direction
;              and keyboard input. Then the ghost AI is run, to determine the ghosts' movement
;              direction and update their position. Finally, Boot-Man and the ghosts are drawn
;              in their new positions. Collisions between Boot-Man and the ghosts are checked
;              before and after ghost movement. We need to detect for collisions twice, because
;              if you only check once, Boot-Man can change position with a ghost without colliding
;              (in the original, collisions are checked only once, and as a consequence, it is
;              possible in some circumstances to actually move Pac-Man through a ghost).
;-----------------------------------------------------------------------------------------------------
int8handler:
    pusha
    mov si, bootman_data            ; Use si as a pointer to the game data. This reduces byte count of the code:
                                    ; mov reg, [address] is a 4 byte instruction, while mov reg, [si] only has 2.
    dec byte [si + pace_offset]     ; Decrease the pace counter. The pace counter determines the overall
                                    ; speed of the game. We found that moving at a speed of 6 per second
                                    ; gives good speed and control, so we use a counter to only move
                                    ; once for every three times that the interrupt fires.
                                    ; We also use the pace counter to include longer delays at game start
                                    ; and after Boot-Man dies, by intitalizing the counter with higher values.
jump_offset: equ $ + 1
    jz .move_all                    ; If the pace counter is not 0, we immediately finish.
    popa                            ; The offset of this jump gets overwritten when boot-man dies
    iret

    push ds                         ; The new offset points here.
    pop es                          ; This code reloads the MBR and jumps back to the start
    mov ax, 0x0201                  ; al = number of sectors to read
    mov cx, 0x0001                  ; cx / dh : CHS of sector to read. In this case we read sector 1, the MBR.
bootdrive: equ $ + 1
    mov dx, 0x0080                  ; dl = disk number to read from. This code gets updated with the actual
                                    ; number of the boot disk at program start.
    mov bx, 0x7c00
    int 0x13                        ; int 0x13 / ah = 2: read one or more sectors from storage medium
    jmp start                       ; Go back to the top once read is complete. This re-inits all
                                    ; modified code and data

.move_all:
    mov byte [si + pace_offset], 0x3; Reset the pace counter.
;-----------------------------------------------------------------------------------------------------
; Move Boot-Man
;-----------------------------------------------------------------------------------------------------
    mov al, [si + 3]                ; al = new movement direction, as determined by keyboard input
    mov dx, [si]                    ; dx = current position of Boot-Man
    call newpos                     ; Update dx to move 1 square in the direction indicated by al
                                    ; newpos also checks for collisions with walls (in which case ZF is set)
    jz .nodirchange                 ; ZF indicates that new position collides with wall. We therefore try to keep
                                    ; moving in the current direction instead.
    mov [si + 2], al                ; If there's no collision, update the current movement direction
.nodirchange:
    mov al, [si + 2]                ; al = current movement direction
    mov dx, [si]                    ; dx = current position of Boot-Man
    call newpos                     ; Update dx to move 1 square in direction al
    jz .endbootman                  ; If there's a wall there, do nothing
.move:
    mov ax, 0x0f20                  ; Prepare to remove Boot-Man from screen, before drawing it in the new position
                                    ; 0x0f = black background, white foreground; 0x20 = space character
    cmp byte [es:di], 0x04          ; Detect power pill
    jnz .nopowerpill
    mov byte [si + timer_offset], al; If Boot-Man just ate a power pill, set up the ghost timer to 0x20. We use al here
                                    ; as it accidentally contains 0x20, and this is one byte shorter than having an
                                    ; explicit constant.
.nopowerpill:
    xchg dx, [si]                   ; Retrieve current position and store new position
    call paint                      ; Actually remove Boot-Man from the screen
.endbootman:
;-----------------------------------------------------------------------------------------------------
; ghost AI and movement
;
; Determine the new movement direction for each ghost. Ghost movement direction is determined by
; the following rule:
; (1) Every ghost must keep moving
; (2) It is forbidden for ghosts to suddenly start moving backwards. Unless Boot-Man just consumed
;     a powerpill, in which case ghosts are forbidden from continuing in the direction they were going
; (3) Whenever a ghost has multiple movement options (i.e., it is at a crossroads), try moving 1 space
;     in each direction that is allowed, and calculate the distance to the target location after
;     that move. Choose the direction for which this distance is lowest as the new movement direction
;
; During normal movement, ghosts target a position that is related to the position of Boot-Man, as follows:
;
; number | ghost colour | target
; -------+--------------+-------------------
;      1 | purple       | bootman's position
;      2 | red          | 4 squares below Boot-Man
;      3 | cyan         | 4 squares to the left of Boot-Man
;      4 | green        | 4 squares to the right of Boot-Man
;
; There's two different reasons for having slightly different AI for each ghost:
; (1) If all ghosts have the same AI they tend to bunch together and stay there. With the current AI,
;     ghosts will sometimes bunch together, but they will split apart eventually
; (2) With this setup, the ghosts tend to surround Boot-Man, making it harder for the player
;
; When Boot-Man picks up a power pill, a timer starts running, and ghosts become ethereal.
; As long as the ghosts are ethereal, the
; ghosts will not chase Boot-Man. Instead they will use the center of the big rectangular block
; in the middle of the maze as their target. They cannot reach it, obviously, so the result is
; that they will keep circling this block for as long as the timer runs.
;
; This AI is related to, but not the same as, the AI actually used in Pac-Man. The red Pac-Man ghost
; uses Pac-Man itself as target, same as my purple ghost, while the pink Pac-Man ghost will
; target 4 squares ahead of Pac-Man, in the direction Pac-Man is currently moving. The other ghosts'
; movement is a bit more complex than that. I had to simplify the AI because of the limited code size.
;-----------------------------------------------------------------------------------------------------
    mov bx, 3 * gh_length + bm_length       ; Set up offset to ghost data. With this, si + bx is a
                                            ; pointer to the data from the last ghost. Also used as
                                            ; loop counter to loop through all the ghosts
    mov byte [si + collision_offset], bh    ; Reset collision detection. BH happens to be 0 at this point
.ghost_ai_outer:
    mov bp, 0xffff                          ; bp = minimum distance; start out at maxint
    mov ah, [bx + si]                       ; ah will become the forbidden movement direction. We start
                                            ; with the current direction, which is forbidden if Boot-Man
                                            ; just ate a power pill
    cmp byte [si + timer_offset], 0x20      ; If timer_offset == 0x20, Boot-Man just picked up a power pill
    jz .reverse                             ; so in that case we do not flip the direction.
    xor ah, 8                               ; Flip the current direction to obtain the forbidden direction in ah
.reverse:
    mov al, 0xce                            ; al = current directions being tried. Doubles as loop counter
                                            ; over all directions.
                                            ; Values are the same as those used by the newpos routine
    mov dx, [bx + si + gh_offset_pos]       ; dx = current ghost position
    cmp dx, [si]                            ; compare dx with Boot-Man position
    jne .ghost_ai_loop                      ; If they are equal,
    mov [si + collision_offset], al         ; We store a non-zero value in the collision_detect flag
                                            ; We use al here as we know it to be non-zero, and this reduces
                                            ; code size compared to using a literal constant.
.ghost_ai_loop:
    push dx
    cmp al, ah                              ; If the current direction is the forbidden direction
    jz .next                                ; we continue with the next direction
    call newpos                             ; Update ghost position and check if it collides with a wall
    jz .next                                ; if so, we continue with the next direction
    mov cx, 0x0c10                          ; Target position if ghosts are ethereal. Position 0x0c10
                                            ; (x = 0x10, y = 0x0c) is in the center of the maze.
    cmp byte [si + timer_offset], bh        ; See if ghost timer runs. We compare with bh, which is known to be 0.
    jnz .skip_target                        ; If ghost timer runs, we use the aforementioned target position
    mov cx, [si]                            ; Otherwise we use Boot-Man's current position,
    add cx, [bx + si + gh_offset_focus]     ; Updated with an offset that is different for each ghost
.skip_target:
;-----------------------------------------------------------------------------------------------------
; get_distance: Calculate distance between positions in cx (target position) and dx (ghost position)
;               This used to be a function, but I inlined it to save some space.
;               The square of the distance between the positions in cx and dx is calculated,
;               according to Pythagoras' theorem.
;-----------------------------------------------------------------------------------------------------
    push ax
    sub cl, dl                              ; after this, cl contains the horizontal difference
    sub ch, dh                              ; and ch the vertical difference

    movsx ax, cl
    imul ax, ax                             ; ax = square of horizontal difference
    movsx cx, ch
    imul cx, cx                             ; cx = square of vertical difference

    add cx, ax                              ; cx = distance squared between positions in cx and dx
    pop ax

    cmp cx, bp                              ; Compare this distance to the current minimum
    jnc .next                               ; and if it is,
    mov bp, cx                              ; update the minimum distance
    mov [bx + si], al                       ; set the movement direction to the current direction
    mov [bx + si + gh_offset_pos], dx       ; Store the new ghost position
.next:
    pop dx                                  ; Restore the current ghost position
    sub al, 4                               ; Update the current direction / loop counter
    cmp al, 0xc2
    jnc .ghost_ai_loop

    mov ax, [bx + si + gh_offset_terrain]   ; Remove the ghost in the old position from the screen
    call paint                              ; by painting the terrain underneath that ghost that was
                                            ; determined in the previous movement phase.
    sub bx, gh_length                       ; Go to the next ghost,
    jns .ghost_ai_outer                     ; and stop after the final ghost


.ghostterrain_loop:                         ; Second loop through all the ghosts, to determine terrain
                                            ; underneath each one. This is used in the next movement phase
                                            ; to restore the terrain underneath the ghosts.
                                            ; Note that this "terrain storing" approach can trigger a bug
                                            ; if Boot-Man and a ghost share a position. In that case
                                            ; an extra Boot-Man character may be drawn on screen.
    mov dx, [bx + si + gh_offset_pos + gh_length]  ; dx = updated ghost position
    cmp dx, [si]                            ; compare dx with Boot-Man's position
    jne .skip_collision                     ; and if they coincide,
    mov [si + collision_offset], al         ; set the collision detect flag to a non-zero value.
.skip_collision:
    call get_screenpos                      ; find the address in video ram of the updated ghost position,
    mov ax, [es:di]                         ; store its content in ax
    mov [bx + si + gh_offset_terrain + gh_length], ax  ; and copy it to ghostterrain
    add bx, gh_length                       ; go to next ghost
    cmp bx, 3 * gh_length + bm_length       ; and determine if it is the final ghost
    jnz .ghostterrain_loop

    ; Test if ghosts are invisible
    mov ax, 0x2fec                          ; Assume ghost is visible: 0x2f = purple background, white text
                                            ; 0xec = infinity symbol = ghost eyes
    mov cl, 0x10                            ; cl = difference in colour between successive ghosts
                                            ; ch is set to zero as that leads to smaller code
    cmp byte [si + timer_offset], bh        ; See if ghost timer is running (note bh is still zero at this point)
    jnz .ghosts_invisible                   ; If it is, ghosts are ethereal

    cmp byte [si + collision_offset], bh    ; Ghosts are visible, so test for collisions
    jz .no_collision

    ; Ghosts are visible and collide with boot-man, therefore boot-man is dead
    mov dx, [si]                            ; dx = current Boot-Man position
    mov ax, 0x0e0f                          ; Dead boot-man: 0x0e = black background, yellow foreground
                                            ; 0x0f = 8 pointed star
    call paint
    add byte [si + pace_offset], bl         ; Update pace counter: this introduces a small period of mourning
                                            ; after Boot-Man's death.
                                            ; It was 3, and bl = 0x1b at this point, so it becomes 0x1e
    mov byte [jump_offset], 2               ; Modify the pace code at the start of this handler, to jump to the
                                            ; code that re-loads the MBR and re-starts the game
    jmp intxhandler_end

    ; Ghosts are invisible
.ghosts_invisible:
    dec byte [si + timer_offset]            ; Update ghost_timer to limit the period of the ghosts being ethereal
    mov ah, 0x0f                            ; Update ghost colour to black background, white eyes
    mov cl, 0x0                             ; Update difference between colours of successive ghosts. Value of 0x0
                                            ; means all ghosts are the same colour when they are ethereal.

.no_collision:
.ghostdraw:                                 ; Draw the ghosts on the screen
    mov dx, [bx + si + gh_offset_pos]       ; dx = new ghost position
    call paint                              ; show ghost in video ram
    add ah, cl                              ; Update ghost colour.
    sub bx, gh_length                       ; Loop over all ghosts
    jns .ghostdraw                          ; until the final one.


    mov ax, word 0x0e02                     ; Draw boot-man on the screen. 0x0e = black background, yellow foreground
                                            ; 0x02 = smiley face
    mov dx, [si]                            ; dx = new Boot-Man position
    call paint                              ; show Boot-Man

.end:
    jmp intxhandler_end


;-----------------------------------------------------------------------------------------------------
; newpos: calculates a new position, starting from a position in dx and movement direction in al.
;         dl contains the x coordinate, while dh contains the y coordinate. The movement directions
;         in al are as follows:
;         0xc2: move right
;         0xc6: move down
;         0xca: move left
;         0xce: move up
;
; The reason for these fairly strange values is that they form the 2nd byte (the ModR/M byte)
; of the instruction updating the position:
; inc dl (0xfe, 0xc2), inc dh (0xfe), dec dl (0xfe, 0xca), dec dh (0xfe, 0xce)
; The code first modifies itself to the correct instruction, then executes this instruction. The
; reason for doing it in this way is that this is a lot shorter than the traditional way of
; doing an if / elif / elif / else chain.
;
; Immediately after calculating the new position we also determine the address in video RAM
; corresponding to this position. All lines of the screen are stored one after the other in RAM,
; starting at 0xb800:0x0000. Since each line has 40 characters, and every character takes up
; two bytes (one for colour, one for the character code), the equation to calculate video RAM
; offset from x, y coordinates is as follows:
;
; offset = 2 * (40 * y + x + 4),
;
; with the +4 due to the fact that the maze is in the center of the screen, with a 4 character wide
; border to the left.
;
; newpos and get_screenpos used to be two separate functions but since they were almost
; always called one after the other, combining them saved some bytes of code.
;-----------------------------------------------------------------------------------------------------
newpos:
    mov [.modified_instruction + 1], al     ; Here the instruction to be executed is modified
.modified_instruction:
    db 0xfe, 0xc2                           ; inc dl in machine code
    and dl, 0x1f                            ; Deal with tunnels
get_screenpos:
    push dx
    movzx di, dh                            ; di = y coordinate
    imul di, di, 0x28                       ; multiply di by 0x28 = 40 decimal, the screen width
    mov dh, 0                               ; After this, dx contains the x coordinate
    add di, dx                              ; di = y * 40 + x
    add di, 4                               ; Skip the left border by adding 4 to di
    shl di, 1                               ; Multiply di by 2
    pop dx
    cmp byte [es:di], 0xdb                  ; Check to see if the new position collides with a wall
                                            ; 0xdb = full block character that makes up the wall
    ret

;-----------------------------------------------------------------------------------------------------
; paint: paints a character on screen at given x, y coordinates in dx
;        simple convenience function that gets called enough to be actually worth it, in terms
;        of code length.
;-----------------------------------------------------------------------------------------------------
paint:
    call get_screenpos                      ; Convert x, y coordinates in dx to video memory address
    stosw                                   ; stosw = shorter code for mov [es:di], ax
                                            ; stosw also adds 2 to di, but that effect is ignored here
    ret


;-----------------------------------------------------------------------------------------------------
; int9handler: the keyboard handler. It converts the scancodes for WASD into valid movement
;              directions, as described in the comment block above the newpos function.
;              We perform some bit wrangling to convert one into the other. This used to be
;              a simple if / elif / elif / else construction, but this bit-wrangling code is
;              much shorter, albeit much more obscure.
;              In the hope of documenting how this works, the comments show how these scancodes
;              are modified step by step into valid movement directions.
;
;              The reason that this works at all is that, coincidentally, WASD are in order of scancode,
;              (which is not a coincidence, as these scancodes reflect the geometry of the original
;              IBM PC keyboards), and that the lowest 2 bits of these are different for all 4.
;              Unfortunately, they are ordered in the wrong way: scancodes ascend while movement
;              directions descend. Therefore an extra minus sign is needed somewhere, which is
;              provided by the neg instruction.
;-----------------------------------------------------------------------------------------------------
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
