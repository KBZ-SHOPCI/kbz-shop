(function(){
'use strict';
var C=window.KBZ_CONFIG||{};
var K=window.K={views:{},cfg:{},sb:null,baseTitle:document.title,
  state:{products:[],user:null,staff:null,view:'home',arg:null,cat:'all',q:''}};
K.titles={shop:'Boutique',cat:'Catégorie',cats:'Catégories',product:'Article',cart:'Panier',checkout:'Commande',success:'Commande enregistrée',admin:'Espace vendeur'};
var TT='https://www.tiktok.com/@kbz.shop.ci';
var SECRET='#acces-kbz-7x4m9';

K.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
K.fmt=function(n){return new Intl.NumberFormat('fr-FR').format(n||0)+' FCFA';};
K.$=function(s,r){return(r||document).querySelector(s);};
K.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};

/* Styles du pied de page (etape 1 du nouveau design) */
var st=document.createElement('style');
st.textContent=[
'.ft2{background:#0f172a;color:#e2e8f0;text-align:center;padding:28px 18px 22px;font-size:14px}',
'.ft2 a{color:#cbd5e1}',
'.ft2b b{display:block;font-size:22px;letter-spacing:1px;color:#fff}',
'.ft2b span{display:block;margin-top:4px;color:#ffc933;font-size:13px}',
'.ft2s{display:flex;gap:14px;justify-content:center;margin:18px 0}',
'.ft2s a{width:46px;height:46px;border-radius:50%;border:1.5px solid #3b4a6b;display:flex;align-items:center;justify-content:center}',
'.ft2s svg{width:22px;height:22px}',
'.ft2 .ft2w{display:inline-block;background:#15803d;color:#fff;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none}',
'.ft2 p{margin:14px 0 0;color:#94a3b8}',
'.ft2 ul{list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;margin:16px 0 0;padding:0;font-size:13px}'
].join('');
document.head.appendChild(st);

/* Messages annonces aux lecteurs d'ecran */
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
  live.textContent='';
  setTimeout(function(){live.textContent=m;},60);
  setTimeout(function(){t.remove();},bad?4500:2200);
};
K.PH='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#1a1a21"/><text x="200" y="215" font-size="60" text-anchor="middle" fill="#d4a437" font-family="Arial" font-weight="bold">KBZ</text></svg>');

/* ---------- Panier (affichage seulement : le serveur recalcule les prix) ---------- */
K.cart=[];
try{K.cart=JSON.parse(localStorage.getItem('kbzci_cart')||'[]');if(!Array.isArray(K.cart))K.cart=[];}catch(e){K.cart=[];}
K.saveCart=function(){
  try{localStorage.setItem('kbzci_cart',JSON.stringify(K.cart));}catch(e){}
  K.renderHd();
};
K.cartCount=function(){return K.cart.reduce(function(a,i){return a+i.qty;},0);};
K.cartTotal=function(){return K.cart.reduce(function(a,i){return a+i.price*i.qty;},0);};

/* ---------- Aides produits ---------- */
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

/* ---------- Connexion a la base ---------- */
K.fatal=function(msg){
  var a=K.$('#app');
  if(a)a.innerHTML='<div class="wrap"><div class="box center" role="alert"><p><b>Oups, le site ne peut pas se charger.</b></p><p class="mut" style="margin-top:8px">'+K.esc(msg)+'</p><p style="margin-top:12px"><button class="btn s" onclick="location.reload()">Réessayer</button></p></div></div>';
};
K.init=function(){
  if(!window.supabase||!C.SUPABASE_URL||!C.SUPABASE_KEY){
    K.fatal('Connexion à la base impossible (configuration ou bibliothèque manquante).');
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

/* ---------- En-tete, pied de page ---------- */
K.renderHd=function(){
  var h=K.$('#hd');
  if(!h)return;
  var n=K.cartCount();
  var shop=K.esc(K.cfg.shop_name||'KBZ SHOP');
  h.innerHTML='<header class="hd"><div class="wrap">'+
    '<button class="logo" data-go="home" aria-label="'+shop+', retour à l\'accueil"><i aria-hidden="true">K</i><span aria-hidden="true">'+shop+'</span></button>'+
    '<nav class="nav" aria-label="Menu principal"><button data-go="shop">Boutique</button>'+
    '<button class="cartb" data-go="cart" aria-label="Panier, '+n+' article'+(n>1?'s':'')+'"><span aria-hidden="true">🛍️</span>'+(n?'<span class="badge" aria-hidden="true">'+n+'</span>':'')+'</button></nav>'+
    '</div></header>';
};
K.renderFt=function(){
  var f=K.$('#ft');
  if(!f)return;
  var shop=K.esc(K.cfg.shop_name||'KBZ SHOP');
  f.innerHTML='<footer class="ft2">'+
    '<div class="ft2b"><b>'+shop+'</b><span>'+K.esc(K.cfg.slogan||'Ton style, ton choix.')+'</span></div>'+
    '<div class="ft2s">'+
    '<a href="'+TT+'" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.4 2 4 4.5 4.2"/></svg></a>'+
    '<a href="'+K.waLink('Bonjour '+(K.cfg.shop_name||'KBZ SHOP')+', j\'ai une question.')+'" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M9 8.5c-.3.8.2 2 1.3 3.2s2.300 1.800 3.100 1.900c.6.100 1.100-.3 1.300-.8l-1.500-.9-.6.500c-.8-.3-1.600-1.100-1.900-1.900l.5-.6-.9-1.500c-.5.100-.9.600-.8 1.100z" fill="#fff" stroke="none"/></svg></a>'+
    '</div>'+
    '<a class="ft2w" href="'+K.waLink('Bonjour '+(K.cfg.shop_name||'KBZ SHOP')+', je voudrais commander.')+'" target="_blank" rel="noopener">Commander sur WhatsApp</a>'+
    '<p>Livraison 1 à 2 jours à Abidjan · Paiement à la livraison ou Mobile Money</p>'+
    '<nav aria-label="Informations légales"><ul>'+
    '<li><a href="mentions-legales.html">Mentions légales</a></li>'+
    '<li><a href="conditions-de-vente.html">Conditions de vente</a></li>'+
    '<li><a href="confidentialite.html#confidentialite">Confidentialité</a></li>'+
    '<li><a href="confidentialite.html#cookies">Cookies</a></li>'+
    '<li><a href="confidentialite.html#remboursement">Échange et remboursement</a></li>'+
    '</ul></nav>'+
    '<p>© 2026 '+shop+' — '+K.esc(K.cfg.address||'')+'</p>'+
    '<p style="margin-top:4px">'+K.esc(K.cfg.phone||'')+(K.cfg.email?' · '+K.esc(K.cfg.email):'')+'</p></footer>';
};

/* ---------- Navigation ---------- */
K.go=function(v,a){
  K.state.view=v;
  K.state.arg=a;
  var app=K.$('#app');
  var f=K.views[v];
  if(!f){app.innerHTML='<div class="load">Page indisponible.</div>';return;}
  app.innerHTML='';
  try{f(app,a);}
  catch(e){K.fatal('Erreur d\'affichage : '+e.message);}
  document.title=K.titles[v]?K.titles[v]+' | '+(K.cfg.shop_name||'KBZ SHOP'):K.baseTitle;
  K.renderHd();
  window.scrollTo(0,0);
  app.setAttribute('tabindex','-1');
  try{app.focus({preventScroll:true});}catch(x){}
};
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-go]');
  if(t){e.preventDefault();K.go(t.getAttribute('data-go'),t.getAttribute('data-arg'));}
});

/* ---------- Demarrage ---------- */
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
