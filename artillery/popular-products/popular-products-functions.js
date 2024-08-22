function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

module.exports = {
  generateDateRange: (context, events, done) => {
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    const from = getRandomDate(oneMonthAgo, now);
    const to = getRandomDate(from, now);

    context.vars.from = from.toISOString();
    context.vars.to = to.toISOString();

    return done();
  },
};
