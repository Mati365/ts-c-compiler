import {ASTCInitDeclarator} from '@compiler/x86-nano-c/frontend/parser/ast';
import {TypeCheckerContext} from '../../TypeCheckerContext';
import {CType} from '../../types/CType';
import {CVariable} from '../../variables/CVariable';

import {extractNamedEntryFromDeclarator} from './extractSpecifierType';

type InitDeclaratorExtractorAttrs = {
  context: TypeCheckerContext,
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
