const fs = require('fs');

const appContent = fs.readFileSync('src/App.tsx', 'utf8');

const getOverdueInfoRegex = /import \{[^}]*getOverdueInfo[^}]*\} from '\.\/utils\/appUtils';/;
const diffDaysRegex = /import \{ diffDays \} from '\.\/utils\/dateUtils';/;

const calculateKpisStart = appContent.indexOf('const kpis: KPI = useMemo(() => {');
const calculateKpisEnd = appContent.indexOf('const [isTableDense, setIsTableDense] = useState(false);', calculateKpisStart);

if (calculateKpisStart === -1 || calculateKpisEnd === -1) {
  console.log("Could not find blocks in App.tsx");
  process.exit(1);
}

const blocks = appContent.substring(calculateKpisStart, calculateKpisEnd);

let hookCode = `
import { useMemo } from 'react';
import { useDataStore } from '../stores/useDataStore';
import { getOverdueInfo, calculateDaysDiff } from '../utils/appUtils';
import { diffDays } from '../utils/dateUtils';
import { Application, KPI, Project, Dept } from '../types';
import { STEP_CONFIG as INITIAL_STEP_CONFIG } from '../constants';
import { useDashboardStats as useLegacyStats } from '../modules/dashboard/useDashboardStats';
import { RotateCcw, Clock, AlertTriangle, AlertCircle, History as HistoryIcon } from 'lucide-react';

export function useDashboardStats(
  selectedProjectId: string | null,
  selectedProject: Project | undefined,
  dashboardTab: 'ALL' | 'SELF_SERVICE' | 'LOAN'
) {
  const { dashboardApps, stepConfig, slaConfig, applications } = useDataStore();
  
  // Tránh lỗi khi gọi
  const enrichedDashboardApps = useMemo(() => {
    return (dashboardApps || []).map((a: any) => ({
      ...a,
    }));
  }, [dashboardApps]);

  const stats = useLegacyStats(enrichedDashboardApps);

  ${blocks.replace(/const kpis: KPI = useMemo/g, 'const kpis: KPI = useMemo')
          .replace(/const roleKpis = useMemo/g, 'const roleKpis = useMemo')
          .replace(/const computeChartData =/g, 'const computeChartData =')
          .replace(/const chartData = useMemo/g, 'const chartData = useMemo')
          .replace(/const progressChartData = useMemo/g, 'const progressChartData = useMemo')
          .replace(/const loanPieData = useMemo/g, 'const loanPieData = useMemo')
          .replace(/const overallPieData = useMemo/g, 'const overallPieData = useMemo')}

  return {
    kpis,
    roleKpis,
    stats,
    chartData,
    progressChartData,
    loanPieData,
    overallPieData,
    overallPieTotal,
    loanRatioTotal
  };
}
`;

fs.writeFileSync('src/hooks/useDashboardStats.ts', hookCode);
console.log("Hook written.");
