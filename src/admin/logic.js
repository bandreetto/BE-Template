export function bestProfession(jobs) {
  if (!jobs.length) return null;

  const amountReceivedByProfession = jobs.reduce((acc, curr) => {
    if (acc[curr.Contract.Contractor.profession])
      return {
        ...acc,
        [curr.Contract.Contractor.profession]:
          acc[curr.Contract.Contractor.profession] + curr.price,
      };

    return {
      ...acc,
      [curr.Contract.Contractor.profession]: curr.price,
    };
  }, {});

  const sortedProfessionsByAmountReceived = Object.entries(
    amountReceivedByProfession
  )
    .sort(([_, amount1], [__, amount2]) => amount2 - amount1)
    .map(([profession, _]) => profession);

  return sortedProfessionsByAmountReceived[0];
}
