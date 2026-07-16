/* IGNEOUS_MOBILE_TOUCH_V1 */
(()=>{
  const mobile=()=>window.matchMedia('(max-width:700px) and (pointer:coarse)').matches;
  const left=document.querySelector('.left');
  const chamber=document.getElementById('magmaChamber');
  const brightBtn=document.getElementById('brightBtn');
  const darkBtn=document.getElementById('darkBtn');
  if(!left||!chamber||!brightBtn||!darkBtn)return;
  let selected=null;

  const openBtn=document.createElement('button');
  openBtn.type='button';openBtn.className='mobile-control-open';
  openBtn.innerHTML='<span aria-hidden="true">🧪</span><span>재료·설정</span>';
  const backdrop=document.createElement('div');backdrop.className='mobile-control-backdrop';
  const closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.className='mobile-control-close';closeBtn.textContent='×';closeBtn.setAttribute('aria-label','재료와 설정 닫기');
  const title=document.createElement('strong');title.className='mobile-control-title';title.textContent='재료와 실험 설정';
  const guide=document.createElement('p');guide.className='tap-guide';guide.innerHTML='휴대폰에서는 <strong>비커 선택 → 마그마방 누르기</strong>로 성분을 조절해요.';
  left.prepend(title,closeBtn);left.querySelector('.box')?.appendChild(guide);document.body.append(backdrop,openBtn);

  const setOpen=value=>document.body.classList.toggle('mobile-controls-visible',Boolean(value&&window.innerWidth<=700));
  openBtn.addEventListener('click',()=>setOpen(true));closeBtn.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});

  function choose(type){
    selected=type;brightBtn.classList.toggle('selected-tap',type==='bright');darkBtn.classList.toggle('selected-tap',type==='dark');chamber.classList.add('tap-ready');
    els.statusText.textContent=type==='bright'?'밝은 성분 선택 · 마그마방을 누르세요':'어두운 성분 선택 · 마그마방을 누르세요';
    showTip('<strong>비커 선택 완료!</strong> 마그마방을 누를 때마다 선택한 성분이 5%씩 바뀝니다.',2600);
    setTimeout(()=>setOpen(false),120);
  }
  [brightBtn,darkBtn].forEach(btn=>btn.addEventListener('pointerdown',e=>{
    if(!mobile())return;e.preventDefault();e.stopImmediatePropagation();choose(btn.dataset.type);
  },true));

  function addSelected(){
    if(!mobile())return;
    if(!selected){showTip('<strong>먼저 비커를 선택하세요.</strong> 재료·설정 버튼을 눌러 비커를 골라 주세요.',2500);return;}
    bright=selected==='bright'?Math.min(90,bright+5):Math.max(10,bright-5);
    for(let i=0;i<4;i++)setTimeout(spawnChamberBubble,i*55);
    updateUI();resetResultText();
    els.statusText.textContent=selected==='bright'?`밝은 성분 ${bright}%`:`어두운 성분 ${100-bright}%`;
    showTip(`<strong>성분 조절!</strong> 밝은 성분 ${bright}% · 어두운 성분 ${100-bright}%`,1600);
  }
  chamber.setAttribute('role','button');chamber.setAttribute('tabindex','0');chamber.setAttribute('aria-label','선택한 비커 성분을 마그마방에 넣기');
  chamber.addEventListener('click',addSelected);
  chamber.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&mobile()){e.preventDefault();addSelected()}});

  document.querySelectorAll('.location').forEach(btn=>btn.addEventListener('click',()=>{if(window.innerWidth<=700)setOpen(false)}));
  document.getElementById('startCoolingBtn')?.addEventListener('click',()=>setOpen(false));document.getElementById('compareBtn')?.addEventListener('click',()=>setOpen(false));
  document.getElementById('resetBtn')?.addEventListener('click',()=>{selected=null;brightBtn.classList.remove('selected-tap');darkBtn.classList.remove('selected-tap');chamber.classList.remove('tap-ready')});
  window.addEventListener('resize',()=>{if(window.innerWidth>700)setOpen(false)},{passive:true});
})();
