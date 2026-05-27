const fs = require('fs');

let content = fs.readFileSync('src/components/modals/CreateApplicationModal.tsx', 'utf-8');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Application, UserProfile, Project } from '../../types';
import { cn } from '../../lib/utils';
import { X, Home, Map as MapIcon, User, Key, Save } from 'lucide-react';

export const CreateApplicationModal = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  theme,
  newApp,
  setNewApp,
  formErrors,
  visibleProjects,
  handleCreateApp
}: any) => {

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/modals/CreateApplicationModal.tsx', header + content + footer);
