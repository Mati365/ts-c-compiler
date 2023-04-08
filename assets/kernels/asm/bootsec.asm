    cpu 386
  [org 0x7c00]
  jmp 0x0000:initialize_mbr

  initialize_mbr:
  xor ax, ax
  mov ds, ax
  mov es, ax
  mov fs, ax
  call @@_fn_main
  hlt

  ; BOOOTSEC


cpu 386
; def strlen(str{0}: const char**2B): [ret: int2B]
@@_fn_strlen:
push bp
mov bp, sp
sub sp, 2
mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
@@_L1:
mov bx, [bp + 4]          ; %t{2}: const char*2B = load str{0}: const char**2B
add bx, word [bp - 2]     ; %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
mov al, [bx]              ; %t{5}: const char1B = load %t{4}: const char*2B
cmp al, 0                 ; %t{6}: i1:zf = icmp %t{5}: const char1B equal %0: char1B
jnz @@_L4                 ; br %t{6}: i1:zf, false: L4
@@_L5:
mov ax, [bp - 2]
mov sp, bp
pop bp
ret 2
@@_L4:
mov ax, [bp - 2]
add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{1}: int2B
jmp @@_L1                 ; jmp L1
@@_L3:
mov ax, word -1
mov sp, bp
pop bp
ret 2

; def kernel_screen_clear():
@@_fn_kernel_screen_clear:
push bp
mov bp, sp
mov cx, 0x7d0
mov ax, 0xF00
mov dx, 0xB800
mov es, dx
xor di, di
rep stosw
mov sp, bp
pop bp
ret

; def kernel_screen_print_at(x{0}: int*2B, y{0}: int*2B, color{0}: char*2B, str{1}: const char**2B):
@@_fn_kernel_screen_print_at:
push bp
mov bp, sp
sub sp, 9
mov bx, [bp + 10]         ; %t{10}: const char*2B = load str{1}: const char**2B
push bx
call @@_fn_strlen
mov word [bp - 2], ax     ; *(len{0}: int*2B) = store %t{11}: int2B
mov bx, [bp + 6]
imul bx, 80               ; %t{13}: int2B = %t{12}: int2B mul %80: char1B
add bx, word [bp + 4]     ; %t{15}: int2B = %t{13}: int2B plus %t{14}: int2B
shl bx, 1                 ; %t{16}: int2B = %t{15}: int2B mul %2: char1B
mov word [bp - 4], bx     ; *(origin{0}: int*2B) = store %t{16}: int2B
mov cx, [@@_c_1_]         ; %t{18}: const char*2B = load %t{17}: const char**2B
mov gs, cx
mov word [bp - 6], 0      ; *(i{0}: int*2B) = store %0: int2B
@@_L6:
mov ax, [bp - 2]
cmp word [bp - 6], ax     ; %t{21}: i1:zf = icmp %t{19}: int2B less_than %t{20}: int2B
jl @@_L7                  ; br %t{21}: i1:zf, true: L7, false: L8
jge @@_L8                 ; br %t{21}: i1:zf, true: L7, false: L8
@@_L7:
mov bx, [bp + 10]         ; %t{24}: const char*2B = load str{1}: const char**2B
add bx, word [bp - 6]     ; %t{27}: const char*2B = %t{24}: const char*2B plus %t{26}: const char*2B
mov al, [bx]              ; %t{28}: const char1B = load %t{27}: const char*2B
mov byte [bp - 7], al     ; *(%1_c{0}: const char*2B) = store %t{28}: const char1B
mov cx, [bp - 6]
mov dx, cx                ; swap
shl cx, 1                 ; %t{31}: int2B = %t{25}: int2B mul %2: char1B
mov di, [bp - 4]
add di, cx                ; %t{32}: int2B = %t{29}: int2B plus %t{31}: int2B
mov word [bp - 9], di     ; *(offset{0}: const int*2B) = store %t{32}: int2B
mov ah, [bp - 7]          ; asm input - c
mov si, [bp - 9]          ; asm input - offset
push dx                   ; clobber - dl
mov dl, byte [bp + 8]
mov bx, si
mov byte [gs:bx + 1], dl
mov byte [gs:bx], ah
pop dx                    ; clobber - dl
add dx, 1                 ; %t{23}: int2B = %t{25}: int2B plus %1: int2B
mov word [bp - 6], dx     ; *(i{0}: int*2B) = store %t{23}: int2B
jmp @@_L6                 ; jmp L6
@@_L8:
mov sp, bp
pop bp
ret 8

