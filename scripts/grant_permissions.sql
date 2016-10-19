
GRANT select ON ALL TABLES IN SCHEMA public TO edt_limited;
GRANT insert ON ALL TABLES IN SCHEMA public TO edt_limited;
GRANT update ON ALL TABLES IN SCHEMA public TO edt_limited;
GRANT delete ON ALL TABLES IN SCHEMA public TO edt_limited;

GRANT select ON agendas TO edt_facebook;
GRANT insert ON agendas TO edt_facebook;
GRANT update ON agendas TO edt_facebook;

GRANT select ON agenda_events TO edt_facebook;
GRANT insert ON agenda_events TO edt_facebook;
GRANT update ON agenda_events TO edt_facebook;

GRANT select ON user_agendas TO edt_facebook;
GRANT insert ON user_agendas TO edt_facebook;
GRANT update ON user_agendas TO edt_facebook;

GRANT select ON user_agendas TO edt_facebook;
GRANT insert ON user_agendas TO edt_facebook;
GRANT update ON user_agendas TO edt_facebook;

GRANT select ON users TO edt_facebook;




GRANT SELECT,USAGE ON SEQUENCE users_edt_id_seq TO edt_limited;
GRANT SELECT,USAGE ON SEQUENCE agendas_id_seq TO edt_limited;

GRANT SELECT,USAGE ON SEQUENCE agendas_id_seq TO edt_facebook;
GRANT SELECT,USAGE ON SEQUENCE agenda_events_id_seq TO edt_facebook;

GRANT SELECT,USAGE ON SEQUENCE agenda_events_id_seq TO edt_limited;
