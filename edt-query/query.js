'use scrict';

var when = require('when');
var pg = require('pg');
var jwt = require('jsonwebtoken');
var FB = require('fb');
var fs = require('fs');
var crypto = require('crypto');
var log = require('color-logs')(true, true, __filename);

cfg = require('../config');

var max_pool = cfg.max_pool;
var min_pool = cfg.min_pool;
var timeout = cfg.timeout;

var providers = [];
var central={};

log.debug("user:" + process.env.USER)
log.debug("password: ***********")
log.debug("host:" + process.env.DB_HOST)
log.debug("port:" + process.env.DB_PORT)
log.debug("database:" + process.env.DATABASE)
var Connection = require('tedious').Connection;
var config = {
    userName: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.DB_HOST,
    port: process.env.DB_PORT,
    // If you are on Microsoft Azure, you need this:  
    options: { encrypt: true, database: process.env.DATABASE }
};
var connection = new Connection(config);
connection.on('connect', function (err) {
    log.info("Connected to database");
    central.provider = connection;
    setup();
});  

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;



function setup() {
    log.debug("setup");
    request = new Request("SELECT [Id], [Name], [Host], [Schema], [Database], [Port], [UserName], [Password] from Providers;", function(err) {  
        if (err) {  
            log.error(err);}  
        });
        request.on('row', function(columns) {  
            var id = columns[0].value;
            var name = columns[1].value;
            var host = columns[2].value;
            var schema = columns[3].value;
            var database = columns[4].value;
            var port = columns[5].value;
            var username = columns[6].value;
            var password = columns[7].value;

            var config = {
                userName: username,
                password: password,
                server: host,
                port: port,
                // If you are on Microsoft Azure, you need this:  
                options: { encrypt: true, database: database, schema: schema }
            };
            var connectionProvider = new Connection(config);
            connectionProvider.on('connect', function (err) {
                log.info("Connected to provider ",name);
                providers[id] = connectionProvider;
            });  
        });  
        connection.execSql(request);
}

var getAgendas = function(user_id, callback){
     request = new Request("SELECT [AgendaId], [Provider], [CreatedAt] FROM UserAgendas where UserId=@UserId", function(err) {  
        if (err) {  
            log.error(err);
        }  
    });
        request.addParameter('UserId', TYPES.Int, user_id);
        var userAgendas = [];
        request.on('row', function(columns) { 
            var agendaId = columns[0].value;
            var provider = columns[1].value; 
            var createdAt = columns[2].value; 
            userAgendas = userAgendas.push({agenda_id: agendaId, provider: provider, created_at: createdAt});
        });
         request.on('done', function(rowCount, more) {  
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
        });
        central.provider.execSql(request);
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
    }
}