; def kernel_screen_println(color{1}: char*2B, str{1}: const char**2B):
@@_fn_kernel_screen_println:
push bp
mov bp, sp
mov ax, [@@_c_3_]         ; %t{38}: int2B = load %t{37}: int*2B
mov bx, @@_c_3_
add bx, 2                 ; %t{40}: int*2B = %t{37}: struct Vec2*2B plus %2: int2B
mov cx, [bx]              ; %t{41}: int2B = load %t{40}: int*2B
mov di, [bp + 6]          ; %t{43}: const char*2B = load str{1}: const char**2B
push di
mov dx, word [bp + 4]
and dx, 0xff
push dx
push cx
push ax
call @@_fn_kernel_screen_print_at
mov word [@@_c_3_], 0     ; *(%t{44}: int*2B) = store %0: char1B
mov ax, @@_c_3_
add ax, 2                 ; %t{46}: int*2B = %t{44}: struct Vec2*2B plus %2: int2B
mov di, ax
mov bx, [di]              ; %t{47}: int2B = load %t{46}: int*2B
add bx, 1                 ; %t{48}: int2B = %t{47}: int2B plus %1: int2B
mov word [di], bx         ; *(%t{46}: int*2B) = store %t{48}: int2B
mov sp, bp
pop bp
ret 4

; def main():
@@_fn_main:
push bp
mov bp, sp
sub sp, 4
call @@_fn_kernel_screen_clear
mov word [bp - 2], 1      ; *(i{0}: int*2B) = store %1: int2B
@@_L9:
cmp word [bp - 2], 15     ; %t{51}: i1:zf = icmp %t{50}: int2B less_than %15: char1B
jl @@_L10                 ; br %t{51}: i1:zf, true: L10, false: L11
jge @@_L11                ; br %t{51}: i1:zf, true: L10, false: L11
@@_L10:
xor dx, dx
mov ax, [bp - 2]
mov bx, word 3
mov cx, ax                ; swap
idiv bx                   ; %t{56}: int2B = %t{55}: int2B mod %3: char1B
shl dx, 1                 ; %t{57}: const char*[3]*2B = %t{56}: int2B mul %2: int2B
mov ax, @@_c_2_
add ax, dx                ; %t{58}: const char*[3]*2B = %t{54}: const char*[3]*2B plus %t{57}: const char*[3]*2B
mov di, ax
mov dx, [di]              ; %t{59}: const char*2B = load %t{58}: const char*[3]*2B
mov word [bp - 4], dx     ; *(%1_str{0}: const char**2B) = store %t{59}: const char*2B
mov si, [bp - 4]          ; %t{62}: const char*2B = load %1_str{0}: const char**2B
push cx                   ; preserve: %t{55}
push si
push cx
call @@_fn_kernel_screen_println
pop cx                    ; restore: %t{55}
add cx, 1                 ; %t{53}: int2B = %t{55}: int2B plus %1: int2B
mov word [bp - 2], cx     ; *(i{0}: int*2B) = store %t{53}: int2B
jmp @@_L9                 ; jmp L9
@@_L11:
mov sp, bp
pop bp
ret

@@_c_0_:
dw @@_c_0_@str$0_0
dw @@_c_0_@str$0_1
dw 5
@@_c_0_@str$0_0: db "Hello world2!", 0x0
@@_c_0_@str$0_1: db "Hello world2!", 0x0
@@_c_1_:
dw 47104
@@_c_2_:
dw @@_c_2_@str$0_0
dw @@_c_2_@str$0_1
dw @@_c_2_@str$0_2
@@_c_2_@str$0_0: db "Hello world!", 0x0
@@_c_2_@str$0_1: db "Peppa pig!", 0x0
@@_c_2_@str$0_2: db "Another cool title!", 0x0
@@_c_3_:
dw 0, 0


  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
