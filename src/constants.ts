import { Application, Project, Dept, UnitStatus, UserProfile } from './types';

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Dự án Hòa Xuân', region: 'Đà Nẵng', totalUnits: 120 },
  { id: 'p2', name: 'Dự án Hòa Quý - Đồng Nò', region: 'Đà Nẵng', totalUnits: 450 },
  { id: 'p3', name: 'Dự án Hòa Quý Mở rộng', region: 'Đà Nẵng', totalUnits: 300 },
  { id: 'p4', name: 'Dự án Panoma', region: 'Đà Nẵng', totalUnits: 250 },
  { id: 'p5', name: 'Dự án Cosmo', region: 'Đà Nẵng', totalUnits: 180 },
  { id: 'p6', name: 'Dự án Ponte', region: 'Đà Nẵng', totalUnits: 220 },
  { id: 'p7', name: 'Dự án Symphony', region: 'Đà Nẵng', totalUnits: 350 },
  { id: 'p8', name: 'Dự án Hải Minh', region: 'Đà Nẵng', totalUnits: 150 },
];

export const MOCK_USERS: UserProfile[] = [
  { id: 'u1', username: 'admin', name: 'Hệ thống Admin', dept: 'ADMIN', email: 'admin@sunshine.vn', status: 'Active', assignedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'] },
  { id: 'u2', username: 'ptt_user', name: 'Nguyễn Thu Thủ Tục', dept: 'PTT', email: 'thutuc@sunshine.vn', status: 'Active', assignedProjectIds: ['p1', 'p2'] },
  { id: 'u3', username: 'kt_user', name: 'Trần Kế Toán', dept: 'KT', email: 'ketoan@sunshine.vn', status: 'Active', assignedProjectIds: ['p3', 'p4'] },
  { id: 'u4', username: 'ptda_user', name: 'Lê Phát Triển', dept: 'PTDA', email: 'ptda@sunshine.vn', status: 'Active', assignedProjectIds: ['p5', 'p6'] },
  { id: 'u5', username: 'manager', name: 'Phạm Trưởng Phòng', dept: 'MANAGER', email: 'manager@sunshine.vn', status: 'Active', assignedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'] },
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app1',
    unitCode: 'HX-A1-0501',
    projectName: 'Dự án Hòa Xuân',
    customerName: 'Nguyễn Văn A (Tự làm sổ)',
    phoneNumber: '0901234567',
    propertyType: 'Dat_Nen',
    loanStatus: 'Khong_Vay',
    isSelfService: true,
    contractSigningDate: '2026-03-10',
    submissionLocation: 'PHUONG',
    currentStep: 'GD1_ChuanBi',
    status: 'Processing',
    receivedDate: '2026-03-15',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h1', stepName: 'GĐ1: Đang chuẩn bị hồ sơ', dept: 'PTT', receivedDate: '2026-03-15' }],
    auditTrail: [
      { id: 'at1', userId: 'u1', userName: 'Admin', action: 'Khởi tạo hồ sơ', timestamp: '2026-03-15 08:00' },
      { id: 'at2', userId: 'u2', userName: 'Nguyễn Thu Thủ Tục', action: 'Cập nhật Ngày ký HĐCN', timestamp: '2026-03-15 09:30' }
    ]
  },
  {
    id: 'app2',
    unitCode: 'HQDN-C2-1210',
    projectName: 'Dự án Hòa Quý - Đồng Nò',
    customerName: 'Trần Thị B',
    phoneNumber: '0987654321',
    propertyType: 'Dat_Nen',
    loanStatus: 'Co_Vay',
    currentStep: 'GD3_Cho_TBThue',
    status: 'TaxPending',
    receivedDate: '2026-02-10',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h2', stepName: 'GĐ3: Chờ Thông báo thuế', dept: 'PTDA', receivedDate: '2026-02-15' }],
    auditTrail: [
      { id: 'at3', userId: 'u1', userName: 'Admin', action: 'Khởi tạo hồ sơ', timestamp: '2026-02-10 10:00' },
      { id: 'at4', userId: 'u3', userName: 'Trần Kế Toán', action: 'Chuyển giai đoạn sang PTDA', timestamp: '2026-02-15 14:00' }
    ]
  },
  {
    id: 'app3',
    unitCode: 'HQMR-S5-0220',
    projectName: 'Dự án Hòa Quý Mở rộng',
    customerName: 'Lê Văn C',
    phoneNumber: '0912334455',
    propertyType: 'Can_Ho',
    loanStatus: 'Khong_Vay',
    currentStep: 'GD6_Cho_BG_Khach',
    status: 'Completed',
    receivedDate: '2026-01-05',
    taxPaymentStatus: 'Paid',
    history: [{ id: 'h4', stepName: 'GĐ6: Đang bàn giao khách hàng', dept: 'PTT', receivedDate: '2026-03-15' }]
  },
  {
    id: 'app4',
    unitCode: 'HX-B2-0805',
    projectName: 'Dự án Hòa Xuân',
    customerName: 'Phạm Minh D',
    phoneNumber: '0944556677',
    propertyType: 'Can_Ho',
    loanStatus: 'Co_Vay',
    currentStep: 'GD2_Cho_Nop_VPDK',
    status: 'Error',
    receivedDate: '2026-02-01',
    taxPaymentStatus: 'Paid',
    history: [{ id: 'h6', stepName: 'Đang xử lý sai sót/vướng', dept: 'KT', receivedDate: '2026-02-20' }]
  },
  {
    id: 'app5',
    unitCode: 'PN-P1-0105',
    projectName: 'Dự án Panoma',
    customerName: 'Hoàng Văn E',
    phoneNumber: '0901112233',
    propertyType: 'Can_Ho',
    loanStatus: 'Khong_Vay',
    vpdkCode: 'PN-2026-001',
    currentStep: 'GD2_Cho_Nop_VPDK',
    status: 'Processing',
    receivedDate: '2026-03-01',
    submissionDate: '2026-03-05',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h7', stepName: 'GĐ2: Chờ nộp VPĐK', dept: 'KT', receivedDate: '2026-03-05' }]
  },
  {
    id: 'app6',
    unitCode: 'HM-L1-0022',
    projectName: 'Dự án Hải Minh',
    customerName: 'Nguyễn Hải M',
    phoneNumber: '0905998877',
    propertyType: 'Dat_Nen',
    loanStatus: 'Khong_Vay',
    currentStep: 'GD1_ChuanBi',
    status: 'Processing',
    receivedDate: '2026-04-15',
    taxPaymentStatus: 'Unpaid',
    history: [{ id: 'h10', stepName: 'GĐ1: Đang chuẩn bị hồ sơ', dept: 'PTT', receivedDate: '2026-04-15' }]
  }
];

export const STEP_CONFIG: Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number }> = {
  GD1_ChuanBi: { label: 'GĐ1: Đang chuẩn bị hồ sơ', dept: 'PTT', status: 'Processing', slaDays: 25 },
  GD1_Cho_KT_TiepNhan: { label: 'GĐ1: Chờ Kế toán tiếp nhận bàn giao', dept: 'KT', status: 'Processing' },
  GD2_Cho_Nop_VPDK: { label: 'GĐ2: Chờ nộp VPĐK', dept: 'KT', status: 'Processing', slaDays: 5 },
  GD2_Cho_PTDA_TiepNhan: { label: 'GĐ2: Chờ PTDA tiếp nhận (Theo dõi thuế)', dept: 'PTDA', status: 'Submitted' },
  GD3_Cho_TBThue: { label: 'GĐ3: Chờ Thông báo thuế', dept: 'PTDA', status: 'TaxPending', slaDays: 15 },
  GD4_Cho_Nop_NVTC: { label: 'GĐ4: Chờ hoàn thành NVTC', dept: 'PTT', status: 'TaxCompleted', slaDays: 10 },
  GD4_Cho_KT_TiepNhan_LaySo: { label: 'GĐ4: Chờ KT tiếp nhận (Lấy sổ)', dept: 'KT', status: 'TaxCompleted' },
  GD5_Cho_GCN: { label: 'GĐ5: Chờ nhận GCN thực tế', dept: 'KT', status: 'GCN_Issued', slaDays: 10 },
  GD5_Cho_PTT_TiepNhan_BG: { label: 'GĐ5: Chờ PTT tiếp nhận (Bàn giao khách)', dept: 'PTT', status: 'GCN_Issued' },
  GD6_Cho_BG_Khach: { label: 'GĐ6: Đang bàn giao khách hàng', dept: 'PTT', status: 'Completed' },
  Hoan_Tat: { label: 'Đã hoàn tất quy trình', dept: 'ADMIN', status: 'Completed' },
};
