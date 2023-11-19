export const STD_ARG_CONTENT_HEADER = /* c */ `
  #define va_start(v, l)	__builtin_va_start(v, l)
  #define va_end(v)	__builtin_va_end(v)
  #define va_arg(v,l)	__builtin_va_arg(v, l)
`;
