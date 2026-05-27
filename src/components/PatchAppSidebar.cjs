const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const start = lines.findIndex(l => l.includes('{/* Sidebar - Enhanced Blur and border */}'));
const end = lines.findIndex((l, i) => i > start && l.includes('</motion.aside>'));

if (start !== -1 && end !== -1) {
  const content = `      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        theme={theme}
        setTheme={setTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        isManagementEdit={isManagementEdit}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        expandedSidebarRegions={expandedSidebarRegions}
        setExpandedSidebarRegions={setExpandedSidebarRegions}
        currentUser={currentUser}
        realtimeStatus={realtimeStatus}
        handleLogout={handleLogout}
        isManagement={isManagement}
        hasSettingsAccess={hasSettingsAccess}
        hasUserAccess={hasUserAccess}
      />`;

  lines.splice(start, end - start + 1, content);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('App.tsx patched');
} else {
  console.log('Indexes not found:', start, end);
}
