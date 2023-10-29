import { ASTCInitDeclarator } from 'frontend/parser/ast';
import { CType } from '../../../types/CType';
import { CVariable } from '../../../scope/variables/CVariable';
import { CTypeAnalyzeContext } from '../CTypeAnalyzeContext';

import { extractNamedEntryFromDeclarator } from './extractSpecifierType';
import { extractInitializerTreeForType } from '../../initializer-builder';

type InitDeclaratorExtractorAttrs = {
  context: CTypeAnalyzeContext;
  type: CType;
  initDeclarator: ASTCInitDeclarator;
};

export function extractInitDeclaratorTypeVariables({
  context,
  type,
  initDeclarator: { declarator, initializer },
}: InitDeclaratorExtractorAttrs): CVariable {
  const entry = extractNamedEntryFromDeclarator({
    declarator,
    context,
    type,
  });

  const initializerTree = extractInitializerTreeForType({
    type: entry.type,
    node: initializer,
    context,
  });

  return CVariable.ofInitializedEntry(entry, initializerTree);
}
