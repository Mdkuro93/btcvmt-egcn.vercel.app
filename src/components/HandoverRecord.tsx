import React from 'react';
import { Application, UserProfile } from '../types';
import { formatDate } from '../utils/dateUtils';

interface HandoverRecordProps {
  apps: Application[];
  user: UserProfile | null;
  template: any;
}

const HandoverRecord = ({ apps, user, template }: HandoverRecordProps) => {
  const today = new Date();
  return (
    <div id="print-section" className="p-10 text-black bg-white min-h-screen">
      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase">{template.companyName}</h1>
          <p className="text-xs italic">{template.subTitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold">{template.docCode}</p>
          <p className="text-xs">Số: ....................</p>
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold uppercase mt-4">{template.title}</h2>
        <h3 className="text-xl font-bold uppercase">{template.subTitle2}</h3>
        <p className="italic mt-2">Ngày {formatDate(today)}</p>
      </div>

      <div className="mb-6 space-y-2">
        <p><strong>Người giao:</strong> {user?.name || '................................'}</p>
        <p><strong>Bộ phận:</strong> {user?.dept || '................................'}</p>
        <p><strong>Địa chỉ:</strong> {template.address}</p>
      </div>

      <div className="mb-8">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black px-2 py-2 w-12 text-center">STT</th>
              <th className="border border-black px-2 py-2 text-center">Mã lô/Căn</th>
              <th className="border border-black px-2 py-2 text-center">Chủ tài sản</th>
              <th className="border border-black px-2 py-2 text-center">Đối tượng</th>
              <th className="border border-black px-2 py-2 text-center">Dự án</th>
              <th className="border border-black px-2 py-2 text-center">Tình trạng</th>
              <th className="border border-black px-2 py-2 text-center">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app, idx) => (
              <React.Fragment key={`${app.id}-${idx}`}>
                <tr className="border-b border-black">
                  <td className="border border-black px-2 py-2 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-2 font-bold">{app.unitCode}</td>
                  <td className="border border-black px-2 py-2">{app.customerName}</td>
                  <td className="border border-black px-2 py-2 text-center text-xs">{app.contractSignerType || 'Cá nhân'}</td>
                  <td className="border border-black px-2 py-2 text-xs">{app.projectName}</td>
                  <td className="border border-black px-2 py-2 text-center text-xs">Đã có GCN</td>
                  <td className="border border-black px-2 py-2 whitespace-nowrap">
                    {app.scannedFiles && app.scannedFiles.length > 0 && (
                      <div className="flex flex-col gap-0.5 text-[8px] italic">
                        {app.scannedFiles.map(f => (
                          <span key={f.id} className="truncate max-w-[100px]">• {f.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
                {app.scannedFiles && app.scannedFiles.length > 0 && (
                  <tr className="no-print bg-slate-50 border-x border-black">
                    <td colSpan={7} className="px-10 py-1 text-[9px] text-blue-600">
                      <span className="font-bold text-gray-500 mr-2 italic">Liên kết tài liệu Số:</span>
                      {app.scannedFiles.map((f, fIdx) => (
                        <a 
                          key={f.id} 
                          href={f.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline mr-4 inline-flex items-center gap-1"
                        >
                          [{fIdx + 1}] {f.name}
                        </a>
                      ))}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {apps.length === 0 && Array.from({length: 5}).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                <td className="border border-black px-2 py-2 h-8"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
                <td className="border border-black px-2 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 mt-16 text-center">
        <div>
          <p className="font-bold uppercase mb-20 text-sm">Người giao</p>
          <p className="font-bold italic">{user?.name}</p>
        </div>
        <div>
          <p className="font-bold uppercase mb-20 text-sm">Người nhận</p>
          <p className="italic">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>

      <div className="mt-20 pt-10 text-[10px] italic border-t border-gray-200">
        <p>{template.footerNote1}</p>
        <p>{template.footerNote2}</p>
      </div>
    </div>
  );
};

export default HandoverRecord;
