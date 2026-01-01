import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Loader2, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AIVerificationAnalysisProps {
  verificationId: string;
  documentUrl: string;
  documentType: 'identity' | 'income' | 'employment' | 'address';
  onAnalysisComplete: () => void;
}

interface AnalysisResult {
  isValid: boolean;
  confidence: number;
  extractedData: Record<string, string>;
  fraudIndicators: string[];
  recommendations: string[];
  summary: string;
}

export function AIVerificationAnalysis({
  verificationId,
  documentUrl,
  documentType,
  onAnalysisComplete,
}: AIVerificationAnalysisProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'approved' | 'pending' | 'rejected' | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-document', {
        body: {
          documentUrl,
          documentType,
          verificationId,
        },
      });

      if (fnError) throw fnError;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          setError(t('aiVerification.rateLimitError'));
        } else if (data.error.includes('credits')) {
          setError(t('aiVerification.creditsError'));
        } else {
          setError(data.error);
        }
        return;
      }

      setResult(data.analysis);
      setStatus(data.status);
      
      toast({
        title: t('aiVerification.analysisComplete'),
        description: data.status === 'approved' 
          ? t('aiVerification.approved')
          : data.status === 'rejected'
            ? t('aiVerification.rejected')
            : t('aiVerification.needsReview'),
      });

      onAnalysisComplete();
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t('aiVerification.genericError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          {t('aiVerification.title')}
        </CardTitle>
        <CardDescription>{t('aiVerification.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !isAnalyzing && !error && (
          <Button onClick={runAnalysis} className="w-full gap-2">
            <Brain className="h-4 w-4" />
            {t('aiVerification.startAnalysis')}
          </Button>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">{t('aiVerification.analyzing')}</p>
              <p className="text-sm text-muted-foreground">{t('aiVerification.pleaseWait')}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-center text-destructive">{error}</p>
            <Button variant="outline" onClick={runAnalysis}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                {status === 'pending' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                <span className="font-medium">
                  {status === 'approved' && t('aiVerification.statusApproved')}
                  {status === 'rejected' && t('aiVerification.statusRejected')}
                  {status === 'pending' && t('aiVerification.statusPending')}
                </span>
              </div>
              <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}>
                {result.isValid ? t('aiVerification.valid') : t('aiVerification.invalid')}
              </Badge>
            </div>

            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('aiVerification.confidence')}</span>
                <span className={cn('font-medium', getStatusColor(result.confidence))}>
                  {result.confidence}%
                </span>
              </div>
              <div className="relative">
                <Progress value={result.confidence} className="h-2" />
                <div 
                  className={cn('absolute top-0 left-0 h-2 rounded-full transition-all', getProgressColor(result.confidence))}
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t('aiVerification.summary')}
              </h4>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>

            {/* Extracted Data */}
            {Object.keys(result.extractedData).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">{t('aiVerification.extractedData')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(result.extractedData).map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted rounded-md">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fraud Indicators */}
            {result.fraudIndicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {t('aiVerification.fraudIndicators')}
                </h4>
                <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
                  {result.fraudIndicators.map((indicator, idx) => (
                    <li key={idx}>{indicator}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">{t('aiVerification.recommendations')}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Retry Button */}
            <Button variant="outline" onClick={runAnalysis} className="w-full">
              {t('aiVerification.reanalyze')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
