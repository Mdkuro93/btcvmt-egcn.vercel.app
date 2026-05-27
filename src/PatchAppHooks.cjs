const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const hookImport = "import { useExcelImport } from './hooks/useExcelImport';";
lines.splice(12, 0, hookImport);

// find start of inferStepFromDates and end of handleConfirmImport
let start1 = lines.findIndex(l => l.includes('const inferStepFromDates ='));
let end1 = lines.findIndex((l, i) => i > start1 && l.includes('const handleBulkPrint = () => {'));

if (start1 !== -1 && end1 !== -1) {
    console.log("Found logic block to remove", start1, end1);
    lines.splice(start1, end1 - start1);
}

// Find state variables to remove
let statesToRemove = [
    "const [isImporting, setIsImporting] =",
    "const [importPreviewData, setImportPreviewData] =",
    "const [healDone, setHealDone] ="
];

statesToRemove.forEach(state => {
    let idx = lines.findIndex(l => l.includes(state));
    if (idx !== -1) {
        lines.splice(idx, 1);
    }
});

// Insert hook initialization just before handleParseTemplate or just somewhere at the top where dependencies exist
let hookInit = `
  const {
    isImporting,
    importPreviewData,
    setImportPreviewData,
    handleDownloadTemplate,
    handleParseTemplate,
    handleConfirmImport,
    healDone,
    healExistingRecords
  } = useExcelImport({
    applications,
    projects,
    isManagementEdit,
    selectedProjectId,
    dashboardApps,
    slaConfig,
    showToast,
    fetchApplications,
    setApplications,
    setHighlightedAppId,
    setActiveTab,
    visibleProjects,
    bulkSyncRecordsToSupabase
  });
`;

let targetIdx = lines.findIndex(l => l.includes('const handleMobileSignal = setInterval'));
lines.splice(targetIdx, 0, hookInit);

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log("App.tsx patched to use hook");
