import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface OfferPayload {
  id: string;
  tenant_id: string;
  landlord_id: string;
  status: string;
  property_id: string;
  message?: string;
  proposed_rent?: number;
  response_message?: string;
}

export const useOfferNotifications = () => {
  const { user, userRole } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleNewOffer = useCallback(
    async (payload: OfferPayload) => {
      // Only notify the tenant when they receive a new offer
      if (payload.tenant_id !== user?.id) return;

      // Fetch property details for the notification
      const { data: property } = await supabase
        .from("properties")
        .select("title, city")
        .eq("id", payload.property_id)
        .maybeSingle();

      toast({
        title: t("notifications.newOffer"),
        description: property
          ? t("notifications.newOfferDesc", { property: property.title })
          : t("notifications.newOfferGeneric"),
        action: (
          <button
            onClick={() => navigate("/my-offers")}
            className="text-primary hover:underline text-sm font-medium"
          >
            {t("notifications.viewOffer")}
          </button>
        ),
      });

      // Invalidate offers query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["received-offers"] });
    },
    [user?.id, toast, t, navigate, queryClient]
  );

  const handleOfferUpdate = useCallback(
    async (payload: OfferPayload) => {
      // Only notify the landlord when their offer is responded to
      if (payload.landlord_id !== user?.id) return;

      const statusMessages: Record<string, string> = {
        accepted: t("notifications.offerAccepted"),
        rejected: t("notifications.offerRejected"),
      };

      if (!statusMessages[payload.status]) return;

      // Fetch tenant profile for the notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", payload.tenant_id)
        .maybeSingle();

      toast({
        title: statusMessages[payload.status],
        description: profile?.full_name
          ? t("notifications.offerResponseDesc", { name: profile.full_name })
          : t("notifications.offerResponseGeneric"),
        variant: payload.status === "accepted" ? "default" : "destructive",
        action: (
          <button
            onClick={() => navigate("/my-offers")}
            className="text-primary hover:underline text-sm font-medium"
          >
            {t("notifications.viewDetails")}
          </button>
        ),
      });

      // Invalidate offers query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["sent-offers"] });
    },
    [user?.id, toast, t, navigate, queryClient]
  );

  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime offer notifications for user:", user.id);

    const channel = supabase
      .channel("offer-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "offers",
        },
        (payload) => {
          console.log("New offer received:", payload);
          handleNewOffer(payload.new as OfferPayload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
        },
        (payload) => {
          console.log("Offer updated:", payload);
          const oldStatus = (payload.old as OfferPayload).status;
          const newStatus = (payload.new as OfferPayload).status;
          
          // Only trigger notification when status changes from pending
          if (oldStatus === "pending" && newStatus !== "pending") {
            handleOfferUpdate(payload.new as OfferPayload);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user, handleNewOffer, handleOfferUpdate]);

  return null;
};
