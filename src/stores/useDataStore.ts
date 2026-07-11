import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Application, Project, UserProfile, AppNotification, Dept, ApplicationStepHistory, AuditTrailEntry, IssueType, IssueSeverity, StepName } from '../types';
import { mapFromSnakeCase, safeParse, mapToSnakeCase, mapNotificationToSnakeCase, mapUserToSnakeCase, mapUserFromSnakeCase } from '../utils/mappers';
import { STEP_CONFIG as INITIAL_STEP_CONFIG, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS } from '../constants';
import { useAuthStore } from './useAuthStore';
import { useModalStore } from './useModalStore';
import { WorkflowEngine } from '../utils/workflowEngine';
import { validateDateSequence, generateUUID } from '../utils/appUtils';

export const createAuditEntry = (action: string, isBulk: boolean, count: number, unitCode: string, detail?: string): AuditTrailEntry => {
  const { currentUser } = useAuthStore.getState();
  const mode = isBulk ? '[Hàng loạt]' : '[Thủ công]';
  return {
    id: generateUUID(),
    userId: currentUser?.id || 'admin',
    userName: currentUser?.name || 'Admin',
    timestamp: new Date().toISOString(),
    action: `${mode} ${action}`,
    changes: detail || (isBulk ? `Xử lý đồng thời ${count} hồ sơ` : `Cập nhật hồ sơ ${unitCode}`)
  };
};

export const updateAppIssue = (
  app: Application,
  note: string,
  type: IssueType = 'Sai sót Khác',
  severity: IssueSeverity = 'Moderate'
): Application => {
  const { currentUser } = useAuthStore.getState();
  const nowStr = new Date().toISOString();

  const historyEntry: ApplicationStepHistory = {
    id: generateUUID(),
    stepName: `Ghi nhận vướng mắc: ${type}`,
    dept: (currentUser?.dept as Dept) || 'PTT',
    receivedDate: nowStr,
    note: `Loại: ${type} | Mức độ: ${severity} | Ghi chú: ${note}`,
    performedBy: currentUser?.id,
    performedByName: currentUser?.name || 'Hệ thống'
  };

  const auditEntry = createAuditEntry('Ghi nhận vướng mắc', false, 1, app.unitCode,
    `Loại: ${type}. Ghi chú: ${note}`);

  return {
    ...app,
    status: 'Error' as const,
    issueNotes: note,
    issueType: type,
    issueSeverity: severity,
    issueStatus: 'OPEN',
    issueCreatedAt: nowStr,
    history: [historyEntry, ...(app.history || [])],
    auditTrail: [auditEntry, ...(app.auditTrail || [])]
  };
};

export const RECORD_LIGHT_SELECT = 'id, unit_code, project_name, customer_name, contract_signer_type, phone_number, property_type, loan_status, is_self_service, current_step, status, received_date, contract_signing_date, submission_date, tax_notification_date, tax_receipt_date, gcn_signed_date, gcn_received_date, customer_handover_date, accounting_handover_date, ptda_handover_date, bank_commitment_deadline, submission_location, vpdk_code, issue_type, issue_severity, issue_notes, is_rejected, workflow_type, created_at, assigned_to, tax_payment_status, scanned_files, rejection_count, rejection_reason, commitment_date, assigned_to_id, assigned_to_name, tax_vpdk_submission_date, gcn_number, kt_handover_to_ptda_date, tax_notification_received_date, tax_notice_provision_date, handover_apartment_date, is_priority, priority_reason';

// Module-level thay vì useRef — Zustand không phải React component nên không dùng hook.
// selfUpdateIds lưu các id vừa được chính client này cập nhật để Realtime listener
// nhận diện và bỏ qua, tránh echo lại thay đổi của chính mình.
const selfUpdateIds = new Set<number>();

export const registerSelfUpdate = (idOrIds: (number | string) | (number | string)[]) => {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  ids.forEach(id => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (!isNaN(numericId)) {
      selfUpdateIds.add(numericId);
      setTimeout(() => {
        selfUpdateIds.delete(numericId);
      }, 5000);
    }
  });
};

export const isSelfUpdate = (id: number | string): boolean => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return false;
  return selfUpdateIds.has(numericId);
};

export async function fetchRecordDetail(recordId: string | number, unitCode?: string): Promise<{
  history: ApplicationStepHistory[];
  auditTrail: AuditTrailEntry[];
  fullApp?: Partial<Application>;
}> {
  const result: {
    history: ApplicationStepHistory[];
    auditTrail: AuditTrailEntry[];
    fullApp?: Partial<Application>;
  } = { history: [], auditTrail: [] };

  const targetId = String(recordId);
  const isNumeric = (str: string) => /^\d+$/.test(str);

  try {
    let query = supabase
      .from('record_history')
      .select('*');
      
    if (unitCode && isNumeric(unitCode) && isNumeric(targetId)) {
      query = query.or(`record_id.eq.${targetId},record_id.eq.${unitCode}`);
    } else if (isNumeric(targetId)) {
      query = query.eq('record_id', parseInt(targetId, 10));
    } else {
      query = query.eq('record_id', -1);
    }
    
    const { data: historyData, error: historyError } = await query
      .order('received_date', { ascending: false })
      .order('id', { ascending: false });
    
    if (!historyError && historyData && historyData.length > 0) {
      result.history = historyData.map((h: any) => ({
        id: h.id,
        stepName: h.step_name,
        dept: h.dept,
        receivedDate: h.received_date,
        completedDate: h.completed_date,
        note: h.note,
        performedBy: h.performed_by,
        performedByName: h.performed_by_name,
        status: h.status,
      }));
    } else if (historyError) {
      // Suppress red error overlay in dev by using console.warn instead of console.error
      console.warn('[fetchRecordDetail] Lỗi khi tải lịch sử hồ sơ:', historyError);
    }
  } catch (err) {
    console.warn('[fetchRecordDetail] Full failure fetching history:', err);
  }

  try {
    let auditQuery = supabase
      .from('record_audit_trail')
      .select('*');
      
    if (unitCode && isNumeric(unitCode) && isNumeric(targetId)) {
      auditQuery = auditQuery.or(`record_id.eq.${targetId},record_id.eq.${unitCode}`);
    } else if (isNumeric(targetId)) {
      auditQuery = auditQuery.eq('record_id', parseInt(targetId, 10));
    } else {
      auditQuery = auditQuery.eq('record_id', -1);
    }
    
    const { data: auditData, error: auditError } = await auditQuery
      .order('timestamp', { ascending: false });
    
    if (!auditError && auditData && auditData.length > 0) {
      result.auditTrail = auditData.map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        userName: a.user_name,
        action: a.action,
        changes: a.changes,
        timestamp: a.timestamp,
      }));
    } else if (auditError) {
      console.warn('[fetchRecordDetail] Lỗi tải audit trail:', auditError);
    }
  } catch (err) {
    console.warn('[fetchRecordDetail] Full failure fetching auditTrail:', err);
  }

  try {
    const res = await supabase
      .from('records')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();
    
    if (res.data) {
      result.fullApp = mapFromSnakeCase(res.data);
    }
  } catch (err) {
    console.warn('Failed to fetch fullApp:', err);
  }

  return result;
}

export async function syncRecordToSupabase(app: Application) {
  const snakeData = mapToSnakeCase(app);
  const { data, error } = await supabase.from('records').upsert(snakeData).select(RECORD_LIGHT_SELECT);
  if (error) throw error;
  let savedApp = app;
  if (data && data.length > 0) {
    savedApp = mapFromSnakeCase(data[0]);
  }

  if (app.history && app.history.length > 0) {
    const historyPromises = app.history.map(h => {
      if (!h.id) return Promise.resolve();
      return supabase.from('record_history').upsert({
        id: h.id,
        record_id: savedApp.id,
        step_name: h.stepName,
        dept: h.dept,
        received_date: h.receivedDate,
        completed_date: h.completedDate || null,
        note: h.note || '',
        performed_by: h.performedBy || null,
        performed_by_name: h.performedByName || null,
      }, { onConflict: 'id' });
    });
const hResults = await Promise.allSettled(historyPromises);
    hResults.forEach(r => {
      if (r.status === 'rejected') console.warn('[syncRecord] Lỗi ghi history:', r.reason);
      if (r.status === 'fulfilled' && (r.value as any)?.error) console.warn('[syncRecord] Lỗi upsert history:', (r.value as any).error);
    });
  }

  if (app.auditTrail && app.auditTrail.length > 0) {
    const auditPromises = app.auditTrail.map(a => {
      if (!a.id) return Promise.resolve(null);
      return supabase.from('record_audit_trail').upsert({
        id: a.id,
        record_id: savedApp.id,
        user_id: a.userId,
        user_name: a.userName,
        action: a.action,
        changes: a.changes || '',
        timestamp: a.timestamp,
      }, { onConflict: 'id' });
    });
    const aResults = await Promise.allSettled(auditPromises);
    aResults.forEach(r => {
      if (r.status === 'rejected') console.warn('[syncRecord] Lỗi ghi auditTrail:', r.reason);
      if (r.status === 'fulfilled' && (r.value as any)?.error) console.warn('[syncRecord] Lỗi upsert auditTrail:', (r.value as any).error);
    });
  }

  if (savedApp.id) {
    try {
      const detail = await fetchRecordDetail(savedApp.id, savedApp.unitCode);
      savedApp.history = detail.history;
      savedApp.auditTrail = detail.auditTrail;
    } catch (err) {
      console.warn('Could not fetch record details in sync, using in-memory values:', err);
      savedApp.history = app.history || [];
      savedApp.auditTrail = app.auditTrail || [];
    }
  } else {
    savedApp.history = app.history || [];
    savedApp.auditTrail = app.auditTrail || [];
  }

  return savedApp;
}

