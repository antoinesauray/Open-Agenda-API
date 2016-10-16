
--
--  Providers
--
CREATE TABLE providers (
    provider varchar primary key,
    name varchar,
    image varchar,
    primary_color character varying(7) default '#FFFFFF',
    accent_color character varying(7) default '#FFFFFF',
    host varchar,
    database varchar unique,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);
ALTER TABLE providers OWNER TO edt_owner;
GRANT SELECT ON providers to edt_limited;

INSERT INTO providers VALUES ('edt', 'EDT', 'http://api.smart-edt.com/static/ic_launcher-web.png', '#004d40', '#004d40', '127.0.0.1', 'edt', NOW(), NOW());

--
--  Users
--
CREATE TABLE users (
    edt_id bigint primary key,
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
ALTER TABLE users OWNER TO edt_owner;
CREATE SEQUENCE users_edt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE users_edt_id_seq OWNER TO edt_owner;
ALTER SEQUENCE users_edt_id_seq OWNED BY users.edt_id;
ALTER TABLE users ALTER COLUMN edt_id SET DEFAULT nextval('users_edt_id_seq');
--
--  User Agendas
--
CREATE TABLE user_agendas (
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer NOT NULL,
    agenda_id integer NOT NULL,
    provider varchar references providers(provider)
);

ALTER TABLE user_agendas OWNER TO edt_owner;
ALTER TABLE ONLY user_agendas ADD CONSTRAINT user_agendas_pkey PRIMARY KEY (agenda_id, provider);

--
--  Entities
--
CREATE TABLE entities (
    id character varying(20) NOT NULL,
    name character varying(255),
    public boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agenda_type_id character varying(20),
    more jsonb
);
ALTER TABLE entities OWNER TO edt_owner;
ALTER TABLE ONLY entities ADD CONSTRAINT entities_pkey PRIMARY KEY (id);

--
--  Event Types
--
CREATE TABLE event_types (
    id character varying(20) NOT NULL,
    color_light character varying(7),
    color_dark character varying(7),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE event_types OWNER TO edt_owner;
ALTER TABLE ONLY event_types ADD CONSTRAINT event_types_pkey PRIMARY KEY (id);

INSERT INTO event_types VALUES ('td', '#FFAAAA', '#FFAAAA', NOW(), NOW());
INSERT INTO event_types VALUES ('cm', '#FFFFAA', '#FFFFAA', NOW(), NOW());
INSERT INTO event_types VALUES ('tp', '#FF99FF', '#FF99FF', NOW(), NOW());
INSERT INTO event_types VALUES ('exam', '#FF5555', '#FF5555', NOW(), NOW());
INSERT INTO event_types VALUES ('other', '#CCBBCC', '#CCBBCC', NOW(), NOW());
INSERT INTO event_types VALUES ('ctd', '#FFEE66', '#FFEE66', NOW(), NOW());

INSERT INTO event_types VALUES ('me', '#CCBBCC', '#CCBBCC', NOW(), NOW());
INSERT INTO event_types VALUES ('facebook', '#CCBBCC', '#CCBBCC', NOW(), NOW());

--
--  Agenda Types
--
CREATE TABLE agenda_types (
    id character varying(20) NOT NULL,
    public boolean DEFAULT false,
    image varchar,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);
ALTER TABLE agenda_types OWNER TO edt_owner;
ALTER TABLE ONLY agenda_types ADD CONSTRAINT agenda_types_pkey PRIMARY KEY (id);

INSERT INTO agenda_types VALUES('personal', true, NOW(), NOW());
INSERT INTO agenda_types VALUES('facebook', true, NOW(), NOW());

--
--  Agendas
--
CREATE TABLE agendas (
    id integer NOT NULL,
    name character varying(255),
    editable boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agenda_entity_id character varying(20) references entities(id),
    agenda_type_id character varying(20) references agenda_types(id),
    more jsonb,
    active boolean DEFAULT true
);
ALTER TABLE agendas OWNER TO edt_owner;
CREATE SEQUENCE agendas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE agendas_id_seq OWNER TO edt_owner;
ALTER SEQUENCE agendas_id_seq OWNED BY agendas.id;
ALTER TABLE ONLY agendas ALTER COLUMN id SET DEFAULT nextval('agendas_id_seq'::regclass);
ALTER TABLE ONLY agendas ADD CONSTRAINT agendas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY agendas ADD CONSTRAINT agendas_agenda_entity_id_fkey FOREIGN KEY (agenda_entity_id) REFERENCES entities(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
--  Agenda Events
--
CREATE TABLE agenda_events (
    id integer NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    name character varying(255),
    more jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    event_type_id character varying(20) references event_types(id),
    agenda_id integer references agendas(id)
);
ALTER TABLE agenda_events OWNER TO edt_owner;
CREATE SEQUENCE agenda_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE agenda_events_id_seq OWNER TO edt_owner;
ALTER SEQUENCE agenda_events_id_seq OWNED BY agenda_events.id;
CREATE UNIQUE INDEX facebook_id ON agenda_events USING btree (((more ->> 'facebook_id'::text)));

ALTER TABLE ONLY agenda_events ALTER COLUMN id SET DEFAULT nextval('agenda_events_id_seq'::regclass);
ALTER TABLE ONLY agenda_events ADD CONSTRAINT agenda_events_pkey PRIMARY KEY (id);
