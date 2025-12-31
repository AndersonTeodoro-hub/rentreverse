-- Create notifications table for price alerts and other user notifications
CREATE TABLE public.price_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own price notifications"
ON public.price_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own price notifications"
ON public.price_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own price notifications"
ON public.price_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_price_notifications_user_id ON public.price_notifications(user_id);
CREATE INDEX idx_price_notifications_property_id ON public.price_notifications(property_id);

-- Function to notify users when property price changes
CREATE OR REPLACE FUNCTION public.notify_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger if rent_amount actually changed
  IF OLD.rent_amount IS DISTINCT FROM NEW.rent_amount THEN
    -- Insert notification for all users who saved this property
    INSERT INTO public.price_notifications (user_id, property_id, old_price, new_price)
    SELECT sp.user_id, NEW.id, OLD.rent_amount, NEW.rent_amount
    FROM public.saved_properties sp
    WHERE sp.property_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on properties table
CREATE TRIGGER trigger_property_price_change
AFTER UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.notify_price_change();