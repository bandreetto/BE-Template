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

test("GET /admin/best-profession (200)", async t => {
  const bestProfession = await t.context
    .got("admin/best-profession", {
      searchParams: {
        start: new Date("2020-08-14").toISOString(),
        end: new Date("2020-08-16").toISOString(),
      },
    })
    .text();

  t.is(bestProfession, "Programmer");
});

test("GET /admin/best-profession (400 - missing params)", async t => {
  const response = await t.context.got("admin/best-profession", {
    throwHttpErrors: false,
  });

  t.is(response.statusCode, 400);
  t.is(response.body, "Missing querystring params");
});
