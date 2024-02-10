import type { EditorCompileLang } from 'modules';

export const EN_COMPILE_LANG: Record<EditorCompileLang, string> = {
  nasm: 'Assembly Language (NASM syntax)',
  c: 'C99 Language',
};

export const EN_18N_VALUE = {
  header: {
    run: 'Run',
    stop: 'Stop',
    pause: 'Pause',
    compile: {
      lang: EN_COMPILE_LANG,
    },
    links: {
      github: 'Github project link',
    },
  },
};
