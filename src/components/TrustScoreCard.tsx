import { useTranslation } from "react-i18next";
import { Shield, Check, X, Clock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrustScoreDetails {
  total_score: number;
  identity_verified: boolean;
  income_verified: boolean;
  employment_verified: boolean;
  address_verified: boolean;
  reference_count: number;
}

interface TrustScoreCardProps {
  trustScore: TrustScoreDetails | null;
  className?: string;
}

const TrustScoreCard = ({ trustScore, className }: TrustScoreCardProps) => {
  const { t } = useTranslation();

  const score = trustScore?.total_score || 0;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const verificationItems = [
    {
      key: 'identity',
      label: t('trustScore.identity'),
      verified: trustScore?.identity_verified || false,
      points: 25,
    },
    {
      key: 'income',
      label: t('trustScore.income'),
      verified: trustScore?.income_verified || false,
      points: 25,
    },
    {
      key: 'employment',
      label: t('trustScore.employment'),
      verified: trustScore?.employment_verified || false,
      points: 20,
    },
    {
      key: 'address',
      label: t('trustScore.address'),
      verified: trustScore?.address_verified || false,
      points: 10,
    },
    {
      key: 'references',
      label: t('trustScore.references'),
      verified: (trustScore?.reference_count || 0) > 0,
      points: Math.min((trustScore?.reference_count || 0) * 5, 20),
      maxPoints: 20,
      count: trustScore?.reference_count || 0,
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('trustScore.title')}
          </CardTitle>
        </div>
        <CardDescription>{t('trustScore.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center py-4">
          <div className={cn("text-6xl font-bold", getScoreColor())}>
            {score}
          </div>
          <p className="text-muted-foreground mt-1">{t('trustScore.outOf100')}</p>
          <div className="mt-4 px-8">
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", getProgressColor())}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Verification Items */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {t('trustScore.verifications')}
          </h4>
          {verificationItems.map((item) => (
            <div 
              key={item.key}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                item.verified ? "bg-green-50 border-green-200" : "bg-muted/50 border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  item.verified ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {item.verified ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  {'count' in item && (
                    <p className="text-xs text-muted-foreground">
                      {t('trustScore.referencesCount', { count: item.count })}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "font-semibold",
                  item.verified ? "text-green-600" : "text-muted-foreground"
                )}>
                  {'maxPoints' in item 
                    ? `${item.points}/${item.maxPoints}` 
                    : item.verified 
                      ? `+${item.points}` 
                      : `0/${item.points}`
                  }
                </span>
                <span className="text-xs text-muted-foreground ml-1">{t('trustScore.points')}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustScoreCard;
