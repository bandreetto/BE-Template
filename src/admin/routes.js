import { Router } from "express";
import { Op } from "sequelize";
import { bestProfession } from "./logic.js";

export const adminRouter = Router();

adminRouter.get("/best-profession", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).send("Missing querystring params");

  const { Job, Contract } = req.app.get("models");
  const jobs = await Job.findAll({
    where: {
      paymentDate: {
        [Op.gte]: start,
        [Op.lte]: end,
      },
    },
    include: [{ model: Contract, include: ["Contractor"] }],
  });

  res.send(bestProfession(jobs));
});
