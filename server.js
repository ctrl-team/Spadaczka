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
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
  let err = req.query.err;
  if (!err) err = null;
  res.render(`${__dirname}/views/login.ejs`, { err: err });
});

app.get("/register", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
  let err = req.query.err;
  if (!err) err = null;
  res.render(`${__dirname}/views/register.ejs`, { err: err });
});

app.get("/home", (req, res) => {
  if (req.session.logged && req.session.email) {
    res.render(`${__dirname}/views/home.ejs`, {
      username: req.session.username
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/api/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  email = email.split("@")[0] + "@" + email.split("@")[1].toLowerCase();
  if (email && password) {
    r.table(rdb.table)
      .filter({ email: email, password: password })
      .coerceTo("array")
      .run(global.conn, (err, dbres) => {
        if (err) console.error(err);
        if (dbres[0]) {
          req.session.logged = true;
          req.session.username = dbres[0]["username"];
          req.session.email = email;
          res.redirect("/home");
        } else {
          res.render(`${__dirname}/views/err.ejs`, {
            err: "Incorrect email and/ or password."
          });
        }
        res.end();
      });
  } else {
    res.render(`${__dirname}/views/err.ejs`, {
      err: "Please enter email and password."
    });
    res.end();
  }
});

function validateEmail(email) {
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email));
}

app.post("/api/register", (req, res) => {
  let email = req.body.email;
  let username = req.body.username;
  let password = req.body.password;
  if (!validateEmail(email))
    return res.render(`${__dirname}/views/err.ejs`, {
      err: "Email is not valid!"
    });
  email = email.split("@")[0] + "@" + email.split("@")[1].toLowerCase();
  if (email && password && username) {
    r.table(rdb.table)
      .filter({ email: email })
      .coerceTo("array")
      .run(global.conn, (err, dbres) => {
        if (!dbres[0]) {
          db.createAccount({
            email: email,
            username: username,
            password: password
          });
          req.session.email = email;
          req.session.username = username;
          req.session.logged = true;
          res.redirect("/home");
        } else {
          res.render(`${__dirname}/views/err.ejs`, {
            err: "Sorry email is actually in use."
          });
          res.end();
        }
      });
  } else {
    res.render(`${__dirname}/views/err.ejs`, {
      err: "Please enter email, username and password."
    });
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
