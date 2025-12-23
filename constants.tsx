
export interface HorseColorConfig {
  body: string;
  mane: string;
  belly: string;
  hoof: string;
  pattern?: 'stripes' | 'spots' | 'patches';
  patternColor?: string;
}

export const HORSE_NAMES = [
  '粉紅閃電', '蔚藍之星', '青翠騎士', '薰衣草跑手',
  '金陽衝刺', '緋紅烈焰', '橙色風暴', '古銅大地',
  '銀霧幻影', '雪白晨光'
];

export const HORSE_COLOR_CONFIGS: Record<string, HorseColorConfig> = {
  '粉紅閃電': { body: '#fbcfe8', mane: '#be185d', belly: '#fdf2f8', hoof: '#831843' },
  '蔚藍之星': { body: '#bae6fd', mane: '#1d4ed8', belly: '#f0f9ff', hoof: '#1e3a8a' },
  '青翠騎士': { body: '#bbf7d0', mane: '#15803d', belly: '#f0fdf4', hoof: '#14532d' },
  '薰衣草跑手': { body: '#e9d5ff', mane: '#7e22ce', belly: '#faf5ff', hoof: '#581c87' },
  '金陽衝刺': { body: '#fef08a', mane: '#a16207', belly: '#fefce8', hoof: '#713f12' },
  '緋紅烈焰': { body: '#fca5a5', mane: '#b91c1c', belly: '#fef2f2', hoof: '#7f1d1d' },
  '橙色風暴': { body: '#fed7aa', mane: '#c2410c', belly: '#fff7ed', hoof: '#7c2d12' },
  '古銅大地': { body: '#d97706', mane: '#78350f', belly: '#fef3c7', hoof: '#451a03' },
  '銀霧幻影': { body: '#cbd5e1', mane: '#475569', belly: '#f1f5f9', hoof: '#1e293b' },
  '雪白晨光': { body: '#f8fafc', mane: '#94a3b8', belly: '#ffffff', hoof: '#475569' },
};

export const COMMENTARY_TEMPLATES = [
  "{name} 正在全速奔馳，萌力四射！",
  "看哪！{name} 擺動著蓬鬆的小尾巴衝過來了！",
  "{name} 的小短腿跑得飛快！",
  "全場觀眾都在為可愛的 {name} 尖叫！",
  "{name} 目前保持領先，鬥志昂揚！",
  "{name} 展現了驚人的爆發力！",
  "{name} 正邁著輕快的步伐，離終點不遠了！",
  "衝啊 {name}！你是最棒的！"
];

export const FINISH_COMMENTARY = [
  "太可愛了！{name} 率先躍過終點線！",
  "冠軍是 {name}！這場比賽太精彩了！",
  "不可思議！{name} 奪得了首名！"
];
