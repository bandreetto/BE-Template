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
  t.context.got = got.extend({ prefixUrl: await listen(t.context.server) });

  await seed();
});

test.after.always(t => {
  t.context.server.close();
});

test("GET profiles/:id (200)", async t => {
  let response = await t.context.got("profiles/1", {
    throwHttpErrors: false,
    headers: {
      profile_id: 1,
    },
  });

  t.is(response.statusCode, 200);
  t.like(JSON.parse(response.body), {
    id: 1,
    firstName: "Harry",
    lastName: "Potter",
    profession: "Wizard",
    balance: 1150,
    type: "client",
  });
});

test("GET profiles/:id (403)", async t => {
  let response = await t.context.got("profiles/1", {
    throwHttpErrors: false,
    headers: {
      profile_id: 2,
    },
  });

  t.is(response.statusCode, 403);
});