export const bulkSyncRecordsToSupabase = async (appsToSync: Application[], allApplications: Application[], showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
  if (appsToSync.length === 0) return allApplications;
  try {
    const uniqueProjects = Array.from(new Set(appsToSync.map(a => a.projectName).filter(Boolean)));
    const uniqueUnitCodes = Array.from(new Set(appsToSync.map(a => a.unitCode).filter(Boolean)));

    let existingDbRecords: any[] = [];
    if (uniqueProjects.length > 0 && uniqueUnitCodes.length > 0) {
      const { data: dbData, error: dbErr } = await supabase
        .from('records')
        .select('id, unit_code, project_name, history, audit_trail')
        .in('project_name', uniqueProjects)
        .in('unit_code', uniqueUnitCodes);
      
      if (!dbErr && dbData) {
        existingDbRecords = dbData;
      } else if (dbErr) {
        console.error('Lỗi khi truy vấn trùng lặp trong database:', dbErr);
      }
    }

    if (existingDbRecords.length > 0) {
      appsToSync.forEach(app => {
        const matchingDb = existingDbRecords.find(db => 
          String(db.unit_code || '').toLowerCase() === String(app.unitCode || '').toLowerCase() &&
          String(db.project_name || '').toLowerCase() === String(app.projectName || '').toLowerCase()
        );
        if (matchingDb) {
          const mappedDb = mapFromSnakeCase(matchingDb);
          app.id = mappedDb.id;
          app.history = mappedDb.history || [];
          app.auditTrail = mappedDb.auditTrail || [];
        }
      });
    }

    const recordsToInsert: any[] = appsToSync
      .filter(a => !a.id || (typeof a.id === 'string' && a.id.includes('-imp-')))
      .map(app => {
        const snakeObj = mapToSnakeCase(app);
        delete snakeObj.id; // Ensure id is NOT sent for insert
        return snakeObj;
      });

    const recordsToUpdate: any[] = appsToSync
      .filter(a => a.id && !a.id.toString().includes('-imp-'))
      .map(app => mapToSnakeCase(app));

    let insertedData: any[] = [];
    if (recordsToInsert.length > 0) {
      const { data: insertResult, error: insertError } = await supabase
        .from('records')
        .insert(recordsToInsert)
        .select(RECORD_LIGHT_SELECT);
      if (insertError) throw insertError;
      insertedData = insertResult || [];
    }

    let updatedData: any[] = [];
    if (recordsToUpdate.length > 0) {
      const { data: upsertResult, error: updateError } = await supabase
        .from('records')
        .upsert(recordsToUpdate, { onConflict: 'id' })
        .select(RECORD_LIGHT_SELECT);
      if (updateError) throw updateError;
      updatedData = upsertResult || recordsToUpdate; // fallback về local nếu select không trả data
    }
    
    const allReturnedData = [...insertedData, ...updatedData];
    const updatedAppsLocal = [...allApplications];

    // ✅ FIX: Lỗi 1 - Ghi nhận history và audit trail cho tất cả bản ghi trong bulk sync
    const historyPromises: any[] = [];
    const auditPromises: any[] = [];

    if (allReturnedData.length > 0) {
      allReturnedData.forEach(item => {
        const returnedApp = mapFromSnakeCase(item);
        
        // Find existing app by unitCode if it was a new record
        const originalInput = appsToSync.find(a => 
          (a.id?.toString() === returnedApp.id?.toString()) || 
          (a.unitCode === returnedApp.unitCode && a.projectName === returnedApp.projectName)
        );

        // Preserve history and auditTrail from in-memory state if DB returned empty
        // Since we don't select them in LIGHT_SELECT and they are separate tables anyway
        if (originalInput) {
           returnedApp.history = (returnedApp.history && returnedApp.history.length > 0) ? returnedApp.history : (originalInput.history || []);
           returnedApp.auditTrail = (returnedApp.auditTrail && returnedApp.auditTrail.length > 0) ? returnedApp.auditTrail : (originalInput.auditTrail || []);
        }

        // Add history and audit trail promises
        if (originalInput) {
          if (originalInput.history && originalInput.history.length > 0) {
            originalInput.history.forEach(h => {
              if (h.id) {
                historyPromises.push(
                  supabase.from('record_history').upsert({
                    id: h.id,
                    record_id: returnedApp.id,
                    step_name: h.stepName,
                    dept: h.dept,
                    received_date: h.receivedDate,
                    completed_date: h.completedDate || null,
                    note: h.note || '',
                    performed_by: h.performedBy || null,
                    performed_by_name: h.performedByName || null,
                  }, { onConflict: 'id' })
                );
              }
            });
          }

          if (originalInput.auditTrail && originalInput.auditTrail.length > 0) {
            originalInput.auditTrail.forEach(a => {
              if (a.id) {
                auditPromises.push(
                  supabase.from('record_audit_trail').upsert({
                    id: a.id,
                    record_id: returnedApp.id,
                    user_id: a.userId,
                    user_name: a.userName,
                    action: a.action,
                    changes: a.changes || '',
                    timestamp: a.timestamp,
                  }, { onConflict: 'id' })
                );
              }
            });
          }
        }

        const idx = updatedAppsLocal.findIndex(a => 
          (a.id === returnedApp.id) || 
          (a.unitCode === returnedApp.unitCode && a.projectName === returnedApp.projectName && a.id?.toString().includes('-imp-'))
        );
        
        if (idx !== -1) {
          updatedAppsLocal[idx] = returnedApp;
        } else {
          updatedAppsLocal.push(returnedApp);
        }
      });

      // Write in parallel with soft catching of errors via console.warn
      try {
        if (historyPromises.length > 0) {
          const res = await Promise.all(historyPromises);
          res.forEach(r => {
            if (r.error) console.warn('Lỗi phụ khi ghi history trong bulk sync:', r.error);
          });
        }
      } catch (err) {
        console.warn('Lỗi ngoại lệ khi ghi history trong bulk sync:', err);
      }

      try {
        if (auditPromises.length > 0) {
          const res = await Promise.all(auditPromises);
          res.forEach(r => {
            if (r.error) console.warn('Lỗi phụ khi ghi audit trail trong bulk sync:', r.error);
          });
        }
      } catch (err) {
        console.warn('Lỗi ngoại lệ khi ghi audit trail trong bulk sync:', err);
      }
    }
    return updatedAppsLocal;
  } catch (error) {
    console.error('Lỗi nghiêm trọng trong quá trình bulk sync:', error);
    if (showToast) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    }
    throw error;
  }
};

const mapNotificationFromSnakeCase = (item: any): AppNotification => ({
  id: item.id,
  recipientId: item.user_id,
  title: item.title,
  message: item.content,
  time: item.created_at,
  type: item.type,
  isRead: item.is_read || false,
  appId: item.record_id
});

const DOC_CHECKLIST_ITEMS = [
  'Đơn đăng ký biến động đất đai',
  'Hợp đồng chuyển nhượng',
  'Văn bản về việc nhà ở, công trình nghiệm thu đưa vào sử dụng (áp dụng cho căn hộ)',
  'Văn bản về việc đủ điều kiện chuyển nhượng (áp dụng cho căn hộ, nhà ở hình thành tương lai)',
  'Bản chính tờ khai lệ phí trước bạ',
  'Hóa đơn bán ra',
  'Giấy nộp tiền thuế GTGT, TNDN vãng lai',
  'Giấy nộp tiền thuế phi nông nghiệp',
  'Cam kết vệ sinh môi trường',
  'Biên bản họp HĐTV/HĐQT',
  'Nghị quyết HĐTV/HĐQT',
  'Đăng ký kinh doanh + Ngành kề kinh doanh bất động sản',
  'Tờ khai sử dụng đất PNN'
];

interface DataState {
  applications: Application[];
  dashboardApps: Application[];
  projects: Project[];
  users: UserProfile[];
  notifications: AppNotification[];
  taskReminders: AppNotification[];
  
  stepConfig: Record<string, any>;
  slaConfig: Record<string, number>;
  checklistTemplates: string[];
  handoverTemplate: any;

  isLoadingApps: boolean;
  isLoadingDashboard: boolean;
  isLoadingConfig: boolean;
  isInitialLoading: boolean;
  isAuthLoading: boolean;

