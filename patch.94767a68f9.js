
// v5.11 finishing pass: full backup of every profile, safer single-profile restore, offline status.
function myfitKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('myfit-')) keys.push(key);
  }
  return keys.sort();
}

function backupStamp() {
  return dateKey(new Date());
}

function downloadJSON(data, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function markBackup() {
  try {localStorage.setItem('myfit-last-backup', new Date().toISOString())} catch (_) {}
}

backup = function () {
  downloadJSON(S, `myfit-${String(S.profile.name || 'profile').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${backupStamp()}.json`);
  markBackup();
  render();
};

function backupAll() {
  const data = {};
  try {
    for (const key of myfitKeys()) data[key] = localStorage.getItem(key);
  } catch (_) {
    alert('Storage unavailable. Nothing was exported.');
    return;
  }
  downloadJSON({format: 'myfit-full-backup', version: 1, exported: new Date().toISOString(), data}, `myfit-all-profiles-${backupStamp()}.json`);
  markBackup();
  render();
}

const restoreSingle511 = restore;
restore = async function (el) {
  if (!el.files || !el.files[0]) return;
  try {
    const x = JSON.parse(await el.files[0].text());
    if (x && x.format === 'myfit-full-backup') {
      el.value = '';
      return alert('This is an all-profiles backup. Use “Restore all profiles” instead.');
    }
  } catch (_) {}
  await restoreSingle511(el);
  el.value = '';
};

async function restoreAll(el) {
  const file = el.files && el.files[0];
  el.value = '';
  if (!file) return;
  let x;
  try {x = JSON.parse(await file.text())} catch (_) {return alert('Invalid backup file.')}
  if (!x || x.format !== 'myfit-full-backup' || !x.data || typeof x.data !== 'object') {
    return alert('This is not an all-profiles backup. To restore one profile, use “Restore this profile”.');
  }
  const entries = Object.entries(x.data).filter(([k, v]) => k.startsWith('myfit-') && typeof v === 'string');
  // Check the profile list and every profile record before touching storage.
  try {
    const dir = x.data[profileDirectoryKey];
    const directory = dir ? JSON.parse(dir) : defaultProfileDirectory();
    if (!Array.isArray(directory.profiles) || !directory.profiles.some(r => r.id === directory.active)) throw 0;
    for (const record of directory.profiles) {
      const raw = x.data[profileStorageKey('myfit-v1', record.id)];
      if (raw && !validState(JSON.parse(raw))) throw 0;
    }
  } catch (_) {return alert('This backup is damaged or from an incompatible version. Nothing was changed.')}
  const count = (() => {try {return JSON.parse(x.data[profileDirectoryKey] || 'null')?.profiles?.length || 1} catch (_) {return 1}})();
  if (!confirm(`Replace ALL profiles on this device with this backup (${count} profile${count === 1 ? '' : 's'}, exported ${String(x.exported || '').slice(0, 10) || 'unknown date'})? Export current data first if needed.`)) return;
  const previous = {};
  try {
    for (const key of myfitKeys()) previous[key] = localStorage.getItem(key);
    for (const key of Object.keys(previous)) localStorage.removeItem(key);
    for (const [k, v] of entries) localStorage.setItem(k, v);
  } catch (_) {
    try {
      for (const key of myfitKeys()) localStorage.removeItem(key);
      for (const [k, v] of Object.entries(previous)) localStorage.setItem(k, v);
    } catch (_) {}
    return alert('Restore failed: storage unavailable. Your previous data was put back.');
  }
  location.reload();
}

function lastBackupText() {
  let at = null;
  try {at = localStorage.getItem('myfit-last-backup')} catch (_) {}
  if (!at) return 'No backup exported on this device yet.';
  const days = Math.floor((Date.now() - new Date(at)) / 864e5);
  return `Last backup: ${esc(at.slice(0, 10))}${days > 0 ? ` (${days} day${days === 1 ? '' : 's'} ago)` : ' (today)'}.`;
}

dataBackupPanel = function () {
  let profiles = 1;
  try {profiles = readProfileDirectory().profiles.length} catch (_) {}
  return `<section><h2>Data &amp; backup</h2>
    <p class="muted">Your data lives only in this browser. Export a backup regularly, and before clearing browser data or changing phones.</p>
    <p><b>${lastBackupText()}</b></p>
    <h3>Everything on this device</h3>
    <p>All ${profiles} profile${profiles === 1 ? '' : 's'}, with food, workouts, measurements and settings.</p>
    <button class="wide" onclick="backupAll()">Export all profiles</button>
    <label>Restore all profiles<input type="file" accept=".json,application/json" onchange="restoreAll(this)"></label>
    <h3>This profile only</h3>
    <button class="alt wide" onclick="backup()">Export this profile</button>
    <label>Restore this profile<input type="file" accept=".json,application/json" onchange="restore(this)"></label>
    <p class="muted">${navigator.onLine ? 'Online.' : 'Offline. Logging, workouts and the planner still work; food database lookups, barcode lookups and photo scanning need a connection.'}</p>
  </section>`;
};

window.addEventListener('online', () => {if (tab === 'Data') render()});
window.addEventListener('offline', () => {if (tab === 'Data') render()});

// Profiles could be created but never removed.
function profileKeys(id) {
  return myfitKeys().filter(key => id === originalProfileId
    ? !key.includes(':') && key !== profileDirectoryKey && key !== 'myfit-last-backup'
    : key.endsWith(':' + id));
}

function deleteProfile(id) {
  if (profileDirectoryInvalid) return alert('The saved profile list could not be read.');
  let directory, record;
  try {
    directory = readProfileDirectory();
    record = directory.profiles.find(r => r.id === id);
  } catch (_) {return alert('Could not read profiles. Nothing was deleted.')}
  if (!record || id === activeProfileId || directory.profiles.length < 2) return;
  const name = profileDisplayName(record);
  if (!confirm(`Permanently delete the profile “${name}” and all of its food, workout and measurement records from this device? Export a backup first if you may need it.`)) return;
  try {
    localStorage.setItem(profileDirectoryKey, JSON.stringify({...directory, profiles: directory.profiles.filter(r => r.id !== id)}));
    for (const key of profileKeys(id)) localStorage.removeItem(key);
  } catch (_) {return alert('Could not delete the profile. Check browser storage and try again.')}
  render();
}

const measure511 = measure;
measure = function () {
  if (![0,1,2,3,4].some(i => $('m' + i) && $('m' + i).value)) return alert('Enter at least one measurement first.');
  measure511();
};

const userProfilesPanel511 = userProfilesPanel;
userProfilesPanel = function () {
  const html = userProfilesPanel511();
  let many = false;
  try {many = readProfileDirectory().profiles.length > 1} catch (_) {}
  if (!many) return html;
  return html.replace(/(<button class="alt" data-profile-id="([^"]+)" onclick="openProfileInBrowser\(this\.dataset\.profileId\)">Switch<\/button>)/g,
    '<span style="display:flex;gap:6px">$1<button class="alt" data-profile-id="$2" onclick="deleteProfile(this.dataset.profileId)" aria-label="Delete profile">Delete</button></span>');
};

