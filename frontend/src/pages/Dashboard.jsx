import React, { useState, useEffect } from 'react';
import CompartmentCard from '../components/CompartmentCard';
import SensorDetailCard from '../components/SensorDetailCard';
import SensorChart from '../components/SensorChart';
import sensorService from '../services/sensorService'; // Still needed for DB status
import { useLogger } from '../context/LoggerContext'; // Import Context
import { Thermometer, Droplets, Waves, Box, X, AlertTriangle, AlertOctagon } from 'lucide-react';
import skemaDesalinasi from '../assets/skema-desalinasi.svg';

const Dashboard = () => {
    // 1. Get Realtime Data Stream (UPDATES EVERY 1 SECOND)
    const { realtimeData } = useLogger();

    // Local state for compartments (Display data)
    // Initialize with default/empty structure
    const [compartments, setCompartments] = useState(
        Array.from({ length: 6 }, (_, i) => ({
            id: i + 1,
            data: {
                tempAir: 0,
                humidAir: 0,
                tempWater: 0
            }
        }))
    );

    const [selectedCompartment, setSelectedCompartment] = useState('1');
    const [showSchemaModal, setShowSchemaModal] = useState(false);
    const [dbStatus, setDbStatus] = useState(null);

    // History data for chart (array of objects)
    const [chartData, setChartData] = useState([]);

    // 2. Fetch database status (Check every minute)
    useEffect(() => {
        const fetchDbStatus = async () => {
            try {
                const status = await sensorService.getDatabaseStatus();
                setDbStatus(status);
            } catch (error) {
                console.error("Error fetching DB status:", error);
            }
        };

        fetchDbStatus(); // Initial call
        const interval = setInterval(fetchDbStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // 3. React instantly to Realtime Data updates
    useEffect(() => {
        // If no data yet (e.g. first split second), do nothing
        if (!realtimeData || realtimeData.length === 0) return;

        // A. Update Overview Grid & Detail Cards
        // realtimeData structure is already compatible: [{ id, data: {...} }, ...]
        setCompartments(realtimeData);

        // B. Update Chart
        const targetId = selectedCompartment === 'all' ? 1 : parseInt(selectedCompartment);
        const latestForTarget = realtimeData.find(d => d.id === targetId);

        if (latestForTarget) {
            const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            setChartData(prev => {
                const newPoint = {
                    time: timeString,
                    tempAir: latestForTarget.data.tempAir,
                    humidAir: latestForTarget.data.humidAir,
                    tempWater: latestForTarget.data.tempWater
                };

                const newHistory = [...prev, newPoint];
                // Keep last 20 points for smooth scrolling chart
                if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
                return newHistory;
            });
        }
    }, [realtimeData, selectedCompartment]);

    // Clear chart when switching compartment
    useEffect(() => {
        setChartData([]);
    }, [selectedCompartment]);

    // Get currently selected compartment data for Detail View
    const currentData = compartments.find(c => c.id === parseInt(selectedCompartment))?.data || { tempAir: 0, humidAir: 0, tempWater: 0 };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Database Status Alert */}
            {dbStatus && dbStatus.status !== 'OK' && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 shadow-sm ${dbStatus.status === 'CRITICAL'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                    }`}>
                    <div className="mt-1">
                        {dbStatus.status === 'CRITICAL' ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">
                            {dbStatus.status === 'CRITICAL' ? 'Database Critical Warning!' : 'Database Warning'}
                        </h3>
                        <p className="mt-1">{dbStatus.message}</p>
                        <div className="mt-2 text-sm opacity-90 flex gap-4">
                            <span>Current Records: <strong>{dbStatus.total_records?.toLocaleString()}</strong></span>
                            <span>Size: <strong>{dbStatus.table_size_mb} MB</strong></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Pilih Compartment</h2>
                        <p className="text-gray-500 text-sm mt-1">Pilih compartment untuk melihat detail sensor real-time</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Tombol Skema Desalinasi */}
                        <button
                            onClick={() => setShowSchemaModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>Lihat Skema Desalinasi</span>
                        </button>

                        {/* Dropdown Compartment */}
                        <div className="relative min-w-[250px]">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <Box size={20} />
                            </div>
                            <select
                                value={selectedCompartment}
                                onChange={(e) => setSelectedCompartment(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none shadow-sm"
                            >
                                <option value="all">Tampilkan Semua Overview</option>
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>Compartment {num}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Skema Desalinasi */}
            {showSchemaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowSchemaModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <div>
                                    <h2 className="text-2xl font-bold">Skema Sistem Desalinasi</h2>
                                    <p className="text-blue-100 text-sm mt-1">Diagram alur proses desalinasi air laut</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSchemaModal(false)}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <img
                                    src={skemaDesalinasi}
                                    alt="Skema Sistem Desalinasi"
                                    className="w-full h-auto mx-auto"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowSchemaModal(false)}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Section */}
            {selectedCompartment === 'all' ? (
                // Overview Mode (Grid)
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview Semua Compartment</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {compartments.map(comp => (
                            <CompartmentCard key={comp.id} id={comp.id} data={comp.data} />
                        ))}
                    </div>
                </div>
            ) : (
                // Detail Mode (The Requested Design)
                <div className="flex flex-col gap-6">
                    <div className="order-2 md:order-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Compartment {selectedCompartment}</h1>
                            <p className="text-gray-500 mt-2">Monitoring 3 sensor secara real-time</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Suhu Udara - Orange */}
                            <SensorDetailCard
                                title="Suhu Udara"
                                subtitle="Air Temperature"
                                value={currentData.tempAir}
                                unit="°C"
                                icon={Thermometer}
                                colorTheme="orange"
                                max={50}
                            />

                            {/* Kelembapan Udara - Blue */}
                            <SensorDetailCard
                                title="Kelembapan Udara"
                                subtitle="Air Humidity"
                                value={currentData.humidAir}
                                unit="%"
                                icon={Droplets}
                                colorTheme="blue"
                                max={100}
                            />

                            {/* Suhu Air - Green/Mint */}
                            <SensorDetailCard
                                title="Suhu Air"
                                subtitle="Water Temperature"
                                value={currentData.tempWater}
                                unit="°C"
                                icon={Waves}
                                colorTheme="green"
                                max={50}
                            />
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="order-1 md:order-2">
                        <SensorChart data={chartData} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
