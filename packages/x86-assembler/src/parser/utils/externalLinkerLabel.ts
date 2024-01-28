const EXTERNAL_LINKER_SYMBOL_SUFFIX = '@plt';

export const markLabelAsLinkerExternalSymbol = (label: string) =>
  `${label}${EXTERNAL_LINKER_SYMBOL_SUFFIX}`;

export const isExternalLinkerSymbol = (label: string) =>
  label.endsWith(EXTERNAL_LINKER_SYMBOL_SUFFIX);
