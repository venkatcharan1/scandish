-- Add open_time and close_time to the shops table
ALTER TABLE public.shops
ADD COLUMN open_time TEXT,
ADD COLUMN close_time TEXT;

-- Add mrp, offer_price, quantity_description, and stock_status to the products table
-- Note: 'product_stock_status' is an ENUM type. We need to create it first if it doesn't exist.
-- If you already have a 'stock_status' column with different types, you might need to adjust.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_stock_status') THEN
        CREATE TYPE public.product_stock_status AS ENUM ('available', 'limited_stock', 'out_of_stock');
    END IF;
END $$;

ALTER TABLE public.products
ADD COLUMN mrp NUMERIC,
ADD COLUMN offer_price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN quantity_description TEXT,
ADD COLUMN stock_status public.product_stock_status NOT NULL DEFAULT 'available';

-- Update existing products to have a default offer_price if it's null
UPDATE public.products
SET offer_price = price
WHERE offer_price IS NULL;
