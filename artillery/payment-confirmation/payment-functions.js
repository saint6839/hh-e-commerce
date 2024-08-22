function generateRandomId() {
  return Math.floor(Math.random() * 1000000) + 1;
}

function generateRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

module.exports = {
  generatePaymentData: (context, events, done) => {
    context.vars.paymentId = generateRandomId();
    context.vars.userId = generateRandomId();
    context.vars.mid = generateRandomString();
    context.vars.tid = generateRandomString();
    return done();
  },
};
