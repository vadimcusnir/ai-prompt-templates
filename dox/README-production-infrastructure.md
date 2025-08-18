# 🏗️ Production Infrastructure - AI-PROMPT-TEMPLATES

## 📋 Overview

Implementarea completă a infrastructurii de producție pentru AI-PROMPT-TEMPLATES. Include Stripe event logging, delete guards, soft-delete system, și rate limiting granular.

## 🚀 Migration Order

Rulează migrările în această ordine:

1. **18_stripe_events_dlq.sql** - Stripe event logging + DLQ (deja implementat)
2. **23_neuron_delete_guard.sql** - Delete guards + soft-delete
3. **26_rate_limit.sql** - Rate limiting cu Token Bucket

## 💳 Stripe Event Logging + DLQ

### Architecture Overview

#### Event Flow
```
Stripe Webhook → stripe_events → consume_stripe_event → Business Logic
                    ↓
            webhook_failures (DLQ)
                    ↓
            reprocess_stripe_event
```

#### Tables Structure

##### stripe_events
```sql
CREATE TABLE public.stripe_events (
  id           text PRIMARY KEY,           -- Stripe event.id
  type         text NOT NULL,              -- Event type
  payload      jsonb NOT NULL,             -- Full event payload
  status       text NOT NULL DEFAULT 'pending', -- pending/ok/error
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,                -- When processing completed
  error        text                        -- Error message if failed
);
```

##### webhook_failures
```sql
CREATE TABLE public.webhook_failures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text NOT NULL,           -- Stripe event.id
  failure_count   int NOT NULL DEFAULT 1,  -- Retry attempts
  last_failure    timestamptz NOT NULL DEFAULT now(),
  error_message   text NOT NULL,           -- Why it failed
  next_retry      timestamptz,             -- When to retry
  max_retries     int NOT NULL DEFAULT 3   -- Max retry attempts
);
```

### Supported Events

#### One-off Purchases
- `checkout.session.completed` - Primary event for purchases
- `payment_intent.succeeded` - Fallback for direct payments

#### Subscriptions
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Successful billing
- `invoice.payment_failed` - Failed billing

### Webhook Handler

#### Main Processing Function
```sql
-- Process Stripe event
SELECT public.consume_stripe_event(event_id, event_type, payload);

-- Reprocess failed event
SELECT public.reprocess_stripe_event(event_id);
```

#### Idempotency
- **Event Level**: Pe `event.id` (Stripe garantat unic)
- **Payment Level**: Pe `payment_intent` pentru one-off
- **Subscription Level**: Pe `subscription.id` pentru recurring

### Dead Letter Queue (DLQ)

#### Failure Handling
1. **Automatic Retry**: 3 încercări cu backoff exponențial
2. **Manual Reprocessing**: Admin poate reprocesa evenimente eșuate
3. **Alerting**: Notificări pentru evenimente care eșuează constant

#### Cleanup
- **Events**: 90+ zile → cleanup automat
- **Failures**: 30+ zile → cleanup automat

## 🛡️ Delete Guards + Soft-Delete

### Architecture Overview

#### Soft-Delete Flow
```
User Request → Delete Guard Check → Soft-Delete → Restore Option
                    ↓
            Hard-Delete (90+ days)
```

#### Soft-Delete Columns
```sql
-- Added to critical tables
ALTER TABLE public.neurons ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.neurons ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
ALTER TABLE public.neurons ADD COLUMN deletion_reason text;
```

### Delete Guards

#### Neuron Delete Guard
```sql
-- Check if neuron can be deleted
SELECT * FROM public.f_can_delete_neuron('neuron-uuid-here');

-- Returns:
-- can_delete: boolean
-- reason: text explanation
-- active_bundles: array of bundle names
-- active_subscriptions: count of active subscriptions
```

#### Bundle Delete Guard
```sql
-- Check if bundle can be deleted
SELECT * FROM public.f_can_delete_bundle('bundle-uuid-here');

-- Returns:
-- can_delete: boolean
-- reason: text explanation
-- active_subscriptions: count of active subscriptions
```

### Soft-Delete Functions

#### Soft-Delete Operations
```sql
-- Soft-delete neuron
SELECT public.f_soft_delete_neuron('neuron-uuid-here', 'Content outdated');

-- Soft-delete bundle
SELECT public.f_soft_delete_bundle('bundle-uuid-here', 'Bundle deprecated');

-- Restore neuron
SELECT public.f_restore_neuron('neuron-uuid-here');

-- Restore bundle
SELECT public.f_restore_bundle('bundle-uuid-here');
```

