import React from 'react';

interface ReportScreenProps {
  applications: any[];
}

const ReportScreen: React.FC<ReportScreenProps> = ({ applications }) => {
  console.log('apps:', applications);
  return (
    <div className="p-8 text-slate-800 dark:text-slate-100 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/40">
        <h1 className="text-2xl font-serif italic font-black mb-4 text-indigo-600 dark:text-indigo-400">REPORT SCREEN</h1>
        <div className="text-lg font-bold">Số hồ sơ: {applications?.length || 0}</div>
        <div className="mt-6">
          <a href="/" className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all active:scale-[0.98]">
            Quay lại Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReportScreen;
