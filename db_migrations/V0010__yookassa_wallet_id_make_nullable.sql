ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments
    ADD COLUMN wallet_id_new INTEGER REFERENCES t_p13776910_data_analytics_solut.wallets(id);

UPDATE t_p13776910_data_analytics_solut.yookassa_payments
    SET wallet_id_new = wallet_id;

ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments
    RENAME COLUMN wallet_id TO wallet_id_old;

ALTER TABLE t_p13776910_data_analytics_solut.yookassa_payments
    RENAME COLUMN wallet_id_new TO wallet_id;