  setApplications: (updater: Application[] | ((prev: Application[]) => Application[])) => void;
  setDashboardApps: (updater: Application[] | ((prev: Application[]) => Application[])) => void;
  setProjects: (projects: Project[]) => void;
  setUsers: (updater: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => void;
  setNotifications: (updater: AppNotification[] | ((prev: AppNotification[]) => AppNotification[])) => void;
  setTaskReminders: (taskReminders: AppNotification[]) => void;

  setStepConfig: (config: Record<string, any>) => void;
  setSlaConfig: (config: Record<string, number>) => void;
  setChecklistTemplates: (templates: string[]) => void;
  setHandoverTemplate: (template: any) => void;

  setIsLoadingApps: (loading: boolean) => void;
  setIsLoadingDashboard: (loading: boolean) => void;
  setIsLoadingConfig: (loading: boolean) => void;
  setIsInitialLoading: (loading: boolean) => void;
  setIsAuthLoading: (loading: boolean) => void;

  fetchInitialData: (showToast: (msg: string, type: 'error' | 'success' | 'warning' | 'info') => void) => Promise<void>;
  syncRecord: (app: Application) => Promise<Application>;
  bulkSync: (appsToSync: Application[], allApplications: Application[]) => Promise<Application[]>;

  reportIssue: (
    apps: Application[],
    issueType: string,
    issueSeverity: string,
    issueNote: string
  ) => Promise<{ success: boolean; message: string }>;
  resolveIssue: (appId: string) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  resolveError: (app: Application) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  bulkResolveIssues: (selectedIds: Set<string | number>) => Promise<{ success: boolean; message: string }>;
  proposeException: (appId: string, reason: string) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  approveException: (appId: string, notes: string) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  stepTransition: (
    app: Application,
    nextStep: StepName,
    note: string | undefined,
    deleteAllNotificationsForRecord: (recordId: string | number) => Promise<void>,
    skipJustificationCheck?: boolean
  ) => Promise<{ success: boolean; message: string; type?: 'error' | 'warning'; requiresHandoverDate?: boolean; finalApp?: Application; warningMessage?: string | null; requiresJustification?: boolean; missingFields?: string[] }>;
  
  rejectApp: (
    app: Application,
    targetStepId: StepName,
    reason: string,
    createNotification: (noti: Partial<AppNotification>) => Promise<void>
  ) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  
  bulkRejectApps: (
    selectedIds: (string | number)[],
    targetStepId: StepName,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;

  executeBulkStepTransition: (
    selectedAppIds: (string | number)[],
    nextStep: StepName,
    dateValue: string | null,
    bulkTransitionField: { key: string; label: string; isRequired?: boolean } | null,
    location: string | undefined,
    refCode: string | undefined,
    ktHandoverDate: string | undefined,
    bulkNotifyNextDepartment: (appsToSync: Application[], targetStep: StepName) => Promise<{ success: boolean; skippedCount: number; error?: any } | undefined>,
    bulkDeleteNotificationsForRecords: (recordIds: (string | number)[]) => Promise<void>
  ) => Promise<{
    success: boolean;
    message: string;
    type?: 'error' | 'warning' | 'success';
    actuallyUpdatedCount?: number;
    chronoWarnings?: string[];
    notifyResult?: { success: boolean; skippedCount: number } | undefined;
    finalApps?: Application[];
    errors?: string[];
    totalSelected?: number;
    updatedCount?: number;
  }>;

  createApp: (
    newApp: Partial<Application>
  ) => Promise<{ success: boolean; message: string; app?: Application }>;

  updateApp: (
    app: Application
  ) => Promise<{ success: boolean; message: string; finalApp?: Application }>;

  togglePriority: (
    appId: string | number,
    isPriority: boolean,
    reason: string
  ) => Promise<{ success: boolean; message: string; finalApp?: Application }>;

  bulkTogglePriority: (
    appIds: (string | number)[],
    isPriority: boolean,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;

  deleteApp: (
    id: string,
    code: string,
    cleanupFilesForRecords: (ids: (string | number)[]) => Promise<void>
  ) => Promise<{ success: boolean; message: string }>;

  quickSave: (
    id: string,
    quickEditData: Record<string, any>
  ) => Promise<{ success: boolean; message: string; finalApp?: Application }>;

  createUser: (
    userData: Partial<UserProfile>
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;

  updateUser: (
    user: UserProfile
  ) => Promise<{ success: boolean; message: string }>;

  deleteUser: (
    id: string
  ) => Promise<{ success: boolean; message: string }>;

  resetUserPassword: (
    userId: string,
    username: string
  ) => Promise<{ success: boolean; message: string }>;

  updatePassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
}

export const useDataStore = create<DataState>((set, get) => ({
  applications: [],
  dashboardApps: [],
  projects: [],
  users: [],
  notifications: [],
  taskReminders: [],
  
  stepConfig: INITIAL_STEP_CONFIG,
  slaConfig: {},
  checklistTemplates: [],
  handoverTemplate: {
    companyName: 'TẬP ĐOÀN SUNGROUP',
    title: 'BIÊN BẢN BÀN GIAO HỒ SƠ',
    subTitle: 'Dự án / Địa điểm',
    subTitle2: 'Nội dung bàn giao',
    docCode: 'BM-XXX',
    address: 'Địa chỉ...',
    footerNote1: 'Ghi chú 1',
    footerNote2: 'Ghi chú 2'
  },

  isLoadingApps: true,
  isLoadingDashboard: false,
  isLoadingConfig: true,
  isInitialLoading: true,
  isAuthLoading: true,

  setApplications: (updater) => set((state) => ({ applications: typeof updater === 'function' ? updater(state.applications) : updater })),
  setDashboardApps: (updater) => set((state) => ({ dashboardApps: typeof updater === 'function' ? updater(state.dashboardApps) : updater })),
  setProjects: (projects) => set({ projects }),
  setUsers: (updater) => set((state) => ({ users: typeof updater === 'function' ? updater(state.users) : updater })),
  setNotifications: (updater) => set((state) => ({ notifications: typeof updater === 'function' ? updater(state.notifications) : updater })),
  setTaskReminders: (taskReminders) => set({ taskReminders }),

  setStepConfig: (stepConfig) => set({ stepConfig }),
  setSlaConfig: (slaConfig) => set({ slaConfig }),
  setChecklistTemplates: (checklistTemplates) => set({ checklistTemplates }),
  setHandoverTemplate: (handoverTemplate) => set({ handoverTemplate }),

  setIsLoadingApps: (isLoadingApps) => set({ isLoadingApps }),
  setIsLoadingDashboard: (isLoadingDashboard) => set({ isLoadingDashboard }),
  setIsLoadingConfig: (isLoadingConfig) => set({ isLoadingConfig }),
  setIsInitialLoading: (isInitialLoading) => set({ isInitialLoading }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  fetchInitialData: async (showToast) => {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        set({ isInitialLoading: false, isLoadingApps: false, isLoadingConfig: false });
        showToast('⚠️ Tải dữ liệu quá lâu. Kiểm tra kết nối.', 'error');
        reject(new Error('TIMEOUT'));
      }, 15000);
    });

    set({ isInitialLoading: true, isLoadingApps: true, isLoadingConfig: true });
    
    try {
      const fetchPromise = Promise.allSettled([
        supabase.from('users').select('*'),
        supabase.from('system_configs').select('*')
      ]);

      const responses = await Promise.race([fetchPromise, timeoutPromise]) as PromiseSettledResult<{data: any, error: any}>[];
      clearTimeout(timeoutId);

      const usersRes = responses[0].status === 'fulfilled' ? responses[0].value : { data: null, error: (responses[0] as any).reason };
      const configRes = responses[1].status === 'fulfilled' ? responses[1].value : { data: null, error: (responses[1] as any).reason };

      if (usersRes.error) console.error('Error fetching users:', usersRes.error);
      if (configRes.error) console.error('Error fetching config:', configRes.error);

      // Process Configs 
      const configMap: any = {};
      if (configRes.data && configRes.data.length > 0) {
        configRes.data.forEach((c: any) => {
          configMap[c.key] = safeParse(c.value, c.value);
        });
      }
        
      if (configRes.data) {
        const defaultSla = Object.values(INITIAL_STEP_CONFIG).reduce((acc: any, s: any) => ({ ...acc, [s.label]: s.slaDays || 10 }), {});
        const currentSla = configMap.slaConfig || defaultSla;
        const currentChecklist = configMap.checklistTemplates || DOC_CHECKLIST_ITEMS;
        const currentSteps = { ...INITIAL_STEP_CONFIG, ...(configMap.stepConfig || {}) };
        const currentHandover = configMap.handoverTemplate || {
          companyName: 'TẬP ĐOÀN SUNGROUP',
          title: 'BIÊN BẢN BÀN GIAO HỒ SƠ',
          subTitle: 'Dự án / Địa điểm',
          subTitle2: 'Nội dung bàn giao',
          docCode: 'BM-XXX',
          address: 'Địa chỉ...',
          footerNote1: 'Ghi chú 1',
          footerNote2: 'Ghi chú 2'
        };
        
        if (currentHandover.companyName === 'CÔNG TY CỔ PHẦN ĐẦU TƯ LIÊN CHIỂU') {
          currentHandover.companyName = 'TẬP ĐOÀN SUNGROUP';
        }

        set({
          slaConfig: currentSla,
          checklistTemplates: currentChecklist,
          stepConfig: currentSteps,
          handoverTemplate: currentHandover
        });
      }

      if (usersRes.data) {
        set({
           users: usersRes.data.map((u: any) => ({
             id: u.id,
             name: u.name,
             email: u.email,
             dept: u.dept as Dept,
             role: u.role,
             status: u.status,
             assignedProjectIds: u.assigned_project_ids || []
           }))
        });
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    } finally {
      set({ isInitialLoading: false, isLoadingConfig: false });
    }
  },

  syncRecord: async (app) => {
    const finalApp = await syncRecordToSupabase(app);
    return finalApp;
  },

  bulkSync: async (appsToSync, allApplications) => {
    const finalApps = await bulkSyncRecordsToSupabase(appsToSync, allApplications);
    const syncedIds = finalApps
      .filter(fa => appsToSync.some(a => a.id === fa.id))
      .map(fa => fa.id);
    registerSelfUpdate(syncedIds);
    return finalApps;
  },

  reportIssue: async (apps, issueType, issueSeverity, issueNote) => {
    if (apps.length === 0 || !issueNote.trim()) {
      return { success: false, message: 'Vui lòng nhập ghi chú sai sót.' };
    }

    const { currentUser, userRole } = useAuthStore.getState();
    const { applications, setApplications, setDashboardApps } = get();

    try {
      const updatedApps = apps.map(app => {
        const logEntry: ApplicationStepHistory = {
          id: generateUUID(),
          stepName: app.currentStep,
          dept: (
            userRole === 'ADMIN' ? 'ADMIN' :
            userRole === 'MANAGER' ? 'KT' :
            userRole === 'MANAGER_PTT' ? 'PTT' :
            userRole === 'MANAGER_KT' ? 'KT' :
            userRole === 'MANAGER_PTDA' ? 'PTDA' :
            userRole === 'MANAGER_ALL' ? 'ADMIN' :
            (userRole as Dept)
          ),
          receivedDate: new Date().toISOString(),
          note: `[BÁO SAI SÓT - ${issueSeverity}] ${issueNote}`,
          performedBy: currentUser?.id,
          performedByName: currentUser?.name || 'Hệ thống',
        };
        return {
          ...app,
          status: 'Error' as const,
          issueType: issueType as any,
          issueSeverity: issueSeverity as any,
          issueNotes: issueNote,
          history: [logEntry, ...(app.history || [])],
          auditTrail: [
            createAuditEntry(
              'Báo cáo sai sót',
              apps.length > 1,
              apps.length,
              app.unitCode,
              `[${issueSeverity}] ${issueNote.substring(0, 80)}`
            ),
            ...(app.auditTrail || [])
          ]
        };
      });

      const syncedApps = await bulkSyncRecordsToSupabase(updatedApps, applications);

      setApplications(prev => prev.map(a => {
        const updated = syncedApps.find(sa => sa.id === a.id);
        return updated ? updated : a;
      }));

      setDashboardApps(prev => prev.map(a => {
        const updated = syncedApps.find(sa => sa.id === a.id);
        return updated ? updated : a;
      }));

      return { success: true, message: `Đã báo cáo sai sót cho ${apps.length} hồ sơ thành công.` };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Lỗi khi ghi nhận sai sót hàng loạt.' };
    }
  },

  resolveIssue: async (appId) => {
    try {
      const { applications, setApplications, setDashboardApps, stepConfig } = get();
      const app = applications.find(a => a.id === appId);
      if (!app) return { success: false, message: 'Không tìm thấy hồ sơ.' };

      const { currentUser, userRole } = useAuthStore.getState();
      const stepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];

      const newHistory = [
        {
          id: generateUUID(),
          stepName: stepCfg.label,
          dept: userRole as Dept,
          receivedDate: new Date().toISOString(),
          note: 'Đã khắc phục xong sai sót/vướng mắc. Sẵn sàng chuyển bước tiếp theo.',
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        },
        ...app.history
      ];

      const updatedApp = {
        ...app,
        status: stepCfg.status,
        isRejected: false,
        issueType: 'None' as const,
        issueSeverity: 'Minor' as const,
        issueNotes: '',
        issueStatus: 'RESOLVED' as const,
        history: newHistory
      };

      const auditEntry = createAuditEntry('Khắc phục vướng mắc', false, 1, app.unitCode, 'Đã xác nhận hoàn tất khắc phục sai sót/vướng mắc');
      const updatedAppWithAudit = {
        ...updatedApp,
        auditTrail: [auditEntry, ...(app.auditTrail || [])]
      };

      const finalApp = await get().syncRecord(updatedAppWithAudit);

      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      return { success: true, message: 'Đã xác nhận khắc phục xong vướng mắc.', finalApp };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi cập nhật trạng thái.' };
    }
  },

  resolveError: async (app) => {
    try {
      const { setApplications, stepConfig } = get();
      const { currentUser, userRole } = useAuthStore.getState();

      const newHistory = [
        {
          id: generateUUID(),
          stepName: 'Khắc phục lỗi',
          stepKey: 'RESOLVED',
          dept: userRole as Dept,
          receivedDate: new Date().toISOString(),
          note: 'Đã khắc phục xong và trả lại luồng xử lý',
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        },
        ...app.history
      ];

      let targetStepId = app.currentStep;
      let targetStatus = stepConfig[app.currentStep]?.status || INITIAL_STEP_CONFIG[app.currentStep]?.status || 'Processing';

      if (app.rejectedFromStepId) {
        const fallbackConfig = stepConfig[app.rejectedFromStepId] || INITIAL_STEP_CONFIG[app.rejectedFromStepId];
        if (fallbackConfig) {
          targetStepId = app.rejectedFromStepId;
          targetStatus = fallbackConfig.status;
        }
      }

      const updatedApp: Application = {
        ...app,
        currentStep: targetStepId,
        status: targetStatus as any,
        issueType: 'None' as const,
        issueSeverity: 'Minor' as const,
        issueNotes: '',
        issueStatus: 'RESOLVED' as const,
        isRejected: false,
        rejectedFromStepId: undefined, // Xoá vết quay lại
        history: newHistory
      };

      const finalApp = await get().syncRecord(updatedApp);
      setApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));

      return { success: true, message: 'Đã phục hồi trạng thái và đồng bộ Supabase thành công.', finalApp };
    } catch (error) {
      console.error('Supabase resolve error:', error);
      return { success: false, message: 'Lỗi khi lưu trạng thái phục hồi lên Supabase.' };
    }
  },

  bulkResolveIssues: async (selectedIds) => {
    const { applications, setApplications, setDashboardApps, stepConfig } = get();
    const { currentUser, userRole } = useAuthStore.getState();

    const appsToResolve = applications.filter(a =>
      selectedIds.has(a.id) &&
      (a.isRejected || a.status === 'Error' || (a.issueType && a.issueType !== 'None'))
    );
    if (appsToResolve.length === 0) {
      return { success: false, message: 'Không có hồ sơ hợp lệ để khắc phục.' };
    }

    try {
      const updatedApps = appsToResolve.map(app => {
        let targetStepId = app.currentStep;
        let targetStatus = stepConfig[app.currentStep]?.status || INITIAL_STEP_CONFIG[app.currentStep]?.status || 'Processing';
        let targetDept = stepConfig[app.currentStep]?.dept || INITIAL_STEP_CONFIG[app.currentStep]?.dept;

        if (app.rejectedFromStepId) {
          const fallbackConfig = stepConfig[app.rejectedFromStepId] || INITIAL_STEP_CONFIG[app.rejectedFromStepId];
          if (fallbackConfig) {
            targetStepId = app.rejectedFromStepId;
            targetStatus = fallbackConfig.status;
            targetDept = fallbackConfig.dept;
          }
        }

        const stepCfg = stepConfig[targetStepId] || INITIAL_STEP_CONFIG[targetStepId];

        const newHistory = [
          {
            id: `resolve-${Date.now()}-${app.id}`,
            stepName: 'Khắc phục lỗi',
            stepKey: 'RESOLVED',
            dept: userRole as Dept,
            receivedDate: new Date().toISOString(),
            note: 'Đã khắc phục xong và trả lại luồng xử lý',
            performedBy: currentUser?.id,
            performedByName: currentUser?.name
          },
          ...app.history
        ];

        const auditEntry = createAuditEntry('Khắc phục vướng mắc', false, 1, app.unitCode, 'Đã xác nhận hoàn tất khắc phục sai sót/vướng mắc');

        return {
          ...app,
          currentStep: targetStepId,
          status: targetStatus as any,
          isRejected: false,
          issueType: 'None' as const,
          issueSeverity: 'Minor' as const,
          issueNotes: '',
          issueStatus: 'RESOLVED' as const,
          rejectedFromStepId: undefined, // Xoá vết quay lại
          history: newHistory,
          auditTrail: [auditEntry, ...(app.auditTrail || [])]
        };
      });

      const finalApps = await bulkSyncRecordsToSupabase(updatedApps, applications);
      setApplications(finalApps);
      setDashboardApps(prev => {
        const validIds = new Set(finalApps.map(a => a.id));
        return prev.map(a => validIds.has(a.id) ? finalApps.find(f => f.id === a.id) || a : a);
      });

      return { success: true, message: `Đã xác nhận khắc phục thành công cho ${updatedApps.length} hồ sơ.` };
    } catch (e) {
      console.error('Bulk resolve error:', e);
      return { success: false, message: 'Lỗi khi cập nhật trạng thái hàng loạt.' };
    }
  },

  proposeException: async (appId, reason) => {
    try {
      const { applications, setApplications, setDashboardApps, stepConfig } = get();
      const { currentUser, userRole } = useAuthStore.getState();
      const app = applications.find(a => a.id === appId);
      if (!app) return { success: false, message: 'Không tìm thấy hồ sơ.' };

      const newHistory = [
        {
          id: `propose-${Date.now()}`,
          stepName: stepConfig[app.currentStep]?.label || app.currentStep,
          dept: userRole as Dept,
          receivedDate: new Date().toISOString(),
          note: `Đề xuất xử lý ngoại lệ: ${reason}`,
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        },
        ...app.history
      ];

      const check = app.checklist || {};
      const updatedApp = {
        ...app,
        issueType: 'Sai sót Khác' as const,
        issueNotes: `Đang chờ duyệt ngoại lệ: ${reason}`,
        issueSeverity: 'Critical' as const,
        issueStatus: 'OPEN' as const,
        status: 'Error' as const,
        checklist: {
          ...check,
          bypass_proposed: true,
          bypass_gcn: false
        },
        history: newHistory
      };

      const auditEntry = createAuditEntry('Đề xuất ngoại lệ', false, 1, app.unitCode, `Đề xuất ngoại lệ thành công lý do: ${reason}`);
      const updatedAppWithAudit = {
        ...updatedApp,
        auditTrail: [auditEntry, ...(app.auditTrail || [])]
      };

      const finalApp = await get().syncRecord(updatedAppWithAudit);
      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      return { success: true, message: 'Đã gửi đề xuất ngoại lệ.', finalApp };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi đề xuất ngoại lệ.' };
    }
  },

  approveException: async (appId, notes) => {
    try {
      const { applications, setApplications, setDashboardApps, stepConfig } = get();
      const { currentUser, userRole } = useAuthStore.getState();

      const allowedRoles = ['ADMIN', 'DIRECTOR', 'MANAGER', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'];
      if (!allowedRoles.includes(userRole)) {
        return { success: false, message: 'Bạn không có quyền phê duyệt ngoại lệ!' };
      }

      const app = applications.find(a => a.id === appId);
      if (!app) return { success: false, message: 'Không tìm thấy hồ sơ.' };

      const stepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];

      const newHistory = [
        {
          id: generateUUID(),
          stepName: stepCfg.label,
          dept: userRole as Dept,
          receivedDate: new Date().toISOString(),
          note: `Đã phê duyệt ngoại lệ: ${notes}`,
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        },
        ...app.history
      ];

      const check = app.checklist || {};
      const updatedApp = {
        ...app,
        status: stepCfg.status,
        isRejected: false,
        issueType: 'None' as const,
        issueSeverity: 'Minor' as const,
        issueNotes: '',
        issueStatus: 'RESOLVED' as const,
        checklist: {
          ...check,
          bypass_proposed: false,
          bypass_gcn: true
        },
        history: newHistory
      };

      const auditEntry = createAuditEntry('Phê duyệt ngoại lệ', false, 1, app.unitCode, `Đã phê duyệt ngoại lệ thành công với ghi chú: ${notes}`);
      const updatedAppWithAudit = {
        ...updatedApp,
        auditTrail: [auditEntry, ...(app.auditTrail || [])]
      };

      const finalApp = await get().syncRecord(updatedAppWithAudit);
      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      return { success: true, message: 'Đã phê duyệt ngoại lệ thành công.', finalApp };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi phê duyệt ngoại lệ.' };
    }
  },

  stepTransition: async (app, nextStep, note, deleteAllNotificationsForRecord, skipJustificationCheck = false) => {
    const { currentUser, userRole } = useAuthStore.getState();
    const { setApplications, setDashboardApps, stepConfig } = get();

    // Pre-populate ktHandoverToPtdaDate to current date only (YYYY-MM-DD) for validation when leaving S2_KT_Ban_giao to S3_Nop_VPDK
    const appWithPrep = { ...app };
    if (
      app.workflowType === 'Quy_trinh_2' &&
      app.currentStep === 'S2_KT_Ban_giao' &&
      nextStep === 'S3_Nop_VPDK' &&
      !app.ktHandoverToPtdaDate
    ) {
      const currentHistory = (app.history || []).find(
        h => h.stepName?.includes('S2_KT_Ban_giao') || 
             h.stepName?.includes('KT bàn giao') ||
             h.stepName?.includes('Ban giao')
      );
      const rawDate = currentHistory?.receivedDate || new Date().toISOString();
      appWithPrep.ktHandoverToPtdaDate = rawDate.split('T')[0];
    }

    const transitionCheck = WorkflowEngine.validateTransition(appWithPrep, nextStep, userRole, skipJustificationCheck);
    if (!transitionCheck.success) {
      if (transitionCheck.requiresHandoverDate) {
        return { success: false, message: '', requiresHandoverDate: true };
      }
      if (transitionCheck.requiresJustification) {
        return { 
          success: false, 
          message: transitionCheck.message || '', 
          requiresJustification: true, 
          missingFields: transitionCheck.missingFields 
        };
      }
      return { success: false, message: transitionCheck.message || 'Lỗi chuyển bước', type: transitionCheck.type as 'error' | 'warning' };
    }
    
    // Lưu warning để trả về sau khi chuyển bước thành công
    const transitionWarning = transitionCheck.hasWarning ? transitionCheck.message : null;

    const targetStep = transitionCheck.nextStep || nextStep;
    const workflowSteps = (app.workflowType === 'Quy_trinh_2' || (app.projectName && app.projectName.includes('Quy trình 2'))) ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
    const currentIdx = workflowSteps.indexOf(app.currentStep as StepName);
    const nextIdx = workflowSteps.indexOf(targetStep);
    const isMovingForward = nextIdx > currentIdx;

    const fullNow = new Date().toISOString();
    // Fetch lịch sử đầy đủ từ DB trước khi tạo entry mới
    let prevHistory = [...(app.history || [])];
    try {
      const freshDetail = await fetchRecordDetail(app.id!, app.unitCode);
      if (freshDetail.history && freshDetail.history.length > 0) {
        // Dùng DB history nếu đầy đủ hơn RAM
        prevHistory = freshDetail.history.length >= prevHistory.length
          ? freshDetail.history
          : prevHistory;
      }
    } catch (e) {
      // Fallback về RAM nếu fetch thất bại
      console.warn('[stepTransition] Không fetch được history từ DB, dùng RAM:', e);
    }
    if (prevHistory.length > 0) {
      prevHistory[0] = { ...prevHistory[0], completedDate: fullNow };
    }

    const currentStepLabel = (stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep]).label;
    const targetStepLabel = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label;
    const nextDeptLabel = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).dept;
    const transitionDirection = isMovingForward ? 'Chuyển' : 'Trả hồ sơ';
    const handoverNote = note || `${transitionDirection} từ bước [${currentStepLabel}] sang [${targetStepLabel}] (Bộ phận xử lý tiếp theo: ${nextDeptLabel})`;

