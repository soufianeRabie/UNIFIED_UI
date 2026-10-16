import type { PagedResultDto } from '../../../../core/query';
import type { User, UserDraft, UserId, UserPage } from '../../domain/user';
import type { CreateUserRequestDto, UpdateUserRequestDto, UserDto } from '../dto/user.dto';

export function toUser(dto: UserDto): User {
  return {
    id: dto.idUser as UserId,
    username: dto.username,
    fullName: dto.fullName,
    email: dto.email,
    externalId: dto.externalId,
    isActive: dto.isActive,
    createdAt: new Date(dto.createdAt),
  };
}

export function toUserPage(dto: PagedResultDto<UserDto>): UserPage {
  return { items: dto.data.map(toUser), total: dto.totalRecords };
}

export function toCreateRequest(draft: UserDraft): CreateUserRequestDto {
  return {
    username: draft.username,
    fullName: draft.fullName,
    ...(draft.email ? { email: draft.email } : {}),
    ...(draft.externalId ? { externalId: draft.externalId } : {}),
  };
}

export function toUpdateRequest(draft: UserDraft): UpdateUserRequestDto {
  return { ...toCreateRequest(draft), isActive: draft.isActive };
}
