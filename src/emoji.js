export const EMOJI_MAP = [
  ['🧒',['ki','kind','kinder','kid','kids','child','children','tochter','sohn']],
  ['🥑',['avocado','avo']],['🧴',['eincremen','creme','lotion','salbe','sonnencreme','sunscreen']],
  ['👶',['baby','infant','säugling']],['👨‍👩‍👧‍👦',['familie','family','eltern']],['🍼',['flasche','babyflasche','bottle']],['🧷',['windel','diaper']],['🧸',['spielzeug','toy','teddy']],['🎒',['kita','kindergarten','schule','school']],
  ['🍎',['apfel','apple']],['🍌',['banane','banana']],['🍓',['erdbeere','strawberry']],['🥦',['brokkoli','gemüse','vegetables']],['🥕',['karotte','möhre','carrot']],['🍞',['brot','bread']],['🥛',['milch','milk']],['🍕',['pizza']],['🍝',['pasta','nudeln']],['🍫',['schokolade','chocolate']],['☕',['kaffee','coffee']],
  ['🩺',['arzt','doctor','untersuchung','praxis']],['💊',['medikament','medicine','tablette','vitamin']],['💉',['impfung','vaccine']],['🦷',['zahn','zähne','zahnarzt','teeth']],['🛁',['baden','bath']],['🚿',['dusche','shower']],['🧼',['seife','waschen','soap']],['🪒',['rasieren','shave']],['💇',['haare','friseur','haircut']],
  ['📅',['termin','appointment','meeting','kalender']],['⏰',['wecker','alarm','erinnerung','reminder']],['💸',['rechnung','zahlen','bezahlen','bill','pay','steuer']],['🧾',['quittung','beleg','receipt']],['📞',['anruf','telefon','call','phone']],['✉️',['mail','email','brief','post']],['📦',['paket','package']],
  ['🏃',['laufen','run','joggen']],['🚶',['spaziergang','walk','gehen']],['💪',['sport','training','gym','workout']],['🧘',['meditation','yoga','achtsam']],['🏊',['schwimmen','swim']],['🚲',['fahrrad','bike']],['⚽',['fussball','fußball','football','soccer']],
  ['🧹',['putzen','clean','aufräumen']],['🧺',['wäsche','laundry','waschen']],['🛒',['einkauf','shopping','supermarkt']],['🌱',['pflanze','gießen','garden']],['🗑️',['müll','trash','recycling']],['🔑',['schlüssel','key']],['🏠',['haus','wohnung','home']],
  ['🚗',['auto','car','fahren','tanken']],['🚆',['zug','train','bahn']],['🚌',['bus']],['✈️',['flug','airport','reise']],['🧳',['koffer','packen','travel']],
  ['💻',['computer','code','programmieren','laptop']],['📱',['handy','phone','smartphone']],['🔋',['akku','battery','laden']],['📷',['foto','camera']],['🎧',['musik','podcast','hören']],['🎬',['film','movie','kino']],['🎮',['game','spiel']],
  ['🐕',['hund','dog','gassi']],['🐈',['katze','cat']],['🌧️',['regen','rain']],['☀️',['sonne','morgen','sun','morning']],['🌙',['abend','nacht','night']],['🔥',['feuer','heizen','fire']],
  ['😀',['happy','glücklich','lächeln']],['😂',['lachen','laugh','lustig']],['❤️',['liebe','heart','love']],['🙏',['beten','pray']],['🎁',['geschenk','gift']],['✅',['todo','aufgabe','task','check']]
];
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
