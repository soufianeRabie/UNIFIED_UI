export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PENALTY_DUE = 'PENALTY_DUE',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface PaymentResponse {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentReference: string;
  notes: string;
  processedAt: string;
  failedAt: string;
  failureReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  issueDate: string;
  dueDate: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: InvoiceStatus;
  notes: string;
  issuedAt: string;
  paidAt: string;
  cancelledAt: string;
  payments: PaymentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  reservationId: string;
  notes?: string;
}

export interface ProcessPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}
