var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');

var sequelize = require('../database/sequelize');
var User = require('../database/model/user').User;
var Agenda = require('../database/model/agenda').Agenda;
var database = sequelize.database;

var cert = {
    pub: fs.readFileSync('cert.pem')
}

router.use(function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, cert.pub, {algorithm: 'RS256'}, function(err, decoded) {
      if (err) {
        res.statusCode=401;
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
});

router.get('/', function(req, res, next) {
    database.query("SELECT edt_id, first_name, last_name, mail, created_at, updated_at FROM users where users.edt_id =:id LIMIT 1", { replacements: { id: req.decoded.id }, type: database.QueryTypes.SELECT})
      .then(function(agendas) {
        // We don't need spread here, since only the results will be returned for select queries
        if(agendas){
            res.statusCode=200;
            res.send(agendas[0]);
        }
    });
});

router.get('/agendas', function(req, res, next) {
    database.query("SELECT * FROM agendas where agendas.id IN (SELECT agenda_id FROM user_agendas where user_id=:id) ", { replacements: { id: req.decoded.id }, type: database.QueryTypes.SELECT})
      .then(function(agendas) {
        // We don't need spread here, since only the results will be returned for select queries
        res.statusCode=200;
        res.send(agendas);
    });
});

router.get('/events/:date', function(req, res, next) {
    database.query("SELECT agenda_events.id, agenda_id, to_char(date, 'YYYY-MM-DD') AS date, start_time, end_time, name, event_type_id, color_light, color_dark, more FROM agenda_events INNER JOIN event_types ON event_types.id=agenda_events.event_type_id where date = :date AND agenda_id IN (SELECT agenda_id FROM user_agendas where user_id=:id)", { replacements: {date: req.params.date, id: req.decoded.id}, type: database.QueryTypes.SELECT})
      .then(function(events) {
        res.statusCode=200;
        res.send(events);
    });
});

router.get('/events/:start_date/:end_date', function(req, res, next) {
    database.query("SELECT agenda_events.id, agenda_id, to_char(date, 'YYYY-MM-DD') AS date, start_time, end_time, name, event_type_id, color_light, color_dark, more FROM agenda_events INNER JOIN event_types ON event_types.id=agenda_events.event_type_id where date >= :start_date AND date <= :end_date AND agenda_id IN (SELECT agenda_id FROM user_agendas where user_id=:id)", { replacements: {start_date: req.params.start_date, end_date: req.params.end_date, id: req.decoded.id}, type: database.QueryTypes.SELECT})
      .then(function(events) {
         var retour = {};
         events.forEach(function(event){
             if(!retour[event.date]){
                 retour[event.date] = [];
             }
             retour[event.date].push(event);
         });
         console.log(retour);
         res.statusCode=200;
         res.send(retour);
    });
});

router.post('/events/:date', function(req, res, next) {
    if(req.body.agenda_id && req.body.name && req.body.start_time && req.body.end_time){
        database.query("INSERT INTO agenda_events(created_at, updated_at, name, date, agenda_id, start_time, end_time, event_type_id) VALUES(NOW(), NOW(), '"+req.body.name+"', '"+req.params.date+"', "+req.body.agenda_id+", '"+req.body.start_time+"', '"+req.body.end_time+"', 'me')")
          .then(function(agendas) {
            // We don't need spread here, since only the results will be returned for select queries
            if(agendas){
                res.statusCode=200;
                res.json({message: "This agenda has been post"});
            }
            else{
                res.statusCode=401;
                res.send("This Agenda does not exist");
            }

        });
    }
    else{
        res.statusCode=403;
        res.send("Missing parameters");
    }
});

router.delete('/events/:id', function(req, res, next) {
    if(req.body.agenda_id){
        database.query("DELETE FROM agenda_events WHERE id=:event_id AND agenda_id IN(SELECT agenda_id FROM user_agendas where user_id=:user_id)", {replacements: { event_id: req.params.id, user_id: req.decoded.id }})
          .then(function(agendas) {
            // We don't need spread here, since only the results will be returned for select queries
            if(agendas){
                res.statusCode=200;
                res.json({message: "This agenda has been deleted"});
            }
            else{
                res.statusCode=401;
                res.send("This Agenda does not exist");
            }

        });
    }
    else{
        res.statusCode=403;
        res.send("Missing parameters");
    }
});

router.post('/agendas', function(req, res, next) {
    if(req.body.agenda_id){
        database.query("INSERT INTO user_agendas(created_at, updated_at, user_id, agenda_id) VALUES(NOW(), NOW(), "+req.decoded.id+", "+req.body.agenda_id+")")
          .then(function(agendas) {
            // We don't need spread here, since only the results will be returned for select queries
            if(agendas){
                res.statusCode=200;
                res.json({message: "This agenda has been post"});
            }
            else{
                res.statusCode=401;
                res.send("This Agenda does not exist");
            }

        });
    }
    else{
        res.statusCode=403;
        res.send("Please provide an Agenda id");
    }
});

router.post('/events', function(req, res, next) {
    if(req.body.agenda_id && req.body.date && req.body.start_time && req.body.end_time && req.body.name && req.body.event_type){
        var sqlQuery=null;
        var image = req.body.image;
        var more = req.body.more;
        if(image&&more){
            sqlQuery="INSERT INTO agenda_events(date, start_time, end_time, name, image, more, created_at, updated_at, event_type_id, agenda_id) VALUES(\'"+req.body.date+"\', \'"+req.body.start_time+"\', \'"+req.body.end_time+"\', \'"+req.body.name+"\', \'"+ image+"\', \'"+more+"\', NOW(), NOW(), \'"+req.body.event_type+"\', "+req.body.agenda_id+")"
        }
        else{
            if(image){
                sqlQuery="INSERT INTO agenda_events(date, start_time, end_time, name, image, created_at, updated_at, event_type_id, agenda_id) VALUES(\'"+req.body.date+"\', \'"+req.body.start_time+"\', \'"+req.body.end_time+"\', \'"+req.body.name+"\', \'"+ image+"\', NOW(), NOW(), \'"+req.body.event_type+"\', "+req.body.agenda_id+")"
            }
            else if(more){
                sqlQuery="INSERT INTO agenda_events(date, start_time, end_time, name, more, created_at, updated_at, event_type_id, agenda_id) VALUES(\'"+req.body.date+"\', \'"+req.body.start_time+"\', \'"+req.body.end_time+"\', \'"+req.body.name+"\', \'"+more+"\', NOW(), NOW(), \'"+req.body.event_type+"\', "+req.body.agenda_id+")"
            }
            else{
                sqlQuery="INSERT INTO agenda_events(date, start_time, end_time, name, created_at, updated_at, event_type_id, agenda_id) VALUES(\'"+req.body.date+"\', \'"+req.body.start_time+"\', \'"+req.body.end_time+"\', \'"+req.body.name+"\', NOW(), NOW(), \'"+req.body.event_type+"\', "+req.body.agenda_id+")"
            }
        }
        database.query(sqlQuery)
          .then(function(events) {
            // We don't need spread here, since only the results will be returned for select queries
            if(events){
                res.statusCode=200;
                res.json({message: "This event has been post"});
            }
            else{
                res.statusCode=401;
                res.send("Failed to insert this event");
            }

        });
    }
    else{
        res.statusCode=403;
        res.send("Missing parameters");
    }
});




module.exports = router;
