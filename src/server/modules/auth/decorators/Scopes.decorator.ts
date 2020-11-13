import {SetMetadata} from '@nestjs/common';
import {UserScope} from '@server/constants/shared';

export const Scopes = (...scopes: UserScope[]) => SetMetadata('scopes', scopes);
