-- Ensure regular customer emails remain 'customer' role
UPDATE public.profiles
SET role = 'customer'
WHERE email = 'simplei6172@gmail.com';

-- Ensure designated admin email retains 'admin' role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'anjaliworksphere@gmail.com';
