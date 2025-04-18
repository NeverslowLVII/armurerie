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
  onPresetClick,
}) => {
  const presets = getPresets();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value ? new Date(e.target.value) : new Date();
    onDateRangeChange({
      startDate: newStartDate,
      endDate: dateRange.endDate,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value ? new Date(e.target.value) : new Date();
    // Set time to end of day
    newEndDate.setHours(23, 59, 59, 999);
    onDateRangeChange({
      startDate: dateRange.startDate,
      endDate: newEndDate,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
    >
      <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => (
            <button
              key={preset.label}
              onClick={() => onPresetClick(index)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                activePreset === index
                  ? 'bg-red-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col items-center space-y-2 sm:w-auto sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="flex w-full items-center space-x-2 sm:w-auto">
            <label className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
              Du:
            </label>
            <input
              type="date"
              value={formatDateForInput(dateRange.startDate)}
              onChange={handleStartDateChange}
              className="block w-full rounded-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-red-600 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700 dark:focus:ring-red-500 sm:text-sm sm:leading-6"
            />
          </div>

          <div className="flex w-full items-center space-x-2 sm:w-auto">
            <label className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
              Au:
            </label>
            <input
              type="date"
              value={formatDateForInput(dateRange.endDate)}
              onChange={handleEndDateChange}
              className="block w-full rounded-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-red-600 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700 dark:focus:ring-red-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DateRangeSelector;
