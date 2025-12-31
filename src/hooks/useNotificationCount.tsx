import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useNotificationCount = () => {
  const { user, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      if (userRole === "tenant") {
        // Tenants: count pending offers they received
        const { count } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .eq("status", "pending");
        
        setUnreadCount(count || 0);
      } else if (userRole === "landlord") {
        // Landlords: count offers that were responded to (accepted/rejected) 
        // that they haven't viewed yet - we'll track this with responded_at being recent
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { count } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("landlord_id", user.id)
          .in("status", ["accepted", "rejected"])
          .gte("responded_at", oneDayAgo.toISOString());
        
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notification-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
};
