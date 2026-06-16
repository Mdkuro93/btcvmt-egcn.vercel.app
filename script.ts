import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
if (!content.includes('useModalStore')) {
  content = content.replace(
    'import { CreateApplicationModal } from \'./components/modals/CreateApplicationModal\';',
    'import { CreateApplicationModal } from \'./components/modals/CreateApplicationModal\';\nimport { useModalStore } from \'./stores/useModalStore\';\nimport { useDataStore } from \'./stores/useDataStore\';'
  );
}

// Inject hooks
const hooksCode = `
  // Modal Store
  const {
    isCreateModalOpen, setIsCreateModalOpen,
    isUserModalOpen, setIsUserModalOpen,
    isProjectModalOpen, setIsProjectModalOpen,
    isBulkDocumentOpen, setIsBulkDocumentOpen,
    isBulkTransitionModalOpen, setIsBulkTransitionModalOpen,
    isChangePasswordModalOpen, setIsChangePasswordModalOpen,
    isHandoverTicketOpen, setIsHandoverTicketOpen,
    isUploadingShared, setIsUploadingShared,
    previewFile, setPreviewFile,
    selfServiceHandoverModal, setSelfServiceHandoverModal,
    isReportIssueFormOpen, setIsReportIssueFormOpen,
    editUser, setEditUser,
    editingProject, setEditingProject,
    editApp, setEditApp,
    selectedApp, setSelectedApp
  } = useModalStore();

  // Data Store
  const {
    applications, setApplications,
    dashboardApps, setDashboardApps,
    projects, setProjects,
    users, setUsers,
    notifications, setNotifications,
    taskReminders, setTaskReminders,
    stepConfig, setStepConfig,
    slaConfig, setSlaConfig,
    checklistTemplates, setChecklistTemplates,
    handoverTemplate, setHandoverTemplate,
    isLoadingApps, setIsLoadingApps,
    isLoadingDashboard, setIsLoadingDashboard,
    isLoadingConfig, setIsLoadingConfig,
    isInitialLoading, setIsInitialLoading,
    isAuthLoading, setIsAuthLoading,
    fetchInitialData, initRealtime
  } = useDataStore();
`;

if (!content.includes('useModalStore()')) {
  content = content.replace(
    'export default function App() {\n',
    'export default function App() {\n' + hooksCode
  );
}

// Remove state declarations
const statesToRemove = [
  'const [notifications, setNotifications] = useState<AppNotification[]>([]);',
  'const [taskReminders, setTaskReminders] = useState<AppNotification[]>([]);',
  'const [users, setUsers] = useState<UserProfile[]>([]);',
  'const [previewFile, setPreviewFile] = useState<ScannedFile | null>(null);',
  'const [isBulkDocumentOpen, setIsBulkDocumentOpen] = useState(false);',
  'const [isUploadingShared, setIsUploadingShared] = useState(false);',
  'const [stepConfig, setStepConfig] = useState<Record<string, { label: string, dept: Dept, status: UnitStatus, slaDays?: number, active: boolean }>>(INITIAL_STEP_CONFIG);',
  'const [projects, setProjects] = useState<Project[]>([]);',
  'const [applications, setApplications] = useState<Application[]>([]);',
  'const [dashboardApps, setDashboardApps] = useState<Application[]>([]);',
  'const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);',
  'const [isLoadingApps, setIsLoadingApps] = useState(true);',
  'const [isLoadingConfig, setIsLoadingConfig] = useState(true);',
  'const [isInitialLoading, setIsInitialLoading] = useState(true);',
  'const [isAuthLoading, setIsAuthLoading] = useState(true);',
  'const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);',
  'const [selfServiceHandoverModal, setSelfServiceHandoverModal] = useState<{',
  'isOpen: boolean;',
  'appId: string | number | null;',
  'unitCode: string;',
  '}>({ isOpen: false, appId: null, unitCode: \'\' });',
  'const [slaConfig, setSlaConfig] = useState<Record<string, number>>({});',
  'const [checklistTemplates, setChecklistTemplates] = useState<string[]>([]);',
  'const [handoverTemplate, setHandoverTemplate] = useState(() => {',
  'const [isUserModalOpen, setIsUserModalOpen] = useState(false);',
  'const [isBulkTransitionModalOpen, setIsBulkTransitionModalOpen] = useState(false);',
  'const [editUser, setEditUser] = useState<UserProfile | null>(null);',
  'const [editApp, setEditApp] = useState<Application | null>(null);',
  'const [selectedApp, setSelectedApp] = useState<Application | null>(null);',
  'const [isHandoverTicketOpen, setIsHandoverTicketOpen] = useState(false);',
  'const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);',
  'const [editingProject, setEditingProject] = useState<Project | null>(null);',
  'const [isReportIssueFormOpen, setIsReportIssueFormOpen] = useState(false);',
  'const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);',
];

statesToRemove.forEach(stateStr => {
  content = content.replace(stateStr, '// ' + stateStr);
});

// Since some are multiline, the array replace above for single lines works, but we may need to replace handoverTemplate init manually.
content = content.replace(
  /const \[handoverTemplate, setHandoverTemplate\] = useState\(\(\) => \{[\s\S]*?return parsed;\n    \} catch \(e\) \{\n[\s\S]*?\}\n  \}\);\n/,
  '// handoverTemplate moved to store\n'
);

// Remove fetchInitialData and its useEffect
content = content.replace(
  /  \/\/ Fetch all data from Supabase\n  useEffect\(\(\) => \{\n    const fetchInitialData = async \(\) => \{[\s\S]*?\}\(\);\n  \}, \[\]\);\n/,
  '  useEffect(() => {\n    fetchInitialData(showToast);\n  }, []);\n'
);

// Remove initRealtime
content = content.replace(
  /  \/\/ --------------------------------------------------------------------------\n  \/\/ 2\) REALTIME SUBSCRIPTION \& FETCH APPLICATIONS \n  \/\/ --------------------------------------------------------------------------\n  useEffect\(\(\) => \{[\s\S]*?\/\/ Subscribe thay đổi bảng notifications\n[\s\S]*?\.subscribe\(\);\n    \};\n\n    initRealtime\(\);\n[\s\S]*?\}, \[currentUser\?.id, realtimeReconnectKey, userRole\]\); \/\/ assignedNames omitted to prevent infinite reconnect loops/,
  `
  // --------------------------------------------------------------------------
  // 2) REALTIME SUBSCRIPTION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || isAuthLoading) return;
    const cleanup = initRealtime(
      currentUser,
      userRole,
      assignedNamesRef.current,
      editAppRef,
      isEditingRef,
      selfUpdateRef,
      setConflictWarning,
      setSelectedApp,
      setTotalCount,
      setRealtimeStatus,
      setRealtimeReconnectKey,
      showToast
    );
    return cleanup;
  }, [currentUser?.id, realtimeReconnectKey, userRole, isAuthLoading]);
  `
);

fs.writeFileSync('src/App.tsx', content);
console.log('Done refactoring');
