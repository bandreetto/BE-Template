import test from "ava";
import { bestProfession } from "../logic.js";

test("it should return bestProfession", t => {
  const jobs = [
    {
      price: 200,
      Contract: {
        Contractor: {
          profession: "Programmer",
        },
      },
    },
    {
      price: 300,
      Contract: {
        Contractor: {
          profession: "Programmer",
        },
      },
    },
    {
      price: 50,
      Contract: {
        Contractor: {
          profession: "Musician",
        },
      },
    },
    {
      price: 400,
      Contract: {
        Contractor: {
          profession: "Musician",
        },
      },
    },
    {
      price: 500,
      Contract: {
        Contractor: {
          profession: "Fighter",
        },
      },
    },
    {
      price: 500,
      Contract: {
        Contractor: {
          profession: "Fighter",
        },
      },
    },
    {
      price: 500,
      Contract: {
        Contractor: {
          profession: "Fighter",
        },
      },
    },
  ];

  t.is(bestProfession(jobs), "Fighter");
});

test("best profession should not fail on empty call", t => {
  const profession = bestProfession([]);
  t.is(profession, null);
});
