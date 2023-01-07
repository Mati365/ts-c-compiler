import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCTranslationUnit extends ASTCCompilerNode {
  constructor(loc: NodeLocation, children: ASTCCompilerNode[]) {
    super(ASTCCompilerKind.TranslationUnit, loc, children);
  }
}
