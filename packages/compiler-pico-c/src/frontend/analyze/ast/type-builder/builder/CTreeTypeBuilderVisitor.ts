import * as R from 'ramda';

import {
  ASTCCompilerKind,
  ASTCDeclarator,
  ASTCDirectDeclarator,
} from '@compiler/pico-c/frontend/parser/ast';

import {evalConstantExpression} from '../../expression-analyze';

import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {CInnerTypeTreeVisitor} from '../../CInnerTypeTreeVisitor';
import {CNamedTypedEntry} from '../../../scope/variables/CNamedTypedEntry';
import {
  isArrayLikeType,
  CType,
  CPointerType,
  CArrayType,
} from '../../../types';

/**
 * Walks over declarator related types and treis to construct type
 *
 * @export
 * @class CTreeTypeBuilderVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CTreeTypeBuilderVisitor extends CInnerTypeTreeVisitor {
  private name: string = null;

  constructor(private type: CType) {
    super(
      {
        [ASTCCompilerKind.Declarator]: {
          enter: (node: ASTCDeclarator) => {
            this.extractDeclaratorPointers(node);
            this.visit(node.directDeclarator);
            return false;
          },
        },

        [ASTCCompilerKind.DirectDeclarator]: {
          enter: (node: ASTCDirectDeclarator) => this.extractDirectDeclarator(node),
        },

        [ASTCCompilerKind.DirectDeclaratorFnExpression]: {
          enter() {
            return false;
          },
        },
      },
    );
  }

  /**
   * Enters Declarator node
   *
   * @private
   * @param {ASTCDeclarator} node
   * @memberof CTreeTypeBuilderVisitor
   */
  private extractDeclaratorPointers(node: ASTCDeclarator) {
    let pointerNode = node.pointer;
    while (pointerNode) {
      this.type = CPointerType.ofType(
        this.arch,
        this.type,
        CType
          .qualifiersToBitset(pointerNode.typeQualifierList?.items)
          .unwrapOrThrow(),
      );

      pointerNode = pointerNode.pointer;
    }
  }

  /**
   * Enters DirectDeclarator node
   *
   * @private
   * @param {ASTCDirectDeclarator} node
   * @memberof CTreeTypeBuilderVisitor
   */
  private extractDirectDeclarator(node: ASTCDirectDeclarator) {
    if (node.isIdentifier())
      this.name = this.name || node.identifier.text;
    else if (node.isArrayExpression()) {
      const {type: baseType} = this;
      const {assignmentExpression} = node.arrayExpression;

      const size = assignmentExpression && +evalConstantExpression(
        {
          context: this.context,
          expression: <any> assignmentExpression,
        },
      ).unwrapOrThrow();

      if (!R.isNil(size) && size <= 0)
        throw new CTypeCheckError(CTypeCheckErrorCode.INVALID_ARRAY_SIZE);

      if (isArrayLikeType(baseType)) {
        if (R.isNil(baseType.size) && R.isNil(size)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INCOMPLETE_ARRAY_SIZE,
            null,
            {
              typeName: baseType.getDisplayName(),
            },
          );
        }

        this.type = baseType.ofPrependedDimension(size);
      } else {
        this.type = new CArrayType(
          {
            baseType,
            size,
          },
        );
      }
    }
  }


  getBuiltEntry() {
    const {type, name} = this;

    return new CNamedTypedEntry(
      {
        type,
        name,
      },
    );
  }
}
