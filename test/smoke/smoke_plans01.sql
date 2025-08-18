-- Test PLANS-01: prețuri fără root=2 și fără Stripe IDs
-- Acest fișier ar trebui să genereze violări PLANS-01

-- Violare 1: preț lunar fără root=2 (root=6)
INSERT INTO public.plans (name, monthly_price_cents, code) 
VALUES ('Basic', 3000, 'basic');

-- Violare 2: preț anual fără root=2 (root=8)
INSERT INTO public.plans (name, annual_price_cents, code) 
VALUES ('Pro', 8000, 'pro');

-- Violare 3: preț lunar fără root=2 (root=7)
INSERT INTO public.plans (name, monthly_price_cents, code) 
VALUES ('Enterprise', 7000, 'enterprise');

-- Violare 4: plan non-free fără Stripe IDs
INSERT INTO public.plans (name, monthly_price_cents, code) 
VALUES ('Premium', 2900, 'premium'); -- root=2 dar fără Stripe

-- Violare 5: preț cu root=2 dar fără Stripe IDs
INSERT INTO public.plans (name, monthly_price_cents, annual_price_cents, code) 
VALUES ('Ultimate', 7400, 74900, 'ultimate'); -- root=2 dar fără Stripe
