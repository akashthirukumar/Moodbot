/* engine.js
   Client-side rule-based engine and DOM wiring for MoodBot
   Lightweight, offline-first. Reads palette.json and falls back to internal palette.
*/

(async function(){
  // DOM refs
  const steps = Array.from(document.querySelectorAll('.step'));
  const stepNumberEl = document.getElementById('stepNumber');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const generateBtn = document.getElementById('generateBtn');
  const resultsSection = document.getElementById('results');
  const palettePreview = document.getElementById('palettePreview');
  const explanation = document.getElementById('explanation');
  const estimates = document.getElementById('estimates');
  const exportJson = document.getElementById('exportJson');
  const restart = document.getElementById('restart');
  const wizardForm = document.getElementById('wizardForm');

  let currentStep = 1;
  const totalSteps = steps.length;

  function showStep(n){
    steps.forEach(s => s.hidden = s.dataset.step !== String(n));
    stepNumberEl.textContent = String(n);
    backBtn.style.display = n === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = n === totalSteps ? 'none' : 'inline-block';
  }
  showStep(currentStep);

  backBtn.addEventListener('click', ()=> {
    currentStep = Math.max(1, currentStep-1);
    showStep(currentStep);
  });
  nextBtn.addEventListener('click', ()=> {
    currentStep = Math.min(totalSteps, currentStep+1);
    showStep(currentStep);
  });

  // Load palette.json with fallback
  let palette = [];
  try {
    const r = await fetch('palette.json', {cache: "no-store"});
    if(r.ok) palette = await r.json();
  } catch(e){ /* ignore */ }

  // fallback palette embedded (subset)
  if(!palette || !palette.length){
    palette = [
      {"id":"POW-01","name":"Porcelain White","hex":"#F5F7FA","lrv":92,"undertone":"neutral","family":"white"},
      {"id":"SAND-02","name":"Warm Sand","hex":"#E8D8C3","lrv":78,"undertone":"warm","family":"beige"},
      {"id":"MOSS-03","name":"Soft Moss","hex":"#B5C9A1","lrv":52,"undertone":"cool","family":"green"},
      {"id":"COVE-04","name":"Ocean Cove","hex":"#3E8DA8","lrv":28,"undertone":"cool","family":"blue"},
      {"id":"TERR-05","name":"Terracotta","hex":"#B55A3A","lrv":22,"undertone":"warm","family":"terracotta"},
      {"id":"SMOKE-06","name":"Smoky Grey","hex":"#9AA3AB","lrv":58,"undertone":"neutral","family":"grey"},
      {"id":"INK-07","name":"Midnight Ink","hex":"#1B2630","lrv":6,"undertone":"cool","family":"black"},
      {"id":"BLUSH-08","name":"Muted Blush","hex":"#D9BFC1","lrv":72,"undertone":"warm","family":"pink"},
      {"id":"SUN-09","name":"Golden Sun","hex":"#EFAF4B","lrv":48,"undertone":"warm","family":"yellow"},
      {"id":"TEAL-10","name":"Quiet Teal","hex":"#4E9A93","lrv":34,"undertone":"cool","family":"teal"}
    ];
  }

  // Utility: hex to HSL and luminance approximations
  function hexToRgb(hex){
    hex = hex.replace('#','');
    if(hex.length===3) hex = hex.split('').map(h=>h+h).join('');
    const num = parseInt(hex,16);
    return {r:(num>>16)&255, g:(num>>8)&255, b:num&255};
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){
      const d = max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h/=6;
    }
    return {h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100)};
  }
  function perceivedLuma(r,g,b){
    // relative luminance approximated
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }
  // augment palette objects with HSL & luma if missing
  palette = palette.map(p=>{
    const rgb = hexToRgb(p.hex);
    p._hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    p._luma = perceivedLuma(rgb.r, rgb.g, rgb.b) / 255 * 100; // scale 0-100
    // If lrv not provided, approximate from luma
    if(typeof p.lrv !== 'number') p.lrv = Math.round(p._luma);
    return p;
  });

  // Engine core
  function computeRoomAreas({width,length,ceilingHeight}){
    width = Number(width); length = Number(length); ceilingHeight = Number(ceilingHeight);
    const floorArea = width * length;
    const wallArea = 2*(width + length) * ceilingHeight;
    const ceilingArea = floorArea;
    return {floorArea, wallArea, ceilingArea, roomArea: floorArea};
  }

  function personalityProfile(values){
    // values: trait1..trait4 as E/I, S/N, T/F, J/P
    return `${values.trait1}${values.trait2}${values.trait3}${values.trait4}`;
  }

  function analyzeLight(daylight, daylightTone, artificialTone){
    // map to target LRV (higher = brighter)
    let targetLrv;
    if(daylight === 'strong') targetLrv = 45; // can accept deeper
    else if(daylight === 'medium') targetLrv = 55;
    else targetLrv = 70; // weak daylight -> brighter bases

    // undertone preference shift
    const undertoneBoost = {warm: 0.8, neutral: 1, cool: 1.2}[daylightTone] || 1;
    return {targetLrv, undertoneBoost, artificialTone};
  }

  function objectiveFilter(objective){
    // simple mapping to preference
    return {
      bigger: {baseLrvShift: 12, ceilingLight: true},
      cozier: {baseLrvShift: -10, warmBias: true},
      brighter: {baseLrvShift: 18},
      softer: {desaturate:true, baseLrvShift: 6}
    }[objective] || {};
  }

  function scoreShades(inputs){
    // inputs: form data object
    const {roomProps, persona, light, objective, household} = inputs;
    const {targetLrv, undertoneBoost} = light;
    const obj = objectiveFilter(objective);

    // personality influence factors
    const personality = persona;
    const accentFreedom = (personality.includes('E') || personality.includes('N')) ? 1.2 : 0.8;
    const neutralBias = (personality.includes('I') || personality.includes('S')) ? 1.2 : 0.9;

    // scores
    const scores = palette.map(shade=>{
      let score = 0;

      // 1) environmental fit: closeness to target LRV
      const lrvDiff = Math.abs(shade.lrv - (targetLrv + (obj.baseLrvShift||0)));
      score += Math.max(0, 40 - lrvDiff); // up to 40 points

      // 2) undertone match (warm/cool)
      if(obj.warmBias && shade.undertone === 'warm') score += 6;
      if(shade.undertone === 'cool' && light.undertoneBoost>1.1) score += 4;

      // 3) personality fit: accent freedom increases accent candidates rather than base
      if(neutralBias && shade.family === 'grey' || neutralBias && shade.family === 'white' || neutralBias && shade.family === 'beige') score += 6 * neutralBias;
      if(accentFreedom>1 && (['blue','teal','terracotta','green','pink','yellow'].includes(shade.family))) score += 4 * accentFreedom;

      // 4) household practicals
      if(household.kids === 'yes' && shade.lrv > 90) score -= 12; // avoid ultra pale for kids
      if(household.pets === 'yes' && shade.family === 'white') score -= 8;
      if(household.flooring === 'warm' && shade.undertone === 'warm') score += 4;
      if(household.preferredAccent && shade.family === household.preferredAccent.toLowerCase()) score += 10;

      // small boost for common neutrals
      if(['white','grey','beige'].includes(shade.family)) score += 2;

      // clamp and attach
      shade._score = Math.round(score);
      return shade;
    });

    return scores.sort((a,b)=>b._score - a._score);
  }

  function assemblePalette(sortedShades, persona){
    // pick base: the highest scored neutral-like shade (give priority)
    const baseCandidates = sortedShades.filter(s => ['white','grey','beige'].includes(s.family) || s.lrv > 45);
    const base = baseCandidates[0] || sortedShades[0];

    // pick accent: pick something with contrast in lightness and hue
    const accentCandidates = sortedShades.filter(s => s.id !== base.id);
    accentCandidates.sort((a,b)=>{
      // prefer hue contrast * personality freedom
      const contrastA = Math.abs(a._hsl.l - base._hsl.l) + (a.family !== base.family ? 12 : 0);
      const contrastB = Math.abs(b._hsl.l - base._hsl.l) + (b.family !== base.family ? 12 : 0);
      return contrastB - contrastA;
    });
    const accent = accentCandidates[0];

    // pick trim/ceiling: either very light or clean neutral to balance
    const trimCandidates = sortedShades.filter(s => s.id !== base.id && s.id !== accent.id);
    trimCandidates.sort((a,b) => Math.abs(a.lrv - 92) - Math.abs(b.lrv - 92)); // prefer closer to white-ish
    const trim = trimCandidates[0];

    return {base, accent, trim};
  }

  function estimateLitres(roomProps, coats=2, coverage=120){
    const {width, length, ceilingHeight} = roomProps;
    const areas = computeRoomAreas({width,length,ceilingHeight});
    // We'll estimate paint for walls + ceiling (if trim chosen to paint ceiling), walls mostly
    const wallLitres = Math.ceil(((areas.wallArea * coats) / coverage) * 10) / 10;
    const ceilingLitres = Math.ceil(((areas.ceilingArea * (coats>0?1:0)) / coverage) * 10) / 10;
    return {wallLitres, ceilingLitres, totalLitres: Math.ceil((wallLitres + ceilingLitres));
  }

  function explainChoice(palette, inputs){
    const lines = [];
    lines.push(`Base (${palette.base.name} — ${palette.base.hex}): chosen for balanced LRV (${palette.base.lrv}) relative to room light and objective.`);
    lines.push(`Accent (${palette.accent.name} — ${palette.accent.hex}): chosen to provide contrast and personality-forward colour (family: ${palette.accent.family}).`);
    lines.push(`Trim/Ceiling (${palette.trim.name} — ${palette.trim.hex}): chosen to balance perceived height and crisp edges.`);
    if(inputs.household.kids === 'yes') lines.push('Adjusted for kids: avoiding ultra-faint whites for durability.');
    if(inputs.household.pets === 'yes') lines.push('Adjusted for pets: avoiding high-showing fur colours.');
    if(inputs.household.preferredAccent) lines.push(`Preferred accent (${inputs.household.preferredAccent}) was considered.`);
    return lines.join(' ');
  }

  // Rendering helpers
  function renderResults(paletteObj, explanationText, estimatesObj){
    palettePreview.innerHTML = '';
    ['base','accent','trim'].forEach(role=>{
      const shade = paletteObj[role];
      const sw = document.createElement('div'); sw.className='swatch';
      const colour = document.createElement('div'); colour.className='colour';
      colour.style.background = shade.hex;
      // ensure text contrast
      const textColor = shade._hsl.l > 60 ? '#102029' : '#f6fbff';
      colour.style.color = textColor;
      colour.textContent = `${role.toUpperCase()}`;
      const meta = document.createElement('div'); meta.className='meta';
      meta.innerHTML = `<strong>${shade.name}</strong><div>${shade.hex} • ${shade.id} • LRV ${shade.lrv}</div>`;
      sw.appendChild(colour); sw.appendChild(meta);
      palettePreview.appendChild(sw);
    });
    explanation.innerText = explanationText;
    estimates.innerText = `Walls: ${estimatesObj.wallLitres} L (estimated), Ceiling: ${estimatesObj.ceilingLitres} L → Purchase recommendation: ${estimatesObj.totalLitres} L (round up).`;

    resultsSection.hidden = false;
    document.getElementById('wizard').hidden = true;
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function collectForm(){
    const fd = new FormData(wizardForm);
    const roomProps = {
      roomType: fd.get('roomType'),
      width: Number(fd.get('width') || 12),
      length: Number(fd.get('length') || 15),
      ceilingHeight: Number(fd.get('ceilingHeight') || 8)
    };
    const persona = {
      trait1: fd.get('trait1'),
      trait2: fd.get('trait2'),
      trait3: fd.get('trait3'),
      trait4: fd.get('trait4')
    };
    const light = analyzeLight(fd.get('daylight'), fd.get('daylightTone'), fd.get('artificialTone'));
    const objective = fd.get('objective');
    const household = {
      kids: fd.get('kids'),
      pets: fd.get('pets'),
      flooring: fd.get('flooring'),
      preferredAccent: (fd.get('preferredAccent') || '').trim()
    };
    return {roomProps, persona: Object.values(persona).join('', 'light', objective', household);
  }

  generateBtn.addEventListener('click', ()=>{
    const inputs = collectForm();
    const scores = scoreShades({
      roomProps: inputs.roomProps,
      persona: inputs.persona,
      light: inputs.light,
      objective: inputs.objective,
      household: inputs.household
    });

    const paletteObj = assemblePalette(scores, inputs.persona);
    const estimatesObj = estimateLitres(inputs.roomProps, 2, 120);
    const explainText = explainChoice(paletteObj, inputs);
    renderResults(paletteObj, explainText, estimatesObj);

    // attach JSON export
    exportJson.onclick = () => {
      const out = {
        inputs,
        palette: {
          base: paletteObj.base,
          accent: paletteObj.accent,
          trim: paletteObj.trim
        },
        estimates: estimatesObj,
        generatedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'moodbot-result.json'; a.click();
      URL.revokeObjectURL(url);
    };
  });

  restart.addEventListener('click', ()=>{
    resultsSection.hidden = true;
    document.getElementById('wizard').hidden = false;
    // reset form
    wizardForm.reset();
    // reset to step 1
    currentStep = 1; showStep(currentStep);
  });

})();