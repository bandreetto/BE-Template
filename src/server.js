import { configureApp } from "./app.js";
import { startLedgerEntryTasks } from "./ledger-entry/tasks/index.js";

init();

async function init() {
  try {
    const app = configureApp();
    const stopTasks = startLedgerEntryTasks(app);
    app.on("close", stopTasks);
    app.listen(3001, () => {
      console.log("Express App Listening on Port 3001");
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
