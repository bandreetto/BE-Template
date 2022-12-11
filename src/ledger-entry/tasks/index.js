import { validateDepositEntry } from "./validateDepositEntry.js";
import { validatePaymentEntry } from "./validatePaymentEntry.js";

export function startLedgerEntryTasks(app) {
  console.log("Starting LedgerEntry tasks");
  const stopValidatePaymentEntry = validatePaymentEntry(app);
  const stopValidateDepositEntry = validateDepositEntry(app);
  console.log("LedgerEntry tasks started");

  return () => {
    console.log("Stopping LedgerEntry tasks");
    stopValidatePaymentEntry();
    stopValidateDepositEntry();
    console.log("LedgerEntry tasks stopped");
  };
}
