org 0x7c00

define TEXT_MODE_ADDR_SEGMENT  0xB800
define APP_CODE_SEGMENT  0x2000

; stage 2 constants
define CODE_FLOPPY_SECTOR_OFFSET 2 ; it is indexed from 1, second is bootloader
define TOTAL_CODE_SEGMENTS 10 ; no FS :(
define TOTAL_CODE_SIZE TOTAL_CODE_SEGMENTS * 512 ; 3 * TOTAL_SEGMENTS

define arg1 [ss:bp + 4h]
define arg2 [ss:bp + 6h]
define arg3 [ss:bp + 8h]
define arg4 [ss:bp + 0Ah]
define arg5 [ss:bp + 0Ch]
define arg6 [ss:bp + 0Eh]

define local1  [ss:bp - 4h]
define local2  [ss:bp - 6h]
define local3  [ss:bp - 8h]

macro stdcall proc, [arg] {
  reverse push arg
  common call proc
}

jmp __main

; loads program data from floppy
; https://en.wikipedia.org/wiki/INT_13H#INT_13h_AH.3D02h:_Read_Sectors_From_Drive
load_program_code:
  ; destination segment
  mov ax, APP_CODE_SEGMENT
  mov es, ax
  xor bx, bx

  mov dh, 0
  mov al, TOTAL_CODE_SEGMENTS

  mov ch, 0
  mov cl, CODE_FLOPPY_SECTOR_OFFSET

  ; interrupt function
  mov ah, 0x2
  int 13h

  ; perform jmp to loaded code
  ret

; main program entry point
__main:
  mov ax, 0x0
  mov ss, ax
  mov sp, 0x0

  call load_program_code
  jmp APP_CODE_SEGMENT:0x0

  ; it should be never executed, but hlt if error
  hlt

times 510-($-$$) db 0
dw 0xaa55

; ---------------------------------------------------------
; SECOND STAGE
org 0x0
jmp __app_main

reset_screen:
  mov ah, 0x00
  mov al, 0x03  ; text mode 80x25 16 colours
  int 0x10
  ret

; changes FS to point to text video mapped memory
attach_text_mode:
  mov ax, TEXT_MODE_ADDR_SEGMENT
  mov fs, ax
  ret

; Fetch mode columns in text mode
; http://stanislavs.org/helppc/int_10-f.html
;
; Return - AX  column count
get_mode_columns_count:
  xor ax, ax
  mov ah, 0Fh
  int 10h

  ; column count is inside AH, AL is mode so drop AL and pick only AH
  shr ax, 8h
  ret

; transforms X and Y to offset where: (0b800 << 2) + offset
;
; arg1 [bp + 4h] ; X - column
; arg2 [bp + 6h] ; Y - row
;
; return: BX
pos_to_mem_offset:
  push bp
  mov bp, sp

  ; video mode columns to AX
  call get_mode_columns_count

  mov dx, word arg2

  ; mul Y arg coordinate by screen columns width
  ; imul ax, XX is not supported for now
  imul word arg2

  ; each item in memory is represented using two bytes
  ; [character, color] so mul by 2 rows
  shl ax, 1h

  ; mul by 2 columns
  xor bx, bx
  mov bl, byte arg1
  shl bx, 1h

  ; add arg X row offset
  add bx, ax
  xor ax, ax

  mov sp, bp
  pop bp
  ret 4

; Print letter at specified address
;
; arg1 [bp + 4h] ; letter
; arg2 [bp + 6h] ; color
; arg3 [bp + 8h] ; X
; arg4 [bp + 10h] ; Y
print_letter:
  push bp
  mov bp, sp

  push dx
  push bx
  push ax
    stdcall pos_to_mem_offset, word arg3, word arg4

    mov ax, arg1
    mov [fs:bx], ax

    mov ax, arg2
    mov [fs:bx + 1], ax
  pop ax
  pop bx
  pop dx

  mov sp, bp
  pop bp
  ret 8

; Print string and increments and decrements cursor
; see! Ptr must be in DS segment
;
; arg1 [bp + 4h] ; string ptr
; arg2 [bp + 6h] ; color
; arg3 [bp + 8h] ; X
; arg4 [bp + Ah] ; Y
; arg5 [bp + Bh] ; lines limit
; arg6 [bp + Fh] ; offset line
;
; returns: bx - total displayed characters
print_string:
  push bp
  mov bp, sp

  mov ax, word arg5
  add ax, word arg4
  add ax, word arg6
  sub sp, 2
  mov local1, ax ; max render limit

  mov si, arg1
  mov bx, word arg3

  ; current line
  mov dx, word arg4

  .__print_letter:
    lodsb

    ; EOT ASCII Code
    cmp al, 0x3
    je print_string.__printed

    ; new line
    cmp al, '$'
    jne .__non_new_line

    ; print new line
    mov bx, 0x0
    inc dx
    jmp .__continue

    .__non_new_line:
    ; lines limit
    cmp dx, word local1
    jg print_string.__printed

    ; offset
    cmp dx, word arg6
    jle .__increment_cursor

    ; print character if not magic
    .__render_character:
    mov cx, dx
    sub cx, word arg6
    stdcall print_letter, ax, word arg2, bx, cx

    .__increment_cursor:
    inc bx

    .__continue:
    jmp .__print_letter

  .__printed:
  mov sp, bp
  pop bp
  ret 8


render_loop:
  push bp
  mov bp, sp

  sub sp, 2
  mov word local1, 0 ; current line

  ; print text without last line
  .render:
    call reset_screen

    stdcall print_string, word titles, 0xF, 0, 0, 23, word local1
    stdcall print_string, word navigation, 0x8, 0, 24, 0xFF, 0

    ; wait for key
    mov ah, 0x0
    int 16h

    ; ESC
    cmp al, 27
    je render_loop.__exit

    ; arrow up
    cmp al, 38
    je .__scroll_up

    ; arrow down
    cmp al, 40
    je .__scroll_down

    jmp .__continue

    .__scroll_up:
      cmp word local1, 0
      je .__continue
      dec word local1
      jmp .__continue

    .__scroll_down:
      inc word local1

    .__continue:
  jmp .render

  .__exit:
  mov sp, bp
  pop bp
  ret

__app_main:
  mov ax, 0xFFFF
  mov ss, ax
  mov sp, 0x0

  mov ax, APP_CODE_SEGMENT
  mov ds, ax

  ; test character
  call attach_text_mode
  call render_loop

  hlt

; --------------- DATA ---------------
navigation:\
  times 53 db ' '
  db 'Scroll: arrow [up] / [down]', 0x3

; titles db '# DUPA$DUPA$DUPA', 0x3
titles db '# Curriculum Vitae$$Name/Surname: **Mateusz Bagiński**$Phone: **570 065 272**$E-Mail: **cziken58@gmail.com**$West Pomeranian District, Kolobrzeg County, Poland$$## About me$Im a hobbyist programmer who started his programming$"voyage" something about 7-8 years ago. Beginning from C,$Assembly, C++ ending up with Ruby, Python and Javascript$ES8 I was creating bigger and bigger projects slowly$learning how to organise large scale apps.  About 6 years$ago surfing over the internet I discovered Github and$Sourceforge.net and started to upload my "quality content"$there. I stayed here to this day. All projects, all tasks$which I have done in my current company and in my personal$code are written as best as I can.$$### Skills(with level)$- Large Single Page App creation and maintaince(React /$Lerna monorepos)$- Coffee Script, TypeScript, Javascript ES8(with many T39$useful proposals implemented in Babel) - Advanced$- GraphQL / Subscriptions - Advanced$- **Functional Programming**(using Ramda, Ramda Fantasy,$RX.js) - Advanced$- CSS / JSS(css in js, mainly JSS)$- Socket.io$- Webpack / Gulp / Grunt / Rollup - bundlers$- Jade(Slim - Pug) / HTML5 / Canvas / WebGL(OpenGL 4+)$- Ruby On Rails(and integration old projects with newest$SSR React)$- Node.JS / Express(with Redis and advanced geolocation$integration)$- **React** (with SSR related stuff), JQuery, Lodash, Ramda$and many other JS NPM libs$- Adserver implementations(GPT, Adocean) / Analytics /$Google Tags / Ad creations implementations$- SEO Optimizations(dealing with SSR React stuff and making$bots happy to see all JS components)$- Monorepos repo organisation(Yarn workspaces, Lerna)$- Linux$$### Hobby projects$Ordered by coolness(in my opinion ofc):$- _Asynchronous SSR Blog Example_(with ES7 module to handle$async backend data in SSR side - in express.js for$example)$Technology: **React**, **ES8**, **Webpack**<br/>$Link:$https://github.com/Mati365/react-asynchronous-ssr-blog$Description:  React has a huge problem related to handle$SSR Asynchronous data. In many commercial project which I$have been working I learned one - SSR is pain, but content$loads faster. I managed to write a simple example for other$people to see how large scale apps in my projects handle$async promise data. Maybe it will help somebody? It uses$one trick: renders whole tree twice, first - generating$tree with promises, second - loading cached data. It is$much easier and more portable than _Redux_$implementation(because it uses _Context_). In bigger$project I realized that it can be used also with _Redis_$and _GraphQL_ which lead me to write GraphQL client(because$_Apollo_ is not suitable for big commercial apps due to mem$leaks).  $$- _neural-cars_ $Technology: **React**, **ES8**, **Webpack**, **Canvas**$Link: $https://github.com/Mati365/neural-cars $https://github.com/Mati365/kart-racing monorepo $Description:  Neural-Cars is a simple AI base for my new$project(_kart-racing_). It was a school project which$demonstrated using neural networks in wild. All collision$detection, neural network implementation and others stuff I$have written on my own. $$- _i8086.js_ $Technology: **React**, **ES6**, **Webpack** $Link: https://github.com/Mati365/i8086.js$Description:  i8086.js is a _really_ simple x86 virtual$machine written in plain JS(without any helpers libs). VM$supports some 32bit instructions from newer CPUs(intel$8286) and around 70%-80% 16bit instructions(intel 8086).$For now I can run on it "simple" operating systems like$_MikeOS_ which has thousands of opcodes and does not have$IVT support. My mistake was writing _BIOS_ not as$embeddable binary blob but as _ES6_ module because I needed$to write many interrupts and port handlers. Writting only$port handlers as external devices and using precompiled$_BIOS_ would be easier.   $$- _reddit-news_ $Technology: **Vue**, **CSS**, **ES6**, **Gulp** $Link: https://github.com/Mati365/reddit-news$Description:  Reddit client written in **Vue.JS** created$because Im lazy. I wanted to see reddit without opening$new tab in popup. Supports OAuth, notifications, switching$tags, multis etc.$$- _soccer-js_ $Technology: **HTML5**, **Canvas**, **Gulp**,$**Socket.io** $Link: https://github.com/Mati365/Soccer.js$Description:  Soccer.js was a open source Haxball clone. I$wanted to learn how to use socket.io to write real time,$multiplayer which enjoys me and my friends. I abandoned$project - designing UI in HTML5 Canvas is overkill(I wasted$60% time on it). $$- _ad-tester_ $Technology: **React**, **Chrome Extension API** $Link: https://github.com/Mati365/ad-tester $Description:  In my current company I created many Ads$creations that integrates directly with website. It was$really hard to debug frame ads so I have written in my free$home time tool to help my friends working in _Traffic_ to$see ads and debug them "live" on page. After clicking some$ads it allows user to replace its html and execute$slot. $$... any many others on https://github.com/Mati365$$### Commercial $- **01-04-2016** to **now** - Lead Frontend developer at$Adretail Grupa Interia.pl $Technologies: **React**, **Webpack**, **Rails**,$**GraphQL**, **Angular.js**, **GPT**, **Adocean** and many$many others $$I was working with 5 "big" e-paper websites:$- _Okazjum.pl_$- _Promocyjni.pl_$- _Promoceny.pl_$- _Adretail.pl_ $- _Anonymous_ lets say(large SPA react app as a lead$frontend developer) :) $$... and around ~10 internal "admin" pages(also written in$React). All admin pages(like E-Paper Leaflet editors) were$written in Rails/React in around 2 years. Many of them were$written directly as SPA apps but most of them were using$the same lets say "theme" monorepo package with 300-340+$Components, something like bootstrap). All front(and$express.js) related stuff in panels(and themes monorepo)$were written by me from scratch(without using any React$helpers modules etc. due to Rails integration issues).$Except all of them I was aslo an front lead developer$something like Twitter embeddable module(and admin panel to$handle it) which users paste on their pages. It was a$pretty big project because except iframes it should work as$NPM module and should be integrated directly to 10 years$old websites(without NPM) - it was so damn hard thing to do$but using prerendering feature of react and express / redis$- all worked correctly as reusable external-rendered$partial). Except that I was also responsible for supporting$all "big" pages with creating reusable leaflets browser$component(with JSS, and reusable themes with Adserver$integration), implementing Ads(with _SRA_ support and lazy$loading). But the hardest project "part" which I have done$were - **slider(with draggable container, seo friendly with$endless scrolling)**, **image zoom**. Due to react-slider$issues(mainly because it does not support SSR :( ) I had to$write custom infinity leaflet slider component from$scratch. I did exactly the same with image zoom component.$That components were not big - but really hard to$write(keeping SEO integration in mind). $$- **01-02-2016** to **01-04-2016** - Fullstack developer in$Quantitative Engineering Design$$Programming backend and frontend using ES6, JavaScript 1.7,$Python Django and Vue.JS. Worked for clients including$Africa Soils.$$- **01-10-2016** to **01-01-2017** - Frontend developer in$Umwerk.yo $$Maintain Guidebase.com in Angular 1.x, JQuery - fixing bugs$and adding some features. Simple _BMW_ presentation for$self driving car - Angular 1.x with IE 10 support.$$### Education$- IT Engineering in Politechnika Koszalińska - 2016 - now$- Technical school in School Complex No. 1 name of Henryk$Sienkiewicz in Kolobrzeg, 2012 - 2016$$### Certifications$- 3102 SUSE Linux Enterprise 11 Administration$- 3101 SUSE Linux Enterprise 11 Fundamental', 0x3
