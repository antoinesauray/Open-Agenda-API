'use scrict';

var supertest = require("supertest");
var should = require("should");

// This agent refers to PORT where program is runninng.

var server = supertest.agent("http://localhost:3000");

// UNIT test begin

var config = require('./config');
// valid
var valid_facebook_token = config.valid.facebook_token;
var valid_email = config.valid.email;
var valid_password = config.valid.password;
var valid_first_name = config.valid.first_name;
var valid_last_name = config.valid.last_name;

// invalid
var invalid_facebook_token = config.invalid.facebook_token;

var token=null;

describe("EDT API test",function(){

     it("should sign up with Facebook",function(done){
         server
         .post("/users")
         .send({facebook_token: valid_facebook_token})
         .expect("Content-type",/json/)
         .expect(201) // THis is HTTP response
         .end(function(err,res){
            res.status.should.equal(200||201);
            done();
        });
    });

    it("should sign in with Facebook",function(done){
        server
        .post("/users")
        .send({facebook_token: valid_facebook_token})
        .expect("Content-type",/json/)
        .expect(200) // THis is HTTP response
        .end(function(err,res){
           res.status.should.equal(200);
           token = res.body.token;
           console.log("token="+token);
           done();
       });
   });

   it("should sign up with email",function(done){
       server
       .post("/users")
       .send({email: valid_email, password: valid_password, first_name: valid_first_name, last_name: valid_last_name})
       .expect("Content-type",/json/)
       .expect(201) // THis is HTTP response
       .end(function(err,res){
          res.status.should.equal(201);
          done();
      });
  });

  it("should sign in with email",function(done){
      server
      .post("/users")
      .send({email: valid_email, password: valid_password})
      .expect("Content-type",/json/)
      .expect(201) // THis is HTTP response
      .end(function(err,res){
         res.status.should.equal(200);
         done();
     });
 });

  it("should sign in with Facebook",function(done){
      server
      .post("/users")
      .send({facebook_token: valid_facebook_token})
      .expect("Content-type",/json/)
      .expect(200) // THis is HTTP response
      .end(function(err,res){
         res.status.should.equal(200);
         token = res.body.token;
         console.log("token="+token);
         done();
     });
 });

   it("should display user informations",function(done){
       server
       .get("/me")
       .send({token: token})
       .expect("Content-type",/json/)
       .expect(200) // THis is HTTP response
       .end(function(err,res){
          res.status.should.equal(200);
          done();
      });
  });

  it("should display user agendas",function(done){
      server
      .get("/me/agendas")
      .send({token: token})
      .expect("Content-type",/json/)
      .expect(200) // THis is HTTP response
      .end(function(err,res){
         res.status.should.equal(200);
         done();
     });
 });


 it("should display user events",function(done){
     server
     .get("/me/events/2016-09-16/2016-10-16")
     .send({token: token})
     .expect("Content-type",/json/)
     .expect(200) // THis is HTTP response
     .end(function(err,res){
        res.status.should.equal(200);
        done();
    });
});
it("should post an event",function(done){
    server
    .post("/me/events")
    .send({token: token, name: "Test event", agenda_id: 8, provider: "edt", start_time: "2016-12-31 18:00:00+01", end_time: "2016-12-31 20:00:00+01"})
    .expect("Content-type",/json/)
    .expect(200) // THis is HTTP response
    .end(function(err,res){
       res.status.should.equal(200);
       done();
   });
});
it("should delete an event",function(done){
    server
    .delete("/me/events/26")
    .send({token: token, provider: "edt"})
    .expect("Content-type",/json/)
    .expect(200) // THis is HTTP response
    .end(function(err,res){
       res.status.should.equal(200);
       done();
   });
});

});
