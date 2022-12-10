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

app.get("/contracts", getProfile, async (req, res) => {
  const { Contract } = req.app.get("models");

  if (req.profile.type === "client") {
    const contracts = await Contract.findAll({
      where: { ClientId: req.profile.id },
    });
    return res.json(contracts);
  }

  if (req.profile.type === "contractor") {
    const contracts = await Contract.findAll({
      where: { ContractorId: req.profile.id },
    });
    return res.json(contracts);
  }

  throw new Error("Invalid profile type");
});
