import { Application, StepName } from '../types';
import { calculateSLA } from './statusEngine';

export const calculateDaysDiff = (dateStr: string) => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const res = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(res) ? 0 : res;
};

export const calculateDaysBetweenDates = (start: string, end: string) => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export const getPhaseIndex = (step: StepName): number => {
  // Quy trình 2 (7 bước)
  if (step === 'S1_ChuanBi') return 0;
  if (['S2_KT_Tiep_Nhan', 'S2_KT_Ban_giao'].includes(step)) return 1;
  if (step === 'S3_Nop_VPDK') return 2;
  if (step === 'S4_Cho_Thong_Bao_Thue') return 3;
  if (['S5_Tai_Chinh_Khach_Hang', 'S5_1_PTDA_TiepNhan'].includes(step)) return 4;
  if (step === 'S6_Nhan_So_GCN') return 5;
  if (['S7_PTDA_Ban_Giao', 'S7_1_PTT_Tiep_Nhan', 'S7_2_Ban_Giao_Khach'].includes(step)) return 6;
  
  // Quy trình 1 (6 bước)
  if (['GD1_ChuanBi', 'GD1_Cho_KT_TiepNhan'].includes(step)) return 0;
  if (['GD2_Cho_Nop_VPDK'].includes(step)) return 1;
  if (step === 'GD3_Cho_TBThue') return 2;
  if (['GD4_Cho_Nop_NVTC', 'GD4_Cho_KT_TiepNhan_LaySo'].includes(step)) return 3;
  if (['GD5_Cho_Ky_In_GCN', 'GD5_Cho_GCN', 'GD5_Cho_PTT_TiepNhan_BG'].includes(step)) return 4;
  if (['GD6_Cho_BG_Khach'].includes(step)) return 5;

  if (step === 'Hoan_Tat') return 6;
  
  return -1;
};

export const getTaxStatus = (app: Application) => {
  if (app.status === 'Error') return { label: 'Sai sót/Vướng mắc', color: 'text-rose-500' };
  if (app.taxReceiptDate) return { label: 'Hoàn thành', color: 'text-emerald-500' };
  if (!app.taxNotificationReceivedDate) return { label: 'Chưa có TB thuế', color: 'text-slate-500' };
  return { label: 'Chưa hoàn thành', color: 'text-amber-500' };
};

export const getOverdueInfo = (app: any, stepConfig: Record<string, any>, slaConfig: Record<string, number>) => {
  if (app._sla) {
    return app._sla;
  }
  return calculateSLA(app, stepConfig, slaConfig);
};
