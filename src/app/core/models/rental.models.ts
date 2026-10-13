import { BranchResponse } from './organization.models';
import { VehicleResponse } from './fleet.models';

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  address: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  address?: string;
}

/** PUT /api/v1/customers/{id} */
export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  address?: string;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ReservationResponse {
  id: string;
  vehicle: VehicleResponse;
  customer: CustomerResponse;
  pickupBranch: BranchResponse;
  returnBranch: BranchResponse;
  startDate: string;
  endDate: string;
  durationDays: number;
  isOneWay: boolean;
  totalPrice: number;
  deposit: number;
  status: ReservationStatus;
  notes: string;
  confirmedAt: string;
  completedAt: string;
  cancelledAt: string;
  createdAt: string;
}

export interface CreateReservationRequest {
  vehicleId: string;
  customerId: string;
  pickupBranchId: string;
  returnBranchId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface AvailabilityCheckResponse {
  vehicleId: string;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
  estimatedPrice: number;
  message: string;
}

export interface OccupiedDateRangeResponse {
  startDate: string;
  endDate: string;
}
