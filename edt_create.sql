--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.4
-- Dumped by pg_dump version 9.5.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: checkagendaiseditable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION checkagendaiseditable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE editable BOOLEAN;
    BEGIN
        SELECT agendas.editable FROM agendas WHERE id=NEW.agenda_id INTO editable;
        IF editable=false THEN
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

        INSERT INTO agendas(name, editable, updated_at, created_at, agenda_entity_id, agenda_type_id) VALUES ('Facebook', true, 'NOW()', 'NOW()', NEW.edt_id, 'facebook') RETURNING id INTO agenda_id;
        INSERT INTO user_agendas(user_id, agenda_id, updated_at, created_at) VALUES (NEW.edt_id, agenda_id, current_timestamp, current_timestamp);

        INSERT INTO agendas(name, editable, updated_at, created_at, agenda_entity_id, agenda_type_id) VALUES ('Personnel', true, 'NOW()', 'NOW()', NEW.edt_id, 'personal') RETURNING id INTO agenda_id;
        INSERT INTO user_agendas(user_id, agenda_id, updated_at, created_at) VALUES (NEW.edt_id, agenda_id, current_timestamp, current_timestamp);
        RETURN NEW;
    END;
$$;


ALTER FUNCTION public.insertuseragenda() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: agenda_events; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE agenda_events (
    id integer NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    name character varying(255),
    more jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    event_type_id character varying(20),
    agenda_id integer
);


ALTER TABLE agenda_events OWNER TO edt_admin;

--
-- Name: agenda_events_id_seq; Type: SEQUENCE; Schema: public; Owner: edt_admin
--

CREATE SEQUENCE agenda_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE agenda_events_id_seq OWNER TO edt_admin;

--
-- Name: agenda_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: edt_admin
--

ALTER SEQUENCE agenda_events_id_seq OWNED BY agenda_events.id;


--
-- Name: agenda_types; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE agenda_types (
    id character varying(20) NOT NULL,
    public boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE agenda_types OWNER TO edt_admin;

--
-- Name: agendas; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE agendas (
    id integer NOT NULL,
    name character varying(255),
    image character varying(255),
    editable boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agenda_entity_id character varying(20),
    agenda_type_id character varying(20)
);


ALTER TABLE agendas OWNER TO edt_admin;

--
-- Name: agendas_id_seq; Type: SEQUENCE; Schema: public; Owner: edt_admin
--

CREATE SEQUENCE agendas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE agendas_id_seq OWNER TO edt_admin;

--
-- Name: agendas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: edt_admin
--

ALTER SEQUENCE agendas_id_seq OWNED BY agendas.id;


--
-- Name: entities; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE entities (
    id character varying(20) NOT NULL,
    name character varying(255),
    public boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agenda_type_id character varying(20)
);


ALTER TABLE entities OWNER TO edt_admin;

--
-- Name: event_types; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE event_types (
    id character varying(20) NOT NULL,
    color_light character varying(7),
    color_dark character varying(7),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE event_types OWNER TO edt_admin;

--
-- Name: user_agendas; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE user_agendas (
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer NOT NULL,
    agenda_id integer NOT NULL
);


ALTER TABLE user_agendas OWNER TO edt_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: edt_admin
--

CREATE TABLE users (
    edt_id integer NOT NULL,
    facebook_id character varying(255),
    facebook_token character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    facebook_email character varying(255),
    edt_email character varying(255),
    password character varying(255),
    salt character varying(255),
    is_validated boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE users OWNER TO edt_admin;

--
-- Name: users_edt_id_seq; Type: SEQUENCE; Schema: public; Owner: edt_admin
--

CREATE SEQUENCE users_edt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_edt_id_seq OWNER TO edt_admin;

--
-- Name: users_edt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: edt_admin
--

ALTER SEQUENCE users_edt_id_seq OWNED BY users.edt_id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agenda_events ALTER COLUMN id SET DEFAULT nextval('agenda_events_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agendas ALTER COLUMN id SET DEFAULT nextval('agendas_id_seq'::regclass);


--
-- Name: edt_id; Type: DEFAULT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY users ALTER COLUMN edt_id SET DEFAULT nextval('users_edt_id_seq'::regclass);


--
-- Name: agenda_events_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agenda_events
    ADD CONSTRAINT agenda_events_pkey PRIMARY KEY (id);


--
-- Name: agenda_types_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agenda_types
    ADD CONSTRAINT agenda_types_pkey PRIMARY KEY (id);


--
-- Name: agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agendas
    ADD CONSTRAINT agendas_pkey PRIMARY KEY (id);


--
-- Name: entities_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: event_types_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY event_types
    ADD CONSTRAINT event_types_pkey PRIMARY KEY (id);


--
-- Name: user_agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY user_agendas
    ADD CONSTRAINT user_agendas_pkey PRIMARY KEY (user_id, agenda_id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (edt_id);


--
-- Name: facebook_id; Type: INDEX; Schema: public; Owner: edt_admin
--

CREATE UNIQUE INDEX facebook_id ON agenda_events USING btree (((more ->> 'facebook_id'::text)));


--
-- Name: user_agenda; Type: TRIGGER; Schema: public; Owner: edt_admin
--

CREATE TRIGGER user_agenda AFTER INSERT ON users FOR EACH ROW EXECUTE PROCEDURE insertuseragenda();


--
-- Name: user_event; Type: TRIGGER; Schema: public; Owner: edt_admin
--

CREATE TRIGGER user_event BEFORE INSERT ON agenda_events FOR EACH ROW EXECUTE PROCEDURE checkagendaiseditable();


--
-- Name: agenda_events_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agenda_events
    ADD CONSTRAINT agenda_events_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES agendas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agenda_events_event_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agenda_events
    ADD CONSTRAINT agenda_events_event_type_id_fkey FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agendas_agenda_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agendas
    ADD CONSTRAINT agendas_agenda_entity_id_fkey FOREIGN KEY (agenda_entity_id) REFERENCES entities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agendas_agenda_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY agendas
    ADD CONSTRAINT agendas_agenda_type_id_fkey FOREIGN KEY (agenda_type_id) REFERENCES agenda_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entities_agenda_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY entities
    ADD CONSTRAINT entities_agenda_type_id_fkey FOREIGN KEY (agenda_type_id) REFERENCES agenda_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_agendas_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY user_agendas
    ADD CONSTRAINT user_agendas_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES agendas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_agendas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: edt_admin
--

ALTER TABLE ONLY user_agendas
    ADD CONSTRAINT user_agendas_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(edt_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('all','NOW()','NOW()') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('personal','NOW()','NOW()') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('facebook','NOW()','NOW()') RETURNING *;
INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('edt','EDT','NOW()','NOW()','all') RETURNING *;
INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('me', '#4caf50', '#2e7d32', NOW(), NOW());
INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('facebook', '#8b9dc3', '#3b5998', NOW(), NOW());
