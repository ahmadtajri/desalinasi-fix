const express = require('express');
const router = express.Router();
const SensorController = require('../controllers/SensorController');
const LoggerController = require('../controllers/LoggerController');

// Welcome endpoint - API info
router.get('/', (req, res) => {
    const DataService = require('../services/DataService');

    res.json({
        message: 'ESP32 IoT Data Logger API',
        version: '1.0',
        mode: '🎭 MOCK DATA MODE (No Database Required)',
        endpoints: {
            'GET /api/': 'API information',
            'GET /api/stats': 'Mock data statistics',
            'GET /api/database/status': 'Get database status and warnings',
            'GET /api/sensors': 'Get all sensor data',
            'GET /api/sensors?compartment=1': 'Get data by compartment (1-6)',
            'GET /api/sensors?limit=50': 'Get limited data',
            'GET /api/sensors?startDate=...&endDate=...': 'Get data by date range',
            'POST /api/sensors': 'Create new sensor data',
            'DELETE /api/sensors/:id': 'Delete single sensor data',
            'DELETE /api/sensors': 'Delete all sensor data',
            'DELETE /api/sensors/compartment/:compartment': 'Delete all data from specific compartment (1-6)',
            'DELETE /api/sensors/interval/:interval': 'Delete data by logging interval (e.g., 5)',
            'GET /api/logger/status': 'Get background logger status',
            'POST /api/logger/start': 'Start background data logger',
            'POST /api/logger/stop': 'Stop background data logger',
            'POST /api/logger/config': 'Configure logger settings (body: { "interval": 5000 })'
        },
        documentation: {
            'Postman Tutorial': 'See POSTMAN_TUTORIAL.md',
            'Quick Reference': 'See POSTMAN_QUICK_REFERENCE.md',
            'cURL Commands': 'See CURL_COMMANDS.md'
        },
        example: {
            'GET': 'http://localhost:3000/api/sensors',
            'POST': {
                url: 'http://localhost:3000/api/sensors',
                body: {
                    compartment_id: 1,
                    temperature_air: 27.5,
                    humidity_air: 65.3,
                    temperature_water: 22.8
                }
            }
        },
        note: 'Data is stored in memory and will reset on server restart'
    });
});

// Stats endpoint
router.get('/stats', async (req, res) => {
    const DataService = require('../services/DataService');
    const stats = await DataService.getStats();
    res.json({
        mode: 'Mock Data Mode',
        ...stats,
        message: 'All data is stored in memory (not persistent)'
    });
});

// Database status endpoint
router.get('/database/status', SensorController.getDatabaseStatus);

// Sensor endpoints
// IMPORTANT: Order matters! More specific routes must come BEFORE general routes
router.get('/sensors', SensorController.getAll);
router.post('/sensors', SensorController.create);
// Specific DELETE routes first
router.delete('/sensors/compartment/:compartment', SensorController.deleteByCompartment);
router.delete('/sensors/interval/:interval', SensorController.deleteByInterval);
router.delete('/sensors/:id', SensorController.delete);
// General DELETE route last
router.delete('/sensors', SensorController.deleteAll);

// Logger endpoints
router.get('/logger/status', LoggerController.getStatus);
router.post('/logger/start', LoggerController.start);
router.post('/logger/stop', LoggerController.stop);
router.post('/logger/config', LoggerController.config);

module.exports = router;
