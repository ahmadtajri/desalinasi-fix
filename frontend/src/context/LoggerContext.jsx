import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import sensorService from '../services/sensorService';

const LoggerContext = createContext({
    isLogging: false,
    toggleLogging: () => { },
    logInterval: 5000,
    changeInterval: () => { },
    logCount: 0,
    isRealtimeOnly: true // Flag to know if we are in "Backend Control" mode
});

export const useLogger = () => useContext(LoggerContext);

export const LoggerProvider = ({ children }) => {
    // Logger State (Sync with Backend)
    const [isLogging, setIsLogging] = useState(false);
    const [logInterval, setLogInterval] = useState(5000);
    const [logCount, setLogCount] = useState(0);

    // Dashboard Data State (Frontend Only - for Visuals)
    const [realtimeData, setRealtimeData] = useState([]);

    // 1. SYNC STATUS WITH BACKEND ON MOUNT & PERIODICALLY
    const syncStatus = async () => {
        try {
            const status = await sensorService.getLoggerStatus();
            setIsLogging(status.isLogging);
            if (status.isLogging) {
                setLogInterval(status.interval);
                setLogCount(status.logCount);
            }
        } catch (error) {
            console.error("Failed to sync logger status:", error);
        }
    };

    useEffect(() => {
        syncStatus();
        // Check status periodically to keep UI in sync if backend changes
        const intervalId = setInterval(syncStatus, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // 2. REALTIME DATA GENERATOR (Runs every 1 second in Frontend)
    // This allows Dashboard to show updates regardless of Backend Logger status
    useEffect(() => {
        const generateData = () => {
            const newData = Array.from({ length: 6 }, (_, i) => ({
                id: i + 1,
                data: {
                    tempAir: parseFloat((25 + Math.random() * 5).toFixed(1)),
                    humidAir: parseFloat((60 + Math.random() * 10).toFixed(1)),
                    tempWater: parseFloat((20 + Math.random() * 5).toFixed(1))
                }
            }));
            setRealtimeData(newData);
        };

        generateData();
        const intervalId = setInterval(generateData, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // 3. CONTROLS (Call Backend APIs)
    const toggleLogging = async () => {
        try {
            if (isLogging) {
                await sensorService.stopLogger();
                setIsLogging(false);
            } else {
                // Ensure config is sent before starting
                await sensorService.configLogger(logInterval);
                await sensorService.startLogger();
                setIsLogging(true);
                setLogCount(0); // Reset visual count
            }
            // Sync immediately
            syncStatus();
        } catch (error) {
            console.error("Error toggling logger:", error);
            alert("Gagal menghubungi server backend. Pastikan server berjalan.");
        }
    };

    const changeInterval = async (newInterval) => {
        try {
            setLogInterval(newInterval);
            if (isLogging) {
                // If running, update config on fly
                await sensorService.configLogger(newInterval);
            }
        } catch (error) {
            console.error("Error updating interval:", error);
        }
    };

    return (
        <LoggerContext.Provider value={{
            isLogging,
            toggleLogging,
            logInterval,
            changeInterval,
            logCount,
            realtimeData
        }}>
            {children}
        </LoggerContext.Provider>
    );
};
