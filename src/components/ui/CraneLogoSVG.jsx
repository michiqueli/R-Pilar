
import React from 'react';

// Rebranded to display KAISHA Logo (K shape)
export const CraneLogoSVG = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    {/* Geometric K Logo */}
    <path d="M3 2V22L10 12L3 2Z" fill="#DC2626"/>
    <path d="M12 2L9 7L15 2H12Z" fill="#B91C1C"/>
    <path d="M9 17L12 22H15L9 17Z" fill="#B91C1C"/>
    <path d="M19 2L11 12L19 22H23L15 12L23 2H19Z" fill="#DC2626"/>
  </svg>
);

export default CraneLogoSVG;
