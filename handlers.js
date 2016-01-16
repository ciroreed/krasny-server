var CrudHandler = function () {
  var INSTANCE = this;
  var METHODS = {
    GET: "read",
    POST: "create",
    PUT: "update",
    DELETE: "delete"
  };
  var handleConnection = function (res, status, next) {
    if (status === 200 && next) {
      next();
    } else {
      res.status(status);
      res.end();
    }
  };
  INSTANCE.config = function (appRoot, serverInstance, models) {
    INSTANCE.appRoot = appRoot;
    INSTANCE.serverInstance = serverInstance;
    INSTANCE.models = models;
    INSTANCE.auths = [];
  };
  INSTANCE.sendAppFile = function (req, res) {
    res.sendFile(INSTANCE.appRoot + INSTANCE.serverInstance.config.file);
  };
  INSTANCE.handleModel = function (req, res, next) {
    var code = 404;
    INSTANCE.models.forEach(function (m) {
      if (m.uid === req.params.model) {
        code = 200;
        if (m.token && INSTANCE.auths.indexOf(req.query.token) === -1) {
          code = 401;
        }
        if (m.required && !m.required[METHODS[req.method]].every(
            function (e) {
              return req.body.hasOwnProperty(e);
            })) {
          code = 400;
        }
        if (m.token && m.token[METHODS[req.method]]) {
          res.locals.authkey = {};
          res.locals.authkey[m.token[METHODS[req.method]]] = INSTANCE.auths
            .indexOf(req.query.token);
        }
        if (m.hide) {
          res.locals.hideprops = m.hide;
        }
        if (m.unique) {
          INSTANCE.serverInstance.logger.print(
            "uniqueprop set in response object");
          res.locals.uniqueprop = m.unique;
        }
      }
    });
    handleConnection(res, code, next);
  };
  INSTANCE.readModel = function (req, res) {
    INSTANCE.serverInstance.mapper.read({
      entity: req.params.model,
      type: req.params.id ? "single" : "collection",
      where: req.params.id ? req.params.id : res.locals.authkey ||
        undefined
    }, function (err, result) {
      if (err) {
        handleConnection(res, 500);
        return false;
      }
      if (res.locals.hideprops) {
        var cookedResult = [];
        result.forEach(function (r) {
          for (var prop in r) {
            if (res.locals.hideprops.indexOf(prop)) {
              delete r[prop];
            }
          }
          cookedResult.push(r);
        });
        res.json(cookedResult);
      }
      res.json(result);
    });
  };
  INSTANCE.createModel = function (req, res) {
    var sendResponse = function (err) {
      var status = 200;
      if (err) {
        status = 406;
      }
      handleConnection(res, status);
    };
    for (var prop in res.locals.authkey) {
      req.body[prop] = res.locals.authkey[prop];
    }
    INSTANCE.serverInstance.logger.print("Check if uniqueprop exist", res.locals
      .uniqueprop, req.params.model, req.body);
    if (res.locals.uniqueprop) {
      var uniqueVal = {};
      uniqueVal[res.locals.uniqueprop] = req.body[res.locals.uniqueprop];
      INSTANCE.serverInstance.mapper.createUnique({
        entity: req.params.model,
        subject: req.body,
        unique: uniqueVal
      }, sendResponse);
    } else {
      INSTANCE.serverInstance.mapper.create({
        entity: req.params.model,
        subject: req.body
      }, sendResponse);
    }
  };
  INSTANCE.updateModel = function (req, res) {
    INSTANCE.serverInstance.mapper.update({
      entity: req.params.model,
      subject: req.body,
      where: {
        id: req.params.id
      }
    }, function (err) {
      var status = 200;
      if (err) {
        status = 406;
      }
      handleConnection(res, status);
    });
  };
  INSTANCE.deleteModel = function (req, res) {
    INSTANCE.serverInstance.mapper.remove({
      entity: req.params.model,
      where: {
        id: req.params.id
      }
    }, function (err) {
      var status = 200;
      if (err) {
        status = 406;
      }
      handleConnection(res, status);
    });
  };
  INSTANCE.authenticate = function (req, res) {
    INSTANCE.serverInstance.mapper.read({
      entity: req.params[INSTANCE.serverInstance.config.db.auth],
      where: req.body,
      type: "single"
    }, function (err, authModel) {
      if (authModel) {
        var UID = INSTANCE.serverInstance.shortid.generate();
        INSTANCE.serverInstance.logger.print("user logged in", authModel);
        INSTANCE.auths[authModel.id] = UID;
        INSTANCE.serverInstance.logger.print("auths", INSTANCE.auths);
        res.json({
          token: UID
        });
      } else {
        handleConnection(res, 401);
      }
    });
  };
  return INSTANCE;
}
module.exports = new CrudHandler();
