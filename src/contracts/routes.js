import { Router } from "express";
import { Op } from "sequelize";
import { getProfile } from "../middleware/getProfile.js";

export const contractsRouter = Router();

/**
 * @returns contract by id
 */
contractsRouter.get("/:id", getProfile, async (req, res) => {
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

/**
 * @returns contracts owned by the requesting user
 */
contractsRouter.get("/", getProfile, async (req, res) => {
  const { Contract } = req.app.get("models");

  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [{ ClientId: req.profile.id }, { ContractorId: req.profile.id }],
    },
  });

  res.json(contracts);
});
