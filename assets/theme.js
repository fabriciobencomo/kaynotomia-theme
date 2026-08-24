/* theme.js — KAYNOTOMIA */
(function(){
'use strict';

// ── NAV SCROLL ───────────────────────────────
var mainNav = document.getElementById('mainNav');
var heroSec = document.getElementById('heroSection');
function updateNav(){
  if(!mainNav) return;
  var pastHero = !heroSec || heroSec.getBoundingClientRect().bottom <= 0;
  mainNav.classList.toggle('nav-solid', pastHero);
}
window.addEventListener('scroll', updateNav, {passive:true});
updateNav();

// ── MOBILE MENU ──────────────────────────────
var mobileBtn = document.getElementById('mobileMenuBtn');
var mobileMenu = document.getElementById('mobileMenu');
if(mobileBtn && mobileMenu){
  mobileBtn.addEventListener('click',function(){
    mobileMenu.classList.toggle('hidden');
  });
}

// ── SCROLL REVEAL ────────────────────────────
function revealOnScroll(){
  document.querySelectorAll('.reveal').forEach(function(el){
    if(el.getBoundingClientRect().top < window.innerHeight * 0.88)
      el.classList.add('active');
  });
}
window.addEventListener('scroll', revealOnScroll, {passive:true});
window.addEventListener('load', revealOnScroll);

// ── HERO SLIDER ──────────────────────────────
(function(){
  var slider = document.getElementById('heroSlider');
  if(!slider) return;

  var dotsContainer = document.getElementById('heroDots');
  var progressFill  = document.getElementById('heroProgressFill');
  var prevBtn = document.getElementById('heroPrev');
  var nextBtn = document.getElementById('heroNext');
  var slides=[], dots=[], current=0, progressTimer=null;
  var INTERVAL=5000, STEP=50, elapsed=0, paused=false;

  function buildSlides(data){
    data.forEach(function(item,i){
      var div=document.createElement('div');
      div.className='hero-slide'+(i===0?' active':'');
      var img=document.createElement('img');
      img.src=item.src; img.alt=item.alt||'';
      img.loading=(i===0)?'eager':'lazy';
      div.appendChild(img); slider.appendChild(div); slides.push(div);
      if(dotsContainer){
        var dot=document.createElement('button');
        dot.className='hero-dot'+(i===0?' active':'');
        dot.setAttribute('aria-label','Slide '+(i+1));
        dot.addEventListener('click',function(){goTo(i);});
        dotsContainer.appendChild(dot); dots.push(dot);
      }
    });
  }

  function goTo(idx){
    if(idx===current||!slides.length) return;
    slides[current].classList.remove('active');
    if(dots[current]) dots[current].classList.remove('active');
    current=idx;
    slides[current].classList.add('active');
    if(dots[current]) dots[current].classList.add('active');
    resetProg();
  }

  function resetProg(){
    elapsed=0;
    if(progressFill){
      progressFill.classList.add('reset');
      void progressFill.offsetWidth;
      progressFill.classList.remove('reset');
    }
  }

  function startAuto(){
    stopAuto(); resetProg();
    progressTimer=setInterval(function(){
      if(paused) return;
      elapsed+=STEP;
      if(progressFill) progressFill.style.width=Math.min(elapsed/INTERVAL*100,100)+'%';
      if(elapsed>=INTERVAL){ goTo((current+1)%slides.length); }
    },STEP);
  }
  function stopAuto(){ clearInterval(progressTimer); }

  if(prevBtn) prevBtn.addEventListener('click',function(){ goTo((current-1+slides.length)%slides.length); startAuto(); });
  if(nextBtn) nextBtn.addEventListener('click',function(){ goTo((current+1)%slides.length); startAuto(); });

  var heroSectionEl=document.getElementById('heroSection');
  if(heroSectionEl){
    heroSectionEl.addEventListener('mouseenter',function(){paused=true;});
    heroSectionEl.addEventListener('mouseleave',function(){paused=false;});
    var tx=0;
    heroSectionEl.addEventListener('touchstart',function(e){tx=e.changedTouches[0].screenX;},{passive:true});
    heroSectionEl.addEventListener('touchend',function(e){
      var d=tx-e.changedTouches[0].screenX;
      if(Math.abs(d)>50){ goTo(d>0?(current+1)%slides.length:(current-1+slides.length)%slides.length); startAuto(); }
    },{passive:true});
  }

  document.addEventListener('keydown',function(e){
    if(heroSectionEl && heroSectionEl.getBoundingClientRect().bottom<=0) return;
    if(e.key==='ArrowLeft')  { goTo((current-1+slides.length)%slides.length); startAuto(); }
    if(e.key==='ArrowRight') { goTo((current+1)%slides.length); startAuto(); }
  });

  // Load slides — try Shopify metaobject JSON, fall back to section data attr
  // Read slides from inline JSON script tag
  var slidesScript = document.getElementById('hero-slides-data');
  if(slidesScript){
    try{
      var parsed = JSON.parse(slidesScript.textContent);
      // filter out empty src
      parsed = parsed.filter(function(s){ return s.src && s.src.length > 0; });
      if(parsed.length > 0){
        buildSlides(parsed);
        if(parsed.length > 1) startAuto();
      } else {
        buildSlides([{src:'', alt:'KAYNOTOMIA'}]);
      }
    } catch(e){ console.warn('Hero slider: JSON parse error', e); }
  }
})();

// ── UNBOXING CANVAS ──────────────────────────
(function(){
  var UB_TOTAL=121, UB_ASPECT=1920/1080;
  var UB_PANELS=[
    {id:'ubp1',i:0.00,p:0.10,o:0.22},
    {id:'ubp2',i:0.22,p:0.32,o:0.46},
    {id:'ubp3',i:0.46,p:0.57,o:0.70},
    {id:'ubp4',i:0.70,p:0.80,o:0.90},
    {id:'ubp5',i:0.90,p:0.95,o:1.00},
  ];
  var ubCv=document.getElementById('unboxCanvas'); if(!ubCv) return;
  var ubCtx=ubCv.getContext('2d');
  var ubScene=document.getElementById('unboxScene');
  var ubPFill=document.getElementById('unboxProgFill');
  var ubHeader=document.getElementById('unboxHeader');
  var ubCue=document.getElementById('unboxCue');
  var ubDpr=Math.min(window.devicePixelRatio||1,2);
  var ubCssW=0,ubCssH=0,ubImgs=[],ubLoaded=0,ubCurIdx=0,ubRaf=false,ubReady=false;
  var ubBase=ubCv.getAttribute('data-cdn')||'';

  function ubSrc(i){ return ubBase+'frame_'+String(i+1).padStart(4,'0')+'.webp'; }
  function ubSize(){
    ubDpr=Math.min(window.devicePixelRatio||1,2);
    var vw=window.innerWidth,vh=window.innerHeight;
    if(vw/vh>=UB_ASPECT){ubCssW=vw;ubCssH=Math.round(vw/UB_ASPECT);}
    else{ubCssH=vh;ubCssW=Math.round(vh*UB_ASPECT);}
    ubCv.style.width=ubCssW+'px'; ubCv.style.height=ubCssH+'px';
    ubCv.width=Math.round(ubCssW*ubDpr); ubCv.height=Math.round(ubCssH*ubDpr);
    ubCtx.setTransform(ubDpr,0,0,ubDpr,0,0);
    ubPaint(ubCurIdx);
  }
  function ubPaint(i){
    var img=ubImgs[i]; if(!img||!img.complete||!img.naturalWidth) return;
    ubCtx.clearRect(0,0,ubCssW,ubCssH); ubCtx.drawImage(img,0,0,ubCssW,ubCssH);
  }
  function ubSched(i){
    ubCurIdx=i; if(ubRaf) return; ubRaf=true;
    requestAnimationFrame(function(){ubRaf=false;ubPaint(ubCurIdx);});
  }
  function ubPanelOp(p,prog){
    if(prog<=p.i||prog>=p.o) return 0;
    if(prog<=p.p) return (prog-p.i)/(p.p-p.i);
    return 1-(prog-p.p)/(p.o-p.p);
  }
  function ubScroll(){
    if(!ubReady) return;
    var sy=window.scrollY,sTop=ubScene.offsetTop,sH=ubScene.offsetHeight-window.innerHeight;
    var prog=Math.max(0,Math.min(1,(sy-sTop)/sH));
    if(ubHeader) ubHeader.classList.toggle('show',sy<sTop+100);
    if(ubCue)    ubCue.classList.toggle('show',sy<sTop+80);
    ubSched(Math.round(prog*(UB_TOTAL-1)));
    if(ubPFill) ubPFill.style.width=(prog*100)+'%';
    UB_PANELS.forEach(function(p){
      var el=document.getElementById(p.id); if(!el) return;
      var op=ubPanelOp(p,prog),dy=(1-op)*14;
      el.style.opacity=op;
      el.style.transform=el.classList.contains('C')
        ?'translate(-50%,calc(-50% + '+dy+'px))'
        :'translateY(calc(-50% + '+dy+'px))';
    });
  }
  for(var i=0;i<UB_TOTAL;i++){
    (function(idx){
      var img=new Image();
      img.onload=img.onerror=function(){
        ubLoaded++;
        if(ubLoaded===UB_TOTAL){ubReady=true;ubSize();if(ubHeader)ubHeader.classList.add('show');if(ubCue)ubCue.classList.add('show');}
      };
      img.src=ubSrc(idx); ubImgs[idx]=img;
    })(i);
  }
  ubSize();
  window.addEventListener('scroll',ubScroll,{passive:true});
  window.addEventListener('resize',function(){ubSize();ubScroll();});
})();

// ── CONFIGURATOR ─────────────────────────────
(function(){
  var form = document.getElementById('configurator-form');
  if(!form) return;

  var variantDataEl = document.getElementById('kn-variant-data');
  var variantData   = variantDataEl ? JSON.parse(variantDataEl.textContent) : {variants:[]};

  var STEP_ORDER=['model','sack','cord','template','hook'];
  var state={model:null,sack:null,cord:null,template:null,hook:null};
  var completed=new Set();
  var previewTimer;
  // Build imgBgMap from variant data
  var imgBgMap={};
  try{
    variantData.variants.forEach(function(v){
      if(v.image && v.imageBg){
        var key = v.image.split('/').pop().split('?')[0];
        imgBgMap[key] = v.imageBg;
      }
    });
  }catch(e){}

  function updateBg(src){
    var w=document.getElementById('imagePanelWrap');
    if(!w) return;
    var key=src.split('/').pop().split('?')[0];
    w.style.background=imgBgMap[key]||'#c9ccd0';
  }
  function setPreview(src){
    var el=document.getElementById('configPreview'); if(!el) return;
    if((el.getAttribute('src')||'')===src) return;
    updateBg(src); el.style.opacity='0'; clearTimeout(previewTimer);
    previewTimer=setTimeout(function(){el.src=src;el.style.opacity='1';},280);
  }
  function showHover(src){
    var h=document.getElementById('configHover'); if(!h||!src) return;
    h.src=src; updateBg(src);
    h.onload=function(){h.style.opacity='1';};
    if(h.complete&&h.naturalWidth) h.style.opacity='1';
  }
  function hideHover(){
    var h=document.getElementById('configHover'); if(h) h.style.opacity='0';
    var p=document.getElementById('configPreview');
    if(p&&p.getAttribute('src')) updateBg(p.getAttribute('src'));
  }
  function setDesc(v,animate){
    var desc=document.getElementById('modelDesc'); if(!desc) return;
    var apply=function(){
      var t=document.getElementById('descTitle'); if(t) t.textContent=v.descTitle||'';
      var b=document.getElementById('descBody');
      if(b){
        var parts=(v.descBody||'').split('\n\n');
        b.innerHTML=parts.map(function(p,i){
          return '<span style="display:block'+(i<parts.length-1?';margin-bottom:14px':'')+'">' + p + '</span>';
        }).join('');
      }
      desc.classList.remove('fading');
    };
    if(animate){desc.classList.add('fading');setTimeout(apply,240);}else apply();
  }
  function updateLabels(){
    var priceEl=document.getElementById('configPrice');
    if(priceEl && state._variantPrice!=null){
      priceEl.textContent='€'+(state._variantPrice/100).toFixed(2).replace('.',',');
    }
    var nameEl=document.getElementById('configName');
    if(nameEl){
      var parts=[
        state.model||null,
        state.sack?'Saco '+state.sack:null,
        state.cord?'Cuerda '+state.cord:null,
        state.template?'Plantilla '+state.template:null,
        state.hook?'Ganchos '+state.hook:null
      ].filter(Boolean);
      nameEl.textContent=(parts[parts.length-1]||'').toUpperCase();
    }
  }
  function unlockStep(id){
    var el=document.getElementById('step-'+id); if(!el) return;
    el.classList.remove('step-locked'); el.classList.add('step-unlocked');
    var body=document.getElementById('body-'+id);
    if(body) requestAnimationFrame(function(){body.classList.remove('step-body-hidden');});
  }
  function collapseStep(id){var b=document.getElementById('body-'+id);if(b)b.classList.add('step-body-hidden');}
  function markDone(id){var el=document.getElementById('step-'+id);if(el)el.classList.add('step-done');completed.add(id);}
  function scrollToNext(id){
    setTimeout(function(){var el=document.getElementById('step-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});},350);
  }
  function checkComplete(){
    if(completed.size===STEP_ORDER.length){
      var w=document.getElementById('addToCartWrap');
      if(w){w.style.opacity='1';w.style.transform='translateY(0)';w.style.pointerEvents='auto';}
    }
  }

  // Choose variant (step 1)
  function chooseVariant(btn){
    var id=btn.dataset.variantId;
    var v=variantData.variants.find(function(x){return String(x.id)===String(id);});
    if(!v) return;
    var hidEl=document.getElementById('selectedVariantId'); if(hidEl) hidEl.value=id;
    state.model=v.title; state._variantPrice=v.price;
    if(v.image) setPreview(v.image);
    if(v.imageBg){var w=document.getElementById('imagePanelWrap');if(w)w.style.background=v.imageBg;}
    setDesc(v,true);
    document.querySelectorAll('[data-type="variant"]').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    markDone('model'); collapseStep('model'); unlockStep('sack'); scrollToNext('sack');
    checkComplete(); updateLabels();
  }

  // Choose property option (steps 2-5)
  function chooseOption(el){
    var type=el.dataset.type, id=el.dataset.id, img=el.dataset.img;
    if(!type||!id) return;
    state[type]=id;
    if(img) setPreview(img);
    var propInput=document.getElementById('prop-'+type); if(propInput) propInput.value=id;
    // swatch active state
    var parent=el.closest('#body-'+type)||el.parentElement;
    if(parent){
      parent.querySelectorAll('[data-type="'+type+'"]').forEach(function(s){
        s.classList.remove('active');
        var c=s.querySelector('.swatch-circle'); if(c) c.classList.remove('active');
      });
    }
    el.classList.add('active');
    var circle=el.querySelector('.swatch-circle'); if(circle) circle.classList.add('active');
    var stepMap={sack:'sack',cord:'cord',template:'template',hook:'hook'};
    var sId=stepMap[type];
    if(sId){
      markDone(sId); collapseStep(sId);
      var idx=STEP_ORDER.indexOf(sId), next=STEP_ORDER[idx+1];
      if(next){unlockStep(next);scrollToNext(next);}
    }
    checkComplete(); updateLabels();
  }

  // Click delegation
  document.addEventListener('click',function(e){
    var header=e.target.closest('[data-toggle]');
    if(header){
      var sid=header.dataset.toggle, sel=document.getElementById('step-'+sid);
      if(sel&&sel.classList.contains('step-unlocked')){
        var bd=document.getElementById('body-'+sid); if(bd) bd.classList.toggle('step-body-hidden');
      }
      return;
    }
    var varBtn=e.target.closest('[data-type="variant"]');
    if(varBtn){chooseVariant(varBtn);return;}
    var optEl=e.target.closest('[data-type]:not([data-type="variant"])');
    if(optEl&&optEl.closest('#configurator-form')) chooseOption(optEl);
  });
  document.addEventListener('mouseover',function(e){
    var el=e.target.closest('[data-type][data-img]');
    if(el&&el.dataset.img) showHover(el.dataset.img);
  });
  document.addEventListener('mouseout',function(e){
    if(e.target.closest('[data-type][data-img]')) hideHover();
  });

  // AJAX Add to cart
  var addBtn=document.getElementById('addToCartBtn');
  if(addBtn){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      addBtn.disabled=true; addBtn.textContent='Añadiendo…';
      var fd=new FormData(form), body={};
      fd.forEach(function(v,k){body[k]=v;});
      fetch('/cart/add.js',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
        body:JSON.stringify({
          id:body.id, quantity:1,
          properties:{
            'Saco interno': body['properties[Saco interno]']||'',
            'Cuerda':       body['properties[Cuerda]']||'',
            'Plantilla':    body['properties[Plantilla]']||'',
            'Ganchos':      body['properties[Ganchos]']||''
          }
        })
      })
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.status&&d.status!==200) throw new Error(d.description||'Error');
        return fetch('/cart.js').then(function(r){return r.json();});
      })
      .then(function(cart){
        var cnt=document.getElementById('cartCount');
        if(cnt){cnt.textContent=cart.item_count;cnt.style.display='flex';}
        var cntMenu=document.getElementById('cartCountMenu');
        if(cntMenu){cntMenu.textContent=cart.item_count;}
        var msg=document.getElementById('cartMessage');
        if(msg){msg.textContent='✓ Añadido al carrito';msg.style.opacity='1';
          setTimeout(function(){msg.style.opacity='0';},3000);}
        addBtn.disabled=false; addBtn.textContent='Añadir al Carrito';
      })
      .catch(function(err){
        console.error(err);
        addBtn.disabled=false; addBtn.textContent='Error — Reintentar';
      });
    });
  }

  // Init: activate first variant button
  var firstVar=document.querySelector('[data-type="variant"]');
  if(firstVar){
    chooseVariant(firstVar);
    // re-open step 1 after auto-selection
    var modelStep=document.getElementById('step-model');
    var modelBody=document.getElementById('body-model');
    if(modelStep){modelStep.classList.remove('step-done');modelStep.classList.add('step-unlocked');}
    if(modelBody) modelBody.classList.remove('step-body-hidden');
    completed.delete('model');
    var w=document.getElementById('addToCartWrap');
    if(w){w.style.opacity='0';w.style.transform='translateY(16px)';w.style.pointerEvents='none';}
  }
})();

