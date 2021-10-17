import {ok} from '@compiler/core/monads/Result';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {createCCompilerGrammar} from './grammar/cgrammar';
import {clexer, CLexerConfig} from './lexer/clexer';
import {safeSAACodegen} from './ssa/codegen';

type CCompilerConfig = {
  lexer?: CLexerConfig,
};

/**
 * Output of compilation
 *
 * @export
 * @class CCompilerResult
 */
export class CCompilerResult {
  constructor(
    public readonly code: string,
    public readonly ast: TreeNode,
  ) {}

  dump() {
    const {ast, code} = this;
    const lines = [
      'Source:',
      code,
      'Syntax tree:\n',
      TreePrintVisitor.valueOf(ast),
    ];

    console.info(lines.join('\n'));
  }
}

/**
 * Main compiler entry, compiles code to binary
 *
 * @see
 *  Flow:
 *  Lexer -> ASTGenerator -> ASTIRCompiler -> X86CodeGen
 *
 * @export
 * @param {CCompilerConfig} ccompilerConfig
 * @param {string} code
 * @returns
 */
export function ccompiler(ccompilerConfig: CCompilerConfig, code: string) {
  ccompilerConfig = ccompilerConfig || {};

  return clexer(ccompilerConfig.lexer, code)
    .andThen((tokens) => ok(createCCompilerGrammar().process(tokens)))
    .andThen((ast) => safeSAACodegen(ast))
    .andThen((result) => ok(new CCompilerResult(code, result.tree)));
}
