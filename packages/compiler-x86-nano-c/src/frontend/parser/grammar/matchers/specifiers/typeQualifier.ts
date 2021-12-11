import {
  CCOMPILER_TYPE_QUALIFIERS,
  CTypeQualifier,
} from '@compiler/x86-nano-c/constants';

import {CGrammar} from '../shared';

export function matchTypeQualifier({g}: CGrammar): CTypeQualifier {
  const specifier = g.identifier(CCOMPILER_TYPE_QUALIFIERS);

  return specifier.text as CTypeQualifier;
}
