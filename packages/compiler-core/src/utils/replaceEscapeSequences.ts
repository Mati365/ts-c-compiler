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
    .replaceAll('\\"', '"');
