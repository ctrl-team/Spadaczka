module.exports = app => {
  app.use("/", require("./routes/index.js"));
  app.use("/home", require("./routes/home.js"));
  app.use("/api", require("./routes/api.js"));
};
