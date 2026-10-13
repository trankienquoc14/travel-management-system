import React, { useState, useMemo, useRef } from 'react';
import { Calendar } from 'lucide-react';

export const FormattedDateInput = ({ value, onChange, placeholder = "dd/mm/yyyy", style }) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    const displayValue = useMemo(() => {
        if (isFocused) return value;
        if (!value) return '';
        const parts = value.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return value;
    }, [value, isFocused]);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <input
                ref={inputRef}
                type={isFocused ? "date" : "text"}
                value={displayValue || ''}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    paddingRight: isFocused ? '8px' : '32px'
                }}
            />
            {!isFocused && (
                <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Calendar size={16} />
                </div>
            )}
        </div>
    );
};
