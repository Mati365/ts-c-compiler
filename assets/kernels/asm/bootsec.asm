%macro  writefile 2
  jmp     %%endstr

  %%str:        db      %2
  %%endstr:
        mov     dx,%%str
        mov     cx,%%endstr-%%str
        mov     bx,%1
        mov     ah,0x40
        int     0x21
%endmacro

writefile 0xFE, 0x12
