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

; def kernel_print_char(x{0}: int*2B, y{0}: int*2B, color{0}: char*2B, c{1}: char*2B):
@@_fn_kernel_print_char:
push bp
mov bp, sp
sub sp, 3
mov ax, [bp + 4]
mov word [bp - 2], ax     ; *(origin{0}: const int*2B) = store %t{0}: int2B
mov bl, [bp + 10]
mov byte [bp - 3], bl     ; *(dee{0}: const char*2B) = store %t{1}: char1B
xchg bx, bx
mov cx, [@@_c_0_]         ; %t{3}: const char*2B = load %t{2}: const char**2B
mov bh, [bp - 3]          ; asm input - c
mov dx, [bp - 2]          ; asm input - offset
mov gs, cx
mov dl, byte [bp + 8]
mov bx, dx
mov byte [gs:bx + 1], dl
mov byte [gs:bx], bh
mov sp, bp
pop bp
ret 8

; def main():
@@_fn_main:
push bp
mov bp, sp
call @@_fn_kernel_screen_clear
push 65
push 2
push 0
push 0
call @@_fn_kernel_print_char
push 66
push 2
push 0
push 1
call @@_fn_kernel_print_char
push 67
push 2
push 0
push 2
call @@_fn_kernel_print_char
mov sp, bp
pop bp
ret

@@_c_0_:
dw 47104
@@_c_1_:
dw @@_c_1_@str$0_0
dw @@_c_1_@str$0_1
dw @@_c_1_@str$0_2
@@_c_1_@str$0_0: db "┣Hello world!", 0x0
@@_c_1_@str$0_1: db "Peppa pig!", 0x0
@@_c_1_@str$0_2: db "Another cool title!", 0x0
@@_c_2_:
dw 0, 0


  ; BOOTSET

  times 510 - ($ - $$) db 0
  dw 0xaa55
