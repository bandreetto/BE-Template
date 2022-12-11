import { Router } from "express";

export const profilesRouter = Router();

/**
 * @returns profile by id
 */
profilesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { profile_id } = req.headers;

  if (profile_id !== id) return res.sendStatus(403);

  const { Profile } = req.app.get("models");
  const profile = await Profile.findByPk(id);

  if (!profile) res.sendStatus(404);

  res.json(profile);
});
