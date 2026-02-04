'use client';

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';

interface DatePickerProps {
    id?: string;
    name?: string;
    value: string; // ISO date string (YYYY-MM-DD)
    onChange: (date: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export default function DatePicker({
    id,
    name,
    value,
    onChange,
    disabled = false,
    placeholder = 'Select date',
    className = '',
}: DatePickerProps) {
    // Convert ISO string to Date object with validation
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr || dateStr.trim() === '') {
            return null;
        }

        try {
            const date = new Date(dateStr + 'T00:00:00');
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return null;
            }
            return date;
        } catch {
            return null;
        }
    };

    const selectedDate = parseDate(value);

    // Handle date change
    const handleChange = (date: Date | null) => {
        if (date && !isNaN(date.getTime())) {
            // Convert to ISO string (YYYY-MM-DD)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        } else {
            onChange('');
        }
    };

    return (
        <ReactDatePicker
            id={id}
            name={name}
            selected={selectedDate}
            onChange={handleChange}
            dateFormat="dd/MM/yyyy"
            placeholderText={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
            calendarClassName="custom-datepicker"
            showPopperArrow={false}
            withPortal
            portalId="datepicker-portal"
            preventOpenOnFocus
        />
    );
}
