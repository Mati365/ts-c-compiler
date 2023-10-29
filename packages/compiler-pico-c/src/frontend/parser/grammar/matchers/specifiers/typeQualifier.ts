import { CCOMPILER_TYPE_QUALIFIERS, CTypeQualifier } from '#constants';

import { CGrammar } from '../shared';

export function matchTypeQualifier({ g }: CGrammar): CTypeQualifier {
  const qualifier = g.identifier(CCOMPILER_TYPE_QUALIFIERS);

  return qualifier.text as CTypeQualifier;
}
