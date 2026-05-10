import { Application, Project, Dept, UnitStatus, UserProfile } from './types';

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
    issueType: 'Paperwork',
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

export const STEP_CONFIG: Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number }> = {
  S1_ChuanBi: { label: '1. CHUẨN BỊ (PTT)', dept: 'PTT', status: 'Processing', slaDays: 25 },
  S2_KT_Tiep_Nhan: { label: '2.1 CHỜ NỘP VPĐK (KT)', dept: 'KT', status: 'WaitingVPDK', slaDays: 5 },
  S2_KT_Hoan_Thien_HS: { label: '2.2. HOÀN THIỆN HS (KT)', dept: 'KT', status: 'WaitingVPDK', slaDays: 2 },
  S3_PTDA_Tiep_Nhan: { label: '3.1 TIẾP NHẬN (PTDA)', dept: 'PTDA', status: 'Submitted', slaDays: 2 },
  S3_Nop_VPDK: { label: '3.2 NỘP VPĐK (PTDA)', dept: 'PTDA', status: 'Submitted', slaDays: 5 },
  S4_Cho_Thong_Bao_Thue: { label: '4. THÔNG BÁO (PTDA)', dept: 'PTDA', status: 'TaxPending', slaDays: 15 },
  S5_Tai_Chinh_Khach_Hang: { label: '5. TÀI CHÍNH (PTT)', dept: 'PTT', status: 'TaxCompleted', slaDays: 10 },
  S6_Nhan_So_GCN: { label: '6. NHẬN SỔ (PTDA)', dept: 'PTDA', status: 'GCN_Issued', slaDays: 7 },
  S7_PTDA_Ban_Giao_PTT: { label: '7.1 BÀN GIAO PTT (PTDA)', dept: 'PTDA', status: 'Completed', slaDays: 1 },
  S7_PTT_Ban_Giao_Khach: { label: '7.2 BÀN GIAO KHÁCH (PTT)', dept: 'PTT', status: 'Completed', slaDays: 2 },
  Hoan_Tat: { label: 'ĐÃ HOÀN TẤT', dept: 'ADMIN', status: 'Completed' },
};
