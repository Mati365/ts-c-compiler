;= test: calc correct instruction size in times with label
;= bin: d906117cd906117c9090909090909090f40000f942
[org 7c00h]

abc:
times 2 fld dword [val_dd]
times $-abc nop
hlt

val_dd: dd 124.5

;= test: proper size of output
;= bin: 000000000055aa
[org 7c00h]

times 5-($-$$) db 0
times 5-($-$$) db 0
db 0x55
db 0xaa
