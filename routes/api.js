let router = require("express").Router();
let db = require("../database");
let { rdb, server } = require("../config.json");
let r = require("rethinkdb");
let path = require("path");

function validateEmail(email) {
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email));
}

router.post("/login", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
  let email = req.body.email;
  let password = req.body.password;
  if (!email.split("@")[1])
    return res.render(path.join("..", "/views/err.ejs"), {
      err: "Incorrect email and/ or password."
    });
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
          res.render(path.join("..", "/views/err.ejs"), {
            err: "Incorrect email and/ or password."
          });
        }
        res.end();
      });
  } else {
    res.render(path.join("..", "/views/err.ejs"), {
      err: "Please enter email and password."
    });
    res.end();
  }
});

router.post("/register", async (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
  let email = req.body.email;
  let username = req.body.username;
  let password = req.body.password;
  if (!validateEmail(email))
    return res.render(path.join("..", "/views/err.ejs"), {
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
                id: tag
              };
              db.createAccount(account);
              req.session.email = email;
              req.session.username = username;
              req.session.tag = tag;
              req.session.logged = true;
              res.redirect("/home");
            });
        } else {
          res.render(path.join("..", "/views/err.ejs"), {
            err: "Sorry email is actually in use."
          });
          res.end();
        }
      });
  } else {
    res.render(path.join("..", "/views/err.ejs"), {
      err: "Please enter email, username and password."
    });
    res.end();
  }
});

router.get("/logout", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username) {
    req.session.destroy();
    req.destroy();
    res.redirect("/login");
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
