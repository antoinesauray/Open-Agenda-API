CREATE TABLE entities (
    id character varying(20) NOT NULL,
    name character varying(255),
    image varchar,
    public boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agenda_type_id character varying(20),
    more jsonb
);
ALTER TABLE entities OWNER TO edt_owner;
ALTER TABLE ONLY entities ADD CONSTRAINT entities_pkey PRIMARY KEY (id);

INSERT INTO entities VALUES ('1', 'UFR Médecine/Pharmacie', true, NOW(), NOW(), '0', '{"url": "https://edt.univ-nantes.fr/medecine/"}');

INSERT INTO entities VALUES ('2', 'Polytech Nantes', true, NOW(), NOW(), '0', '{"url": "https://edt.univ-nantes.fr/medecine/"}', 'http://api.smart-edt.fr/static/provider_polytech-web.png');

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
INSERT INTO event_types VALUES ('cm', '#4CAF50', '#388E3C', NOW(), NOW());
INSERT INTO event_types VALUES ('tp', '#FFC107', '#FFA000', NOW(), NOW());
INSERT INTO event_types VALUES ('exam', '#F44336', '#D32F2F', NOW(), NOW());
INSERT INTO event_types VALUES ('other', '#607D8B', '#455A64', NOW(), NOW());
INSERT INTO event_types VALUES ('ctd', '#FFEE66', '#FFEE66', NOW(), NOW());

INSERT INTO event_types VALUES ('me', '#009688', '#00796B', NOW(), NOW());
INSERT INTO event_types VALUES ('facebook', '#3b5998', '#2f4779', NOW(), NOW());

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

INSERT INTO agenda_types VALUES('personal', null, true, NOW(), NOW());
INSERT INTO agenda_types VALUES('facebook', null, true, NOW(), NOW());
INSERT INTO agenda_types VALUES('0', true, null, NOW(), NOW());

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

ALTER TABLE ONLY agenda_events ALTER COLUMN id SET DEFAULT nextval('agenda_events_id_seq'::regclass);
ALTER TABLE ONLY agenda_events ADD CONSTRAINT agenda_events_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX facebook_id ON agenda_events USING btree (((more ->> 'facebook_id'::text)));
