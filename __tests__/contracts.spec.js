import test from "ava";
import listen from "test-listen";
import got from "got";
import http from "http";
import { configureApp } from "../src/app.js";
import { seed } from "../scripts/seedFunction.js";

const dbPath = ":memory:";

test.before(async t => {
  const app = configureApp(dbPath);

  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);

  await seed(dbPath);
});

test.after.always(t => {
  t.context.server.close();
});

test("GET contracts/:id (200)", async t => {
  const response = await got("contracts/1", {
    prefixUrl: t.context.prefixUrl,
    headers: {
      profile_id: 1,
    },
  });

  t.is(response.statusCode, 200);
  t.like(JSON.parse(response.body), {
    id: 1,
    terms: "bla bla bla",
    status: "terminated",
    ClientId: 1,
    ContractorId: 5,
  });
});
