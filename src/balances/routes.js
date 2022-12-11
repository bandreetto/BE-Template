import { Router } from "express";
import { getProfile } from "../middleware/getProfile.js";

export const balancesRouter = Router();

balancesRouter.post("/deposit/:profile_id", getProfile, async (req, res) => {
  const { profile_id } = req.params;

  if (parseInt(profile_id) !== req.profile.id) return res.sendStatus(403);

  const { LedgerEntry } = req.app.get("models");
  const entry = await LedgerEntry.create({
    amount: req.body.amount,
    type: "deposit",
    status: "not-validated",
    ClientId: req.profile.id,
  });

  while (true) {
    await entry.reload();
    if (entry.status === "validated") break;
    if (entry.cancelReason === "limit-exceeded")
      return res.status(400).send("Deposit limit exceeded");
    if (entry.status === "canceled") throw new Error("Deposit failed");
  }

  res.sendStatus(200);
});
