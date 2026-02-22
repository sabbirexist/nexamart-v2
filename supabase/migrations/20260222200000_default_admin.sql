-- Insert default site_name setting
INSERT INTO public.site_settings (key, value)
VALUES ('site_name', 'NexaMart')
ON CONFLICT (key) DO NOTHING;

-- Note: Default admin user admin@admin.com / admin
-- is created via the /setup page after connecting your Supabase project.
-- Run /setup with email: admin@admin.com and password: admin to create the default admin.
