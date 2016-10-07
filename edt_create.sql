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
-- Data for Name: agenda_events; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY agenda_events (id, start_time, end_time, name, more, created_at, updated_at, event_type_id, agenda_id) FROM stdin;
3	2016-10-31 23:58:00+01	2016-10-31 23:59:00+01	Événements à Nantes - Rentrée 2016 - Quoi ? Où ? Quand ?	{"desc": "Ca y est, c'est la rentrée ! Le moment idéal pour organiser des soirées sur Weecame et faire de nouvelles rencontres !\\n\\nRien de prévu pour ce soir ? Demain ? La semaine prochaine ?\\nDécouvrez et partagez les meilleurs événements et soirées de Nantes de la rentrée !\\n\\nBon Plans / Concerts / Festivals / Rooftops / Bars / Musique…\\n\\nUne page à alimenter sans modération !", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/14196029_635155889984003_3623135406245201604_o.jpg", "place": {"id": "110077065688527", "name": "Nantes", "location": {"city": "Nantes", "country": "France", "latitude": 47.2167, "longitude": -1.55}}, "facebook_id": "1724039911142312", "is_canceled": false, "maybe_count": 22516, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 1098, "declined_count": 73, "attending_count": 7283, "is_viewer_admin": false, "interested_count": 22516}	2016-10-07 21:03:36.441974+02	2016-10-07 21:04:08.628588+02	facebook	1
4	2016-10-08 21:00:00+02	2016-10-09 04:00:00+02	Polytech By Night 2016	{"desc": "▬▬▬▬▬▬▬▬▬▬▬ ★ ÉVÉNEMENT ★ ▬▬▬▬▬▬▬▬\\n\\nCette année encore, le plus grand gala nantais est de retour pour sa seizième édition !\\n\\nRetrouvez en concert : Panteros666, VKNG, Love Guru, Moody, Ergo Sum, Rock Over, Marie-Jeanne et les BrokenBeers, Chilling In The Name et  Convect qui vous feront vivre l’une de vos meilleures soirées de l’année !\\nLe thème du gala Polytech By Night 2016 est les styles de musiques. Vous pourrez ainsi passer d’une ambiance disco endiablée à un set techno des plus vibrants en passant par un des tout derniers tubes de RAP US. \\nDiverses activités vous seront proposées durant la soirée, dont un cabaret véto et des shows Pompom (Centrale Nantes, ESB et Polytech Nantes). Les kinés de l’IFM3R seront aussi présents pour vous réaliser des massages des plus relaxants au cours de la soirée. Enfin, une salle karaoké sera créée pour que vous puissiez vous lancer des défis musicaux entre vous et vos amis.\\n\\nD’autres informations seront partagés concernant les dates et lieux fixés pour la vente des places.\\nLe samedi 8 octobre arrive vite, ne perdez pas de temps...\\n\\n▬▬▬▬▬▬▬▬▬▬▬ ★ TARIFS ★ ▬▬▬▬▬▬▬▬▬▬▬\\n\\nPréventes : 23€ pour les adhérents BDE, 25€ sinon\\nSur place : 25€ (dans la limite des places disponibles, risque de places épuisées avant le jour J)\\n\\nRepas : 32€\\nRepas + soirée : 52€\\n*NB : le repas est réservé aux diplômés ingénieurs\\n\\n▬▬▬▬▬▬▬▬▬▬▬ ★ ADRESSE ★ ▬▬▬▬▬▬▬▬▬▬▬\\nPolytech Nantes\\nRue Christian Pauc - 44300 Nantes\\n\\nTenue correcte exigée", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/14361226_2107940236097101_1387669122661614525_o.jpg", "place": {"id": "249401168963", "name": "Polytech Nantes", "location": {"zip": "44306", "city": "Nantes", "street": "Rue Christian Pauc", "country": "France", "latitude": 47.28326, "longitude": -1.51656}}, "facebook_id": "1772980559628007", "is_canceled": false, "maybe_count": 538, "rsvp_status": "attending", "is_page_owned": true, "noreply_count": 1414, "declined_count": 7, "attending_count": 879, "is_viewer_admin": false, "interested_count": 538}	2016-10-07 21:03:36.442463+02	2016-10-07 21:04:08.628845+02	facebook	1
5	2016-10-05 20:00:00+02	2016-10-06 01:00:00+02	FOLK ROCK Electro Session - Jil Is Lucky + Ronan K	{"desc": "La Scène Michelet vous présente une soirée Folk Rock avec la venue exceptionnelle de JIL IS LUCKY avec RONAN K en première partie ! \\n\\nPour découvrir : \\n\\nJIL IS LUCKY \\n\\nSITE : http://www.jilislucky.com/\\nYOUTUBE : https://www.youtube.com/watch?v=8SLV9N24Bt4\\nFACEBOOK : https://www.facebook.com/jilislucky/\\n\\nBIOGRAPHIE : \\nJil is Lucky, de son vrai nom Jil Bensénior commence la guitare à un jeune âge, et se retrouve dès 12 ans à accompagner à la basse son frère dans les bars. Il rencontre ses futurs musiciens à Prague, New York, Berlin et Sidi-bel-Abbès. Ils portent aujourd'hui le nom de The Memphis Deput(i)es. The Wanderer, premier titre du groupe marque la naissance officielle de Jil Is Lucky ; ils sortent leur premier maxi en janvier 2008.\\n\\nLa chanson I May Be Late est sélectionnée pour être la musique officielle de la Fête du cinéma 2008.\\n\\nAprès la sortie du maxi, il sort son premier album le 16 mars 2009. En décembre 2009, la chanson The Wanderer est utilisée pour la publicité de Kenzo.\\n\\nJil et ses musiciens se consacrent par la suite à la préparation d'un second album, notamment au cours de l'année 2011. Le deuxième album du groupe intitulé In the Tiger's Bed est sorti le 18 février 2013 sur le label indépendant Naïve.\\n\\n2016 marque l'année du troisième album de Jil Is Lucky : Manon. Pour la première fois, les textes sont écrits en français et racontent une love story sur fond de cordes et de musique 8-bit. Le disque est complété d'une multitude de clips et d'un court métrage tourné en 360° et son multidirectionnel. Une application voit le jour sur Android et iOS permettant une immersion totale.\\n\\n\\nRONAN K \\n\\nLIVE à la 7eme Minute : http://www.dailymotion.com/video/x260wjq_ronan-k-chanteur-folk-nantais_news\\nFACEBOOK : https://www.facebook.com/ronankband/\\n\\nTARIF : 10€ + frais de loc - 13€ sur place. \\n\\nBilleterie en ligne sur PLACE MINUTE : \\n>> https://www.placeminute.com/concert/folk_rock_electro_session_-_jil_is_lucky_ronan_k,1,15552.html?langue=fr", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/13576818_1153367161351371_5861964705947637352_o.jpg", "place": {"id": "274277922593637", "name": "La Scène Michelet", "location": {"zip": "44000", "city": "Nantes", "street": "1, Boulevard Henry Orrion", "country": "France", "latitude": 47.23289, "longitude": -1.55691}}, "facebook_id": "1806341109584752", "is_canceled": false, "maybe_count": 104, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 520, "declined_count": 1, "attending_count": 35, "is_viewer_admin": false, "interested_count": 104}	2016-10-07 21:03:36.442638+02	2016-10-07 21:04:08.631377+02	facebook	1
6	2016-10-01 22:00:00+02	2016-10-02 04:00:00+02	BOX in DAY #3	{"desc": "BOX IN DAY #3\\nTECH HOUSE / TECHNO\\n--------------------------------------------------------------------------------------\\nL'Altercafé vous propose une nuit 100% pure Techno avec le 3ème volume de la \\"Box in day\\"\\nPour cette fois çi MADCOY et LOULE en invités d'honneurs. \\nUne nuit cosmique vous attend avec ses deux DJ's et  representants de la scène underground locale ...\\nLeurs selections seront affutées, le sens du Groove avec l'esprit de la RAVE ! \\n--------------------------------------------------------------------------------------\\n\\n► MADCOY / Rave Box - Electric Temptation\\n-> soundcloud.com/madcoy\\n■ facebook.com/ElectricTemptation \\n■ facebook.com/RaveBoxAsso  \\n\\n► LOULE / Rave Box - Ephedra \\n■ facebook.com/RaveBoxAsso \\n■ facebook.com/Ephedrateam \\n\\nALTERCAFE \\n21  Quai des Antilles, 44200 NANTES\\nhttps://www.facebook.com/al.tercafe.9/?fref=ts\\n\\n22H/04H - GRATUIT", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/14432961_1477889715555738_6412789230088174185_n.jpg?oh=4003e6bea208812d5f0c55739b7b5d9f&oe=586F0146", "place": {"id": "378327445614199", "name": "Altercafé", "location": {"zip": "44200", "city": "Nantes", "street": "21, Quai des Antilles", "country": "France", "latitude": 47.200361800486, "longitude": -1.5738097548746}}, "category": "MUSIC_EVENT", "facebook_id": "1075502032538991", "is_canceled": false, "maybe_count": 125, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 1534, "declined_count": 6, "attending_count": 36, "is_viewer_admin": false, "interested_count": 125}	2016-10-07 21:03:36.442984+02	2016-10-07 21:04:08.632906+02	facebook	1
8	2016-09-22 20:00:00+02	2016-09-23 02:00:00+02	Soirée de rentrée de l'Université de Nantes dans le cadre du festival Scopitone	{"desc": "L'Université de Nantes et Scopitone s'associent à nouveau pour proposer une soirée de rentrée riche en découvertes musicales\\n\\nDollkraut (NL - live)\\n\\nLe Néerlandais Pascal Pinkert possède quelque chose que peu de producteurs de musique électronique arrivent même à effleurer : un supplément d'âme. Son projet Dollkraut, dont le nom traduit d'emblée son affection pour le krautrock, possède les clés du temps et ne sonnera jamais parfaitement juste dans son époque, mais sera toujours trop moderne pour être taxé d'anachronique. Sa disco-house teintée de pop synthétique des 70's et aux lignes de basse habitées, lancinantes et hypnotiques serait la bande-son parfaite d'un dancefloor en 2042 ! On va voir pour vérifier ?\\nhttps://soundcloud.com/dollkraut\\n\\nNidia Minaj (PT - live)\\n\\nOui, le kuduro bouge encore, et même plus que jamais. Cette musique au destin sinueux, influencée par le semba congolais et la Miami bass, amenée d'Afrique vers le Portugal par les enfants d'immigrés d'Angola ou du Mozambique, avait jusqu'ici un porte-drapeau : Buraka Som Sistema. Nidia Minaj, apparue en 2014 avec un album hallucinant (Estudio Da Mana), a tout pour reprendre le flambeau. Ses morceaux frénétiques, bricolés avec instinct, sont aussi fiévreux qu'ambitieux. De la musique pour possédés des dancefloors !\\nhttps://soundcloud.com/nidia-minaj\\n\\nBatuk  (ZA - live)\\n\\nQuand deux producteurs de Johannesburg (dont le déjà célèbre Spoek Mathambo) s'allient pour créer un collectif protéiforme où tout le monde a son mot à dire, ça sent la bonne idée à plein nez. Batuk, porté par la voix de la chanteuse Manteiga, absorbe la langue portugaise et les influences des pays d'Afrique lusophone, pour un résultat aussi dur à qualifier que stimulant. Une trance house afro, un peu kuduro et kwaito mais pas trop, mais surtout 100 % ouverte : Batuk, comme son nom l'indique, est un joyeux raout gorgé des influences de toute la pointe sud de l'Afrique.\\nhttps://soundcloud.com/batuk_sa\\n\\nDecember aka Tomas More (FR - DJ set / Blackest Ever Black - In Paradisum)\\n\\nQue vous l'ayez croisé sur Correspondant, Items & Things, Get The Curse ou Odd Frequencies, vous avez forcément imprimé le nom de Tomas More à la surface de votre conscience. Le producteur parisien, qui a fait ses armes à Londres à la fin des années 2000, est aujourd'hui considéré - à raison - comme l'un des noms les plus solides et excitants de la scène electro de la capitale, aux côtés du crew Antinote ou de In Paradisum. Il faudra désormais retenir celui de December, alter ego auquel il a donné naissance en toute discrétion, le temps d'un maxi rêche et sinueux. Un side project qui offre un côté encore plus cru et radical à son electro au parfum de new wave, puissante et sombre.\\nhttps://soundcloud.com/tomasmore", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/13575846_10154411408188678_6325111863291330695_o.jpg", "place": {"id": "158281974195287", "name": "Pôle Etudiant - Université de Nantes", "location": {"zip": "44312", "city": "Nantes", "street": "Chemin de la censive du Tertre", "country": "France", "latitude": 47.245080505709, "longitude": -1.551771791881}}, "facebook_id": "1330791376948228", "is_canceled": false, "maybe_count": 2337, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 944, "declined_count": 9, "attending_count": 1089, "is_viewer_admin": false, "interested_count": 2337}	2016-10-07 21:03:36.449304+02	2016-10-07 21:04:08.637676+02	facebook	1
10	2016-09-21 10:00:00+02	2016-09-25 21:00:00+02	Scopitone 2016	{"desc": "LA PROGRAMMATION SCOPITONE 2016 !\\n\\nLe festival nantais dédié aux cultures électroniques et aux arts numériques, à leurs croisements et frictions se déroulera du 21 au 25 septembre.\\nConcerts, nuits électro inédites, installations, performances, workshops et conférences seront au rendez-vous.\\nDécouvrez toute la programmation avec plus de 50 artistes qui feront cette 15ème édition ! \\n\\nMUSIQUE :  MSTRKRFT - N'to - Agoria - Lindstrøm - Danny Daze - Petit Biscuit - Mykki Blanco - Club Cheval - Bon Entendeur - Helena Hauff - Paula Temple - Bagarre - André Bratten - Jacques - Carpenter Brut - Molecule - Pional - Perturbator - Comah - Carpenter Brut - Nidia Minaj - DollKraut - Batuk - Golden Bug & Desilence V.I.C.T.O.R Live - Les Fils du Calvaire - Rodion - Douchka - Stereoclip - Citizen Kain - Charlotte De Witte - Powell - The Field - VoYov - Ann Clue - Jef K - Vincent Lemieux  - Combe - Jer^me Pacman - RP BOO - Phonème - December - Chloé\\n \\n\\nARTS NUMÉRIQUES\\nLjós // fuse*\\nTriggering // Intercity-Express\\nIn Code // Gwyneth Wentink, Wouter Snoei, Arnout Hulskamp\\nContinuum // Paul Jebanasam & Tarik Barri\\nPerspection // Matthew Biederman & Pierce Warnecke\\nUnfold // Ryoichi Kurokawa\\nConstrained Surface // Ryoichi Kurokawa\\nrate-shadow // Daito Manabe & Motoi Ishibashi\\nMemory Lane // Felix Luque Sanchez & Inigo Bilbao\\nClones // Felix Luque Sanchez\\nDiapositive 1.2 // Children of the Light\\nUrban Creature // Lee Byungchan\\nPhallaina / Marietta Ren\\n_Logik // Paul Bouisset & Eugénie Lacombe\\nUluce // Lola Faraud, Quentin Hemonet, Romain Ronflette\\nCinetica // Martial Geoffre – Rouland\\nCortex // fuse*\\n\\nJEUNE PUBLIC\\nCharlot Festival // Radiomentale\\nOctopop // Collectif BRUYANT & nit\\n\\nJAPAN MEDIA ARTS FESTIVAL\\n\\n+ Workshops, conférences, ateliers, tables rondes, visites\\n \\nSoirées électro interdites aux mineurs - même accompagnés\\n\\nOuverture de la billetterie jeudi 23 juin\\nWWW.SCOPITONE.ORG", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/13433162_1111954042198647_6002783774018829421_o.jpg", "place": {"id": "151986908195370", "name": "Stereolux", "location": {"zip": "44200", "city": "Nantes", "street": "4 Boulevard Léon Bureau", "country": "France", "latitude": 47.205210770233, "longitude": -1.5637775264576}}, "facebook_id": "1815447752023070", "is_canceled": false, "maybe_count": 10491, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 1642, "declined_count": 26, "attending_count": 4987, "is_viewer_admin": false, "interested_count": 10491}	2016-10-07 21:03:36.451143+02	2016-10-07 21:04:08.64034+02	facebook	1
7	2016-09-23 21:00:00+02	2016-09-24 23:00:00+02	Nuits féériques du Jardin des plantes de Nantes	{"desc": "“les fleuves, les oiseaux, les plantes...” \\nCécile HOUILLON soprano\\n\\nLes nuits féériques du Jardin des plantes proposent aux Nantais une vingtaine de scènes délicatement mises en lumière. Le festival les Art'Scènes vous propose d'écouter Cécile Houillon (soprano) au gré de votre visite le vendredi 23 septembre et le samedi 24 septembre à partir de 21h.. Nous vous attendons nombreux ..\\nGratuit", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/13692815_1149494091782663_2766342118867919338_o.jpg", "place": {"id": "111912858869195", "name": "Jardin des plantes de Nantes", "location": {"zip": "44000", "city": "Nantes", "street": "24 Boulevard Stalingrad", "country": "France", "latitude": 47.21944444, "longitude": -1.54277778}}, "facebook_id": "1059749644114577", "is_canceled": false, "maybe_count": 10387, "rsvp_status": "attending", "is_page_owned": true, "noreply_count": 1850, "declined_count": 34, "attending_count": 2366, "is_viewer_admin": false, "interested_count": 10387}	2016-10-07 21:03:36.447446+02	2016-10-07 21:04:08.637405+02	facebook	1
15	2016-09-07 19:30:00+02	2016-09-07 22:00:00+02	Tbilisi I Love You en séance gratuite à l'Université de Nantes	{"desc": "En partenariat avec l'Université d'été franco-allemande-géorgienne, et en préambule à la programmation régulière de notre association, Accès au cinéma invisible vous propose, en partenariat avec le Centre Culturel Franco-Allemand Nantes, \\"Tbilisi I love you\\" (2014), film géorgien inédit en France.\\nTbilisi, I Love You (Géorgie, 93 min), gratuit, en vostfr et ouvert à tous.\\nCe long-métrage réunit les travaux de sept cinéastes géorgiens et s'inscrit dans la franchise \\"Cities of love\\" inaugurée par \\"Paris, je t'aime\\" (2006). On y découvre propose en dix segments un portrait honnête de la capitale de la Géorgie, tour à tour mélodramatique ou cocasse. Venez (re)découvrir une ville à l'histoire riche et complexe, mêlant divers sujets ne montrant Tbilisi pas seulement sous un angle flatteur.\\nLe casting regroupe de jeunes acteurs géorgiens, mais aussi quelques stars internationales telles que Ron Perlman et Malcolm McDowell.", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/q85/s720x720/14207852_1194828087206102_690041707865813047_o.jpg", "place": {"id": "158281974195287", "name": "Pôle Etudiant - Université de Nantes", "location": {"zip": "44312", "city": "Nantes", "street": "Chemin de la censive du Tertre", "country": "France", "latitude": 47.245080505709, "longitude": -1.551771791881}}, "facebook_id": "590674387806660", "is_canceled": false, "maybe_count": 114, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 308, "declined_count": 0, "attending_count": 42, "is_viewer_admin": false, "interested_count": 114}	2016-10-07 21:03:36.465824+02	2016-10-07 21:04:08.644615+02	facebook	1
20	2016-08-21 13:45:00+02	2016-08-21 20:00:00+02	Goûtez Électronique 2016 ! #4 - Flamingo Domingo	{"desc": "#4 - Flamingo Domingo\\n\\n• Arnaud\\n(Input Selector / France)\\n\\n• Aleqs Notal\\n(CLEKCLEKBOOM // France)\\n\\n• Arcarsenal live\\n(Underground Quality // Allemagne)\\n\\n• Patrice Scott\\n(Sistrum Records // Etats-Unis)\\n\\n\\nhttp://www.goutez-electronique.com/\\n\\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\\nÎle de Nantes • Jardin des Berges (face aux Machines de l'Ile)\\n13h45 - 20h\\n═════════════════════════════════════════\\n✓ ENTRÉE GRATUITE !\\n✓ PIQUE-NIQUE BIENVENU\\n✓ RAFRAICHISSEMENTS ET RESTAURATION À PETITS PRIX\\n✓ CB ACCEPTÉE\\n✓ SANITAIRES À DISPOSITION\\n✓ TRIONS NOS DECHETS\\n✓ MERCI D'OUVRIR VOS SACS À L'ENTRÉE\\n\\n✗ ALCOOL ET BOUTEILLES EN VERRE INTERDITES À L'ENTRÉE\\n✗ CANETTES INTERDITES\\n✗ ANIMAUX INTERDITS\\n✗ OBJETS DANGEREUX INTERDITS\\n\\nPOUR GARANTIR SA SURVIE, AIDEZ-NOUS À FAIRE DE CE RENDEZ-VOUS UN ÉVÈNEMENT PLUS RESPECTUEUX DE L'ENVIRONNEMENT\\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/13690752_2108715832488729_6612552729126088590_n.jpg?oh=d1ebcca5dbfa5863e3d845d954bb6621&oe=585F9C40", "place": {"id": "442067142480197", "name": "Jardin Des Berges", "location": {"city": "Nantes", "country": "France", "latitude": 47.20841705, "longitude": -1.5666943}}, "facebook_id": "1658843207771243", "is_canceled": false, "maybe_count": 2649, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 1146, "declined_count": 9, "attending_count": 1167, "is_viewer_admin": false, "interested_count": 2649}	2016-10-07 21:03:36.468432+02	2016-10-07 21:04:08.646948+02	facebook	1
9	2016-09-22 19:00:00+02	2016-09-25 04:00:00+02	Le Pick fête ses 40 ans !	{"desc": "40 ans ça se fête ! \\nOn vous prépare 3 crazy dayz pour l'occasion ! \\n\\nJEUDI 22 SEPTEMBRE l 19H - Begin Party ! \\n➬ Ouverture de la soirée avec une performance de Beer Painting  par NAART !  \\n➬ Buffet huîtres et charcuterie ! \\n➬ La team NightFall Nantes sera là avec des cadeaux ! \\n\\nVENDREDI 23 SEPTEMBRE l 19H - La Mêlée ! \\nAvec le VSN Rugby et le Rugby Féminin XIII\\n➬ Apéro et Hot Dog Party \\nFormule #BeerDog spéciale BEER TIME Nantes\\n1 Affli Triple + 1 Hot Dog = 9,20€ \\n\\nSAMEDI 24 SEPTEMBRE - Veery Good Pick #1\\n➬ Soirée spéciale années 80\\n➬ DJ Fred J aux platines ! \\n➬ Beer Bottle All Night Long \\n\\nOn compte sur votre présence et votre bonne humeur pour rendre nos 40 piges inoubliables !!!!", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/14358820_855233177943180_3748731653371651562_n.jpg?oh=33090a4a9c3e9470c3a905019b0b0f56&oe=5862B603", "place": {"id": "468889033244265", "name": "Pickwick's", "location": {"zip": "44000", "city": "Nantes", "street": "3 rue Rameau", "country": "France", "latitude": 47.21324574871, "longitude": -1.5607989362614}}, "facebook_id": "597499633763282", "is_canceled": false, "maybe_count": 219, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 684, "declined_count": 1, "attending_count": 60, "is_viewer_admin": false, "interested_count": 219}	2016-10-07 21:03:36.450839+02	2016-10-07 21:04:08.638802+02	facebook	1
13	2016-09-13 20:00:00+02	2016-09-14 00:00:00+02	Soirée découverte Rock Salsa	{"desc": "Première soirée de l'année organisée par le Club Rock et le Club Salsa à Centrale au Hall L.\\nDécouverte des deux danses, avec une initiation au début de la soirée.", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/14202643_10205200130682505_8342822916723507481_n.jpg?oh=a6e5ff0393879171b6af1aae644eb6ea&oe=58A4BEF1", "place": {"id": "57286116786", "name": "ECOLE CENTRALE DE NANTES", "location": {"zip": "44321", "city": "Nantes", "street": "1 Rue Noë", "country": "France", "latitude": 47.248447424206, "longitude": -1.5497252069006}}, "facebook_id": "1787130064834487", "is_canceled": false, "maybe_count": 159, "rsvp_status": "unsure", "is_page_owned": false, "noreply_count": 127, "declined_count": 0, "attending_count": 81, "is_viewer_admin": false, "interested_count": 159}	2016-10-07 21:03:36.465547+02	2016-10-07 21:04:08.641604+02	facebook	1
11	2016-09-16 18:00:00+02	2016-09-18 21:00:00+02	Startup Weekend Nantes #7	{"desc": "Le Startup Weekend est déjà de retour pour sa septième édition qui aura lieu les 16, 17 et 18 septembre prochains ! Exposez vos idées et mettez à disposition vos compétences pour relever le défi de monter une startup en 54 heures.\\n\\nL’expérience Startup Weekend, c’est découvrir le monde de l’entrepreneuriat en accéléré. Du concept exposé le vendredi soir au pitch final le dimanche après-midi, vous devrez passer par toutes les étapes qu’ont connues les plus grandes startups. Former votre équipe, valider votre business model, développer votre produit, tester votre marché… expérimentez toutes les sensations d’un startuper, des plus grandes joies au pire stress (comme repartir à zéro à 24h du final, du déjà vu au SWNA).\\n\\nPour en savoir plus : https://www.eventbrite.com/e/startup-weekend-nantes-0916-tickets-26640333956", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/14138222_1146497035408013_1948052032137381353_o.jpg", "place": {"id": "111093735616849", "name": "La Cantine par Atlantic 2.0", "location": {"zip": "44000", "city": "Nantes", "street": "11, impasse Juton", "country": "France", "latitude": 47.212006062709, "longitude": -1.5514434423245}}, "facebook_id": "1781184792139461", "is_canceled": false, "maybe_count": 283, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 176, "declined_count": 1, "attending_count": 104, "is_viewer_admin": false, "interested_count": 283}	2016-10-07 21:03:36.463187+02	2016-10-07 21:04:08.640596+02	facebook	1
17	2016-09-04 13:45:00+02	2016-09-04 20:00:00+02	Goûtez Électronique 2016 ! #5 - Drôles D'oiseaux	{"desc": "#5 - Drôles D'oiseaux\\n\\n• Tonton Perruche\\n(OUTSIGHT / France)\\n\\n• brAque live\\n(D.KO Records / France)\\n\\n• Mézigue\\n(D.KO Records / France)\\n\\n• Alan.D\\n(Goûtez Electronique / France)\\n\\nhttp://www.goutez-electronique.com/\\n\\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\\nÎle de Nantes • Jardin des Berges (face aux Machines de l'Ile)\\n13h45 - 20h\\n═════════════════════════════════════════\\n✓ ENTRÉE GRATUITE !\\n✓ PIQUE-NIQUE BIENVENU\\n✓ RAFRAICHISSEMENTS ET RESTAURATION À PETITS PRIX\\n✓ CB ACCEPTÉE\\n✓ SANITAIRES À DISPOSITION\\n✓ TRIONS NOS DECHETS\\n✓ MERCI D'OUVRIR VOS SACS À L'ENTRÉE\\n\\n✗ ALCOOL ET BOUTEILLES EN VERRE INTERDITES À L'ENTRÉE\\n✗ CANETTES INTERDITES\\n✗ ANIMAUX INTERDITS\\n✗ OBJETS DANGEREUX INTERDITS\\n\\nPOUR GARANTIR SA SURVIE, AIDEZ-NOUS À FAIRE DE CE RENDEZ-VOUS UN ÉVÈNEMENT PLUS RESPECTUEUX DE L'ENVIRONNEMENT\\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/14064192_2161908963836082_7457556820397464525_n.jpg?oh=619532879b73aa4bae6234e7ffe97268&oe=58AA3905", "place": {"id": "442067142480197", "name": "Jardin Des Berges", "location": {"city": "Nantes", "country": "France", "latitude": 47.20841705, "longitude": -1.5666943}}, "facebook_id": "1041835572596924", "is_canceled": false, "maybe_count": 2520, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 592, "declined_count": 3, "attending_count": 1154, "is_viewer_admin": false, "interested_count": 2520}	2016-10-07 21:03:36.467304+02	2016-10-07 21:04:08.646557+02	facebook	1
12	2016-09-15 13:30:00+02	2016-09-15 14:00:00+02	Réunion d'informations PBN 2016	{"desc": "Le gala approche à grand pas et l'équipe organisatrice n'attend plus que toi dans ses rangs pour faire de Polytech By Night la plus belle soirée de l'année.\\nPour rejoindre nos équipes, on te propose de venir te renseigner sur les différents staffs jeudi 15 septembre à 13h30. \\n\\nOn t'attend motivé et de bonne humeur.", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/14330126_2104097369814721_8717753326962693661_n.jpg?oh=b331f41039ddbc021ea5d55fbbe03fe8&oe=58ACA05F", "place": {"name": "Amphi 1 Bat. IRESTE"}, "facebook_id": "1393608617320088", "is_canceled": false, "maybe_count": 26, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 142, "declined_count": 0, "attending_count": 49, "is_viewer_admin": false, "interested_count": 26}	2016-10-07 21:03:36.465024+02	2016-10-07 21:04:08.640849+02	facebook	1
16	2016-09-06 21:00:00+02	2016-09-07 02:00:00+02	Soirée d'accueil	{"desc": "Viens participer à la première soirée de l'année organisée par ton BDE pour fêter la rentrée ! \\n\\nRendez-vous à la Scierie et à l'Engrenage mardi à partir de 21h.\\n\\nOn vous attend !", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/14257678_1389779864383902_1488813045935890058_o.png", "place": {"name": "Scierie et Engrenage"}, "facebook_id": "1248988528457949", "is_canceled": false, "maybe_count": 47, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 100, "declined_count": 0, "attending_count": 93, "is_viewer_admin": false, "interested_count": 47}	2016-10-07 21:03:36.466942+02	2016-10-07 21:04:08.644763+02	facebook	1
21	2016-08-16 09:30:00+02	2016-08-26 12:30:00+02	Nantes French summer class / Cours intensifs d'été	{"desc": "This summer, Francophonie suggest 2 two-week intensive programs. 15 hours of french lessons per week, cultural workshops, tourist excursions. Do not hesitate to ask our detailed program !", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/13043384_881400678648396_5593783536005963974_n.jpg?oh=0b8b591bc6708defb9c7377726dcf7cb&oe=5872A5B2", "place": {"id": "126214310833707", "name": "Francophonie Nantes", "location": {"zip": "44400", "city": "Rezé", "street": "53, avenue de la libération", "country": "France", "latitude": 47.1904106, "longitude": -1.55036}}, "facebook_id": "804017073036110", "is_canceled": false, "maybe_count": 90, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 2, "declined_count": 1, "attending_count": 12, "is_viewer_admin": false, "interested_count": 90}	2016-10-07 21:03:36.469277+02	2016-10-07 21:04:08.647568+02	facebook	1
1	2016-11-19 23:00:00+01	2016-11-20 04:00:00+01	Panteros666 b2b Myd - Willow (TWR) & Wattkine	{"desc": "Quand deux des membres du groupe Club cheval signés sur le label Bromance Records (qu'on ne présente plus), viennent retourner l'Altercafé avec les co-fondateurs des soirées Teknomaniak, Wattkine & Willowtwr ! Ne retenez qu'une chose... la date ;) Rendez-vous le SAMEDI 19 NOVEMBRE ! Start : 23h ! \\n\\n▬▬▬ LINE UP ▬▬▬▬▬▬▬▬▬▬▬▬▬\\n\\n〓 PANTEROS666 b2b MYD - Club Cheval / Bromance\\n\\nFCBK - https://www.facebook.com/page.panteros666\\nSNDCLD - https://soundcloud.com/panteros666\\nFCBK - https://www.facebook.com/MydSound\\nSNDCLD - https://soundcloud.com/myd\\n\\n〓 WILLOW (TWR) - Teknomaniak\\n\\nFCBK - https://www.facebook.com/pages/Willow-TWR/282616201857642\\nSNDCLD - http://soundcloud.com/willow-twr\\n\\n〓 WATTKINE - Teknomaniak\\n\\nFCBK - https://www.facebook.com/Wattkine\\nSNDCLD - http://soundcloud.com/wattkine\\n\\n▬▬▬ INFOS PRATIQUES ▬▬▬▬▬▬▬▬▬\\n\\nALTERCAFE - Hangar à Bananes - Quai des Antilles\\n44200 NANTES\\nhttp://www.altercafe.fr/\\n\\nLes sacs à dos ne sont pas autorisés à l'Altercafé.\\n+ 18 only / Carte d'identité obligatoire", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/14516334_1065443003569303_2827155453926740927_n.jpg?oh=9d8dd9fef6f012d9f0e8cfb9466a50bb&oe=58A919E3", "place": {"id": "378327445614199", "name": "Altercafé", "location": {"zip": "44200", "city": "Nantes", "street": "21, Quai des Antilles", "country": "France", "latitude": 47.200361800486, "longitude": -1.5738097548746}}, "ticket_uri": "https://yurplan.com/event/PANTEROS666-B2-B-MYD-willowtwr-wattkine-Altercafe/11632", "facebook_id": "305789136480066", "is_canceled": false, "maybe_count": 1037, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 191, "declined_count": 0, "attending_count": 123, "is_viewer_admin": false, "interested_count": 1037}	2016-10-07 21:03:36.433619+02	2016-10-07 21:04:08.61808+02	facebook	1
2	2016-11-09 08:00:00+01	2016-11-10 19:00:00+01	Devfest Nantes 2016	{"desc": "5ème édition d’un événement complet de conférences sur Android, AppEngine, Angular, Chrome, HTML5, Docker... C'est une occasion unique de partager et d’échanger autour des technologies du Web, du Cloud, du Mobile et des Objets Connectés.\\n\\nPassez 2 journées dans un magnifique lieu, avec plus de 1000 participants, plus de 50 conférences et codelabs et de nombreux stands avec démos et innovations proposés par nos partenaires et startups \\n\\n1 jour : 40€ (10€ pour les étudiants et chercheurs d'emploi)\\n2 jours : 70€\\n\\nCes formules comprennent :\\n * Un accès à toutes les conférences de la formule choisie,\\n * Le repas du midi sous forme de buffet complet,\\n * L'after party (uniquement pour les participants de la journée du 9/11)\\n\\nAttention : comme tous les ans, il n'y aura pas de place pour tout le monde. N'attendez pas pour réserver votre billet !\\n\\nLes photos de l'édition 2015 : https://goo.gl/0QeEYh\\nLes vidéos de l'édition 2015 : https://goo.gl/RJHjmK", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/14249900_1107386512670699_5954712869133261883_o.jpg", "place": {"id": "1478452169105153", "name": "La Cité, Le Centre des Congrès de Nantes", "location": {"zip": "44000", "city": "Nantes", "street": "5 rue de Valmy", "country": "France", "latitude": 47.213144764623, "longitude": -1.5432164524521}}, "ticket_uri": "https://devfest.gdgnantes.com/?utm_source=Facebook&utm_medium=R%C3%A9seaux+Sociaux&utm_campaign=devfest2016", "facebook_id": "610288295813024", "is_canceled": false, "maybe_count": 107, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 9, "declined_count": 0, "attending_count": 65, "is_viewer_admin": false, "interested_count": 107}	2016-10-07 21:03:36.441346+02	2016-10-07 21:04:08.619094+02	facebook	1
19	2016-08-21 20:30:00+02	2016-08-22 03:30:00+02	Goûtez Électronique 2016 ! #4 - After	{"desc": "Le Goûtez Électronique est de retour pour la 8e année ! Et son after officiel aussi !\\n\\n#4 Flamingo Domingo - After : \\n20h30 - 3h30 // Le Ferrailleur - Café Concert // 2€\\n\\nLine Up \\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\\n\\n• Arnaud (Input Selector / Nantes)\\nhttps://www.facebook.com/arnaudinputselector/\\nhttp://soundcloud.com/arnaud\\n\\n• Montoy  (Shramana / Nantes)\\nhttps://www.facebook.com/Montoy-674535002611201/\\nhttps://soundcloud.com/toy_of\\n\\n• RATEL ( Hellyum / Paris)\\nhttps://www.facebook.com/ratelnights/\\n\\n• ST DOUX aka Obé. b2b LVH ( La Station Rose / Nantes)\\nhttps://soundcloud.com/stdoux", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/13921116_2144196568940655_333201827516558922_n.jpg?oh=4d86311df9763c1a0bc36c697fa00989&oe=58710A5F", "place": {"id": "339671366083693", "name": "Le Ferrailleur", "location": {"city": "Nantes", "street": "21 Quai des Antilles", "country": "France", "latitude": 47.200565367776, "longitude": -1.573683129264, "located_in": "166074026782860"}}, "facebook_id": "877741068997060", "is_canceled": false, "maybe_count": 1068, "rsvp_status": "unsure", "is_page_owned": true, "noreply_count": 159, "declined_count": 3, "attending_count": 271, "is_viewer_admin": false, "interested_count": 1068}	2016-10-07 21:03:36.468305+02	2016-10-07 21:04:08.646829+02	facebook	1
14	2016-09-08 19:30:00+02	2016-09-08 22:00:00+02	SenseDrink de la rentrée Nantes	{"desc": "Tu as déjà entendu parler de MakeSense ? Tu as déjà participé à un Hold-up ? Tu t'intéresses à l'entrepreneuriat social? Tu souhaite rencontrer des entrepreneurs avec des projets à impact positif ?\\n\\nViens rencontrer les gangsters de MakeSense Nantes et échanger autour d’un verre!\\n\\nRDV jeudi 8 septembre pour le Drink de la rentrée! \\n\\nC'est quoi MakeSense ? \\nMakeSense est une communauté de passionnés d'entrepreneuriat social (gangsters) qui agit pour aider les entrepreneurs sociaux\\n\\nC'est quoi un gangster ? \\nUn gangster est un membre actif de la communauté MakeSense, qui organise des événements et/ou participe à l'activité du mouvement. \\n\\nC'est quoi un SenseDrink ? \\nUn Sensedrink c'est un moment lors duquel les gangsters et futurs gangsters se retrouvent pour papoter, se rencontrer, boire des verres, parler des futurs projets de la communauté.", "type": "public", "image": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/14063876_10208255753645482_2355831581467889768_n.jpg?oh=ed6b9797c1225d6180be07233c57e40d&oe=58AB6CC0", "place": {"id": "694345953916194", "name": "Bateau Lavoir", "location": {"zip": "44000", "city": "Nantes", "street": "Quai De Versailles", "country": "France", "latitude": 47.220915396298, "longitude": -1.5535707508296}}, "facebook_id": "1183659321692495", "is_canceled": false, "maybe_count": 32, "rsvp_status": "unsure", "is_page_owned": false, "noreply_count": 294, "declined_count": 1, "attending_count": 17, "is_viewer_admin": false, "interested_count": 32}	2016-10-07 21:03:36.465709+02	2016-10-07 21:04:08.643087+02	facebook	1
18	2016-08-25 10:00:00+02	2016-08-28 23:00:00+02	Les Rendez-vous de l'Erdre 2016	{"desc": "30 ans, ça se fête ! Le festival du jazz et de la belle plaisance met les petits plats dans les grands : des créations, hommages et projets inédits sont au programme. \\n\\nAu total, 200 concerts seront donnés gratuitement sur une quinzaine de scène autour de l’Erdre à Nantes, à Nort-sur-Erdre, en passant par Sucé-sur-Erdre, Petit-Mars, Carquefou ou La Chapelle-sur-Erdre. \\n\\nPour fêter les 30 ans du festival, les spectateurs sont invités à vivre 30 moments intimes et insolites dans des lieux peu connus du grand public, aux alentours de l’Erdre.\\n\\nA ne pas manquer cette année : Omar Sosa et Jacques Schwart-Bart qui présenteront leur projet Creole Spirits, Umlaut Big Band, « des musiciens contemporains qui proposent une musique swing des années 30 », ou Nicolas Folmer, « un des meilleurs trompettistes nantais ». Sur la grande scène nautique, quai Ceineray, un hommage sera rendu à une figure historique du jazz nantais, Jean-Marie Bellec, du conservatoire de Nantes. \\n\\nPendant tout le festival, un grand banquet se tiendra à Nantes au square Maquis-de-Saffré\\n\\nPour connaitre le programme et les infos pratiques : www.rendezvouserdre.com", "type": "public", "image": "https://scontent.xx.fbcdn.net/t31.0-8/s720x720/14054519_1145638802175165_3075478071665489193_o.jpg", "place": {"id": "126460897426299", "name": "Ville de Nantes", "location": {"zip": "44000", "city": "Nantes", "street": "29, rue de Strasbourg", "country": "France", "latitude": 47.215178598481, "longitude": -1.5551979066957}}, "facebook_id": "1762897383965656", "is_canceled": false, "maybe_count": 2873, "rsvp_status": "attending", "is_page_owned": true, "noreply_count": 429, "declined_count": 6, "attending_count": 1716, "is_viewer_admin": false, "interested_count": 2873}	2016-10-07 21:03:36.468154+02	2016-10-07 21:04:08.646679+02	facebook	1
\.


--
-- Name: agenda_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: edt_admin
--

SELECT pg_catalog.setval('agenda_events_id_seq', 42, true);


--
-- Data for Name: agenda_types; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY agenda_types (id, public, created_at, updated_at) FROM stdin;
personal	f	2016-10-07 20:57:20.748845+02	2016-10-07 20:57:20.748845+02
facebook	f	2016-10-07 20:57:20.756761+02	2016-10-07 20:57:20.756761+02
\.


--
-- Data for Name: agendas; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY agendas (id, name, image, editable, created_at, updated_at, agenda_entity_id, agenda_type_id) FROM stdin;
2	Personnel	\N	t	2016-10-07 20:57:45.750947+02	2016-10-07 20:57:45.750947+02	1	personal
1	Facebook	\N	f	2016-10-07 20:57:45.750947+02	2016-10-07 20:57:45.750947+02	1	facebook
\.


--
-- Name: agendas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: edt_admin
--

SELECT pg_catalog.setval('agendas_id_seq', 2, true);


--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY entities (id, name, public, created_at, updated_at, agenda_type_id) FROM stdin;
1	Antoine Sauray	f	2016-10-07 20:57:45.750947+02	2016-10-07 20:57:45.750947+02	personal
\.


--
-- Data for Name: event_types; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY event_types (id, color_light, color_dark, created_at, updated_at) FROM stdin;
me	#4caf50	#2e7d32	2016-09-18 19:11:49.155+02	2016-09-18 19:11:49.155+02
facebook	#8b9dc3	#3b5998	2016-09-18 19:11:49.155+02	2016-09-18 19:11:49.155+02
\.


--
-- Data for Name: user_agendas; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY user_agendas (created_at, updated_at, user_id, agenda_id) FROM stdin;
2016-10-07 20:57:45.750947+02	2016-10-07 20:57:45.750947+02	1	1
2016-10-07 20:57:45.750947+02	2016-10-07 20:57:45.750947+02	1	2
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: edt_admin
--

COPY users (edt_id, facebook_id, facebook_token, first_name, last_name, facebook_email, edt_email, password, salt, is_validated, created_at, updated_at) FROM stdin;
1	10209069424205487	EAAOhBOjOZBfQBAPKLUW5cK4icZAUCBSzNZAZBxsfpmjtKZAhaB1BwKpxl3l6PzKoplaU7CZCjJAAwYjaaSYz2SIcmLgZAWiasHqOlqrVrSQyXQ3BF0swMLKFcv0Mqjad46m4oOgVWDUzrH8ZBz3MrqTpaHs0H3brczH3umZALHq39qQZDZD	Antoine	Sauray	sauray.a@outlook.com	sauray.a@outlook.com	3TxB7r4jp8LGk15Yy7Wf+QJL72r9wz/UEIaoR6gvo1Q=	f3THf2dYq4M=	t	2016-10-07 20:57:45.750947+02	2016-10-07 20:57:45.750947+02
\.


--
-- Name: users_edt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: edt_admin
--

SELECT pg_catalog.setval('users_edt_id_seq', 1, true);


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
-- Essential data
--

INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('personal','NOW()','NOW()') RETURNING *;
INSERT INTO "agenda_types" ("id","created_at","updated_at") VALUES ('facebook','NOW()','NOW()') RETURNING *;
INSERT INTO "entities" ("id","name","created_at","updated_at","agenda_type_id") VALUES ('edt','EDT','NOW()','NOW()','university') RETURNING *;
INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('me', '#4caf50', '#2e7d32', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');
INSERT INTO "event_types"("id", "color_light", "color_dark", "created_at","updated_at") VALUES('facebook', '#8b9dc3', '#3b5998', '2016-09-18 17:11:49.155 +00:00','2016-09-18 17:11:49.155 +00:00');


--
-- PostgreSQL database dump complete
--
