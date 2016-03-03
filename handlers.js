var CrudHandler = function () {
  var INSTANCE = this;
  var METHODS = {
    GET: "read",
    POST: "create",
    PUT: "update",
    DELETE: "delete"
  };
  var filterResult = function (rawResult, predicate, authModel) {
    var cookedResult = [];
    for (var i = 0; i < rawResult.length; i++) {
      if (predicate(rawResult[i], authModel)) {
        cookedResult.push(rawResult[i]);
      }
    }
    return cookedResult;
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
    INSTANCE.auths = {};
  };
  INSTANCE.sendAppFile = function (req, res) {
    res.sendFile(INSTANCE.serverInstance.path.resolve(INSTANCE.serverInstance
      .config.rootdir + "/" + INSTANCE.serverInstance.config.file));
  };
  INSTANCE.handleModel = function (req, res, next) {
    var code = 404;
    INSTANCE.serverInstance.forIn(INSTANCE.models, function (m, uid) {
      if (uid === req.params.model) {
        code = 200;
        res.locals.contextModel = m;
        if (m.crud && m.crud[METHODS[req.method]] &&
          m.crud[METHODS[req.method]].length > 1 &&
          typeof INSTANCE.auths[req.query.token] === "undefined") {
          code = 401
        } else if (m.crud && m.crud[METHODS[req.method]]) {
          res.locals.authModel = INSTANCE.auths[req.query.token];
        }
        if (m.hide) {
          res.locals.hideprops = m.hide;
        }
        if (m.unique) {
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
      where: req.params.id || undefined
    }, function (err, result) {
      if (err) {
        handleConnection(res, 500);
        return false;
      }
      if (res.locals.contextModel.crud && res.locals.contextModel.crud.read) {
        res.json(filterResult(result, res.locals.contextModel.crud.read,
          res.locals.authModel));
      } else {
        res.json(result);
      }
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
    if (res.locals.contextModel.crud && res.locals.contextModel.crud.create) {
      req.body = res.locals.contextModel.crud.create(req.body,
        res.locals.authModel);
    }
    if (!req.body) {
      handleConnection(res, 401);
      return;
    }
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
    if (res.locals.contextModel.crud && res.locals.contextModel.crud.update) {
      req.body = res.locals.contextModel.crud.update(req.body,
        res.locals.authModel);
    }

    if (!req.body) {
      handleConnection(res, 401);
      return;
    }
    delete req.body.id;

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
    if (res.locals.contextModel.crud.delete(req.body,
      res.locals.authModel)) {
      handleConnection(res, 401);
      return;
    }
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
      entity: req.params[INSTANCE.serverInstance.config.sessionModel],
      where: req.body,
      type: "single"
    }, function (err, authModel) {
      if (authModel) {
        var UID = INSTANCE.serverInstance.shortid.generate();
        INSTANCE.auths[UID] = authModel;
        res.json({
          token: UID,
          sessionModel: authModel
        });
      } else {
        handleConnection(res, 401);
      }
    });
  };
  INSTANCE.fileUpload = function (req, res) {
    res.json({
      code: 0,
      upload: req.file
    });
  };
  INSTANCE.fileDownload = function(req, res){
    var file = INSTANCE.serverInstance.APP_ROOT + "/" + INSTANCE.serverInstance.config.uploaddir + "/" + req.params.filepath;
    res.download(file);
  };
  return INSTANCE;
}
module.exports = new CrudHandler();
