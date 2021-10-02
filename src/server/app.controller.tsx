import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {Get, Controller, Res, HttpStatus} from '@nestjs/common';
import {Response} from 'express';

import {RootHTML} from '@client/html/RootHTML';
import {ManifestService} from './modules';

@Controller()
export class AppController {
  constructor(
    private manifestService: ManifestService,
  ) {}

  @Get()
  root(@Res() res: Response) {
    const {manifestService} = this;

    res.status(HttpStatus.OK);

    ReactDOMServer
      .renderToNodeStream(
        <RootHTML manifest={manifestService} />,
      )
      .on('end', () => {
        res.end();
      })
      .pipe(res, {end: false});
  }
}
