var server = require("./index.js");
server.build({
  models: {
    user: {
      defaults: {
        id: 0,
        name: "",
        password: "",
        perm: 1
      },
      session: true
    },
    incidence: {
      defaults: {
        id: 0,
        owner: 0,
        title: "",
        permissionLevel: 2
      },
      crud: {
        read: function (incidence, session) {
          return session.perm > incidence.permissionLevel || session.id === incidence.owner;
        },
        create: function(incidence, session){
          if(session.perm === 0){
            incidence.owner = session.id
            return incidence;
          }
          return false;
        }
      }
    }
  },
  config: {
    db: "./database",
    rootdir: "public",
    api: "rest",
    verbosedb: true,
    port: 8080
  }
});
