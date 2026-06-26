import React, { useState, useCallback, useMemo } from 'react';
import { Application, IssueType, IssueSeverity, UserProfile, ApplicationStepHistory, AuditTrailEntry, Dept } from '../types';
import { STEP_CONFIG } from '../constants';
import { generateUUID } from '../utils/appUtils';

export interface UseBulkActionsProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>> | ((apps: Application[]) => void);
  bulkSyncRecordsToSupabase: (records: any[], allApplications: Application[]) => Promise<Application[]>;
  updateAppIssue: (app: Application, note: string, type: IssueType, severity: IssueSeverity) => Application;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setIsSavingApp: (saving: boolean) => void;
  users: UserProfile[];
  currentUser: UserProfile | null;
}

export function useBulkActions({
  applications,
  setApplications,
  bulkSyncRecordsToSupabase,
  updateAppIssue,
  showToast,
  setIsSavingApp,
  users,
  currentUser,
}: UseBulkActionsProps) {
  const [selectedAppIds, setSelectedAppIds] = useState<(string | number)[]>([]);
  
  // Bulk note modal states
  const [isBulkNoteOpen, setIsBulkNoteOpen] = useState(false);
  const [bulkNoteText, setBulkNoteText] = useState('');

  // Bulk issue modal states
  const [isBulkIssueOpen, setIsBulkIssueOpen] = useState(false);
  const [bulkIssueNote, setBulkIssueNote] = useState('');
  const [bulkIssueType, setBulkIssueType] = useState<IssueType>('Sai sót Khác');
  const [bulkIssueSeverity, setBulkIssueSeverity] = useState<IssueSeverity>('Moderate');

  // Bulk assign owner states
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkAssignUserId, setBulkAssignUserId] = useState('');

  const handleBulkUpdateNote = useCallback(async () => {
    if (selectedAppIds.length === 0 || !bulkNoteText.trim()) return;
    setIsSavingApp(true);
    
    try {
      const nowStr = new Date().toISOString();
      const updatedApps = applications.map(app => {
        if (selectedAppIds.includes(app.id)) {
          // ✅ FIX: Lỗi 2 - Ghi nhận history và audit trail cho cập nhật ghi chú hàng loạt
          const historyEntry: ApplicationStepHistory = {
            id: generateUUID(),
            stepName: STEP_CONFIG[app.currentStep]?.label || app.currentStep,
            dept: (currentUser?.dept as Dept) || 'PTT',
            receivedDate: nowStr,
            note: `[GHI CHÚ] ${bulkNoteText}`,
            performedBy: currentUser?.id,
            performedByName: currentUser?.name
          };

          const auditEntry: AuditTrailEntry = {
            id: generateUUID(),
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Hệ thống',
            action: 'Cập nhật ghi chú hàng loạt',
            changes: bulkNoteText.substring(0, 50),
            timestamp: nowStr
          };

          return { 
            ...app, 
            note: bulkNoteText,
            history: [historyEntry, ...(app.history || [])],
            auditTrail: [auditEntry, ...(app.auditTrail || [])]
          };
        }
        return app;
      });

      const appsToSync = updatedApps.filter(app => selectedAppIds.includes(app.id));

      // Perform bulk upsert to database-sync layer
      const finalApps = await bulkSyncRecordsToSupabase(appsToSync, updatedApps);

      setApplications(finalApps);
      showToast(`Đã cập nhật ghi chú cho ${selectedAppIds.length} hồ sơ và đồng bộ Supabase thành công.`, 'success');
      setIsBulkNoteOpen(false);
      setBulkNoteText('');
      setSelectedAppIds([]);
    } catch (error: any) {
      console.error('Supabase bulk note update error:', error);
      showToast('Lỗi khi cập nhật ghi chú lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  }, [selectedAppIds, bulkNoteText, applications, setApplications, bulkSyncRecordsToSupabase, showToast, setIsSavingApp, currentUser]);

  const handleBulkReportIssue = useCallback(async () => {
    if (selectedAppIds.length === 0 || !bulkIssueNote.trim()) return;
    setIsSavingApp(true);

    try {
      const appsToUpdate = applications.filter(app => selectedAppIds.includes(app.id));
      const updatedApps = appsToUpdate.map(app => 
        updateAppIssue(app, bulkIssueNote, bulkIssueType, bulkIssueSeverity)
      );

      // Sync to database-sync layer
      const finalApps = await bulkSyncRecordsToSupabase(updatedApps, applications);
      setApplications(finalApps);

      showToast(`Đã ghi nhận vướng mắc cho ${selectedAppIds.length} hồ sơ.`, 'success');
      setIsBulkIssueOpen(false);
      setBulkIssueNote('');
      setSelectedAppIds([]);
    } catch (err) {
      console.error('Error reporting bulk issue:', err);
      showToast('Có lỗi xảy ra khi ghi nhận vướng mắc hàng loạt.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  }, [selectedAppIds, bulkIssueNote, bulkIssueType, bulkIssueSeverity, applications, setApplications, updateAppIssue, bulkSyncRecordsToSupabase, showToast, setIsSavingApp]);

  const handleBulkAssign = useCallback(async () => {
    if (selectedAppIds.length === 0 || !bulkAssignUserId) return;
    setIsSavingApp(true);
    try {
      const assignedUser = users.find(u => u.id === bulkAssignUserId);
      if (!assignedUser) return;
      
      const nowStr = new Date().toISOString();
      const updatedApps = applications.map(app => {
        if (!selectedAppIds.includes(app.id)) return app;

        // ✅ FIX: Lỗi 3 - Ghi nhận history và audit trail cho gán hồ sơ hàng loạt
        const historyEntry: ApplicationStepHistory = {
          id: generateUUID(),
          stepName: STEP_CONFIG[app.currentStep]?.label || app.currentStep,
          dept: (currentUser?.dept as Dept) || 'PTT',
          receivedDate: nowStr,
          note: `Gán hồ sơ cho nhân viên phụ trách: ${assignedUser.name}`,
          performedBy: currentUser?.id,
          performedByName: currentUser?.name
        };

        const auditEntry: AuditTrailEntry = {
          id: generateUUID(),
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Hệ thống',
          action: 'Gán nhân viên phụ trách hàng loạt',
          changes: `Gán cho: ${assignedUser.name} (${assignedUser.dept})`,
          timestamp: nowStr
        };

        return {
          ...app,
          assignedToId: assignedUser.id,
          assignedToName: assignedUser.name,
          history: [historyEntry, ...(app.history || [])],
          auditTrail: [auditEntry, ...(app.auditTrail || [])]
        };
      });
      
      const appsToSync = updatedApps.filter(app => selectedAppIds.includes(app.id));
      const finalApps = await bulkSyncRecordsToSupabase(appsToSync, updatedApps);
      setApplications(finalApps);
      showToast(`Đã gán ${selectedAppIds.length} hồ sơ cho ${assignedUser.name}`, 'success');
      setIsBulkAssignOpen(false);
      setBulkAssignUserId('');
      setSelectedAppIds([]);
    } catch (error) {
      showToast('Lỗi khi gán nhân viên phụ trách', 'error');
    } finally {
      setIsSavingApp(false);
    }
  }, [selectedAppIds, bulkAssignUserId, applications, users, bulkSyncRecordsToSupabase, setApplications, showToast, setIsSavingApp, currentUser]);

  const canBulkAssign = useMemo(() => {
    const role = currentUser?.dept;
    return ['ADMIN', 'MANAGER_ALL', 'DIRECTOR', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA'].includes(role || '');
  }, [currentUser?.dept]);

  const assignableUsers = useMemo(() => {
    const role = currentUser?.dept;
    const allActive = users.filter(u => u.status === 'Active');
    
    // ADMIN / MANAGER_ALL / DIRECTOR → thấy tất cả
    if (['ADMIN', 'MANAGER_ALL', 'DIRECTOR'].includes(role || '')) {
      return allActive.filter(u => ['PTT', 'KT', 'PTDA'].includes(u.dept)); // chỉ nhân viên, không bao gồm manager/admin
    }
    // MANAGER_PTT → chỉ PTT
    if (role === 'MANAGER_PTT') return allActive.filter(u => u.dept === 'PTT');
    // MANAGER_KT → chỉ KT
    if (role === 'MANAGER_KT') return allActive.filter(u => u.dept === 'KT');
    // MANAGER_PTDA → chỉ PTDA
    if (role === 'MANAGER_PTDA') return allActive.filter(u => u.dept === 'PTDA');
    
    return []; // Không có quyền
  }, [currentUser?.dept, users]);

  return {
    selectedAppIds,
    setSelectedAppIds,
    isBulkNoteOpen,
    setIsBulkNoteOpen,
    bulkNoteText,
    setBulkNoteText,
    isBulkIssueOpen,
    setIsBulkIssueOpen,
    bulkIssueNote,
    setBulkIssueNote,
    bulkIssueType,
    setBulkIssueType,
    bulkIssueSeverity,
    setBulkIssueSeverity,
    handleBulkUpdateNote,
    handleBulkReportIssue,
    isBulkAssignOpen,
    setIsBulkAssignOpen,
    bulkAssignUserId,
    setBulkAssignUserId,
    handleBulkAssign,
    canBulkAssign,
    assignableUsers,
  };
}
