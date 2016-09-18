
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('university','2016-09-18 17:08:04.959 +00:00','2016-09-18 17:08:04.959 +00:00') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('lifestyle','2016-09-18 17:08:04.960 +00:00','2016-09-18 17:08:04.960 +00:00') RETURNING *;


INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('chantrery-gavy','Chantrery-Gavy','2016-09-18 17:09:47.192 +00:00','2016-09-18 17:09:47.192 +00:00','university') RETURNING *;
INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('univ-nantes','Université de Nantes','2016-09-18 17:09:47.192 +00:00','2016-09-18 17:09:47.192 +00:00','university') RETURNING *;
INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('soiree-nantes','Soirée à Nantes','2016-09-18 17:09:47.192 +00:00','2016-09-18 17:09:47.192 +00:00','lifestyle') RETURNING *;

INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('university','2016-09-18 17:10:23.105 +00:00','2016-09-18 17:10:23.105 +00:00') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('lifestyle','2016-09-18 17:10:23.105 +00:00','2016-09-18 17:10:23.105 +00:00') RETURNING *;

INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'SILR4 - G1','2016-09-18 17:10:43.373 +00:00','2016-09-18 17:10:43.373 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'SILR4 - G2','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'ID4','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'INFO4 - Promotion','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','chantrery-gavy','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'License Droit','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','univ-nantes','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Master Droit','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','univ-nantes','university') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Soirées au Hangar','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','soiree-nantes','lifestyle') RETURNING *;
INSERT INTO "agendas" ("id","name","created_at","updated_at","agenda_entity_id","agenda_type_id") VALUES (DEFAULT,'Soirées étudiantes','2016-09-18 17:10:43.374 +00:00','2016-09-18 17:10:43.374 +00:00','soiree-nantes','lifestyle') RETURNING *;

INSERT INTO "event_types"("id", "color", "created_at","updated_at") VALUES('cm', '#FFFFFF', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');
INSERT INTO "event_types"("id", "color", "created_at","updated_at") VALUES('td', '#FFFFFF', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');

INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT,'1', 'cm', '2016-09-18','08:15','10:15','Base de donnée',NULL,' { "teachers": "José Martinez", "groups":"G1, G2, G3", "rooms":"C009"} ','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
INSERT INTO "agenda_events" ("id","agenda_id", "event_type_id", "date","start_time","end_time","name","image","more","created_at","updated_at") VALUES (DEFAULT, '1', 'cm', '2016-09-19','10:15','15:15','Files d''attente',NULL,' {"teachers":"José Martinez","groups":"G1, G2, G3","rooms":"C009"}','2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00') RETURNING *;
