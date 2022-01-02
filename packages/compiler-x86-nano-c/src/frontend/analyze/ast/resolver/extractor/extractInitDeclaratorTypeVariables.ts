import {ASTCInitDeclarator} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CAnalyzeContext} from '../../../CAnalyzeContext';
import {CType} from '../../../types/CType';
import {CVariable} from '../../../variables/CVariable';

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
    initDeclarator,
  }: InitDeclaratorExtractorAttrs,
): CVariable {
  const entry = extractNamedEntryFromDeclarator(
    {
      declarator: initDeclarator.declarator,
      context,
      type,
    },
  );

  return CVariable.ofInitializedEntry(entry, initDeclarator.initializer);
}
