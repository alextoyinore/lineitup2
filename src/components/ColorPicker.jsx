import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from "react-colorful";

const ColorPicker = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }}>
      {/* The visible swatch */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          backgroundColor: color,
          border: '1px solid rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Choose Color"
      />

      {/* The popover picker */}
      {isOpen && (
        <div 
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 100,
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            background: '#fff',
            padding: '8px'
          }}
        >
          <HexColorPicker color={color} onChange={onChange} />
          {/* Hex display */}
          <div style={{ marginTop: '8px', textAlign: 'center', fontFamily: 'Inter', fontSize: '12px', color: '#666' }}>
            {color.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
