let router = require("express").Router();
let path = require("path");

router.get("/", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username) {
    res.render(path.join("..", "/views/index.ejs"), { session: req.session });
  } else {
    res.render(path.join("..", "/views/index.ejs"), { session: null });
  }
});

router.get("/login", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
  let err = req.query.err;
  if (!err) err = null;
  res.render(path.join("..", "/views/login.ejs"), { err: err });
});

router.get("/register", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username)
    return res.redirect("/home");
  let err = req.query.err;
  if (!err) err = null;
  res.render(path.join("..", "/views/register.ejs"), { err: err });
});

module.exports = router;
