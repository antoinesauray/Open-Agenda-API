CREATE USER edt_owner WITH PASSWORD 'owner';
CREATE USER edt_facebook WITH PASSWORD 'facebook';
CREATE USER edt_limited WITH PASSWORD 'limited';
CREATE DATABASE edt OWNER edt_owner;

alter user edt_limited password 'limited';
alter user edt_facebook password 'facebook';


CREATE DATABASE edt_staging OWNER edt_owner;
