
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


ALTER FUNCTION public.checkagendaiseditable() OWNER TO postgres;

CREATE TRIGGER insert_user_event BEFORE INSERT ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditable();
CREATE TRIGGER delete_user_event BEFORE DELETE ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditable();
CREATE TRIGGER update_user_event BEFORE UPDATE ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditable();
