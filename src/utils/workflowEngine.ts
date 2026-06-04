import { Application, StepName } from '../types';
import { STEP_CONFIG, STEP_CONFIG as INITIAL_STEP_CONFIG, WORKFLOW_1_STEPS, WORKFLOW_2_STEPS } from '../constants';
import { validateDateSequence } from './appUtils';

/**
 * WORKFLOW ENGINE
 * Chịu trách nhiệm phân tích, cấp phép và thực thi chuyển bước hệ thống.
 * Tách biệt hoàn toàn tính toán logic khỏi UI Component.
 */

export interface TransitionResult {
  success: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'info';
  nextStep?: StepName;
  updates?: Partial<Application>;
}

export const WorkflowEngine = {
  /**
   * Tính toán bước tiếp theo hợp lệ dựa trên logic nhảy cóc (Self-Service) 
   * hoặc luồng (Workflow) đặc thù.
   */
  determineTargetStep(app: Application, requestedNextStep: StepName): { finalStep: StepName, isJump: boolean } {
    let finalStep = requestedNextStep;
    let isJump = false;

    const currStepCfg = STEP_CONFIG[app.currentStep] || INITIAL_STEP_CONFIG[app.currentStep];
    const currentStepDept = currStepCfg?.dept;
    
    // Logic ưu tiên tuyệt đối: Hồ sơ "Khách tự làm sổ" bỏ qua các đoạn nội bộ
    const isSelfServiceJumpEligible = app.isSelfService && ['PTT', 'PTDA', 'KT'].includes(currentStepDept as any);
    if (isSelfServiceJumpEligible) {
      finalStep = 'Hoan_Tat';
      isJump = true;
    }

    // Logic đặc thù: PTT đôn đốc xong có thể bypass S4 để đẩy thẳng sang Khách nộp thuế (S5) trong Quy trình 2
    // S4 đã được xóa khỏi WORKFLOW_2_STEPS, nên S3 -> S5 là bước tuần tự bình thường.

    return { finalStep, isJump };
  },

  /**
   * Kiểm duyệt các điều kiện để được phép chuyển sang bước mong muốn
   */
  validateTransition(app: Application, requestedNextStep: StepName, userRole: string): TransitionResult {
    const workflowSteps = app.workflowType === 'Quy_trinh_2' ? WORKFLOW_2_STEPS : WORKFLOW_1_STEPS;
    const currentIdx = workflowSteps.indexOf(app.currentStep);
    
    const { finalStep, isJump } = this.determineTargetStep(app, requestedNextStep);
    const nextIdx = workflowSteps.indexOf(finalStep);
    const isMovingForward = nextIdx > currentIdx;

    // 1. Kiểm tra trạng thái hồ sơ có đang đình trệ (Error/Rejected)
    if (isMovingForward && (app.status === 'Error' || app.isRejected)) {
      return { 
        success: false, 
        type: 'error', 
        message: 'Hồ sơ đang bị sai sót/vướng mắc hoặc bị trả về. Hãy hoàn thiện trước khi xác nhận chuyển bước.'
      };
    }

    // 2. Chặn chuyển bước nhảy cóc đối với Users thường (ngoại trừ admin/manager/hoặc hồ sơ đặc thù)
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

      // 3. Date Sequences Validation (Tính loggic thời gian)
      const chronoError = validateDateSequence(app);
      if (chronoError) {
        return {
          success: false,
          type: 'warning',
          message: chronoError.startsWith('⚠️') ? chronoError : `Lỗi trình tự ngày: ${chronoError}`
        };
      }

      // 4. Bắt buộc dữ kiện theo từng rẽ nhánh quy trình:
      if (app.workflowType === 'Quy_trinh_2') {
        if (app.currentStep === 'S3_Nop_VPDK' && finalStep === 'S5_Tai_Chinh_Khach_Hang') {
           if (!app.taxNotificationDate && !app.taxNotificationReceivedDate) {
             return { 
               success: false, 
               type: 'warning', 
               message: 'Bắt buộc nhập Ngày Thông báo thuế trước khi chuyển sang chặng Tài chính.' 
             };
           }
        }
        if (app.currentStep === 'S5_1_PTDA_TiepNhan' && finalStep === 'S6_Nhan_So_GCN') {
          if (!app.taxReceiptDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày Nhận chứng từ thuế trước khi chuyển.' };
          if (!app.gcnSignedDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày trình ký/In GCN trước khi chuyển.' };
        }
        if (app.currentStep === 'S6_Nhan_So_GCN' && finalStep === 'S7_PTDA_Ban_Giao') {
          if (!app.ptdaHandoverDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày bàn giao GCN cho PTT.' };
        }
        if (app.currentStep === 'S7_2_Ban_Giao_Khach' && finalStep === 'Hoan_Tat') {
          if (!app.customerHandoverDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày BG GCN cho khách để Hoàn Tất.' };
        }
      } else {
        const ktSteps = ['S2_KT_Tiep_Nhan', 'GD1_KT_HoanThien'];
        if (ktSteps.concat(['S3_Nop_VPDK', 'GD2_Cho_Nop_VPDK'] as any[]).includes(finalStep) && ktSteps.includes(app.currentStep as string) && finalStep !== app.currentStep) {
          if (!app.contractSigningDate) return { success: false, type: 'warning', message: 'Bắt buộc nhập Ngày ký HĐ trước khi chuyển.' };
        }
        if ((app.currentStep === 'S3_Nop_VPDK' || app.currentStep === 'GD2_Cho_Nop_VPDK') && (finalStep === 'S5_Tai_Chinh_Khach_Hang' || finalStep === 'GD3_Cho_TBThue')) {
          if (!app.submissionDate) return { success: false, type: 'warning', message: 'Yêu cầu: Ngày nộp VPĐK phải được cập nhật.' };
        }
      }
    }

    return { success: true, nextStep: finalStep };
  }
};
