import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Shield,
  DollarSign,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";

interface BehavioralPattern {
  pattern: string;
  impact: "positive" | "neutral" | "negative";
  description: string;
}

interface MarketInsights {
  recommended_rent_range: { min: number; max: number };
  market_comparison: string;
  demand_level: "low" | "medium" | "high";
}

interface RiskAnalysis {
  default_probability: number;
  risk_level: "low" | "medium" | "high" | "very_high";
  behavioral_patterns: BehavioralPattern[];
  market_insights: MarketInsights;
  recommendations: string[];
  confidence_score: number;
}

interface AIRiskAnalysisProps {
  tenantId: string;
  propertyId?: string;
  compact?: boolean;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case "low": return "bg-green-500";
    case "medium": return "bg-yellow-500";
    case "high": return "bg-orange-500";
    case "very_high": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case "low": return "default";
    case "medium": return "secondary";
    case "high": 
    case "very_high": return "destructive";
    default: return "outline";
  }
};

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case "positive": return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "negative": return <TrendingDown className="h-4 w-4 text-red-500" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

const getDemandColor = (level: string) => {
  switch (level) {
    case "high": return "text-green-600";
    case "medium": return "text-yellow-600";
    case "low": return "text-red-600";
    default: return "text-muted-foreground";
  }
};

export const AIRiskAnalysis = ({ 
  tenantId, 
  propertyId, 
  compact = false 
}: AIRiskAnalysisProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tenant-risk-analysis", tenantId, propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-tenant-risk", {
        body: { tenant_id: tenantId, property_id: propertyId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as { success: boolean; analysis: RiskAnalysis; analyzed_at: string };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Análise atualizada com sucesso");
    } catch {
      toast.error("Erro ao atualizar análise");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Não foi possível analisar o risco"}
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data?.analysis) return null;

  const { analysis } = data;

  if (compact) {
    return (
      <Card className="border-l-4" style={{ borderLeftColor: `var(--${analysis.risk_level === "low" ? "green" : analysis.risk_level === "medium" ? "yellow" : "red"}-500)` }}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Risco de Incumprimento</p>
                <p className="text-2xl font-bold">{analysis.default_probability}%</p>
              </div>
            </div>
            <Badge variant={getRiskBadgeVariant(analysis.risk_level)}>
              {analysis.risk_level === "very_high" ? "Muito Alto" : 
               analysis.risk_level === "high" ? "Alto" :
               analysis.risk_level === "medium" ? "Médio" : "Baixo"}
            </Badge>
          </div>
          <Progress 
            value={analysis.default_probability} 
            className={`mt-3 h-2 ${getRiskColor(analysis.risk_level)}`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Análise de Risco com IA
            </CardTitle>
            <CardDescription>
              Análise preditiva baseada em dados verificados
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Probabilidade de Incumprimento</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{analysis.default_probability}%</span>
              <Badge variant={getRiskBadgeVariant(analysis.risk_level)}>
                {analysis.risk_level === "very_high" ? "Muito Alto" : 
                 analysis.risk_level === "high" ? "Alto" :
                 analysis.risk_level === "medium" ? "Médio" : "Baixo"}
              </Badge>
            </div>
            <Progress 
              value={analysis.default_probability} 
              className="mt-2 h-2"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Confiança da Análise</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{analysis.confidence_score}%</span>
              {analysis.confidence_score >= 80 && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <Progress 
              value={analysis.confidence_score} 
              className="mt-2 h-2"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Renda Recomendada</span>
            </div>
            <div className="text-xl font-bold">
              €{analysis.market_insights.recommended_rent_range.min} - €{analysis.market_insights.recommended_rent_range.max}
            </div>
            <p className={`text-sm mt-1 ${getDemandColor(analysis.market_insights.demand_level)}`}>
              Procura {analysis.market_insights.demand_level === "high" ? "alta" : 
                       analysis.market_insights.demand_level === "medium" ? "média" : "baixa"}
            </p>
          </div>
        </div>

        {/* Behavioral Patterns */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Padrões Comportamentais
          </h4>
          <div className="grid gap-2">
            {analysis.behavioral_patterns.map((pattern, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
              >
                {getImpactIcon(pattern.impact)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{pattern.pattern}</p>
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-primary/5 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise de Mercado
          </h4>
          <p className="text-sm text-muted-foreground">
            {analysis.market_insights.market_comparison}
          </p>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recomendações
          </h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Analysis Timestamp */}
        <p className="text-xs text-muted-foreground text-right">
          Última análise: {new Date(data.analyzed_at).toLocaleString("pt-PT")}
        </p>
      </CardContent>
    </Card>
  );
};
