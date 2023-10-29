;= test: segment prefixes
;= bin: 2ea464a426a43ea464c54704
use16
org 0x7C00

cs movsb
fs movsb
es movsb
ds movsb
lds ax, [fs:bx+0x4]
