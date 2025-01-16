import React, { useState, useEffect } from 'react';
import { useEmployee } from '../contexts/EmployeeContext';

interface Props {
  employeeName: string;
  onColorChange?: (color: string) => void;
}

export default function EmployeeColorManager({ employeeName, onColorChange }: Props) {
  const { state, setEmployeeColor, getEmployee } = useEmployee();
  const [color, setColor] = useState('#000000');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEmployeeColor() {
      const employee = await getEmployee(employeeName);
      if (employee) {
        setColor(employee.color);
      }
      setIsLoading(false);
    }

    loadEmployeeColor();
  }, [employeeName, getEmployee]);

  const handleColorChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    setColor(newColor);
    await setEmployeeColor(employeeName, newColor);
    onColorChange?.(newColor);
  };

  if (isLoading || state.isLoading) {
    return <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={color}
        onChange={handleColorChange}
        className="w-8 h-8 rounded cursor-pointer"
        title="Choose employee color"
      />
      {state.error && (
        <p className="text-sm text-red-500">
          Failed to update color
        </p>
      )}
    </div>
  );
}