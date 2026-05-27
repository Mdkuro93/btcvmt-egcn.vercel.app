
import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Application, StepName, UnitStatus, IssueSeverity } from '../types';

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
      if (app.accountingHandoverDate && !app.submissionDate)
        return { currentStep: 'S2_KT_Tiep_Nhan', status: 'WaitingVPDK' };
      if (app.contractSigningDate && !app.accountingHandoverDate)
        return { currentStep: 'S2_KT_Tiep_Nhan', status: 'Processing' };
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
      if (app.accountingHandoverDate && !app.submissionDate)
        return { currentStep: 'GD1_Cho_KT_TiepNhan', status: 'WaitingVPDK' };
      if (app.contractSigningDate && !app.accountingHandoverDate)
        return { currentStep: 'GD1_Cho_KT_TiepNhan', status: 'Processing' };
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
        "Dự án", "Mã lô/căn", "Khách hàng", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)", 
        "Hạn GCN cam kết", "Ngày nhận hồ sơ", "Ngày ký HĐCN", "Tự làm sổ (Có/Không)",
        "Nơi nộp", "Mã VPĐK", "Ngày nộp hồ sơ", "Ngày TB Thuế", "Ngày nhận TB Thuế", "Ngày đóng thuế", 
        "Ngày GCN đã ký", "Ngày GCN đã nhận", "Ngày BG KT", "Ngày BG GCN Khách"
      ];
      data = sourceApps.map((app: Application) => [
        app.projectName || '',
        app.unitCode || '',
        app.customerName || '',
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : (app.propertyType === 'Dat_Nen' ? 'Đất nền' : ''),
        app.commitmentDate ? new Date(app.commitmentDate).toLocaleDateString() : '',
        app.receivedDate ? new Date(app.receivedDate).toLocaleDateString() : '',
        app.contractSigningDate ? new Date(app.contractSigningDate).toLocaleDateString() : '',
        app.isSelfService ? 'Có' : 'Không',
        app.submissionLocation || '',
        app.vpdkCode || '',
        app.submissionDate ? new Date(app.submissionDate).toLocaleDateString() : '',
        app.taxNotificationDate ? new Date(app.taxNotificationDate).toLocaleDateString() : '',
        app.taxNotificationReceivedDate ? new Date(app.taxNotificationReceivedDate).toLocaleDateString() : '',
        app.taxReceiptDate ? new Date(app.taxReceiptDate).toLocaleDateString() : '',
        app.gcnSignedDate ? new Date(app.gcnSignedDate).toLocaleDateString() : '',
        app.gcnReceivedDate ? new Date(app.gcnReceivedDate).toLocaleDateString() : '',
        app.accountingHandoverDate ? new Date(app.accountingHandoverDate).toLocaleDateString() : '',
        app.customerHandoverDate ? new Date(app.customerHandoverDate).toLocaleDateString() : ''
      ]);
    } else {
      headers = [
        "Dự án", "Mã lô/căn", "Khách hàng", "Số điện thoại", "Vay ngân hàng (Có/Không)", "Loại tài sản (Căn hộ/Đất nền)",
        "Hạn GCN cam kết", "Tự làm sổ (Có/Không)", "Ngày nhận hồ sơ", "Ngày ký HĐCN"
      ];
      data = sourceApps.map((app: Application) => [
        app.projectName || '',
        app.unitCode || '',
        app.customerName || '',
        app.phoneNumber || '',
        app.loanStatus === 'Co_Vay' ? 'Có' : 'Không',
        app.propertyType === 'Can_Ho' ? 'Căn hộ' : (app.propertyType === 'Dat_Nen' ? 'Đất nền' : ''),
        app.commitmentDate ? new Date(app.commitmentDate).toLocaleDateString() : '',
        app.isSelfService ? 'Có' : 'Không',
        app.receivedDate ? new Date(app.receivedDate).toLocaleDateString() : '',
        app.contractSigningDate ? new Date(app.contractSigningDate).toLocaleDateString() : '',
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
             if (row[3] && row[3].toString().trim() !== existingApp.phoneNumber) {
                updatedApp.phoneNumber = row[3].toString().trim();
                changes.push(`Số ĐT: ${existingApp.phoneNumber || 'Trống'} -> ${updatedApp.phoneNumber}`);
             }
             
             const isBankLoanStr = row[4] ? row[4].toString().trim().toLowerCase() : '';
             const newIsBankLoan = isBankLoanStr === 'có' || isBankLoanStr === 'yes' || isBankLoanStr === '1' || isBankLoanStr === 'true';
             const newLoanStatus = newIsBankLoan ? 'Co_Vay' : 'Khong_Vay';
             if (row[4] && existingApp.loanStatus !== newLoanStatus) {
                updatedApp.loanStatus = newLoanStatus;
                changes.push(`Vay NH: ${existingApp.loanStatus === 'Co_Vay' ? 'Có' : 'Không'} -> ${newLoanStatus === 'Co_Vay' ? 'Có' : 'Không'}`);
             }

             const propTypeStr = row[5] ? row[5].toString().trim().toLowerCase() : '';
             const newPropType = propTypeStr.includes('căn hộ') || propTypeStr.includes('can ho') || propTypeStr.includes('apartment') ? 'Can_Ho' : (propTypeStr.includes('đất nền') || propTypeStr.includes('dat nen') || propTypeStr.includes('land') ? 'Dat_Nen' : (existingApp.propertyType || 'Can_Ho'));
             if (row[5] && existingApp.propertyType !== newPropType) {
                updatedApp.propertyType = newPropType;
                changes.push(`Loại TS: ${existingApp.propertyType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'} -> ${newPropType === 'Can_Ho' ? 'Căn hộ' : 'Đất nền'}`);
             }

             const commitmentDate = parseDateFromExcel(row[6]);
             if (commitmentDate && commitmentDate !== existingApp.commitmentDate) {
                updatedApp.commitmentDate = commitmentDate;
                changes.push(`Hạn GCN: ${existingApp.commitmentDate || 'Trống'} -> ${commitmentDate}`);
             }

             const receivedDate = parseDateFromExcel(row[7]);
             if (receivedDate && receivedDate !== existingApp.receivedDate) {
                updatedApp.receivedDate = receivedDate;
                changes.push(`Ngày nhận HS: ${existingApp.receivedDate || 'Trống'} -> ${receivedDate}`);
             }
             
             const contractSigningDate = parseDateFromExcel(row[8]);
             if (contractSigningDate && contractSigningDate !== existingApp.contractSigningDate) {
                updatedApp.contractSigningDate = contractSigningDate;
                changes.push(`Ngày ký HĐCN: ${existingApp.contractSigningDate || 'Trống'} -> ${contractSigningDate}`);
             }

             const isSelfServiceStr = row[9] ? row[9].toString().trim().toLowerCase() : '';
             const newIsSelfService = isSelfServiceStr === 'có' || isSelfServiceStr === 'yes' || isSelfServiceStr === '1' || isSelfServiceStr === 'true';
             if (row[9] && existingApp.isSelfService !== newIsSelfService) {
                updatedApp.isSelfService = newIsSelfService;
                changes.push(`Tự làm SGCN: ${existingApp.isSelfService ? 'Có' : 'Không'} -> ${newIsSelfService ? 'Có' : 'Không'}`);
             }

             if (isManagementEdit) {
               if (row[10] && row[10].toString().trim() !== existingApp.submissionLocation) {
                 updatedApp.submissionLocation = row[10].toString().trim();
                 changes.push(`Nơi nộp HS: ${existingApp.submissionLocation || 'Trống'} -> ${updatedApp.submissionLocation}`);
               }
               if (row[11] && row[11].toString().trim() !== existingApp.vpdkCode) {
                 updatedApp.vpdkCode = row[11].toString().trim();
                 changes.push(`Mã VPĐK: ${existingApp.vpdkCode || 'Trống'} -> ${updatedApp.vpdkCode}`);
               }

               const submissionDate = parseDateFromExcel(row[12]);
               if (submissionDate && submissionDate !== existingApp.submissionDate) {
                 updatedApp.submissionDate = submissionDate;
                 changes.push(`Ngày nộp VPĐK: ${existingApp.submissionDate || 'Trống'} -> ${submissionDate}`);
               }
               const taxNotificationDate = parseDateFromExcel(row[13]);
               if (taxNotificationDate && taxNotificationDate !== existingApp.taxNotificationDate) {
                 updatedApp.taxNotificationDate = taxNotificationDate;
                 changes.push(`Ngày TB Thuế: ${existingApp.taxNotificationDate || 'Trống'} -> ${taxNotificationDate}`);
               }
               const taxReceiptDate = parseDateFromExcel(row[14]);
               if (taxReceiptDate && taxReceiptDate !== existingApp.taxReceiptDate) {
                 updatedApp.taxReceiptDate = taxReceiptDate;
                 changes.push(`Phát TB Thuế (NL): ${existingApp.taxReceiptDate || 'Trống'} -> ${taxReceiptDate}`);
               }
               const taxPaymentDate = parseDateFromExcel(row[15]);
               if (taxPaymentDate && taxPaymentDate !== existingApp.taxPaymentDate) {
                 updatedApp.taxPaymentDate = taxPaymentDate;
                 changes.push(`Ngày đóng thuế: ${existingApp.taxPaymentDate || 'Trống'} -> ${taxPaymentDate}`);
               }
               const gcnSignedDate = parseDateFromExcel(row[16]);
               if (gcnSignedDate && gcnSignedDate !== existingApp.gcnSignedDate) {
                 updatedApp.gcnSignedDate = gcnSignedDate;
                 changes.push(`Ngày GCN đã ký: ${existingApp.gcnSignedDate || 'Trống'} -> ${gcnSignedDate}`);
               }
               const gcnReceivedDate = parseDateFromExcel(row[17]);
               if (gcnReceivedDate && gcnReceivedDate !== existingApp.gcnReceivedDate) {
                 updatedApp.gcnReceivedDate = gcnReceivedDate;
                 changes.push(`Ngày GCN đã nhận: ${existingApp.gcnReceivedDate || 'Trống'} -> ${gcnReceivedDate}`);
               }
               const accountingHandoverDate = parseDateFromExcel(row[18]);
               if (accountingHandoverDate && accountingHandoverDate !== existingApp.accountingHandoverDate) {
                 updatedApp.accountingHandoverDate = accountingHandoverDate;
                 changes.push(`Ngày BG KT: ${existingApp.accountingHandoverDate || 'Trống'} -> ${accountingHandoverDate}`);
               }
               const customerHandoverDate = parseDateFromExcel(row[19]);
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
             const isBankLoanStr = row[4] ? row[4].toString().trim().toLowerCase() : '';
             const propTypeStr = row[5] ? row[5].toString().trim().toLowerCase() : '';
             const isSelfServiceStr = row[9] ? row[9].toString().trim().toLowerCase() : '';

             const newApp: any = {
               projectName: parsedProjectName,
               unitCode: unitCode,
               customerName: row[2] ? row[2].toString().trim() : '',
               phoneNumber: row[3] ? row[3].toString().trim() : '',
               loanStatus: (isBankLoanStr === 'có' || isBankLoanStr === 'yes' || isBankLoanStr === '1' || isBankLoanStr === 'true') ? 'Co_Vay' : 'Khong_Vay',
               propertyType: (propTypeStr.includes('đất nền') || propTypeStr.includes('land') || propTypeStr.includes('dat nen')) ? 'Dat_Nen' : 'Can_Ho',
               commitmentDate: parseDateFromExcel(row[6]) || undefined,
               receivedDate: parseDateFromExcel(row[7]) || undefined,
               contractSigningDate: parseDateFromExcel(row[8]) || undefined,
               isSelfService: isSelfServiceStr === 'có' || isSelfServiceStr === 'yes' || isSelfServiceStr === '1' || isSelfServiceStr === 'true',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               status: 'Processing',
               currentStep: 'S1_ChuanBi', // Will resolve correctly by infer step anyway
               workflowType: 'Quy_trinh_2'
             };

             if (isManagementEdit) {
               newApp.submissionLocation = row[10] ? row[10].toString().trim() as any : undefined;
               newApp.vpdkCode = row[11] ? row[11].toString().trim() : undefined;
               newApp.submissionDate = parseDateFromExcel(row[12]) || undefined;
               newApp.taxNotificationDate = parseDateFromExcel(row[13]) || undefined;
               newApp.taxNotificationReceivedDate = parseDateFromExcel(row[14]) || undefined;
               newApp.taxReceiptDate = parseDateFromExcel(row[15]) || undefined;
               newApp.gcnSignedDate = parseDateFromExcel(row[16]) || undefined;
               newApp.gcnReceivedDate = parseDateFromExcel(row[17]) || undefined;
               newApp.accountingHandoverDate = parseDateFromExcel(row[18]) || undefined;
               newApp.customerHandoverDate = parseDateFromExcel(row[19]) || undefined;
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
