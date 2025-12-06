import api from './api';

const sensorService = {
    async getAll(params = {}) {
        const response = await api.get('/sensors', { params });
        return response.data;
    },

    async create(sensorData) {
        const response = await api.post('/sensors', sensorData);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/sensors/${id}`);
        return response.data;
    },

    async deleteAll() {
        const response = await api.delete('/sensors');
        return response.data;
    },

    async deleteByCompartment(compartmentId) {
        const response = await api.delete(`/sensors/compartment/${compartmentId}`);
        return response.data;
    },

    async deleteByInterval(interval) {
        const response = await api.delete(`/sensors/interval/${interval}`);
        return response.data;
    },


    async getDatabaseStatus() {
        const response = await api.get('/database/status');
        return response.data;
    },

    // Backend Logger Control
    async getLoggerStatus() {
        const response = await api.get('/logger/status');
        return response.data;
    },

    async startLogger() {
        const response = await api.post('/logger/start');
        return response.data;
    },

    async stopLogger() {
        const response = await api.post('/logger/stop');
        return response.data;
    },

    async configLogger(interval) {
        const response = await api.post('/logger/config', { interval });
        return response.data;
    },

    exportToCSV(data, filename = 'sensor_data.csv') {
        // Validate data
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('exportToCSV: No data to export');
            return false;
        }

        const headers = ['ID', 'Compartment', 'Air Temp (°C)', 'Humidity (%)', 'Water Temp (°C)', 'Interval (s)', 'Timestamp'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.id,
                row.compartment_id,
                row.temperature_air,
                row.humidity_air,
                row.temperature_water,
                row.interval || 'N/A',
                `"${new Date(row.timestamp).toLocaleString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    }
};

export default sensorService;
