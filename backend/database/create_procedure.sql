DELIMITER //

DROP PROCEDURE IF EXISTS check_database_status //

CREATE PROCEDURE check_database_status()
BEGIN
    DECLARE total_records INT DEFAULT 0;
    DECLARE table_size_mb DECIMAL(10,2) DEFAULT 0;
    DECLARE database_size_mb DECIMAL(10,2) DEFAULT 0;
    DECLARE status_msg VARCHAR(255) DEFAULT 'OK';
    DECLARE status_code VARCHAR(20) DEFAULT 'OK';
    DECLARE warning_limit INT DEFAULT 100000;
    DECLARE critical_limit INT DEFAULT 500000;

    -- 1. Get total records in sensor_data
    SELECT COUNT(*) INTO total_records FROM sensor_data;

    -- 2. Get table size in MB
    SELECT 
        ROUND(((data_length + index_length) / 1024 / 1024), 2) 
    INTO table_size_mb 
    FROM information_schema.TABLES 
    WHERE table_schema = DATABASE() AND table_name = 'sensor_data';

    -- 3. Get total database size in MB
    SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) 
    INTO database_size_mb 
    FROM information_schema.TABLES 
    WHERE table_schema = DATABASE();

    -- 4. Determine Status
    IF total_records >= critical_limit THEN
        SET status_code = 'CRITICAL';
        SET status_msg = CONCAT('Database CRITICAL! Total records: ', total_records, '. Immediate cleanup required.');
    ELSEIF total_records >= warning_limit THEN
        SET status_code = 'WARNING';
        SET status_msg = CONCAT('Database Warning. Total records: ', total_records, '. Consider cleanup soon.');
    ELSE
        SET status_code = 'OK';
        SET status_msg = 'Database status normal.';
    END IF;

    -- 5. Return Result
    SELECT 
        total_records,
        IFNULL(table_size_mb, 0) as table_size_mb,
        IFNULL(database_size_mb, 0) as database_size_mb,
        status_code as status,
        status_msg as message,
        warning_limit as warning_threshold,
        critical_limit as critical_threshold;

END //

DELIMITER ;
