const fs = require('fs');

let content = fs.readFileSync('src/components/modals/ApplicationDetailModal.tsx', 'utf-8');
content = content.replace('<Component>\n', '');
content = content.replace('      {/* Detail Modal */}\n', '');
content = content.replace('</Component>', '');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Application, UserProfile, Dept, StepName, IssueType, IssueSeverity } from '../../types';
import { cn } from '../../lib/utils';
import { 
  X, CheckCircle, Clock, AlertCircle, RefreshCw, FileText, Download, User, Activity, Edit3, Save, 
  MapPin, Hash, Trash2, Printer, ChevronDown, ChevronUp, Upload, CheckSquare, Search, Eye
} from 'lucide-react';
import { DetailCard, StatusBadge } from '../AppSubComponents';

export const ApplicationDetailModal = ({
  selectedApp,
  editApp,
  setSelectedApp,
  isEditing,
  setIsEditing,
  theme,
  canEdit,
  canView,
  userRole,
  currentUser,
  stepConfig,
  expandedSections,
  setExpandedSections,
  detailTab,
  setDetailTab,
  handleFieldChange,
  conflictWarning,
  handleUpdateApp,
  handleDeleteApp,
  setIsHandoverTicketOpen,
  handleFileUpload,
  handleDeleteFile,
  setPreviewFile,
  handleResolveIssue,
  calculateDaysBetweenDates,
  formatDate
}: any) => {

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/modals/ApplicationDetailModal.tsx', header + content + footer);
