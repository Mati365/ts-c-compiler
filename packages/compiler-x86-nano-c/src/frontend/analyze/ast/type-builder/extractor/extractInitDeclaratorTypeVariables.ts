import {ASTCInitDeclarator} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CAnalyzeContext} from '../../../CAnalyzeContext';
import {CType} from '../../../types/CType';
import {CVariable} from '../../../scope/variables/CVariable';

import {extractNamedEntryFromDeclarator} from './extractSpecifierType';

type InitDeclaratorExtractorAttrs = {
  context: CAnalyzeContext,
  type: CType,
  initDeclarator: ASTCInitDeclarator,
};

export function extractInitDeclaratorTypeVariables(
  {
    context,
    type,
    initDeclarator: {
      declarator,
      initializer,
    },
  }: InitDeclaratorExtractorAttrs,
): CVariable {
  const entry = extractNamedEntryFromDeclarator(
    {
      declarator,
      context,
      type,
    },
  );

  return CVariable.ofInitializedEntry(entry, initializer);
}
