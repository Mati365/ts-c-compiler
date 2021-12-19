import {
  ASTCCompilerKind,
  ASTCDeclarator,
  ASTCDirectDeclarator,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {CTypeTreeVisitor} from '../visitors/CTypeTreeVisitor';
import {
  CType,
  CNamedTypedEntry,
  CPointerType,
  CArrayType,
} from '../../types';

/**
 * Walks over declarator related types and treis to construct type
 *
 * @todo
 *  - Add constant evaluation of array size expression!
 *
 * @export
 * @class TreeTypeBuilderVisitor
 * @extends {CTypeTreeVisitor}
 */
export class TreeTypeBuilderVisitor extends CTypeTreeVisitor {
  private name: string = null;

  constructor(
    private type: CType,
  ) {
    super(
      {
        [ASTCCompilerKind.Declarator]: {
          enter(node: ASTCDeclarator) {
            if (node.isPointer())
              this.type = CPointerType.ofType(this.arch, this.type);
          },
        },

        [ASTCCompilerKind.DirectDeclarator]: {
          enter(node: ASTCDirectDeclarator) {
            if (node.isIdentifier())
              this.name = node.identifier.text;
            else if (node.isArrayExpression()) {
              this.type = new CArrayType(
                {
                  baseType: this.type,
                  size: 4,
                },
              );
            }
          },
        },
      },
    );
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
