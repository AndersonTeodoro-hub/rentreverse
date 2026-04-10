-- Fix city matching to be case-insensitive
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

    -- City match (case-insensitive): +30
    IF LOWER(prop.city) IN (SELECT LOWER(unnest(req.preferred_cities))) THEN
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

    -- City match (case-insensitive): +30
    IF LOWER(prop.city) IN (SELECT LOWER(unnest(req.preferred_cities))) THEN
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
