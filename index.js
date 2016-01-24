var KServer = function () {
  var INSTANCE = this;
  var APP_ROOT = __dirname + "/../..";
  var SLASH = '/';
  var express = require("express");
  var bodyParser = require("body-parser");
  var path = require("path");
  INSTANCE.shortid = require("shortid");
  INSTANCE.mapper = require("sqlite3-orm");
  INSTANCE.logger = require("log4node");
  var crudHandlers = require("./handlers.js");
  var install = function (models) {
    crudHandlers.config(APP_ROOT, INSTANCE, models);
    if (INSTANCE.config.file) {
      INSTANCE.app.get(SLASH, crudHandlers.sendAppFile);
    }
    models.forEach(function (m) {
      if (m.session) {
        INSTANCE.config.sessionModel = m.uid;
        INSTANCE.app.post(INSTANCE.api_root + "session/:" + m.uid,
          crudHandlers.authenticate);
        return;
      }
    });
    INSTANCE.app.use(INSTANCE.api_root + ":model", crudHandlers.handleModel);
    INSTANCE.app.use(INSTANCE.api_root + ":model/:id", crudHandlers.handleModel);
    INSTANCE.app.get(INSTANCE.api_root + ":model", crudHandlers.readModel);
    INSTANCE.app.get(INSTANCE.api_root + ":model/:id", crudHandlers.readModel);
    INSTANCE.app.post(INSTANCE.api_root + ":model", crudHandlers.createModel);
    INSTANCE.app.put(INSTANCE.api_root + ":model/:id", crudHandlers.updateModel);
    INSTANCE.app.delete(INSTANCE.api_root + ":model/:id", crudHandlers.deleteModel);
    INSTANCE.app.listen(INSTANCE.config.port);
    console.log("Krasny server listening at ~:" + INSTANCE.config.port);
  };
  INSTANCE.build = function (prop) {
    INSTANCE.config = prop.config;
    INSTANCE.models = prop.models;
    INSTANCE.app = express();
    INSTANCE.api_root = INSTANCE.config.api ? SLASH + INSTANCE.config.api +
      SLASH : SLASH;
    INSTANCE.mapper.connect(INSTANCE.config.db, INSTANCE.config.verbosedb ||
      false);
    INSTANCE.app.use(bodyParser.json());
    INSTANCE.app.use(bodyParser.urlencoded({
      extended: true
    }));
    INSTANCE.app.use(express.static(path.join(APP_ROOT, INSTANCE.config.public)));
    if (INSTANCE.config.reset) {
      INSTANCE.mapper.dropTables(INSTANCE.models);
    }
    INSTANCE.mapper.createTables(INSTANCE.models, install);
    INSTANCE.logger = new INSTANCE.logger(INSTANCE.config.verbose);
  };
  return INSTANCE;
};
module.exports = new KServer();
