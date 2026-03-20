CREATE TABLE IF NOT EXISTS t_p13776910_data_analytics_solut.yookassa_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p13776910_data_analytics_solut.users(id),
    wallet_id INTEGER NOT NULL REFERENCES t_p13776910_data_analytics_solut.wallets(id),
    payment_id VARCHAR(64) NOT NULL UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    description TEXT,
    confirmation_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);