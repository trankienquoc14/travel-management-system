import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

export const FormattedDateInput = ({ 
    value, 
    onChange, 
    placeholder = "dd/mm/yyyy", 
    style, 
    className = "",
    min,
    max,
    required = false,
    id
}) => {
    const hiddenDateInputRef = useRef(null);

    // Convert YYYY-MM-DD -> DD/MM/YYYY
    const formatToDMY = (isoDate) => {
        if (!isoDate) return '';
        const cleanDate = String(isoDate).split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return isoDate;
    };

    // Convert DD/MM/YYYY -> YYYY-MM-DD
    const parseFromDMY = (dmyStr) => {
        if (!dmyStr) return null;
        const match = dmyStr.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            const d = parseInt(day, 10);
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
                return `${year}-${month}-${day}`;
            }
        }
        return null;
    };

    const [textValue, setTextValue] = useState(() => formatToDMY(value));

    useEffect(() => {
        setTextValue(formatToDMY(value));
    }, [value]);

    const handleTextChange = (e) => {
        const val = e.target.value;
        setTextValue(val);
        const iso = parseFromDMY(val);
        if (iso) {
            onChange(iso);
        } else if (!val.trim()) {
            onChange('');
        }
    };

    const handleBlur = () => {
        const iso = parseFromDMY(textValue);
        if (iso) {
            onChange(iso);
            setTextValue(formatToDMY(iso));
        } else if (!textValue.trim()) {
            onChange('');
            setTextValue('');
        } else {
            // Revert back to prop value if invalid
            setTextValue(formatToDMY(value));
        }
    };

    const handleDateChange = (e) => {
        const isoVal = e.target.value;
        onChange(isoVal);
        setTextValue(formatToDMY(isoVal));
    };

    const triggerPicker = () => {
        if (hiddenDateInputRef.current) {
            try {
                if (typeof hiddenDateInputRef.current.showPicker === 'function') {
                    hiddenDateInputRef.current.showPicker();
                } else {
                    hiddenDateInputRef.current.focus();
                }
            } catch (err) {
                hiddenDateInputRef.current.focus();
            }
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <input
                id={id}
                type="text"
                value={textValue}
                placeholder={placeholder}
                onChange={handleTextChange}
                onBlur={handleBlur}
                className={className}
                required={required}
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    paddingRight: '38px',
                    width: '100%'
                }}
            />
            
            {/* Visual calendar icon */}
            <div
                style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                }}
            >
                <Calendar size={18} />
            </div>

            {/* Native date input overlaid on the icon area so clicking the icon naturally triggers the browser's date picker */}
            <input
                ref={hiddenDateInputRef}
                type="date"
                min={min}
                max={max}
                value={value ? String(value).split('T')[0] : ''}
                onChange={handleDateChange}
                onClick={triggerPicker}
                title="Chọn ngày khởi hành"
                style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                }}
            />
        </div>
    );
};
export default FormattedDateInput;
