import {
  ASTCCompilerKind,
  ASTCStructSpecifier,
  ASTCStructDeclaration,
  ASTCSpecifiersQualifiersList,
} from '@compiler/x86-nano-c/frontend/parser';

import {CStructType} from '../../types';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';

class CStructDeclarationListVisitor extends CTypeTreeVisitor<CTypeStructVisitor> {
  protected entry = CStructType.ofBlank();

  constructor() {
    super(
      {
        [ASTCCompilerKind.ParameterDeclarationSpecifier]: {
          enter: (node: ASTCSpecifiersQualifiersList) => {
            console.info(node);
          },
        },
      },
    );

    console.info('entry');
  }
}

/**
 * Enters structure and analyzes its content
 *
 * @export
 * @class CTypeStructVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeStructVisitor extends CTypeTreeVisitor {
  protected structureType = CStructType.ofBlank();

  constructor() {
    super();
    this
      .setVisitorsMap(CTypeStructVisitor.nestedVisitors)
      .setContext(this);
  }

  mapStruct(fn: (struct: CStructType) => CStructType): this {
    this.structureType = fn(this.structureType);
    return this;
  }

  static readonly nestedVisitors = {
    [ASTCCompilerKind.StructSpecifier]: {
      enter(this: CTypeStructVisitor, {name}: ASTCStructSpecifier) {
        this.mapStruct((struct) => struct.ofName(name.text));
      },

      leave(this: CTypeStructVisitor) {
        console.info(this.structureType.toString());
      },
    },

    [ASTCCompilerKind.StructDeclaration]: {
      enter(this: CTypeStructVisitor, node: ASTCStructDeclaration) {
        (
          this
            .intantizeWithContext(CStructDeclarationListVisitor)
            .visit(node)
        );

        return false;
      },
    },
  };
}
