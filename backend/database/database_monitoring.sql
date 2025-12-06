-- ================================================
-- Database Monitoring System
-- ================================================
-- Script ini menggantikan auto-delete dengan sistem monitoring
-- yang memberikan warning ketika database hampir penuh
-- ================================================

-- 1. HAPUS EVENT AUTO-DELETE YANG LAMA (jika ada)
DROP EVENT IF EXISTS delete_old_sensor_data;

-- 2. STORED PROCEDURE untuk cek status database
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS check_database_status()
BEGIN
  DECLARE total_records INT;
  DECLARE table_size_mb DECIMAL(10,2);
  DECLARE db_size_mb DECIMAL(10,2);
  DECLARE warning_threshold INT DEFAULT 100000; -- Warning jika lebih dari 100k records
  DECLARE critical_threshold INT DEFAULT 500000; -- Critical jika lebih dari 500k records
  
  -- Hitung total records
  SELECT COUNT(*) INTO total_records FROM sensor_data;
  
  -- Hitung ukuran tabel dalam MB
  SELECT 
    ROUND(((data_length + index_length) / 1024 / 1024), 2) INTO table_size_mb
  FROM information_schema.TABLES 
  WHERE table_schema = DATABASE() 
    AND table_name = 'sensor_data';
  
  -- Hitung ukuran database dalam MB
  SELECT 
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) INTO db_size_mb
  FROM information_schema.TABLES 
  WHERE table_schema = DATABASE();
  
  -- Return status
  SELECT 
    total_records as total_records,
    table_size_mb as table_size_mb,
    db_size_mb as database_size_mb,
    CASE 
      WHEN total_records >= critical_threshold THEN 'CRITICAL'
      WHEN total_records >= warning_threshold THEN 'WARNING'
      ELSE 'OK'
    END as status,
    CASE 
      WHEN total_records >= critical_threshold THEN 
        CONCAT('Database hampir penuh! ', total_records, ' records. Segera hapus data lama.')
      WHEN total_records >= warning_threshold THEN 
        CONCAT('Perhatian: Database mencapai ', total_records, ' records. Pertimbangkan untuk menghapus data lama.')
      ELSE 'Database dalam kondisi normal'
    END as message,
    warning_threshold as warning_threshold,
    critical_threshold as critical_threshold;
END$$

DELIMITER ;

-- 3. FUNCTION untuk cek apakah database perlu warning
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS needs_database_warning()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE total_records INT;
  DECLARE status VARCHAR(20);
  
  SELECT COUNT(*) INTO total_records FROM sensor_data;
  
  IF total_records >= 500000 THEN
    SET status = 'CRITICAL';
  ELSEIF total_records >= 100000 THEN
    SET status = 'WARNING';
  ELSE
    SET status = 'OK';
  END IF;
  
  RETURN status;
END$$

DELIMITER ;

-- 4. VIEW untuk monitoring cepat
CREATE OR REPLACE VIEW database_monitoring AS
SELECT 
  (SELECT COUNT(*) FROM sensor_data) as total_records,
  (SELECT COUNT(DISTINCT compartment_id) FROM sensor_data) as active_compartments,
  (SELECT MIN(timestamp) FROM sensor_data) as oldest_record,
  (SELECT MAX(timestamp) FROM sensor_data) as newest_record,
  (SELECT ROUND(((data_length + index_length) / 1024 / 1024), 2) 
   FROM information_schema.TABLES 
   WHERE table_schema = DATABASE() AND table_name = 'sensor_data') as table_size_mb,
  needs_database_warning() as status;

-- ================================================
-- Cara Penggunaan:
-- ================================================

-- Cek status database:
-- CALL check_database_status();

-- Cek status cepat:
-- SELECT * FROM database_monitoring;

-- Hapus data manual jika diperlukan (contoh: data lebih dari 30 hari):
-- DELETE FROM sensor_data WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Hapus data per compartment:
-- DELETE FROM sensor_data WHERE compartment_id = 1 AND timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- ================================================
-- Catatan:
-- ================================================
-- Auto-delete telah DIHAPUS untuk mencegah kehilangan data otomatis.
-- Gunakan stored procedure check_database_status() untuk monitoring.
-- Backend akan memanggil procedure ini untuk menampilkan warning di frontend.
-- ================================================
