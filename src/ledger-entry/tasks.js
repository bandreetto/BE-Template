let validateEntryImmediate;

export function startLedgerEntryTasks(app) {
  console.log("Starting LedgerEntry tasks");
  validateEntryImmediate = setImmediate(() => validateEntry(app));
}

export function stopLedgerEntryTasks() {
  console.log("Stopping LedgerEntry tasks");
  clearImmediate(validateEntryImmediate);
  validateEntryImmediate = null;
}

async function validateEntry(app) {
  const { LedgerEntry, Profile } = app.get("models");

  const unvalidatedEntry = await LedgerEntry.findOne({
    where: {
      status: "not-validated",
    },
  });

  if (!unvalidatedEntry) {
    if (validateEntryImmediate)
      validateEntryImmediate = setImmediate(() => validateEntry(app));
    return;
  }

  const client = await Profile.findByPk(unvalidatedEntry.ClientId);
  if (unvalidatedEntry.amount > client.balance) {
    unvalidatedEntry.update({
      status: "canceled",
      cancelReason: "insufficient-balance",
    });
    if (validateEntryImmediate)
      validateEntryImmediate = setImmediate(() => validateEntry(app));
    return;
  }

  const sequelize = app.get("sequelize");

  try {
    const transaction = await sequelize.transaction();

    const contractor = await Profile.findByPk(unvalidatedEntry.ContractorId);
    await Promise.all([
      client.decrement("balance", {
        by: unvalidatedEntry.amount,
        transaction,
      }),
      contractor.increment("balance", {
        by: unvalidatedEntry.amount,
        transaction,
      }),
      unvalidatedEntry.update(
        {
          status: "validated",
        },
        { transaction }
      ),
    ]);

    await transaction.commit();
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(
      "Failed to consume unvalidated entry",
      unvalidatedEntry.id,
      error
    );
  }

  if (validateEntryImmediate)
    validateEntryImmediate = setImmediate(() => validateEntry(app));
}
