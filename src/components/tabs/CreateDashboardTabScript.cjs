const fs = require('fs');

let content = fs.readFileSync('src/components/tabs/DashboardTab.tsx', 'utf-8');

const header = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { StatCard } from '../AppSubComponents';
import { 
  Building, Clock, FileText, CheckCircle, AlertTriangle, Play, FastForward, Inbox, ChevronDown, Check, Target, Activity, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend, PieChart as RechartsPieChart, Pie, Cell 
} from 'recharts';

export const DashboardTab = ({
  activeTab,
  userRole,
  dashboardApps,
  applications,
  theme,
  dashboardFilter,
  handleDashboardClick,
  stats,
  chartData,
  monthlySlaData,
  projectPerformance,
  selectedProject
}: any) => {

  return (
<>
`;

const footer = `
</>
  );
};
`;

fs.writeFileSync('src/components/tabs/DashboardTab.tsx', header + content + footer);
