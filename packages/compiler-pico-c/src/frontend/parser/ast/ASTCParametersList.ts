import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCParameterDeclaration } from './ASTCParameterDeclaration';

export class ASTCParametersList extends ASTCCompilerNode<ASTCParameterDeclaration> {
  constructor(loc: NodeLocation, items: ASTCParameterDeclaration[]) {
    super(ASTCCompilerKind.ParametersList, loc, items);
  }
}
