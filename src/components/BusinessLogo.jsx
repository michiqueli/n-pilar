import React from 'react';
import config from '@/config';
import { cn } from '@/lib/utils';

const BusinessLogo = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const sizeClass = sizes[size] || sizes.md;
  const iconSizeClass = iconSizes[size] || iconSizes.md;
  const Icon = config.BusinessIcon;

  if (config.logoUrl) {
    return (
      <div className={cn(sizeClass, "rounded-lg overflow-hidden shadow-md flex-shrink-0", className)}>
        <img src={config.logoUrl} alt={config.appName} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn(sizeClass, "bg-primary rounded-lg flex items-center justify-center shadow-md flex-shrink-0", className)}>
      <Icon className={cn(iconSizeClass, "text-primary-foreground")} />
    </div>
  );
};

export default BusinessLogo;
