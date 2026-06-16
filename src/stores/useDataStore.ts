import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Application, Project, UserProfile, AppNotification, Dept } from '../types';
import { mapFromSnakeCase, safeParse } from '../utils/mappers';
import { STEP_CONFIG as INITIAL_STEP_CONFIG } from '../constants';

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
  }
}));
