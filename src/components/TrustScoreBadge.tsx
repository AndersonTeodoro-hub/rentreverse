import { useTranslation } from "react-i18next";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const TrustScoreBadge = ({ score, size = 'md', showLabel = true, className }: TrustScoreBadgeProps) => {
  const { t } = useTranslation();
  
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 25) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreIcon = () => {
    if (score >= 80) return ShieldCheck;
    if (score >= 50) return Shield;
    return ShieldAlert;
  };

  const sizeClasses = {
    sm: 'h-6 px-2 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const Icon = getScoreIcon();

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        getScoreColor(),
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{score}</span>
      {showLabel && <span className="opacity-75">/100</span>}
    </div>
  );
};

export default TrustScoreBadge;
