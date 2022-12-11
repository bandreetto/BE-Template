import { Transaction } from "sequelize";

export function validatePaymentEntry(app) {
  let validatePaymentEntryImmediate = setImmediate(task);

  async function task() {
    let transaction;
    let unvalidatedEntry;
    try {
      const { LedgerEntry, Profile } = app.get("models");

      unvalidatedEntry = await LedgerEntry.findOne({
        where: {
          type: "payment",
          status: "not-validated",
        },
      });

      if (!unvalidatedEntry) {
        if (validatePaymentEntryImmediate)
          validatePaymentEntryImmediate = setImmediate(task);
        return;
      }

      const sequelize = app.get("sequelize");
      transaction = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      });

      const client = await Profile.findByPk(unvalidatedEntry.ClientId, {
        transaction,
      });
      if (unvalidatedEntry.amount > client.balance) {
        await unvalidatedEntry.update({
          status: "canceled",
          cancelReason: "insufficient-balance",
        });
        if (validatePaymentEntryImmediate)
          validatePaymentEntryImmediate = setImmediate(task);
        return;
      }

      const contractor = await Profile.findByPk(unvalidatedEntry.ContractorId, {
        transaction,
      });
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
      console.error(
        "Failed to consume unvalidated entry",
        unvalidatedEntry.id,
        error
      );
      if (transaction) await transaction.rollback();
    }

    if (validatePaymentEntryImmediate)
      validatePaymentEntryImmediate = setImmediate(task);
  }

  return () => {
    if (validatePaymentEntryImmediate)
      clearImmediate(validatePaymentEntryImmediate);
    validatePaymentEntryImmediate = null;
    console.log("validatePaymentEntry task stopped");
  };
}
