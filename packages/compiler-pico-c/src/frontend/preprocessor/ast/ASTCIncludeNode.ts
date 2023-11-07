import { NodeLocation } from '@ts-c-compiler/grammar';

import { CInterpreterSourcePath } from '../interpreter';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCIncludeNode extends ASTCPreprocessorTreeNode {
  constructor(loc: NodeLocation, readonly path: CInterpreterSourcePath) {
    super(ASTCPreprocessorKind.Include, loc);
  }
}
