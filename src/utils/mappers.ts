import { Application, UserProfile, UnitStatus, StepName, AppNotification } from '../types';
import { buildFlags } from './flagUtils';

export const mapNotificationToSnakeCase = (noti: Partial<AppNotification>) => {
  // record_id phải là bigint trong DB (xác nhận qua SQL) — ép kiểu về number
  // để tránh lỗi 23503 type mismatch khi Postgres nhận string thay vì bigint.
  // parseInt trả về NaN nếu appId không hợp lệ — dùng undefined để Postgres
  // nhận NULL thay vì báo lỗi cast.
  const recordId = noti.appId !== undefined && noti.appId !== null
    ? parseInt(String(noti.appId), 10)
    : undefined;

  return {
    user_id: noti.recipientId,
    title: noti.title,
    content: noti.message,
    created_at: noti.time || new Date().toISOString(),
    type: noti.type,
    is_read: noti.isRead || false,
    record_id: isNaN(recordId as number) ? undefined : recordId
  };
};

export const safeParse = (val: string | any, fallback: any) => {
  try {
    return typeof val === 'string' ? JSON.parse(val) : val ?? fallback;
  } catch {
    return fallback;
  }
};

export const mapFromSnakeCase = (item: Record<string, any>, oldApp?: any): Application => {
  if (!item) return {} as Application;

  const val = (snakeKey: string, camelKey: string): any => {
    return item[snakeKey] !== undefined ? item[snakeKey] : item[camelKey];
  };

  const normalizeLoanStatus = (loanVal: any): 'Co_Vay' | 'Khong_Vay' => {
    if (typeof loanVal !== 'string') {
      return loanVal === true ? 'Co_Vay' : 'Khong_Vay';
    }
    const l = loanVal.trim().toLowerCase().replace(/_/g, '').replace(/-/g, '');
    if (l === 'covay' || l === 'có vay' || l === 'có' || l === 'co' || l === 'yes' || l === 'true') {
      return 'Co_Vay';
    }
    return 'Khong_Vay';
  };

  const normalizeTaxPaymentStatus = (taxVal: any): 'Unpaid' | 'Paid' => {
    if (typeof taxVal !== 'string') {
      return taxVal === true ? 'Paid' : 'Unpaid';
    }
    const t = taxVal.trim().toLowerCase();
    if (t === 'paid' || t === 'đã nộp' || t === 'da nop' || t === 'yes' || t === 'true') {
      return 'Paid';
    }
    return 'Unpaid';
  };

  const str = (value: any): string => typeof value === 'string' ? value.trim() : (value ?? '');
  const num = (value: any): number | undefined => typeof value === 'number' ? value : (value ? Number(value) : undefined);
  const bool = (value: any): boolean => typeof value === 'boolean' ? value : (value === 'true' || value === 1 || value === '1' || value === 'YES' || value === 'Yes' || value === 'yes');

  const customerHandoverDate = str(val('customer_handover_date', 'customerHandoverDate'));
  const currentStepRaw = str(val('current_step', 'currentStep')) || str(val('status', 'status'));
  const currentStep: StepName = customerHandoverDate ? 'Hoan_Tat' : (currentStepRaw || 'S1_ChuanBi') as StepName;

  const status = (() => {
    if (customerHandoverDate) return 'Completed';
    const rawStatus = val('status', 'status');
    if (rawStatus) return rawStatus;
    return 'Processing';
  })();

  const mappedApp: Application = {
    id: val('id', 'id') !== undefined && val('id', 'id') !== null && val('id', 'id') !== '' ? val('id', 'id') : undefined,
    updatedAt: str(val('updated_at', 'updatedAt')),
    unitCode: str(val('unit_code', 'unitCode')),
    projectName: str(val('project_name', 'projectName')),
    workflowType: (() => {
      const dbVal = val('workflow_type', 'workflowType');
      if (dbVal === 'Quy_trinh_1' || dbVal === 'Quy_trinh_2') 
        return dbVal;
      if (currentStep?.startsWith('GD')) return 'Quy_trinh_1';
      if (currentStep?.startsWith('S')) return 'Quy_trinh_2';
      return 'Quy_trinh_1';
    })() as 'Quy_trinh_1' | 'Quy_trinh_2',
    customerName: str(val('customer_name', 'customerName')),
    contractSignerType: str(val('contract_signer_type', 'contractSignerType')),
    phoneNumber: str(val('phone_number', 'phoneNumber')),
    propertyType: val('property_type', 'propertyType'),
    loanStatus: normalizeLoanStatus(val('loan_status', 'loanStatus')),
    bankCommitmentDeadline: str(val('bank_commitment_deadline', 'bankCommitmentDeadline')),
    reportUpdateDate: str(val('report_update_date', 'reportUpdateDate')),
    contractSigningDate: str(val('contract_signing_date', 'contractSigningDate')),
    assignorGcnNumber: str(val('assignor_gcn_number', 'assignorGcnNumber')),
    assignorGcnDate: str(val('assignor_gcn_date', 'assignorGcnDate')),
    gcnNumber: str(val('gcn_number', 'gcnNumber')),
    isSelfService: bool(val('is_self_service', 'isSelfService')),
    submissionLocation: val('submission_location', 'submissionLocation'),
    vpdkCode: str(val('vpdk_code', 'vpdkCode')),
    currentStep,
    status: status as UnitStatus,
    receivedDate: str(val('received_date', 'receivedDate')),
    handoverApartmentDate: str(val('handover_apartment_date', 'handoverApartmentDate')),
    taxNotificationDate: str(val('tax_notification_date', 'taxNotificationDate')),
    taxNotificationReceivedDate: str(val('tax_notification_received_date', 'taxNotificationReceivedDate')),
    taxReceiptDate: str(val('tax_receipt_date', 'taxReceiptDate')),
    accountingHandoverDate: str(val('accounting_handover_date', 'accountingHandoverDate')),
    ktHandoverToPtdaDate: str(val('kt_handover_to_ptda_date', 'ktHandoverToPtdaDate')), // Ngày KT bàn giao cho PTDA (Quy trình 2)
    submissionDate: str(val('submission_date', 'submissionDate')),
    gcnReceivedDate: str(val('gcn_received_date', 'gcnReceivedDate')),
    ptdaHandoverDate: str(val('ptda_handover_date', 'ptdaHandoverDate')),
    customerHandoverDate,
    isHandedOver: bool(val('is_handed_over', 'isHandedOver')),
    handoverDate: str(val('handover_date', 'handoverDate')),
    taxNoticeProvisionDate: str(val('tax_notice_provision_date', 'taxNoticeProvisionDate')),
    gcnSignedDate: str(val('gcn_signed_date', 'gcnSignedDate')),
    
    // Ánh xạ chính xác cụm báo lỗi từ snake_case của DB về camelCase của App
    issueType: val('issue_type', 'issueType'),
    issueSeverity: val('issue_severity', 'issueSeverity'),
    issueNotes: str(val('issue_notes', 'issueNotes')),
    issueStatus: val('issue_status', 'issueStatus'),
    issueCreatedAt: str(val('issue_created_at', 'issueCreatedAt')),
    issueResolvedAt: str(val('issue_resolved_at', 'issueResolvedAt')),
    
    estimatedCompletionDate: str(val('estimated_completion_date', 'estimatedCompletionDate')),
    rejectionCount: num(val('rejection_count', 'rejectionCount')) ?? 0,
    isRejected: bool(val('is_rejected', 'isRejected')),
    rejectionReason: str(val('rejection_reason', 'rejectionReason')),
    commitmentDate: str(val('commitment_date', 'commitmentDate')),
    taxPaymentStatus: normalizeTaxPaymentStatus(val('tax_payment_status', 'taxPaymentStatus')),
    assignedToId: str(val('assigned_to_id', 'assignedToId')),
    assignedToName: str(val('assigned_to_name', 'assignedToName')),
    taxVpdkSubmissionDate: str(val('tax_vpdk_submission_date', 'taxVpdkSubmissionDate')),
    history: (() => {
      const dbVal = val('history', 'history');
      const parsed = dbVal !== undefined && dbVal !== null ? safeParse(dbVal, []) : [];
      if (parsed && parsed.length > 0) return parsed;
      if (oldApp && typeof oldApp === 'object' && oldApp.history && oldApp.history.length > 0) return oldApp.history;
      return [];
    })(),
    checklist: safeParse(val('checklist', 'checklist'), {}),
    scannedFiles: safeParse(val('scanned_files', 'scannedFiles'), []),
    auditTrail: (() => {
      const dbVal = val('audit_trail', 'auditTrail');
      const parsed = dbVal !== undefined && dbVal !== null ? safeParse(dbVal, []) : [];
      if (parsed && parsed.length > 0) return parsed;
      if (oldApp && typeof oldApp === 'object' && oldApp.auditTrail && oldApp.auditTrail.length > 0) return oldApp.auditTrail;
      return [];
    })(),
    hasError: bool(val('has_error', 'hasError')) || bool(val('hasError', 'hasError'))
  };
  mappedApp.flags = buildFlags(mappedApp);
  return mappedApp;
};

