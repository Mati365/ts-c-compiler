export type EditorLang = 'nasm' | 'c';

export type EditorStateValue = {
  lang: EditorLang;
  code: string;
};
