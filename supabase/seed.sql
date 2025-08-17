-- 🌱 SEED DATA pentru AI-PROMPT-TEMPLATES
-- Populează baza cu date de test

-- 1. Popularea cognitive_frameworks cu exemple
INSERT INTO cognitive_frameworks (
  title, 
  slug, 
  cognitive_category, 
  difficulty_tier, 
  required_tier, 
  cognitive_depth_score, 
  pattern_complexity, 
  context_frame, 
  required_inputs, 
  protocol_steps, 
  antipatterns, 
  rapid_test, 
  extensions, 
  meaning_layers, 
  anti_surface_features, 
  use_cases, 
  pricing_tier, 
  base_price_cents
) VALUES 
(
  'Chain of Thought Prompting',
  'chain-of-thought-prompting',
  'Reasoning',
  'Intermediate',
  'free',
  6,
  3,
  'Problem solving and logical reasoning',
  '["problem_description", "step_by_step_thinking", "final_answer"]',
  '["1. Break down the problem", "2. Think step by step", "3. Show your work", "4. Arrive at conclusion"]',
  '["jumping_to_conclusion", "skipping_steps", "assumptions"]',
  'Ask AI to solve: "If I have 3 apples and give away 2, how many do I have left?"',
  '["tree_of_thoughts", "self_consistency", "least_to_most"]',
  '["logical_flow", "transparency", "verifiability"]',
  '["surface_answers", "black_box_reasoning"]',
  '["mathematics", "logic_puzzles", "decision_making"]',
  'free',
  0
),
(
  'Few-Shot Learning Framework',
  'few-shot-learning-framework',
  'Learning',
  'Advanced',
  'architect',
  8,
  4,
  'Teaching AI new tasks with minimal examples',
  '["task_description", "example_pairs", "test_case"]',
  '["1. Define the task clearly", "2. Provide 2-3 examples", "3. Test with new input", "4. Iterate if needed"]',
  '["too_many_examples", "unclear_task", "inconsistent_format"]',
  'Create a classifier for sentiment analysis with 3 examples',
  '["zero_shot", "one_shot", "meta_learning"]',
  '["pattern_recognition", "generalization", "efficiency"]',
  '["overfitting", "memorization"]',
  '["classification", "translation", "summarization"]',
  'architect',
  2900
),
(
  'System Prompt Engineering',
  'system-prompt-engineering',
  'Architecture',
  'Expert',
  'initiate',
  9,
  5,
  'Designing robust system-level AI instructions',
  '["ai_role", "constraints", "output_format", "behavior_rules"]',
  '["1. Define AI persona", "2. Set boundaries", "3. Specify format", "4. Add safety rules"]',
  '["vague_instructions", "conflicting_rules", "missing_constraints"]',
  'Design a system prompt for a helpful coding assistant',
  '["role_playing", "constraint_engineering", "safety_filters"]',
  '["clarity", "consistency", "reliability"]',
  '["ambiguous_behavior", "unsafe_outputs"]',
  '["chatbots", "assistants", "automation"]',
  'initiate',
  5900
),
(
  'Prompt Chaining Strategy',
  'prompt-chaining-strategy',
  'Workflow',
  'Intermediate',
  'architect',
  7,
  4,
  'Breaking complex tasks into sequential prompts',
  '["task_sequence", "intermediate_outputs", "final_goal"]',
  '["1. Break into steps", "2. Design intermediate prompts", "3. Chain outputs", "4. Validate results"]',
  '["circular_dependencies", "lost_context", "error_propagation"]',
  'Create a 3-step chain for content creation',
  '["parallel_chains", "conditional_chaining", "error_recovery"]',
  '["modularity", "maintainability", "debugging"]',
  '["tight_coupling", "fragile_chains"]',
  '["content_creation", "data_processing", "analysis"]',
  'architect',
  3900
),
(
  'Context Window Optimization',
  'context-window-optimization',
  'Performance',
  'Advanced',
  'elite',
  9,
  4,
  'Maximizing AI performance within token limits',
  '["context_size", "priority_content", "compression_strategy"]',
  '["1. Analyze content importance", "2. Prioritize key information", "3. Compress efficiently", "4. Test performance"]',
  '["information_loss", "context_fragmentation", "over_compression"]',
  'Optimize a 10k token context to 4k tokens',
  '["semantic_compression", "hierarchical_summarization", "dynamic_context"]',
  '["efficiency", "quality_preservation", "cost_optimization"]',
  '["degraded_quality", "lost_context"]',
  '["long_documents", "conversations", "research"]',
  'elite',
  9900
);

-- 2. Crearea unui user admin pentru testing
-- Notă: În producție, acest user ar fi creat prin procesul normal de înregistrare
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'admin@ai-prompt-templates.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User", "role": "admin"}',
  true,
  '',
  '',
  '',
  ''
);

-- 3. Crearea unui user normal pentru testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'user@ai-prompt-templates.com',
  crypt('user123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Test User", "role": "user"}',
  false,
  '',
  '',
  '',
  ''
);

-- 4. Crearea unui user cu plan architect pentru testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'architect@ai-prompt-templates.com',
  crypt('architect123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Architect User", "role": "user"}',
  false,
  '',
  '',
  '',
  ''
);

-- 5. Crearea unui user cu plan elite pentru testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'elite@ai-prompt-templates.com',
  crypt('elite123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Elite User", "role": "user"}',
  false,
  '',
  '',
  '',
  ''
);

-- 6. Crearea unui user cu plan initiate pentru testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'initiate@ai-prompt-templates.com',
  crypt('initiate123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Initiate User", "role": "user"}',
  false,
  '',
  '',
  '',
  ''
);

-- Afișează mesajul de succes
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data populat cu succes!';
  RAISE NOTICE '📧 Admin: admin@ai-prompt-templates.com / admin123';
  RAISE NOTICE '📧 User: user@ai-prompt-templates.com / user123';
  RAISE NOTICE '📧 Architect: architect@ai-prompt-templates.com / architect123';
  RAISE NOTICE '📧 Elite: elite@ai-prompt-templates.com / elite123';
  RAISE NOTICE '📧 Initiate: initiate@ai-prompt-templates.com / initiate123';
  RAISE NOTICE '🧠 Frameworks cognitive create: 5';
END $$;
