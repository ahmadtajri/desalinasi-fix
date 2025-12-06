const DataService = require('../services/DataService');

const SensorController = {
    async getAll(req, res) {
        try {
            const { limit, compartment, startDate, endDate } = req.query;

            let data;
            if (compartment && compartment !== 'all') {
                data = await DataService.getDataByCompartment(parseInt(compartment), limit || 100);
            } else if (startDate && endDate) {
                data = await DataService.getDataByDateRange(new Date(startDate), new Date(endDate));
            } else {
                data = await DataService.getAllData(limit || 100);
            }

            res.json(data);
        } catch (error) {
            console.error('Error in getAll:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async create(req, res) {
        try {
            const { compartment_id, temperature_air, humidity_air, temperature_water, interval } = req.body;

            if (!compartment_id || !temperature_air || !humidity_air || !temperature_water) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const newData = await DataService.createData({
                compartment_id,
                temperature_air,
                humidity_air,
                temperature_water,
                interval: parseInt(interval) || null
            });
            res.status(201).json(newData);
        } catch (error) {
            console.error('Error in create:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await DataService.deleteData(id);
            if (deleted) {
                res.json({ message: 'Data deleted successfully' });
            } else {
                res.status(404).json({ error: 'Data not found' });
            }
        } catch (error) {
            console.error('Error in delete:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async deleteAll(req, res) {
        try {
            await DataService.deleteAllData();
            res.json({ message: 'All data deleted successfully' });
        } catch (error) {
            console.error('Error in deleteAll:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async deleteByCompartment(req, res) {
        try {
            const { compartment } = req.params;
            console.log('deleteByCompartment called with compartment:', compartment);

            const compartmentId = parseInt(compartment);
            console.log('Parsed compartmentId:', compartmentId);

            // Check if parsing was successful and value is in valid range
            if (isNaN(compartmentId) || compartmentId < 1 || compartmentId > 6) {
                console.log('Invalid compartment ID:', compartmentId);
                return res.status(400).json({
                    error: 'Invalid compartment ID. Must be between 1-6',
                    received: compartment
                });
            }

            console.log('Attempting to delete data for compartment:', compartmentId);
            const deleted = await DataService.deleteDataByCompartment(compartmentId);
            console.log('Delete operation completed. Rows affected:', deleted);

            res.json({
                success: true,
                message: `All data for compartment ${compartmentId} deleted successfully`,
                deletedCount: deleted
            });
        } catch (error) {
            console.error('Error in deleteByCompartment:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error.stack
            });
        }
    },

    async deleteByInterval(req, res) {
        try {
            const { interval } = req.params;
            const intervalSeconds = parseInt(interval);

            if (isNaN(intervalSeconds) || intervalSeconds < 0) {
                return res.status(400).json({ error: 'Invalid interval' });
            }

            const deleted = await DataService.deleteDataByInterval(intervalSeconds);
            res.json({
                success: true,
                message: `Data with interval ${intervalSeconds}s deleted successfully`,
                deletedCount: deleted
            });
        } catch (error) {
            console.error('Error in deleteByInterval:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async getDatabaseStatus(req, res) {
        try {
            const status = await DataService.getDatabaseStatus();
            res.json(status);
        } catch (error) {
            console.error('Error in getDatabaseStatus:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SensorController;
