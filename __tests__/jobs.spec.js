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

test("GET /jobs/unpaid (200 - client request)", async t => {
  const response = await t.context.got("jobs/unpaid", {
    throwHttpErrors: false,
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
  const response = await t.context.got("jobs/unpaid", {
    throwHttpErrors: false,
    headers: {
      profile_id: 6,
    },
  });

  t.is(response.statusCode, 200);

  const body = JSON.parse(response.body);
  t.is(body.length, 2);
  body.forEach(job => t.like(job, { paid: null, paymentDate: null }));
});

test.serial("POST /jobs/:job_id/pay (200)", async t => {
  const unpaidJobs = await t.context
    .got("jobs/unpaid", {
      headers: {
        profile_id: 3,
      },
    })
    .json();

  const unpaidContractors = await Promise.all(
    unpaidJobs.map(async job => {
      const contract = await t.context
        .got(`contracts/${job.ContractId}`, {
          headers: { profile_id: 3 },
        })
        .json();
      return t.context
        .got(`profiles/${contract.ContractorId}`, {
          headers: {
            profile_id: contract.ContractorId,
          },
        })
        .json();
    })
  );

  const richClient = await t.context
    .got("profiles/3", {
      headers: {
        profile_id: 3,
      },
    })
    .json();

  const stopTasks = startLedgerEntryTasks(t.context.app);
  const paidJobs = await Promise.all(
    unpaidJobs.map(job =>
      t.context.got
        .post(`jobs/${job.id}/pay`, {
          headers: {
            profile_id: 3,
          },
        })
        .json()
    )
  );
  stopTasks();

  paidJobs.forEach(job => {
    t.like(job, { paid: true });
    const paymentDate = new Date(job.paymentDate);
    t.true(paymentDate instanceof Date && !isNaN(paymentDate));
  });

  await Promise.all(
    paidJobs.map(async job => {
      const contract = await t.context
        .got(`contracts/${job.ContractId}`, {
          headers: { profile_id: 3 },
        })
        .json();
      const contractor = await t.context
        .got(`profiles/${contract.ContractorId}`, {
          headers: {
            profile_id: contract.ContractorId,
          },
        })
        .json();
      const unpaidContractor = unpaidContractors.find(
        unpaidContractor => unpaidContractor.id === contractor.id
      );
      t.is(contractor.balance, unpaidContractor.balance + job.price);
    })
  );

  const poorClient = await t.context
    .got("profiles/3", {
      headers: {
        profile_id: 3,
      },
    })
    .json();

  t.is(
    richClient.balance - poorClient.balance,
    unpaidJobs.reduce((acc, curr) => acc + curr.price, 0)
  );
});

test.serial("POST /jobs/:job_id/pay (400 - Insufficient balance)", async t => {
  const stopTasks = startLedgerEntryTasks(t.context.app);
  const response = await t.context.got.post(`jobs/100/pay`, {
    throwHttpErrors: false,
    headers: {
      profile_id: 4,
    },
  });
  stopTasks();

  t.is(response.statusCode, 400);
  t.is(response.body, "Insufficient balance");
});

test("POST /jobs/:job_id/pay (403 - Not a client)", async t => {
  const response = await t.context.got.post(`jobs/1/pay`, {
    throwHttpErrors: false,
    headers: {
      profile_id: 5,
    },
  });

  t.is(response.statusCode, 403);
});

test("POST /jobs/:job_id/pay (403 - Client doesn't own job's contract')", async t => {
  const response = await t.context.got.post(`jobs/1/pay`, {
    throwHttpErrors: false,
    headers: {
      profile_id: 4,
    },
  });

  t.is(response.statusCode, 403);
});
