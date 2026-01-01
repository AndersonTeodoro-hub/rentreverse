import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Euro, MapPin, Briefcase, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import { StartChatButton } from "@/components/chat/StartChatButton";

interface TenantSuggestion {
  tenant_id: string;
  user_id: string;
  compatibility_score: number;
  match_reasons: string[];
  concerns?: string[];
  recommendation: string;
  tenant_name: string;
  tenant_title: string;
  tenant_budget: number | null;
  tenant_cities: string[] | null;
  tenant_profession: string | null;
  trust_score: number;
  has_pets: boolean;
  is_smoker: boolean;
}

interface AIMatchingSuggestionsProps {
  propertyId: string;
  onSendOffer?: (tenantId: string, userId: string, name: string) => void;
}

export default function AIMatchingSuggestions({ propertyId, onSendOffer }: AIMatchingSuggestionsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ai-matching", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("suggest-tenants", {
        body: { property_id: propertyId },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            {t("matching.analyzing")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">{t("matching.findingBestMatches")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertCircle className="w-5 h-5" />
            {t("matching.errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{t("matching.errorDescription")}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t("common.tryAgain")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const suggestions: TenantSuggestion[] = data?.suggestions || [];

  if (suggestions.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            {t("matching.noMatches")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("matching.noMatchesDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t("matching.aiSuggestions")}
          <Badge variant="secondary" className="ml-2">
            {suggestions.length} {t("matching.matches")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <Collapsible
            key={suggestion.tenant_id}
            open={expandedId === suggestion.tenant_id}
            onOpenChange={() => setExpandedId(expandedId === suggestion.tenant_id ? null : suggestion.tenant_id)}
          >
            <div className="border rounded-lg bg-background overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{suggestion.tenant_name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {suggestion.tenant_title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={getScoreVariant(suggestion.compatibility_score)}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {suggestion.compatibility_score}%
                      </Badge>
                      <TrustScoreBadge score={suggestion.trust_score} size="sm" />
                    </div>
                    {expandedId === suggestion.tenant_id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4 border-t pt-4">
                  {/* Compatibility Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t("matching.compatibilityScore")}</span>
                      <span className={`font-bold ${getScoreColor(suggestion.compatibility_score)}`}>
                        {suggestion.compatibility_score}%
                      </span>
                    </div>
                    <Progress value={suggestion.compatibility_score} className="h-2" />
                  </div>

                  {/* Tenant Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {suggestion.tenant_budget && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="w-4 h-4" />
                        <span>{t("matching.budgetUpTo")} €{suggestion.tenant_budget}</span>
                      </div>
                    )}
                    {suggestion.tenant_cities && suggestion.tenant_cities.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{suggestion.tenant_cities.slice(0, 2).join(", ")}</span>
                      </div>
                    )}
                    {suggestion.tenant_profession && (
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{suggestion.tenant_profession}</span>
                      </div>
                    )}
                  </div>

                  {/* Lifestyle badges */}
                  <div className="flex gap-2">
                    {suggestion.has_pets && (
                      <Badge variant="outline" className="text-xs">
                        🐾 {t("matching.hasPets")}
                      </Badge>
                    )}
                    {suggestion.is_smoker && (
                      <Badge variant="outline" className="text-xs">
                        🚬 {t("matching.smoker")}
                      </Badge>
                    )}
                  </div>

                  {/* AI Recommendation */}
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">{t("matching.aiRecommendation")}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.recommendation}</p>
                  </div>

                  {/* Match Reasons */}
                  {suggestion.match_reasons && suggestion.match_reasons.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-2">✓ {t("matching.positiveFactors")}</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {suggestion.match_reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {suggestion.concerns && suggestion.concerns.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-2">⚠ {t("matching.concerns")}</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {suggestion.concerns.map((concern, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <StartChatButton
                      otherUserId={suggestion.user_id}
                      variant="outline"
                      size="sm"
                    />
                    {onSendOffer && (
                      <Button
                        size="sm"
                        onClick={() => onSendOffer(suggestion.tenant_id, suggestion.user_id, suggestion.tenant_name)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {t("matching.sendOffer")}
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
