// Mock Data Store - In-Memory Database Replacement
// This replaces MySQL database with in-memory data storage

class MockDataStore {
    constructor() {
        this.data = [];
        this.currentId = 1;
        this.initializeSampleData();
    }

    // Initialize with sample data
    initializeSampleData() {
        console.log('📦 Initializing mock data store...');

        const intervals = [5, 10, 60];
        const compartments = [1, 2, 3, 4, 5, 6];

        // Generate 50 sample records
        for (let i = 0; i < 50; i++) {
            const compartment = compartments[Math.floor(Math.random() * compartments.length)];
            const interval = intervals[Math.floor(Math.random() * intervals.length)];

            this.data.push({
                id: this.currentId++,
                compartment_id: compartment,
                temperature_air: (25 + Math.random() * 10).toFixed(1),
                humidity_air: (60 + Math.random() * 20).toFixed(1),
                temperature_water: (20 + Math.random() * 8).toFixed(1),
                interval: interval,
                timestamp: new Date(Date.now() - i * 3600000).toISOString()
            });
        }

        console.log(`✅ Mock data initialized with ${this.data.length} records`);
    }

    // Get all data with optional limit
    findAll(options = {}) {
        let result = [...this.data];

        // Apply where clause
        if (options.where) {
            Object.keys(options.where).forEach(key => {
                const value = options.where[key];
                result = result.filter(item => item[key] === value);
            });
        }

        // Apply ordering
        if (options.order) {
            const [field, direction] = options.order[0];
            result.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (direction === 'DESC') {
                    return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
            });
        }

        // Apply limit
        if (options.limit) {
            result = result.slice(0, options.limit);
        }

        return Promise.resolve(result);
    }

    // Count records
    count(options = {}) {
        let result = [...this.data];

        if (options.where) {
            Object.keys(options.where).forEach(key => {
                const value = options.where[key];
                result = result.filter(item => item[key] === value);
            });
        }

        return Promise.resolve(result.length);
    }

    // Create new record
    create(data) {
        const newRecord = {
            id: this.currentId++,
            compartment_id: data.compartment_id,
            temperature_air: parseFloat(data.temperature_air),
            humidity_air: parseFloat(data.humidity_air),
            temperature_water: parseFloat(data.temperature_water),
            interval: data.interval || null,
            timestamp: new Date().toISOString()
        };

        this.data.unshift(newRecord); // Add to beginning (newest first)
        console.log(`✅ Created new record with ID: ${newRecord.id}`);

        return Promise.resolve(newRecord);
    }

    // Delete records
    destroy(options = {}) {
        const initialLength = this.data.length;

        if (options.truncate) {
            // Delete all
            this.data = [];
            console.log(`✅ Deleted all records (${initialLength} total)`);
            return Promise.resolve(initialLength);
        }

        if (options.where) {
            // Delete matching records
            const beforeLength = this.data.length;

            Object.keys(options.where).forEach(key => {
                const value = options.where[key];
                this.data = this.data.filter(item => item[key] !== value);
            });

            const deletedCount = beforeLength - this.data.length;
            console.log(`✅ Deleted ${deletedCount} records`);
            return Promise.resolve(deletedCount);
        }

        return Promise.resolve(0);
    }

    // Find one record by ID
    findByPk(id) {
        const record = this.data.find(item => item.id === parseInt(id));
        return Promise.resolve(record || null);
    }

    // Get statistics
    getStats() {
        return {
            totalRecords: this.data.length,
            compartments: [...new Set(this.data.map(d => d.compartment_id))].sort(),
            dateRange: {
                oldest: this.data[this.data.length - 1]?.timestamp,
                newest: this.data[0]?.timestamp
            }
        };
    }
}

// Create singleton instance
const mockDataStore = new MockDataStore();

module.exports = mockDataStore;
