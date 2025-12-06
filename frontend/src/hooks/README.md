# 🎣 Custom Hooks Guide - useSensorData

## 📚 Overview

Custom React hooks untuk memudahkan integrasi API sensor data di frontend.

---

## 🔧 Available Hooks

### 1. `useSensorData`

Hook utama untuk fetch, create, dan delete sensor data.

**Parameters:**
- `compartment` (number|string): Compartment ID (1-6) atau 'all' (default: 'all')
- `limit` (number): Jumlah data yang ditampilkan (default: 100)
- `autoRefresh` (boolean): Auto refresh setiap interval (default: false)
- `refreshInterval` (number): Interval refresh dalam ms (default: 10000)

**Returns:**
```javascript
{
    data: [],           // Array of sensor data
    loading: boolean,   // Loading state
    error: string|null, // Error message
    refresh: function,  // Manual refresh function
    createData: function, // Create new sensor data
    deleteData: function, // Delete single sensor data
    deleteAll: function   // Delete all sensor data
}
```

### 2. `useCompartmentData`

Hook khusus untuk single compartment data.

**Parameters:**
- `compartmentId` (number): Compartment ID (1-6)
- `limit` (number): Jumlah data yang ditampilkan (default: 100)

**Returns:**
```javascript
{
    data: [],
    loading: boolean,
    error: string|null,
    refresh: function
}
```

### 3. `useLatestSensorData`

Hook untuk latest sensor data dengan auto-refresh.

**Parameters:**
- `refreshInterval` (number): Interval refresh dalam ms (default: 10000)

**Returns:**
```javascript
{
    data: [],
    loading: boolean,
    error: string|null,
    refresh: function
}
```

---

## 💡 Usage Examples

### Example 1: Basic Usage

```javascript
import { useSensorData } from '../hooks/useSensorData';

function Dashboard() {
    const { data, loading, error, refresh } = useSensorData();

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <button onClick={refresh}>Refresh</button>
            <div>
                {data.map(sensor => (
                    <div key={sensor.id}>
                        Compartment {sensor.compartment_id}: {sensor.temperature_air}°C
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### Example 2: Filtered by Compartment

```javascript
import { useSensorData } from '../hooks/useSensorData';

function CompartmentView({ compartmentId }) {
    const { data, loading, error } = useSensorData(compartmentId, 10);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Compartment {compartmentId}</h2>
            {data.map(sensor => (
                <div key={sensor.id}>
                    <p>Temp Air: {sensor.temperature_air}°C</p>
                    <p>Humidity: {sensor.humidity_air}%</p>
                    <p>Temp Water: {sensor.temperature_water}°C</p>
                </div>
            ))}
        </div>
    );
}
```

### Example 3: With Auto-Refresh

```javascript
import { useSensorData } from '../hooks/useSensorData';

