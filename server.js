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
  if (req.session.logged && req.session.email && req.session.username) {
    res.render(`${__dirname}/views/home.ejs`, {
      session: req.session
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/home/friends", (req, res) => {
  if (!req.session.logged && !req.session.email && !req.session.username)
    return res.redirect("/login");
  r.table(rdb.table)
    .filter({
      email: req.session.email,
      username: req.session.username
    })
    .coerceTo("array")
    .run(global.conn, (err, dbres) => {
      if (err) console.error(err);
      res.render(`${__dirname}/views/friends.ejs`, {
        friends: dbres[0]["friends"],
        pending: dbres[0]["friends_pending"],
        received: dbres[0]["friends_received"]
      });
      /*res.send(
        `Friends: ${dbres[0]["friends"]}<br/>Pending: ${dbres[0]["friends_pending"]}<br/>Received: ${dbres[0]["friends_received"]}`
      );*/
    });
});

app.post("/api/login", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
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
          req.session.tag = dbres[0]["tag"];
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

app.post("/api/register", async (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
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
      .run(global.conn, async (err, dbres) => {
        if (!dbres[0]) {
          r.table(rdb.table)
            .count()
            .run(global.conn, (err, count) => {
              let tag = count + 1;
              let account = {
                username: username,
                email: email,
                password: password,
                tag: tag,
                id: tag,
                friends_pending: [],
                friends_received: [],
                friends: []
              };
              db.createAccount(account);
              req.session.email = email;
              req.session.username = username;
              req.session.tag = tag;
              req.session.logged = true;
              res.redirect("/home");
            });
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

app.post("/api/friends/add", (req, res) => {
  if (!req.session.logged && !req.session.email && !req.session.username)
    return res.redirect("/login");
  let username = req.body.username;
  if (!username) return res.redirect("/home");
  username = username.split("#");
  if (!username[1]) return res.redirect("/home");
  r.table(rdb.table)
    .filter({ username: username[0], tag: parseInt(username[1]) })
    .coerceTo("array")
    .run(global.conn, (err, dbres) => {
      if (err) console.error(err);
      if (!dbres) return res.redirect("/home");
      if (!dbres[0]) return res.redirect("/home");
      r.table(rdb.table)
        .filter({
          email: req.session.email,
          username: req.session.username
        })
        .coerceTo("array")
        .run(global.conn, (err, dbres) => {
          if (err) console.error(err);
          if (!dbres[0]) return res.redirect("/home");
          let pending = JSON.stringify(dbres[0]["friends_pending"]);
          pending = JSON.parse(pending);
          if (
            `${username[0]}#${username[1]}` ==
            `${req.session.username}#${req.session.tag}`
          )
            return res.redirect("/home");
          if (!pending.indexOf(`${username[0]}#${username[1]}`))
            return res.redirect("/home");
          pending.push(`${username[0]}#${username[1]}`);
          r.table(rdb.table)
            .filter({
              email: req.session.email,
              username: req.session.username
            })
            .update({ friends_pending: pending })
            .run(global.conn, (err, dbres) => {
              if (err) console.error(err);
            });
          r.table(rdb.table)
            .filter({
              username: username[0],
              tag: parseInt(username[1])
            })
            .coerceTo("array")
            .run(global.conn, (err, dbres) => {
              let received = JSON.parse(
                JSON.stringify(dbres[0]["friends_received"])
              );
              received.push(`${req.session.username}#${req.session.tag}`);
              r.table(rdb.table)
                .filter({
                  username: username[0],
                  tag: parseInt(username[1])
                })
                .update({ friends_received: received })
                .run(global.conn, (err, dbres) => {
                  if (err) console.error(err);
                });
              res.redirect("/home");
            });
        });
    });
});

app.post("/api/friends/accept", (req, res) => {
  if (!req.session.logged && !req.session.email && !req.session.username)
    return res.redirect("/login");
  let id = parseInt(req.body.id);
  r.table(rdb.table)
    .filter({ tag: id })
    .coerceTo("array")
    .run(global.conn, (err, dbres) => {
      let friends = JSON.parse(JSON.stringify(dbres[0]["friends"]));
      friends.push(`${req.session.username}#${req.session.tag}`);
      r.table(rdb.table)
        .filter({ tag: id })
        .coerceTo("array")
        .update({ friends: friends })
        .run(global.conn, (err, dbres) => {
          //if (err) console.error(err);
        });
    });
  r.table(rdb.table)
    .filter({ tag: parseInt(req.session.tag) })
    .coerceTo("array")
    .run(global.conn, (err, dbres) => {
      r.table(rdb.table)
        .filter({ tag: id })
        .coerceTo("array")
        .run(global.conn, (err, dbres2) => {
          let friends = JSON.parse(JSON.stringify(dbres[0]["friends"]));
          friends.push(`${dbres2[0]["username"]}#${dbres2[0]["id"]}`);
          r.table(rdb.table)
            .filter({ tag: req.session.tag })
            .update({ friends: friends /*, friends_received: received */ })
            .run(global.conn, (err, dbres) => {
              if (err) console.error(err);
            });
        });
    });
  res.redirect("/home/friends");
});

app.get("/api/logout", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username) {
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
