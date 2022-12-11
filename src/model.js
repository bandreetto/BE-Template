import Sequelize from "sequelize";

export class Profile extends Sequelize.Model {}
export class Contract extends Sequelize.Model {}
export class Job extends Sequelize.Model {}
export class LedgerEntry extends Sequelize.Model {}

let sequelize;
export function initSequelize(dbPath) {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath || "./database.sqlite3",
    logging: false,
  });

  Profile.init(
    {
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      profession: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
      },
      type: {
        type: Sequelize.ENUM("client", "contractor"),
      },
    },
    {
      sequelize,
      modelName: "Profile",
    }
  );

  Contract.init(
    {
      terms: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("new", "in_progress", "terminated"),
      },
    },
    {
      sequelize,
      modelName: "Contract",
    }
  );

  Job.init(
    {
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      paid: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
      paymentDate: {
        type: Sequelize.DATE,
      },
    },
    {
      sequelize,
      modelName: "Job",
    }
  );

  LedgerEntry.init(
    {
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("not-validated", "validated", "canceled"),
        allowNull: false,
      },
      cancelReason: {
        type: Sequelize.ENUM("insufficient-balance"),
      },
    },
    {
      sequelize,
      modelName: "LedgerEntry",
    }
  );

  Profile.hasMany(Contract, { as: "Contractor", foreignKey: "ContractorId" });
  Contract.belongsTo(Profile, { as: "Contractor" });
  Profile.hasMany(Contract, { as: "Client", foreignKey: "ClientId" });
  Contract.belongsTo(Profile, { as: "Client" });
  Contract.hasMany(Job);
  Job.belongsTo(Contract);
  LedgerEntry.belongsTo(Job);
  LedgerEntry.belongsTo(Profile, {
    as: "Contractor",
    foreignKey: "ContractorId",
  });
  LedgerEntry.belongsTo(Profile, { as: "Client", foreignKey: "ClientId" });

  return sequelize;
}
