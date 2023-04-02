export function genComment(msg: string): string {
  return `; ${msg}`;
}

export function withInlineComment(line: string, msg: string) {
  if (!line) {
    return line;
  }

  return `${line.padEnd(25)} ${genComment(msg)}`;
}
