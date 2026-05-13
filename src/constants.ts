import { Application, Project, Dept, UnitStatus, UserProfile, StepName, WorkflowType } from './types';

export const PROJECTS: Project[] = [
  { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Dự án trung tâm thành phố Đồng Hới', region: 'Quảng Trị', totalUnits: 150 },
  { id: '550e8400-e29b-41d4-a716-446655440021', name: 'Dự án Hòa Xuân', region: 'Đà Nẵng', totalUnits: 120 },
  { id: '550e8400-e29b-41d4-a716-446655440022', name: 'Dự án Hòa Quý - Đồng Nò', region: 'Đà Nẵng', totalUnits: 450 },
  { id: '550e8400-e29b-41d4-a716-446655440023', name: 'Dự án Hòa Quý Mở rộng', region: 'Đà Nẵng', totalUnits: 300 },
  { id: '550e8400-e29b-41d4-a716-446655440024', name: 'Dự án Panoma', region: 'Đà Nẵng', totalUnits: 250 },
  { id: '550e8400-e29b-41d4-a716-446655440025', name: 'Dự án Sunneva Island', region: 'Đà Nẵng', totalUnits: 387 },
  { id: '550e8400-e29b-41d4-a716-446655440026', name: 'Dự án Nam Hòa Xuân', region: 'Đà Nẵng', totalUnits: 1000 },
  { id: '550e8400-e29b-41d4-a716-446655440027', name: 'Dự án Đảo Ngọc', region: 'Quảng Ngãi', totalUnits: 400 },
  { id: '550e8400-e29b-41d4-a716-446655440028', name: 'Nam Nha Trang', region: 'Khánh Hòa', totalUnits: 300 },
];

export const MOCK_USERS: UserProfile[] = [
  { id: '550e8400-e29b-41d4-a716-446655440000', username: 'admin', name: 'Hệ thống Admin', dept: 'ADMIN', permission: 'FULL', email: 'admin@sunshine.vn', status: 'Active', assignedProjectIds: ['550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440028'] },
  { id: '550e8400-e29b-41d4-a716-446655440001', username: 'ptt_user', name: 'Nguyễn Thu Thủ Tục', dept: 'PTT', permission: 'EDIT', email: 'thutuc@sunshine.vn', status: 'Active', assignedProjectIds: ['550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440027'] },
  { id: '550e8400-e29b-41d4-a716-446655440002', username: 'kt_user', name: 'Trần Kế Toán', dept: 'KT', permission: 'EDIT', email: 'ketoan@sunshine.vn', status: 'Active', assignedProjectIds: ['550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440028'] },
  { id: '550e8400-e29b-41d4-a716-446655440003', username: 'ptda_user', name: 'Lê Phát Triển', dept: 'PTDA', permission: 'EDIT', email: 'ptda@sunshine.vn', status: 'Active', assignedProjectIds: ['550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440026'] },
  { id: '550e8400-e29b-41d4-a716-446655440004', username: 'manager', name: 'Phạm Trưởng Phòng', dept: 'MANAGER', permission: 'VIEW', email: 'manager@sunshine.vn', status: 'Active', assignedProjectIds: ['550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440020'] },
  { id: '550e8400-e29b-41d4-a716-446655440005', username: 'director', name: 'Lãnh đạo Sunshine', dept: 'DIRECTOR', permission: 'VIEW', email: 'director@sunshine.vn', status: 'Active', assignedProjectIds: ['550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440028'] },
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    unitCode: 'HX-A1-0501',
    projectName: 'Dự án Hòa Xuân',
    customerName: 'Nguyễn Văn A (Tự làm sổ)',
    contractSignerType: 'Cá nhân',
    phoneNumber: '0901234567',
    propertyType: 'Dat_Nen',
    loanStatus: 'Khong_Vay',
    isSelfService: true,
    contractSigningDate: '2026-03-10',
    submissionLocation: 'PHUONG',
    currentStep: 'S1_ChuanBi',
    status: 'Processing',
    receivedDate: '2026-03-15',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h1', stepName: 'BƯỚC 1: CHUẨN BỊ', dept: 'PTT', receivedDate: '2026-03-15', performedBy: '550e8400-e29b-41d4-a716-446655440001', performedByName: 'Nguyễn Thu Thủ Tục' }],
    auditTrail: [
      { id: 'at1', userId: '550e8400-e29b-41d4-a716-446655440000', userName: 'Admin', action: 'Khởi tạo hồ sơ', timestamp: '2026-03-15 08:00' }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    unitCode: 'HQDN-C2-1210',
    projectName: 'Dự án Hòa Quý - Đồng Nò',
    customerName: 'Trần Thị B',
    contractSignerType: 'Cá nhân',
    phoneNumber: '0987654321',
    propertyType: 'Dat_Nen',
    loanStatus: 'Co_Vay',
    currentStep: 'S4_Cho_Thong_Bao_Thue',
    status: 'TaxPending',
    receivedDate: '2026-02-10',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h2', stepName: 'BƯỚC 4: THÔNG BÁO', dept: 'PTDA', receivedDate: '2026-02-15', performedBy: '550e8400-e29b-41d4-a716-446655440003', performedByName: 'Lê Phát Triển' }]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    unitCode: 'HQMR-S5-0220',
    projectName: 'Dự án Hòa Quý Mở rộng',
    customerName: 'Lê Văn C',
    contractSignerType: 'Cá nhân',
    phoneNumber: '0912334455',
    propertyType: 'Can_Ho',
    loanStatus: 'Khong_Vay',
    currentStep: 'Hoan_Tat',
    status: 'Completed',
    receivedDate: '2026-01-05',
    taxPaymentStatus: 'Paid',
    history: [{ id: 'h4', stepName: 'ĐÃ HOÀN TẤT', dept: 'ADMIN', receivedDate: '2026-03-15', completedDate: '2026-03-20', performedBy: '550e8400-e29b-41d4-a716-446655440001', performedByName: 'Nguyễn Thu Thủ Tục' }]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    unitCode: 'HX-B2-0805',
    projectName: 'Dự án Hòa Xuân',
    customerName: 'Phạm Minh D',
    contractSignerType: 'Công ty',
    phoneNumber: '0944556677',
    propertyType: 'Can_Ho',
    loanStatus: 'Co_Vay',
    currentStep: 'S2_KT_Tiep_Nhan',
    status: 'Error',
    issueType: 'Sai sót Khác',
    issueSeverity: 'Nghiêm trọng',
    issueNotes: 'Thiếu CMND bản sao công chứng của chủ sở hữu, đã yêu cầu bổ sung 3 lần.',
    receivedDate: '2026-02-01',
    taxPaymentStatus: 'Paid',
    history: [{ id: 'h6', stepName: 'BƯỚC 2: CHỜ NỘP VPĐK (KT)', dept: 'KT', receivedDate: '2026-02-20', performedBy: '550e8400-e29b-41d4-a716-446655440002', performedByName: 'Trần Kế Toán' }]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    unitCode: 'PN-P1-0105',
    projectName: 'Dự án Panoma',
    customerName: 'Hoàng Văn E',
    phoneNumber: '0901112233',
    propertyType: 'Can_Ho',
    loanStatus: 'Khong_Vay',
    vpdkCode: 'PN-2026-001',
    currentStep: 'S2_KT_Tiep_Nhan',
    status: 'WaitingVPDK',
    receivedDate: '2026-03-01',
    submissionDate: '2026-03-05',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h7', stepName: 'BƯỚC 2: CHỜ NỘP VPĐK (KT)', dept: 'KT', receivedDate: '2026-03-05', performedBy: '550e8400-e29b-41d4-a716-446655440002', performedByName: 'Trần Kế Toán' }]
  }
];

export const WORKFLOW_1_STEPS: StepName[] = [
  'GD1_ChuanBi',
  'GD1_Cho_KT_TiepNhan',
  'GD2_Cho_Nop_VPDK',
  'GD3_Cho_TBThue',
  'GD4_Cho_Nop_NVTC',
  'GD4_Cho_KT_TiepNhan_LaySo',
  'GD5_Cho_Ky_In_GCN',
  'GD5_Cho_GCN',
  'GD5_Cho_PTT_TiepNhan_BG',
  'GD6_Cho_BG_Khach',
  'Hoan_Tat'
];

export const CONST_QUY_TRINH_1 = WORKFLOW_1_STEPS;

export const WORKFLOW_2_STEPS: StepName[] = [
  'S1_ChuanBi',
  'S2_KT_Tiep_Nhan',
  'S2_KT_Ban_giao',
  'S3_Nop_VPDK',
  'S4_Cho_Thong_Bao_Thue',
  'S5_Tai_Chinh_Khach_Hang',
  'S5_1_PTDA_TiepNhan',
  'S6_Nhan_So_GCN',
  'S7_PTDA_Ban_Giao',
  'S7_1_PTT_Tiep_Nhan',
  'S7_2_Ban_Giao_Khach',
  'Hoan_Tat'
];

export const CONST_QUY_TRINH_2 = WORKFLOW_2_STEPS;

export const getNextStep = (currentStep: StepName, workflowType: WorkflowType): StepName | null => {
  const steps = workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= steps.length - 1) return null;
  return steps[currentIndex + 1];
};

