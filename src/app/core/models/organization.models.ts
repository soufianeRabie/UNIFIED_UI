export enum BranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED'
}

export interface BranchResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  status: BranchStatus;
  latitude: number;
  longitude: number;
  openingHours: string;
  vehicleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  phone: string;
  email: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  status?: BranchStatus;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
}

export interface TransferVehicleRequest {
  targetBranchId: string;
  notes?: string;
}
