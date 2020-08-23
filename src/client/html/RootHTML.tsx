import React from 'react';

import {RootContainer} from '@client/containers/RootContainer';
import {JSONGlobalVariable} from './parts/JSONGlobalVariable';

type HTMLTemplateProps = {
  manifest: {
    get(key: string): string,
  },
  provideContainerProps?: any
  provideAsGlobals?: object,
};

export const RootHTML = ({manifest, provideAsGlobals, provideContainerProps}: HTMLTemplateProps) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />

      <title>Emulator</title>

      {/* favicons */}
      <link rel='icon' href='/favicon.ico' type='image/x-icon' />
      <link rel='shortcut icon' href='/favicon.ico' type='image/x-icon' />

      {/* css */}
      <link rel='stylesheet' type='text/css' href={manifest.get('client.css')} />

      {/* preload */}
      <link rel='preload' as='script' href={manifest.get('client.js')} />
    </head>

    <body>
      <div id='react-root'>
        <RootContainer {...provideContainerProps} />
      </div>

      <JSONGlobalVariable data={provideAsGlobals} />
      <script src={manifest.get('client.js')} />
    </body>
  </html>
);

RootHTML.displayName = 'RootHTML';
