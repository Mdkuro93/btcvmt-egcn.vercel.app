const fs = require('fs');

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const createIdx = lines.findIndex(l => l.includes('{/* Create Application Modal */}'));
const createEndIdx = lines.findIndex((l, i) => i > createIdx && l.includes('</AnimatePresence>'));

const userIdx = lines.findIndex(l => l.includes('{/* User Management Modal */}'));
const userEndIdx = lines.findIndex((l, i) => i > userIdx && l.includes('</AnimatePresence>'));

if (createIdx !== -1 && createEndIdx !== -1 && userIdx !== -1 && userEndIdx !== -1) {
  // Let's replace backwards to not mess up indexes.
  
  const userModalContent = `      <UserManagementModal
        isUserModalOpen={isUserModalOpen}
        setIsUserModalOpen={setIsUserModalOpen}
        theme={theme}
        editUser={editUser}
        setEditUser={setEditUser}
        handleUpdateUser={handleUpdateUser}
        handleCreateUser={handleCreateUser}
      />`;

  lines.splice(userIdx, userEndIdx - userIdx + 1, userModalContent);
  
  const createModalContent = `      <CreateApplicationModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        theme={theme}
        newApp={newApp}
        setNewApp={setNewApp}
        formErrors={formErrors}
        visibleProjects={visibleProjects}
        handleCreateApp={handleCreateApp}
      />`;

  lines.splice(createIdx, createEndIdx - createIdx + 1, createModalContent);

  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('App.tsx patched');
} else {
  console.log('Indexes not found:', createIdx, createEndIdx, userIdx, userEndIdx);
}
