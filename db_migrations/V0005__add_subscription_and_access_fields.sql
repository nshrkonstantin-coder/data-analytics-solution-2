-- Расширяем таблицу products: ссылка на сайт, срок подписки, улучшения
ALTER TABLE t_p13776910_data_analytics_solut.products
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS subscription_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS upgrades JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT TRUE;

-- Расширяем таблицу orders: данные об оплате, сроке, токене доступа
ALTER TABLE t_p13776910_data_analytics_solut.orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Индекс по токену доступа
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON t_p13776910_data_analytics_solut.orders(access_token);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON t_p13776910_data_analytics_solut.orders(expires_at);
