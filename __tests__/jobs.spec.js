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

test("GET /jobs/unpaid (200 - client request)", async t => {
  const response = await got("jobs/unpaid", {
    throwHttpErrors: false,
    prefixUrl: t.context.prefixUrl,
    headers: {
      profile_id: 1,
    },
  });

  t.is(response.statusCode, 200);

  const body = JSON.parse(response.body);
  t.is(body.length, 1);
  t.like(body[0], {
    description: "work",
    price: 201,
    ContractId: 2,
    paid: null,
    paymentDate: null,
  });
});

test("GET /jobs/unpaid (200 - contractor request)", async t => {
  const response = await got("jobs/unpaid", {
    throwHttpErrors: false,
    prefixUrl: t.context.prefixUrl,
    headers: {
      profile_id: 6,
    },
  });

  t.is(response.statusCode, 200);

  const body = JSON.parse(response.body);
  t.is(body.length, 2);
  body.forEach(job => t.like(job, { paid: null, paymentDate: null }));
});
