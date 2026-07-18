// utils/tokenEconomy.js

const TOKEN_COSTS = {
  // Candidate Actions
  FULL_INTERVIEW: 20,
  CODING_ROUND: 10,
  RESUME_ANALYSIS: 5,
  CREATE_FORUM_POST: 5,
  LEARNING_QUIZ: 5,

  // Recruiter Actions
  UNLOCK_PROFILE: 50,
};

const PLAN_LIMITS = {
  Basic: { maxTokens: 200, dailyReward: 20, signupBonus: 100 },
  Pro: { maxTokens: 1000, dailyReward: 30, monthlyGrant: 500 },
  Elite: { maxTokens: 3000, dailyReward: 50, monthlyGrant: 1200 },
  Recruiter: { maxTokens: 10000, dailyReward: 0, monthlyGrant: 1000 }
};

module.exports = {
  TOKEN_COSTS,
  PLAN_LIMITS
};