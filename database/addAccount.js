let r = require("rethinkdb");
let config = require("../config.json");

module.exports = async data => {
  r.table(config.rethinkdb.table)
    .insert(data)
    .run(global.conn, (err, res) => {
      if (err) {
        if (err.name == "ReqlOpFailedError") {
          console.error(
            `Table ${config.rethinkdb.table} don't exists in database`
          );
        }
      }
    });
};
