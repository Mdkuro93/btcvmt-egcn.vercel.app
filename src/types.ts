export type Project = {
  id: string;
  name: string;
  region: string;
  totalUnits: number;
};

export type StepName = 
  | 'GD1_ChuanBi' 
  | 'GD1_Cho_KT_TiepNhan'
  | 'GD2_Cho_Nop_VPDK' 
  | 'GD2_Cho_PTDA_TiepNhan'
  | 'GD3_Cho_TBThue'
  | 'GD4_Cho_Nop_NVTC'
  | 'GD4_Cho_KT_TiepNhan_LaySo'
  | 'GD5_Cho_GCN'
  | 'GD5_Cho_PTT_TiepNhan_BG'
  | 'GD6_Cho_BG_Khach'
  | 'Hoan_Tat';

export type Dept = 'PTT' | 'KT' | 'PTDA' | 'MANAGER' | 'DIRECTOR' | 'ADMIN';

export type UserProfile = {
  id: string;
  username: string;
  password?: string;
  name: string;
  dept: Dept;
  assignedProjectIds?: string[];
  email?: string;
  phoneNumber?: string;
  status: 'Active' | 'Inactive';
};

export type UnitStatus = 
  | 'Processing' 
  | 'Submitted' 
  | 'TaxPending' 
  | 'TaxCompleted' 
  | 'GCN_Issued' 
  | 'Completed' 
  | 'Error'
  | 'Draft';

export type ApplicationStepHistory = {
  id: string;
  stepName: string;
  dept: Dept;
  receivedDate: string;
  completedDate?: string;
  note?: string;
};

export type PropertyType = 'Dat_Nen' | 'Can_Ho';

export type AuditTrailEntry = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  changes?: string;
};

export type IssueSeverity = 'Minor' | 'Moderate' | 'Critical';

export type ScannedFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadDate: string;
};

export type Application = {
  id: string;
  unitCode: string; // Mã lô/căn
  projectName: string;
  customerName: string;
  phoneNumber?: string;
  propertyType: PropertyType; // Loại tài sản
  loanStatus: 'Co_Vay' | 'Khong_Vay'; // Trạng thái vay
  bankCommitmentDeadline?: string; // Thời hạn hoàn thành cấp GCN theo cam kết với ngân hàng
  reportUpdateDate?: string; // Ngày cập nhật BC
  contractSigningDate?: string; // Ngày ký HĐCN
  assignorGcnNumber?: string; // Số GCN QSDĐ của bên CN
  assignorGcnDate?: string; // Ngày cấp GCN của bên CN
  
  // Thông tin tiến độ
  isSelfService?: boolean; // KH tự làm sổ đỏ
  submissionLocation?: 'PHUONG' | 'TP_DANANG'; // Nơi nộp hồ sơ
  vpdkCode?: string; // Mã hồ sơ / Số phiếu hẹn VPĐK
  
  // Các mốc thời gian quan trọng
  currentStep: StepName;
  status: UnitStatus;
  receivedDate: string; // Ngày tiếp nhận hồ sơ từ khách
  taxNotificationDate?: string; // Ngày ban hành thông báo thuế
  taxNotificationReceivedDate?: string; // Ngày nhận thông báo thuế
  taxReceiptDate?: string; // Ngày nhận GNT
  accountingHandoverDate?: string; // Ngày bàn giao cho kế toán
  submissionDate?: string; // Ngày nộp hồ sơ tại VPĐKĐĐ (VPDK)
  gcnReceivedDate?: string; // Ngày nhận sổ
  ptdaHandoverDate?: string; // Ngày bàn giao GCN PTT
  customerHandoverDate?: string; // Ngày bàn giao GCN cho khách
  
  // New fields
  taxNoticeProvisionDate?: string; // Ngày cung cấp TB Thuế
  gcnSignedDate?: string; // Ngày hoàn thành in / trình ký GCN
  issueType?: 'None' | 'Paperwork' | 'Financial' | 'Authority' | 'Other';
  issueSeverity?: IssueSeverity;
  issueNotes?: string;
  estimatedCompletionDate?: string;
  rejectionCount?: number; // Số lần hồ sơ bị trả về
  isRejected?: boolean; // Trạng thái đang bị trả về chờ sửa
  rejectionReason?: string; // Lý do trả hồ sơ
  scannedFiles?: ScannedFile[];

  taxPaymentStatus: 'Unpaid' | 'Paid';
  checklist?: {
    [key: string]: boolean;
  };
  history: ApplicationStepHistory[];
  auditTrail?: AuditTrailEntry[];
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'Urgent' | 'Info' | 'Success';
  isRead: boolean;
};

export type KPI = {
  total: number;
  processing: number;
  submitted: number;
  taxPending: number;
  taxCompleted: number;
  gcnIssued: number;
  completed: number;
  error: number;
  overdue: number;
  loanCount: number;
  regularCount: number;
  rejectedCount: number; // Số lượng hồ sơ bị trả về (Giai đoạn 1)
};
