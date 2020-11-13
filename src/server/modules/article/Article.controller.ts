import {
  Controller, Post, Body,
  UsePipes, ValidationPipe, Request,
  Delete, Param, Get, UseInterceptors,
  ParseIntPipe, Query, DefaultValuePipe, Patch,
} from '@nestjs/common';

import {ID} from '@server/shared/types';

import {NotFoundInterceptor} from '@server/interceptors/NotFound.interceptor';
import {UserScope} from '@server/constants/shared';
import {ArticleService} from './Article.service';
import {AuthorizedRequest, JWTScopes} from '../auth';

import {
  UpdateArticleDto,
  CreateArticleDto,
} from './dto';

@Controller('articles')
export class ArticleController {
  constructor(
    private articleService: ArticleService,
  ) {}

  /* eslint-disable @typescript-eslint/indent */
  /**
   * Returns all articles
   *
   * @memberof ArticleController
   */
  @Get()
  index(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
    @Query('phrase') phrase: string,
    @Query('categoryId') categoryId: ID,
    @Query('excludeIds') excludeIds: ID[],
  ) {
    return this.articleService.findAll(
      {
        page,
        limit,
        phrase,
        categoryId,
        excludeIds,
      },
    );
  }
  /* eslint-enable @typescript-eslint/indent */

  /**
   * Returns number of articles
   *
   * @returns
   * @memberof ArticleController
   */
  @Get('/count')
  async totalArticles() {
    return {
      count: await this.articleService.count(),
    };
  }

  /**
   * Returns single article
   *
   * @param {number} id
   * @returns
   * @memberof ArticleController
   */
  @Get('/:id')
  @UseInterceptors(new NotFoundInterceptor('No article found for given id!'))
  get(@Param('id') id: number) {
    return this.articleService.find(id);
  }

  /**
   * Removes single article by id
   *
   * @param {number} id
   * @returns
   * @memberof ArticleController
   */
  @Delete('/:id')
  @JWTScopes(UserScope.DELETE_ARTICLE)
  async delete(@Param('id') id: number) {
    await this.articleService.delete(id);
    return {
      success: true,
    };
  }

  /**
   * Creates single article
   *
   * @param {Response} res
   * @param {CreateArticleDto} createArticleDto
   * @memberof ArticleController
   */
  @Post()
  @JWTScopes(UserScope.CREATE_ARTICLE)
  @UsePipes(new ValidationPipe({transform: true, skipMissingProperties: true}))
  create(@Body() createArticleDto: CreateArticleDto, @Request() req: AuthorizedRequest) {
    return this.articleService.create(
      {
        ...createArticleDto,
        userId: req.user.id,
      },
    );
  }

  /**
   * Updates single article
   *
   * @param {UpdateArticleDto} updateArticleDto
   * @memberof ArticleController
   */
  @Patch()
  @JWTScopes(UserScope.CREATE_ARTICLE)
  @UsePipes(new ValidationPipe({transform: true, skipMissingProperties: true}))
  update(@Body() updateArticleDto: UpdateArticleDto, @Request() req: AuthorizedRequest) {
    return this.articleService.update(
      {
        ...updateArticleDto,
        userId: req.user.id,
      },
    );
  }
}
