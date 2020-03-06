import {X86Compiler} from './X86Compiler';
import {ASTTree} from '../ast/ASTParser';
import {SecondPassResult} from './BinaryPassResults';

export type CompilerFinalResult = {
  compiler: X86Compiler,
  output: SecondPassResult,
};

/**
 * Transform array of nodes into binary
 *
 * @export
 * @param {ASTTree} tree
 * @returns {CompilerFinalResult}
 */
export function compile(tree: ASTTree): CompilerFinalResult {
  const compiler = new X86Compiler(tree);

  return {
    compiler,
    output: compiler.compile(),
  };
}
