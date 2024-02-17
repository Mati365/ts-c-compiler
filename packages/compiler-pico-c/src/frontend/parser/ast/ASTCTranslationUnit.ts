import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCTranslationUnit extends ASTCCompilerNode {
  constructor(loc: NodeLocation, children: ASTCCompilerNode[]) {
    super(ASTCCompilerKind.TranslationUnit, loc, children);
  }
}
