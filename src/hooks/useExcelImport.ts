
import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Application, StepName, UnitStatus, IssueSeverity } from '../types';
import { formatDate } from '../utils/dateUtils';

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
  supabase
}: any) {
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    toUpdate: {app: Application, rowData: any, changes: string[]}[],
    toCreate: {app: Application, rowData: any}[],
    warnings: string[],
    errors: string[]
  } | null>(null);
  const [healDone, setHealDone] = useState(false);

  const inferStepFromDates = (app: Application): { currentStep: StepName, status: UnitStatus } => {
    const isQT2 = app.workflowType === 'Quy_trinh_2';
    
    // Ưu tiên diện tự làm sổ
    if (app.isSelfService) {
      if (app.customerHandoverDate) {
        return { currentStep: 'Hoan_Tat', status: 'Completed' };
      }
      return { currentStep: isQT2 ? 'S1_ChuanBi' : 'GD1_ChuanBi', status: 'Processing' };
    }
    
    if (app.customerHandoverDate) 
      return { currentStep: 'Hoan_Tat', status: 'Completed' };
    
    if (isQT2) {
      if (app.gcnReceivedDate)        return { currentStep: 'S7_1_PTT_Tiep_Nhan', status: 'WaitingHandover' };
      if (app.ptdaHandoverDate)       return { currentStep: 'S7_PTDA_Ban_Giao', status: 'WaitingHandover' };
      if (app.gcnSignedDate)          return { currentStep: 'S6_Nhan_So_GCN', status: 'GCN_Issued' };
      if (app.taxReceiptDate)         return { currentStep: 'S5_1_PTDA_TiepNhan', status: 'TaxCompleted' };
      if (app.taxNotificationDate)    return { currentStep: 'S5_Tai_Chinh_Khach_Hang', status: 'TaxPending' };
      
      if (app.submissionDate && !app.taxNotificationDate) {
        const subDate = new Date(app.submissionDate);
        const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
        const sla = slaConfig?.['Nộp VPĐK'] ?? 5;
        return daysDiff > sla
          ? { currentStep: 'S4_Cho_Thong_Bao_Thue', status: 'TaxPending' }
          : { currentStep: 'S3_Nop_VPDK', status: 'Submitted' };
      }
      
      if (app.vpdkCode)               return { currentStep: 'S3_Nop_VPDK', status: 'Submitted' };
      
      if (app.accountingHandoverDate && !app.submissionDate) {
        return { currentStep: 'S2_KT_Tiep_Nhan', status: 'Processing' };
      }
      if (!app.accountingHandoverDate) {
        return { currentStep: 'S1_ChuanBi', status: 'Processing' };
      }
      
      return { currentStep: 'S1_ChuanBi', status: 'Processing' };
    } else {
      if (app.gcnReceivedDate)        return { currentStep: 'GD5_Cho_PTT_TiepNhan_BG', status: 'WaitingHandover' };
      if (app.gcnSignedDate)          return { currentStep: 'GD5_Cho_GCN', status: 'GCN_Issued' };
      if (app.taxReceiptDate)         return { currentStep: 'GD4_Cho_KT_TiepNhan_LaySo', status: 'TaxCompleted' };
      if (app.taxNotificationDate)    return { currentStep: 'GD4_Cho_Nop_NVTC', status: 'TaxPending' };

      if (app.submissionDate && !app.taxNotificationDate) {
        const subDate = new Date(app.submissionDate);
        const daysDiff = (new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24);
        const sla = slaConfig?.['Nộp VPĐK'] ?? 5;
        return daysDiff > sla
          ? { currentStep: 'GD3_Cho_TBThue', status: 'TaxPending' }
          : { currentStep: 'GD3_Cho_TBThue', status: 'Submitted' };
      }

      if (app.vpdkCode)               return { currentStep: 'GD2_Cho_Nop_VPDK', status: 'WaitingVPDK' };
      
      if (app.accountingHandoverDate && !app.submissionDate) {
        return { currentStep: 'GD1_Cho_KT_TiepNhan', status: 'Processing' };
      }
      if (!app.accountingHandoverDate) {
        return { currentStep: 'GD1_ChuanBi', status: 'Processing' };
      }
      
      return { currentStep: 'GD1_ChuanBi', status: 'Processing' };
    }
  };

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
        const inferred = inferStepFromDates(app);
        const statusMismatch = app.status !== 'Completed' && (inferred.status !== app.status || inferred.currentStep !== app.currentStep);
        const hasLegacySeverity = app.issueSeverity && severityMap[app.issueSeverity as string];
        const hasLegacySeverityDb = (app as any).issue_severity && severityMap[(app as any).issue_severity as string];
        return statusMismatch || hasLegacySeverity || hasLegacySeverityDb;
      });

      if (appsToFix.length === 0) {
        showToast('Tất cả hồ sơ đã đúng trạng thái và chuẩn hóa!', 'success');
        setHealDone(true);
        return;
      }

      let fixedCount = 0;
      let errorCount = 0;

      for (const app of appsToFix) {
        const inferred = inferStepFromDates(app);
        const updatePayload: any = {};

        if (app.status !== 'Completed' && (inferred.status !== app.status || inferred.currentStep !== app.currentStep)) {
          updatePayload.status = inferred.status;
          updatePayload.current_step = inferred.currentStep;
        }

        const sevVal = app.issueSeverity || (app as any).issue_severity;
        if (sevVal && severityMap[sevVal]) {
          updatePayload.issue_severity = severityMap[sevVal];
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

    if (isManagementEdit) {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)", 
        "Hạn GCN cam kết", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Tự làm sổ (Có/Không)", "Ngày bàn giao sang KT",
        "Nơi nộp", "Mã VPĐK", "Ngày nộp hồ sơ", "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", 
        "Ngày GCN đã ký", "Ngày GCN đã nhận", "Ngày BG KT", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map((app: Application) => [
        app.projectName || '',
        app.unitCode || '',
        app.customerName || '',
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : (app.propertyType === 'Dat_Nen' ? 'Đất nền' : ''),
        app.commitmentDate ? (formatDate(app.commitmentDate) === '---' ? '' : formatDate(app.commitmentDate)) : '',
        app.receivedDate ? (formatDate(app.receivedDate) === '---' ? '' : formatDate(app.receivedDate)) : '',
        app.contractSigningDate ? (formatDate(app.contractSigningDate) === '---' ? '' : formatDate(app.contractSigningDate)) : '',
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
        "Dự án", "Mã lô/căn", "Khách hàng", "Đối tượng ký HĐCN", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)",
        "Hạn GCN cam kết", "Tự làm sổ (Có/Không)", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Ngày bàn giao sang KT"
      ];
      data = sourceApps.map((app: Application) => [
        app.projectName || '',
        app.unitCode || '',
        app.customerName || '',
        app.contractSignerType || '',
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : (app.propertyType === 'Dat_Nen' ? 'Đất nền' : ''),
        app.commitmentDate ? (formatDate(app.commitmentDate) === '---' ? '' : formatDate(app.commitmentDate)) : '',
        app.isSelfService ? 'Có' : 'Không',
        app.receivedDate ? (formatDate(app.receivedDate) === '---' ? '' : formatDate(app.receivedDate)) : '',
        app.contractSigningDate ? (formatDate(app.contractSigningDate) === '---' ? '' : formatDate(app.contractSigningDate)) : '',
        app.accountingHandoverDate ? (formatDate(app.accountingHandoverDate) === '---' ? '' : formatDate(app.accountingHandoverDate)) : '',
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import_Template");

    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.writeFile(workbook, "Mau_nhap_lieu_HS_GCN.xlsx");
  };

  const parseDateFromExcel = (value: any): string | null => {
    if (!value) return null;
    
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return new Date(Date.UTC(date.y, date.m - 1, date.d)).toISOString().split('T')[0];
      }
    }
    
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (!isNaN(Number(day)) && !isNaN(Number(month)) && year.length === 4) {
           return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
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

        const appsToUpdate: {app: Application, rowData: any, changes: string[]}[] = [];
        const appsToCreate: {app: Application, rowData: any}[] = [];
        const warnings: string[] = [];
        const errors: string[] = [];

        const seenInFile = new Map<string, number>(); 
      
        excelData.slice(1).forEach((row, idx) => {
          const projectName = (row[0] || '').toString().trim();
          const unitCode = (row[1] || '').toString().trim();
          if (!unitCode) return;
          
          const key = `${projectName.toLowerCase()}_${unitCode}`;
          if (seenInFile.has(key)) {
            warnings.push(
              `⚠️ File Excel có mã lô trùng: ${unitCode} ` +
              `(${projectName}) xuất hiện ở dòng ` +
              `${seenInFile.get(key)! + 2} và dòng ${idx + 2}. ` +
              `Hệ thống chỉ xử lý dòng đầu tiên.`
            );
            return;
          }
          seenInFile.set(key, idx);

          const existingApp = applications.find(
            a => a.unitCode === unitCode && 
                (!projectName || a.projectName?.toLowerCase() === projectName.toLowerCase())
          );
          
          const parsedProjectName = projectName || (visibleProjects.length > 0 ? visibleProjects[0].name : projects[0].name);

          if (existingApp) {
             const changes: string[] = [];
             const updatedApp = { ...existingApp };

             if (row[2] && row[2].toString().trim() !== existingApp.customerName) {
                updatedApp.customerName = row[2].toString().trim();
                changes.push(`Khách hàng: ${existingApp.customerName || 'Trống'} -> ${updatedApp.customerName}`);
             }
             if (row[3] && row[3].toString().trim() !== existingApp.contractSignerType) {
                updatedApp.contractSignerType = row[3].toString().trim();
                changes.push(`Đối tượng ký: ${existingApp.contractSignerType || 'Trống'} -> ${updatedApp.contractSignerType}`);
             }
             if (row[4] && row[4].toString().trim() !== existingApp.phoneNumber) {
                updatedApp.phoneNumber = row[4].toString().trim();
                changes.push(`Số ĐT: ${existingApp.phoneNumber || 'Trống'} -> ${updatedApp.phoneNumber}`);
             }
             
             const isBankLoanStr = row[5] ? row[5].toString().trim().toLowerCase() : '';
             const newIsBankLoan = isBankLoanStr === 'có' || isBankLoanStr === 'co' || isBankLoanStr === 'yes' || isBankLoanStr === '1' || isBankLoanStr === 'true' || isBankLoanStr === 'x';
             const newLoanStatus = newIsBankLoan ? 'Co_Vay' : 'Khong_Vay';
             if (row[5] && existingApp.loanStatus !== newLoanStatus) {
                updatedApp.loanStatus = newLoanStatus;
                changes.push(`Vay NH: ${existingApp.loanStatus === 'Co_Vay' ? 'Có' : 'Không'} -> ${newLoanStatus === 'Co_Vay' ? 'Có' : 'Không'}`);
             }

             const propTypeStr = row[6] ? row[6].toString().trim().toLowerCase() : '';
             const newPropType = propTypeStr.includes('căn hộ') || propTypeStr.includes('can ho') || propTypeStr.includes('apartment') ? 'Can_Ho' : (propTypeStr.includes('đất nền') || propTypeStr.includes('dat nen') || propTypeStr.includes('land') ? 'Dat_Nen' : (existingApp.propertyType || 'Can_Ho'));
             if (row[6] && existingApp.propertyType !== newPropType) {
                updatedApp.propertyType = newPropType;
                changes.push(`Loại TS: ${existingApp.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'} -> ${newPropType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'}`);
             }

             const commitmentDate = parseDateFromExcel(row[7]);
             if (commitmentDate && commitmentDate !== existingApp.commitmentDate) {
                updatedApp.commitmentDate = commitmentDate;
                changes.push(`Hạn GCN: ${existingApp.commitmentDate || 'Trống'} -> ${commitmentDate}`);
             }

             const receivedDate = parseDateFromExcel(row[8]);
             if (receivedDate && receivedDate !== existingApp.receivedDate) {
                updatedApp.receivedDate = receivedDate;
                changes.push(`Ngày nhận HS: ${existingApp.receivedDate || 'Trống'} -> ${receivedDate}`);
             }
             
             const contractSigningDate = parseDateFromExcel(row[9]);
             if (contractSigningDate && contractSigningDate !== existingApp.contractSigningDate) {
                updatedApp.contractSigningDate = contractSigningDate;
                changes.push(`Ngày ký HĐCN: ${existingApp.contractSigningDate || 'Trống'} -> ${contractSigningDate}`);
             }

             const isSelfServiceStr = row[10] ? row[10].toString().trim().toLowerCase() : '';
             const newIsSelfService = isSelfServiceStr === 'có' || isSelfServiceStr === 'co' || isSelfServiceStr === 'yes' || isSelfServiceStr === '1' || isSelfServiceStr === 'true' || isSelfServiceStr === 'x';
             if (row[10] && existingApp.isSelfService !== newIsSelfService) {
                updatedApp.isSelfService = newIsSelfService;
                changes.push(`Tự làm SGCN: ${existingApp.isSelfService ? 'Có' : 'Không'} -> ${newIsSelfService ? 'Có' : 'Không'}`);
             }

             if (row[11] !== undefined) {
               const bgKtStr = row[11] ? row[11].toString().trim().toLowerCase() : '';
               let parsedAccountingDate = existingApp.accountingHandoverDate;

               if (bgKtStr === 'có' || bgKtStr === 'đã giao' || bgKtStr === 'đã bàn giao' || bgKtStr === 'x') {
                 parsedAccountingDate = new Date().toISOString().split('T')[0];
               } else if (bgKtStr === 'không' || bgKtStr === '') {
                 parsedAccountingDate = undefined;
               } else {
                 try {
                   parsedAccountingDate = parseDateFromExcel(row[11]) || existingApp.accountingHandoverDate;
                 } catch (e) {
                   console.error("Lỗi parse ngày tháng:", e);
                 }
               }
               
               if (parsedAccountingDate !== existingApp.accountingHandoverDate) {
                 updatedApp.accountingHandoverDate = parsedAccountingDate;
                 changes.push(`Bàn giao KT: ${existingApp.accountingHandoverDate || 'Chưa gửi'} -> ${parsedAccountingDate || 'Chưa gửi'}`);
               }
             }

             if (isManagementEdit) {
               if (row[12] && row[12].toString().trim() !== existingApp.submissionLocation) {
                 updatedApp.submissionLocation = row[12].toString().trim();
                 changes.push(`Nơi nộp HS: ${existingApp.submissionLocation || 'Trống'} -> ${updatedApp.submissionLocation}`);
               }
               if (row[13] && row[13].toString().trim() !== existingApp.vpdkCode) {
                 updatedApp.vpdkCode = row[13].toString().trim();
                 changes.push(`Mã VPĐK: ${existingApp.vpdkCode || 'Trống'} -> ${updatedApp.vpdkCode}`);
               }

               const submissionDate = parseDateFromExcel(row[14]);
               if (submissionDate && submissionDate !== existingApp.submissionDate) {
                 updatedApp.submissionDate = submissionDate;
                 changes.push(`Ngày nộp VPĐK: ${existingApp.submissionDate || 'Trống'} -> ${submissionDate}`);
               }
               const taxNotificationDate = parseDateFromExcel(row[15]);
               if (taxNotificationDate && taxNotificationDate !== existingApp.taxNotificationDate) {
                 updatedApp.taxNotificationDate = taxNotificationDate;
                 changes.push(`Ngày TB Thuế: ${existingApp.taxNotificationDate || 'Trống'} -> ${taxNotificationDate}`);
               }
               const taxNotificationReceivedDate = parseDateFromExcel(row[16]);
               if (taxNotificationReceivedDate && taxNotificationReceivedDate !== existingApp.taxNotificationReceivedDate) {
                 updatedApp.taxNotificationReceivedDate = taxNotificationReceivedDate;
                 changes.push(`Ngày nhận TB Thuế: ${existingApp.taxNotificationReceivedDate || 'Trống'} -> ${taxNotificationReceivedDate}`);
               }
               const taxPaymentDate = parseDateFromExcel(row[17]);
               if (taxPaymentDate && taxPaymentDate !== existingApp.taxPaymentDate) {
                 updatedApp.taxPaymentDate = taxPaymentDate;
                 changes.push(`Ngày đóng thuế: ${existingApp.taxPaymentDate || 'Trống'} -> ${taxPaymentDate}`);
               }
               const gcnSignedDate = parseDateFromExcel(row[18]);
               if (gcnSignedDate && gcnSignedDate !== existingApp.gcnSignedDate) {
                 updatedApp.gcnSignedDate = gcnSignedDate;
                 changes.push(`Ngày GCN đã ký: ${existingApp.gcnSignedDate || 'Trống'} -> ${gcnSignedDate}`);
               }
               const gcnReceivedDate = parseDateFromExcel(row[19]);
               if (gcnReceivedDate && gcnReceivedDate !== existingApp.gcnReceivedDate) {
                 updatedApp.gcnReceivedDate = gcnReceivedDate;
                 changes.push(`Ngày GCN đã nhận: ${existingApp.gcnReceivedDate || 'Trống'} -> ${gcnReceivedDate}`);
               }
               // Note: 'Ngày BG KT' at index 20 is functionally alias to index 11 'Ngày bàn giao sang KT', skipping parsing it again to avoid conflict.
               let customerHandoverDate = parseDateFromExcel(row[21]);
               if (!customerHandoverDate && row[21] !== undefined) {
                 const bgKhachStr = row[21] ? row[21].toString().trim().toLowerCase() : '';
                 if (bgKhachStr === 'có' || bgKhachStr === 'đã giao' || bgKhachStr === 'đã bàn giao' || bgKhachStr === 'x') {
                   customerHandoverDate = new Date().toISOString().split('T')[0];
                 }
               }
               if (customerHandoverDate && customerHandoverDate !== existingApp.customerHandoverDate) {
                 updatedApp.customerHandoverDate = customerHandoverDate;
                 changes.push(`Ngày BG Khách: ${existingApp.customerHandoverDate || 'Trống'} -> ${customerHandoverDate}`);
               }
             }

             if (changes.length > 0) {
               const inferred = inferStepFromDates(updatedApp);
               if (inferred.status !== updatedApp.status || inferred.currentStep !== updatedApp.currentStep) {
                 changes.push(`Trạng thái tự động cập nhật: ${inferred.status}, Bước: ${inferred.currentStep}`);
                 updatedApp.status = inferred.status;
                 updatedApp.currentStep = inferred.currentStep;
               }
               appsToUpdate.push({ app: updatedApp, rowData: row, changes });
             }

          } else {
             const isBankLoanStr = row[5] ? row[5].toString().trim().toLowerCase() : '';
             const propTypeStr = row[6] ? row[6].toString().trim().toLowerCase() : '';
             const isSelfServiceStr = row[10] ? row[10].toString().trim().toLowerCase() : '';

             let parsedNewAccountingDate;
             if (row[11] !== undefined) {
               const bgKtStr = row[11] ? row[11].toString().trim().toLowerCase() : '';
               if (bgKtStr === 'có' || bgKtStr === 'đã giao' || bgKtStr === 'đã bàn giao' || bgKtStr === 'x') {
                 parsedNewAccountingDate = new Date().toISOString().split('T')[0];
               } else if (bgKtStr !== 'không' && bgKtStr !== '') {
                 try {
                   parsedNewAccountingDate = parseDateFromExcel(row[11]) || undefined;
                 } catch (e) {
                   console.error("Lỗi parse ngày tháng:", e);
                 }
               }
             }

             const newApp: any = {
               projectName: parsedProjectName,
               unitCode: unitCode,
               customerName: row[2] ? row[2].toString().trim() : '',
               contractSignerType: row[3] ? row[3].toString().trim() : '',
               phoneNumber: row[4] ? row[4].toString().trim() : '',
               loanStatus: (isBankLoanStr === 'có' || isBankLoanStr === 'co' || isBankLoanStr === 'yes' || isBankLoanStr === '1' || isBankLoanStr === 'true' || isBankLoanStr === 'x') ? 'Co_Vay' : 'Khong_Vay',
               propertyType: (propTypeStr.includes('đất nền') || propTypeStr.includes('land') || propTypeStr.includes('dat nen')) ? 'Dat_Nen' : 'Can_Ho',
               commitmentDate: parseDateFromExcel(row[7]) || undefined,
               receivedDate: parseDateFromExcel(row[8]) || undefined,
               contractSigningDate: parseDateFromExcel(row[9]) || undefined,
               isSelfService: isSelfServiceStr === 'có' || isSelfServiceStr === 'co' || isSelfServiceStr === 'yes' || isSelfServiceStr === '1' || isSelfServiceStr === 'true' || isSelfServiceStr === 'x',
               accountingHandoverDate: parsedNewAccountingDate,
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               status: 'Processing',
               currentStep: 'S1_ChuanBi', // Will resolve correctly by infer step anyway
               workflowType: 'Quy_trinh_2'
             };

             if (isManagementEdit) {
               newApp.submissionLocation = row[12] ? row[12].toString().trim() as any : undefined;
               newApp.vpdkCode = row[13] ? row[13].toString().trim() : undefined;
               newApp.submissionDate = parseDateFromExcel(row[14]) || undefined;
               newApp.taxNotificationDate = parseDateFromExcel(row[15]) || undefined;
               newApp.taxNotificationReceivedDate = parseDateFromExcel(row[16]) || undefined;
               newApp.taxReceiptDate = parseDateFromExcel(row[17]) || undefined;
               newApp.gcnSignedDate = parseDateFromExcel(row[18]) || undefined;
               newApp.gcnReceivedDate = parseDateFromExcel(row[19]) || undefined;
               // Skip row[20] because accountingHandoverDate is parsed at row[11]
               let parsedCustomerHandoverDate = parseDateFromExcel(row[21]) || undefined;
               if (!parsedCustomerHandoverDate && row[21] !== undefined) {
                 const bgKhachStr = row[21] ? row[21].toString().trim().toLowerCase() : '';
                 if (bgKhachStr === 'có' || bgKhachStr === 'đã giao' || bgKhachStr === 'đã bàn giao' || bgKhachStr === 'x') {
                   parsedCustomerHandoverDate = new Date().toISOString().split('T')[0];
                 }
               }
               newApp.customerHandoverDate = parsedCustomerHandoverDate;
             }

             const inferred = inferStepFromDates(newApp as Application);
             newApp.status = inferred.status;
             newApp.currentStep = inferred.currentStep;

             appsToCreate.push({ app: newApp as Application, rowData: row });
          }
        });

        if (appsToUpdate.length === 0 && appsToCreate.length === 0) {
          showToast('Không có dữ liệu mới hoặc thay đổi hợp lệ trong file.', 'info');
          if (warnings.length > 0) {
            alert("Các cảnh báo trong file:n" + warnings.join('n'));
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
