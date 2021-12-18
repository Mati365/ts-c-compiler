import {ASTCStructSpecifier} from '@compiler/x86-nano-c/frontend/parser';
import {CStructType} from '../../types';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';

import {extractTypeFromDeclarationSpecifier} from '../extractors';

/**
 * Enters structure and analyzes its content
 *
 * @export
 * @class CTypeStructVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeStructVisitor extends CTypeTreeVisitor {
  initForRootNode(node: ASTCStructSpecifier): this {
    const displayName = (
      this
        .extractStructTypeFromNode(node)
        .getDisplayName()
    );

    console.info(displayName);
    return this;
  }

  /**
   * Walks over struct tree node and constructs type
   *
   * @param {ASTCStructSpecifier} structSpecifier
   * @return {CStructType}
   * @memberof CTypeStructVisitor
   */
  extractStructTypeFromNode(structSpecifier: ASTCStructSpecifier): CStructType {
    const {context} = this;
    let structType = CStructType.ofBlank(structSpecifier.name.text);

    structSpecifier.list?.children.forEach((declaration) => {
      const type = extractTypeFromDeclarationSpecifier(
        context,
        declaration.specifierList,
      );

      if (!type)
        throw new CTypeCheckError(CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE);

      structType = structType.ofAppendedField(type, 'xD');
    });

    return structType;
  }
}
