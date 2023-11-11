import 'source-map-support/register';

import fs from 'node:fs';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { Option, program } from '@commander-js/extra-typings';

import { TableBinaryView, asm } from '@ts-c-compiler/x86-assembler';
import {
  CCompilerArch,
  ccompiler,
  serializeTypedTreeToString,
  wrapWithX86BootsectorAsm,
} from '@ts-c-compiler/compiler';

import { NodeFsIncludeResolver } from './NodeFsIncludeResolver';
import { tapEither } from '@ts-c-compiler/core';

program
  .argument('<source>', 'Relative or absolute path to source file')
  .option('-b, --binary', 'Emits binary stdout')
  .addOption(
    new Option(
      '-o, --output <string>',
      'Relative path to your output binary',
    ).conflicts('binary'),
  )
  .addOption(
    new Option('-d, --debug', 'Print AST tree and assembly output').conflicts(
      'binary',
    ),
  )
  .addOption(
    new Option('-ps, --print-assembly', 'Print assembly output').conflicts([
      'binary',
      'debug',
    ]),
  )
  .option(
    '-b, --bootsector',
    'Generate 512B bootsector output. Remember to have main entrypoint.',
  )
  .action((source, options) => {
    const srcFile = fs.readFileSync(source, { encoding: 'utf8', flag: 'r' });
    const cCompile = pipe(
      srcFile,
      ccompiler({
        arch: CCompilerArch.X86_16,
        optimization: {
          enabled: true,
        },
        preprocessor: {
          currentFilePath: source,
          fsIncludeResolver: new NodeFsIncludeResolver(),
        },
      }),
      tapEither(
        result => {
          if (options.debug) {
            result.dump();
          }
        },
        (error: any) => {
          if (options.debug && error?.[0]?.tree) {
            console.info(serializeTypedTreeToString(error[0].tree));
          }

          console.error(error);
        },
      ),
    );

    pipe(
      E.Do,
      E.bind('cResult', () => cCompile),
      E.bind('asmResult', ({ cResult }) => {
        let asmRaw = cResult.codegen.asm;

        if (options.bootsector) {
          asmRaw = wrapWithX86BootsectorAsm(asmRaw);
        }

        return pipe(
          asmRaw,
          asm({
            preprocessor: true,
          }),
        );
      }),
      tapEither(
        ({ asmResult }) => {
          if (options.printAssembly) {
            console.info(TableBinaryView.serializeToString(E.right(asmResult)));
          }

          if (options.binary) {
            process.stdout.write(new Uint8Array(asmResult.output.getBinary()));
          }

          if (options.output) {
            fs.writeFileSync(
              options.output,
              Buffer.from(asmResult.output.getBinary()),
            );
          }
        },
        () => {
          process.exit(1);
        },
      ),
    );
  })
  .parse();
