export const STD_ARG_CONTENT_HEADER = /* c */ `
  #define va_list             struct __builtin_va_list
  #define va_start(ap, type)  __builtin_va_start(&ap, &type)
  #define va_end(ap)          __builtin_va_end(&ap)
  #define va_arg(ap, type)    __builtin_va_arg(&ap, sizeof(type))
`;
