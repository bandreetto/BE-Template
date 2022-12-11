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

  await seed(dbPath);
});

test.after.always(t => {
  t.context.server.close();
});

test("GET contracts/:id (200)", async t => {
  let response = await t.context.got("contracts/1", {
    throwHttpErrors: false,
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

  response = await t.context.got("contracts/1", {
    throwHttpErrors: false,
    headers: {
      profile_id: 5,
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

test("GET contracts/:id (403 - not contract owner)", async t => {
  const response = await t.context.got("contracts/1", {
    throwHttpErrors: false,
    headers: {
      profile_id: 2,
    },
  });

  t.is(response.statusCode, 403);
});

test("GET contracts (200 - clients request)", async t => {
  const response = await t.context.got("contracts", {
    throwHttpErrors: false,
    headers: {
      profile_id: 1,
    },
  });

  t.is(response.statusCode, 200);

  const body = JSON.parse(response.body);
  t.is(body.length, 2);

  const expectedContracts = new Set([1, 2]);
  t.is(
    body.every(contract => expectedContracts.has(contract.id)),
    true
  );
});

test("GET contracts (200 - contractor request)", async t => {
  const response = await t.context.got("contracts", {
    throwHttpErrors: false,
    headers: {
      profile_id: 5,
    },
  });

  t.is(response.statusCode, 200);

  const body = JSON.parse(response.body);
  t.is(body.length, 1);

  const expectedContracts = new Set([1]);
  t.is(
    body.every(contract => expectedContracts.has(contract.id)),
    true
  );
});
