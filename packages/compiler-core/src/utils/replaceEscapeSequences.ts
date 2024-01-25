export const replaceEscapeSequences = (str: string) =>
  str
    .replaceAll('\\n', '\n')
    .replaceAll('\\b', '\b')
    .replaceAll('\\f', '\f')
    .replaceAll('\\r', '\r')
    .replaceAll('\\t', '\t')
    .replaceAll('\\\\', '\\')
    // eslint-disable-next-line quotes
    .replaceAll("\\'", "'")
    .replaceAll('\\"', '"')
    .replaceAll('\\0', String.fromCharCode(0));

export const revertEscapeSequences = (str: string) =>
  str
    .replaceAll('"', '\\"')
    // eslint-disable-next-line quotes
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\b', '\\b')
    .replaceAll('\f', '\\f')
    .replaceAll('\r', '\\r')
    .replaceAll('\0', '\\0');
