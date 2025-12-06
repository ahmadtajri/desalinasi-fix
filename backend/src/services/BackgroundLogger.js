const DataService = require('./DataService');

class BackgroundLogger {
    constructor() {
        this.isLogging = false;
        this.interval = 5000; // Default 5 seconds
        this.timer = null;
        this.logCount = 0;
    }

    start() {
        if (this.isLogging) {
            console.log('[BackgroundLogger] Already running.');
            return;
        }

        this.isLogging = true;
        this.logCount = 0; // Reset count on start
        console.log(`[BackgroundLogger] Started with interval ${this.interval}ms`);

        // this.runCycle(); // Removed immediate run to respect interval delay
        this.timer = setInterval(() => this.runCycle(), this.interval);
    }

    stop() {
        if (!this.isLogging) return;

        this.isLogging = false;
        clearInterval(this.timer);
        this.timer = null;
        console.log('[BackgroundLogger] Stopped.');
    }

    setIntervalTime(ms) {
        this.interval = ms;
        if (this.isLogging) {
            // Restart with new interval
            clearInterval(this.timer);
            this.timer = setInterval(() => this.runCycle(), this.interval);
            console.log(`[BackgroundLogger] Interval updated to ${this.interval}ms`);
        }
    }

    getStatus() {
        return {
            isLogging: this.isLogging,
            interval: this.interval,
            logCount: this.logCount
        };
    }

    async runCycle() {
        try {
            // Generate mock data for 6 compartments
            for (let i = 1; i <= 6; i++) {
                const sensorData = {
                    compartment_id: i,
                    temperature_air: parseFloat((25 + Math.random() * 5).toFixed(1)),
                    humidity_air: parseFloat((60 + Math.random() * 10).toFixed(1)),
                    temperature_water: parseFloat((20 + Math.random() * 5).toFixed(1)),
                    interval: Math.floor(this.interval / 1000)
                };

                await DataService.createData(sensorData);
            }

            this.logCount++;
            // console.log(`[BackgroundLogger] Cycle #${this.logCount} completed.`);
        } catch (error) {
            console.error('[BackgroundLogger] Error in logging cycle:', error);
        }
    }
}

// Singleton instance
const loggerInstance = new BackgroundLogger();
module.exports = loggerInstance;
