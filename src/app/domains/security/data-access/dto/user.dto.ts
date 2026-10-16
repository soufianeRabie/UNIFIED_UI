/** Wire shapes of the security users API. Never imported outside `data-access`. */
export interface UserDto {
  readonly idUser: string;
  readonly username: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly externalId: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface CreateUserRequestDto {
  readonly username: string;
  readonly fullName: string;
  readonly email?: string;
  readonly externalId?: string;
}

export interface UpdateUserRequestDto extends CreateUserRequestDto {
  readonly isActive: boolean;
}
