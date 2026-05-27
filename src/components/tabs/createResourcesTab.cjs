const fs = require('fs');

let content = fs.readFileSync('src/components/tabs/ResourcesTab.tsx', 'utf-8');

const header = `import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  Files, CheckCircle2, Upload, FileSpreadsheet, Download, HelpCircle 
} from 'lucide-react';

export const ResourcesTab = ({
  activeTab,
  theme,
  userRole,
  handleDownloadTemplate,
  DOC_CHECKLIST_ITEMS
}: any) => {

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/tabs/ResourcesTab.tsx', header + content + footer);
