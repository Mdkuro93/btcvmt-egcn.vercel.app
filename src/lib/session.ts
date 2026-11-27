// Giữ mã phiên đăng nhập (chỉ trong bộ nhớ, tải lại trang là đăng nhập lại như hiện tại)
let sessionToken: string | null = null;

export const getSessionToken = (): string | null => sessionToken;
export const setSessionToken = (token: string | null): void => {
  sessionToken = token;
};

// Đăng xuất: hủy phiên phía DB rồi xóa mã phiên trong bộ nhớ
export const endSession = async (sb: any): Promise<void> => {
  const token = sessionToken;
  sessionToken = null;
  if (!token) return;
  try {
    await sb.rpc('app_logout', { p_token: token });
  } catch {
    /* bỏ qua lỗi mạng khi đăng xuất */
  }
};