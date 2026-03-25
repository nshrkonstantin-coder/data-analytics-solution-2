ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments
    ALTER COLUMN wallet_id SET DEFAULT NULL;

UPDATE t_p13776910_data_analytics_solut.yookassa_payments SET wallet_id = NULL WHERE wallet_id IS NULL;

ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments
    ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES t_p13776910_data_analytics_solut.orders(id);