export const STEP_CONFIG: Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }> = {
  S1_ChuanBi: { label: '1. CHUẨN BỊ (PTT)', dept: 'PTT', status: 'Processing', slaDays: 25, active: true },
  S2_KT_Tiep_Nhan: { label: '2. TIẾP NHẬN (KT)', dept: 'KT', status: 'WaitingVPDK', slaDays: 5, active: true },
  S2_KT_Ban_giao: { label: '2.1 BÀN GIAO HS HOÀN THIỆN (PTDA)', dept: 'PTDA', status: 'WaitingVPDK', slaDays: 2, active: true },
  S3_Nop_VPDK: { label: '3. NỘP VPĐK (PTDA)', dept: 'PTDA', status: 'Submitted', slaDays: 5, active: true },
  S4_Cho_Thong_Bao_Thue: { label: '4. THÔNG BÁO (PTDA)', dept: 'PTDA', status: 'TaxPending', slaDays: 15, active: true },
  S5_Tai_Chinh_Khach_Hang: { label: '5. TÀI CHÍNH (PTT)', dept: 'PTT', status: 'TaxCompleted', slaDays: 10, active: true },
  S5_1_PTDA_TiepNhan: { label: '5.1 TIẾP NHẬN GNT (PTDA)', dept: 'PTDA', status: 'TaxCompleted', slaDays: 2, active: true },
  S6_Nhan_So_GCN: { label: '6. NHẬN SỔ (PTDA)', dept: 'PTDA', status: 'GCN_Issued', slaDays: 7, active: true },
  S7_PTDA_Ban_Giao: { label: '7. BÀN GIAO (PTDA & PTT)', dept: 'PTDA', status: 'Completed', slaDays: 2, active: true },
  S7_1_PTT_Tiep_Nhan: { label: '7.1 NHẬN BÀN GIAO (PTT)', dept: 'PTT', status: 'Completed', slaDays: 2, active: true },
  S7_2_Ban_Giao_Khach: { label: '7.2 BÀN GIAO KHÁCH HÀNG (PTT)', dept: 'PTT', status: 'Completed', slaDays: 2, active: true },
  GD1_ChuanBi: { label: 'GĐ1: Đang chuẩn bị hồ sơ (PTT)', dept: 'PTT', status: 'Processing', slaDays: 25, active: true },
  GD1_Cho_KT_TiepNhan: { label: 'GĐ1: Chờ Kế toán tiếp nhận bàn giao (KT)', dept: 'KT', status: 'WaitingVPDK', slaDays: 5, active: true },
  GD2_Cho_Nop_VPDK: { label: 'GĐ2: Chờ nộp VPĐK (Kế toán)', dept: 'KT', status: 'WaitingVPDK', slaDays: 5, active: true },
  GD3_Cho_TBThue: { label: 'GĐ3: Chờ Thông báo thuế (PTDA)', dept: 'PTDA', status: 'TaxPending', slaDays: 15, active: true },
  GD4_Cho_Nop_NVTC: { label: 'GĐ4: Chờ hoàn thành NVTC (PTT)', dept: 'PTT', status: 'TaxCompleted', slaDays: 10, active: true },
  GD4_Cho_KT_TiepNhan_LaySo: { label: 'GĐ4: Chờ KT tiếp nhận (GNT)', dept: 'KT', status: 'TaxCompleted', slaDays: 5, active: true },
  GD5_Cho_Ky_In_GCN: { label: 'GĐ5: Chờ PTDA tiếp nhận (Trình ký GCN)', dept: 'PTDA', status: 'GCN_Issued', slaDays: 3, active: true },
  GD5_Cho_GCN: { label: 'GĐ5: Chờ nhận GCN thực tế (KT)', dept: 'KT', status: 'Completed', slaDays: 2, active: true },
  GD5_Cho_PTT_TiepNhan_BG: { label: 'GĐ5: Chờ PTT tiếp nhận (Bàn giao khách) (PTT)', dept: 'PTT', status: 'Completed', slaDays: 2, active: true },
  GD6_Cho_BG_Khach: { label: 'GĐ6: Đang bàn giao khách hàng (PTT)', dept: 'PTT', status: 'Completed', slaDays: 2, active: true },
  Hoan_Tat: { label: 'ĐÃ HOÀN TẤT', dept: 'ADMIN', status: 'Completed', active: true },
};
