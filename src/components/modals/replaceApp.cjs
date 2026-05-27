const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const startIndex = lines.findIndex(line => line.includes('{/* Detail Modal */}'));
let endIndex = -1;
for (let i = startIndex; i < lines.length; i++) {
  if (lines[i].includes('</AnimatePresence>') && i > startIndex + 100) {
    endIndex = i;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `      <ApplicationDetailModal
        selectedApp={selectedApp}
        editApp={editApp}
        setSelectedApp={setSelectedApp}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        theme={theme}
        canEdit={canEdit}
        canView={canView}
        userRole={userRole}
        currentUser={currentUser}
        stepConfig={stepConfig}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        handleFieldChange={handleFieldChange}
        conflictWarning={conflictWarning}
        handleUpdateApp={handleUpdateApp}
        handleDeleteApp={handleDeleteApp}
        setIsHandoverTicketOpen={setIsHandoverTicketOpen}
        handleFileUpload={handleFileUpload}
        handleDeleteFile={handleDeleteFile}
        setPreviewFile={setPreviewFile}
        handleResolveIssue={handleResolveIssue}
        calculateDaysBetweenDates={calculateDaysBetweenDates}
        formatDate={formatDate}
      />`;

  lines.splice(startIndex, endIndex - startIndex + 1, newContent);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log('Could not find start or end index:', startIndex, endIndex);
}
