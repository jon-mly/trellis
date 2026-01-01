import type { ReactElement } from 'react';
import './SegmentedButton.css';

export interface SegmentedButtonOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedButtonProps<T extends string> {
  options: SegmentedButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedButtonProps<T>): ReactElement {
  return (
    <div className="segmented-button-group">
      <label className="segmented-button-label">{label}</label>
      <div className="segmented-button-container">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`segmented-button ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
