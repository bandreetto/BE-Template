import express from "express";
import bodyParser from "body-parser";

import { initSequelize } from "./model.js";
import { getProfile } from "./middleware/getProfile.js";

const app = express();

export function configureApp(dbPath) {
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

  if (
    req.profile.id !== contract.ClientId &&
    req.profile.id !== contract.ContractorId
  )
    return res.status(403).end();

  if (!contract) return res.status(404).end();

  res.json(contract);
});
