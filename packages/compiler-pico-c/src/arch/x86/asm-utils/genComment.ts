export function genComment(msg: string): string {
  return `; ${msg}`;
}

export function withInlineComment(line: string, msg: string) {
  return `${line} ${genComment(msg)}`;
}
