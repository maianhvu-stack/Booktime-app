-- Seed team members data
INSERT INTO team_members (name, role, expertise, avatar, bio, email) VALUES
  ('Sarah Chen', 'Senior Consultant', ARRAY['Strategy', 'Operations', 'Digital Transformation'], '/placeholder.svg?key=6744q', 'Specializing in digital transformation and operational excellence', 'sarah.chen@example.com'),
  ('Michael Rodriguez', 'Lead Advisor', ARRAY['Finance', 'M&A', 'Risk Management'], '/placeholder.svg?key=p865r', 'Expert in financial strategy and mergers & acquisitions', 'michael.rodriguez@example.com'),
  ('Emily Watson', 'Technology Consultant', ARRAY['Cloud Architecture', 'DevOps', 'Security'], '/placeholder.svg?key=zghe8', 'Helping organizations modernize their technology infrastructure', 'emily.watson@example.com'),
  ('David Kim', 'Business Analyst', ARRAY['Data Analytics', 'Process Optimization', 'AI/ML'], '/placeholder.svg?key=fmbm9', 'Turning data into actionable business insights', 'david.kim@example.com')
ON CONFLICT (email) DO NOTHING;
