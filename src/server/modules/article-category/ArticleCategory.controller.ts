import {
  Body,
  Controller, DefaultValuePipe,
  Delete, Get, Param, ParseIntPipe, Patch,
  Post, Query, UseInterceptors, UsePipes, ValidationPipe,
} from '@nestjs/common';

import {NotFoundInterceptor} from '@server/interceptors';
import {UserScope} from '@server/constants/shared';
import {JWTScopes} from '../auth';
import {ArticleCategoryService} from './ArticleCategory.service';
import {
  UpdateArticleCategoryDto,
  CreateArticleCategoryDto,
} from './dto';

@Controller('articles/categories')
export class ArticleCategoryController {
  constructor(
    private articleCategoryService: ArticleCategoryService,
  ) {}

  /* eslint-disable @typescript-eslint/indent */
  /**
   * Returns all categories
   *
   * @memberof ArticleCategoryController
   */
  @Get()
  index(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('phrase') phrase: string,
  ) {
    return this.articleCategoryService.findAll(
      {
        page,
        limit,
        phrase,
      },
    );
  }
  /* eslint-enable @typescript-eslint/indent */

  /**
   * Returns number of categories
   *
   * @returns
   * @memberof ArticleCategoryController
   */
  @Get('/count')
  async totalCategories() {
    return {
      count: await this.articleCategoryService.count(),
    };
  }

  /**
   * Returns single category
   *
   * @param {number} id
   * @returns
   * @memberof ArticleCategoryController
   */
  @Get('/:id')
  @UseInterceptors(new NotFoundInterceptor('No category found for given id!'))
  get(@Param('id') id: number) {
    return this.articleCategoryService.find(id);
  }

  /**
   * Removes single category by id
   *
   * @param {number} id
   * @returns
   * @memberof ArticleController
   */
  @Delete('/:id')
  @JWTScopes(UserScope.DELETE_ARTICLE_CATEGORY)
  async delete(@Param('id') id: number) {
    await this.articleCategoryService.delete(id);
    return {
      success: true,
    };
  }

  /**
   * Creates single category
   *
   * @param {Response} res
   * @param {CreateArticleCategoryDto} createCategoryDto
   * @memberof ArticleController
   */
  @Post()
  @JWTScopes(UserScope.CREATE_ARTICLE_CATEGORY)
  @UsePipes(new ValidationPipe({transform: true}))
  create(@Body() createCategoryDto: CreateArticleCategoryDto) {
    return this.articleCategoryService.create(createCategoryDto);
  }

  /**
   * Updates single category
   *
   * @param {UpdateArticleCategoryDto} updateCategoryDto
   * @memberof ArticleCategoryController
   */
  @Patch()
  @JWTScopes(UserScope.CREATE_ARTICLE_CATEGORY)
  @UsePipes(new ValidationPipe({transform: true}))
  update(@Body() updateCategoryDto: UpdateArticleCategoryDto) {
    return this.articleCategoryService.update(updateCategoryDto);
  }
}
