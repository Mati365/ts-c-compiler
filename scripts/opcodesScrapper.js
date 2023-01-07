/**
 * Parses content from {@link http://www.mathemainzel.info/files/x86asmref.html}
 * Warn! That page contains errors, do not copy paste directly!
 *
 * @see
 *  Some opcodes such as DEC are broken!
 */
(() => {
  const opcodesTables = document.querySelectorAll(
    'table[border="1"]:not([cellspacing])',
  );
  const mappedInstructions = [...opcodesTables].map(table => {
    const rows = table.querySelectorAll('tr:not(:first-child)');

    return [...rows].map(row =>
      [...row.querySelectorAll('tt')].map(col =>
        col.innerHTML.split('&nbsp;').filter(str => str.length),
      ),
    );
  });

  const replaceMismatchParams = str =>
    str
      .replace('short sl', 'sl')
      .replace('dword ptr', 'ifptr')
      .replace('far ptr fp', 'fptr');

  const pickBinaryOpcode = ([, [binStr]]) => {
    const bin = binStr.split(' ');
    let binary = bin[0];
    if (binary === '0F') {
      [, binary] = bin;
    }

    return Number.parseInt(binary, 16);
  };

  const groupedInstructions = mappedInstructions.reduce((acc, list) => {
    list
      .sort((a, b) => pickBinaryOpcode(a) - pickBinaryOpcode(b))
      .forEach(([[mnemonic, ...params], [binary]]) => {
        let minTarget = '';
        params = params
          .filter(param => {
            if (param[0] !== '[') {
              return true;
            }

            minTarget = param.substr(1, param.length - 2);
            return false;
          })
          .join(' ')
          .replace(',', ' ')
          .toLowerCase();

        acc[mnemonic] = acc[mnemonic] ?? [];
        acc[mnemonic].push([replaceMismatchParams(params), binary, minTarget]);
      });

    return acc;
  }, {});

  for (const [key, value] of Object.entries(groupedInstructions)) {
    let newValue = value;

    if (newValue.length === 1) {
      [newValue] = value;
    }

    delete groupedInstructions[key];
    groupedInstructions[key.toLowerCase()] = newValue;
  }

  //fix some bugs in table
  groupedInstructions.int.shift();
  groupedInstructions.int3 = [['', 'CC', '']];
  groupedInstructions.mov = groupedInstructions.mov.map(
    ([args, binary, ...params]) => {
      if (binary[0] === 'A') {
        return [
          args.replace('rmb', 'moffs').replace('rmw', 'moffs'),
          binary,
          ...params,
        ];
      }

      return [args, binary, ...params];
    },
  );

  const prettyPrintArray = json => {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }

    const output = JSON.stringify(
      json,
      (k, v) => {
        if (v instanceof Array) {
          return JSON.stringify(v);
        }

        return v;
      },
      2,
    )
      .replace(/"\[/g, '[')
      .replace(/\]"/g, ']')
      .replace(/\\"/g, '"');

    return output;
  };

  return prettyPrintArray(groupedInstructions);
})();