revealOnScroll();

// ── PRODUCT PAGE CONFIGURATOR ──────────────────
(function(){
  var configEl  = document.getElementById('kn-config-data');
  var varEl     = document.getElementById('kn-variant-data');
  var productForm = document.getElementById('product-form');
  if(!configEl || !varEl || !productForm) return;

  var cfg = JSON.parse(configEl.textContent);
  var vd  = JSON.parse(varEl.textContent);

  var STEPS  = ['sack','template'];
  var state  = {variant:null, sack:null, template:null};
  var done   = new Set();
  var previewTimer;

  // Build image→bg map
  var imgBgMap = {};
  vd.variants.forEach(function(v){
    if(v.image && v.imageBg){
      var k = v.image.split('/').pop().split('?')[0];
      imgBgMap[k] = v.imageBg;
    }
  });

  function updateBg(src){
    var w = document.getElementById('imagePanelWrap'); if(!w) return;
    var k = src.split('/').pop().split('?')[0];
    w.style.background = imgBgMap[k] || '#c9ccd0';
  }
  function setPreview(src){
    var el = document.getElementById('configPreview'); if(!el||!src) return;
    if(el.src && el.src.indexOf(src.split('/').pop().split('?')[0]) > -1) return;
    updateBg(src); el.style.opacity='0'; clearTimeout(previewTimer);
    previewTimer = setTimeout(function(){ el.src=src; el.style.opacity='1'; }, 280);
  }
  function showHover(src){
    var h = document.getElementById('configHover'); if(!h||!src) return;
    h.src=src; updateBg(src);
    h.onload = function(){ h.style.opacity='1'; };
    if(h.complete && h.naturalWidth) h.style.opacity='1';
  }
  function hideHover(){
    var h = document.getElementById('configHover'); if(h) h.style.opacity='0';
    var p = document.getElementById('configPreview');
    if(p && p.src) updateBg(p.src);
  }

  function setDesc(v){
    if(!v) return;
    var t = document.getElementById('descTitle');
    if(t) t.textContent = (v.descTitle || v.title || '').toUpperCase();
    var b = document.getElementById('descBody');
    if(b){
      var parts = (v.descBody || '').split('\n\n');
      b.innerHTML = parts.map(function(p,i){
        return '<span style="display:block'+(i<parts.length-1?';margin-bottom:12px':'')+'">' + p + '</span>';
      }).join('');
    }
    var bc = document.getElementById('breadcrumbName');
    if(bc) bc.textContent = v.descTitle || v.title || '';
    var no = document.getElementById('configNameOverlay');
    if(no) no.textContent = (v.descTitle || v.title || '').toUpperCase();
  }

  function updatePrice(){
    var base = state.variant ? state.variant.price : 0;
    var total = base;
    var fmt   = (total / 100).toFixed(2).replace('.', ',');
    var pe = document.getElementById('configPrice');
    if(pe) pe.textContent = '€' + fmt;
    var po = document.getElementById('configPriceOverlay');
    if(po) po.textContent = '€' + fmt;
    if(state.variant){
      var cl = document.getElementById('selectedColorLabel');
      if(cl) cl.textContent = state.variant.title;
    }
  }

  function unlockStep(id){
    var el = document.getElementById('step-'+id); if(!el) return;
    el.classList.remove('step-locked'); el.classList.add('step-unlocked');
    var bd = document.getElementById('body-'+id);
    if(bd) requestAnimationFrame(function(){ bd.classList.remove('step-body-hidden'); });
  }
  function collapseStep(id){
    var b = document.getElementById('body-'+id); if(b) b.classList.add('step-body-hidden');
  }
  function markDone(id, label){
    var el = document.getElementById('step-'+id); if(el) el.classList.add('step-done');
    done.add(id);
    var s = document.getElementById('summary-'+id);
    if(s && label) s.textContent = label;
  }
  function checkAllDone(){
    if(done.size === STEPS.length){
      var w = document.getElementById('addToCartWrap');
      if(w){ w.style.opacity='1'; w.style.transform='translateY(0)'; w.style.pointerEvents='auto'; }
    }
  }

  function renderModels(){
    var wrap = document.getElementById('modelOptions'); if(!wrap) return;
    wrap.innerHTML = vd.variants.map(function(v){
      var a = state.variant && state.variant.id === v.id;
      return '<div class="model-card'+(a?' active':'')+'" data-vid="'+v.id+'" data-img="'+v.image+'">'
        + '<div class="model-card-img"><img src="'+v.imageSm+'" alt="'+v.title+'" loading="lazy"></div>'
        + '<div class="model-card-label">'+v.title+'</div>'
        + '</div>';
    }).join('');
  }

  function renderSteps(){
    var sc = document.getElementById('sackColors');
    if(sc) sc.innerHTML = (cfg.sacks||[]).map(function(s){
      var a = state.sack && state.sack.id === s.id;
      var isWhite = s.hex === '#F5F5F0' || s.hex === '#ffffff' || s.hex === '#fff';
      return '<div class="swatch-wrap'+(a?' active':'')+'" data-type="sack" data-id="'+s.id+'" data-img="'+s.img+'">'
        + '<div class="swatch-circle'+(isWhite?' swatch-white':'')+(a?' active':'')+'" style="background:'+s.hex+';"></div>'
        + '<span class="swatch-label">'+s.name+'</span>'
        + '</div>';
    }).join('');

    var tc = document.getElementById('templateColors');
    if(tc) tc.innerHTML = (cfg.templates||[]).map(function(t){
      var a = state.template && state.template.id === t.id;
      var isWhite = t.hex === '#F0EEE9' || t.hex === '#ffffff' || t.hex === '#fff';
      return '<div class="swatch-wrap'+(a?' active':'')+'" data-type="template" data-id="'+t.id+'" data-img="'+getTemplateImg(t)+'">'
        + '<div class="swatch-circle'+(isWhite?' swatch-white':'')+(a?' active':'')+'" style="background:'+t.hex+';"></div>'
        + '<span class="swatch-label">'+t.name+'</span>'
        + '</div>';
    }).join('');
  }

  function resetSteps(){
    STEPS.forEach(function(id){
      var el = document.getElementById('step-'+id);
      if(el){ el.classList.remove('step-unlocked','step-done'); el.classList.add('step-locked'); }
      var bd = document.getElementById('body-'+id);
      if(bd) bd.classList.add('step-body-hidden');
      var s = document.getElementById('summary-'+id); if(s) s.textContent = '';
      var p = document.getElementById('prop-'+id); if(p) p.value = '';
    });
    state.sack = null; state.template = null;
    done.clear();
    var w = document.getElementById('addToCartWrap');
    if(w){ w.style.opacity='0'; w.style.transform='translateY(16px)'; w.style.pointerEvents='none'; }
    renderSteps();
  }

  function chooseVariant(vid, isInit){
    var v = vd.variants.find(function(x){ return String(x.id)===String(vid); });
    if(!v) return;
    if(!isInit && state.variant && String(state.variant.id) !== String(vid)) resetSteps();
    state.variant = v;
    var hi = document.getElementById('selectedVariantId'); if(hi) hi.value = vid;
    if(v.image) setPreview(v.image);
    if(v.imageBg){ var w=document.getElementById('imagePanelWrap'); if(w) w.style.background=v.imageBg; }
    setDesc(v); updatePrice(); renderModels(); renderSteps();
    unlockStep('sack');
  }

  function getSackImg(item){
    if(item.imgs && item.imgs.length){
      var idx = vd.variants.findIndex(function(v){ return state.variant && String(v.id)===String(state.variant.id); });
      return (idx >= 0 && item.imgs[idx]) ? item.imgs[idx] : (item.imgs[0] || '');
    }
    return item.img || '';
  }

  function getTemplateImg(item){
    if(item.imgs && item.imgs.length){
      var idx = vd.variants.findIndex(function(v){ return state.variant && String(v.id)===String(state.variant.id); });
      return (idx >= 0 && item.imgs[idx]) ? item.imgs[idx] : (item.imgs[0] || '');
    }
    return item.img || '';
  }

  function chooseOption(type, id, img){
    var listKey = {sack:'sacks', cord:'cords', template:'templates', hook:'hooks'}[type];
    var item = (cfg[listKey]||[]).find(function(x){ return x.id===id; });
    if(!item) return;
    state[type] = item;
    var imgSrc = (type === 'sack') ? getSackImg(item) : (type === 'template') ? getTemplateImg(item) : (img || item.img || '');
    if(imgSrc) setPreview(imgSrc);
    var propEl = document.getElementById('prop-'+type); if(propEl) propEl.value = item.name;
    var label = item.name + (item.mod>0 ? ' (+€'+item.mod+')' : '');
    markDone(type, label);
    collapseStep(type);
    var idx = STEPS.indexOf(type);
    if(idx < STEPS.length-1){
      var next = STEPS[idx+1];
      unlockStep(next);
      setTimeout(function(){
        var el = document.getElementById('step-'+next);
        if(el) el.scrollIntoView({behavior:'smooth', block:'nearest'});
      }, 350);
    }
    renderSteps(); updatePrice(); checkAllDone();
  }

  // Event delegation
  document.addEventListener('click', function(e){
    var mc = e.target.closest('[data-vid]');
    if(mc && mc.closest('#modelOptions')){ chooseVariant(mc.dataset.vid); return; }

    var hdr = e.target.closest('[data-toggle]');
    if(hdr){
      var sid = hdr.dataset.toggle, sel = document.getElementById('step-'+sid);
      if(sel && sel.classList.contains('step-unlocked')){
        var bd = document.getElementById('body-'+sid); if(bd) bd.classList.toggle('step-body-hidden');
      }
      return;
    }

    var opt = e.target.closest('[data-type][data-id]');
    if(opt && productForm.contains(opt) && opt.dataset.type !== 'variant')
      chooseOption(opt.dataset.type, opt.dataset.id, opt.dataset.img);
  });

  document.addEventListener('mouseover', function(e){
    var sackEl = e.target.closest('[data-type="sack"][data-id]');
    if(sackEl && productForm.contains(sackEl)){
      var sackItem = (cfg.sacks||[]).find(function(s){ return s.id===sackEl.dataset.id; });
      if(sackItem) showHover(getSackImg(sackItem));
      return;
    }
    var el = e.target.closest('[data-img]');
    if(el && productForm.contains(el) && el.dataset.img) showHover(el.dataset.img);
  });
  document.addEventListener('mouseout', function(e){
    var leaving = e.target.closest('[data-img]');
    if(leaving && productForm.contains(e.target) && !leaving.contains(e.relatedTarget)) hideHover();
  });

  // AJAX add to cart
  var addBtn = document.getElementById('addToCartBtn');
  if(addBtn){
    productForm.addEventListener('submit', function(e){
      e.preventDefault();
      addBtn.disabled=true; addBtn.textContent='Añadiendo…';
      var fd=new FormData(productForm), body={};
      fd.forEach(function(v,k){ body[k]=v; });
      fetch('/cart/add.js',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
        body:JSON.stringify({
          id: body.id, quantity:1,
          properties:{
            'Saco interno': body['properties[Saco interno]']||'',
            'Plantilla':    body['properties[Plantilla]']||''
          }
        })
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d.status && d.status!==200) throw new Error(d.description||'Error');
        return fetch('/cart.js').then(function(r){ return r.json(); });
      })
      .then(function(cart){
        var cnt = document.getElementById('cartCount');
        if(cnt){ cnt.textContent=cart.item_count; cnt.style.display='flex'; }
        var cntMenu = document.getElementById('cartCountMenu');
        if(cntMenu){ cntMenu.textContent=cart.item_count; }
        var toast = document.getElementById('cartToast');
        if(toast){ toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); },2800); }
        addBtn.disabled=false; addBtn.textContent='Añadir al Carrito';
      })
      .catch(function(err){
        console.error(err);
        addBtn.disabled=false; addBtn.textContent='Error — Reintentar';
      });
    });
  }

  // Init — pre-select variant from URL (?variant=ID) or default to first
  renderModels(); renderSteps();
  if(vd.variants.length > 0){
    var urlVid = new URLSearchParams(window.location.search).get('variant');
    var initVid = (urlVid && vd.variants.find(function(v){ return String(v.id)===urlVid; }))
      ? urlVid
      : vd.variants[0].id;
    chooseVariant(initVid, true);
  }
})();

// ── CONTACT PAGE ──────────────────────────────
(function(){
  var ta = document.getElementById('ContactForm-body');
  var cc = document.getElementById('charCount');
  if(ta && cc){
    ta.addEventListener('input', function(){ cc.textContent = this.value.length + ' / 800'; });
  }
})();

})();
