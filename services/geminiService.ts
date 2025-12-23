
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getRaceCommentary(horses: any[], lastDrawnIds: number[], finishers: number[]) {
  if (!process.env.API_KEY) return "觀眾席傳來陣陣歡呼！";

  try {
    const leader = [...horses].sort((a, b) => b.position - a.position)[0];
    const rankingNames = finishers.map(id => horses.find(h => h.id === id)?.name);
    
    const prompt = `
      你是一位專業的賽馬播報員。
      目前的賽事狀態：
      - 各馬位置：${horses.map(h => `${h.name}: ${h.position}`).join(', ')}。
      - 剛抽出的牌卡屬於：${lastDrawnIds.map(id => horses.find(h => h.id === id)?.name).join(', ')}。
      - 已衝線名次（依序）：${rankingNames.join(' -> ') || '目前尚無馬匹衝線'}。
      - 目前場上領先者：${leader.name}。
      請針對這一次的抽牌結果，提供一段簡短、激動人心的一句話即時播報（繁體中文）。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "比賽進入白熱化階段！";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "現場氣氛十分緊張！";
  }
}
