UPDATE t_p13776910_data_analytics_solut.wallets SET balance = balance + 100, updated_at = NOW() WHERE id = 2;

INSERT INTO t_p13776910_data_analytics_solut.wallet_transactions (wallet_id, amount, type, description)
VALUES (2, 100, 'deposit', 'Пополнение через ЮКасса (ручное зачисление)');

UPDATE t_p13776910_data_analytics_solut.yookassa_payments SET status = 'succeeded', updated_at = NOW() WHERE payment_id = '3155d393-000f-5000-b000-14413126bf56';