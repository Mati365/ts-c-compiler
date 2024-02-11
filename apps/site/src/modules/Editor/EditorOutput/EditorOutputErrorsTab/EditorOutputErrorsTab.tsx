import { List } from 'flowbite-react';
import { BiX } from 'react-icons/bi';

import type { EditorCompileResultError } from '../../EditorStateProvider';

type Props = {
  errors: EditorCompileResultError[];
};

export const EditorOutputErrorsTab = ({ errors }: Props) => {
  const formatError = (error: EditorCompileResultError) => (
    <div className="inline-flex items-center gap-2 align-middle font-bold text-red-500">
      <BiX />
      {error.message}
    </div>
  );

  return (
    <div className="p-4">
      <List ordered>
        {errors.map(error => (
          <List.Item key={JSON.stringify(error)}>{formatError(error)}</List.Item>
        ))}
      </List>
    </div>
  );
};
