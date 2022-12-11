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

test("GET /admin/best-clients (200)", async t => {
  const bestClients = await t.context
    .got("admin/best-clients", {
      searchParams: {
        start: new Date("2020-08-14").toISOString(),
        end: new Date("2020-08-16").toISOString(),
      },
    })
    .json();

  t.is(bestClients.length, 2);
  t.deepEqual(bestClients[0], { id: 4, fullName: "Ash Kethcum", paid: 2020 });
  t.deepEqual(bestClients[1], { id: 2, fullName: "Mr Robot", paid: 242 });
});

test("GET /admin/best-clients (200 - expanded limit)", async t => {
  const bestClients = await t.context
    .got("admin/best-clients", {
      searchParams: {
        start: new Date("2020-08-14").toISOString(),
        end: new Date("2020-08-16").toISOString(),
        limit: 3,
      },
    })
    .json();

  t.is(bestClients.length, 3);
  t.deepEqual(bestClients[0], { id: 4, fullName: "Ash Kethcum", paid: 2020 });
  t.deepEqual(bestClients[1], { id: 2, fullName: "Mr Robot", paid: 242 });
  t.deepEqual(bestClients[2], { id: 1, fullName: "Harry Potter", paid: 221 });
});

test("GET /admin/best-clients (400 - missing params)", async t => {
  const response = await t.context.got("admin/best-clients", {
    throwHttpErrors: false,
  });

  t.is(response.statusCode, 400);
  t.is(response.body, "Missing querystring params");
});
