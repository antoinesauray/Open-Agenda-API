
// Add a personnal agenda to every new user and give him rights to add events on it
CREATE OR REPLACE FUNCTION insertUserAgenda() RETURNS TRIGGER AS $$
DECLARE agenda_id INTEGER;
    BEGIN
        INSERT INTO entities(id, name, public, updated_at, created_at, agenda_type_id) VALUES (NEW.edt_id, CONCAT(NEW.first_name,' ',NEW.last_name), false, current_timestamp, current_timestamp, 'personnal');
        INSERT INTO agendas(name, editable, updated_at, created_at, agenda_entity_id, agenda_type_id) VALUES ('Personnel', true, 'NOW()', 'NOW()', NEW.edt_id, 'personnal') RETURNING id INTO agenda_id;
        INSERT INTO user_agendas(user_id, agenda_id, updated_at, created_at) VALUES (NEW.edt_id, agenda_id, current_timestamp, current_timestamp);
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER user_agenda AFTER INSERT ON users
FOR EACH ROW EXECUTE PROCEDURE insertUserAgenda();


CREATE OR REPLACE FUNCTION checkAgendaIsEditable() RETURNS trigger AS $$
DECLARE editable BOOLEAN;
    BEGIN
        SELECT agendas.editable FROM agendas WHERE id=NEW.agenda_id INTO editable;
        IF editable=false THEN
            RAISE EXCEPTION 'Not allowed to create events on non editable agendas';
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_event BEFORE INSERT ON agenda_events
FOR EACH ROW EXECUTE PROCEDURE checkAgendaIsEditable();
