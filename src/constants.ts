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

export const REGION_ORDER = [
  'Quảng Bình',
  'Quảng Trị',
  'Thừa Thiên Huế',
  'Đà Nẵng',
  'Quảng Nam',
  'Quảng Ngãi',
  'Bình Định',
  'Phú Yên',
  'Khánh Hòa',
  'Ninh Thuận',
  'Bình Thuận'
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
    currentStep: 'S3_Nop_VPDK',
    status: 'Submitted',
    receivedDate: '2026-02-10',
    submissionDate: '2026-02-15',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h2', stepName: 'B3: Nộp hồ sơ tại VPĐK', dept: 'PTDA', receivedDate: '2026-02-15', performedBy: '550e8400-e29b-41d4-a716-446655440003', performedByName: 'Lê Phát Triển' }]
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
    issueSeverity: 'Critical',
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

export const STEP_CONFIG: Record<string, { label: string, description: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }> = {
  S1_ChuanBi: { label: 'B1: Chuẩn bị hồ sơ (PTT)', description: 'Bộ phận Thủ tục tiếp nhận, kiểm tra hồ sơ đầu vào', dept: 'PTT', status: 'Processing', slaDays: 25, active: true },
  S2_KT_Tiep_Nhan: { label: 'B2: KT tiếp nhận (Kế toán)', description: 'Bộ phận Kế toán tiếp nhận, kiểm tra tính pháp lý', dept: 'KT', status: 'WaitingVPDK', slaDays: 3, active: true },
  S2_KT_Ban_giao: { label: 'B2.1: KT bàn giao (PTDA)', description: 'Bộ phận Phát triển Dự án tiếp nhận hồ sơ từ KT và chuẩn bị nộp', dept: 'PTDA', status: 'WaitingVPDK', slaDays: 1, active: true },
  S3_Nop_VPDK: { label: 'B3: Nộp hồ sơ tại VPĐK', description: 'Bộ phận Phát triển Dự án nộp hồ sơ tại VPĐKĐĐ', dept: 'PTDA', status: 'Submitted', slaDays: 1, active: true },
  S4_Cho_Thong_Bao_Thue: { label: 'B4: Chờ thông báo thuế (Hợp nhất vào B3)', description: 'Chờ cơ quan thuế ban hành thông báo thuế (PTDA theo dõi)', dept: 'PTDA', status: 'TaxPending', slaDays: 10, active: false },
  S5_Tai_Chinh_Khach_Hang: { label: 'B5: PTT Đôn đốc thuế', description: 'Bộ phận Thủ tục theo dõi khách hàng thực hiện nghĩa vụ thuế', dept: 'PTT', status: 'TaxPending', slaDays: 5, active: true },
  S5_1_PTDA_TiepNhan: { label: 'B5.1: PTDA Nhận chứng từ thuế', description: 'Bộ phận Phát triển Dự án tiếp nhận chứng từ nộp thuế', dept: 'PTDA', status: 'TaxCompleted', slaDays: 3, active: true },
  S6_Nhan_So_GCN: { label: 'B6: Theo dõi kết quả GCN', description: 'Bộ phận Phát triển Dự án tiếp nhận kết quả GCN từ VPĐK', dept: 'PTDA', status: 'GCN_Issued', slaDays: 5, active: true },
  S7_PTDA_Ban_Giao: { label: 'B7: PTDA Bàn giao PTT', description: 'Bộ phận Phát triển Dự án bàn giao GCN cho Bộ phận Thủ tục', dept: 'PTDA', status: 'WaitingHandover', slaDays: 2, active: true },
  S7_1_PTT_Tiep_Nhan: { label: 'B7.1: PTT Tiếp nhận GCN', description: 'Bộ phận Thủ tục tiếp nhận GCN từ PTDA', dept: 'PTT', status: 'WaitingHandover', slaDays: 2, active: true },
  S7_2_Ban_Giao_Khach: { label: 'B7.2: Bàn giao khách hàng', description: 'Bộ phận Thủ tục thực hiện bàn giao GCN cho khách hàng', dept: 'PTT', status: 'WaitingHandover', slaDays: 2, active: true },
  GD1_ChuanBi: { label: 'GĐ1: Chuẩn bị (PTT)', description: 'Bộ phận Thủ tục chuẩn bị hồ sơ giai đoạn 1', dept: 'PTT', status: 'Processing', slaDays: 25, active: true },
  GD1_Cho_KT_TiepNhan: { label: 'GĐ1: KT tiếp nhận (Kế toán)', description: 'Bộ phận Kế toán tiếp nhận bàn giao từ PTT', dept: 'KT', status: 'WaitingVPDK', slaDays: 3, active: true },
  GD2_Cho_Nop_VPDK: { label: 'GĐ2: Đang nộp VPĐK (KT)', description: 'Bộ phận Kế toán nộp hồ sơ tại VPĐKĐĐ', dept: 'KT', status: 'WaitingVPDK', slaDays: 2, active: true },
  GD3_Cho_TBThue: { label: 'GĐ3: Chờ TB Thuế (PTDA)', description: 'Chờ ban hành thông báo thuế (PTDA theo dõi)', dept: 'PTDA', status: 'TaxPending', slaDays: 10, active: true },
  GD4_Cho_Nop_NVTC: { label: 'GĐ4: Đôn đốc nộp thuế (PTT)', description: 'Bộ phận Thủ tục theo dõi NVTC của khách', dept: 'PTT', status: 'TaxPending', slaDays: 5, active: true },
  GD4_Cho_KT_TiepNhan_LaySo: { label: 'GĐ4: KT tiếp nhận chứng từ tài chính (KT)', description: 'Bộ phận Kế toán xác nhận chứng từ nộp thuế và lấy số', dept: 'KT', status: 'TaxCompleted', slaDays: 3, active: true },
  GD5_Cho_Ky_In_GCN: { label: 'GĐ5: Theo dõi trình ký (PTDA)', description: 'Bộ phận Phát triển Dự án làm thủ tục trình ký GCN tại VPĐK', dept: 'PTDA', status: 'GCN_Issued', slaDays: 5, active: true },
  GD5_Cho_GCN: { label: 'GĐ5: KT nhận kết quả (KT)', description: 'Bộ phận Kế toán nhận kết quả GCN', dept: 'KT', status: 'GCN_Issued', slaDays: 2, active: true },
  GD5_Cho_PTT_TiepNhan_BG: { label: 'GĐ5: Chờ PTT tiếp nhận BG (PTT)', description: 'Bộ phận Thủ tục tiếp nhận GCN thực tế', dept: 'PTT', status: 'WaitingHandover', slaDays: 2, active: true },
  GD6_Cho_BG_Khach: { label: 'GĐ6: Bàn giao khách hàng (PTT)', description: 'Bộ phận Thủ tục thực hiện bàn giao cho khách', dept: 'PTT', status: 'WaitingHandover', slaDays: 2, active: true },
  Hoan_Tat: { label: 'ĐÃ HOÀN TẤT', description: 'Hồ sơ đã hoàn tất và bàn giao', dept: 'ADMIN', status: 'Completed', active: true },
};
