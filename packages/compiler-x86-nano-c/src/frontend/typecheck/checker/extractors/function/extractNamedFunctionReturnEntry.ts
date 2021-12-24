import {ASTCFunctionDefinition} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CNamedTypedEntry} from '../../../types';
import {TypeCheckerContext} from '../../TypeCheckerContext';

import {extractNamedEntryFromDeclarator} from '../extractNamedEntryFromDeclarator';
import {extractTypeFromDeclarationSpecifier} from '../extractTypeFromDeclarationSpecifier';

type FunctionReturnExtractorAttrs = {
  context: TypeCheckerContext,
  definition: ASTCFunctionDefinition,
};

/**
 * Extract return type from function
 *
 * @export
 * @param {FunctionReturnExtractorAttrs} attrs
 * @returns {CNamedTypedEntry}
 * @return {CNamedTypedEntry}
 */
export function extractNamedFunctionReturnEntry(
  {
    context,
    definition,
  }: FunctionReturnExtractorAttrs,
): CNamedTypedEntry {
  return extractNamedEntryFromDeclarator(
    {
      context,
      declarator: definition.declarator,
      type: extractTypeFromDeclarationSpecifier(
        {
          declaration: definition.specifier,
          context,
        },
      ),
    },
  );
}
