-- ============================================================
-- UrbanReport — Schema PostgreSQL (Supabase)
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- para coordenadas geográficas (opcional)

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('citizen', 'admin');
CREATE TYPE occurrence_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
CREATE TYPE animal_type AS ENUM ('dog', 'cat', 'bird', 'other');
CREATE TYPE dengue_focus_type AS ENUM ('standing_water', 'tire', 'container', 'construction', 'other');
CREATE TYPE urban_problem_type AS ENUM (
  'pothole', 'broken_street_light', 'garbage', 'flooding',
  'broken_sidewalk', 'graffiti', 'illegal_dumping', 'other'
);

-- ============================================================
-- TABELA: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'citizen',
  phone         VARCHAR(20),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: occurrences (base comum para todas as categorias)
-- ============================================================

CREATE TABLE IF NOT EXISTS occurrences (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  category      VARCHAR(20) NOT NULL CHECK (category IN ('animal', 'dengue', 'urban')),
  title         VARCHAR(120) NOT NULL,
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1000),
  status        occurrence_status NOT NULL DEFAULT 'pending',
  latitude      DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude     DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  address       VARCHAR(300),
  reporter_name VARCHAR(100),
  reporter_email VARCHAR(255),
  reporter_phone VARCHAR(20),
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: lost_animals
-- ============================================================

CREATE TABLE IF NOT EXISTS lost_animals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurrence_id   UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  animal_type     animal_type NOT NULL,
  breed           VARCHAR(80),
  color           VARCHAR(80),
  approximate_age VARCHAR(40),
  has_collar      BOOLEAN DEFAULT FALSE,
  collar_details  VARCHAR(200),
  last_seen_date  DATE
);

-- ============================================================
-- TABELA: dengue_reports
-- ============================================================

CREATE TABLE IF NOT EXISTS dengue_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurrence_id   UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  focus_type      dengue_focus_type NOT NULL,
  property_type   VARCHAR(60),  -- residencial, comercial, terreno baldio, etc
  is_accessible   BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- TABELA: urban_problems
-- ============================================================

CREATE TABLE IF NOT EXISTS urban_problems (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurrence_id   UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  problem_type    urban_problem_type NOT NULL,
  severity        SMALLINT CHECK (severity BETWEEN 1 AND 5),
  affects_traffic BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- TABELA: images
-- ============================================================

CREATE TABLE IF NOT EXISTS images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  size_bytes    INTEGER,
  mime_type     VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_occurrences_category   ON occurrences(category);
CREATE INDEX IF NOT EXISTS idx_occurrences_status     ON occurrences(status);
CREATE INDEX IF NOT EXISTS idx_occurrences_user_id    ON occurrences(user_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_created_at ON occurrences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_occurrences_geo        ON occurrences(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_images_occurrence_id   ON images(occurrence_id);

-- ============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_occurrences_updated_at
  BEFORE UPDATE ON occurrences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEW: occurrences_full (facilita queries do frontend)
-- ============================================================

CREATE OR REPLACE VIEW occurrences_full AS
SELECT
  o.*,
  u.name        AS user_name,
  u.email       AS user_email,
  -- animal
  la.animal_type, la.breed, la.color, la.approximate_age,
  la.has_collar, la.collar_details, la.last_seen_date,
  -- dengue
  dr.focus_type, dr.property_type, dr.is_accessible,
  -- urban
  up.problem_type, up.severity, up.affects_traffic,
  -- images (aggregado como JSON)
  COALESCE(
    json_agg(
      json_build_object('id', img.id, 'url', img.url, 'filename', img.filename)
    ) FILTER (WHERE img.id IS NOT NULL),
    '[]'::json
  ) AS images
FROM occurrences o
LEFT JOIN users u         ON o.user_id = u.id
LEFT JOIN lost_animals la ON la.occurrence_id = o.id
LEFT JOIN dengue_reports dr ON dr.occurrence_id = o.id
LEFT JOIN urban_problems up ON up.occurrence_id = o.id
LEFT JOIN images img      ON img.occurrence_id = o.id
GROUP BY
  o.id, u.name, u.email,
  la.animal_type, la.breed, la.color, la.approximate_age,
  la.has_collar, la.collar_details, la.last_seen_date,
  dr.focus_type, dr.property_type, dr.is_accessible,
  up.problem_type, up.severity, up.affects_traffic;

-- ============================================================
-- DADOS INICIAIS: admin padrão
-- Senha: Admin@1234  (bcrypt hash gerado pelo backend)
-- ATENÇÃO: altere a senha após o primeiro login!
-- ============================================================

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@urbanreport.com',
  '$2b$12$placeholder_hash_change_on_first_run',
  'admin'
) ON CONFLICT (email) DO NOTHING;