function LiveDashboard() {
    // Auto refresh every 10 seconds
    const { data, loading, error } = useSensorData('all', 20, true, 10000);

    return (
        <div>
            <h1>Live Dashboard {loading && '(Updating...)'}</h1>
            {error && <div className="error">{error}</div>}
            <div className="grid">
                {data.map(sensor => (
                    <div key={sensor.id} className="card">
                        <h3>Compartment {sensor.compartment_id}</h3>
                        <p>🌡️ {sensor.temperature_air}°C</p>
                        <p>💧 {sensor.humidity_air}%</p>
                        <p>🌊 {sensor.temperature_water}°C</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### Example 4: Create New Data

```javascript
import { useState } from 'react';
import { useSensorData } from '../hooks/useSensorData';

function DataLogger() {
    const { data, loading, createData } = useSensorData();
    const [formData, setFormData] = useState({
        compartment_id: 1,
        temperature_air: '',
        humidity_air: '',
        temperature_water: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createData({
                compartment_id: parseInt(formData.compartment_id),
                temperature_air: parseFloat(formData.temperature_air),
                humidity_air: parseFloat(formData.humidity_air),
                temperature_water: parseFloat(formData.temperature_water)
            });
            alert('Data created successfully!');
            // Reset form
            setFormData({
                compartment_id: 1,
                temperature_air: '',
                humidity_air: '',
                temperature_water: ''
            });
        } catch (error) {
            alert('Error creating data: ' + error.message);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <select
                    value={formData.compartment_id}
                    onChange={(e) => setFormData({...formData, compartment_id: e.target.value})}
                >
                    {[1,2,3,4,5,6].map(id => (
                        <option key={id} value={id}>Compartment {id}</option>
                    ))}
                </select>
                <input
                    type="number"
                    step="0.1"
                    placeholder="Temperature Air"
                    value={formData.temperature_air}
                    onChange={(e) => setFormData({...formData, temperature_air: e.target.value})}
                    required
                />
                <input
                    type="number"
                    step="0.1"
                    placeholder="Humidity Air"
                    value={formData.humidity_air}
                    onChange={(e) => setFormData({...formData, humidity_air: e.target.value})}
                    required
                />
                <input
                    type="number"
                    step="0.1"
                    placeholder="Temperature Water"
                    value={formData.temperature_water}
                    onChange={(e) => setFormData({...formData, temperature_water: e.target.value})}
                    required
                />
                <button type="submit">Create Data</button>
            </form>

            <h2>Recent Data</h2>
            {loading ? <p>Loading...</p> : (
                <div>
                    {data.slice(0, 5).map(sensor => (
                        <div key={sensor.id}>
                            Compartment {sensor.compartment_id}: {sensor.temperature_air}°C
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### Example 5: Delete Data

```javascript
import { useSensorData } from '../hooks/useSensorData';

function DataTable() {
    const { data, loading, error, deleteData, deleteAll } = useSensorData();

    const handleDelete = async (id) => {
        if (confirm('Delete this data?')) {
            try {
                await deleteData(id);
                alert('Data deleted successfully!');
            } catch (error) {
                alert('Error deleting data: ' + error.message);
            }
        }
    };

    const handleDeleteAll = async () => {
        if (confirm('Delete ALL data? This cannot be undone!')) {
            try {
                await deleteAll();
                alert('All data deleted successfully!');
            } catch (error) {
                alert('Error deleting all data: ' + error.message);
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <button onClick={handleDeleteAll} className="btn-danger">
                Delete All Data
            </button>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Compartment</th>
                        <th>Temp Air</th>
                        <th>Humidity</th>
                        <th>Temp Water</th>
                        <th>Timestamp</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(sensor => (
                        <tr key={sensor.id}>
                            <td>{sensor.id}</td>
                            <td>{sensor.compartment_id}</td>
                            <td>{sensor.temperature_air}°C</td>
                            <td>{sensor.humidity_air}%</td>
                            <td>{sensor.temperature_water}°C</td>
                            <td>{new Date(sensor.timestamp).toLocaleString()}</td>
                            <td>
                                <button onClick={() => handleDelete(sensor.id)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

### Example 6: Using useCompartmentData

```javascript
import { useCompartmentData } from '../hooks/useSensorData';

function CompartmentCard({ compartmentId }) {
    const { data, loading, error, refresh } = useCompartmentData(compartmentId, 5);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    // Get latest data
    const latest = data[0] || {};

    return (
        <div className="compartment-card">
            <h3>Compartment {compartmentId}</h3>
            <button onClick={refresh}>Refresh</button>
            
            <div className="latest-data">
                <p>🌡️ Air: {latest.temperature_air}°C</p>
                <p>💧 Humidity: {latest.humidity_air}%</p>
                <p>🌊 Water: {latest.temperature_water}°C</p>
                <p>🕐 {new Date(latest.timestamp).toLocaleString()}</p>
            </div>

            <div className="history">
                <h4>Recent History</h4>
                {data.slice(1).map(sensor => (
                    <div key={sensor.id}>
                        {sensor.temperature_air}°C - {new Date(sensor.timestamp).toLocaleTimeString()}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Usage
function Dashboard() {
    return (
        <div className="dashboard">
            {[1,2,3,4,5,6].map(id => (
                <CompartmentCard key={id} compartmentId={id} />
            ))}
        </div>
    );
}
```

### Example 7: Using useLatestSensorData

```javascript
import { useLatestSensorData } from '../hooks/useSensorData';

function LiveMonitor() {
    // Auto refresh every 5 seconds
    const { data, loading, error } = useLatestSensorData(5000);

    return (
        <div>
            <h1>Live Monitor {loading && '🔄'}</h1>
            {error && <div className="error">{error}</div>}
            
            <div className="grid">
                {[1,2,3,4,5,6].map(compartmentId => {
                    const compartmentData = data.filter(
                        d => d.compartment_id === compartmentId
                    );
                    const latest = compartmentData[0] || {};

                    return (
                        <div key={compartmentId} className="monitor-card">
                            <h3>Compartment {compartmentId}</h3>
                            {latest.temperature_air ? (
                                <>
                                    <div className="temp">{latest.temperature_air}°C</div>
                                    <div className="humidity">{latest.humidity_air}%</div>
                                    <div className="water">{latest.temperature_water}°C</div>
                                </>
                            ) : (
                                <div>No data</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

---

## 🎨 Complete Example: Dashboard Component

```javascript
import { useState } from 'react';
import { useSensorData } from '../hooks/useSensorData';

function Dashboard() {
    const [selectedCompartment, setSelectedCompartment] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(false);

    const { data, loading, error, refresh, createData, deleteData } = useSensorData(
        selectedCompartment,
        100,
        autoRefresh,
        10000
    );

    const handleCreateRandom = async () => {
        try {
            await createData({
                compartment_id: Math.floor(Math.random() * 6) + 1,
                temperature_air: parseFloat((25 + Math.random() * 5).toFixed(1)),
                humidity_air: parseFloat((60 + Math.random() * 10).toFixed(1)),
                temperature_water: parseFloat((20 + Math.random() * 5).toFixed(1))
            });
        } catch (error) {
            console.error('Error creating data:', error);
        }
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="header">
                <h1>IoT Distillation Monitor</h1>
                <div className="controls">
                    <select
                        value={selectedCompartment}
                        onChange={(e) => setSelectedCompartment(e.target.value)}
                    >
                        <option value="all">All Compartments</option>
                        {[1,2,3,4,5,6].map(id => (
                            <option key={id} value={id}>Compartment {id}</option>
                        ))}
                    </select>

                    <label>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto Refresh (10s)
                    </label>

                    <button onClick={refresh}>Refresh Now</button>
                    <button onClick={handleCreateRandom}>Add Random Data</button>
                </div>
            </div>

            {/* Status */}
            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error">Error: {error}</div>}

            {/* Data Grid */}
            <div className="data-grid">
                {data.map(sensor => (
                    <div key={sensor.id} className="sensor-card">
                        <div className="card-header">
                            <h3>Compartment {sensor.compartment_id}</h3>
                            <button onClick={() => deleteData(sensor.id)}>×</button>
                        </div>
                        <div className="card-body">
                            <div className="metric">
                                <span className="label">🌡️ Air Temp</span>
                                <span className="value">{sensor.temperature_air}°C</span>
                            </div>
                            <div className="metric">
                                <span className="label">💧 Humidity</span>
                                <span className="value">{sensor.humidity_air}%</span>
                            </div>
                            <div className="metric">
                                <span className="label">🌊 Water Temp</span>
                                <span className="value">{sensor.temperature_water}°C</span>
                            </div>
                            <div className="timestamp">
                                {new Date(sensor.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="summary">
                <p>Total Records: {data.length}</p>
                <p>Compartment: {selectedCompartment === 'all' ? 'All' : selectedCompartment}</p>
                <p>Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}</p>
            </div>
        </div>
    );
}

export default Dashboard;
```

---

## ✅ Best Practices

### 1. Error Handling
```javascript
const { data, error } = useSensorData();

if (error) {
    return (
        <div className="error-container">
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button onClick={refresh}>Try Again</button>
        </div>
    );
}
```

### 2. Loading States
```javascript
const { data, loading } = useSensorData();

if (loading) {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading sensor data...</p>
        </div>
    );
}
```

### 3. Empty States
```javascript
const { data } = useSensorData();

if (data.length === 0) {
    return (
        <div className="empty-state">
            <p>No data available</p>
            <button onClick={handleCreateRandom}>Add Sample Data</button>
        </div>
    );
}
```

### 4. Optimistic Updates
```javascript
const handleDelete = async (id) => {
    // Optimistic update
    setData(prev => prev.filter(item => item.id !== id));
    
    try {
        await deleteData(id);
    } catch (error) {
        // Revert on error
        refresh();
        alert('Error deleting data');
    }
};
```

---

## 📚 Related Documentation

- **API Integration Guide:** `API_INTEGRATION_GUIDE.md`
- **Postman Documentation:** https://documenter.getpostman.com/view/50456447/2sB3dMvpvC
- **Backend Guide:** `backend/BACKEND_DEV_GUIDE.md`

---

**Happy Coding! 🚀**
