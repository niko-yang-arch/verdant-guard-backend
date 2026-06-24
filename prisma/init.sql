-- =============================================================
-- 绿植渴了 - 数据库初始化脚本
-- PostgreSQL 16+
-- 运行方式: psql -U postgres -d verdant_guard -f init.sql
-- =============================================================

-- 创建数据库（需要 superuser 权限）
-- CREATE DATABASE verdant_guard;

-- 创建用户
-- CREATE USER verdant WITH PASSWORD 'verdant_secret';
-- GRANT ALL PRIVILEGES ON DATABASE verdant_guard TO verdant;

-- =============================================================
-- 表结构
-- =============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(30) PRIMARY KEY DEFAULT cuid(),
    union_id      VARCHAR(64) UNIQUE,
    open_id       VARCHAR(64),
    phone         VARCHAR(20) UNIQUE,
    nickname      VARCHAR(100),
    avatar        VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_union_id ON users(union_id);
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 植物表
CREATE TABLE IF NOT EXISTS plants (
    id              VARCHAR(30) PRIMARY KEY DEFAULT cuid(),
    user_id         VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,
    species         VARCHAR(50) NOT NULL,
    frequency       DECIMAL(10,2) NOT NULL DEFAULT 7,
    frequency_type  VARCHAR(20) NOT NULL DEFAULT 'DAYS' CHECK (frequency_type IN ('DAYS', 'TIMES_PER_DAY')),
    frequency_value INT NOT NULL DEFAULT 7,
    image           VARCHAR(500),
    last_watered    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_created_at ON plants(created_at);

-- 浇水记录表
CREATE TABLE IF NOT EXISTS water_logs (
    id          VARCHAR(30) PRIMARY KEY DEFAULT cuid(),
    plant_id    VARCHAR(30) NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    user_id     VARCHAR(30) NOT NULL,
    watered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_plant_id ON water_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_watered_at ON water_logs(watered_at);
CREATE INDEX IF NOT EXISTS idx_water_logs_plant_watered ON water_logs(plant_id, watered_at);

-- =============================================================
-- 触发器：自动更新 updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plants_updated_at ON plants;
CREATE TRIGGER update_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 注释
-- =============================================================

COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE plants IS '植物表';
COMMENT ON TABLE water_logs IS '浇水记录表';

COMMENT ON COLUMN users.union_id IS '微信 UnionID（同一主体下唯一）';
COMMENT ON COLUMN users.open_id IS '微信 OpenID';
COMMENT ON COLUMN plants.frequency IS '基础浇水频率（天数，0.5=半天，0.1=10天）';
COMMENT ON COLUMN plants.frequency_type IS '频率类型：DAYS=每N天一次，TIMES_PER_DAY=每天N次';
COMMENT ON COLUMN plants.frequency_value IS 'UI显示用的实际数值（如7表示每7天）';
COMMENT ON COLUMN plants.last_watered IS '最后浇水时间（用于快速判断是否需要浇水）';
COMMENT ON COLUMN water_logs.user_id IS '反范式设计，加速按用户查询日历数据';
