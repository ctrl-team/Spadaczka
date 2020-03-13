let router = require("express").Router();
let path = require("path");

router.get("/", (req, res) => {
  if (req.session.logged && req.session.email && req.session.username) {
    res.render(path.join("..", "/views/home.ejs"), {
      session: req.session
    });
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
