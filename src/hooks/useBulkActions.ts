import React, { useState, useCallback } from 'react';
import { Application, IssueType, IssueSeverity } from '../types';

export interface UseBulkActionsProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>> | ((apps: Application[]) => void);
  bulkSyncRecordsToSupabase: (records: any[], allApplications: Application[]) => Promise<Application[]>;
  updateAppIssue: (app: Application, note: string, type: IssueType, severity: IssueSeverity) => Application;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setIsSavingApp: (saving: boolean) => void;
}

export function useBulkActions({
  applications,
  setApplications,
  bulkSyncRecordsToSupabase,
  updateAppIssue,
  showToast,
  setIsSavingApp,
}: UseBulkActionsProps) {
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  
  // Bulk note modal states
  const [isBulkNoteOpen, setIsBulkNoteOpen] = useState(false);
  const [bulkNoteText, setBulkNoteText] = useState('');

  // Bulk issue modal states
  const [isBulkIssueOpen, setIsBulkIssueOpen] = useState(false);
  const [bulkIssueNote, setBulkIssueNote] = useState('');
  const [bulkIssueType, setBulkIssueType] = useState<IssueType>('Sai sót Khác');
  const [bulkIssueSeverity, setBulkIssueSeverity] = useState<IssueSeverity>('Trung bình');

  const handleBulkUpdateNote = useCallback(async () => {
    if (selectedAppIds.length === 0 || !bulkNoteText.trim()) return;
    setIsSavingApp(true);
    
    try {
      const updatedApps = applications.map(app => {
        if (selectedAppIds.includes(app.id)) {
          return { ...app, note: bulkNoteText };
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
      alert('Có lỗi xảy ra, vui lòng thử lại');
      showToast('Lỗi khi cập nhật ghi chú lên Supabase.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  }, [selectedAppIds, bulkNoteText, applications, setApplications, bulkSyncRecordsToSupabase, showToast, setIsSavingApp]);

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
      alert('Có lỗi xảy ra, vui lòng thử lại');
      showToast('Có lỗi xảy ra khi ghi nhận vướng mắc hàng loạt.', 'error');
    } finally {
      setIsSavingApp(false);
    }
  }, [selectedAppIds, bulkIssueNote, bulkIssueType, bulkIssueSeverity, applications, setApplications, updateAppIssue, bulkSyncRecordsToSupabase, showToast, setIsSavingApp]);

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
  };
}
