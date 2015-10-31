exports.build = function(configuration) {
  var dirname = __dirname + '/../..';
  var express = require('express');
  var bodyParser = require('body-parser');
  var path = require('path');
  var app = express();
  var mapper = require('sqlite3_mapper').dbpath(configuration.dbpath);
  if(configuration.reset){
    mapper.droptables(configuration.models);
  }
  mapper.createtables(configuration.models, function(entities){
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static(path.join(dirname, configuration.publicdir)));
    app.get('/', function(req, res){
        res.sendFile(dirname + configuration.mainFile);
    });
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
      next();
    });
    app.get('/:modelname', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.status(404).end();
      mapper.read({entity: req.params.modelname, type: 'collection'}, function(arr){
        res.json(arr);
      });
    });
    app.post('/:modelname', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.status(404).end();
      mapper.create({entity: req.params.modelname, subject: req.body}, function(){
        res.json({code: 0});
      });
    });
    app.put('/:modelname/:id', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.status(404).end();
      mapper.update({entity: req.params.modelname, subject: req.body, where: {id: req.params.id}}, function(){
        res.json({code: 0});
      });
    });
    app.delete('/:modelname/:id', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.status(404).end();
      mapper.delete({entity: req.params.modelname, where: {id: req.params.id}}, function(){
        res.json({code: 0});
      });
    });
  });
  app.listen(configuration.port);
  console.log('krasny listening at ~:' + configuration.port);
}
