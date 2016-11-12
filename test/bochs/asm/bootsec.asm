%macro PRINT 1
    mov ah, 0eh
    mov al, %1
    mov bl, 1110b
    int 10h
%endmacro

KernelBase    equ 07E0h
KernelOffset  equ 0000h
RootDirSectors  equ 14
FirstRootSector equ 19
StackBase        equ 9000h
StackOffset     equ 0FBFFh

THRESHOLD       equ 0xff8

org 0x7c00
jmp short start
nop

; FAT12 header
BS_OEMName      db  "FRYY0.1", 0
BPB_BytsPerSec  dw  0x200
BPB_SecPerClus  db  0x1
BPB_RsvdSecCnt  dw  0x1 ; Boot Sector Count
BPB_NumFATs     db  0x2
BPB_RootEntCnt  dw  0xe0
BPB_TotSec16    dw  0xb40
BPB_Media       db  0xf0
BPB_FATSz16     dw  0x9
BPB_SecPerTrk   dw  0x12
BPB_NumHeads    dw  0x2
BPB_HiddSec     dd  0x0
BPB_TotSec32    dd  0x0
BS_DrvNum       db  0x0
BS_Reserved1    db  0x0
BS_BootSig      db  0x29
BS_VolID        dd  0x0
BS_VolLab       db  "FRYY", 0, 0, 0, 0, 0, 0, 0
BS_FileSysType  db  "FAT12  ", 0

start:
    mov ax, cs
    mov ds, ax
    mov ax, StackBase
    mov ss, ax
    mov sp, StackOffset
    xor ah, ah
    xor dl, dl

    int 13h

    ; clear screen
    call clear
    ; read sector test
.research:
    xor ax, ax
    mov al, byte [.rootindex]

    call readroot

    inc byte [.rootindex]
    call search
    cmp byte [.rootindex], RootDirSectors
    je .noloader
    cmp word [search.ret], 0
    je .research
    jmp load
.noloader:
    push .noloader.str
    pop bp
    push ds
    pop es
    mov cx, 16
    mov ax, 01301h
    mov bx, 000ch
    mov dx, 0
    int 10h

    jmp $
.noloader.str db 'KERNEL.BIN NOT FOUND'
.rootindex db 0

readroot:
; DESCRIPTION: read a root sector (512 byte) into memory (KernelBase:KernelOffset)
; ax -> index of root sector
    mov bx, KernelBase
    mov es, bx
    mov bx, KernelOffset
    ; FAT etc are before ROOTs
    add ax, FirstRootSector
    mov cl, 1

    call read
    ret

read:
; ax -> sector index
; es:bx -> buffer pointer
; cl -> sector numbers
    ; save essential values
    mov byte [.count], cl

    push bx
    ; DIV
    mov bl, byte [BPB_SecPerTrk]
    div bl

    ; start sector
    inc ah
    mov cl, ah

    ; tractor number
    mov ch, al

    ; shr błąd
    shr ch, 1

    ; header number
    mov dh, al
    and dh, 1

    ; driver number
    mov dl, byte [BS_DrvNum]
    pop bx

.redo:
    mov ah, 2
    mov al, byte [.count]

    int 13h
    jc .redo
    ret
.count db 0

clear:
    mov ax, 0600h
    mov bh, 07
    mov cx, 0000
    mov dx, 184fh
    int 10h

    mov ah, 2
    mov bh, 0
    mov dx, 0
    int 10h
    ret

search:
    ; search loader's first root entry
    mov ax, KernelBase
    mov es, ax
    mov bx, KernelOffset
    mov cx, 0
.cmp:
    call cmpstr
    cmp si, 11
    je .found
    add bx, 32
    add cx, 32
    cmp cx, 512
    je .end
    jmp .cmp
.found:
    mov ax, [es:bx + 26]
    mov word [search.ret], ax
.end:
    ret
search.ret dw 0

cmpstr:
; es:bx -> target string
; si == 11 means match
    mov si, 0
.loop:
    mov ah, [.str + si]
    mov al, [es:bx + si]
    cmp ah, al
    jne .end
    inc si
    cmp si, 11
    je .end
    jmp .loop
.end:
    ret
.str db 'KERNEL  BIN'

load:
; loading FAT, using stack to store all segments indexes
    mov ax, 1
    mov bx, KernelOffset
    mov cl, 9
    call read
    push word [search.ret]
    mov bp, sp

    mov ax, word [search.ret]
.chain:
    call fatentry
    cmp word [fatentry.ret], THRESHOLD
    jge .realload
    ; more are waiting for store
    push word [fatentry.ret]
    inc word [.n]
    mov ax, word [fatentry.ret]
    jmp .chain

.realload:
; loading segments refered by bp and [.n] to KernelBase:KernelOffset
    mov bx, KernelOffset
.realload.read:
    mov ax, word [bp]
    sub ax, 2
    add ax, FirstRootSector
    add ax, RootDirSectors
    mov cl, 1
    call read
    sub bp, 2
    add bx, 512
    call .modify
    dec word [.n]
    cmp word [.n], 0
    je .end
    jmp .realload.read
.end:
    ; fill DS
    mov ax, KernelBase
    mov ds, ax
    ; long jump!
    pushf
    push KernelBase
    push KernelOffset
    iret

.modify:
; modify es:bx in case of bx's overflow
    cmp bx, 0x1000
    jle .modify.end
    mov ax, es
    add ax, 0x0100
    mov es, ax
    sub bx, 0x1000
.modify.end:
    ret

.n dw 1

fatentry:
; ax -> FAT index
    push ax
    mov bx, ax
    shr bx, 1
    add ax, bx
    mov si, ax
    mov al, [es:KernelOffset + si]
    inc si
    mov ah, [es:KernelOffset + si]
    pop bx
    and bx, 1
    cmp bx, 0
    je .even
    ; odd number
    shr ax, 4
    mov word [fatentry.ret], ax
    jmp .end
.even:
    and ah, 0x0f
    mov word [fatentry.ret], ax
    jmp .end
.end:
    ret
fatentry.ret dw 0


times 510-($-$$) db 0
dw 0xaa55
;db 0xf0, 0xff, 0xff
;times 1024-($-$$) db 0