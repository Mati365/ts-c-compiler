import express from 'express';
import { resolve } from 'node:path';
import { buffer } from 'node:stream/consumers';

import { getManifestJSON } from './getManifestJSON';

const port = process.env.APP_PORT ?? 4323;
const binary = await buffer(process.stdin);
const app = express();

app.use('/public', express.static(resolve(__dirname, './client/')));
app.get('/', async (_, res) => {
  const manifest = getManifestJSON();

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>VM</title>
      </head>

      <body>
        <div id="root"></div>

        <script>
          window.BINARY_BLOB = ${JSON.stringify(binary.toJSON().data)};
        </script>

        <script src="${manifest['client.js']}"></script>
      </body>
    </html>
  `);
});

app.listen(port, function () {
  console.info(`VM started at http://localhost:${port}! 🚀`);
});
