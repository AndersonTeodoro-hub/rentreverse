-- Add virtual tour fields to properties table
ALTER TABLE public.properties
ADD COLUMN virtual_tour_url TEXT,
ADD COLUMN virtual_tour_type TEXT DEFAULT 'none', -- none, embed, images
ADD COLUMN virtual_tour_images TEXT[]; -- Array of 360° image URLs

-- Create index for properties with virtual tours
CREATE INDEX idx_properties_virtual_tour ON public.properties(virtual_tour_type) WHERE virtual_tour_type != 'none';

-- Create virtual_tour_views table to track engagement
CREATE TABLE public.virtual_tour_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  
  -- View details
  view_duration_seconds INTEGER DEFAULT 0,
  images_viewed INTEGER DEFAULT 1,
  
  -- Context
  source TEXT, -- property_details, explore, search
  device_type TEXT, -- desktop, mobile, tablet
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_tour_views ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can create tour views"
ON public.virtual_tour_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Property owners can view tour stats"
ON public.virtual_tour_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = virtual_tour_views.property_id
    AND p.user_id = auth.uid()
  )
);

-- Create index
CREATE INDEX idx_virtual_tour_views_property ON public.virtual_tour_views(property_id);