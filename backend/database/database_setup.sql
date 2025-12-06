-- ================================================
-- SQL Script untuk Setup Database IoT Desalinasi
-- ================================================
-- Jalankan script ini di phpMyAdmin atau MySQL CLI
-- untuk membuat database dan tabel secara otomatis
-- ================================================

-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS iot_desalinasi 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

-- 2. Gunakan Database
USE iot_desalinasi;

-- 3. Buat Tabel sensor_data
CREATE TABLE IF NOT EXISTS `sensor_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compartment_id` int(11) NOT NULL COMMENT 'ID Compartment (1-6)',
  `temperature_air` float NOT NULL COMMENT 'Suhu Udara (°C)',
  `humidity_air` float NOT NULL COMMENT 'Kelembapan Udara (%)',
  `temperature_water` float NOT NULL COMMENT 'Suhu Air (°C)',
  `interval` int(11) DEFAULT NULL COMMENT 'Interval Logging (detik)',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Pencatatan',
  PRIMARY KEY (`id`),
  KEY `idx_compartment` (`compartment_id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_interval` (`interval`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabel Data Sensor IoT Desalinasi';

-- 4. Insert Data Dummy untuk Testing (Opsional)
-- Data dipisahkan per compartment untuk memudahkan tracking

-- ========================================
-- COMPARTMENT 1 - Data Sensor
-- ========================================
INSERT INTO `sensor_data` 
  (`compartment_id`, `temperature_air`, `humidity_air`, `temperature_water`, `interval`, `timestamp`) 
VALUES
  (1, 27.5, 65.2, 22.3, 5, NOW() - INTERVAL 30 MINUTE),
  (1, 27.6, 65.0, 22.4, 5, NOW() - INTERVAL 25 MINUTE),
  (1, 27.8, 64.8, 22.5, 5, NOW() - INTERVAL 20 MINUTE),
  (1, 27.4, 65.5, 22.2, 10, NOW() - INTERVAL 15 MINUTE),
  (1, 27.7, 65.1, 22.6, 10, NOW() - INTERVAL 10 MINUTE);

-- ========================================
-- COMPARTMENT 2 - Data Sensor
-- ========================================
INSERT INTO `sensor_data` 
  (`compartment_id`, `temperature_air`, `humidity_air`, `temperature_water`, `interval`, `timestamp`) 
VALUES
  (2, 28.1, 63.8, 21.9, 5, NOW() - INTERVAL 30 MINUTE),
  (2, 28.0, 64.2, 22.0, 5, NOW() - INTERVAL 25 MINUTE),
  (2, 28.3, 63.5, 21.8, 5, NOW() - INTERVAL 20 MINUTE),
  (2, 27.9, 64.0, 22.1, 10, NOW() - INTERVAL 15 MINUTE),
  (2, 28.2, 63.9, 21.9, 10, NOW() - INTERVAL 10 MINUTE);

-- ========================================
-- COMPARTMENT 3 - Data Sensor
-- ========================================
INSERT INTO `sensor_data` 
  (`compartment_id`, `temperature_air`, `humidity_air`, `temperature_water`, `interval`, `timestamp`) 
VALUES
  (3, 26.9, 66.5, 22.7, 5, NOW() - INTERVAL 30 MINUTE),
  (3, 27.1, 66.1, 22.6, 5, NOW() - INTERVAL 25 MINUTE),
  (3, 26.8, 66.8, 22.8, 5, NOW() - INTERVAL 20 MINUTE),
  (3, 27.0, 66.3, 22.5, 10, NOW() - INTERVAL 15 MINUTE),
  (3, 27.2, 66.0, 22.7, 10, NOW() - INTERVAL 10 MINUTE);

-- ========================================
-- COMPARTMENT 4 - Data Sensor
-- ========================================
INSERT INTO `sensor_data` 
  (`compartment_id`, `temperature_air`, `humidity_air`, `temperature_water`, `interval`, `timestamp`) 
VALUES
  (4, 27.8, 64.1, 22.1, 5, NOW() - INTERVAL 30 MINUTE),
  (4, 27.9, 63.9, 22.2, 5, NOW() - INTERVAL 25 MINUTE),
  (4, 27.7, 64.3, 22.0, 5, NOW() - INTERVAL 20 MINUTE),
  (4, 28.0, 64.0, 22.3, 10, NOW() - INTERVAL 15 MINUTE),
  (4, 27.8, 64.2, 22.1, 10, NOW() - INTERVAL 10 MINUTE);

-- ========================================
-- COMPARTMENT 5 - Data Sensor
-- ========================================
INSERT INTO `sensor_data` 
  (`compartment_id`, `temperature_air`, `humidity_air`, `temperature_water`, `interval`, `timestamp`) 
VALUES
  (5, 27.2, 65.9, 22.5, 5, NOW() - INTERVAL 30 MINUTE),
  (5, 27.3, 65.7, 22.6, 5, NOW() - INTERVAL 25 MINUTE),
  (5, 27.1, 66.0, 22.4, 5, NOW() - INTERVAL 20 MINUTE),
  (5, 27.4, 65.8, 22.7, 10, NOW() - INTERVAL 15 MINUTE),
  (5, 27.2, 66.1, 22.5, 10, NOW() - INTERVAL 10 MINUTE);

-- ========================================
-- COMPARTMENT 6 - Data Sensor
-- ========================================
INSERT INTO `sensor_data` 
  (`compartment_id`, `temperature_air`, `humidity_air`, `temperature_water`, `interval`, `timestamp`) 
VALUES
  (6, 28.3, 62.7, 21.8, 5, NOW() - INTERVAL 30 MINUTE),
  (6, 28.4, 62.5, 21.9, 5, NOW() - INTERVAL 25 MINUTE),
  (6, 28.2, 62.9, 21.7, 5, NOW() - INTERVAL 20 MINUTE),
  (6, 28.5, 62.6, 22.0, 10, NOW() - INTERVAL 15 MINUTE),
  (6, 28.3, 62.8, 21.8, 10, NOW() - INTERVAL 10 MINUTE);

-- 5. Verifikasi Data
SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 10;

-- 6. Lihat Struktur Tabel
DESCRIBE sensor_data;

-- 7. Hitung Total Data
SELECT COUNT(*) as total_records FROM sensor_data;

-- 8. Data Per Compartment
SELECT 
  compartment_id,
  COUNT(*) as total_records,
  AVG(temperature_air) as avg_temp_air,
  AVG(humidity_air) as avg_humidity,
  AVG(temperature_water) as avg_temp_water
FROM sensor_data 
GROUP BY compartment_id 
ORDER BY compartment_id;

-- ================================================
-- Query Berguna untuk Maintenance
-- ================================================

-- Hapus data lebih dari 30 hari
-- DELETE FROM sensor_data WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Hapus semua data (HATI-HATI!)
-- TRUNCATE TABLE sensor_data;

-- Backup data ke file CSV (di phpMyAdmin: Export → CSV)

-- Reset Auto Increment
-- ALTER TABLE sensor_data AUTO_INCREMENT = 1;

-- ================================================
-- Selesai! Database siap digunakan.
-- ================================================
