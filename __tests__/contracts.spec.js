const test = require("ava");
const { seed } = require("../scripts/seedFunction");
const { configureApp } = require("../src/app");

const dbPath = "./contracts-test.database.sqlite3";

test.before(async () => {
  const app = configureApp(dbPath);

  app.listen(4000, () =>
    console.log("Contracts testing server listening on port 4000")
  );

  await seed(dbPath);
});

test("GET contracts/:id (200)", t => {
  t.fail();
});