export const mapUserFromSnakeCase = (item: Record<string, any>): UserProfile => {
  return {
    id: item.id,
    username: item.username,
    password: item.password,
    name: item.name,
    dept: item.dept,
    permission: item.permission,
    assignedProjectIds: item.assigned_project_ids || [],
    email: item.email,
    phoneNumber: item.phone_number,
    status: item.status,
    isFirstLogin: typeof item.is_first_login === 'boolean' ? item.is_first_login : (item.password === '123456')
  };
};

const STATUS_TO_ID_MAP: Record<string, number> = {
  Processing: 1,
  WaitingVPDK: 2,
  Submitted: 3,
  TaxPending: 4,
  TaxCompleted: 5,
  TaxPaid: 6,
  WaitingHandover: 7,
  GCN_Issued: 8,
  Completed: 9,
  Error: 10,
  Draft: 11,
};

export const mapToSnakeCase = (app: Application): Record<string, any> => {
  const data: Record<string, any> = {
    unit_code: app.unitCode,
    project_name: app.projectName,
    customer_name: app.customerName,
    contract_signer_type: app.contractSignerType,
    phone_number: app.phoneNumber,
    property_type: app.propertyType,
    loan_status: app.loanStatus,
    bank_commitment_deadline: app.bankCommitmentDeadline,
    report_update_date: app.reportUpdateDate,
    contract_signing_date: app.contractSigningDate,
    assignor_gcn_number: app.assignorGcnNumber,
    assignor_gcn_date: app.assignorGcnDate,
    gcn_number: app.gcnNumber,
    is_self_service: app.isSelfService,
    submission_location: app.submissionLocation,
    vpdk_code: app.vpdkCode,
    current_step: app.currentStep,
    workflow_type: app.workflowType,
    status: app.status,
    status_id: STATUS_TO_ID_MAP[app.status] || 1,
    received_date: app.receivedDate,
    handover_apartment_date: app.handoverApartmentDate,
    tax_notification_date: app.taxNotificationDate,
    tax_notification_received_date: app.taxNotificationReceivedDate,
    tax_receipt_date: app.taxReceiptDate,
    accounting_handover_date: app.accountingHandoverDate,
    kt_handover_to_ptda_date: app.ktHandoverToPtdaDate, // Ngày KT bàn giao cho PTDA (Quy trình 2)
    submission_date: app.submissionDate,
    gcn_received_date: app.gcnReceivedDate,
    ptda_handover_date: app.ptdaHandoverDate,
    customer_handover_date: app.customerHandoverDate,
    is_handed_over: app.isHandedOver,
    handover_date: app.handoverDate,
    tax_notice_provision_date: app.taxNoticeProvisionDate,
    gcn_signed_date: app.gcnSignedDate,
    
    // Ánh xạ chính xác từ biến camelCase của App sang tên cột snake_case của DB khi lưu
    issue_type: app.issueType,
    issue_severity: app.issueSeverity,
    issue_notes: app.issueNotes,
    issue_status: app.issueStatus,
    issue_created_at: app.issueCreatedAt,
    issue_resolved_at: app.issueResolvedAt,
    
    estimated_completion_date: app.estimatedCompletionDate,
    rejection_count: app.rejectionCount,
    is_rejected: app.isRejected,
    rejection_reason: app.rejectionReason,
    commitment_date: app.commitmentDate,
    has_error: app.hasError,
    tax_payment_status: app.taxPaymentStatus,
    assigned_to_id: app.assignedToId,
    assigned_to_name: app.assignedToName,
    tax_vpdk_submission_date: app.taxVpdkSubmissionDate,
    updated_at: new Date().toISOString()
  };

  // Only include heavy/JSON fields if they are explicitly present to avoid overwriting rich data with empty snapshots during lazy loading updates
  if (app.history !== undefined) data.history = app.history;
  if (app.checklist !== undefined && Object.keys(app.checklist).length > 0) data.checklist = app.checklist;
  if (app.scannedFiles !== undefined && app.scannedFiles.length > 0) data.scanned_files = app.scannedFiles;
  if (app.auditTrail !== undefined) data.audit_trail = app.auditTrail;

  Object.keys(data).forEach(key => {
    const isDateField = key.endsWith('_date') || 
                        key.endsWith('_deadline') || 
                        key.endsWith('_at') || 
                        key.includes('date') || 
                        key.includes('deadline');
    if (isDateField && (data[key] === '' || data[key] === 'null')) {
      data[key] = null;
    }
  });

  if (app.id && !app.id.toString().includes('-imp-')) {
    data.id = app.id;
  }

  return data;
};

export const mapUserToSnakeCase = (user: UserProfile): Record<string, any> => {
  return {
    username: user.username,
    password: user.password,
    name: user.name,
    dept: user.dept,
    permission: user.permission,
    assigned_project_ids: user.assignedProjectIds || [],
    email: user.email,
    phone_number: user.phoneNumber,
    status: user.status,
    is_first_login: user.isFirstLogin
  };
};