    const newHistory = [
      {
        id: generateUUID(),
        stepName: targetStepLabel,
        dept: nextDeptLabel,
        receivedDate: fullNow,
        note: handoverNote,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...prevHistory
    ];

    const autoDates: Partial<Application> = {};
    autoDates.isHandedOver = isMovingForward;

    let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;

    if (targetStep === 'S2_KT_Tiep_Nhan') targetStatus = 'WaitingVPDK';
    if (targetStep === 'S5_1_PTDA_TiepNhan') targetStatus = 'TaxPaid';
    if (targetStep === 'S7_2_Ban_Giao_Khach' || targetStep === 'GD6_Cho_BG_Khach' || targetStep === 'GD5_Cho_PTT_TiepNhan_BG') {
      targetStatus = app.customerHandoverDate ? 'Completed' : 'WaitingHandover';
    }
    if (targetStep === 'Hoan_Tat') targetStatus = 'Completed';
    if (targetStatus === 'TaxCompleted' && !app.taxReceiptDate) {
      targetStatus = 'TaxPending';
    }

    const finalStatus = !isMovingForward ? 'Error' : (targetStep === 'S1_ChuanBi' ? 'Error' : targetStatus);

    // Auto-fill ktHandoverToPtdaDate khi KT rời bước S2_KT_Ban_giao
    if (
      app.workflowType === 'Quy_trinh_2' &&
      app.currentStep === 'S2_KT_Ban_giao' &&
      nextStep === 'S3_Nop_VPDK' &&
      !app.ktHandoverToPtdaDate
    ) {
      // Ưu tiên lấy từ history entry bước hiện tại nếu có
      const currentHistory = (app.history || []).find(
        h => h.stepName?.includes('S2_KT_Ban_giao') || 
             h.stepName?.includes('KT bàn giao') ||
             h.stepName?.includes('Ban giao')
      );
      const rawDate = currentHistory?.receivedDate || new Date().toISOString();
      autoDates.ktHandoverToPtdaDate = rawDate.split('T')[0];
    }

    const updatedApp = {
      ...appWithPrep,
      ...autoDates,
      currentStep: targetStep,
      status: finalStatus,
      isRejected: !isMovingForward,
      rejectionReason: !isMovingForward ? note : (targetStep === 'S1_ChuanBi' ? app.rejectionReason : ''),
      history: newHistory,
      auditTrail: [
        createAuditEntry(
          'Chuyển bước xử lý',
          false,
          1,
          app.unitCode,
          `Từ: ${(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep]).label} -> ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label}`
        ),
        ...(app.auditTrail || [])
      ]
    };

    try {
      const { setApplications, setDashboardApps } = get();
      
      // Optimistic update
      setApplications(prev => prev.map(a => a.id === app.id ? updatedApp : a));
      setDashboardApps(prev => prev.map(a => a.id === app.id ? updatedApp : a));

      // Background sync
      registerSelfUpdate(app.id!);
      get().syncRecord(updatedApp).then(async (finalApp) => {
        if (targetStep === 'Hoan_Tat') {
          await deleteAllNotificationsForRecord(app.id);
        }
        const { setApplications: setA, setDashboardApps: setD } = get();
        setA(prev => prev.map(a => a.id === app.id ? finalApp : a));
        setD(prev => prev.map(a => a.id === app.id ? finalApp : a));

        // Cập nhật selectedApp nếu user đang xem hồ sơ này
        const { selectedApp: currentSelected, setSelectedApp } = useModalStore.getState();
        if (currentSelected?.id === app.id) {
          setSelectedApp(finalApp);
        }
      }).catch(error => {
        console.error('Supabase transition error:', error);
      });

      return {
        success: true,
        message: `Đã chuyển hồ sơ sang bước: ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label} (Đã đồng bộ Supabase)`,
        finalApp: updatedApp,
        warningMessage: transitionWarning
      };
    } catch (error) {
      console.error('Optimistic update error:', error);
      return { success: false, message: 'Lỗi đồng bộ Supabase. Hồ sơ chưa được chuyển bước — vui lòng thử lại.' };
    }
  },

