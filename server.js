let db = require("./database");
let { rdb, server } = require("./config.json");
let express = require("express");

let app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.listen(server.port, () => {
  console.log(`Server ready!\nPort: ${server.port}`);
  db.init();
});
