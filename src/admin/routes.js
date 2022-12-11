import { Router } from "express";
import { col, fn, literal, Op } from "sequelize";
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

adminRouter.get("/best-clients", async (req, res) => {
  const { start, end, limit = 2 } = req.query;
  if (!start || !end) return res.status(400).send("Missing querystring params");

  const { Job, Contract } = req.app.get("models");
  const jobs = await Job.findAll({
    raw: true,
    attributes: [
      [col("Contract.Client.id"), "id"],
      [
        literal(
          "`Contract->Client`.firstName || ' ' || `Contract->Client`.lastName"
        ),
        "fullName",
      ],
      [fn("sum", col("price")), "paid"],
    ],
    where: {
      paymentDate: {
        [Op.gte]: start,
        [Op.lte]: end,
      },
    },
    limit,
    include: [{ model: Contract, include: ["Client"] }],
    group: ["Contract.Client.id"],
    order: [[fn("sum", col("price")), "DESC"]],
  });

  res.json(
    jobs.map(dbJob => ({
      id: dbJob.id,
      fullName: dbJob.fullName,
      paid: dbJob.paid,
    }))
  );
});
