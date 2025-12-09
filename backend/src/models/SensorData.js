const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SensorData = sequelize.define('SensorData', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    compartment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    temperature_air: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    humidity_air: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    temperature_water: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    interval: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'sensor_data',
    timestamps: false // We use our own 'timestamp' column
});

module.exports = SensorData;
