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
