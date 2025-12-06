import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SensorChart = ({ data }) => {
    return (
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Grafik Real-time</h3>
                <p className="text-gray-500 text-xs md:text-sm">Monitoring pergerakan suhu dan kelembapan</p>
            </div>

            <div className="h-[250px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="time"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickMargin={10}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={10}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '12px'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px', marginLeft: '20px' }}
                            iconSize={10}
                        />

                        {/* Suhu Udara - Orange */}
                        <Line
                            type="monotone"
                            dataKey="tempAir"
                            name="Suhu Udara (°C)"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            isAnimationActive={false}
                        />

                        {/* Kelembapan - Blue */}
                        <Line
                            type="monotone"
                            dataKey="humidAir"
                            name="Kelembapan (%)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* Suhu Air - Green */}
                        <Line
                            type="monotone"
                            dataKey="tempWater"
                            name="Suhu Air (°C)"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SensorChart;
