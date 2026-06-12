export interface Branch {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  contactNumber?: string;
  totalSeats?: number;
  floors?: number;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
}

export interface Plan {
  id: string;
  _id?: string;
  name: string;
  durationHours?: number;
  occupancyType?: string;
  shiftTimings?: Array<{ code: string; startTime: string; endTime: string }>;
  isActive: boolean;
}

export interface Seat {
  id?: string;
  _id: string;
  seatNumber: string;
  branchId: string;
  isLocked: boolean;
  isActive: boolean;
}

export interface SeatAvailabilityItem {
  seat: Seat;
  available: boolean;
  liveStatus: "vacant" | "occupied" | "reserved";
  allocations: unknown[];
}

export interface Student {
  id?: string;
  _id?: string;
  studentCode?: string;
  fullName: string;
  mobileNumber: string;
  parentContact?: string;
  parentContactRelation?: string | null;
  address?: string;
  email?: string | null;
  branchId: string;
  currentPlanId?: string;
  currentSeatId?: string;
  currentAllocationId?: string;
  currentShiftCode?: string | null;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
  photoUrl?: string;
  idProofUrl?: string;
  joiningDate?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  branch?: {
    id: string;
    name: string;
    address?: string;
    contactNumber?: string;
  } | null;
  plan?: {
    id: string;
    name: string;
    durationHours?: number;
    occupancyType?: string;
    shiftTimings?: Plan["shiftTimings"];
  } | null;
  seat?: {
    id: string;
    seatNumber: string;
    label?: string;
  } | null;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  type?: string;
  studentId: string;
  registrationId?: string;
  branchId?: string;
  totalAmount: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  issuedAt?: string;
}

export interface StudentRegistration {
  id: string;
  studentId: string;
  branchId: string;
  planId: string;
  seatId: string;
  shiftCode?: string | null;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
  joiningDate?: string;
  startDate?: string;
  endDate?: string;
  durationMonths?: number;
  paymentAmount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  receiptId?: string;
  status?: string;
  createdAt?: string;
}

export interface NotificationItem {
  id?: string;
  _id?: string;
  branchId?: string;
  userId?: string | null;
  studentId?: string | null;
  title: string;
  body?: string;
  message?: string;
  type: string;
  category: string;
  priority: string;
  status: "unread" | "read" | "archived";
  readAt?: string | null;
  reminderId?: string | null;
  paymentId?: string | null;
  renewalId?: string | null;
  branch?: { id: string; name: string } | null;
  student?: {
    id: string;
    fullName: string;
    studentCode?: string;
  } | null;
  metadata?: Record<string, unknown>;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id?: string;
  _id?: string;
  paymentNumber?: string;
  studentId: string;
  branchId?: string;
  renewalId?: string | null;
  registrationId?: string | null;
  receiptId?: string | null;
  amount: number;
  currency?: string;
  status: string;
  paymentMode: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  type?: string;
  paidAt?: string;
  notes?: string;
  collectedBy?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    studentCode: string;
    fullName: string;
    mobileNumber: string;
  };
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface StudentPaymentSummary {
  studentId: string;
  student: {
    id: string;
    studentCode: string;
    fullName: string;
    mobileNumber: string;
    parentContact?: string;
    parentContactRelation?: string | null;
    status: string;
    endDate?: string;
    plan?: { id: string; name: string; durationHours?: number } | null;
    seat?: { id: string; seatNumber: string; label?: string } | null;
  };
  suggestedAmount: number | null;
  suggestedAmountLabel?: string | null;
  currency: string;
  totalPaid: number;
  paymentCount: number;
  activeRenewal?: {
    id: string;
    renewalNumber: string;
    expectedAmount: number;
    amountPaid: number;
    balanceDue: number;
    status: string;
    currency?: string;
  } | null;
}

export interface Renewal {
  id?: string;
  _id?: string;
  renewalNumber?: string;
  studentId: string;
  student?: {
    id?: string;
    fullName?: string;
    studentCode?: string;
    mobileNumber?: string;
  } | null;
  status: string;
  expectedAmount?: number;
  amountPaid?: number;
  balanceDue?: number;
  currency?: string;
  newStartDate?: string;
  newEndDate?: string;
  createdAt?: string;
}
