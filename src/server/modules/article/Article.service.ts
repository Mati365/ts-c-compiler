import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {classToPlain} from 'class-transformer';
import * as R from 'ramda';

import {ID} from '@server/shared/types';

import {TagService} from '../tag/Tag.service';
import {CreateTagDto} from '../tag/dto/CreateTag.dto';

import {ArticleEntity} from './Article.entity';
import {ArticleCategoryEntity} from '../article-category/ArticleCategory.entity';
import {
  paginateQueryBuilder,
  PaginationOptions,
  PaginationResult,
} from '../shared/pagination';

import {
  UpdateArticleDto,
  CreateArticleDto,
} from './dto';

type ArticlesPaginationOptions = PaginationOptions & {
  categoryId?: ID,
};

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private articleRepository: Repository<ArticleEntity>,
    private tagService: TagService,
  ) {}

  /**
   * @see
   *  Creates tags!
   *
   * @param {CreateArticleDto} dto
   * @returns
   * @memberof ArticleService
   */
  async createArticleFromDTO(dto: CreateArticleDto) {
    return new ArticleEntity(
      {
        title: dto.title,
        content: dto.content,
        userId: dto.userId,
        coverAttachmentId: dto.coverAttachmentId,
        visible: dto.visible,
        lead: dto.lead,
        category: dto.categoryId && (new ArticleCategoryEntity(
          {
            id: dto.categoryId,
          },
        )),
        tags: await this.tagService.createListIfNotExist(
          (dto.tags || []).map((tag) => new CreateTagDto(
            {
              name: tag,
            },
          )),
        ),
      },
    );
  }

  /**
   * Remove single article
   *
   * @param {number} id
   * @memberof ArticleService
   */
  async delete(id: number) {
    const {articleRepository} = this;
    const article = await articleRepository.findOne(id);

    if (!article)
      throw new NotFoundException;

    return this.articleRepository.remove(article);
  }

  /**
   * Create single article
   *
   * @param {CreateArticleDto} dto
   * @returns {Promise<ArticleEntity>}
   * @memberof ArticleService
   */
  async create(dto: CreateArticleDto): Promise<ArticleEntity> {
    return this.articleRepository.save(
      await this.createArticleFromDTO(dto),
    );
  }

  /**
   * Updates single category
   *
   * @param {UpdateArticleCategoryDto} dto
   * @returns {Promise<ArticleCategoryEntity>}
   * @memberof ArticleCategoryService
   */
  async update(fields: UpdateArticleDto): Promise<ArticleEntity> {
    const article = await this.find(fields.id);
    if (!article)
      throw new NotFoundException;

    const newArticle = await this.createArticleFromDTO(
      {
        ...classToPlain(article),
        ...fields,
      },
    );

    newArticle.id = fields.id;
    return this.articleRepository.save(newArticle);
  }

  /**
   * Finds single article by id
   *
   * @param {number} id
   * @returns {Promise<ArticleEntity>}
   * @memberof ArticleService
   */
  find(id: number): Promise<ArticleEntity> {
    return this.articleRepository.findOne(
      id,
      {
        relations: ['tags', 'user', 'category', 'cover'],
      },
    );
  }

  /**
   * Finds single article by its name
   *
   * @param {string} title
   * @returns {Promise<ArticleEntity>}
   * @memberof ArticleService
   */
  findByTitle(title: string): Promise<ArticleEntity> {
    if (R.isNil(title))
      return null;

    return this.articleRepository.findOne(
      {
        relations: ['tags', 'user', 'category', 'cover'],
        where: {
          title,
        },
      },
    );
  }

  /**
   * Return paginated array of articles
   *
   * @param {ArticlesPaginationOptions} options
   * @returns {Promise<PaginationResult<ArticleEntity>>}
   * @memberof ArticleService
   */
  findAll(options: ArticlesPaginationOptions): Promise<PaginationResult<ArticleEntity>> {
    let query = this
      .articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.user', 'user')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.cover', 'cover')
      .select([
        'article.createdAt',
        'article.updatedAt',
        'article.id',
        'article.title',
        'article.visible',
        'user.id',
        'user.name',
        'category.id',
        'category.name',
        'cover.id',
        'cover.file',
      ]);

    if (!R.isNil(options.categoryId))
      query = query.where('category.id = :id', {id: options.categoryId});

    return paginateQueryBuilder(
      query,
      {
        ...options,
        unsafe: {
          phraseColumn: 'title',
          order: {
            'article.id': 'DESC',
          },
        },
      },
    );
  }

  /**
   * Returns count of all articles
   *
   * @returns
   * @memberof ArticleService
   */
  count() {
    return this.articleRepository.count();
  }
}
