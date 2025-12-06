const BackgroundLogger = require('../services/BackgroundLogger');

const LoggerController = {
    getStatus: (req, res) => {
        const status = BackgroundLogger.getStatus();
        res.json(status);
    },

    start: (req, res) => {
        BackgroundLogger.start();
        res.json({ message: 'Logger started', status: BackgroundLogger.getStatus() });
    },

    stop: (req, res) => {
        BackgroundLogger.stop();
        res.json({ message: 'Logger stopped', status: BackgroundLogger.getStatus() });
    },

    config: (req, res) => {
        const { interval } = req.body;
        if (interval && typeof interval === 'number') {
            BackgroundLogger.setIntervalTime(interval);
            res.json({ message: 'Interval updated', status: BackgroundLogger.getStatus() });
        } else {
            res.status(400).json({ error: 'Invalid interval provided' });
        }
    }
};

module.exports = LoggerController;
