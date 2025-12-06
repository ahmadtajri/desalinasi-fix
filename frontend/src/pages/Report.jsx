import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Filter, Calendar, RefreshCw, ChevronDown } from 'lucide-react';
import sensorService from '../services/sensorService';
import DataLogger from '../components/DataLogger';
import { useLogger } from '../context/LoggerContext';
import CustomAlert from '../components/CustomAlert';

const Report = () => {
    const [selectedCompartment, setSelectedCompartment] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const deleteMenuRef = useRef(null);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        isConfirm: false,
        onConfirm: () => { }
    });

    // Use Global Logger Context
    const { isLogging, toggleLogging, changeInterval, logCount, logInterval } = useLogger();

    // Helper for Custom Alerts
    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            isConfirm: false,
            onConfirm: () => { }
        });
    };

    const showConfirm = (title, message, onConfirm, type = 'warning') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            isConfirm: true,
            onConfirm
        });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    };

    // Auto-refresh table when new log comes in
    useEffect(() => {
        if (logCount > 0) {
            fetchData();
        }
    }, [logCount]);

    const handleToggleLogging = () => {
        toggleLogging();
    };

    const handleIntervalChange = (newInterval) => {
        changeInterval(newInterval);
    };

    // Fetch data from backend
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedCompartment !== 'all') {
                params.compartment = selectedCompartment;
            }
            if (dateRange.start && dateRange.end) {
                params.startDate = dateRange.start;
                params.endDate = dateRange.end;
            }

            const result = await sensorService.getAll(params);
            if (Array.isArray(result)) {
                setData(result);
            } else {
                console.error('API returned non-array data:', result);
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback to mock data if API fails
            const mockData = Array.from({ length: 20 }, (_, i) => ({
                id: i + 1,
                compartment_id: Math.floor(Math.random() * 6) + 1,
                temperature_air: (25 + Math.random() * 5).toFixed(1),
                humidity_air: (60 + Math.random() * 10).toFixed(1),
                temperature_water: (20 + Math.random() * 5).toFixed(1),
                interval: [5, 10, 60][Math.floor(Math.random() * 3)],
                timestamp: new Date(Date.now() - i * 3600000).toISOString()
            }));
            setData(mockData);
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target)) {
                setShowDeleteMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle export to CSV
    // logInterval is in ms (e.g. 5000), data.interval is in seconds (e.g. 5)
    // We need to filter data first before exporting
    const safeData = Array.isArray(data) ? data : [];
    const filteredData = safeData.filter(item => {
        if (!item.interval) return true;
        const selectedSeconds = Math.floor(logInterval / 1000);
        return item.interval === selectedSeconds;
    });

    const handleExport = () => {
        if (filteredData.length === 0) {
            const intervalSeconds = Math.floor(logInterval / 1000);
            showAlert(
                'Data Kosong',
                `Tidak ada data untuk di-export.\n\nData yang ditampilkan saat ini difilter berdasarkan interval ${intervalSeconds}s.\nSilakan pilih interval lain atau tambahkan data baru.`,
                'warning'
            );
            return;
        }

        const success = sensorService.exportToCSV(filteredData, `report_${new Date().toISOString().slice(0, 10)}.csv`);

        if (!success) {
            showAlert('Gagal Export', 'Terjadi kesalahan saat mengekspor data. Silakan coba lagi.', 'error');
        }
    };

    // Handle manual refresh
    const handleRefresh = async () => {
        await fetchData();
        // Berikan sedikit delay agar animasi loading terasa jika fetch terlalu cepat
        setTimeout(() => {
            showAlert('Berhasil', 'Data berhasil diperbarui!', 'success');
        }, 100);
    };

    // Handle delete single record
    const handleDelete = (id) => {
        showConfirm(
            'Hapus Data?',
            'Apakah Anda yakin ingin menghapus data ini?',
            async () => {
                try {
                    await sensorService.delete(id);
                    setData(prev => prev.filter(item => item.id !== id));
                    showAlert('Sukses', 'Data berhasil dihapus', 'success');
                } catch (error) {
                    console.error('Error deleting data:', error);
                    showAlert('Gagal', 'Gagal menghapus data. Silakan coba lagi.', 'error');
                }
            },
            'error'
        );
    };

    // Handle delete all records
    const handleDeleteAll = () => {
        showConfirm(
            'Hapus SEMUA Data?',
            'Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!',
            async () => {
                try {
                    await sensorService.deleteAll();
                    setData([]);
                    showAlert('Sukses', 'Semua data berhasil dihapus', 'success');
                } catch (error) {
                    console.error('Error deleting all data:', error);
                    showAlert('Gagal', 'Gagal menghapus data. Silakan coba lagi.', 'error');
                }
            },
            'error'
        );
    };

    // Handle delete by compartment
    const handleDeleteByCompartment = () => {
        if (selectedCompartment === 'all') {
            showAlert('Pilih Compartment', 'Silakan pilih compartment tertentu terlebih dahulu', 'info');
            return;
        }

        showConfirm(
            `Hapus Data Compartment ${selectedCompartment}?`,
            `Apakah Anda yakin ingin menghapus SEMUA data dari Compartment ${selectedCompartment}? Tindakan ini tidak dapat dibatalkan!`,
            async () => {
                try {
                    const result = await sensorService.deleteByCompartment(selectedCompartment);

                    if (result.success !== false) {
                        const newData = data.filter(item => item.compartment_id !== parseInt(selectedCompartment));
                        setData(newData);

                        const count = result.deletedCount || 0;
                        showAlert('Sukses', `Data compartment ${selectedCompartment} berhasil dihapus.\nJumlah data: ${count}`, 'success');

                        fetchData(); // Refresh to be sure
                    } else {
                        showAlert('Gagal', `Gagal menghapus data: ${result.error || 'Unknown error'}`, 'error');
                    }
                } catch (error) {
                    console.error('Error deleting compartment data:', error);
                    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
                    showAlert('Error', `Gagal menghapus data.\nError: ${errorMessage}`, 'error');
                }
            },
            'error'
        );
    };

    // Handle delete by interval
    const handleDeleteByInterval = () => {
        const intervalSeconds = Math.floor(logInterval / 1000);
        showConfirm(
            `Hapus Data Interval ${intervalSeconds}s?`,
            `Apakah Anda yakin ingin menghapus SEMUA data dengan interval ${intervalSeconds} detik? Tindakan ini tidak dapat dibatalkan!`,
            async () => {
                try {
                    const result = await sensorService.deleteByInterval(intervalSeconds);
                    if (result.success) {
                        // Optimistic update or refresh
                        showAlert('Sukses', `Data interval ${intervalSeconds}s berhasil dihapus.\nJumlah: ${result.deletedCount}`, 'success');
                        fetchData();
                    } else {
                        showAlert('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting interval data:', error);
                    showAlert('Error', 'Gagal menghapus data.', 'error');
                }
            },
            'error'
        );
    };

    return (
        <div className="p-4 md:p-6">
            <CustomAlert
                isOpen={alertConfig.isOpen}
                onClose={closeAlert}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                isConfirm={alertConfig.isConfirm}
                onConfirm={alertConfig.onConfirm}
            />

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Data Report</h1>
                    <p className="text-gray-500 mt-2">Historical data analysis and export</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={handleRefresh}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg transition-colors w-full sm:w-auto ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>

                    {/* Delete Dropdown Menu */}
                    <div className="relative w-full sm:w-auto" ref={deleteMenuRef}>
                        <button
                            onClick={() => {
                                if (data.length === 0) {
                                    showAlert('Data Kosong', 'Tidak ada data untuk dihapus.', 'info');
                                } else {
                                    setShowDeleteMenu(!showDeleteMenu);
                                }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
                        >
                            <Trash2 size={18} />
                            Delete
                            <ChevronDown size={16} className={`transition-transform ${showDeleteMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showDeleteMenu && (
                            <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                <button
                                    onClick={() => {
                                        handleDeleteByCompartment();
                                        setShowDeleteMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3 ${selectedCompartment === 'all' ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    disabled={selectedCompartment === 'all'}
                                >
                                    <Trash2 size={16} className="text-orange-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">Delete by Compartment</p>
                                        <p className="text-xs text-gray-500">
                                            {selectedCompartment === 'all'
                                                ? 'Select a compartment first'
                                                : `Delete all data from Comp ${selectedCompartment}`}
                                        </p>
                                    </div>
                                </button>

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                    onClick={() => {
                                        handleDeleteByInterval();
                                        setShowDeleteMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors flex items-center gap-3"
                                >
                                    <Trash2 size={16} className="text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">Delete by Interval</p>
                                        <p className="text-xs text-gray-500">
                                            Delete data with {Math.floor(logInterval / 1000)}s interval
                                        </p>
                                    </div>
                                </button>

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                    onClick={() => {
                                        handleDeleteAll();
                                        setShowDeleteMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3"
                                >
                                    <Trash2 size={16} className="text-red-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">Delete All Data</p>
                                        <p className="text-xs text-gray-500">Remove all records permanently</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Data Logger Section */}
            <div className="mb-6">
                <DataLogger
                    onIntervalChange={handleIntervalChange}
                    isLogging={isLogging}
                    onToggleLogging={handleToggleLogging}
                />
                {isLogging && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                        <p className="text-sm text-blue-700">
                            📊 Sedang merekam data... Total siklus: <span className="font-bold">{logCount}</span>
                        </p>
                        <p className="text-xs text-blue-600">
                            Data otomatis muncul di tabel di bawah
                        </p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Compartment</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                                value={selectedCompartment}
                                onChange={(e) => setSelectedCompartment(e.target.value)}
                            >
                                <option value="all">All Compartments</option>
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>Compartment {num}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="datetime-local"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="datetime-local"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={fetchData}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* Data Count */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Menampilkan <span className="font-bold">{filteredData.length}</span> data (dari total {data.length})
                </p>
                {loading && <p className="text-sm text-blue-600">Loading...</p>}
            </div>

            {/* Table with Scrollbar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Time</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50 text-center">Compartment</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Air Temp (°C)</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Humidity (%)</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Water Temp (°C)</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Interval</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right bg-gray-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada data untuk interval {Math.floor(logInterval / 1000)}s.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {new Date(row.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const colors = {
                                                    1: 'text-blue-600',
                                                    2: 'text-emerald-600',
                                                    3: 'text-orange-600',
                                                    4: 'text-purple-600',
                                                    5: 'text-red-600',
                                                    6: 'text-cyan-600'
                                                };
                                                const colorClass = colors[row.compartment_id] || 'text-gray-600';

                                                return (
                                                    <span className={`text-lg font-bold ${colorClass}`}>
                                                        {row.compartment_id}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{row.temperature_air}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{row.humidity_air}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{row.temperature_water}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${row.interval === 5 ? 'bg-green-100 text-green-700' :
                                                row.interval === 10 ? 'bg-yellow-100 text-yellow-700' :
                                                    row.interval === 60 ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.interval ? `${row.interval}s` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete this record"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Report;
