let r = require("rethinkdb");
let { rdb } = require("../config.json");

module.exports = async data => {
  r.table(rdb.table)
    .insert(data)
    .run(global.conn, (err, res) => {
      if (err) {
        if (err.name == "ReqlOpFailedError") {
          console.error(`Table ${rdb.table} don't exists in database`);
        }
      }
    });
};
