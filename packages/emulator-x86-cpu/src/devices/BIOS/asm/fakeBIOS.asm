[org 0x0]

boot:
  mov ax, 0xf000
  mov ds, ax

  ; set video mode 80x25
  mov ax, 0x3
  int 0x10

  ; call header
  mov si, header_title
  call print_text

  ; load floppy
  call load_floppy_bootsector
  call check_signature

  ; reset regs and jmp to bootsector
  xor ax, ax
  mov ds, ax
  jmp 0x0000:0x7c00

; load mbr from floppy into 0x7C0:0x0000
load_floppy_bootsector:
  mov si, floppy_boot_title
  call print_text

  ; load floppy
  mov ax, 0x7c0
  mov es, ax
  xor bx, bx
  mov ah, 2
  mov al, 1
  mov ch, 0
  mov cl, 1
  mov dh, 0
  int 13h
  ret

check_signature:
  xor ax, ax
  mov fs, ax

  mov ax, [fs:0x7dfe]
  cmp ax, 0xAA55
  je .1

  ; display error
  mov si, signature_mismatch
  call print_text

  ; wait for key press
  xor ax, ax
  int 16h

  jmp reboot

  .1:
    ret

; jumps to reset vector
reboot:
  jmp 0xFFFF:0x0

; print sequence of chars
print_text:
  mov al, [si]
  inc si
  or al, al
  jz .1
  mov ah, 0x0e
  mov bh, 0x00
  mov bl, 0x07
  int 0x10
  jmp print_text

  .1:
    ret

; DATA
header_title db 'i8086.js', 0x0d, 0xa, 0
floppy_boot_title db 'Booting from floppy drive...', 0x0d, 0xa, 0
signature_mismatch db 'Incorrect boot signature! Press any key to reboot!', 0x0d, 0xa, 0
