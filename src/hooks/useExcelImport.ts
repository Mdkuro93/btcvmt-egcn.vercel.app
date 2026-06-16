import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Application, StepName, UnitStatus, IssueSeverity } from '../types';
import { formatDate } from '../utils/dateUtils';
import { mapFromSnakeCase } from '../utils/mappers';
import { calculateDaysDiff, calculateDaysBetweenDates, getPhaseIndex, getTaxStatus, getOverdueInfo, inferStepFromDates, determineStatusFromStep, validateSkippedSteps } from '../utils/appUtils';
import { STEP_CONFIG as INITIAL_STEP_CONFIG, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS } from '../constants';

export function useExcelImport({
  applications,
  projects,
  isManagementEdit,
  selectedProjectId,
  dashboardApps,
  slaConfig,
  showToast,
  fetchApplications,
  setApplications,
  setHighlightedAppId,
  setActiveTab,
  visibleProjects,
  bulkSyncRecordsToSupabase,
  supabase,
  userRole
}: any) {
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    toUpdate: {app: Application, rowData: any, changes: string[]}[],
    toCreate: {app: Application, rowData: any}[],
    warnings: string[],
    errors: string[]
  } | null>(null);
  const [healDone, setHealDone] = useState(false);

  // Remove redundant local inferStepFromDates to use centralized version from appUtils
  
  const healExistingRecords = async (currentUser: any) => {
    if (!currentUser) return;
    if (applications.length === 0) {
      showToast('Chưa có dữ liệu để đồng bộ', 'warning');
      return;
    }

    setIsImporting(true);
    showToast('Đang kiểm tra và cập nhật trạng thái...', 'info');

    try {
      const severityMap: Record<string, IssueSeverity> = {
        'Nghiêm trọng': 'Critical',
        'Trung bình': 'Moderate',
        'Nhẹ': 'Minor'
      };

      const appsToFix = applications.filter((app: Application) => {
        let statusMismatch = false;
        if (app.status !== 'Completed' && app.status !== 'Error') {
          const targetStatus = determineStatusFromStep(app.currentStep, INITIAL_STEP_CONFIG);
          if (targetStatus !== app.status) statusMismatch = true;
        }
        const hasLegacySeverity = app.issueSeverity && severityMap[app.issueSeverity as string];
        return statusMismatch || hasLegacySeverity;
      });

      if (appsToFix.length === 0) {
        showToast('Tất cả hồ sơ đã đúng trạng thái và chuẩn hóa!', 'success');
        setHealDone(true);
        return;
      }

      let fixedCount = 0;
      let errorCount = 0;

      for (const app of appsToFix) {
        const updatePayload: any = {};

        if (app.status !== 'Completed' && app.status !== 'Error') {
          const targetStatus = determineStatusFromStep(app.currentStep, INITIAL_STEP_CONFIG);
          if (targetStatus !== app.status) {
            updatePayload.status = targetStatus;
          }
        }

        const sevVal = app.issueSeverity;
        if (sevVal && severityMap[sevVal]) {
          updatePayload.issueSeverity = severityMap[sevVal];
        }

        const { error } = await supabase
          .from('records')
          .update(updatePayload)
          .eq('id', app.id);

        if (error) {
          console.error(`Heal error for ${app.unitCode}:`, error);
          errorCount++;
        } else {
          fixedCount++;
        }
      }

      await fetchApplications();

      if (errorCount === 0) {
        showToast(
          `Đã cập nhật ${fixedCount} hồ sơ thành công!`, 
          'success'
        );
        setHealDone(true);
      } else {
        showToast(
          `Cập nhật ${fixedCount} thành công, ${errorCount} lỗi`, 
          'warning'
        );
      }
    } catch (error) {
      console.error('Heal records error:', error);
      showToast('Có lỗi khi đồng bộ trạng thái', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let data: any[][] = [];
    const sourceApps = selectedProjectId ? dashboardApps : applications;

    if (isManagementEdit || ['PTT', 'KT', 'PTDA', 'MANAGER_PTT', 'MANAGER_KT', 'MANAGER_PTDA', 'MANAGER_ALL', 'ADMIN'].includes(userRole)) {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Số GCNQSDĐ", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)", 
        "Hạn GCN cam kết", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Ngày bàn giao căn hộ", "Tự làm sổ (Có/Không)", "Ngày bàn giao sang KT",
        "Nơi nộp", "Mã VPĐK", "Ngày nộp hồ sơ", "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", 
        "Ngày GCN đã ký", "Ngày GCN đã nhận", "Ngày BG KT", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map((app: Application) => [
        app.projectName || '',
        app.unitCode || '',
        app.customerName || '',
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.gcnNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : (app.propertyType === 'Dat_Nen' ? 'Đất nền' : ''),
        app.commitmentDate ? (formatDate(app.commitmentDate) === '---' ? '' : formatDate(app.commitmentDate)) : '',
        app.receivedDate ? (formatDate(app.receivedDate) === '---' ? '' : formatDate(app.receivedDate)) : '',
        app.contractSigningDate ? (formatDate(app.contractSigningDate) === '---' ? '' : formatDate(app.contractSigningDate)) : '',
        app.handoverApartmentDate ? (formatDate(app.handoverApartmentDate) === '---' ? '' : formatDate(app.handoverApartmentDate)) : '',
        app.isSelfService ? 'Có' : 'Không',
        app.accountingHandoverDate ? (formatDate(app.accountingHandoverDate) === '---' ? '' : formatDate(app.accountingHandoverDate)) : '',
        app.submissionLocation || '',
        app.vpdkCode || '',
        app.submissionDate ? (formatDate(app.submissionDate) === '---' ? '' : formatDate(app.submissionDate)) : '',
        app.taxNotificationDate ? (formatDate(app.taxNotificationDate) === '---' ? '' : formatDate(app.taxNotificationDate)) : '',
        app.taxNotificationReceivedDate ? (formatDate(app.taxNotificationReceivedDate) === '---' ? '' : formatDate(app.taxNotificationReceivedDate)) : '',
        app.taxReceiptDate ? (formatDate(app.taxReceiptDate) === '---' ? '' : formatDate(app.taxReceiptDate)) : '',
        app.gcnSignedDate ? (formatDate(app.gcnSignedDate) === '---' ? '' : formatDate(app.gcnSignedDate)) : '',
        app.gcnReceivedDate ? (formatDate(app.gcnReceivedDate) === '---' ? '' : formatDate(app.gcnReceivedDate)) : '',
        app.accountingHandoverDate ? (formatDate(app.accountingHandoverDate) === '---' ? '' : formatDate(app.accountingHandoverDate)) : '',
        app.customerHandoverDate ? (formatDate(app.customerHandoverDate) === '---' ? '' : formatDate(app.customerHandoverDate)) : ''
      ]);
    } else {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Số GCNQSDĐ", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)",
        "Hạn GCN cam kết", "Tự làm sổ (Có/Không)", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Ngày bàn giao căn hộ", "Ngày bàn giao sang KT"
      ];
      data = sourceApps.map((app: Application) => [
        app.projectName || '',
        app.unitCode || '',
        app.customerName || '',
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.gcnNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : (app.propertyType === 'Dat_Nen' ? 'Đất nền' : ''),
        app.commitmentDate ? (formatDate(app.commitmentDate) === '---' ? '' : formatDate(app.commitmentDate)) : '',
        app.isSelfService ? 'Có' : 'Không',
        app.receivedDate ? (formatDate(app.receivedDate) === '---' ? '' : formatDate(app.receivedDate)) : '',
        app.contractSigningDate ? (formatDate(app.contractSigningDate) === '---' ? '' : formatDate(app.contractSigningDate)) : '',
        app.handoverApartmentDate ? (formatDate(app.handoverApartmentDate) === '---' ? '' : formatDate(app.handoverApartmentDate)) : '',
        app.accountingHandoverDate ? (formatDate(app.accountingHandoverDate) === '---' ? '' : formatDate(app.accountingHandoverDate)) : ''
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import_Template");

    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.writeFile(workbook, "Mau_nhap_lieu_HS_GCN.xlsx");
  };

  const parseDateFromExcel = (value: any): string | null => {
    if (value === undefined || value === null || value === '') return null;
    
    const validateYearAndFormat = (year: number, month: number, day: number): string | null => {
      // Mở rộng khoảng năm hợp lệ để tránh sót dữ liệu
      if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const mStr = String(month).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        return `${year}-${mStr}-${dStr}`;
      }
      return null;
    };

    const strVal = String(value).trim();
    if (!strVal || strVal === '---' || strVal.toLowerCase() === 'none') return null;

    // LỚP 1: Xử lý dạng số Excel (Serial Number) - Vd: 46184 hoặc 46184.5
    if (/^\d{4,5}(\.\d+)?$/.test(strVal)) {
      try {
        const numVal = Number(strVal);
        const parsedDate = XLSX.SSF.parse_date_code(numVal);
        if (parsedDate) {
          return validateYearAndFormat(parsedDate.y, parsedDate.m, parsedDate.d);
        }
      } catch (err) {
        console.error('Error parsing SSF date code:', err);
      }
    }

    // LỚP 2: Xử lý chuỗi ngày tháng phổ biến bằng Regex
    // Hỗ trợ DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const vnDateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const vnMatch = strVal.match(vnDateRegex);
    if (vnMatch) {
      const d = parseInt(vnMatch[1], 10);
      const m = parseInt(vnMatch[2], 10);
      const y = parseInt(vnMatch[3], 10);
      return validateYearAndFormat(y, m, d);
    }

    // Hỗ trợ YYYY/MM/DD hoặc YYYY-MM-DD
    const isoDateRegex = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/;
    const isoMatch = strVal.match(isoDateRegex);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10);
      const d = parseInt(isoMatch[3], 10);
      return validateYearAndFormat(y, m, d);
    }

    // LỚP 3: Dự phòng fallback bằng Date object của JS
    const nativeDate = new Date(strVal);
    if (!isNaN(nativeDate.getTime())) {
      const y = nativeDate.getFullYear();
      const m = nativeDate.getMonth() + 1;
      const d = nativeDate.getDate();
      return validateYearAndFormat(y, m, d);
    }
    
    return null;
  };

  const handleParseTemplate = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // TẢI TẤT CẢ HỒ SƠ TỪ DATABASE ĐỂ KIỂM TRA TRÙNG LẶP (Tránh ảnh hưởng của phân trang Pagination)
        let allDbRecords: Application[] = [];
        try {
          const { data: dbData, error: dbErr } = await supabase
            .from('records')
            .select('*');
          if (dbErr) {
            console.error('Lỗi khi tải dữ liệu đối chiếu trùng lặp:', dbErr);
          } else if (dbData) {
            allDbRecords = dbData.map(mapFromSnakeCase);
          }
        } catch (err) {
          console.error('Error fetching baseline records for import:', err);
        }

        const duplicateCheckSource = allDbRecords.length > 0 ? allDbRecords : applications;

        const appsToUpdate: {app: Application, rowData: any, changes: string[]}[] = [];
        const appsToCreate: {app: Application, rowData: any}[] = [];
        const warnings: string[] = [];
        const errors: string[] = [];

        const seenInFile = new Map<string, number>(); 
      
        const headers = excelData[0] || [];
        const headerIndexMap: Record<string, number> = {};

        const normalizeStr = (str: any) => {
          if (!str) return '';
          return str.toString()
            .trim()
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9/()_-\s]/g, "");
        };

        headers.forEach((header: any, index: number) => {
          const norm = normalizeStr(header);
          if (norm) {
            headerIndexMap[norm] = index;
          }
        });

        const findCol = (exacts: string[], subs: string[], forceExact: boolean = false): number => {
          for (const key of Object.keys(headerIndexMap)) {
            if (exacts.some(ex => key === ex)) {
              return headerIndexMap[key];
            }
          }
          if (forceExact) return -1;
          for (const key of Object.keys(headerIndexMap)) {
            if (subs.some(sub => key.includes(sub))) {
              return headerIndexMap[key];
            }
          }
          return -1;
        };

        const colMap = {
          projectName: findCol(['du an'], ['du an']),
          unitCode: findCol(['ma lo/can', 'ma can', 'malo', 'lo/can', 'ma lo'], ['lo/can', 'ma lo', 'malo']),
          customerName: findCol(['khach hang', 'ten khach hang'], ['khach hang']),
          contractSignerType: findCol(['doi tuong ky hdcn', 'doi tuong ky'], ['doi tuong ky']),
          phoneNumber: findCol(['so dien thoai', 'sdt', 'dien thoai'], ['dien thoai', 'sdt']),
          loanStatus: findCol(['vay ngan hang (co/khong)', 'vay ngan hang', 'vay nh'], ['vay ngan hang', 'vay nh']),
          propertyType: findCol(['loai tai san', 'loai ts'], ['loai tai san', 'loai ts']),
          commitmentDate: findCol(['han gcn cam ket', 'han gcn'], ['han gcn']),
          bankCommitmentDeadline: findCol(['han cam ket ngan hang', 'han cam ket vay'], ['cam ket ngan hang', 'cam ket vay']),
          receivedDate: findCol(['ngay nhan ho so', 'nhan ho so'], ['nhan ho so']),
          contractSigningDate: findCol(['ngay ky hdcn', 'ky hdcn'], ['ky hdcn']),
          handoverApartmentDate: findCol(['ngay ban giao can ho thuc te', 'ngay ban giao can ho', 'ban giao can ho', 'bg can ho'], ['ban giao can ho'], false),
          isSelfService: findCol(['tu lam so (co/khong)', 'tu lam so'], ['tu lam so']),
          accountingHandoverDate: findCol(['ngay ban giao sang kt', 'ngay ban giao kt', 'ban giao kt', 'bg kt'], ['bg kt'], false),
          submissionLocation: findCol(['noi nop (phuong/tp)', 'noi nop'], ['noi nop']),
          vpdkCode: findCol(['ma hs/so phieu hen vpdk', 'ma hs vpdk', 'ma vpdk', 'so phieu hen', 'ma phieu hen'], ['ma vpdk', 'phieu hen']),
          submissionDate: findCol(
            ['ngay nop vpdk', 'nop vpdk', 'ngay nop ho so'],
            ['nop vpdk', 'nop ho so']
          ),
          taxNotificationDate: findCol(['ngay tb thue', 'tb thue', 'ngay thong bao thue', 'thong bao thue'], [], true),
          taxNotificationReceivedDate: findCol(['ngay nhan tb thue', 'nhan tb thue', 'ngay nhan thong bao thue', 'nhan thong bao thue'], [], true),
          taxNoticeProvisionDate: findCol(['ngay cap tb thue', 'cung cap tb thue', 'ngay cung cap tb thue', 'ngay dong thue', 'dong thue'], ['cap tb thue', 'cung cap tb thue', 'dong thue']),
          taxReceiptDate: findCol(['ngay nop thue', 'nop thue', 'ngay dong thue', 'dong thue'], ['dong thue', 'nop thue']),
          gcnSignedDate: findCol(['ngay trinh ky gcn', 'trinh ky gcn', 'gcn da ky', 'ngay gcn da ky'], [], true),
          gcnReceivedDate: findCol(['ngay nhan gcn thuc te', 'ngay gcn da nhan', 'ngay nhan gcn', 'nhan gcn'], [], true),
          ptdaHandoverDate: findCol(['ngay bg p.tda', 'bg p.tda', 'bg p_tda', 'ban giao p.tda'], ['bg p.tda', 'bg ptda']),
          customerHandoverDate: findCol(['ngay bg gcn khach', 'bg gcn khach', 'bg gcn cho khach', 'ban giao khach', 'ngay ban giao gcn khach', 'ban giao gcn khach'], [], true),
          issueType: findCol(['phan loai sai sot'], ['phan loai sai sot']),
          issueSeverity: findCol(['muc do sai sot'], ['muc do sai sot']),
          issueNotes: findCol(['ghi chu sai sot'], ['ghi chu sai sot']),
          gcnNumber: findCol(['so gcnqsdd', 'so gcn', 'gcnqsdd'], ['so gcn', 'gcnqsdd']),
        };

        const getRowVal = (row: any[], field: keyof typeof colMap) => {
          const idx = colMap[field];
          if (idx === -1 || idx === undefined || idx >= row.length) return undefined;
          return row[idx];
        };

        const getRowStr = (row: any[], field: keyof typeof colMap): string | undefined => {
          const val = getRowVal(row, field);
          if (val === undefined || val === null) return undefined;
          return val.toString().trim();
        };

        const getRowDate = (row: any[], field: keyof typeof colMap): string | undefined => {
          const val = getRowVal(row, field);
          if (val === undefined || val === null) return undefined;
          return parseDateFromExcel(val) || undefined;
        };

        excelData.slice(1).forEach((row, idx) => {
          const projectName = getRowStr(row, 'projectName') || '';
          const unitCode = getRowStr(row, 'unitCode') || '';
          if (!unitCode) return;

          // Attempt to map projectName to official projects list for consistency
          let matchedProject = projects.find(p => 
            p.name.toLowerCase().trim() === projectName.toLowerCase().trim()
          );

          if (!matchedProject && projectName) {
            // Try fuzzy match if exact match fails
            matchedProject = projects.find(p => 
              p.name.toLowerCase().includes(projectName.toLowerCase()) || 
              projectName.toLowerCase().includes(p.name.toLowerCase())
            );
          }

          if (projectName && !matchedProject) {
            errors.push(`Dòng ${idx + 2}: Dự án "${projectName}" không tồn tại trong hệ thống. Vui lòng tạo dự án trước hoặc kiểm tra lại tên.`);
            return;
          }

          // Kiểm tra user có được phân quyền dự án này không
          if (matchedProject && visibleProjects.length > 0) {
            const isAllowed = visibleProjects.some(vp => vp.id === matchedProject!.id);
            if (!isAllowed) {
              errors.push(
                `Dòng ${idx + 2}: Bạn không có quyền nhập liệu cho dự án "${matchedProject.name}". ` +
                `Chỉ được phép nhập: ${visibleProjects.map(vp => vp.name).join(', ')}.`
              );
              return;
            }
          }

          const officialProjectName = matchedProject ? matchedProject.name : projectName;
          
          const key = `${officialProjectName.toLowerCase()}_${unitCode}`;
          if (seenInFile.has(key)) {
            warnings.push(
              `⚠️ File Excel có mã lô trùng: ${unitCode} ` +
              `(${officialProjectName}) xuất hiện ở dòng ` +
              `${seenInFile.get(key)! + 2} và dòng ${idx + 2}. ` +
              `Hệ thống chỉ xử lý dòng đầu tiên.`
            );
            return;
          }
          seenInFile.set(key, idx);

          const existingApp = duplicateCheckSource.find(
            a => a.unitCode === unitCode && 
                (!officialProjectName || a.projectName?.toLowerCase() === officialProjectName.toLowerCase())
          );
          
          const parsedProjectName = officialProjectName || (visibleProjects.length > 0 ? visibleProjects[0].name : projects[0].name);

          if (existingApp) {
             const changes: string[] = [];
             const updatedApp = { ...existingApp };

             const newCustomerName = getRowStr(row, 'customerName');
             if (newCustomerName !== undefined && newCustomerName !== '' && newCustomerName !== existingApp.customerName) {
                updatedApp.customerName = newCustomerName;
                changes.push(`Khách hàng: ${existingApp.customerName || 'Trống'} -> ${newCustomerName}`);
             }

             const newContractSignerType = getRowStr(row, 'contractSignerType');
             if (newContractSignerType !== undefined && newContractSignerType !== '' && newContractSignerType !== existingApp.contractSignerType) {
                updatedApp.contractSignerType = newContractSignerType;
                changes.push(`Đối tượng ký: ${existingApp.contractSignerType || 'Trống'} -> ${newContractSignerType}`);
             }

             const newPhoneNumber = getRowStr(row, 'phoneNumber');
             if (newPhoneNumber !== undefined && newPhoneNumber !== '' && newPhoneNumber !== existingApp.phoneNumber) {
                updatedApp.phoneNumber = newPhoneNumber;
                changes.push(`Số ĐT: ${existingApp.phoneNumber || 'Trống'} -> ${newPhoneNumber}`);
             }

             const bankLoanVal = getRowStr(row, 'loanStatus');
             if (bankLoanVal !== undefined && bankLoanVal !== '') {
               const lowerVal = bankLoanVal.toLowerCase();
               const isBankLoan = lowerVal === 'có' || lowerVal === 'co' || lowerVal === 'yes' || lowerVal === '1' || lowerVal === 'true' || lowerVal === 'x';
               const newLoanStatus = isBankLoan ? 'Co_Vay' : 'Khong_Vay';
               if (existingApp.loanStatus !== newLoanStatus) {
                  updatedApp.loanStatus = newLoanStatus;
                  changes.push(`Vay NH: ${existingApp.loanStatus === 'Co_Vay' ? 'Có' : 'Không'} -> ${newLoanStatus === 'Co_Vay' ? 'Có' : 'Không'}`);
               }
             }

             const propTypeVal = getRowStr(row, 'propertyType');
             if (propTypeVal !== undefined && propTypeVal !== '') {
               const lowerVal = propTypeVal.toLowerCase();
               const newPropType = lowerVal.includes('căn hộ') || lowerVal.includes('can ho') || lowerVal.includes('apartment') ? 'Can_Ho' : (lowerVal.includes('đất nền') || lowerVal.includes('dat nen') || lowerVal.includes('land') ? 'Dat_Nen' : existingApp.propertyType);
               if (existingApp.propertyType !== newPropType) {
                  updatedApp.propertyType = newPropType;
                  changes.push(`Loại TS: ${existingApp.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'} -> ${newPropType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'}`);
               }
             }

             const commDate = getRowDate(row, 'commitmentDate');
             if (commDate && commDate !== existingApp.commitmentDate) {
                updatedApp.commitmentDate = commDate;
                changes.push(`Hạn GCN: ${existingApp.commitmentDate || 'Trống'} -> ${commDate}`);
             }

             const bankCommitment = getRowDate(row, 'bankCommitmentDeadline');
             if (bankCommitment && bankCommitment !== existingApp.bankCommitmentDeadline) {
                updatedApp.bankCommitmentDeadline = bankCommitment;
                changes.push(`Hạn cam kết vay: ${existingApp.bankCommitmentDeadline || 'Trống'} -> ${bankCommitment}`);
             }

             const recDate = getRowDate(row, 'receivedDate');
              const handoverApDate = getRowDate(row, 'handoverApartmentDate');
              if (handoverApDate !== undefined && handoverApDate !== existingApp.handoverApartmentDate) {
                 updatedApp.handoverApartmentDate = handoverApDate;
                 changes.push(`Bàn giao căn hộ: ${existingApp.handoverApartmentDate || 'Trống'} -> ${handoverApDate || 'Trống'}`);
              }
             if (recDate && recDate !== existingApp.receivedDate) {
                updatedApp.receivedDate = recDate;
                changes.push(`Ngày nhận HS: ${existingApp.receivedDate || 'Trống'} -> ${recDate}`);
              }

              const selfServiceVal = getRowStr(row, 'isSelfService');
             if (selfServiceVal !== undefined && selfServiceVal !== '') {
               const lowerSelf = selfServiceVal.toLowerCase();
               const newIsSelfService = lowerSelf === 'có' || lowerSelf === 'co' || lowerSelf === 'yes' || lowerSelf === '1' || lowerSelf === 'true' || lowerSelf === 'x';
               if (existingApp.isSelfService !== newIsSelfService) {
                  updatedApp.isSelfService = newIsSelfService;
                  changes.push(`Tự làm SGCN: ${existingApp.isSelfService ? 'Có' : 'Không'} -> ${newIsSelfService ? 'Có' : 'Không'}`);
               }
             }

             const bgKtStr = getRowStr(row, 'accountingHandoverDate');
             if (bgKtStr !== undefined && bgKtStr !== '' && bgKtStr !== '---') {
                const lowerBgKt = bgKtStr.toLowerCase();
                let parsedAccountingDate = existingApp.accountingHandoverDate;

                if (lowerBgKt === 'có' || lowerBgKt === 'da giao' || lowerBgKt === 'da ban giao' || lowerBgKt === 'đã giao' || lowerBgKt === 'đã bàn giao' || lowerBgKt === 'x') {
                  // Keep existing or just set a flag? If we don't have a date, we stay current
                } else if (lowerBgKt === 'không' || lowerBgKt === 'khong') {
                  parsedAccountingDate = undefined;
                } else {
                  parsedAccountingDate = parseDateFromExcel(bgKtStr) || existingApp.accountingHandoverDate;
                }
                
                if (parsedAccountingDate !== existingApp.accountingHandoverDate) {
                  updatedApp.accountingHandoverDate = parsedAccountingDate;
                  changes.push(`Bàn giao KT: ${existingApp.accountingHandoverDate || 'Chưa gửi'} -> ${parsedAccountingDate || 'Chưa gửi'}`);
                }
             }

             const subLoc = getRowStr(row, 'submissionLocation');
             if (subLoc !== undefined && subLoc !== '') {
               const parsedLoc = subLoc.toLowerCase().includes('phường') || subLoc.toLowerCase().includes('phuong') ? 'PHUONG' : 'TP_DANANG';
               if (parsedLoc !== existingApp.submissionLocation) {
                  updatedApp.submissionLocation = parsedLoc;
                  changes.push(`Nơi nộp HS: ${existingApp.submissionLocation || 'Trống'} -> ${parsedLoc}`);
               }
             }

             const newVpdkCode = getRowStr(row, 'vpdkCode');
             if (newVpdkCode !== undefined && newVpdkCode !== '' && newVpdkCode !== existingApp.vpdkCode) {
                updatedApp.vpdkCode = newVpdkCode;
                changes.push(`Mã VPĐK: ${existingApp.vpdkCode || 'Trống'} -> ${newVpdkCode}`);
             }

             const subDate = getRowDate(row, 'submissionDate');
             if (subDate && subDate !== existingApp.submissionDate) {
                updatedApp.submissionDate = subDate;
                changes.push(`Ngày nộp VPĐK: ${existingApp.submissionDate || 'Trống'} -> ${subDate}`);
             }

             const taxNotifDate = getRowDate(row, 'taxNotificationDate');
             if (taxNotifDate && taxNotifDate !== existingApp.taxNotificationDate) {
                updatedApp.taxNotificationDate = taxNotifDate;
                changes.push(`Ngày TB Thuế: ${existingApp.taxNotificationDate || 'Trống'} -> ${taxNotifDate}`);
             }

             const taxNotifRecDate = getRowDate(row, 'taxNotificationReceivedDate');
             if (taxNotifRecDate && taxNotifRecDate !== existingApp.taxNotificationReceivedDate) {
                updatedApp.taxNotificationReceivedDate = taxNotifRecDate;
                changes.push(`Ngày nhận TB Thuế: ${existingApp.taxNotificationReceivedDate || 'Trống'} -> ${taxNotifRecDate}`);
             }

             const taxNoticeProv = getRowDate(row, 'taxNoticeProvisionDate');
             if (taxNoticeProv && taxNoticeProv !== existingApp.taxNoticeProvisionDate) {
                updatedApp.taxNoticeProvisionDate = taxNoticeProv;
                changes.push(`Ngày cung cấp TB Thuế: ${existingApp.taxNoticeProvisionDate || 'Trống'} -> ${taxNoticeProv}`);
             }

             const taxReceipt = getRowDate(row, 'taxReceiptDate');
             if (taxReceipt && taxReceipt !== existingApp.taxReceiptDate) {
                updatedApp.taxReceiptDate = taxReceipt;
                changes.push(`Ngày đóng thuế: ${existingApp.taxReceiptDate || 'Trống'} -> ${taxReceipt}`);
             }

             const gSignedDate = getRowDate(row, 'gcnSignedDate');
             if (gSignedDate && gSignedDate !== existingApp.gcnSignedDate) {
                updatedApp.gcnSignedDate = gSignedDate;
                changes.push(`Ngày trình ký/ký GCN: ${existingApp.gcnSignedDate || 'Trống'} -> ${gSignedDate}`);
             }

             const gReceivedDate = getRowDate(row, 'gcnReceivedDate');
             if (gReceivedDate && gReceivedDate !== existingApp.gcnReceivedDate) {
                updatedApp.gcnReceivedDate = gReceivedDate;
                changes.push(`Ngày nhận GCN thực tế: ${existingApp.gcnReceivedDate || 'Trống'} -> ${gReceivedDate}`);

                const isBypassed = updatedApp.checklist?.['bypass_gcn'] === true;
                const isEarly = !isBypassed && ['GD1','GD2','GD3','GD4','S1','S2','S3','S4','S5'].some(prefix => updatedApp.currentStep.startsWith(prefix));
                if (isEarly) {
                  const waitingStep = updatedApp.workflowType === 'Quy_trinh_2' ? 'S7_1_PTT_Tiep_Nhan' : 'GD5_Cho_PTT_TiepNhan_BG';
                  updatedApp.currentStep = waitingStep;
                  updatedApp.status = 'WaitingHandover';
                  updatedApp.issueNotes = (updatedApp.issueNotes ? updatedApp.issueNotes + '\n' : '') + 'Cảnh báo: Lệch tiến độ thực tế (Có ngày nhận GCN nhưng chưa tới bước bàn giao)';
                  changes.push(`>> Tự động chuyển sang Chờ bàn giao do có ngày nhận GCN (bước gốc: ${existingApp.currentStep})`);
                }
             }

             const ptdaHandover = getRowDate(row, 'ptdaHandoverDate');
             if (ptdaHandover && ptdaHandover !== existingApp.ptdaHandoverDate) {
                updatedApp.ptdaHandoverDate = ptdaHandover;
                changes.push(`Ngày BG P.TDA: ${existingApp.ptdaHandoverDate || 'Trống'} -> ${ptdaHandover}`);
             }

             let custHandoverDate = getRowDate(row, 'customerHandoverDate');
             if (!custHandoverDate) {
                const bgKhachStr = getRowStr(row, 'customerHandoverDate');
                if (bgKhachStr !== undefined) {
                  const lowerBgKhach = bgKhachStr.toLowerCase();
                  if (lowerBgKhach === 'có' || lowerBgKhach === 'co' || lowerBgKhach === 'da giao' || lowerBgKhach === 'da ban giao' || lowerBgKhach === 'đã giao' || lowerBgKhach === 'đã bàn giao' || lowerBgKhach === 'x') {
                    custHandoverDate = undefined;
                  }
                }
             }
             if (custHandoverDate && custHandoverDate !== existingApp.customerHandoverDate) {
                updatedApp.customerHandoverDate = custHandoverDate;
                changes.push(`Ngày BG Khách: ${existingApp.customerHandoverDate || 'Trống'} -> ${custHandoverDate}`);
             }

             const isType = getRowStr(row, 'issueType');
             if (isType !== undefined && isType !== '' && isType !== existingApp.issueType) {
                updatedApp.issueType = isType as any;
                changes.push(`Phân loại sai sót: ${existingApp.issueType || 'Không'} -> ${isType}`);
             }

             const isSev = getRowStr(row, 'issueSeverity');
             if (isSev !== undefined && isSev !== '' && isSev !== existingApp.issueSeverity) {
                updatedApp.issueSeverity = isSev as any;
                changes.push(`Mức độ sai sót: ${existingApp.issueSeverity || 'Không'} -> ${isSev}`);
             }

             const isNotes = getRowStr(row, 'issueNotes');
             if (isNotes !== undefined && isNotes !== '' && isNotes !== existingApp.issueNotes) {
                updatedApp.issueNotes = isNotes;
                changes.push(`Ghi chú sai sót: ${existingApp.issueNotes || 'Không'} -> ${isNotes}`);
             }

             const newGcnNumber = getRowStr(row, 'gcnNumber');
             if (newGcnNumber !== undefined && newGcnNumber !== '' && newGcnNumber !== existingApp.gcnNumber) {
               updatedApp.gcnNumber = newGcnNumber;
               changes.push(`Số GCNQSDĐ: ${existingApp.gcnNumber || 'Trống'} -> ${newGcnNumber}`);
             }

             if (updatedApp.issueType && updatedApp.issueType !== 'None' && String(updatedApp.issueType).trim() !== '') {
                if (updatedApp.status !== 'Error') {
                   updatedApp.status = 'Error';
                   changes.push(`Trạng thái tự động cập nhật: Error (Có phân loại sai sót)`);
                }
             }

             if (changes.length > 0) {
                if (updatedApp.status !== 'Error') {
                  const inferred = inferStepFromDates(updatedApp, slaConfig, 'IMPORT');
                  
                  // THÊM: Validate bước bị nhảy cóc
                  const skippedWarnings = validateSkippedSteps(updatedApp, inferred.currentStep);
                  if (skippedWarnings.length > 0) {
                    warnings.push(...skippedWarnings);
                  }
                  
                  // Logic chống lùi bước (giữ nguyên)
                  const workflowSteps = updatedApp.workflowType === 'Quy_trinh_2'
                    ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
                  const currentIdxInDB = workflowSteps.indexOf(existingApp.currentStep);
                  const inferredIdx = workflowSteps.indexOf(inferred.currentStep);
                  
                  if (inferredIdx >= currentIdxInDB) {
                    if (inferred.status !== updatedApp.status || inferred.currentStep !== updatedApp.currentStep) {
                      changes.push(`Trạng thái tự động cập nhật: ${inferred.status}, Bước: ${inferred.currentStep}`);
                      updatedApp.status = inferred.status;
                      updatedApp.currentStep = inferred.currentStep;
                    }
                  }
                }
                
                const auditEntry = {
                  id: `audit-${Date.now()}-${updatedApp.unitCode}-${Math.random().toString(36).substring(2,9)}`,
                  action: 'Import Excel',
                  timestamp: new Date().toISOString(),
                  isBulk: true,
                  affectedCount: 1,
                  targetInfo: `Căn ${updatedApp.unitCode}`,
                  user: 'Hệ thống (Import)',
                  userId: 'system-import',
                  note: `Cập nhật từ Excel. Các thay đổi: ${changes.join(' | ')}`
                };
                updatedApp.auditTrail = [auditEntry, ...(updatedApp.auditTrail || [])];
                
                appsToUpdate.push({ app: updatedApp, rowData: row, changes });
             }

          } else {
             const bankLoanVal = getRowStr(row, 'loanStatus');
             const isBankLoan = bankLoanVal ? (bankLoanVal.toLowerCase() === 'có' || bankLoanVal.toLowerCase() === 'co' || bankLoanVal.toLowerCase() === 'yes' || bankLoanVal.toLowerCase() === '1' || bankLoanVal.toLowerCase() === 'true' || bankLoanVal.toLowerCase() === 'x') : false;

             const propTypeVal = getRowStr(row, 'propertyType');
             const propertyType = propTypeVal && (propTypeVal.toLowerCase().includes('đất nền') || propTypeVal.toLowerCase().includes('land') || propTypeVal.toLowerCase().includes('dat nen')) ? 'Dat_Nen' : 'Can_Ho';

             const selfServiceVal = getRowStr(row, 'isSelfService');
             const isSelfService = selfServiceVal ? (selfServiceVal.toLowerCase() === 'có' || selfServiceVal.toLowerCase() === 'co' || selfServiceVal.toLowerCase() === 'yes' || selfServiceVal.toLowerCase() === '1' || selfServiceVal.toLowerCase() === 'true' || selfServiceVal.toLowerCase() === 'x') : false;

             let parsedNewAccountingDate;
             const bgKtStr = getRowStr(row, 'accountingHandoverDate');
             if (bgKtStr !== undefined) {
                const lowerBgKt = bgKtStr.toLowerCase();
                if (lowerBgKt === 'có' || lowerBgKt === 'da giao' || lowerBgKt === 'da ban giao' || lowerBgKt === 'đã giao' || lowerBgKt === 'đã bàn giao' || lowerBgKt === 'x') {
                  parsedNewAccountingDate = undefined;
                } else if (lowerBgKt !== 'không' && lowerBgKt !== 'khong' && lowerBgKt !== '') {
                  parsedNewAccountingDate = parseDateFromExcel(bgKtStr) || undefined;
                }
             }

             let parsedLoc: 'PHUONG' | 'TP_DANANG' | undefined = undefined;
             const subLoc = getRowStr(row, 'submissionLocation');
             if (subLoc !== undefined && subLoc !== '') {
               parsedLoc = subLoc.toLowerCase().includes('phường') || subLoc.toLowerCase().includes('phuong') ? 'PHUONG' : 'TP_DANANG';
             }

             let custHandoverDate = getRowDate(row, 'customerHandoverDate');
             if (!custHandoverDate) {
                const bgKhachStr = getRowStr(row, 'customerHandoverDate');
                if (bgKhachStr !== undefined) {
                  const lowerBgKhach = bgKhachStr.toLowerCase();
                  if (lowerBgKhach === 'có' || lowerBgKhach === 'co' || lowerBgKhach === 'da giao' || lowerBgKhach === 'da ban giao' || lowerBgKhach === 'đã giao' || lowerBgKhach === 'đã bàn giao' || lowerBgKhach === 'x') {
                    custHandoverDate = undefined;
                  }
                }
             }

             const parentProject = matchedProject; // Use the already matched project object
             const inheritedWorkflowType = parentProject?.workflowType || 'Quy_trinh_1';
             const initialStep = inheritedWorkflowType === 'Quy_trinh_2' ? 'S1_ChuanBi' : 'GD1_ChuanBi';
             const initialStepLabel = inheritedWorkflowType === 'Quy_trinh_2' ? 'B1: Chuẩn bị hồ sơ (PTT)' : 'GĐ1: Chuẩn bị (PTT)';

             const newApp: any = {
               projectName: parsedProjectName,
               unitCode: unitCode,
               customerName: getRowStr(row, 'customerName') || '',
               contractSignerType: getRowStr(row, 'contractSignerType') || '',
               phoneNumber: getRowStr(row, 'phoneNumber') || '',
               loanStatus: isBankLoan ? 'Co_Vay' : 'Khong_Vay',
               propertyType: propertyType,
               commitmentDate: getRowDate(row, 'commitmentDate') || undefined,
               bankCommitmentDeadline: getRowDate(row, 'bankCommitmentDeadline') || undefined,
               receivedDate: getRowDate(row, 'receivedDate') || undefined,
               contractSigningDate: getRowDate(row, 'contractSigningDate') || undefined,
                handoverApartmentDate: getRowDate(row, 'handoverApartmentDate') || undefined,
               isSelfService: isSelfService,
               accountingHandoverDate: parsedNewAccountingDate,
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               status: 'Processing',
               currentStep: initialStep,
               workflowType: inheritedWorkflowType,
                history: [
                  {
                    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    stepName: initialStepLabel,
                    dept: 'PTT',
                    receivedDate: new Date().toISOString(),
                    note: 'Khởi tạo hồ sơ mới từ Import Excel'
                  }
                ],
                auditTrail: []
             };

             if (parsedLoc) newApp.submissionLocation = parsedLoc;
             const vCode = getRowStr(row, 'vpdkCode');
             if (vCode) newApp.vpdkCode = vCode;
             
             const subDate = getRowDate(row, 'submissionDate');
             if (subDate) newApp.submissionDate = subDate;
             
             const tNotifDate = getRowDate(row, 'taxNotificationDate');
             if (tNotifDate) newApp.taxNotificationDate = tNotifDate;
             
             const tNotifRecDate = getRowDate(row, 'taxNotificationReceivedDate');
             if (tNotifRecDate) newApp.taxNotificationReceivedDate = tNotifRecDate;
             
             const tNoticeProv = getRowDate(row, 'taxNoticeProvisionDate');
             if (tNoticeProv) newApp.taxNoticeProvisionDate = tNoticeProv;

             const tReceipt = getRowDate(row, 'taxReceiptDate');
             if (tReceipt) newApp.taxReceiptDate = tReceipt;

             const gSignedDate = getRowDate(row, 'gcnSignedDate');
             if (gSignedDate) newApp.gcnSignedDate = gSignedDate;

             const gReceivedDate = getRowDate(row, 'gcnReceivedDate');
             if (gReceivedDate) newApp.gcnReceivedDate = gReceivedDate;

             const ptdaHand = getRowDate(row, 'ptdaHandoverDate');
             if (ptdaHand) newApp.ptdaHandoverDate = ptdaHand;

             if (custHandoverDate) newApp.customerHandoverDate = custHandoverDate;

             const isType = getRowStr(row, 'issueType');
             if (isType) newApp.issueType = isType as any;

             const isSev = getRowStr(row, 'issueSeverity');
             if (isSev) newApp.issueSeverity = isSev as any;

             const isNotes = getRowStr(row, 'issueNotes');
             if (isNotes) newApp.issueNotes = isNotes;

             const gcnNo = getRowStr(row, 'gcnNumber');
             if (gcnNo) newApp.gcnNumber = gcnNo;

             const inferred = inferStepFromDates(newApp as Application, slaConfig, 'IMPORT');
             
             // THÊM: Validate bước bị nhảy cóc
             const skippedWarnings = validateSkippedSteps(newApp as Application, inferred.currentStep);
             if (skippedWarnings.length > 0) {
               warnings.push(...skippedWarnings);
             }
             
             newApp.status = inferred.status;
             newApp.currentStep = inferred.currentStep;

             if (newApp.issueType && newApp.issueType !== 'None' && String(newApp.issueType).trim() !== '') {
               newApp.status = 'Error';
             }

             const auditEntry = {
               id: `audit-${Date.now()}-${newApp.unitCode}-${Math.random().toString(36).substring(2,9)}`,
               action: 'Import Excel (Tạo mới)',
               timestamp: new Date().toISOString(),
               isBulk: true,
               affectedCount: 1,
               targetInfo: `Căn ${newApp.unitCode}`,
               user: 'Hệ thống (Import)',
               userId: 'system-import',
               note: `Tạo mới hồ sơ từ Excel`
             };
             newApp.auditTrail = [auditEntry];

             appsToCreate.push({ app: newApp as Application, rowData: row });
          }
        });

        if (appsToUpdate.length === 0 && appsToCreate.length === 0) {
          showToast('Không có dữ liệu mới hoặc thay đổi hợp lệ trong file.', 'info');
          if (warnings.length > 0) {
            alert("Các cảnh báo trong file:\n" + warnings.join('\n'));
          }
          setIsImporting(false);
          return;
        }

        setImportPreviewData({
          toUpdate: appsToUpdate,
          toCreate: appsToCreate,
          warnings,
          errors
        });

        setIsImporting(false); // ← Parse xong → tắt loading, cho phép bấm nút

      } catch (error) {
        console.error('Import parse error:', error);
        showToast('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.', 'error');
        setIsImporting(false);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreviewData) return;
    setIsImporting(true);
    try {
      const anyToSync = [
        ...importPreviewData.toUpdate.map(t => t.app),
        ...importPreviewData.toCreate.map(t => t.app)
      ];
      if (anyToSync.length > 0) {
         showToast('Đang lưu dữ liệu lên hệ thống...', 'info');

         // Tạm ngắt Realtime để tránh 48 events dồn về cùng lúc
         try {
           await supabase.removeAllChannels();
         } catch (e) {
           console.warn('[Import] Could not pause realtime:', e);
         }

         const finalApps = await bulkSyncRecordsToSupabase(anyToSync, applications, showToast);
         setApplications(finalApps);

         if (importPreviewData?.toCreate?.length > 0) {
           const firstUnit = importPreviewData.toCreate[0]?.app?.unitCode;
           if (firstUnit) {
             const newApp = finalApps.find(
               (a: any) => a.unitCode === firstUnit
             );
             if (newApp?.id) {
               setHighlightedAppId(newApp.id);
               setTimeout(() => {
                 document.getElementById(`app-row-${newApp.id}`)
                   ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
               }, 300);
               setTimeout(() => setHighlightedAppId(null), 4000);
             }
           }
         }

         showToast(`Hoàn tất nhập liệu: Cập nhật ${importPreviewData.toUpdate.length} hồ sơ, Tạo mới ${importPreviewData.toCreate.length} hồ sơ.`, 'success');
         setActiveTab('applications');
      }
    } catch (error: any) {
      console.error('Import Sync Error:', error);
      showToast(`Đồng bộ dữ liệu Supabase thất bại: ${error.message || 'Lỗi không xác định'}`, 'error');
    } finally {
      setIsImporting(false);
      setImportPreviewData(null);
      // Kết nối lại Realtime sau khi import xong
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('reconnect-realtime'));
      }, 1500);
    }
  };

  return {
    isImporting,
    importPreviewData,
    setImportPreviewData,
    handleDownloadTemplate,
    handleParseTemplate,
    handleConfirmImport,
    healDone,
    healExistingRecords
  };
}