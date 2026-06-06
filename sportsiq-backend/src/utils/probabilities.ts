/**
 * NBA Probability Calculations
 *
 * This module provides functions to calculate various betting probabilities
 * for NBA games using live odds data and statistical models.
 */

import { GameType } from "../types";

/**
 * Converts American odds to implied probability
 * @param odds - American odds (positive or negative)
 * @returns Implied probability as a decimal (0-1)
 *
 * Why: American odds represent the payout structure. Positive odds show profit on $100 bet,
 * negative odds show how much you need to bet to win $100. Converting to probability
 * allows us to work with normalized values for calculations.
 */
function oddsToProbability(odds: number): number {
  if (odds > 0) {
    // Positive odds: profit/100, so probability = 100 / (odds + 100)
    return 100 / (odds + 100);
  } else {
    // Negative odds: bet amount to win 100, so probability = |odds| / (|odds| + 100)
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Calculates win probability for Team A using live moneyline odds
 * @param liveMoneylineA - Live moneyline odds for Team A
 * @param liveMoneylineB - Live moneyline odds for Team B
 * @returns Object containing win probabilities for both teams
 *
 * Why: Live moneylines reflect the market's current assessment of each team's
 * win probability. By converting both odds to probabilities and normalizing,
 * we account for the bookmaker's margin and get true implied probabilities.
 */
export function calculateWinProbability(
  liveMoneylineA: number,
  liveMoneylineB: number
): { teamA: number; teamB: number } {
  // Convert odds to raw probabilities
  const pA_raw = oddsToProbability(liveMoneylineA);
  const pB_raw = oddsToProbability(liveMoneylineB);

  // Normalize to remove bookmaker margin
  const totalProbability = pA_raw + pB_raw;
  const pA = pA_raw / totalProbability;
  const pB = pB_raw / totalProbability;

  return {
    teamA: pA,
    teamB: pB,
  };
}

/**
 * Calculates alternate win probability when moneyline odds are unavailable
 * Uses current lead and time remaining to estimate win probability
 * @param currentLead - Current lead for Team A (homeScore - awayScore)
 * @param secondsRemaining - Seconds remaining in the game
 * @param pregameWinProbabilityA - Optional pregame win probability for Team A (0-1)
 * @returns Object containing win probabilities for both teams
 *
 * Formula:
 * - tFrac = secRem / 2880 (clamped to [0,1])
 * - remScale = sqrt(tFrac)
 * - sigmaTotal = 15 * remScale
 * - z = (current lead) / (sigmaTotal)
 * - pWin = Φ(z) where Φ is the standard normal CDF
 */
export function calculateAlternateWinProbability(
  currentLead: number,
  secondsRemaining: number,
  gameType: GameType
): { teamA: number; teamB: number } {
  // Calculate time fraction (1 at tip, 0 at buzzer; clamp to [0,1])
  let totalSeconds: number;
  let sigmaBase: number;

  switch (gameType) {
    case "nba":
      totalSeconds = 2880;
      sigmaBase = 15;
      break;
    case "nfl":
      totalSeconds = 3600;
      sigmaBase = 15;
      break;
    case "cbb":
      totalSeconds = 2400;
      sigmaBase = 12;
      break;
    case "cfb":
      totalSeconds = 3600;
      sigmaBase = 18;
      break;
    default:
      totalSeconds = 2880;
      sigmaBase = 15;
      break;
  }

  // Always add 10 seconds to secondsRemaining to avoid the formula exploding at end of game
  const adjustedSecondsRemaining = secondsRemaining + 10;

  const tFrac = Math.max(
    0,
    Math.min(1, adjustedSecondsRemaining / totalSeconds)
  );

  // Randomness scale: sqrt(tFrac)
  const remScale = Math.sqrt(tFrac);

  // Standard deviation of final margin (sigmaBase is tunable constant)
  // Enhancement: Triple sigma when tFrac < 0.06 (final seconds, lots of chaos)
  let sigmaTotal = sigmaBase * remScale;
  if (tFrac < 0.06) {
    sigmaTotal *= 3;
  }

  // Calculate z-score: how many standard deviations is the current lead?
  const z = currentLead / sigmaTotal;

  // Probability that Team A wins using normal CDF
  // If pregame probability is provided, we could blend it, but formula uses direct CDF
  const pWinA = normalCDF(z);
  const pWinB = 1 - pWinA;

  return {
    teamA: pWinA,
    teamB: pWinB,
  };
}

/**
 * Calculates the cumulative distribution function (CDF) of standard normal distribution
 * Approximation using the error function
 * @param x - Value to evaluate
 * @returns Probability that a standard normal random variable is <= x
 *
 * Why: We assume final margins follow a normal distribution. The CDF gives us
 * the probability that the actual margin will be less than or equal to a given value.
 */
function normalCDF(x: number): number {
  // Approximation using Abramowitz and Stegun formula
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * x);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
}

/**
 * Calculates time fraction remaining in the game
 * @param secondsRemaining - Seconds remaining in the game
 * @returns Time fraction (0-1, clamped)
 *
 * Why: NBA games are 48 minutes (2880 seconds). Time remaining affects
 * uncertainty - more time means more variance in possible outcomes.
 */
function getTimeFraction(secondsRemaining: number): number {
  const totalSeconds = 2880; // 48 minutes
  return Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
}

/**
 * Calculates randomness scale based on time remaining
 * @param timeFraction - Time fraction (0-1)
 * @returns Randomness scale factor
 *
 * Why: As time decreases, the range of possible outcomes narrows.
 * Using sqrt(timeFraction) models this decreasing uncertainty.
 */
function getRandomnessScale(timeFraction: number): number {
  return Math.sqrt(timeFraction);
}

/**
 * Calculates cover probability (Against The Spread) for Team A
 * @param liveSpreadA - Current live spread for Team A
 * @param pregameSpreadA - Pre-game spread for Team A
 * @param secondsRemaining - Seconds remaining in the game
 * @returns Object containing cover probabilities for both teams
 *
 * Why: The live spread represents the market's current expectation of the final margin.
 * We model the final margin as normally distributed with mean = liveSpread and
 * variance that decreases as time runs out. The probability of covering depends on
 * how far the live spread is from the pregame spread relative to the remaining uncertainty.
 */
export function calculateCoverProbability(
  liveSpreadA: number,
  pregameSpreadA: number,
  secondsRemaining: number,
  gameType: GameType
): { teamA: number; teamB: number } {
  const timeFraction = getTimeFraction(secondsRemaining);
  const remScale = getRandomnessScale(timeFraction);

  // Standard deviation of final margin (18 is empirical constant for NBA)
  const sigmaMargin = gameType === "nba" ? 18 * remScale : 13 * remScale;

  // Calculate z-score: how many standard deviations is the difference?
  const zScore = (pregameSpreadA - liveSpreadA) / sigmaMargin;

  // Probability that Team A covers (final margin > pregame spread)
  const coverA = normalCDF(zScore);
  const coverB = 1 - coverA;

  return {
    teamA: coverA,
    teamB: coverB,
  };
}

/**
 * Gets the scoring rate (P) based on sport and time fraction
 * @param gameType - Type of game
 * @param tFrac - Time fraction (0-1)
 * @returns Scoring rate per second
 */
function getScoringRate(gameType: GameType, tFrac: number): number {
  if (tFrac < 0.03) {
    // Final seconds - highest scoring rate
    switch (gameType) {
      case "nba":
        return 0.15;
      case "cbb":
        return 0.14;
      case "nfl":
        return 0.04;
      case "cfb":
        return 0.06;
      default:
        return 0.15;
    }
  } else if (tFrac < 0.06) {
    // Near end of game
    switch (gameType) {
      case "nba":
        return 0.10;
      case "cbb":
        return 0.08;
      case "nfl":
        return 0.02;
      case "cfb":
        return 0.03;
      default:
        return 0.10;
    }
  } else {
    // Normal game time
    switch (gameType) {
      case "nba":
        return 0.08;
      case "cbb":
        return 0.06;
      case "nfl":
        return 0.013;
      case "cfb":
        return 0.016;
      default:
        return 0.08;
    }
  }
}

/**
 * Calculates over/under probability for the total score
 * @param liveTotal - Current live total (can be null, will be calculated if so)
 * @param pregameTotal - Pre-game total
 * @param secondsRemaining - Seconds remaining in the game
 * @param gameType - Type of game
 * @param currentTotal - Current combined score (homeScore + awayScore)
 * @returns Object containing over and under probabilities
 *
 * Why: Similar to spreads, we model the final total as normally distributed.
 * The live total represents the market's current expectation. As time decreases,
 * the variance in possible final totals decreases, making predictions more certain.
 * If liveTotal is NULL, we estimate it as: LiveTotal = Current Total + P*SecRem
 */
export function calculateTotalProbability(
  liveTotal: number | null,
  pregameTotal: number,
  secondsRemaining: number,
  gameType: GameType,
  currentTotal: number
): { over: number; under: number } {
  // Override: If current total already exceeds pregame total, over probability = 1
  if (currentTotal > pregameTotal) {
    return {
      over: 1,
      under: 0,
    };
  }

  // Calculate time fraction based on game type
  let totalSeconds: number;
  switch (gameType) {
    case "nba":
      totalSeconds = 2880;
      break;
    case "nfl":
      totalSeconds = 3600;
      break;
    case "cbb":
      totalSeconds = 2400;
      break;
    case "cfb":
      totalSeconds = 3600;
      break;
    default:
      totalSeconds = 2880;
      break;
  }

  // Always add 10 seconds to secondsRemaining to avoid the formula exploding at end of game
  const adjustedSecondsRemaining = secondsRemaining + 10;
  const tFrac = Math.max(0, Math.min(1, adjustedSecondsRemaining / totalSeconds));

  // Calculate liveTotal if it's null: LiveTotal = Current Total + P*SecRem
  let calculatedLiveTotal: number;
  if (liveTotal === null || liveTotal === undefined) {
    const P = getScoringRate(gameType, tFrac);
    calculatedLiveTotal = currentTotal + P * secondsRemaining;
  } else {
    calculatedLiveTotal = liveTotal;
  }

  // Randomness scale: sqrt(tFrac)
  const remScale = Math.sqrt(tFrac);

  // Standard deviation of final total (game-specific constants)
  let sigmaBase: number;
  switch (gameType) {
    case "nba":
      sigmaBase = 15;
      break;
    case "nfl":
      sigmaBase = 11;
      break;
    case "cbb":
      sigmaBase = 12;
      break;
    case "cfb":
      sigmaBase = 13;
      break;
    default:
      sigmaBase = 15;
      break;
  }

  // Enhancement: Triple sigma when tFrac < 0.06 (final seconds, lots of chaos)
  let sigmaTotal = sigmaBase * remScale;
  if (tFrac < 0.06) {
    sigmaTotal *= 3;
  }

  // Calculate z-score: how many standard deviations is the difference?
  const zScore = (calculatedLiveTotal - pregameTotal) / sigmaTotal;

  // Probability that final total > pregame total
  const over = normalCDF(zScore);
  const under = 1 - over;

  return {
    over,
    under,
  };
}