// v5.12 coach voices: automatic, free match to the voices already on this device.
// Before this, a coach only got its own voice after the person labelled voices by hand in Voice Studio,
// so most coaches fell back to the same default voice.
const femaleVoice512 = /\b(female|woman|samantha|zira|karen|moira|tessa|susan|sarah|jenny|aria|emma|ava|victoria|sonia|hazel|kate|natasha|libby|maisie|clara|emily|michelle|ana|jane|nancy|sara|serena|allison|fiona|veena|catherine|heather|linda|joanna|kendra|kimberly|salli|ivy|amy|olivia|raveena|aditi|neerja|molly|luna|leah|ashley|cora|elizabeth|monica|nova|isabella|lily|alice|zoe|martha|nicky|shelley|sandy|grandma|flo|rocko\s*female|abeo\s*female|ezinne|imani|rosa|annette|bella|heera|kalpana|swara|ada|asilia|leni|mia|nia|yan|thandi)\b/i;
const maleVoice512 = /\b(male|man|daniel|david|mark|alex|fred|george|guy|ryan|james|aaron|tom|oliver|arthur|liam|rishi|thomas|william|brian|eric|christopher|roger|steffan|andrew|brandon|davis|jason|tony|prabhat|luke|ken|mitchell|connor|wayne|matthew|joey|justin|kevin|russell|lee|gordon|ravi|hemant|abeo|chilemba|elimu|wayan|james|reed|eddy|grandpa|ralph|albert|junior|kyle|duncan|nathan|noah|sam|adam|michael|lewis)\b/i;
// Google voices on Android name themselves by code; these codes are documented by gender in Google's TTS voice list.
const androidVoice512 = {
  'en-us-x-sfg':'f','en-us-x-iob':'f','en-us-x-iog':'f','en-us-x-tpc':'f','en-us-x-tpf':'f',
  'en-us-x-iol':'m','en-us-x-iom':'m','en-us-x-tpd':'m',
  'en-gb-x-gba':'f','en-gb-x-gbc':'f','en-gb-x-gbg':'f','en-gb-x-gbb':'m','en-gb-x-gbd':'m','en-gb-x-rjs':'m',
  'en-in-x-ena':'f','en-in-x-enc':'f','en-in-x-end':'m','en-in-x-ene':'m',
  'en-au-x-aua':'f','en-au-x-auc':'f','en-au-x-aub':'m','en-au-x-aud':'m'
};
// When a coach's home accent isn't installed, try the nearest ones in this order.
const accentChain512 = {
  'en-JM':['en-JM','en-TT','en-BB','en-029','en-GB','en-NG','en-ZA','en-US'],
  'en-CA':['en-CA','en-US'],
  'en-US':['en-US','en-CA'],
  'en-GB':['en-GB','en-IE','en-AU','en-NZ'],
  'en-SG':['en-SG','en-MY','en-IN','en-GB'],
  'en-IN':['en-IN','en-GB'],
  'en-NZ':['en-NZ','en-AU','en-GB']
};
const accentName512 = {'en-JM':'Jamaican','en-TT':'Trinidadian','en-BB':'Barbadian','en-029':'Caribbean','en-NG':'Nigerian','en-GB':'British','en-ZA':'South African','en-US':'American','en-CA':'Canadian','en-IE':'Irish','en-AU':'Australian','en-NZ':'New Zealand','en-SG':'Singaporean','en-MY':'Malaysian','en-IN':'Indian'};

function voiceLang512(v) {
  const [a, b] = String(v?.lang || '').replace('_', '-').split('-');
  return b ? `${a.toLowerCase()}-${b.toUpperCase()}` : a.toLowerCase();
}

function voiceGender512(v) {
  const label = studio583().labels[v.voiceURI];
  if (label === 'm' || label === 'f') return label;
  const text = `${v.name} ${v.voiceURI}`.toLowerCase();
  for (const [code, g] of Object.entries(androidVoice512)) if (text.includes(code)) return g;
  if (/google us english$/i.test(v.name)) return 'f';
  const f = femaleVoice512.test(text.replace(/\bfemale\b/g, ' female ')), m = maleVoice512.test(text.replace(/\bfemale\b/g, ' '));
  return f && !m ? 'f' : m && !f ? 'm' : 'unknown';
}