#### Hard-Delete Operations
```sql
-- Hard-delete (only after soft-delete + 90 days)
SELECT public.f_hard_delete_neuron('neuron-uuid-here');
```

### Cleanup Automation

#### Automatic Cleanup
```sql
-- Cleanup old deleted data (90+ days)
SELECT * FROM public.f_cleanup_old_deleted_data();

-- Returns cleanup summary:
-- table_name: which table was cleaned
-- deleted_count: how many records were removed
-- cleanup_date: when cleanup was performed
```

### Admin Views

#### Deleted Content Views
```sql
-- View deleted neurons
SELECT * FROM public.v_neurons_deleted;

-- View deleted bundles
SELECT * FROM public.v_bundles_deleted;
```

#### RLS Protection
- **Public Access**: Only `deleted_at IS NULL` content
- **Admin Access**: Full visibility including deleted content
- **Restore Capability**: Only admins can restore deleted content

## 🚦 Rate Limiting

### Architecture Overview

#### Token Bucket Algorithm
```
User Request → Check Bucket → Consume Tokens → Allow/Block
                    ↓
            Refill Rate: tokens_per_minute
            Burst Size: maximum_tokens
```

#### Rate Limit Configuration
```sql
-- Default configuration
INSERT INTO public.rate_limit_config VALUES
  ('search', 60, 120, 1),           -- 60 req/min, burst 120
  ('content_access', 30, 60, 1),    -- 30 req/min, burst 60
  ('admin_crud', 100, 200, 1),      -- 100 req/min, burst 200
  ('stripe_webhook', 1000, 2000, 1), -- 1000 req/min, burst 2000
  ('user_auth', 10, 20, 1),         -- 10 req/min, burst 20
  ('api_general', 120, 240, 1);     -- 120 req/min, burst 240
```

### Rate Limit Functions

#### Main Rate Limit Check
```sql
-- Check rate limit for any endpoint
SELECT * FROM public.f_check_rate_limit('search', 1, 'user-uuid-here');

-- Returns:
-- allowed: boolean
-- tokens_remaining: int
-- reset_time: timestamptz
-- reason: text
```

#### Endpoint-Specific Functions
```sql
-- Rate limit for search
SELECT public.f_rate_limit_search('user-uuid-here');

-- Rate limit for content access
SELECT public.f_rate_limit_content_access('user-uuid-here');

-- Rate limit for admin operations
SELECT public.f_rate_limit_admin_crud('user-uuid-here');
```

### Rate Limit Monitoring

#### Dashboard Views
```sql
-- Rate limit overview
SELECT * FROM public.v_rate_limit_dashboard;

-- Top users by rate limiting
SELECT * FROM public.v_rate_limit_top_users;
```

#### Metrics Available
- **Active Buckets**: How many users have active rate limit buckets
- **Requests Last Hour**: Total requests in the last hour
- **Blocked Last Hour**: How many requests were blocked
- **Block Rate**: Percentage of blocked requests
- **Top Users**: Users with highest request volumes

### Cleanup & Maintenance

#### Automatic Cleanup
```sql
-- Cleanup old rate limit data
SELECT * FROM public.f_cleanup_rate_limit_data();

-- Cleanup schedule:
-- rate_limit_log: 7+ days old
-- rate_limit_buckets: 30+ days inactive
```

## 🔧 Integration Examples

### Frontend Integration

#### Search with Rate Limiting
```typescript
// search.ts
export async function searchNeurons(q: string, limit = 20, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Rate limit check
  const { data: rateLimit } = await supabase.rpc('f_rate_limit_search', {
    p_user_id: user?.id || null
  });
  
  if (!rateLimit) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Proceed with search
  return supabase.rpc('rpc_search_neurons', { 
    p_q: q, p_limit: limit, p_offset: offset 
  });
}
```

#### Content Access with Rate Limiting
```typescript
// content.ts
export async function getNeuronContent(neuronId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Rate limit check
  const { data: rateLimit } = await supabase.rpc('f_rate_limit_content_access', {
    p_user_id: user?.id || null
  });
  
  if (!rateLimit) {
    throw new Error('Content access rate limit exceeded.');
  }
  
  // Get content
  return supabase.rpc('rpc_get_neuron_full', { p_neuron_id: neuronId });
}
```

### Admin Operations

#### Soft-Delete Content
```typescript
// admin.ts
export async function softDeleteNeuron(neuronId: string, reason: string) {
  const { data, error } = await supabase.rpc('f_soft_delete_neuron', {
    p_neuron_id: neuronId,
    p_reason: reason
  });
  
  if (error) throw error;
  return data;
}
```

