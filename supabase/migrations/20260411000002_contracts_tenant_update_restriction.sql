-- High security fix: restrict what tenants can update on contracts
-- Date: 2026-04-11
--
-- Issue: The "Tenants can sign contracts" RLS policy allows tenants to UPDATE
--   any column on a contract row whose status is 'pending_tenant'. A malicious
--   tenant could rewrite rent_amount, dates, content, or even reassign the
--   landlord_id when signing.
--
-- Fix:   PostgreSQL RLS cannot enforce column-level UPDATE restrictions
--   directly, so we add a BEFORE UPDATE trigger that, when the caller is the
--   tenant (and not the landlord), forbids changes to any column other than
--   the signing-related ones.

-- Tighten the RLS policy with a WITH CHECK that limits the post-update status
-- to the legitimate values for a tenant signing flow.
DROP POLICY IF EXISTS "Tenants can sign contracts" ON public.contracts;

CREATE POLICY "Tenants can sign contracts"
  ON public.contracts
  FOR UPDATE
  USING (auth.uid() = tenant_id AND status = 'pending_tenant')
  WITH CHECK (auth.uid() = tenant_id AND status IN ('pending_tenant', 'signed'));

-- Trigger function: when the caller is the tenant (and not also the landlord),
-- only allow updates to: status, tenant_signature, tenant_signed_at, tenant_ip,
-- updated_at. Any change to another column raises an exception.
CREATE OR REPLACE FUNCTION public.enforce_tenant_contract_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only enforce when the caller is acting as the tenant on this contract.
  -- Landlords (and admin/service-role contexts where auth.uid() is null)
  -- bypass this check via the early RETURN.
  IF auth.uid() IS NULL OR auth.uid() <> OLD.tenant_id OR auth.uid() = OLD.landlord_id THEN
    RETURN NEW;
  END IF;

  IF NEW.id              IS DISTINCT FROM OLD.id
     OR NEW.offer_id              IS DISTINCT FROM OLD.offer_id
     OR NEW.property_id           IS DISTINCT FROM OLD.property_id
     OR NEW.landlord_id           IS DISTINCT FROM OLD.landlord_id
     OR NEW.tenant_id             IS DISTINCT FROM OLD.tenant_id
     OR NEW.template_id           IS DISTINCT FROM OLD.template_id
     OR NEW.content               IS DISTINCT FROM OLD.content
     OR NEW.rent_amount           IS DISTINCT FROM OLD.rent_amount
     OR NEW.start_date            IS DISTINCT FROM OLD.start_date
     OR NEW.end_date              IS DISTINCT FROM OLD.end_date
     OR NEW.deposit_amount        IS DISTINCT FROM OLD.deposit_amount
     OR NEW.landlord_signature    IS DISTINCT FROM OLD.landlord_signature
     OR NEW.landlord_signed_at    IS DISTINCT FROM OLD.landlord_signed_at
     OR NEW.landlord_ip           IS DISTINCT FROM OLD.landlord_ip
     OR NEW.renewal_reminder_sent IS DISTINCT FROM OLD.renewal_reminder_sent
     OR NEW.renewal_reminder_date IS DISTINCT FROM OLD.renewal_reminder_date
     OR NEW.created_at            IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Tenants may only update signing fields (status, tenant_signature, tenant_signed_at, tenant_ip)'
      USING ERRCODE = '42501';
  END IF;

  -- Status can only stay pending_tenant or transition to signed
  IF NEW.status NOT IN ('pending_tenant', 'signed') THEN
    RAISE EXCEPTION 'Tenants may only set status to signed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_tenant_contract_update_trigger ON public.contracts;

CREATE TRIGGER enforce_tenant_contract_update_trigger
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tenant_contract_update();
