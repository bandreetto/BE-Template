import { Router } from "express";
import { Op } from "sequelize";
import { getProfile } from "../middleware/getProfile.js";

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
