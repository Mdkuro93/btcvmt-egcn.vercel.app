-- Mở rộng schema an toàn cho hệ thống quản lý SLA (tương thích ngược 100%)
-- Chạy script này trong Supabase SQL Editor trước khi bật logic tính SLA theo step_entry_date.
-- Cả 2 cột đều để NULL mặc định, không thêm ràng buộc NOT NULL và không thay đổi/xóa cột cũ.

ALTER TABLE records
  ADD COLUMN IF NOT EXISTS step_entry_date TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejected_from_step_id TEXT DEFAULT NULL;

-- Partial index nhẹ hỗ trợ truy vấn/backfill nhanh các hồ sơ đã có mốc vào bước hiện tại
CREATE INDEX IF NOT EXISTS idx_records_step_entry_date
  ON records (step_entry_date)
  WHERE step_entry_date IS NOT NULL;
