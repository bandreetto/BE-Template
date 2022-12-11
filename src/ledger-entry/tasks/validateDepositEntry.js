import { Op, Transaction } from "sequelize";

export function validateDepositEntry(app) {
  let validateDepositEntryImmediate = setImmediate(task);

  async function task() {
    let transaction;
    let unvalidatedEntry;
    try {
      const { LedgerEntry, Contract, Job, Profile } = app.get("models");

      unvalidatedEntry = await LedgerEntry.findOne({
        where: {
          type: "deposit",
          status: "not-validated",
        },
      });

      if (!unvalidatedEntry) {
        if (validateDepositEntryImmediate)
          validateDepositEntryImmediate = setImmediate(task);
        return;
      }

      const sequelize = app.get("sequelize");
      transaction = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      });

      const activeContracts = await Contract.findAll(
        {
          where: {
            status: "in_progress",
            ClientId: unvalidatedEntry.ClientId,
          },
        },
        { transaction }
      );
      const unpaidJobs = await Job.findAll(
        {
          where: {
            ContractId: activeContracts.map(contract => contract.id),
            paid: {
              [Op.not]: true,
            },
          },
        },
        { transaction }
      );

      const unpaidAmount = unpaidJobs.reduce(
        (acc, curr) => acc + curr.price,
        0
      );
      const depositAmount = unvalidatedEntry.amount;

      if (depositAmount / unpaidAmount > 0.25) {
        await unvalidatedEntry.update({
          status: "canceled",
          cancelReason: "limit-exceeded",
        });
        if (validateDepositEntryImmediate)
          validateDepositEntryImmediate = setImmediate(task);
        return;
      }

      const client = await Profile.findByPk(unvalidatedEntry.ClientId, {
        transaction,
      });
      await Promise.all([
        client.increment("balance", {
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

    if (validateDepositEntryImmediate)
      validateDepositEntryImmediate = setImmediate(task);
  }

  return () => {
    if (validateDepositEntryImmediate)
      clearImmediate(validateDepositEntryImmediate);
    validateDepositEntryImmediate = null;
    console.log("validateDepositEntry task stopped");
  };
}
