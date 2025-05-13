-- Tabla de cartas con tono Gen Z
CREATE TABLE cartas_genz (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion TEXT,
  variables JSONB,  -- { "hashtag": "#Delulu", "emoji": "🚩" }
  tipo VARCHAR(20) NOT NULL  -- individual/dueto/grupal
);

-- Tabla de usuarios/participantes
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100),
  mesa_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de respuestas
CREATE TABLE respuestas (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  carta_id INTEGER REFERENCES cartas_genz(id),
  contenido TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de recompensas
CREATE TABLE recompensas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- playlist, pdf, filtro
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar cartas de ejemplo
INSERT INTO cartas_genz (nombre, descripcion, variables, tipo) VALUES
('El Delulu', 'Confiesa tu teoría más "delulu" que creíste borracho/a', '{"hashtag": "#DeluluIsTheSolulu", "emoji": "🌈"}', 'individual'),
('El Ghosteador VIP', 'Recrea el mensaje que enviaste a las 3 AM y luego borraste', '{"formato": "audio de WhatsApp temblando"}', 'dueto'),
('El Storytoxic', 'Crea una story fingiendo que estás en un viaje épico... pero es el Oxxo de tu colonia', '{"filtro": "Golden Hour Falso"}', 'grupal'),
('El Add to Cart', 'Confiesa la compra más random que hiciste ebrio/a en Amazon', '{"emoji": "🛒🔥"}', 'individual');

-- Función para crear tabla si no existe (para usar en el backend)
CREATE OR REPLACE FUNCTION create_cartas_table_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'cartas_genz') THEN
    CREATE TABLE cartas_genz (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL,
      descripcion TEXT,
      variables JSONB,
      tipo VARCHAR(20) NOT NULL
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
