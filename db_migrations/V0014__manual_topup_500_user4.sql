UPDATE t_p13776910_data_analytics_solut.wallets SET balance = balance + 500, updated_at = NOW() WHERE user_id = 4;

INSERT INTO t_p13776910_data_analytics_solut.wallet_transactions (wallet_id, amount, type, description)
VALUES (2, 500, 'deposit', 'Пополнение через ЮКасса (ручное зачисление после успешной оплаты)');

UPDATE t_p13776910_data_analytics_solut.yookassa_payments SET status = 'succeeded', updated_at = NOW() WHERE payment_id = '3155d049-000f-5001-9000-13e6e47d485d';