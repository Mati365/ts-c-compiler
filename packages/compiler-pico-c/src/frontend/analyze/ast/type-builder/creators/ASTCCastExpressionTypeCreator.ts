import {
  ASTCCompilerKind,
  ASTCCastExpression,
} from '@compiler/pico-c/frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../../errors/CTypeCheckError';

import {
  extractSpecifierType,
  extractNamedEntryFromDeclarator,
} from '../extractor';

export class ASTCCastExpressionTypeCreator extends ASTCTypeCreator<ASTCCastExpression> {
  kind = ASTCCompilerKind.CastExpression;

  override leave(node: ASTCCastExpression): void {
    const { context } = this;
    const { typeName, expression } = node;

    const { type: castedType } = extractNamedEntryFromDeclarator({
      context,
      declarator: typeName.abstractDeclarator,
      canBeAnonymous: true,
      skipFnExpressions: true,
      type: extractSpecifierType({
        context,
        specifier: typeName.specifierList,
      }),
    });

    if (!castedType?.isScalar()) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.CAST_TO_NON_SCALAR_TYPE,
        typeName.loc.start,
        {
          typeName: castedType?.getShortestDisplayName() ?? '<unknown-type>',
        },
      );
    }

    if (!expression.type?.isScalar()) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNABLE_CAST_TO_SCALAR_TYPE,
        typeName.loc.start,
        {
          sourceType:
            expression.type?.getShortestDisplayName() ?? '<unknown-src-type>',
          destinationType:
            castedType?.getShortestDisplayName() ?? '<unknown-dest-type>',
        },
      );
    }

    node.type = castedType;
  }
}
