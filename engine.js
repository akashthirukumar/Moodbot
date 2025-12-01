/* engine.js
   Robust client-side rule-based engine and DOM wiring for MoodBot.
   Fixes: more reliable validation for Step 1 (handles whitespace, string numbers),
   logs values to console for quick debugging, and avoids treating "0" as falsy.
*/
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    try {
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

      if (!wizardForm) {
        console.error('Wizard form not found in DOM.');
        return;
      }

      let currentStep = 1;
      const totalSteps = steps.length || 1;

      function showStep(n){
        steps.forEach(s => s.hidden = s.dataset.step !== String(n));
        if (stepNumberEl) stepNumberEl.textContent = String(n);
        if (backBtn) backBtn.style.display = n === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = n === totalSteps ? 'none' : 'inline-block';
        if (backBtn) backBtn.disabled = n === 1;
      }
      showStep(currentStep);

      if (backBtn) backBtn.addEventListener('click', ()=> {
        currentStep = Math.max(1, currentStep-1);
        showStep(currentStep);
      });

      // helper to validate numeric inputs (non-empty, numeric, > 0)
      function isValidNumber(val){
        if (val === null || val === undefined) return false;
        const s = String(val).trim();
        if (s === '') return false;
        const n = Number(s);
        if (Number.isNaN(n)) return false;
        return n > 0;
      }

      if (nextBtn) nextBtn.addEventListener('click', (ev)=> {
        // Basic validation for step 1 (room dimensions)
        if (currentStep === 1) {
          const widthEl = wizardForm.elements['width'];
          const lengthEl = wizardForm.elements['length'];
          const ceilingEl = wizardForm.elements['ceilingHeight'];

          const width = widthEl ? widthEl.value : null;
          const length = lengthEl ? lengthEl.value : null;
          const ceilingHeight = ceilingEl ? ceilingEl.value : null;

          // Debug: log values to console to help diagnose issues
          console.debug('[MoodBot] Step1 values:', { width, length, ceilingHeight });

          if (!isValidNumber(width) || !isValidNumber(length) || !isValidNumber(ceilingHeight)) {
            alert('Please enter valid positive numbers for Width, Length and Ceiling height before continuing.');
            // keep the user on current step
            return;
          }
        }
        currentStep = Math.min(totalSteps, currentStep+1);
        showStep(currentStep);
      });

      // Palette load with fallback
      let palette = [];
      function setDefaultPalette(){
        palette = [
          {"id":"POW-01","name":"Porcelain White","hex":"#F5F7FA","lrv":92,"undertone":"neutral","family":"white"},
          {"id":"SAND-02","name":"Warm Sand","hex":"#E8D8C3","lrv":78,"undertone":"warm","family":"beige"},
          {"id":"SMOKE-03","name":"Smoky Grey","hex":"#9AA3AB","lrv":58,"undertone":"neutral","family":"grey"},
          {"id":"MOSS-04","name":"Soft Moss","hex":"#B5C9A1","lrv":52,"undertone":"cool","family":"green"},
          {"id":"TEAL-05","name":"Quiet Teal","hex":"#4E9A93","lrv":34,"undertone":"cool","family":"teal"},
          {"id":"COVE-06","name":"Ocean Cove","hex":"#3E8DA8","lrv":28,"undertone":"cool","family":"blue"},
          {"id":"INK-07","name":"Midnight Ink","hex":"#1B2630","lrv":6,"undertone":"cool","family":"black"},
          {"id":"TERR-08","name":"Terracotta","hex":"#B55A3A","lrv":22,"undertone":"warm","family":"terracotta"},
          {"id":"BLUSH-09","name":"Muted Blush","hex":"#D9BFC1","lrv":72,"undertone":"warm","family":"pink"},
          {"id":"SUN-10","name":"Golden Sun","hex":"#EFAF4B","lrv":48,"undertone":"warm","family":"yellow"}
        ];
      }

      fetch('palette.json', {cache: 'no-store'})
        .then(r => r.ok ? r.json() : Promise.reject('no-palette'))
        .then(data => {
          if (Array.isArray(data) && data.length) palette = data;
          else setDefaultPalette();
        })
        .catch(() => {
          setDefaultPalette();
        })
        .finally(() => {
          // augment palette with derived values
          palette = palette.map(p => {
            const rgb = hexToRgb(p.hex || '#ffffff');
            p._hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            p._luma = perceivedLuma(rgb.r, rgb.g, rgb.b) / 255 * 100;
            if (typeof p.lrv !== 'number') p.lrv = Math.round(p._luma);
            return p;
          });
        });

      // Color helpers
      function hexToRgb(hex){
        hex = String(hex||'').replace('#','');
        if(hex.length===3) hex = hex.split('').map(h=>h+h).join('');
        const num = parseInt(hex,16) || 0;
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
        return 0.2126*r + 0.7152*g + 0.0722*b;
      }

      // Engine functions
      function computeRoomAreas({width,length,ceilingHeight}){
        const w = Number(width), l = Number(length), h = Number(ceilingHeight);
        const floorArea = w * l;
        const wallArea = 2*(w + l) * h;
        const ceilingArea = floorArea;
        return {floorArea, wallArea, ceilingArea, roomArea: floorArea};
      }

      function analyzeLight(daylight, daylightTone){
        let targetLrv = 55;
        if(daylight === 'strong') targetLrv = 45;
        else if(daylight === 'medium') targetLrv = 55;
        else targetLrv = 70;
        const undertoneBoost = {warm: 0.8, neutral: 1, cool: 1.2}[daylightTone] || 1;
        return {targetLrv, undertoneBoost};
      }

      function objectiveFilter(objective){
        return {
          bigger: {baseLrvShift: 12, ceilingLight: true},
          cozier: {baseLrvShift: -10, warmBias: true},
          brighter: {baseLrvShift: 18},
          softer: {desaturate:true, baseLrvShift: 6}
        }[objective] || {};
      }

      function scoreShades(inputs){
        const {light, objective, household, persona} = inputs;
        const targetLrv = light.targetLrv;
        const obj = objectiveFilter(objective);
        const accentFreedom = (persona.includes('E') || persona.includes('N')) ? 1.2 : 0.8;
        const neutralBias = (persona.includes('I') || persona.includes('S')) ? 1.2 : 0.9;

        return palette.map(shade => {
          let score = 0;
          const lrvDiff = Math.abs(shade.lrv - (targetLrv + (obj.baseLrvShift||0)));
          score += Math.max(0, 40 - lrvDiff);
          if(obj.warmBias && shade.undertone === 'warm') score += 6;
          if(shade.undertone === 'cool' && light.undertoneBoost > 1.1) score += 4;
          if((neutralBias && shade.family === 'grey') || (neutralBias && shade.family === 'white') || (neutralBias && shade.family === 'beige')) score += 6 * neutralBias;
          if(accentFreedom > 1 && (['blue','teal','terracotta','green','pink','yellow'].includes(shade.family))) score += 4 * accentFreedom;
          if(household.kids === 'yes' && shade.lrv > 90) score -= 12;
          if(household.pets === 'yes' && shade.family === 'white') score -= 8;
          if(household.flooring === 'warm' && shade.undertone === 'warm') score += 4;
          if(household.preferredAccent && shade.family === household.preferredAccent.toLowerCase()) score += 10;
          if(['white','grey','beige'].includes(shade.family)) score += 2;
          shade._score = Math.round(score);
          return shade;
        }).sort((a,b) => b._score - a._score);
      }

      function assemblePalette(sortedShades){
        const baseCandidates = sortedShades.filter(s => ['white','grey','beige'].includes(s.family) || s.lrv > 45);
        const base = baseCandidates[0] || sortedShades[0] || palette[0];
        const accentCandidates = sortedShades.filter(s => s.id !== base.id);
        accentCandidates.sort((a,b) => {
          const contrastA = Math.abs(a._hsl.l - base._hsl.l) + (a.family !== base.family ? 12 : 0);
          const contrastB = Math.abs(b._hsl.l - base._hsl.l) + (b.family !== base.family ? 12 : 0);
          return contrastB - contrastA;
        });
        const accent = accentCandidates[0] || sortedShades[1] || base;
        const trimCandidates = sortedShades.filter(s => s.id !== base.id && s.id !== accent.id);
        trimCandidates.sort((a,b) => Math.abs(a.lrv - 92) - Math.abs(b.lrv - 92));
        const trim = trimCandidates[0] || base;
        return {base, accent, trim};
      }

      function estimateLitres(roomProps, coats=2, coverage=120){
        const areas = computeRoomAreas(roomProps);
        const wallLitres = Math.ceil(((areas.wallArea * coats) / coverage) * 10) / 10;
        const ceilingLitres = Math.ceil(((areas.ceilingArea * (coats>0?1:0)) / coverage) * 10) / 10;
        return {wallLitres, ceilingLitres, totalLitres: Math.ceil(wallLitres + ceilingLitres)};
      }

      function explainChoice(paletteObj, inputs){
        const lines = [];
        lines.push(`Base (${paletteObj.base.name} — ${paletteObj.base.hex}): chosen for balanced LRV (${paletteObj.base.lrv}) relative to room light and objective.`);
        lines.push(`Accent (${paletteObj.accent.name} — ${paletteObj.accent.hex}): chosen to provide contrast and personality-forward colour (family: ${paletteObj.accent.family}).`);
        lines.push(`Trim/Ceiling (${paletteObj.trim.name} — ${paletteObj.trim.hex}): chosen to balance perceived height and crisp edges.`);
        if(inputs.household.kids === 'yes') lines.push('Adjusted for kids: avoiding ultra-faint whites for durability.');
        if(inputs.household.pets === 'yes') lines.push('Adjusted for pets: avoiding high-showing fur colours.');
        if(inputs.household.preferredAccent) lines.push(`Preferred accent (${inputs.household.preferredAccent}) was considered.`);
        return lines.join(' ');
      }

      function renderResults(paletteObj, explanationText, estimatesObj){
        if (!palettePreview) return;
        palettePreview.innerHTML = '';
        ['base','accent','trim'].forEach(role => {
          const shade = paletteObj[role];
          const sw = document.createElement('div'); sw.className='swatch';
          const colour = document.createElement('div'); colour.className='colour';
          colour.style.background = shade.hex;
          const textColor = shade._hsl && shade._hsl.l > 60 ? '#102029' : '#f6fbff';
          colour.style.color = textColor;
          colour.textContent = `${role.toUpperCase()}`;
          const meta = document.createElement('div'); meta.className='meta';
          meta.innerHTML = `<strong>${shade.name}</strong><div>${shade.hex} • ${shade.id} • LRV ${shade.lrv}</div>`;
          sw.appendChild(colour); sw.appendChild(meta);
          palettePreview.appendChild(sw);
        });
        if (explanation) explanation.innerText = explanationText;
        if (estimates) estimates.innerText = `Walls: ${estimatesObj.wallLitres} L (estimated), Ceiling: ${estimatesObj.ceilingLitres} L → Purchase recommendation: ${estimatesObj.totalLitres} L (round up).`;
        if (resultsSection) resultsSection.hidden = false;
        const wizardEl = document.getElementById('wizard');
        if (wizardEl) wizardEl.hidden = true;
        window.scrollTo({top:0, behavior:'smooth'});
      }

      function collectForm(){
        const fd = new FormData(wizardForm);
        const roomProps = {
          roomType: fd.get('roomType') || 'living',
          width: Number(fd.get('width') || 12),
          length: Number(fd.get('length') || 15),
          ceilingHeight: Number(fd.get('ceilingHeight') || 8)
        };
        const persona = {
          trait1: fd.get('trait1') || 'I',
          trait2: fd.get('trait2') || 'S',
          trait3: fd.get('trait3') || 'F',
          trait4: fd.get('trait4') || 'J'
        };
        const light = analyzeLight(fd.get('daylight') || 'medium', fd.get('daylightTone') || 'neutral');
        const objective = fd.get('objective') || 'bigger';
        const household = {
          kids: fd.get('kids') || 'no',
          pets: fd.get('pets') || 'no',
          flooring: fd.get('flooring') || 'neutral',
          preferredAccent: (fd.get('preferredAccent') || '').trim()
        };
        return {roomProps, persona: Object.values(persona).join(''), light, objective, household};
      }

      if (generateBtn) generateBtn.addEventListener('click', () => {
        const inputs = collectForm();
        const scores = scoreShades(inputs);
        const paletteObj = assemblePalette(scores);
        const estimatesObj = estimateLitres(inputs.roomProps, 2, 120);
        const explainText = explainChoice(paletteObj, inputs);
        renderResults(paletteObj, explainText, estimatesObj);

        if (exportJson) exportJson.onclick = () => {
          const out = { inputs, palette: { base: paletteObj.base, accent: paletteObj.accent, trim: paletteObj.trim }, estimates: estimatesObj, generatedAt: new Date().toISOString() };
          const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'moodbot-result.json'; a.click();
          URL.revokeObjectURL(url);
        };
      });

      if (restart) restart.addEventListener('click', () => {
        if (resultsSection) resultsSection.hidden = true;
        const wizardEl = document.getElementById('wizard');
        if (wizardEl) wizardEl.hidden = false;
        wizardForm.reset();
        currentStep = 1; showStep(currentStep);
      });

    } catch (err) {
      console.error('Engine initialization error:', err);
      alert('There was an error starting the MoodBot engine. Open the browser console (F12) and paste the error here so I can help.');
    }
  });
})();
