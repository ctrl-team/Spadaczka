let r = require("rethinkdb");

module.exports = async database => {
  try {
    global.conn = await r.connect(database);
    console.log("Database Ready!");
  } catch (err) {
    if (err.message.includes("ECONNREFUSED")) {
      console.error(`No RethinkDB detected.`);
    }
    while (true) {}
  }
};
