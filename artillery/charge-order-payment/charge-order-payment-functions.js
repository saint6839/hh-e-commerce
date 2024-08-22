function generateUserData(userContext, events, done) {
  userContext.vars.userId = Math.floor(Math.random() * 1000) + 1;
  userContext.vars.chargeAmount = Math.floor(Math.random() * 100000) + 10000;
  return done();
}

function generateOrderData(userContext, events, done) {
  userContext.vars.productOptionId = Math.floor(Math.random() * 100) + 1;
  userContext.vars.quantity = Math.floor(Math.random() * 5) + 1;
  return done();
}

function generatePaymentData(userContext, events, done) {
  userContext.vars.paymentId = Math.floor(Math.random() * 10000) + 1;
  userContext.vars.mid = 'test_mid_' + Math.random().toString(36).substring(7);
  userContext.vars.tid = 'test_tid_' + Math.random().toString(36).substring(7);
  return done();
}

module.exports = {
  generateUserData,
  generateOrderData,
  generatePaymentData,
};
