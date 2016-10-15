insert into test values ( generate_series(1,10000),
md5(random()::text));
