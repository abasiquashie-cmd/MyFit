
const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const today=()=>dateKey(new Date());
const profileDirectoryKey = 'myfit-profile-directory-v1';
const originalProfileId = 'original';
let activeProfileId = originalProfileId;
let profileDirectoryInvalid = false;

function defaultProfileDirectory() {
  return {active:originalProfileId,profiles:[{id:originalProfileId,label:'Profile 1'}]};
}

function readProfileDirectory() {
  const raw = localStorage.getItem(profileDirectoryKey);
  if (!raw) return defaultProfileDirectory();
  const directory = JSON.parse(raw);
  if (!directory || !Array.isArray(directory.profiles) ||
      !directory.profiles.every(record=>record&&typeof record.id==='string'&&/^[a-z0-9-]+$/.test(record.id)&&typeof record.label==='string') ||
      new Set(directory.profiles.map(record=>record.id)).size!==directory.profiles.length ||
      !directory.profiles.some(record=>record.id===directory.active)) throw Error('Invalid profile directory');
  return directory;
}

function profileStorageKey(key,id=activeProfileId) {
  return id===originalProfileId ? key : key+':'+id;
}

function freshUserState() {
  return {profile:{age:44,height:178,weight:180,sex:'male',activity:1.5,goal:'recomp',days:5,
    legs:true,priorities:['legs','chest']},meals:{},work:{},measure:[],favorites:[]};
}

let S = freshUserState();
let storageBlocked = false;
try {
  activeProfileId = readProfileDirectory().active;
} catch (_) {
  profileDirectoryInvalid = true;
}
try {
  if (profileDirectoryInvalid) throw Error('Invalid profile directory');
  const saved = localStorage.getItem(profileStorageKey('myfit-v1'));
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!validState(parsed)) throw Error('Invalid saved data');
    S = parsed;
  }
} catch (_) {
  storageBlocked = true;
  alert('Saved profile data could not be read. Saving is disabled to protect it.');
}

function save() {
  if (storageBlocked) return false;
  try {
    localStorage.setItem(profileStorageKey('myfit-v1'),JSON.stringify(S));
    return true;
  } catch (_) {
    alert('Storage unavailable. Export your data before closing.');
    return false;
  }
}

function readProfilePreference(key) {
  try {return localStorage.getItem(profileStorageKey(key))} catch (_) {return null}
}

function writeProfilePreference(key,value) {
  try {localStorage.setItem(profileStorageKey(key),value)} catch (_) {}
}

function profileDisplayName(record) {
  if (record.id===activeProfileId) return S.profile.name||record.label;
  try {
    const raw = localStorage.getItem(profileStorageKey('myfit-v1',record.id));
    return JSON.parse(raw)?.profile?.name || record.label;
  } catch (_) {return record.label}
}

function openProfileInBrowser(id,create=false) {
  if (profileDirectoryInvalid) return alert('The saved profile list could not be read.');
  try {
    const directory = readProfileDirectory();
    if (create) {
      id = globalThis.crypto.randomUUID?.() || 'profile-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      directory.profiles.push({id,label:'Profile '+(directory.profiles.length+1)});
    }
    if (!directory.profiles.some(record=>record.id===id)) return;
    localStorage.setItem(profileDirectoryKey,JSON.stringify({...directory,active:id}));
  } catch (_) {
    alert('Could not change profiles. Check browser storage and try again.');
    return;
  }
  location.reload();
}

function userProfilesPanel() {
  let directory;
  try {directory=readProfileDirectory()} catch (_) {return '<section><h2>Profiles</h2><p>The saved profile list could not be read.</p></section>'}
  return `<section><h2>Profiles</h2><p>Each profile has separate records in this browser. Anyone using this browser can switch profiles.</p>
    ${directory.profiles.map(record=>`<div class="line"><b>${esc(profileDisplayName(record))}</b>
      ${record.id===activeProfileId?'<small>Current</small>':`<button class="alt" data-profile-id="${esc(record.id)}" onclick="openProfileInBrowser(this.dataset.profileId)">Switch</button>`}</div>`).join('')}
    <button class="wide" onclick="openProfileInBrowser(null,true)">Create new profile</button>
  </section>`;
}

function requestSkipOrientation() {
  if (secretaryTour?.enrollment) {
    secretaryTour=null;
    cancelSecretaryAudio();
    tab='Home';
  }
  const setup = setup596();
  if (setup.completed) return;
  setup.showSkipSafety = true;
  render();
}

function skipOrientation() {
  cancelSecretaryAudio();
  const setup = setup596();
  const before = {...setup};
  Object.assign(setup,{paused:true,skipped:true,showSkipSafety:false});
  if (!save()) {Object.assign(setup,before);return;}
  tab='Home';
  render();
}

function skipOrientationPanel() {
  return `<section><h2>Before you skip</h2>
    <p>Set up your profile, equipment and movement limits before relying on workout recommendations. If you’re new to an exercise, start light, watch the form demo, and ask a qualified trainer to check your technique. If an exercise causes pain, stop.</p>
    <button class="wide" onclick="skipOrientation()">I understand · skip orientation</button>
    <button class="alt" onclick="setup596().showSkipSafety=false;render()">Back to orientation</button>
  </section>`;
}

S.favorites??=[]; S.profile.priorities??=['legs','chest']; let tab='Home',draft=[]; let timerId; $('date').value=today();$('date').onchange=()=>{if(!$('date').value)$('date').value=today();calendarOffset=0;rotation=0;render()};let plannerDate = '';
const day = () => tab === 'Planner' ? plannerDate || today() : ['Home','Coach'].includes(tab) ? today() : $('date').value;
function openMainTab(next) {
  if (next === 'Food' || next === 'Workout') $('date').value = today();
  tab = next;
  render();
  window.scrollTo(0,0);
}const goals={recomp:'Body recomposition',bulk:'Muscle gain',cut:'Fat loss',maintain:'Maintenance',mobility:'Mobility & fitness'};function targets(){let p=S.profile,w=p.weight/2.20462,b=10*w+6.25*p.height-5*p.age+(p.sex==='male'?5:-161),m=b*p.activity,k=Math.max(1500,Math.round((m+({recomp:-100,bulk:250,cut:-350,maintain:0,mobility:0}[p.goal]))/50)*50),pr=Math.min(Math.round(w*(p.goal==='cut'?2.1:1.9)),Math.floor(k*.35/4)),f=Math.round(k*.27/9);return [k,pr,Math.max(0,Math.round((k-pr*4-f*9)/4)),f]}
const foods=[['chicken thighs skin on',232,23.3,0,14.7,100,130,'chicken thighs|chicken thigh'],['chicken thighs skinless',179,25,0,8,100,130,'skinless chicken thigh'],['chicken breast',165,31,0,3.6,100,150,'chicken breast|chicken'],['white rice',130,2.7,28.2,.3,158,158,'white rice|rice'],['broccoli',35,2.4,7.2,.4,156,156,'broccoli'],['salmon',208,22,0,13,100,150,'salmon'],['egg',143,12.6,.7,9.5,50,50,'eggs|egg'],['oats dry',389,16.9,66,6.9,80,40,'dry oats|oats'],['banana',89,1.1,23,.3,118,118,'banana'],['greek yogurt',73,10,4,2,245,170,'greek yogurt|yogurt'],['olive oil',884,0,0,100,216,14,'olive oil|oil'],['peanut butter',588,25,20,50,258,16,'peanut butter'],['lean ground beef',217,26,0,12,100,150,'ground beef|beef'],['turkey',170,29,0,6,100,150,'turkey'],['sweet potato',90,2,21,.2,200,150,'sweet potato'],['potato',87,2,20,.1,150,150,'potatoes|potato'],['bread',265,9,49,3.2,100,30,'toast|bread'],['apple',52,.3,14,.2,125,182,'apple'],['protein powder',400,80,8,5,120,30,'protein shake|whey|protein powder'],['pasta',158,5.8,31,.9,140,140,'pasta'],['shrimp',99,24,0,.3,145,150,'shrimp'],['black beans',132,9,24,.5,172,172,'beans'],['almonds',579,21,22,50,143,28,'almonds'],['avocado',160,2,9,15,150,150,'avocado'],['tuna',116,26,0,1,154,120,'tuna'],['milk',50,3.4,5,2,244,244,'milk']];
foods.push(['chicken wings',254,24,0,17,100,35,'chicken wings|chicken wing'],['brown rice',123,2.7,25.6,1,195,195,'brown rice'],['plantain',122,1.3,32,.4,150,180,'plantains|plantain'],['chickpeas',164,8.9,27.4,2.6,164,164,'chickpeas|chana'],['cottage cheese',98,11,3.4,4.3,226,113,'cottage cheese'],['orange',47,.9,12,.1,180,130,'oranges|orange'],['blueberries',57,.7,14.5,.3,148,148,'blueberries|berries'],['spinach',23,2.9,3.6,.4,180,30,'spinach'],['pork chop',231,25,0,14,100,150,'pork chops|pork chop'],['steak',250,26,0,15,100,150,'steak'],['tortilla',312,8,52,8,100,45,'tortilla|wrap'],['cheddar cheese',403,25,1.3,33,113,28,'cheddar|cheese'],['green beans',35,1.9,7.9,.3,125,125,'green beans'],['carrots',35,.8,8,.2,156,78,'carrots|carrot'],['butter',717,.9,.1,81,227,14,'butter'],['lentils',116,9,20,.4,198,198,'lentils'],['tofu',144,17,3,9,248,150,'tofu'],['coffee black',2,.1,0,0,237,237,'coffee'],['orange juice',45,.7,10,.2,248,248,'orange juice']);

foods.push(...[
['pizza, cheese',285,12,36,10,120,'cheese pizza|pizza'],['pizza, pepperoni',310,13,34,14,120,'pepperoni pizza|pizza pepperoni'],['pizza, meat lovers',350,17,34,17,120,'meat lovers pizza'],['pizza, vegetarian',270,11,35,10,120,'vegetarian pizza|veggie pizza'],['pizza, Hawaiian',290,13,36,11,120,'hawaiian pizza'],['poutine',250,8,29,12,350,'poutine'],['french fries',312,3.4,41,15,120,'french fries|fries'],['cheeseburger',280,15,27,13,180,'cheeseburger|burger'],['jerk chicken',210,25,3,11,150,'jerk chicken'],['rice and peas',165,4,29,4,180,'rice and peas|rice and beans'],['roti with chicken',210,11,27,7,350,'chicken roti'],['beef patty',300,10,30,16,120,'jamaican patty|beef patty'],['oxtail stew',230,23,4,14,180,'oxtail'],['bacon',541,37,1.4,42,8,'bacon'],['fried egg',196,14,1,15,50,'fried eggs|fried egg'],['cola',42,0,10.6,0,355,'coca cola|coke|cola'],['double double coffee',60,1,7,3,300,'double double|double-double'],['bagel',260,10,50,2,100,'bagel'],['donut',420,5,48,23,70,'donut|doughnut'],['shawarma wrap',220,13,24,8,300,'shawarma'],['samosa',260,6,30,13,100,'samosa'],['butter chicken',180,13,6,12,200,'butter chicken'],['sushi roll',150,5,27,3,35,'sushi'],['lasagna',150,9,15,6,250,'lasagna'],['macaroni and cheese',190,7,23,8,220,'macaroni and cheese|mac and cheese'],['pancake',227,6,28,10,75,'pancakes|pancake'],['maple syrup',260,0,67,0,20,'maple syrup'],['fried plantain',250,1,40,9,80,'fried plantains|fried plantain']
].map(([n,k,p,c,f,g,a])=>[n,k,p,c,f,g,g,a]));
// Pizza values above expressed per typical slice; convert to per 100g.
for(const f of foods.filter(x=>x[0].startsWith('pizza,')))for(let i=1;i<=4;i++)f[i]*=100/f[6];
foods.push(['cooked spaghetti',158,5.8,30.9,.9,140,140,'spaghetti|noodles'],['tomato pasta sauce',50,1.5,9,1,245,125,'pasta sauce|tomato sauce|marinara'],['salsa',36,1.5,7,.2,250,30,'salsa'],['bell pepper',31,1,6,.3,149,120,'bell peppers|bell pepper'],['onion',40,1.1,9,.1,160,100,'onion'],['corn',96,3.4,21,1.5,164,100,'corn'],['lime juice',25,.4,8,.1,240,15,'lime juice'],['cucumber',15,.7,3.6,.1,104,100,'cucumber'],['tomato',18,.9,3.9,.2,180,120,'tomatoes|tomato'],['lettuce',15,1.4,2.9,.2,50,50,'lettuce'],['quinoa',120,4.4,21.3,1.9,185,185,'quinoa'],['black beans',132,8.9,23.7,.5,172,100,'black beans'],['chicken taco',200,13,20,8,120,120,'chicken tacos|chicken taco|tacos|taco'],['burrito',205,10,25,7,250,250,'burritos|burrito'],['spaghetti with meat sauce',145,8,19,4,250,250,'spaghetti with meat sauce|spaghetti bolognese'],['mushrooms',22,3.1,3.3,.3,70,70,'mushrooms|mushroom']);
let cnfCatalog; async function cnf(endpoint,id){let u='https://food-nutrition.canada.ca/api/canadian-nutrient-file/'+endpoint+'/?lang=en&type=json'+(id?'&id='+encodeURIComponent(id):'');let r=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Lookup unavailable');let a=await r.json();return Array.isArray(a)?a:[a]}
async function canadaSearch(){let q=$('lookup').value.trim();if(!q)return;let out=$('lookupResults');out.textContent='Searching Health Canada…';try{cnfCatalog??=await cnf('food');let words=q.toLowerCase().split(/\s+/);let matches=cnfCatalog.filter(x=>words.every(w=>String(x.food_description).toLowerCase().includes(w))).slice(0,20);out.innerHTML=matches.map(x=>`<button class="alt wide" onclick="addCNF(${Number(x.food_code)})">${esc(x.food_description)}</button>`).join('')||'No matching food. Try fewer words.'}catch(e){out.textContent='Canadian database unavailable in this browser. Use offline estimates or enter label values.'}}
async function cnfMacros(id){let a=await cnf('nutrientamount',id);let get=(ids,re)=>{let x=a.find(x=>ids.includes(Number(x.nutrient_id??x.nutrient_code??x.nutrient_number)))||a.find(x=>re.test(String(x.nutrient_web_name??x.nutrient_name??'')));let v=x?.nutrient_value;return v==null||v===''?NaN:Number(v)};let k=get([208],/energy.*kcal|calories/i),p=get([203],/^protein/i),c=get([205],/^carbohydrate/i),f=get([204],/^fat|^total lipid/i);if(![k,p,c,f].every(Number.isFinite))throw Error('Incomplete macros');return {k,p,c,f}} 
async function addCNF(id){let out=$('lookupResults'),name=cnfCatalog.find(x=>x.food_code==id)?.food_description||'Canadian food';try{let v=await cnfMacros(id);draft.push({name,g:100,...v,source:'Health Canada CNF'});drawDraft();out.textContent='Added 100 g. Adjust weight.'}catch(e){let f=findLocal(name.toLowerCase());if(f){draft.push({name:f[0],g:100,k:f[1],p:f[2],c:f[3],f:f[4],source:'Generic fallback estimate'});drawDraft();out.textContent='Canadian values unavailable; generic estimate added for review.'}else out.textContent='Canadian values unavailable. Try a simpler food name or enter label values.'}}
function findLocal(s){return foods.filter(f=>f[7].split('|').some(a=>new RegExp('\\b'+a+'\\b').test(s))).sort((a,b)=>Math.max(...b[7].split('|').filter(x=>s.includes(x)).map(x=>x.length))-Math.max(...a[7].split('|').filter(x=>s.includes(x)).map(x=>x.length)))[0]}
let barcodeRun=0, barcodeStream=null, barcodeReader=null;
function stopBarcode(){barcodeRun++;if(barcodeReader){try{barcodeReader.stop()}catch(e){}barcodeReader=null}if(barcodeStream){barcodeStream.getTracks().forEach(t=>t.stop());barcodeStream=null}let v=$('barcodeVideo');if(v){v.srcObject=null;v.hidden=true}if($('barcodeStop'))$('barcodeStop').hidden=true}
function resetBarcodeLookup() {
  stopBarcode();
  $('lookupResults').textContent = '';
}
function barcodeCache(){try{return JSON.parse(readProfilePreference('myfit-barcode-cache')||'{}')||{}}catch(e){return {}}}
function barcodeResult(x,out,code){out.innerHTML=`<p><b>${esc(x.name)}</b><br><small>${esc(x.source)} · ${esc(code)}</small></p><label>Amount (${esc(x.unit)})<input id="barcodeAmount" type="number" min="0.1" step="any" value="${x.serving||100}"></label><p id="barcodePreview"></p><button class="wide" id="barcodeAdd">Add to meal draft</button><small>Compare with the package label before saving.</small>`;let amount=$('barcodeAmount'),preview=$('barcodePreview');let update=()=>{let g=Number(amount.value);preview.textContent=g>0?`${Math.round(x.k*g/100)} kcal · ${(x.p*g/100).toFixed(1)} g protein · ${(x.c*g/100).toFixed(1)} g carbs · ${(x.f*g/100).toFixed(1)} g fat`: 'Enter a positive amount.'};amount.oninput=update;update();$('barcodeAdd').onclick=()=>{let g=Number(amount.value);if(!Number.isFinite(g)||g<=0)return;draft.push({...x,g,barcode:code});drawDraft();out.textContent='Added to meal draft. Review and save below.'}}
function legacyBarcodeManual(){let out=$('lookupResults');if(!out)return;out.innerHTML=`<p>Enter values from the package for one serving.</p><label>Product name<input id="bcName"></label><label>Serving weight (g or mL)<input id="bcWeight" type="number" min="0.1" step="any"></label><label>Unit<select id="bcUnit"><option>g</option><option>mL</option></select></label>${[['k','Calories'],['p','Protein (g)'],['c','Carbs (g)'],['f','Fat (g)']].map(([k,n])=>`<label>${n}<input id="bc_${k}" type="number" min="0" step="any"></label>`).join('')}<button class="wide" id="bcSave">Review label values</button>`;$('bcSave').onclick=()=>{let name=$('bcName').value.trim(),g=Number($('bcWeight').value),unit=$('bcUnit').value,vals=['k','p','c','f'].map(k=>$('bc_'+k).value);if(!name||!Number.isFinite(g)||g<=0||vals.some(v=>v===''||!Number.isFinite(+v)||+v<0))return alert('Complete all label fields, including zero values.');let [k,p,c,f]=vals.map(v=>+v*100/g),code=$('lookup').value.trim(),x={name,k,p,c,f,unit,serving:g,source:'Package label · manual'};if(/^\d{8,14}$/.test(code))cacheBarcode(code,x);barcodeResult(x,out,code)}}
function cacheBarcode(code,x){try{let c=barcodeCache();c[code]=x;let keys=Object.keys(c);while(keys.length>300)delete c[keys.shift()];writeProfilePreference('myfit-barcode-cache',JSON.stringify(c))}catch(e){}}
async function barcodeLookup(){stopBarcode();let run=barcodeRun,code=$('lookup').value.trim(),out=$('lookupResults');if(!/^\d{8,14}$/.test(code)){out.textContent='Enter 8–14 barcode digits.';return}let cached=barcodeCache()[code];if(cached){barcodeResult({...cached,source:cached.source+' · cached'},out,code);return}if(!navigator.onLine){out.textContent='Offline. This product is not cached. Enter package label values below.';return}out.textContent='Looking up barcode…';let codes=[...new Set([code,code.length===12?'0'+code:code.length===13&&code.startsWith('0')?code.slice(1):code])],failed=false,incomplete=false,errors=[];for(let candidateCode of codes){for(let base of ['https://world.openfoodfacts.org/api/v2/product/','https://world.openfoodfacts.org/api/v0/product/']){if(run!==barcodeRun||!out.isConnected)return;try{let controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000),r;try{r=await fetch(base+candidateCode+'.json',{signal:controller.signal,credentials:'omit',cache:'no-store'});let jtext=await r.text();r={status:r.status,ok:r.ok,json:async()=>JSON.parse(jtext)}}finally{clearTimeout(timeout)};if(r.status===404)continue;if(!r.ok)throw Error('HTTP '+r.status);let j=await r.json(),x=j.product,n=x?.nutriments;if(Number(j.status)!==1)continue;let vals=['energy-kcal_100g','proteins_100g','carbohydrates_100g','fat_100g'].map(k=>n?.[k]);if(vals[0]==null&&n?.energy_100g!=null)vals[0]=Number(n.energy_100g)/4.184;if(!vals.every(v=>v!=null&&v!==''&&Number.isFinite(+v)&&+v>=0)){incomplete=true;if(run===barcodeRun&&out.isConnected){labelForm(x,vals);return}continue}let unit=x.serving_quantity_unit==='ml'?'mL':'g',serving=Number(x.serving_quantity);if(!Number.isFinite(serving)||serving<=0||!['g','ml'].includes(x.serving_quantity_unit))serving=100;let [k,p,c,f]=vals.map(Number),item={name:[x.brands,x.product_name_en||x.product_name||code].filter(Boolean).join(' · '),k,p,c,f,unit,serving,source:'Open Food Facts · '+(x.countries_tags?.includes('en:canada')?'Canada listed':'market not confirmed')};if(run!==barcodeRun||!out.isConnected)return;cacheBarcode(code,item);barcodeResult(item,out,code);return}catch(e){failed=true;errors.push(String(e.message||e).slice(0,120))}}}if(run===barcodeRun&&out.isConnected)out.textContent=incomplete?'Product found, but nutrition is incomplete. Enter package label values.':failed?'Lookup failed: '+[...new Set(errors)].join('; ')+'. Open the database directly or enter label values.':'Product not found in Open Food Facts. Enter package label values.'}
function openBarcodeDirect(){let code=$('lookup')?.value.trim();if(/^\d{8,14}$/.test(code))window.open('https://world.openfoodfacts.org/api/v2/product/'+code+'.json','_blank','noopener');else alert('Enter barcode digits first.')}
async function startBarcode(){stopBarcode();let run=barcodeRun,v=$('barcodeVideo'),out=$('lookupResults');if(!v)return;let alive=()=>run===barcodeRun&&v.isConnected;let found=code=>{if(!alive())return;$('lookup').value=String(code);barcodeLookup()};try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera requires HTTPS and browser permission.');out.textContent='Opening camera…';v.hidden=false;$('barcodeStop').hidden=false;if('BarcodeDetector' in window){let formats=await BarcodeDetector.getSupportedFormats();let supported=['ean_13','ean_8','upc_a','upc_e','itf'].filter(x=>formats.includes(x));if(supported.length){let detector=new BarcodeDetector({formats:supported});let stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});if(!alive()){stream.getTracks().forEach(t=>t.stop());return}barcodeStream=stream;v.srcObject=stream;await v.play();out.textContent='Aim at the barcode in good light.';while(alive()){let hits=await detector.detect(v);if(hits.length){found(hits[0].rawValue);return}await new Promise(r=>setTimeout(r,150))}return}}out.textContent='Loading compatible barcode scanner…';let z=await import('https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm');if(!alive())return;let reader=new z.BrowserMultiFormatReader();let controls=await reader.decodeFromConstraints({video:{facingMode:{ideal:'environment'}},audio:false},v,(result,error,ctrl)=>{if(result&&alive()){ctrl.stop();found(result.getText())}});if(!alive()){controls.stop();return}barcodeReader=controls;out.textContent='Aim at the barcode in good light.'}catch(e){if(alive()){stopBarcode();out.textContent='Camera scanner unavailable: '+String(e.message||e)+'. Enter digits manually.'}}}


const rawNutrition={'white rice':[365,7.1,80,.7],'brown rice':[370,7.9,77,2.9],'pasta':[371,13,75,1.5],'cooked spaghetti':[371,13,75,1.5],'chicken breast':[120,22.5,0,2.6],'lentils':[352,24.6,63,1.1],'quinoa':[368,14,64,6]};
// Prepared-food profiles: approximate edible cooked weight, inclusive of typical cooking fat.
const preparedProfiles=[
['breaded fried chicken thighs',280,23,10,17,110,100,'fried chicken thighs|fried chicken thigh|deep fried chicken thighs|crispy chicken thighs'],
['unbreaded fried chicken thighs',250,24,0,17,110,100,'unbreaded fried chicken thighs|pan fried chicken thighs|pan fried chicken thigh'],
['fried chicken breast',260,26,10,13,140,140,'fried chicken breast|breaded chicken breast'],
['fried rice',190,5,28,6,165,165,'fried rice|egg fried rice|vegetable fried rice'],
['chicken fried rice',195,10,25,6,180,180,'chicken fried rice'],
['fried eggs',196,13.6,1,15,50,50,'fried eggs|fried egg'],
['fried plantain',250,1.5,40,9,150,150,'fried plantains|fried plantain'],
['french fries',312,3.4,41,15,120,120,'french fries|fries'],
['curry chicken',190,19,5,10,180,180,'curry chicken|chicken curry'],
['macaroni pie',210,9,23,9,180,180,'macaroni pie'],
['butter chicken',200,15,6,13,180,180,'butter chicken'],
['jerk chicken',210,25,3,11,150,150,'jerk chicken']];
preparedProfiles.push(
['fried fish',210,23,0,13,140,200,'fried fish|whole fried fish|fried red snapper|fried snapper|fried tilapia|pan fried fish'],
['breaded fried fish',250,18,17,12,140,150,'breaded fried fish|battered fish|fish and chips fish'],
['cooked fish',130,25,0,3,140,150,'fish|snapper|red snapper|white fish|whole fish'],
['sautéed greens',87,3,5,6,150,150,'sauteed spinach|sautéed spinach|cooked spinach|callaloo|cooked greens|sauteed greens|spinach with tomatoes'],
['spinach',23,3,4,0.4,30,100,'spinach|leafy greens'],
['fried shrimp',240,20,15,11,140,140,'fried shrimp|fried prawns'],
['fried pork chop',260,25,5,16,140,140,'fried pork chop|fried pork chops'],
['fried tofu',200,15,5,14,150,150,'fried tofu']);
foods.push(...preparedProfiles);
foods.push(...[
['grilled chicken breast',165,31,0,3.6,150,150,'grilled chicken breast|grilled chicken'],
['grilled fish',130,25,0,3,150,150,'grilled fish|steamed fish|baked fish'],
['green salad',35,2,6,1,100,100,'green salad|garden salad'],
['chicken soup',65,5,6,2,250,250,'chicken soup'],
['cooked oatmeal',71,2.5,12,1.5,234,234,'cooked oatmeal|porridge|oatmeal'],
['chicken biryani',180,10,24,5,250,250,'chicken biryani|biryani'],
['jollof rice',175,3,29,5,180,180,'jollof rice'],
['ackee and saltfish',190,9,5,15,180,180,'ackee and saltfish'],
['chana masala',145,6,19,5,200,200,'chana masala'],
['beef stew',145,12,8,7,250,250,'beef stew'],
['hummus',166,8,14,10,60,60,'hummus'],
['falafel',333,13,32,18,100,100,'falafel'],
['cooked cabbage',45,1.5,6,2,150,150,'cooked cabbage|sauteed cabbage']]);

// Photo assistant: only offer labels backed by a local nutrition profile.
let visionJob, photoRun=0, photoQueue=Promise.resolve(), photoBusy=false;
const photoCache=new Map();
function photoPreview(el){let f=el.files?.[0];if(!f)return;if(photoBusy)cancelPhoto();let img=$('mealPhoto');if(img.dataset.url)URL.revokeObjectURL(img.dataset.url);img.dataset.url=URL.createObjectURL(f);img.src=img.dataset.url;img.hidden=false;identifyPhoto()}
function photoGroup(n){if(/fish|snapper|tilapia|salmon|tuna/.test(n))return 'fish';if(/chicken/.test(n)&&!/rice|roti|taco|soup|wrap/.test(n))return 'chicken';if(/rice/.test(n))return 'rice';if(/spinach|greens|callaloo/.test(n))return 'greens';if(/egg/.test(n)&&!/rice/.test(n))return 'eggs';if(/potato|fries/.test(n))return 'potatoes';if(/pizza/.test(n))return 'pizza';return n}
function photoLabels(){let names=foods.map(f=>f[0].replace(/,/g,''));return [...new Set(['whole fried fish','grilled fish','cooked spinach','fried chicken thighs','grilled chicken breast',...names,...foods.flatMap(f=>f[7].split('|').filter(x=>x.length>4))])].filter(n=>findLocal(n)&&!/oil|butter$|raw|dry|powder|sauce$|juice$/.test(n)).slice(0,240)}

function cancelPhoto(){photoRun++;photoBusy=false;let s=$('photoStatus');if(s)s.textContent='Analysis cancelled. You can type or speak your meal, or retry. Current model operation may finish in the background.'}
function quickLabels(){return ['whole fried fish','breaded fried fish','grilled fish','cooked spinach','fried chicken thighs','grilled chicken breast','fried rice','white rice','fried eggs','toast','bacon','fried plantain','fried pork chop','pasta','pizza','salad','potatoes','beef stew','curry chicken','shrimp','oatmeal','broccoli','banana','sandwich','soup','roti','callaloo','not food'].filter(n=>n==='not food'||findLocal(n))}
function photoImage(img,region){let [x,y,w,h]=region,c=document.createElement('canvas'),sw=img.naturalWidth*w,sh=img.naturalHeight*h,scale=Math.min(224/sw,224/sh);c.width=Math.max(1,Math.round(sw*scale));c.height=Math.max(1,Math.round(sh*scale));c.getContext('2d').drawImage(img,x*img.naturalWidth,y*img.naturalHeight,sw,sh,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85)}
async function identifyPhoto(){let img=$('mealPhoto'),status=$('photoStatus');if(!img||img.hidden||!img.src){status.textContent='Choose a photo first.';return}if(photoBusy)return;let run=++photoRun,url=img.src,mode=$('photoMode')?.value||'smart',alive=()=>run===photoRun&&status.isConnected&&img.src===url;photoBusy=true;let began=performance.now();status.textContent='Preparing AI scan…';let work=async()=>{try{if(!alive())return;await img.decode();if(!alive())return;let key=mode+'|'+photoImage(img,[0,0,1,1]);if(photoCache.has(key)){showPhotoResults(status,photoCache.get(key),0);return}status.textContent='Loading AI model (first use needs internet)…';visionJob??=(async()=>{let m=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2');m.env.allowLocalModels=false;return m.pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{device:'wasm',dtype:'q8'})})();let model=await visionJob;if(!alive())return;let hits=new Map();async function scan(region,labels,step){if(!alive())return;status.textContent=step;let result=await model(photoImage(img,region),labels);if(!alive())return;for(let r of result.slice(0,6))if(r.label!=='not food')hits.set(r.label,Math.max(hits.get(r.label)||0,r.score));return result}let first=await scan([0,0,1,1],quickLabels(),'Step 1: quick meal scan…');if(!alive())return;let ranked=[...hits].sort((a,b)=>b[1]-a[1]);let distinct=new Set(ranked.filter(x=>x[1]>=.08).map(x=>photoGroup(x[0])));if(mode==='deep'){let labels=photoLabels().slice(0,100);await scan([0,0,.65,1],labels,'Step 2 of 3: left region…');await scan([.35,0,.65,1],labels,'Step 3 of 3: right region…')}else if(mode==='smart'&&(distinct.size<2||!ranked.length||ranked[0][1]<.35)){let labels=quickLabels();await scan([.35,0,.65,1],labels,'Step 2: checking possible side dishes…')}if(!alive())return;let groups=new Map();for(let [n,score] of [...hits].sort((a,b)=>b[1]-a[1])){let g=photoGroup(n);if(!groups.has(g))groups.set(g,{g,score,ns:[]});groups.get(g).ns.push(n)}let data=[...groups.values()].slice(0,8);photoCache.set(key,data);if(photoCache.size>6)photoCache.delete(photoCache.keys().next().value);showPhotoResults(status,data,(performance.now()-began)/1000)}catch(e){visionJob=undefined;if(alive())status.textContent='Photo AI unavailable. Use text or voice, or retry. '+String(e.message||e).slice(0,150)}finally{if(run===photoRun)photoBusy=false}};photoQueue=photoQueue.catch(()=>{}).then(work);await photoQueue}
function showPhotoResults(status,data,seconds){status.textContent=(seconds?`Scan completed in ${seconds.toFixed(1)} s. `:'Reused previous scan. ')+'Review suggested foods; portions are assumed, not measured.';let box=document.createElement('div'),more=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Other possible foods';more.append(summary);let rows=[];let prefs={};try{prefs=JSON.parse(readProfilePreference('myfit-photo-prefs')||'{}')}catch(e){};let update=()=>{let items=rows.filter(r=>r.check.checked).map(r=>{let f=findLocal(r.sel.value);return f?preparation({name:f[0],g:smartPortion(r.portion.value,f,f[6]),k:f[1],p:f[2],c:f[3],f:f[4]},r.sel.value):null}).filter(Boolean);let v=totals(items);total.textContent=`${v[0]} kcal · ${v[1]} g protein · ${v[2]} g carbs · ${v[3]} g fat`};for(let [i,{g,ns,score}] of data.entries()){let row=document.createElement('div');row.style.cssText='padding:8px 0;border-bottom:1px solid #34443b';let check=document.createElement('input');check.type='checkbox';check.style.width='auto';check.checked=i===0||i===1&&score>=.08;let sel=document.createElement('select');for(let n of ns)sel.add(new Option(n,n));if(ns.includes(prefs[g]?.name))sel.value=prefs[g].name;let portion=document.createElement('select');for(let n of ['medium','small','large'])portion.add(new Option(n,n));if(['medium','small','large'].includes(prefs[g]?.portion))portion.value=prefs[g].portion;let label=document.createElement('label');label.append(check,document.createTextNode(' '+g));let controls=document.createElement('div');controls.style.cssText='display:grid;grid-template-columns:2fr 1fr;gap:6px';controls.append(sel,portion);row.append(label,controls);(i<2?box:more).append(row);rows.push({g,check,sel,portion});for(let el of [check,sel,portion])el.onchange=update}if(data.length>2)box.append(more);let total=document.createElement('b');total.style.display='block';box.append(total);let go=document.createElement('button');go.className='wide';go.textContent='Review nutrition & log';go.onclick=()=>{let selected=rows.filter(r=>r.check.checked);if(!selected.length)return alert('Select at least one food.');let field=$('mealtext');if(field.value.trim()&&!confirm('Replace current meal description?'))return;for(let r of selected)prefs[r.g]={name:r.sel.value,portion:r.portion.value};try{writeProfilePreference('myfit-photo-prefs',JSON.stringify(prefs))}catch(e){}field.value=selected.map(r=>r.portion.value+' '+r.sel.value).join(', ');parse()};box.append(go);status.append(box);update();status.scrollIntoView({block:'start',behavior:'smooth'})}

function smartPortion(s,f,g){if(/\b(kg|kilograms?|g|grams?|oz|ounces?)\b/.test(s))return g;return Math.round(g*(/\bsmall\b/.test(s)?.75:/\blarge\b/.test(s)?1.35:1))}
function preparation(x,s){let raw= /\b(raw|dry|uncooked)\b/.test(s),method=(s.match(/\b(deep fried|deep-fried|pan fried|pan-fried|air fried|air-fried|fried|grilled|baked|boiled|roasted|steamed)\b/)||[])[0]||'';x.method=method;if(preparedProfiles.some(f=>f[0]===x.name)&&!['cooked fish','spinach'].includes(x.name)){x.source='Prepared food estimate · typical cooking fat included';x.uncertainty=.25;x.assumption='Edible cooked portion; typical recipe and oil. Adjust grams if needed.';return x}x.weightBasis=raw?'raw':'standard';if(raw&&rawNutrition[x.name]){[x.k,x.p,x.c,x.f]=rawNutrition[x.name];x.source='Generic raw/dry estimate'}else if(raw){x.review='Raw weight requested; verify nutrition basis manually.'}if(method&&/fried/.test(method)&&!raw&&!/^fried |^breaded fried |^unbreaded fried /.test(x.name)){let oil=/air/.test(method)?2:/deep/.test(method)?10:6;x.k+=oil*9;x.f+=oil;x.source='Estimated with typical retained frying oil';x.uncertainty=.3;x.assumption='Typical oil allowance included; breading not included unless recognized.';}return x}
function addExtra(n,g){let f=foods.find(x=>x[0]===n);if(!f)return;draft.push({name:n,g,k:f[1],p:f[2],c:f[3],f:f[4],source:'Added preparation ingredient'});drawDraft()}
function changeBasis(i,b){let x=draft[i],f=foods.find(y=>y[0]===x.name);if(!f||!rawNutrition[x.name])return;[x.k,x.p,x.c,x.f]=b==='raw'?rawNutrition[x.name]:f.slice(1,5);x.weightBasis=b;x.source='Generic '+(b==='raw'?'raw/dry':'standard cooked')+' estimate';drawDraft()}
function nutritionReview(){let v=totals(draft);return `<section><h3>Nutrition review</h3><b>${v[0]} kcal · ${v[1]} g protein · ${v[2]} g carbs · ${v[3]} g fat</b><p class="muted">${draft.some(x=>x.manual||x.review)?'Low confidence — unresolved ingredients or preparation.':'Estimated — verify weights and product labels.'} Oil already included in fried or prepared food entries should not be counted twice.</p><p>${draft.some(x=>x.manual)?'Range unavailable until unknown foods are resolved.':`Approximate range: ${Math.round(draft.reduce((a,x)=>a+x.k*x.g/100*(1-(x.uncertainty||.15)),0))}–${Math.round(draft.reduce((a,x)=>a+x.k*x.g/100*(1+(x.uncertainty||.15)),0))} kcal (illustrative, not a statistical interval).`}</p><label>Additional fat or sauce not already included</label><div class="grid"><button class="alt" onclick="addExtra('olive oil',4.5)">+ 1 tsp oil (40 kcal)</button><button class="alt" onclick="addExtra('olive oil',13.5)">+ 1 tbsp oil (119 kcal)</button><button class="alt" onclick="addExtra('butter',14)">+ 1 tbsp butter (100 kcal)</button><button class="alt" onclick="addExtra('tomato pasta sauce',30)">+ 2 tbsp tomato sauce</button></div><button class="alt wide" onclick="draft.push({name:'Custom ingredient',g:100,k:0,p:0,c:0,f:0,manual:true});drawDraft()">+ Custom ingredient / label</button></section>`}
async function parse(){let t=$('mealtext').value.toLowerCase().replace(/-/g,' ').replace(/\b(two|three|four|one|half|five|six|seven|eight|nine|ten)\b/g,x=>({two:'2',three:'3',four:'4',one:'1',half:'0.5',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'}[x]));t=t.replace(/ackee and saltfish/g,'ackee & saltfish').replace(/rice and peas/g,'rice & peas').replace(/macaroni and cheese/g,'macaroni & cheese');draft=t.split(/,|;|\band\b|\bwith\b|\bplus\b|\n/).map(s=>{s=s.replace(/ackee & saltfish/g,'ackee and saltfish').replace(/rice & peas/g,'rice and peas').replace(/macaroni & cheese/g,'macaroni and cheese');let matches=foods.filter(f=>f[7].split('|').some(a=>new RegExp('\\b'+a+'\\b').test(s)));let f=matches.sort((a,b)=>Math.max(...b[7].split('|').filter(x=>new RegExp('\\b'+x+'\\b').test(s)).map(x=>x.length))-Math.max(...a[7].split('|').filter(x=>new RegExp('\\b'+x+'\\b').test(s)).map(x=>x.length)))[0];if(s.includes('skinless')&&s.includes('thigh'))f=foods.find(y=>y[0]==='chicken thighs skinless');if(!f)return {name:s.trim(),g:100,manual:true,k:0,p:0,c:0,f:0};let n=s.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/),q=n?n[0].split(' ').reduce((a,v)=>a+(v.includes('/')?Number(v.split('/')[0])/Number(v.split('/')[1]):Number(v)),0):1;let g=s.match(/\b(?:kg|kilograms?)\b/)?q*1000:s.match(/\b(?:g|grams?)\b/)?q:s.match(/\b(?:oz|ounces?)\b/)?q*28.35:s.includes('cup')?q*f[5]: /tbsp|tablespoon/.test(s)?q*f[5]/16:/tsp|teaspoon/.test(s)?q*f[5]/48:q*f[6];return preparation({name:f[0],g:smartPortion(s,f,g),k:f[1],p:f[2],c:f[3],f:f[4],source:"Generic estimate"},s)}).filter(x=>x.name);if(draft.some(x=>/^(olive oil|sesame oil|butter)$/.test(x.name))){for(let x of draft){if(x.source==='Estimated with typical retained frying oil'){let oil=/air/.test(x.method)?2:/deep/.test(x.method)?10:6;x.k-=oil*9;x.f-=oil;x.source='Generic estimate · explicit fat logged separately';x.assumption='Automatic oil allowance removed because separate fat was entered.'}else if(x.uncertainty)x.review='Prepared food already includes typical oil; separate oil may double count.'}}drawDraft();let current=draft;for(let x of current.filter(x=>x.manual)){try{cnfCatalog??=await cnf('food');let q=x.name.replace(/^[\d.]+\s*(?:cups?|grams?|g|oz|slices?)?\s*/i,'').trim();let matches=cnfCatalog.filter(y=>String(y.food_description).toLowerCase()===q);if(matches.length!==1)continue;let v=await cnfMacros(matches[0].food_code);if(draft!==current)return;Object.assign(x,v,{manual:false,source:'Health Canada · review 100 g portion'});drawDraft()}catch(e){}}}
function totals(items){return ['k','p','c','f'].map(k=>Math.round(items.reduce((a,x)=>a+x[k]*x.g/100,0)))}function meals(){return S.meals[day()]||[]}function sum(){return totals(meals().flatMap(x=>x.items))}function bars(a,t){return ['Calories','Protein','Carbs','Fat'].map((n,i)=>`<div class="line"><span>${n}</span><b>${a[i]} / ${t[i]} ${i?'g':'kcal'}</b></div><div class="bar"><i style="width:${Math.min(100,a[i]/t[i]*100)}%"></i></div>`).join('')}
const ex={lower:['Leg press|3|8–12','Leg extension|3|12–15','Seated hamstring curl|3|10–15','Calf raise|3|12–20'],posterior:['Hip thrust|3|10–12','Dumbbell Romanian deadlift|3|8–12','Leg press|3|10–12','Hamstring curl|3|12–15','Calf raise|3|15–20'],push:['Dumbbell bench press|3|8–12','Incline press|3|8–12','Seated shoulder press|3|8–12','Lateral raise|3|12–15','Triceps pushdown|2|12–15'],pull:['Lat pulldown|3|8–12','Chest-supported row|3|10–12','Cable row|2|10–12','Face pull|2|15','Biceps curl|3|10–12'],upper:['Dumbbell bench press|3|8–12','Lat pulldown|3|8–12','Chest-supported row|3|10–12','Lateral raise|2|15','Biceps curl|2|12','Triceps pushdown|2|12'],full:['Leg press|2|12','Incline press|3|10','Lat pulldown|3|10','Hamstring curl|2|12','Lateral raise|2|15','Plank|2|30–45 sec'],mobility:['Brisk walk|1|25 min','Hip flexor stretch|2|30 sec/side','Hamstring stretch|2|30 sec/side','90/90 hip stretch|2|30 sec/side','Dead bug|2|10/side'],rest:[]};const names={lower:'Quads & calves',posterior:'Hamstrings & glutes',push:'Chest, shoulders & triceps',pull:'Back & biceps',upper:'Upper body',full:'Full body',mobility:'Cardio & mobility',rest:'Recovery'};function schedule(){let p=S.profile;if(p.days==3)return ['full','mobility','full','rest','full','mobility','rest'];if(p.days==4)return ['lower','upper','mobility','posterior','upper','mobility','rest'];return ['lower','push','mobility','pull','posterior','full','rest']}const baseSchedule=schedule; function exerciseList(w){let a=[...ex[w]],p=S.profile.priorities||[];if(w==='rest'||w==='mobility')return a;if(p.includes('legs')&&w==='lower')a.push('Dumbbell step-up|2|10/side');if(p.includes('chest')&&(w==='push'||w==='upper'))a.push('Machine chest fly|2|12–15');if(p.includes('back')&&(w==='pull'||w==='upper'))a.push('Straight-arm pulldown|2|12');if(p.includes('arms')&&(w==='pull'||w==='upper'))a.push('Hammer curl|2|12');if(p.includes('shoulders')&&w==='full')a.push('Face pull|2|15');if(p.includes('core')&&(w==='lower'||w==='upper'))a.push('Dead bug|2|10/side');if(p.includes('flexibility'))a.push('Hip flexor stretch|1|30 sec/side');return a;} function workout(){return schedule()[(new Date(day()+'T12:00:00').getDay()+6)%7]}
let foodPage='Today',foodMethod='text',diaryDate='',foodEdit=null;
function foodOpen(page,method='text'){if(typeof photoBusy!=='undefined'&&photoBusy)cancelPhoto();foodPage=page;foodMethod=method;render();window.scrollTo(0,0)}
function foodStart(method){foodOpen('Log',method);if(method==='camera'||method==='gallery')$(method==='camera'?'mealCameraInput':'mealGalleryInput').click();if(method==='voice')voice()}
function foodRows(date){return (S.meals[date]||[]).map((m,i)=>`<div class="line"><div><b>${esc(m.items.map(x=>x.name).join(', '))}</b><br><small>${totals(m.items)[0]} kcal · ${totals(m.items)[1]} g protein</small></div><button class="alt" onclick="editFood('${date}',${i})">Edit</button><button class="alt" onclick="deleteMeal('${date}',${i})">×</button></div>`).join('')||'<p class="muted">No meals logged.</p>'}
function editFood(date,i){foodEdit={date,i};draft=JSON.parse(JSON.stringify(S.meals[date][i].items));foodOpen('Log','text')}
function foodView(a,t){let nav=`<div class="foodtabs">${['Today','Diary','Saved','Settings'].map(n=>`<button class="${foodPage===n?'':'alt'}" onclick="foodOpen('${n}')">${n}</button>`).join('')}</div>`;if(foodPage==='Today')return `<h2>Daily nutrition</h2>${nav}<section><small>Calories remaining (estimated target)</small><div class="metric" style="color:#a5ef91">${t[0]-a[0]} kcal</div>${bars(a,t)}</section><h3>Log a meal</h3><div class="grid">${[['camera','📷 Take photo'],['gallery','🖼 Gallery'],['voice','🎙 Speak'],['text','⌨ Type meal'],['barcode','▥ Barcode'],['search','⌕ Search food']].map(([m,n])=>`<button class="alt" onclick="foodStart('${m}')">${n}</button>`).join('')}</div>${draft.length?'<button class="wide" onclick="foodOpen(&quot;Log&quot;)">Resume meal draft</button>':''}<section><h3>Today’s meals</h3>${foodRows(day())}</section>`;if(foodPage==='Diary'){let d=diaryDate||day();return `<h2>Food diary</h2>${nav}<section><label>Date<input type="date" value="${esc(d)}" onchange="diaryDate=this.value;render()"></label>${bars(totals((S.meals[d]||[]).flatMap(m=>m.items)),t)}${foodRows(d)}</section>`}if(foodPage==='Saved')return `<h2>Saved meals</h2>${nav}<section>${S.favorites.map((f,i)=>`<div class="line"><button class="alt" onclick="useFavorite(${i})">${esc(f.name)}</button><button class="alt" onclick="S.favorites.splice(${i},1);save();render()">Remove</button></div>`).join('')||'Save a meal after estimating it.'}</section>`;if(foodPage==='Settings')return `<h2>Food settings</h2>${nav}<section><label>Default AI scan<select onchange="writeProfilePreference('myfit-scan-mode',this.value)">${['smart','quick','deep'].map(n=>`<option ${n===(readProfilePreference('myfit-scan-mode')||'smart')?'selected':''}>${n}</option>`).join('')}</select></label><button class="alt" onclick="tab='Goals';render()">Edit nutrition goals</button></section>`;let isPhoto=['camera','gallery'].includes(foodMethod),isLookup=['search','barcode'].includes(foodMethod);return `<button class="alt" onclick="foodOpen('Today')">← Food dashboard</button><h2>${isPhoto?'Snap & Track':isLookup?(foodMethod==='barcode'?'Snap & Track · Barcode':'Canadian food lookup'):'Describe your meal'}</h2><div class="food-method-menu"><button class="alt" onclick="foodStart('camera')"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h-4L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg>Snap meal</button><button class="alt" onclick="foodStart('gallery')"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>Gallery</button><button class="alt" onclick="foodOpen('Log','text')"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7a4 4 0 0 0 8 0V2M7 2v20M21 2v20M21 2c-4 3-5 7-5 11h5"/></svg>Manual</button><button class="alt" onclick="foodOpen('Log','barcode')">Barcode</button><button class="alt" onclick="foodOpen('Log','search')">Search food</button><button class="alt" onclick="foodStart('voice')">Voice</button></div><section><div ${isPhoto||isLookup?'hidden':''}><textarea id="mealtext" placeholder="Describe foods and portions"></textarea><button onclick="parse()">Estimate nutrition</button> <button class="alt" onclick="voice()">🎙 Voice</button><div id="voiceStatus"></div></div><div ${isPhoto?'':'hidden'}><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button type="button" class="alt" style="flex:1" onclick="document.getElementById('mealCameraInput').click()">📷 Take photo</button><button type="button" class="alt" style="flex:1" onclick="document.getElementById('mealGalleryInput').click()">🖼 Choose photo</button></div><input id="mealCameraInput" type="file" accept="image/*" capture="environment" hidden style="display:none" onchange="photoPreview(this);this.value=''"><input id="mealGalleryInput" type="file" accept="image/*" hidden style="display:none" onchange="photoPreview(this);this.value=''"><img id="mealPhoto" hidden style="width:100%;max-height:230px;object-fit:contain;border-radius:12px"><label>Scan preference</label><select id="photoMode"><option value="smart">Smart scan</option><option value="quick">Quick scan</option><option value="deep">Deep scan (slower)</option></select><p id="photoStatus" class="muted">Snap your meal. Review the suggested foods before logging.</p><div class="scan-actions" style="display:grid;gap:16px;margin:12px 0 16px"><button class="wide" onclick="identifyPhoto()">Scan my meal</button><button class="wide" style="background:transparent;color:#c5d6c9;border:1px solid #64796b" onclick="cancelPhoto()">Cancel scan</button></div><small>The first scan needs internet and may take longer. Smart scan is recommended. Deep scan checks more of the photo. Review food names and estimated portions before saving.</small></div><div ${isLookup?'':'hidden'}><h3>${foodMethod==='barcode'?'Scan packaged food':'🇨🇦 Canadian food lookup'}</h3>${foodMethod==='barcode'?`<button class="wide" onclick="startBarcode()">▥ Scan barcode with camera</button><video id="barcodeVideo" hidden playsinline muted style="width:100%;max-height:260px;object-fit:contain;margin:12px 0;border-radius:12px"></video><button id="barcodeStop" hidden class="alt wide" onclick="stopBarcode();$('lookupResults').textContent='Scanner stopped.'">Stop camera</button><label>Or enter barcode digits</label>`:''}<input id="lookup" ${foodMethod==='barcode'?'inputmode="numeric" placeholder="UPC / EAN barcode" oninput="resetBarcodeLookup()"':'placeholder="Food name or barcode digits"'}>${foodMethod==='barcode'?'':'<button class="alt" onclick="canadaSearch()">Search Health Canada</button>'} <button class="alt" onclick="barcodeLookup()">Barcode lookup</button> <button class="alt" onclick="openBarcodeDirect()">Open database directly</button>${foodMethod==='barcode'?'<button class="alt wide" onclick="stopBarcode();barcodeManual()">Enter package label values</button>':''}<div id="lookupResults" class="muted"></div><small>Online lookup sends only your search or barcode to the selected service. Generic estimates are not restaurant-specific.</small></div><div id="draft"></div></section>`}
function render(){let t=targets(),a=sum(),w=workout();$('nav').innerHTML=['Home','Food','Workout','Coach','Planner','Goals','Progress'].map((n,i)=>`<button class="${tab===n?'active':''}" onclick="openMainTab('${n}')"><span>${['⌂','◉','◆','✦','▦','◎','↗'][i]}</span>${n}</button>`).join('');let h='';if(tab==='Home')h=`<div class="pill">${goals[S.profile.goal]}</div><h2>Your daily overview</h2><section><div class="ring" style="--p:${Math.min(100,a[0]/t[0]*100)}%"><div><span class="metric">${a[0]}</span><small>of ${t[0]} kcal</small></div></div><center>${t[0]-a[0]} kcal remaining</center>${bars(a,t)}<button class="wide" onclick="dashboardFood('text')">+ Log a meal</button></section><section><small>TODAY'S TRAINING</small><h2>${names[w]}</h2><button onclick="dashboardStart()">Start live workout</button></section>`;if(tab==='Home')h+=`<section><h3>MyFit Coach</h3><p class="muted">Your daily briefing, meal suggestions and weekly review.</p><button class="wide" onclick="tab='Coach';render()">Open MyFit Coach</button></section>`;if(tab==='Coach')h=`<h2>MyFit Coach</h2><section>${coach(a,t)}</section>`;if(tab==='Food')h=foodView(a,t);if(tab==='Workout')h=`<h2>Training</h2><section>${schedule().map((x,i)=>`<div class="line"><small>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</small><b>${names[x]}</b></div>`).join('')}</section><section><h3>${names[w]}</h3><small>Warm up first. Leave 1–3 reps in reserve. No barbell back squats.</small>${exerciseList(w).map((x,i)=>{let [n,s,r]=x.split('|');let key=day()+'|'+n,log=S.work[key]||{};return `<div class="line"><div><b>${n}</b><br><small>${s} sets × ${r}</small></div><input aria-label="Weight in pounds" type="number" min="0" placeholder="lb" value="${esc(log.weight||'')}" onchange="record('${n}','weight',this.value)"><input aria-label="Sets completed" type="number" min="0" max="${s}" placeholder="sets" value="${esc(log.sets||'')}" onchange="record('${n}','sets',this.value)"></div>`}).join('')||'Take an easy walk and recover.'}<div class="line"><button onclick="restTimer(90)">90 sec rest</button><button class="alt" onclick="restTimer(120)">2 min</button><b id="timer">Ready</b></div><p class="muted">Enter weight and completed sets; entries save automatically. For mobility, leave weight blank.</p></section>`;if(tab==='Profile')h=`<h2>Edit profile & program</h2><section><label>Primary goal<select id="goal">${Object.entries(goals).map(([k,v])=>`<option value="${k}" ${S.profile.goal===k?'selected':''}>${v}</option>`)}</select></label>${[['age','Age'],['height','Height (cm)'],['weight','Weight (lb)']].map(([k,n])=>`<label>${n}<input id="${k}" type="number" value="${S.profile[k]}"></label>`).join('')}<label>Sex used for calorie estimate<select id="sex"><option value="male" ${S.profile.sex==='male'?'selected':''}>Male</option><option value="female" ${S.profile.sex==='female'?'selected':''}>Female</option></select></label><label>Activity<select id="activity">${[[1.2,'Sedentary'],[1.375,'Light'],[1.5,'Moderate'],[1.725,'Very active']].map(([v,n])=>`<option value="${v}" ${S.profile.activity==v?'selected':''}>${n}</option>`)}</select></label><label>Preferred lifting days<select id="days">${[3,4,5].map(v=>`<option ${S.profile.days==v?'selected':''}>${v}</option>`)}</select></label><h3>Muscle priorities</h3><small>Choose up to three strength priorities plus flexibility.</small>${['legs','chest','back','arms','shoulders','core','flexibility'].map(n=>`<label class="line">${n}<input type="checkbox" style="width:22px" id="priority-${n}" ${S.profile.priorities.includes(n)?'checked':''}></label>`).join('')}<button class="wide" onclick="updateGoals()">Apply goals & regenerate plan</button><p class="muted">Calorie estimates are provisional. Training follows your selected lifting days. Back squats excluded.</p></section><section>${bars([0,0,0,0],t)}</section>`;if(tab==='Planner')h=plannerView();if(tab==='Progress')h=`<section id="bodyMeasurementEntry">${['Weight (lb)','Waist (in)','Chest (in)','Thigh (in)','Arm (in)'].map((n,i)=>`<label>${n}<input type="number" min="0" step="0.1" id="m${i}"></label>`).join('')}<button onclick="measure()">Save measurements</button></section><section id="bodyMeasurementTrends"><h3>Measurement trends</h3>${charts()}<h3>History</h3>${S.measure.map(m=>`<div class="line"><small>${esc(m.date)}</small><span>${m.v.map((v,i)=>v?['Weight','Waist','Chest','Thigh','Arm'][i]+': '+esc(v):'').filter(Boolean).join(' · ')}</span></div>`).join('')||'No measurements yet.'}</section>`;$('app').innerHTML=h;if(tab==='Coach')window.scrollTo(0,0);if(tab==='Planner')loadDishPhotos();if(tab==='Food'){if($('photoMode'))$('photoMode').value=readProfilePreference('myfit-scan-mode')||'smart';drawDraft()}}
const recipes=[
['Mexican','Chicken burrito bowl',[['chicken breast',150],['white rice',140],['black beans',80],['salsa',40],['avocado',40]],'Season chicken with cumin, paprika and lime; cook through. Warm rice and beans, assemble and top with salsa and avocado.'],
['Mexican','Shrimp fajita tacos',[['shrimp',170],['tortilla',90],['bell pepper',120],['onion',60],['olive oil',5],['salsa',40]],'Sauté peppers and onion in oil, add shrimp and cook until opaque. Fill warm tortillas and top with salsa.'],
['Caribbean','Jerk chicken rice bowl',[['jerk chicken',150],['rice and peas',160],['broccoli',150]],'Season chicken with jerk seasoning and cook through. Serve with warmed rice and peas and steamed broccoli.'],
['Caribbean','Salmon and plantain',[['salmon',150],['plantain',150],['spinach',80],['olive oil',5]],'Roast salmon and sliced plantain with oil and spices. Wilt spinach and serve.'],
['Italian','Turkey tomato spaghetti',[['turkey',150],['cooked spaghetti',160],['tomato pasta sauce',125],['spinach',60]],'Cook turkey through, stir in sauce and spinach, and toss with cooked spaghetti.'],
['Italian','Shrimp tomato pasta',[['shrimp',170],['cooked spaghetti',160],['tomato pasta sauce',125],['olive oil',5]],'Sauté shrimp in oil until opaque, warm sauce and toss with cooked pasta.'],
['Mediterranean','Chicken quinoa salad',[['chicken breast',150],['quinoa',150],['cucumber',100],['tomato',100],['olive oil',10]],'Cook chicken through, combine with cooked quinoa and chopped vegetables. Dress with oil and lemon.'],
['Asian-inspired','Tofu rice stir-fry',[['tofu',200],['white rice',150],['broccoli',150],['bell pepper',100],['olive oil',5]],'Brown tofu in oil, stir-fry vegetables and serve over rice. Season to taste.'],
['Indian-inspired','Chicken and chickpea bowl',[['chicken breast',150],['chickpeas',100],['white rice',120],['tomato',100],['olive oil',5]],'Cook chicken with oil, curry spices and tomatoes until cooked through. Stir in chickpeas and serve with rice.'],
['Canadian-inspired','Salmon potato plate',[['salmon',150],['potato',220],['green beans',150],['olive oil',5]],'Roast potatoes and salmon with oil and herbs until cooked through. Steam green beans.']];
const mealTypes=['Breakfast','Lunch','Snack','Dinner'];
recipes.forEach((r,i)=>r.push([0,1,2,4,6,7,8].includes(i)?['Lunch','Dinner']:['Dinner']));
const extra=[
['Mexican','Breakfast egg and bean tacos','egg:100,tortilla:45,black beans:70,salsa:40','Scramble eggs until set; warm beans and tortillas, then add salsa.','Breakfast'],
['Mexican','Avocado bean toast','bread:60,avocado:50,black beans:80','Toast bread, mash beans and avocado, season with lime.','Breakfast,Snack'],
['Mexican','Chicken salsa wrap','chicken breast:120,tortilla:60,salsa:50,spinach:30','Fill warm tortilla with cooked chicken, salsa and spinach.','Lunch'],
['Caribbean','Banana oat porridge','oats dry:50,milk:200,banana:100,greek yogurt:100','Simmer oats in milk; top with banana and yogurt.','Breakfast'],
['Caribbean','Plantain and eggs','plantain:120,egg:100,olive oil:5','Pan-cook sliced plantain in oil and cook eggs until set.','Breakfast'],
['Caribbean','Jerk chicken wrap','jerk chicken:120,tortilla:60,spinach:40','Fill tortilla with cooked jerk chicken and spinach.','Lunch'],
['Caribbean','Banana yogurt cup','banana:100,greek yogurt:170','Slice banana over yogurt; add cinnamon.','Snack'],
['Italian','Spinach egg toast','egg:100,spinach:60,bread:60,olive oil:5','Wilt spinach, scramble eggs until set and serve on toast.','Breakfast'],
['Italian','Tomato tuna pasta salad','tuna:120,cooked spaghetti:150,tomato:100,olive oil:5','Toss cooked pasta with tuna, tomato and oil.','Lunch'],
['Italian','Tomato cheese toast','bread:30,tomato:60,cheddar cheese:25','Top toast with tomato and cheese; warm until melted.','Snack'],
['Mediterranean','Yogurt berry oats','greek yogurt:200,blueberries:100,oats dry:40','Mix yogurt, berries and oats; chill if desired.','Breakfast'],
['Mediterranean','Chickpea tuna salad','chickpeas:120,tuna:120,cucumber:100,tomato:100,olive oil:5','Combine drained chickpeas and tuna with chopped vegetables.','Lunch,Dinner'],
['Mediterranean','Yogurt and almonds','greek yogurt:170,almonds:20','Top yogurt with almonds.','Snack'],
['Asian-inspired','Egg rice bowl','egg:100,white rice:120,spinach:60,olive oil:5','Cook eggs until set and serve over warm rice with spinach.','Breakfast'],
['Asian-inspired','Shrimp vegetable rice','shrimp:150,white rice:150,broccoli:100,olive oil:5','Stir-fry shrimp until opaque with vegetables; serve with rice.','Lunch,Dinner'],
['Asian-inspired','Tofu cucumber bites','tofu:100,cucumber:100','Serve ready-to-eat tofu with sliced cucumber and seasoning.','Snack'],
['Indian-inspired','Spiced egg wrap','egg:100,tortilla:60,spinach:50','Scramble eggs with curry spices and spinach; wrap.','Breakfast'],
['Indian-inspired','Lentil rice bowl','lentils:180,white rice:120,tomato:100,olive oil:5','Simmer cooked lentils with tomato and spices; serve over rice.','Lunch,Dinner'],
['Indian-inspired','Spiced chickpea snack','chickpeas:100,olive oil:5','Roast cooked chickpeas with cumin until crisp.','Snack'],
['Canadian-inspired','Berry protein oatmeal','oats dry:50,milk:200,blueberries:100,protein powder:25','Cook oats in milk; stir in protein powder and berries.','Breakfast'],
['Canadian-inspired','Turkey potato bowl','turkey:150,potato:200,green beans:100','Serve cooked turkey with boiled potatoes and steamed beans.','Lunch,Dinner'],
['Canadian-inspired','Apple and peanut butter','apple:150,peanut butter:20','Slice apple and serve with peanut butter.','Snack']];
extra.forEach(([c,n,ing,steps,types])=>recipes.push([c,n,ing.split(',').map(x=>{let [n,g]=x.split(':');return [n,+g]}),steps,types.split(',')]));

const curated=[
['Indian-inspired','Masala omelette','egg:150,onion:40,tomato:60,olive oil:5,cumin:1,turmeric:1','Finely chop onion and tomato. Beat eggs with cumin and turmeric. Heat oil, soften onion and tomato, then add eggs and cook until set.','Breakfast'],
['Indian-inspired','Egg bhurji','egg:150,onion:60,tomato:80,olive oil:5,cumin:2,turmeric:1','Soften chopped onion in oil with cumin. Add tomato and turmeric and cook until soft. Stir in beaten eggs until set.','Breakfast'],
['Indian-inspired','Chana masala with rice','chickpeas:180,onion:60,tomato:150,white rice:120,olive oil:5,cumin:2,garam masala:3','Soften onion in oil with cumin. Add tomato and garam masala and simmer until thick. Add cooked chickpeas and simmer 10 minutes. Serve with warm rice.','Lunch,Dinner'],
['Indian-inspired','Chicken tikka masala with rice','chicken breast:150,greek yogurt:80,tomato:150,onion:60,white rice:120,olive oil:5,garam masala:4,turmeric:1','Coat chicken with half the yogurt and spices. Cook chicken to 74°C. Soften onion in oil, add tomato and remaining spices and simmer. Stir in remaining yogurt and chicken over low heat. Serve with rice.','Lunch,Dinner'],
['Indian-inspired','Dal tadka','lentils:220,tomato:100,onion:60,olive oil:8,cumin:2,turmeric:1,white rice:100','Simmer cooked lentils with tomato and turmeric. Fry chopped onion and cumin in oil until golden. Stir into lentils and serve with warm rice.','Lunch,Dinner'],
['Mexican','Huevos rancheros','egg:100,tortilla:60,black beans:100,salsa:80,olive oil:5','Warm tortillas and beans. Fry eggs in oil until set. Place eggs on tortillas and spoon warm salsa over them. Serve with beans.','Breakfast'],
['Mexican','Chicken quesadilla','chicken breast:120,tortilla:90,cheddar cheese:35,bell pepper:60,salsa:40','Fill tortillas with cooked sliced chicken, chopped pepper and cheese. Toast in a dry skillet on both sides until cheese melts. Serve with salsa.','Lunch,Dinner'],
['Caribbean','Jamaican-style callaloo and eggs','spinach:150,egg:150,onion:50,tomato:60,olive oil:5,thyme:1','Soften onion and tomato in oil with thyme. Add spinach as a substitute for callaloo and wilt. Scramble eggs into the greens until set.','Breakfast'],
['Italian','Pasta e ceci','cooked spaghetti:150,chickpeas:150,tomato pasta sauce:150,olive oil:5,oregano:1','Break cooked pasta into short lengths. Simmer chickpeas in tomato sauce with oregano. Stir in pasta and oil and heat through.','Lunch,Dinner'],
['Mediterranean','Shakshuka','egg:150,tomato:200,onion:60,bell pepper:80,olive oil:8,cumin:2','Soften onion and pepper in oil. Add tomato and cumin and simmer until thick. Make wells, crack in eggs, cover and cook until set.','Breakfast,Lunch'],
['Asian-inspired','Japanese-style salmon rice bowl','salmon:150,white rice:150,cucumber:100,soy sauce:10','Cook salmon through to 70°C. Flake over warm rice. Add sliced cucumber and drizzle with soy sauce.','Lunch,Dinner'],
['Canadian-inspired','Apple cinnamon oatmeal','oats dry:60,milk:200,apple:120,cinnamon:2,greek yogurt:100','Dice apple. Simmer oats, milk, apple and cinnamon until tender. Top with yogurt.','Breakfast']];
foods.push(...[['cumin',375,18,44,22],['turmeric',312,10,67,3],['garam masala',350,12,55,12],['thyme',276,9,64,7],['oregano',265,9,69,4],['soy sauce',53,8,5,0],['cinnamon',247,4,81,1]].filter(x=>!foods.some(f=>f[0]===x[0])).map(x=>[...x,100,1,x[0]]));
curated.forEach(([c,n,ing,steps,types])=>recipes.push([c,n,ing.split(',').map(x=>{let [n,g]=x.split(':');return [n,+g]}),steps,types.split(',')]));
// Old generated recipe indices cannot safely refer to new recipes.
if(!S.curatedMigration){S.recipeFav=(S.recipeFav||[]).filter(i=>i<32);S.plan=Object.fromEntries(Object.entries(S.plan||{}).filter(([k,i])=>i<32));S.curatedMigration=true;save()}

foods.push(...[["chickpea flour", 387, 22, 58, 7, 100, 100, "chickpea flour"], ["kidney beans", 127, 9, 23, 0.5, 100, 100, "kidney beans"], ["cod", 105, 23, 0, 1, 100, 100, "cod"], ["cabbage", 25, 1, 6, 0, 100, 100, "cabbage"], ["lime juice", 25, 0.4, 8, 0, 100, 100, "lime juice"], ["curry powder", 325, 14, 58, 14, 100, 100, "curry powder"], ["garlic", 149, 6, 33, 0.5, 100, 100, "garlic"], ["mozzarella", 280, 28, 3, 17, 100, 100, "mozzarella"], ["basil", 23, 3, 3, 1, 100, 100, "basil"], ["pita", 275, 9, 56, 1, 100, 100, "pita"], ["lemon juice", 22, 0.4, 7, 0, 100, 100, "lemon juice"], ["cottage cheese", 98, 11, 3, 4, 100, 100, "cottage cheese"], ["peach", 39, 1, 10, 0, 100, 100, "peach"]].filter(x=>!foods.some(f=>f[0]===x[0])));
[["Indian-inspired", "Besan chilla", "chickpea flour:70,onion:40,tomato:50,cumin:1,olive oil:5,greek yogurt:100", "Whisk flour with water. Stir in chopped onion, tomato and cumin. Cook thin pancakes in oil on both sides until set. Serve with yogurt.", "Breakfast"], ["Indian-inspired", "Rajma chawal", "kidney beans:180,white rice:130,onion:60,tomato:150,cumin:2,garam masala:3,olive oil:5", "Fry onion and cumin in oil. Add tomato and garam masala and simmer. Add cooked beans and simmer ten minutes. Serve over rice.", "Lunch,Dinner"], ["Mexican", "Fish tacos", "cod:150,tortilla:90,cabbage:80,greek yogurt:40,lime juice:15,cumin:2,olive oil:5", "Season fish with cumin and pan cook to 70°C. Shred cabbage and mix yogurt with lime. Fill warm tortillas with fish, cabbage and sauce.", "Lunch,Dinner"], ["Caribbean", "Trinidad channa and aloo", "chickpeas:160,potato:160,onion:60,curry powder:5,olive oil:5,garlic:5", "Soften onion and garlic in oil. Stir in curry powder with water. Add cooked chickpeas and diced cooked potato; simmer until thick.", "Lunch,Dinner"], ["Italian", "Caprese toast", "bread:80,mozzarella:70,tomato:120,olive oil:5,basil:5", "Toast bread. Layer tomato and mozzarella, add basil and drizzle with oil.", "Breakfast,Lunch"], ["Mediterranean", "Chicken souvlaki", "chicken breast:150,pita:70,greek yogurt:80,cucumber:80,lemon juice:20,oregano:2,olive oil:5", "Marinate chicken with lemon, oregano and oil. Grill to 74°C. Mix grated cucumber with yogurt and serve with chicken and pita.", "Lunch,Dinner"], ["Asian-inspired", "Japanese oyakodon", "chicken breast:120,egg:100,white rice:150,onion:60,soy sauce:15", "Simmer onion and chicken in water and soy sauce until chicken reaches 74°C. Pour beaten egg over and cook until set. Serve over rice.", "Lunch,Dinner"], ["Asian-inspired", "Chinese tomato egg stir-fry", "egg:150,tomato:200,white rice:120,soy sauce:8,olive oil:5", "Scramble eggs in oil and remove. Cook tomato until juicy, return eggs and season with soy sauce. Serve with rice.", "Breakfast,Lunch"], ["Canadian-inspired", "Cottage cheese peach bowl", "cottage cheese:200,peach:150,almonds:15", "Slice peach over cottage cheese and sprinkle with almonds.", "Snack"]].forEach(([c,n,ing,steps,types])=>recipes.push([c,n,ing.split(",").map(x=>{let [n,g]=x.split(":");return [n,+g]}),steps,types.split(",")]));
foods.push(...[["rice flakes dry", 360.0, 7.0, 80.0, 1.0, 100, 100, "rice flakes dry"], ["peanuts", 567.0, 26.0, 16.0, 49.0, 100, 100, "peanuts"], ["paneer", 265.0, 18.0, 3.0, 21.0, 100, 100, "paneer"], ["eggplant", 25.0, 1.0, 6.0, 0.0, 100, 100, "eggplant"], ["mango", 60.0, 1.0, 15.0, 0.0, 100, 100, "mango"], ["cardamom", 311.0, 11.0, 68.0, 7.0, 100, 100, "cardamom"], ["sugar", 387.0, 0.0, 100.0, 0.0, 100, 100, "sugar"], ["vinegar", 18.0, 0.0, 0.0, 0.0, 100, 100, "vinegar"], ["flour dry", 364.0, 10.0, 76.0, 1.0, 100, 100, "flour dry"], ["coconut milk", 197.0, 2.0, 3.0, 21.0, 100, 100, "coconut milk"], ["cilantro", 23.0, 2.0, 4.0, 1.0, 100, 100, "cilantro"], ["cornmeal dry", 370.0, 7.0, 79.0, 2.0, 100, 100, "cornmeal dry"], ["salsa verde", 35.0, 1.0, 7.0, 0.0, 100, 100, "salsa verde"], ["chipotle", 80.0, 3.0, 12.0, 2.0, 100, 100, "chipotle"], ["zucchini", 17.0, 1.0, 3.0, 0.0, 100, 100, "zucchini"], ["chili powder", 282.0, 13.0, 50.0, 14.0, 100, 100, "chili powder"], ["parsley", 36.0, 3.0, 6.0, 1.0, 100, 100, "parsley"], ["olives", 145.0, 1.0, 4.0, 15.0, 100, 100, "olives"], ["capers", 23.0, 2.0, 5.0, 1.0, 100, 100, "capers"], ["parmesan", 431.0, 38.0, 4.0, 29.0, 100, 100, "parmesan"], ["tahini", 595.0, 17.0, 21.0, 54.0, 100, 100, "tahini"], ["bulgur cooked", 83.0, 3.0, 19.0, 0.0, 100, 100, "bulgur cooked"], ["feta", 265.0, 14.0, 4.0, 21.0, 100, 100, "feta"], ["fava beans", 110.0, 8.0, 20.0, 0.0, 100, 100, "fava beans"], ["nori", 300.0, 30.0, 40.0, 4.0, 100, 100, "nori"], ["miso", 198.0, 12.0, 25.0, 6.0, 100, 100, "miso"], ["green onion", 32.0, 2.0, 7.0, 0.0, 100, 100, "green onion"], ["ginger", 80.0, 2.0, 18.0, 1.0, 100, 100, "ginger"], ["chili bean paste", 120.0, 5.0, 15.0, 5.0, 100, 100, "chili bean paste"], ["peas", 84.0, 5.0, 15.0, 0.0, 100, 100, "peas"], ["gochujang", 220.0, 5.0, 45.0, 2.0, 100, 100, "gochujang"], ["rice paper dry", 350.0, 5.0, 82.0, 0.0, 100, 100, "rice paper dry"], ["black eyed peas", 116.0, 8.0, 21.0, 1.0, 100, 100, "black eyed peas"], ["berbere", 300.0, 10.0, 50.0, 10.0, 100, 100, "berbere"], ["baking powder", 53.0, 0.0, 28.0, 0.0, 100, 100, "baking powder"], ["split peas cooked", 118.0, 8.0, 21.0, 0.0, 100, 100, "split peas cooked"], ["celery", 14.0, 1.0, 3.0, 0.0, 100, 100, "celery"]].filter(x=>!foods.some(f=>f[0]===x[0])));
recipes.push(...[["Indian-inspired", "Poha", [["rice flakes dry", 65], ["onion", 50], ["peanuts", 15], ["turmeric", 1], ["olive oil", 5], ["lime juice", 10]], "Rinse rice flakes and drain. Fry onion, peanuts and turmeric in oil. Fold in flakes and steam covered with a splash of water. Finish with lime.", ["Breakfast"]], ["Indian-inspired", "Aloo jeera", [["potato", 250], ["cumin", 3], ["turmeric", 1], ["olive oil", 8], ["lime juice", 10]], "Cube cooked potatoes. Toast cumin in oil, add turmeric and potatoes and fry until golden. Finish with lime.", ["Lunch", "Dinner"]], ["Indian-inspired", "Palak paneer", [["paneer", 120], ["spinach", 200], ["onion", 60], ["garlic", 5], ["garam masala", 3], ["olive oil", 5]], "Wilt spinach and blend with water. Fry onion and garlic in oil, add spices and spinach puree. Simmer with cubed paneer.", ["Lunch", "Dinner"]], ["Indian-inspired", "Baingan bharta", [["eggplant", 250], ["onion", 70], ["tomato", 120], ["garlic", 5], ["cumin", 2], ["olive oil", 8]], "Roast eggplant until collapsed, peel and mash. Fry onion, garlic and cumin in oil. Add tomato and mashed eggplant and simmer until thick.", ["Lunch", "Dinner"]], ["Indian-inspired", "Cucumber raita", [["greek yogurt", 180], ["cucumber", 100], ["cumin", 1]], "Grate cucumber and squeeze out excess water. Stir into yogurt with toasted ground cumin. Chill.", ["Snack"]], ["Indian-inspired", "Mango lassi", [["mango", 150], ["greek yogurt", 150], ["milk", 100], ["cardamom", 1]], "Blend mango, yogurt, milk and cardamom until smooth. Serve cold.", ["Snack", "Breakfast"]], ["Indian-inspired", "Chicken saag", [["chicken breast", 150], ["spinach", 200], ["onion", 60], ["garlic", 5], ["garam masala", 3], ["olive oil", 8]], "Fry onion and garlic in oil. Add chicken and spices and cook to 74°C. Stir in wilted chopped spinach and simmer.", ["Lunch", "Dinner"]], ["Indian-inspired", "Kheer", [["white rice", 100], ["milk", 250], ["cardamom", 1], ["almonds", 15], ["sugar", 10]], "Simmer cooked rice in milk until creamy, stirring frequently. Add sugar and cardamom. Top with almonds.", ["Snack"]], ["Caribbean", "Jamaican steamed cabbage", [["cabbage", 250], ["carrots", 80], ["onion", 50], ["thyme", 1], ["olive oil", 8]], "Slice cabbage, carrots and onion. Soften onion in oil, add vegetables and thyme with a splash of water. Cover and steam until tender.", ["Lunch", "Dinner"]], ["Caribbean", "Trinidad tomato choka", [["tomato", 250], ["garlic", 8], ["onion", 50], ["olive oil", 8], ["bread", 80]], "Roast tomatoes and garlic until soft. Mash with finely chopped onion and hot oil. Serve with toast as a bread substitute.", ["Breakfast", "Lunch"]], ["Caribbean", "Jamaican escovitch fish", [["cod", 170], ["carrots", 80], ["onion", 60], ["bell pepper", 80], ["vinegar", 25], ["olive oil", 10]], "Pan-fry fish to 70°C. Sauté sliced vegetables briefly in oil, add vinegar and simmer. Spoon the pickled vegetables over fish.", ["Dinner", "Lunch"]], ["Caribbean", "Barbadian fish cakes", [["cod", 120], ["flour dry", 60], ["onion", 40], ["thyme", 2], ["olive oil", 10], ["egg", 50]], "Flake cooked fish and mix with flour, egg, onion, thyme and a little water. Drop spoonfuls into an oiled skillet and cook both sides until set.", ["Snack", "Lunch"]], ["Caribbean", "Coconut rice and beans", [["white rice", 180], ["kidney beans", 100], ["coconut milk", 60], ["thyme", 1], ["garlic", 5]], "Simmer cooked rice and beans with coconut milk, thyme and garlic until liquid is absorbed.", ["Lunch", "Dinner"]], ["Caribbean", "Cucumber chow", [["cucumber", 200], ["lime juice", 20], ["garlic", 3], ["cilantro", 5]], "Slice cucumber. Toss with lime, minced garlic and chopped cilantro. Chill briefly.", ["Snack"]], ["Caribbean", "Cornmeal porridge", [["cornmeal dry", 60], ["milk", 250], ["cinnamon", 1], ["sugar", 10]], "Whisk cornmeal into cold milk. Simmer while stirring until smooth and thick. Add cinnamon and sugar.", ["Breakfast"]], ["Caribbean", "Curry shrimp", [["shrimp", 180], ["onion", 60], ["garlic", 5], ["curry powder", 5], ["coconut milk", 80], ["olive oil", 5]], "Fry onion and garlic in oil, stir in curry powder with a splash of water. Add coconut milk and shrimp and simmer until opaque.", ["Dinner", "Lunch"]], ["Mexican", "Pico de gallo with chips", [["tomato", 150], ["onion", 40], ["cilantro", 8], ["lime juice", 15], ["tortilla", 60]], "Dice tomato and onion and toss with cilantro and lime. Cut tortillas into wedges and bake until crisp.", ["Snack"]], ["Mexican", "Chilaquiles verdes", [["tortilla", 90], ["salsa verde", 120], ["egg", 100], ["cheddar cheese", 25], ["olive oil", 5]], "Cut tortillas into wedges and toast with oil. Warm salsa verde, toss with wedges briefly and top with cooked eggs and cheese.", ["Breakfast"]], ["Mexican", "Tostadas de tinga", [["tortilla", 90], ["chicken breast", 150], ["onion", 60], ["tomato", 150], ["chipotle", 10], ["olive oil", 5]], "Toast tortillas until crisp. Fry onion, add tomato and chipotle and simmer. Stir in shredded cooked chicken and pile onto tostadas.", ["Lunch", "Dinner"]], ["Mexican", "Calabacitas", [["zucchini", 200], ["corn", 100], ["tomato", 100], ["onion", 50], ["cheddar cheese", 30], ["olive oil", 5]], "Fry onion and diced zucchini in oil. Add corn and tomato and cook until tender. Sprinkle cheese over the top.", ["Lunch", "Dinner"]], ["Mexican", "Sopa de frijol", [["black beans", 220], ["onion", 60], ["garlic", 5], ["cumin", 2], ["olive oil", 5], ["tortilla", 45]], "Fry onion, garlic and cumin. Add cooked beans and water, simmer and blend half the soup. Serve with toasted tortilla strips.", ["Lunch", "Dinner"]], ["Mexican", "Esquites", [["corn", 180], ["lime juice", 15], ["greek yogurt", 40], ["cheddar cheese", 20], ["chili powder", 2]], "Toast corn in a dry skillet. Toss with lime, yogurt, cheese and chili powder.", ["Snack"]], ["Italian", "Pasta aglio e olio", [["cooked spaghetti", 220], ["garlic", 10], ["olive oil", 15], ["chili powder", 1], ["parsley", 5]], "Gently fry sliced garlic in oil until pale gold. Add chili and cooked pasta with a splash of water. Toss with parsley.", ["Lunch", "Dinner"]], ["Italian", "Pasta puttanesca", [["cooked spaghetti", 200], ["tomato", 180], ["olives", 30], ["capers", 10], ["garlic", 5], ["olive oil", 8]], "Fry garlic in oil. Add tomatoes, olives and capers and simmer until thick. Toss with cooked pasta.", ["Lunch", "Dinner"]], ["Italian", "Frittata di zucchine", [["egg", 150], ["zucchini", 150], ["onion", 40], ["parmesan", 20], ["olive oil", 5]], "Sauté sliced zucchini and onion in oil. Pour in beaten eggs and parmesan. Cook gently, then finish under a grill until set.", ["Breakfast", "Lunch"]], ["Italian", "Bruschetta al pomodoro", [["bread", 80], ["tomato", 150], ["basil", 5], ["garlic", 3], ["olive oil", 8]], "Toast bread and rub with garlic. Dice tomatoes and toss with basil and oil. Spoon onto toast.", ["Snack", "Lunch"]], ["Italian", "Minestrone", [["kidney beans", 100], ["carrots", 80], ["zucchini", 100], ["tomato", 150], ["cooked spaghetti", 80], ["onion", 50], ["olive oil", 5]], "Soften onion and carrots in oil. Add zucchini, tomatoes and water and simmer. Stir in beans and chopped cooked pasta.", ["Lunch", "Dinner"]], ["Italian", "Insalata caprese", [["mozzarella", 100], ["tomato", 200], ["basil", 8], ["olive oil", 8]], "Slice mozzarella and tomatoes, alternate on a plate and finish with basil and oil.", ["Lunch", "Snack"]], ["Mediterranean", "Hummus with pita", [["chickpeas", 150], ["tahini", 20], ["lemon juice", 20], ["garlic", 4], ["pita", 60]], "Blend cooked chickpeas with tahini, lemon, garlic and water until smooth. Serve with pita.", ["Snack", "Lunch"]], ["Mediterranean", "Tabbouleh", [["bulgur cooked", 120], ["parsley", 60], ["tomato", 120], ["cucumber", 80], ["lemon juice", 25], ["olive oil", 10]], "Finely chop parsley and vegetables. Toss with cooled cooked bulgur, lemon and oil.", ["Lunch"]], ["Mediterranean", "Greek village salad", [["tomato", 180], ["cucumber", 150], ["olives", 30], ["feta", 60], ["onion", 30], ["olive oil", 10], ["oregano", 1]], "Cut vegetables into chunks. Top with olives and feta, drizzle with oil and oregano.", ["Lunch", "Dinner"]], ["Mediterranean", "Mujadara", [["lentils", 180], ["white rice", 150], ["onion", 120], ["olive oil", 10], ["cumin", 2]], "Slowly brown sliced onions in oil. Warm cooked lentils and rice with cumin and half the onions. Top with remaining onions.", ["Lunch", "Dinner"]], ["Mediterranean", "Baba ganoush", [["eggplant", 250], ["tahini", 20], ["lemon juice", 20], ["garlic", 5], ["olive oil", 5]], "Roast eggplant until collapsed. Scoop flesh and mash with tahini, lemon, garlic and oil.", ["Snack"]], ["Mediterranean", "Ful medames", [["fava beans", 220], ["lemon juice", 20], ["garlic", 5], ["cumin", 2], ["olive oil", 8], ["pita", 60]], "Warm cooked fava beans with water and mash roughly. Stir in lemon, garlic, cumin and oil. Serve with pita.", ["Breakfast", "Lunch"]], ["Japanese", "Onigiri with salmon", [["white rice", 180], ["salmon", 70], ["nori", 3]], "Flake cooked salmon. With damp hands shape warm rice around salmon into triangles. Wrap with nori.", ["Snack", "Lunch"]], ["Japanese", "Tamagoyaki", [["egg", 150], ["soy sauce", 5], ["sugar", 4], ["olive oil", 5]], "Beat eggs with soy and sugar. Pour thin layers into an oiled skillet, rolling each layer over the previous one until set.", ["Breakfast", "Snack"]], ["Japanese", "Miso soup with tofu", [["tofu", 120], ["miso", 20], ["nori", 3], ["green onion", 15]], "Heat water with tofu and nori. Remove from heat and dissolve miso in a ladle of broth, then return to pot. Top with green onion.", ["Breakfast", "Snack"]], ["Japanese", "Chicken teriyaki", [["chicken breast", 160], ["soy sauce", 20], ["sugar", 10], ["ginger", 5], ["white rice", 150]], "Cook chicken in a skillet to 74°C. Add soy, sugar and ginger with water and reduce to a glaze. Serve over rice.", ["Lunch", "Dinner"]], ["Chinese", "Garlic green beans", [["green beans", 220], ["garlic", 8], ["soy sauce", 10], ["olive oil", 8]], "Blanch beans and drain. Stir-fry in hot oil with garlic and soy until blistered and tender.", ["Lunch", "Dinner"]], ["Chinese", "Congee with egg", [["white rice", 150], ["egg", 100], ["ginger", 5], ["green onion", 15], ["soy sauce", 5]], "Simmer cooked rice with plenty of water and ginger until porridge-like. Top with fully cooked egg, green onion and soy.", ["Breakfast"]], ["Chinese", "Mapo tofu adaptation", [["tofu", 200], ["lean ground beef", 80], ["garlic", 5], ["ginger", 5], ["chili bean paste", 15], ["olive oil", 5]], "Brown beef to 71°C in oil. Fry garlic, ginger and chili bean paste. Add water and tofu cubes and simmer gently.", ["Lunch", "Dinner"]], ["Chinese", "Egg fried rice", [["white rice", 180], ["egg", 100], ["carrots", 60], ["peas", 60], ["soy sauce", 10], ["olive oil", 8]], "Scramble eggs in oil and remove. Stir-fry carrots and peas, add chilled cooked rice and soy, then return eggs and heat through.", ["Lunch", "Dinner"]], ["Korean", "Bibimbap", [["white rice", 150], ["lean ground beef", 100], ["spinach", 80], ["carrots", 60], ["egg", 50], ["gochujang", 15], ["olive oil", 5]], "Sauté vegetables separately. Brown beef to 71°C and cook egg until set. Arrange over rice and mix with gochujang.", ["Lunch", "Dinner"]], ["Korean", "Gyeran jjim", [["egg", 150], ["green onion", 15], ["soy sauce", 5]], "Whisk eggs with an equal volume of water and soy. Steam gently in a heatproof bowl until set. Top with green onion.", ["Breakfast", "Snack"]], ["Korean", "Oi muchim", [["cucumber", 200], ["garlic", 5], ["chili powder", 3], ["vinegar", 15], ["soy sauce", 8]], "Slice cucumber and toss with garlic, chili, vinegar and soy. Rest ten minutes.", ["Snack"]], ["Thai", "Pad kra pao chicken", [["chicken breast", 160], ["basil", 20], ["garlic", 8], ["chili powder", 2], ["soy sauce", 15], ["olive oil", 8], ["white rice", 150]], "Finely chop chicken. Fry garlic and chili in oil, add chicken and cook to 74°C. Add soy and basil and serve with rice.", ["Lunch", "Dinner"]], ["Thai", "Som tam adaptation", [["carrots", 150], ["cabbage", 100], ["tomato", 100], ["peanuts", 20], ["lime juice", 25], ["garlic", 5]], "Shred carrots and cabbage. Crush garlic and peanuts, toss with tomatoes and lime. Serve chilled.", ["Lunch", "Snack"]], ["Thai", "Tom kha gai", [["chicken breast", 150], ["coconut milk", 150], ["mushrooms", 100], ["ginger", 10], ["lime juice", 20]], "Simmer coconut milk with ginger and water. Add sliced chicken and mushrooms and cook chicken to 74°C. Finish with lime.", ["Lunch", "Dinner"]], ["Vietnamese", "Fresh shrimp summer rolls", [["rice paper dry", 40], ["shrimp", 120], ["lettuce", 60], ["cucumber", 80], ["carrots", 60], ["peanut butter", 20], ["lime juice", 15]], "Cook shrimp until opaque. Soften rice paper in water, fill with shrimp and sliced vegetables and roll. Thin peanut butter with lime and water for dipping.", ["Lunch", "Snack"]], ["Vietnamese", "Banh mi chicken adaptation", [["bread", 100], ["chicken breast", 130], ["carrots", 60], ["cucumber", 60], ["vinegar", 15], ["cilantro", 8]], "Quick-pickle shredded carrots in vinegar. Fill toasted bread with cooked sliced chicken, carrots, cucumber and cilantro.", ["Lunch"]], ["African", "Ghanaian red red", [["black eyed peas", 220], ["plantain", 150], ["tomato", 150], ["onion", 60], ["olive oil", 10]], "Fry onion in oil and simmer tomatoes until thick. Add cooked peas and water and simmer. Pan-fry sliced plantain and serve alongside.", ["Lunch", "Dinner"]], ["African", "Ethiopian misir wat", [["lentils", 240], ["onion", 100], ["garlic", 8], ["berbere", 5], ["olive oil", 10]], "Slowly soften onion in oil. Add garlic and berbere, then cooked lentils and water. Simmer until thick.", ["Lunch", "Dinner"]], ["African", "West African peanut stew", [["chicken breast", 150], ["sweet potato", 180], ["peanut butter", 30], ["tomato", 150], ["onion", 60], ["olive oil", 5]], "Fry onion and chicken in oil. Add tomato, diced cooked sweet potato, peanut butter and water. Simmer until chicken reaches 74°C.", ["Lunch", "Dinner"]], ["Canadian-inspired", "Blueberry pancakes", [["flour dry", 70], ["egg", 50], ["milk", 100], ["blueberries", 80], ["baking powder", 3], ["olive oil", 5]], "Whisk flour and baking powder with egg and milk. Fold in berries. Cook small pancakes in oil until both sides are golden.", ["Breakfast"]], ["Canadian-inspired", "Tuna melt", [["tuna", 120], ["bread", 80], ["cheddar cheese", 35], ["greek yogurt", 30]], "Mix tuna with yogurt. Spread on bread, top with cheese and broil until melted.", ["Lunch"]], ["Canadian-inspired", "Split pea soup", [["split peas cooked", 220], ["carrots", 80], ["onion", 60], ["celery", 60], ["olive oil", 5], ["thyme", 1]], "Soften chopped vegetables in oil. Add cooked split peas, thyme and water. Simmer until creamy.", ["Lunch", "Dinner"]], ["Canadian-inspired", "Maple baked salmon", [["salmon", 160], ["maple syrup", 15], ["soy sauce", 10], ["potato", 180], ["green beans", 120]], "Brush salmon with maple and soy and bake to 70°C. Serve with boiled potatoes and steamed beans.", ["Dinner"]], ["Canadian-inspired", "Egg salad sandwich", [["egg", 150], ["greek yogurt", 40], ["bread", 80], ["celery", 40]], "Hard-boil eggs, cool and chop. Mix with yogurt and diced celery and fill bread.", ["Lunch"]], ["Canadian-inspired", "Peanut butter banana smoothie", [["banana", 120], ["milk", 250], ["peanut butter", 25], ["protein powder", 25]], "Blend all ingredients until smooth.", ["Breakfast", "Snack"]]]);

foods.push(...[["okra", 33.0, 2.0, 7.0, 0.0, 100, 100, "okra"], ["pumpkin", 26.0, 1.0, 7.0, 0.0, 100, 100, "pumpkin"], ["roti", 297.0, 9.0, 49.0, 8.0, 100, 100, "roti|chapati"], ["ackee canned", 151.0, 3.0, 1.0, 15.0, 100, 100, "ackee"], ["salt cod", 105.0, 23.0, 0.0, 1.0, 100, 100, "salt cod|saltfish"], ["whole wheat flour", 340.0, 13.0, 72.0, 2.0, 100, 100, "whole wheat flour"], ["coconut grated", 354.0, 3.0, 15.0, 33.0, 100, 100, "grated coconut"], ["pinto beans", 143.0, 9.0, 26.0, 1.0, 100, 100, "pinto beans"], ["nopales", 16.0, 1.0, 3.0, 0.0, 100, 100, "nopales|cactus"], ["ricotta", 174.0, 11.0, 3.0, 13.0, 100, 100, "ricotta"], ["white beans", 139.0, 10.0, 25.0, 1.0, 100, 100, "white beans|cannellini beans"], ["carrot", 41.0, 1.0, 10.0, 0.0, 100, 100, "carrot|carrots"], ["honey", 304.0, 0.0, 82.0, 0.0, 100, 100, "honey"], ["walnuts", 654.0, 15.0, 14.0, 65.0, 100, 100, "walnuts|walnut"], ["black pepper", 251.0, 10.0, 64.0, 3.0, 100, 100, "black pepper"], ["dill", 43.0, 3.0, 7.0, 1.0, 100, 100, "dill"], ["lettuce", 17.0, 1.0, 3.0, 0.0, 100, 100, "lettuce|romaine"], ["sumac", 250.0, 5.0, 50.0, 5.0, 100, 100, "sumac"], ["sesame oil", 884.0, 0.0, 0.0, 100.0, 100, 100, "sesame oil"], ["cashews", 553.0, 18.0, 30.0, 44.0, 100, 100, "cashews|cashew"], ["breadcrumbs", 395.0, 13.0, 72.0, 5.0, 100, 100, "breadcrumbs|bread crumbs"], ["soba cooked", 99.0, 5.0, 21.0, 0.0, 100, 100, "soba|soba noodles"], ["kimchi", 15.0, 1.0, 2.0, 1.0, 100, 100, "kimchi"], ["beef steak", 217.0, 27.0, 0.0, 12.0, 100, 100, "beef steak|steak"], ["pear", 57.0, 0.0, 15.0, 0.0, 100, 100, "pear|pears"], ["soybean sprouts", 122.0, 13.0, 10.0, 7.0, 100, 100, "soybean sprouts"], ["pineapple", 50.0, 1.0, 13.0, 0.0, 100, 100, "pineapple"], ["fish sauce", 35.0, 5.0, 4.0, 0.0, 100, 100, "fish sauce"], ["collard greens", 32.0, 3.0, 5.0, 1.0, 100, 100, "collard greens|collards"], ["maple syrup", 260.0, 0.0, 67.0, 0.0, 100, 100, "maple syrup"], ["ground pork", 263.0, 27.0, 0.0, 17.0, 100, 100, "ground pork|minced pork"], ["cloves", 274.0, 6.0, 66.0, 13.0, 100, 100, "cloves"], ["bagel", 275.0, 10.0, 53.0, 2.0, 100, 100, "bagel|bagels"], ["smoked salmon", 117.0, 18.0, 0.0, 4.0, 100, 100, "smoked salmon|lox"], ["cream cheese", 342.0, 6.0, 4.0, 34.0, 100, 100, "cream cheese"], ["poutine", 230.0, 7.0, 25.0, 12.0, 100, 100, "poutine"], ["butter tart", 430.0, 4.0, 56.0, 21.0, 100, 100, "butter tart|butter tarts"], ["perogies", 200.0, 5.0, 34.0, 5.0, 100, 100, "perogies|pierogies|perogy"], ["ketchup chips", 530.0, 6.0, 53.0, 33.0, 100, 100, "ketchup chips"], ["nanaimo bar", 480.0, 4.0, 56.0, 27.0, 100, 100, "nanaimo bar|nanaimo bars"], ["montreal smoked meat", 190.0, 23.0, 2.0, 10.0, 100, 100, "montreal smoked meat|smoked meat"], ["pea soup", 75.0, 5.0, 12.0, 1.0, 100, 100, "pea soup|split pea soup"], ["bannock", 300.0, 7.0, 49.0, 9.0, 100, 100, "bannock"], ["donair", 230.0, 12.0, 24.0, 10.0, 100, 100, "donair|donairs"]].filter(x=>!foods.some(f=>f[0]===x[0])));
recipes.push(...[["Caribbean", "Trinidad doubles adaptation", [["chickpea flour", 65.0], ["chickpeas", 150.0], ["curry powder", 4.0], ["cumin", 2.0], ["olive oil", 8.0]], "Mix flour with water and cumin into a batter; cook two thin rounds in oil. Simmer chickpeas with curry powder and water until thick; sandwich between rounds.", ["Lunch", "Snack"]], ["Caribbean", "Jamaican brown stew chicken", [["chicken breast", 160.0], ["onion", 60.0], ["tomato", 100.0], ["thyme", 2.0], ["soy sauce", 10.0], ["olive oil", 8.0], ["white rice", 150.0]], "Brown chicken in oil; add onion, tomato, thyme and soy sauce. Cover with a splash of water and simmer until chicken reaches 74\u00b0C. Serve with rice.", ["Dinner"]], ["Caribbean", "Trinidad curry chicken", [["chicken breast", 160.0], ["potato", 180.0], ["curry powder", 6.0], ["garlic", 8.0], ["onion", 60.0], ["olive oil", 8.0]], "Toast curry powder in oil with garlic and onion; add chicken and potato, cover with water and simmer until tender and chicken reaches 74\u00b0C.", ["Dinner"]], ["Caribbean", "Jamaican banana fritters", [["banana", 130.0], ["flour dry", 55.0], ["cinnamon", 2.0], ["baking powder", 2.0], ["olive oil", 8.0]], "Mash banana and mix with flour, cinnamon and baking powder. Drop spoonfuls into oiled skillet and cook both sides until set.", ["Breakfast", "Snack"]], ["Caribbean", "Bajan cou cou and fish adaptation", [["cornmeal dry", 65.0], ["okra", 100.0], ["cod", 160.0], ["tomato", 120.0], ["onion", 50.0], ["thyme", 2.0], ["olive oil", 5.0]], "Simmer sliced okra in water; whisk in cornmeal and stir until thick. Stew cod with tomato, onion, thyme and oil until fish reaches 70\u00b0C. Serve together.", ["Dinner"]], ["Caribbean", "Jamaican pumpkin soup", [["pumpkin", 250.0], ["chicken breast", 120.0], ["potato", 100.0], ["thyme", 2.0], ["onion", 50.0], ["garlic", 5.0]], "Simmer pumpkin, potato, onion, garlic and thyme in water until soft. Add diced chicken and cook to 74\u00b0C; mash some pumpkin to thicken.", ["Lunch", "Dinner"]], ["Caribbean", "Trinidad baigan choka", [["eggplant", 250.0], ["garlic", 8.0], ["onion", 40.0], ["olive oil", 8.0], ["roti", 80.0]], "Roast eggplant until collapsed; scoop flesh and mash with garlic, chopped onion and hot oil. Serve with roti.", ["Lunch"]], ["Caribbean", "Jamaican ackee and saltfish", [["ackee canned", 120.0], ["salt cod", 100.0], ["onion", 60.0], ["tomato", 80.0], ["bell pepper", 60.0], ["thyme", 1.0], ["olive oil", 5.0]], "Soak and rinse salt cod according to package directions; simmer until cooked and flake. Saut\u00e9 onion, tomato and pepper with thyme; gently fold in drained commercially canned ackee and fish and heat through.", ["Breakfast", "Lunch"]], ["Indian-inspired", "Aloo paratha", [["whole wheat flour", 75.0], ["potato", 160.0], ["cumin", 2.0], ["garam masala", 2.0], ["olive oil", 8.0], ["greek yogurt", 100.0]], "Knead flour with water; mash cooked potato with spices. Enclose filling in dough, roll flat and cook on oiled griddle on both sides. Serve with yogurt.", ["Breakfast", "Lunch"]], ["Indian-inspired", "Matar paneer", [["paneer", 120.0], ["peas", 130.0], ["tomato", 180.0], ["onion", 60.0], ["garam masala", 4.0], ["ginger", 8.0], ["olive oil", 5.0]], "Saut\u00e9 onion and ginger; add tomato and garam masala and simmer to a sauce. Add peas and paneer cubes and heat through.", ["Dinner"]], ["Indian-inspired", "Bhindi masala", [["okra", 250.0], ["onion", 70.0], ["tomato", 100.0], ["cumin", 2.0], ["turmeric", 1.0], ["olive oil", 8.0], ["roti", 80.0]], "Dry okra thoroughly and slice. Fry with cumin until lightly browned; add onion, tomato and turmeric and cook uncovered until tender. Serve with roti.", ["Lunch", "Dinner"]], ["Indian-inspired", "Chicken biryani adaptation", [["chicken breast", 160.0], ["white rice", 180.0], ["greek yogurt", 60.0], ["onion", 70.0], ["garam masala", 5.0], ["ginger", 8.0], ["olive oil", 8.0]], "Marinate chicken in yogurt, ginger and spices. Brown onion in oil, add chicken and cook to 74\u00b0C. Layer with cooked rice, cover and steam briefly.", ["Dinner"]], ["Indian-inspired", "Masoor dal", [["lentils", 230.0], ["onion", 60.0], ["tomato", 100.0], ["garlic", 8.0], ["turmeric", 2.0], ["cumin", 2.0], ["olive oil", 5.0]], "Simmer cooked lentils with tomato and turmeric. Fry onion, garlic and cumin in oil and stir into lentils.", ["Lunch", "Dinner"]], ["Indian-inspired", "Dahi aloo", [["potato", 230.0], ["greek yogurt", 150.0], ["cumin", 2.0], ["turmeric", 1.0], ["ginger", 5.0], ["olive oil", 5.0]], "Boil potatoes. Toast cumin and ginger in oil, add turmeric and potatoes. Remove from heat and stir in whisked yogurt; warm gently without boiling.", ["Lunch"]], ["Indian-inspired", "Coconut chutney", [["coconut grated", 45.0], ["greek yogurt", 60.0], ["ginger", 5.0], ["cumin", 1.0], ["cilantro", 10.0]], "Blend coconut, yogurt, ginger, cumin and cilantro with a little water until spoonable.", ["Snack"]], ["Mexican", "Sopa de tortilla", [["chicken breast", 120.0], ["tomato", 200.0], ["tortilla", 60.0], ["onion", 50.0], ["garlic", 5.0], ["chipotle", 5.0], ["avocado", 40.0]], "Blend tomato, onion, garlic and chipotle with water; simmer. Add chicken and cook to 74\u00b0C. Toast tortilla strips and serve over soup with avocado.", ["Lunch", "Dinner"]], ["Mexican", "Pescado a la Veracruzana", [["cod", 170.0], ["tomato", 200.0], ["olives", 25.0], ["capers", 10.0], ["onion", 60.0], ["garlic", 5.0], ["olive oil", 8.0]], "Saut\u00e9 onion and garlic; simmer tomato, olives and capers. Nestle fish in sauce, cover and cook to 70\u00b0C.", ["Dinner"]], ["Mexican", "Frijoles de la olla", [["pinto beans", 220.0], ["onion", 60.0], ["garlic", 6.0], ["cilantro", 10.0], ["tortilla", 60.0]], "Simmer cooked pinto beans with onion and garlic in water until creamy. Finish with cilantro and serve with tortillas.", ["Lunch", "Dinner"]], ["Mexican", "Nopales and eggs", [["nopales", 150.0], ["egg", 150.0], ["onion", 50.0], ["tomato", 80.0], ["olive oil", 5.0]], "Boil cleaned diced nopales and drain. Saut\u00e9 onion and tomato, add nopales and beaten eggs and scramble until set.", ["Breakfast"]], ["Mexican", "Chicken enchiladas verdes", [["chicken breast", 150.0], ["tortilla", 90.0], ["salsa verde", 120.0], ["mozzarella", 35.0], ["onion", 30.0]], "Fill tortillas with cooked shredded chicken, roll and cover with salsa verde and cheese. Bake at 190\u00b0C until bubbling; top with onion.", ["Dinner"]], ["Mexican", "Guacamole with tortilla chips", [["avocado", 100.0], ["tomato", 50.0], ["onion", 20.0], ["lime juice", 15.0], ["cilantro", 8.0], ["tortilla", 50.0]], "Mash avocado with chopped tomato, onion, cilantro and lime. Cut tortillas into wedges and bake until crisp.", ["Snack"]], ["Italian", "Pasta alla Norma", [["cooked spaghetti", 180.0], ["eggplant", 180.0], ["tomato pasta sauce", 150.0], ["olive oil", 8.0], ["ricotta", 60.0], ["basil", 5.0]], "Roast cubed eggplant with oil until golden. Toss cooked pasta with warm tomato sauce and eggplant; finish with ricotta and basil.", ["Dinner"]], ["Italian", "Chicken cacciatore", [["chicken breast", 170.0], ["tomato", 200.0], ["bell pepper", 100.0], ["onion", 60.0], ["olives", 25.0], ["oregano", 2.0], ["olive oil", 8.0]], "Brown chicken in oil. Add onion, pepper, tomato, olives and oregano; cover and simmer until chicken reaches 74\u00b0C.", ["Dinner"]], ["Italian", "Ribollita", [["white beans", 170.0], ["cabbage", 100.0], ["carrot", 80.0], ["celery", 50.0], ["tomato", 100.0], ["bread", 60.0], ["olive oil", 8.0]], "Simmer vegetables and cooked beans in water until tender. Stir in torn bread and simmer until thick; finish with oil.", ["Lunch", "Dinner"]], ["Italian", "Panzanella", [["bread", 90.0], ["tomato", 200.0], ["cucumber", 100.0], ["onion", 30.0], ["basil", 8.0], ["olive oil", 10.0], ["vinegar", 10.0]], "Toast bread cubes; toss with chopped vegetables, basil, oil and vinegar. Rest ten minutes before serving.", ["Lunch"]], ["Italian", "Ricotta and honey toast", [["bread", 70.0], ["ricotta", 120.0], ["honey", 12.0], ["walnuts", 15.0]], "Toast bread, spread ricotta and drizzle honey; top with chopped walnuts.", ["Breakfast", "Snack"]], ["Italian", "Pasta al limone", [["cooked spaghetti", 180.0], ["lemon juice", 25.0], ["parmesan", 30.0], ["olive oil", 8.0], ["black pepper", 1.0]], "Warm pasta with a splash of water, oil and lemon. Remove from heat and toss with parmesan and pepper until creamy.", ["Lunch", "Dinner"]], ["Mediterranean", "Greek lemon potatoes", [["potato", 260.0], ["lemon juice", 30.0], ["olive oil", 12.0], ["oregano", 2.0], ["garlic", 6.0]], "Toss potato wedges with lemon, oil, oregano and garlic. Roast at 210\u00b0C until golden and tender.", ["Lunch", "Dinner"]], ["Mediterranean", "Spanakorizo", [["white rice", 180.0], ["spinach", 200.0], ["onion", 60.0], ["lemon juice", 20.0], ["olive oil", 8.0], ["dill", 5.0]], "Saut\u00e9 onion and spinach in oil. Fold in cooked rice and dill with a splash of water; simmer briefly and finish with lemon.", ["Lunch", "Dinner"]], ["Mediterranean", "Turkish menemen", [["egg", 150.0], ["tomato", 180.0], ["bell pepper", 100.0], ["olive oil", 8.0], ["black pepper", 1.0], ["bread", 60.0]], "Saut\u00e9 chopped pepper, add tomato and simmer until thick. Stir in eggs and cook until set. Serve with bread.", ["Breakfast"]], ["Mediterranean", "Lebanese fattoush", [["pita", 80.0], ["cucumber", 100.0], ["tomato", 150.0], ["lettuce", 80.0], ["parsley", 10.0], ["sumac", 3.0], ["lemon juice", 20.0], ["olive oil", 10.0]], "Toast pita pieces. Chop vegetables and herbs, toss with lemon, oil and sumac, and add crisp pita just before serving.", ["Lunch"]], ["Mediterranean", "Turkish mercimek soup", [["lentils", 220.0], ["carrot", 100.0], ["onion", 60.0], ["cumin", 2.0], ["olive oil", 5.0], ["lemon juice", 20.0]], "Simmer cooked lentils, carrot and onion in water until soft. Blend with cumin and oil and finish with lemon.", ["Lunch", "Dinner"]], ["Mediterranean", "Greek tzatziki", [["greek yogurt", 200.0], ["cucumber", 100.0], ["garlic", 4.0], ["dill", 5.0], ["lemon juice", 10.0], ["pita", 50.0]], "Grate cucumber and squeeze dry. Mix with yogurt, garlic, dill and lemon. Serve chilled with pita.", ["Snack"]], ["Chinese", "Steamed ginger fish", [["cod", 170.0], ["ginger", 15.0], ["green onion", 25.0], ["soy sauce", 12.0], ["olive oil", 5.0], ["white rice", 150.0]], "Steam fish with ginger until it reaches 70\u00b0C. Top with green onion, soy sauce and warmed oil; serve with rice.", ["Dinner"]], ["Chinese", "Chinese smashed cucumber", [["cucumber", 250.0], ["garlic", 8.0], ["soy sauce", 12.0], ["vinegar", 15.0], ["sesame oil", 5.0]], "Smash cucumber and cut into chunks. Toss with garlic, soy, vinegar and sesame oil; chill briefly.", ["Snack"]], ["Chinese", "Chicken and cashew stir fry", [["chicken breast", 150.0], ["cashews", 30.0], ["bell pepper", 100.0], ["onion", 60.0], ["soy sauce", 12.0], ["ginger", 6.0], ["olive oil", 5.0], ["white rice", 130.0]], "Stir-fry chicken in oil to 74\u00b0C; add vegetables, ginger and cashews. Toss with soy sauce and serve over rice.", ["Dinner"]], ["Chinese", "Scallion pancakes", [["flour dry", 85.0], ["green onion", 40.0], ["sesame oil", 8.0], ["olive oil", 5.0]], "Mix flour with hot water and knead. Roll thin, brush with sesame oil and scallions, coil and flatten. Pan-fry in oil until crisp.", ["Breakfast", "Snack"]], ["Japanese", "Chicken katsu adaptation", [["chicken breast", 160.0], ["egg", 50.0], ["breadcrumbs", 40.0], ["flour dry", 15.0], ["olive oil", 8.0], ["cabbage", 100.0], ["white rice", 130.0]], "Coat chicken in flour, egg and crumbs. Bake on oiled tray at 210\u00b0C until crisp and 74\u00b0C inside. Serve with shredded cabbage and rice.", ["Dinner"]], ["Japanese", "Soba noodle salad", [["soba cooked", 200.0], ["cucumber", 100.0], ["carrot", 70.0], ["soy sauce", 12.0], ["sesame oil", 6.0], ["vinegar", 10.0], ["green onion", 15.0]], "Rinse cooked soba under cold water. Toss with sliced vegetables and dressing of soy, sesame oil and vinegar.", ["Lunch"]], ["Japanese", "Japanese curry rice adaptation", [["chicken breast", 150.0], ["potato", 130.0], ["carrot", 100.0], ["onion", 70.0], ["curry powder", 6.0], ["flour dry", 12.0], ["olive oil", 8.0], ["white rice", 150.0]], "Brown chicken and onion; add vegetables and water and simmer until tender and chicken reaches 74\u00b0C. Toast flour and curry in oil, whisk into stew and serve over rice.", ["Dinner"]], ["Korean", "Kimchi fried rice", [["white rice", 180.0], ["kimchi", 100.0], ["egg", 100.0], ["green onion", 20.0], ["gochujang", 10.0], ["sesame oil", 6.0]], "Fry chopped kimchi in sesame oil, add rice and gochujang and heat thoroughly. Top with eggs cooked until set and scallions.", ["Lunch", "Dinner"]], ["Korean", "Bulgogi adaptation", [["beef steak", 160.0], ["soy sauce", 15.0], ["pear", 60.0], ["garlic", 6.0], ["sesame oil", 5.0], ["onion", 60.0], ["white rice", 150.0]], "Marinate thin beef slices with grated pear, soy, garlic and sesame oil. Sear with onion until cooked; serve with rice.", ["Dinner"]], ["Korean", "Kongnamul muchim", [["soybean sprouts", 200.0], ["garlic", 5.0], ["sesame oil", 6.0], ["green onion", 20.0], ["soy sauce", 8.0]], "Boil sprouts until thoroughly cooked, drain and toss with garlic, sesame oil, scallion and soy sauce.", ["Snack"]], ["Thai", "Thai basil tofu", [["tofu", 200.0], ["basil", 15.0], ["garlic", 8.0], ["soy sauce", 12.0], ["bell pepper", 100.0], ["olive oil", 8.0], ["white rice", 150.0]], "Brown tofu in oil. Stir-fry garlic and pepper, add soy and tofu, then fold in basil off heat. Serve with rice.", ["Dinner"]], ["Thai", "Thai pineapple fried rice", [["white rice", 180.0], ["shrimp", 140.0], ["pineapple", 100.0], ["egg", 50.0], ["cashews", 20.0], ["curry powder", 3.0], ["olive oil", 5.0]], "Stir-fry shrimp until opaque, scramble egg, add rice, pineapple, curry and cashews and heat thoroughly.", ["Lunch", "Dinner"]], ["Vietnamese", "Vietnamese caramel fish adaptation", [["cod", 170.0], ["sugar", 10.0], ["fish sauce", 12.0], ["ginger", 8.0], ["green onion", 20.0], ["white rice", 150.0]], "Melt sugar with a little water until amber; carefully add fish sauce and water. Simmer fish with ginger in sauce until 70\u00b0C; top with scallions and serve with rice.", ["Dinner"]], ["Vietnamese", "Vietnamese chicken cabbage salad", [["chicken breast", 150.0], ["cabbage", 180.0], ["carrot", 70.0], ["lime juice", 25.0], ["fish sauce", 10.0], ["peanuts", 20.0], ["cilantro", 10.0]], "Shred cooked chicken and vegetables. Toss with lime, fish sauce and cilantro; top with crushed peanuts.", ["Lunch"]], ["African", "Nigerian jollof rice adaptation", [["white rice", 180.0], ["tomato", 200.0], ["bell pepper", 100.0], ["onion", 60.0], ["thyme", 2.0], ["curry powder", 3.0], ["olive oil", 8.0], ["chicken breast", 150.0]], "Blend tomato and pepper; fry onion and spices in oil and reduce sauce. Fold in cooked rice and serve with chicken cooked to 74\u00b0C.", ["Dinner"]], ["African", "Ethiopian gomen", [["collard greens", 220.0], ["onion", 70.0], ["garlic", 8.0], ["ginger", 8.0], ["olive oil", 8.0]], "Saut\u00e9 onion, garlic and ginger; add finely sliced greens and a splash of water. Cover and simmer until tender.", ["Lunch", "Dinner"]], ["African", "Moroccan carrot salad", [["carrot", 250.0], ["cumin", 2.0], ["lemon juice", 20.0], ["olive oil", 8.0], ["parsley", 10.0]], "Boil sliced carrots until tender; drain and toss warm with cumin, lemon, oil and parsley.", ["Snack", "Lunch"]], ["Canadian-inspired", "Maple overnight oats", [["oats dry", 60.0], ["milk", 150.0], ["greek yogurt", 120.0], ["maple syrup", 15.0], ["blueberries", 80.0]], "Mix all ingredients in a covered container and refrigerate overnight.", ["Breakfast"]], ["Canadian-inspired", "Tourtiere inspired skillet", [["ground pork", 150.0], ["potato", 200.0], ["onion", 60.0], ["cinnamon", 1.0], ["cloves", 1.0], ["olive oil", 5.0]], "Brown ground pork with onion and spices until 71\u00b0C. Fold in diced boiled potatoes and cook until golden.", ["Dinner"]], ["Canadian-inspired", "Smoked salmon bagel", [["bagel", 95.0], ["smoked salmon", 90.0], ["cream cheese", 35.0], ["cucumber", 60.0], ["dill", 5.0]], "Toast bagel, spread cream cheese and layer smoked salmon, cucumber and dill.", ["Breakfast", "Lunch"]], ["Canadian-inspired", "Turkey chili", [["turkey", 150.0], ["kidney beans", 150.0], ["tomato", 200.0], ["onion", 60.0], ["chili powder", 5.0], ["olive oil", 5.0]], "Brown ground turkey in oil to 74\u00b0C. Add onion, chili powder, tomatoes and cooked beans; simmer until thick.", ["Dinner"]], ["Canadian-inspired", "Banana oat muffins", [["banana", 120.0], ["oats dry", 60.0], ["egg", 50.0], ["milk", 60.0], ["baking powder", 3.0], ["cinnamon", 2.0]], "Mash banana and mix with remaining ingredients. Divide into muffin cups and bake at 180\u00b0C until set, about 20 minutes.", ["Breakfast", "Snack"]], ["Canadian-inspired", "Chicken Caesar salad adaptation", [["chicken breast", 150.0], ["lettuce", 180.0], ["bread", 50.0], ["parmesan", 25.0], ["greek yogurt", 60.0], ["lemon juice", 15.0], ["garlic", 4.0]], "Toast bread cubes. Toss lettuce with yogurt, lemon and garlic; add cooked sliced chicken, croutons and parmesan.", ["Lunch", "Dinner"]]]);
recipes.push(...[["Caribbean", "Jamaican cabbage and saltfish", [["salt cod", 100], ["cabbage", 200], ["onion", 50], ["tomato", 80], ["olive oil", 5], ["thyme", 1]], "Soak and rinse salt cod until pleasantly salted, simmer until cooked and flake. Soften onion and tomato in oil, add cabbage and thyme, cover until tender, then fold in fish.", ["Breakfast", "Lunch"]], ["Caribbean", "Trinidad sada roti and pumpkin", [["roti", 100], ["pumpkin", 220], ["garlic", 5], ["onion", 50], ["cumin", 2], ["olive oil", 5]], "Soften onion and garlic in oil with cumin. Add diced pumpkin and a splash of water, cover until soft, then mash lightly. Serve with warmed roti.", ["Breakfast", "Lunch"]], ["Caribbean", "Jamaican coconut rundown fish", [["cod", 170], ["coconut milk", 100], ["onion", 60], ["tomato", 100], ["thyme", 2], ["white rice", 120]], "Simmer coconut milk with onion, tomato and thyme until reduced. Add fish and simmer gently until it reaches 70°C. Serve with rice.", ["Dinner"]], ["Caribbean", "Trinidad geera chicken", [["chicken thighs skinless", 170], ["cumin", 5], ["garlic", 8], ["cilantro", 10], ["olive oil", 5], ["white rice", 130]], "Toast cumin in oil, add garlic and chicken pieces. Add a splash of water and simmer until chicken reaches 74°C. Finish with cilantro and serve with rice.", ["Dinner", "Lunch"]], ["Caribbean", "Bajan steamed flying fish style cod", [["cod", 180], ["onion", 60], ["tomato", 100], ["thyme", 2], ["lime juice", 15], ["olive oil", 5], ["cornmeal dry", 60]], "Cook cornmeal with water until smooth and thick. Soften onion and tomato in oil, add thyme and lime, lay fish on top and cover until cooked to 70°C. Serve over cornmeal.", ["Dinner"]], ["Indian-inspired", "Lemon rice", [["white rice", 200], ["peanuts", 25], ["turmeric", 1], ["cumin", 2], ["lime juice", 20], ["olive oil", 5]], "Toast peanuts and cumin in oil. Add turmeric and cooked rice, toss until hot and finish with citrus juice.", ["Lunch"]], ["Indian-inspired", "Jeera rice and dal", [["white rice", 150], ["lentils", 180], ["cumin", 4], ["garlic", 5], ["olive oil", 8], ["turmeric", 1]], "Simmer cooked lentils with turmeric and water. Toast cumin and garlic in oil, stir half into the dal and toss the rest with hot rice.", ["Lunch", "Dinner"]], ["Indian-inspired", "Paneer bhurji", [["paneer", 130], ["onion", 60], ["tomato", 100], ["turmeric", 1], ["cumin", 2], ["olive oil", 5], ["roti", 60]], "Soften onion with cumin in oil. Add tomato and turmeric and cook until thick. Crumble paneer into the pan and warm through. Serve with roti.", ["Breakfast", "Lunch"]], ["Indian-inspired", "Cabbage poriyal", [["cabbage", 220], ["coconut grated", 25], ["cumin", 2], ["turmeric", 1], ["olive oil", 5], ["lentils", 130]], "Toast cumin in oil, add shredded cabbage and turmeric and cook covered until tender. Stir in coconut and serve with warmed lentils.", ["Lunch"]], ["Indian-inspired", "Chicken pepper fry", [["chicken breast", 170], ["onion", 80], ["black pepper", 4], ["garlic", 8], ["cumin", 2], ["olive oil", 8], ["white rice", 130]], "Fry onion and garlic until golden. Add cumin, crushed pepper and chicken pieces. Cook with a splash of water until chicken reaches 74°C and sauce is nearly dry. Serve with rice.", ["Dinner"]], ["Mexican", "Tacos de papa", [["potato", 220], ["tortilla", 90], ["olive oil", 8], ["cabbage", 60], ["salsa", 60]], "Mash boiled potatoes, fill tortillas and fold. Pan-crisp in oil on both sides. Top with shredded cabbage and salsa.", ["Lunch"]], ["Mexican", "Molletes", [["bread", 90], ["pinto beans", 130], ["cheddar cheese", 35], ["salsa", 50]], "Mash warmed beans and spread on split bread. Top with cheese and broil until melted. Spoon salsa over the top.", ["Breakfast", "Lunch"]], ["Mexican", "Sopa de fideo", [["cooked spaghetti", 160], ["tomato", 180], ["onion", 50], ["garlic", 5], ["olive oil", 5], ["chicken breast", 100]], "Blend tomato, onion and garlic with water. Simmer in oil, add broken cooked noodles and cooked chicken and heat through.", ["Lunch", "Dinner"]], ["Mexican", "Tacos de champiñones", [["mushrooms", 220], ["tortilla", 90], ["onion", 50], ["garlic", 5], ["olive oil", 8], ["cilantro", 10], ["salsa", 50]], "Sauté sliced mushrooms over high heat until browned. Add onion and garlic, cook until soft, then fill warm tortillas and top with cilantro and salsa.", ["Lunch", "Dinner"]], ["Italian", "Pasta e fagioli", [["pasta", 150], ["white beans", 160], ["tomato", 150], ["celery", 50], ["garlic", 5], ["olive oil", 5]], "Soften celery and garlic in oil. Add tomato, beans and water and simmer. Stir in cooked pasta and heat through.", ["Lunch", "Dinner"]], ["Italian", "Peperonata", [["bell pepper", 220], ["onion", 80], ["tomato", 150], ["olive oil", 10], ["bread", 80]], "Slice peppers and onions, soften slowly in oil, add tomatoes and simmer until silky. Serve with toasted bread.", ["Lunch"]], ["Italian", "Pollo alla pizzaiola", [["chicken breast", 170], ["tomato", 200], ["garlic", 5], ["oregano", 2], ["olive oil", 5], ["pasta", 130]], "Simmer garlic, tomatoes and oregano in oil. Add chicken and cover until it reaches 74°C. Serve with cooked pasta.", ["Dinner"]], ["Italian", "Pasta con broccoli", [["pasta", 180], ["broccoli", 200], ["garlic", 8], ["olive oil", 8], ["parmesan", 20]], "Steam broccoli until soft. Sauté garlic in oil, add broccoli and crush lightly. Toss with hot pasta and parmesan.", ["Dinner", "Lunch"]], ["Mediterranean", "Greek gigantes style beans", [["white beans", 220], ["tomato", 180], ["onion", 60], ["garlic", 5], ["olive oil", 10], ["parsley", 10]], "Soften onion and garlic in oil. Add tomato and cooked beans, transfer to a baking dish and bake at 190°C until bubbling and thick. Finish with parsley.", ["Dinner", "Lunch"]], ["Mediterranean", "Turkish cacik", [["greek yogurt", 180], ["cucumber", 120], ["garlic", 3], ["dill", 3], ["olive oil", 3]], "Grate cucumber, squeeze out excess water and mix with yogurt, crushed garlic and dill. Drizzle with oil and chill.", ["Snack"]], ["Mediterranean", "Lebanese batata harra", [["potato", 250], ["garlic", 8], ["cilantro", 15], ["olive oil", 10], ["lime juice", 15], ["chili powder", 2]], "Roast cubed potatoes with oil at 220°C until crisp. Toss with garlic, cilantro, chili and lime while hot.", ["Lunch"]], ["Mediterranean", "Turkish chicken kebab", [["chicken breast", 170], ["greek yogurt", 80], ["garlic", 5], ["lemon juice", 15], ["cumin", 2], ["olive oil", 5], ["pita", 80]], "Marinate chicken in yogurt, garlic, lemon and cumin in the fridge. Thread onto skewers and grill with oil until 74°C. Serve with pita.", ["Dinner"]], ["Chinese", "Egg drop soup", [["egg", 100], ["green onion", 15], ["ginger", 5], ["soy sauce", 8], ["tofu", 100]], "Simmer ginger and soy sauce in water. Add diced tofu, then drizzle beaten egg into the gently bubbling soup until set. Top with green onion.", ["Lunch", "Snack"]], ["Chinese", "Garlic eggplant", [["eggplant", 250], ["garlic", 10], ["ginger", 5], ["soy sauce", 15], ["vinegar", 10], ["olive oil", 8], ["white rice", 150]], "Steam eggplant until tender. Stir-fry garlic and ginger in oil, add eggplant, soy and vinegar and toss until glazed. Serve over rice.", ["Dinner", "Lunch"]], ["Chinese", "Beef and broccoli", [["beef steak", 160], ["broccoli", 200], ["ginger", 5], ["garlic", 5], ["soy sauce", 15], ["olive oil", 8], ["white rice", 140]], "Slice beef thinly and stir-fry in oil until cooked. Add broccoli, ginger and garlic, splash in water and soy, and cook until broccoli is tender-crisp. Serve with rice.", ["Dinner"]], ["Japanese", "Hiyayakko", [["tofu", 200], ["green onion", 15], ["ginger", 5], ["soy sauce", 10]], "Drain ready-to-eat silken tofu and chill. Top with finely grated ginger, sliced green onion and soy sauce.", ["Snack", "Lunch"]], ["Japanese", "Gyudon", [["beef steak", 150], ["onion", 100], ["soy sauce", 15], ["sugar", 5], ["white rice", 170], ["ginger", 5]], "Simmer sliced onion and ginger with soy, sugar and water. Add thinly sliced beef and simmer until cooked. Spoon over rice.", ["Dinner"]], ["Japanese", "Sake shioyaki", [["salmon", 170], ["white rice", 150], ["cucumber", 100], ["lemon juice", 10]], "Lightly salt salmon and broil until it reaches 70°C. Serve with rice, sliced cucumber and lemon.", ["Dinner"]], ["Korean", "Dubu jorim", [["tofu", 220], ["soy sauce", 15], ["gochujang", 10], ["garlic", 5], ["green onion", 20], ["sesame oil", 5], ["white rice", 130]], "Pan-sear tofu slices in sesame oil. Add soy, gochujang, garlic and a little water and simmer until glazed. Top with green onion and serve with rice.", ["Lunch", "Dinner"]], ["Korean", "Kimchi jjigae adaptation", [["kimchi", 180], ["tofu", 150], ["ground pork", 100], ["gochujang", 10], ["green onion", 20], ["white rice", 130]], "Brown pork until cooked, add kimchi and gochujang, cover with water and simmer. Add tofu and simmer five minutes. Top with green onion and serve with rice.", ["Dinner"]], ["Thai", "Larb chicken", [["chicken breast", 170], ["lime juice", 25], ["fish sauce", 10], ["onion", 50], ["cilantro", 15], ["chili powder", 2], ["white rice", 120]], "Finely chop chicken and cook with a splash of water until 74°C. Toss off heat with lime, fish sauce, sliced onion, chili and cilantro. Serve with rice.", ["Lunch", "Dinner"]], ["Thai", "Thai cucumber salad", [["cucumber", 180], ["peanuts", 20], ["vinegar", 15], ["sugar", 5], ["chili powder", 1]], "Dissolve sugar in vinegar, toss with sliced cucumber and chili, and top with crushed peanuts.", ["Snack"]], ["Vietnamese", "Goi ga", [["chicken breast", 150], ["cabbage", 180], ["carrots", 60], ["lime juice", 20], ["fish sauce", 10], ["sugar", 5], ["cilantro", 15]], "Shred cooked chicken and cabbage, grate carrots. Whisk lime, fish sauce and sugar, toss with chicken and vegetables and finish with cilantro.", ["Lunch"]], ["African", "Moroccan zaalouk", [["eggplant", 220], ["tomato", 180], ["garlic", 8], ["cumin", 3], ["olive oil", 10], ["pita", 80]], "Simmer diced eggplant and tomato with garlic, cumin and oil until soft. Mash and reduce until thick. Serve with pita.", ["Lunch"]], ["African", "Ethiopian tikil gomen", [["cabbage", 200], ["potato", 180], ["carrots", 80], ["onion", 60], ["turmeric", 2], ["olive oil", 8]], "Soften onion and turmeric in oil, add carrots and potatoes with water and simmer. Add cabbage, cover and cook until all vegetables are tender.", ["Lunch", "Dinner"]], ["Canadian-inspired", "Maple glazed chicken", [["chicken breast", 170], ["maple syrup", 15], ["olive oil", 5], ["potato", 200], ["green beans", 120]], "Brush chicken with maple syrup and oil. Roast with potatoes until chicken reaches 74°C. Steam green beans and serve.", ["Dinner"]], ["Canadian-inspired", "Apple walnut yogurt", [["greek yogurt", 200], ["apple", 130], ["walnuts", 20], ["cinnamon", 2]], "Dice apple and fold into yogurt with cinnamon. Top with chopped walnuts.", ["Breakfast", "Snack"]], ["Canadian-inspired", "Salmon chowder", [["salmon", 150], ["potato", 180], ["milk", 200], ["onion", 50], ["celery", 60], ["butter", 8]], "Soften onion and celery in butter, add diced potatoes and water and simmer until tender. Add milk and salmon pieces and gently simmer until fish reaches 70°C.", ["Dinner", "Lunch"]], ["Canadian-inspired", "Turkey breakfast hash", [["turkey", 120], ["potato", 180], ["bell pepper", 80], ["onion", 50], ["egg", 50], ["olive oil", 5]], "Brown diced cooked potato, onion and pepper in oil. Add cooked turkey and heat through. Crack egg over hash and cook until set.", ["Breakfast"]]]);
let recipeServings=1; let cuisine='All cuisines',mealBudget='meal',mealType='Auto',rotation=0,calendarOffset=0;
function autoMeal(){let h=new Date().getHours();return h>=5&&h<11?'Breakfast':h>=11&&h<15?'Lunch':h>=17&&h<22?'Dinner':'Snack'}
function activeMeal(){return mealType==='Auto'?autoMeal():mealType}
const quickRecipeStart = recipes.length;
recipes.push(
  ['Everyday','Hard-boiled eggs',[['egg',100]],
    'Cover the eggs with water and bring it to a boil. Turn off the heat, cover the pan and let the eggs sit for 10 minutes. Cool the eggs in ice water, then peel. The whites and yolks should be firm.', ['Breakfast','Snack']],
  ['Everyday','Eggs and toast',[['egg',100],['bread',70],['olive oil',5]],
    'Toast the bread. Beat the eggs, then stir them in a skillet with the oil until set. Serve with the toast.', ['Breakfast','Lunch']],
  ['Everyday','Greek yogurt and banana',[['greek yogurt',175],['banana',100]],
    'Spoon the yogurt into a bowl. Slice the banana over it.', ['Breakfast','Snack']],
  ['Everyday','Apple and peanut butter',[['apple',150],['peanut butter',24]],
    'Slice the apple and serve with peanut butter for dipping.', ['Breakfast','Snack']],
  ['Everyday','Peanut butter and banana toast',[['bread',70],['banana',80],['peanut butter',24]],
    'Toast the bread and spread on the peanut butter. Top with sliced banana.', ['Breakfast','Snack']],
  ['Everyday','Tuna and cucumber wrap',[['tortilla',65],['tuna',100],['cucumber',75],['greek yogurt',40]],
    'Drain the canned tuna and mix it with the yogurt. Add the tuna and sliced cucumber to the tortilla, then roll it up.', ['Lunch','Dinner']],
  ['Everyday','Salsa bean bowl',[['black beans',130],['white rice',140],['salsa',45]],
    'Heat the cooked rice and drained canned beans. Spoon the salsa over the bowl.', ['Lunch','Dinner']],
  ['Everyday','Chickpea and cucumber salad',[['chickpeas',160],['cucumber',100],['tomato',100],['olive oil',10]],
    'Drain and rinse the canned chickpeas. Chop the cucumber and tomato. Toss everything with the olive oil.', ['Lunch','Dinner']],
  ['Everyday','Beef and salsa rice bowl',[['lean ground beef',130],['white rice',140],['salsa',50]],
    'Brown the ground beef in a skillet, breaking it up as it cooks. Warm the cooked rice and serve it with the cooked beef and salsa.', ['Lunch','Dinner']],
  ['Everyday','Beef and pepper wraps',[['lean ground beef',125],['bell pepper',100],['tortilla',65],['salsa',40]],
    'Slice the pepper and cook it in a skillet until softened. Add the ground beef and break it up as it cooks. Fill the tortillas with the cooked beef and peppers, then add salsa.', ['Lunch','Dinner']],
  ['Everyday','Pork and broccoli rice bowl',[['ground pork',125],['broccoli',150],['white rice',140],['olive oil',5]],
    'Cook the ground pork in a skillet, breaking it up as it cooks. Steam the broccoli and warm the cooked rice. Toss the broccoli with the oil and serve it with the pork and rice.', ['Lunch','Dinner']],
  ['Everyday','Pork and pepper wraps',[['ground pork',125],['bell pepper',100],['tortilla',65],['salsa',40]],
    'Cook the sliced pepper in a skillet until softened. Add the ground pork and break it up as it cooks. Fill the tortillas with the cooked pork and peppers, then top with salsa.', ['Lunch','Dinner']]
);

const everydayMains = [
  ['Chicken, rice and broccoli',[['chicken breast',150],['white rice',160],['broccoli',130],['olive oil',5]],
    'Warm the cooked chicken and rice. Steam the broccoli until tender. Serve the chicken, rice and broccoli together and drizzle with oil.'],
  ['Chicken, potatoes and green beans',[['chicken breast',150],['potato',200],['green beans',120],['olive oil',5]],
    'Cut the cooked potatoes into chunks and brown them in a skillet with the oil. Warm the cooked chicken and steam the green beans. Serve together.'],
  ['Chicken and sweet potato plate',[['chicken breast',150],['sweet potato',200],['spinach',70],['olive oil',5]],
    'Warm the cooked chicken and sweet potato. Wilt the spinach in the oil in a skillet. Slice the chicken and serve it with the vegetables.'],
  ['Chicken and tomato pasta',[['chicken breast',130],['cooked spaghetti',170],['tomato pasta sauce',120],['spinach',55]],
    'Warm the tomato sauce in a skillet. Add the diced cooked chicken and spinach, then stir until the spinach wilts. Toss with cooked spaghetti.'],
  ['Chicken and cheddar sandwich',[['chicken breast',120],['bread',75],['cheddar cheese',25],['lettuce',30],['tomato',60]],
    'Slice the cooked chicken and tomato. Layer them with cheddar and lettuce between the bread slices. Toast the bread first if you like.'],
  ['Chicken and corn lettuce bowl',[['chicken breast',140],['corn',90],['lettuce',85],['cucumber',80],['greek yogurt',50]],
    'Chop the cooked chicken, lettuce and cucumber. Drain the canned corn and toss it with the chicken and vegetables. Spoon the yogurt over the bowl.'],
  ['Chicken and carrot rice skillet',[['chicken breast',130],['brown rice',160],['carrots',85],['peas',65],['olive oil',5]],
    'Chop the carrots and cook them in the oil until tender. Add the peas, diced cooked chicken and cooked rice. Stir until hot throughout.'],
  ['Turkey and cheddar wrap',[['turkey',120],['tortilla',65],['cheddar cheese',25],['lettuce',35],['tomato',60]],
    'Slice the cooked turkey and tomato. Layer the turkey, cheddar, lettuce and tomato in the tortilla. Fold the sides in and roll.'],
  ['Turkey, mashed potatoes and peas',[['turkey',150],['potato',200],['peas',100],['milk',35]],
    'Mash the cooked potatoes with warm milk. Warm the cooked turkey and peas. Serve the turkey over the mash with the peas on the side.'],
  ['Turkey and spinach rice bowl',[['turkey',140],['brown rice',150],['spinach',80],['salsa',45]],
    'Warm the cooked rice and chopped cooked turkey. Wilt the spinach in a skillet with a splash of water. Spoon the salsa over the bowl.'],
  ['Beef and tomato spaghetti',[['lean ground beef',130],['cooked spaghetti',175],['tomato pasta sauce',130]],
    'Break up the ground beef in a skillet and cook it through. Stir in the pasta sauce and heat it through. Spoon the sauce over the cooked spaghetti.'],
  ['Ground beef and potato hash',[['lean ground beef',135],['potato',190],['onion',55],['bell pepper',75],['olive oil',5]],
    'Dice the onion and pepper and soften them in the oil. Add the ground beef, break it up and cook it through. Stir in diced cooked potatoes and heat through.'],
  ['Cheeseburger rice bowl',[['lean ground beef',130],['white rice',145],['cheddar cheese',25],['lettuce',45],['tomato',75]],
    'Cook the ground beef through, breaking it up in the skillet. Spoon it over warm cooked rice and add grated cheddar. Top with chopped lettuce and tomato.'],
  ['Beef and black bean tacos',[['lean ground beef',115],['black beans',85],['tortilla',65],['lettuce',35],['salsa',45]],
    'Cook the ground beef through in a skillet. Stir in the drained canned beans and warm them. Fill warm tortillas and top with shredded lettuce and salsa.'],
  ['Beef and bean chilli',[['lean ground beef',120],['kidney beans',120],['tomato pasta sauce',140],['onion',50],['bell pepper',60]],
    'Dice the onion and pepper and cook them with the ground beef, breaking up the meat until cooked through. Add the drained canned beans and tomato sauce. Simmer until hot and thickened.'],
  ['Beef jacket potato',[['potato',230],['lean ground beef',125],['tomato pasta sauce',75],['cheddar cheese',25]],
    'Warm a cooked potato and split it open. Cook the ground beef through and stir in the tomato sauce. Spoon the hot beef onto the potato and top with grated cheddar.'],
  ['Salmon, rice and green beans',[['salmon',145],['white rice',155],['green beans',125],['olive oil',5]],
    'Warm the cooked rice and steam the green beans. Flake the cooked salmon over the rice. Add the beans and drizzle with oil.'],
  ['Salmon and cucumber salad bowl',[['salmon',130],['brown rice',140],['cucumber',90],['tomato',70],['greek yogurt',45]],
    'Chop the cucumber and tomato. Flake the cooked salmon and serve it with cooked rice and the vegetables. Add a spoonful of yogurt.'],
  ['Tuna and white bean toast',[['tuna',100],['white beans',105],['bread',70],['greek yogurt',40]],
    'Drain the canned tuna and beans. Mash the beans with the yogurt and fold in the tuna. Spread the mixture on toast.'],
  ['Tuna jacket potato',[['potato',230],['tuna',110],['greek yogurt',55],['corn',55]],
    'Warm a cooked potato and split it open. Drain the canned tuna and corn, then mix them with the yogurt. Spoon the filling into the potato.'],
  ['Tuna, peas and rice bowl',[['tuna',115],['white rice',155],['peas',105],['olive oil',5]],
    'Warm the cooked rice and peas. Drain the canned tuna and flake it over the bowl. Toss gently with the oil.'],
  ['Egg and cucumber sandwich',[['egg',100],['bread',75],['cucumber',65],['lettuce',30],['greek yogurt',40]],
    'Chop the hard-boiled eggs and stir them into the yogurt. Slice the cucumber. Fill the bread with the egg mixture, cucumber and lettuce.'],
  ['Cheddar and black bean quesadilla',[['black beans',120],['tortilla',70],['cheddar cheese',40],['salsa',45]],
    'Drain the canned beans and crush them lightly. Spread them over one half of the tortilla, add the grated cheddar and fold. Toast in a skillet on both sides until the cheese melts. Serve with salsa.'],
  ['Lentil and tomato pasta',[['lentils',145],['cooked spaghetti',155],['tomato pasta sauce',130],['spinach',65]],
    'Warm the cooked lentils in the sauce. Fold in the spinach and stir until wilted. Toss with cooked spaghetti.'],
  ['Tofu and broccoli rice bowl',[['tofu',185],['broccoli',140],['brown rice',155],['olive oil',5]],
    'Pat the tofu dry and cut it into cubes. Brown it in a skillet with the oil. Steam the broccoli and serve both over warm cooked rice.'],
  ['White bean and potato bowl',[['white beans',160],['potato',200],['spinach',70],['olive oil',5]],
    'Cut the cooked potatoes into chunks and warm them in the oil. Add drained canned white beans and spinach. Stir until the beans are hot and the spinach has wilted.'],
  ['Pork and potato skillet',[['ground pork',130],['potato',190],['onion',55],['green beans',105]],
    'Cook the chopped onion and ground pork together, breaking up the meat until cooked through. Stir in diced cooked potatoes and heat through. Serve with steamed green beans.'],
  ['Pork, cabbage and rice bowl',[['ground pork',125],['cabbage',135],['white rice',150],['carrots',70]],
    'Shred the cabbage and slice the carrots thinly. Cook the ground pork through, breaking it up as it cooks. Stir in the vegetables and cook until tender. Serve over warm cooked rice.']
];
recipes.push(...everydayMains.map(([title,ingredients,method]) =>
  ['Everyday',title,ingredients,method,['Lunch','Dinner']]));

const plantMeals = [
  ['Banana and peanut butter rice bowl',[['white rice',150],['banana',105],['peanut butter',24]],'Warm the cooked rice with a splash of water. Slice the banana over it and swirl in the peanut butter.',['Breakfast','Snack']],
  ['Warm apple and peanut rice',[['brown rice',145],['apple',135],['peanuts',25]],'Dice the apple and soften it in a pan with a splash of water. Stir it into warm cooked rice and top with chopped peanuts.',['Breakfast','Snack']],
  ['Peach and peanut quinoa cup',[['quinoa',150],['peach',125],['peanut butter',22]],'Spoon cooked quinoa into a bowl. Slice the peach and top the quinoa with peaches and peanut butter.',['Breakfast','Snack']],
  ['Pear and crunchy peanut cup',[['pear',155],['peanuts',28]],'Slice the pear and serve with chopped peanuts.',['Breakfast','Snack']],
  ['Sweet potato with peanut butter and banana',[['sweet potato',165],['banana',90],['peanut butter',24]],'Warm the cooked sweet potato, split it open and mash the inside. Top with sliced banana and peanut butter.',['Breakfast','Snack']],
  ['Breakfast potato and black bean hash',[['potato',170],['black beans',115],['bell pepper',70],['olive oil',5]],'Dice the cooked potato and pepper. Brown them in a skillet with the oil. Add the drained canned beans and stir until hot.',['Breakfast','Lunch']],
  ['Tomato and spinach breakfast tofu',[['tofu',170],['tomato',95],['spinach',75],['olive oil',5]],'Crumble the plain tofu into a skillet with the oil and diced tomato. Stir until hot, then add the spinach and let it wilt.',['Breakfast','Lunch']],
  ['Chickpea and tomato breakfast bowl',[['chickpeas',140],['tomato',100],['potato',145],['olive oil',5]],'Dice the cooked potato and tomato. Warm them in the oil with the drained canned chickpeas.',['Breakfast','Lunch']],
  ['Chickpea and cucumber snack cup',[['chickpeas',95],['cucumber',85],['olive oil',5]],'Drain the canned chickpeas and chop the cucumber. Toss together with the oil.',['Snack']],
  ['White bean mash with carrots',[['white beans',110],['carrots',100],['olive oil',5]],'Drain the canned beans and mash them with the oil and a splash of water. Slice the carrots into sticks for dipping.',['Snack']],
  ['Banana and peanuts',[['banana',115],['peanuts',30]],'Slice the banana and serve it with the peanuts.',['Snack']],
  ['Lentil and sweet potato bowl',[['lentils',165],['sweet potato',185],['spinach',80],['olive oil',5]],'Warm the cooked lentils and cubed cooked sweet potato. Wilt the spinach in the oil and spoon it over the bowl.',['Lunch','Dinner']],
  ['Black bean and corn rice bowl',[['black beans',155],['corn',90],['white rice',145],['tomato',85]],'Drain the canned beans and corn, then warm them with the cooked rice. Top with diced tomato.',['Lunch','Dinner']],
  ['Crispy tofu and potato skillet',[['tofu',180],['potato',190],['onion',55],['olive oil',8]],'Pat the plain tofu dry and cube it. Brown the tofu, chopped onion and diced cooked potato in the oil.',['Lunch','Dinner']],
  ['Chickpea and broccoli quinoa bowl',[['chickpeas',155],['quinoa',135],['broccoli',125],['olive oil',6]],'Steam the broccoli. Warm the drained canned chickpeas and cooked quinoa, then add the broccoli and drizzle with oil.',['Lunch','Dinner']],
  ['White bean and tomato rice skillet',[['white beans',160],['white rice',150],['tomato',120],['spinach',70],['olive oil',5]],'Soften the diced tomato in the oil. Stir in the drained canned beans, cooked rice and spinach. Heat until the spinach wilts.',['Lunch','Dinner']],
  ['Lentil and carrot potato plate',[['lentils',170],['potato',185],['carrots',100],['olive oil',6]],'Mash the cooked potato with a splash of water and the oil. Warm the cooked lentils and steam the sliced carrots. Serve beside the mash.',['Lunch','Dinner']],
  ['Peanut tofu and cabbage rice bowl',[['tofu',180],['brown rice',155],['cabbage',125],['peanut butter',22],['olive oil',5]],'Brown cubes of plain tofu and sliced cabbage in the oil. Whisk the peanut butter with warm water and stir it into the pan. Serve over cooked rice.',['Lunch','Dinner']],
  ['Kidney bean and pepper potato bowl',[['kidney beans',155],['potato',190],['bell pepper',90],['olive oil',6]],'Soften the sliced pepper in the oil. Add cubed cooked potato and drained canned kidney beans. Stir until hot.',['Lunch','Dinner']],
  ['Chickpea and spinach quinoa salad',[['chickpeas',145],['quinoa',145],['spinach',65],['cucumber',90],['olive oil',8]],'Drain and rinse the canned chickpeas. Chop the spinach and cucumber, then toss with cooked quinoa, chickpeas and oil.',['Lunch','Dinner']],
  ['Lentil and tomato rice bowl',[['lentils',170],['brown rice',145],['tomato',115],['onion',55],['olive oil',6]],'Soften the chopped onion and tomato in a skillet with the oil. Add the cooked lentils and serve over warm cooked rice.',['Lunch','Dinner']]
];
const plantRecipes = new Set(plantMeals.map(([title,ingredients,method,types]) =>
  ['Everyday',title,ingredients,method,types]));
recipes.push(...plantRecipes);

const reviewedPlantMeals = new Set(['Apple and peanut butter','Chickpea and cucumber salad','Tofu and broccoli rice bowl','White bean and potato bowl']);
const reviewedDairyAndGlutenFreeMeals = new Set([
  'Hard-boiled eggs','Chicken, rice and broccoli','Chicken, potatoes and green beans',
  'Chicken and sweet potato plate','Chicken and carrot rice skillet','Salmon, rice and green beans',
  'Pork and potato skillet','Pork, cabbage and rice bowl','Ground beef and potato hash',
  'Salmon and plantain','Chicken quinoa salad'
]);
const reviewedDairyFreeMeals = new Set(['Chicken and tomato pasta','Beef and tomato spaghetti',
  'Beef and black bean tacos','Lentil and tomato pasta','Peanut butter and banana toast']);

// USDA SR Legacy profiles per 100 g: 20466, 16062 and 11977.
foods.push(['semolina dry',360,12.68,72.83,1.05,167,40,'semolina dry|semolina'],
  ['black eyed peas dry',336,23.52,60.03,1.26,167,50,'black eyed peas dry|dry black eyed peas'],
  ['serrano pepper',32,1.74,6.7,.44,90,6,'serrano pepper|serrano peppers|serrano']);

const researchedBreakfasts = [
  ['Mexican','Huevos a la mexicana',[['egg',100],['tomato',95],['onion',35],['serrano pepper',7],['olive oil',5]],
    'Dice the onion, tomato and serrano. Soften the onion and chile in the oil, then add the tomato. Pour in beaten eggs and gently stir until set.',
    'https://www.mexicoinmykitchen.com/mexican-style-scrambled-eggs/','México in My Kitchen','dairy gluten'],
  ['Mexican','Enfrijoladas with scrambled eggs',[['tortilla',75],['pinto beans',145],['egg',100],['tomato',65],['onion',30],['serrano pepper',5],['olive oil',6],['cilantro',5]],
    'Blend cooked pinto beans with enough water to make a smooth sauce and warm it. Sauté diced onion, chile and tomato in the oil, then scramble the eggs into the vegetables. Dip warm corn tortillas in the bean sauce, fill with eggs and finish with cilantro.',
    'https://www.cocinafacil.com.mx/recetas/enfrijoladas-con-huevo-a-la-mexicana','Cocina Fácil','dairy','This version skips the cream and cheese. Use corn tortillas and check the package label.'],
  ['Caribbean','Jamaican peanut porridge',[['peanuts',45],['coconut milk',100],['flour dry',10],['milk',110],['cinnamon',1],['sugar',10]],
    'Blend unsalted peanuts with the milk and a splash of water. Bring the coconut milk to a gentle simmer and stir in the peanut mixture. Whisk the flour with a little cold water and stir it into the pot. Cook gently, stirring until smooth and thick, then season with cinnamon and sugar.',
    'https://jamaicans.com/chef-noel-cunninghams-peanut-porridge-recipe/','Chef Noel Cunningham, Jamaicans.com','','MyFit uses milk and sugar in place of sweetened condensed milk.'],
  ['Italian','Ciambellone all’acqua · breakfast ring cake',[['flour dry',38],['egg',25],['sugar',22],['olive oil',12],['baking powder',2]],
    'Select eight servings for a full ring cake. Beat the eggs and sugar until pale, then mix in the oil and 200 mL of water for the full batch. Fold in the flour and baking powder, pour into a lined ring pan, and bake at 170°C until a skewer comes out clean. Cool and slice into eight pieces.',
    'https://www.giallozafferano.com/recipes/water-ring-cake.html','GialloZafferano','dairy','A simplified batch recipe using flour instead of cornstarch. Nutrition is for one slice.'],
  ['Mediterranean','Çılbır · Turkish eggs and yogurt',[['egg',100],['greek yogurt',150],['garlic',4],['butter',8],['chili powder',1],['vinegar',5]],
    'Stir grated garlic into the yogurt and spoon it into a shallow bowl. Poach the eggs in gently simmering water with the vinegar, then drain and place them on the yogurt. Warm the butter with the chile and spoon it over the eggs.',
    'https://eggs.ab.ca/cooking/recipe-categories/cilbir-turkish-eggs/','Egg Farmers of Alberta','gluten'],
  ['Asian-inspired','Dan bing · Taiwanese egg crepes',[['flour dry',45],['egg',100],['green onion',18],['olive oil',6],['soy sauce',6]],
    'Whisk the flour with water until the batter pours in a thin stream. Cook a thin layer in an oiled skillet. Beat the eggs with the scallions, add them to the skillet and lay the crepe over them. When the egg has set, roll the crepe and serve with soy sauce.',
    'https://cookswithoutborders.com/dan-bing','Frankie Gaw’s recipe via Cooks Without Borders','dairy','A pantry adaptation using a flour-only batter.'],
  ['Indian-inspired','Rava upma · savoury semolina',[['semolina dry',65],['onion',45],['carrots',55],['peas',55],['ginger',5],['cashews',18],['olive oil',6]],
    'Toast the semolina in a dry pan until fragrant and set it aside. Cook the chopped onion, carrot and ginger in the oil. Add the peas and water, bring to a simmer and gradually stir in the semolina. Cook until the grains are tender and the water is absorbed. Finish with cashews.',
    'https://www.swasth.org/wp-content/uploads/2022/10/Yogic-Aahaar-Extra-Recipe-book-version-2.pdf','Swasth Yog Institute','plant dairy','A simplified version using common vegetables and pantry ingredients.'],
  ['Canadian-inspired','Pain doré with maple syrup',[['bread',80],['egg',100],['milk',70],['butter',6],['maple syrup',18]],
    'Whisk together the eggs and milk. Dip the bread into the mixture. Cook both sides in a buttered skillet until golden and set, then serve with maple syrup.',
    'https://maplefromcanada.ca/recipes/maple-syrup-french-toast/','Québec Maple Syrup Producers',''],
  ['Japanese','Salmon ochazuke · rice with green tea',[['white rice',165],['salmon',95],['nori',3],['green onion',12]],
    'Put warm cooked rice in a bowl. Flake the cooked salmon over the rice and add sliced scallion and shredded nori. Pour freshly brewed unsweetened green tea around the rice and serve.',
    'https://www.justonecookbook.com/ochazuke/','Just One Cookbook','dairy gluten'],
  ['Chinese','Ji dan bing · Chinese breakfast egg pancakes',[['flour dry',60],['egg',100],['green onion',20],['olive oil',7]],
    'Mix the flour with water to make a soft dough. Let it rest, then roll it into thin rounds. Cook a round in an oiled skillet, cover it with beaten egg and scallion, and flip it to set the egg. Fold and serve warm.',
    'https://thewoksoflife.com/chinese-breakfast-jidan-bing/','The Woks of Life','dairy'],
  ['Korean','Ganjang gyeranbap · egg and soy sauce rice',[['white rice',165],['egg',100],['soy sauce',7],['sesame oil',6],['green onion',12]],
    'Fry the eggs in a nonstick skillet. Place them over warm cooked rice and add soy sauce, sesame oil and sliced scallion. Mix the egg and seasonings into the rice as you eat.',
    'https://folkency.nfm.go.kr/en/topic/detail/11818','National Folk Museum of Korea','dairy'],
  ['Korean','Dakjuk · chicken and vegetable porridge',[['white rice',150],['chicken breast',110],['carrots',55],['zucchini',65],['sesame oil',6],['green onion',12]],
    'Briefly stir the cooked rice in sesame oil. Add water and simmer until the rice softens and thickens. Add finely diced carrot and zucchini, then stir in shredded cooked chicken and heat through. Finish with sliced scallion.',
    'https://www.koreanbapsang.com/dakjuk-korean-chicken-porridge/','Korean Bapsang','dairy gluten','This shortcut starts with cooked rice and chicken.'],
  ['Thai','Khao tom goong · shrimp breakfast rice soup',[['white rice',150],['shrimp',110],['garlic',6],['ginger',7],['green onion',14],['fish sauce',7],['olive oil',6]],
    'Fry chopped garlic in the oil and set it aside. Simmer cooked rice, ginger and fish sauce in water to make a broth with distinct rice grains. Add shrimp and cook until opaque. Finish with scallion and the fried garlic.',
    'https://hot-thai-kitchen.com/kao-tom-goong/','Hot Thai Kitchen','dairy','A shortcut broth using water and fish sauce.'],
  ['Thai','Jok moo · pork breakfast rice porridge',[['white rice',155],['ground pork',105],['ginger',9],['green onion',15],['fish sauce',6]],
    'Simmer the cooked rice in water until the grains break down into a thick porridge. Drop small pieces of ground pork into the simmering porridge and cook them through. Season with fish sauce and top with ginger and scallion.',
    'https://hot-thai-kitchen.com/breakfast-congee/','Hot Thai Kitchen','dairy','A shortcut using cooked rice. Requires pork opt-in.'],
  ['Vietnamese','Cháo gà · ginger chicken rice porridge',[['white rice',150],['chicken breast',115],['ginger',9],['green onion',15],['fish sauce',7],['black pepper',1]],
    'Simmer cooked rice with ginger and water until very soft. Shred the cooked chicken and stir it in until heated through. Season with fish sauce and finish with scallion and black pepper.',
    'https://www.hungryhuy.com/chao-ga-vietnamese-porridge/','Hungry Huy','dairy','A shortcut using cooked chicken and rice.'],
  ['Vietnamese','Bánh mì ốp la · fried eggs and bread',[['bread',95],['egg',100],['olive oil',6],['soy sauce',5]],
    'Warm the bread until crisp. Fry the eggs in the oil and season them with soy sauce. Serve with the bread for dipping or tuck the eggs inside.',
    'https://www.vietnamairlines.com/go/en/plan-book/travel/travel-guide/vietnamese-breakfast','Vietnam Airlines','dairy','A simple egg-and-bread version. Use a small baguette or bread roll.'],
  ['African','Akara · Nigerian black-eyed pea fritters',[['black eyed peas dry',75],['onion',35],['bell pepper',30],['serrano pepper',5],['olive oil',13]],
    'Soak the dried black-eyed peas, rub off the skins and rinse. Blend the drained peas, onion and peppers with just enough water to make a thick batter, then beat it to lighten it. Fry small spoonfuls in the measured oil, turning until golden and cooked through.',
    'https://cheflolaskitchen.com/web-stories/akara-black-eyed-peas-fritters/','Chef Lola’s Kitchen','plant dairy gluten','MyFit uses shallow frying and counts all the measured oil in its estimate.'],
  ['Everyday','Tomato beans on toast',[['white beans',160],['tomato pasta sauce',105],['bread',80],['onion',35],['olive oil',5]],
    'Soften the diced onion in the oil. Add drained canned beans and tomato sauce and simmer until hot and thick. Spoon over toast.',
    'https://www.bbcgoodfood.com/recipes/smoky-beans-toast','BBC Good Food','plant dairy','A pantry adaptation of British beans on toast. Choose bread and sauce that fit your dietary preferences.']
];
const sourcedBreakfastRecipes = new Map();
researchedBreakfasts.forEach(([cuisine,title,ingredients,method,url,source,diet,note]) => {
  const recipe = [cuisine,title,ingredients,method,['Breakfast']];
  recipes.push(recipe);
  sourcedBreakfastRecipes.set(recipe,{url,source,diet:diet.split(' '),note});
});

function isQuickRecipe(index) {
  return index >= quickRecipeStart && !sourcedBreakfastRecipes.has(recipes[index]);
}

function recipeAllowed(recipe) {
  const preferences = prefs();
  const title = recipe[1];
  const sourceDiet = sourcedBreakfastRecipes.get(recipe)?.diet;
  const plant = plantRecipes.has(recipe) || reviewedPlantMeals.has(title) || sourceDiet?.includes('plant');
  if (preferences.vegan && !plant) return false;
  const dairyAndGlutenFree = plant || reviewedDairyAndGlutenFreeMeals.has(title);
  if (preferences.glutenFree && !(sourceDiet ? sourceDiet.includes('gluten') : dairyAndGlutenFree)) return false;
  if (preferences.dairyFree && !(sourceDiet ? sourceDiet.includes('dairy') : dairyAndGlutenFree || reviewedDairyFreeMeals.has(title))) return false;
  return preferences.includePork === true ||
    ![title,...recipe[2].map(([name])=>name)].some(name =>
      /\b(pork|bacon|ham|prosciutto|pepperoni|pancetta|lard)\b/i.test(name));
}

function recipeItems(r,type=activeMeal(),planning=false){let t=targets(),a=sum(),budget=!planning&&mealBudget==='remaining'?Math.max(0,t[0]-a[0]):t[0]*({Breakfast:.25,Lunch:.30,Dinner:.35,Snack:.10}[type]);let base=r[2].map(([n,g])=>{let f=foods.find(x=>x[0]===n);if(!f)throw Error("Missing ingredient: "+n);return {name:n,g,k:f[1],p:f[2],c:f[3],f:f[4],source:'Generic recipe estimate'}});let scale=(isQuickRecipe(recipes.indexOf(r))||sourcedBreakfastRecipes.has(r))?1:Math.max(.5,Math.min(1.6,budget/Math.max(1,totals(base)[0])));return base.map(x=>({...x,g:Math.round(x.g*scale)}))}
function dateSeed(d){return Math.floor(Date.parse(d+'T00:00:00Z')/86400000)}
let pantry='',dishSearch='',quickRecipesOnly=false; function matchesRecipe(x){return (!quickRecipesOnly||isQuickRecipe(x.i))&& (!pantry||x.r[2].some(([n])=>n.includes(pantry.toLowerCase())))&&(!dishSearch||x.r[1].toLowerCase().includes(dishSearch.toLowerCase()))} function picks(type,c='All cuisines'){return recipes.map((r,i)=>({r,i})).filter(x=>x.r[4].includes(type)&&(c==='All cuisines'||x.r[0]===c)&&recipeAllowed(x.r))}
function prefs(){return {style:'Balanced',tier:'Moderate',budget:100,days:2,pantry:'',...(S.prep||{})}}
function prepSet(k,v){S.prep={...prefs(),[k]:v};save();render()}
let plannerSettingsOpen = false;
function setPorkPreference(include) {setRecipePreference('includePork',include)}

function setRecipePreference(key,include) {
  const previous = S.prep;
  S.prep = {...prefs(),[key]:include};
  if (!save()) {
    if (previous === undefined) delete S.prep;
    else S.prep = previous;
  }
  smartType = '';
  render();
}

function prepControls(){let p=prefs();return `<section><details ${plannerSettingsOpen?'open':''} ontoggle="plannerSettingsOpen=this.open"><summary>Planning settings</summary><label><input type="checkbox" style="width:auto" ${p.includePork===true?'checked':''} onchange="setPorkPreference(this.checked)"> Include pork in recipes and suggestions</label>
<div class="recipe-preferences">
${[['dairyFree','Dairy-free'],['vegan','Vegan'],['glutenFree','Gluten-free ingredients']].map(([key,label])=>`<label><input type="checkbox" style="width:auto" ${p[key]?'checked':''} onchange="setRecipePreference('${key}',this.checked)"> ${label}</label>`).join('')}
<small>For allergies or celiac disease, check package labels and avoid cross-contact in the kitchen. These filters screen recipe ingredients.</small>
</div><label>Discipline & variety<select onchange="prepSet('style',this.value)">${['Strict','Meal prep','Balanced','Variety'].map(v=>`<option ${v===p.style?'selected':''}>${v}</option>`).join('')}</select></label><label>Spending style<select onchange="prepSet('tier',this.value)">${['Budget friendly','Moderate','Splurge'].map(v=>`<option ${v===p.tier?'selected':''}>${v}</option>`).join('')}</select></label><label>Weekly budget (CAD, personal target)<input type="number" min="0" value="${p.budget}" onchange="prepSet('budget',Math.max(0,+this.value||0))"></label><label>Batch cooking sessions<select onchange="prepSet('days',+this.value)">${[1,2,3,4,7].map(v=>`<option ${v===p.days?'selected':''}>${v}</option>`).join('')}</select></label><label>Pantry ingredients (comma separated)<input value="${esc(p.pantry)}" onchange="prepSet('pantry',this.value)"></label><small>Strict prioritizes protein per calorie. Meal prep repeats batch recipes. Balanced and Variety offer different meals across the week. Spending style uses ingredient proxies, not store prices. Budget is a reference target, not a guaranteed cap.</small></details></section>`}
function costProxy(r){return r[2].reduce((a,[n,g])=>a+g/1000*(/lobster|steak|salmon|shrimp|lamb|scallop|crab/.test(n)?30:/beef|fish|chicken|turkey|cheese|nuts/.test(n)?15:/rice|oat|potato|bean|lentil|flour/.test(n)?4:8),0)}
function planScore(x,type,p,used){let items=recipeItems(x.r,type,true),v=totals(items),cost=costProxy(x.r),shared=x.r[2].filter(([n])=>used.has(n)||p.pantry.toLowerCase().split(',').map(a=>a.trim()).includes(n)).length;return (p.style==='Strict'?v[1]/Math.max(1,v[0])*150:0)+(p.tier==='Budget friendly'?-cost*2:p.tier==='Splurge'?cost*.6:-cost*.5)+shared*.5+Math.random()*1.5}
function batchLabel(k,type){let p=prefs(),i=planned(k,type)?.i,prev=new Date((dateSeed(k)-1)*86400000).toISOString().slice(0,10);return planned(prev,type)?.i===i?'Repeat / leftover (if safely stored)':'Prepare fresh or batch'}
let plannerRange = 'Week';
let groceryRange = 'Week';

function plannerPeriod(date, range) {
  const start = new Date(date + 'T12:00:00');
  if (range === 'Month') start.setDate(1);
  else start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const count = range === 'Month'
    ? new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    : 7;
  return Array.from({length:count}, (_, i) => {
    const value = new Date(start);
    value.setDate(value.getDate() + i);
    return dateKey(value);
  });
}

function movePlannerPeriod(direction, range) {
  const date = new Date(day() + 'T12:00:00');
  if (range === 'Month') {
    date.setDate(1);
    date.setMonth(date.getMonth() + direction);
  } else {
    date.setDate(date.getDate() + direction * 7);
  }
  selectPlanDate(dateKey(date));
}

function plannerShortDate(key) {
  return new Date(key + 'T12:00:00').toLocaleDateString('en-CA', {month:'short',day:'numeric'});
}

function plannerPeriodHeader(range) {
  const dates = plannerPeriod(day(), range);
  const label = range === 'Month'
    ? new Date(day()+'T12:00:00').toLocaleDateString('en-CA',{month:'long',year:'numeric'})
    : `${plannerShortDate(dates[0])} – ${plannerShortDate(dates.at(-1))}`;
  const unit = range.toLowerCase();
  return `<div class="line"><button class="alt" aria-label="Previous ${unit}" onclick="movePlannerPeriod(-1,'${range}')">‹</button>
    <b>${label}</b><button class="alt" aria-label="Next ${unit}" onclick="movePlannerPeriod(1,'${range}')">›</button></div>
    ${dates.includes(today())?'':'<button class="alt" onclick="selectPlanDate(today())">Back to current ${unit}</button>'}`;
}

function plannerThemes() {
  return ['Mixed cuisines', ...new Set(recipes
    .filter(recipe => recipeAllowed(recipe) && recipe[4].some(type => type === 'Lunch' || type === 'Dinner'))
    .map(recipe => recipe[0]))];
}

function generateThemedWeek() {
  const dates = plannerPeriod(day(), 'Week');
  const week = dates[0];
  const theme = $('plannerTheme').value;
  if (!plannerThemes().includes(theme)) return;
  if (S.weekPlans?.[week] && !confirm('Replace the generated recipes for this week? Your manual swaps will stay.')) return;

  const slots = buildThemedWeekSlots(dates,theme);
  const previous = S.weekPlans;
  S.weekPlans = {...previous, [week]:{theme, slots}};
  if (!save()) {
    if (previous === undefined) delete S.weekPlans;
    else S.weekPlans = previous;
    return;
  }
  plannerRange = 'Week';
  render();
}

function buildThemedWeekSlots(dates,theme) {
  const slots = {};
  const preferences = prefs();
  const used = new Set();
  for (const type of mealTypes) {
    const all = picks(type);
    const themed = theme === 'Mixed cuisines' ? all : picks(type, theme);
    const span = preferences.style === 'Meal prep' ? Math.ceil(7 / preferences.days) : 1;
    const selected = new Set();
    let batch;
    dates.forEach((date, index) => {
      const key = date + '|' + type;
      const logged = (S.meals[date] || []).some(meal => meal.planSlot === key);
      const fixed = logged ? planned(date,type) : all.find(recipe => recipe.i === S.manualPlan?.[key]);
      if (fixed) {
        slots[key] = fixed.i;
        selected.add(fixed.i);
        batch = undefined;
        return;
      }
      if (index % span && batch) {
        slots[key] = batch.i;
        return;
      }
      let options = themed.filter(recipe => !selected.has(recipe.i));
      if (!options.length) options = all.filter(recipe => !selected.has(recipe.i));
      if (!options.length) {
        selected.clear();
        const pool = themed.length ? themed : all;
        options = pool.filter(recipe => recipe.i !== batch?.i);
        if (!options.length) options = all.filter(recipe => recipe.i !== batch?.i);
        if (!options.length) options = pool;
      }
      if (!options.length) return;
      const selection = options.map(recipe => ({recipe,score:planScore(recipe,type,preferences,used)}))
        .sort((a,b) => b.score-a.score)[0].recipe;
      selected.add(selection.i);
      batch = selection;
      slots[key] = selection.i;
      selection.r[2].forEach(([name]) => used.add(name));
    });
  }

  return slots;
}

function weeklyThemePanel() {
  const dates = plannerPeriod(day(), 'Week');
  const saved = S.weekPlans?.[dates[0]];
  return `<section><h3>Weekly theme</h3>
    <p>${plannerShortDate(dates[0])} – ${plannerShortDate(dates.at(-1))} · ${esc(saved?.theme || 'Suggested meals')}</p>
    <label>Choose a theme<select id="plannerTheme">${plannerThemes().map(theme =>
      `<option ${saved?.theme===theme?'selected':''}>${esc(theme)}</option>`).join('')}</select></label>
    <button class="wide" onclick="generateThemedWeek()">${saved?'Update this week’s plan':'Generate this week’s plan'}</button>
    <small>MyFit uses your theme first, then fills in from other cuisines for variety. Meal prep repeats recipes for batches. Your swaps stay when you update the week.</small>
  </section>`;
}

function openPlannerDay(date) {
  plannerRange = 'Day';
  selectPlanDate(date);
  window.scrollTo(0,0);
}

function plannerSchedule(range) {
  const dates = plannerPeriod(day(), range);
  if (range === 'Week') return `<section class="week-overview">
    ${plannerPeriodHeader(range)}
    <button class="alt wide" onclick="switchPlanner('Groceries')">Groceries for this week</button>
    ${dates.map(date => `<button class="alt week-day" ${date===today()?'aria-current="date"':''}
      onclick="openPlannerDay('${date}')">
      <b>${new Date(date+'T12:00:00').toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'})}${date===today()?' · Today':''}</b>
      <span class="week-meals">${mealTypes.map(type => `<span><small>${type}</small>${esc(planned(date,type)?.r[1] || 'No recipe')}${slotStatus(date,type)==='skipped'?' · Skipped':''}</span>`).join('')}</span>
    </button>`).join('')}
  </section>`;
  return `<section>${plannerPeriodHeader(range)}</section>${dates.map(date => {
    const label = new Date(date+'T12:00:00').toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'});
    const meals = mealTypes.map(type => {
      const selection = planned(date, type);
      return `<div class="line"><small>${type}</small><span>${esc(selection?.r[1] || 'No recipe')}${slotStatus(date,type)==='skipped'?' · Skipped':''}</span></div>`;
    }).join('');
    return `<section class="planner-agenda-day"><details ${range==='Week'?'open':''}><summary>${label}</summary>
      ${meals}<button class="alt wide" onclick="openPlannerDay('${date}')">Edit meals for ${plannerShortDate(date)}</button>
    </details></section>`;
  }).join('')}`;
}

function plannerPlanView() {
  const controls = `<div class="planner-tabs planner-range">${['Day','Week','Month'].map(range =>
    `<button class="${plannerRange===range?'':'alt'}" aria-pressed="${plannerRange===range}" onclick="plannerRange='${range}';render()">${range}</button>`).join('')}</div>`;
  const schedule = plannerRange === 'Day' ? calendarPlanner() : plannerSchedule(plannerRange);
  const groceries = plannerRange==='Week' ? '' : `<button class="alt wide" onclick="switchPlanner('Groceries')">Groceries for this ${plannerRange==='Month'?'month':'week'}</button>`;
  return controls + groceries + schedule + (plannerRange==='Month'?'':weeklyThemePanel()) + prepControls();
}

function calendarPlanner() {
  const selected = day();
  const date = new Date(selected + 'T12:00:00');
  const monday = new Date(date);
  monday.setDate(date.getDate() - (date.getDay() + 6) % 7);
  const month = new Date(date.getFullYear(), date.getMonth() + calendarOffset, 1, 12);
  const firstCell = new Date(month);
  firstCell.setDate(1 - month.getDay());
  const dateLabel = value => value.toLocaleDateString('en-CA', {weekday:'long', month:'long', day:'numeric'});
  const dateButton = (value, showWeekday) => {
    const key = dateKey(value);
    const label = showWeekday ? `<small>${value.toLocaleDateString('en-CA',{weekday:'short'})}</small><br>` : '';
    return `<button class="${key===selected?'':'alt'}" aria-label="${dateLabel(value)}"
      aria-pressed="${key===selected}" onclick="selectPlanDate('${key}')">${label}${value.getDate()}${key===today()?' •':''}</button>`;
  };
  const dateButtons = (start, count, weekdays) => Array.from({length:count}, (_, i) => {
    const value = new Date(start);
    value.setDate(start.getDate() + i);
    return dateButton(value, weekdays);
  }).join('');
  const cards = mealTypes.map(type => {
    const recipe = planned(selected, type);
    if (!recipe) return '';
    const logged = (S.meals[selected] || []).some(meal => meal.planSlot === selected + '|' + type);
    const status = slotStatus(selected, type);
    const skipped = status === 'skipped';
    const canLog = selected === today() && type === autoMeal() && !skipped;
    const logAction = logged || canLog
      ? `<button class="alt" onclick="toggleSlot('${type}','completed')">${logged?'Undo food log':'Log as eaten'}</button>` : '';
    const skipAction = logged ? '' : `<button class="alt" onclick="toggleSlot('${type}','skipped')">${skipped?'Restore to plan':'Skip meal'}</button>`;
    return `<section class="planner-meal">
      <small>${type} · ${logged?'Logged':skipped?'Skipped':status==='completed'?'Previously marked eaten':'Planned'}</small>
      <h3>${esc(recipe.r[1])}</h3>
      <div class="planner-meal-actions"><button onclick="openPlanned(${recipe.i},'${type}')">View recipe</button>${logged?'':`<button class="alt" onclick="browsePlannerMeal('${type}')">Change recipe</button>`}${logAction}${skipAction}</div>
    </section>`;
  }).join('');
  return `<section aria-label="Plan dates">
    <div class="line"><button class="alt" aria-label="Previous week" onclick="selectPlanDate(coachDate(-7))">‹</button>
      <b>${dateLabel(date)}</b><button class="alt" aria-label="Next week" onclick="selectPlanDate(coachDate(7))">›</button></div>
    <div class="week-strip">${dateButtons(monday, 7, true)}</div>
    ${selected===today()?'':'<button class="alt" onclick="selectPlanDate(today())">Back to today</button>'}
    <details ${monthView?'open':''} ontoggle="monthView=this.open"><summary>Monthly calendar</summary>
      <div class="line"><button class="alt" aria-label="Previous month" onclick="calendarOffset--;render()">‹</button>
        <b>${month.toLocaleDateString('en-CA',{month:'long',year:'numeric'})}</b>
        <button class="alt" aria-label="Next month" onclick="calendarOffset++;render()">›</button></div>
      <div class="planner-month-grid">${['S','M','T','W','T','F','S'].map(x=>'<small>'+x+'</small>').join('')}${dateButtons(firstCell,42,false)}</div>
    </details>
  </section>${cards}`;
}
function selectPlanDate(k){plannerDate=k;calendarOffset=0;rotation=0;render()}
function openPlanned(i,type){pantry='';dishSearch='';mealType=type;cuisine=recipes[i][0];let p=picks(type,cuisine);rotation=p.findIndex(x=>x.i===i);openRecipeDetail(i,plannerTab==='Calendar')}
function themedPlanner(){let type=activeMeal(),p=picks(type,cuisine).filter(matchesRecipe),start=((rotation)%p.length+p.length)%p.length;let x=p[start];return `<section id="recipeFinder"><div class="pill">Coach-ranked recipe finder · ${recipes.length} options</div><h3>What are you craving?</h3><label><input type="checkbox" style="width:auto" ${quickRecipesOnly?'checked':''} onchange="quickRecipesOnly=this.checked;rotation=0;render()"> Quick meals only</label><label>Meal time<select onchange="mealType=this.value;rotation=0;render()">${['Auto',...mealTypes].map(n=>`<option value="${n}" ${n===mealType?'selected':''}>${n==='Auto'?'Auto · '+autoMeal():n}</option>`).join('')}</select></label><label>Cuisine<select onchange="cuisine=this.value;rotation=0;render()">${['All cuisines',...new Set(recipes.map(r=>r[0]))].map(n=>`<option ${n===cuisine?'selected':''}>${n}</option>`).join('')}</select></label><label>Search dish name<input value="${esc(dishSearch)}" placeholder="e.g. masala" onchange="dishSearch=this.value.trim();rotation=0;render()"></label><label>Ingredient you have<input id="pantry" value="${esc(pantry)}" placeholder="e.g. chicken" onchange="pantry=this.value.trim();rotation=0;render()"></label><label>Portion target<select onchange="mealBudget=this.value;render()"><option value="meal" ${mealBudget==='meal'?'selected':''}>Meal share of daily calories</option><option value="remaining" ${mealBudget==='remaining'?'selected':''}>Remaining daily calories</option></select></label><small>Cooked weights unless noted. Estimates and portion limits apply.</small>${x?`<div class="recipe-actions"><button onclick="openRecipeDetail(${x.i})">View full recipe & ingredients</button><label>Browse recipes<select onchange="chooseRecipe(+this.value)">${p.map(y=>`<option value="${y.i}" ${y.i===x.i?'selected':''}>${esc(y.r[1])}</option>`).join('')}</select></label><button class="alt" onclick="nextRecipe(false)" ${p.length<2?'disabled':''}>Try another recipe (${p.length} available)</button><button class="alt" onclick="nextRecipe(true)" ${p.length<2?'disabled':''}>Surprise me</button></div>`:'<p>No matching recipe. Try another cuisine or ingredient.</p>'}</section>`}
function refreshRecipeFinder(){plannerTab='Recipes';render()}
function chooseRecipe(i){let p=picks(activeMeal(),cuisine).filter(matchesRecipe);let pos=p.findIndex(x=>x.i===i);if(pos>=0){rotation=pos;refreshRecipeFinder()}}
function showRecipe(){ $('fullRecipe')?.scrollIntoView({behavior:'smooth',block:'start'}) }
function nextRecipe(random){let p=picks(activeMeal(),cuisine).filter(matchesRecipe);if(p.length<2)return;rotation+=random?1+Math.floor(Math.random()*(p.length-1)):1;refreshRecipeFinder()}

let cookTimer=null,cookEnd=0;
function timerDisplay(){let el=$('cookClock');if(!el)return;let n=Math.max(0,Math.ceil((cookEnd-Date.now())/1000));el.textContent=cookEnd?(n?`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`:'Time is up! Check your food.'):'No timer running';if(cookEnd&&!n){clearInterval(cookTimer);cookTimer=null;}}
function startCookTimer(minutes) {
  const input = $('cookMinutes');
  const duration = minutes ?? Number(input.value);
  if (!Number.isFinite(duration) || duration<=0 || duration>180) return;
  if (minutes !== undefined) {
    input.value = duration;
    input.closest('details').open = true;
  }
  clearInterval(cookTimer);
  cookEnd = Date.now() + duration*60000;
  timerDisplay();
  cookTimer = setInterval(timerDisplay,250);
}

function cookStepMinutes(step) {
  if (/\d+\s*(?:[-–—]|to)\s*\d+\s*(?:minutes?|mins?)\b/i.test(step)) return 0;
  const matches = [...step.matchAll(/(?<![\d.])(\d+)\s*(?:minutes?|mins?)\b/gi)];
  if (matches.length !== 1) return 0;
  const minutes = Number(matches[0][1]);
  return minutes>=1&&minutes<=180 ? minutes : 0;
}

function stopCookTimer(){clearInterval(cookTimer);cookEnd=0;timerDisplay()}
function speakCook(i,j) {
  const step = cookSteps(recipes[i])[j];
  if (!step) return;
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(step);
    utterance.lang = 'en-CA';
    speechSynthesis.speak(utterance);
  } else alert('Read aloud is unavailable in this browser.');
}

function cookSteps(recipe) {
  return recipe[3].split(/(?<=[.!?])\s+|;\s*|\n+/)
    .map(text => text.trim())
    .filter(Boolean)
    .map(text => {
      const sentence = text[0].toUpperCase() + text.slice(1);
      return /[.!?]$/.test(sentence) ? sentence : sentence + '.';
    });
}

function cookGuide(r,i) {
  let steps=cookSteps(r), names=r[2].map(x=>x[0]).join(' '), safety=[];if(/chicken|turkey/.test(names))safety.push('Poultry pieces and ground poultry: 74°C / 165°F.');if(/ground beef|ground pork|ground lamb/.test(names))safety.push('Ground beef, pork or lamb: 71°C / 160°F.');if(/salmon|cod|tilapia|fish|tuna/.test(names))safety.push('Fish: 70°C / 158°F when cooking from raw.');if(/shrimp/.test(names))safety.push('Shrimp: cook until firm and opaque.');if(/egg/.test(names))safety.push('Egg dishes: cook to 74°C / 165°F.');
  return `<h4>Method</h4>
    <ol class="recipe-method">
      ${steps.map((step,j)=>{const minutes=cookStepMinutes(step);return `<li>
        <label><input type="checkbox"><span>${esc(step)}</span></label>
        <button class="alt" aria-label="Read step ${j+1} aloud" onclick="speakCook(${i},${j})">Read aloud</button>
        ${minutes?`<button class="alt" onclick="startCookTimer(${minutes})">Start ${minutes}-minute timer</button>`:''}
      </li>`}).join('')}
    </ol>
    ${safety.length?`<details class="recipe-extra"><summary>Food safety notes</summary>
      <ul>${safety.map(note=>`<li>${esc(note)}</li>`).join('')}</ul></details>`:''}
    <details class="recipe-extra" ${cookEnd?'open':''}><summary>Kitchen timer</summary>
      <p id="cookClock" role="status">${cookEnd?'Timer running':'No timer running'}</p>
      <label>Minutes<input id="cookMinutes" type="number" min="1" max="180" value="5"></label>
      <div class="recipe-detail-actions"><button onclick="startCookTimer()">Start timer</button>
        <button class="alt" onclick="stopCookTimer()">Stop timer</button></div>
      <small>Keep MyFit open to follow the countdown.</small>
    </details>`;
}
let plannerTab='Calendar',detailIndex=0,returnPlanner='Recipes',monthView=false;const photoMemo=new Map();
function browsePlannerMeal(type) {
  quickRecipesOnly = false;
  mealType = type;
  cuisine = 'All cuisines';
  pantry = '';
  dishSearch = '';
  rotation = 0;
  switchPlanner('Recipes',true);
}

let plannerRecipeSlot = false;
function switchPlanner(t,forSlot=false){if(t==='Recipes')plannerRecipeSlot=forSlot;if(t==='Groceries')groceryRange=plannerRange==='Month'?'Month':'Week';plannerTab=t;render();window.scrollTo(0,0)}
let scheduledRecipe = false;
function openRecipeDetail(i,fromPlan=plannerTab==='Recipes'&&plannerRecipeSlot){scheduledRecipe=fromPlan;returnPlanner=plannerTab==='Detail'?returnPlanner:plannerTab;detailIndex=i;plannerTab='Detail';render();window.scrollTo(0,0)}
function dishPhoto(i){return `<div class="dish-photo" data-dish="${i}"><small>Looking for a dish photograph…</small></div>`}
async function loadDishPhotos(){for(const el of document.querySelectorAll('[data-dish]')){let i=+el.dataset.dish,r=recipes[i];if(!r)continue;let q=r[1].replace(/ adaptation| inspired/gi,'');let job=photoMemo.get(i);if(!job){job=(async()=>{try{let u=new URL('https://commons.wikimedia.org/w/api.php');u.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:q+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'5',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'480',format:'json',origin:'*'});let res=await fetch(u);if(!res.ok)throw 0;let data=await res.json();return Object.values(data.query?.pages||{}).sort((a,b)=>a.index-b.index).map(p=>p.imageinfo?.[0]).find(x=>x?.thumburl&&/^(CC BY|CC0|Public domain)/i.test(x.extmetadata?.LicenseShortName?.value||''))||null}catch(e){return null}})();photoMemo.set(i,job)}job.then(x=>{if(!el.isConnected)return;if(!x||!/^https:\/\//.test(x.thumburl||'')){el.textContent='Photo unavailable — use the dish photo search.';return}let img=document.createElement('img');img.src=x.thumburl;img.alt='Possible photo match for '+r[1];img.loading='lazy';img.onerror=()=>{el.textContent='Photo unavailable.'};let link=document.createElement('a');link.href=/^https:\/\//.test(x.descriptionurl||'')?x.descriptionurl:'https://commons.wikimedia.org/';link.target='_blank';link.rel='noopener';link.textContent='Suggested photo • '+x.extmetadata.LicenseShortName.value+' • source & author';el.replaceChildren(img,link)})}}
let plannerArea = 'Meals';
let workoutScheduleRange = 'Week';

function switchPlannerArea(area) {
  plannerArea = area;
  render();
  window.scrollTo(0,0);
}

function plannerView() {
  const navigation = `<div class="planner-area">${['Meals','Workouts'].map(area=>
    `<button class="${plannerArea===area?'':'alt'}" aria-pressed="${plannerArea===area}"
      onclick="switchPlannerArea('${area}')">${area}</button>`).join('')}</div>`;
  return '<h2>Planner</h2>'+navigation+(plannerArea==='Meals'?mealPlannerView():plannerWorkoutView());
}

function openWorkoutSchedule() {
  plannerArea = 'Workouts';
  plannerDate = today();
  openMainTab('Planner');
}

function selectPlannerWorkout(date) {
  selectPlanDate(date);
  $('plannerWorkoutDetails').scrollIntoView({block:'start'});
}

function plannerWorkoutView() {
  const selected = day();
  const week = schedule();
  const rhythmSettings = rhythm();
  const sessionFor = date => week[(new Date(date+'T12:00:00').getDay()+6)%7];
  const timeFor = date => fmt58(rhythmSettings.commit[date] || rhythmSettings.work);
  const shortDay = date => new Date(date+'T12:00:00').toLocaleDateString('en-CA',
    {weekday:'short',month:'short',day:'numeric'});
  const dates = plannerPeriod(selected,workoutScheduleRange);
  const session = sessionFor(selected);
  const exercises = applyWorkoutSwaps(exerciseList(session),S,selected,session);
  const list = dates.map(date=>{
    const key = sessionFor(date);
    return `<button class="alt planner-workout-day" data-workout-date="${date}" aria-pressed="${date===selected}"
      ${date===today()?'aria-current="date"':''} onclick="selectPlannerWorkout(this.dataset.workoutDate)">
      <small>${shortDay(date)}${date===today()?' · Today':''}</small>
      <b>${esc(names[key])}</b>${key==='rest'?'':`<span>${esc(timeFor(date))}</span>`}
    </button>`;
  }).join('');
  return `<section aria-label="Workout schedule"><h3>Workout schedule</h3>
    <div class="planner-area">${['Week','Month'].map(range=>
      `<button class="${workoutScheduleRange===range?'':'alt'}" aria-pressed="${workoutScheduleRange===range}"
        onclick="workoutScheduleRange='${range}';render()">${range}</button>`).join('')}</div>
    ${plannerPeriodHeader(workoutScheduleRange)}
    ${workoutScheduleRange==='Month'?'<div class="planner-workout-month">':''}${list}${workoutScheduleRange==='Month'?'</div>':''}
  </section>
  ${routine596()}
  <section id="plannerWorkoutDetails" aria-label="Selected workout"><small>${shortDay(selected)}${selected===today()?' · Today':''}</small>
    <h3>${esc(names[session])}</h3>
    ${session==='rest'?'<p>Recovery day.</p>':`<p>Scheduled at ${esc(timeFor(selected))}</p>`}
    ${exercises.length?`<details open><summary>Coach’s planned exercises</summary>
      <ul>${exercises.map(row=>{
        const [name,sets,range]=row.split('|');
        return `<li>${esc(name)} · ${esc(sets)} × ${esc(range)}</li>`;
      }).join('')}</ul></details>`:''}
    ${selected===today()&&session!=='rest'?'<button class="wide" onclick="dashboardStart()">Live Workout</button>':''}
  </section>`;
}

function mealPlannerView(){let tabs=[['Calendar','Plan'],['Recipes','Recipes'],['Groceries','Groceries'],['Saved','Saved']];let nav=`<div class="planner-tabs">${tabs.map(([t,label])=>`<button class="${plannerTab===t?'':'alt'}" aria-pressed="${plannerTab===t}" onclick="switchPlanner('${t}')">${label}</button>`).join('')}</div>`;let body='';if(plannerTab==='Calendar')body=plannerPlanView();if(plannerTab==='Recipes'){let p=picks(activeMeal(),cuisine).filter(matchesRecipe),idx=((rotation)%p.length+p.length)%p.length,x=p[idx];body=themedPlanner()+(x?`<section><button class="alt wide" onclick="openRecipeDetail(${x.i})">${dishPhoto(x.i)}<h3>${esc(x.r[1])}</h3>Open recipe →</button></section>`:'')+`<div class="grid">${p.slice(0,24).map(y=>`<button class="alt" onclick="openRecipeDetail(${y.i})">${esc(y.r[1])}</button>`).join('')}</div><small>Showing up to 24 matches; use filters or the browse dropdown for all matches.</small>`}if(plannerTab==='Saved')body=`<section><h3>Saved recipes</h3>${(S.recipeFav||[]).filter(i=>recipes[i]&&recipeAllowed(recipes[i])).map(i=>`<button class="alt wide" onclick="openPlanned(${i},'${recipes[i][4][0]}')">${esc(recipes[i][1])}</button>`).join('')||'No saved recipes yet.'}</section>`;if(plannerTab==='Groceries')body=shoppingView();if(plannerTab==='Detail')body=`<button class="alt wide" onclick="switchPlanner(returnPlanner,plannerRecipeSlot)">← ${tabs.find(([key])=>key===returnPlanner)?.[1]||'Recipes'}</button>${recipeCard({r:recipes[detailIndex],i:detailIndex})}`;return nav+body}
function photoLink(r){let q=encodeURIComponent(r[1].replace(/ adaptation| inspired/gi,''));return `<p><a style="color:#a5ef91" target="_blank" rel="noopener noreferrer" href="https://commons.wikimedia.org/w/index.php?search=${q}&title=Special:MediaSearch&type=image">See dish photos on Wikimedia Commons ↗</a></p><small>External photo search; results may vary. Internet required.</small>`}

// Approximate household weights for the form shown in the recipe.
const kitchenCupWeights = new Map(Object.entries({
  'white rice':158, 'brown rice':195, 'quinoa':185, 'bulgur cooked':182,
  'cooked spaghetti':140, 'pasta':140, 'soba cooked':114, 'cooked oatmeal':234,
  'oats dry':89, 'flour dry':120, 'whole wheat flour':113, 'chickpea flour':120,
  'semolina dry':167, 'cornmeal dry':156, 'sugar':198, 'black eyed peas dry':167,
  'black beans':172, 'kidney beans':177, 'pinto beans':171, 'white beans':179,
  'black eyed peas':171, 'chickpeas':164, 'lentils':198, 'fava beans':170,
  'split peas cooked':196, 'chicken breast':140, 'chicken thighs skinless':140,
  'grilled chicken breast':140, 'turkey':140, 'lean ground beef':170, 'ground pork':155,
  'salmon':140, 'cod':140, 'cooked fish':140, 'shrimp':145, 'tuna':154, 'tofu':248,
  'tomato':180, 'onion':160, 'bell pepper':149, 'broccoli':156, 'green beans':125,
  'carrots':156, 'carrot':156, 'peas':160, 'corn':165, 'cucumber':104, 'lettuce':47,
  'spinach':30, 'potato':156, 'sweet potato':200, 'cabbage':150, 'cooked cabbage':150,
  'mushrooms':156, 'zucchini':180, 'eggplant':99, 'pumpkin':245, 'okra':160,
  'collard greens':190, 'green onion':100, 'cilantro':16, 'parsley':60,
  'mango':165, 'pineapple':165, 'blueberries':148, 'peach':154, 'avocado':150,
  'almonds':143, 'peanuts':146, 'walnuts':117, 'cashews':137, 'coconut grated':80,
  'milk':244, 'coconut milk':240, 'greek yogurt':245, 'cottage cheese':226,
  'ricotta':246, 'cheddar cheese':113, 'mozzarella':113, 'parmesan':100,
  'tomato pasta sauce':260, 'salsa':250, 'salsa verde':250, 'hummus':246,
  'peanut butter':256, 'tahini':240, 'olive oil':216, 'sesame oil':218,
  'maple syrup':320, 'honey':336, 'butter':227, 'lemon juice':244, 'lime juice':242,
  'soy sauce':255, 'fish sauce':288, 'vinegar':239
}));
const kitchenTeaspoonWeights = new Map(Object.entries({
  garlic:3, ginger:2, cinnamon:2.6, cumin:2.1, turmeric:3, 'chili powder':2.7,
  'curry powder':2, 'garam masala':2, 'black pepper':2.3, cardamom:2,
  oregano:1, thyme:1, 'baking powder':4, miso:6, gochujang:6
}));
const kitchenCounts = new Map([
  ['egg',[50,'large egg','large eggs']],
  ['bread',[30,'slice','slices']],
  ['tortilla',[30,'small tortilla','small tortillas']],
  ['banana',[118,'medium banana','medium bananas']],
  ['apple',[182,'medium apple','medium apples']],
  ['pear',[178,'medium pear','medium pears']]
]);
const kitchenFractions = [[0,''],[1/8,'⅛'],[1/4,'¼'],[1/3,'⅓'],[1/2,'½'],[2/3,'⅔'],[3/4,'¾'],[7/8,'⅞'],[1,'']];

function kitchenQuantity(value, single, plural=single) {
  let whole = Math.floor(value);
  const part = value - whole;
  const [rounded,symbol] = kitchenFractions.reduce((best, option) =>
    Math.abs(part-option[0]) < Math.abs(part-best[0]) ? option : best);
  if (!whole && !rounded) return 'Less than ⅛ ' + single;
  if (rounded === 1) whole += 1;
  const amount = [whole || '',symbol].filter(Boolean).join(' ');
  return amount+' '+(whole + (rounded===1?0:rounded)>1?plural:single);
}

function recipeMeasure(name, grams, units) {
  if (units === 'kitchen') {
    const count = kitchenCounts.get(name);
    if (count) return kitchenQuantity(grams/count[0],count[1],count[2]);
    const spoonWeight = kitchenTeaspoonWeights.get(name);
    if (spoonWeight) {
      const tsp = grams/spoonWeight;
      return tsp>=3?kitchenQuantity(tsp/3,'tbsp'):kitchenQuantity(tsp,'tsp');
    }
    const cupWeight = kitchenCupWeights.get(name);
    if (cupWeight) {
      const cups = grams/cupWeight;
      if (cups>=.25) return kitchenQuantity(cups,'cup','cups');
      return cups>=1/16?kitchenQuantity(cups*16,'tbsp'):kitchenQuantity(cups*48,'tsp');
    }
  }
  return grams+' g';
}

let recipeUnits = 'grams';
try {
  if (readProfilePreference('myfit-recipe-units') === 'kitchen') recipeUnits = 'kitchen';
} catch (_) {}

function changeRecipeUnits(units) {
  recipeUnits = units === 'kitchen' ? 'kitchen' : 'grams';
  try {writeProfilePreference('myfit-recipe-units',recipeUnits)} catch (_) {}
  $('recipeMeasureHint').hidden = recipeUnits !== 'kitchen';
  for (const measure of $('fullRecipe').querySelectorAll('[data-recipe-grams]')) {
    measure.textContent = recipeMeasure(measure.dataset.ingredient,+measure.dataset.recipeGrams,recipeUnits);
  }
}

function recipeCard({r,i}) {
  const items = recipeItems(r,activeMeal(),scheduledRecipe);
  const [calories, protein, carbs, fat] = totals(items);
  const reference = sourcedBreakfastRecipes.get(r);
  return `<section id="fullRecipe">
    <small>${esc(r[0])} · ${activeMeal()}</small>
    <h3 class="recipe-title">${esc(r[1])}</h3>
    <label>Servings to prepare
      <select onchange="recipeServings=+this.value;render();$('fullRecipe').scrollIntoView()">
        ${[1,2,3,4,5,6,8].map(n=>`<option ${n===recipeServings?'selected':''}>${n}</option>`).join('')}
      </select>
    </label>
    <h4>Ingredients for ${recipeServings} ${recipeServings===1?'serving':'servings'}</h4>
    <label>Measure ingredients in
      <select id="recipeUnits" onchange="changeRecipeUnits(this.value)">
        <option value="grams" ${recipeUnits==='grams'?'selected':''}>Grams</option>
        <option value="kitchen" ${recipeUnits==='kitchen'?'selected':''}>Kitchen measures (cups, spoons, counts)</option>
      </select>
    </label>
    <p class="muted">Weights are cooked or ready to eat unless marked otherwise.</p>
    <p id="recipeMeasureHint" class="muted" ${recipeUnits==='kitchen'?'':'hidden'}>Kitchen measures are approximate. Measure spinach as raw leaves, chop or crumble cooked meat, and drain canned ingredients. Some ingredients are shown in grams.</p>
    ${scheduledRecipe&&recipeServings>1?'<small>The grocery plan includes one serving for this meal.</small>':''}
    <ul class="recipe-ingredients">
      ${items.map(item=>`<li><label>
        <input type="checkbox"><span>${esc(item.name)}</span><b data-ingredient="${esc(item.name)}" data-recipe-grams="${item.g*recipeServings}">${recipeMeasure(item.name,item.g*recipeServings,recipeUnits)}</b>
      </label></li>`).join('')}
    </ul>
    ${cookGuide(r,i)}
    ${reference?`<details class="recipe-extra"><summary>Recipe source</summary>
      ${reference.note?`<p>${esc(reference.note)}</p>`:''}
      <p><a href="${esc(reference.url)}" target="_blank" rel="noopener noreferrer">${esc(reference.source)}</a></p>
    </details>`:''}
    <details class="recipe-extra"><summary>Nutrition per serving</summary>
      <p>${calories} kcal · ${protein} g protein · ${carbs} g carbs · ${fat} g fat</p>
      <small>Estimated from the listed ingredients and portions.</small>
    </details>
    <details class="recipe-extra"><summary>Dish photos</summary>${dishPhoto(i)}${photoLink(r)}</details>
    <div class="recipe-detail-actions">
      <button class="wide" onclick="swapRecipe(${i},true)">Use for ${activeMeal()} · ${plannerShortDate(day())}</button>
      ${day()<=today()?`<button class="alt wide" onclick="useRecipe(${i})">Log one serving · review first</button>`:''}
      <button class="alt wide" onclick="saveRecipe(${i})">Save recipe to favourites</button>
    </div>
  </section>`;
}
function useRecipe(i) {
  if (day() > today()) return;
  if (draft.length && !confirm('Replace the current meal draft?')) return;
  draft = recipeItems(recipes[i],activeMeal(),scheduledRecipe);
  $('date').value = day();
  foodEdit = null;
  tab = 'Food';
  foodOpen('Log','text');
}
function saveRecipe(i){S.recipeFav??=[];if(!S.recipeFav.includes(i))S.recipeFav.push(i);save();render()}
function swapRecipe(index, returnToPlan=false) {
  const date = day();
  const type = activeMeal();
  if (!recipes[index]?.[4].includes(type)) return;
  const key = date+'|'+type;
  const previous = JSON.stringify(S);
  (S.manualPlan ??= {})[key] = index;
  if (S.mealSlots && !(S.meals[date] || []).some(meal => meal.planSlot === key)) delete S.mealSlots[key];
  if (!save()) {
    S = JSON.parse(previous);
    return;
  }
  if (returnToPlan) switchPlanner('Calendar');
  else render();
}
function grocery(){let d=new Date(day()+'T12:00:00'),bag={};for(let j=0;j<7;j++){let k=dateKey(d);for(let type of mealTypes){let x=planned(k,type);for(let item of recipeItems(x.r,type,true))bag[item.name]=(bag[item.name]||0)+item.g;}d.setDate(d.getDate()+1)}return Object.entries(bag).sort().map(([n,g])=>`${n}: ${g} g`).join('\n')}
function planHash(k,type){let h=2166136261;for(let c of k+'|'+type){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}
function planned(k,type){let p=picks(type),n=p.length;if(!n)return null;let i=S.plan?.[k+'|'+type],saved=p.find(x=>x.i===i);if(saved)return saved;let seed=dateSeed(k);let stable=p.slice().sort((a,b)=>planHash(String(a.i),type)-planHash(String(b.i),type));let recent=new Set();for(let j=1;j<=6;j++){let d=new Date((seed-j)*86400000).toISOString().slice(0,10),manual=S.plan?.[d+'|'+type];recent.add(manual??stable[((seed-j)%n+n)%n].i)}let start=((seed%n)+n)%n;return Array.from({length:n},(_,j)=>stable[(start+j)%n]).find(x=>!recent.has(x.i))||stable[start]}
function regenerateWeek(){S.plan??={};let start=dateSeed(day()),p=prefs(),used=new Set(),chosen=new Set();for(let j=0;j<7;j++){let k=new Date((start+j)*86400000).toISOString().slice(0,10);for(let type of mealTypes){let pool=picks(type),span=p.style==='Strict'?(type==='Breakfast'||type==='Snack'?7:Math.ceil(7/p.days)):p.style==='Meal prep'?Math.ceil(7/p.days):p.style==='Balanced'?(type==='Breakfast'?3:2):1;let prev=j&&S.coachPlans?.[coachPlanKey(new Date((start+j-1)*86400000).toISOString().slice(0,10),type)];let x=j%span!==0?pool.find(y=>y.i===prev):null;if(!x){let options=pool.filter(y=>!chosen.has(y.i));if(!options.length)options=pool;x=options.map(y=>({y,score:planScore(y,type,p,used)})).sort((a,b)=>b.score-a.score)[0].y;chosen.add(x.i)}(S.coachPlans??={})[coachPlanKey(k,type)]=x.i;x.r[2].forEach(([n])=>used.add(n))}}save();render()}
function showGrocery(){ $('groceries').textContent=grocery(); }
function favorite(){if(!draft.length||draft.some(x=>x.manual&&!x.k))return alert('Complete nutrition values first.');let name=prompt('Name this meal',draft.map(x=>x.name).join(', '));if(name){S.favorites.push({name,items:JSON.parse(JSON.stringify(draft))});save();render()}}function useFavorite(i){draft=JSON.parse(JSON.stringify(S.favorites[i].items));foodOpen('Log')}function voice(){let R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return alert('Voice recognition is not supported here. Use your keyboard microphone instead.');let r=new R();r.lang='en-CA';r.onresult=e=>{$('mealtext').value=e.results[0][0].transcript;parse()};r.onerror=()=>{if($('voiceStatus'))$('voiceStatus').textContent='Voice unavailable. Try typing or keyboard dictation.'};try{r.start()}catch(e){alert('Voice unavailable')}}function restTimer(n){clearInterval(timerId);let end=Date.now()+n*1000;function tick(){let left=Math.max(0,Math.ceil((end-Date.now())/1000));if($('timer'))$('timer').textContent=left?Math.floor(left/60)+':'+String(left%60).padStart(2,'0'):'Rest complete';if(!left)clearInterval(timerId)}tick();timerId=setInterval(tick,250)}function coachDate(offset){let d=new Date(day()+'T12:00:00');d.setDate(d.getDate()+offset);return dateKey(d)}
function coachStats(offset=0){let dates=Array.from({length:7},(_,i)=>coachDate(offset-i));let logged=dates.filter(d=>(S.meals[d]||[]).length);let values=logged.map(d=>totals(S.meals[d].flatMap(m=>m.items)));let avg=values.length?values[0].map((_,i)=>Math.round(values.reduce((s,v)=>s+v[i],0)/values.length)):null;let trained=dates.filter(d=>Object.entries(S.work).some(([k,v])=>k.startsWith(d+'|')&&+v.sets>0)).length;return {logged:logged.length,avg,trained}}
function coachSuggestions(a,t){let remaining=t[0]-a[0],protein=Math.max(0,t[1]-a[1]);if(remaining<150)return [];let p=prefs(),type=autoMeal(),pan=p.pantry.toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);return picks(type).map(({r,i})=>{let base=recipeItems(r,type,true),v=totals(base),scale=Math.min(1,remaining/Math.max(1,v[0]));if(scale<.5)return null;let items=base.map(x=>({...x,g:Math.floor(x.g*scale)}));v=totals(items);let cost=costProxy(r),shared=r[2].filter(([n])=>pan.includes(n)).length;let score=nutritionScore(r,v,type)*2+Math.min(protein,v[1])*.35+shared*4+(p.tier==='Budget friendly'?-cost*2:p.tier==='Splurge'?cost*.5:-cost*.5)+(p.style==='Strict'?v[1]/Math.max(1,v[0])*100:0);return {i,v,items,score}}).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,3)}
function coachLog(i){let x=coachSuggestions(sum(),targets()).find(x=>x.i===i);if(!x)return;if(draft.length&&!confirm('Replace your current meal draft?'))return;draft=x.items;foodEdit=null;tab='Food';foodOpen('Log','text')}
const coachStyles=[['The Beast','🔥',5,'Bring intensity to every controlled rep. Finish strong!','Fuel the work. Make protein a priority.','Recovery is part of getting stronger.'],['The Drill Sergeant','🛡️',4,'Follow the plan. Record your sets and stay consistent.','Check your targets and plan your next meal.','Schedule recovery and stick to it.'],['The Athlete','🏆',4,'Execute with precision. Quality reps build performance.','Fuel performance with balanced meals.','Recover well so you can perform again.'],['The Scientist','🧠',3,'Track repetitions and effort to evaluate training progress.','Use complete food logs to evaluate energy and protein intake.','Assess sleep and soreness before increasing training load.'],['The Personal Trainer','💪',3,'Focus on achievable targets and good technique today.','Choose a balanced meal that supports your goals.','Make time for rest and mobility.'],['The Cheerleader','💚',2,'Every quality rep counts. Celebrate showing up!','Small consistent nutrition choices add up.','Rest is progress too. You deserve recovery.'],['The Zen Coach','🌿',1,'Move with intention, breathe and respect your limits.','Eat mindfully and notice hunger and fullness.','Enjoy gentle movement and restorative breathing.']];
function coachPrefs(){return S.coachPrefs??={style:4,auto:false,intensity:3,account:3,detail:3,profanity:false,voice:false}}
function setCoach(key,value) {
  const before = JSON.stringify(S);
  const prefs = coachPrefs();
  if (key==='auto'&&prefs.auto!==value&&S.setup596?.completed) flagProgramReview('coach');
  prefs[key]=value;
  if (!save()) {S=JSON.parse(before);return;}
  render();
  if ($('coachStyleSettings')) $('coachStyleSettings').open=true;
}
function chooseCoach(index,look) {
  const i = Number(index);
  if (!Number.isInteger(i) || !coachStyles[i]) return;
  const prior = JSON.stringify(S);
  const before = activeCoach();
  const p = coachPrefs();
  const changingStyle = p.auto || i!==before;
  const changingAppearance = Number.isInteger(look) && look!==avatarChoice(p,i);
  if (look!==undefined) (p.avatars??={})[i]=look;
  if (changingStyle || look===undefined) Object.assign(p,{style:i,intensity:coachStyles[i][2],auto:false});
  if ((changingStyle||changingAppearance) && S.setup596?.completed) flagProgramReview('coach');
  if (!save()) {S=JSON.parse(prior);return;}
  rotation=0;
  render();
  if ($('coachStyleSettings')) $('coachStyleSettings').open=true;
}
function coachMessage(w){let p=coachPrefs(),i=activeCoach(),c=coachStyles[i]||coachStyles[4],msg=w==='rest'?c[5]:c[3];let n=p.auto?coachStyles[3][4]:c[4];return [c[0],(p.intensity>=5?(p.profanity?'Give it your damn best! ':'Bring your best effort! '):p.intensity<=2?'At your own pace. ':'')+msg+' '+n+(p.account>=4?' Check off your planned actions today.':p.account<=2?' Adjust the plan if needed.':'')+(p.detail>=4?' Use controlled technique, adequate rest and consistent logs to assess progress.':'')]}
function speakCoach(){if(!('speechSynthesis' in window))return alert('Voice coaching is unavailable on this device.');let u=new SpeechSynthesisUtterance(coachMessage(workout())[1]);u.rate=coachPrefs().intensity>=4?1.08:.88;speechSynthesis.cancel();speechSynthesis.speak(u)}
function coachPersonality(w){let p=coachPrefs(),m=coachMessage(w);return `<div class="pill">${esc(m[0])}${p.auto?' · Auto':''}</div><p><b>${esc(m[1])}</b></p>${p.voice?'<button class="alt wide" onclick="speakCoach()">🔊 Hear your coach</button>':''}<details id="coachStyleSettings"><summary>Customize coaching style</summary><label><input type="checkbox" ${p.auto?'checked':''} onchange="setCoach('auto',this.checked)"> Automatic coach by workout</label>${[['intensity','Motivational intensity'],['account','Accountability'],['detail','Explanation detail']].map(([k,n])=>`<label>${n}: ${p[k]}/5<input type="range" min="1" max="5" value="${p[k]}" onchange="setCoach('${k}',+this.value)"></label>`).join('')}<label><input type="checkbox" ${p.profanity?'checked':''} onchange="setCoach('profanity',this.checked)"> Allow mild profanity</label><label><input type="checkbox" ${p.voice?'checked':''} onchange="setCoach('voice',this.checked)"> Enable voice playback</label><small>Original coaching personalities. Advice and safety limits stay the same. Voice uses your device's speech engine.</small></details>`}
function coach(a,t){let remaining=t[0]-a[0],protein=Math.max(0,t[1]-a[1]),w=workout(),stats=coachStats(),prev=coachStats(-7);let completed=exerciseList(w).filter(x=>+S.work[day()+'|'+x.split('|')[0]]?.sets>=+x.split('|')[1]).length;let list=exerciseList(w);let suggestions=coachSuggestions(a,t);let trends=[0,1,3].map(i=>{let m=S.measure.filter(x=>x.date<=day()&&x.v[i]&&Number.isFinite(+x.v[i])).sort((a,b)=>a.date.localeCompare(b.date));let last=m.at(-1),first=m.find(x=>last&&Date.parse(last.date)-Date.parse(x.date)>=14*86400000);return first&&last?`${['Weight','Waist','Chest','Thigh'][i]}: ${(Number(last.v[i])-Number(first.v[i])).toFixed(1)} ${i?'in':'lb'} (${first.date} to ${last.date})`:null}).filter(Boolean);return `${coachPersonality(w)}<h3>Daily briefing · ${esc(day())}</h3><p>${!meals().length?'No meals logged for this date yet.':remaining>0?remaining+' estimated kcal remaining.':'Estimated calorie target reached; no need to compensate with exercise.'} ${protein?protein+' g protein remaining.':'Protein target reached.'}</p><p><b>Training:</b> ${names[w]}. ${list.length?completed+' of '+list.length+' planned exercises have all sets recorded.':'Recovery day.'} ${w==='rest'?'An easy walk or gentle mobility is optional.':'Warm up and keep 1–3 reps in reserve; avoid painful movements.'}</p><button class="alt wide" onclick="tab='Workout';render()">Open training</button><details open><summary>Suggested ${autoMeal().toLowerCase()} options</summary><small>${esc(prefs().tier)} · pantry-aware ranking · estimated portions, not live prices</small>${suggestions.map(x=>`<div class="line"><div><b>${esc(recipes[x.i][1])}</b><br><small>${x.v[0]} kcal · ${x.v[1]} g protein</small></div><button class="alt" onclick="coachLog(${x.i})">Review</button></div>`).join('')||'<p>No suitable suggestion within the current estimated calorie allowance. Eat according to hunger and needs; targets are not hard limits.</p>'}</details><details><summary>Seven-day review</summary><p>${stats.logged}/7 days with food entries · ${stats.trained} days with completed sets recorded.</p>${stats.avg?`<p>Average on logged days: ${stats.avg[0]} kcal · ${stats.avg[1]} g protein. Partial logs can underestimate intake.</p>`:'<p>No food data yet.</p>'}${prev.avg?`<p>Previous seven days: ${prev.avg[0]} kcal · ${prev.avg[1]} g protein on ${prev.logged} logged days.</p>`:''}<p>${stats.logged>=5&&stats.avg[1]<t[1]?'Consider protein-rich meals if your logs are complete.':'Keep recording consistently before interpreting nutrition trends.'}</p></details><details><summary>Progress & recovery</summary>${trends.map(x=>`<p>${esc(x)}</p>`).join('')||'<p>Record measurements at least two weeks apart to see trends.</p>'}<p>Review sleep, soreness and technique before increasing weights. Current workout logs do not record actual reps or effort, so automatic weight increases are not recommended.</p><button class="alt wide" onclick="tab='Progress';render()">View progress & backup</button></details><small>Rule-based guidance using your local records. No automatic target changes or medical assessment.</small>`}
function charts(){return ['Weight (lb)','Waist (in)','Chest (in)','Thigh (in)','Arm (in)'].map((n,i)=>{let v=S.measure.filter(m=>m.v[i]&&Number.isFinite(+m.v[i])).sort((a,b)=>a.date.localeCompare(b.date));if(!v.length)return '';let vals=v.map(m=>+m.v[i]),lo=Math.min(...vals),hi=Math.max(...vals),span=hi-lo||1;let pts=vals.map((x,j)=>[20+j*260/Math.max(1,vals.length-1),100-(x-lo)/span*75]);return `<p><b>${n}</b> · ${vals.at(-1)}</p><svg viewBox="0 0 300 120" width="100%" role="img" aria-label="${n} trend"><polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#a5ef91" stroke-width="3"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#a5ef91"/>`).join('')}</svg><small>${esc(v[0].date)} – ${esc(v.at(-1).date)} · range ${lo}–${hi}</small>`}).join('')||'Add measurements to see your trends.'}function drawDraft(){if(!$('draft'))return;$('draft').innerHTML=draft.length?draft.map((x,i)=>`<div class="line"><div><b>${esc(x.name)}</b><br><small>${x.manual?'Unknown food — enter label values below':Math.round(x.k*x.g/100)+' kcal · '+esc(x.source||'Generic estimate')}</small></div><input type="number" min="1" aria-label="Amount (${esc(x.unit||'g')})" value="${x.g}" onchange="draft[${i}].g=Math.max(0,+this.value);drawDraft()"><button class="alt" onclick="draft.splice(${i},1);drawDraft()">×</button></div>${x.assumption?`<small>${esc(x.assumption)}</small>`:''}${x.review?`<p class="warn">${esc(x.review)}</p>`:''}${rawNutrition[x.name]&&!x.manual?`<label>Weight basis<select onchange="changeBasis(${i},this.value)"><option value="standard" ${x.weightBasis!=='raw'?'selected':''}>Cooked / standard</option><option value="raw" ${x.weightBasis==='raw'?'selected':''}>Raw / dry</option></select></label>`:''}${x.manual?['k','p','c','f'].map((k,j)=>`<label>${['Calories','Protein g','Carbs g','Fat g'][j]} per 100 g<input type="number" min="0" value="${x[k]}" onchange="draft[${i}].${k}=Math.max(0,+this.value);drawDraft()"></label>`).join(''):''}`).join('')+nutritionReview()+`<button class="wide" onclick="logMeal()">Confirm & log meal</button> <button class="alt wide" onclick="favorite()">Save as favourite</button>`:''}function saveMeals(date, meals) {
  const previous = S.meals[date];
  S.meals[date] = meals;
  if (save()) return true;
  if (previous === undefined) delete S.meals[date];
  else S.meals[date] = previous;
  return false;
}

function removeMeal(date, index) {
  const meals = S.meals[date];
  const slot = meals[index].planSlot;
  const previousStatus = slot ? S.mealSlots?.[slot] : undefined;
  if (previousStatus !== undefined) delete S.mealSlots[slot];
  if (saveMeals(date, meals.filter((_, i) => i !== index))) {
    render();
  } else if (previousStatus !== undefined) {
    S.mealSlots[slot] = previousStatus;
  }
}

function deleteMeal(date, index) {
  if (confirm('Delete meal?')) removeMeal(date, index);
}

function logMeal() {
  if (draft.some(x => !validItem(x))) return alert('Check serving weights and nutrition values.');
  if (draft.some(x => x.manual && !x.k)) return alert('Enter calories for unknown foods or remove them.');
  if (!draft.length) return;

  const date = foodEdit?.date ?? day();
  if (!foodEdit && date > today()) return alert('Choose today or an earlier date to log food.');
  const meals = [...(S.meals[date] || [])];
  if (foodEdit) meals[foodEdit.i] = {...meals[foodEdit.i], items: draft};
  else meals.push({items: draft});
  if (!saveMeals(date, meals)) return;

  foodEdit = null;
  draft = [];
  foodOpen('Today');
}
function record(n,k,v){if(v!==''&&(!Number.isFinite(+v)||+v<0)){alert('Enter a non-negative number.');return}let key=day()+'|'+n;(S.work[key]??={})[k]=v;save()}function saveProfile(profile) {
  const previous = S.profile;
  const previousReview = S.programReview;
  S.profile = {...profile,startingProfile:previous.startingProfile || startingProfileFrom(previous)};
  if (profile.goal!==previous.goal) flagProgramReview('goal');
  if (save()) return true;
  S.profile = previous;
  if (previousReview===undefined) delete S.programReview;
  else S.programReview = previousReview;
  return false;
}

function startingProfileFrom(profile) {
  const draft = S.setup596?.completed ? S.setup596.draft : null;
  return {age:draft?.age || profile.age,height:draft?.height || profile.height,
    weight:profile.baseline597?.v?.[0] || draft?.weight || profile.weight};
}

function updateGoals(){let p={...S.profile};for(let k of ['age','height','weight','activity','days'])p[k]=+$(k).value;for(let k of ['sex','goal'])p[k]=$(k).value;if(!['age','height','weight','activity','days'].every(k=>Number.isFinite(p[k]))||p.age<18||p.age>100||p.height<120||p.height>230||p.weight<80||p.weight>600){alert('Check adult profile values.');return}p.priorities=['legs','chest','back','arms','shoulders','core','flexibility'].filter(n=>$('priority-'+n).checked);if(p.priorities.filter(n=>n!=='flexibility').length>3){alert('Choose up to three strength priorities.');return}if(saveProfile(p))render()}function measure(){let v=Array.from({length:5},(_,i)=>$('m'+i).value);if(!v.some(Boolean))return;if(v.some(x=>x!==''&&(!Number.isFinite(+x)||+x<=0))){alert('Enter positive measurements.');return}S.measure.push({date:day(),v});save();render()}async function checkUpdate(){try{if(navigator.serviceWorker){let r=await navigator.serviceWorker.getRegistration();if(r)await r.update()}location.replace(location.pathname+"?v="+Date.now())}catch(e){alert("Update check failed. Reconnect and try again.")}}function backup(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='myfit-backup.json';a.click();URL.revokeObjectURL(a.href)}async function restore(el){if(profileDirectoryInvalid)return alert('The saved profile list could not be read.');try{let x=JSON.parse(await el.files[0].text());if(!validState(x))throw 0;if(!confirm('Replace this profile’s records with this backup? Export current data first if needed.'))return;let previous=S;try{localStorage.setItem(profileStorageKey('myfit-v1'),JSON.stringify(x))}catch(e){alert('Restore failed: storage unavailable. Current records unchanged.');return}storageBlocked=false;S=x;S.favorites??=[];S.profile.priorities??=['legs','chest'];save();render()}catch(e){alert('Invalid backup')}}
function validItem(x){return !!x&&typeof x.name==='string'&&['g','k','p','c','f'].every(k=>typeof x[k]==='number'&&Number.isFinite(x[k])&&x[k]>=0)&&x.g>0;}
function validState(x){let obj=o=>!!o&&typeof o==='object'&&!Array.isArray(o),num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b,date=d=>/^\d{4}-\d{2}-\d{2}$/.test(d);if(!obj(x)||!obj(x.profile)||!obj(x.meals)||!obj(x.work)||!Array.isArray(x.measure))return false;let p=x.profile;if(!num(p.age,18,100)||!num(p.height,120,230)||!num(p.weight,80,600)||![1.2,1.375,1.5,1.725].includes(p.activity)||![3,4,5].includes(p.days)||!['male','female'].includes(p.sex)||!['recomp','bulk','cut','maintain','mobility'].includes(p.goal))return false;if(p.priorities!==undefined&&!Array.isArray(p.priorities))return false;return Object.entries(x.meals).every(([d,m])=>date(d)&&Array.isArray(m)&&m.every(y=>obj(y)&&Array.isArray(y.items)&&y.items.every(validItem)))&&Object.values(x.work).every(obj)&&x.measure.every(m=>obj(m)&&date(m.date)&&Array.isArray(m.v))&&['favorites','recipeFav'].every(k=>x[k]===undefined||Array.isArray(x[k]))&&['coachPrefs','dailyCoach','prep','manualPlan','coachPlans','coachDelivered','weekPlans','shoppingChecksByRange'].every(k=>x[k]===undefined||obj(x[k]))&&(!x.dailyCoach||obj(x.dailyCoach.enabled));}

// v5 coaching orchestration: shared logs, distinct strategies.
const strategies=[
['Hypertrophy','Protein-forward meals','Bring focus to every set.','Fuel your recovery.','Finish strong, then rest.'],
['Structured circuits','Repeatable meal prep','Your mission: show up.','Stick to your meal schedule.','Review your mission and recover.'],
['Functional performance','Carbohydrates and protein for training','Move with precision today.','Fuel your next performance.','Recover for tomorrow.'],
['Measured progression','Macro-balanced meals','Assess energy and track your effort.','Check your estimated macros.','Review your logs and recovery.'],
['Balanced strength','Flexible balanced meals','Build a sustainable routine today.','Choose a satisfying balanced meal.','Reflect on what worked.'],
['Accessible movement','Simple satisfying meals','Small steps count today!','Celebrate a nourishing meal.','Every effort counts. Rest well.'],
['Mindful low-impact movement','Plant-forward balanced meals','Breathe and move with intention.','Eat slowly and notice fullness.','Unwind with gentle breathing.']];
function activeCoach(){let p=coachPrefs();return p.auto?(S.profile.goal==='mobility'?6:S.profile.goal==='bulk'?0:S.profile.goal==='cut'?4:2):Math.max(0,Math.min(6,+p.style||0))}
const originalExercises=exerciseList;
exerciseList=function(w){let i=activeCoach(),a=originalExercises(w);if(w==='rest')return a;if(w==='mobility')return [ ['Easy walk|1|15 min','Chest stretch|2|30 sec','Hip flexor stretch|2|30 sec/side'],['March in place|1|5 min','Calf stretch|2|30 sec','Shoulder circles|2|10'],['Easy walk|1|10 min','Leg swings|2|10/side','Thoracic rotation|2|8/side'],a,['Easy walk|1|20 min','Hip flexor stretch|2|30 sec/side','Chest stretch|2|30 sec'],['Easy walk|1|10 min','Gentle shoulder circles|1|10','Calf stretch|1|30 sec'],['Cat cow|2|8','Bird dog|2|8/side','Child pose|2|30 sec','Gentle breathing|1|3 min'] ][i];if(i===6||i===5){let lower=['Chair squat|2|8–12','Glute bridge|2|10','Standing calf raise|2|12'],upper=['Wall push-up|2|8–12','Resistance band row|2|10','Bird dog|2|8/side'];return [...( ['lower','posterior'].includes(w)?lower:['upper','push','pull'].includes(w)?upper:[...lower,...upper]),...(i===6?['Gentle breathing|1|3 min']:[])];}if(i===1||i===2){let lower=['Dumbbell step-up|2|10/side','Glute bridge|2|12','Calf raise|2|12'],upper=['Incline push-up|2|10','Resistance band row|2|12','Dead bug|2|8/side'];return [...(['lower','posterior'].includes(w)?lower:['upper','push','pull'].includes(w)?upper:[...lower,...upper]),i===1?'Brisk walk|1|10 min':'Farmer carry|2|30 sec'];}return a.map((x,j)=>{let [n,k,r]=x.split('|');return [n,i===0&&j===0?Math.max(3,+k):k,r].join('|')})};
const originalPicks=picks;
function nutritionScore(r,v,type){let i=activeCoach(),n=r[2].length,plant=r[2].filter(([x])=>/beans|lentil|tofu|peas|spinach|vegetable|carrot|oat|cabbage|broccoli|fruit|tomato|okra/.test(x)).length,k=Math.max(1,v[0]),p=v[1]*4/k,c=v[2]*4/k,f=v[3]*9/k;return [p*100,30-n*3+p*15,c*65+p*35,40-80*Math.abs(p-.28)-50*Math.abs(c-.45),plant*3-35*Math.abs(p-.25)-25*Math.abs(f-.3),35-n*4+plant*2,plant*9+p*15][i]}
picks=function(type,c='All cuisines'){return originalPicks(type,c).filter(x=>x.r[2].every(([n])=>foods.some(f=>f[0]===n))).map(x=>({...x,rank:nutritionScore(x.r,totals(recipeItems(x.r,type,true)),type)})).sort((a,b)=>b.rank-a.rank||a.i-b.i)};
function coachPlanKey(k,type){return activeCoach()+'|'+k+'|'+type}
planned=function(k,type){let a=picks(type);if(!a.length)return null;let manual=S.manualPlan?.[k+'|'+type],saved=a.find(x=>x.i===manual);if(saved)return saved;let week=S.weekPlans?.[plannerPeriod(k,'Week')[0]], themed=a.find(x=>x.i===week?.slots?.[k+'|'+type]);if(themed)return themed;let generated=a.find(x=>x.i===S.coachPlans?.[coachPlanKey(k,type)]);if(generated)return generated;let n=a.length;return a[((dateSeed(k)%n)+n)%n]};
const basePlanScore=planScore;
planScore=function(x,type,p,used){return basePlanScore(x,type,p,used)+nutritionScore(x.r,totals(recipeItems(x.r,type,true)),type)};
function dailyPrefs(){return S.dailyCoach??={mode:'active',morning:'07:00',meal:'12:00',workout:'17:00',evening:'21:00',quietStart:'22:00',quietEnd:'06:00',enabled:{morning:true,meal:true,workout:true,evening:true}}}
function dailySet(k,v){if(k!=='mode'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))return;dailyPrefs()[k]=v;save();render()}
function dailyToggle(k,v){dailyPrefs().enabled[k]=v;save();render()}
function dailyEvents(date=day()){let p=dailyPrefs(),i=activeCoach(),c=strategies[i];return [['morning','Morning briefing',c[2]],['meal','Meal reminder',c[3]],['workout','Training reminder',schedule()[(new Date(date+'T12:00:00').getDay()+6)%7]==='rest'?coachStyles[i][5]:coachStyles[i][3]],['evening','Evening check-in',c[4]]].map(([k,n,m])=>({k,n,m,time:p[k]}))}
function coachDaily(){let p=dailyPrefs(),i=activeCoach(),c=strategies[i];return `<section><div class="pill">${coachStyles[i][1]} ${coachStyles[i][0]}</div><h3>${c[0]}</h3><p>${c[2]}</p><small>Nutrition: ${c[1]}</small><p>${coachStyles[i][4]}</p><details><summary>Daily coaching & reminders</summary><label>Coaching involvement<select onchange="dailySet('mode',this.value)">${['passive','active','proactive'].map(x=>`<option ${p.mode===x?'selected':''}>${x}</option>`).join('')}</select></label>${dailyEvents().map(e=>`<div class="line"><div><label><input style="width:auto" type="checkbox" ${p.enabled[e.k]?'checked':''} onchange="dailyToggle('${e.k}',this.checked)"> ${e.n}</label><small>${e.m}</small></div><input type="time" value="${e.time}" onchange="dailySet('${e.k}',this.value)"></div>`).join('')}<label>Quiet hours start<input type="time" value="${p.quietStart}" onchange="dailySet('quietStart',this.value)"></label><label>Quiet hours end<input type="time" value="${p.quietEnd}" onchange="dailySet('quietEnd',this.value)"></label><button class="alt wide" onclick="enableCoachNotifications()">Enable device notifications</button><small>Reminders run while MyFit is open. Closed-app delivery is not supported yet.</small></details></section>`}
async function enableCoachNotifications(){if(!('Notification' in window))return alert('Notifications unavailable in this browser.');try{let r=await Notification.requestPermission();alert('Notification permission: '+r)}catch(e){alert('Notification permission unavailable.')}}
async function coachTick(){let p=dailyPrefs();if(p.mode==='passive')return;let now=new Date(),hm=now.toTimeString().slice(0,5),quiet=p.quietStart===p.quietEnd?false:p.quietStart<p.quietEnd?hm>=p.quietStart&&hm<p.quietEnd:hm>=p.quietStart||hm<p.quietEnd;if(quiet)return;for(let e of dailyEvents(today())){let key=today()+'|'+e.k;let mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5)),late=mins(hm)-mins(e.time);if(e.k==='workout'&&(schedule()[(now.getDay()+6)%7]==='rest'||trainingStatus(S,today(),exerciseList(schedule()[(now.getDay()+6)%7])).kind==='complete'||['stop','recover'].includes(recoveryAdvice(S.recovery?.[today()]))))continue;if(!p.enabled[e.k]||!Number.isFinite(late)||late<0||late>30||S.coachDelivered?.[key])continue;(S.coachDelivered??={})[key]=true;save();let el=document.createElement('section');el.setAttribute('role','status');el.textContent=coachStyles[activeCoach()][0]+': '+e.m;document.querySelector('main')?.prepend(el);if('Notification' in window&&Notification.permission==='granted'){try{let r=await navigator.serviceWorker?.getRegistration();if(r)await r.showNotification(coachStyles[activeCoach()][0],{body:e.m});else new Notification(coachStyles[activeCoach()][0],{body:e.m})}catch(e){}}}}
// Normalize duplicate food names, preferring the later prepared profile when present.
{const unique=new Map();for(const f of foods){const old=unique.get(f[0]);if(!old)unique.set(f[0],f);else {const chosen=preparedProfiles.find(x=>x[0]===f[0])||old;unique.set(f[0],[...chosen.slice(0,7),[...new Set((old[7]+'|'+f[7]).split('|'))].join('|')]);}}foods.splice(0,foods.length,...unique.values());const sesame=foods.find(f=>f[0]==='sesame oil');if(sesame){sesame[5]=216;sesame[6]=14;}}
const originalRender=render;
render=function(){originalRender();let i=activeCoach();if(['Home','Coach'].includes(tab))$('app').insertAdjacentHTML('afterbegin',coachDaily());else if(['Food','Workout','Planner','Progress'].includes(tab))$('app').insertAdjacentHTML('afterbegin',`<section><div class="pill">${coachStyles[i][0]}</div><small>${tab==='Workout'?coachStyles[i][3]:tab==='Progress'?strategies[i][4]:coachStyles[i][4]}</small></section>`)};
setInterval(coachTick,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)coachTick()});

function slotStatus(k,t){return S.mealSlots?.[k+'|'+t]||''}
function toggleSlot(t,status){let k=day()+'|'+t;S.mealSlots??={};if(S.mealSlots[k]===status)delete S.mealSlots[k];else S.mealSlots[k]=status;save();render()}
// Shopping-only estimated ingredient yields; do not alter logged nutrition.
const shoppingBreakdown={'jerk chicken':[['raw chicken, boneless',1.33],['jerk seasoning',.06]],'rice and peas':[['dry rice',.30],['cooked kidney beans',.25],['coconut milk',.18],['thyme',.003],['green onion',.025]]};
function shoppingBag(dates=plannerPeriod(day(), groceryRange)) {
  const bag = {};
  for (const date of dates) {
    for (const type of mealTypes) {
      if (slotStatus(date,type) || (S.meals[date] || []).some(meal => meal.planSlot === date+'|'+type)) continue;
      const selection = planned(date,type);
      if (!selection) continue;
      for (const item of recipeItems(selection.r,type,true)) {
        for (const [name,factor] of shoppingBreakdown[item.name] || [[item.name,1]]) {
          const shoppingName = name==='carrot'?'carrots':name==='cooked kidney beans'?'kidney beans':name;
          bag[shoppingName] = (bag[shoppingName] || 0) + item.g * factor;
        }
      }
    }
  }
  return bag;
}
const shoppingProduce = new Map([
  ['banana',[118,'medium banana','medium bananas']],
  ['apple',[182,'medium apple','medium apples']],
  ['pear',[178,'medium pear','medium pears']],
  ['orange',[131,'medium orange','medium oranges']],
  ['peach',[150,'medium peach','medium peaches']],
  ['mango',[200,'medium mango','medium mangoes']],
  ['avocado',[140,'medium avocado','medium avocados']],
  ['plantain',[175,'medium plantain','medium plantains']],
  ['pineapple',[500,'small pineapple','small pineapples']],
  ['potato',[150,'medium potato','medium potatoes']],
  ['sweet potato',[130,'medium sweet potato','medium sweet potatoes']],
  ['tomato',[120,'medium tomato','medium tomatoes']],
  ['onion',[110,'medium onion','medium onions']],
  ['bell pepper',[115,'medium bell pepper','medium bell peppers']],
  ['serrano pepper',[6,'serrano pepper','serrano peppers']],
  ['carrots',[60,'medium carrot','medium carrots']],
  ['cucumber',[200,'medium cucumber','medium cucumbers']],
  ['zucchini',[180,'medium zucchini','medium zucchini']],
  ['eggplant',[300,'medium eggplant','medium eggplants']],
  ['broccoli',[200,'medium head','medium heads']],
  ['cabbage',[700,'small head','small heads']],
  ['cooked cabbage',[600,'small head','small heads']],
  ['lettuce',[250,'head','heads']],
  ['spinach',[140,'bag (140 g)','bags (140 g each)']],
  ['green onion',[75,'bunch','bunches']],
  ['cilantro',[30,'bunch','bunches']],
  ['parsley',[30,'bunch','bunches']],
  ['dill',[20,'bunch','bunches']],
  ['collard greens',[200,'bunch','bunches']],
  ['garlic',[30,'bulb','bulbs']],
  ['ginger',[25,'thumb-sized piece','thumb-sized pieces']],
  ['blueberries',[170,'small container (170 g)','small containers (170 g each)']],
  ['mushrooms',[227,'pack (227 g)','packs (227 g each)']],
  ['green beans',[340,'bag (340 g)','bags (340 g each)']],
  ['okra',[340,'bag (340 g)','bags (340 g each)']]
]);

const shoppingPackages = new Map([
  ['greek yogurt',[500,'tub (500 g)','tubs (500 g each)']],
  ['cottage cheese',[500,'tub (500 g)','tubs (500 g each)']],
  ['ricotta',[475,'tub (475 g)','tubs (475 g each)']],
  ['milk',[1000,'carton (1 L)','cartons (1 L each)']],
  ['cheddar cheese',[200,'block (200 g)','blocks (200 g each)']],
  ['mozzarella',[200,'pack (200 g)','packs (200 g each)']],
  ['butter',[454,'block (454 g)','blocks (454 g each)']],
  ['bread',[600,'loaf (about 20 slices)','loaves (about 20 slices each)']],
  ['tortilla',[240,'pack (8 small tortillas)','packs (8 small tortillas each)']],
  ['tofu',[350,'block (350 g)','blocks (350 g each)']],
  ['coconut milk',[400,'can (400 mL)','cans (400 mL each)']],
  ['tomato pasta sauce',[650,'jar (650 mL)','jars (650 mL each)']],
  ['peas',[500,'frozen bag (500 g)','frozen bags (500 g each)']],
  ['corn',[500,'frozen bag (500 g)','frozen bags (500 g each)']]
]);

const groceryBeans = new Set(['black beans','kidney beans','pinto beans','white beans','black eyed peas','chickpeas','lentils','fava beans']);

function shopGroup(name) {
  if (shoppingProduce.has(name)) return 'Produce';
  if (/chicken|turkey|beef|pork|fish|salmon|shrimp|cod|tuna|steak|oxtail|bacon/.test(name)) return 'Meat & seafood';
  if (/^egg$|yogurt|cheese|milk|paneer|^butter$|feta|ricotta|mozzarella|parmesan/.test(name)&&!name.includes('coconut')) return 'Dairy & eggs';
  return 'Pantry & other';
}

function shopQty(name, grams) {
  const purchase = shoppingProduce.get(name) || shoppingPackages.get(name) ||
    (name==='egg'?[50,'large egg','large eggs']:null);
  if (purchase) {
    const [size,single,plural] = purchase;
    const count = Math.ceil(grams/size);
    return count+' '+(count===1?single:plural);
  }
  if (groceryBeans.has(name)) {
    const cupWeight = kitchenCupWeights.get(name);
    const cans = Math.ceil(grams/(cupWeight*1.5));
    return cans+' '+(cans===1?'can':'cans')+' (about 1½ cups drained each)';
  }
  if (shopGroup(name)==='Meat & seafood') {
    const pounds = grams/453.59237;
    return Math.ceil(grams)+' g · '+pounds.toFixed(2)+' lb';
  }
  if (['white rice','brown rice','quinoa','cooked spaghetti','pasta','soba cooked'].includes(name)) {
    return recipeMeasure(name,grams,'kitchen')+' cooked (buy dry or ready to heat)';
  }
  return recipeMeasure(name,grams,'kitchen');
}

function shopCheck(name, grams, checked) {
  const key = groceryRange+'|'+plannerPeriod(day(),groceryRange)[0];
  const previous = S.shoppingChecksByRange;
  const checks = {...previous?.[key]};
  if (checked) checks[name] = grams;
  else delete checks[name];
  S.shoppingChecksByRange = {...previous,[key]:checks};
  if (!save()) {
    if (previous === undefined) delete S.shoppingChecksByRange;
    else S.shoppingChecksByRange = previous;
    render();
  }
}

function saveShoppingQuantity() {
  const dates = plannerPeriod(day(),groceryRange);
  const key = groceryRange+'|'+dates[0];
  const name = $('shoppingAdjustItem').value;
  const grams = shoppingBag(dates)[name];
  if (!Number.isFinite(grams)) return;
  const quantity = $('shoppingAdjustQty').value.trim().slice(0,60);
  const previous = S.shoppingAdjustments;
  const entries = {...previous?.[key]};
  if (quantity) entries[name] = {grams,quantity};
  else delete entries[name];
  S.shoppingAdjustments = {...previous,[key]:entries};
  if (!save()) {
    if (previous===undefined) delete S.shoppingAdjustments;
    else S.shoppingAdjustments=previous;
    return;
  }
  render();
}

function shoppingView() {
  const dates = plannerPeriod(day(),groceryRange);
  const bag = shoppingBag(dates);
  const key = groceryRange+'|'+dates[0];
  const checks = S.shoppingChecksByRange?.[key];
  const adjustments = S.shoppingAdjustments?.[key];
  return `<section><h3>Groceries for your meal plan</h3>
    <div class="planner-tabs planner-range">${['Week','Month'].map(range =>
      `<button class="${groceryRange===range?'':'alt'}" aria-pressed="${groceryRange===range}" onclick="groceryRange='${range}';render()">${range}</button>`).join('')}</div>
    ${plannerPeriodHeader(groceryRange)}
    <button class="alt wide" onclick="plannerRange=groceryRange;switchPlanner('Calendar')">View meals for this ${groceryRange.toLowerCase()}</button>
    <p>Budget target: $${prefs().budget} CAD</p>
    <small>Whole items and packages are rounded up for this plan. Sizes and yields vary. Meat weights follow the recipe, so allow for cooking loss when buying raw meat for cooked portions.</small>
    ${Object.keys(bag).length?`<details class="daily-disclosure"><summary>Adjust a shopping quantity</summary>
      <label>Ingredient<select id="shoppingAdjustItem"><option value="">Choose an ingredient</option>${Object.keys(bag).sort().map(name=>`<option>${esc(name)}</option>`).join('')}</select></label>
      <label>Amount to buy<input id="shoppingAdjustQty" maxlength="60" placeholder="e.g. 1 bag"></label>
      <small>Leave blank to restore the planned amount. If a recipe change affects this ingredient, MyFit shows the new planned amount.</small>
      <button class="alt wide" onclick="saveShoppingQuantity()">Save shopping amount</button>
    </details>`:''}
    ${['Produce','Meat & seafood','Dairy & eggs','Pantry & other'].map(group => {
      const rows = Object.entries(bag).filter(([name]) => shopGroup(name) === group).sort();
      return rows.length ? `<h3>${group}</h3>` + rows.map(([name,grams]) =>
        `<label class="line"><span>${esc(name)} · ${adjustments?.[name]?.grams===grams?esc(adjustments[name].quantity):shopQty(name,grams)}</span>
          <small class="shopping-have"><input type="checkbox" style="width:auto" data-name="${esc(name)}"
          ${checks?.[name]===grams?'checked':''} onchange="shopCheck(this.dataset.name,${grams},this.checked)"> Already have</small></label>`).join('') : '';
    }).join('') || '<p>No groceries needed for this period.</p>'}
  </section>`;
}

const voices=[['GET TO WORK!','Enough talk.','Show me some action.','Time to execute.'],['Listen up.','Mission check.','Stay disciplined.'],['Game time.','Stay ready.','Build momentum.'],['Data check.','Review the evidence.','Let’s assess.'],['Let’s get on track.','Here’s your next step.','Keep it practical.'],['You’ve got this!','Keep showing up!','Small wins count!'],['Move with intention.','Take a moment.','Find your balance.']];
function beastLevel(){return coachPrefs().language??(coachPrefs().profanity?2:1)}
function pickLine(a,seed){return a[(planHash(seed,'voice')%a.length)]}
function accountability(date=today(),event='daily'){let i=activeCoach(),p=coachPrefs(),now=new Date(),hour=now.getHours(),logged=(S.meals[date]||[]).length,work=Object.entries(S.work).filter(([k,v])=>k.startsWith(date+'|')&&+v.sets>0),w=schedule()[(new Date(date+'T12:00:00').getDay()+6)%7],seed=date+'|'+event+'|'+hour+'|'+logged+'|'+work.length;let lead=pickLine(voices[i],seed);if(i===0&&beastLevel()>1)lead=pickLine(beastLevel()===3?['WHAT THE FUCK ARE WE WAITING FOR?','GET YOUR ASS IN GEAR!','Enough fucking talk.','Let’s get this shit done!']:['Get your ass moving!','Time to do the damn work!','What the hell are we waiting for?'],seed);let facts=[],actions=[];if(date===today()&&hour>=14&&!logged){facts.push('No meals logged today.');actions.push(i===0?'If you ate, log it. If not, get some proper fuel.':i===6?'Check in with your hunger and record what you ate.':'Confirm whether you have eaten and log your meal.')}else if(logged){facts.push(`${logged} meal${logged===1?'':'s'} logged.`);actions.push(i===0?'Keep fueling the work.':strategies[i][3])}if(w==='rest'){actions.push(i===0?'Recovery is part of the process. Rest up.':coachStyles[i][5])}else if(work.length){facts.push(`${work.length} exercise records today.`);actions.push(i===0?'That is action. Keep your form tight.':coachStyles[i][3])}else if(date<today()||hour>=20){facts.push('No training recorded for this scheduled session.');actions.push(i===0?'Quit putting it off if you are able to train. Reschedule it; if you are ill or injured, recover.':i===1?'Report the barrier and reschedule if appropriate.':'Check what happened and choose a realistic next session.')}else actions.push(coachStyles[i][3]);return lead+' '+facts.join(' ')+' '+actions.join(' ')}
coachMessage=function(w){return [coachStyles[activeCoach()][0],accountability()]};
const oldDaily=coachDaily;coachDaily=function(){return oldDaily()+`<section><div class="pill">Coach accountability</div><p>${esc(accountability())}</p>${activeCoach()===0?`<label>Beast language<select onchange="setCoach('language',+this.value)">${['Hardcore · clean','Unfiltered','Savage · strong profanity'].map((n,j)=>`<option value="${j+1}" ${beastLevel()===j+1?'selected':''}>${n}</option>`).join('')}</select></label>`:''}${weeklyAccountability()}</section>`};
function weeklyAccountability(){let days=Array.from({length:7},(_,j)=>{let d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-j-1);return dateKey(d)}),scheduled=days.filter(k=>!['rest','mobility'].includes(schedule()[(new Date(k+'T12:00:00').getDay()+6)%7])),trained=scheduled.filter(k=>Object.entries(S.work).some(([key,v])=>key.startsWith(k+'|')&&+v.sets>0)).length,logged=days.filter(k=>S.meals[k]?.length).length;return `<h3>Last seven completed days</h3><p>${trained}/${scheduled.length} currently scheduled strength days with training logged · ${logged}/7 days with food logged.</p><small>${esc(trained<scheduled.length?(activeCoach()===0?'Enough promises. Find a schedule you can actually follow.':'Review unlogged sessions and adjust your schedule.'):'Keep building consistent habits.')} Historical schedule is estimated from current settings; logs do not prove full completion.</small>`}
const oldEvents=dailyEvents;dailyEvents=function(date=day()){return oldEvents(date).map(e=>({...e,m:accountability(date,e.k)}))};
const lastRender=render;render=function(){lastRender();if(['Food','Workout','Planner','Progress'].includes(tab)){let section=$('app').querySelector('section');if(section){let small=section.querySelector('small');if(small){let note=document.createElement('p');note.className='muted';note.textContent=accountability(today(),tab);section.prepend(note)}}}};


// Progression: compare only comparable recorded sessions, never infer actual reps.
function progressEvidence(work,date,name){let current=work[date+'|'+name]||{}, prior=Object.entries(work).filter(([k,v])=>k.endsWith('|'+name)&&k.slice(0,10)<date&&Number(v.sets)>0&&Number(v.weight)>0&&Number(v.reps)>0).sort((a,b)=>b[0].localeCompare(a[0]));let previous=prior[0];if(!previous)return {kind:'baseline'};let v=previous[1], comparable=Number(current.sets)>0&&Number(current.reps)===Number(v.reps)&&Number(current.sets)===Number(v.sets)&&Number(current.weight)>0;let best=prior.filter(([k,x])=>Number(x.reps)===Number(current.reps)&&Number(x.sets)===Number(current.sets)).reduce((m,[k,x])=>Math.max(m,Number(x.weight)),0);return {kind:comparable&&Number(current.weight)>best?'record':'history',weight:Number(v.weight),reps:Number(v.reps),sets:Number(v.sets),date:previous[0].slice(0,10),current:Number(current.weight)}}
function progressionPanel(){let w=workout();if(['rest','mobility'].includes(w))return '';let i=activeCoach();return `<section><h3>Training progression</h3><small>Record actual reps per set only when all completed sets used the same reps and load. Leave blank otherwise.</small>${exerciseList(w).filter(x=>/^\d+(?:[–-]\d+)?$/.test(x.split('|')[2])).map(x=>{let [n]=x.split('|'),v=S.work[day()+'|'+n]||{},e=progressEvidence(S.work,day(),n);let tone=['That is damn progress!','Objective achieved.','Performance improved!','Comparable recorded load increased.','Excellent progress.','You did it!','Celebrate your growing strength.'][i];return `<div class="line"><div><b>${esc(n)}</b><br><small>${e.kind==='baseline'?'Build a comparable baseline.':esc((e.kind==='record'?tone+' ':'')+'Previous: '+e.weight+' lb × '+e.reps+' reps × '+e.sets+' sets ('+e.date+').')}</small></div><input aria-label="Actual reps per set" type="number" min="1" max="100" step="1" placeholder="reps" value="${esc(v.reps||'')}" onchange="record('${n}','reps',this.value)"></div>`}).join('')}<p class="muted">Increase load only when technique, recovery and effort allow. No automatic weight increases.</p><button class="alt wide" onclick="render()">Refresh progression feedback</button></section>`}
const progressionRecord=record;record=function(n,k,v){if(k==='reps'&&v!==''&&(!Number.isInteger(+v)||+v<1||+v>100)){alert('Enter whole reps from 1 to 100.');return}progressionRecord(n,k,v)};
const progressionRender=render;render=function(){progressionRender();};


// Adaptive training: optional daily check-in; never change historical records or loads.
function recoveryAdvice(r){if(!r)return 'baseline';if(r.pain)return 'stop';if(r.sleep<5||r.energy<=2||r.soreness>=4)return 'recover';if(r.sleep<7||r.energy===3||r.soreness===3)return 'light';return 'normal'}
function recoveryValid(r){return !!r&&Number.isFinite(r.sleep)&&r.sleep>=0&&r.sleep<=24&&[1,2,3,4,5].includes(r.energy)&&[1,2,3,4,5].includes(r.soreness)&&typeof r.pain==='boolean'}
function saveRecovery(){let r={sleep:Number($('recSleep').value),energy:Number($('recEnergy').value),soreness:Number($('recSore').value),pain:$('recPain').checked};if($('recSleep').value===''||!recoveryValid(r)){alert('Check your recovery inputs.');return}(S.recovery??={})[today()]=r;save();render()}
function recoveryPanel(){let r=S.recovery?.[today()],a=recoveryAdvice(r),i=activeCoach(),intro=['Train hard, recover harder.','Readiness check.','Assess your readiness.','Review recovery inputs.','Let’s check your energy.','Take care of yourself!','Listen to your body.'][i],msg={baseline:'Complete a check-in for today’s training guidance.',stop:'Avoid movements that cause pain. Seek medical advice for new, severe or persistent symptoms.',recover:'Consider rest or gentle pain-free movement today. Do not make up missed volume.',light:'Consider fewer sets or lighter loads; keep effort comfortable.',normal:'Follow your planned session if you feel well. Progress only with good technique.'}[a];let opts=(v)=>[1,2,3,4,5].map(n=>`<option ${n===v?'selected':''}>${n}</option>`).join('');return `<section><div class="pill">${esc(coachStyles[i][0])} · Today</div><h3>Training readiness</h3><p>${esc(intro)} ${esc(msg)}</p><label>Hours slept<input id="recSleep" type="number" min="0" max="24" step="0.5" value="${r?.sleep??''}"></label><label>Energy (1 low, 5 high)<select id="recEnergy">${opts(r?.energy??3)}</select></label><label>Soreness (1 none, 5 severe)<select id="recSore">${opts(r?.soreness??1)}</select></label><label class="line">New or concerning pain<input id="recPain" type="checkbox" style="width:auto" ${r?.pain?'checked':''}></label><button class="wide" onclick="saveRecovery()">Save check-in</button><small>Guidance only; your workout and recorded loads are not automatically changed.</small></section>`}
const recoveryRender=render;render=function(){recoveryRender();if(false)$('app').insertAdjacentHTML('afterbegin',recoveryPanel())};
const recoveryState=validState;validState=function(x){return recoveryState(x)&&(!('recovery' in x)||(x.recovery&&typeof x.recovery==='object'&&!Array.isArray(x.recovery)&&Object.entries(x.recovery).every(([k,r])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&recoveryValid(r))))};


// Local illustrated coach identities, independent of coaching behavior.
const avatarPalettes=[['#80513b','#241b19','#b8d8c5'],['#e8b38c','#65412c','#c6d8eb'],['#b97c53','#211b19','#e4c8ac'],['#f0c7a4','#392d25','#c9c2e6']];
function avatarChoice(p,i){let n=p?.avatars?.[i];return Number.isInteger(n)&&n>=0&&n<4?n:0}
const coachPortraits=[["img/4510dd0d98.webp", "img/7ebae85f22.webp", "img/888ed54f93.webp", "img/216594dfbe.webp"], ["img/6030f418e9.webp", "img/028e9fd820.webp", "img/1c21d4b44c.webp", "img/3f763e2d4b.webp"], ["img/a7733cde00.webp", "img/08b3d7e584.webp", "img/3d77df409c.webp", "img/f96acbaac2.webp"], ["img/d77116aa2b.webp", "img/6be7325e7b.webp", "img/2c6a698bcc.webp", "img/e81a0d8c0e.webp"], ["img/f4119cdf06.webp", "img/680efd410a.webp", "img/1566c5f27b.webp", "img/d65447c34c.webp"], ["img/942468f569.webp", "img/f204f0b45e.webp", "img/4c13543601.webp", "img/e647085f53.webp"], ["img/55302fc3fc.webp", "img/84f77d60a4.webp", "img/a0ce736c06.webp", "img/33c8b3a028.webp"]];
function avatarArt(i,j){return `<img src="${coachPortraits[i]?.[j]||coachPortraits[0][0]}" alt="Coach appearance ${j+1}" style="width:100%;display:block;object-fit:cover;border-radius:8px">`}
function selectAvatar(i,j){if(!Number.isInteger(i)||i<0||i>6||!Number.isInteger(j)||j<0||j>3)return;(coachPrefs().avatars??={})[i]=j;save();render()}
function openCoachAppearance(){coachCustomizeOpen=true;if($('coachCustomize'))$('coachCustomize').open=true;previewCoach=null;previewLook=null;tab="Coach";render();document.getElementById("coachAppearance").scrollIntoView({block:"start"})}
let previewCoach=null,previewLook=null;
function previewSelection(i,j){previewCoach=i;previewLook=j;let el=$('coachAppearance');if(el){let scroll=el.querySelector('.roster')?.scrollLeft||0;el.outerHTML=avatarPanel();$('coachAppearance').querySelector('.roster').scrollLeft=scroll}}
function confirmCoachSelection(){const i=previewCoach??activeCoach(),j=previewLook??avatarChoice(coachPrefs(),i);previewCoach=null;previewLook=null;chooseCoach(i,j)}
function avatarPanel(){let i=previewCoach??activeCoach(),j=previewLook??avatarChoice(coachPrefs(),i);return `<section id="coachAppearance"><small>MYFIT / COACH ROSTER</small><h2>Choose your coach</h2><div class="roster">${coachStyles.map((c,k)=>`<button aria-pressed="${i===k}" onclick="previewSelection(${k},${avatarChoice(coachPrefs(),k)})">${avatarArt(k,avatarChoice(coachPrefs(),k))}${esc(c[0])}</button>`).join('')}</div><div class="hero">${avatarArt(i,j)}<div class="heroText"><h2>${esc(coachStyles[i][0])}</h2><p>${esc(strategies[i][0])}</p><small>${esc(strategies[i][2])}</small></div></div><h3>Choose appearance</h3><small>Same personality. Same coaching. Your choice of face.</small><div class="looks">${[0,1,2,3].map(k=>`<button aria-pressed="${j===k}" onclick="previewSelection(${i},${k})">${avatarArt(i,k)}<small>Option ${k+1}${j===k?' ✓':''}</small></button>`).join('')}</div><p>${esc(coachStyles[i][4])}</p><button class="wide confirm" onclick="confirmCoachSelection()">SELECT COACH</button><small>Active: ${esc(coachStyles[activeCoach()][0])}</small></section>`}
function setDetailValid(r){return r&&Number.isFinite(r.load)&&r.load>=0&&r.load<=2000&&Number.isInteger(r.reps)&&r.reps>=1&&r.reps<=100&&Number.isInteger(r.effort)&&r.effort>=1&&r.effort<=10}
function addSetDetail(n){let r={load:Number($('setLoad').value),reps:Number($('setReps').value),effort:Number($('setEffort').value)};if($('setLoad').value===''||!setDetailValid(r))return alert('Enter a valid load, reps and effort.');let key=day()+'|'+n;let a=(S.setDetails??={})[key]??=[];a.push(r);save();render()}
function removeSetDetail(n,j){let a=S.setDetails?.[day()+'|'+n];if(a&&a[j]){a.splice(j,1);save();render()}}
let detailExercise='';
function setDetailPanel(){let list=exerciseList(workout()).filter(x=>/^\d+(?:[–-]\d+)?$/.test(x.split('|')[2])).map(x=>x.split('|')[0]);if(!list.length)return '';if(!list.includes(detailExercise))detailExercise=list[0];let n=detailExercise,a=S.setDetails?.[day()+'|'+n]||[];return `<section><h3>Individual set journal</h3><small>Optional detailed journal; existing workout completion totals remain separate.</small><label>Exercise<select onchange="detailExercise=this.value;render()">${list.map(x=>`<option ${x===n?'selected':''}>${esc(x)}</option>`).join('')}</select></label>${a.map((r,j)=>`<div class="line"><span>Set ${j+1}: ${r.load} lb × ${r.reps} · effort ${r.effort}/10</span><button class="alt" onclick="removeSetDetail(detailExercise,${j})">Remove</button></div>`).join('')}<label>Load (lb; 0 for bodyweight)<input id="setLoad" type="number" min="0" max="2000" step="0.5"></label><label>Reps<input id="setReps" type="number" min="1" max="100"></label><label>Effort (1 easy, 10 maximum)<input id="setEffort" type="number" min="1" max="10" value="7"></label><button class="wide" onclick="addSetDetail(detailExercise)">Save set</button></section>`}
const identityRender=render;render=function(){identityRender();let i=activeCoach(),j=avatarChoice(coachPrefs(),i);if(['Home','Coach','Workout','Food','Planner','Progress'].includes(tab))$('app').insertAdjacentHTML('afterbegin',`<div style="display:flex;align-items:center;gap:12px;margin:12px 0"><div style="width:56px;flex:none">${avatarArt(i,j)}</div><div><b>${esc(coachStyles[i][0])}</b><br><small>Your coach</small></div><button class="alt" style="margin-left:auto" onclick="openCoachAppearance()">Change appearance</button></div>`);if(tab==='Coach')$('app').insertAdjacentHTML('afterbegin',avatarPanel());};
const identityValid=validState;validState=function(x){return identityValid(x)&&(!('setDetails' in x)||(x.setDetails&&typeof x.setDetails==='object'&&!Array.isArray(x.setDetails)&&Object.values(x.setDetails).every(a=>Array.isArray(a)&&a.every(setDetailValid))))};


// Unified detailed tracking: preserve legacy entries until explicit conversion.
function detailSummary(a){let first=a[0],uniform=!!first&&a.every(r=>r.load===first.load&&r.reps===first.reps);return {sets:a.length,weight:uniform?first.load:'',reps:uniform?first.reps:'',volume:a.reduce((v,r)=>v+r.load*r.reps,0)}}
function syncDetail(key){let a=S.setDetails[key],v=detailSummary(a);S.work[key]={...(S.work[key]||{}),sets:v.sets,weight:v.weight,reps:v.reps};}
function adoptDetail(key){if(S.detailUnified?.[key])return true;let old=S.work[key];if(old&&(+old.sets>0||+old.weight>0||+old.reps>0)&&!confirm('Use the individual set journal as the completion record? Existing summary will be archived; enter any missing sets in the journal.'))return false;(S.detailArchive??={})[key]=old?{...old}:null;(S.detailUnified??={})[key]=true;return true;}
const legacyRecord=record;record=function(n,k,v){if(S.detailUnified?.[day()+'|'+n]){alert('Edit individual sets in the journal below.');render();return}legacyRecord(n,k,v)};
addSetDetail=function(n){let r={load:Number($('setLoad').value),reps:Number($('setReps').value),effort:Number($('setEffort').value)};if($('setLoad').value===''||!setDetailValid(r))return alert('Enter a valid load, reps and effort.');let key=day()+'|'+n;if(!adoptDetail(key))return;((S.setDetails??={})[key]??=[]).push(r);syncDetail(key);save();render()};
removeSetDetail=function(n,j){let key=day()+'|'+n,a=S.setDetails?.[key];if(a&&a[j]&&adoptDetail(key)){a.splice(j,1);syncDetail(key);save();render()}};
function linkExistingDetails(){let key=day()+'|'+detailExercise;if(!S.setDetails?.[key]?.length||!adoptDetail(key))return;syncDetail(key);save();render()}
function detailAdvice(a,range,readiness){if(!a.length)return 'Record your first set.';if(readiness==='pain'||readiness==='stop'||readiness==='recover')return 'Prioritize recovery before progressing.';if(readiness==='light')return 'Consider lighter training today; postpone load increases until recovered.';let top=Number(range.split(/[–-]/).pop());if(a.some(r=>r.effort>=9))return 'Keep or reduce load; avoid forcing progression.';if(Number.isFinite(top)&&a.every(r=>r.reps>=top&&r.effort<=7))return 'If technique and recovery are good, consider a small load increase next session.';return 'Keep the load steady and build controlled repetitions.'}
const unifiedPanel=setDetailPanel;setDetailPanel=function(){let h=unifiedPanel();if(!h)return h;let key=day()+'|'+detailExercise,a=S.setDetails?.[key]||[],v=detailSummary(a),range=exerciseList(workout()).find(x=>x.split('|')[0]===detailExercise)?.split('|')[2]||'';return h.replace('Optional detailed journal; existing workout completion totals remain separate.','New sets update workout completion automatically. Mixed loads or reps are not treated as uniform records.')+`<section><h3>Set performance</h3><p>${v.sets} sets · ${v.volume.toLocaleString()} lb recorded external-load volume</p>${a.length&&!S.detailUnified?.[key]?'<button class="alt wide" onclick="linkExistingDetails()">Link existing journal to workout</button>':''}<p>${esc(detailAdvice(a,range,recoveryAdvice(S.recovery?.[today()])))}</p><small>Progression is advisory; consider your readiness and any pain before increasing load.</small></section>`};


// Workout history reads existing records; no duplicate storage.
function workoutHistory(state){let keys=new Set([...Object.keys(state.work||{}),...Object.keys(state.setDetails||{})]);return [...keys].map(key=>{let i=key.indexOf('|'),date=key.slice(0,i),name=key.slice(i+1),a=state.setDetails?.[key]||[],r=state.work?.[key]||{};return {date,name,a,r}}).filter(x=>x.a.length||+x.r.sets>0||+x.r.reps>0||+x.r.weight>0).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name))}
function workoutLogPanel(){let rows=workoutHistory(S);return `<section id="workoutHistory"><h2>Workout log</h2><small>Saved sets, reps and weights by date. Detailed sets are shown once; older summary records are retained.</small>${rows.map(x=>`<details style="margin:12px 0"><summary>${esc(x.date)} · ${esc(x.name)} · ${x.a.length?x.a.length+' recorded sets':esc(x.r.sets||0)+' sets'}</summary>${x.a.length?x.a.map((r,i)=>`<p>Set ${i+1}: ${esc(r.load)} lb × ${esc(r.reps)} reps · effort ${esc(r.effort)}/10</p>`).join('')+`<small>Volume: ${detailSummary(x.a).volume.toLocaleString()} lb</small>`:`<p>Summary: ${esc(x.r.weight||'—')} lb · ${esc(x.r.reps||'—')} reps per set</p>`}${x.a.length&&!S.detailUnified?.[x.date+'|'+x.name]&&+x.r.sets>0?`<p>Separate legacy summary: ${esc(x.r.sets)} sets · ${esc(x.r.weight||'—')} lb · ${esc(x.r.reps||'—')} reps</p>`:''}</details>`).join('')||'<p>No workout records yet. Save a set in Workout to begin.</p>'}<button class="alt wide" onclick="tab='Workout';render();window.scrollTo(0,0)">Go to workout</button></section>`}
function openWorkoutLog(){$('date').value=today();tab='Progress';render();const history=$('workoutHistory');history.closest('.daily-disclosure').open=true;history.scrollIntoView({block:'start'})}
const historyRender=render;render=function(){historyRender();if(tab==='Progress')$('app').insertAdjacentHTML('afterbegin',workoutLogPanel());if(tab==='Workout')$('app').insertAdjacentHTML('afterbegin','<button class="alt wide" style="margin:12px 0" onclick="openWorkoutLog()">View saved workout log</button>')};
// Confirm persistence before clearing the entry fields; roll back on storage failure.
addSetDetail=function(n){let r={load:Number($('setLoad').value),reps:Number($('setReps').value),effort:Number($('setEffort').value)};if(['setLoad','setReps','setEffort'].some(k=>$(k).value.trim()==='')||!setDetailValid(r))return alert('Enter a valid load, reps and effort.');let key=day()+'|'+n,prior=JSON.stringify(S);if(!adoptDetail(key))return;((S.setDetails??={})[key]??=[]).push(r);syncDetail(key);if(!save()){S=JSON.parse(prior);return alert('Set not saved. Your entry is still on screen. Check browser storage.')}render();let el=$('setLoad');if(el){el.value=r.load;$('setReps').value=r.reps;$('setEffort').value=r.effort;el.insertAdjacentHTML('beforebegin','<small role="status">✓ Set saved to workout log</small>')}};


const equipmentNames = {
  dumbbells:'Dumbbells', bands:'Resistance bands', bench:'Bench or sturdy step',
  barbell:'Barbell and plates', kettlebell:'Kettlebell', pullup:'Pull-up bar',
  cable:'Cable station', pulldown:'Lat pulldown machine', legPress:'Leg press',
  legExtension:'Leg extension', legCurl:'Leg curl', chestFly:'Chest fly machine'
};
const trainingLocations = {
  gym:['Gym',Object.keys(equipmentNames)],
  home:['Home', ['dumbbells','bands']],
  crossfit:['CrossFit-style station',['dumbbells','bench','barbell','kettlebell','pullup']],
  none:['Bodyweight only',[]]
};

const gymRestrictions = {
  floor:'Avoid floor exercises',
  overhead:'Avoid overhead movements',
  steps:'Avoid step-ups'
};

const floorExercises = new Set(['90/90 hip stretch','Bird dog','Cat cow','Child pose','Dead bug',
  'Dumbbell floor press','Glute bridge','Hamstring stretch','Hamstring walkout','Hip flexor stretch',
  'Hip thrust','Pike push-up','Plank','Prone T raise','Prone W raise','Prone Y raise','Prone lat pull',
  'Push-up','Reverse snow angel','Thoracic rotation']);
const overheadExercises = new Set(['Band pulldown','Band shoulder press','Band triceps extension',
  'Dumbbell shoulder press','Kettlebell shoulder press','Lat pulldown','Pull-up','Seated shoulder press',
  'Straight-arm pulldown','Prone lat pull','Prone Y raise']);

function gymAllows(name, restrictions) {
  return !(restrictions.includes('floor')&&floorExercises.has(name) ||
    restrictions.includes('overhead')&&overheadExercises.has(name) ||
    restrictions.includes('steps')&&/step-up/i.test(name));
}

function normalizeGym(location, gear, restrictions, notes) {
  const key = Object.hasOwn(trainingLocations, location) ? location : 'gym';
  return {
    location:key,
    gear:Array.isArray(gear) ? Object.keys(equipmentNames).filter(item=>gear.includes(item)) : [...trainingLocations[key][1]],
    restrictions:Array.isArray(restrictions) ? Object.keys(gymRestrictions).filter(item=>restrictions.includes(item)) : [],
    notes:typeof notes==='string' ? notes.trim().slice(0,800) : ''
  };
}

function logGymChange(gym) {
  const records = Array.isArray(S.gymRecords) ? S.gymRecords : [];
  const last = records.at(-1);
  if (last && JSON.stringify(last.gym)===JSON.stringify(gym)) return;
  S.gymRecords = [...records,{date:today(),gym}];
}

function gymSettingsFields(gym,onboarding=false) {
  return `
    <label>Training location<select id="trainingLocation" onchange="showEquipmentPreset(this.value,${onboarding})">
      ${Object.entries(trainingLocations).map(([key,[label]])=>
        `<option value="${key}" ${key===gym.location?'selected':''}>${label}</option>`).join('')}
    </select></label>
    <p>Check only the equipment you can use.</p>
    <div class="grid">${Object.entries(equipmentNames).map(([key,label])=>
      `<label><input data-training-gear type="checkbox" value="${key}" style="width:auto"
        ${gym.gear.includes(key)?'checked':''} ${onboarding?'onchange="saveOrientationGymDraft()"':''}> ${label}</label>`).join('')}</div>
    <h3>Movement preferences</h3>
    ${Object.entries(gymRestrictions).map(([key,label])=>
      `<label><input data-training-restriction type="checkbox" value="${key}" style="width:auto"
        ${gym.restrictions.includes(key)?'checked':''} ${onboarding?'onchange="saveOrientationGymDraft()"':''}> ${label}</label>`).join('')}
    <label>Injuries, accessibility, or other limitations
      <textarea id="trainingNotes" maxlength="800" ${onboarding?'oninput="saveOrientationGymDraft()"':''}>${esc(gym.notes)}</textarea>
    </label>
    <small>Movement preferences change recommendations. Written notes are kept for your coach review.</small>`;
}

function readGymForm() {
  return normalizeGym($('trainingLocation').value,
    [...document.querySelectorAll('[data-training-gear]:checked')].map(input=>input.value),
    [...document.querySelectorAll('[data-training-restriction]:checked')].map(input=>input.value),
    $('trainingNotes').value);
}

function saveOrientationGymDraft() {
  const draft = setup596().draft;
  const gym = readGymForm();
  Object.assign(draft,{equipment:gym.location,trainingGear:gym.gear,movementRestrictions:gym.restrictions,limitations:gym.notes});
  save();
}

function gymSummary(gym) {
  return `<p><b>${trainingLocations[gym.location][0]}</b> · ${gym.gear.map(item=>equipmentNames[item]).join(', ')||'Bodyweight only'}</p>
    ${gym.restrictions.length?`<p>${gym.restrictions.map(item=>gymRestrictions[item]).join(' · ')}</p>`:''}
    ${gym.notes?`<p><b>Notes:</b> ${esc(gym.notes)}</p>`:''}`;
}

function myGymPanel() {
  const history = Array.isArray(S.gymRecords) ? S.gymRecords : [];
  return `<section><h2>My Gym</h2><p>Your coach uses this setup when building workout lists.</p>
    ${gymSettingsFields(trainingEquipment())}
    <button class="wide" onclick="saveTrainingEquipment()">Save My Gym</button>
    <details class="daily-disclosure"><summary>Equipment and limitations history</summary>
      ${[...history].reverse().map(record=>{
        const gym = record?.gym;
        return gym?`<div class="line"><div><small>${esc(record.date)}</small>${gymSummary(normalizeGym(gym.location,gym.gear,gym.restrictions,gym.notes))}</div></div>`:'';
      }).join('')||'<p>Your changes will appear here after you save My Gym.</p>'}
    </details>
  </section>`;
}

function startingProfile() {
  return S.profile.startingProfile || startingProfileFrom(S.profile);
}

function flagProgramReview(reason) {
  S.programReview = {...S.programReview, pending:[...new Set([...(S.programReview?.pending || []),reason])]};
}

let programReviewStep = 0;
function openProgramReview() {
  programReviewStep = 0;
  profileSection598('Review');
  window.scrollTo(0,0);
}

function finishProgramReview() {
  const previous = S.programReview;
  S.programReview = {pending:[],completedAt:today(),goal:S.profile.goal,coach:activeCoach()};
  if (!save()) {
    if (previous===undefined) delete S.programReview;
    else S.programReview = previous;
    return;
  }
  profileSection598('Profile');
}

function programReviewPrompt() {
  const changes = S.programReview?.pending;
  return changes?.length ? `<section><h3>Review your program</h3>
    <p>${changes.length>1?'Your coach and goal changed.':changes[0]==='coach'?'You chose a coach.':'You changed your goal.'}</p>
    <button class="wide" onclick="openProgramReview()">Start coach orientation</button>
  </section>` : '';
}

function programReviewScript() {
  const goal = goals[S.profile.goal];
  return programReviewStep===0
    ? `I’m ${character58()[0]}. Our goal is ${goal}. We’ll use your existing profile and training schedule to work toward it.`
    : 'Let’s check My Gym and walk through a sample strength session. I’ll use your equipment and movement preferences to choose your exercises.';
}

function hearProgramReview() {
  speak582(programReviewScript());
}

function programReviewPanel() {
  const start = startingProfile();
  const session = schedule().find(key=>key!=='rest'&&key!=='mobility');
  return `<section><h2>Coach orientation</h2><p>${esc(programReviewScript())}</p>
    <button class="alt" onclick="hearProgramReview()">Hear your coach</button>
    ${programReviewStep===0?`<h3>Goal and starting profile</h3>
      <p>${esc(goals[S.profile.goal])} · ${S.profile.days} lifting days per week</p>
      <p>Starting age ${esc(start.age)} · ${esc(start.height)} cm · ${esc(start.weight)} lb</p>
      <button class="wide" onclick="programReviewStep=1;render()">Next: review My Gym</button>`:
      `<h3>My Gym</h3>${gymSummary(trainingEquipment())}
      <button class="alt" onclick="profileSection598('Gym')">Edit My Gym</button>
      <h3>Sample session · ${esc(names[session])}</h3>
      <ul>${exerciseList(session).map(row=>`<li>${esc(row.split('|')[0])}</li>`).join('')||'<li>No exercises match your saved setup for this session.</li>'}</ul>
      <button class="wide" onclick="finishProgramReview()">Finish orientation</button>
      <button class="alt" onclick="programReviewStep=0;render()">Back</button>`}
    <button class="alt" onclick="profileSection598('Profile')">Review later</button>
  </section>`;
}

function trainingEquipment() {
  const stored = S.profile.trainingEquipment;
  const draft = S.setup596?.draft;
  return normalizeGym(stored?.location ?? draft?.equipment, stored?.gear ?? draft?.trainingGear,
    stored?.restrictions ?? draft?.movementRestrictions, stored?.notes ?? draft?.limitations);
}

// Alternatives are ordered by movement and available equipment.
const exerciseAlternatives = {
  'Leg press':[['legPress'],['kettlebell','Kettlebell goblet squat'],['dumbbells','Dumbbell goblet squat'],['','Bodyweight squat']],
  'Leg extension':[['legExtension'],['bands','Band knee extension'],['','Reverse lunge']],
  'Seated hamstring curl':[['legCurl'],['bands','Standing band leg curl'],['','Hamstring walkout']],
  'Hamstring curl':[['legCurl'],['bands','Standing band leg curl'],['','Hamstring walkout']],
  'Hip thrust':[['bench'],['','Glute bridge']],
  'Dumbbell Romanian deadlift':[['dumbbells'],['barbell','Barbell Romanian deadlift'],['kettlebell','Kettlebell deadlift'],['','Bodyweight hip hinge']],
  'Dumbbell bench press':[['dumbbells+bench'],['dumbbells','Dumbbell floor press'],['','Push-up']],
  'Incline press':[['dumbbells+bench','Incline dumbbell press'],['bands','Standing band chest press'],['','Incline push-up']],
  'Seated shoulder press':[['dumbbells','Dumbbell shoulder press'],['kettlebell','Kettlebell shoulder press'],['bands','Band shoulder press'],['','Pike push-up']],
  'Lateral raise':[['dumbbells'],['bands','Band lateral raise'],['','Prone T raise']],
  'Triceps pushdown':[['cable'],['bands','Band triceps extension'],['','Close-grip wall push-up']],
  'Lat pulldown':[['pulldown'],['pullup','Pull-up'],['bands','Band pulldown'],['','Prone lat pull']],
  'Chest-supported row':[['dumbbells+bench'],['barbell','Barbell row'],['dumbbells','Dumbbell row'],['kettlebell','Kettlebell row'],['bands','Resistance band row'],['','Prone W raise']],
  'Cable row':[['cable'],['barbell','Barbell row'],['bands','Resistance band row'],['dumbbells','Dumbbell row'],['','Reverse snow angel']],
  'Face pull':[['cable'],['bands','Band pull-apart'],['','Prone Y raise']],
  'Biceps curl':[['dumbbells'],['bands','Band curl'],['','Self-resisted curl']],
  'Hammer curl':[['dumbbells'],['bands','Band curl'],['','Self-resisted curl']],
  'Dumbbell step-up':[['dumbbells+bench'],['bench','Bodyweight step-up'],['','Split squat']],
  'Machine chest fly':[['chestFly'],['bands','Band chest fly'],['','Wall push-up']],
  'Straight-arm pulldown':[['cable'],['bands','Band pulldown'],['','Prone lat pull']],
  'Resistance band row':[['bands'],['dumbbells','Dumbbell row'],['kettlebell','Kettlebell row'],['','Prone W raise']],
  'Farmer carry':[['dumbbells'],['kettlebell','Kettlebell carry'],['','March in place']]
};

const coachExerciseList = exerciseList;
exerciseList = function(session) {
  const gym = trainingEquipment();
  const gear = new Set(gym.gear);
  const selected = new Set();
  return coachExerciseList(session).flatMap(row => {
    const [name,sets,range] = row.split('|');
    const option = (exerciseAlternatives[name] || [['']]).find(([needs,replacement]) =>
      (!needs || needs.split('+').every(item=>gear.has(item))) && !selected.has(replacement || name) && gymAllows(replacement || name,gym.restrictions));
    if (!option) return [];
    const exercise = option[1] || name;
    selected.add(exercise);
    return [`${exercise}|${sets}|${exercise==='Pull-up'?'3–5':range}`];
  });
};

function showEquipmentPreset(location,onboarding=false) {
  const gear = trainingLocations[location][1];
  document.querySelectorAll('[data-training-gear]').forEach(input=>input.checked=gear.includes(input.value));
  if (onboarding) saveOrientationGymDraft();
}

function saveTrainingEquipment() {
  const gym = readGymForm();
  const previous = S.gymRecords;
  logGymChange(gym);
  if (saveProfile({...S.profile,trainingEquipment:gym})) render();
  else if (previous===undefined) delete S.gymRecords;
  else S.gymRecords = previous;
}

// Separate entry workflows, shared date/exercise records.
let entryMode='',entryExercise='',restUntil=0,entryNotice='';
function entryList(){return [...new Set([...exerciseList(workout()),...Object.values(ex).flat()].filter(x=>typeof x==='string'&&/^\d+(?:[–-]\d+)?$/.test(x.split('|')[2])).map(x=>x.split('|')[0]))]}
function entryStart(mode){entryMode=mode;entryExercise='';entryNotice='';if(mode==='live'){entryWorkout='';$('date').value=today()}render()}
function entryCommit(date,name,rows,replace=false){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today()||!name||!rows.length||!rows.every(setDetailValid))return false;let prior=JSON.stringify(S),key=date+'|'+name;if(!adoptDetail(key))return false;let a=(S.setDetails??={})[key]??=[];S.setDetails[key]=replace?rows:[...a,...rows];syncDetail(key);if(!save()){S=JSON.parse(prior);return false}return true}
function entrySave(){let n=entryExercise,d=entryMode==='live'?today():day(),r={load:Number($('entryLoad').value),reps:Number($('entryReps').value),effort:Number($('entryEffort').value)},count=entryMode==='live'?1:Number($('entryCount').value);if(['entryLoad','entryReps','entryEffort'].some(k=>$(k).value.trim()==='')||!setDetailValid(r)||!Number.isInteger(count)||count<1||count>30)return alert('Check weight, reps, effort and sets.');let replace=entryMode==='past'&&$('entryReplace').checked;if(replace&&!confirm('Replace detailed sets for this exercise and date?'))return;if(!entryCommit(d,n,Array.from({length:count},()=>({...r})),replace))return alert('Not saved. Check date and storage.');if(entryMode==='live')restUntil=Date.now()+90000;entryNotice='✓ Saved to workout history';render();$('entryLoad').value=r.load;$('entryReps').value=r.reps;$('entryEffort').value=r.effort;}
let entryWorkout = '';

function sessionSwaps(state,date,session) {
  return state.workoutSwaps?.[date+'|'+session] || {};
}

function applyWorkoutSwaps(plan,state,date,session) {
  const swaps = sessionSwaps(state,date,session);
  return plan.map(row => {
    const [name,sets,range] = row.split('|');
    return swaps[name] ? [swaps[name].name,sets,swaps[name].range || range].join('|') : row;
  });
}

function availableLiveSwaps() {
  const session = entryWorkout || workout();
  const swaps = sessionSwaps(S,today(),session);
  const original = Object.keys(swaps).find(name=>swaps[name].name===entryExercise) || entryExercise;
  if (loggedSetCount(S,today()+'|'+entryExercise)) return [];
  const basePlan = coachExerciseList(session).map(row=>row.split('|'));
  const base = basePlan.find(([name])=>name===original) || basePlan.find(([name])=>
    exerciseAlternatives[name]?.some(([,alternate])=>alternate===original));
  if (!base) return [];
  const gym = trainingEquipment();
  const reserved = new Set(livePlan().map(row=>row[0]));
  return (exerciseAlternatives[base[0]] || []).flatMap(([needs,alternative]) => {
    const candidate = alternative || base[0];
    if (reserved.has(candidate) || loggedSetCount(S,today()+'|'+candidate) ||
        (needs&&!needs.split('+').every(item=>gym.gear.includes(item))) ||
        !gymAllows(candidate,gym.restrictions)) return [];
    return [{original,candidate,range:candidate==='Pull-up'?'3–5':base[2]}];
  });
}

function swapLiveExercise() {
  const choice = availableLiveSwaps().find(option=>option.candidate===$('liveSwapChoice').value);
  if (!choice) return;
  const key = today()+'|'+(entryWorkout||workout());
  const before = S.workoutSwaps;
  const next = {...sessionSwaps(S,today(),entryWorkout||workout())};
  if (choice.original===choice.candidate) delete next[choice.original];
  else next[choice.original] = {name:choice.candidate,range:choice.range};
  S.workoutSwaps = {...before,[key]:next};
  if (!save()) {
    if (before===undefined) delete S.workoutSwaps;
    else S.workoutSwaps=before;
    return;
  }
  chooseLiveExercise(choice.candidate);
}

let finishedWorkout = null;
function finishLiveWorkout() {
  finishedWorkout = {date:today(),session:entryWorkout||workout(),plan:livePlan(),extras:liveExtras()};
  entryMode='';
  restUntil=0;
  tab='WorkoutRecap';
  render();
  window.scrollTo(0,0);
}

function workoutRecapPanel() {
  if (!finishedWorkout) return '';
  const {date,session,plan,extras} = finishedWorkout;
  const count = name => loggedSetCount(S,date+'|'+name);
  const swapped = sessionSwaps(S,date,session);
  const improvements = new Map(strengthProgress(workoutHistory(S))
    .filter(row=>row.date===date&&row.previous&&row.current.load>row.previousLoad)
    .map(row=>[row.name,`+${Math.round((row.current.load-row.previousLoad)*100)/100} lb at ${row.current.reps} reps vs. the last comparable session`]));
  const completed = plan.filter(([name,sets])=>count(name)>=Number(sets)).length;
  return `<section><h2>Workout recap</h2>
    <p>${esc(names[session])} · ${completed} of ${plan.length} planned exercises completed</p>
    ${plan.map(([name,target,range])=>{
      const done = count(name);
      const original = Object.keys(swapped).find(key=>swapped[key]?.name===name);
      return `<div class="line"><div><b>${esc(name)}</b>
        ${original?`<small> · Swapped for ${esc(original)}</small>`:''}
        ${improvements.has(name)?`<br><small>${esc(improvements.get(name))}</small>`:''}</div>
        <small>${done?`${done}/${target} ${/\b(?:min|sec)\b/.test(range)?'rounds':'sets'}`:'Skipped'}</small></div>`;
    }).join('')}
    ${extras.filter(name=>!plan.some(row=>row[0]===name)&&count(name)).map(name=>
      `<div class="line"><b>${esc(name)}</b><small>${count(name)} extra sets</small></div>`).join('')}
    <button class="wide" onclick="openMainTab('Home')">Done</button>
    <button class="alt wide" onclick="openWorkoutLog()">View workout history</button>
  </section>`;
}

function livePlan() {
  const session=entryWorkout||workout();
  return applyWorkoutSwaps(exerciseList(session),S,today(),session).map(row=>row.split('|'));
}

function liveExtras() {
  const extras = S.workoutExtras?.[today()];
  return Array.isArray(extras) ? extras.filter(name=>typeof name==='string') : [];
}

function chooseLiveExercise(name) {
  entryExercise = name;
  entryNotice = '';
  render();
}

function selectLiveWorkout(session) {
  entryWorkout = session;
  chooseLiveExercise('');
}

function addLiveExercise() {
  const typed = $('extraExerciseName').value.trim();
  const name = typed || $('extraExerciseCatalog').value;
  if (!name || name.length>80 || /[|\r\n]/.test(name)) return alert('Choose an exercise or enter a name up to 80 characters.');
  const existing = [...livePlan().map(row=>row[0]),...liveExtras()].find(value=>value.toLowerCase()===name.toLowerCase());
  if (existing) return chooseLiveExercise(existing);
  const previous = S.workoutExtras;
  S.workoutExtras = {...previous,[today()]:[...liveExtras(),name]};
  if (!save()) {
    if (previous === undefined) delete S.workoutExtras;
    else S.workoutExtras = previous;
    return;
  }
  chooseLiveExercise(name);
}

function logTimedRound(increment) {
  const key = today()+'|'+entryExercise;
  const previous = S.work[key];
  const sets = Math.max(0,loggedSetCount(S,key)+increment);
  if (S.detailUnified?.[key] || S.setDetails?.[key]?.length) return alert('This exercise already has saved sets. Use Workout history to review them.');
  S.work[key] = {...previous,sets};
  if (!save()) {
    if (previous === undefined) delete S.work[key];
    else S.work[key] = previous;
    return;
  }
  entryNotice = increment>0?'Round saved':'Round removed';
  render();
}

const exerciseExamples = new Map([
  ['90/90 hip stretch','Sit with one bent leg in front and one bent to the side. Keep your hands down for support and lean slightly over the front thigh.'],
  ['Band chest fly','Anchor a band behind you at chest height. With softly bent elbows, sweep your hands together in front of your chest, then return slowly.'],
  ['Band curl','Stand on the middle of the band and hold the ends. Keep your elbows by your ribs as you curl your hands up and lower them.'],
  ['Band knee extension','Sit with a band secured behind you and around your ankle. Straighten the knee against the band, then bend it slowly.'],
  ['Band lateral raise','Stand on the band and hold an end at each side. Lift your hands outward to about shoulder height, then lower slowly.'],
  ['Band pull-apart','Hold the band in front of your chest with your arms extended. Pull your hands apart without shrugging and return slowly.'],
  ['Band pulldown','Use a secure overhead anchor. Pull your elbows down toward your ribs, then let your arms extend slowly.'],
  ['Band shoulder press','Stand on the band with its ends at shoulder height. Press overhead while keeping your torso steady, then lower.'],
  ['Band triceps extension','Stand on one end of the band and hold the other behind your head. Keep your upper arm still as you straighten and bend your elbow.'],
  ['Barbell Romanian deadlift','Stand with the bar in front of your thighs and knees slightly bent. Push your hips back, keeping the bar close, then stand tall.'],
  ['Barbell row','Hinge forward at the hips with the bar hanging below your shoulders. Pull it toward your lower ribs, then lower it without rocking.'],
  ['Biceps curl','Hold dumbbells at your sides with palms forward. Keep your elbows near your ribs as you curl and lower the weights.'],
  ['Bird dog','Start on hands and knees. Reach one arm forward and the opposite leg back without turning your hips. Return and switch sides.'],
  ['Bodyweight hip hinge','Stand with soft knees and your hands at your hips. Push your hips back as your torso tips forward, then stand tall.'],
  ['Bodyweight squat','Stand with feet about shoulder-width apart. Bend your hips and knees as if sitting down, then push through your feet to stand.'],
  ['Bodyweight step-up','Place one full foot on a stable step. Push through that foot to stand on the step, then lower with control.'],
  ['Brisk walk','Walk tall with relaxed shoulders and a natural arm swing. Use a pace that raises your breathing while you can still talk.'],
  ['Cable row','Sit facing a low cable with feet braced. Pull the handle toward your ribs without rocking back, then extend your arms slowly.'],
  ['Calf raise','Stand with your feet flat and use a stable support for balance. Lift your heels, pause briefly and lower.'],
  ['Calf stretch','Face a wall and step one foot back. Keep the back heel down while bending your front knee until you feel a gentle calf stretch.'],
  ['Cat cow','Start on hands and knees. Slowly round your back, then reverse the movement and gently lift your chest.'],
  ['Chair squat','Stand in front of a stable chair. Lower until you lightly touch the seat, then push through your feet to stand.'],
  ['Chest stretch','Place your forearm on a doorframe at a comfortable height. Turn your chest gently away until you feel the stretch across the front of your shoulder.'],
  ['Chest-supported row','Lie chest-down on an inclined bench with a dumbbell in each hand. Pull your elbows back toward your ribs, then lower slowly.'],
  ['Child pose','Kneel and sit your hips back toward your heels. Reach your arms forward and rest as far down as is comfortable.'],
  ['Close-grip wall push-up','Stand facing a wall with hands slightly closer than shoulder-width. Bend your elbows close to your sides, then push away.'],
  ['Dead bug','Lie on your back with your arms up and knees over your hips. Lower the opposite arm and leg while keeping your lower back steady. Return and switch sides.'],
  ['Dumbbell Romanian deadlift','Hold dumbbells against the front of your thighs. With soft knees, push your hips back and slide the weights down close to your legs. Stand tall to finish.'],
  ['Dumbbell bench press','Lie on a flat bench with feet supported and dumbbells beside your chest. Press both weights up, then lower them slowly.'],
  ['Dumbbell floor press','Lie on the floor with knees bent and dumbbells near your chest. Press up, then lower until your upper arms touch the floor gently.'],
  ['Dumbbell goblet squat','Hold one dumbbell upright close to your chest. Sit down between your hips and stand by pushing through your feet.'],
  ['Dumbbell row','Support one hand on a stable surface and hold a dumbbell in the other. Pull your elbow toward your hip, then lower and switch sides.'],
  ['Dumbbell shoulder press','Hold dumbbells at shoulder height. Press overhead without leaning back, then lower to your shoulders with control.'],
  ['Dumbbell step-up','Hold dumbbells by your sides and place one full foot on a stable step. Drive through that foot to stand up, then step down under control.'],
  ['Easy walk','Walk at a relaxed pace with comfortable strides and a natural arm swing.'],
  ['Face pull','Set a rope attachment near face height. Pull the rope toward your face and separate the ends so your hands finish beside your head. Return slowly.'],
  ['Farmer carry','Hold a weight in each hand by your sides. Walk with steady steps, a tall posture and relaxed shoulders.'],
  ['Gentle breathing','Sit or lie comfortably. Breathe slowly and let your ribs expand as you inhale, then relax as you exhale.'],
  ['Gentle shoulder circles','Let your arms hang loosely. Roll your shoulders gently up, back and down, then reverse.'],
  ['Glute bridge','Lie on your back with knees bent and feet flat. Press through your feet to raise your hips, then lower slowly.'],
  ['Hammer curl','Hold dumbbells with palms facing each other. Curl the weights without moving your upper arms, then lower slowly.'],
  ['Hamstring curl','Set up on the leg-curl machine with the pad against your lower legs. Bend your knees to move the pad and return slowly.'],
  ['Hamstring stretch','Sit with one leg extended and the other bent. Hinge forward from the hips until you feel a gentle stretch behind the straight thigh.'],
  ['Hamstring walkout','Start in a glute bridge. Walk your heels away with small steps, then walk them back while keeping your hips steady.'],
  ['Hip flexor stretch','Kneel on one knee with your other foot in front. Tuck your pelvis slightly and shift forward until you feel a stretch at the front of the back hip.'],
  ['Hip thrust','Sit with your upper back against a stable bench and feet flat. Lift your hips until your torso and thighs line up, then lower slowly.'],
  ['Incline dumbbell press','Lie back on an inclined bench with dumbbells beside your upper chest. Press up and lower the weights with control.'],
  ['Incline press','Set a bench at a modest incline. Press the weights up from upper-chest height, then lower them with control.'],
  ['Incline push-up','Place your hands on a stable raised surface. Keep your body in a line, lower your chest toward the surface and push back up.'],
  ['Kettlebell carry','Hold the kettlebell at your side and walk without leaning toward or away from it. Switch hands to train both sides.'],
  ['Kettlebell deadlift','Stand over the kettlebell. Hinge at the hips, take the handle with both hands and stand tall. Set it down with the same hip hinge.'],
  ['Kettlebell goblet squat','Hold the kettlebell close to your chest with both hands. Bend your hips and knees, then push through your feet to stand.'],
  ['Kettlebell row','Support one hand on a stable surface. Pull the kettlebell toward your hip with the other hand, lower it slowly and switch sides.'],
  ['Kettlebell shoulder press','Hold the kettlebell at one shoulder. Press overhead without leaning, lower with control and switch sides.'],
  ['Lat pulldown','Sit with thighs secured under the pads. Pull the bar toward your upper chest, then let your arms straighten slowly.'],
  ['Lateral raise','Hold light dumbbells at your sides. With elbows slightly bent, raise your arms out to about shoulder height, then lower.'],
  ['Leg extension','Sit on the machine with the pad above your ankles. Straighten your knees to lift the pad, then lower it slowly.'],
  ['Leg press','Sit with your back supported and feet flat on the platform. Lower the platform by bending your knees, then press it away without locking your knees.'],
  ['Leg swings','Hold a stable support. Swing one leg gently forward and back within a comfortable range, then switch legs.'],
  ['Machine chest fly','Set the seat so the handles line up near chest height. Bring the handles together with slightly bent elbows, then open slowly.'],
  ['March in place','Stand tall and alternate lifting each knee as if marching. Let your arms swing naturally.'],
  ['Pike push-up','Start with hands and feet on the floor and hips high. Bend your elbows to lower your head toward the floor, then press back up.'],
  ['Plank','Rest on your forearms and toes with elbows under shoulders. Keep your torso in a straight line and breathe steadily.'],
  ['Prone T raise','Lie face down with arms out to the sides like a T. Lift your hands slightly without shrugging, pause and lower.'],
  ['Prone W raise','Lie face down with elbows bent into a W shape. Lift the arms slightly and draw your shoulder blades together, then lower.'],
  ['Prone Y raise','Lie face down with your arms reaching diagonally overhead. Lift your arms slightly without arching your back, then lower.'],
  ['Prone lat pull','Lie face down with arms reaching forward. Draw your elbows down toward your ribs, then reach forward again.'],
  ['Pull-up','Grip a secure overhead bar. Pull your chest toward the bar without swinging, then lower gradually.'],
  ['Push-up','Place your hands just wider than shoulder-width. Keep your body in a line, lower your chest toward the floor and press back up.'],
  ['Resistance band row','Sit with the band looped securely around your feet. Pull your elbows toward your ribs without leaning back, then release slowly.'],
  ['Reverse lunge','Step one foot behind you and bend both knees. Push through the front foot to return to standing, then switch sides.'],
  ['Reverse snow angel','Lie face down. With your hands slightly off the floor, sweep your arms from your hips toward overhead and back.'],
  ['Seated hamstring curl','Sit with the thigh pad secured and the roller behind your lower legs. Pull your heels down and back, then return slowly.'],
  ['Seated shoulder press','Sit upright with weights at shoulder height. Press overhead without leaning back and lower with control.'],
  ['Self-resisted curl','Press one hand down against the other wrist. Curl the working arm while the other hand provides gentle resistance, then switch sides.'],
  ['Shoulder circles','Relax your arms by your sides. Move your shoulders in slow circles, then reverse direction.'],
  ['Split squat','Stand with one foot forward and the other back. Lower by bending both knees, then rise while keeping your feet in place. Switch sides.'],
  ['Standing band chest press','Anchor the band securely behind you. Stand in a staggered stance and press your hands forward at chest height, then return slowly.'],
  ['Standing band leg curl','Secure a band low in front of you and around one ankle. Hold a support, bend the working knee to bring the heel back, then lower.'],
  ['Standing calf raise','Use a stable support for balance. Rise onto the balls of your feet, pause and lower your heels slowly.'],
  ['Straight-arm pulldown','Face a high cable. Keep a slight bend in the elbows as you sweep the handle down toward your thighs, then return slowly.'],
  ['Thoracic rotation','Start on hands and knees. Place one hand behind your head and rotate that elbow toward the ceiling without shifting your hips. Return and switch sides.'],
  ['Triceps pushdown','Stand facing a high cable with elbows by your ribs. Straighten your elbows to press the handle down, then return slowly.'],
  ['Wall push-up','Place your hands on a wall at chest height and step your feet back. Bend your elbows to bring your chest toward the wall, then push away.']
]);

const exercisePhotoGuides = new Map([
  ['Leg press','https://www.acefitness.org/resources/everyone/exercise-library/154/seated-leg-press/'],
  ['Bird dog','https://www.acefitness.org/resources/everyone/exercise-library/14/bird-dog/'],
  ['Bodyweight squat','https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/']
]);

const exerciseVideoGuides = new Map([
  ['Bodyweight squat',['Mayo Clinic','https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/squat/vid-20084663']],
  ['Bodyweight step-up',['Mayo Clinic','https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/step-up/vid-20084661']],
  ['Biceps curl',['Mayo Clinic','https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/biceps-curl/vid-20084675']],
  ['Dumbbell row',['PureGym','https://www.youtube.com/watch?v=ZRSGpBUVcNw']],
  ['Dumbbell bench press',['PureGym','https://www.youtube.com/watch?v=AduT4Eq-iP0']],
  ['Lat pulldown',['PureGym','https://www.youtube.com/watch?v=JGeRYIZdojU']],
  ['Leg press',['Joanna Soh · leg press chapter','https://www.youtube.com/watch?v=c5LkcjEeNlo&t=60s']],
  ['Push-up',['NASM','https://www.youtube.com/watch?v=WDIpL0pjun0']],
  ["90/90 hip stretch",["","https://www.youtube.com/watch?v=_rzJ1RXhM90"]],
  ["Band chest fly",["","https://www.youtube.com/watch?v=4Dp3OwgBlqs"]],
  ["Band curl",["","https://www.youtube.com/watch?v=gK832HdCcFQ"]],
  ["Band knee extension",["","https://www.youtube.com/watch?v=8FVIsRReMdQ"]],
  ["Band lateral raise",["","https://www.youtube.com/watch?v=Pg2HWPUepD8"]],
  ["Band pull-apart",["","https://www.youtube.com/watch?v=kZNeqj-wtE0"]],
  ["Band pulldown",["","https://www.youtube.com/watch?v=GfKgPSaK4Mg"]],
  ["Band shoulder press",["","https://www.youtube.com/watch?v=Lkr9xf1dcAg"]],
  ["Band triceps extension",["","https://www.youtube.com/watch?v=Av5dYcVvoDc"]],
  ["Barbell Romanian deadlift",["NASM","https://www.youtube.com/watch?v=xgusDooVfKU"]],
  ["Barbell row",["","https://www.youtube.com/watch?v=FWJR5Ve8bnQ"]],
  ["Bird dog",["NASM","https://www.youtube.com/watch?v=ZdAHe9_HeEw"]],
  ["Bodyweight hip hinge",["","https://www.youtube.com/watch?v=e3bJ56AgCss"]],
  ["Brisk walk",["","https://www.youtube.com/watch?v=nmvVfgrExAg"]],
  ["Cable row",["PureGym","https://www.youtube.com/watch?v=lJoozxC0Rns"]],
  ["Calf raise",["","https://www.youtube.com/watch?v=cqDMYUaIXvw"]],
  ["Calf stretch",["","https://www.youtube.com/watch?v=IWhSHm5Iu6A"]],
  ["Cat cow",["PureGym","https://www.youtube.com/watch?v=CE_5RWjFA3Q"]],
  ["Chair squat",["Community Medical Centers","https://www.youtube.com/watch?v=x1lluFT8iuA"]],
  ["Chest stretch",["","https://www.youtube.com/watch?v=nfBApvcOiAc"]],
  ["Chest-supported row",["PureGym","https://www.youtube.com/watch?v=Nx0TzjgsI-0"]],
  ["Child pose",["","https://www.youtube.com/watch?v=OOVNQVV4CH8"]],
  ["Close-grip wall push-up",["","https://www.youtube.com/watch?v=1Yv9K95xdWE"]],
  ["Dead bug",["NASM","https://www.youtube.com/watch?v=bxn9FBrt4-A"]],
  ["Dumbbell Romanian deadlift",["NASM","https://www.youtube.com/watch?v=aa57T45iFSE"]],
  ["Dumbbell floor press",["PureGym","https://www.youtube.com/watch?v=T0Y3OBF1bNI"]],
  ["Dumbbell goblet squat",["","https://www.youtube.com/watch?v=Xjo_fY9Hl9w"]],
  ["Dumbbell shoulder press",["PureGym","https://www.youtube.com/watch?v=aI2hGzsAMXs"]],
  ["Dumbbell step-up",["PureGym","https://www.youtube.com/watch?v=DxUNi119Qzs"]],
  ["Easy walk",["","https://www.youtube.com/watch?v=s9sGx0NFdhs"]],
  ["Face pull",["NASM","https://www.youtube.com/watch?v=eTCBSFlCJ_s"]],
  ["Farmer carry",["","https://www.youtube.com/watch?v=c3CXaiZk9Hc"]],
  ["Gentle breathing",["NHS Health Scotland","https://www.youtube.com/watch?v=IYTZwBzjNC0"]],
  ["Gentle shoulder circles",["","https://www.youtube.com/watch?v=qiyTtBPxyIs"]],
  ["Glute bridge",["PureGym","https://www.youtube.com/watch?v=tqp5XQPpTxY"]],
  ["Hammer curl",["","https://www.youtube.com/watch?v=B4RznoFvTl4"]],
  ["Hamstring curl",["","https://www.youtube.com/watch?v=mP2jRrK7dLg"]],
  ["Hamstring stretch",["","https://www.youtube.com/watch?v=ykOlGxeEnr0"]],
  ["Hamstring walkout",["Physitrack","https://us.physitrack.com/home-exercise-video/hamstring-walkout"]],
  ["Hip flexor stretch",["","https://www.youtube.com/watch?v=UU7Nqd_Dric"]],
  ["Hip thrust",["","https://www.youtube.com/watch?v=7XuNzi5rcj4"]],
  ["Incline dumbbell press",["","https://www.youtube.com/watch?v=oZVCBM9f8Eo"]],
  ["Incline press",["","https://www.youtube.com/watch?v=oZVCBM9f8Eo"]],
  ["Incline push-up",["NASM","https://www.youtube.com/watch?v=0JUrOH--Kdk"]],
  ["Kettlebell carry",["","https://www.youtube.com/watch?v=m7iiTYfRy9A"]],
  ["Kettlebell deadlift",["NASM","https://www.youtube.com/watch?v=MJPGkNqAXzg"]],
  ["Kettlebell goblet squat",["","https://www.youtube.com/watch?v=sIX71MwChNg"]],
  ["Kettlebell row",["","https://www.youtube.com/watch?v=IyQAMOV0WAc"]],
  ["Kettlebell shoulder press",["","https://www.youtube.com/watch?v=20Yis752pi4"]],
  ["Lateral raise",["NASM","https://www.youtube.com/watch?v=XPPfnSEATJA"]],
  ["Leg extension",["PureGym","https://www.youtube.com/watch?v=4ZDm5EbiFI8"]],
  ["Leg swings",["PureGym","https://www.youtube.com/watch?v=difYoBtZi2s"]],
  ["Machine chest fly",["","https://www.youtube.com/watch?v=XZg28DIf1oc"]],
  ["March in place",["Special Olympics","https://resources.specialolympics.org/sports-essentials/sports-and-coaching/warm-up-and-cool-down-videos/dynamic-warm-up-march-in-place"]],
  ["Pike push-up",["NASM","https://www.youtube.com/watch?v=2b5t0Cu2nQI"]],
  ["Plank",["NASM","https://www.youtube.com/watch?v=mwlp75MS6Rg"]],
  ["Prone T raise",["","https://www.youtube.com/watch?v=nyhVRwBzh0Y"]],
  ["Prone W raise",["","https://www.youtube.com/watch?v=EURInbYKKfQ"]],
  ["Prone Y raise",["","https://www.youtube.com/watch?v=w1AWGKubE5U"]],
  ["Prone lat pull",["","https://www.youtube.com/watch?v=u9M73NCL1yc"]],
  ["Pull-up",["NASM","https://www.youtube.com/watch?v=9yVGh3XbJ34"]],
  ["Resistance band row",["","https://www.youtube.com/watch?v=LSkyinhmA8k"]],
  ["Reverse lunge",["PureGym","https://www.youtube.com/watch?v=xrPteyQLGAo"]],
  ["Reverse snow angel",["","https://www.youtube.com/watch?v=Gfc2vP6gm-o"]],
  ["Seated hamstring curl",["Steph Gaudreau","https://www.youtube.com/watch?v=mP2jRrK7dLg"]],
  ["Seated shoulder press",["PureGym","https://www.youtube.com/watch?v=TsduLWuhlFM"]],
  ["Self-resisted curl",["","https://www.youtube.com/watch?v=xvNEdLVDV1w"]],
  ["Shoulder circles",["","https://www.youtube.com/watch?v=qiyTtBPxyIs"]],
  ["Split squat",["PureGym","https://www.youtube.com/watch?v=rlvpaDkc76g"]],
  ["Standing band chest press",["","https://www.youtube.com/watch?v=dNyxQdzkItI"]],
  ["Standing band leg curl",["","https://www.youtube.com/watch?v=w6hVi3HrI5k"]],
  ["Standing calf raise",["","https://www.youtube.com/watch?v=yZdaBOrwCOg"]],
  ["Straight-arm pulldown",["","https://www.youtube.com/watch?v=V2c7C5ziCmA"]],
  ["Thoracic rotation",["","https://www.youtube.com/watch?v=ZAE3PuiG9qU"]],
  ["Triceps pushdown",["PureGym","https://www.youtube.com/watch?v=LXkCrxn3caQ"]],
  ["Wall push-up",["Swell Physiotherapy","https://www.youtube.com/watch?v=yKxkkxkWRYI"]]
]);

function exerciseExample(name) {
  const instruction = exerciseExamples.get(name);
  if (!instruction) return '<p class="muted">A form example is unavailable for this exercise.</p>';
  const photos = exercisePhotoGuides.get(name);
  const clip = exerciseVideoGuides.get(name);
  const video = clip?`<p><a href="${esc(clip[1])}" target="_blank" rel="noopener noreferrer">Watch demo${clip[0]?' · '+esc(clip[0]):''}</a></p>`:'';
  const variation = name==='Reverse snow angel'
    ? '<small>The video lifts the legs. Keep your legs on the floor for the MyFit version.</small>'
    : name==='Incline press'
      ? '<small>The video demonstrates the dumbbell version.</small>'
      : '';
  const formReminder = '<small>Start with a load you can control. If a movement causes pain, stop. A qualified trainer can check your form.</small>';
  return `<p>${esc(instruction)}</p>${video}${variation}${formReminder}${photos?`<p><a href="${photos}" target="_blank" rel="noopener noreferrer">See exercise photos (ACE)</a></p>`:''}`;
}

function toggleLiveSwap(button) {
  const panel = $('liveSwapPanel');
  panel.hidden = !panel.hidden;
  button.setAttribute('aria-expanded',String(!panel.hidden));
}

function liveEntryPanel() {
  const session = entryWorkout || workout();
  const gym = trainingEquipment();
  const plan = livePlan();
  const plannedNames = plan.map(row=>row[0]);
  const extras = liveExtras().filter(name=>!plannedNames.includes(name));
  const count = name => loggedSetCount(S,today()+'|'+name);
  if (![...plannedNames,...extras].includes(entryExercise)) {
    entryExercise = plan.find(([name,sets])=>count(name)<Number(sets))?.[0] || plannedNames[0] || extras[0] || '';
  }
  const selected = plan.find(row=>row[0]===entryExercise);
  const target = selected?.[1];
  const range = selected?.[2] || '';
  const timed = /\b(?:sec|min)\b/.test(range);
  const sets = S.setDetails?.[today()+'|'+entryExercise] || [];
  const last = sets.at(-1);
  const prior = workoutHistory(S).find(row=>row.name===entryExercise&&row.date<today());
  const priorSet = prior?.a.at(-1);
  const previous = priorSet ? `${priorSet.load} lb × ${priorSet.reps}` :
    prior?.r.weight!==''&&prior?.r.weight!=null&&prior?.r.reps ? `${prior.r.weight} lb × ${prior.r.reps}` : '';
  const next = plan.find(([name,sets])=>name!==entryExercise&&count(name)<Number(sets));
  const swapChoices = selected ? availableLiveSwaps() : [];
  const doneCount = plan.filter(([name,sets])=>count(name)>=Number(sets)).length;
  const catalog = [...new Set([
    ...Object.values(ex).flat().map(row=>row.split('|')[0]),
    ...Object.values(exerciseAlternatives).flatMap(options=>options.map(([,name])=>name).filter(Boolean)),
    ...workoutHistory(S).map(row=>row.name)
  ])].filter(name=>![...plannedNames,...extras].includes(name)).sort();
  const options = names => names.map(name=>`<option value="${esc(name)}" ${name===entryExercise?'selected':''}>${esc(name)}</option>`).join('');
  const completion = entryExercise ? (timed ?
    `<p>${count(entryExercise)} of ${esc(target)} rounds recorded</p>
    <button class="wide" onclick="logTimedRound(1)">Mark round complete</button>
    ${count(entryExercise)?'<button class="alt" onclick="logTimedRound(-1)">Undo one round</button>':''}` :
    `<p>${count(entryExercise)}${target?' of '+esc(target):''} sets recorded</p>
    ${sets.map((row,index)=>`<div class="line"><span>Set ${index+1} · ${row.load} lb × ${row.reps}</span><button class="alt" onclick="entryDelete(${index})">Remove</button></div>`).join('')}
    <label>Weight (lb, use 0 for bodyweight)<input id="entryLoad" type="number" min="0" value="${last?.load??''}"></label>
    <label>${range.includes('/side')?'Reps per side':'Reps'}<input id="entryReps" type="number" min="1" value="${last?.reps??''}"></label>
    <label>Effort (1–10)<input id="entryEffort" type="number" min="1" max="10" value="${last?.effort??7}"></label>
    <button class="wide" onclick="entrySave()">Save completed set</button>
    <p id="entryRest"></p><button class="alt" onclick="restUntil=0;updateEntryRest()">Skip rest timer</button>`) : '';
  return `<section id="entryPanel"><h2>Live workout</h2>
    <div class="live-exercise-heading"><h3>${esc(entryExercise||names[session])}</h3>
      ${selected?'<button class="alt" aria-controls="liveSwapPanel" aria-expanded="false" onclick="toggleLiveSwap(this)">Swap exercise</button>':''}
    </div>
    ${selected?`<div class="daily-disclosure" id="liveSwapPanel" hidden>
      ${swapChoices.length?`<label>Available alternatives<select id="liveSwapChoice">${options(swapChoices.map(option=>option.candidate))}</select></label>
        <button class="alt wide" onclick="swapLiveExercise()">Use this exercise today</button>`
        :`<p>${count(entryExercise)?'This exercise already has sets or rounds recorded today. Add a different exercise if you want to switch now.':'No alternatives match your My Gym settings and this workout.'}</p>`}
      <button class="alt" onclick="profileSection598('Gym')">Edit My Gym</button>
    </div>`:''}
    <p class="muted">${esc(names[session])} · ${doneCount}/${plan.length} exercises complete</p>
    ${next?`<p><small>Up next: ${esc(next[0])}</small></p>`:''}
    ${selected?`<p><b>Coach’s target:</b> ${esc(target)} ${timed?'rounds':'sets'} × ${esc(range)}${timed||range.includes('/')?'':' reps'}</p>`:''}
    ${entryExercise?`<details class="daily-disclosure"><summary>How to do it · ${esc(entryExercise)}</summary>${exerciseExample(entryExercise)}</details>`:''}
    ${gym.notes||gym.restrictions.length?`<details><summary>My Gym · movement preferences and notes</summary>${gymSummary(gym)}</details>`:''}
    ${!timed&&previous?`<small>Last session · ${esc(prior.date)} · ${esc(previous)}</small>`:''}
    ${completion}
    <p role="status">${esc(entryNotice)}</p>
    ${next && (!target||count(entryExercise)>=Number(target))?`<button class="wide" onclick="chooseLiveExercise(this.dataset.exercise)" data-exercise="${esc(next[0])}">Next exercise · ${esc(next[0])}</button>`:''}
    <details class="daily-disclosure"><summary>Workout queue</summary>
    <label>Workout<select id="liveWorkoutType" onchange="selectLiveWorkout(this.value)">
      ${Object.entries(names).map(([key,label])=>`<option value="${key}" ${session===key?'selected':''}>${esc(label)}${key===workout()?' · Scheduled today':''}</option>`).join('')}
    </select></label>
    ${plan.length||extras.length?`<label>Exercise<select id="liveExercise" onchange="chooseLiveExercise(this.value)">
      ${plan.length?`<optgroup label="Coach’s recommendations">${options(plannedNames)}</optgroup>`:''}
      ${extras.length?`<optgroup label="Your added exercises">${options(extras)}</optgroup>`:''}
    </select></label>`:'<p>No exercises scheduled for recovery. Choose another workout or add an exercise.</p>'}
      <ol>${plan.map(([name,target])=>`<li>${esc(name)} · ${count(name)}/${esc(target)} recorded</li>`).join('')}</ol>
    </details>
    <details><summary>Add exercise</summary>
      <label>Choose an exercise<select id="extraExerciseCatalog"><option value="">Select an exercise</option>${options(catalog)}</select></label>
      <label>Or enter your own<input id="extraExerciseName" maxlength="80"></label>
      <button class="alt wide" onclick="addLiveExercise()">Add to this workout</button>
    </details>
    <button class="alt wide" onclick="finishLiveWorkout()">Finish workout</button>
  </section>`;
}

function entryPanel(){if(entryMode==='live')return liveEntryPanel();let list=entryList();if(!list.includes(entryExercise))entryExercise=list[0]||'';let a=S.setDetails?.[day()+'|'+entryExercise]||[],last=a.at(-1),prev=workoutHistory(S).find(x=>x.name===entryExercise&&x.date<day()),range=exerciseList(workout()).find(x=>x.split('|')[0]===entryExercise)?.split('|')[2]||'';return `<section id="entryPanel"><h2>Log past workout</h2><p>${esc(day())} · Choose the workout date using the date field above.</p><label>Exercise<select onchange="entryExercise=this.value;entryNotice='';render()">${list.map(n=>`<option ${n===entryExercise?'selected':''}>${esc(n)}</option>`).join('')}</select></label>${prev?`<small>Previous: ${esc(prev.date)} · ${prev.a.length?prev.a.map(r=>r.load+' lb × '+r.reps).join(', '):esc(prev.r.weight)+' lb × '+esc(prev.r.reps)}</small>`:''}<p>${a.length} saved sets · ${detailSummary(a).volume} lb volume</p>${a.map((r,i)=>`<div class="line"><span>${i+1}. ${r.load} lb × ${r.reps} · effort ${r.effort}</span><button class="alt" onclick="entryDelete(${i})">Remove</button></div>`).join('')}<label>Weight (lb)<input id="entryLoad" type="number" min="0" value="${last?.load??''}"></label><label>Reps<input id="entryReps" type="number" min="1" value="${last?.reps??''}"></label><label>Effort (1–10)<input id="entryEffort" type="number" min="1" max="10" value="${last?.effort??7}"></label><label>Identical sets<input id="entryCount" type="number" min="1" max="30" value="1"></label><label><input id="entryReplace" type="checkbox" style="width:auto"> Replace existing detailed sets instead of adding</label><button class="wide" onclick="entrySave()">Save workout entry</button><p role="status">${esc(entryNotice)}</p><p>${esc(detailAdvice(a,range,recoveryAdvice(S.recovery?.[today()])))}</p><button class="alt wide" onclick="entryMode=\'\';restUntil=0;render()">Done logging</button></section>`}
function entryDelete(i){let key=day()+'|'+entryExercise,a=S.setDetails?.[key];if(!a?.[i]||!confirm('Remove this saved set?'))return;let prior=JSON.stringify(S);if(!adoptDetail(key))return;a.splice(i,1);syncDetail(key);if(!save()){S=JSON.parse(prior);return alert('Removal not saved.')}render()}
function updateEntryRest(){let el=$('entryRest');if(el){let n=Math.max(0,Math.ceil((restUntil-Date.now())/1000));el.textContent=n?'Rest: '+Math.floor(n/60)+':'+String(n%60).padStart(2,'0'):'Ready for next set when recovered.'}}
setInterval(updateEntryRest,1000);
const entryRender=render;
function dashboardFoodMenu(){$('date').value=today();tab='Food';foodOpen('Log','text')}
function dashboardFood(method){$('date').value=today();tab='Food';foodStart(method)}
function dashboardRecovery(){ $('date').value=today();render();$('dashboardRecovery').open=true;$('dashboardRecovery').scrollIntoView({block:'start'}) }
function dashboardStart(){tab='Home';if(entryMode==='live'){render()}else entryStart('live');window.scrollTo(0,0)}
render=function(){entryRender();let nav=$('nav').querySelector('button');if(nav)nav.innerHTML='<span>⌂</span>Dashboard';if(tab==='Home'){
 if(entryMode==='live'){$('app').innerHTML=entryPanel();updateEntryRest();return}
 let current=day()===today();$('app').insertAdjacentHTML('afterbegin',`<section><div class="pill">LIVE · ${esc(today())}</div><h2>Today's command centre</h2>${current?'':'<p>Viewing a past date. Live actions use today.</p>'}<div style="display:grid;gap:12px"><button class="wide" onclick="dashboardStart()">Start live workout</button><button class="alt wide" onclick="dashboardFood('camera')">Snap &amp; Track · Camera</button><button class="alt wide" onclick="dashboardFood('gallery')">Snap &amp; Track · Gallery</button><button class="alt wide" onclick="dashboardFood('text')">Log a meal now</button><button class="alt wide" onclick="dashboardRecovery()">Daily recovery check-in</button></div></section>`);if(current)$('app').insertAdjacentHTML('beforeend',`<details id="dashboardRecovery"><summary>Today's recovery</summary>${recoveryPanel()}</details>`);
 }if(tab==='Workout'){if(entryMode==='past'){$('app').innerHTML=entryPanel();return} $('app').insertAdjacentHTML('afterbegin',`<section><h2>Training plan &amp; records</h2><div style="display:grid;gap:12px"><button class="wide" onclick="entryStart('past')">Log past workout</button><button class="alt wide" onclick="openWorkoutLog()">Workout history</button><button class="alt wide" onclick="dashboardStart()">Go to live workout</button></div><small>Live training starts on Dashboard. Both modes share workout history.</small></section>`)} };

// Unified read-only training plan and history-derived accountability.
function loggedSetCount(state,key){let a=state.setDetails?.[key];return Array.isArray(a)&&a.length?a.length:state.detailUnified?.[key]?0:Math.max(0,Number(state.work?.[key]?.sets)||0)}
function trainingStatus(state,date,plan){const session=schedule()[(new Date(date+'T12:00:00').getDay()+6)%7];let planned=applyWorkoutSwaps(plan,state,date,session).filter(x=>/^\d+(?:[–-]\d+)?(?:\/side)?$/.test(x.split('|')[2]));let target=0,done=0;for(let x of planned){let [n,c]=x.split('|');target+=+c;done+=Math.min(+c,loggedSetCount(state,date+'|'+n))}let actual=[...new Set([...Object.keys(state.work||{}),...Object.keys(state.setDetails||{})])].filter(k=>k.startsWith(date+'|')).reduce((a,k)=>a+loggedSetCount(state,k),0);return {target,done,actual,kind:!target?'unscheduled':done===target?'complete':actual?'partial':'unlogged'}}
function logMetrics(row){let a=row.a;if(a.length)return {reps:a.reduce((n,r)=>n+r.reps,0),volume:detailSummary(a).volume,best:Math.max(...a.map(r=>r.load))};let r=row.r;return +r.sets>0&&+r.reps>0&&r.weight!==''&&r.weight!=null&&Number.isFinite(+r.weight)?{reps:+r.sets*+r.reps,volume:+r.sets*+r.reps*+r.weight,best:+r.weight}:null}
const originalLogPanel=workoutLogPanel;workoutLogPanel=function(){let rows=workoutHistory(S);let summary=rows.filter(r=>loggedSetCount(S,r.date+'|'+r.name)>0);return originalLogPanel().replace('<h2>Workout log</h2>',`<h2>Workout log &amp; progression</h2><p>${new Set(summary.map(r=>r.date)).size} training days · ${summary.reduce((n,r)=>n+loggedSetCount(S,r.date+'|'+r.name),0)} recorded sets</p><small>Calculated from saved workouts, not planned sets.</small>`).replace('</summary>', '</summary>')+`<section id="exerciseProgress"><h3>Exercise progression</h3>${[...new Set(summary.map(r=>r.name))].map(n=>{let history=summary.filter(r=>r.name===n).map(r=>({date:r.date,m:logMetrics(r)})).filter(r=>r.m);if(!history.length)return '';let latest=history[0],previous=history[1];return `<details><summary>${esc(n)} · ${latest.m.volume.toLocaleString()} lb volume</summary><p>${esc(latest.date)}: ${latest.m.reps} reps · heaviest recorded load ${latest.m.best} lb</p>${previous?`<p>Previous (${esc(previous.date)}): ${previous.m.volume.toLocaleString()} lb volume · ${previous.m.reps} reps</p>`:'<p>Baseline recorded.</p>'}<small>Volume is not a direct measure of strength. Bodyweight work excludes body mass.</small></details>`}).join('')||'<p>Record a workout to see progression.</p>'}</section>`};
const previousAccountability=accountability;accountability=function(date=today(),event='daily'){let w=schedule()[(new Date(date+'T12:00:00').getDay()+6)%7],t=trainingStatus(S,date,exerciseList(w)),msg=previousAccountability(date,event);if(t.target){msg+=' '+(t.kind==='complete'?`All ${t.target} planned strength sets recorded.`:t.kind==='partial'?`${t.done}/${t.target} planned strength sets recorded (${t.actual} total sets). Finish or adjust your plan if appropriate.`:date<today()||date===today()&&new Date().getHours()>=20?'No sets saved. If you trained, log the session; otherwise reschedule if appropriate.':`${t.target} planned strength sets awaiting recording.`)}return msg};
const cleanRender=render;render=function(){cleanRender();if(tab==='Workout'&&entryMode!=='past'){$('app').innerHTML=`<section><h2>Training and records</h2><div style="display:grid;gap:12px"><button class="wide" onclick="entryStart('past')">Log past workout</button><button class="alt wide" onclick="openWorkoutLog()">Workout log &amp; progression</button><button class="alt wide" onclick="dashboardStart()">Live Workout</button><button class="alt wide" onclick="openWorkoutSchedule()">View workout schedule</button><button class="alt wide" onclick="profileSection598('Gym')">Edit equipment in My Gym</button></div></section><section><h3>${esc(names[workout()])}</h3>${exerciseList(workout()).map(x=>{let [n,c,r]=x.split('|');return `<details class="workout-example"><summary><b>${esc(n)}</b> <small>${esc(c)} × ${esc(r)} · ${loggedSetCount(S,day()+'|'+n)} recorded</small></summary>${exerciseExample(n)}</details>`}).join('')||'<p>Recovery day.</p>'}<small>Record training on Dashboard or Log past workout.</small></section>`}};



let dashDetail='';
function dashToggle(k){dashDetail=dashDetail===k?'':k;render()}
function waterToday(){return Number(S.hydration?.[today()]||0)}
function waterGoal(){return Number(S.hydrationGoal||2000)}
function waterChange(delta){let prior=JSON.stringify(S);(S.hydration??={})[today()]=Math.max(0,Math.min(20000,waterToday()+delta));if(!save())S=JSON.parse(prior);render()}
function waterTarget(){let n=Number($('waterGoal').value);if(!Number.isInteger(n)||n<250||n>10000)return alert('Enter a target from 250 to 10000 ml.');let prior=JSON.stringify(S);S.hydrationGoal=n;if(!save())S=JSON.parse(prior);render()}
const dashValid=validState;validState=function(x){return dashValid(x)&&(!('hydration' in x)||(x.hydration&&typeof x.hydration==='object'&&!Array.isArray(x.hydration)&&Object.entries(x.hydration).every(([d,n])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isInteger(n)&&n>=0&&n<=20000)))&&(!('hydrationGoal' in x)||(Number.isInteger(x.hydrationGoal)&&x.hydrationGoal>=250&&x.hydrationGoal<=10000))};
function dashRing(k,v,sub,p,c){return `<button aria-expanded="${dashDetail===k}" onclick="dashToggle('${k}')"><span class="dash-ring" style="--c:${c};--p:${Math.max(0,Math.min(100,p*100))}%"><span><b>${esc(String(v))}</b><small>${esc(sub)}</small></span></span>${k}</button>`}
function compactDashboard(){let d=today(),t=targets(),a=totals((S.meals[d]||[]).flatMap(m=>m.items)),w=schedule()[(new Date(d+'T12:00:00').getDay()+6)%7],plan=exerciseList(w),st=trainingStatus(S,d,plan),i=activeCoach(),water=waterToday(),goal=waterGoal(),remaining=t[0]-a[0],rec=recoveryAdvice(S.recovery?.[d]);let action=rec==='stop'||rec==='recover'?'Review recovery':st.target&&st.done<st.target?(st.actual?'Resume live workout':'Start live workout'):!S.recovery?.[d]?'Daily recovery check-in':st.kind==='complete'?'View workout log':'Log a meal';let call=action.includes('recovery')?'dashboardRecovery()':action.includes('workout log')?'openWorkoutLog()':action.includes('workout')?'dashboardStart()':"dashboardFood('text')";let detail=dashDetail==='Calories'?`<section>${bars(a,t)}<small>${a[0]} kcal recorded today.</small></section>`:dashDetail==='Training'?`<section><h3>${esc(names[w])}</h3>${plan.map(x=>{let [n,c,r]=x.split('|');return `<div class="line"><span>${esc(n)}<br><small>${esc(c)} × ${esc(r)}</small></span><b>${loggedSetCount(S,d+'|'+n)} saved</b></div>`}).join('')||'<p>Rest day.</p>'}<small>Ring counts planned strength sets only; timed activities are not included.</small></section>`:dashDetail==='Hydration'?`<section><h3>${water} / ${goal} ml</h3><div class="grid"><button class="alt" onclick="waterChange(-250)" ${water===0?'disabled':''}>− 250 ml</button><button onclick="waterChange(250)">+ 250 ml</button></div><label>Daily water target (ml)<input id="waterGoal" type="number" min="250" max="10000" value="${goal}"></label><button class="alt wide" onclick="waterTarget()">Save target</button><small>Adjust to your needs; 2 L is an editable starting target, not a medical recommendation.</small></section>`:'';return `<div class="dash"><div><div class="pill">TODAY · ${esc(d)}</div><h2>Your daily performance</h2></div><div class="dash-rings">${dashRing('Calories',Math.abs(remaining),remaining<0?'kcal over':'kcal left',a[0]/t[0],'#a5ef91')}${dashRing('Training',st.target?Math.round(st.done/st.target*100)+'%':'—',st.target?st.done+'/'+st.target+' sets':'no strength',st.target?st.done/st.target:0,'#f5b45f')}${dashRing('Hydration',(water/1000).toFixed(2)+' L','of '+goal/1000+' L',water/goal,'#65bdf5')}</div>${detail}<section class="dash-coach"><img src="${coachPortraits[i][avatarChoice(coachPrefs(),i)]}" alt="Selected coach"><div><div class="pill">${esc(coachStyles[i][0])}</div><p>${esc(accountability(d))}</p></div></section><button class="wide" onclick="${call}">${action}</button><div class="dash-actions"><button class="alt" onclick="dashboardFood('camera')">◉ Snap</button><button class="alt" onclick="dashboardFood('gallery')">▧ Gallery</button><button class="alt" onclick="dashboardFood('text')">＋ Meal</button><button class="alt" onclick="waterChange(250)">＋ Water</button></div><section><details id="dashboardRecovery"><summary>Recovery &amp; readiness</summary>${recoveryPanel()}</details></section><section><details><summary>Today's plan · ${esc(names[w])}</summary><button class="alt wide" onclick="tab='Workout';render()">Training plan</button><button class="alt wide" onclick="tab='Planner';render()">Meal &amp; activity planner</button></details></section></div>`}
const compactRender=render;render=function(){compactRender();if(tab==='Home'&&entryMode!=='live')$('app').innerHTML=compactDashboard()};

const barcodeRender=render;render=function(){stopBarcode();barcodeRender()};document.addEventListener('visibilitychange',()=>{if(document.hidden)stopBarcode()});window.addEventListener('pagehide',stopBarcode);
function labelForm(product={},vals=[]){stopBarcode();let out=$('lookupResults');if(!out)return;let name=[product.brands,product.product_name_en||product.product_name].filter(Boolean).join(' · ');out.innerHTML=`<h3>${name?'Product found · review nutrition':'Package nutrition label'}</h3><p class="muted">Enter or scan values for the same serving. Missing values are blank, not zero.</p><label>Product name<input id="bcName" value="${esc(name)}"></label><div class="nutrition-actions"><button class="alt" onclick="$('labelCam').click()">Scan label photo</button><button class="alt" onclick="$('labelGallery').click()">Choose label photo</button></div><input hidden type="file" id="labelCam" accept="image/*" capture="environment" onchange="readLabel(this)"><input hidden type="file" id="labelGallery" accept="image/*" onchange="readLabel(this)"><p id="labelNote" role="status"></p><label>Serving amount<input id="bcWeight" type="number" min="0.1" step="any" value="${vals.length?100:''}"></label><label>Unit<select id="bcUnit"><option>g</option><option>mL</option></select></label>${[['k','Calories'],['p','Protein (g)'],['c','Carbs (g)'],['f','Fat (g)']].map(([k,n],i)=>`<label>${n}<input id="bc_${k}" type="number" min="0" step="any" value="${vals[i]!=null&&vals[i]!==''&&Number.isFinite(+vals[i])?+vals[i]:''}"></label>`).join('')}<button class="wide" id="bcSave">Review checked label values</button>`;if(product.serving_quantity_unit==='ml')$('bcUnit').value='mL';$('bcSave').onclick=()=>{let name=$('bcName').value.trim(),g=Number($('bcWeight').value),unit=$('bcUnit').value,v=['k','p','c','f'].map(k=>$('bc_'+k).value);if(!name||!Number.isFinite(g)||g<=0||v.some(x=>x===''||!Number.isFinite(+x)||+x<0))return alert('Complete every field. Confirm any zero values.');let [k,p,c,f]=v.map(x=>+x*100/g),code=$('lookup').value.trim(),item={name,k,p,c,f,unit,serving:g,source:'Package label · user reviewed'};if(/^\d{8,14}$/.test(code))cacheBarcode(code,item);barcodeResult(item,out,code)}}
function barcodeManual(){labelForm()}
function parseLabelText(text){let get=re=>{let m=text.match(re);return m?Number(m[1].replace(',','.')):null};return {weight:get(/(?:per|serving size)[^\n]{0,65}?\(?\s*(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i),unit:/((?:per|serving size)[^\n]{0,65}?\d\s*ml\b)/i.test(text)?'mL':'g',k:get(/\bcalories\s*[: ]*([\d.,]+)/i),p:get(/\bprotein\s*[: ]*([\d.,]+)\s*g/i),c:get(/\b(?:total carbohydrate|carbohydrate|carbohydrates)\s*[: ]*([\d.,]+)\s*g/i),f:get(/(?:^|\n)\s*(?:total )?fat\s*[: ]*([\d.,]+)\s*g/im)}}
async function readLabel(el){let file=el.files?.[0],note=$('labelNote');if(!file||!note)return;let worker;note.textContent='Reading label… first use requires internet.';try{if(!window.Tesseract)await new Promise((resolve,reject)=>{let e=document.createElement('script');e.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';e.onload=resolve;e.onerror=reject;document.head.append(e)});worker=await Tesseract.createWorker('eng');let r=await worker.recognize(file);if(!note.isConnected)return;let v=parseLabelText(r.data.text);for(let k of ['k','p','c','f'])$('bc_'+k).value=v[k]??'';$('bcWeight').value=v.weight??'';$('bcUnit').value=v.unit;note.textContent='Check all values against the package. Unread fields are blank.';let d=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='Recognized text';pre.style.whiteSpace='pre-wrap';pre.textContent=r.data.text;d.append(summary,pre);note.append(d)}catch(e){if(note.isConnected)note.textContent='Label scan unavailable. Enter values manually.'}finally{if(worker)await worker.terminate()}}
let smartType='',smartIndex=0,smartOptions=[],smartDate='',smartNotice='';
function nutritionAsk(type=autoMeal(),quick=false){smartType=type;smartIndex=0;smartDate=day();let a=sum(),t=targets(),remaining=t[0]-a[0],protein=t[1]-a[1],budget=Math.max(200,Math.min(type==='Snack'?400:750,remaining>0?remaining:250));smartOptions=picks(type).filter(x=>!quick||isQuickRecipe(x.i)).map(x=>{let items=recipeItems(x.r,type,true),scale=(isQuickRecipe(x.i)||sourcedBreakfastRecipes.has(x.r))?1:Math.max(.35,Math.min(1.25,budget/Math.max(1,totals(items)[0])));items=items.map(y=>({...y,g:Math.max(1,Math.round(y.g*scale))}));let v=totals(items);return {...x,items,v,score:Math.abs(v[0]-budget)-(protein>0?v[1]*3:0)}}).sort((a,b)=>a.score-b.score);tab='Food';foodPage='Today';render()}
function smartNext(){smartIndex=(smartIndex+1)%Math.max(1,smartOptions.length);render()}
function smartLog(){let x=smartOptions[smartIndex];if(!x||smartDate!==day())return;if(draft.length&&!confirm('Replace current meal draft?'))return;draft=JSON.parse(JSON.stringify(x.items));foodEdit=null;smartType='';foodOpen('Log','text')}
function plannedEat(type){let k=day()+'|'+type,arr=S.meals[day()]||[],existing=arr.findIndex(m=>m.planSlot===k);if(existing>=0){if(!confirm('Undo logged planned meal?'))return;removeMeal(day(),existing);return}let x=planned(day(),type);if(!x)return;if(!confirm('Log '+x.r[1]+' with the planned portions?'))return;let items=recipeItems(x.r,type,true);if(!items.every(validItem))return;let prior=JSON.stringify(S);(S.meals[day()]??=[]).push({items,planSlot:k,time:new Date().toISOString()});(S.mealSlots??={})[k]='completed';if(!save())S=JSON.parse(prior);render()}
toggleSlot=function(t,status){if(status==='completed'){plannedEat(t);return}let k=day()+'|'+t;if((S.meals[day()]||[]).some(m=>m.planSlot===k))return alert('Undo the logged meal before skipping.');S.mealSlots??={};if(S.mealSlots[k]===status)delete S.mealSlots[k];else S.mealSlots[k]=status;save();render()};
const nutritionOldView=foodView;foodView=function(a,t){if(foodPage!=='Today')return nutritionOldView(a,t);let i=activeCoach(),remaining=t[0]-a[0],x=smartDate===day()&&smartType?smartOptions[smartIndex]:null;return `<div class="nutrition-hub"><h2>Your nutrition</h2><section><div class="metric">${a[0]} / ${t[0]} kcal</div><small>${remaining>=0?remaining+' kcal remaining':Math.abs(remaining)+' kcal above target'}</small>${bars(a,t)}</section><section><div class="pill">${esc(coachStyles[i][0])} · ${day()===today()?new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'Selected date'}</div><p>${remaining>0?'Let’s find something that fits your goals.':'Your calorie target is reached. If you are hungry, you can still eat.'}</p><button class="wide" onclick="nutritionAsk()">I'm hungry</button><button class="alt wide" onclick="nutritionAsk(autoMeal(),true)">Quick meal ideas</button>${x?`<div class="nutrition-suggestion"><small>${esc(smartType)} · estimated recipe</small><h3>${esc(x.r[1])}</h3><p>${x.v[0]} kcal · ${x.v[1]} g protein · ${x.v[2]} g carbs · ${x.v[3]} g fat</p><details><summary>Ingredients and preparation</summary>${x.items.map(y=>`<p>${esc(y.name)} · ${y.g} g</p>`).join('')}<p>${esc(x.r[3])}</p></details><button class="wide" onclick="smartLog()">I ate this · review & log</button><button class="alt wide" onclick="smartNext()">Suggest something else</button></div>`:''}</section><h3>Quick log</h3><div class="nutrition-actions">${[['camera','📷 Snap meal'],['gallery','Gallery'],['barcode','Barcode'],['text','Manual'],['search','Search food'],['voice','Voice']].map(([m,n])=>`<button class="alt" onclick="foodStart('${m}')">${n}</button>`).join('')}<button class="alt" onclick="foodOpen('Log','barcode');barcodeManual()">Nutrition label</button></div>${draft.length?'<button class="wide" onclick="foodOpen(\'Log\')">Resume meal draft</button>':''}<section><h3>Today's meal plan</h3>${mealTypes.map(type=>{let x=planned(day(),type),done=(S.meals[day()]||[]).some(m=>m.planSlot===day()+'|'+type);return `<details><summary>${type} · ${done?'Logged':slotStatus(day(),type)==='completed'?'Previously marked · not verified':esc(x?.r[1]||'Choose meal')}</summary>${x?`<p>${totals(recipeItems(x.r,type,true))[0]} kcal estimated</p><button class="wide" onclick="plannedEat('${type}')">${done?'Undo logged meal':'I ate this planned meal'}</button>`:''}<button class="alt wide" onclick="nutritionAsk('${type}')">Ask coach for ${type.toLowerCase()}</button></details>`}).join('')}</section><section><h3>Food log</h3>${foodRows(day())}</section><div class="nutrition-actions"><button class="alt" onclick="tab='Planner';render()">Meal planner</button><button class="alt" onclick="foodOpen('Diary')">Diary</button><button class="alt" onclick="foodOpen('Saved')">Saved</button><button class="alt" onclick="foodOpen('Settings')">Settings</button></div></div>`};
const nutritionRender=render;render=function(){nutritionRender();if(tab==='Food'){let app=$('app');while(app.firstElementChild&&app.firstElementChild.tagName==='SECTION'&&!app.firstElementChild.querySelector('#draft')&&!app.firstElementChild.classList.contains('nutrition-hub'))app.firstElementChild.remove();if(foodPage==='Today'&&app.querySelector('.nutrition-hub')){for(let el of [...app.children])if(!el.classList.contains('nutrition-hub'))el.remove()}}};
const cast58=[["Marcus Steele", "Brooklyn, New York", "Bodybuilding gym owner; 28 years in strength coaching", "Earn every rep", "Yo, let's get to work", "That is real work, superstar.", "Muscles don't grow from scrolling.", "Earn every rep — excuses don’t lift weights."], ["Dwayne Iron Campbell", "Kingston, Jamaica", "Former sprint and bodybuilding competitor; 18 years coaching", "Build strength with control", "Big up, ready to work?", "Respect! Your work is showing.", "Easy now, quality before ego.", "Big up! Strong reps, stronger habits."], ["Victoria Viper Cross", "Detroit", "Powerlifting competitor; 15 years coaching technique", "Make strength repeatable", "Numbers on the board, let's go", "Strong work. Make it repeatable.", "The bar doesn't care about excuses.", "The bar doesn’t care about excuses."], ["Rosa Vega", "Miami", "Former weightlifting competitor; 14 years coaching", "Precision before ego", "Let's bring the fire", "That's how we build strength.", "Save the drama for the last rep.", "Bring the fire, leave the ego."], ["Jack Mercer", "Halifax", "Military fitness instructor; 22 years of service", "Execute the plan", "Check in. Confirm the plan.", "Objective achieved.", "Report status, then adapt.", "The plan is set. Execute."], ["Andre Lewis", "Kingston, Jamaica", "Former military endurance instructor; 17 years coaching", "Prepared, not reckless", "Morning, team. Ready?", "Well done, keep steady.", "A sound plan beats rushing.", "Prepared, not reckless."], ["Sasha Grant", "London", "Obstacle course instructor; 16 years coaching", "Consistency under pressure", "Right, time to organize", "Solid execution.", "No unnecessary detours.", "Discipline under pressure. No detours."], ["Nina Kovac", "Warsaw", "Former rescue-service fitness instructor; 12 years coaching", "Preparation first", "Today's orders: plan and prepare", "Excellent discipline.", "Adjust the mission, not your safety.", "Adjust the mission, never your safety."], ["Adrian Ace Cole", "Toronto", "Former track competitor; 10 years performance coaching", "Better than yesterday", "Game on", "That's measurable progress.", "Recovery is a competitive advantage.", "Better than yesterday. Game on."], ["Jordan Jet Mitchell", "Bronx, New York", "Former neighborhood basketball league player and conditioning coach; 12 years", "Win your own game", "Yo, what's the game plan?", "That's a highlight-reel effort.", "Play the long game, not hero ball.", "Your game, your rules, your next level."], ["Simone Blake", "Montego Bay, Jamaica", "Former competitive sprinter; 11 years coaching", "Fast, focused, consistent", "Ready to move? Let's set the pace", "Big up on that progress!", "Good fuel, good rhythm.", "Find your pace and own it."], ["Lucia Moretti", "Milan", "Former cycling competitor; 13 years endurance coaching", "Pace with purpose", "Let's find our rhythm", "Excellent pacing.", "Don't sprint the whole race.", "Pace with purpose; finish strong."], ["Omar Haddad", "Amman", "Fictional recovery researcher; 10 years education", "Adapt to recover", "Let's check readiness", "Consistency is showing.", "Recovery is part of the experiment.", "Recover smarter, train better."], ["Daniel Chen", "Singapore", "Fictional sports nutrition researcher; 12 years education", "Fuel with evidence", "Let's check the numbers", "A useful data point.", "One day is not a trend.", "Fuel with evidence, not guesswork."], ["Priya Shah", "Mumbai", "Fictional biomechanics researcher; 14 years coaching", "Movement quality matters", "Let's assess today's baseline", "That's a meaningful observation.", "Technique before load.", "Technique before load."], ["Elena Brooks", "Vancouver", "Fictional exercise science researcher; 18 years education", "Understand and apply", "Let's review the evidence", "The records show progress.", "Let's separate facts from assumptions.", "Understand it. Apply it. Master it."], ["Carlos Reyes", "San Antonio", "Community strength trainer; 15 years coaching", "Small steps, big change", "Let's get a practical plan", "Nice work, keep building.", "Keep it simple and sustainable.", "Small steps. Real strength."], ["Theo Martin", "Montreal", "Former recreation instructor; 11 years coaching", "Make movement a habit", "Bonjour, ready to get moving?", "Nicely done.", "A realistic plan wins.", "Keep it practical. Keep showing up."], ["Aisha Morgan", "Atlanta", "Functional fitness instructor; 13 years coaching", "Strength for life", "Let's make today count", "That's useful strength.", "Life happens; adapt the routine.", "Build confidence one rep at a time."], ["Natalie James", "Edmonton", "Beginner fitness coach; 12 years coaching", "Build confidence", "Ready for a manageable day?", "You've made a solid step.", "We can adjust the plan.", "Progress that fits your life."], ["Mateo Silva", "Lisbon", "Community sports instructor; 8 years coaching", "Joy in consistency", "Ready for a good day?", "Fantastic effort!", "Make room for fun and rest.", "Bring the energy, celebrate the effort."], ["Tyler Bennett", "Seattle", "Group fitness instructor; 9 years coaching", "Confidence through movement", "Hey team, ready?", "Look at you showing up!", "No perfection required.", "Every rep deserves a little applause."], ["Jasmine Jazz Carter", "Houston", "Former competitive cheerleader; 10 years group fitness", "Celebrate the effort", "Hey superstar, let's go!", "Yes! That effort deserves a cheer.", "Small wins are still wins.", "Big energy for small wins!"], ["Leah Williams", "Birmingham", "Dance fitness instructor; 12 years coaching", "Find your groove", "Let's get the day moving", "You found your rhythm!", "We can reset the beat.", "Your progress is worth cheering for."], ["Noah Bennett", "Wellington", "Outdoor mobility instructor; 12 years teaching", "Move with ease", "Let's find a comfortable rhythm", "A lovely step forward.", "Leave room for recovery.", "Find balance in the work."], ["Kenji Tanaka", "Kyoto", "Martial arts and mobility instructor; 20 years teaching", "Control before force", "A new day to practice", "Control and patience are paying off.", "Mastery includes knowing when to stop.", "Strength begins with control."], ["Anika Rao", "Pune", "Yoga and breathing instructor; 14 years teaching", "Balance and awareness", "Let's check in with your body", "Notice the progress you've made.", "Move gently when needed.", "Breathe, move, grow."], ["Maya Rivers", "Victoria", "Former gymnast and yoga instructor; 16 years teaching", "Progress with purpose", "Good morning, make space for yourself", "Celebrate your steady growth.", "Rest is welcome here.", "Progress doesn’t have to be loud."]];
function character58(i=activeCoach(),j=avatarChoice(coachPrefs(),i)){return cast58[i*4+j]||cast58[0]}
avatarPanel=function(){let i=previewCoach??activeCoach(),j=previewLook??avatarChoice(coachPrefs(),i),c=character58(i,j);return `<section id="coachAppearance"><small>MYFIT / COACH ROSTER</small><h2>Choose your coach</h2><div class="roster">${coachStyles.map((x,k)=>`<button aria-pressed="${i===k}" onclick="previewSelection(${k},${avatarChoice(coachPrefs(),k)})"><span style="font-size:1.5rem">${x[1]}</span><br>${esc(x[0])}</button>`).join('')}</div><div class="hero">${avatarArt(i,j)}<div class="heroText"><small>${esc(coachStyles[i][0])}</small><h2>${esc(c[0])}</h2><p><b>“${esc(c[7])}”</b></p><small>${esc(c[1])}</small></div></div><h3>Meet the four coaches</h3><div class="looks" style="grid-template-columns:repeat(2,minmax(0,1fr))">${[0,1,2,3].map(k=>{let x=character58(i,k);return `<button aria-pressed="${j===k}" onclick="previewSelection(${i},${k})">${avatarArt(i,k)}<b>${esc(x[0])}${j===k?' ✓':''}</b><br><small>${esc(x[7])}</small></button>`}).join('')}</div><h3>About ${esc(c[0])}</h3><p>${esc(c[2])}</p><p><b>Philosophy:</b> ${esc(c[3])}</p><small>Fictional AI character; career history is invented, not a real credential.</small><button class="wide confirm" onclick="confirmCoachSelection()">SELECT ${esc(c[0])}</button><small>Active: ${esc(character58()[0])}</small></section>`};
const rhythmDefaults=['05:00','10:00','11:00','14:00','17:00','21:00'];const rhythmNames=['Breakfast','Morning snack','Lunch','Afternoon snack','Dinner','Evening snack'];
function rhythm(){return S.rhythm58??={starts:[...rhythmDefaults],work:'17:00',wake:'07:00',review:'21:00',bed:'22:00',commit:{}}}
function minute58(v){return +v.slice(0,2)*60 + +v.slice(3,5)}function now58(){let d=new Date();return d.getHours()*60+d.getMinutes()}function validTime58(v){return typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)}
function current58(){let n=now58(),a=rhythm().starts;return a.reduce((r,x,i)=>n>=minute58(x)?i:r,-1)}function type58(i){return i===0?'Breakfast':i===2?'Lunch':i===4?'Dinner':'Snack'}function state58(i){return day()<today()?'past':day()>today()?'future':i<current58()?'past':i===current58()?'current':'future'}
autoMeal=function(){return type58(current58())};function fmt58(v){let [h,m]=v.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
function saveRhythm58(){let r=rhythm(),a=rhythmNames.map((_,i)=>$('rs'+i).value),w=$('rswork').value,wake=$('rswake').value,review=$('rsreview').value,bed=$('rsbed').value;if(![...a,w,wake,review,bed].every(validTime58)||a.some((x,i)=>i&&x<=a[i-1]))return alert('Enter valid, increasing meal start times.');Object.assign(r,{starts:a,work:w,wake,review,bed});save();render()}
function commit58(){let v=$('trainingTime595').value;if(!validTime58(v))return alert('Choose a time.');rhythm().commit[today()]=v;save();render()}
function rhythmPanel58(){let r=rhythm(),w=schedule()[(new Date().getDay()+6)%7],v=r.commit[today()];return `<section><small>${new Date().toLocaleDateString(undefined,{weekday:'long'})} · <span data-clock58></span></small><h2>${rhythmNames[current58()]||'Early hours'}</h2><p><b>${esc(character58()[0])}</b> · ${esc(message58())}</p>${w==='rest'?'<p>Recovery day</p>':`<label>${v?'Change confirmed training time':'What time are we training today?'}<input id="trainingTime595" type="time" value="${v||r.work}"></label><button class="wide" onclick="saveCommit595()">${v?'Update commitment':'Confirm training time'}</button>`}<details><summary>Daily schedule settings</summary>${rhythmNames.map((n,i)=>`<label>${n}<input id="rs${i}" type="time" value="${r.starts[i]}"></label>`).join('')}${[['work','Preferred workout'],['wake','Wake up'],['review','Evening review'],['bed','Bedtime']].map(([k,n])=>`<label>${n}<input id="rs${k}" type="time" value="${r[k]}"></label>`).join('')}<button class="wide" onclick="saveRhythm58()">Save schedule</button></details><details><summary>Today's timeline</summary>${[...rhythmNames.map((n,i)=>[r.starts[i],n,i===current58()?'Current':i<current58()?'Window passed':'Upcoming']),[r.wake,'Wake up',''],[r.review,'Daily review',''],[r.bed,'Bedtime',''],...(w==='rest'?[]:[[v||r.work,names[w],v?'Confirmed':'Tentative']])].sort((a,b)=>a[0].localeCompare(b[0])).map(([t,n,k])=>`<div class="line"><span>${fmt58(t)} · ${esc(n)}</span><small>${k}</small></div>`).join('')}</details></section>`}
function message58(){let c=character58(),d=today(),r=rhythm(),v=r.commit[d]||r.work,w=schedule()[(new Date().getDay()+6)%7],st=trainingStatus(S,d,exerciseList(w)),a=totals((S.meals[d]||[]).flatMap(m=>m.items)),t=targets(),rec=recoveryAdvice(S.recovery?.[d]),n=now58();if(rec==='stop')return 'Stop painful exercise. Assess symptoms and seek professional advice if significant or persistent.';if(rec==='recover')return 'Your recovery check-in suggests reducing intensity or resting today.';let text=c[4]+'. '+(w==='rest'?'Recovery day.':names[w]+' today.');if(st.kind==='complete')text=c[5]+' '+st.done+' planned sets recorded.';else if(v&&n>minute58(v)+30&&!st.actual)text=c[6]+' Your planned start passed; did you train or need to reschedule?';else if(v&&minute58(v)-n>=0&&minute58(v)-n<=120)text+=' Training is approaching. Consider a meal or snack if you need fuel.';else if(w!=='rest'&&!v)text+=' Confirm your training time.';text+=' '+a[0]+' kcal and '+a[1]+' g protein logged today.';if(n>=660&&!(S.meals[d]||[]).length)text+=' No meals recorded yet. Did you eat?';if(n>=minute58(r.review))text+=' Evening review: '+Math.max(0,t[0]-a[0])+' kcal remaining against your target; eat if hungry.';return text}
accountability=function(date=today()){return date===today()?message58():'Review the recorded activity for '+date+'.'};coachMessage=function(){return [character58()[0],message58()]};
let slot58=null;const oldStart58=foodStart;foodStart=function(m){slot58=day()===today()?current58():null;oldStart58(m)};function retro58(i,m){slot58=i;oldStart58(m)}
const oldLog58=logMeal;logMeal=function(){let date=day(),before=(S.meals[date]||[]).length,edit=foodEdit;oldLog58();let arr=S.meals[date]||[];if(!edit&&arr.length>before){let a=arr[arr.length-1];a.rhythmSlot=slot58??(date===today()?current58():-1);a.time=new Date().toISOString();save();slot58=null;render()}};
const oldAsk58=nutritionAsk;nutritionAsk=function(type=autoMeal(),quick=false){if(day()!==today())return alert('For another date, record actual food instead.');if(type!==autoMeal())return alert('Suggestions are for the current meal window.');oldAsk58(type,quick)};
const oldSmart58=smartLog;smartLog=function(){if(day()!==today()||smartType!==autoMeal())return alert('This suggestion is no longer current. Log actual food instead.');slot58=current58();oldSmart58()};
const oldEat58=plannedEat;plannedEat=function(type){let exists=(S.meals[day()]||[]).some(m=>m.planSlot===day()+'|'+type);if(!exists&&(day()!==today()||type!==autoMeal()))return alert('Record actual food for previous meals; upcoming meals are planning only.');oldEat58(type)};
const oldFood58=foodView;foodView=function(a,t){let html=oldFood58(a,t);if(foodPage!=='Today')return html;let start=html.indexOf('<section><h3>Today\'s meal plan</h3>'),end=html.indexOf('<section><h3>Food log</h3>',start);let panel=`<section><small data-clock58></small><h3>Daily meal schedule</h3>${rhythmNames.map((n,i)=>{let st=state58(i),r=rhythm(),count=(S.meals[day()]||[]).filter(m=>m.rhythmSlot===i).length;return `<details ${st==='current'?'open':''}><summary>${n} · ${fmt58(r.starts[i])} · ${count?count+' logged':st==='past'?'Not recorded':st==='current'?'Current':'Upcoming'}</summary>${st==='future'?'<p>Planning only.</p>':`<div class="nutrition-actions">${[['text','Enter food'],['camera','Snap'],['gallery','Upload']].map(([m,label])=>`<button class="alt" onclick="retro58(${i},'${m}')">${label}</button>`).join('')}</div>${st==='current'?`<button class="wide" onclick="nutritionAsk('${type58(i)}')">Ask ${esc(character58()[0])}</button>`:''}`}</details>`}).join('')}</section>`;return start>=0&&end>start?html.slice(0,start)+panel+html.slice(end):html};
const rhythmRender58=render;render=function(){rhythmRender58();let app=$('app');if(tab==='Home'&&entryMode!=='live'){let old=app.querySelector('.dash-coach');if(old)old.outerHTML=rhythmPanel58();}if(tab==='Coach'){app.insertAdjacentHTML('afterbegin',`<section><h2>${esc(character58()[0])}</h2><p>${esc(character58()[1])} · ${esc(character58()[3])}</p><p>${esc(message58())}</p><small>Fictional coach · local rule-based guidance</small></section>`)}for(let el of app.querySelectorAll('.pill'))if(el.textContent.includes(coachStyles[activeCoach()][0]))el.textContent=el.textContent.replace(coachStyles[activeCoach()][0],character58()[0]);clock58()};
function clock58(){document.querySelectorAll('[data-clock58]').forEach(el=>el.textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}))}setInterval(clock58,15000);
let previousWindow58=current58();setInterval(()=>{let next=current58();if(next!==previousWindow58){if(tab==='Food'&&foodPage==='Today'||tab==='Home'&&entryMode!=='live'){if(!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){smartType='';render();previousWindow58=next}}else previousWindow58=next}},15000);


// v5.9: individual voice profiles, device-native synthesis.
const voiceProfiles582=[
['en-US','m',1.04,.82],['en-JM','m',.98,.88],['en-US','f',.98,.88],['en-US','f',1.09,1.05],
['en-CA','m',.94,.79],['en-JM','m',.96,.87],['en-GB','f',1.02,.92],['en-US','f',.95,.86],
['en-CA','m',1.10,1.02],['en-US','m',1.12,.94],['en-JM','f',1.08,1.06],['en-US','f',1.01,1.02],
['en-US','m',.92,.91],['en-SG','m',.95,1.02],['en-IN','f',.94,1.02],['en-CA','f',.96,.95],
['en-US','m',1.00,.93],['en-CA','m',.99,1.04],['en-US','f',1.03,1.03],['en-CA','f',.97,1.08],
['en-US','m',1.12,1.10],['en-US','m',1.08,1.14],['en-US','f',1.15,1.15],['en-GB','f',1.08,1.12],
['en-NZ','m',.85,.92],['en-US','m',.83,.80],['en-IN','f',.85,1.05],['en-CA','f',.86,1.02]];
function voiceList582(){return window.speechSynthesis?.getVoices()||[]}
function voiceKey582(i,j){return i*4+j}
function voicePick582(i,j){let k=voiceKey582(i,j),p=voiceProfiles582[k],vs=voiceList582(),custom=S.voice582?.[k];if(custom){let v=vs.find(v=>v.voiceURI===custom);if(v)return v}let male=/\b(male|daniel|david|mark|alex|fred|george|guy|ryan|james|aaron|tom|oliver|arthur|liam)\b/i,female=/\b(female|samantha|zira|karen|moira|tessa|susan|sarah|jenny|aria|emma|ava|victoria|sonia|hazel|kate|natasha)\b/i;return vs.filter(v=>/^en(?:-|$)/i.test(v.lang)).map(v=>{let name=v.name,gender=(p[1]==='m'?male:female).test(name),opposite=(p[1]==='m'?female:male).test(name);return {v,score:(gender?70:opposite?-100:0)+(v.lang.toLowerCase()===p[0].toLowerCase()?35:0)+(/natural|neural|enhanced|premium|google/i.test(name)?15:0)+(v.localService?2:0)}}).sort((a,b)=>b.score-a.score)[0]?.v}
let utterance582=null;
function speak582(text,i=activeCoach(),j=avatarChoice(coachPrefs(),i),preview=false){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return alert('Voice coaching is unavailable in this browser.');let p=voiceProfiles582[voiceKey582(i,j)],v=voicePick582(i,j),u=new SpeechSynthesisUtterance(text),serious=/stop painful|assess symptoms|reducing intensity|seek professional/i.test(text),praise=/planned sets recorded/i.test(text);if(v)u.voice=v;u.lang=v?.lang||'en-US';u.rate=Math.max(.75,Math.min(1.2,p[2]*(serious?.88:praise?1.04:1)));u.pitch=Math.max(.65,Math.min(1.3,p[3]+(serious?-.05:praise?.04:0)));u.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))alert('Voice playback unavailable. Try another installed voice in Coach settings.')};speechSynthesis.cancel();utterance582=u;speechSynthesis.speak(u)}
speakCoach=function(){speak582(message58())};
function previewVoice582(){let i=previewCoach??activeCoach(),j=previewLook??avatarChoice(coachPrefs(),i),c=character58(i,j);speak582(c[4]+'. I am '+c[0]+'. '+c[7],i,j,true)}
function setVoice582(k,v){S.voice582??={};if(v)S.voice582[k]=v;else delete S.voice582[k];save()}
function voiceOptions582(){let i=previewCoach??activeCoach(),j=previewLook??avatarChoice(coachPrefs(),i),k=voiceKey582(i,j),vs=voiceList582().filter(v=>/^en(?:-|$)/i.test(v.lang)),chosen=S.voice582?.[k]||'';return `<div class="line"><small>Voice: ${esc(voicePick582(i,j)?.name||'Device default')}</small></div><button class="alt wide" onclick="previewVoice582()">🔊 Hear this coach</button><details><summary>Choose a different voice</summary><select onchange="setVoice582(${k},this.value)"><option value="">Automatic match</option>${vs.map(v=>`<option value="${esc(v.voiceURI)}" ${chosen===v.voiceURI?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><small>Available accents and voice quality depend on your device. Preview after changing.</small></details>`}
const avatar582=avatarPanel;avatarPanel=function(){return avatar582().replace('<h3>About ',voiceOptions582()+'<h3>About ')};
const rhythm582=rhythmPanel58;rhythmPanel58=function(){return rhythm582().replace('</p>','</p><button class="alt wide" onclick="speakCoach()">🔊 Hear your coach</button>')};

// v5.9 Voice Studio: browser voice inventory and explicit assignment.
function studio583(){return S.voiceStudio583??={labels:{},tuning:{}}}
function slot583(){let i=previewCoach??activeCoach(),j=previewLook??avatarChoice(coachPrefs(),i);return [i,j,i*4+j]}
function english583(){return voiceList582().filter(v=>/^en(?:-|$)/i.test(v.lang))}
function known583(v){return studio583().labels[v.voiceURI]||'unknown'}
voicePick582=function(i,j){let k=i*4+j,p=voiceProfiles582[k],vs=english583(),manual=S.voice582?.[k];if(manual)return vs.find(v=>v.voiceURI===manual);return vs.filter(v=>known583(v)===p[1]).sort((a,b)=>Number(b.lang===p[0])-Number(a.lang===p[0]))[0]};
function studioSpeak583(text,v,rate=1,pitch=1){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return alert('Speech is unavailable.');let u=new SpeechSynthesisUtterance(text);if(v)u.voice=v;u.lang=v?.lang||'en-US';u.rate=rate;u.pitch=pitch;u.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))alert('Voice playback failed: '+e.error)};speechSynthesis.cancel();utterance582=u;speechSynthesis.speak(u)}
speak582=function(text,i=activeCoach(),j=avatarChoice(coachPrefs(),i)){let k=i*4+j,p=voiceProfiles582[k],v=voicePick582(i,j),t=studio583().tuning[k]||{},serious=/stop painful|assess symptoms|reducing intensity|seek professional/i.test(text);if(!v)return alert('No verified voice assigned to this coach. Open Coach Voice Studio and preview and label a voice, or choose one explicitly.');studioSpeak583(text,v,Math.max(.65,Math.min(1.4,(t.rate??p[2])*(serious?.88:1))),t.pitch??p[3])};
function studioPreview583(n){let v=english583()[n];if(v)studioSpeak583('Hello! This is my natural voice. Ready to make today count?',v)}
function studioLabel583(n,val){let v=english583()[n];if(v){studio583().labels[v.voiceURI]=val;save();refreshStudio583()}}
function studioAssign583(n){let v=english583()[n],k=slot583()[2];if(v){setVoice582(k,v.voiceURI);refreshStudio583()}}
function studioAuto583(){setVoice582(slot583()[2],'');refreshStudio583()}
function studioTune583(key,val){let k=slot583()[2];(studio583().tuning[k]??={})[key]=Number(val);save()}
function studioReport583(){let vs=english583(),txt='MyFit voice diagnostic\nEnglish voices exposed: '+vs.length+'\n'+vs.map((v,i)=>`${i+1}. ${v.name} | ${v.lang} | ${v.voiceURI} | ${v.localService?'local':'remote'} | ${known583(v)}`).join('\n');let el=document.getElementById('voiceReport583');if(el){el.hidden=false;el.value=txt}}
function studioInner583(){let [i,j,k]=slot583(),vs=english583(),p=voiceProfiles582[k],v=voicePick582(i,j),t=studio583().tuning[k]||{};return `<h3>Voice Studio</h3><p><b>${esc(character58(i,j)[0])}</b> · ${p[1]==='m'?'Male':'Female'} voice preferred · ${p[0]}</p><p>Assigned: ${esc(v?.name||'No verified voice')}</p><small>${vs.length} English voices exposed by this browser. Android may expose only one voice per language even when system settings list more.</small><button class="alt wide" onclick="previewVoice582()">Hear this coach</button><button class="alt wide" onclick="studioAuto583()">Use automatic verified match</button><label>Speed <input type="range" min="0.65" max="1.4" step="0.01" value="${t.rate??p[2]}" onchange="studioTune583('rate',this.value)"></label><label>Pitch <input type="range" min="0.65" max="1.4" step="0.01" value="${t.pitch??p[3]}" onchange="studioTune583('pitch',this.value)"></label><details open><summary>Preview and assign available voices</summary>${vs.map((x,n)=>`<div style="border-bottom:1px solid #7775;padding:10px 0"><b>${n+1}. ${esc(x.name)}</b><br><small>${esc(x.lang)} · ${x.localService?'Local':'Remote'} ${v?.voiceURI===x.voiceURI?'· Assigned':''}</small><button class="alt wide" onclick="studioPreview583(${n})">Preview natural voice</button><select onchange="studioLabel583(${n},this.value)">${[['unknown','Not classified'],['m','Sounds male'],['f','Sounds female']].map(([a,b])=>`<option value="${a}" ${known583(x)===a?'selected':''}>${b}</option>`).join('')}</select><button class="alt wide" onclick="studioAssign583(${n})">Assign to this coach</button></div>`).join('')||'<p>No English voices detected yet. Try refreshing in Chrome.</p>'}</details><button class="alt wide" onclick="refreshStudio583()">Refresh voice list</button><button class="alt wide" onclick="studioReport583()">Show diagnostic report</button><textarea id="voiceReport583" hidden readonly rows="8" style="width:100%"></textarea>`}
function refreshStudio583(){let el=document.getElementById('studio583');if(el)el.innerHTML=studioInner583()}
voiceOptions582=function(){return `<div id="studio583">${studioInner583()}</div>`};
window.speechSynthesis?.addEventListener?.('voiceschanged',refreshStudio583);


// v5.9 usability pass: optional voice fallback and nonblocking status.
function voiceNotice59(msg){let e=document.getElementById('voiceNotice59');if(!e){e=document.createElement('div');e.id='voiceNotice59';e.setAttribute('role','status');e.style.cssText='position:fixed;bottom:85px;left:12px;right:12px;z-index:9999;background:#20352b;color:#fff;padding:12px;border-radius:12px;pointer-events:none';document.body.appendChild(e)}e.textContent=msg;clearTimeout(voiceNotice59.timer);voiceNotice59.timer=setTimeout(()=>e.remove(),4500)}
function allVoices59(){try{return Array.from(window.speechSynthesis?.getVoices()||[])}catch(e){return []}}
english583=function(){return allVoices59().filter(v=>/^en(?:[-_]|$)/i.test(v.lang||''))};
studioSpeak583=function(text,v,rate=1,pitch=1){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return voiceNotice59('Speech is unavailable on this device. You can still read your coach message.');let u=new SpeechSynthesisUtterance(text);if(v){u.voice=v;u.lang=v.lang}else u.lang='en-US';u.rate=rate;u.pitch=pitch;u.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))voiceNotice59('Voice playback unavailable. Your coach message is still on screen.')};try{speechSynthesis.cancel();utterance582=u;speechSynthesis.speak(u)}catch(e){voiceNotice59('Unable to play speech.')}};
speak582=function(text,i=activeCoach(),j=avatarChoice(coachPrefs(),i)){let k=i*4+j,p=voiceProfiles582[k],v=voicePick582(i,j),t=studio583().tuning[k]||{},serious=/stop painful|assess symptoms|reducing intensity|seek professional/i.test(text);if(!v)voiceNotice59('Using device default voice. Individual voice unavailable.');studioSpeak583(text,v,Math.max(.65,Math.min(1.4,(t.rate??p[2])*(serious?.88:1))),t.pitch??p[3])};
studioReport583=function(){let vs=allVoices59(),el=document.getElementById('voiceReport583');if(el){el.hidden=false;el.value='MyFit voice diagnostic\nSpeech API: '+Boolean(window.speechSynthesis)+'\nAll voices: '+vs.length+'\nEnglish voices: '+english583().length+'\n'+vs.map(v=>`${v.name} | ${v.lang} | ${v.voiceURI}`).join('\n')}};
const studioBase59=studioInner583;studioInner583=function(){return studioBase59().replace('No verified voice','Device default (fallback)').replace('No English voices detected yet. Try refreshing in Chrome.','No selectable English voices detected. Basic speech still works using your device default.')};
voiceOptions582=function(){return `<button class="alt" onclick="previewVoice582()">🔊 Hear this coach</button><details><summary>Advanced voice settings</summary><div id="studio583">${studioInner583()}</div></details>`};
// Preserve meal slot for planned meals and avoid stale slot on new draft.
const planned59=plannedEat;plannedEat=function(type){let d=day(),before=(S.meals[d]||[]).length;planned59(type);let a=S.meals[d]||[];if(a.length>before&&d===today()){a[a.length-1].rhythmSlot=current58();save();render()}};

// Keep historical nutrition views from advertising current-day suggestions.
const foodView59=foodView;foodView=function(a,t){let h=foodView59(a,t);if(foodPage==='Today'&&day()!==today())h=h.replace(/<button[^>]*onclick="nutritionAsk\(\)"[^>]*>[^<]*<\/button>/g,'').replace(/<button[^>]*onclick="smartLog\(\)"[^>]*>[^<]*<\/button>/g,'');return h};
function hydrationFood594(){let w=waterToday(),g=waterGoal();return `<section class="hydration594"><h3>Hydration · today</h3><p><b>${(w/1000).toFixed(2)} L</b> / ${g/1000} L</p><progress aria-label="Daily hydration" value="${Math.min(w,g)}" max="${g}" style="width:100%;accent-color:#65bdf5"></progress><div class="grid"><button class="alt" onclick="waterChange(-250)" ${w===0?'disabled':''}>−250 ml</button><button onclick="waterChange(250)">+250 ml</button><button class="alt" onclick="waterChange(500)">+500 ml</button></div><button class="alt" onclick="profileSection598('Goals');$('waterGoal').focus()">Edit water goal</button></section>`}
const food594=foodView;foodView=function(a,t){let h=food594(a,t);if(day()!==today())return h;if(foodPage==='Today')return h.replace('<h2>Your nutrition</h2>','<h2>Your nutrition</h2>'+hydrationFood594());return h};



// v5.9.6.2: compact, state-aware dashboard; retain existing ring and logging handlers.
function dashboard591(){let d=today(),r=rhythm(),w=schedule()[(new Date().getDay()+6)%7],st=trainingStatus(S,d,exerciseList(w)),rec=recoveryAdvice(S.recovery?.[d]),v=r.commit[d]||r.work,n=now58(),i=activeCoach(),c=character58(),j=avatarChoice(coachPrefs(),i),done=st.kind==='complete',rest=w==='rest',late=n>=minute58(r.review),unsafe=rec==='stop'||rec==='recover';let title=unsafe?'Recovery comes first':done?'Training complete':rest?'Recovery day':late?'Evening check-in':st.actual?'Continue today’s training':v?'Training · '+fmt58(v):'Plan today’s training';let action=unsafe?'Review recovery':done?'View workout log':rest||late?'Review today’s records':st.actual?'Resume workout':'Start workout';let call=unsafe?'dashboardRecovery()':done?'openWorkoutLog()':rest||late?"tab='Progress';render()":'dashboardStart()';let commitment=(!done&&!rest&&!unsafe)?`<details ${!v&&!st.actual?'open':''}><summary>${v?'Change today’s training time':'Set training time'}</summary><label>Training time<input id="trainingTime595" type="time" value="${v||r.work}"></label><button class="wide" onclick="saveCommit595()">${v?'Save new time':'Confirm training time'}</button></details>`:'';let original=rhythmPanel58();let tmp=document.createElement('div');tmp.innerHTML=original;let settings=[...tmp.querySelectorAll('details')].map(x=>x.outerHTML).join('');if(done)settings=settings.replace(/>Tentative<|>Confirmed</g,'>Completed<');return `<section class="coach591"><div class="identity591"><img src="${coachPortraits[i][j]}" alt=""><div><small>${new Date().toLocaleDateString(undefined,{weekday:'long'})} · <span data-clock58></span></small><h3>${esc(c[0])}</h3><small>${esc(rhythmNames[current58()]||'Early hours')}</small></div></div><p>${esc(message58())}</p><button class="alt wide" onclick="speakCoach()">🔊 Hear your coach</button></section><section class="next591"><small>NEXT STEP</small><h3>${esc(title)}</h3>${done?`<p>${st.done}/${st.target} planned sets recorded. Time to recover.</p>`:''}${commitment}<button class="wide" onclick="${call}">${action}</button></section><div class="quick591"><button class="alt" onclick="dashboardFoodMenu()"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7a4 4 0 0 0 8 0V2M7 2v20M21 2v20M21 2c-4 3-5 7-5 11h5"/></svg>Log food</button><button class="alt" onclick="tab='Workout';render();window.scrollTo(0,0)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12M1 12h2M21 12h2"/></svg>Workout</button><button class="alt" onclick="dashboardRecovery()"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3 12h5l2-4 3 8 2-4h6"/></svg>Recovery</button><button class="alt" onclick="tab='Planner';render()"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01"/></svg>Planner</button></div><section class="settings591">${settings}</section>`}
const render591=render;render=function(){render591();if(tab!=='Home'||entryMode==='live')return;let dash=$('app').querySelector('.dash');if(!dash)return;let rings=dash.querySelector('.dash-rings');if(!rings)return;let old=[...dash.children];let coach=old.find(e=>e.querySelector('[data-clock58]'));if(!coach)return;let after=false;for(let e of old){if(e===coach)after=true;if(after&&!(e.querySelector('#dashboardRecovery')))e.remove()}let recovery=dash.querySelector('#dashboardRecovery');let recoverySection=recovery?.closest('section');if(recoverySection)recoverySection.insertAdjacentHTML('beforebegin',dashboard591());else dash.insertAdjacentHTML('beforeend',dashboard591());clock58()};


function saveCommit595(){const el=$('trainingTime595');if(!el||!validTime58(el.value)){if(el)el.reportValidity();return;}const r=rhythm(),d=today(),old=r.commit[d],v=el.value;r.commit[d]=v;if(!save()){if(old===undefined)delete r.commit[d];else r.commit[d]=old;return;}render();}
const events595=dailyEvents;dailyEvents=function(date=day()){const r=rhythm(),w=schedule()[(new Date(date+'T12:00:00').getDay()+6)%7],st=trainingStatus(S,date,exerciseList(w)),rec=recoveryAdvice(S.recovery?.[date]);return events595(date).map(e=>({...e,time:e.k==='workout'?(r.commit[date]||r.work):e.k==='morning'?r.wake:e.k==='evening'?r.review:e.time}));};


const orientationOrder = [1,3,2,5,4,0,6];
const secretaryTabs = [
  ['Home','Dashboard','Start a live workout, log food, or add water here. The rings show your progress today.'],
  ['Food','Food','Use Quick log to enter a meal, scan a barcode, or take a photo. Your entries appear in the Food log.'],
  ['Workout','Workout','Start a live workout or log a past one. During a session, tap How to do it for a demo, or Swap exercise for an alternative.'],
  ['Planner','Planner','Meals is for your recipes and groceries. Workouts shows your training and recovery days.'],
  ['Coach','Coach','Read or listen to your daily briefing here. Customize coach lets you choose a different coach or voice.'],
  ['Profile','Profile','Edit your goals, review progress, or update equipment and movement preferences in My Gym. Data and backup is here too.']
];
const secretaryName = 'Maya';
const orientationInstructions = {
  3:'Glad you’re here! Tell me a little about yourself so your coach has a place to start. You can add measurements now or come back to them later.',
  2:'What would you like to work toward? Choose the goal that feels right for you today.',
  5:'Where will you be training? Tell me what equipment you can use and what movements you want to avoid. I’ll pass that on to your coach.',
  4:'Let’s talk food. Choose your dietary preferences, or leave me a note about allergies, budget, or what works for you.',
  0:'Ready to meet the coaches? Pick a style that suits you, then listen to the one you’re considering.',
  6:'Here’s what I’ll pass to your coach. Take a moment to check it, then we’ll get your workout and meal plans ready.'
};
let secretaryTour = null;
let secretaryTimer = null;
let secretaryTurn = 0;

function secretaryCanSpeak() {
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

function speakSecretary(text, ended) {
  if (!secretaryCanSpeak()) return false;
  speechSynthesis.cancel();
  const spoken = new SpeechSynthesisUtterance(text);
  spoken.lang = 'en-CA';
  spoken.rate = 0.92;
  if (ended) spoken.onend = ended;
  speechSynthesis.speak(spoken);
  return true;
}

function cancelSecretaryAudio() {
  clearTimeout(secretaryTimer);
  secretaryTurn++;
  if (secretaryCanSpeak()) speechSynthesis.cancel();
}

function startSecretaryTour(mode, enrollment) {
  cancelSecretaryAudio();
  if (enrollment) setupField596('secretaryMode',mode);
  secretaryTour = {mode,enrollment,index:0,returnTab:tab};
  showSecretaryTab();
}

function showSecretaryTab() {
  cancelSecretaryAudio();
  const tour = secretaryTour;
  if (!tour) return;
  if (!secretaryTabs[tour.index]) return stopSecretaryTour(true);
  const [page,label,instruction] = secretaryTabs[tour.index];
  tab = page;
  render();
  window.scrollTo(0,0);
  const token = secretaryTurn;
  const next = () => {if (token===secretaryTurn && secretaryTour===tour) advanceSecretaryTour()};
  const spoken = tour.mode==='voice' && speakSecretary((tour.index===0?'Hi, I’m '+secretaryName+'. Glad you’re here. First up, the ':'')+label+'. '+instruction,next);
  secretaryTimer = setTimeout(next,spoken ? 25000 : 10000);
}

function advanceSecretaryTour() {
  if (!secretaryTour) return;
  secretaryTour.index++;
  showSecretaryTab();
}

function pauseSecretaryTour() {
  if (!secretaryTour) return;
  if (secretaryTour.paused) {
    secretaryTour.paused=false;
    showSecretaryTab();
    return;
  }
  cancelSecretaryAudio();
  secretaryTour.paused=true;
  renderSecretaryTour();
}

function stopSecretaryTour(complete=false) {
  const tour = secretaryTour;
  if (!tour) return;
  secretaryTour = null;
  cancelSecretaryAudio();
  tab = tour.returnTab;
  if (tour.enrollment) {
    tab='Home';
    if (complete) return setupGo596(3);
    setup596().paused=true;
    save();
  }
  render();
}

function renderSecretaryTour() {
  $('secretaryOverlay')?.remove();
  document.querySelector('main').inert=!!secretaryTour;
  $('nav').inert=!!secretaryTour;
  if (!secretaryTour) return;
  const {index,paused,enrollment} = secretaryTour;
  const [,label,text] = secretaryTabs[index];
  document.body.insertAdjacentHTML('beforeend',`<aside id="secretaryOverlay" role="dialog" aria-modal="true" aria-label="MyFit secretary tour">
    <div class="host-message" aria-live="polite"><span class="host-avatar" aria-hidden="true"></span>
      <div><small>${secretaryName} · ${index+1} of ${secretaryTabs.length}</small>
      <h2>${label}</h2><p>${text}</p></div></div>
    <div class="secretary-buttons"><button onclick="advanceSecretaryTour()">${index+1===secretaryTabs.length?'Finish tour':'Next tab'}</button>
      <button class="alt" onclick="pauseSecretaryTour()">${paused?'Resume tour':'Pause tour'}</button>
      <button class="alt" onclick="stopSecretaryTour()">Stop orientation</button>
      ${enrollment?'<button class="alt" onclick="requestSkipOrientation()">Skip orientation</button>':''}</div>
  </aside>`);
  $('secretaryOverlay').querySelector('button').focus({preventScroll:true});
}

function orientationMove(direction) {
  const current = setup596().step;
  if (direction>0 && !validateOrientationStep(current)) return;
  const next = orientationOrder[orientationOrder.indexOf(current)+direction];
  if (next!==undefined) setupGo596(next);
}

function validateOrientationStep(step) {
  const d = setup596().draft;
  if (step===3 && (!String(d.name||'').trim() || +d.age<18 || +d.age>100 ||
      +d.height<120 || +d.height>230 || +d.weight<80 || +d.weight>600 ||
      ![d.age,d.height,d.weight].every(value=>Number.isFinite(+value)) ||
      [0,1,2,3].some(i=>d['baseline'+i]&&(!Number.isFinite(+d['baseline'+i])||+d['baseline'+i]<=0)))) {
    alert('Check your name, age, height, weight and any starting measurements.');
    return false;
  }
  if (step===5 && (!validTime58(d.time)||![3,4,5].includes(+d.days))) {
    alert('Choose your training days and usual training time.');
    return false;
  }
  if (step===4 && d.budget!==''&&(!Number.isFinite(+d.budget)||+d.budget<0)) {
    alert('Enter a non-negative budget or leave it blank.');
    return false;
  }
  return true;
}

function setupDietFilters(d) {
  return `<h3>Dietary preferences</h3>${[['dairyFree','Dairy-free'],['vegan','Vegan'],['glutenFree','Gluten-free ingredients'],['includePork','Include pork']].map(([key,label])=>
    `<label><input type="checkbox" style="width:auto" ${d[key]?'checked':''} onchange="setupField596('${key}',this.checked)"> ${label}</label>`).join('')}
    <small>Filters screen recipe ingredients. Written allergy and food notes are saved for review.</small>`;
}

function helpPanel() {
  return `<section><h2>MyFit Help</h2>
    <div class="secretary-buttons"><button onclick="startSecretaryTour('voice',false)">Play voice tour</button>
      <button class="alt" onclick="startSecretaryTour('text',false)">Play text tour</button></div>
    ${!setup596().completed?'<button class="alt wide" onclick="setupOpen596()">Resume orientation</button>':''}
    ${secretaryTabs.map(([page,label,text])=>`<details class="daily-disclosure">
      <summary>${label}</summary><p>${text}</p><button class="alt" onclick="openMainTab('${page}')">Open ${label}</button></details>`).join('')}
    <details class="daily-disclosure"><summary>Back up or restore records</summary>
      <p>Export a JSON copy of your records before switching devices.</p>
      <button class="alt" onclick="profileSection598('Data')">Open Data &amp; backup</button>
    </details>
  </section>`;
}

function orientationReadyPanel() {
  const d = setup596().draft;
  const coach = character58();
  return `<section><h2>Your coach is ready</h2><div class="briefing-identity">
    <div class="briefing-portrait">${avatarArt(activeCoach(),avatarChoice(coachPrefs(),activeCoach()))}</div><b>${esc(coach[0])}</b></div>
    <p id="orientationHandoffLine">I’ll use your saved goal, schedule and My Gym setup for your workouts. Your meal plan is in Planner.</p>
    <button class="alt" onclick="speak582($('orientationHandoffLine').textContent)">Hear your coach</button>
    ${d.diet?`<p><b>Food notes:</b> ${esc(d.diet)}</p>`:''}
    <button class="wide" onclick="plannerArea='Workouts';plannerDate=today();openMainTab('Planner')">See workout schedule</button>
    <button class="alt wide" onclick="plannerArea='Meals';plannerTab='Calendar';plannerRange='Week';plannerDate=today();openMainTab('Planner')">See meal plan</button>
    <button class="alt wide" onclick="openMainTab('Home')">Go to Dashboard</button>
  </section>`;
}

function setup596(){return S.setup596??={step:1,draft:{coach:activeCoach()*4+avatarChoice(coachPrefs(),activeCoach()),goal:S.profile.goal,age:S.profile.age,height:S.profile.height,weight:S.profile.weight,sex:S.profile.sex,activity:S.profile.activity,days:S.profile.days,time:rhythm().work,budget:'',equipment:'gym',duration:60,limitations:'',diet:''}}}
function setupField596(k,v){setup596().draft[k]=v;save()}
function setupGo596(n) {
  cancelSecretaryAudio();
  setup596().step=n;
  save();
  render();
  window.scrollTo(0,0);
  if (setup596().draft.secretaryMode==='voice' && orientationInstructions[n]) speakSecretary(orientationInstructions[n]);
}
function setupOpen596(){setup596().showSkipSafety=false;setup596().paused=false;save();tab='Home';render()}
function setupPause596(){cancelSecretaryAudio();setup596().paused=true;save();render()}
function setupFinish596(showHandoff=false){let o=setup596(),d=o.draft;if(o.completed)return;cancelSecretaryAudio();if(!String(d.name||'').trim())return alert('Enter your name in the starting point step.');if([0,1,2,3].some(i=>d['baseline'+i]&&(!Number.isFinite(+d['baseline'+i])||+d['baseline'+i]<=0)))return alert('Enter positive measurements.');if(!validTime58(d.time)||!goals[d.goal]||![3,4,5].includes(+d.days))return alert('Review your training settings.');if(![d.age,d.height,d.weight].every(x=>x!==''&&Number.isFinite(+x))||+d.age<18||+d.age>100||+d.height<120||+d.height>230||+d.weight<80||+d.weight>600)return alert('Review your physical assessment.');if(d.budget!==''&&(!Number.isFinite(+d.budget)||+d.budget<0))return alert('Review your budget.');let old=JSON.stringify(S);Object.assign(S.profile,{goal:d.goal,age:+d.age,height:+d.height,weight:+d.weight,sex:d.sex,activity:+d.activity,days:+d.days});let i=Math.floor(+d.coach/4),j=+d.coach%4;Object.assign(coachPrefs(),{style:i,auto:false,intensity:coachStyles[i][2]});(coachPrefs().avatars??={})[i]=j;rhythm().work=d.time;S.profile.name=String(d.name).trim();S.profile.startingProfile={age:+d.age,height:+d.height,weight:+d.weight};S.profile.trainingEquipment=normalizeGym(d.equipment,d.trainingGear,d.movementRestrictions,d.limitations);logGymChange(S.profile.trainingEquipment);S.profile.baseline597={date:today(),v:[String(d.weight),...[0,1,2,3].map(i=>String(d['baseline'+i]||''))]};S.measure.push(S.profile.baseline597);
  S.prep={...prefs(),...Object.fromEntries(['dairyFree','vegan','glutenFree','includePork'].filter(key=>d[key]!==undefined).map(key=>[key,d[key]===true]))};
  if (d.budget!=='') S.prep.budget=+d.budget;
  S.profile.dietaryNotes=String(d.diet||'').slice(0,800);
  const dates=plannerPeriod(today(),'Week');
  if (!S.weekPlans?.[dates[0]]) {
    const theme='Mixed cuisines';
    (S.weekPlans??={})[dates[0]]={theme,slots:buildThemedWeekSlots(dates,theme)};
  }
  o.completed=true;o.skipped=false;o.paused=false;o.approved=today();if(!save()){S=JSON.parse(old);return}tab=showHandoff?'SetupReady':'Home';render()}
function setupHTML596(){let o=setup596();if(o.showSkipSafety)return skipOrientationPanel();let d=o.draft,n=o.step,i=Math.floor(+d.coach/4),j=+d.coach%4,c=character58(i,j);let field=(k,label,type='text',attrs='')=>`<label>${label}<input type="${type}" ${attrs} value="${esc(String(d[k]??''))}" oninput="setupField596('${k}',this.value)"></label>`,sel=(k,label,opts)=>`<label>${label}<select onchange="setupField596('${k}',this.value)">${opts.map(([v,l])=>`<option value="${esc(String(v))}" ${String(d[k])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;let body=[()=>roster597(d),()=>tourHTML597(),()=>sel('goal','What are we working toward?',Object.entries(goals)),()=>field('name','Your name')+field('age','Age','number','min="18" max="100"')+field('height','Height (cm)','number')+field('weight','Weight (lb)','number')+sel('sex','Sex used for calorie estimate',[['male','Male'],['female','Female']])+sel('activity','Activity level',[[1.2,'Sedentary'],[1.375,'Light'],[1.5,'Moderate'],[1.725,'Very active']])+['Waist','Chest','Thigh','Arm'].map((x,i)=>field('baseline'+i,x+' (in, optional)','number','min="0" step="0.1"')).join(''),()=>field('budget','Weekly grocery budget (optional)','number','min="0"')+setupDietFilters(d)+field('diet','Allergies and food notes (optional)','text','maxlength="800"'),()=>sel('days','Training days per week',[[3,'3 days'],[4,'4 days'],[5,'5 days']])+field('time','Usual training time','time')+gymSettingsFields(normalizeGym(d.equipment,d.trainingGear,d.movementRestrictions,d.limitations),true)+field('duration','Session duration (minutes)','number','min="10" max="180"'),()=>review597(d)][n]();const title=['Meet your coach','Welcome to MyFit','Your goals','Create your profile','Dietary preferences','Set up My Gym','Meet your program'][n];
  const step = orientationOrder.indexOf(n)+1;
  return `<section class="orientation-shell">
    <div class="orientation-meta"><small>Step ${step} of ${orientationOrder.length}</small>
      <div class="orientation-meta"><button class="alt" onclick="setupPause596()">Stop orientation</button>
      <button class="alt" onclick="requestSkipOrientation()">Skip orientation</button></div>
    </div>
    <progress class="orientation-progress" aria-label="Orientation progress" value="${step}" max="${orientationOrder.length}"></progress>
    ${n===1?'':`<h2>${title}</h2>
      <div class="host-message"><span class="host-avatar" aria-hidden="true"></span><div><b>${secretaryName} · Front desk</b><p>${orientationInstructions[n]}</p></div></div>
      <button class="alt" onclick="speakSecretary(orientationInstructions[${n}])">Hear ${secretaryName}</button>`}
    ${[0,6].includes(n)?`<div class="briefing-identity"><div class="briefing-portrait">${avatarArt(i,j)}</div><b>${esc(c[0])}</b></div>`:''}
    ${body}
    <div class="secretary-buttons">
      ${n===1?'<button class="alt" onclick="setupField596(\'secretaryMode\',\'text\');orientationMove(1)">Skip tour and set up</button>':
      `<button onclick="${n===6?'setupFinish596(true)':'orientationMove(1)'}">${n===6?'Save my program':'Continue'}</button>
      <button class="alt" onclick="orientationMove(-1)">Back</button>`}
    </div></section>`;
}
function routine596() {
  const r = rhythm();
  return `<section><details><summary>Training time settings</summary>
    <p>Usual time: ${fmt58(r.work)}</p>
    ${r.commit[today()]?`<p>Today’s override: ${fmt58(r.commit[today()])}</p>`:''}
    <label>Training time<input id="routineTime596" type="time" value="${r.commit[today()]||r.work}"></label>
    <button class="wide" onclick="routineSave596(false)">Change today only</button>
    <button class="alt wide" onclick="routineSave596(true)">Change usual training time</button>
  </details></section>`;
}
function routineSave596(all){let v=$('routineTime596').value;if(!validTime58(v))return;let r=rhythm();if(all){r.work=v;delete r.commit[today()]}else r.commit[today()]=v;if(save())render()}
const prior596=render;render=function(){prior596();let o=setup596(),app=$('app');if(!secretaryTour&&tab==='Home'&&entryMode!=='live'&&!o.completed&&!o.paused){app.innerHTML=setupHTML596();return}if(!secretaryTour&&tab==='Home'&&entryMode!=='live'&&!o.completed)app.insertAdjacentHTML('afterbegin',o.skipped?
 '<section><p>Complete your profile to personalize the default targets and workouts.</p><button class="alt wide" onclick="setupOpen596()">Complete profile setup</button></section>':
 '<section><button class="wide" onclick="setupOpen596()">Resume orientation</button></section>');if(tab==='Coach'&&o.completed)app.insertAdjacentHTML('afterbegin','<section><small>Program active · Your coach can change without resetting your routine.</small></section>')};


function roster597(d) {
  const style = Math.floor(+d.coach/4);
  const look = +d.coach%4;
  return `<label>Coaching style<select onchange="setupField596('coach',+this.value*4);render()">
    ${coachStyles.map(([label],i)=>`<option value="${i}" ${i===style?'selected':''}>${esc(label)}</option>`).join('')}
  </select></label>
  <div class="grid">${[0,1,2,3].map(j=>{
    const coach = character58(style,j);
    return `<button class="alt" aria-pressed="${j===look}" onclick="setupField596('coach',${style*4+j});render()">
      ${avatarArt(style,j)}<b>${esc(coach[0])}</b><br><small>${esc(coach[3])}</small>
    </button>`;
  }).join('')}</div>
  <button class="alt" onclick="speak582(character58(${style},${look})[4],${style},${look},true)">Hear selected coach</button>`;
}
const lessons597={Home:'The three rings compare recorded calories, planned training sets and water with daily targets. Tap a ring for details. An empty ring means nothing has been logged, not that you failed.',Workout:'Record actual load, reps and sets. Comparing similar sessions helps us judge strength progress without guessing. Rest between sets and stop painful movements.',Food:'Calories estimate energy intake; protein supports muscle repair, carbohydrates fuel activity and fats support normal body functions. Photo estimates are approximate; check portions and ingredients.',Planner:'Use the calendar to see planned meals and activities. Your usual training time stays in place unless you change it.',Progress:'Weight trends help assess energy balance; waist, chest, thigh and arm measurements show changes in size. They cannot directly measure muscle or fat. Use consistent conditions and look at trends rather than single readings. Saved workout logs show actual performance.'};
function tourHTML597() {
  return `<div class="lobby-scene">
    <div class="lobby-photo" role="img" aria-label="Maya waves from the MyFit front desk"></div>
    <div class="lobby-door left" aria-hidden="true"></div><div class="lobby-door right" aria-hidden="true"></div>
    <div class="lobby-welcome"><small>MyFit front desk</small><h2>Welcome to MyFit</h2></div>
  </div>
  <div class="host-message"><span class="host-avatar" aria-hidden="true"></span><div><b>${secretaryName} · Your MyFit secretary</b>
    <p>Hi, I’m ${secretaryName}. Glad you’re here! I can show you around, help you get set up, and introduce you to your coach.</p></div></div>
  <div class="lobby-actions"><button onclick="startSecretaryTour('voice',true)">Start voice tour</button>
    <button class="alt" onclick="startSecretaryTour('text',true)">Start text tour</button></div>`;
}

function review597(d) {
  return `<h3>Your setup</h3>
    <p>${esc(goals[d.goal])} · ${esc(d.days)} training days per week · ${esc(fmt58(d.time))}</p>
    ${gymSummary(normalizeGym(d.equipment,d.trainingGear,d.movementRestrictions,d.limitations))}
    ${d.diet?`<p><b>Food notes:</b> ${esc(d.diet)}</p>`:''}
    <p>Your coach will use this setup for exercise recommendations. MyFit will generate a starter week using your dietary filters if you don’t have a plan for this week yet.</p>`;
}
let edit597=false;
function profileEdit597(){edit597=true;render()}
function profileName597(){let v=$('profileName597').value.trim();if(!v)return alert('Enter your name.');if(saveProfile({...S.profile,name:v})){edit597=false;render()}}
const render597=render;render=function(){render597();let o=setup596(),app=$('app');let nav=$('nav');if(nav&&!nav.querySelector('[data-profile597]'))nav.insertAdjacentHTML('beforeend',`<button data-profile597 class="${tab==='Profile'?'active':''}" onclick="edit597=false;tab='Profile';render()"><span>♙</span>Profile</button>`);if(!o.completed&&o.paused&&o.step===1&&lessons597[tab])app.insertAdjacentHTML('afterbegin',`<section><h3>Your coach explains</h3><p>${lessons597[tab]}</p><button class="wide" onclick="setupOpen596()">Return to orientation</button></section>`);if(tab==='Goals')app.innerHTML=`<section><h2>Your goals</h2><p>${esc(goals[S.profile.goal])}</p><button class="alt wide" onclick="tab='Profile';edit597=true;render()">Review or edit profile & program</button></section>`;if(tab==='Profile'){if(!edit597){let p=S.profile,b=p.baseline597;app.innerHTML=`<section><h2>My profile</h2><h3>${esc(p.name||'Your profile')}</h3><p>${!o.completed&&!p.name?'Profile setup is incomplete. Default settings are in use.':`Height: ${p.height} cm · Profile weight: ${p.weight} lb`}</p><p>Goal: ${esc(goals[p.goal])}</p><h3>Starting measurements</h3>${b?b.v.map((v,i)=>v?`<p>${['Weight (lb)','Waist (in)','Chest (in)','Thigh (in)','Arm (in)'][i]}: ${esc(v)}</p>`:'').join(''):'<p>No onboarding baseline recorded.</p>'}<button class="wide" onclick="profileEdit597()">Edit profile & program</button><button class="alt wide" onclick="tab='Progress';render()">View progress journal</button></section>`}else app.insertAdjacentHTML('afterbegin',`<section><label>Name<input id="profileName597" value="${esc(S.profile.name||'')}"></label><button class="alt wide" onclick="profileName597()">Save name</button><button class="alt wide" onclick="edit597=false;render()">Close editor</button></section>`)}if(tab==='Progress')app.insertAdjacentHTML('afterbegin',`<section><h3>Understanding your progress</h3><p>${lessons597.Progress}</p><small>New journal entries do not overwrite your starting measurements or profile weight.</small></section>`)};

function profileSection598(t){edit597=false;if(t==='Progress')$('date').value=today();tab=t;render()}

function strengthSets(row) {
  const sets = row.a.length ? row.a : +row.r.sets > 0
    ? [{load: +row.r.weight, reps: +row.r.reps}]
    : [];
  return sets.filter(set => set.load > 0 && set.reps > 0);
}

function strengthProgress(history) {
  const exercises = new Map();
  for (const row of history) {
    const sets = strengthSets(row);
    if (!sets.length) continue;
    if (!exercises.has(row.name)) exercises.set(row.name, []);
    exercises.get(row.name).push({...row, sets});
  }
  return [...exercises].map(([name, [latest, ...earlier]]) => {
    const current = latest.sets.reduce((best, set) => set.load > best.load ? set : best);
    const previous = earlier.find(row =>
      row.date < latest.date && row.sets.some(set => set.reps === current.reps));
    const previousLoad = previous && Math.max(...previous.sets
      .filter(set => set.reps === current.reps).map(set => set.load));
    return {name, date: latest.date, current, previous, previousLoad};
  });
}

function strengthProgressPanel() {
  const rows = strengthProgress(workoutHistory(S));
  return `<section id="strengthProgress"><h3>Strength progression</h3>
    <p class="muted">Your heaviest set from the latest session is compared with the most recent earlier session with the same reps.</p>
    ${rows.map(({name, date, current, previous, previousLoad}) => {
      const change = previous ? Math.round((current.load - previousLoad) * 100) / 100 : 0;
      const comparison = previous
        ? `Previous: ${previousLoad} lb (${esc(previous.date)}) · ${change > 0 ? '+' : ''}${change} lb`
        : 'No earlier set with matching reps.';
      return `<div class="line"><div><b>${esc(name)}</b><br>
        <small>${current.load} lb × ${current.reps} reps · ${esc(date)}<br>${comparison}</small></div></div>`;
    }).join('') || '<p>Log a set with weight and reps to start tracking strength.</p>'}
  </section>`;
}

function profileGoalsPanel() {
  const plan = schedule();
  const liftingDays = plan.filter(session => session !== 'rest' && session !== 'mobility').length;
  return `<section><h3>Weekly training</h3>
    <p>${liftingDays} lifting days · ${plan.filter(session => session === 'mobility').length} mobility days</p>
    <button class="alt wide" onclick="openWorkoutSchedule()">View workout schedule</button>
  </section><section><h3>Daily hydration goal</h3>
    <label>Target (ml)<input id="waterGoal" type="number" min="250" max="10000" step="1" value="${waterGoal()}"></label>
    <button class="wide" onclick="waterTarget()">Save hydration goal</button>
  </section>`;
}

const render598=render;render=function(){render598();let nav=$('nav'),app=$('app');if(nav){for(let b of [...nav.querySelectorAll('button')]){let text=b.textContent.trim();if(/Goals$|Progress$/.test(text))b.remove();else if(/Profile$/.test(text)){b.classList.toggle('active',['Profile','Goals','Progress','Data','Gym','Review','Help','Profiles'].includes(tab));}}}if(!['Profile','Goals','Progress','Data','Gym','Review','Help','Profiles'].includes(tab))return;let sub=`<section style="padding:10px"><h2>My fitness profile</h2><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">${[['Profile','Overview'],['Goals','Goals'],['Progress','Progression'],['Gym','My Gym'],['Data','Data &amp; backup'],['Help','Help'],['Profiles','Switch profile']].map(([t,n])=>`<button class="${tab===t?'':'alt'}" aria-pressed="${tab===t}" style="padding:9px 3px" onclick="profileSection598('${t}')">${n}</button>`).join('')}</div></section>`;app.insertAdjacentHTML('afterbegin',sub);if(tab==='Progress')$('workoutHistory').insertAdjacentHTML('beforebegin',strengthProgressPanel());if(tab==='Goals'){let t=targets();app.insertAdjacentHTML('beforeend',`<section><h3>Daily nutrition goals</h3><div class="line"><span>Calories</span><b>${t[0]} kcal</b></div>${['Protein','Carbohydrates','Fat'].map((n,i)=>`<div class="line"><span>${n}</span><b>${t[i+1]} g</b></div>`).join('')}<p class="muted">Targets are estimated from your profile and primary goal.</p></section>`+profileGoalsPanel())} };
let coachCustomizeOpen = false;

function dataBackupPanel() {
  return `<section><h2>Data &amp; backup</h2>
    <p>Export a copy of the current profile’s food, workout, and settings.</p>
    <button onclick="backup()">Export JSON</button>
    <label>Restore backup<input type="file" accept=".json" onchange="restore(this)"></label>
  </section>`;
}

function placeDailyControls() {
  const app = $('app');
  if (tab === 'Home' && entryMode !== 'live') {
    const quick = app.querySelector('.quick591');
    const coach = app.querySelector('.coach591');
    const next = app.querySelector('.next591');
    if (quick && coach && next) {
      quick.insertAdjacentHTML('beforeend','<button class="alt" onclick="waterChange(250)">Add water · 250 ml</button>');
      const workout = [...quick.querySelectorAll('button')].find(button => button.textContent.trim() === 'Workout');
      const action = next.querySelector('button[onclick="dashboardStart()"]');
      if (workout) {
        workout.textContent = 'Live Workout';
        workout.setAttribute('onclick','dashboardStart()');
        if (action) action.remove();
      }
      coach.before(quick,next);
      quick.parentElement.append(coach);
    }
  }
  if (tab === 'Food' && foodPage === 'Today') {
    const hub = app.querySelector('.nutrition-hub');
    const heading = [...hub.querySelectorAll('h3')].find(el => el.textContent === 'Quick log');
    const log = [...hub.querySelectorAll('h3')].find(el => el.textContent === 'Food log')?.closest('section');
    const schedule = [...hub.querySelectorAll('h3')].find(el => el.textContent === 'Daily meal schedule')?.closest('section');
    if (heading && log && heading.nextElementSibling) {
      const actions = heading.nextElementSibling;
      const firstSection = hub.querySelector('section');
      firstSection.before(heading,actions,log);
    }
    if (schedule) {
      const details = document.createElement('details');
      details.className = 'daily-disclosure';
      details.innerHTML = '<summary>Daily meal schedule</summary>';
      schedule.before(details);
      schedule.querySelector('h3')?.remove();
      details.append(schedule);
    }
  }
}

function arrangeCoach() {
  const app = $('app');
  const briefing = [...app.querySelectorAll('h3')].find(el => el.textContent.startsWith('Daily briefing'));
  const appearance = $('coachAppearance');
  if (!briefing || !appearance) return;
  const briefingSection = briefing.closest('section');
  const coach = activeCoach();
  const look = avatarChoice(coachPrefs(),coach);
  const identity = document.createElement('div');
  identity.className = 'briefing-identity';
  identity.innerHTML = `<div class="briefing-portrait">${avatarArt(coach,look)}</div><b>${esc(character58(coach,look)[0])}</b>`;
  const playback = briefingSection.querySelector('[onclick="speakCoach()"]') || document.createElement('button');
  playback.type = 'button';
  playback.className = 'alt';
  playback.textContent = 'Hear your coach';
  playback.onclick = () => speakCoach();
  identity.append(playback);
  briefingSection.prepend(identity);
  briefingSection.prepend(briefing);
  app.prepend(briefingSection);
  const customize = document.createElement('details');
  customize.className = 'daily-disclosure';
  customize.id = 'coachCustomize';
  customize.open = coachCustomizeOpen;
  customize.innerHTML = '<summary>Customize coach</summary>';
  customize.addEventListener('toggle',() => {if (customize.isConnected) coachCustomizeOpen = customize.open;});
  const style = $('coachStyleSettings');
  customize.append(appearance);
  if (style) customize.append(style);
  briefingSection.after(customize);
}

const progressDisclosures = new Map();
function groupProgress() {
  const app = $('app');
  const groups = [
    ['Strength trends',[$('strengthProgress'),$('exerciseProgress')]],
    ['Workout history',[$('workoutHistory')]],
    ['Body measurements',[$('bodyMeasurementEntry'),$('bodyMeasurementTrends')]]
  ];
  groups.forEach(([label,panels],index) => {
    const group = document.createElement('details');
    group.className = 'daily-disclosure';
    group.dataset.progressGroup = label;
    group.open = progressDisclosures.get(label) ?? (index===0);
    group.innerHTML = `<summary>${label}</summary>`;
    app.append(group);
    group.append(...panels.filter(Boolean));
  });
  app.insertAdjacentHTML('beforeend','<button class="alt wide" onclick="profileSection598(\'Data\');window.scrollTo(0,0)">Data &amp; backup</button>');
}

const functionalLayoutRender = render;
render = function() {
  for (const detail of $('app').querySelectorAll('[data-progress-group]')) {
    progressDisclosures.set(detail.dataset.progressGroup,detail.open);
  }
  const currentCustomize = $('coachCustomize');
  if (currentCustomize) coachCustomizeOpen = currentCustomize.open;
  functionalLayoutRender();
  $('recordDate').hidden = !['Food','Workout','Progress'].includes(tab);
  $('date').max = today();
  let current;
  try {current=readProfileDirectory().profiles.find(record=>record.id===activeProfileId)} catch (_) {}
  $('activeProfileButton').textContent=current?profileDisplayName(current):'Switch profile';
  if (tab === 'Coach') arrangeCoach();
  if (tab === 'Progress') groupProgress();
  if (tab === 'Profiles') $('app').insertAdjacentHTML('beforeend',userProfilesPanel());
  if (tab === 'Help') $('app').insertAdjacentHTML('beforeend',helpPanel());
  if (tab === 'SetupReady') $('app').innerHTML=orientationReadyPanel();
  if (tab === 'WorkoutRecap') $('app').innerHTML=workoutRecapPanel();
  if (tab === 'Data') $('app').insertAdjacentHTML('beforeend',dataBackupPanel());
  if (tab === 'Gym') $('app').insertAdjacentHTML('beforeend',myGymPanel());
  if (tab === 'Review') $('app').insertAdjacentHTML('beforeend',programReviewPanel());
  if (['Profile','Goals','Coach'].includes(tab)) {
    const first = $('app').firstElementChild;
    if (first) first.insertAdjacentHTML('afterend',programReviewPrompt());
  }
  if (tab==='Profile'&&!edit597&&setup596().completed) {
    const start=startingProfile();
    $('app').insertAdjacentHTML('beforeend',`<section><h3>Starting profile</h3><p>Age ${esc(start.age)} · ${esc(start.height)} cm · ${esc(start.weight)} lb</p></section>`);
  }
  placeDailyControls();
  renderSecretaryTour();
};
render();let lastDay=today(),lastMeal=autoMeal();setInterval(()=>{let now=today(),mt=autoMeal();if(now!==lastDay){if(day()===lastDay){$('date').value=now;calendarOffset=0;if(tab!=='Food'&&tab!=='Goals')render()}lastDay=now}if(mt!==lastMeal){lastMeal=mt;if(tab==='Planner'&&mealType==='Auto')render()}},30000);