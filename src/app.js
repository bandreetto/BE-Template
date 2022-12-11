import express from "express";
import bodyParser from "body-parser";
import { initSequelize } from "./model.js";
import { contractsRouter } from "./contracts/routes.js";
import { jobsRouter } from "./jobs/routes.js";
import { profilesRouter } from "./profiles/routes.js";

const app = express();

export function configureApp(dbPath) {
  const sequelize = initSequelize(dbPath);
  app.set("sequelize", sequelize);
  app.set("models", sequelize.models);

  return app;
}

app.use(bodyParser.json());

app.use("/contracts", contractsRouter);
app.use("/jobs", jobsRouter);
app.use("/profiles", profilesRouter);
