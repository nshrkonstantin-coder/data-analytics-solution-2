CREATE TABLE IF NOT EXISTS t_p13776910_data_analytics_solut.portfolio_projects (
    id SERIAL PRIMARY KEY,
    category VARCHAR(200) NOT NULL DEFAULT '',
    name VARCHAR(300) NOT NULL DEFAULT '',
    tech VARCHAR(300) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    is_large BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p13776910_data_analytics_solut.portfolio_projects (category, name, tech, image_url, is_large, sort_order)
VALUES
    ('Веб-приложение', 'Система управления автопарком AutoFleet Pro', 'React / Node.js / PostgreSQL', '', TRUE, 1),
    ('Корпоративный сайт', 'Портал для логистической компании', 'Vue.js / Laravel', '', FALSE, 2);
