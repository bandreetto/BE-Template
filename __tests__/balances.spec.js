import test from "ava";
import listen from "test-listen";
import got from "got";
import http from "http";
import { configureApp } from "../src/app.js";
import { seed } from "../scripts/seedFunction.js";
import { startLedgerEntryTasks } from "../src/ledger-entry/tasks/index.js";

const dbPath = ":memory:";

test.before(async t => {
  const app = configureApp(dbPath);

  t.context.app = app;
  t.context.server = http.createServer(app);
  t.context.got = got.extend({ prefixUrl: await listen(t.context.server) });

  await seed();
});

test.after.always(t => {
  t.context.server.close();
});

test.serial("POST /balances/deposit/:userId (200)", async t => {
  const poorClient = await t.context
    .got("profiles/1", {
      headers: {
        profile_id: 1,
      },
    })
    .json();

  const stopTasks = startLedgerEntryTasks(t.context.app);
  await t.context.got.post("balances/deposit/1", {
    json: {
      amount: 50,
    },
    headers: {
      profile_id: 1,
    },
  });
  stopTasks();

  const richClient = await t.context
    .got("profiles/1", {
      headers: {
        profile_id: 1,
      },
    })
    .json();

  t.is(richClient.balance, poorClient.balance + 50);
});

test.serial(
  "POST /balances/deposit/:userId (400 - limit exceeded)",
  async t => {
    const stopTasks = startLedgerEntryTasks(t.context.app);
    const response = await t.context.got.post("balances/deposit/1", {
      throwHttpErrors: false,
      json: {
        amount: 55,
      },
      headers: {
        profile_id: 1,
      },
    });
    stopTasks();

    t.is(response.statusCode, 400);
    t.is(response.body, "Deposit limit exceeded");
  }
);

test("POST /balances/deposit/:userId (403)", async t => {
  const response = await t.context.got.post("balances/deposit/1", {
    throwHttpErrors: false,
    json: {
      amount: 55,
    },
    headers: {
      profile_id: 2,
    },
  });

  t.is(response.statusCode, 403);
});
