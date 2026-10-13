export interface TenantDashboardDTO {
  totalRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPercentage: number;
  outstandingAmount: number;
  totalReservations: number;
  activeReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  cancellationRate: number;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  occupancyRate: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalBranches: number;
  activeBranches: number;
  generatedAt: string;
  period: string;
}

export interface BranchPerformanceDTO {
  branchId: string;
  branchName: string;
  city: string;
  totalRevenue: number;
  totalReservations: number;
  totalVehicles: number;
  availableVehicles: number;
  occupancyRate: number;
  averageRevenuePerReservation: number;
}

export interface VehicleStatsDTO {
  categoryId: string;
  categoryName: string;
  reservationCount: number;
  totalRevenue: number;
  vehicleCount: number;
  averageRevenuePerReservation: number;
  revenuePercentage: number;
}

export interface RevenuePeriodDTO {
  year: number;
  month:
    | 'JANUARY'
    | 'FEBRUARY'
    | 'MARCH'
    | 'APRIL'
    | 'MAY'
    | 'JUNE'
    | 'JULY'
    | 'AUGUST'
    | 'SEPTEMBER'
    | 'OCTOBER'
    | 'NOVEMBER'
    | 'DECEMBER';
  monthValue: number;
  leapYear: boolean;
}

export interface RevenueStatsDTO {
  period: RevenuePeriodDTO;
  revenue: number;
  reservationCount: number;
  paidInvoiceCount: number;
  averageRevenuePerReservation: number;
}

export interface OccupancyStatsDTO {
  date: string;
  totalVehicles: number;
  rentedVehicles: number;
  occupancyRate: number;
}
