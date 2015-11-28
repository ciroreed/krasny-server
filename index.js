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
    app.use('/:modelname', function(req, res, next) {
      if(entities.indexOf(req.params.modelname) === -1){
        res.status(404);
        res.end();
      } else {
        next();
      }
    });
    app.use('/:modelname/*', function(req, res, next) {
      if(entities.indexOf(req.params.modelname) === -1){
        res.status(404);
        res.end();
      } else {
        next();
      }
    });
    app.get('/:modelname', function(req, res){
      mapper.read({entity: req.params.modelname, type: 'collection'}, function(arr){
        res.json(arr);
      });
    });
    app.post('/:modelname', function(req, res){
      mapper.create({entity: req.params.modelname, subject: req.body}, function(){
        res.json({code: 0});
      });
    });
    app.put('/:modelname/:id', function(req, res){
      mapper.update({entity: req.params.modelname, subject: req.body, where: {id: req.params.id}}, function(){
        res.json({code: 0});
      });
    });
    app.delete('/:modelname/:id', function(req, res){
      mapper.delete({entity: req.params.modelname, where: {id: req.params.id}}, function(){
        res.json({code: 0});
      });
    });
  });
  app.listen(configuration.port);
  console.log('krasny listening at ~:' + configuration.port);
}
