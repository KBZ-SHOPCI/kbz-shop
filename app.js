(function(){
'use strict';
var C=window.KBZ_CONFIG||{};
var K=window.K={views:{},cfg:{},sb:null,baseTitle:document.title,
state:{products:[],user:null,staff:null,view:'home',arg:null,cat:'all',q:''}};
K.titles={shop:'Boutique',cat:'Catégorie',cats:'Catégories',product:'Article',cart:'Panier',checkout:'Commande',success:'Commande enregistrée',admin:'Espace vendeur'};
var TT='https://www.tiktok.com/@kbz.shop.ci';
var SECRET='#acces-kbz-7x4m9';
var SN=function(){return K.cfg.shop_name||'KBZ SHOP';};
var WM=function(t){return K.waLink('Bonjour '+SN()+', '+t);};
K.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
K.fmt=function(n){return new Intl.NumberFormat('fr-FR').format(n||0)+' FCFA';};
K.$=function(s,r){return(r||document).querySelector(s);};
K.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var st=document.createElement('style');
st.textContent=[
'#hd{position:sticky;top:0;z-index:40;background:#fff;border-bottom:1px solid #e5e9f2}',
'.hd2 .in{display:flex;align-items:center;justify-content:space-between;min-height:60px}',
'.hr{display:flex}',
'.lgo{position:relative;display:flex;align-items:flex-end;gap:7px;background:none;border:0;padding:4px 0 6px;cursor:pointer}',
'.kz{position:relative;display:flex}',
'.lgo .l{font:italic 900 36px/1 system-ui;letter-spacing:-1px;color:#2447e5;animation:hU .6s cubic-bezier(.2,.8,.2,1) both}',
'.lgo .l:nth-child(2){animation-delay:.18s}',
'.lgo .l:nth-child(3){animation-delay:.36s}',
'.lgo .p{font:italic 900 28px/1 system-ui;color:#0f172a;animation:hF .5s ease .36s both}',
'.sw{position:absolute;left:-2px;bottom:-6px;width:100%;height:8px;animation:hF .4s ease .5s both}',
'.lgo .c{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
'.lgo .c i{position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(100deg,transparent,#fffe,transparent);transform:translateX(-130%) skewX(-18deg);animation:hS .8s ease 1.1s both}',
'.lgo.nm *{animation:none!important}',
'@keyframes hU{from{transform:translateY(85vh);opacity:0}25%{opacity:1}to{transform:none;opacity:1}}',
'@keyframes hF{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
'@keyframes hS{to{transform:translateX(330%) skewX(-18deg)}}',
'@media(prefers-reduced-motion:reduce){.lgo *{animation:none!important}}',
'.hib{position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin-left:8px;border:1px solid #e1e6f0;border-radius:50%;background:#f4f6fb;color:#0f172a;cursor:pointer}',
'.hib.cb{border-color:#2447e5;background:#2447e5;color:#fff}',
'.hib svg,.bn svg,.ft2s svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
'.bdg{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ffc933;color:#0f172a;font:800 11px/18px system-ui;text-align:center;font-style:normal}',
'.bn{position:fixed;left:0;right:0;bottom:0;z-index:50;display:grid;grid-template-columns:repeat(3,1fr);background:#fff;border-top:1px solid #e5e9f2;padding-bottom:env(safe-area-inset-bottom)}',
'.bn button{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 11px;border:0;background:none;font:600 12px system-ui;color:#0f172a;cursor:pointer}',
'.bn .on{color:#2447e5}',
'.bn .on::after{content:"";position:absolute;left:14%;right:14%;bottom:0;height:3px;border-radius:2px;background:#2447e5}',
'.bn .hm.on svg{fill:currentColor}',
'.bn .hm.on path+path{fill:#fff;stroke:#fff}',
'.bn .bdg{top:4px;right:calc(50% - 24px)}',
'body.hasbn{padding-bottom:68px}',
'.ft2{background:#0f172a;color:#e2e8f0;text-align:center;padding:28px 18px 22px;font-size:14px}',
'.ft2 a{color:#cbd5e1}',
'.ft2b b{display:block;font-size:22px;color:#fff}',
'.ft2b span{display:block;margin-top:4px;color:#ffc933;font-size:13px}',
'.ft2s{display:flex;gap:14px;justify-content:center;margin:18px 0}',
'.ft2s a{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;border:1.5px solid #3b4a6b;color:#fff}',
'.ft2 .ft2w{display:inline-block;background:#15803d;color:#fff;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none}',
'.ft2 p{margin:14px 0 0;color:#94a3b8}',
'.ft2 ul{list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;margin:16px 0 0;padding:0;font-size:13px}'
].join('');
document.head.appendChild(st);
var live=document.createElement('div');
live.className='sr';
live.setAttribute('role','status');
live.setAttribute('aria-live','polite');
document.body.appendChild(live);
K.toast=function(m,bad){
var t=document.createElement('div');
t.className='toast'+(bad?' bad':'');
t.setAttribute('aria-hidden','true');
t.textContent=m;
document.body.appendChild(t);
live.textContent=m;
setTimeout(function(){t.remove();},bad?4500:2200);
};
K.PH='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#1a1a21"/><text x="200" y="215" font-size="60" text-anchor="middle" fill="#d4a437">KBZ</text></svg>');
K.cart=[];
try{K.cart=JSON.parse(localStorage.getItem('kbzci_cart')||'[]');if(!Array.isArray(K.cart))K.cart=[];}catch(e){K.cart=[];}
K.saveCart=function(){
try{localStorage.setItem('kbzci_cart',JSON.stringify(K.cart));}catch(e){}
K.renderHd();
};
K.cartCount=function(){return K.cart.reduce(function(a,i){return a+i.qty;},0);};
K.cartTotal=function(){return K.cart.reduce(function(a,i){return a+i.price*i.qty;},0);};
K.price=function(p,v){
if(v&&v.price!=null)return v.price;
return p.promo_price!=null?p.promo_price:p.base_price;
};
K.stock=function(p){
return(p.product_variants||[]).reduce(function(a,v){return a+(v.stock||0);},0);
};
K.images=function(p,color){
var im=(p.product_images||[]).slice().sort(function(a,b){return a.position-b.position;});
if(color){
var m=im.filter(function(i){return i.color===color;});
if(m.length)return m;
}
return im;
};
K.cover=function(p){var im=K.images(p);return im.length?im[0].url:K.PH;};
K.fatal=function(msg){
var a=K.$('#app');
if(a)a.innerHTML='<div class="wrap box center" role="alert"><p><b>Oups, le site ne peut pas se charger.</b></p><p class="mut">'+K.esc(msg)+'</p><p><button class="btn s" onclick="location.reload()">Réessayer</button></p></div>';
};
K.init=function(){
if(!window.supabase||!C.SUPABASE_URL||!C.SUPABASE_KEY){
K.fatal('Connexion à la base impossible.');
return false;
}
K.sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY);
return true;
};
K.rpc=async function(name,args){
var r=await K.sb.rpc(name,args||{});
if(r.error)throw new Error(r.error.message);
return r.data;
};
K.loadSettings=async function(){
var r=await K.sb.from('settings').select('key,value');
if(r.error)throw new Error(r.error.message);
(r.data||[]).forEach(function(x){K.cfg[x.key]=x.value;});
};
K.loadProducts=async function(){
var r=await K.sb.from('products')
.select('*,product_images(*),product_variants(*)')
.order('created_at',{ascending:false});
if(r.error)throw new Error(r.error.message);
K.state.products=r.data||[];
};
K.loadStaff=async function(){
var s=await K.sb.auth.getSession();
var session=s.data&&s.data.session;
K.state.user=session?session.user:null;
K.state.staff=null;
if(session){
var r=await K.sb.from('staff').select('role,display_name,active')
.eq('user_id',session.user.id).maybeSingle();
if(r.data&&r.data.active)K.state.staff=r.data;
}
};
K.waLink=function(text){
return'https://wa.me/'+(K.cfg.whatsapp||'')+'?text='+encodeURIComponent(text);
};
function ic(p){return'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';}
var IC={
search:ic('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
cart:ic('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
home:ic('<path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>'),
grid:ic('<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>')
};
K.renderHd=function(){
var h=K.$('#hd');
if(!h)return;
var n=K.cartCount();
if(!h.firstChild){
var shop=K.esc(SN()),seen=false;
try{seen=sessionStorage.getItem('kbz_h')==='1';sessionStorage.setItem('kbz_h','1');}catch(e){}
h.innerHTML='<header class="hd2"><div class="wrap in"><button class="lgo'+(seen?' nm':'')+'" data-go="home" aria-label="'+shop+', retour à l\'accueil"><span class="kz"><span class="l">K</span><span class="l">B</span><span class="l">Z</span><svg class="sw" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8C30 2 70 0 100 2 70 4 35 6 0 8z" fill="#ffc933"/></svg></span><span class="p">SHOP</span><span class="c"><i></i></span></button>'+
'<div class="hr"><button class="hib" data-search="1" aria-label="Rechercher un article">'+IC.search+'</button>'+
'<button class="hib cb" data-go="cart" id="hcart">'+IC.cart+'<i class="bdg" id="hbdg" aria-hidden="true"></i></button></div></div></header>';
}
K.$('#hcart').setAttribute('aria-label','Panier, '+n+' article'+(n>1?'s':''));
var d=K.$('#hbdg');
d.textContent=n;
d.style.display=n?'':'none';
K.renderBn();
};
K.renderBn=function(){
var b=K.$('#bn');
if(!b){
b=document.createElement('nav');
b.id='bn';b.className='bn';
b.setAttribute('aria-label','Navigation principale');
document.body.appendChild(b);
}
var v=K.state.view,n=K.cartCount(),show=v!=='admin'&&v!=='checkout';
b.style.display=show?'':'none';
document.body.classList.toggle('hasbn',show);
function it(go,i,lb,on,x){
var c=(on?'on':'')+(go==='home'?' hm':'');
return'<button data-go="'+go+'"'+(c?' class="'+c+'"':'')+(on?' aria-current="page"':'')+'>'+i+'<span>'+lb+'</span>'+(x||'')+'</button>';
}
b.innerHTML=it('home',IC.home,'Accueil',v==='home'||v==='shop')+
it('cats',IC.grid,'Catégories',v==='cats'||v==='cat')+
it('cart',IC.cart,'Panier',v==='cart'||v==='checkout',n?'<i class="bdg" aria-hidden="true">'+n+'</i>':'');
};
K.renderFt=function(){
var f=K.$('#ft');
if(!f)return;
var shop=K.esc(SN());
f.innerHTML='<footer class="ft2">'+
'<div class="ft2b"><b>'+shop+'</b><span>'+K.esc(K.cfg.slogan||'')+'</span></div>'+
'<div class="ft2s">'+
'<a href="'+TT+'" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.4 2 4 4.5 4.2"/></svg></a>'+
'<a href="'+WM('j\'ai une question.')+'" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M9 8c0 3 3 6 6 6l1-2-2-1-1 .5c-1-.5-1.7-1.2-2.2-2.2L11 8.5 10 6.5z" fill="#fff" stroke="none"/></svg></a>'+
'</div>'+
'<a class="ft2w" href="'+WM('je voudrais commander.')+'" target="_blank" rel="noopener">Commander sur WhatsApp</a>'+
'<p>Livraison à Abidjan · Paiement à la livraison ou Mobile Money</p>'+
'<nav aria-label="Informations légales"><ul>'+
'<li><a href="mentions-legales.html">Mentions légales</a></li>'+
'<li><a href="conditions-de-vente.html">Conditions de vente</a></li>'+
'<li><a href="confidentialite.html#confidentialite">Confidentialité</a></li>'+
'<li><a href="confidentialite.html#cookies">Cookies</a></li>'+
'<li><a href="confidentialite.html#remboursement">Remboursement</a></li>'+
'</ul></nav>'+
'<p>'+K.esc(K.cfg.phone||'')+(K.cfg.email?' · '+K.esc(K.cfg.email):'')+'</p>'+
'<p>© 2026 '+shop+' — '+K.esc(K.cfg.address||'')+'</p></footer>';
};
K.go=function(v,a){
K.state.view=v;
K.state.arg=a;
var app=K.$('#app');
var f=K.views[v];
if(!f){app.innerHTML='<div class="load">Page indisponible.</div>';return;}
app.innerHTML='';
try{f(app,a);}
catch(e){K.fatal('Erreur d\'affichage : '+e.message);}
document.title=K.titles[v]?K.titles[v]+' | '+SN():K.baseTitle;
K.renderHd();
window.scrollTo(0,0);
app.setAttribute('tabindex','-1');
try{app.focus({preventScroll:true});}catch(x){}
};
document.addEventListener('click',function(e){
var r=e.target.closest('[data-search]');
if(r){
if(K.state.view!=='home')K.go('home');
var q=document.getElementById('q');
if(q){q.scrollIntoView({behavior:'smooth',block:'center'});q.focus();}
return;
}
var t=e.target.closest('[data-go]');
if(t){e.preventDefault();K.go(t.getAttribute('data-go'),t.getAttribute('data-arg'));}
});
K.boot=async function(){
var app=K.$('#app');
if(!app)return;
app.innerHTML='<div class="load">Chargement…</div>';
if(!K.init())return;
try{
await K.loadSettings();
await K.loadStaff();
await K.loadProducts();
}catch(e){
K.fatal(e.message);
return;
}
K.renderHd();
K.renderFt();
K.go(location.hash===SECRET?'admin':'home');
window.addEventListener('hashchange',function(){if(location.hash===SECRET)K.go('admin');});
};
window.addEventListener('load',K.boot);
})();
// FIN app.js
