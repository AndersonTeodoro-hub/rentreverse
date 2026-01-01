-- Create contract templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES public.offers(id),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  landlord_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES public.contract_templates(id),
  
  -- Contract content
  content TEXT NOT NULL,
  rent_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  deposit_amount NUMERIC,
  
  -- Signatures
  landlord_signature TEXT,
  landlord_signed_at TIMESTAMP WITH TIME ZONE,
  landlord_ip TEXT,
  tenant_signature TEXT,
  tenant_signed_at TIMESTAMP WITH TIME ZONE,
  tenant_ip TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_landlord', 'pending_tenant', 'signed', 'expired', 'cancelled')),
  
  -- Renewal
  renewal_reminder_sent BOOLEAN DEFAULT false,
  renewal_reminder_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Contract templates policies (anyone can view active templates)
CREATE POLICY "Anyone can view active templates" 
ON public.contract_templates 
FOR SELECT 
USING (is_active = true);

-- Contracts policies
CREATE POLICY "Landlords can view own contracts" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view own contracts" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can create contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can sign contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = tenant_id AND status = 'pending_tenant');

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for Portugal, Spain, France
INSERT INTO public.contract_templates (country_code, country_name, title, content) VALUES
('PT', 'Portugal', 'Contrato de Arrendamento Habitacional', 
'CONTRATO DE ARRENDAMENTO HABITACIONAL

Entre:

PRIMEIRO OUTORGANTE (Senhorio):
Nome: {{landlord_name}}
Email: {{landlord_email}}
Telefone: {{landlord_phone}}

SEGUNDO OUTORGANTE (Arrendatário):
Nome: {{tenant_name}}
Email: {{tenant_email}}

IMÓVEL:
Morada: {{property_address}}
Tipologia: {{property_type}}

CONDIÇÕES:
1. O presente contrato tem início em {{start_date}} e termo em {{end_date}}.
2. A renda mensal é de {{rent_amount}}€, pagável até ao dia 8 de cada mês.
3. O depósito de garantia é de {{deposit_amount}}€, equivalente a {{deposit_months}} meses de renda.
4. Animais de estimação: {{pets_allowed}}
5. Fumadores: {{smoking_allowed}}

CLÁUSULAS GERAIS:
- O arrendatário obriga-se a manter o imóvel em bom estado de conservação.
- Qualquer alteração ao imóvel carece de autorização prévia do senhorio.
- O presente contrato é regido pela Lei do Arrendamento Urbano (Lei n.º 6/2006).

Assinado digitalmente em {{signature_date}}'),

('ES', 'España', 'Contrato de Arrendamiento de Vivienda',
'CONTRATO DE ARRENDAMIENTO DE VIVIENDA

Entre:

ARRENDADOR:
Nombre: {{landlord_name}}
Email: {{landlord_email}}
Teléfono: {{landlord_phone}}

ARRENDATARIO:
Nombre: {{tenant_name}}
Email: {{tenant_email}}

INMUEBLE:
Dirección: {{property_address}}
Tipo: {{property_type}}

CONDICIONES:
1. El presente contrato tiene inicio en {{start_date}} y finaliza en {{end_date}}.
2. La renta mensual es de {{rent_amount}}€, pagadera antes del día 5 de cada mes.
3. La fianza es de {{deposit_amount}}€, equivalente a {{deposit_months}} mensualidades.
4. Mascotas: {{pets_allowed}}
5. Fumadores: {{smoking_allowed}}

CLÁUSULAS GENERALES:
- El arrendatario se obliga a mantener la vivienda en buen estado.
- Cualquier modificación requiere autorización previa del arrendador.
- Este contrato se rige por la Ley de Arrendamientos Urbanos (LAU).

Firmado digitalmente en {{signature_date}}'),

('FR', 'France', 'Contrat de Location',
'CONTRAT DE LOCATION

Entre:

BAILLEUR:
Nom: {{landlord_name}}
Email: {{landlord_email}}
Téléphone: {{landlord_phone}}

LOCATAIRE:
Nom: {{tenant_name}}
Email: {{tenant_email}}

BIEN IMMOBILIER:
Adresse: {{property_address}}
Type: {{property_type}}

CONDITIONS:
1. Le présent contrat prend effet le {{start_date}} et se termine le {{end_date}}.
2. Le loyer mensuel est de {{rent_amount}}€, payable avant le 5 de chaque mois.
3. Le dépôt de garantie est de {{deposit_amount}}€, soit {{deposit_months}} mois de loyer.
4. Animaux: {{pets_allowed}}
5. Fumeurs: {{smoking_allowed}}

CLAUSES GÉNÉRALES:
- Le locataire s''engage à maintenir le logement en bon état.
- Toute modification nécessite l''accord préalable du bailleur.
- Ce contrat est régi par la loi du 6 juillet 1989.

Signé numériquement le {{signature_date}}'),

('EN', 'United Kingdom', 'Assured Shorthold Tenancy Agreement',
'ASSURED SHORTHOLD TENANCY AGREEMENT

Between:

LANDLORD:
Name: {{landlord_name}}
Email: {{landlord_email}}
Phone: {{landlord_phone}}

TENANT:
Name: {{tenant_name}}
Email: {{tenant_email}}

PROPERTY:
Address: {{property_address}}
Type: {{property_type}}

TERMS:
1. This tenancy begins on {{start_date}} and ends on {{end_date}}.
2. The monthly rent is £{{rent_amount}}, payable on or before the 1st of each month.
3. The security deposit is £{{deposit_amount}}, equivalent to {{deposit_months}} months rent.
4. Pets: {{pets_allowed}}
5. Smoking: {{smoking_allowed}}

GENERAL CLAUSES:
- The tenant agrees to maintain the property in good condition.
- Any modifications require prior written consent from the landlord.
- This agreement is governed by the Housing Act 1988.

Digitally signed on {{signature_date}}');