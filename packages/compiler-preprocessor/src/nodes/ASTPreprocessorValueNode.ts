import {Token} from '@compiler/lexer/tokens';
import {ValueNode} from '@compiler/grammar/tree/TreeNode';
import {
  InterpreterResult,
  PreprocessorInterpreter,
  PreprocessorInterpretable,
} from '../interpreter/PreprocessorInterpreter';

import {ASTPreprocessorKind} from '../constants';

export class ASTPreprocessorValueNode<T extends Token = any>
  extends ValueNode<T, ASTPreprocessorKind>
  implements PreprocessorInterpretable {
  toEmitterLine(): string {
    return '';
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
/* eslint-enable @typescript-eslint/no-unused-vars */
}
