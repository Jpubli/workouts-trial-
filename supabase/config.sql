-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
-- Profiles table
-- Events table
-- Event registrations table
-- Ratings table
-- Functions
-- Triggers
-- Enable RLS
-- Profiles policies
-- Events policies
-- Event registrations policies
-- Política para permitir que los usuarios cancelen sus inscripciones
-- Función para validar registro único
-- Trigger para validar registro único
-- Ratings policies
-- Función para validar rating
-- Trigger para validar rating
-- Función para enviar email de confirmación
-- Trigger para enviar email al confirmar registro
-- Drop and recreate policies for event registrations
-- Create new policies
-- Tabla para mensajes de eventos
-- Tabla para mensajes de eventos (si no existe)
CREATE TABLE IF NOT EXISTS event_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  from_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  parent_id UUID REFERENCES event_messages(id)
);

-- Función para enviar notificación por email
CREATE OR REPLACE FUNCTION notify_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo enviar notificación para mensajes privados o cambios importantes
  IF NEW.type IN ('private', 'change_notification', 'cancellation') THEN
    PERFORM net.http_post(
      url := current_setting('app.smtp_webhook_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', current_setting('app.smtp_api_key')
      ),
      body := jsonb_build_object(
        'to', (
          SELECT email FROM profiles 
          WHERE id = NEW.from_id
        ),
        'subject', CASE
          WHEN NEW.type = 'private' THEN 'Nuevo mensaje privado'
          WHEN NEW.type = 'change_notification' THEN 'Cambios en el evento'
          WHEN NEW.type = 'cancellation' THEN 'Evento cancelado'
          ELSE 'Notificación del evento'
        END,
        'html', NEW.message
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para enviar notificaciones
CREATE TRIGGER notify_message_trigger
AFTER INSERT ON event_messages
FOR EACH ROW
EXECUTE FUNCTION notify_message();

-- Tabla para cambios en eventos
-- Tabla para cambios en eventos (si no existe)
CREATE TABLE IF NOT EXISTS event_changes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id),
  changes JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_instructor
    FOREIGN KEY (instructor_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- Tabla para respuestas de usuarios a cambios
-- Tabla para respuestas de usuarios a cambios (si no existe)
CREATE TABLE IF NOT EXISTS event_change_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  change_id UUID REFERENCES event_changes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  response VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- Enable RLS for new tables
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_change_responses ENABLE ROW LEVEL SECURITY;

-- Policies for event_messages
DROP POLICY IF EXISTS "View event messages" ON event_messages;
CREATE POLICY "View event messages"
ON event_messages FOR SELECT
TO authenticated
USING (
  -- Ver mensajes generales del evento
  EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.event_id = event_messages.event_id
    AND er.user_id = auth.uid()
  ) OR
  -- Ver mensajes donde soy el destinatario
  to_id = auth.uid() OR
  -- Ver mensajes donde soy el remitente
  from_id = auth.uid() OR
  -- Ver mensajes si soy el instructor
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_messages.event_id
    AND e.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create event messages" ON event_messages;
CREATE POLICY "Create event messages"
ON event_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id
    AND instructor_id = auth.uid()
  )
);

-- Policies for event_changes
DROP POLICY IF EXISTS "View event changes" ON event_changes;
CREATE POLICY "View event changes"
ON event_changes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.event_id = event_changes.event_id
    AND er.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_changes.event_id
    AND e.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create event changes" ON event_changes;
CREATE POLICY "Create event changes"
ON event_changes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id
    AND instructor_id = auth.uid()
  )
);

-- Policies for event_change_responses
DROP POLICY IF EXISTS "View change responses" ON event_change_responses;
CREATE POLICY "View change responses"
ON event_change_responses FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM event_changes ec
    JOIN events e ON e.id = ec.event_id
    WHERE ec.id = event_change_responses.change_id
    AND e.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Create change responses" ON event_change_responses;
CREATE POLICY "Create change responses"
ON event_change_responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_registrations er
    JOIN event_changes ec ON ec.event_id = er.event_id
    WHERE ec.id = change_id
    AND er.user_id = auth.uid()
  )
);

-- Función para notificar cambios en eventos
DROP FUNCTION IF EXISTS notify_event_changes() CASCADE;
CREATE FUNCTION notify_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Enviar notificación por email a todos los participantes
  INSERT INTO event_messages (
    event_id,
    instructor_id,
    message,
    type
  )
  VALUES (
    NEW.event_id,
    NEW.instructor_id,
    'El evento ha sido modificado. Por favor, revisa los cambios.',
    'change_notification'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar cambios
DROP TRIGGER IF EXISTS notify_event_changes_trigger ON event_changes;
CREATE TRIGGER notify_event_changes_trigger
AFTER INSERT ON event_changes
FOR EACH ROW
EXECUTE FUNCTION notify_event_changes();