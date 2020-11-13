import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {
  PaginationOptions,
  PaginationResult,
  paginateQueryBuilder,
} from '../shared/pagination';

import {ArticleCategoryEntity} from './ArticleCategory.entity';
import {
  UpdateArticleCategoryDto,
  CreateArticleCategoryDto,
} from './dto';

@Injectable()
export class ArticleCategoryService {
  constructor(
    @InjectRepository(ArticleCategoryEntity)
    private categoryRespository: Repository<ArticleCategoryEntity>,
  ) {}

  /**
   * Finds single category by id
   *
   * @param {number} id
   * @returns {Promise<ArticleCategoryEntity>}
   * @memberof ArticleCategoryService
   */
  find(id: number): Promise<ArticleCategoryEntity> {
    return this.categoryRespository.findOne(id);
  }

  /**
   * Return paginated array of categories
   *
   * @param {PaginationOptions} options
   * @returns {Promise<PaginationResult<ArticleCategoryEntity>>}
   * @memberof ArticleCategoryService
   */
  findAll(options: PaginationOptions): Promise<PaginationResult<ArticleCategoryEntity>> {
    return paginateQueryBuilder(
      this.categoryRespository.createQueryBuilder(),
      {
        ...options,
        unsafe: {
          phraseColumn: 'name',
        },
      },
    );
  }

  /**
   * Creates single category
   *
   * @param {CreateArticleCategoryDto} dto
   * @returns {Promise<ArticleCategoryEntity>}
   * @memberof ArticleCategoryService
   */
  create(dto: CreateArticleCategoryDto): Promise<ArticleCategoryEntity> {
    return this.categoryRespository.save(
      new ArticleCategoryEntity(dto),
    );
  }

  /**
   * Updates single category
   *
   * @param {UpdateArticleCategoryDto} dto
   * @returns {Promise<ArticleCategoryEntity>}
   * @memberof ArticleCategoryService
   */
  async update(fields: UpdateArticleCategoryDto): Promise<ArticleCategoryEntity> {
    return this.categoryRespository.save(
      new ArticleCategoryEntity(fields),
    );
  }

  /**
   * Remove single category
   *
   * @param {number} id
   * @memberof ArticleCategoryService
   */
  async delete(id: number) {
    const {categoryRespository} = this;
    const article = await categoryRespository.findOne(id);

    if (!article)
      throw new NotFoundException;

    return this.categoryRespository.remove(article);
  }

  /**
   * Returns count of all categories
   *
   * @returns
   * @memberof ArticleCategoryService
   */
  count() {
    return this.categoryRespository.count();
  }
}
