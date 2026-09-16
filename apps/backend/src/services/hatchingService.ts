import {
  HATCHING_SYSTEM_CONFIG,
  HatchingEvent,
  HatchingState,
  hatchingRequestSchema,
  hatchingInteractionSchema,
  hatchingStatusSchema
} from "../utils/hatchingSystem.js";
import prisma from "../config/prisma.js";
import { gameService } from "./game.js";
import { randomUUID } from "node:crypto";

// ‰∫íÂ??àÊ?È°ûÂ?
type InteractionEffect = {
  progress: number;
  temperature?: number;
  humidity?: number;
};

// ‰∫íÂ??àÊ??çÁΩÆ
const INTERACTION_EFFECTS: Record<string, InteractionEffect> = {
  TAP: { progress: 2, temperature: 0.5 },
  SHAKE: { progress: 3, temperature: 1.0 },
  WHISPER: { progress: 1, humidity: 1.0 },
  SING: { progress: 4, temperature: 0.3, humidity: 0.5 },
  STORY: { progress: 5, temperature: 0.2, humidity: 0.3 }
};

// Ê∫´Â∫¶?àÊ??çÁΩÆ
const TEMPERATURE_EFFECTS = {
  optimal: { min: 25, max: 35, multiplier: 1.5 },
  good: { min: 20, max: 40, multiplier: 1.0 },
  poor: { min: 15, max: 45, multiplier: 0.5 },
  critical: { multiplier: 0.1 }
};

export class HatchingService {
  private hatchingStates = new Map<string, HatchingState>();

