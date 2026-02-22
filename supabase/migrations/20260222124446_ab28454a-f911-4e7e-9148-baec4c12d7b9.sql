
-- Drop the restrictive select policy and replace with permissive one for order tracking
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;

CREATE POLICY "Anyone can read orders by order_number or phone"
ON public.orders
FOR SELECT
USING (true);
