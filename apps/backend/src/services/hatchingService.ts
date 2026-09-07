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

// 互動效果配置
const INTERACTION_EFFECTS = {
  TAP: { progress: 2, temperature: 0.5 },
  SHAKE: { progress: 3, temperature: 1.0 },
  WHISPER: { progress: 1, humidity: 1.0 },
  SING: { progress: 4, temperature: 0.3, humidity: 0.5 },
  STORY: { progress: 5, temperature: 0.2, humidity: 0.3 }
};

// 溫度效果配置
const TEMPERATURE_EFFECTS = {
  optimal: { min: 25, max: 35, multiplier: 1.5 },
  good: { min: 20, max: 40, multiplier: 1.0 },
  poor: { min: 15, max: 45, multiplier: 0.5 },
  critical: { multiplier: 0.1 }
};

export class HatchingService {
  private hatchingStates = new Map<string, HatchingState>();
  
  // 開始孵化
  async startHatching(request: {
    spiritId: string;
    userId: string;
    temperature?: number;
    humidity?: number;
  }) {
    const { spiritId, userId, temperature = 30, humidity = 50 } = request;
    
    // 驗證精靈存在且處於蛋階段
    const spirit = await prisma.spirit.findFirst({
      where: { 
        id: spiritId, 
        userId,
        stage: "EGG",
        isActive: true 
      }
    });
    
    if (!spirit) {
      throw new Error("精靈不存在或不是蛋階段");
    }
    
    // 檢查是否已經在孵化中
    if (this.hatchingStates.has(spiritId)) {
      throw new Error("精靈已經在孵化中");
    }
    
    // 創建孵化狀態
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
    
    // 保存狀態
    this.hatchingStates.set(spiritId, state);
    
    // 記錄開始事件
    this.addEvent(state, "TEMPERATURE_CHANGE", { temperature });
    this.addEvent(state, "HUMIDITY_CHANGE", { humidity });
    this.addEvent(state, "TIME_PASSED", { startTime });
    
    // 創建孵化記錄
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
    
    return {
      success: true,
      state: this.getPublicState(state),
      message: "孵化開始！保持適當的溫度和濕度，並經常互動。"
    };
  }
  
  // 處理互動
  async handleInteraction(request: {
    spiritId: string;
    userId: string;
    interactionType: string;
    intensity?: number;
  }) {
    const { spiritId, userId, interactionType, intensity = 1 } = request;
    
    // 獲取孵化狀態
    const state = this.hatchingStates.get(spiritId);
    if (!state) {
      throw new Error("精靈不在孵化中");
    }
    
    // 驗證精靈所有權
    const spirit = await prisma.spirit.findFirst({
      where: { id: spiritId, userId }
    });
    
    if (!spirit) {
      throw new Error("精靈不存在或無權限");
    }
    
    // 獲取互動效果
    const effect = INTERACTION_EFFECTS[interactionType as keyof typeof INTERACTION_EFFECTS];
    if (!effect) {
      throw new Error("無效的互動類型");
    }
    
    // 應用互動效果
    const intensityMultiplier = Math.min(Math.max(intensity, 1), 10) / 5;
    
    // 增加進度
    const progressGain = effect.progress * intensityMultiplier;
    state.progress = Math.min(state.progress + progressGain, 100);
    
    // 調整環境
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
    
    // 增加互動計數
    state.interactionCount++;
    
    // 檢查互動條件
    if (state.interactionCount >= HATCHING_SYSTEM_CONFIG.CONDITIONS.INTERACTION_COUNT) {
      state.conditionsMet.interactions = true;
    }
    
    // 記錄互動事件
    this.addEvent(state, "INTERACTION", {
      type: interactionType,
      intensity,
      progressGain,
      newProgress: state.progress
    });
    
    // 檢查時間條件
    const timePassed = Date.now() - state.startTime.getTime();
    const requiredTime = HATCHING_SYSTEM_CONFIG.CONDITIONS.HATCHING_TIME * 60 * 60 * 1000;
    
    if (timePassed >= requiredTime) {
      state.conditionsMet.time = true;
    }
    
    // 檢查是否可以孵化
    const canHatch = this.checkHatchingConditions(state);
    
    if (canHatch && state.progress >= 100) {
      return await this.completeHatching(state, userId);
    }
    
    // 更新狀態
    this.hatchingStates.set(spiritId, state);
    
    // 記錄互動
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
    
    // 如果滿足孵化條件，完成孵化
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

  // 檢查孵化條件
  private checkHatchingConditions(state: HatchingState): boolean {
    return Object.values(state.conditionsMet).every(condition => condition === true);
  }
  
  // 完成孵化
  private async completeHatching(state: HatchingState, userId: string) {
    // 更新精靈階段
    await prisma.spirit.update({
      where: { id: state.spiritId },
      data: { stage: "JUVENILE" }
    });

    // 更新孵化記錄
    await prisma.hatchingRecord.updateMany({
      where: { spiritId: state.spiritId, status: "INCUBATING" },
      data: {
        endTime: new Date(),
        status: "COMPLETED",
        finalTemperature: state.temperature,
        finalHumidity: state.humidity
      }
    });

    // 移除孵化狀態
    this.hatchingStates.delete(state.spiritId);

    // 記錄孵化事件
    this.addEvent(state, "HATCHING_COMPLETE", {
      hatchTime: new Date(),
      finalProgress: state.progress
    });

    // 給予經驗值獎勵
    await gameService.addExperience(userId, 100);

    return {
      success: true,
      hatched: true,
      message: "🎉 孵化成功！精靈已進化為幼年期！",
      experienceGained: 100
    };
  }

  // 獲取公開狀態
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

  // 檢查溫度條件
  private checkTemperatureCondition(temperature: number): boolean {
    const optimal = TEMPERATURE_EFFECTS.optimal;
    return temperature >= optimal.min && temperature <= optimal.max;
  }

  // 檢查濕度條件
  private checkHumidityCondition(humidity: number): boolean {
    return humidity >= 40 && humidity <= 60;
  }

  // 限制溫度範圍
  private clampTemperature(temp: number): number {
    return Math.max(0, Math.min(50, temp));
  }

  // 限制濕度範圍
  private clampHumidity(humidity: number): number {
    return Math.max(0, Math.min(100, humidity));
  }

  // 獲取互動反饋
  private getInteractionFeedback(interactionType: string, intensity: number): string {
    const feedback = {
      TAP: "輕輕敲擊讓蛋殼產生共鳴...",
      SHAKE: "搖動讓胚胎活動筋骨...",
      WHISPER: "低語給予溫暖的鼓勵...",
      SING: "歌唱創造和諧的振動...",
      STORY: "講故事刺激大腦發育..."
    };
    return feedback[interactionType as keyof typeof feedback] || "互動有效果！";
  }

  // 獲取孵化狀態
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