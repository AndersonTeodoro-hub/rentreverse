-- Critical security fixes - RLS policies tightening
-- Date: 2026-04-11
--
-- Addresses 3 critical RLS issues found during the security audit:
--   1. user_points: clients could update total_points to arbitrary values
--   2. match_notifications: any client could forge notifications for any user
--   3. referral_codes: full table (incl. user_id) was publicly readable

-- =====================================================================
-- CRITICAL 1: user_points UPDATE policy
-- Issue: "Users can update own points" allowed any authenticated user to
--   set total_points / used_points to any value via the public API.
-- Fix:   Drop the client-facing UPDATE policy entirely. The triggers and
--   SECURITY DEFINER functions that legitimately mutate this table bypass
--   RLS and continue to work.
-- =====================================================================
DROP POLICY IF EXISTS "Users can update own points" ON public.user_points;

-- =====================================================================
-- CRITICAL 2: match_notifications INSERT policy
-- Issue: "System can insert notifications" used WITH CHECK (true), so any
--   authenticated client could INSERT notifications targeting arbitrary
--   user_ids (notification spoofing / phishing vector).
-- Fix:   Replace it with a policy that blocks all client INSERTs. The
--   trigger functions trigger_match_property() and trigger_match_tenant()
--   are SECURITY DEFINER and bypass RLS, so legitimate match notifications
--   keep being created server-side.
-- =====================================================================
DROP POLICY IF EXISTS "System can insert notifications" ON public.match_notifications;

CREATE POLICY "Block direct client inserts on match_notifications"
  ON public.match_notifications
  FOR INSERT
  WITH CHECK (false);

-- =====================================================================
-- CRITICAL 3: referral_codes SELECT policy
-- Issue: "Anyone can view referral codes for validation" used USING (true)
--   which exposed every (user_id, code) row publicly, enabling user
--   enumeration of the entire user base.
-- Fix:   Drop the public policy. The remaining "Users can view own
--   referral code" policy keeps each user able to see their own code.
--   The current frontend only ever queries this table filtered by
--   auth.uid(), so no UI flow breaks.
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can view referral codes for validation" ON public.referral_codes;
