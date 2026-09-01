import { BONUS_PER_COIN, SCORE_PER_ROW } from './constants';

export interface ScoreUpdateResult {
  score: number;
  maxDistance: number;
  coinsCount: number;
  scoreDelta: number;
  isNewRecord: boolean;
  justBrokeRecord: boolean;
}

/**
 * ScoreManager encapsulates all scoring progression rules:
 * - Score is based on maximum forward distance reached (rows passed).
 * - Every successful forward movement increases max distance and score.
 * - Moving backward does NOT reduce max distance or score.
 * - Coins collected give a bonus (+BONUS_PER_COIN).
 * - Tracks whether the current run sets a new high score.
 * - Independent from rendering for modularity and easy balancing.
 */
export class ScoreManager {
  private maxDistance: number = 0;
  private coinsCount: number = 0;
  private previousHighScore: number = 0;
  private hasCelebratedNewRecord: boolean = false;

  constructor(initialHighScore: number = 0) {
    this.previousHighScore = Math.max(0, initialHighScore);
  }

  /**
   * Reset the score manager for a new run.
   */
  public reset(initialHighScore?: number): void {
    this.maxDistance = 0;
    this.coinsCount = 0;
    this.hasCelebratedNewRecord = false;
    if (initialHighScore !== undefined) {
      this.previousHighScore = Math.max(0, initialHighScore);
    }
  }

  /**
   * Update forward position when player moves.
   * Forward movements increase distance; backward movements are ignored.
   */
  public updatePosition(gridY: number): ScoreUpdateResult {
    const roundedY = Math.round(gridY);
    let distanceIncreased = false;
    let scoreDelta = 0;

    if (roundedY > this.maxDistance) {
      const diff = roundedY - this.maxDistance;
      this.maxDistance = roundedY;
      scoreDelta = diff * SCORE_PER_ROW;
      distanceIncreased = true;
    }

    const currentScore = this.calculateTotalScore();
    const isNewRecord = this.previousHighScore > 0 ? currentScore > this.previousHighScore : currentScore > 0;
    let justBrokeRecord = false;

    if (isNewRecord && !this.hasCelebratedNewRecord && this.previousHighScore > 0) {
      this.hasCelebratedNewRecord = true;
      justBrokeRecord = true;
    }

    return {
      score: currentScore,
      maxDistance: this.maxDistance,
      coinsCount: this.coinsCount,
      scoreDelta: distanceIncreased ? scoreDelta : 0,
      isNewRecord,
      justBrokeRecord,
    };
  }

  /**
   * Add a collected coin and calculate the bonus.
   */
  public addCoin(): ScoreUpdateResult {
    this.coinsCount += 1;
    const currentScore = this.calculateTotalScore();
    const isNewRecord = this.previousHighScore > 0 ? currentScore > this.previousHighScore : currentScore > 0;
    let justBrokeRecord = false;

    if (isNewRecord && !this.hasCelebratedNewRecord && this.previousHighScore > 0) {
      this.hasCelebratedNewRecord = true;
      justBrokeRecord = true;
    }

    return {
      score: currentScore,
      maxDistance: this.maxDistance,
      coinsCount: this.coinsCount,
      scoreDelta: BONUS_PER_COIN,
      isNewRecord,
      justBrokeRecord,
    };
  }

  /**
   * Calculate total score from max forward distance and bonus coins.
   */
  public calculateTotalScore(): number {
    return this.maxDistance * SCORE_PER_ROW + this.coinsCount * BONUS_PER_COIN;
  }

  public getScore(): number {
    return this.calculateTotalScore();
  }

  public getMaxDistance(): number {
    return this.maxDistance;
  }

  public getCoinsCount(): number {
    return this.coinsCount;
  }

  public getPreviousHighScore(): number {
    return this.previousHighScore;
  }

  public isNewRecord(): boolean {
    const score = this.calculateTotalScore();
    return this.previousHighScore > 0 ? score > this.previousHighScore : score > 0;
  }
}
