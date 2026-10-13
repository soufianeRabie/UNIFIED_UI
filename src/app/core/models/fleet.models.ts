export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  PLUGIN_HYBRID = 'PLUGIN_HYBRID'
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  SEMI_AUTOMATIC = 'SEMI_AUTOMATIC'
}

export interface VehicleCategoryResponse {
  id: string;
  name: string;
  description: string;
  basePricePerDay: number;
}

export interface CreateVehicleCategoryRequest {
  name: string;
  description?: string;
  basePricePerDay: number;
}

export interface UpdateVehicleCategoryRequest {
  name: string;
  description?: string;
  basePricePerDay?: number;
}

export interface VehicleAmenity {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface InsurancePolicy {
  id: string;
  providerName: string;
  policyNumber: string;
  expiryDate: string;
  coverageDetails: string;
  annualCost: number;
}

export interface MaintenanceLog {
  id: string;
  serviceDate: string;
  serviceType: 'OIL_CHANGE' | 'TIRES' | 'BRAKES' | 'INSPECTION' | 'REPAIR';
  mileageAtService: number;
  cost: number;
  providerName: string;
  notes: string;
}

export interface VehicleResponse {
  id: string;
  vin: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  status: VehicleStatus;
  category: VehicleCategoryResponse;
  currentBranch?: import('./organization.models').BranchResponse;
  currentBranchId?: string;
  currentBranchName?: string;
  mileage: number;
  notes: string;
  amenities?: VehicleAmenity[];
  insurance?: InsurancePolicy;
  maintenanceLogs?: MaintenanceLog[];
  lastMaintenanceMileage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  vin: string;
  licensePlate: string;
  brand: string;
  model: string;
  year?: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  categoryId: string;
  mileage?: number;
  notes?: string;
  currentBranchId?: string;
}

export interface UpdateVehicleRequest {
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  categoryId?: string;
  mileage?: number;
  notes?: string;
  currentBranchId?: string;
}

export interface PatchVehicleStatusRequest {
  status: VehicleStatus;
}

export interface VehicleSearchParams {
  searchTerm?: string;
  status?: VehicleStatus;
  fuelType?: FuelType;
  transmission?: TransmissionType;
}
