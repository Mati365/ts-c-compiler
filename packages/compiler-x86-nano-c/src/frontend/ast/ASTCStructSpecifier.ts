import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCInitDeclarator} from './ASTCInitDeclarator';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'items',
    ],
  },
)
export class ASTCStructSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCInitDeclarator[],
    public readonly name?: Token<string>,
    kind: ASTCCompilerKind = ASTCCompilerKind.StructSpecifier,
  ) {
    super(kind, loc);
  }

  toString() {
    const {kind, name} = this;

    return ASTCCompilerNode.dumpAttributesToString(
      kind,
      {
        name: name?.text,
      },
    );
  }
}
