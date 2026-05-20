export type WorkflowType = 'Quy_trinh_1' | 'Quy_trinh_2';

export type Project = {
  id: string;
  name: string;
  region: string;
  totalUnits: number;
  workflowType?: WorkflowType;
  originalDocumentChecklist?: string[]; // Danh mục hồ sơ gốc tham khảo
};

export type StepName = 
  // Workflow Quy trình Thông thường (S_)
  | 'S1_ChuanBi' 
  | 'S2_KT_Tiep_Nhan'
  | 'S2_KT_Ban_giao'
  | 'S3_Nop_VPDK'
  | 'S4_Cho_Thong_Bao_Thue'
  | 'S5_Tai_Chinh_Khach_Hang'
  | 'S5_1_PTDA_TiepNhan'
  | 'S6_Nhan_So_GCN'
  | 'S7_PTDA_Ban_Giao'
  | 'S7_1_PTT_Tiep_Nhan'
  | 'S7_2_Ban_Giao_Khach'
  | 'Hoan_Tat'
  // Workflow Quy trình Hỗ trợ (GD_)
  | 'GD1_ChuanBi'
  | 'GD1_Cho_KT_TiepNhan'
  | 'GD2_Cho_Nop_VPDK'
  | 'GD3_Cho_TBThue'
  | 'GD4_Cho_Nop_NVTC'
  | 'GD4_Cho_KT_TiepNhan_LaySo'
  | 'GD5_Cho_Ky_In_GCN'
  | 'GD5_Cho_PTT_TiepNhan_BG'
  | 'GD5_Cho_GCN'
  | 'GD6_Cho_BG_Khach';

export type Dept = 'PTT' | 'KT' | 'PTDA' | 'MANAGER' | 'DIRECTOR' | 'ADMIN';

export type UserPermission = 'VIEW' | 'EDIT' | 'FULL';

export type UserProfile = {
  id: string;
  username: string;
  password?: string;
  name: string;
  dept: Dept;
  permission: UserPermission;
  assignedProjectIds?: string[];
  email?: string;
  phoneNumber?: string;
  status: 'Active' | 'Inactive';
};

export type UnitStatus = 
  | 'Processing' 
  | 'WaitingVPDK'
  | 'Submitted' 
  | 'TaxPending' 
  | 'TaxCompleted' 
  | 'TaxPaid'
  | 'WaitingHandover'
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
  performedBy?: string; // ID of the user who performed the action
  performedByName?: string; // Name of the user who performed the action
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

export type IssueSeverity = 'Nghiêm trọng' | 'Cao' | 'Trung bình' | 'Thấp';

export type IssueType = 'None' | 'Sai sót nội bộ' | 'Sai sót khách hàng' | 'Sai sót cơ quan nhà nước' | 'Sai sót chủ đầu tư' | 'Sai sót Khác';

export type ScannedFile = {
  id: string;
  name: string;
  url: string;
  path?: string;
  type: string;
  uploadDate: string;
  isShared?: boolean;
};

export type Application = {
  id: string;
  unitCode: string; // Mã lô/căn
  projectName: string;
  workflowType?: WorkflowType; // Thêm loại quy trình
  customerName: string;
  contractSignerType?: string; // Đối tượng ký HĐCN
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
  
  // Handover status
  isHandedOver?: boolean;
  handoverDate?: string;
  
  // New fields
  taxNoticeProvisionDate?: string; // Ngày cung cấp TB Thuế
  taxVpdkSubmissionDate?: string; // Ngày KT nộp hồ sơ NVTC & hồ sơ lấy sổ vô VPĐK
  gcnSignedDate?: string; // Ngày hoàn thành in / trình ký GCN
  issueType?: IssueType;
  issueSeverity?: IssueSeverity;
  issueNotes?: string;
  issue_status?: 'OPEN' | 'RESOLVED';
  issue_created_at?: string;
  issue_resolved_at?: string | null;
  issue_type?: IssueType;
  issue_severity?: string;
  issue_notes?: string;
  estimatedCompletionDate?: string;
  rejectionCount?: number; // Số lần hồ sơ bị trả về
  isRejected?: boolean; // Trạng thái đang bị trả về chờ sửa
  rejectionReason?: string; // Lý do trả hồ sơ
  commitmentDate?: string;
  scannedFiles?: ScannedFile[];

  taxPaymentStatus: 'Unpaid' | 'Paid';
  checklist?: {
    [key: string]: boolean;
  };
  history: ApplicationStepHistory[];
  auditTrail?: AuditTrailEntry[];
  flags?: string[];
};

export type AppNotification = {
  id: string;
  recipientId: string; // user_id in DB
  title: string;
  message: string; // content in DB
  time: string; // created_at in DB
  type: 'Urgent' | 'Info' | 'Success' | 'Warning';
  isRead: boolean;
  appId?: string; // record_id in DB
};

export type KPI = {
  total: number;
  processing: number;
  waitingVPDK: number;
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
