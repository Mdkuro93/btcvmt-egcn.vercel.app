import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Application, Project, UserProfile, AppNotification, Dept, ApplicationStepHistory, AuditTrailEntry, IssueType, IssueSeverity, StepName } from '../types';
import { mapFromSnakeCase, safeParse, mapToSnakeCase, mapNotificationToSnakeCase } from '../utils/mappers';
import { STEP_CONFIG as INITIAL_STEP_CONFIG, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS } from '../constants';
import { useAuthStore } from './useAuthStore';
import { WorkflowEngine } from '../utils/workflowEngine';
import { validateDateSequence } from '../utils/appUtils';

export const createAuditEntry = (action: string, isBulk: boolean, count: number, unitCode: string, detail?: string): AuditTrailEntry => {
  const { currentUser } = useAuthStore.getState();
  const mode = isBulk ? '[Hàng loạt]' : '[Thủ công]';
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  const auditEntry = createAuditEntry('Ghi nhận vướng mắc', false, 1, app.unitCode, `Loại: ${type}. Ghi chú: ${note}`);

  return {
    ...app,
    status: 'Error' as const,
    issueNotes: note,
    issueType: type,
    issueSeverity: severity,
    issueStatus: 'OPEN',
    issueCreatedAt: new Date().toISOString(),
    auditTrail: [auditEntry, ...(app.auditTrail || [])]
  };
};

