import React from 'react';
import * as R from 'ramda';

type GlobalJSONProviderProps = {
  globalVariableName?: string,
  data: object,
};

const jsonEntrypoint = (varName: string, data: object): string => `window['${varName}'] = ${JSON.stringify(data)};`;

export const JSONGlobalVariable = ({globalVariableName, data}: GlobalJSONProviderProps) => {
  let html = null;

  if (globalVariableName)
    html = jsonEntrypoint(globalVariableName, data);
  else if (data && !R.isEmpty(data)) {
    html = R.reduce(
      (acc: string, [varName, value]: [string, object]) => `${acc}${jsonEntrypoint(varName, value)}`,
      '',
      R.toPairs(data as any),
    );
  }

  return html && (
    <script
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
};
