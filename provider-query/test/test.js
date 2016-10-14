'use scrict';

var manager = require('../manager');

setTimeout(function() {
    var agendas = [];
    agendas.push({"provider": "univ-nantes", "id": 1});
    agendas.push({"provider": "univ-nantes", "id": 2});
    agendas.push({"provider": "univ-nantes", "id": 3});
    agendas.push({"provider": "univ-nantes", "id": 4});
    agendas.push({"provider": "univ-nantes", "id": 5});
    manager.eventsOnPeriod(agendas, "2016-08-31", "2016-11-30");
}, 3000);