export const RECORD_LIGHT_SELECT = 'id, unit_code, project_name, customer_name, contract_signer_type, phone_number, property_type, loan_status, is_self_service, current_step, status, received_date, contract_signing_date, submission_date, tax_notification_date, tax_receipt_date, gcn_signed_date, gcn_received_date, customer_handover_date, accounting_handover_date, ptda_handover_date, bank_commitment_deadline, submission_location, vpdk_code, issue_type, issue_severity, issue_notes, is_rejected, workflow_type, created_at, assigned_to, tax_payment_status, scanned_files, rejection_count, rejection_reason, commitment_date, assigned_to_id, assigned_to_name, tax_vpdk_submission_date, gcn_number';

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
                    record_id: String(returnedApp.id),
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
                    record_id: String(returnedApp.id),
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
  
  initRealtime: (
    currentUser: UserProfile,
    userRole: string,
    assignedNames: string[],
    editAppRef: React.MutableRefObject<Application | null>,
    isEditingRef: React.MutableRefObject<boolean>,
    selfUpdateRef: React.MutableRefObject<Set<number>>,
    setConflictWarning: (msg: string) => void,
    setSelectedApp: (updater: (prev: Application | null) => Application | null) => void,
    setTotalCount: (updater: (prev: number) => number) => void,
    setRealtimeStatus: (status: 'connected' | 'connecting' | 'error') => void,
    setRealtimeReconnectKey: (updater: (prev: number) => number) => void,
    showToast: (msg: string, type: 'error' | 'success' | 'warning' | 'info') => void
  ) => () => void;

  reportIssue: (
    apps: Application[],
    issueType: string,
    issueSeverity: string,
    issueNote: string
  ) => Promise<{ success: boolean; message: string }>;
  resolveIssue: (appId: string, localSyncRecord: (app: Application) => Promise<Application>) => Promise<{ success: boolean; message: string }>;
  resolveError: (app: Application, localSyncRecord: (app: Application) => Promise<Application>) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  bulkResolveIssues: (selectedIds: Set<string | number>) => Promise<{ success: boolean; message: string }>;
  proposeException: (appId: string, reason: string, localSyncRecord: (app: Application) => Promise<Application>) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  approveException: (appId: string, notes: string, localSyncRecord: (app: Application) => Promise<Application>) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  stepTransition: (
    app: Application,
    nextStep: StepName,
    note: string | undefined,
    localSyncRecord: (app: Application) => Promise<Application>,
    deleteAllNotificationsForRecord: (recordId: string | number) => Promise<void>
  ) => Promise<{ success: boolean; message: string; type?: 'error' | 'warning'; requiresHandoverDate?: boolean; finalApp?: Application }>;
  
  rejectApp: (
    app: Application,
    reason: string,
    localSyncRecord: (app: Application) => Promise<Application>,
    createNotification: (noti: Partial<AppNotification>) => Promise<void>
  ) => Promise<{ success: boolean; message: string; finalApp?: Application }>;
  
  bulkRejectApps: (
    selectedIds: (string | number)[],
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
    localBulkSync: (appsToSync: Application[], allApplications: Application[]) => Promise<Application[]>,
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
  }>;
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

  initRealtime: (
    currentUser,
    userRole,
    assignedNames,
    editAppRef,
    isEditingRef,
    selfUpdateRef,
    setConflictWarning,
    setSelectedApp,
    setTotalCount,
    setRealtimeStatus,
    setRealtimeReconnectKey,
    showToast
  ) => {
    let active = true;
    let recordsChannel: any = null;
    let notiChannel: any = null;
    let retryTimeout: any;
    let retryCount = 0;
    const MAX_RETRY = 5;

    const channelId = `rt-records-${currentUser.id}`;
    
    recordsChannel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'records' },
        (payload) => {
          if (!active) return;
          const { eventType, new: newRow, old: oldRow } = payload;
          const state = get();

          if (eventType !== 'DELETE') {
            const projectName = newRow?.project_name;
            const isAllowed = userRole === 'ADMIN' || 
              userRole === 'DIRECTOR' ||
              !projectName ||
              assignedNames.includes(projectName);
            if (!isAllowed) return; 
          }

          if (eventType === 'INSERT') {
            const newApp = mapFromSnakeCase(newRow);
            if (selfUpdateRef.current.has(newApp.id as number)) {
              selfUpdateRef.current.delete(newApp.id as number);
              return;
            }

            state.setApplications(prev => {
              if (prev.some(a => a.id === newApp.id)) return prev;
              showToast(`📋 Hồ sơ mới: ${newApp.unitCode} vừa được tạo`, 'info');
              return [newApp, ...prev];
            });
            state.setDashboardApps(prev => {
              if (prev.some(a => a.id === newApp.id)) return prev;
              return [newApp, ...prev];
            });
            setTotalCount(prev => prev + 1);
          }
          else if (eventType === 'UPDATE') {
            const prevApp = state.applications.find(a => a.id === newRow.id) || state.dashboardApps.find(a => a.id === newRow.id);
            const updatedApp = mapFromSnakeCase(newRow, prevApp);
            
            if (selfUpdateRef.current.has(updatedApp.id as number)) {
              selfUpdateRef.current.delete(updatedApp.id as number);
              return; 
            }

            state.setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
            state.setDashboardApps(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));

            showToast(`📋 Hồ sơ ${updatedApp.unitCode} vừa được cập nhật bởi người khác`, 'info');

            setSelectedApp((prev: Application | null) => {
              if (!prev || prev.id !== updatedApp.id) return prev;
              if (isEditingRef.current) {
                const serverTime = new Date(updatedApp.updatedAt || 0);
                const localTime = new Date(editAppRef.current?.updatedAt || 0);
                if (serverTime > localTime) {
                  setConflictWarning(
                    `Hồ sơ này vừa được cập nhật lúc ${serverTime.toLocaleTimeString('vi-VN')}. Lưu thay đổi của bạn sẽ ghi đè dữ liệu mới.`
                  );
                }
              }
              return updatedApp;
            });
          }
          else if (eventType === 'DELETE') {
            const deletedId = oldRow.id;
            if (selfUpdateRef.current.has(deletedId as number)) {
              selfUpdateRef.current.delete(deletedId as number);
              return; 
            }

            state.setApplications(prev => prev.filter(a => a.id !== deletedId));
            state.setDashboardApps(prev => prev.filter(a => a.id !== deletedId));
            setTotalCount(prev => Math.max(0, prev - 1));
            setSelectedApp((prev: Application | null) => prev?.id === deletedId ? null : prev);
          }
        }
      )
      .subscribe((status, err) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          retryCount = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
          retryCount++;
          if (retryCount <= MAX_RETRY) {
            const delay = Math.min(30000, 3000 * Math.pow(2, retryCount - 1));
            retryTimeout = setTimeout(() => {
              if (active) setRealtimeReconnectKey(p => p + 1);
            }, delay);
          }
        }
      });

    const notiChannelId = `rt-noti-${currentUser.id}`;
    notiChannel = supabase
      .channel(notiChannelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${String(currentUser.id)}`
        },
        (payload) => {
          if (!active) return;
          const newNoti = mapNotificationFromSnakeCase(payload.new);
          get().setNotifications(prev => {
            if (prev.some(n => n.id === newNoti.id)) return prev;
            return [newNoti, ...prev];
          });
          showToast(`🔔 Thông báo mới: ${newNoti.title}`, 'info');
        }
      )
      .subscribe();

    return () => {
      active = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      supabase.removeChannel(recordsChannel);
      supabase.removeChannel(notiChannel);
    };
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
          id: Math.random().toString(36).substr(2, 9),
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
          history: [logEntry, ...(app.history || [])]
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

  resolveIssue: async (appId, localSyncRecord) => {
    try {
      const { applications, setApplications, setDashboardApps, stepConfig } = get();
      const app = applications.find(a => a.id === appId);
      if (!app) return { success: false, message: 'Không tìm thấy hồ sơ.' };

      const { currentUser, userRole } = useAuthStore.getState();
      const stepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];

      const newHistory = [
        {
          id: `resolve-${Date.now()}`,
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

      const finalApp = await localSyncRecord(updatedAppWithAudit);

      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      return { success: true, message: 'Đã xác nhận khắc phục xong vướng mắc.' };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi cập nhật trạng thái.' };
    }
  },

  resolveError: async (app, localSyncRecord) => {
    try {
      const { setApplications, stepConfig } = get();
      const { currentUser, userRole } = useAuthStore.getState();

      const newHistory = [
        {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          stepName: 'Khắc phục lỗi',
          dept: userRole as Dept,
          receivedDate: new Date().toISOString(),
          note: 'Đã khắc phục',
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        },
        ...app.history
      ];

      const updatedApp = {
        ...app,
        status: (stepConfig[app.currentStep]?.status || 'Processing') as any,
        issueType: 'None' as const,
        issueSeverity: 'Minor' as const,
        issueNotes: '',
        issueStatus: 'RESOLVED' as const,
        isRejected: false,
        history: newHistory
      };

      const finalApp = await localSyncRecord(updatedApp);
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
        const stepCfg = stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];

        const newHistory = [
          {
            id: `resolve-${Date.now()}-${app.id}`,
            stepName: stepCfg.label,
            dept: userRole as Dept,
            receivedDate: new Date().toISOString(),
            note: 'Đã khắc phục xong sai sót/vướng mắc. Sẵn sàng chuyển bước tiếp theo.',
            performedBy: currentUser?.id,
            performedByName: currentUser?.name
          },
          ...app.history
        ];

        const auditEntry = createAuditEntry('Khắc phục vướng mắc', false, 1, app.unitCode, 'Đã xác nhận hoàn tất khắc phục sai sót/vướng mắc');

        return {
          ...app,
          status: stepCfg.status,
          isRejected: false,
          issueType: 'None' as const,
          issueSeverity: 'Minor' as const,
          issueNotes: '',
          issueStatus: 'RESOLVED' as const,
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

  proposeException: async (appId, reason, localSyncRecord) => {
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

      const finalApp = await localSyncRecord(updatedAppWithAudit);
      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      return { success: true, message: 'Đã gửi đề xuất ngoại lệ.', finalApp };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi đề xuất ngoại lệ.' };
    }
  },

  approveException: async (appId, notes, localSyncRecord) => {
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
          id: `approve-${Date.now()}`,
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

      const finalApp = await localSyncRecord(updatedAppWithAudit);
      setApplications(prev => prev.map(a => a.id === appId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === appId ? finalApp : a));

      return { success: true, message: 'Đã phê duyệt ngoại lệ thành công.', finalApp };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi phê duyệt ngoại lệ.' };
    }
  },

  stepTransition: async (app, nextStep, note, localSyncRecord, deleteAllNotificationsForRecord) => {
    const { currentUser, userRole } = useAuthStore.getState();
    const { setApplications, setDashboardApps, stepConfig } = get();

    const transitionCheck = WorkflowEngine.validateTransition(app, nextStep, userRole);
    if (!transitionCheck.success) {
      if (transitionCheck.requiresHandoverDate) {
        return { success: false, message: '', requiresHandoverDate: true };
      }
      return { success: false, message: transitionCheck.message || 'Lỗi chuyển bước', type: transitionCheck.type as 'error' | 'warning' };
    }

    const targetStep = transitionCheck.nextStep || nextStep;
    const workflowSteps = app.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
    const currentIdx = workflowSteps.indexOf(app.currentStep as StepName);
    const nextIdx = workflowSteps.indexOf(targetStep);
    const isMovingForward = nextIdx > currentIdx;

    const fullNow = new Date().toISOString();
    const prevHistory = [...app.history];
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
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    const updatedApp = {
      ...app,
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
      const finalApp = await localSyncRecord(updatedApp);

      if (targetStep === 'Hoan_Tat') {
        await deleteAllNotificationsForRecord(app.id);
      }

      setApplications(prev => prev.map(a => a.id === app.id ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === app.id ? finalApp : a));

      return {
        success: true,
        message: `Đã chuyển hồ sơ sang bước: ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label} (Đã đồng bộ Supabase)`,
        finalApp
      };
    } catch (error) {
      console.error('Supabase transition error:', error);
      return { success: false, message: 'Lỗi đồng bộ Supabase. Hồ sơ chưa được chuyển bước — vui lòng thử lại.' };
    }
  },

  rejectApp: async (app, reason, localSyncRecord, createNotification) => {
    const { currentUser, userRole } = useAuthStore.getState();
    const { users, stepConfig, setApplications, setDashboardApps } = get();

    const allowedDepts: string[] = ['PTT', 'KT', 'PTDA', 'MANAGER', 'DIRECTOR', 'ADMIN', 'MANAGER_ALL', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'];
    if (!allowedDepts.includes(userRole)) {
      return { success: false, message: 'Bạn không có quyền Trả về / Yêu cầu bổ sung hồ sơ.' };
    }

    const stepKeys = Object.keys(stepConfig);
    const currentIndex = stepKeys.indexOf(app.currentStep);
    const prevStep = currentIndex > 0 ? stepKeys[currentIndex - 1] as StepName : app.currentStep;

    const newHistory = [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stepName: 'Yêu cầu chỉnh sửa / Bổ sung',
        dept: userRole as Dept,
        receivedDate: new Date().toISOString(),
        note: `Hồ sơ sai sót/cần bổ sung: ${reason}`,
        performedBy: currentUser?.id,
        performedByName: currentUser?.name
      },
      ...app.history
    ];

    const updatedApp = {
      ...updateAppIssue(app, reason, 'Sai sót Khác'),
      currentStep: prevStep,
      rejectionCount: (app.rejectionCount || 0) + 1,
      isRejected: true,
      rejectionReason: reason,
      history: newHistory,
    };

    try {
      const prevStepConfig = stepConfig[prevStep] || INITIAL_STEP_CONFIG[prevStep];
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

      const finalApp = await localSyncRecord(updatedApp);
      const oldId = app.id;

      setApplications(prev => prev.map(a => a.id === oldId ? finalApp : a));
      setDashboardApps(prev => prev.map(a => a.id === oldId ? finalApp : a));

      return { success: true, message: 'Hồ sơ đã được trả về giai đoạn 1 và cập nhật Supabase thành công.', finalApp };
    } catch (error) {
      console.error('Supabase reject error:', error);
      return { success: false, message: 'Lỗi khi lưu yêu cầu bổ sung lên Supabase.' };
    }
  },

  bulkRejectApps: async (selectedIds, reason) => {
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
      const updatedApps = appsToReject.map(app => {
        const stepKeys = Object.keys(stepConfig);
        const currentIndex = stepKeys.indexOf(app.currentStep);
        const prevStep = currentIndex > 0 ? stepKeys[currentIndex - 1] as StepName : app.currentStep;

        const auditEntry = createAuditEntry('Yêu cầu chỉnh sửa / Bổ sung', true, 1, app.unitCode, `Hồ sơ sai sót/cần bổ sung: ${reason}`);

        return {
          ...updateAppIssue(app, reason, 'Sai sót Khác'),
          currentStep: prevStep,
          rejectionCount: (app.rejectionCount || 0) + 1,
          isRejected: true,
          rejectionReason: reason,
          auditTrail: [auditEntry, ...(app.auditTrail || [])],
          history: [
            {
              id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              stepName: 'Yêu cầu chỉnh sửa / Bổ sung',
              dept: userRole as Dept,
              receivedDate: new Date().toISOString(),
              note: `Hồ sơ bị trả về hàng loạt: ${reason}`,
              performedBy: currentUser?.id,
              performedByName: currentUser?.name
            },
            ...app.history
          ]
        };
      });

      const finalApps = await bulkSyncRecordsToSupabase(updatedApps, applications);

      // Thu thập trước user_id dự kiến để xác thực
      const candidateUserIds = new Set<string>();
      updatedApps.forEach(app => {
        const stepKeys = Object.keys(stepConfig);
        const originalApp = applications.find(a => a.id === app.id);
        const currentIndex = stepKeys.indexOf(originalApp?.currentStep || '');
        const prevStep = currentIndex > 0 ? stepKeys[currentIndex - 1] as StepName : app.currentStep;

        const prevStepConfig = stepConfig[prevStep] || INITIAL_STEP_CONFIG[prevStep];
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
        const stepKeys = Object.keys(stepConfig);
        const originalApp = applications.find(a => a.id === app.id);
        const currentIndex = stepKeys.indexOf(originalApp?.currentStep || '');
        const prevStep = currentIndex > 0 ? stepKeys[currentIndex - 1] as StepName : app.currentStep;

        const prevStepConfig = stepConfig[prevStep] || INITIAL_STEP_CONFIG[prevStep];
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
    localBulkSync,
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

    const nowStr = new Date().toISOString().split('T')[0];
    const updatedCount = selectedAppIds.length;

    try {
      const chronoErrors: string[] = [];
      const chronoWarnings: string[] = [];

      for (const app of applications) {
        if (!selectedAppIds.includes(app.id)) continue;

        const workflowSteps = app.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
        const currentIdx = workflowSteps.indexOf(app.currentStep as StepName);

        let recordNextStep = nextStep;
        const { finalStep, isJump } = WorkflowEngine.determineTargetStep(app, nextStep);
        if (isJump) {
          recordNextStep = finalStep;
        }

        const nextIdx = workflowSteps.indexOf(recordNextStep);
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
          if (nextIdx !== currentIdx + 1 && !isJump) continue;
        }

        let appWithDateForCheck = { ...app };
        if (bulkTransitionField && dateValue) {
          const existingValue = (app as any)[bulkTransitionField.key];
          const hasExistingValue = existingValue !== null && existingValue !== undefined && existingValue !== '';
          (appWithDateForCheck as any)[bulkTransitionField.key] = hasExistingValue ? existingValue : dateValue;
        }

        const chronoError = validateDateSequence(appWithDateForCheck);
        if (chronoError) {
          if (chronoError.startsWith('⚠️')) {
            chronoWarnings.push(`Căn ${app.unitCode}: ${chronoError}`);
          } else {
            chronoErrors.push(`Căn ${app.unitCode}: ${chronoError}`);
          }
        }
      }

      if (chronoErrors.length > 0) {
        return { success: false, message: `Lỗi trình tự ngày: ${chronoErrors[0]}`, type: 'error' };
      }

      let actuallyUpdatedCount = 0;

      const updatedApps = applications.map(app => {
        if (!selectedAppIds.includes(app.id)) return app;

        const workflowSteps = app.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
        const currentIdx = workflowSteps.indexOf(app.currentStep as StepName);

        let appWithDate = { ...app };
        if (bulkTransitionField && dateValue) {
          const existingValue = (app as any)[bulkTransitionField.key];
          const hasExistingValue = existingValue !== null && existingValue !== undefined && existingValue !== '';
          (appWithDate as any)[bulkTransitionField.key] = hasExistingValue ? existingValue : dateValue;
        }

        let recordNextStep = nextStep;
        const transitionCheck = WorkflowEngine.validateTransition(appWithDate, nextStep, userRole);
        if (transitionCheck.success && transitionCheck.nextStep) {
          recordNextStep = transitionCheck.nextStep;
        }

        const nextIdx = workflowSteps.indexOf(recordNextStep);
        const isMovingForward = nextIdx > currentIdx;

        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
          if (nextIdx !== currentIdx + 1 && recordNextStep !== transitionCheck.nextStep) {
            return app;
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

        if (recordNextStep === 'S2_KT_Ban_giao' && ktHandoverDate) {
          appWithDate.ktHandoverToPtdaDate = ktHandoverDate;
        }

        let targetStep = recordNextStep;

        const prevHistory = [...appWithDate.history];
        if (prevHistory.length > 0) {
          prevHistory[0] = { ...prevHistory[0], completedDate: nowStr };
        }

        const note = `Chuyển hàng loạt ${dateValue ? `(Cập nhật ${bulkTransitionField?.label}: ${dateValue})` : ''}`;

        const nextDeptLabel = (stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).dept;
        const handoverNote = `Hồ sơ đã hoàn tất và tự động bàn giao sang bộ phận ${nextDeptLabel}`;

        const newHistory = [
          {
            id: `hist-${Date.now()}-${appWithDate.id}`,
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
              updatedCount,
              appWithDate.unitCode,
              `Từ: ${(stepConfig[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep]).label} -> ${(stepConfig[targetStep] || INITIAL_STEP_CONFIG[targetStep]).label}`
            ),
            ...(appWithDate.auditTrail || [])
          ]
        };
      });

      if (actuallyUpdatedCount === 0) {
        return { success: false, message: 'Không có hồ sơ nào đủ điều kiện để thực hiện chuyển bước này hàng loạt.', type: 'warning' };
      }

      const appsToSync = updatedApps.filter(app => {
        const original = applications.find(a => a.id === app.id);
        return original && original.currentStep !== app.currentStep;
      });

      const finalApps = await localBulkSync(appsToSync, updatedApps);
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
        finalMessage = `Đã xử lý hàng loạt ${actuallyUpdatedCount} hồ sơ thành công. Lưu ý: ${notifyResult.skippedCount} người nhận thông báo dự kiến đã không còn trong hệ thống.`;
        finalType = 'warning';
      }

      return {
        success: true,
        message: finalMessage,
        type: finalType,
        actuallyUpdatedCount,
        chronoWarnings,
        notifyResult,
        finalApps
      };
    } catch (error) {
      console.error('Supabase bulk transition error:', error);
      return { success: false, message: 'Lỗi khi cập nhật hàng loạt lên Supabase.', type: 'error' };
    }
  }
}));
