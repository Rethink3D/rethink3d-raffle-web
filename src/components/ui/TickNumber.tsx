import React from 'react';

export const TickNumber: React.FC<{ value: string | number; className?: string }> = ({ value, className }) => (
  <span className={`relative inline-block overflow-hidden align-bottom ${className ?? ''}`}>
    <span key={String(value)} className="anim-tick tabular-nums">
      {value}
    </span>
  </span>
);

export default TickNumber;