function voiceScore512(v, p, k) {
  const g = voiceGender512(v), chain = accentChain512[p[0]] || [p[0], 'en-US'], lang = voiceLang512(v);
  const at = chain.indexOf(lang);
  let score = (g === p[1] ? 100 : g === 'unknown' ? 0 : -200) + (at >= 0 ? (chain.length - at) * 12 : 0);
  if (/natural|neural|enhanced|premium|online|wavenet|studio/i.test(v.name)) score += 15;
  if (!navigator.onLine && v.localService === false) score -= 500;  // online-only voices fail offline
  // Spread coaches across voices that score the same, so they don't all sound identical.
  let h = 0; for (const c of v.voiceURI + k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return score + (h % 7) / 10;
}

voicePick582 = function (i, j) {
  const k = i * 4 + j, p = voiceProfiles582[k], vs = english583(), manual = S.voice582?.[k];
  if (manual) {const v = vs.find(v => v.voiceURI === manual); if (v) return v;}
  if (!p || !vs.length) return undefined;
  return vs.map(v => [voiceScore512(v, p, k), v]).sort((a, b) => b[0] - a[0])[0][1];
};

function voiceMatchNote512(i, j) {
  const k = i * 4 + j, p = voiceProfiles582[k], v = voicePick582(i, j);
  if (!p) return '';
  const want = accentName512[p[0]] || p[0];
  if (!v) return `<small>No English voices found on this device yet; the device default will be used.</small>`;
  const got = voiceLang512(v), gotName = accentName512[got] || got, g = voiceGender512(v);
  const accent = got === p[0] ? `${want} accent matched.` : `No ${want} voice is installed on this device, so the closest available (${esc(gotName)}) is used.`;
  const gender = g === p[1] ? '' : g === 'unknown' ? ' Voice gender unknown: preview it and set “Sounds male/female” below if needed.' : ' No matching male/female voice found in this accent.';
  return `<small>${accent}${gender} More free voices can be added in your phone’s text-to-speech settings (download on Wi-Fi).</small>`;
}

const studioInner512 = studioInner583;
studioInner583 = function () {
  const [i, j] = slot583();
  return studioInner512().replace(/(<p>Assigned: [^<]*<\/p>)/, `$1<p>${voiceMatchNote512(i, j)}</p>`);
};

// Voice providers. 'device' is free and offline. A paid provider can be added later as
// coachVoiceProviders.name = {speak(text, {coach, look, rate, pitch, voice}) -> Promise}
// and selected with S.voiceProvider512 = 'name'; if it fails, the device voice is used.
const coachVoiceProviders = {
  device: {speak: (text, o) => {studioSpeak583(text, o.voice, o.rate, o.pitch); return Promise.resolve();}}
};
speak582 = function (text, i = activeCoach(), j = avatarChoice(coachPrefs(), i)) {
  const k = i * 4 + j, p = voiceProfiles582[k] || ['en-US', 'm', 1, 1], v = voicePick582(i, j), t = studio583().tuning[k] || {};
  const serious = /stop painful|assess symptoms|reducing intensity|seek professional/i.test(text);
  const o = {coach: i, look: j, voice: v, rate: Math.max(.65, Math.min(1.4, (t.rate ?? p[2]) * (serious ? .88 : 1))), pitch: t.pitch ?? p[3]};
  if (!v) voiceNotice59('Using device default voice. Individual voice unavailable.');
  const provider = coachVoiceProviders[S.voiceProvider512] || coachVoiceProviders.device;
  provider.speak(text, o).catch(() => coachVoiceProviders.device.speak(text, o));
};

// Maya, the front-desk secretary, is a Canadian woman: give her a matching voice instead of the device default.
function secretaryVoice512() {
  const vs = english583();
  if (!vs.length) return null;
  return vs.map(v => [voiceScore512(v, ['en-CA', 'f'], 'maya'), v]).sort((a, b) => b[0] - a[0])[0][1];
}
speakSecretary = function (text, ended) {
  if (!secretaryCanSpeak()) return false;
  speechSynthesis.cancel();
  const spoken = new SpeechSynthesisUtterance(text), v = secretaryVoice512();
  if (v) {spoken.voice = v; spoken.lang = v.lang;} else spoken.lang = 'en-CA';
  spoken.rate = 0.92;
  if (ended) spoken.onend = ended;
  speechSynthesis.speak(spoken);
  return true;
};

// v5.13 realistic voices (ElevenLabs) through your own small voice server.
// The ElevenLabs key lives only on that server, never in this app. Voice IDs and the server address
// come from voices.js, which you can edit on GitHub. Every clip is saved on the phone, so a line is
// only paid for and downloaded once. Without a server, offline, or out of credits, phone voices are used.
const voiceCache513 = 'voiceclips-myfit-v1';   // not "myfit-" so app updates never delete saved clips
const voiceClipLimit513 = 400;
let voiceTurn513 = 0, voiceWarned513 = false;

function voiceConfig513() {
  const c = window.MYFIT_VOICES || {};
  return {server: String(c.server || '').trim().replace(/\/+$/, ''), maya: String(c.maya || '').trim(), coaches: c.coaches || {}};
}
function voicePrefs513() {return S.voice513 ??= {enabled: true, wifiOnly: true}}
function voiceReady513() {const c = voiceConfig513(); return !!c.server && voicePrefs513().enabled}
function coachVoiceId513(i, j) {return String(voiceConfig513().coaches[character58(i, j)[0]] || '').trim()}
function onCellular513() {
  const c = navigator.connection;
  return !!c && (c.saveData || c.type === 'cellular');
}
function outOfCredits513() {
  try {return localStorage.getItem('myfit-voice-paused') === today()} catch (_) {return false}
}
function clipKey513(voice, text) {
  let h1 = 5381, h2 = 52711;
  for (const ch of text) {const c = ch.codePointAt(0); h1 = (h1 * 33) ^ c; h2 = (h2 * 33) ^ c;}
  return `https://voice.myfit.invalid/${encodeURIComponent(voice)}/${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}-${text.length}.mp3`;
}

// One reusable player. It is "unlocked" during the tap, so phones (iPhone especially) allow it
// to play the clip after it finishes downloading.
const player513 = new Audio();
const silent513 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
function stopVoice513() {
  voiceTurn513++;
  try {player513.pause()} catch (_) {}
  player513.onended = player513.onerror = null;
}
// Every existing "stop talking" path calls speechSynthesis.cancel(); make it stop clips too.
if (window.speechSynthesis) {
  const cancel513 = speechSynthesis.cancel.bind(speechSynthesis);
  try {speechSynthesis.cancel = () => {stopVoice513(); cancel513();}} catch (_) {}
}

async function voiceClip513(voice, text, allowDownload) {
  const key = clipKey513(voice, text);
  let cache = null;
  try {cache = await caches.open(voiceCache513)} catch (_) {}
  const saved = cache && await cache.match(key);
  if (saved) return saved.blob();
  if (!allowDownload) throw Error('not saved');
  const c = voiceConfig513();
  if (!navigator.onLine) throw Error('offline');
  if (outOfCredits513()) throw Error('paused');
  if (voicePrefs513().wifiOnly && onCellular513()) throw Error('mobile data');
  const r = await fetch(c.server, {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({voice, text}), signal: AbortSignal.timeout(15000)});
  if (r.status === 402 || r.status === 429 || r.status === 401) {
    try {localStorage.setItem('myfit-voice-paused', today())} catch (_) {}
    throw Error('credits');
  }
  if (!r.ok || !/audio/.test(r.headers.get('Content-Type') || '')) throw Error('server ' + r.status);
  const blob = await r.blob();
  if (cache) {
    try {
      await cache.put(key, new Response(blob, {headers: {'Content-Type': 'audio/mpeg'}}));
      const keys = await cache.keys();
      for (const old of keys.slice(0, Math.max(0, keys.length - voiceClipLimit513))) await cache.delete(old);
    } catch (_) {}
  }
  return blob;
}

function playClip513(blob, turn, ended) {
  return new Promise((resolve, reject) => {
    if (turn !== voiceTurn513) return resolve();
    const url = URL.createObjectURL(blob);
    const done = () => {URL.revokeObjectURL(url); player513.onended = player513.onerror = null;};
    player513.onended = () => {done(); if (ended) ended(); resolve();};
    player513.onerror = () => {done(); reject(Error('play'));};
    player513.src = url;
    player513.play().catch(e => {done(); reject(e);});
  });
}

async function speakReal513(voice, text, ended) {
  if (!voice || !voiceReady513()) throw Error('no voice');
  if (window.speechSynthesis) speechSynthesis.cancel();   // also stops any earlier clip
  const turn = voiceTurn513;
  try {player513.src = silent513; player513.play().catch(() => {});} catch (_) {}
  const blob = await voiceClip513(voice, text, true);
  await playClip513(blob, turn, ended);
}

function voiceFallbackNotice513(e) {
  if (voiceWarned513) return;
  const why = {offline: 'You’re offline', 'mobile data': 'You’re on mobile data', credits: 'Voice credits are used up for now', paused: 'Voice credits are used up for today'}[e?.message];
  if (!why) return;
  voiceWarned513 = true;
  voiceNotice59(`${why}, so this line uses your phone’s voice. Saved lines still play in the real voice.`);
}

coachVoiceProviders.elevenlabs = {
  speak: (text, o) => speakReal513(coachVoiceId513(o.coach, o.look), text)
    .catch(e => {voiceFallbackNotice513(e); throw e;})
};
const speak513 = speak582;
speak582 = function (text, i = activeCoach(), j = avatarChoice(coachPrefs(), i)) {
  if (S.voiceProvider512 === undefined && voiceReady513() && coachVoiceId513(i, j)) {
    S.voiceProvider512 = 'elevenlabs';
    const r = speak513(text, i, j);
    delete S.voiceProvider512;
    return r;
  }
  return speak513(text, i, j);
};

const speakSecretary513 = speakSecretary;
speakSecretary = function (text, ended) {
  const maya = voiceConfig513().maya;
  if (!maya || !voiceReady513()) return speakSecretary513(text, ended);
  speakReal513(maya, text, ended).catch(e => {voiceFallbackNotice513(e); speakSecretary513(text, ended);});
  return true;
};

// Lines that never change: Maya's tour and setup, and each coach's introduction.
function fixedLines513() {
  const lines = [];
  const maya = voiceConfig513().maya;
  if (maya) {
    secretaryTabs.forEach(([, label, instruction], n) =>
      lines.push([maya, (n === 0 ? 'Hi, I’m ' + secretaryName + '. Glad you’re here. First up, the ' : '') + label + '. ' + instruction]));
    Object.values(orientationInstructions).forEach(t => lines.push([maya, t]));
  }
  cast58.forEach((c, k) => {
    const id = coachVoiceId513(Math.floor(k / 4), k % 4);
    if (id) lines.push([id, c[4] + '. I am ' + c[0] + '. ' + c[7]]);
  });
  return lines;
}

async function prepareVoices513(btn) {
  if (!voiceReady513()) return voiceNotice59('Add your voice server address in voices.js first.');
  if (!navigator.onLine) return voiceNotice59('Connect to Wi-Fi first.');
  const lines = fixedLines513();
  let saved = 0, failed = 0;
  for (const [voice, text] of lines) {
    if (btn) btn.textContent = `Saving voices… ${saved + failed + 1} of ${lines.length}`;
    try {await voiceClip513(voice, text, true); saved++;} catch (e) {failed++; if (e.message === 'credits' || e.message === 'paused') break;}
  }
  voiceNotice59(`${saved} voice lines saved for offline use${failed ? `, ${failed} not saved` : ''}.`);
  refreshStudio583();
}

async function clearVoices513() {
  if (!confirm('Delete saved voice clips from this phone? They will be downloaded again (using credits) when needed.')) return;
  try {await caches.delete(voiceCache513)} catch (_) {}
  refreshStudio583();
}

function setVoicePref513(key, value) {voicePrefs513()[key] = value; save(); refreshStudio583();}

function realVoicePanel513() {
  const c = voiceConfig513(), p = voicePrefs513();
  const named = Object.values(c.coaches).filter(v => String(v).trim()).length;
  if (!c.server) return `<section><h3>Realistic voices</h3><p class="muted">Not set up yet. Coaches use your phone’s voices.</p></section>`;
  const [i, j] = slot583(), id = coachVoiceId513(i, j);
  return `<section><h3>Realistic voices</h3>
    <p class="muted">${named} coach voice${named === 1 ? '' : 's'}${c.maya ? ' and Maya' : ''} set up. This coach: ${id ? 'realistic voice' : 'phone voice (no voice ID yet)'}.${outOfCredits513() ? ' Paused today: credits ran out.' : ''}</p>
    <label><input type="checkbox" ${p.enabled ? 'checked' : ''} onchange="setVoicePref513('enabled',this.checked)"> Use realistic voices</label>
    <label><input type="checkbox" ${p.wifiOnly ? 'checked' : ''} onchange="setVoicePref513('wifiOnly',this.checked)"> Don’t download new lines on mobile data (where the phone reports it)</label>
    <button class="alt wide" onclick="prepareVoices513(this)">Save Maya’s tour and coach intros now (use Wi-Fi)</button>
    <button class="alt wide" onclick="clearVoices513()">Delete saved voice clips</button>
  </section>`;
}
const studioInner513 = studioInner583;
studioInner583 = function () {return realVoicePanel513() + studioInner513()};

const voiceScripts514 = {"host":{"welcome":"Hi, I’m Maya. Welcome to MyFit! I’m glad you’re here. Let me show you how your workouts, meals and progress all work together, and help you find a coach who feels right for you.","tour-dashboard":"Here’s what I love about MyFit: your workouts, meals and progress all work together. Start here for the essentials. The rings show how today is going. Tap Live Workout to start training, Log food to enter a meal, or Add water when you finish a glass. Your coach’s check-in is here too, so you can decide what needs your attention next.","tour-food":"Let me show you my favourite time-saver. With Snap & Track you can take a meal photo, then review the estimated foods and portions before saving. You can also scan a barcode, type a meal, or enter package values. In a hurry? Quick meal ideas pulls from recipes that match your preferences. Your Food log keeps your entries together, and you can edit them later.","tour-workout":"This is where MyFit helps you through a workout, one exercise at a time. Your coach plans around the equipment and movement preferences in My Gym. If a machine is busy, swap the exercise for today. Open How to do it for written form notes and a video demo. Save each set, follow your rest timer, and finish with a recap of what you completed. You can log a past workout too.","tour-planner-meals":"Here’s where planning saves you work. Pick a week and a theme, then change any meal you want. Your grocery list adjusts with the plan, so you can shop for whole items like two bananas. Mark what you already have before heading to the store. Open a recipe to see nutrition, scale servings, switch from grams to kitchen measures, or start a timer from a recipe step.","tour-planner-workouts":"Switch to Workouts inside Planner to see training and recovery days separately from food. Use the week or month view and tap a date to preview the coach’s exercises and scheduled time. You can change today’s time or update your usual time here. When it’s time to train, today’s entry can take you straight to Live Workout.","tour-coach":"A coach should feel right for you. In Customize coach, you can meet different personalities, hear a preview and hear how each coach sounds. The daily briefing brings together your goal, food and training progress. If you change coaches or goals later, you can review the new program while keeping your original measurements and workout history.","tour-profile":"This is your home for goals, starting measurements, My Gym and Progression. Your strength trends compare logged sets when the exercise and reps match. My Gym keeps your equipment, movement choices and notes. You can create a separate local profile for someone else using this browser. Backups are per profile, so save yours before changing devices.","tour-help":"If you ever get stuck, come right back here. Help has shortcuts and written directions for each part of MyFit, plus this replayable tour. That’s the idea behind MyFit: plan the week, know what to shop for, train with guidance, and see your progress in the same place. Ready? Let’s get you set up.","setup-starting-profile":"Glad you’re here! Tell me a little about yourself so your coach has a place to start. You can add measurements now or come back to them later.","setup-goal-selection":"What would you like to work toward? Choose the goal that feels right for you today.","setup-equipment-and-movement":"Where will you be training? Tell me what equipment you can use and what movements you want to avoid. I’ll pass that on to your coach.","setup-food-preferences":"Let’s talk food. Choose your dietary preferences, or leave me a note about allergies, budget, or what works for you.","setup-coach-selection":"Ready to meet the coaches? Pick a style that suits you, then listen to the one you’re considering.","setup-review-and-handoff":"Here’s what I’ll pass to your coach. Take a moment to check it, then we’ll get your workout and meal plans ready."},"styles":[{"opener":["Set your stance. Let’s work.","Start sharp. Keep it controlled."],"mid":["Keep the rep controlled all the way through. Make this one count.","Own the lowering phase.","Keep the same pace through the set.","Set the weight down with control."],"rest":["Recovery is part of getting stronger.","Take your time between sets.","Get your breath back first."],"finish":["Solid work. Log it.","Strong finish. Save those sets.","Good work. Come back ready."]},{"opener":["Check your setup. Start on plan.","Read the first set before moving."],"mid":["Check the setup before the next set. Follow the plan.","Reset your position before each rep.","Stay with the planned pace.","Keep your technique consistent."],"rest":["Schedule recovery and stick to it.","Check your log during the break.","Take the rest you planned."],"finish":["Session complete. Record it.","Good discipline today.","Review the plan before next time."]},{"opener":["Find your rhythm in the warm-up.","Start smooth and build from there."],"mid":["Keep your rhythm steady and make the next rep as clean as the first.","Make the next rep look like the first.","Keep your pace steady.","Finish with the same control you started with."],"rest":["Recover well so you can perform again.","Use the break to settle your breathing.","Check your pace before the next set."],"finish":["That was a strong finish.","Save today’s numbers.","Give yourself time to recover."]},{"opener":["Start with a load you know.","Pick one thing to track today."],"mid":["Notice whether your form or effort changed. Log what actually happened.","Notice how your technique feels.","Record the reps you actually did.","Compare the last rep with the first."],"rest":["Assess sleep and soreness before increasing training load.","Check how much effort that took.","Note any change before your next set."],"finish":["Save what you measured today.","Review the pattern over a few sessions.","One session gives us a starting point."]},{"opener":["Let’s start with an easy practice set.","Get comfortable with the setup."],"mid":["Take the next rep at a pace you can control.","Make each rep smooth and steady.","Keep the movement comfortable.","Slow down if you need to reset."],"rest":["Make time for rest and mobility.","Take a sip of water if you need one.","Give yourself time before the next set."],"finish":["Nice work. Save your session.","You built on where you started.","Give yourself credit for showing up."]},{"opener":["You showed up. Let’s get moving!","Start at a pace that feels right."],"mid":["Look at the work you’ve already done. Give this next rep the same care.","Nice rhythm. Keep it going.","Every steady rep counts!","Take a moment to reset. You’ve got this."],"rest":["Rest is progress too. You deserve recovery.","Take a breath and enjoy the break.","That set’s done. Let yourself recover."],"finish":["You made time for yourself today!","Celebrate the effort you put in.","Log your win before you go."]},{"opener":["Start with a breath and settle in.","Begin with a range that feels easy."],"mid":["Take an easy breath and move within a comfortable range.","Let your breathing stay steady.","Relax your shoulders if you can.","Move at a pace you can feel."],"rest":["Enjoy gentle movement and restorative breathing.","Let the last set settle.","Take as much time as you need."],"finish":["Give yourself a quiet moment to finish.","Notice what feels different now.","Carry that steadiness into your day."]}],"coaches":{"Marcus Steele":["I’m Marcus Steele. Earn every rep — excuses don’t lift weights.","Morning. Let’s earn something today.","Meal log’s blank. Add it if you ate.","Session’s still open. Log it or reschedule.","Yo, let's get to work. Earn every rep.","That is real work, superstar."],"Dwayne Iron Campbell":["I’m Dwayne Iron Campbell. Big up! Strong reps, stronger habits.","Good morning. Steady effort today.","Did you eat? Put it in the log.","Missed training? Pick a time you can keep.","Big up, ready to work. Build strength with control.","Respect! Your work is showing."],"Victoria Viper Cross":["I’m Victoria Viper Cross. The bar doesn’t care about excuses.","Morning. Set the tone with good form.","Add that meal if it’s still unlogged.","Did you train? Save the sets you got in.","Numbers on the board, let's go. Make strength repeatable.","Strong work. Make it repeatable."],"Rosa Vega":["I’m Rosa Vega. Bring the fire, leave the ego.","Morning. Start sharp and stay steady.","Meal check. Log what you actually ate.","Workout still open. Give it a new slot.","Let's bring the fire. Precision before ego.","That's how we build strength."],"Jack Mercer":["I’m Jack Mercer. The plan is set. Execute.","Morning. Check today’s plan.","Scheduled meal pending. Update the log.","Session pending. Log completed work or reschedule.","Check in. Confirm the plan. Execute the plan.","Objective achieved."],"Andre Lewis":["I’m Andre Lewis. Prepared, not reckless.","Morning. Prepare for the day ahead.","Meal check. Record it when you can.","Check the schedule. Move the session if needed.","Morning, team. Ready. Prepared, not reckless.","Well done, keep steady."],"Sasha Grant":["I’m Sasha Grant. Discipline under pressure. No detours.","Morning. Start with what’s scheduled.","Any food to log from earlier?","No session logged. Update the plan.","Right, time to organize. Consistency under pressure.","Solid execution."],"Nina Kovac":["I’m Nina Kovac. Adjust the mission, never your safety.","Morning. Take a minute to get organised.","Check whether that meal was logged.","Record the work you did, or pick a new time.","Today's orders: plan and prepare. Preparation first.","Excellent discipline."],"Adrian Ace Cole":["I’m Adrian Ace Cole. Better than yesterday. Game on.","Morning. What’s one thing you can build on?","Meal log’s open. Catch it up if you ate.","Training still on the board? Find your next slot.","Game on. Better than yesterday.","That's measurable progress."],"Jordan Jet Mitchell":["I’m Jordan Jet Mitchell. Your game, your rules, your next level.","Morning. Get into a rhythm today.","Take a second to log that meal if you ate.","No workout logged yet. What’s your next move?","Yo, what's the game plan. Win your own game.","That's a highlight-reel effort."],"Simone Blake":["I’m Simone Blake. Find your pace and own it.","Morning. Let’s find a steady rhythm.","Meal check. Log it when you’re ready.","Workout still open. Make a plan for it.","Ready to move? Let's set the pace. Fast, focused, consistent.","Big up on that progress!"],"Lucia Moretti":["I’m Lucia Moretti. Pace with purpose; finish strong.","Good morning. Pace yourself today.","If you ate, add it to your records.","If you trained, log it. If plans changed, reschedule.","Let's find our rhythm. Pace with purpose.","Excellent pacing."],"Omar Haddad":["I’m Omar Haddad. Recover smarter, train better.","Morning. Check how recovered you feel.","A meal entry is missing. Add it if you ate.","No session recorded. Update the plan if needed.","Let's check readiness. Adapt to recover.","Consistency is showing."],"Daniel Chen":["I’m Daniel Chen. Fuel with evidence, not guesswork.","Good morning. Take a look at your meal plan.","Fill in the meal log when you have a moment.","Log completed training or choose a new time.","Let's check the numbers. Fuel with evidence.","A useful data point."],"Priya Shah":["I’m Priya Shah. Technique before load.","Morning. Start by noticing how you move.","Did you eat earlier? Save what you had.","No sets recorded yet. Did your plan change?","Let's assess today's baseline. Movement quality matters.","That's a meaningful observation."],"Elena Brooks":["I’m Elena Brooks. Understand it. Apply it. Master it.","Morning. Let’s see what today looks like.","Add the meal if the log’s incomplete.","Record what you did or adjust the schedule.","Let's review the evidence. Understand and apply.","The records show progress."],"Carlos Reyes":["I’m Carlos Reyes. Small steps. Real strength.","Morning. One small step will do.","If you ate, jot it down when you can.","Plans change. Want to move the workout?","Let's get a practical plan. Small steps, big change.","Nice work, keep building."],"Theo Martin":["I’m Theo Martin. Keep it practical. Keep showing up.","Morning. Make a little time to move.","Meal check. Can you catch up the log?","If training fell through, choose another day.","Bonjour, ready to get moving. Make movement a habit.","Nicely done."],"Aisha Morgan":["I’m Aisha Morgan. Build confidence one rep at a time.","Good morning. Make today work for you.","A meal is still open. Log it when you can.","Did you get some sets in? Save those first.","Let's make today count. Strength for life.","That's useful strength."],"Natalie James":["I’m Natalie James. Progress that fits your life.","Morning. Start where you are.","No meal recorded yet. Add it if you ate.","It’s okay to move a workout. Choose a time that fits.","Ready for a manageable day. Build confidence.","You've made a solid step."],"Mateo Silva":["I’m Mateo Silva. Bring the energy, celebrate the effort.","Morning! Find something to look forward to.","Quick food check. Log it if you ate!","Missed your session? Give it another spot.","Ready for a good day. Joy in consistency.","Fantastic effort!"],"Tyler Bennett":["I’m Tyler Bennett. Every rep deserves a little applause.","Good morning! Glad you’re here.","Did you have that meal? Let’s catch up the log.","The workout’s open. What time works better?","Hey team, ready. Confidence through movement.","Look at you showing up!"],"Jasmine Jazz Carter":["I’m Jasmine Jazz Carter. Big energy for small wins!","Morning! Showing up is a win.","Little check-in. Any meal to log?","Plans change. Let’s find your next chance to train.","Hey superstar, let's go. Celebrate the effort.","Yes! That effort deserves a cheer."],"Leah Williams":["I’m Leah Williams. Your progress is worth cheering for.","Morning! Find your groove today.","If you ate, take a moment to log it.","If the workout didn’t happen, pick a new time.","Let's get the day moving. Find your groove.","You found your rhythm!"],"Noah Bennett":["I’m Noah Bennett. Find balance in the work.","Morning. Give yourself an easy start.","If you’ve eaten, note it when you’re ready.","A session is still open. Adjust it if you need to.","Let's find a comfortable rhythm. Move with ease.","A lovely step forward."],"Kenji Tanaka":["I’m Kenji Tanaka. Strength begins with control.","Good morning. Begin with a steady breath.","Pause and recall whether you logged your meal.","Plans can change. Move the session if it helps.","A new day to practice. Control before force.","Control and patience are paying off."],"Anika Rao":["I’m Anika Rao. Breathe, move, grow.","Morning. Notice what you need today.","If you ate, add it whenever you have space.","No workout recorded yet. Is another time better?","Let's check in with your body. Balance and awareness.","Notice the progress you've made."],"Maya Rivers":["I’m Maya Rivers. Progress doesn’t have to be loud.","Morning. Let’s ease into the day.","If your meal is missing from the log, add it when you can.","If today got away from you, choose a better time.","Good morning, make space for yourself. Progress with purpose.","Celebrate your steady growth."]}};

// v5.14 recorded voices: Abasi's ElevenLabs recordings, played as files from the site (no server, no credits).
// Recordings live in voice/<Name-With-Dashes>/<clip>.mp3. voices.js lists which coaches have recordings.
const voiceFiles514 = 'voicefiles-myfit-v1';   // not "myfit-" so app updates never delete saved clips
function recorded514() {
  const r = (window.MYFIT_VOICES || {}).recorded || {};
  return {host: r.host || '', coaches: Array.isArray(r.coaches) ? r.coaches : [], version: r.version || 1};
}
const folder514 = name => String(name).trim().replace(/\s+/g, '-');
function clipUrl514(folder, clip) {return `voice/${encodeURIComponent(folder)}/${clip}.mp3?v=${recorded514().version}`}
function coachName514(i, j) {return character58(i, j)[0]}
function coachRecorded514(i, j) {return recorded514().coaches.includes(coachName514(i, j))}

async function clipBlob514(url) {
  let cache = null;
  try {cache = await caches.open(voiceFiles514)} catch (_) {}
  const hit = cache && await cache.match(url);
  if (hit) return hit.blob();
  const r = await fetch(url);
  if (!r.ok) throw Error('missing clip ' + r.status);
  const blob = await r.blob();
  if (cache) {try {await cache.put(url, new Response(blob, {headers: {'Content-Type': 'audio/mpeg'}}))} catch (_) {}}
  return blob;
}

// Play one or more clips in order. Unlocks the player during the tap so phones allow playback.
async function playClips514(urls, ended, onStart) {
  if (window.speechSynthesis) speechSynthesis.cancel(); else stopVoice513();
  const turn = voiceTurn513;
  try {player513.src = silent513; player513.play().catch(() => {});} catch (_) {}
  for (let n = 0; n < urls.length; n++) {
    const blob = await clipBlob514(urls[n]);
    if (turn !== voiceTurn513) return;
    const last = n === urls.length - 1;
    player513.onloadedmetadata = () => {if (onStart) onStart(player513.duration || 0)};
    await playClip513(blob, turn, last ? ended : null);
    if (turn !== voiceTurn513) return;
  }
}

// ---- Maya, the front-desk host ----
const hostLine514 = voiceScripts514.host;
const setupClip514 = {3: 'setup-starting-profile', 2: 'setup-goal-selection', 5: 'setup-equipment-and-movement', 4: 'setup-food-preferences', 0: 'setup-coach-selection', 6: 'setup-review-and-handoff'};
for (const [n, clip] of Object.entries(setupClip514)) orientationInstructions[n] = hostLine514[clip];

// Eight tour stops that match the recordings. The 4th item opens the right part of Planner.
secretaryTabs.splice(0, secretaryTabs.length,
  ['Home', 'Dashboard', hostLine514['tour-dashboard']],
  ['Food', 'Food', hostLine514['tour-food']],
  ['Workout', 'Workout', hostLine514['tour-workout']],
  ['Planner', 'Planner · Meals', hostLine514['tour-planner-meals'], () => {plannerArea = 'Meals'}],
  ['Planner', 'Planner · Workouts', hostLine514['tour-planner-workouts'], () => {plannerArea = 'Workouts'}],
  ['Coach', 'Coach', hostLine514['tour-coach']],
  ['Profile', 'Profile', hostLine514['tour-profile']],
  ['Help', 'Help', hostLine514['tour-help']]);
const showSecretaryTab514 = showSecretaryTab;
showSecretaryTab = function () {
  const stop = secretaryTour && secretaryTabs[secretaryTour.index];
  if (stop && stop[3]) stop[3]();
  showSecretaryTab514();
};

const tourHTML514 = tourHTML597;
tourHTML597 = function () {
  return tourHTML514().replace(/<p>Hi, I’m [^<]*<\/p>/, `<p>${esc(hostLine514.welcome)}</p>`);
};

function hostClips514(text) {
  const host = recorded514().host;
  if (!host) return null;
  const t = String(text);
  for (const [clip, line] of Object.entries(hostLine514)) {
    if (t === line) return [clipUrl514(host, clip)];
    if (clip.startsWith('tour-') && t.endsWith(line)) {
      // The first stop is introduced with the welcome recording.
      return /^Hi, I’m /.test(t) ? [clipUrl514(host, 'welcome'), clipUrl514(host, clip)] : [clipUrl514(host, clip)];
    }
  }
  return null;
}
const speakSecretary514 = speakSecretary;
speakSecretary = function (text, ended) {
  const urls = hostClips514(text);
  if (!urls) return speakSecretary514(text, ended);
  const tour = secretaryTour;
  // Give the tour enough time for each recording before it moves on by itself.
  const onStart = seconds => {if (tour && secretaryTour === tour && ended) {clearTimeout(secretaryTimer); secretaryTimer = setTimeout(ended, (seconds + 4) * 1000);}};
  playClips514(urls, ended, onStart).catch(() => speakSecretary514(text, ended));
  return true;
};

// ---- Coaches with recordings ----
function coachLines514(i, j) {
  const c = voiceScripts514.coaches[coachName514(i, j)], s = voiceScripts514.styles[i];
  if (!c || !s) return null;
  return {introduction: [c[0]], 'morning-greeting': [c[1]], 'meal-check-in': [c[2]], 'workout-check-in': [c[3]],
    opener: [c[4], ...s.opener], mid: s.mid, rest: s.rest, finish: [c[5], ...s.finish]};
}
const lastCue514 = {};
function pickLine514(i, j, kind) {
  const lines = coachLines514(i, j)?.[kind];
  if (!lines) return null;
  if (lines.length === 1) return {clip: kind, text: lines[0]};
  let n = Math.floor(Math.random() * lines.length);
  if (lines.length > 1 && n === lastCue514[kind]) n = (n + 1) % lines.length;
  lastCue514[kind] = n;
  return {clip: `${kind}-${n + 1}`, text: lines[n]};
}

// Plays a coach line: the recording when this coach has one, otherwise nothing (caller decides).
function coachSay514(kind, {caption = true, voice = true} = {}) {
  const i = activeCoach(), j = avatarChoice(coachPrefs(), i);
  if (!coachRecorded514(i, j)) return false;
  const line = pickLine514(i, j, kind);
  if (!line) return false;
  if (caption) voiceNotice59(`${coachName514(i, j)}: ${line.text}`);
  if (voice && coachPrefs().voice) playClips514([clipUrl514(folder514(coachName514(i, j)), line.clip)]).catch(() => {});
  return true;
}

// "Hear this coach" and "Hear selected coach" play the real introduction.
const speak514 = speak582;
speak582 = function (text, i = activeCoach(), j = avatarChoice(coachPrefs(), i)) {
  const c = character58(i, j);
  if (coachRecorded514(i, j) && (text === c[4] || String(text).startsWith(c[4] + '. I am '))) {
    return playClips514([clipUrl514(folder514(c[0]), 'introduction')]).catch(() => speak514(text, i, j));
  }
  return speak514(text, i, j);
};
previewVoice582 = function () {
  const i = previewCoach ?? activeCoach(), j = previewLook ?? avatarChoice(coachPrefs(), i), c = character58(i, j);
  speak582(c[4] + '. I am ' + c[0] + '. ' + c[7], i, j, true);
};

// Live workout: opener, rest after each saved set, mid-workout line when rest ends, finish on the recap.
const entryStart514 = entryStart;
entryStart = function (mode) {entryStart514(mode); if (mode === 'live') coachSay514('opener');};
const entrySave514 = entrySave;
entrySave = function () {
  const before = restUntil;
  entrySave514();
  if (entryMode === 'live' && restUntil > Date.now() && restUntil !== before) coachSay514('rest');
};
let restCued514 = 0;
setInterval(() => {
  if (entryMode === 'live' && restUntil && Date.now() >= restUntil && restCued514 !== restUntil) {
    restCued514 = restUntil;
    coachSay514('mid');
  }
}, 1000);
const finishLive514 = finishLiveWorkout;
finishLiveWorkout = function () {finishLive514(); coachSay514('finish');};

// Morning greeting, meal and workout check-ins (once each per day, for coaches with recordings).
function minutes514(t) {return Number(String(t).slice(0, 2)) * 60 + Number(String(t).slice(3, 5))}
function nowMinutes514() {const d = new Date(); return d.getHours() * 60 + d.getMinutes()}
function checkins514() {const d = today(); S.checkin514 ??= {}; if (S.checkin514.date !== d) S.checkin514 = {date: d, done: {}}; return S.checkin514;}

function dueCheckin514() {
  const i = activeCoach(), j = avatarChoice(coachPrefs(), i);
  if (!coachRecorded514(i, j) || day() !== today()) return null;
  const st = checkins514(), now = nowMinutes514(), r = rhythm(), meals = S.meals[today()] || [];
  for (const slot of [0, 2, 4]) {
    const start = minutes514(r.starts[slot]), end = minutes514(r.starts[slot + 1] || '23:59');
    const key = 'meal' + slot;
    if (st.done[key] || now < end + 60 || now > end + 240) continue;
    const logged = meals.some(m => m.rhythmSlot === slot || (m.time && (() => {const t = new Date(m.time), mm = t.getHours() * 60 + t.getMinutes(); return mm >= start && mm < end + 60;})()));
    if (!logged) return {key, kind: 'meal-check-in'};
  }
  const w = schedule()[(new Date().getDay() + 6) % 7], wt = minutes514(r.commit?.[today()] || r.work);
  if (!st.done.workout && w !== 'rest' && now >= wt + 90 && now <= wt + 360 &&
      !['stop', 'recover'].includes(recoveryAdvice(S.recovery?.[today()]))) {
    const ts = trainingStatus(S, today(), exerciseList(w));
    if (!ts.actual && ts.kind !== 'complete') return {key: 'workout', kind: 'workout-check-in'};
  }
  return null;
}

let openCheckin514 = null;
function runCheckins514() {
  if (openCheckin514 || entryMode === 'live' || secretaryTour) return;
  const due = dueCheckin514();
  if (!due) return;
  checkins514().done[due.key] = true;
  if (!save()) return;
  openCheckin514 = due;
  if (['Home', 'Food', 'Workout'].includes(tab)) render();
  coachSay514(due.kind, {caption: false});
}
function closeCheckin514(go) {
  const c = openCheckin514;
  openCheckin514 = null;
  if (go === 'meal') {openMainTab('Food'); return;}
  if (go === 'workout') {openMainTab('Workout'); return;}
  if (go === 'reschedule') {tab = 'Home'; render(); const d = [...document.querySelectorAll('#app details')].find(x => /training time/i.test(x.textContent)); if (d) {d.open = true; d.scrollIntoView({block: 'center'});} return;}
  render();
}
function checkinCard514() {
  const c = openCheckin514;
  if (!c) return '';
  const i = activeCoach(), j = avatarChoice(coachPrefs(), i), text = coachLines514(i, j)?.[c.kind]?.[0] || '';
  const buttons = c.kind === 'meal-check-in'
    ? `<button onclick="closeCheckin514('meal')">Log meal</button>`
    : `<button onclick="closeCheckin514('workout')">Log workout</button><button class="alt" onclick="closeCheckin514('reschedule')">Reschedule</button>`;
  return `<section class="checkin514" role="status"><b>${esc(coachName514(i, j))}</b><p>${esc(text)}</p>
    <div class="grid">${buttons}<button class="alt" onclick="closeCheckin514()">Dismiss</button></div></section>`;
}

const render514 = render;
render = function () {
  render514();
  if (openCheckin514 && ['Home', 'Food', 'Workout'].includes(tab) && entryMode !== 'live') {
    const app = $('app');
    if (app && !app.querySelector('.checkin514')) app.insertAdjacentHTML('afterbegin', checkinCard514());
  }
  // Morning greeting: first Dashboard visit before noon, once per day, with coach voice on.
  if (tab === 'Home' && !secretaryTour && entryMode !== 'live' && day() === today() && new Date().getHours() < 12 && coachPrefs().voice && (setup596().completed || setup596().skipped)) {
    const st = checkins514();
    if (!st.done.morning) {
      const i = activeCoach(), j = avatarChoice(coachPrefs(), i);
      if (coachRecorded514(i, j)) {st.done.morning = true; if (save()) coachSay514('morning-greeting');}
    }
  }
};
setInterval(runCheckins514, 60000);
setTimeout(runCheckins514, 3000);

// Save Maya's and this coach's recordings for offline use (once, ideally on Wi-Fi).
function recordedFiles514() {
  const r = recorded514(), urls = [];
  if (r.host) for (const clip of Object.keys(hostLine514)) urls.push(clipUrl514(r.host, clip));
  const i = activeCoach(), j = avatarChoice(coachPrefs(), i);
  if (coachRecorded514(i, j)) {
    const f = folder514(coachName514(i, j));
    for (const clip of ['introduction', 'morning-greeting', 'meal-check-in', 'workout-check-in',
      'opener-1', 'opener-2', 'opener-3', 'mid-1', 'mid-2', 'mid-3', 'mid-4', 'rest-1', 'rest-2', 'rest-3',
      'finish-1', 'finish-2', 'finish-3', 'finish-4']) urls.push(clipUrl514(f, clip));
  }
  return urls;
}
async function saveRecorded514(btn) {
  if (!navigator.onLine) return voiceNotice59('Connect to Wi-Fi first.');
  const urls = recordedFiles514();
  let ok = 0;
  for (const u of urls) {
    if (btn) btn.textContent = `Saving recordings… ${ok + 1} of ${urls.length}`;
    try {await clipBlob514(u); ok++;} catch (_) {}
  }
  voiceNotice59(`${ok} of ${urls.length} recordings saved for offline use.`);
  refreshStudio583();
}
function recordedPanel514() {
  const r = recorded514();
  if (!r.host && !r.coaches.length) return '';
  const i = activeCoach(), j = avatarChoice(coachPrefs(), i);
  return `<section><h3>Recorded voices</h3>
    <p class="muted">Recorded voices: ${[r.host ? 'Maya (front desk)' : '', ...r.coaches.map(esc)].filter(Boolean).join(', ')}. Your coach ${esc(coachName514(i, j))} ${coachRecorded514(i, j) ? 'uses a recorded voice for greetings, check-ins and workout cues.' : 'uses the phone voice.'}${coachPrefs().voice ? '' : ' Turn on coach voice to hear greetings and workout cues.'}</p>
    <button class="alt wide" onclick="saveRecorded514(this)">Save Maya and your coach for offline (about 1.5 MB, use Wi-Fi)</button>
  </section>`;
}
const studioInner514 = studioInner583;
studioInner583 = function () {return recordedPanel514() + studioInner514()};

// v5.15 a smaller roster: 10 coaches, so each can be fully voiced.
// For each style, which of its four coaches stay (0-3, in roster order). To bring a coach back,
// add its number here, or set roster in voices.js, e.g. roster: [[0,3],[1],[0,2],[2],[0],[2],[3,1]].
const keptLooks515 = Array.isArray((window.MYFIT_VOICES || {}).roster) ? window.MYFIT_VOICES.roster : [
  [0, 3],   // The Beast: Marcus Steele, Rosa Vega
  [1],      // The Drill Sergeant: Andre Lewis
  [0, 2],   // The Athlete: Adrian Ace Cole, Simone Blake
  [2],      // The Scientist: Priya Shah
  [0],      // The Personal Trainer: Carlos Reyes
  [2],      // The Cheerleader: Jasmine Jazz Carter
  [3, 1]    // The Zen Coach: Maya Rivers, Kenji Tanaka
];
function keptList515(i) {
  const a = [].concat(keptLooks515[i] ?? [0]).filter(n => Number.isInteger(n) && n >= 0 && n < 4);
  return a.length ? a : [0];
}
function keptLook515(i, wanted) {const a = keptList515(i); return a.includes(wanted) ? wanted : a[0]}

// A profile that chose a removed coach gets the first kept coach of the same style.
// Saved choices stay in the profile untouched, so nothing is lost if a coach comes back.
const avatarChoice515 = avatarChoice;
avatarChoice = function (p, i) {return keptLook515(i, avatarChoice515(p, i))};

const setupField515 = setupField596;
setupField596 = function (k, v) {
  if (k === 'coach' && Number.isFinite(+v)) {const s = Math.floor(+v / 4); v = s * 4 + keptLook515(s, +v % 4);}
  return setupField515(k, v);
};
{const d = setup596().draft; if (d && Number.isFinite(+d.coach)) {const s = Math.floor(+d.coach / 4); d.coach = s * 4 + keptLook515(s, +d.coach % 4);}}

function hideRemovedCoaches515(html, pattern, toStyleLook) {
  const t = document.createElement('template');
  t.innerHTML = html;
  for (const b of t.content.querySelectorAll('button[onclick]')) {
    const m = b.getAttribute('onclick').match(pattern);
    if (!m || b.closest('.roster')) continue;
    const [style, look] = toStyleLook(m);
    if (!keptList515(style).includes(look)) b.remove();
  }
  return t;
}

// Customize coach: only the kept coaches; the picker disappears when a style has just one.
const avatarPanel515 = avatarPanel;
avatarPanel = function () {
  const i = previewCoach ?? activeCoach(), many = keptList515(i).length > 1;
  const t = hideRemovedCoaches515(avatarPanel515(), /^previewSelection\((\d+),(\d+)\)/, m => [+m[1], +m[2]]);
  for (const h of t.content.querySelectorAll('h3')) {
    if (!/^Meet the four coaches$|^Choose appearance$/.test(h.textContent.trim())) continue;
    if (many) {h.textContent = 'Meet the coaches'; continue;}
    let n = h.nextElementSibling;
    if (n && n.tagName === 'SMALL' && /Your choice of face/.test(n.textContent)) {const s = n; n = n.nextElementSibling; s.remove();}
    if (n?.classList.contains('looks')) n.remove();
    h.remove();
  }
  return t.innerHTML;
};

// Setup: show only the kept coaches for the chosen style.
const roster515 = roster597;
roster597 = function (d) {
  return hideRemovedCoaches515(roster515(d), /^setupField596\('coach',(\d+)\)/, m => [Math.floor(+m[1] / 4), +m[1] % 4]).innerHTML;
};

// The first screen was drawn before these updates loaded; draw it again with them.
render();
