import React from 'react';

interface AdsSlotProps {
  type: 'header' | 'sidebar' | 'in-feed';
}

export const AdsSlot: React.FC<AdsSlotProps> = () => {
  // Advertising is temporarily disabled
  return null;
};
export default AdsSlot;
