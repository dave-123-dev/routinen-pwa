(() => {
  const MAP = [
    ['🧴', ['eincremen','cremen','creme','lotion','salbe','sonnencreme','sunscreen','cream','moisturizer','moisturise','moisturize','skincare','skin care']],
    ['🩺', ['arzt','ärztin','doctor','medical','checkup','untersuchung','kontrolle','praxis']],
    ['📅', ['termin','appointment','meeting','kalender','date','schedule']],
    ['💸', ['zahlen','rechnung','bezahlen','bill','pay','payment','invoice','steuer','tax']],
    ['🧘', ['meditation','meditate','achtsam','meditieren','yoga','mindful','mindfulness']],
    ['💊', ['medicine','medication','pill','tablette','medikament','vitamin','supplement','pille']],
    ['🏃', ['run','running','jog','jogging','laufen','joggen']],
    ['🚶', ['walk','walking','spazier','spaziergang','gehen']],
    ['💪', ['gym','workout','training','sport','kraft','fitness','exercise','übung']],
    ['📚', ['read','reading','book','lesen','buch','study','lernen']],
    ['🧹', ['clean','putzen','aufräumen','cleaning','tidy','ordnung']],
    ['🧺', ['laundry','wäsche','waschen','wash clothes']],
    ['🛒', ['shopping','einkauf','einkaufen','groceries','supermarkt']],
    ['💧', ['water','wasser','trinken','hydrate','hydration']],
    ['☕', ['coffee','kaffee','espresso','cappuccino']],
    ['🦷', ['teeth','tooth','zähne','zahn','zahnarzt','brush teeth','zähneputzen']],
    ['🛏️', ['sleep','schlafen','bett','bed','nap','nickerchen']],
    ['📝', ['write','journal','schreiben','tagebuch','notes','notizen']],
    ['📞', ['call','phone','anruf','telefonieren','telefon']],
    ['🌱', ['plant','pflanze','pflanzen','gießen','giessen','garden','garten']],
    ['🍽️', ['eat','meal','essen','mahlzeit','dinner','lunch','breakfast','frühstück']],
    ['💻', ['code','coding','programmieren','computer','laptop','entwickeln']],
    ['🗑️', ['trash','müll','abfall','garbage','recycling']],
    ['☀️', ['morning','morgen','sun','sonne','sunlight']],
    ['🌙', ['evening','abend','night','nacht']],
    ['🧾', ['receipt','quittung','beleg','expense','ausgabe']],
    ['🚗', ['car','auto','fahren','drive','tanken','fuel','benzin']],
    ['🐕', ['dog','hund','gassi']],
    ['🐈', ['cat','katze','kater']],
    ['🎁', ['gift','geschenk','present']],
    ['🎂', ['birthday','geburtstag']],
    ['✉️', ['mail','email','e-mail','post','brief']],
    ['🧑‍🍳', ['cook','cooking','kochen','meal prep']],
    ['🧊', ['freeze','freezer','einfrieren','gefrier']],
    ['🧼', ['soap','seife','duschen','shower','bath','bad']],
    ['🪒', ['shave','rasieren','rasur']],
    ['💇', ['hair','haare','friseur','haircut']],
    ['💅', ['nails','nägel','manicure']],
    ['🧠', ['therapy','therapie','denken','mind','mental']],
    ['🎧', ['music','musik','podcast','listen','hören']],
    ['🧯', ['backup','sicherheit','insurance','versicherung']],
    ['🔑', ['key','schlüssel']],
    ['🧳', ['travel','reise','packen','packing','koffer']]
  ];
  function guess(text) {
    const value = String(text || '').toLowerCase();
    for (const [emoji, keys] of MAP) if (keys.some(k => value.includes(k))) return emoji;
    return '';
  }
  function boot() {
    const title = document.getElementById('title');
    const emoji = document.getElementById('emoji');
    if (!title || !emoji || title.dataset.emojiLiveFix) return;
    title.dataset.emojiLiveFix = '1';
    let programmatic = false;
    let manual = false;
    emoji.addEventListener('input', () => {
      if (!programmatic) manual = true;
      if (!emoji.value.trim()) manual = false;
    });
    function apply() {
      if (manual) return;
      const next = guess(title.value);
      if (!next) return;
      programmatic = true;
      emoji.value = next;
      emoji.dataset.auto = '1';
      programmatic = false;
    }
    ['input','keyup','paste','compositionend','change'].forEach(evt => title.addEventListener(evt, () => setTimeout(apply, 0)));
    const oldOpenAdd = window.openAdd;
    if (typeof oldOpenAdd === 'function' && !window.__emojiOpenAddPatched) {
      window.__emojiOpenAddPatched = true;
      window.openAdd = function(...args) { manual = false; return oldOpenAdd.apply(this, args); };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();