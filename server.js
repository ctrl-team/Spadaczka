let express = require("express");
let session = require("express-session");
let bodyParser = require("body-parser");
let { server } = require("./config.json");
let db = require("./database");

let app = express();
app.use(
  session({
    secret: "6902734598264871694726398126921757",
    resave: true,
    saveUninitialized: true
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

require("./router.js")(app);

app.listen(server.port, () => {
  console.log(`Server ready!\nPort: ${server.port}`);
  db.init();
});
