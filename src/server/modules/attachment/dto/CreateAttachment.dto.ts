import {IsDefined, IsString, ValidateNested} from 'class-validator';
import {UploadedFileDto} from './UploadedFile.dto';

export class CreateAttachmentDto {
  @IsDefined()
  @IsString()
  name: string;

  @ValidateNested()
  file: UploadedFileDto;

  constructor(partial: Partial<CreateAttachmentDto>) {
    Object.assign(this, partial);
  }
}
