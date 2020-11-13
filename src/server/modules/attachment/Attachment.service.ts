import {Repository} from 'typeorm';
import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';

import {paginateQueryBuilder, PaginationOptions, PaginationResult} from '../shared/pagination';

import {AttachmentEntity} from './Attachment.entity';
import {CreateAttachmentDto} from './dto/CreateAttachment.dto';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  /**
   * Remove single attachment
   *
   * @param {number} id
   * @memberof AttachmentService
   */
  async delete(id: number) {
    const {attachmentRepository} = this;
    const article = await attachmentRepository.findOne(id);

    if (!article)
      throw new NotFoundException;

    return this.attachmentRepository.remove(article);
  }

  /**
   * Create single attachment
   *
   * @param {CreateAttachmentDto} dto
   * @returns {Promise<AttachmentEntity>}
   * @memberof AttachmentService
   */
  async create(dto: CreateAttachmentDto): Promise<AttachmentEntity> {
    return this.attachmentRepository.save(
      {
        name: dto.name,
        ...dto.file,
      },
    );
  }

  /**
   * Return paginated array of attachments
   *
   * @param {PaginationOptions} options
   * @returns {Promise<PaginationResult<AttachmentEntity>>}
   * @memberof ArticleCategoryService
   */
  findAll(options: PaginationOptions): Promise<PaginationResult<AttachmentEntity>> {
    return paginateQueryBuilder(
      this.attachmentRepository.createQueryBuilder(),
      {
        ...options,
        unsafe: {
          phraseColumn: 'name',
        },
      },
    );
  }
}
