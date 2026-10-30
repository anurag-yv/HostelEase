import React, { useState, useEffect } from 'react';
import { BiTimeFive, BiCalendarCheck, BiInfoCircle } from 'react-icons/bi';
import { getFutureVisitSuggestions, validateVisitTime, WORK_HOURS } from '../utils/visitTimeSlots';

export const VisitTimeSelector = ({
  value,
  onChange,
  label = 'Estimated Visit / Arrival Time',
  placeholder = 'e.g. Tomorrow (10:00 AM – 12:00 PM)',
  required = false,
  error = '',
  helperText = '',
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Re-calculate future suggestions on mount and on every minute
  useEffect(() => {
    const update = () => {
      setSuggestions(getFutureVisitSuggestions());
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (newVal) => {
    onChange(newVal);
    if (newVal.trim()) {
      const res = validateVisitTime(newVal);
      setValidationError(res.valid ? '' : res.error);
    } else {
      setValidationError('');
    }
  };

  const handleSelectChip = (slot) => {
    handleChange(slot);
  };

  const now = new Date();
  const currentHour = now.getHours();
  const todayAvailable = currentHour < 17;

  return (
    <div className="visit-time-selector">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <label className="form-label fw-bold small text-dark mb-0 d-flex align-items-center gap-1.5">
          <BiTimeFive className="text-chocolate fs-5" /> {label} {required && <span className="text-danger">*</span>}
        </label>
        <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
          Working Hours: {WORK_HOURS.label}
        </span>
      </div>

      <div className="input-group input-group-sm mb-1.5">
        <span className="input-group-text bg-light text-muted"><BiCalendarCheck /></span>
        <input
          type="text"
          className={`form-control ${validationError || error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
        />
      </div>

      {(validationError || error) && (
        <div className="text-danger small mb-1.5" style={{ fontSize: '0.74rem' }}>
          ⚠️ {validationError || error}
        </div>
      )}

      {/* Dynamic Future Suggestions */}
      <div className="p-2 bg-light rounded border mb-2">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>
            Future Available Slots (9:00 AM – 6:00 PM only):
          </span>
          {!todayAvailable && (
            <span className="text-warning-emphasis fw-bold" style={{ fontSize: '0.68rem' }}>
              Today closed (past 5 PM)
            </span>
          )}
        </div>
        <div className="d-flex flex-wrap gap-1">
          {suggestions.map((slot) => {
            const isSelected = value === slot;
            return (
              <button
                key={slot}
                type="button"
                className={`btn btn-xs py-0.5 px-2 rounded-pill ${
                  isSelected ? 'btn-chocolate' : 'btn-outline-secondary bg-white'
                }`}
                style={{ fontSize: '0.72rem' }}
                onClick={() => handleSelectChip(slot)}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
        {helperText || 'Past times are automatically excluded. Work hours are strictly 9:00 AM – 6:00 PM.'}
      </small>
    </div>
  );
};

