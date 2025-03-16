import React from 'react';
import { motion } from 'framer-motion';
import { DateRange } from './types';
import { formatDateForInput, getPresets } from './utils';

interface DateRangeSelectorProps {
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
    activePreset: number;
    onPresetClick: (presetIndex: number) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
    dateRange,
    onDateRangeChange,
    activePreset,
    onPresetClick
}) => {
    const presets = getPresets();

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value ? new Date(e.target.value) : new Date();
        onDateRangeChange({
            startDate: newStartDate,
            endDate: dateRange.endDate
        });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value ? new Date(e.target.value) : new Date();
        // Set time to end of day
        newEndDate.setHours(23, 59, 59, 999);
        onDateRangeChange({
            startDate: dateRange.startDate,
            endDate: newEndDate
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-4 border border-neutral-200 dark:border-neutral-700"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex flex-wrap gap-2">
                    {presets.map((preset, index) => (
                        <button
                            key={preset.label}
                            onClick={() => onPresetClick(index)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                activePreset === index
                                    ? 'bg-red-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Du:</label>
                        <input
                            type="date"
                            value={formatDateForInput(dateRange.startDate)}
                            onChange={handleStartDateChange}
                            className="block w-full rounded-md border-0 py-1.5 text-neutral-900 dark:text-white shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-red-600 dark:focus:ring-red-500 sm:text-sm sm:leading-6 dark:bg-neutral-800"
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Au:</label>
                        <input
                            type="date"
                            value={formatDateForInput(dateRange.endDate)}
                            onChange={handleEndDateChange}
                            className="block w-full rounded-md border-0 py-1.5 text-neutral-900 dark:text-white shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-red-600 dark:focus:ring-red-500 sm:text-sm sm:leading-6 dark:bg-neutral-800"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DateRangeSelector; 