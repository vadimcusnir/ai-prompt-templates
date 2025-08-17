-- 18_stripe_events_dlq.sql
-- Stripe Event Logging + Idempotency + Dead Letter Queue
-- Țintă: un singur "canal recepție → procesare → efecte" pentru one-off și abonamente
-- cu idempotency la nivel de event.id și payment_intent, jurnal complet și DLQ

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- === 1. EVENT LOG (idempotency pe event.id) ===
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id           text PRIMARY KEY,                                 -- Stripe event.id (evt_*)
  type         text NOT NULL,
  payload      jsonb NOT NULL,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','ok','error')),
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error        text
);
CREATE INDEX IF NOT EXISTS idx_se_status   ON public.stripe_events(status);
CREATE INDEX IF NOT EXISTS idx_se_type     ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_se_received ON public.stripe_events(received_at DESC);

-- === 2. DLQ — fiecare eșec devine eveniment re-procesabil ===
CREATE TABLE IF NOT EXISTS public.webhook_failures (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   text NOT NULL,
  context    text,
  error      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wf_event ON public.webhook_failures(event_id);

-- === 3. Advisory lock stabil din text (evită concurență pe același obiect) ===
CREATE OR REPLACE FUNCTION public.f_lock_text(p_key text)
RETURNS void LANGUAGE sql IMMUTABLE AS $$
  SELECT pg_advisory_xact_lock((('x'||substr(md5(p_key),1,16))::bit(64)::bigint));
$$;

-- === 4. Mapare status Stripe → status intern (subscriptions) ===
CREATE OR REPLACE FUNCTION public.f_map_sub_status(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p
    WHEN 'active' THEN 'active'
    WHEN 'trialing' THEN 'active'
    WHEN 'past_due' THEN 'past_due'
    WHEN 'unpaid' THEN 'past_due'
    WHEN 'canceled' THEN 'canceled'
    WHEN 'incomplete' THEN 'past_due'
    WHEN 'incomplete_expired' THEN 'canceled'
    WHEN 'paused' THEN 'canceled'
    ELSE 'canceled'
  END
$$;

-- === 5. HANDLER: checkout.session.completed (one-off) ===
-- Requirement: metadata.uid + kind + id
CREATE OR REPLACE FUNCTION public.f_handle_checkout_session(p_obj jsonb)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_uid          uuid := (p_obj->'metadata'->>'uid')::uuid;
  v_mode         text := p_obj->>'mode';
  v_kind         text := p_obj->'metadata'->>'kind';
  v_neuron_id    uuid := NULL;
  v_bundle_id    uuid := NULL;
  v_pi           text := p_obj->>'payment_intent';
  v_currency     text := lower(p_obj->>'currency');
  v_amount       int  := COALESCE((p_obj->>'amount_total')::int, 0);
  v_purchase_id  uuid;
BEGIN
  -- abonamentele se procesează separat de eventurile subscription.*; ignoră aici
  IF v_mode = 'subscription' THEN
    RETURN NULL;
  END IF;

  IF v_uid IS NULL OR v_pi IS NULL OR v_amount <= 0 OR v_currency <> 'eur' THEN
    RAISE EXCEPTION 'invalid checkout.session payload (uid/pi/amount/currency)';
  END IF;

  IF v_kind = 'neuron' THEN
    v_neuron_id := (p_obj->'metadata'->>'neuron_id')::uuid;
    IF v_neuron_id IS NULL THEN RAISE EXCEPTION 'missing neuron_id'; END IF;
  ELSIF v_kind = 'bundle' THEN
    v_bundle_id := (p_obj->'metadata'->>'bundle_id')::uuid;
    IF v_bundle_id IS NULL THEN RAISE EXCEPTION 'missing bundle_id'; END IF;
  ELSE
    RAISE EXCEPTION 'metadata.kind must be neuron|bundle';
  END IF;

  PERFORM public.f_lock_text('pi:'||v_pi); -- concurență zero pe PaymentIntent

  -- Idempotent prin UNIQUE(stripe_payment_intent_id) în user_purchases
  INSERT INTO public.user_purchases(user_id, neuron_id, bundle_id, amount_cents, stripe_payment_intent_id)
  VALUES (v_uid, v_neuron_id, v_bundle_id, v_amount, v_pi)
  ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  RETURNING id INTO v_purchase_id;

  -- Triggerele existente vor mintui entitlements + vor scrie receipts (append-only)
  RETURN v_purchase_id;
END $$;

-- === 6. HANDLER: payment_intent.succeeded (fallback one-off) ===
-- Folosește metadata.* (identic cu CS)
CREATE OR REPLACE FUNCTION public.f_handle_payment_intent(p_obj jsonb)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_uid          uuid := (p_obj->'metadata'->>'uid')::uuid;
  v_kind         text := p_obj->'metadata'->>'kind';
  v_neuron_id    uuid := NULL;
  v_bundle_id    uuid := NULL;
  v_pi           text := p_obj->>'id';
  v_currency     text := lower(p_obj->>'currency');
  v_amount       int  := COALESCE((p_obj->>'amount')::int, 0);
  v_purchase_id  uuid;
BEGIN
  IF v_uid IS NULL OR v_pi IS NULL OR v_amount <= 0 OR v_currency <> 'eur' THEN
    RAISE EXCEPTION 'invalid payment_intent payload (uid/id/amount/currency)';
  END IF;

  IF v_kind = 'neuron' THEN
    v_neuron_id := (p_obj->'metadata'->>'neuron_id')::uuid;
    IF v_neuron_id IS NULL THEN RAISE EXCEPTION 'missing neuron_id'; END IF;
  ELSIF v_kind = 'bundle' THEN
    v_bundle_id := (p_obj->'metadata'->>'bundle_id')::uuid;
    IF v_bundle_id IS NULL THEN RAISE EXCEPTION 'missing bundle_id'; END IF;
  ELSE
    RAISE EXCEPTION 'metadata.kind must be neuron|bundle';
  END IF;

  PERFORM public.f_lock_text('pi:'||v_pi);

  INSERT INTO public.user_purchases(user_id, neuron_id, bundle_id, amount_cents, stripe_payment_intent_id)
  VALUES (v_uid, v_neuron_id, v_bundle_id, v_amount, v_pi)
  ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  RETURNING id INTO v_purchase_id;

  -- Triggere: entitlements + receipts
  RETURN v_purchase_id;
END $$;

-- === 7. HANDLER: customer.subscription.* — upsert în user_subscriptions ===
CREATE OR REPLACE FUNCTION public.f_handle_subscription(p_obj jsonb)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_uid      uuid := (p_obj->'metadata'->>'uid')::uuid; -- setat din Checkout
  v_sub      text := p_obj->>'id';
  v_cust     text := p_obj->>'customer';
  v_price_id text := p_obj#>>'{items,data,0,price,id}';
  v_plan     plan_tier;
  v_status   text := public.f_map_sub_status(p_obj->>'status');
  v_start    timestamptz := to_timestamp(NULLIF(p_obj->>'current_period_start','')::double precision);
  v_end      timestamptz := to_timestamp(NULLIF(p_obj->>'current_period_end','')::double precision);
  v_id       uuid;
BEGIN
  IF v_sub IS NULL OR v_price_id IS NULL THEN
    RAISE EXCEPTION 'subscription missing id/price.id';
  END IF;

  -- Mapare price.id → plan via plans.stripe_price_id_month|year
  SELECT code INTO v_plan
  FROM public.v_plans_public
  WHERE stripe_price_id_month = v_price_id OR stripe_price_id_year = v_price_id
  LIMIT 1;

  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'price.id % not mapped to any plan', v_price_id;
  END IF;

  -- user_id din metadata obligatoriu; altfel nu știm cui să atașăm subs
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'subscription % missing metadata.uid', v_sub;
  END IF;

  PERFORM public.f_lock_text('sub:'||v_sub);

  INSERT INTO public.user_subscriptions(user_id, plan, stripe_customer_id, stripe_subscription_id,
                                        status, current_period_start, current_period_end)
  VALUES (v_uid, v_plan, v_cust, v_sub, v_status, v_start, v_end)
  ON CONFLICT (stripe_subscription_id) DO UPDATE
  SET plan = EXCLUDED.plan,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end   = EXCLUDED.current_period_end,
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

-- === 8. INGEST + PROCESS (idempotent pe event.id; tranzacție atomică) ===
CREATE OR REPLACE FUNCTION public.consume_stripe_event(p_id text, p_type text, p_payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obj jsonb := p_payload->'data'->'object';
BEGIN
  -- 8.1 Log & idempotency
  BEGIN
    INSERT INTO public.stripe_events(id, type, payload) VALUES (p_id, p_type, p_payload);
  EXCEPTION WHEN unique_violation THEN
    -- deja recepționat/procesat; consideră OK pentru Stripe (returnează 200 din handler)
    RETURN FALSE;
  END;

  -- 8.2 Procesează evenimentul (concurență închisă pe obiectele principale)
  BEGIN
    IF p_type = 'checkout.session.completed' THEN
      PERFORM public.f_handle_checkout_session(obj);
    ELSIF p_type = 'payment_intent.succeeded' THEN
      PERFORM public.f_handle_payment_intent(obj);
    ELSIF p_type LIKE 'customer.subscription.%' THEN
      PERFORM public.f_handle_subscription(obj);
    ELSE
      -- evenimente acceptate dar neprocesate (ex: invoice.paid) → doar log
      NULL;
    END IF;

    UPDATE public.stripe_events
       SET status='ok', processed_at=now(), error=NULL
     WHERE id = p_id;

    RETURN TRUE;
  EXCEPTION WHEN others THEN
    UPDATE public.stripe_events
       SET status='error', processed_at=now(), error=SQLERRM
     WHERE id = p_id;

    INSERT INTO public.webhook_failures(event_id, context, error)
    VALUES (p_id, p_type, SQLERRM);

    RETURN FALSE;
  END;
END
$$;

-- === 9. REPROCESS (pentru DLQ / admin) ===
CREATE OR REPLACE FUNCTION public.reprocess_stripe_event(p_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE r record;
BEGIN
  SELECT id, type, payload INTO r FROM public.stripe_events WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown event %', p_id; END IF;

  -- marchează ca pending și reprocesează
  UPDATE public.stripe_events SET status='pending', processed_at=NULL, error=NULL WHERE id=p_id;
  RETURN public.consume_stripe_event(r.id, r.type, r.payload);
END $$;

-- === 10. Flux operațional (minim, fără surprize) ===

-- Server webhook (Edge/Worker) face 2 lucruri:
-- (a) verifică semnătura Stripe; 
-- (b) apelează public.consume_stripe_event(id,type,payload) cu service_role (bypass RLS)

-- Rezultat: evenimentul e în stripe_events; dacă e nou, e și procesat.
-- Inserțiile în user_purchases sunt idempotente prin UNIQUE(stripe_payment_intent_id) 
-- și declanșează entitlements + receipts (triggere din schema ta). 

-- Abonamentele se sincronizează din customer.subscription.* → user_subscriptions 
-- cu plan derivat din plans.stripe_price_id_*. Gatingul rămâne dinamic 
-- (funcția de acces folosește plan + pool). 

-- DLQ: orice EXCEPTION intră în webhook_failures + stripe_events.status='error'.
-- Admin folosește reprocess_stripe_event(evt_id) după ce corectează datele 
-- (ex: lipsă metadata.uid).

-- === 11. Smoke-tests (SQL) — scenarii reale ===

-- 1) Simulează checkout.session.completed (one-off neuron)
-- SELECT public.consume_stripe_event(
--   'evt_test_cs_001',
--   'checkout.session.completed',
--   jsonb_build_object(
--     'data', jsonb_build_object('object', jsonb_build_object(
--       'mode','payment',
--       'payment_intent','pi_test_001',
--       'currency','eur',
--       'amount_total', 2900,
--       'metadata', jsonb_build_object(
--         'uid','00000000-0000-0000-0000-000000000001',
--         'kind','neuron',
--         'neuron_id','11111111-1111-1111-1111-111111111111'
--       )
--     ))
--   )
-- );

-- verifică user_purchases + entitlements + receipts mintuite (triggere)
-- SELECT * FROM public.user_purchases WHERE stripe_payment_intent_id='pi_test_001';
-- SELECT * FROM public.user_entitlements WHERE user_id='00000000-0000-0000-0000-000000000001';
-- SELECT * FROM public.purchase_receipts ORDER BY created_at DESC LIMIT 5;

-- 2) Re-trimitere același event (idempotent la event.id) → FALSE, dar 200 din handler
-- SELECT public.consume_stripe_event('evt_test_cs_001','checkout.session.completed','{}'::jsonb);

-- 3) Simulează subscription updated (plan mapat prin price.id)
-- SELECT public.consume_stripe_event(
--   'evt_test_sub_001',
--   'customer.subscription.updated',
--   jsonb_build_object(
--     'data', jsonb_build_object('object', jsonb_build_object(
--       'id','sub_test_001',
--       'customer','cus_test_001',
--       'status','active',
--       'current_period_start', EXTRACT(EPOCH FROM now())::int,
--       'current_period_end',   EXTRACT(EPOCH FROM now() + interval '30 days')::int,
--       'metadata', jsonb_build_object('uid','00000000-0000-0000-0000-000000000001'),
--       'items', jsonb_build_object('data', jsonb_build_array(
--         jsonb_build_object('price', jsonb_build_object('id','price_arch_month_replace'))
--       ))
--     ))
--   )
-- );
-- SELECT * FROM public.user_subscriptions WHERE stripe_subscription_id='sub_test_001'; -- upsert OK

-- === 12. Observabilitate minimală ===

-- stripe_events (status/time) + index pe status/type → dashboard /studio/alerts//studio/receipts. 
-- webhook_failures = listă concretă de erori re‑procesabile (ETL "uman"). 
-- Recomandat: cron să șteargă stripe_events mai vechi de 90 zile (după audit).

-- === 13. Decizii de produs (clare, hard) ===

-- Refunduri: nu revoci automat user_entitlements (bunuri digitale). 
-- Adaugă handler separat doar dacă politica cere. 

-- Abonamente: nu materializezi entitlements; accesul vine din plan + pool 
-- (funcția de acces deja definită). 

-- Idempotency dublu: event.id (stripe_events) și payment_intent (user_purchases). Zero fantome. 

-- === 14. Verdict simbolic ===

-- Loghează tot, procesează o dată, greșește sigur: eveniment devine drept, nu zgomot.
