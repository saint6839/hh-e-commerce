module.exports = {
  generateRandomUserId: (context, events, done) => {
    // 1부터 1000 사이의 랜덤한 사용자 ID 생성
    context.vars.userId = Math.floor(Math.random() * 1000) + 1;
    return done();
  },
  generateRandomAmount: (context, events, done) => {
    // 1000원부터 10000원 사이의 랜덤한 충전 금액 생성
    context.vars.amount = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
    return done();
  },
};
