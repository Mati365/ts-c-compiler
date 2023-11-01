import fs from 'node:fs';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { program } from '@commander-js/extra-typings';

import { TableBinaryView, asm } from '@ts-c-compiler/x86-assembler';
import {
  ccompiler,
  serializeTypedTreeToString,
  wrapWithX86BootsectorAsm,
} from '@ts-c-compiler/compiler';

program
  .argument('<source>', 'Relative or absolute path to source file')
  .option('-o, --output <string>', 'Relative path to your output binary')
  .option('-ps, --print-assembly', 'Print assembly output')
  .option('-d, --debug', 'Print AST tree and assembly output')
  .option(
    '-b, --bootsector',
    'Generate 512B bootsector output. Remember to have main entrypoint.',
  )
  .action((source, options) => {
    const srcFile = fs.readFileSync(source, { encoding: 'utf8', flag: 'r' });

    pipe(
      srcFile,
      ccompiler(),
      E.match(
        (error: any) => {
          if (options.debug && error?.[0]?.tree) {
            console.info(serializeTypedTreeToString(error[0].tree));
          }

          console.error(error);
          process.exit(1);
        },
        result => {
          if (options.debug) {
            result.dump();
          }

          let asmRaw = result.codegen.asm;

          if (options.bootsector) {
            asmRaw = wrapWithX86BootsectorAsm(asmRaw);
          }

          const asmResult = asm({
            preprocessor: true,
          })(asmRaw);

          if (options.printAssembly) {
            console.info(TableBinaryView.serializeToString(asmResult));
          }

          if (options.output && E.isRight(asmResult)) {
            fs.writeFileSync(
              options.output,
              Buffer.from(asmResult.right.output.getBinary()),
            );
          }
        },
      ),
    );
  })
  .parse();
