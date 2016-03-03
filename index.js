var KServer = function () {
  var INSTANCE = this;
  INSTANCE.forIn = function (coll, fn) {
    Object.keys(coll).forEach(function (o) {
      fn(coll[o], o);
    });
  };
  var SLASH = "/";
  var express = require("express");
  INSTANCE.APP_ROOT = __dirname + "/../..";
  INSTANCE.path = require("path");
  INSTANCE.multer = require("multer");
  INSTANCE.shortid = require("shortid");
  INSTANCE.mapper = require("sqlite3-orm");
  var crudHandlers = require("./handlers.js");
  var install = function (models) {
    crudHandlers.config(INSTANCE.APP_ROOT, INSTANCE, models);
    if (INSTANCE.config.file) {
      INSTANCE.app.get(SLASH, crudHandlers.sendAppFile);
    }
    INSTANCE.forIn(models, function (m, uid) {
      if (m.session) {
        INSTANCE.config.sessionModel = uid;
        INSTANCE.app.post(INSTANCE.api_root + "session/:" + uid,
          INSTANCE.regular.array(),
          crudHandlers.authenticate);
        return;
      }
    });
    INSTANCE.app.use(INSTANCE.api_root + ":model", crudHandlers.handleModel);
    INSTANCE.app.use(INSTANCE.api_root + ":model/:id", crudHandlers.handleModel);

    INSTANCE.app.get(INSTANCE.api_root + ":model", crudHandlers.readModel);
    INSTANCE.app.post(INSTANCE.api_root + ":model", INSTANCE.regular.array(),
      crudHandlers.createModel);
    INSTANCE.app.put(INSTANCE.api_root + ":model/:id", INSTANCE.regular.array(),
      crudHandlers.updateModel);
    INSTANCE.app.delete(INSTANCE.api_root + ":model/:id", INSTANCE.regular.array(),
      crudHandlers.deleteModel);
    INSTANCE.app.listen(INSTANCE.config.port);
    console.log("Krasny server listening at ~:" + INSTANCE.config.port);
  };
  INSTANCE.build = function (prop) {
    INSTANCE.models = prop.models;
    INSTANCE.config = prop.config;

    INSTANCE.app = express();
    INSTANCE.api_root = INSTANCE.config.api ? SLASH + INSTANCE.config.api +
      SLASH : SLASH;
    INSTANCE.mapper.connect(INSTANCE.config.db, INSTANCE.config.verbosedb ||
      false);

    INSTANCE.regular = INSTANCE.multer();

    if (prop.config.uploaddir && prop.config.fileinput) {
      var tmp = INSTANCE.multer.diskStorage({
        destination: function (req, file, callback) {
          callback(null, INSTANCE.config.uploaddir);
        },
        filename: function (req, file, callback) {
          callback(null, file.fieldname + '-' + Date.now() + "." +
            file.originalname.split(".").pop());
        }
      });

      var upload = INSTANCE.multer({
        storage: tmp
      }).single(INSTANCE.config.fileinput);
      INSTANCE.app.post(INSTANCE.api_root + INSTANCE.config.fileinput,
        upload, crudHandlers.fileUpload);
      INSTANCE.app.get(INSTANCE.api_root + "download/:filepath",
        crudHandlers.fileDownload);
    }

    INSTANCE.app.use(express.static(INSTANCE.path.join(INSTANCE.APP_ROOT, INSTANCE.config
      .rootdir)));
    if (INSTANCE.config.reset) {
      INSTANCE.mapper.dropTables(INSTANCE.models);
    }
    INSTANCE.mapper.createTables(INSTANCE.models, install);
  };
  return INSTANCE;
};
module.exports = new KServer();
