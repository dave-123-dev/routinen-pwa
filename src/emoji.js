import { EMOJI_MAP } from './emoji-map.js';
export { EMOJI_MAP };

export function guessEmoji(text){
  const value = String(text || '').toLowerCase().trim();
  if(!value) return '';
  const words = value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const last = words.at(-1) || value;
  let best = null;
  for(const [emoji, keys] of EMOJI_MAP){
    for(const raw of keys){
      const k = String(raw).toLowerCase();
      let score = 0;
      if(value.includes(k)) score = 100 + k.length;
      else if(last.length >= 2 && k.length >= 2 && k.startsWith(last)) score = 50 + last.length;
      else if(last.length >= 3 && last.startsWith(k)) score = 40 + k.length;
      if(score && (!best || score > best.score)) best = { emoji, score };
    }
  }
  return best?.emoji || '';
}
