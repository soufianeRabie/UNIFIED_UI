/** Branded so a role id or a plain string cannot be passed where a user id is expected. */
export type UserId = string & { readonly __brand: 'UserId' };

/** A security user as the UI understands it (not the API field names). */
export interface User {
  readonly id: UserId;
  readonly username: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly externalId: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

/** What the create/edit form produces. Optional text is an empty string, never `null`, while editing. */
export interface UserDraft {
  readonly username: string;
  readonly fullName: string;
  readonly email: string;
  readonly externalId: string;
  readonly isActive: boolean;
}

/** One page of users and how many exist in all. */
export interface UserPage {
  readonly items: readonly User[];
  readonly total: number;
}
