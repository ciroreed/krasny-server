var server = require("./index.js");
server.build({
  models: [{
    uid: "user",
    defaults: {
      id: 0,
      name: "",
      password: "",
      email: "",
      timestamp: ""
    },
    required: {
      create: ["name", "password", "email"],
      read: ["name", "password"],
      update: ["name", "password"],
      delete: ["name", "password"]
    },
    hide: ["id", "password"],
    unique: "email",
    session: true
  }, {
    uid: "mail",
    defaults: {
      id: 0,
      sender: 0,
      receiver: 0,
      message: ""
    },
    required: {
      create: ["receiver", "message"],
      read: [],
      update: ["id", "message"],
      delete: ["id"]
    },
    join: {
      read: {
        sender: {
          user: "email"
        }
      },
      create: {
        receiver: {
          user: "email"
        }
      }
    },
    token: {
      create: "sender",
      read: "receiver",
      update: "receiver",
      delete: "receiver"
    }
  }],
  //    file: "index.html",
  db: "./database",
  reset: false,
  public: "public",
  api: "rest",
  verbose: true,
  verbosedb: true,
  port: 80
});
