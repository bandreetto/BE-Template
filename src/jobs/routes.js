import { Router } from "express";
import { Op } from "sequelize";
import { getProfile } from "../middleware/getProfile.js";
import { Contract } from "../model.js";

export const jobsRouter = Router();

/**
 * @returns jobs for active contracts that are still unpaid
 */
jobsRouter.get("/unpaid", getProfile, async (req, res) => {
  const { Contract, Job } = req.app.get("models");

  const activeContracts = await Contract.findAll({
    where: {
      status: "in_progress",
      [Op.or]: [{ ClientId: req.profile.id }, { ContractorId: req.profile.id }],
    },
  });

  const unpaidJobs = await Job.findAll({
    where: {
      ContractId: activeContracts.map(contract => contract.id),
      paid: {
        [Op.not]: true,
      },
    },
  });

  res.json(unpaidJobs);
});

/**
 * @returns job that was paid
 */
jobsRouter.post("/:id/pay", getProfile, async (req, res) => {
  if (req.profile.type !== "client") return res.sendStatus(403);

  const { Job } = req.app.get("models");
  const { id } = req.params;
  const job = await Job.findByPk(id, {
    include: [Contract],
  });

  if (job.Contract.ClientId !== req.profile.id) return res.sendStatus(403);

  const { LedgerEntry } = req.app.get("models");
  const entry = await LedgerEntry.create({
    amount: job.price,
    type: "payment",
    status: "not-validated",
    ContractorId: job.Contract.ContractorId,
    ClientId: job.Contract.ClientId,
    JobId: job.id,
  });

  while (true) {
    await entry.reload();
    if (entry.status === "validated") break;
    if (entry.cancelReason === "insufficient-balance")
      return res.status(400).send("Insufficient balance");
    if (entry.status === "canceled") throw new Error("Payment failed");
  }

  await job.update({
    paid: true,
    paymentDate: new Date(),
  });

  res.json(job);
});
