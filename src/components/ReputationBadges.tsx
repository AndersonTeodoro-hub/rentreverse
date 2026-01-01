import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Award, 
  Star, 
  Shield, 
  Home, 
  CheckCircle2, 
  Medal,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReputationBadgesProps {
  userId: string;
  showAll?: boolean;
  size?: "sm" | "md" | "lg";
}

interface UserReputation {
  average_rating: number;
  total_reviews: number;
  completed_rentals: number;
  is_good_payer: boolean;
  is_good_landlord: boolean;
  is_verified_renter: boolean;
}

interface UserBadge {
  badge_type: string;
  badge_name: string;
  badge_description: string;
  earned_at: string;
}

const badgeIcons: Record<string, React.ReactNode> = {
  good_payer: <Medal className="h-3.5 w-3.5" />,
  good_landlord: <Home className="h-3.5 w-3.5" />,
  verified_renter: <CheckCircle2 className="h-3.5 w-3.5" />,
  super_host: <Sparkles className="h-3.5 w-3.5" />,
  trusted_tenant: <Shield className="h-3.5 w-3.5" />,
  top_rated: <Star className="h-3.5 w-3.5" />,
};

const badgeStyles: Record<string, string> = {
  good_payer: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  good_landlord: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  verified_renter: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  super_host: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  trusted_tenant: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  top_rated: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
};

export const ReputationBadges = ({ 
  userId, 
  showAll = false,
  size = "sm" 
}: ReputationBadgesProps) => {
  const { data: reputation } = useQuery({
    queryKey: ["user-reputation", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_reputation")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserReputation | null;
    },
    enabled: !!userId,
  });

  const { data: customBadges } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_type, badge_name, badge_description, earned_at")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!userId && showAll,
  });

  // Build badges from reputation
  const badges: Array<{ type: string; name: string; description: string }> = [];

  if (reputation?.is_good_payer) {
    badges.push({
      type: "good_payer",
      name: "Bom Pagador",
      description: "Histórico de pagamentos sempre em dia",
    });
  }

  if (reputation?.is_good_landlord) {
    badges.push({
      type: "good_landlord",
      name: "Bom Senhorio",
      description: "Excelentes avaliações de inquilinos",
    });
  }

  if (reputation?.is_verified_renter) {
    badges.push({
      type: "verified_renter",
      name: "Arrendatário Verificado",
      description: "Pelo menos 1 arrendamento concluído",
    });
  }

  if (reputation && reputation.average_rating >= 4.5 && reputation.total_reviews >= 5) {
    badges.push({
      type: "top_rated",
      name: "Altamente Avaliado",
      description: `Média de ${reputation.average_rating.toFixed(1)} em ${reputation.total_reviews} avaliações`,
    });
  }

  // Add custom badges
  customBadges?.forEach((badge) => {
    badges.push({
      type: badge.badge_type,
      name: badge.badge_name,
      description: badge.badge_description,
    });
  });

  if (badges.length === 0) return null;

  const displayBadges = showAll ? badges : badges.slice(0, 3);
  const hiddenCount = badges.length - displayBadges.length;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge) => (
        <Tooltip key={badge.type}>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center border cursor-default",
                sizeClasses[size],
                badgeStyles[badge.type] || "bg-muted text-muted-foreground"
              )}
            >
              {badgeIcons[badge.type] || <Award className="h-3.5 w-3.5" />}
              <span>{badge.name}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{badge.description}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="secondary" className={sizeClasses[size]}>
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
};
