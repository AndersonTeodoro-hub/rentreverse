-- 1. Create match_notifications table
CREATE TABLE IF NOT EXISTS match_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('property_match', 'tenant_match')),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_request_id UUID REFERENCES tenant_requests(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE match_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON match_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON match_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON match_notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON match_notifications FOR INSERT
  WITH CHECK (true);

-- 3. Indexes
CREATE INDEX idx_match_notifications_user_id ON match_notifications(user_id);
CREATE INDEX idx_match_notifications_read ON match_notifications(user_id, read);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE match_notifications;

-- 5. Function: match a new property to existing tenant requests
CREATE OR REPLACE FUNCTION match_property_to_tenants(p_property_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prop RECORD;
  req RECORD;
  score INTEGER;
  match_count INTEGER := 0;
  msg TEXT;
BEGIN
  SELECT * INTO prop FROM properties WHERE id = p_property_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  FOR req IN
    SELECT * FROM tenant_requests WHERE is_active = true
  LOOP
    score := 0;

    -- City match: +30
    IF prop.city = ANY(req.preferred_cities) THEN
      score := score + 30;
    END IF;

    -- Budget match: +30
    IF (req.min_budget IS NULL OR prop.rent_amount >= req.min_budget)
       AND (req.max_budget IS NULL OR prop.rent_amount <= req.max_budget) THEN
      score := score + 30;
    END IF;

    -- Bedrooms match: +20
    IF req.min_bedrooms IS NULL OR prop.bedrooms >= req.min_bedrooms THEN
      score := score + 20;
    END IF;

    -- Rental category match: +20
    IF req.rental_category IS NULL OR prop.rental_category = req.rental_category THEN
      score := score + 20;
    END IF;

    IF score >= 50 THEN
      msg := 'Nova propriedade em ' || prop.city || ' corresponde ao seu pedido "' || req.title || '" (' || score || '% compatível)';

      INSERT INTO match_notifications (user_id, type, property_id, tenant_request_id, match_score, message)
      VALUES (req.user_id, 'property_match', prop.id, req.id, score, msg);

      match_count := match_count + 1;
    END IF;
  END LOOP;

  RETURN match_count;
END;
$$;

-- 6. Function: match a new tenant request to existing properties
CREATE OR REPLACE FUNCTION match_tenant_to_properties(p_request_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req RECORD;
  prop RECORD;
  score INTEGER;
  match_count INTEGER := 0;
  msg TEXT;
BEGIN
  SELECT * INTO req FROM tenant_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  FOR prop IN
    SELECT * FROM properties WHERE status = 'active'
  LOOP
    score := 0;

    -- City match: +30
    IF prop.city = ANY(req.preferred_cities) THEN
      score := score + 30;
    END IF;

    -- Budget match: +30
    IF (req.min_budget IS NULL OR prop.rent_amount >= req.min_budget)
       AND (req.max_budget IS NULL OR prop.rent_amount <= req.max_budget) THEN
      score := score + 30;
    END IF;

    -- Bedrooms match: +20
    IF req.min_bedrooms IS NULL OR prop.bedrooms >= req.min_bedrooms THEN
      score := score + 20;
    END IF;

    -- Rental category match: +20
    IF req.rental_category IS NULL OR prop.rental_category = req.rental_category THEN
      score := score + 20;
    END IF;

    IF score >= 50 THEN
      msg := 'Novo pedido "' || req.title || '" corresponde ao seu imóvel em ' || prop.city || ' (' || score || '% compatível)';

      INSERT INTO match_notifications (user_id, type, property_id, tenant_request_id, match_score, message)
      VALUES (prop.user_id, 'tenant_match', prop.id, req.id, score, msg);

      match_count := match_count + 1;
    END IF;
  END LOOP;

  RETURN match_count;
END;
$$;

-- 7. Trigger functions and triggers
CREATE OR REPLACE FUNCTION trigger_match_property()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM match_property_to_tenants(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_match_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM match_tenant_to_properties(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_property_created
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION trigger_match_property();

CREATE TRIGGER on_tenant_request_created
  AFTER INSERT ON tenant_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_match_tenant();
