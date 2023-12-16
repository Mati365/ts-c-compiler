const BUILTIN_PREFIX = '__builtin_';

type BuiltinPrefixName = typeof BUILTIN_PREFIX;

export type BuiltinFnName<S extends string> = `${BuiltinPrefixName}${S}`;

export const withBuiltinPrefix = <S extends string>(
  name: S,
): BuiltinFnName<S> => `${BUILTIN_PREFIX}${name}`;

export const hasBuiltinPrefix = (name: string) =>
  name.startsWith(BUILTIN_PREFIX);

export const extractBuiltinName = (name: string) =>
  name.substring(BUILTIN_PREFIX.length);
