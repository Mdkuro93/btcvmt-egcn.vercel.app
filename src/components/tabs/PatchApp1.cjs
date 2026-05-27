const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('{activeTab === \'dashboard\' && ('));
const end = lines.findIndex((l, i) => i > start && l.includes('{activeTab === \'applications\' && ('));

if (start !== -1 && end !== -1) {
  const content = `      <DashboardTab
        activeTab={activeTab}
        userRole={userRole}
        dashboardApps={dashboardApps}
        applications={applications}
        theme={theme}
        dashboardFilter={dashboardFilter}
        handleDashboardClick={handleDashboardClick}
        stats={stats}
        chartData={chartData}
        monthlySlaData={monthlySlaData}
        projectPerformance={projectPerformance}
        selectedProject={selectedProject}
      />`;

  lines.splice(start, end - start, content);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('App.tsx patched 1');
}
