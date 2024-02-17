import 'source-map-support/register';

import fs from 'node:fs';
import stripAnsi from 'strip-ansi';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { Option, program } from '@commander-js/extra-typings';

import { TableBinaryView, asm } from '@ts-cc/x86-assembler';
import {
  CCompilerArch,
  ccompiler,
  getX86BootsectorPreloaderBinary,
  serializeTypedTreeToString,
  wrapWithX86BootsectorAsm,
} from '@ts-cc/compiler';

import { NodeFsIncludeResolver } from './NodeFsIncludeResolver';
import { tapEither } from '@ts-cc/core';

program
  .argument('<source>', 'Relative or absolute path to source file')
  .option('-b, --binary', 'Emits binary stdout')
  .addOption(
    new Option('-o, --output <string>', 'Relative path to your output binary').conflicts(
      'binary',
    ),
  )
  .addOption(
    new Option('-d, --debug', 'Print AST tree and assembly output').conflicts('binary'),
  )
  .addOption(
    new Option('-ps, --print-assembly', 'Print assembly output').conflicts([
      'binary',
      'debug',
    ]),
  )
  .addOption(
    new Option(
      '-pjs, --print-jump-assembly',
      'Print assembly output with jmps',
    ).conflicts(['binary', 'debug', 'print-jump-assembly']),
  )
  .option(
    '-bs, --bootsector',
    'Generate 512B bootsector output. Remember to have main entrypoint.',
  )
  .action((source, options) => {
    const srcFile = fs.readFileSync(source, {
      encoding: 'utf8',
      flag: 'r',
    });
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
      E.bind('asmRaw', ({ cResult }) => {
        let asmRaw = cResult.codegen.asm;

        if (options.bootsector) {
          asmRaw = wrapWithX86BootsectorAsm(asmRaw);
        }

        return E.of(asmRaw);
      }),
      E.bind('asmResult', ({ asmRaw }) =>
        pipe(
          asmRaw,
          asm({
            preprocessor: true,
            compilerConfig: {
              maxPasses: 7,
              externalLinkerAddrGenerator: () => 0xff_ff,
            },
          }),
        ),
      ),
      tapEither(
        ({ asmResult, asmRaw }) => {
          if (options.printJumpAssembly) {
            console.info(TableBinaryView.serializeToString(asmResult.output));
          }

          if (options.printAssembly) {
            console.info(stripAnsi(asmRaw.trim()));
          }

          let binary = asmResult.output.getBinary();

          if (options.bootsector) {
            binary = getX86BootsectorPreloaderBinary().concat(binary);
          }

          if (options.binary) {
            process.stdout.write(new Uint8Array(binary));
          }

          if (options.output) {
            fs.writeFileSync(options.output, Buffer.from(binary));
          }
        },
        error => {
          console.error(error);
          process.exit(1);
        },
      ),
    );
  })
  .parse();
