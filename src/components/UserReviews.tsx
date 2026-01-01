import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface UserReviewsProps {
  userId: string;
  limit?: number;
  showStats?: boolean;
}

interface Review {
  id: string;
  overall_rating: number;
  payment_rating: number | null;
  communication_rating: number | null;
  property_condition_rating: number | null;
  respect_rating: number | null;
  review_text: string | null;
  pros: string[] | null;
  cons: string[] | null;
  reviewer_role: string;
  is_verified: boolean;
  cross_verified: boolean;
  created_at: string;
  reviewer_id: string;
}

interface ReviewerProfile {
  full_name: string | null;
}

interface ReviewWithProfile extends Review {
  reviewer_profile?: ReviewerProfile | null;
}

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
};

export const UserReviews = ({ 
  userId, 
  limit = 5,
  showStats = true 
}: UserReviewsProps) => {
  const [showAll, setShowAll] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["user-reviews", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_reviews")
        .select("*")
        .eq("reviewed_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch reviewer profiles
      const reviewsWithProfiles: ReviewWithProfile[] = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", review.reviewer_id)
            .maybeSingle();
          
          return {
            ...review,
            reviewer_profile: profile,
          } as ReviewWithProfile;
        })
      );

      return reviewsWithProfiles;
    },
    enabled: !!userId,
  });

  const { data: reputation } = useQuery({
    queryKey: ["user-reputation", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_reputation")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && showStats,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const displayReviews = showAll ? reviews : reviews?.slice(0, limit);
  const hasMore = (reviews?.length || 0) > limit;

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews?.forEach((r) => {
    if (r.overall_rating >= 1 && r.overall_rating <= 5) {
      ratingCounts[r.overall_rating - 1]++;
    }
  });
  const maxCount = Math.max(...ratingCounts, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Avaliações ({reviews?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        {showStats && reputation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
            {/* Overall Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {reputation.average_rating?.toFixed(1) || "0.0"}
                </div>
                <StarRating rating={Math.round(reputation.average_rating || 0)} size="md" />
                <p className="text-sm text-muted-foreground mt-1">
                  {reputation.total_reviews || 0} avaliações
                </p>
              </div>
              
              {/* Rating Distribution */}
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs w-3">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <Progress
                      value={(ratingCounts[stars - 1] / maxCount) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-6">
                      {ratingCounts[stars - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Ratings */}
            <div className="space-y-2">
              {reputation.avg_payment_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pagamentos</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(reputation.avg_payment_rating)} />
                    <span className="text-sm font-medium">{reputation.avg_payment_rating.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {reputation.avg_communication_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Comunicação</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(reputation.avg_communication_rating)} />
                    <span className="text-sm font-medium">{reputation.avg_communication_rating.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {reputation.avg_property_condition_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Condição do Imóvel</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(reputation.avg_property_condition_rating)} />
                    <span className="text-sm font-medium">{reputation.avg_property_condition_rating.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {reputation.avg_respect_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Respeito</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(reputation.avg_respect_rating)} />
                    <span className="text-sm font-medium">{reputation.avg_respect_rating.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {(!reviews || reviews.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ainda não há avaliações</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayReviews?.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-muted/30 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {review.reviewer_profile?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.reviewer_profile?.full_name || "Utilizador"}
                        </span>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                        {review.cross_verified && (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {review.reviewer_role === "landlord" ? "Senhorio" : "Inquilino"}
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(review.created_at), "MMM yyyy", { locale: pt })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.overall_rating} />
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <p className="text-sm">{review.review_text}</p>
                )}

                {/* Pros & Cons */}
                <div className="flex flex-wrap gap-4">
                  {review.pros && review.pros.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <ThumbsUp className="h-3 w-3" />
                        Pontos Positivos
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {review.pros.map((pro, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {pro}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {review.cons && review.cons.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                        <ThumbsDown className="h-3 w-3" />
                        Pontos a Melhorar
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {review.cons.map((con, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {con}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show More Button */}
            {hasMore && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver todas as {reviews.length} avaliações
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
