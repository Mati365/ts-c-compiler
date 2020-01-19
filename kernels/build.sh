#!/bin/sh
mkdir -p build/
nasm ./asm/bootsec.asm -o ./build/bootsec.bin
