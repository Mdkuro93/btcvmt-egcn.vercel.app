import { Application, UserProfile, UnitStatus, StepName } from '../types';
import { STEP_CONFIG as INITIAL_STEP_CONFIG } from '../constants';
import { buildFlags } from './flagUtils';

export const safeParse = (val: string | any, fallback: any) => {
  try {
    return typeof val === 'string' ? JSON.parse(val) : val ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Maps a database record (snake_case) to an Application object (camelCase).
 * @param item Record from Supabase.
 * @returns Application object.
 */
export const mapFromSnakeCase = (item: Record<string, any>): Application => {
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
    id: str(val('id', 'id')),
    unitCode: str(val('unit_code', 'unitCode')),
    projectName: str(val('project_name', 'projectName')),
    workflowType: (currentStep?.startsWith('GD') || (typeof val('status_id', 'statusId') === 'string' && (val('status_id', 'statusId') as string).startsWith('GD')) ? 'Quy_trinh_1' : 'Quy_trinh_2'),
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
    isSelfService: bool(val('is_self_service', 'isSelfService')),
    submissionLocation: val('submission_location', 'submissionLocation'),
    vpdkCode: str(val('vpdk_code', 'vpdkCode')),
    currentStep,
    status: status as UnitStatus,
    receivedDate: str(val('received_date', 'receivedDate')),
    taxNotificationDate: str(val('tax_notification_date', 'taxNotificationDate')),
    taxNotificationReceivedDate: str(val('tax_notification_received_date', 'taxNotificationReceivedDate')),
    taxReceiptDate: str(val('tax_receipt_date', 'taxReceiptDate')),
    accountingHandoverDate: str(val('accounting_handover_date', 'accountingHandoverDate')),
    submissionDate: str(val('submission_date', 'submissionDate')),
    gcnReceivedDate: str(val('gcn_received_date', 'gcnReceivedDate')),
    ptdaHandoverDate: str(val('ptda_handover_date', 'ptdaHandoverDate')),
    customerHandoverDate,
    isHandedOver: bool(val('is_handed_over', 'isHandedOver')),
    handoverDate: str(val('handover_date', 'handoverDate')),
    taxNoticeProvisionDate: str(val('tax_notice_provision_date', 'taxNoticeProvisionDate')),
    gcnSignedDate: str(val('gcn_signed_date', 'gcnSignedDate')),
    issueType: val('issue_type', 'issueType'),
    issueSeverity: val('issue_severity', 'issueSeverity'),
    issueNotes: str(val('issue_notes', 'issueNotes')),
    estimatedCompletionDate: str(val('estimated_completion_date', 'estimatedCompletionDate')),
    rejectionCount: num(val('rejection_count', 'rejectionCount')) ?? 0,
    isRejected: bool(val('is_rejected', 'isRejected')),
    rejectionReason: str(val('rejection_reason', 'rejectionReason')),
    commitmentDate: str(val('commitment_date', 'commitmentDate')),
    taxPaymentStatus: normalizeTaxPaymentStatus(val('tax_payment_status', 'taxPaymentStatus')),
    history: safeParse(val('history', 'history'), []),
    checklist: safeParse(val('checklist', 'checklist'), {}),
    scannedFiles: safeParse(val('scanned_files', 'scannedFiles'), []),
    auditTrail: safeParse(val('audit_trail', 'auditTrail'), [])
  };
  mappedApp.flags = buildFlags(mappedApp);
  return mappedApp;
};

/**
 * Maps a database record (snake_case) to a UserProfile object (camelCase).
 * @param item User record from Supabase.
 * @returns UserProfile object.
 */
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
    status: item.status
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

/**
 * Maps an Application object (camelCase) to a database record (snake_case).
 * @param app Application object.
 * @returns Record for Supabase.
 */
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
    is_self_service: app.isSelfService,
    submission_location: app.submissionLocation,
    vpdk_code: app.vpdkCode,
    current_step: app.currentStep,
    status: app.status,
    status_id: STATUS_TO_ID_MAP[app.status] || 1,
    received_date: app.receivedDate,
    tax_notification_date: app.taxNotificationDate,
    tax_notification_received_date: app.taxNotificationReceivedDate,
    tax_receipt_date: app.taxReceiptDate,
    accounting_handover_date: app.accountingHandoverDate,
    submission_date: app.submissionDate,
    gcn_received_date: app.gcnReceivedDate,
    ptda_handover_date: app.ptdaHandoverDate,
    customer_handover_date: app.customerHandoverDate,
    is_handed_over: app.isHandedOver,
    handover_date: app.handoverDate,
    tax_notice_provision_date: app.taxNoticeProvisionDate,
    gcn_signed_date: app.gcnSignedDate,
    issue_type: app.issueType,
    issue_severity: app.issueSeverity,
    issue_notes: app.issueNotes,
    estimated_completion_date: app.estimatedCompletionDate,
    rejection_count: app.rejectionCount,
    is_rejected: app.isRejected,
    rejection_reason: app.rejectionReason,
    commitment_date: app.commitmentDate,
    tax_payment_status: app.taxPaymentStatus,
    history: app.history || [],
    checklist: app.checklist || {},
    scanned_files: app.scannedFiles || [],
    audit_trail: app.auditTrail || [],
    updated_at: new Date().toISOString()
  };

  if ((app as any).issue_status !== undefined) data.issue_status = (app as any).issue_status;
  if ((app as any).issue_created_at !== undefined) data.issue_created_at = (app as any).issue_created_at;

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

/**
 * Maps a UserProfile object (camelCase) to a database record (snake_case).
 * @param user UserProfile object.
 * @returns Record for Supabase.
 */
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
    status: user.status
  };
};
