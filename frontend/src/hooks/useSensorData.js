import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom Hook untuk Sensor Data
 * 
 * @param {number|string} compartment - Compartment ID (1-6) atau 'all'
 * @param {number} limit - Jumlah data yang ditampilkan
 * @param {boolean} autoRefresh - Auto refresh setiap interval
 * @param {number} refreshInterval - Interval refresh dalam ms (default: 10000)
 * 
 * @returns {object} { data, loading, error, refresh, createData, deleteData, deleteAll }
 */
export const useSensorData = (
    compartment = 'all',
    limit = 100,
    autoRefresh = false,
    refreshInterval = 10000
) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data function
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Build URL with query parameters
            let url = `/sensors?limit=${limit}`;
            if (compartment && compartment !== 'all') {
                url += `&compartment=${compartment}`;
            }

            const response = await api.get(url);
            setData(response.data);
        } catch (err) {
            console.error('Error fetching sensor data:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }, [compartment, limit]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchData]);

    // Refresh function (manual)
    const refresh = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    // Create new sensor data
    const createData = useCallback(async (sensorData) => {
        try {
            const response = await api.post('/sensors', sensorData);
            await fetchData(); // Refresh after create
            return response.data;
        } catch (err) {
            console.error('Error creating sensor data:', err);
            throw err;
        }
    }, [fetchData]);

    // Delete single sensor data
    const deleteData = useCallback(async (id) => {
        try {
            await api.delete(`/sensors/${id}`);
            await fetchData(); // Refresh after delete
        } catch (err) {
            console.error('Error deleting sensor data:', err);
            throw err;
        }
    }, [fetchData]);

    // Delete all sensor data
    const deleteAll = useCallback(async () => {
        try {
            await api.delete('/sensors');
            await fetchData(); // Refresh after delete all
        } catch (err) {
            console.error('Error deleting all sensor data:', err);
            throw err;
        }
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refresh,
        createData,
        deleteData,
        deleteAll
    };
};

/**
 * Custom Hook untuk Single Compartment Data
 * 
 * @param {number} compartmentId - Compartment ID (1-6)
 * @param {number} limit - Jumlah data yang ditampilkan
 * 
 * @returns {object} { data, loading, error, refresh }
 */
export const useCompartmentData = (compartmentId, limit = 100) => {
    return useSensorData(compartmentId, limit, false);
};

/**
 * Custom Hook untuk Latest Sensor Data (with auto-refresh)
 * 
 * @param {number} refreshInterval - Interval refresh dalam ms (default: 10000)
 * 
 * @returns {object} { data, loading, error, refresh }
 */
export const useLatestSensorData = (refreshInterval = 10000) => {
    return useSensorData('all', 20, true, refreshInterval);
};

export default useSensorData;
