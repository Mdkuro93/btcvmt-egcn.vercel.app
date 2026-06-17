import { create } from 'zustand';
import { ScannedFile, UserProfile, Dept, Project, Application } from '../types';

interface ModalState {
  // Modal visibility flags
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;

  isUserModalOpen: boolean;
  setIsUserModalOpen: (isOpen: boolean) => void;

  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (isOpen: boolean) => void;

  isBulkDocumentOpen: boolean;
  setIsBulkDocumentOpen: (isOpen: boolean) => void;

  isBulkTransitionModalOpen: boolean;
  setIsBulkTransitionModalOpen: (isOpen: boolean) => void;

  isChangePasswordModalOpen: boolean;
  setIsChangePasswordModalOpen: (isOpen: boolean) => void;

  isHandoverTicketOpen: boolean;
  setIsHandoverTicketOpen: (isOpen: boolean) => void;

  isUploadingShared: boolean;
  setIsUploadingShared: (isUploading: boolean) => void;

  previewFile: ScannedFile | null;
  setPreviewFile: (file: ScannedFile | null) => void;

  selfServiceHandoverModal: { app: Application; nextStep: any } | null;
  setSelfServiceHandoverModal: (data: { app: Application; nextStep: any } | null) => void;

  isReportIssueFormOpen: boolean;
  setIsReportIssueFormOpen: (isOpen: boolean) => void;

  // Specific data bindings that were tied to modals in App.tsx
  editUser: UserProfile | null;
  setEditUser: (user: UserProfile | null) => void;

  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;
  
  editApp: Application | null;
  setEditApp: (app: Application | null) => void;

  selectedApp: Application | null;
  setSelectedApp: (updater: Application | null | ((prev: Application | null) => Application | null)) => void;

  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  setConfirmDialog: (dialog: { isOpen: boolean; title: string; message: string; onConfirm: () => void } | null) => void;
  askConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isCreateModalOpen: false,
  setIsCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),

  isUserModalOpen: false,
  setIsUserModalOpen: (isOpen) => set({ isUserModalOpen: isOpen }),

  isProjectModalOpen: false,
  setIsProjectModalOpen: (isOpen) => set({ isProjectModalOpen: isOpen }),

  isBulkDocumentOpen: false,
  setIsBulkDocumentOpen: (isOpen) => set({ isBulkDocumentOpen: isOpen }),

  isBulkTransitionModalOpen: false,
  setIsBulkTransitionModalOpen: (isOpen) => set({ isBulkTransitionModalOpen: isOpen }),

  isChangePasswordModalOpen: false,
  setIsChangePasswordModalOpen: (isOpen) => set({ isChangePasswordModalOpen: isOpen }),

  isHandoverTicketOpen: false,
  setIsHandoverTicketOpen: (isOpen) => set({ isHandoverTicketOpen: isOpen }),

  isUploadingShared: false,
  setIsUploadingShared: (isOpen) => set({ isUploadingShared: isOpen }),

  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),

  selfServiceHandoverModal: null,
  setSelfServiceHandoverModal: (data) => set({ selfServiceHandoverModal: data }),

  isReportIssueFormOpen: false,
  setIsReportIssueFormOpen: (isOpen) => set({ isReportIssueFormOpen: isOpen }),

  editUser: null,
  setEditUser: (user) => set({ editUser: user }),

  editingProject: null,
  setEditingProject: (project) => set({ editingProject: project }),

  editApp: null,
  setEditApp: (app) => set({ editApp: app }),

  selectedApp: null,
  setSelectedApp: (updater) => set((state) => ({ selectedApp: typeof updater === 'function' ? updater(state.selectedApp) : updater })),

  confirmDialog: null,
  setConfirmDialog: (dialog) => set({ confirmDialog: dialog }),
  askConfirm: (title, message, onConfirm) => set({ confirmDialog: { isOpen: true, title, message, onConfirm } }),
}));
