const express = require("express");
const bodyParser = require("body-parser");
const { initSequelize } = require("./model");
const { getProfile } = require("./middleware/getProfile");
const app = express();

function configureApp(dbPath) {
  const sequelize = initSequelize(dbPath);
  app.set("sequelize", sequelize);
  app.set("models", sequelize.models);

  return app;
}

app.use(bodyParser.json());

/**
 * FIX ME!
 * @returns contract by id
 */
app.get("/contracts/:id", getProfile, async (req, res) => {
  const { id } = req.params;

  const { Contract } = req.app.get("models");
  const contract = await Contract.findOne({ where: { id } });
  if (!contract) return res.status(404).end();

  res.json(contract);
});

module.exports = { app, configureApp };
