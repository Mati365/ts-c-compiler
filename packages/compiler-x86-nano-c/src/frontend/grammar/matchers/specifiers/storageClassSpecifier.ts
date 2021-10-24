import {
  CCOMPILER_STORAGE_CLASS_SPECIFIERS,
  CStorageClassSpecifier,
} from '@compiler/x86-nano-c/constants';

import {CGrammar} from '../shared';

export function matchStorageClassSpecifier({g}: CGrammar): CStorageClassSpecifier {
  const specifier = g.identifier(
    CCOMPILER_STORAGE_CLASS_SPECIFIERS as CStorageClassSpecifier[],
  );

  return specifier.text as CStorageClassSpecifier;
}
