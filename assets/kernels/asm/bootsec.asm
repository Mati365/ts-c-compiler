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
; def sub(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
@@_fn_sub:
push bp
mov bp, sp
sub sp, 0
mov ax, [bp + 4]
sub ax, word [bp + 6]     ; %t{2}: int2B = %t{0}: int2B minus %t{1}: int2B
mov sp, bp
pop bp
ret 4
; def main(): [ret: int2B]
@@_fn_main:
push bp
mov bp, sp
sub sp, 2
mov word [bp - 2], 1      ; *(a{0}: int*2B) = store %1: int2B
push 20
push 10
call @@_fn_sub
imul ax, 3                ; %t{5}: int2B = %t{4}: int2B mul %3: char1B
mov bx, [bp - 2]
imul bx, ax               ; %t{7}: int2B = %t{6}: int2B mul %t{5}: int2B
mov word [bp - 2], bx     ; *(a{0}: int*2B) = store %t{7}: int2B
mov ax, [bp - 2]
xchg bx, bx
mov sp, bp
pop bp
ret
times 510 - ($ - $$) db 0
dw 0xaa55
