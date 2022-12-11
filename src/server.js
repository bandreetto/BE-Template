import { configureApp } from "./app.js";
import {
  startLedgerEntryTasks,
  stopLedgerEntryTasks,
} from "./ledger-entry/tasks.js";

init();

async function init() {
  try {
    const app = configureApp();
    startLedgerEntryTasks(app);
    app.on("close", stopLedgerEntryTasks);
    app.listen(3001, () => {
      console.log("Express App Listening on Port 3001");
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
