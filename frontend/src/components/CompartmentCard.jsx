import React from 'react';
import { Thermometer, Droplets, Waves } from 'lucide-react';

const CompartmentCard = ({ id, data }) => {
    const { tempAir, humidAir, tempWater } = data;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Compartment {id}</h3>
                <div className={`w-3 h-3 rounded-full ${tempAir > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>

            <div className="space-y-4">
                {/* Air Temperature */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <Thermometer size={20} />
                        </div>
                        <span className="text-sm text-gray-600">Air Temp</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{tempAir}°C</span>
                </div>

                {/* Air Humidity */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Droplets size={20} />
                        </div>
                        <span className="text-sm text-gray-600">Humidity</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{humidAir}%</span>
                </div>

                {/* Water Temperature */}
                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-100 rounded-full text-cyan-600">
                            <Waves size={20} />
                        </div>
                        <span className="text-sm text-gray-600">Water Temp</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{tempWater}°C</span>
                </div>
            </div>
        </div>
    );
};

export default CompartmentCard;
