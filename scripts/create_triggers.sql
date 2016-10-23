CREATE FUNCTION checkagendaiseditable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE editable BOOLEAN;
    BEGIN
        SELECT agendas.editable FROM agendas WHERE id=NEW.agenda_id INTO editable;
        IF editable=false AND current_user = 'edt_limited' THEN
            RAISE EXCEPTION 'Not allowed to edit events on non editable agendas';
        END IF;
        RETURN NEW;
    END;
$$;

CREATE FUNCTION checkagendaiseditableBefore() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE editable BOOLEAN;
    BEGIN
        SELECT agendas.editable FROM agendas WHERE id=OLD.agenda_id INTO editable;
        IF editable=false AND current_user = 'edt_limited' THEN
            RAISE EXCEPTION 'Not allowed to edit events on non editable agendas';
        END IF;
        RETURN NEW;
    END;
$$;


ALTER FUNCTION public.checkagendaiseditable() OWNER TO postgres;

--
-- Name: insertuseragenda(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION insertuseragenda() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE agenda_id INTEGER;
    BEGIN
        INSERT INTO entities(id, name, public, updated_at, created_at, agenda_type_id) VALUES (NEW.edt_id, CONCAT(NEW.first_name,' ',NEW.last_name), false, current_timestamp, current_timestamp, 'personal');

        INSERT INTO agendas(name, editable, updated_at, created_at, agenda_entity_id, agenda_type_id) VALUES ('Facebook', false, 'NOW()', 'NOW()', NEW.edt_id, 'facebook') RETURNING id INTO agenda_id;
        INSERT INTO user_agendas(provider, user_id, agenda_id, updated_at, created_at) VALUES ('edt', NEW.edt_id, agenda_id, current_timestamp, current_timestamp);

        INSERT INTO agendas(name, editable, updated_at, created_at, agenda_entity_id, agenda_type_id) VALUES ('Personnel', true, 'NOW()', 'NOW()', NEW.edt_id, 'personal') RETURNING id INTO agenda_id;
        INSERT INTO user_agendas(provider, user_id, agenda_id, updated_at, created_at) VALUES ('edt', NEW.edt_id, agenda_id, current_timestamp, current_timestamp);
        RETURN NEW;
    END;
$$;


ALTER FUNCTION public.insertuseragenda() OWNER TO postgres;


CREATE TRIGGER user_agenda AFTER INSERT ON users FOR EACH ROW EXECUTE PROCEDURE insertuseragenda();
CREATE TRIGGER user_event_insert BEFORE INSERT ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditable();
CREATE TRIGGER user_event_delete BEFORE DELETE ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditableBefore();
CREATE TRIGGER user_event_update BEFORE UPDATE ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditableBefore();
