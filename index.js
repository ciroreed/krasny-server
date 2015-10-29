exports.build = function(configuration) {
  var express = require('express');
  var bodyParser = require('body-parser');
  var path = require('path');
  var app = express();
  var mapper = require('sqlite3_mapper').dbpath(configuration.dbpath);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, configuration.publicdir)));
  if(configuration.reset){
    mapper.droptables(configuration.models);
  }
  mapper.createtables(configuration.models, function(entities){
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
      next();
    });
    app.get('/:modelname', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.json({code: 1});
      mapper.read({entity: req.entity, type: 'collection'}, function(arr){
        res.json(arr);
      });
    });
    app.post('/:modelname', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.json({code: 1});
      mapper.create({entity: req.entity, subject: req.body}, function(){
        res.json({code: 0});
      });
    });
    app.put('/:modelname/:id', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.json({code: 1});
      mapper.update({entity: req.entity, subject: req.body, where: {id: req.params.id}}, function(){
        res.json({code: 0});
      });
    });
    app.delete('/:modelname/:id', function(req, res){
      if(entities.indexOf(req.params.modelname) === -1) res.json({code: 1});
      mapper.delete({entity: req.entity, where: {id: req.params.id}}, function(){
        res.json({code: 0});
      });
    });
  });
  app.listen(configuration.port);
  console.log('krasny listening at ~:' + configuration.port);
}
