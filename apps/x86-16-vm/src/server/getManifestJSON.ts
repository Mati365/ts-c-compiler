import * as path from 'node:path';
import * as fs from 'node:fs';

type FilesManifest = Record<string, string>;

export const getManifestJSON = (): FilesManifest => {
  const json = fs.readFileSync(
    path.resolve(__dirname, 'client/manifest.json'),
    'utf-8',
  );

  return JSON.parse(json);
};
