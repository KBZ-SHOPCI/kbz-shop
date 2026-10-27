(function(){
'use strict';
var C=window.KBZ_CONFIG||{};
var K=window.K={views:{},cfg:{},sb:null,
  state:{products:[],user:null,staff:null,view:'home',arg:null,cat:'all',q:''}};

K.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
K.fmt=function(n){return new Intl.NumberFormat('fr-FR').format(n||0)+' FCFA';};
K.$=function(s,r){return(r||document).querySelector(s);};
K.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
K.toast=function(m,bad){
  var t=document.createElement('div');
  t.className='toast'+(bad?' bad':'');
  t.textContent=m;
  document.body.appendChild(t);
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
  if(a)a.innerHTML='<div class="wrap"><div class="box center"><p><b>Oups, le site ne peut pas se charger.</b></p><p class="mut" style="margin-top:8px">'+K.esc(msg)+'</p><p style="margin-top:12px"><button class="btn s" onclick="location.reload()">Réessayer</button></p></div></div>';
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
  h.innerHTML='<div class="topbar">🚀 Livraison à Abidjan | WhatsApp : +'+K.esc(K.cfg.whatsapp||'')+'</div>'+
    '<header class="hd"><div class="wrap">'+
    '<div class="logo" data-go="home"><i>K</i><span>'+K.esc(K.cfg.shop_name||'KBZ SHOP')+'</span></div>'+
    '<div class="nav"><button data-go="shop">Boutique</button>'+
    '<button class="cartb" data-go="cart">🛍️'+(n?'<span class="badge">'+n+'</span>':'')+'</button></div>'+
    '</div></header>';
};
K.renderFt=function(){
  var f=K.$('#ft');
  if(!f)return;
  f.innerHTML='<footer class="ft"><p>© 2026 '+K.esc(K.cfg.shop_name||'KBZ SHOP')+' — '+K.esc(K.cfg.address||'')+'</p>'+
    '<p>'+K.esc(K.cfg.phone||'')+(K.cfg.email?' · '+K.esc(K.cfg.email):'')+'</p>'+
    '<p style="margin-top:10px"><button data-go="admin">🔐 Espace Vendeur</button></p></footer>';
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
  K.renderHd();
  window.scrollTo(0,0);
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
  K.go('home');
};
window.addEventListener('load',K.boot);
})();
// FIN app.js
