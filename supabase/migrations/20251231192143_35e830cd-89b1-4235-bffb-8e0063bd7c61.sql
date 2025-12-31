-- Enable realtime for offers table
ALTER TABLE public.offers REPLICA IDENTITY FULL;

-- Add offers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;