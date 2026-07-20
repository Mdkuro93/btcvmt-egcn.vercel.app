import { Application, StepName } from '../types';
import { STEP_CONFIG as INITIAL_STEP_CONFIG, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS } from '../constants';
import { validateDateSequence } from './appUtils';

// Ngày áp dụng quy tắc bắt buộc nhập liệu khắt khe (chặn từ đầu).
// Các hồ sơ tạo trước ngày này sẽ được "nợ" ngày cho đến bước cuối cùng (Hoàn Tất).
const STRICT_VALIDATION_CUTOFF_DATE = new Date('2026-07-20T00:00:00Z').getTime();

export function isLegacyRecord(app: Application): boolean {
  if (!app.createdAt) return true;
  return new Date(app.createdAt).getTime() < STRICT_VALIDATION_CUTOFF_DATE;
}

export interface TransitionResult {
  success: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'info';
  nextStep?: StepName;
  hasWarning?: boolean;
}

export const WorkflowEngine = {
  determineTargetStep(app: Application, requestedNextStep: StepName): { finalStep: StepName, isJump: boolean } {
    let finalStep = requestedNextStep;
    let isJump = false;
    
    const currentStepDept = INITIAL_STEP_CONFIG[app.currentStep]?.dept;
    const workflowType = app.workflowType || 'Quy_trinh_1';
    const steps = workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
    
    const currentIdx = steps.indexOf(app.currentStep);
    const reqNextIdx = steps.indexOf(requestedNextStep);
    
    const isSelfServiceJumpEligible = app.isSelfService && ['PTT', 'PTDA', 'KT'].includes(currentStepDept as any);
    if (isSelfServiceJumpEligible) {
      const handoverStep: StepName = workflowType === 'Quy_trinh_2' ? 'S7_2_Ban_Giao_Khach' : 'GD6_Cho_BG_Khach';
      const handoverIdx = steps.indexOf(handoverStep);
      
      if (currentIdx < handoverIdx && reqNextIdx > currentIdx && reqNextIdx < handoverIdx) {
        finalStep = handoverStep;
        isJump = true;
      }
    }

    return { finalStep, isJump };
  },

  validateTransition(app: Application, requestedNextStep: StepName, userRole: string, skipJustification: boolean = false): TransitionResult {
    const storedType = app.workflowType || (app as any).workflow_type;
    if (!storedType) {
      console.warn(`[validateTransition] Missing workflowType for record ${app.unitCode || app.id}. Falling back to Quy_trinh_1.`);
    }
    const workflowType = storedType || 'Quy_trinh_1';
    const workflowSteps = workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;

    const currentIdx = Math.max(0, workflowSteps.indexOf(app.currentStep));
    const { finalStep, isJump } = this.determineTargetStep(app, requestedNextStep);
    const nextIdx = workflowSteps.indexOf(finalStep);
    const isMovingForward = nextIdx > currentIdx;

    if (isMovingForward && (app.status === 'Error' || app.isRejected)) {
      return {
        success: false,
        type: 'error',
        message: 'Hồ sơ đang bị sai sót/vướng mắc hoặc bị trả về. Hãy hoàn thiện trước khi xác nhận chuyển bước.'
      };
    }

    if (isMovingForward) {
      if (userRole !== 'ADMIN' && !userRole.startsWith('MANAGER_')) {
        if (nextIdx > currentIdx + 1 && !isJump && typeof finalStep === 'string') {
          return {
            success: false,
            type: 'error',
            message: 'Hệ thống yêu cầu chuyển bước tuần tự, không được bỏ qua bước trung gian (trừ hồ sơ Khách tự làm).'
          };
        }
      }

      const chronoError = validateDateSequence(app);
      if (chronoError) {
        if (chronoError.startsWith('⚠️')) {
          return {
            success: true,
            type: 'warning',
            message: chronoError,
            hasWarning: true
          };
        }
        return {
          success: false,
          type: 'warning',
          message: `Lỗi trình tự ngày: ${chronoError}`
        };
      }

      const isLegacy = isLegacyRecord(app);

      if (app.workflowType === 'Quy_trinh_2') {
        if (app.currentStep === 'S2_KT_Ban_giao' && finalStep === 'S3_Nop_VPDK') {
          if (!isLegacy && !app.ktHandoverToPtdaDate) {
            return {
              success: false,
              type: 'warning',
              message: 'Bắt buộc nhập Ngày Kế toán bàn giao cho PTDA trước khi chuyển sang Bước 3.'
            };
          }
        }
        if (app.currentStep === 'S3_Nop_VPDK' && finalStep === 'S5_Tai_Chinh_Khach_Hang') {
          if (!isLegacy && (!app.taxNotificationDate && !app.taxNotificationReceivedDate)) {
            return {
              success: false,
              type: 'warning',
              message: 'Bắt buộc nhập Ngày Thông báo thuế trước khi chuyển sang chặng Tài chính.'
            };
          }
        }
        if (app.currentStep === 'S5_1_PTDA_TiepNhan' && finalStep === 'S6_Nhan_So_GCN') {
          if (!isLegacy && !app.taxReceiptDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày Nhận chứng từ thuế trước khi chuyển.' };
          if (!isLegacy && !app.gcnSignedDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày trình ký/In GCN trước khi chuyển.' };
        }
        if (app.currentStep === 'S6_Nhan_So_GCN' && finalStep === 'S7_PTDA_Ban_Giao') {
          if (!isLegacy && !app.ptdaHandoverDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày bàn giao GCN cho PTT.' };
        }
        if (app.currentStep === 'S7_2_Ban_Giao_Khach' && finalStep === 'Hoan_Tat') {
          if (!app.contractSigningDate || app.contractSigningDate === '---') return { success: false, type: 'warning', message: 'Hồ sơ chưa có Ngày ký HĐCN. Bắt buộc phải bổ sung trước khi Hoàn Tất.' };
          if (app.propertyType === 'Can_Ho' && (!app.handoverApartmentDate || app.handoverApartmentDate === '---')) return { success: false, type: 'warning', message: 'Hồ sơ chưa có Ngày bàn giao căn hộ thực tế. Bắt buộc phải bổ sung trước khi Hoàn Tất (đối với Căn hộ).' };
          if (!app.customerHandoverDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày BG GCN cho khách để Hoàn Tất.' };
          
          if (isLegacy) {
             if (!app.ktHandoverToPtdaDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày Kế toán bàn giao cho PTDA để Hoàn Tất.' };
             if (!app.isSelfService) {
                if (!app.taxNotificationDate && !app.taxNotificationReceivedDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày Thông báo thuế để Hoàn Tất.' };
                if (!app.taxReceiptDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày Nhận chứng từ thuế để Hoàn Tất.' };
                if (!app.gcnSignedDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày trình ký/In GCN để Hoàn Tất.' };
             }
             if (!app.ptdaHandoverDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày bàn giao GCN cho PTT để Hoàn Tất.' };
          }
        }
      } else {
        if (app.currentStep === 'GD2_Cho_Nop_VPDK' && finalStep === 'GD3_Nop_VPDK') {
          if (userRole !== 'KT' && userRole !== 'ADMIN' && !userRole.startsWith('MANAGER_') && userRole !== 'DIRECTOR' && userRole !== 'MANAGER_ALL') {
            return {
              success: false,
              type: 'error',
              message: 'Quyền thực hiện bước này thuộc bộ phận Kế toán (KT).'
            };
          }
        }

        if ((app.currentStep === 'S3_Nop_VPDK' || app.currentStep === 'GD2_Cho_Nop_VPDK') && (finalStep === 'S5_Tai_Chinh_Khach_Hang' || finalStep === 'GD3_Nop_VPDK')) {
          if (!isLegacy && (!app.submissionDate || app.submissionDate === '---')) return { success: false, type: 'warning', message: 'Yêu cầu: Ngày nộp VPĐK phải được cập nhật.' };
        }

        if (app.currentStep === 'GD3_Nop_VPDK' && finalStep === 'GD4_Cho_Nop_NVTC') {
          if (!isLegacy && (!app.taxNotificationDate || app.taxNotificationDate === '---') && (!app.taxNotificationReceivedDate || app.taxNotificationReceivedDate === '---')) {
            return {
              success: false,
              type: 'warning',
              message: 'Bắt buộc nhập Ngày Thông báo thuế trước khi chuyển.'
            };
          }
        }

        if (finalStep === 'GD5_Cho_Ky_In_GCN') {
          if (!isLegacy && (!app.taxReceiptDate || app.taxReceiptDate === '---')) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày nộp thuế/NVTC trước khi chuyển sang bước GCN.' };
        }
        if (finalStep === 'GD5_Cho_GCN') {
          if (!isLegacy && (!app.taxReceiptDate || app.taxReceiptDate === '---')) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày nộp thuế/NVTC trước khi chuyển sang bước GCN.' };
          if (!isLegacy && (!app.gcnSignedDate || app.gcnSignedDate === '---')) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày trình ký/In GCN trước khi chuyển sang bước GCN.' };
        }
        if (app.currentStep === 'GD5_Cho_GCN' && finalStep === 'GD5_Cho_PTT_TiepNhan_BG') {
          if (!isLegacy && !app.gcnSignedDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày trình ký/In GCN trước khi chuyển.' };
          if (!isLegacy && !app.gcnReceivedDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày nhận GCN thực tế trước khi chuyển.' };
        }
        if (app.currentStep === 'GD5_Cho_PTT_TiepNhan_BG' && finalStep === 'GD6_Cho_BG_Khach') {
          if (!isLegacy && !app.ptdaHandoverDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày bàn giao GCN cho PTT trước khi chuyển.' };
        }
        if (app.currentStep === 'GD6_Cho_BG_Khach' && finalStep === 'Hoan_Tat') {
          if (!app.contractSigningDate || app.contractSigningDate === '---') return { success: false, type: 'warning', message: 'Hồ sơ chưa có Ngày ký HĐCN. Bắt buộc phải bổ sung trước khi Hoàn Tất.' };
          if (app.propertyType === 'Can_Ho' && (!app.handoverApartmentDate || app.handoverApartmentDate === '---')) return { success: false, type: 'warning', message: 'Hồ sơ chưa có Ngày bàn giao căn hộ thực tế. Bắt buộc phải bổ sung trước khi Hoàn Tất (đối với Căn hộ).' };
          if (!app.customerHandoverDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày BG GCN cho khách để Hoàn Tất.' };
          
          if (isLegacy) {
             if (!app.submissionDate || app.submissionDate === '---') return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày nộp VPĐK để Hoàn Tất.' };
             if (!app.isSelfService) {
                if ((!app.taxNotificationDate || app.taxNotificationDate === '---') && (!app.taxNotificationReceivedDate || app.taxNotificationReceivedDate === '---')) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày Thông báo thuế để Hoàn Tất.' };
                if (!app.taxReceiptDate || app.taxReceiptDate === '---') return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày nộp thuế/NVTC để Hoàn Tất.' };
                if (!app.gcnSignedDate || app.gcnSignedDate === '---') return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày trình ký/In GCN để Hoàn Tất.' };
                if (!app.gcnReceivedDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày nhận GCN thực tế để Hoàn Tất.' };
             }
             if (!app.ptdaHandoverDate) return { success: false, type: 'warning', message: 'Bổ sung thiếu: Bắt buộc nhập Ngày bàn giao GCN cho PTT để Hoàn Tất.' };
          }
        }
      }
    }

    return { success: true, nextStep: finalStep };
  }
};
