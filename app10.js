(function(){
'use strict';
var K=window.K,esc=K.esc,$=K.$;
K.tabs=K.tabs||{};
var BK=(window.KBZ_CONFIG||{}).PHOTO_BUCKET||'product-photos',MAX=10,S=null,busy=false;
function cv(k,d){var v=K.cfg[k];return v==null||v===''?d:v;}
function load(){
  var a=[];
  try{var v=K.cfg.banner_photos;a=typeof v==='string'?JSON.parse(v):(Array.isArray(v)?v:[]);}catch(e){a=[];}
  S={on:cv('banner_on','1')!=='0',auto:cv('banner_auto','1')!=='0',title:cv('banner_title','Ton style, ton choix.'),
    text:cv('banner_text','Découvre notre sélection de vêtements et d\'accessoires tendance.'),
    btn:cv('banner_btn','Découvrir la boutique'),link:cv('banner_link','#cat'),
    ph:(a||[]).filter(function(x){return x&&x.u;})};
}
function coll(el){
  S.on=$('#bo',el).checked;S.auto=$('#bu',el).checked;
  S.title=$('#bt',el).value.trim();S.text=$('#bx',el).value.trim();
  S.btn=$('#bb',el).value.trim();S.link=$('#bl',el).value.trim()||'#cat';
  K.$$('[data-k]',el).forEach(function(c){var p=S.ph[+c.getAttribute('data-k')];if(p)p.k=c.checked?1:0;});
}
async function save(){
  var rows=[['banner_on',S.on?'1':'0'],['banner_auto',S.auto?'1':'0'],['banner_title',S.title],['banner_text',S.text],
    ['banner_btn',S.btn],['banner_link',S.link],['banner_photos',JSON.stringify(S.ph)]]
    .map(function(r){return{key:r[0],value:r[1]};});
  var r=await K.sb.from('settings').upsert(rows,{onConflict:'key'});
  if(r.error)throw new Error(r.error.message);
  rows.forEach(function(x){K.cfg[x.key]=x.value;});
}
function comp(file){
  return new Promise(function(ok,ko){
    var img=new Image(),u=URL.createObjectURL(file);
    img.onload=function(){
      var s=Math.min(1,900/Math.max(img.naturalWidth,img.naturalHeight));
      var c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(img.naturalWidth*s));c.height=Math.max(1,Math.round(img.naturalHeight*s));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(u);
      var t=false;
      try{
        var m=document.createElement('canvas');m.width=m.height=24;
        var g=m.getContext('2d');g.drawImage(c,0,0,24,24);
        var d=g.getImageData(0,0,24,24).data,n=0;
        for(var i=3;i<d.length;i+=4)if(d[i]<200)n++;
        t=n>40;
      }catch(e){}
      c.toBlob(function(b){b?ok({b:b,t:t}):ko(new Error('Image illisible'));},'image/webp',0.85);
    };
    img.onerror=function(){URL.revokeObjectURL(u);ko(new Error('Image illisible'));};
    img.src=u;
  });
}
async function up(b){
  var ext=b.type==='image/webp'?'webp':'png';
  var path='banner/'+Date.now()+'-'+Math.floor(Math.random()*1e5)+'.'+ext;
  var r=await K.sb.storage.from(BK).upload(path,b,{contentType:b.type,cacheControl:'31536000'});
  if(r.error)throw new Error(r.error.message);
  return K.sb.storage.from(BK).getPublicUrl(path).data.publicUrl;
}
async function del(u){
  try{
    var p=String(u).split('/'+BK+'/')[1];
    if(p)await K.sb.storage.from(BK).remove([decodeURIComponent(p)]);
  }catch(e){}
}
var CK='background:repeating-conic-gradient(#e5e9f2 0 25%,#fff 0 50%) 50%/14px 14px';
function draw(el){
  var h='<div class="box"><h3 style="font-size:18px;margin-bottom:6px">Bannière de l\'accueil</h3><p class="mut">Les photos défilent seules toutes les 5 secondes, dans l\'arche bleue, à droite du texte. Chaque changement est enregistré tout de suite.</p>'+
    '<div class="line"><div class="t"><b>Afficher la bannière</b></div><input type="checkbox" id="bo"'+(S.on?' checked':'')+' style="width:22px;height:22px"></div>'+
    '<div class="line"><div class="t"><b>Défilement automatique</b></div><input type="checkbox" id="bu"'+(S.auto?' checked':'')+' style="width:22px;height:22px"></div></div>'+
    '<div class="box"><h3 style="font-size:18px;margin-bottom:6px">Textes</h3>'+
    '<label>Titre</label><input id="bt" maxlength="60" value="'+esc(S.title)+'">'+
    '<label>Description</label><input id="bx" maxlength="140" value="'+esc(S.text)+'">'+
    '<label>Texte du bouton</label><input id="bb" maxlength="30" value="'+esc(S.btn)+'">'+
    '<label>Lien du bouton</label><input id="bl" maxlength="200" value="'+esc(S.link)+'"><p class="mut" style="margin-top:4px">#cat = descend vers les articles ; cats = page Catégories ; ou une adresse https://…</p>'+
    '<button class="btn full" style="margin-top:12px" id="sv">Enregistrer les textes</button></div>'+
    '<div class="box"><h3 style="font-size:18px;margin-bottom:6px">Photos ('+S.ph.length+'/'+MAX+')</h3>'+
    (S.ph.length?'':'<p class="mut">Aucune photo envoyée : la bannière montre pour l\'instant des photos de tes articles.</p>')+
    S.ph.map(function(p,i){
      return'<div class="line" style="flex-wrap:wrap;gap:8px"><div style="width:72px;height:72px;border-radius:12px;overflow:hidden;flex:none;'+CK+'"><img src="'+esc(p.u)+'" alt="Photo '+(i+1)+'" style="width:100%;height:100%;object-fit:contain"></div>'+
        '<div class="t"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-k="'+i+'"'+(p.k?' checked':'')+' style="width:20px;height:20px"> Détourée (sans fond)</label></div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn alt s" data-up="'+i+'" aria-label="Monter la photo '+(i+1)+'"'+(i?'':' disabled')+'>↑</button><button class="btn alt s" data-dn="'+i+'" aria-label="Descendre la photo '+(i+1)+'"'+(i<S.ph.length-1?'':' disabled')+'>↓</button><button class="btn alt s" data-rp="'+i+'">Remplacer</button><button class="btn bad s" data-rm="'+i+'">Supprimer</button></div></div>';
    }).join('')+
    (S.ph.length<MAX?'<button class="btn full" style="margin-top:12px" id="ba">Ajouter des photos</button>':'<p class="mut">Maximum atteint : supprime une photo pour en ajouter.</p>')+
    '<input type="file" id="fa" accept="image/*" multiple hidden><input type="file" id="fr" accept="image/*" hidden>'+
    '<p class="mut" style="margin-top:8px">Conseil : une photo détourée (fond transparent) donne le plus beau rendu. Les photos sont réduites automatiquement pour ménager ton espace gratuit.</p></div>';
  el.innerHTML=h;
  var rep=-1;
  function run(f){
    return async function(){
      if(busy)return;
      busy=true;
      try{await f();}catch(err){K.toast(err.message,1);}
      busy=false;
    };
  }
  el.onclick=function(e){
    var b=e.target.closest('button');
    if(!b)return;
    if(b.id==='ba'){$('#fa',el).click();return;}
    var g=function(a){return b.getAttribute(a);};
    if(g('data-rp')!=null){rep=+g('data-rp');$('#fr',el).click();return;}
    run(async function(){
      coll(el);
      if(b.id==='sv'){await save();K.toast('Textes enregistrés ✓');return;}
      var u=g('data-up'),d=g('data-dn'),r=g('data-rm');
      if(u!=null||d!=null){
        var i=+(u!=null?u:d),j=u!=null?i-1:i+1,t=S.ph[i];
        if(!S.ph[j])return;
        S.ph[i]=S.ph[j];S.ph[j]=t;
        await save();draw(el);return;
      }
      if(r!=null){
        if(!confirm('Supprimer cette photo de la bannière ?'))return;
        var old=S.ph.splice(+r,1)[0];
        await save();await del(old.u);draw(el);K.toast('Photo supprimée');
      }
    })();
  };
  el.onchange=function(e){
    var t=e.target;
    run(async function(){
      coll(el);
      if(t.id==='fa'){
        var fs=[].slice.call(t.files).slice(0,MAX-S.ph.length);
        if(!fs.length)return;
        K.toast('Envoi en cours…');
        for(var i=0;i<fs.length;i++){
          var c=await comp(fs[i]);
          S.ph.push({u:await up(c.b),k:c.t?1:0});
        }
        await save();draw(el);K.toast('Photos ajoutées ✓');
        return;
      }
      if(t.id==='fr'){
        if(rep<0||!t.files[0])return;
        K.toast('Envoi en cours…');
        var c2=await comp(t.files[0]),old=S.ph[rep].u;
        S.ph[rep]={u:await up(c2.b),k:c2.t?1:0};
        await save();await del(old);draw(el);K.toast('Photo remplacée ✓');
        return;
      }
      if(t.id==='bo'||t.id==='bu'||t.getAttribute('data-k')!=null){await save();K.toast('Enregistré ✓');}
    })();
  };
}
K.tabs.banner={label:'Bannière',roles:['admin'],order:3,render:function(el){load();draw(el);}};
})();
// FIN app10.js
