import {ok} from '@compiler/core/monads/Result';
import {createCCompilerGrammar} from './cgrammar';
import {clexer, CLexerConfig} from './clexer';

type CCompilerConfig = {
  lexer?: CLexerConfig,
};

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
    .andThen((tokens) => ok(createCCompilerGrammar().process(tokens)));
}
