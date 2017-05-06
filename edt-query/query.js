'use scrict';

var when = require('when');
var pg = require('pg');
const sql = require('mssql');
var jwt = require('jsonwebtoken');
var FB = require('fb');
var fs = require('fs');
var crypto = require('crypto');
var log = require('color-logs')(true, true, __filename);

cfg = require('../config');

var providers = [];
var central={};


function setup(callback) {
    log.debug("setup");
    central.pool.request()
    .query('SELECT [Id], [Name], [Host], [Schema], [Database], [Port], [UserName], [Password] from Providers;').then(result => {
        result["recordset"].forEach(function(provider){
                var id = provider["Id"];
                var name = provider["Name"];
                var host = provider["Host"];
                var schema = provider["Schema"];
                var database = provider["Database"];
                var port = provider["Port"];
                var user = provider["UserName"];
                var password = provider["Password"];

                var config = {
                    user: user,
                    password: password,
                    server: host,
                    port: port,
                    database: database, 
                    schema: schema,
                    // If you are on Microsoft Azure, you need this:  
                    options: { encrypt: true }
                };
                const poolProvider = new sql.ConnectionPool(config);
                poolProvider.connect(function(err){
                    if(!err){
                        log.info("Connected to provider ",name);
                        providers[id] = poolProvider;
                    }
                    else{
                        log.error("Connection to provider failed", name);
                        log.error(err);
                    }
                });
            });
            callback(null);
        }).catch(err => {
            // ... error checks 
            if(err){
                log.error(err);
                callback(err);
            }
        });
}

var getAgendas = function(user_id, callback){
     central.pool.request()
     .input('UserId', sql.Int, user_id)
    .query('SELECT [Id], [Name], [Host], [Schema], [Database], [Port], [UserName], [Password] from Providers;').then(result => {
        log.debug(result);
        //        var userAgendas = [];
        /*
        var agendaId = columns[0].value;
            var provider = columns[1].value; 
            var createdAt = columns[2].value; 
            userAgendas = userAgendas.push({agenda_id: agendaId, provider: provider, created_at: createdAt});
            */
            /*
            var promises=[];
            userAgendas.forEach(function(agenda){
                sqlQuery = connection.request()
                    .input('AgendaId', sql.Int, agenda.agenda_id)
                    .input('Provider', sql.NVarChar, agenda.provider)
                    .query("select Agendas.Id, @Provider as provider, AgendaTypes.Image as image, Entities.Name as entity, Agendas.Name, Agendas.EntityId, Agendas.AgendaType, Agendas.Properties, Agendas.Active from Agendas LEFT JOIN AgendaTypes ON Agendas.AgendaType=AgendaTypes.Id LEFT JOIN Entities ON Agendas.EntityId=Entities.Id where Agendas.Id =@AgendaId");
                promises.push(sqlQuery);
            });
            Promise.all(promises).then(results => {
                var agendas=[];
                results.forEach(function(rows){
                    rows.forEach(function(agenda){
                        agendas.push(agenda);
                    });
                });
                callback(agendas);
            });
            */
    });
}

var getAccounts= function(user_id, callback){
    central.provider.query("SELECT 'email'::text as account, email, first_name, last_name, picture from email_accounts where id in (select email_account from users where id=$1) UNION SELECT 'facebook'::text as account, email, first_name, last_name, picture from facebook_accounts where id in (select facebook_account from users where id=$1)", [user_id], function(err, result){
        central.done();
        if(err) {
            return query.throwError(res);
        }
        callback(result.rows);
    });
}

module.exports = {
    // useful functions
    getUserProfile: function(user_id, callback){
        getAgendas(user_id, function(agendas){
            getAccounts(user_id, function(accounts){
                callback(accounts, agendas);
            });
        });
    },
    getCentral: function(){return central;},
    getProviders: function(){return providers;},
    hash: function(password, next){
        var salt = crypto.randomBytes(8).toString('base64');
        var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
        next(hash, salt);
    },
    hashWithSalt: function(password, salt, next) {
        var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
        next(hash)
    },

    anonymous_ip_addr: function(ip_addr, next){
        central.provider.query("SELECT count(*) as ip_counter from anonymous_users where ip_address=$1 limit 1", [ip_addr], function(err, result){
            central.done();
            if(err) {
                res.status(400);
                res.json({message: "error"});
                return console.error('error running query', err);
            }
            next(result.rows);
        });
    },
    throwError: function(res){
        console.log("could not run query");
        res.status(400);
        res.json({message: "error"});
        return;
    },
    init: function(callback){
        var max_pool = cfg.max_pool;
        var min_pool = cfg.min_pool;
        var timeout = cfg.timeout;

        log.debug("user:" + process.env.USER)
        log.debug("password: ***********")
        log.debug("host:" + process.env.DB_HOST)
        log.debug("port:" + process.env.DB_PORT)
        log.debug("database:" + process.env.DATABASE)
        var Connection = require('tedious').Connection;
        var config = {
            user: process.env.USER,
            password: process.env.PASSWORD,
            server: process.env.DB_HOST,
            database: process.env.DATABASE,
            port: process.env.DB_PORT,
            // If you are on Microsoft Azure, you need this:  
            options: { encrypt: true }
        };

        const pool = new sql.ConnectionPool(config);
        pool.connect(function(err){
            if(!err){
                log.info("Connected to database");
                central.pool = pool;
                setup(callback);
            }
            else{
                log.error("Connection to database failed", err);
                callback(err);
            }
        });
    }
}
