import React from 'react';

const SensorDetailCard = ({ title, subtitle, value, unit, icon: Icon, colorTheme, max = 100 }) => {
    // Color configurations
    const themes = {
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            barBg: 'bg-orange-100',
            barFill: 'bg-orange-500',
            valueColor: 'text-orange-900' // Darker orange/brown for value
        },
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            barBg: 'bg-blue-100',
            barFill: 'bg-blue-600',
            valueColor: 'text-blue-700'
        },
        green: {
            bg: 'bg-emerald-50', // Using emerald/mint for that fresh green look
            text: 'text-emerald-600',
            barBg: 'bg-emerald-100',
            barFill: 'bg-emerald-500',
            valueColor: 'text-emerald-800'
        }
    };

    const theme = themes[colorTheme] || themes.blue;
    const percentage = Math.min((parseFloat(value) / max) * 100, 100);

    return (
        <div className={`${theme.bg} rounded-2xl p-6 transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-center gap-3 mb-4">
                <Icon className={theme.text} size={24} />
                <span className="font-medium text-gray-700">{title}</span>
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${theme.valueColor}`}>
                        {value}
                    </span>
                    <span className={`text-xl font-medium ${theme.valueColor}`}>
                        {unit}
                    </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-3 ${theme.barBg} rounded-full overflow-hidden`}>
                <div
                    className={`h-full ${theme.barFill} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default SensorDetailCard;
