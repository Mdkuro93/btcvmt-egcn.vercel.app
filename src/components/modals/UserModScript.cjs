const fs = require('fs');

let content = fs.readFileSync('src/components/modals/UserManagementModal.tsx', 'utf-8');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Dept } from '../../types';
import { cn } from '../../lib/utils';
import { X, User, Key, Building, Phone, Save, CheckCircle } from 'lucide-react';

export const UserManagementModal = ({
  isUserModalOpen,
  setIsUserModalOpen,
  theme,
  editUser,
  setEditUser,
  handleUpdateUser,
  handleCreateUser
}: any) => {

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/modals/UserManagementModal.tsx', header + content + footer);
