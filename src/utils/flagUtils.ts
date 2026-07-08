import { Application } from '../types';

/**
 * Builds a list of flags/tags for an application based on its status and loan info.
 * @param app The application object (partial or full).
 * @returns Array of flag strings.
 */
export const buildFlags = (app: Partial<Application>): string[] => {
  const flags: string[] = [];
  const status = app.status || '';
  const loan = app.loanStatus || '';

  // 1. Khớp cờ Vay/Không vay
  if (loan === 'Co_Vay') flags.push('CO_VAY');
  if (loan === 'Khong_Vay') flags.push('KHONG_VAY');

  // 2. Khớp cờ Lỗi/Sai sót
  if ((app.issueType && app.issueType !== 'None') || status === 'Error' || !!app.isRejected) {
    flags.push('CO_SAI_SOT', 'CO_LOI');
  }

  // 3. Phân rã chi tiết trạng thái để biểu đồ không bị dồn cục
  if (status === 'Processing') {
    flags.push('ĐANG CHUẨN BỊ', 'PROCESSING');
  } else if (status === 'WaitingVPDK') {
    flags.push('CHỜ NỘP VPĐK', 'WAITING_VPDK');
  } else if (status === 'Submitted') {
    flags.push('ĐÃ NỘP VPĐK', 'SUBMITTED');
  } else if (status === 'TaxPending') {
    flags.push('CHỜ NỘP THUẾ', 'TAX_PENDING');
  } else if (status === 'TaxPaid' || status === 'TaxCompleted') {
    flags.push('ĐÃ NỘP THUẾ', 'TAX_PAID');
  } else if (status === 'GCN_Issued') {
    flags.push('ĐÃ CÓ GCN', 'GCN_ISSUED');
  } else if (status === 'WaitingHandover') {
    flags.push('CHỜ BÀN GIAO', 'WAITING_HANDOVER');
  } else if (status === 'Completed') {
    flags.push('HOÀN TẤT', 'COMPLETED');
  }

  return flags;
};

/**
 * Checks if the application is missing core original information
 * (Ngày ký HĐCN for all types, or Ngày bàn giao căn hộ for apartment types)
 */
export const isMissingCoreInfo = (app: Partial<Application>): boolean => {
  if (!app.contractSigningDate || app.contractSigningDate === '---' || app.contractSigningDate === '') return true;
  if (app.propertyType === 'Can_Ho' && (!app.handoverApartmentDate || app.handoverApartmentDate === '---' || app.handoverApartmentDate === '')) return true;
  return false;
};