  // ?ãÂ?Â≠µÂ?
  async startHatching(request: {
    spiritId: string;
    userId: string;
    temperature?: number;
    humidity?: number;
  }) {
    const { spiritId, userId, temperature = 30, humidity = 50 } = request;

    // È©óË?Á≤æÈ?Â≠òÂú®‰∏îË??ºË??éÊÆµ
    const spirit = await prisma.spirit.findFirst({
      where: {
        id: spiritId,
        userId,
        stage: "EGG",
        isActive: true
      }
    });

    if (!spirit) {
      throw new Error("Á≤æÈ?‰∏çÂ??®Ê?‰∏çÊòØ?ãÈ?ÊÆ?);
    }

    // Ê™¢Êü•?ØÂê¶Â∑≤Á??®Â≠µ?ñ‰∏≠
    if (this.hatchingStates.has(spiritId)) {
      throw new Error("Á≤æÈ?Â∑≤Á??®Â≠µ?ñ‰∏≠");
    }

    // ?µÂª∫Â≠µÂ??Ä??
    const startTime = new Date();
    const estimatedHatchTime = new Date(startTime.getTime() +
      HATCHING_SYSTEM_CONFIG.CONDITIONS.HATCHING_TIME * 60 * 60 * 1000);

    const state: HatchingState = {
      spiritId,
      stage: "EGG",
      progress: 0,
      temperature,
      humidity,
      interactionCount: 0,
      startTime,
      estimatedHatchTime,
      events: [],
      conditionsMet: {
        temperature: this.checkTemperatureCondition(temperature),
        humidity: this.checkHumidityCondition(humidity),
        interactions: false,
        time: false
      }
    };

    // ‰øùÂ??Ä??
    this.hatchingStates.set(spiritId, state);

    // Ë®òÈ??ãÂ?‰∫ã‰ª∂
    this.addEvent(state, "TEMPERATURE_CHANGE", { temperature });
    this.addEvent(state, "HUMIDITY_CHANGE", { humidity });
    this.addEvent(state, "TIME_PASSED", { startTime });

    // ?µÂª∫Â≠µÂ?Ë®òÈ?ÔºàÂ??úÊ®°?ãÂ??®Ô?
    try {
      await prisma.hatchingRecord.create({
        data: {
          spiritId,
          userId,
          startTime,
          initialTemperature: temperature,
          initialHumidity: humidity,
          status: "INCUBATING"
        }
      });
    } catch (error) {
      // Â¶ÇÊ?Ê®°Â?‰∏çÂ??®Ô??™Ë??ÑË≠¶??
      console.warn("HatchingRecord model not available, skipping database record");
    }

    return {
      success: true,
      state: this.getPublicState(state),
      message: "Â≠µÂ??ãÂ?ÔºÅ‰??ÅÈÅ©?∂Á?Ê∫´Â∫¶?åÊ?Â∫¶Ô?‰∏¶Á?Â∏∏‰??ï„Ä?
    };
  }

  // ?ïÁ?‰∫íÂ?
  async handleInteraction(request: {
    spiritId: string;
    userId: string;
    interactionType: "TAP" | "SHAKE" | "WHISPER" | "SING" | "STORY";
    intensity?: number;
  }) {
    const { spiritId, userId, interactionType, intensity = 1 } = request;

    // ?≤Â?Â≠µÂ??Ä??
    const state = this.hatchingStates.get(spiritId);
    if (!state) {
      throw new Error("Á≤æÈ?‰∏çÂú®Â≠µÂ?‰∏?);
    }

    // È©óË?Á≤æÈ??Ä?âÊ?
    const spirit = await prisma.spirit.findFirst({
      where: { id: spiritId, userId }
    });

    if (!spirit) {
      throw new Error("Á≤æÈ?‰∏çÂ??®Ê??°Ê???);
    }

    // ?≤Â?‰∫íÂ??àÊ?
    const effect = INTERACTION_EFFECTS[interactionType as keyof typeof INTERACTION_EFFECTS];
    if (!effect) {
      throw new Error("?°Ê??Ñ‰??ïÈ???);
    }

    // ?âÁî®‰∫íÂ??àÊ?
    const intensityMultiplier = Math.min(Math.max(intensity, 1), 10) / 5;

    // Â¢ûÂ??≤Â∫¶
    const progressGain = effect.progress * intensityMultiplier;
    state.progress = Math.min(state.progress + progressGain, 100);

    // Ë™øÊï¥?∞Â?
    if (effect.temperature) {
      state.temperature += effect.temperature * intensityMultiplier;
      state.temperature = this.clampTemperature(state.temperature);
      state.conditionsMet.temperature = this.checkTemperatureCondition(state.temperature);
    }

    if (effect.humidity) {
      state.humidity += effect.humidity * intensityMultiplier;
      state.humidity = this.clampHumidity(state.humidity);
      state.conditionsMet.humidity = this.checkHumidityCondition(state.humidity);
    }

    // Â¢ûÂ?‰∫íÂ?Ë®àÊï∏
    state.interactionCount++;

    // Ê™¢Êü•‰∫íÂ?Ê¢ù‰ª∂
    if (state.interactionCount >= HATCHING_SYSTEM_CONFIG.CONDITIONS.INTERACTION_COUNT) {
      state.conditionsMet.interactions = true;
    }

    // Ë®òÈ?‰∫íÂ?‰∫ã‰ª∂
    this.addEvent(state, "INTERACTION", {
      type: interactionType,
      intensity,
      progressGain,
      newProgress: state.progress
    });

    // Ê™¢Êü•?ÇÈ?Ê¢ù‰ª∂
    const timePassed = Date.now() - state.startTime.getTime();
    const requiredTime = HATCHING_SYSTEM_CONFIG.CONDITIONS.HATCHING_TIME * 60 * 60 * 1000;

    if (timePassed >= requiredTime) {
      state.conditionsMet.time = true;
    }

    // Ê™¢Êü•?ØÂê¶?Ø‰ª•Â≠µÂ?
    const canHatch = this.checkHatchingConditions(state);

    if (canHatch && state.progress >= 100) {
      return await this.completeHatching(state, userId);
    }

    // ?¥Êñ∞?Ä??
    this.hatchingStates.set(spiritId, state);

    // Ë®òÈ?‰∫íÂ?ÔºàÂ??úÊ®°?ãÂ??®Ô?
    try {
      await prisma.hatchingInteraction.create({
        data: {
          spiritId,
          interactionType,
          intensity,
          progressBefore: state.progress - progressGain,
          progressAfter: state.progress,
          temperature: state.temperature,
          humidity: state.humidity
        }
      });
    } catch (error) {
      // Â¶ÇÊ?Ê®°Â?‰∏çÂ??®Ô??™Ë??ÑË≠¶??
      console.warn("HatchingInteraction model not available, skipping database record");
    }

    // Â¶ÇÊ?ÊªøË∂≥Â≠µÂ?Ê¢ù‰ª∂ÔºåÂ??êÂ≠µ??
    if (canHatch) {
      return await this.completeHatching(state, userId);
    }

    return {
      success: true,
      state: this.getPublicState(state),
      progressGain,
      canHatch,
      message: this.getInteractionFeedback(interactionType, intensity)
    };
  }

  // Ê™¢Êü•Â≠µÂ?Ê¢ù‰ª∂
  private checkHatchingConditions(state: HatchingState): boolean {
    return Object.values(state.conditionsMet).every(condition => condition === true);
  }

  // ÂÆåÊ?Â≠µÂ?
  private async completeHatching(state: HatchingState, userId: string) {
    // ?¥Êñ∞Á≤æÈ??éÊÆµ
    await prisma.spirit.update({
      where: { id: state.spiritId },
      data: { stage: "JUVENILE" }
    });

    // ?¥Êñ∞Â≠µÂ?Ë®òÈ?ÔºàÂ??úÊ®°?ãÂ??®Ô?
    try {
      await prisma.hatchingRecord.updateMany({
        where: { spiritId: state.spiritId, status: "INCUBATING" },
        data: {
          endTime: new Date(),
          status: "COMPLETED",
          finalTemperature: state.temperature,
          finalHumidity: state.humidity
        }
      });
    } catch (error) {
      // Â¶ÇÊ?Ê®°Â?‰∏çÂ??®Ô??™Ë??ÑË≠¶??
      console.warn("HatchingRecord model not available, skipping database update");
    }

    // ÁßªÈô§Â≠µÂ??Ä??
    this.hatchingStates.delete(state.spiritId);

    // Ë®òÈ?Â≠µÂ?‰∫ã‰ª∂
    this.addEvent(state, "HATCHING_COMPLETE", {
      hatchTime: new Date(),
      finalProgress: state.progress
    });

    // Áµ¶‰?Á∂ìÈ??ºÁ???
    await gameService.addXp(userId, 100);

    return {
      success: true,
      hatched: true,
      message: "?? Â≠µÂ??êÂ?ÔºÅÁ≤æ?àÂ∑≤?≤Â??∫ÂπºÂπ¥Ê?Ôº?,
      experienceGained: 100
    };
  }

  // ?≤Â??¨È??Ä??
  private getPublicState(state: HatchingState) {
    return {
      progress: state.progress,
      temperature: state.temperature,
      humidity: state.humidity,
      interactionCount: state.interactionCount,
      conditionsMet: state.conditionsMet,
      estimatedHatchTime: state.estimatedHatchTime,
      timeRemaining: Math.max(0, state.estimatedHatchTime.getTime() - Date.now())
    };
  }

  // Ê™¢Êü•Ê∫´Â∫¶Ê¢ù‰ª∂
  private checkTemperatureCondition(temperature: number): boolean {
    const optimal = TEMPERATURE_EFFECTS.optimal;
    return temperature >= optimal.min && temperature <= optimal.max;
  }

  // Ê™¢Êü•ÊøïÂ∫¶Ê¢ù‰ª∂
  private checkHumidityCondition(humidity: number): boolean {
    return humidity >= 40 && humidity <= 60;
  }

  // ?êÂà∂Ê∫´Â∫¶ÁØÑÂ?
  private clampTemperature(temp: number): number {
    return Math.max(0, Math.min(50, temp));
  }

  // ?êÂà∂ÊøïÂ∫¶ÁØÑÂ?
  private clampHumidity(humidity: number): number {
    return Math.max(0, Math.min(100, humidity));
  }

  // ?≤Â?‰∫íÂ??çÈ?
  private getInteractionFeedback(interactionType: string, intensity: number): string {
    const feedback = {
      TAP: "ËºïË??≤Ê?ËÆìË?ÊÆºÁî¢?üÂÖ±È≥?..",
      SHAKE: "?ñÂ?ËÆìË??éÊ¥ª?ïÁ?È™?..",
      WHISPER: "‰ΩéË?Áµ¶‰?Ê∫´Ê??ÑÈ???..",
      SING: "Ê≠åÂî±?µÈÄ†Â?Ë´ßÁ??ØÂ?...",
      STORY: "Ë¨õÊ?‰∫ãÂà∫ÊøÄÂ§ßËÖ¶?ºËÇ≤..."
    };
    return feedback[interactionType as keyof typeof feedback] || "‰∫íÂ??âÊ??úÔ?";
  }

  // Ê∑ªÂ?Â≠µÂ?‰∫ã‰ª∂
  private addEvent(
    state: HatchingState,
    eventType: HatchingEvent["eventType"],
    data: HatchingEvent["data"],
    significance = 1
  ): HatchingEvent {
    const event: HatchingEvent = {
      id: randomUUID(),
      spiritId: state.spiritId,
      eventType,
      data,
      timestamp: new Date(),
      significance
    };

    state.events.push(event);
    return event;
  }

  // ?≤Â?Â≠µÂ??Ä??
  async getHatchingStatus(spiritId: string) {
    const state = this.hatchingStates.get(spiritId);
    if (!state) {
      return { isHatching: false };
    }

    return {
      isHatching: true,
      state: this.getPublicState(state)
    };
  }
}
