export interface RecipientGroup {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface RecipientGroupMember {
  userId: string;
  addedBy?: string;
  addedAt?: string;
}
