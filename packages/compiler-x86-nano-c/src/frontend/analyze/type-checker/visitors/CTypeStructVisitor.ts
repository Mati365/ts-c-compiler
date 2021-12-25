import {ASTCStructSpecifier} from '@compiler/x86-nano-c/frontend/parser';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CStructType} from '../types';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';

import {
  extractNamedEntryFromDeclarator,
  extractTypeFromDeclarationSpecifier,
} from '../extractors';

/**
 * Enters structure and analyzes its content
 *
 * @todo
 *  - Add bitmask support (structField: bitmask;) after constant evaluation
 *
 * @export
 * @class CTypeStructVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeStructVisitor extends CTypeTreeVisitor {
  initForRootNode(node: ASTCStructSpecifier): this {
    const struct = this.extractStructTypeFromNode(node);
    if (struct)
      this.scope.defineType(struct.name, struct);

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
    const {context, arch} = this;
    let structType = CStructType.ofBlank(arch, structSpecifier.name.text);

    // handle const int x, y;
    structSpecifier.list?.children.forEach((declaration) => {
      const type = extractTypeFromDeclarationSpecifier(
        {
          specifier: declaration.specifierList,
          context,
        },
      );

      if (!type)
        throw new CTypeCheckError(CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE);

      // define x, y as separate fields and calculate offsets
      declaration.declaratorList.children.forEach((structDeclarator) => {
        const entry = extractNamedEntryFromDeclarator(
          {
            declarator: structDeclarator.declarator,
            context,
            type,
          },
        );

        structType = (
          structType
            .ofAppendedField(entry)
            .unwrapOrThrow()
        );
      });
    });

    return structType;
  }
}
