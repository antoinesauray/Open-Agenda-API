
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('personal','NOW()','NOW()') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('university','NOW()','NOW()') RETURNING *;

INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('lifestyle','2016-09-18 17:08:04.960 +00:00','2016-09-18 17:08:04.960 +00:00') RETURNING *;

INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('university','2016-09-18 17:10:23.105 +00:00','2016-09-18 17:10:23.105 +00:00') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('lifestyle','2016-09-18 17:10:23.105 +00:00','2016-09-18 17:10:23.105 +00:00') RETURNING *;

INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('chantrery-gavy','Chantrery-Gavy','NOW()','NOW()','university') RETURNING *;
INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('univ-nantes','Université de Nantes','2016-09-18 17:09:47.192 +00:00','2016-09-18 17:09:47.192 +00:00','university') RETURNING *;
INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('soiree-nantes','Soirée à Nantes','2016-09-18 17:09:47.192 +00:00','2016-09-18 17:09:47.192 +00:00','lifestyle') RETURNING *;

INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('edt','EDT','2016-09-18 17:09:47.192 +00:00','2016-09-18 17:09:47.192 +00:00','lifestyle') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Agenda recommandé','2016-09-18 17:10:43.373 +00:00','2016-09-18 17:10:43.373 +00:00','edt','lifestyle') RETURNING *;


INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'SILR4 - G1','2016-09-18 17:10:43.373 +00:00','2016-09-18 17:10:43.373 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'SILR4 - G2','NOW()','NOW()','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'ID4','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'INFO4 - Promotion','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'License Droit','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','univ-nantes','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Master Droit','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','univ-nantes','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Soirées au Hangar','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','soiree-nantes','lifestyle') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Soirées étudiantes','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','soiree-nantes','lifestyle') RETURNING *;

INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('cm', '#4caf50', '#2e7d32', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');
INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('td', '#673ab7', '#512da8', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');
INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('me', '#4caf50', '#2e7d32', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');


INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT,'1', 'cm', '2016-09-18','08:15','10:15','Base de donnée',NULL,' { "teachers": "José Martinez", "groups":"G1, G2, G3", "rooms":"C009"} ','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '1', 'cm', '2016-09-19','10:15','15:15','Files d''attente',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '1', 'cm', '2016-09-20','10:15','15:15','Files d''attente',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;


INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '1', 'cm', '2016-09-22','10:15','15:15','Files d''attente',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '1', 'cm', '2016-09-22','10:15','15:15','Bases de données',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;


INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '2', 'td', '2016-09-23','10:15','15:15','PTrans',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '2', 'td', '2016-09-23','10:15','15:15','PTrans',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;

insert into users (first_name, last_name, mail, created_at, updated_at) values('test_fname', 'test_lname', 'mailtest', '2016-09-26 17:01:44.382+02', '2016-09-26 17:01:44.382+02');

INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT,'4', 'cm', '2016-09-18','08:15','10:15','Base de donnée',NULL,' { "teachers": "José Martinez", "groups":"G1, G2, G3", "rooms":"C009"} ','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;

INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT,'6', 'cm', '2016-09-18','08:15','10:15','Base de donnée',NULL,' { "teachers": "José Martinez", "groups":"G1, G2, G3", "rooms":"C009"} ','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
