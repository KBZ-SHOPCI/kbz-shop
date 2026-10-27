(function(){
'use strict';
var K=window.K,$=K.$,esc=K.esc;
K.tabs=K.tabs||{};
var RN={orders:'Gestionnaire des commandes',products:'Gestionnaire des produits',admin:'Administrateur'};
var SN={en_attente:'En attente',activee:'Activée',annulee:'Annulée',expiree:'Expirée'};
var last=null;

function norm(p){
  var d=String(p||'').replace(/\D/g,'');
  return(d.length===10&&d[0]==='0')?'225'+d:d;
}
function box(){
  if(!last)return '';
  var link=location.origin+'/activer.html#'+last.token;
  var msg='Bonjour '+last.name+', tu es invité(e) à rejoindre l\'équipe '+(K.cfg.shop_name||'KBZ SHOP')+' comme '+RN[last.role].toLowerCase()+'.\n\nOuvre ce lien personnel (valable jusqu\'au '+new Date(last.expires_at).toLocaleString('fr-FR')+', à usage unique) :\n'+link+'\n\nTu recevras le code à 6 chiffres séparément.';
  return '<div class="box" style="border-color:var(--gold)"><b>Invitation prête pour '+esc(last.name)+'</b><p class="mut" style="margin:6px 0">1) Envoie le lien par WhatsApp. 2) Donne-lui le code ci-dessous <b>séparément</b> (appel ou SMS). Ce code ne sera plus affiché ensuite.</p><div class="stat center" style="margin:10px 0"><span class="mut">Code à 6 chiffres</span><b style="letter-spacing:6px;font-size:30px">'+esc(last.code)+'</b></div><a class="btn wa full" target="_blank" rel="noopener" href="https://wa.me/'+esc(last.phone)+'?text='+encodeURIComponent(msg)+'">Envoyer le lien par WhatsApp</a><p style="margin-top:8px"><button class="btn alt s" data-x="hide">Masquer</button></p></div>';
}

K.tabs.team={label:'Équipe',roles:['admin'],order:5,render:async function(el){
  el.innerHTML='<div class="load">Chargement…</div>';
  var inv=[],st=[];
  try{
    inv=await K.rpc('admin_list_invitations');
    st=await K.rpc('admin_list_staff');
  }catch(e){el.innerHTML='<p class="err">'+esc(e.message)+'</p>';return;}
  var h=box();
  h+='<div class="box"><h3 style="font-size:18px;margin-bottom:6px">Inviter un collaborateur</h3><p class="mut">Un lien personnel, temporaire et à usage unique sera préparé pour WhatsApp. Le collaborateur choisira lui-même son mot de passe.</p><label>Nom</label><input id="tn" name="kbz_inv_n" maxlength="60" autocomplete="off"><label>Adresse e-mail</label><input id="te" name="kbz_inv_e" type="email" autocomplete="off"><label>Numéro WhatsApp</label><input id="tp" name="kbz_inv_p" type="tel" autocomplete="off" placeholder="Ex. : 0701020304"><label>Rôle</label><select id="tr"><option value="orders">Gestionnaire des commandes</option><option value="products">Gestionnaire des produits</option></select><label>Durée de validité du lien</label><select id="th"><option value="24">24 heures</option><option value="48" selected>48 heures</option><option value="72">72 heures</option></select><button class="btn full" style="margin-top:14px" data-x="inv">Préparer l\'invitation WhatsApp</button></div>';
  h+='<div class="box"><h3 style="font-size:18px;margin-bottom:6px">Équipe ('+st.length+')</h3>'+st.map(function(s){
    var adm=s.role==='admin';
    return '<div class="line" style="flex-wrap:wrap"><div class="t"><b>'+esc(s.display_name||s.email)+'</b><div class="mut">'+esc(s.email)+' · '+esc(RN[s.role]||s.role)+(s.active?'':' · désactivé')+'</div></div>'+(adm?'':'<select data-r="'+s.user_id+'" style="width:auto"><option value="orders"'+(s.role==='orders'?' selected':'')+'>Commandes</option><option value="products"'+(s.role==='products'?' selected':'')+'>Produits</option></select><button class="btn s'+(s.active?' bad':'')+'" data-t="'+s.user_id+'" data-a="'+(s.active?0:1)+'">'+(s.active?'Désactiver':'Réactiver')+'</button>')+'</div>';
  }).join('')+'</div>';
  h+='<div class="box"><h3 style="font-size:18px;margin-bottom:6px">Invitations</h3>'+(inv.length?inv.map(function(i){
    return '<div class="line"><div class="t"><b>'+esc(i.name)+'</b> <span class="st '+(i.status==='activee'?'livree':(i.status==='en_attente'?'nouvelle':'annulee'))+'">'+SN[i.status]+'</span><div class="mut">'+esc(RN[i.role])+' · jusqu\'au '+new Date(i.expires_at).toLocaleString('fr-FR')+'</div></div>'+(i.status==='en_attente'?'<button class="btn alt s" data-v="'+i.id+'">Annuler</button>':'')+'</div>';
  }).join(''):'<p class="mut">Aucune invitation.</p>')+'</div>';
  el.innerHTML=h;

  function again(){K.tabs.team.render(el);}
  el.onclick=async function(e){
    var b=e.target.closest('[data-x],[data-v],[data-t]');
    if(!b)return;
    try{
      if(b.getAttribute('data-x')==='hide'){last=null;again();return;}
      if(b.getAttribute('data-x')==='inv'){
        var name=$('#tn',el).value.trim(),mail=$('#te',el).value.trim();
        var ph=norm($('#tp',el).value),role=$('#tr',el).value,hrs=parseInt($('#th',el).value,10);
        b.disabled=true;
        var r=await K.rpc('admin_create_invitation',{p_name:name,p_email:mail,p_phone:ph,p_role:role,p_hours:hrs});
        last={name:name,role:role,phone:ph,token:r.token,code:r.code,expires_at:r.expires_at};
        K.toast('Invitation prête ✓');
        again();return;
      }
      if(b.getAttribute('data-v')){
        if(!confirm('Annuler cette invitation ?'))return;
        await K.rpc('admin_revoke_invitation',{p_id:b.getAttribute('data-v')});
        K.toast('Invitation annulée');again();return;
      }
      if(b.getAttribute('data-t')){
        var id=b.getAttribute('data-t'),on=b.getAttribute('data-a')==='1';
        if(!on&&!confirm('Désactiver ce collaborateur ? Il ne pourra plus accéder à l\'espace vendeur.'))return;
        var sel=$('[data-r="'+id+'"]',el);
        await K.rpc('admin_set_staff',{p_user:id,p_role:sel.value,p_active:on});
        K.toast(on?'Réactivé ✓':'Désactivé');again();
      }
    }catch(err){K.toast(err.message,1);b.disabled=false;}
  };
  el.onchange=async function(e){
    var s=e.target.getAttribute&&e.target.getAttribute('data-r');
    if(!s)return;
    var row=st.filter(function(x){return x.user_id===s;})[0];
    try{
      await K.rpc('admin_set_staff',{p_user:s,p_role:e.target.value,p_active:row?row.active:true});
      K.toast('Rôle modifié ✓');again();
    }catch(err){K.toast(err.message,1);again();}
  };
}};
})();
// FIN app7.js
