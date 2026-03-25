CREATE TABLE t_p13776910_data_analytics_solut.yookassa_payments_new (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p13776910_data_analytics_solut.users(id),
    wallet_id INTEGER REFERENCES t_p13776910_data_analytics_solut.wallets(id),
    order_id INTEGER REFERENCES t_p13776910_data_analytics_solut.orders(id),
    payment_id VARCHAR(64) NOT NULL UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    description TEXT,
    confirmation_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p13776910_data_analytics_solut.yookassa_payments_new
    (id, user_id, wallet_id, order_id, payment_id, amount, status, description, confirmation_url, created_at, updated_at)
SELECT
    id, user_id, wallet_id, order_id, payment_id, amount, status, description, confirmation_url, created_at, updated_at
FROM t_p13776910_data_analytics_solut.yookassa_payments;

ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments RENAME TO yookassa_payments_backup;
ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments_new RENAME TO yookassa_payments;

SELECT setval(
    't_p13776910_data_analytics_solut.yookassa_payments_id_seq',
    (SELECT COALESCE(MAX(id), 1) FROM t_p13776910_data_analytics_solut.yookassa_payments)
);