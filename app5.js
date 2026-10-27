(function(){
'use strict';
var K=window.K,$=K.$,esc=K.esc,C=window.KBZ_CONFIG||{};
var BK=C.PHOTO_BUCKET||'product-photos';
function chk(r){if(r.error)throw new Error(r.error.message);return r.data;}

function shrink(file){
  return new Promise(function(res,rej){
    var img=new Image(),u=URL.createObjectURL(file);
    img.onload=function(){
      var s=Math.min(1,1000/Math.max(img.width,img.height));
      var c=document.createElement('canvas');
      c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(u);
      c.toBlob(function(b){b?res(b):rej(new Error('Photo illisible'));},'image/jpeg',0.8);
    };
    img.onerror=function(){rej(new Error('Photo illisible'));};
    img.src=u;
  });
}
async function upload(file){
  var b=await shrink(file);
  var path='p/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.jpg';
  chk(await K.sb.storage.from(BK).upload(path,b,{contentType:'image/jpeg'}));
  return K.sb.storage.from(BK).getPublicUrl(path).data.publicUrl;
}
function blankV(){return{color:'',size:'',stock:0,price:''};}
function blank(){
  return{id:null,p:{name:'',category:'',description:'',base_price:'',promo_price:'',visible:true},
    images:[],variants:[blankV()],rmImg:[],rmVar:[]};
}
function fromP(p){
  return{id:p.id,
    p:{name:p.name,category:p.category,description:p.description,base_price:p.base_price,
       promo_price:p.promo_price==null?'':p.promo_price,visible:p.visible},
    images:K.images(p).map(function(i){return{id:i.id,url:i.url,color:i.color};}),
    variants:(p.product_variants||[]).map(function(v){
      return{id:v.id,color:v.color,size:v.size,stock:v.stock,price:v.price==null?'':v.price};}),
    rmImg:[],rmVar:[]};
}

function editor(tab,E){
  var m=document.createElement('div');
  m.className='modal';
  document.body.appendChild(m);
  var adm=K.state.staff.role==='admin';
  var cats=[];
  K.state.products.forEach(function(p){if(p.category&&cats.indexOf(p.category)<0)cats.push(p.category);});

  function draw(){
    var P=E.p;
    var h='<div class="sheet"><div class="row"><h3>'+(E.id?'Modifier l\'article':'Nouvel article')+'</h3><button class="btn alt s" data-x="close">✕</button></div>';
    h+='<label>Nom *</label><input data-p="name" maxlength="120" value="'+esc(P.name)+'">';
    h+='<label>Catégorie</label><input data-p="category" list="cats" maxlength="40" value="'+esc(P.category)+'"><datalist id="cats">'+cats.map(function(c){return '<option value="'+esc(c)+'">';}).join('')+'</datalist>';
    h+='<label>Description</label><textarea data-p="description" rows="3" maxlength="1500">'+esc(P.description)+'</textarea>';
    h+='<div class="two"><div><label>Prix (FCFA) *</label><input data-p="base_price" type="number" min="0" value="'+esc(P.base_price)+'"></div><div><label>Prix promo (facultatif)</label><input data-p="promo_price" type="number" min="0" value="'+esc(P.promo_price)+'"></div></div>';
    h+='<label><input type="checkbox" data-p="visible" style="width:auto"'+(P.visible?' checked':'')+'> Visible dans la boutique</label>';
    h+='<label>Photos (8 maximum). Touchez une photo pour lui donner une couleur.</label><div class="thumbs-ed">'+E.images.map(function(im,i){
      return '<div class="im"><img data-pi="'+i+'" src="'+esc(im.url)+'" alt=""><b data-del="'+i+'">✕</b><span class="mut" style="font-size:10px;display:block;text-align:center">'+esc(im.color||'toutes')+'</span></div>';}).join('')+'</div>';
    h+='<input type="file" id="fi" accept="image/*" multiple style="margin-top:8px">';
    h+='<label>Couleurs, tailles et stock</label>'+E.variants.map(function(v,i){
      return '<div class="vr"><input data-v="'+i+'" data-k="color" placeholder="Couleur" value="'+esc(v.color)+'"><input data-v="'+i+'" data-k="size" placeholder="Taille" value="'+esc(v.size)+'"><input data-v="'+i+'" data-k="stock" type="number" min="0" placeholder="Stock" value="'+esc(v.stock)+'"><input data-v="'+i+'" data-k="price" type="number" min="0" placeholder="Prix" value="'+esc(v.price)+'"><button class="btn bad s" data-rv="'+i+'">✕</button></div>';}).join('');
    h+='<button class="btn alt s" data-x="addv">+ Ajouter une variante</button><p class="mut" style="margin-top:6px">Article sans couleur ni taille : laissez ces deux cases vides et indiquez seulement le stock. Le prix d\'une variante est facultatif. Pour qu\'une photo s\'affiche avec une couleur, écrivez la couleur exactement comme dans la variante.</p>';
    h+='<button class="btn full" style="margin-top:14px" data-x="save">Enregistrer</button>';
    if(adm&&E.id)h+='<button class="btn bad full" style="margin-top:8px" data-x="delp">Supprimer l\'article</button>';
    h+='<p class="err" id="pe"></p></div>';
    m.innerHTML=h;
  }

  async function save(){
    var P=E.p,er=$('#pe',m),i;
    er.textContent='';
    var name=String(P.name).trim(),bp=parseInt(P.base_price,10);
    var pp=P.promo_price===''?null:parseInt(P.promo_price,10);
    if(name.length<2){er.textContent='Le nom est obligatoire.';return;}
    if(isNaN(bp)||bp<0){er.textContent='Prix invalide.';return;}
    if(pp!==null&&(isNaN(pp)||pp<0||pp>=bp)){er.textContent='Le prix promo doit être inférieur au prix.';return;}
    var seen={},vs=[];
    for(i=0;i<E.variants.length;i++){
      var v=E.variants[i],c=String(v.color).trim(),s=String(v.size).trim();
      var st=parseInt(v.stock,10),pr=v.price===''?null:parseInt(v.price,10);
      if(isNaN(st)||st<0){er.textContent='Stock invalide (ligne '+(i+1)+').';return;}
      if(pr!==null&&(isNaN(pr)||pr<0)){er.textContent='Prix de variante invalide (ligne '+(i+1)+').';return;}
      if(seen[c+'|'+s]){er.textContent='Deux variantes identiques (même couleur et même taille).';return;}
      seen[c+'|'+s]=1;
      vs.push({idx:i,color:c,size:s,stock:st,price:pr});
    }
    var btn=$('[data-x="save"]',m);
    btn.disabled=true;
    try{
      var row={name:name,category:String(P.category).trim(),description:String(P.description).trim(),
        base_price:bp,promo_price:pp,visible:!!P.visible};
      if(E.id)chk(await K.sb.from('products').update(row).eq('id',E.id));
      else E.id=chk(await K.sb.from('products').insert(row).select('id').single()).id;
      if(E.rmImg.length){chk(await K.sb.from('product_images').delete().in('id',E.rmImg));E.rmImg=[];}
      for(i=0;i<E.images.length;i++){
        var im=E.images[i];
        if(im.id)chk(await K.sb.from('product_images').update({color:im.color,position:i}).eq('id',im.id));
        else im.id=chk(await K.sb.from('product_images').insert({product_id:E.id,url:im.url,color:im.color,position:i}).select('id').single()).id;
      }
      if(E.rmVar.length){chk(await K.sb.from('product_variants').delete().in('id',E.rmVar));E.rmVar=[];}
      for(i=0;i<vs.length;i++){
        var x=vs[i],ev=E.variants[x.idx],d={color:x.color,size:x.size,stock:x.stock,price:x.price};
        if(ev.id)chk(await K.sb.from('product_variants').update(d).eq('id',ev.id));
        else{d.product_id=E.id;ev.id=chk(await K.sb.from('product_variants').insert(d).select('id').single()).id;}
      }
      await K.loadProducts();
      m.remove();
      K.toast('Enregistré ✓');
      K.tabs.products.render(tab);
    }catch(x2){
      er.textContent=/duplicate/i.test(x2.message)?'Deux variantes identiques.':x2.message;
      btn.disabled=false;
    }
  }
  async function del(){
    if(!confirm('Supprimer définitivement cet article, ses photos et ses variantes ?'))return;
    if(!confirm('Dernière confirmation : cette suppression est irréversible.'))return;
    try{
      chk(await K.sb.from('products').delete().eq('id',E.id));
      await K.loadProducts();
      m.remove();
      K.toast('Article supprimé');
      K.tabs.products.render(tab);
    }catch(x){$('#pe',m).textContent=x.message;}
  }

  m.oninput=function(e){
    var t=e.target,p=t.getAttribute('data-p'),v=t.getAttribute('data-v');
    if(p)E.p[p]=t.type==='checkbox'?t.checked:t.value;
    else if(v!==null)E.variants[+v][t.getAttribute('data-k')]=t.value;
  };
  m.onchange=async function(e){
    if(e.target.id!=='fi')return;
    var files=[].slice.call(e.target.files),er=$('#pe',m);
    er.textContent='Envoi des photos…';
    for(var i=0;i<files.length&&E.images.length<8;i++){
      try{E.images.push({url:await upload(files[i]),color:''});}
      catch(x){draw();$('#pe',m).textContent=x.message;return;}
    }
    draw();
  };
  m.onclick=async function(e){
    var t=e.target;
    if(t===m){m.remove();return;}
    var d=t.getAttribute('data-del'),pi=t.getAttribute('data-pi');
    var rv=t.getAttribute('data-rv'),x=t.getAttribute('data-x');
    if(d!==null){
      if(confirm('Retirer cette photo ?')){
        var im=E.images.splice(+d,1)[0];
        if(im.id)E.rmImg.push(im.id);
        draw();
      }
    }else if(pi!==null){
      var c=prompt('Couleur de cette photo (vide = toutes les couleurs)',E.images[+pi].color);
      if(c!==null){E.images[+pi].color=c.trim();draw();}
    }else if(rv!==null){
      var vv=E.variants.splice(+rv,1)[0];
      if(vv.id)E.rmVar.push(vv.id);
      if(!E.variants.length)E.variants.push(blankV());
      draw();
    }else if(x==='close')m.remove();
    else if(x==='addv'){E.variants.push(blankV());draw();}
    else if(x==='save')await save();
    else if(x==='delp')await del();
  };
  draw();
}

K.tabs.products={label:'Produits',roles:['admin','products'],order:2,render:function(el){
  var P=K.state.products;
  var h='<button class="btn full" data-new="1">+ Nouvel article</button><div style="margin-top:12px">';
  h+=P.length?P.map(function(p){
    return '<div class="box line" data-p="'+p.id+'" style="cursor:pointer"><img src="'+esc(K.cover(p))+'" alt=""><div class="t"><b>'+esc(p.name)+'</b><div class="mut">'+esc(p.category)+' · stock '+K.stock(p)+(p.visible?'':' · masqué')+'</div><div class="price">'+K.fmt(K.price(p))+'</div></div></div>';
  }).join(''):'<p class="mut center">Aucun article. Touchez « Nouvel article ».</p>';
  el.innerHTML=h+'</div>';
  el.onclick=function(e){
    if(e.target.closest('[data-new]')){editor(el,blank());return;}
    var b=e.target.closest('[data-p]');
    if(b){
      var p=K.state.products.filter(function(x){return x.id===b.getAttribute('data-p');})[0];
      if(p)editor(el,fromP(p));
    }
  };
}};
})();
// FIN app5.js