  rejectApp: async (app, targetStepId, reason, createNotification) => {
    const { currentUser, userRole } = useAuthStore.getState();
    const { users, stepConfig, setApplications, setDashboardApps } = get();

    const allowedDepts: string[] = ['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'];
    if (!allowedDepts.includes(userRole)) {
      return { success: false, message: 'Bạn không có quyền Trả về / Yêu cầu bổ sung hồ sơ.' };
    }

    const prevStepConfig = stepConfig[targetStepId] || INITIAL_STEP_CONFIG[targetStepId];
    if (!prevStepConfig) {
      return { success: false, message: 'Không tìm thấy cấu hình của bước đích.' };
    }

    // Fetch lịch sử đầy đủ (bao gồm history và audit trail) từ DB trước khi thêm entry mới
    let prevHistory = [...(app.history || [])];
    let prevAuditTrail = [...(app.auditTrail || [])];
    try {
      const freshDetail = await fetchRecordDetail(app.id!, app.unitCode);
      if (freshDetail.history && freshDetail.history.length > 0) {
        prevHistory = freshDetail.history.length >= prevHistory.length
          ? freshDetail.history
          : prevHistory;
      }
      if (freshDetail.auditTrail && freshDetail.auditTrail.length > 0) {
        prevAuditTrail = freshDetail.auditTrail.length >= prevAuditTrail.length
          ? freshDetail.auditTrail
          : prevAuditTrail;
      }
    } catch (e) {
      console.warn('[rejectApp] Không fetch được history/auditTrail từ DB, dùng RAM:', e);
    }

    const newHistory = [
      {
        id: generateUUID(),
        stepName: 'Yêu cầu chỉnh sửa / Bổ sung',
        stepKey: 'REJECTED',
        dept: userRole as Dept,
        receivedDate: new Date().toISOString(),
        note: `Hồ sơ bị trả về bước "${prevStepConfig.label}" với lý do: ${reason}`,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...prevHistory
    ];

    const updatedApp: Application = {
      ...updateAppIssue(app, reason, 'Sai sót Khác'),
      currentStep: targetStepId,
      status: prevStepConfig.status,
      rejectedFromStepId: app.currentStep,
      rejectionCount: (app.rejectionCount || 0) + 1,
      isRejected: true,
      rejectionReason: reason,
      history: newHistory,
      auditTrail: [...prevAuditTrail]
    };

    try {
      const targetDept = prevStepConfig.dept;
      const targetUsers = users.filter(u => u.dept === targetDept && u.id !== currentUser?.id);

      const promises = targetUsers.map(u =>
        createNotification({
          recipientId: u.id,
          title: 'Hồ sơ bị trả về / Cần bổ sung',
          message: `Hồ sơ lô ${app.unitCode} (${app.projectName}) bị Kế toán trả về: ${reason}`,
          type: 'Urgent',
          appId: app.id
        })
      );
      await Promise.all(promises);

      const finalApp = await get().syncRecord(updatedApp);
      const oldId = app.id;

      setApplications(prev => prev.map(a => a.id === oldId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === oldId ? finalApp : a));

      return { success: true, message: 'Hồ sơ đã được trả về giai đoạn 1 và cập nhật Supabase thành công.', finalApp };
    } catch (error) {
      console.error('Supabase reject error:', error);
      return { success: false, message: 'Lỗi khi lưu yêu cầu bổ sung lên Supabase.' };
    }
  },

  bulkRejectApps: async (selectedIds, targetStepId, reason) => {
    const { currentUser, userRole } = useAuthStore.getState();
    const { applications, users, stepConfig, setApplications, setDashboardApps } = get();

    const allowedDepts: string[] = ['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'];
    if (!allowedDepts.includes(userRole)) {
      return { success: false, message: 'Bạn không có quyền Trả về / Yêu cầu bổ sung hồ sơ.' };
    }

    const appsToReject = applications.filter(app => selectedIds.includes(app.id!));
    if (appsToReject.length === 0) {
      return { success: false, message: 'Không có hồ sơ để trả về.' };
    }

    try {
      const detailResults = await Promise.allSettled(
        appsToReject.map(a => fetchRecordDetail(a.id!, a.unitCode))
      );
      const historyMap: Record<string, { history: any[], auditTrail: any[] }> = {};
      appsToReject.forEach((a, i) => {
        const r = detailResults[i];
        const fresh = r.status === 'fulfilled' ? r.value : null;
        const ramHistory = a.history || [];
        const ramAudit = a.auditTrail || [];
        historyMap[String(a.id)] = {
          history: fresh?.history?.length >= ramHistory.length ? fresh.history : ramHistory,
          auditTrail: fresh?.auditTrail?.length >= ramAudit.length ? fresh.auditTrail : ramAudit,
        };
      });

      const targetStepConfig = stepConfig[targetStepId] || INITIAL_STEP_CONFIG[targetStepId];
      const updatedApps = appsToReject.map(app => {
        const prevStep = targetStepId;

        const auditEntry = createAuditEntry('Yêu cầu chỉnh sửa / Bổ sung', true, 1, app.unitCode, `Hồ sơ sai sót/cần bổ sung: ${reason}`);

        const currentHistory = historyMap[String(app.id)].history;
        const currentAuditTrail = historyMap[String(app.id)].auditTrail;

        return {
          ...updateAppIssue(app, reason, 'Sai sót Khác'),
          currentStep: prevStep,
          status: targetStepConfig.status,
          rejectionCount: (app.rejectionCount || 0) + 1,
          isRejected: true,
          rejectionReason: reason,
          auditTrail: [auditEntry, ...currentAuditTrail],
          history: [
            {
              id: generateUUID(),
              stepName: 'Yêu cầu chỉnh sửa / Bổ sung',
              dept: userRole as Dept,
              receivedDate: new Date().toISOString(),
              note: `Hồ sơ bị trả về hàng loạt: ${reason}`,
              performedBy: currentUser?.id,
              performedByName: currentUser?.name
            },
            ...currentHistory
          ]
        };
      });

      const finalApps = await bulkSyncRecordsToSupabase(updatedApps, applications);

      // Thu thập trước user_id dự kiến để xác thực
      const candidateUserIds = new Set<string>();
      updatedApps.forEach(app => {
        const prevStepConfig = targetStepConfig;
        const targetDept = prevStepConfig.dept;
        users.filter(u => u.dept === targetDept && u.id !== currentUser?.id)
             .forEach(u => candidateUserIds.add(u.id));
      });

      let validUserIds = new Set<string>();
      if (candidateUserIds.size > 0) {
        try {
          const { data: existingUsers, error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .in('id', Array.from(candidateUserIds));
          if (!userCheckError) {
            validUserIds = new Set((existingUsers || []).map(u => u.id));
          } else {
            console.error('Lỗi kiểm tra user tồn tại bulk reject:', userCheckError);
          }
        } catch (err) {
          console.error('Catch error kiểm tra user bulk reject:', err);
        }
      }

      const notificationsToInsert = updatedApps.flatMap(app => {
        const prevStepConfig = targetStepConfig;
        const targetDept = prevStepConfig.dept;
        const targetUsers = users.filter(u => u.dept === targetDept && u.id !== currentUser?.id && validUserIds.has(u.id));

        return targetUsers.map(u => ({
          recipientId: u.id,
          title: 'Hồ sơ bị trả về hàng loạt',
          message: `Hồ sơ lô ${app.unitCode} bị trả về: ${reason}`,
          type: 'Urgent',
          appId: app.id
        }));
      });

      if (notificationsToInsert.length > 0) {
        const snakeNotis = notificationsToInsert.map(n => {
          const s = mapNotificationToSnakeCase(n as any);
          if ((s as any).id) delete (s as any).id;
          return s;
        });

        // Bắn tất cả request song song — nhanh hơn for...of tuần tự,
        // Promise.allSettled đảm bảo 1 request lỗi không ảnh hưởng các request khác.
        const notificationPromises = snakeNotis.map(async (snakeNoti) => {
          try {
            const { error: notiError } = await supabase.from('notifications').insert(snakeNoti);
            if (notiError) {
              if (notiError.code === '23503') {
                console.warn(`[Warning 23503] Bỏ qua user rác: ${snakeNoti.user_id}`);
                return { success: false, isUserDeleted: true };
              }
              console.error('Lỗi insert notification trả hồ sơ:', notiError);
              return { success: false, error: notiError };
            }
            return { success: true };
          } catch (err) {
            console.error('Catch error in bulk notification:', err);
            return { success: false, error: err };
          }
        });

        await Promise.allSettled(notificationPromises);
      }

      setApplications(finalApps);
      setDashboardApps(prev => {
        const validIds = new Set(finalApps.map(a => a.id));
        return prev.map(a => validIds.has(a.id) ? finalApps.find(f => f.id === a.id) || a : a);
      });

      return { success: true, message: `Đã trả về ${updatedApps.length} hồ sơ thành công.` };
    } catch (error) {
      console.error('Bulk reject error:', error);
      return { success: false, message: 'Lỗi khi trả hồ sơ hàng loạt.' };
    }
  },

  executeBulkStepTransition: async (
    selectedAppIds,
    nextStep,
    dateValue,
    bulkTransitionField,
    location,
    refCode,
    ktHandoverDate,
    bulkNotifyNextDepartment,
    bulkDeleteNotificationsForRecords
  ) => {
    if (selectedAppIds.length === 0) {
      return { success: false, message: '' };
    }

    if (bulkTransitionField && bulkTransitionField.isRequired !== false && !dateValue) {
      return { success: false, message: `Vui lòng nhập ${bulkTransitionField.label} trước khi xác nhận.`, type: 'warning' };
    }

    const { currentUser, userRole } = useAuthStore.getState();
    const { applications, stepConfig, setApplications, setDashboardApps } = get();
    
    const canSkipSequential = ['ADMIN', 'DIRECTOR', 'MANAGER_ALL'].includes(userRole);

    const nowStr = new Date().toISOString();

    try {
      const transitionErrors: string[] = [];
      const chronoWarnings: string[] = [];
      let actuallyUpdatedCount = 0;

      // Fetch history từ DB cho tất cả records sắp update (chạy song song, 1 lần)
      const historyMap = new Map<string, ApplicationStepHistory[]>();
      const appsToFetch = applications.filter(app => selectedAppIds.includes(app.id));
      
      // Batching: chia thành nhóm 50 để tránh overload Supabase khi bulk lớn
      const BATCH_SIZE = 50;
      for (let i = 0; i < appsToFetch.length; i += BATCH_SIZE) {
        const batch = appsToFetch.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (app) => {
            try {
              // Truyền cả unitCode vì fetchRecordDetail có thể query bằng unitCode
              const detail = await fetchRecordDetail(app.id!, app.unitCode);
              if (detail && detail.history && detail.history.length > 0) {
                // Dùng String() để đảm bảo key đồng nhất (app.id có thể là number hoặc string)
                historyMap.set(String(app.id), detail.history);
              }
            } catch (e) {
              // Fallback về RAM nếu fetch lỗi — không block toàn bộ bulk
            }
          })
        );
      }

      const updatedApps = applications.map(app => {
        if (!selectedAppIds.includes(app.id)) return app;
        
        const unitLabel = app.unitCode || 'Hồ sơ';
        const workflowSteps = (app.workflowType === 'Quy_trinh_2' || (app.projectName && app.projectName.includes('Quy trình 2'))) ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
        const currentIdx = workflowSteps.indexOf(app.currentStep as StepName);

        let appWithDate = { ...app };
        if (bulkTransitionField && dateValue) {
          const existingValue = (app as any)[bulkTransitionField.key];
          const hasExistingValue = existingValue !== null && existingValue !== undefined && existingValue !== '' && existingValue !== '---' && existingValue !== 'undefined' && existingValue !== 'null';
          (appWithDate as any)[bulkTransitionField.key] = hasExistingValue ? existingValue : dateValue;
        }

        let recordNextStep = nextStep;
        const { finalStep, isJump } = WorkflowEngine.determineTargetStep(appWithDate, nextStep);
        if (isJump) {
          recordNextStep = finalStep;
        }

        // Pre-populate ktHandoverToPtdaDate to current date only (YYYY-MM-DD) for validation when leaving S2_KT_Ban_giao to S3_Nop_VPDK
        if (
          app.currentStep === 'S2_KT_Ban_giao' &&
          recordNextStep === 'S3_Nop_VPDK' &&
          !appWithDate.ktHandoverToPtdaDate
        ) {
          appWithDate.ktHandoverToPtdaDate = nowStr.split('T')[0];
        }

        const transitionCheck = WorkflowEngine.validateTransition(appWithDate, nextStep, userRole);
        if (!transitionCheck.success) {
          if (transitionCheck.requiresJustification) {
            transitionErrors.push(`Căn ${unitLabel}: Thiếu thông tin ${transitionCheck.missingFields?.join(', ')}. Vui lòng bổ sung hoặc chuyển từng hồ sơ để giải trình.`);
          } else {
            transitionErrors.push(`Căn ${unitLabel}: ${transitionCheck.message || 'Lỗi chuyển bước'}`);
          }
          return app;
        }
        if (transitionCheck.nextStep) {
          recordNextStep = transitionCheck.nextStep;
        }

        const nextIdx = workflowSteps.indexOf(recordNextStep);
        const isMovingForward = nextIdx > currentIdx;

        if (!canSkipSequential && nextIdx !== currentIdx + 1 && !isJump) {
          const expectedStep = workflowSteps[currentIdx + 1] || 'Kết thúc';
          transitionErrors.push(`Căn ${unitLabel}: Sai tuần tự (Yêu cầu bước: ${(stepConfig[expectedStep] || INITIAL_STEP_CONFIG[expectedStep])?.label || expectedStep}).`);
          return app;
        }

        const chronoError = validateDateSequence(appWithDate);
        if (chronoError) {
          if (chronoError.startsWith('⚠️')) {
            chronoWarnings.push(`Căn ${unitLabel}: ${chronoError}`);
          } else {
            transitionErrors.push(`Căn ${unitLabel}: ${chronoError}`);
            return app; // Bỏ qua cập nhật cho hồ sơ này
          }
        }

        actuallyUpdatedCount++;

        const vpdKSteps = [
          'S3_Nop_VPDK', 'S5_Tai_Chinh_Khach_Hang',
          'GD3_Nop_VPDK', 'GD4_Cho_Nop_NVTC', 'Hoan_Tat'
        ];
        if (vpdKSteps.includes(recordNextStep as string)) {
          if (location !== undefined) appWithDate.submissionLocation = location as any;
          if (refCode !== undefined) appWithDate.vpdkCode = refCode;
        }

        // Khi chuyển ĐẾN S2_KT_Ban_giao: dùng ngày từ bulk modal nếu có
        if (recordNextStep === 'S2_KT_Ban_giao' && ktHandoverDate) {
          appWithDate.ktHandoverToPtdaDate = ktHandoverDate;
        }

        // Khi chuyển RỜI S2_KT_Ban_giao → S3_Nop_VPDK: tự điền nếu chưa có
        if (
          app.currentStep === 'S2_KT_Ban_giao' &&
          recordNextStep === 'S3_Nop_VPDK' &&
          !appWithDate.ktHandoverToPtdaDate
        ) {
          appWithDate.ktHandoverToPtdaDate = nowStr.split('T')[0];
        }

        let targetStep = recordNextStep;

        // Ưu tiên history từ DB (đầy đủ hơn RAM); fallback về RAM nếu fetch miss
        const dbHistory = historyMap.get(String(app.id));
        const prevHistory = dbHistory && dbHistory.length > 0
          ? [...dbHistory]
          : [...appWithDate.history];
        if (prevHistory.length > 0) {
          prevHistory[0] = { ...prevHistory[0], completedDate: nowStr };
        }

        const note = `Chuyển hàng loạt ${dateValue ? `(Cập nhật ${bulkTransitionField?.label}: ${dateValue})` : ''}`;

        const nextDeptLabel = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).dept;
        const handoverNote = `Hồ sơ đã hoàn tất và tự động bàn giao sang bộ phận ${nextDeptLabel}`;

        const newHistory = [
          {
            id: generateUUID(),
            stepName: (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label,
            dept: nextDeptLabel,
            receivedDate: new Date().toISOString(),
            note: `${note}. ${handoverNote}`,
            performedBy: currentUser?.id,
            performedByName: currentUser?.name
          },
          ...prevHistory
        ];

        const autoDates: Partial<Application> = {};
        autoDates.isHandedOver = isMovingForward;

        let targetStatus = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).status;

        if (targetStep === 'S2_KT_Tiep_Nhan' || targetStep === 'GD1_Cho_KT_TiepNhan') targetStatus = 'WaitingVPDK';
        if (targetStep === 'GD4_Cho_Nop_NVTC') targetStatus = 'TaxPending';
        if (targetStep === 'S5_1_PTDA_TiepNhan') targetStatus = 'TaxPaid';
        if (targetStep === 'S7_2_Ban_Giao_Khach' || targetStep === 'GD6_Cho_BG_Khach' || targetStep === 'GD5_Cho_PTT_TiepNhan_BG') {
          targetStatus = app.customerHandoverDate ? 'Completed' : 'WaitingHandover';
        }
        if (targetStep === 'Hoan_Tat') targetStatus = 'Completed';
        if (targetStatus === 'TaxCompleted' && !appWithDate.taxReceiptDate) {
          targetStatus = 'TaxPending';
        }

        return {
          ...appWithDate,
          ...autoDates,
          currentStep: targetStep,
          status: targetStep === 'S1_ChuanBi' ? 'Error' : targetStatus,
          isRejected: !isMovingForward,
          rejectionReason: targetStep === 'S1_ChuanBi' ? appWithDate.rejectionReason : '',
          history: newHistory,
          auditTrail: [
            createAuditEntry(
              'Chuyển bước hàng loạt',
              true,
              actuallyUpdatedCount,
              appWithDate.unitCode,
              `Từ: ${(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep]).label} -> ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label}`
            ),
            ...(appWithDate.auditTrail || [])
          ]
        };
      });

      if (actuallyUpdatedCount === 0) {
        return { 
          success: false, 
          message: 'Không có hồ sơ nào đủ điều kiện để thực hiện chuyển bước này hàng loạt.', 
          type: 'warning',
          errors: transitionErrors,
          totalSelected: selectedAppIds.length,
          updatedCount: 0
        };
      }

      const appsToSync = updatedApps.filter(app => {
        const original = applications.find(a => a.id === app.id);
        return original && original.currentStep !== app.currentStep;
      });

      const finalApps = await get().bulkSync(appsToSync, updatedApps);
      setApplications(finalApps);
      setDashboardApps(prev => {
        const next = [...prev];
        appsToSync.forEach(synced => {
          const idx = next.findIndex(a => a.id === synced.id);
          const foundInFinal = finalApps.find(fa => fa.id === synced.id);
          if (idx !== -1 && foundInFinal) {
            next[idx] = foundInFinal;
          } else if (foundInFinal) {
            next.push(foundInFinal);
          }
        });
        return next;
      });

      const notifyResult = await bulkNotifyNextDepartment(appsToSync, nextStep);

      if (nextStep === 'Hoan_Tat') {
        await bulkDeleteNotificationsForRecords(selectedAppIds);
      }

      let finalMessage = `Đã xử lý hàng loạt ${actuallyUpdatedCount} hồ sơ lên Supabase thành công.`;
      let finalType: 'success' | 'warning' = 'success';

      if (notifyResult && !notifyResult.success) {
        finalMessage = `Đã chuyển bước ${actuallyUpdatedCount} hồ sơ thành công, nhưng KHÔNG gửi được thông báo cho bộ phận tiếp theo. Vui lòng kiểm tra lại danh sách nhân sự phòng ban.`;
        finalType = 'warning';
      } else if (notifyResult && notifyResult.skippedCount > 0) {
        // Chỉ log ra console, không hiện toast vàng gây lo lắng cho user
        // vì chuyển bước đã thành công hoàn toàn, chỉ là thông báo không đến được 1 số user đã bị xóa
        console.warn(`[bulkTransition] Bỏ qua ${notifyResult.skippedCount} thông báo do user không còn trong hệ thống.`);
      }

      return {
        success: true,
        message: finalMessage,
        type: finalType,
        actuallyUpdatedCount,
        chronoWarnings,
        notifyResult,
        finalApps,
        errors: transitionErrors,
        totalSelected: selectedAppIds.length,
        updatedCount: actuallyUpdatedCount
      };
    } catch (error) {
      console.error('Supabase bulk transition error:', error);
      return { success: false, message: 'Lỗi khi cập nhật hàng loạt lên Supabase.', type: 'error' };
    }
  },

  createApp: async (newApp) => {
    const { currentUser } = useAuthStore.getState();
    const { projects, stepConfig, setApplications, setDashboardApps } = get();

    // Duplicate check trực tiếp trên DB (tránh lỗi pagination cache)
    try {
      const { data: dupData, error: dupError } = await supabase
        .from('records')
        .select('id')
        .eq('project_name', newApp.projectName!)
        .ilike('unit_code', newApp.unitCode!.trim())
        .limit(1);
      if (dupError) console.error('Error checking duplicate:', dupError);
      else if (dupData && dupData.length > 0) {
        return { success: false, message: 'Mã lô/căn đã tồn tại trong dự án này' };
      }
    } catch (e) {
      console.error('Exception during duplicate check:', e);
    }

    try {
      const parentProject = projects.find(p => p.name === newApp.projectName);
      const inheritedWorkflowType = parentProject?.workflowType || 'Quy_trinh_1';
      const initialStep: StepName = inheritedWorkflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
      const initialStatus = (stepConfig as any)[initialStep]?.status || 'Processing';
      const newId = generateUUID();
      const histId = generateUUID();
      const auditId = generateUUID();

      const appToAddTemp: any = {
        unitCode: newApp.unitCode,
        customerName: newApp.customerName,
        contractSignerType: newApp.contractSignerType,
        projectName: newApp.projectName,
        workflowType: inheritedWorkflowType,
        propertyType: newApp.propertyType,
        loanStatus: newApp.loanStatus,
        submissionLocation: newApp.submissionLocation,
        isSelfService: newApp.isSelfService,
        commitmentDate: newApp.commitmentDate,
        handoverApartmentDate: newApp.propertyType === 'Can_Ho' ? newApp.handoverApartmentDate : undefined,
        currentStep: initialStep,
        status: initialStatus,
        receivedDate: newApp.receivedDate,
        taxPaymentStatus: 'Unpaid',
        checklist: {},
        history: [{
          id: histId,
          stepName: (stepConfig[initialStep] || INITIAL_STEP_CONFIG[initialStep]).label,
          dept: 'PTT',
          receivedDate: new Date().toISOString(),
          note: 'Khởi tạo hồ sơ mới',
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        }],
        auditTrail: [{
          id: auditId,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Hệ thống',
          action: 'Tạo hồ sơ mới',
          timestamp: new Date().toISOString(),
          changes: ''
        }]
      };

      const dataToInsert = mapToSnakeCase(appToAddTemp);
      delete dataToInsert.id;

      const { data, error } = await supabase
        .from('records')
        .insert(dataToInsert)
        .select(RECORD_LIGHT_SELECT);

      if (error) throw error;

      const appToAdd = mapFromSnakeCase(data[0]);
      if (appToAdd?.id) {
        registerSelfUpdate(appToAdd.id);

        if (appToAddTemp.history?.length > 0) {
          const historyPromises = appToAddTemp.history.map((h: any) => {
            if (!h.id) return Promise.resolve();
            return supabase.from('record_history').upsert({
              id: h.id,
              record_id: appToAdd.id,
              step_name: h.stepName,
              dept: h.dept,
              received_date: h.receivedDate,
              completed_date: h.completedDate || null,
              note: h.note || '',
              performed_by: h.performedBy || null,
              performed_by_name: h.performedByName || null,
            }, { onConflict: 'id' });
          });
          const historyResults = await Promise.all(historyPromises);
          historyResults.forEach(res => {
            if ((res as any).error) console.warn('Lỗi phụ khi ghi history cho hồ sơ mới:', (res as any).error);
          });
        }

        if (appToAddTemp.auditTrail?.length > 0) {
          const auditPromises = appToAddTemp.auditTrail.map((a: any) => {
            if (!a.id) return Promise.resolve();
            return supabase.from('record_audit_trail').upsert({
              id: a.id,
              record_id: appToAdd.id,
              user_id: a.userId,
              user_name: a.userName,
              action: a.action,
              changes: a.changes || '',
              timestamp: a.timestamp,
            }, { onConflict: 'id' });
          });
          const auditResults = await Promise.all(auditPromises);
          auditResults.forEach(res => {
            if ((res as any).error) console.warn('Lỗi phụ khi ghi audit trail cho hồ sơ mới:', (res as any).error);
          });
        }

        appToAdd.history = appToAddTemp.history;
        appToAdd.auditTrail = appToAddTemp.auditTrail;
      }

      setApplications(prev => [appToAdd, ...prev]);
      setDashboardApps(prev => [appToAdd, ...prev]);

      return { success: true, message: `Hồ sơ ${appToAdd.unitCode} đã được khởi tạo và đồng bộ Supabase!`, app: appToAdd };
    } catch (error: any) {
      console.error('Supabase insert error:', error);
      return { success: false, message: `Lỗi khi lưu hồ sơ mới lên Supabase: ${error.message || ''}` };
    }
  },

  updateApp: async (app) => {
    try {
      const auditEntry = createAuditEntry('Cập nhật thông tin', false, 1, app.unitCode, 'Chỉnh sửa chi tiết hồ sơ');
      const updatedApp = { ...app, auditTrail: [auditEntry, ...(app.auditTrail || [])] };
      const finalApp = await get().syncRecord(updatedApp);
      const { setApplications, setDashboardApps } = get();
      setApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));
      return { success: true, message: 'Đã cập nhật thông tin hồ sơ và đồng bộ Supabase thành công!', finalApp };
    } catch (error: any) {
      console.error('Supabase update error:', error);
      return { success: false, message: `Lỗi khi lưu dữ liệu lên Supabase: ${error.message || 'Vui lòng kiểm tra cấu hình.'}` };
    }
  },

  togglePriority: async (appId, isPriority, reason) => {
    try {
      const { applications, syncRecord, setApplications, setDashboardApps } = get();
      const { currentUser } = useAuthStore.getState();
      const app = applications.find(a => a.id === appId);
      if (!app) {
        return { success: false, message: 'Không tìm thấy hồ sơ.' };
      }

      // Create an audit entry
      const actionName = isPriority ? 'Bật ưu tiên' : 'Gỡ ưu tiên';
      const detailText = isPriority 
        ? `Đánh dấu hồ sơ ưu tiên xử lý gấp. Lý do: ${reason}` 
        : `Gỡ bỏ trạng thái ưu tiên. Lý do: ${reason}`;
      const auditEntry = createAuditEntry(actionName, false, 1, app.unitCode, detailText);

      // Create updated app
      const updatedApp = { 
        ...app, 
        isPriority, 
        priorityReason: reason, 
        auditTrail: [auditEntry, ...(app.auditTrail || [])] 
      };

      // Sync to database
      const finalApp = await syncRecord(updatedApp);

      // Save locally
      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      // Push notification if assigned to another user
      if (app.assignedToId && app.assignedToId !== currentUser?.id) {
        const noti = {
          recipientId: app.assignedToId,
          title: isPriority ? 'Hồ sơ được đánh dấu ƯU TIÊN' : 'Hồ sơ bị GỠ trạng thái ưu tiên',
          message: isPriority 
            ? `Hồ sơ lô ${app.unitCode} đã được đánh dấu ưu tiên với lý do: ${reason}`
            : `Hồ sơ lô ${app.unitCode} đã bị gỡ ưu tiên. Lý do: ${reason}`,
          type: isPriority ? 'Urgent' : 'Info',
          appId: app.id
        };
        const snakeNoti = mapNotificationToSnakeCase(noti as any);
        if ((snakeNoti as any).id) delete (snakeNoti as any).id;
        await supabase.from('notifications').insert(snakeNoti);
      }

      return { success: true, message: `Đã ${isPriority ? 'bật' : 'gỡ'} trạng thái ưu tiên thành công!`, finalApp };
    } catch (error: any) {
      console.error('togglePriority error:', error);
      return { success: false, message: `Lỗi khi lưu dữ liệu ưu tiên: ${error.message || ''}` };
    }
  },

  bulkTogglePriority: async (appIds, isPriority, reason) => {
    try {
      const { applications, setApplications, setDashboardApps } = get();
      const { currentUser } = useAuthStore.getState();
      
      const appsToUpdate = applications.filter(a => appIds.includes(a.id as string | number));
      if (appsToUpdate.length === 0) {
        return { success: false, message: 'Không tìm thấy hồ sơ phù hợp.' };
      }

      const updatedApps = appsToUpdate.map(app => {
        const actionName = isPriority ? 'Bật ưu tiên' : 'Gỡ ưu tiên';
        const detailText = isPriority 
          ? `Đánh dấu hồ sơ ưu tiên xử lý gấp. Lý do: ${reason}` 
          : `Gỡ bỏ trạng thái ưu tiên. Lý do: ${reason}`;
        const auditEntry = createAuditEntry(actionName, true, appsToUpdate.length, app.unitCode, detailText);
        return {
          ...app,
          isPriority,
          priorityReason: reason,
          auditTrail: [auditEntry, ...(app.auditTrail || [])]
        };
      });

      // Synchronize in bulk using bulkSyncRecordsToSupabase
      const syncedApps = await bulkSyncRecordsToSupabase(updatedApps, applications);

      // Save locally
      setApplications(prev => prev.map(a => {
        const found = syncedApps.find(sa => sa.id === a.id);
        return found ? found : a;
      }));
      setDashboardApps(prev => prev.map(a => {
        const found = syncedApps.find(sa => sa.id === a.id);
        return found ? found : a;
      }));

      // Push notification for each app to its assigned user
      const notificationsToInsert = [];
      for (const app of updatedApps) {
        if (app.assignedToId && app.assignedToId !== currentUser?.id) {
          notificationsToInsert.push({
            recipientId: app.assignedToId,
            title: isPriority ? 'Hồ sơ được đánh dấu ƯU TIÊN' : 'Hồ sơ bị GỠ trạng thái ưu tiên',
            message: isPriority 
              ? `Hồ sơ lô ${app.unitCode} đã được đánh dấu ưu tiên với lý do: ${reason}`
              : `Hồ sơ lô ${app.unitCode} đã bị gỡ ưu tiên. Lý do: ${reason}`,
            type: isPriority ? 'Urgent' : 'Info',
            appId: app.id
          });
        }
      }

      if (notificationsToInsert.length > 0) {
        const snakeNotis = notificationsToInsert.map(n => {
          const s = mapNotificationToSnakeCase(n as any);
          if ((s as any).id) delete (s as any).id;
          return s;
        });
        await Promise.allSettled(snakeNotis.map(s => supabase.from('notifications').insert(s)));
      }

      return { success: true, message: `Đã ${isPriority ? 'bật' : 'gỡ'} trạng thái ưu tiên cho ${appsToUpdate.length} hồ sơ thành công!` };
    } catch (error: any) {
      console.error('bulkTogglePriority error:', error);
      return { success: false, message: `Lỗi khi lưu dữ liệu ưu tiên hàng loạt: ${error.message || ''}` };
    }
  },

  deleteApp: async (id, code, cleanupFilesForRecords) => {
    try {
      try { await cleanupFilesForRecords([id]); }
      catch (cleanupErr) { console.warn('File cleanup warning (continuing with app delete):', cleanupErr); }

      const { error } = await supabase.from('records').delete().eq('id', id);
      if (error) throw error;

      const { data: checkData } = await supabase.from('records').select('id').eq('id', id).maybeSingle();
      if (checkData) {
        throw new Error('Xóa không thành công - có thể do quyền truy cập. Vui lòng kiểm tra lại hoặc liên hệ Admin.');
      }

      const { setApplications, setDashboardApps } = get();
      setApplications(prev => prev.filter(a => a.id !== id));
      setDashboardApps(prev => prev.filter(a => a.id !== id));

      return { success: true, message: 'Đã xóa hồ sơ và tài liệu đính kèm thành công' };
    } catch (error: any) {
      console.error('Delete app error:', error);
      return { success: false, message: error.message || 'Lỗi khi xóa hồ sơ.' };
    }
  },

  quickSave: async (id, quickEditData) => {
    const { applications } = get();
    const app = applications.find(a => a.id === id);
    if (!app) return { success: false, message: 'Không tìm thấy hồ sơ.' };

    const { currentUser } = useAuthStore.getState();
    const nowStr = new Date().toISOString();

    let baseHistory = [...(app.history || [])];
    try {
      const freshDetail = await fetchRecordDetail(app.id!, app.unitCode);
      if (freshDetail.history.length > 0) {
        baseHistory = freshDetail.history.length >= baseHistory.length
          ? freshDetail.history : baseHistory;
      }
    } catch (e) {
      console.warn('[quickSave] Dùng RAM history:', e);
    }

    const historyEntry: ApplicationStepHistory = {
      id: generateUUID(),
      stepName: `Cập nhật nhanh: ${Object.keys(quickEditData).join(', ')}`,
      dept: (currentUser?.dept as Dept) || 'PTT',
      receivedDate: nowStr,
      note: `Chỉnh sửa nhanh các trường: ${Object.keys(quickEditData).join(', ')}`,
      performedBy: currentUser?.id,
      performedByName: currentUser?.name || 'Hệ thống'
    };

    const auditEntry = createAuditEntry('Cập nhật nhanh', false, 1, app.unitCode,
      `Chỉnh sửa nhanh: ${Object.keys(quickEditData).join(', ')}`);

    const updatedApp = {
      ...app,
      ...quickEditData,
      history: [historyEntry, ...baseHistory],
      auditTrail: [auditEntry, ...(app.auditTrail || [])]
    };
    if (updatedApp.status !== 'Error') updatedApp.status = app.status;

    try {
      const { setApplications, setDashboardApps } = get();
      
      // Optimistic update
      setApplications(prev => prev.map(a => a.id === id ? updatedApp : a));
      setDashboardApps(prev => prev.map(a => a.id === id ? updatedApp : a));

      // Background sync
      registerSelfUpdate(app.id!);
      get().syncRecord(updatedApp).then(finalApp => {
        const { setApplications: setA, setDashboardApps: setD } = get();
        setA(prev => prev.map(a => a.id === id ? finalApp : a));
        setD(prev => prev.map(a => a.id === id ? finalApp : a));
        
        const { selectedApp: currentSelected, setSelectedApp } = useModalStore.getState();
        if (currentSelected?.id === String(id) || currentSelected?.id === id) {
          setSelectedApp(finalApp);
        }
      }).catch(error => {
        console.error('Supabase quickSave error:', error);
      });

      return { success: true, message: 'Cập nhật nhanh và đồng bộ Supabase thành công!', finalApp: updatedApp };
    } catch (error) {
      console.error('Quick save error:', error);
      return { success: false, message: 'Lỗi khi cập nhật nhanh lên Supabase.' };
    }
  },

  createUser: async (userData) => {
    try {
      const snakeUser = mapUserToSnakeCase(userData as UserProfile);
      delete (snakeUser as any).id;
      const { data, error } = await supabase.from('users').insert(snakeUser).select('*').single();
      if (error) throw error;
      const newUser = mapUserFromSnakeCase(data);
      const { setUsers } = get();
      setUsers(prev => [...prev, newUser]);
      return { success: true, message: `Đã tạo tài khoản ${newUser.username} thành công!`, user: newUser };
    } catch (error: any) {
      console.error('Create user error:', error);
      return { success: false, message: `Lỗi tạo tài khoản: ${error.message || ''}` };
    }
  },

  updateUser: async (user) => {
    try {
      const { error } = await supabase.from('users').update(mapUserToSnakeCase(user)).eq('id', user.id);
      if (error) throw error;
      const { setUsers } = get();
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      return { success: true, message: 'Đã cập nhật tài khoản thành công!' };
    } catch (error: any) {
      console.error('Update user error:', error);
      return { success: false, message: `Lỗi cập nhật tài khoản: ${error.message || ''}` };
    }
  },

  deleteUser: async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      const { setUsers } = get();
      setUsers(prev => prev.filter(u => u.id !== id));
      return { success: true, message: 'Đã xóa tài khoản thành công!' };
    } catch (error: any) {
      console.error('Delete user error:', error);
      return { success: false, message: `Lỗi xóa tài khoản: ${error.message || ''}` };
    }
  },

  resetUserPassword: async (userId, username) => {
    try {
      const { error } = await supabase.from('users').update({ password: '123456' }).eq('id', userId);
      if (error) throw error;
      return { success: true, message: `Đã reset mật khẩu tài khoản ${username} về 123456` };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, message: `Lỗi reset mật khẩu: ${error.message || ''}` };
    }
  },

  updatePassword: async (userId, currentPassword, newPassword) => {
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users').select('password').eq('id', userId).single();
      if (fetchError) throw fetchError;
      if (userData?.password !== currentPassword) {
        return { success: false, message: 'Mật khẩu hiện tại không đúng!' };
      }
      const { error: updateError } = await supabase
        .from('users').update({ password: newPassword }).eq('id', userId);
      if (updateError) throw updateError;
      return { success: true, message: 'Đã cập nhật mật khẩu thành công!' };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { success: false, message: `Lỗi cập nhật mật khẩu: ${error.message || ''}` };
    }
  }
}));
