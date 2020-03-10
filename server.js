let db = require("./database");
let { rdb, server } = require("./config.json");
let express = require("express");
let r = require("rethinkdb");
let session = require("express-session");
let bodyParser = require("body-parser");
let path = require("path");

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

app.get("/", (req, res) => {});

app.get("/login", (req, res) => {
  if (req.session.logged && req.session.username) return res.redirect("/home");
  let err = req.query.err;
  if (!err) err = null;
  res.render(`${__dirname}/views/login.ejs`, { err: err });
});

app.get("/home", (req, res) => {
  if (req.session.logged && req.session.username) {
    res.render(`${__dirname}/views/home.ejs`, {
      username: req.session.username
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/api/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    r.table(rdb.table)
      .filter({ username: username, password: password })
      .coerceTo("array")
      .run(global.conn, (err, dbres) => {
        if (err) console.error(err);
        if (dbres[0]) {
          req.session.logged = true;
          req.session.username = username;
          res.redirect("/home");
        } else {
          res.send("Incorrect Username and/or Password.");
        }
        res.end();
      });
  } else {
    res.send("Please enter Username or password.");
    res.end();
  }
});

app.get("/api/logout", (req, res) => {
  if (req.session.logged && req.session.username) {
    req.session.destroy();
    res.redirect("/login");
  } else {
    res.redirect("/login");
  }
});

app.listen(server.port, () => {
  console.log(`Server ready!\nPort: ${server.port}`);
  db.init();
});
