const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('{activeTab === \'applications\' && ('));
const end = lines.findIndex((l, i) => i > start && l.includes('{activeTab === \'users\' && ('));

if (start !== -1 && end !== -1) {
  const content = `      <ApplicationsTab
        activeTab={activeTab} 
        userRole={userRole} 
        theme={theme} 
        isTableDense={isTableDense} 
        setIsTableDense={setIsTableDense} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        bulkTransitionTarget={bulkTransitionTarget} 
        setBulkTransitionTarget={setBulkTransitionTarget} 
        bulkTransitionLocation={bulkTransitionLocation} 
        setBulkTransitionLocation={setBulkTransitionLocation} 
        bulkTransitionField={bulkTransitionField} 
        setBulkTransitionField={setBulkTransitionField}
        dashboardApps={dashboardApps}
        applications={applications}
        dashboardFilter={dashboardFilter}
        selectedProject={selectedProject}
        projects={projects}
        visibleApps={visibleApps}
        displayedApps={displayedApps}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        handleSelectApp={handleSelectApp}
        handleQuickSave={handleQuickSave}
        handleSpreadsheetChange={handleSpreadsheetChange}
        handleSpreadsheetPaste={handleSpreadsheetPaste}
        handleDownloadTemplate={handleDownloadTemplate}
        handleParseTemplate={handleParseTemplate}
        handleBulkPrint={handleBulkPrint}
        handleBulkDelete={handleBulkDelete}
        handleBulkResolveIssues={handleBulkResolveIssues}
        handleToggleChecklist={handleToggleChecklist}
        setIsHandoverTicketOpen={setIsHandoverTicketOpen}
        setIsBulkDocumentModalOpen={setIsBulkDocumentModalOpen}
        setIsBulkNoteModalOpen={setIsBulkNoteModalOpen}
        checklistTemplates={checklistTemplates}
        quickEditId={quickEditId}
        quickEditData={quickEditData}
        setQuickEditId={setQuickEditId}
        setQuickEditData={setQuickEditData}
        activeCell={activeCell}
        setActiveCell={setActiveCell}
        spreadsheetChanges={spreadsheetChanges}
        spreadsheetErrors={spreadsheetErrors}
        formErrors={formErrors}
        conflictWarning={conflictWarning}
        canCreate={canCreate}
        userCanEdit={userCanEdit}
        stepConfig={stepConfig}
        getTaxStatus={getTaxStatus}
        getOverdueInfo={getOverdueInfo}
        calculateDaysDiff={calculateDaysDiff}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterLoanStatus={filterLoanStatus}
        setFilterLoanStatus={setFilterLoanStatus}
        filterSelfService={filterSelfService}
        setFilterSelfService={setFilterSelfService}
        filterIssue={filterIssue}
        setFilterIssue={setFilterIssue}
        filterSLAStatus={filterSLAStatus}
        setFilterSLAStatus={setFilterSLAStatus}
        selectedFlags={selectedFlags}
        setSelectedFlags={setSelectedFlags}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        isFieldMode={isFieldMode}
        setIsFieldMode={setIsFieldMode}
        isAdvancedFiltersOpen={isAdvancedFiltersOpen}
        setIsAdvancedFiltersOpen={setIsAdvancedFiltersOpen}
        handleSort={handleSort}
        paginatedApps={paginatedApps}
        totalPages={totalPages}
        tableRowRefs={tableRowRefs}
        highlightedAppId={highlightedAppId}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        lastSelectedIndex={lastSelectedIndex}
        setLastSelectedIndex={setLastSelectedIndex}
        currentUser={currentUser}
        isManagement={isManagement}
        hasSettingsAccess={hasSettingsAccess}
        hasUserAccess={hasUserAccess}
      />`;

  lines.splice(start, end - start, content);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('App.tsx patched 2');
}
