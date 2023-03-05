[org 0x7c00]
jmp 0x0000:initialize_mbr
initialize_mbr:
xor ax, ax
mov ds, ax
mov es, ax
mov fs, ax
call @@_fn_main
hlt
cpu 386
; def printf(x{0}: int*2B, y{0}: int*2B, str{0}: const char**2B):
@@_fn_printf:
push bp
mov bp, sp
sub sp, 9
mov word [bp - 2], 14     ; *(len{0}: int*2B) = store %14: int2B
mov ax, [bp + 6]
imul ax, 80               ; %t{1}: int2B = %t{0}: int2B mul %80: char1B
add ax, word [bp + 4]     ; %t{3}: int2B = %t{1}: int2B plus %t{2}: int2B
shl ax, 1                 ; %t{4}: int2B = %t{3}: int2B mul %2: char1B
mov word [bp - 4], ax     ; *(origin{0}: int*2B) = store %t{4}: int2B
push ax
mov ax, 0xB800
mov gs, ax
pop ax
mov word [bp - 6], 0      ; *(i{0}: int*2B) = store %0: int2B
@@_L1:
cmp word [bp - 6], 14     ; %t{6}: i1:zf = icmp %t{5}: int2B less_than %14: char1B
xchg bx, bx
jl @@_L2                  ; br %t{6}: i1:zf, true: L2, false: L3
jge @@_L3                 ; br %t{6}: i1:zf, true: L2, false: L3
@@_L2:
mov bx, [bp + 8]          ; %t{9}: const char*2B = load str{0}: const char**2B
add bx, word [bp - 6]     ; %t{12}: const char*2B = %t{9}: const char*2B plus %t{10}: int2B
mov al, [bx]              ; %t{13}: const char1B = load %t{12}: const char*2B
mov byte [bp - 7], al     ; *(c{0}: const char*2B) = store %t{13}: const char1B
mov cx, [bp - 6]
shl cx, 1                 ; %t{16}: int2B = %t{15}: int2B mul %2: char1B
mov dx, [bp - 4]
add dx, cx                ; %t{17}: int2B = %t{14}: int2B plus %t{16}: int2B
mov word [bp - 9], dx     ; *(offset{0}: const int*2B) = store %t{17}: int2B
mov ah, [bp - 7]
mov di, [bp - 9]
push bx
mov bx, di
mov byte [gs:bx], ah
pop bx
mov si, [bp - 6]
add si, 1                 ; %t{8}: int2B = %t{7}: int2B plus %1: int2B
mov word [bp - 6], si     ; *(i{0}: int*2B) = store %t{8}: int2B
jmp @@_L1                 ; jmp L1
@@_L3:
mov sp, bp
pop bp
ret 6
; def main():
@@_fn_main:
push bp
mov bp, sp
sub sp, 2
mov bx, @@_c_0_           ; %t{22}: const char*2B = lea c{0}: const char[15]15B
mov word [bp - 2], bx     ; *(%t{21}: const char**2B) = store %t{22}: const char*2B
push word [bp - 2]
push 3
push 0
call @@_fn_printf
mov sp, bp
pop bp
ret
@@_c_0_: db 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 32, 49, 33, 0
times 510 - ($ - $$) db 0
dw 0xaa55