#### Rate Limit Monitoring
```typescript
// admin-monitoring.ts
export async function getRateLimitDashboard() {
  return supabase.from('v_rate_limit_dashboard').select('*');
}

export async function getTopRateLimitUsers() {
  return supabase.from('v_rate_limit_top_users').select('*');
}
```

## 🧪 Testing

### Running Tests
```bash
# Connect to Supabase
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Run production infrastructure tests
\i scripts/test-production-infrastructure.sql
```

### Test Categories
1. **Stripe Events** - Webhook processing, DLQ functionality
2. **Delete Guards** - Soft-delete, restore, hard-delete
3. **Rate Limiting** - Token bucket algorithm, monitoring
4. **Integration** - End-to-end workflows
5. **Performance** - Rate limit overhead, cleanup efficiency

## 🔒 Security Features

### RLS Policies
- **Stripe Events**: Admin-only access
- **Rate Limit Config**: Admin-only access
- **Rate Limit Buckets**: User sees only own buckets
- **Rate Limit Log**: User sees only own logs

### Admin Controls
- **Soft-Delete**: Only admins can soft-delete content
- **Restore**: Only admins can restore deleted content
- **Hard-Delete**: Only admins can permanently remove content
- **Rate Limit Config**: Only admins can modify rate limits

### Audit Trail
- **Deletion History**: Who deleted what and when
- **Rate Limit Log**: Complete request history
- **Stripe Events**: Full webhook processing history

## 📊 Performance Metrics

### Expected Performance
- **Rate Limit Check**: <5ms per request
- **Soft-Delete**: <10ms per operation
- **Delete Guard Check**: <15ms per check
- **Stripe Event Processing**: <50ms per event

### Monitoring Queries
```sql
-- Rate limit performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.f_check_rate_limit('search', 1, 'user-uuid');

-- Soft-delete performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.f_can_delete_neuron('neuron-uuid');
```

## 🚨 Troubleshooting

### Common Issues

#### Rate Limiting Not Working
```sql
-- Check if rate limiting is active
SELECT * FROM public.rate_limit_config WHERE is_active = true;

-- Check user buckets
SELECT * FROM public.rate_limit_buckets WHERE user_id = 'user-uuid';

-- Check rate limit logs
SELECT * FROM public.rate_limit_log WHERE user_id = 'user-uuid' ORDER BY request_timestamp DESC LIMIT 10;
```

#### Soft-Delete Issues
```sql
-- Check if content is soft-deleted
SELECT id, title, deleted_at, deletion_reason 
FROM public.neurons WHERE id = 'neuron-uuid';

-- Check delete guards
SELECT * FROM public.f_can_delete_neuron('neuron-uuid');

-- Check for active references
SELECT b.title FROM public.bundles b
JOIN public.bundle_neurons bn ON bn.bundle_id = b.id
WHERE bn.neuron_id = 'neuron-uuid' AND b.deleted_at IS NULL;
```

#### Stripe Event Issues
```sql
-- Check event status
SELECT id, type, status, error, received_at, processed_at
FROM public.stripe_events 
WHERE id = 'evt_stripe_event_id'
ORDER BY received_at DESC;

-- Check webhook failures
SELECT * FROM public.webhook_failures 
WHERE event_id = 'evt_stripe_event_id'
ORDER BY last_failure DESC;
```

## 🔧 Maintenance

### Regular Tasks
- **Stripe Events**: Cleanup events older than 90 days
- **Rate Limits**: Cleanup data older than 7 days
- **Soft-Delete**: Cleanup deleted content older than 90 days
- **Monitoring**: Review rate limit dashboards weekly

### Automated Cleanup
```sql
-- Run cleanup functions
SELECT * FROM public.f_cleanup_rate_limit_data();
SELECT * FROM public.f_cleanup_old_deleted_data();
```

### Performance Monitoring
- **Rate Limit Overhead**: Monitor impact on API response times
- **Database Growth**: Monitor table sizes and growth rates
- **Error Rates**: Monitor failed rate limit checks and soft-deletes

## 📚 References

### Documentation
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

### Related Files
- `sql/18_stripe_events_dlq.sql` - Stripe integration
- `sql/23_neuron_delete_guard.sql` - Delete guards + soft-delete
- `sql/26_rate_limit.sql` - Rate limiting system
- `scripts/test-production-infrastructure.sql` - Testing script

---

**Status**: ✅ Complete pentru production
**Last Updated**: $(date)
**Version**: 1.0.0
