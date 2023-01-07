import { dumpAttributesToString } from '@compiler/core/utils';
import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDeclarationSpecifier } from './ASTCDeclarationSpecifier';
import { ASTCDeclarator } from './ASTCDeclarator';
import { ASTCAbstractDeclarator } from './ASTCAbstractDeclarator';

@walkOverFields({
  fields: ['specifier', 'declarator', 'abstractDeclarator'],
})
export class ASTCParameterDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly specifier: ASTCDeclarationSpecifier,
    readonly declarator?: ASTCDeclarator,
    readonly abstractDeclarator?: ASTCAbstractDeclarator,
    readonly vaList?: boolean,
  ) {
    super(ASTCCompilerKind.ParameterDeclaration, loc);
  }

  toString() {
    const { kind, vaList } = this;

    return dumpAttributesToString(kind, {
      vaList,
    });
  }
}
