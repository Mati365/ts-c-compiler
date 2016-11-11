#!/bin/sh
bcc -0 -ansi -c c/main.c
ld86 -d -M c/main.o -o build/bootsec.bin