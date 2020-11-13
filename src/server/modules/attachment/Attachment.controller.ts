import {
  Body,
  Controller, DefaultValuePipe,
  Delete, Get, Param,
  ParseIntPipe, Post, Query,
  UsePipes, ValidationPipe,
} from '@nestjs/common';

import {UserScope} from '@server/constants/shared';
import {JWTScopes} from '../auth';
import {AttachmentService} from './Attachment.service';
import {FilesForm} from './decorators/FilesForm.decorator';
import {CreateAttachmentDto} from './dto/CreateAttachment.dto';

@Controller('attachments')
export class AttachmentController {
  constructor(
    private attachmentService: AttachmentService,
  ) {}

  /* eslint-disable @typescript-eslint/indent */
  @Get()
  @JWTScopes(UserScope.LIST_ATTACHMENTS)
  async index(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('phrase') phrase: string,
  ) {
    return this.attachmentService.findAll(
      {
        page,
        limit,
        phrase,
      },
    );
  }

  /**
   * Create single attachment
   *
   * @param {CreateAttachmentDto} createCategoryDto
   * @returns
   * @memberof AttachmentController
   */
  @Post()
  @JWTScopes(UserScope.CREATE_ATTACHMENT)
  @FilesForm()
  @UsePipes(new ValidationPipe({transform: true}))
  create(@Body() createAttachmentDto: CreateAttachmentDto) {
    return this.attachmentService.create(createAttachmentDto);
  }
  /* eslint-enable @typescript-eslint/indent */

  /**
   * Removes single attachment by id
   *
   * @param {number} id
   * @returns
   * @memberof AttachmentController
   */
  @Delete('/:id')
  @JWTScopes(UserScope.DELETE_ATTACHMENT)
  async delete(@Param('id') id: number) {
    await this.attachmentService.delete(id);
    return {
      success: true,
    };
  }
}
