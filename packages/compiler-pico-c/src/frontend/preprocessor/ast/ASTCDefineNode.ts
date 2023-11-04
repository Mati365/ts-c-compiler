import { NodeLocation } from '@ts-c-compiler/grammar';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorNode,
} from './ASTCPreprocessorNode';

export class ASTCDefineNode extends ASTCPreprocessorNode {
  constructor(loc: NodeLocation, readonly expression: string) {
    super(ASTCPreprocessorKind.Define, loc);
  }
}
