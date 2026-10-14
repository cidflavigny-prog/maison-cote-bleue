/* ---------- Utilitaires d’interface ---------- */
function $(id){return document.getElementById(id)}
function el(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==="text")e.textContent=attrs[k];else if(k==="class")e.className=attrs[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),attrs[k]);else if(attrs[k]!==undefined&&attrs[k]!==null)e.setAttribute(k,attrs[k])}(kids||[]).forEach(function(c){if(c!=null)e.appendChild(typeof c==="string"?document.createTextNode(c):c)});return e}
function nf(n){return n==null||isNaN(n)?"–":Number(n).toLocaleString("fr-FR")}
function pct(x){return x==null||isNaN(x)?"–":(x*100).toLocaleString("fr-FR",{maximumFractionDigits:1})+" %"}
var toastT;function toast(msg){var t=$("toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true},2800)}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function copyText(txt,okMsg,fallbackEl){var p=navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(txt):Promise.reject();return p.then(function(){toast(okMsg)},function(){if(fallbackEl){fallbackEl.focus();if(fallbackEl.select)fallbackEl.select()}toast("Copie impossible ici : sélectionne le texte à la main")})}
$("today-label").textContent="@maison.cotebleue · "+frDate(todayIso());

/* ---------- État ---------- */
var S={ideas:[],posts:[],stats:[],recaps:[],comptes:[],reseaux:null,meteo:{},sync:null,filter:"nouvelle",selecting:false,sel:{},weekOff:0,db:null,assets:null,downloads:null,sample:null};
function blankPost(){return{id:null,format:"post",type:"agenda",village:"cotebleue",pill:"",sticker:"",titre:"",details:"",legende:"",datePrevue:"",source:"",photoId:null,ideeIds:[],rows:[],compteur:"",visuel:"logo",villages:[],meteoDate:"",statut:"brouillon"}}
var P=blankPost();
function draw(force){if($("v-atelier").hidden&&!force)return;$("preview").classList.toggle("story",P.format==="story"||P.type==="meteo"||P.type==="jour");render(P,S.meteo[P.meteoDate])}
window.__redraw=function(){draw()};

/* ---------- Navigation ---------- */
var VIEWS=["semaine","idees","atelier","stats"];
function show(v){VIEWS.forEach(function(x){$("v-"+x).hidden=x!==v});document.querySelectorAll(".tabs button").forEach(function(b){if(b.dataset.view===v)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});store("mcb-tab",v);window.scrollTo(0,0);if(v==="atelier")draw()}
document.querySelectorAll(".tabs button").forEach(function(b){b.addEventListener("click",function(){show(b.dataset.view)})});
(function(){var h=(location.hash||"").slice(1);show(VIEWS.indexOf(h)>=0?h:"semaine")})();
Promise.all(["600 100px Fredoka","800 40px Nunito","400 40px Nunito","700 40px Nunito","600 40px Nunito"].map(function(f){return document.fonts.load(f)})).then(function(){draw()},function(){draw()});

/* ---------- Ma semaine : rendez-vous ---------- */
function postMatch(day,type,format,village){var per=isList(type)?period(type,day).from:null;return S.posts.find(function(p){if(p.type!==type||(p.format||"post")!==format||(village&&p.village!==village)||!p.datePrevue)return false;return per?period(type,p.datePrevue).from===per&&Math.abs(parseIso(p.datePrevue)-parseIso(day))<6*864e5:p.datePrevue===day})}
function candidates(p){return S.ideas.filter(function(i){var st=i.statut||"nouvelle";if(st==="ecartee"||isPast(i))return false;var a=i.quand,b=i.fin||i.quand;if(!a)return false;return a<=p.to&&b>=p.from}).sort(function(x,y){return(x.quand||"").localeCompare(y.quand||"")||((x.aVerifier?1:0)-(y.aVerifier?1:0))})}
var METEO_DEBUT="2026-10-15"; /* première story météo : jeudi 15 octobre au soir */
function rdvsFor(day){var wd=parseIso(day).getDay(),out=[];
  if(wd===0){out.push({type:"semaine",format:"post",label:"Agenda de la semaine",sub:"post · lun. "+parseIso(addDays(day,1)).getDate()+" → dim. "+parseIso(addDays(day,7)).getDate()});
    var counts={};candidates(period("semaine",day)).forEach(function(i){if(i.village&&i.village!=="cotebleue")counts[i.village]=(counts[i.village]||0)+1});
    V4.forEach(function(k){if(counts[k]>=3)out.push({type:"semaine",format:"story",village:k,label:"Story « Ça bouge à "+vil(k).short+" »",sub:counts[k]+" événements dans ce village"})})}
  if(wd===4){out.push({type:"weekend",format:"post",label:"Agenda du week-end",sub:"post · sam. et dim."});out.push({type:"weekend",format:"story",label:"Agenda du week-end",sub:"story"})}
  if(day>=METEO_DEBUT)out.push({type:"meteo",format:"story",label:"Météo de demain",sub:"story · 18h",meteoDate:addDays(day,1)});return out}
function rdvStatus(r,day,p){if(p)return p.statut==="publie"?["Publié","st-done"]:[p.auto?"Prêt à vérifier":"Brouillon","st-ready"];
  if(r.type==="meteo")return S.meteo[r.meteoDate]?["Prévisions prêtes","st-ready"]:(day<todayIso()?["Passé","st-wait"]:["Prévisions à 17h30","st-wait"]);
  return day<todayIso()?["Non fait","st-wait"]:["À créer","st-todo"]}
function openRdv(r,day){var p=postMatch(day,r.type,r.format,r.village);if(p)return openPost(p);
  P=blankPost();P.type=r.type;P.format=r.format;P.datePrevue=day;if(r.village)P.village=r.village;if(r.meteoDate)P.meteoDate=r.meteoDate;if(isList(r.type))autoFill();syncForm();show("atelier");$("atelier-lead").textContent=r.label+" du "+frDate(day)+" : vérifie, ajuste puis enregistre."}
var ICO={semaine:["S",SOLEIL],weekend:["WE",SOLEIL],meteo:["☀",CIEL]};
function renderWeek(){var mon=addDays(mondayOf(todayIso()),7*S.weekOff),today=todayIso();var box=$("days");box.textContent="";
  $("week-title").textContent=S.weekOff===0?"Cette semaine":S.weekOff===1?"Semaine prochaine":S.weekOff===-1?"Semaine dernière":"Semaine du "+frDate(mon);
  var used={};
  for(var i=0;i<7;i++){(function(day){var dc=el("div",{class:"dayc"+(day===today?" today":"")+(day<today?" past":"")});dc.appendChild(el("div",{class:"dh"},[el("span",{text:JOURSL[parseIso(day).getDay()]+" "+parseIso(day).getDate()+" "+MOIS[parseIso(day).getMonth()]}),day===today?el("small",{text:"aujourd’hui"}):null]));
    rdvsFor(day).forEach(function(r){var p=postMatch(day,r.type,r.format,r.village);if(p)used[p.id]=1;var st=rdvStatus(r,day,p);var ic=ICO[r.type]||["•",CIEL];
      dc.appendChild(el("button",{type:"button",class:"rdv",onclick:function(){openRdv(r,day)}},[el("span",{class:"ico",style:"background:"+(r.village?vil(r.village).color:ic[1])+(r.village?";color:#fff":""),text:r.village?vil(r.village).short[0]:ic[0]}),el("span",{class:"txt"},[el("b",{text:r.label}),el("small",{text:r.sub})]),el("span",{class:"st "+st[1],text:st[0]})]))});
    S.posts.filter(function(p){return p.datePrevue===day&&!used[p.id]}).forEach(function(p){used[p.id]=1;dc.appendChild(el("button",{type:"button",class:"rdv",onclick:function(){openPost(p)}},[el("span",{class:"ico",style:"background:"+(themeOf(p.type).bg===BLANC?CIEL:themeOf(p.type).bg)+";color:"+(p.type==="bonplan"?NUIT:"#fff"),text:"+"}),el("span",{class:"txt"},[el("b",{text:p.titre||typ(p.type).name}),el("small",{text:typ(p.type).name+" · "+(p.format==="story"?"story":"post")})]),el("span",{class:"st "+(p.statut==="publie"?"st-done":"st-ready"),text:p.statut==="publie"?"Publié":"Brouillon"})]))});
    box.appendChild(dc)})(addDays(mon,i))}
  var dr=$("drafts");dr.textContent="";var drafts=S.posts.filter(function(p){return p.statut!=="publie"&&!p.datePrevue});
  if(!drafts.length)dr.appendChild(el("div",{class:"empty",text:"Aucun brouillon sans date."}));
  drafts.forEach(function(p){dr.appendChild(el("button",{type:"button",class:"rdv",onclick:function(){openPost(p)}},[el("span",{class:"txt"},[el("b",{text:p.titre||typ(p.type).name}),el("small",{text:typ(p.type).name})])]))});
  var nm=S.sync&&S.sync.meteoOk===false;$("week-note").hidden=!nm;if(nm)$("week-note").textContent="La météo n’a pas pu être récupérée : "+(S.sync.meteoMessage||"erreur")+"."}
$("week-prev").onclick=function(){S.weekOff--;renderWeek()};$("week-next").onclick=function(){S.weekOff++;renderWeek()};$("week-now").onclick=function(){S.weekOff=0;renderWeek()};

/* ---------- Idées ---------- */
function ideaEnd(i){return i.fin||i.quand||""}
function isPast(i){var e=ideaEnd(i);return!!e&&e<todayIso()}
function inFilter(i){if(isPast(i))return false;var st=i.statut||"nouvelle";if(S.filter==="nouvelle")return st==="nouvelle"&&!i.aVerifier;if(S.filter==="verifier")return st==="nouvelle"&&!!i.aVerifier;return st===S.filter}
document.querySelectorAll("[data-filter]").forEach(function(b){b.addEventListener("click",function(){S.filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});renderIdeas()})});
function setIdea(id,patch,msg){S.db.collection("idees").doc(id).update(patch).then(function(){toast(msg)})}
function planDate(i,format){var t0=todayIso();if(format==="story")return t0;if(i.quand&&i.quand>=t0){var b=addDays(i.quand,-1);return b>=t0?b:t0}return t0}
function whenLabel(quand,ref){if(!quand)return"";var diff=Math.round((parseIso(quand)-parseIso(ref))/864e5);if(diff<0)return"";if(diff===0)return"Aujourd’hui";if(diff===1)return"Demain";var wd=parseIso(quand).getDay();if((wd===0||wd===6)&&diff<=6)return"Ce week-end";if(diff<=6)return JOURSL[wd].charAt(0).toUpperCase()+JOURSL[wd].slice(1);return JOURS[wd]+" "+parseIso(quand).getDate()+" "+MOIS[parseIso(quand).getMonth()]}
function ideaToPost(i,format){P=blankPost();P.format=format;P.type=TYPES[i.type]&&isSimple(i.type)?i.type:"agenda";P.village=VILLAGES[i.village]?i.village:"cotebleue";P.datePrevue=planDate(i,format);var t=typ(P.type);P.pill=(P.type==="agenda"?whenLabel(i.quand,P.datePrevue):"")||"";P.titre=i.titre||"";P.details=i.details||i.texte||"";P.source=i.sourceNom||"";P.ideeIds=[i.id];if(i.story&&format==="story")P.legende=i.story;syncForm();show("atelier");$("atelier-lead").textContent="Idée du "+frDate(i.date)+" chargée. Ajuste puis enregistre."}
function renderIdeas(){var list=$("idea-list");list.textContent="";
  var items=S.ideas.filter(inFilter).sort(function(a,b){return(a.quand||"9").localeCompare(b.quand||"9")||(b.date||"").localeCompare(a.date||"")});
  var live=S.ideas.filter(function(i){return!isPast(i)&&(i.statut||"nouvelle")==="nouvelle"});var nN=live.filter(function(i){return!i.aVerifier}).length,nV=live.length-nN;
  $("n-nouvelle").textContent=nN||"";$("n-verifier").textContent=nV||"";$("idea-count").hidden=!(nN+nV);$("idea-count").textContent=nN+nV;
  var nsel=Object.keys(S.sel).filter(function(k){return S.sel[k]}).length;$("selbar").hidden=!S.selecting;$("sel-count").textContent=nsel+(nsel>1?" idées cochées":" idée cochée");
  if(!items.length){var msg={nouvelle:"Rien à traiter pour l’instant.",verifier:"Aucune info en attente de vérification.",utilisee:"Aucune idée utilisée.",ecartee:"Aucune idée écartée."}[S.filter];list.appendChild(el("div",{class:"empty"},[el("b",{text:msg}),el("br"),S.filter==="nouvelle"?"Chaque matin, la veille dépose ses infos ici.":""]));return}
  items.forEach(function(i){var t=typ(i.type),v=vil(i.village),st=i.statut||"nouvelle",actions;
    if(S.selecting)actions=[el("label",{class:"check"},[el("input",{type:"checkbox",id:"sel-"+i.id,checked:S.sel[i.id]?"checked":null,onchange:function(e){S.sel[i.id]=e.target.checked;renderIdeas()}}),"Mettre dans l’agenda"])];
    else if(st==="nouvelle")actions=[el("button",{class:"btn primary",type:"button",text:"Créer le post",onclick:function(){ideaToPost(i,"post")}}),el("button",{class:"btn",type:"button",text:"Story",onclick:function(){ideaToPost(i,"story")}}),
      i.aVerifier?el("button",{class:"btn ghost",type:"button",text:"C’est vérifié",onclick:function(){setIdea(i.id,{aVerifier:false},"Idée vérifiée")}}):null,el("button",{class:"btn ghost",type:"button",text:"Écarter",onclick:function(){setIdea(i.id,{statut:"ecartee"},"Idée écartée")}})];
    else actions=[i.postId?el("button",{class:"btn",type:"button",text:"Voir le post",onclick:function(){var p=S.posts.find(function(x){return x.id===i.postId});if(p)openPost(p)}}):null,el("button",{class:"btn ghost",type:"button",text:"Remettre à traiter",onclick:function(){setIdea(i.id,{statut:"nouvelle"},"Idée remise à traiter")}})];
    list.appendChild(el("article",{class:"card"+(st==="utilisee"?" used":"")+(S.selecting&&S.sel[i.id]?" selected":"")},[
      el("div",{class:"meta"},[el("span",{class:"pill t-"+(isSimple(i.type)?i.type:"agenda"),text:t.name}),el("span",{class:"dot",style:"background:"+v.color}),v.short,i.quand?" · "+frDate(i.quand)+(i.fin&&i.fin!==i.quand?" → "+frDate(i.fin):""):"",i.aVerifier?el("span",{class:"verif",text:"À vérifier"}):null]),
      el("h3",{text:i.titre||"(sans titre)"}),i.texte?el("p",{text:i.texte}):null,
      (i.sourceNom||i.sourceUrl)?el("div",{class:"src"},["Source : ",i.sourceUrl?el("a",{href:i.sourceUrl,target:"_blank",rel:"noopener",text:i.sourceNom||i.sourceUrl}):i.sourceNom]):null,
      el("div",{class:"actions"},actions)]))})}
$("btn-select").onclick=function(){S.selecting=!S.selecting;S.sel={};this.setAttribute("aria-pressed",String(S.selecting));this.textContent=S.selecting?"Terminer":"Sélectionner";renderIdeas()};
$("sel-cancel").onclick=function(){$("btn-select").click()};
$("sel-agenda").onclick=function(){var list=S.ideas.filter(function(i){return S.sel[i.id]&&i.quand}).sort(function(a,b){return a.quand.localeCompare(b.quand)});if(!list.length){toast("Coche des idées datées");return}
  var wk=list.every(function(i){var d=parseIso(i.quand).getDay();return d===0||d===6});var t0=todayIso();P=blankPost();P.type=wk?"weekend":"semaine";
  var first=list[0].quand;if(wk){var thu=addDays(period("weekend",first).from,-2);P.datePrevue=thu>=t0?thu:t0}else{var sun=addDays(mondayOf(first),-1);P.datePrevue=sun>=t0?sun:t0}
  var pp=period(P.type,P.datePrevue);P.rows=list.map(function(i){return ideaToRow(i,pp)});P.ideeIds=list.map(function(i){return i.id});S.selecting=false;S.sel={};$("btn-select").textContent="Sélectionner";$("btn-select").setAttribute("aria-pressed","false");renderIdeas();syncForm();show("atelier");if(!rowsOk())toast("Trop d’événements pour le gabarit : retire les moins importants")};
IDEA_TYPES.forEach(function(k){$("i-type").appendChild(el("option",{value:k,text:TYPES[k].name}))});VORDER.forEach(function(k){$("i-village").appendChild(el("option",{value:k,text:VILLAGES[k].name}));$("c-village").appendChild(el("option",{value:k,text:VILLAGES[k].name}))});
$("idea-form").addEventListener("submit",function(e){e.preventDefault();if(!S.db)return;var body={date:todayIso(),type:$("i-type").value,village:$("i-village").value,titre:$("i-titre").value.trim(),texte:$("i-texte").value.trim(),details:"",quand:$("i-quand").value||"",fin:$("i-fin").value||"",sourceUrl:$("i-source").value.trim(),sourceNom:"",statut:"nouvelle",aVerifier:false,origine:"manuel",createdAt:new Date().toISOString()};
  S.db.collection("idees").add(body).then(function(){e.target.reset();$("add-idea").open=false;toast("Idée ajoutée")},function(){toast("Ajout impossible pour l’instant")})});
/* Récap du jour */
function renderRecap(){var r=S.recaps.filter(function(x){return x.date===todayIso()})[0]||S.recaps.slice().sort(function(a,b){return b.date.localeCompare(a.date)})[0];var box=$("recap");if(!r){box.hidden=true;return}box.hidden=false;
  $("recap-title").textContent="Récap du "+frDate(r.date);$("recap-legende-box").hidden=!r.legende;$("recap-legende").textContent=r.legende||"";
  var cs=$("recap-contacts");cs.textContent="";var contacts=r.contacts||[];$("recap-contacts-box").hidden=!contacts.length;
  contacts.forEach(function(c){cs.appendChild(el("div",{class:"contact"},[el("b",{text:c.nom||""}),c.raison?el("span",{class:"hint",text:c.raison}):null,el("p",{class:"recap-text",text:c.message||""}),c.message?el("button",{class:"btn",type:"button",text:"Copier le message",onclick:function(){copyText(c.message,"Message copié")}}):null]))});
  var full=$("recap-full");full.textContent="";(r.texte||"").split("**").forEach(function(seg,k){if(seg)full.appendChild(k%2?el("b",{text:seg}):document.createTextNode(seg))})}
$("recap-copy-leg").onclick=function(){copyText($("recap-legende").textContent,"Légende copiée")};
$("recap-use-leg").onclick=function(){P.legende=$("recap-legende").textContent;syncForm();show("atelier");toast("Légende du jour placée dans l’atelier")};
/* Comptes suivis */
function cleanUser(u){return(u||"").trim().replace(/^@/,"").replace(/^https?:\/\/(www\.)?instagram\.com\//i,"").replace(/[\/?#].*$/,"").toLowerCase()}
function setCompte(u,patch,msg){if(!S.db)return;S.db.collection("comptes").doc(u).update(patch).then(function(){toast(msg)},function(){toast("Modification impossible pour l’instant")})}
function compteUrl(c){return c.url||(c.plateforme==="facebook"?"https://www.facebook.com/"+c.username:"https://www.instagram.com/"+c.username+"/")}
function compteRow(c,prop){var v=vil(c.village),fb=c.plateforme==="facebook";var info=[fb?"Facebook":"Instagram",c.nom,c.village?v.short:"",c.abonnes!=null?nf(c.abonnes)+" abonnés":"",c.dernierPost?"dernier post "+frDate(c.dernierPost.slice(0,10)):""].filter(Boolean).join(" · ");
  var todo=[];if(prop&&c.action!=="contacter")todo.push("à suivre");if(c.message&&!c.contacteLe)todo.push("message à envoyer");
  var kids=[el("div",{class:"who"},[el("a",{href:compteUrl(c),target:"_blank",rel:"noopener"},[el("b",{text:(fb?"":"@")+(c.nom&&fb?c.nom:c.username)})]),el("span",{class:"hint",text:info}),c.raison&&prop?el("span",{class:"hint",text:c.raison}):null,todo.length?el("span",{class:"hint",text:"À faire : "+todo.join(" et ")}):null])];
  if(c.message&&!c.contacteLe){var ta=el("p",{class:"recap-text",text:c.message});kids.push(el("div",{class:"contact",style:"width:100%"},[el("span",{class:"lbl",text:"Message proposé"}),ta,el("div",{class:"row"},[el("button",{class:"btn",type:"button",text:"Copier le message",onclick:function(){copyText(c.message,"Message copié")}}),el("button",{class:"btn ghost",type:"button",text:"Message envoyé",onclick:function(){setCompte(c.id||c.username,{contacteLe:todayIso()},"C’est noté")}})])]))}
  var id=c.id||c.username;
  kids.push(el("div",{class:"row"},prop?[el("button",{class:"btn primary",type:"button",text:c.action==="contacter"?"Fait":"Je suis abonnée",onclick:function(){setCompte(id,{statut:"suivi",suiviLe:todayIso()},"C’est noté")}}),el("button",{class:"btn ghost",type:"button",text:"Ignorer",onclick:function(){setCompte(id,{statut:"ignore"},"Proposition ignorée")}})]:[el("button",{class:"btn ghost",type:"button",text:"Retirer",onclick:function(){setCompte(id,{statut:"ignore"},"Compte retiré")}})]));
  return el("div",{class:"compte"+(prop?" propose":"")},kids)}
/* Veille réseaux */
function renderReseaux(){var r=S.reseaux,b=$("reseaux-body");b.textContent="";$("n-reseaux").textContent=r&&r.date===todayIso()?"nouveau":"";
  var so=S.ideas.filter(function(i){return i.origine==="sortie"&&(i.fin||i.quand||"9999")>=todayIso()&&i.statut!=="ecartee"}).sort(function(x,y){return(x.quand||"").localeCompare(y.quand||"")});
  if(so.length){b.appendChild(el("span",{class:"lbl",text:"Sorties du week-end"}));var sl=el("div",{class:"contacts"});so.forEach(function(i){sl.appendChild(el("div",{class:"contact"},[el("span",{class:"hint",text:[i.public==="adultes"?"Entre adultes":i.public==="famille"?"En famille":"",vil(i.village).short,i.quand?frDate(i.quand)+(i.fin&&i.fin!==i.quand?" → "+frDate(i.fin):""):""].filter(Boolean).join(" · ")}),el("b",{text:i.titre||""}),i.texte?el("span",{class:"hint",text:i.texte}):null,i.sourceUrl?el("a",{href:i.sourceUrl,target:"_blank",rel:"noopener",text:"Voir le détail"+(i.sourceNom?" ("+i.sourceNom+")":"")}):null]))});b.appendChild(sl)}
  if(!r){b.appendChild(el("p",{class:"hint",style:"margin:0",text:"La veille réseaux passe chaque matin vers 6h30 : hashtags du moment, sujets qui font parler, publications à repartager et, le mercredi, deux idées de sortie pour le week-end."}));return}
  b.appendChild(el("span",{class:"hint",text:"Mise à jour du "+frDate(r.date)+(r.message?" · "+r.message:"")}));
  var tl=Array.isArray(r.tendances)?r.tendances:(r.tendances?String(r.tendances).split("\n"):[]);tl=tl.filter(function(x){return x&&String(x).trim()});if(tl.length){b.appendChild(el("span",{class:"lbl",text:"Ce qui fait parler"}));b.appendChild(el("ul",{class:"trend"},tl.map(function(x){return el("li",{text:String(x).replace(/^[-•]\s*/,"")})})))}
  var tags=r.hashtags||[];if(tags.length){b.appendChild(el("span",{class:"lbl",text:"Hashtags du moment"}));var w=el("div",{class:"tagrow"});tags.forEach(function(t){var x=(t.tag||"").replace(/^#?/,"#");w.appendChild(el("button",{class:"tagchip",type:"button",title:t.note||"",text:x+(t.usage?" · "+t.usage:""),onclick:function(){copyText(x,x+" copié")}}))});b.appendChild(w);
    b.appendChild(el("button",{class:"btn",type:"button",text:"Copier tous les hashtags",onclick:function(){copyText(tags.map(function(t){return(t.tag||"").replace(/^#?/,"#")}).join(" "),"Hashtags copiés")}}))}
  var pubs=r.publications||[];if(pubs.length){b.appendChild(el("span",{class:"lbl",text:"Publications à regarder"}));var l=el("div",{class:"contacts"});pubs.forEach(function(p){l.appendChild(el("div",{class:"contact"},[el("a",{href:p.url,target:"_blank",rel:"noopener"},[el("b",{text:p.compte||"Voir la publication"})]),p.resume?el("span",{class:"hint",text:p.resume}):null,p.idee?el("span",{class:"hint",text:"Idée : "+p.idee}):null]))});b.appendChild(l)}}
function renderComptes(){var suivis=S.comptes.filter(function(c){return c.statut==="suivi"&&!(c.message&&!c.contacteLe)}).sort(function(a,b){return(a.username||"").localeCompare(b.username||"")}),props=S.comptes.filter(function(c){return c.statut==="propose"||(c.statut==="suivi"&&c.message&&!c.contacteLe)});
  $("n-comptes").textContent=[suivis.length||"",props.length?props.length+" à traiter":""].filter(Boolean).join(" · ");
  var pb=$("comptes-proposes");pb.textContent="";if(props.length){pb.appendChild(el("span",{class:"lbl",text:"Proposés par la recherche"}));props.forEach(function(c){pb.appendChild(compteRow(c,true))})}
  var sb=$("comptes-suivis");sb.textContent="";sb.appendChild(suivis.length?el("span",{class:"lbl",text:"Suivis ("+suivis.length+")"}):el("div",{class:"hint",text:"Aucun compte suivi pour l’instant."}));suivis.forEach(function(c){sb.appendChild(compteRow(c,false))})}
renderReseaux();
$("compte-form").addEventListener("submit",function(e){e.preventDefault();if(!S.db)return;var u=cleanUser($("c-user").value);if(!/^[a-z0-9._]{1,30}$/.test(u)){toast("Nom de compte invalide");return}
  var ref=S.db.collection("comptes").doc(u);ref.get().then(function(sn){return sn.exists?ref.update({statut:"suivi",village:$("c-village").value}):ref.set({username:u,village:$("c-village").value,statut:"suivi",ajouteLe:new Date().toISOString(),origine:"manuel"})}).then(function(){$("c-user").value="";toast("@"+u+" ajouté")},function(){toast("Ajout impossible pour l’instant")})});

/* ---------- Atelier ---------- */
function infosOf(i){var line=((i.details||"").split("\n")[0]||"");var m=line.match(/\*\*(.*?)\*\*/);var bold=m?m[1]:"";var rest=line.replace(/\*\*.*?\*\*/,"").replace(/^[\s·:,-]+/,"").trim();
  var h=(bold+" "+(i.texte||"")).match(/\d{1,2}h\d{0,2}(\s*[-–à]\s*\d{1,2}h\d{0,2})?/);return[h?h[0].replace(/\s+/g,""):"",rest].filter(Boolean).join(" · ")||(i.texte||"").slice(0,48)}
function ideaToRow(i,p){var d=i.quand||p.from;if(d<p.from)d=p.from;if(d>p.to)d=p.to;return{date:d,village:VILLAGES[i.village]?i.village:"cotebleue",titre:i.titre||"",infos:infosOf(i),ideeId:i.id}}
function rowsOk(){var rows=P.rows||[];if(P.type!=="weekend")return rows.length<=maxRows(P);var p=period("weekend",P.datePrevue),mx=perDayMax(P),a=0,b=0;rows.forEach(function(r){if(r.date===p.from)a++;else if(r.date===p.to)b++});return a<=mx&&b<=mx}
function autoFill(){var p=period(P.type,P.datePrevue);var c=candidates(p);if(P.type==="semaine"&&P.format==="story"&&P.village!=="cotebleue")c=c.filter(function(i){return i.village===P.village});var rows=[],per={},mx=perDayMax(P);
  c.forEach(function(i){var r=ideaToRow(i,p);if(P.type==="weekend"){per[r.date]=(per[r.date]||0)+1;if(per[r.date]>mx)return}else if(rows.length>=maxRows(P))return;rows.push(r)});P.rows=rows;return c.length-rows.length}
function buildTypeChips(){function chip(k){return el("button",{type:"button",class:"chip","data-type":k,"aria-pressed":"false",onclick:function(){setType(k)}},[TYPES[k].name])}
  RDV_ORDER.forEach(function(k){$("p-types-rdv").appendChild(chip(k))});PONCT_ORDER.forEach(function(k){$("p-types").appendChild(chip(k))});
  VORDER.forEach(function(k){$("p-villages").appendChild(el("button",{type:"button",class:"chip","data-village":k,"aria-pressed":"false",onclick:function(){P.village=k;if(P.type==="semaine"&&P.format==="story"&&!(P.rows||[]).length)autoFill();syncForm();draw()}},[el("span",{class:"dot",style:"background:"+VILLAGES[k].color+";border:2px solid #0B1B3F;width:14px;height:14px"}),VILLAGES[k].short]))});
  V4.forEach(function(k){var id="tv-"+k;$("t-villages").appendChild(el("label",{class:"chip",for:id},[el("input",{type:"checkbox",id:id,value:k,style:"width:18px;height:18px;accent-color:#0F4CDB"}),el("span",{class:"dot",style:"background:"+VILLAGES[k].color}),VILLAGES[k].short]))})}
buildTypeChips();
function setType(k){var t=TYPES[k];P.type=k;P.pill="";if(t.storyOnly)P.format="story";if(!P.datePrevue)P.datePrevue=todayIso();if(k==="meteo"&&!P.meteoDate)P.meteoDate=addDays(P.datePrevue,1);
  if(isList(k)&&!(P.rows&&P.rows.length)){var rest=autoFill();if(rest>0)toast(rest+" autre(s) idée(s) dans la période : « Choisir dans les idées »")}syncForm();draw()}
function syncForm(){var t=typ(P.type),L=isList(P.type),T=P.type==="teaser",Mt=P.type==="meteo",simple=isSimple(P.type);
  document.querySelectorAll("[data-type]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.type===P.type))});
  document.querySelectorAll("#p-villages .chip").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.village===P.village))});
  $("fmt-post").setAttribute("aria-pressed",String(P.format!=="story"));$("fmt-story").setAttribute("aria-pressed",String(P.format==="story"));$("fmt-post").disabled=!!t.storyOnly;
  $("village-field").hidden=!(simple||(P.type==="semaine"&&P.format==="story"));$("village-label").textContent=P.type==="semaine"?"Village de la story":"Village";
  $("list-fields").hidden=!L;$("teaser-fields").hidden=!T;$("meteo-fields").hidden=!Mt;$("details-field").hidden=!(simple||T);$("sticker-field").hidden=P.type!=="bonplan";
  $("photo-field").hidden=L;$("btn-photo-rm").hidden=!P.photoId;
  $("p-pill").value=P.pill||"";$("p-pill").placeholder=L?monthPill(rowsDates(P)):T?(P.format==="story"?"Active la cloche":"Bientôt"):Mt?"Météo · demain":(P.format==="story"&&P.type==="agenda"?t.storyPill:t.pill)||"";
  $("p-sticker").value=P.sticker||"";$("p-titre").value=P.titre||"";$("p-titre").placeholder=simple?t.title:defTitle(P).replace("\n"," ");$("p-titre-label").textContent=P.type==="nouveau"?"Nom du commerce":P.type==="question"?"Question":"Titre";
  $("p-details").value=P.details||"";$("p-details").placeholder=(t.details||"").replace(/\*\*/g,"");$("p-legende").value=P.legende||"";$("p-date").value=P.datePrevue||"";$("p-source").value=P.source||"";
  if(L)renderRows();if(T){$("t-compteur").value=P.compteur||"";$("t-visuel").value=P.visuel||"logo";document.querySelectorAll("#t-villages input").forEach(function(cb){cb.checked=(P.villages||[]).indexOf(cb.value)>=0})}
  if(Mt){var m=S.meteo[P.meteoDate];$("meteo-info").textContent=m?"Prévisions Open-Meteo pour le "+frDate(P.meteoDate)+", mises à jour "+(m.majLe?"le "+frDate(m.majLe.slice(0,10))+" à "+m.majLe.slice(11,16):"")+".":"Prévisions du "+frDate(P.meteoDate)+" pas encore arrivées : la routine les récupère vers 17h30 la veille."}
  $("btn-delete").hidden=!P.id;$("post-status").textContent=P.statut==="publie"?"Publié le "+frDate(P.datePublie):(P.id?"Brouillon enregistré":"Nouveau visuel, pas encore enregistré");$("btn-published").textContent=P.statut==="publie"?"Publié":"Marquer publié"}
$("fmt-post").onclick=function(){if(typ(P.type).storyOnly){toast("Ce gabarit existe en story");return}P.format="post";syncForm();draw()};
$("fmt-story").onclick=function(){P.format="story";syncForm();draw()};
[["p-pill","pill"],["p-sticker","sticker"],["p-titre","titre"],["p-details","details"],["p-legende","legende"],["p-source","source"]].forEach(function(p){$(p[0]).addEventListener("input",function(){P[p[1]]=$(p[0]).value;if(p[1]!=="legende"&&p[1]!=="source")draw()})});
$("p-date").addEventListener("change",function(){P.datePrevue=$("p-date").value;if(P.type==="meteo")P.meteoDate=addDays(P.datePrevue,1);syncForm();draw()});
$("t-villages").addEventListener("change",function(){P.villages=[].slice.call(document.querySelectorAll("#t-villages input:checked")).map(function(x){return x.value});draw()});
$("t-compteur").oninput=function(){P.compteur=this.value;draw()};$("t-visuel").onchange=function(){P.visuel=this.value;draw()};
/* Photos */
function pickPhoto(file){if(!file)return Promise.resolve(null);if(S.assets)return S.assets.upload(file).then(function(r){return r.id},function(){toast("La photo n’a pas pu être enregistrée");return null});
  toast("Photo utilisée pour cette image seulement (non sauvegardée)");return Promise.resolve(URL.createObjectURL(file))}
$("p-photo").addEventListener("change",function(){var f=this.files&&this.files[0];this.value="";pickPhoto(f).then(function(id){if(id){P.photoId=id;syncForm();draw()}})});
$("btn-photo-rm").onclick=function(){P.photoId=null;syncForm();draw()};
/* Lignes d’agenda */
function renderRows(){var box=$("rows");box.textContent="";var p=period(P.type,P.datePrevue);P.rows=P.rows||[];
  $("rows-period").textContent=(P.type==="semaine"?"Semaine du "+frDate(p.from)+" au "+frDate(p.to):P.type==="weekend"?"Week-end du "+frDate(p.from)+" et "+frDate(p.to):"Journée du "+frDate(p.from))+". "+(P.type==="weekend"?perDayMax(P)+" événements maximum par jour.":maxRows(P)+" lignes maximum.")+(P.type==="semaine"&&P.format==="story"&&P.village!=="cotebleue"?" Seules les lignes de "+vil(P.village).short+" s’affichent.":"");
  P.rows.forEach(function(r,i){var b=el("div",{class:"rowed"}),id="r"+i;
    var d=el("input",{type:"date",id:id+"d",value:r.date||"","aria-label":"Date"});d.oninput=function(){r.date=d.value;draw()};
    var v=el("select",{id:id+"v","aria-label":"Village"});VORDER.forEach(function(k){v.appendChild(el("option",{value:k,text:VILLAGES[k].short,selected:k===r.village?"selected":null}))});v.onchange=function(){r.village=v.value;draw()};
    var t=el("input",{type:"text",id:id+"t",class:"full",value:r.titre||"",placeholder:"Événement","aria-label":"Événement",maxlength:"60"});t.oninput=function(){r.titre=t.value;draw()};
    var f=el("input",{type:"text",id:id+"f",class:"full",value:r.infos||"",placeholder:"Heure · Lieu","aria-label":"Heure et lieu",maxlength:"60"});f.oninput=function(){r.infos=f.value;draw()};
    var ph=el("input",{type:"file",id:id+"p",accept:"image/*","aria-label":"Photo de la ligne"});ph.onchange=function(){var file=ph.files&&ph.files[0];pickPhoto(file).then(function(pid){if(pid){r.photoId=pid;renderRows();draw()}})};
    var pr=el("div",{class:"photo-row"},[el("span",{class:"hint",text:r.photoId?"Vignette photo :":"Vignette photo (facultatif) :"}),ph,r.photoId?el("button",{type:"button",class:"btn ghost",text:"Retirer",onclick:function(){r.photoId=null;renderRows();draw()}}):null]);
    var x=el("button",{type:"button",class:"btn ghost rmv full",text:"Retirer cette ligne",onclick:function(){P.rows.splice(i,1);renderRows();draw()}});
    [d,v,t,f,pr,x].forEach(function(n){b.appendChild(n)});box.appendChild(b)});
  $("btn-add-row").disabled=P.type==="weekend"?P.rows.length>=perDayMax(P)*2:P.rows.length>=maxRows(P);
  if(!rowsOk())box.appendChild(el("p",{class:"verif",text:"Trop d’événements : retire-en, les lignes en trop ne s’affichent pas."}))}
$("btn-add-row").onclick=function(){var p=period(P.type,P.datePrevue);P.rows=P.rows||[];P.rows.push({date:p.from,village:"cotebleue",titre:"",infos:""});renderRows();draw()};
$("btn-pick").onclick=function(){var pk=$("picker");if(!pk.hidden){pk.hidden=true;return}pk.hidden=false;pk.textContent="";var p=period(P.type,P.datePrevue),have={};(P.rows||[]).forEach(function(r){if(r.ideeId)have[r.ideeId]=1});
  var c=candidates(p).filter(function(i){return!have[i.id]});if(!c.length){pk.appendChild(el("p",{class:"hint",text:"Aucune autre idée datée dans cette période."}));return}
  c.forEach(function(i){pk.appendChild(el("label",{class:"pick"},[el("input",{type:"checkbox",value:i.id,id:"pk-"+i.id}),el("span",{},[el("b",{text:frDate(i.quand)+" · "+vil(i.village).short+" · "}),i.titre||"",i.aVerifier?el("span",{class:"verif",text:" À vérifier"}):null])]))});
  pk.appendChild(el("button",{type:"button",class:"btn primary",text:"Ajouter la sélection",onclick:function(){var add=[].slice.call(pk.querySelectorAll("input:checked")).map(function(x){return ideaToRow(S.ideas.find(function(i){return i.id===x.value}),p)});var before=P.rows;P.rows=(P.rows||[]).concat(add);
    if(!rowsOk()){P.rows=before;toast("Trop de lignes pour ce gabarit : décoche-en ou retire une ligne.");return}P.rows.sort(function(a,b){return a.date.localeCompare(b.date)});pk.hidden=true;renderRows();draw()}}))};
function openPost(post){P=Object.assign(blankPost(),JSON.parse(JSON.stringify(post)));if(P.format==="carrousel")P.format="post";if(P.type==="meteo"&&!P.meteoDate)P.meteoDate=addDays(P.datePrevue||todayIso(),1);syncForm();show("atelier");$("atelier-lead").textContent=typ(P.type).name+(P.datePrevue?" prévu le "+frDate(P.datePrevue):"")+(P.source?" · "+P.source:"")}
$("btn-new").onclick=function(){P=blankPost();syncForm();draw();toast("Nouveau visuel")};
/* Enregistrement */
var FIELDS=["format","type","village","pill","sticker","titre","details","legende","datePrevue","source","photoId","ideeIds","rows","compteur","visuel","villages","meteoDate","statut","datePublie","stats","auto","mediaId","permalink","importe"];
function postBody(){var b={};FIELDS.forEach(function(k){if(P[k]!==undefined)b[k]=P[k]});if(b.photoId&&String(b.photoId).indexOf("blob:")===0)b.photoId=null;(b.rows||[]).forEach(function(r){if(r.photoId&&String(r.photoId).indexOf("blob:")===0)r.photoId=null});b.updatedAt=new Date().toISOString();b.createdAt=P.createdAt||b.updatedAt;return JSON.parse(JSON.stringify(b))}
function savePost(extra){if(!S.db){toast("Base indisponible : rouvre la page");return Promise.reject()}Object.assign(P,extra||{});var ref=P.id?S.db.collection("posts").doc(P.id):S.db.collection("posts").doc();P.id=ref.id;
  return ref.set(postBody()).then(function(){var ids=(P.ideeIds||[]).slice();(P.rows||[]).forEach(function(r){if(r.ideeId&&ids.indexOf(r.ideeId)<0)ids.push(r.ideeId)});ids.forEach(function(iid){S.db.collection("idees").doc(iid).update({statut:"utilisee",postId:P.id}).catch(function(){})});syncForm()})}
$("btn-save").onclick=function(){savePost().then(function(){toast("Brouillon enregistré")})};
var delArmed=false;$("btn-delete").onclick=function(){if(!P.id)return;if(!delArmed){delArmed=true;$("btn-delete").textContent="Confirmer la suppression";setTimeout(function(){delArmed=false;$("btn-delete").textContent="Supprimer"},4000);return}
  delArmed=false;S.db.collection("posts").doc(P.id).delete().then(function(){P=blankPost();syncForm();draw();toast("Post supprimé")})};
$("btn-published").onclick=function(){if(P.statut==="publie")return;savePost({statut:"publie",datePublie:todayIso()}).then(function(){toast("Publié ! Les stats arriveront avec la routine du matin.")})};
function fileName(){var v=vil(P.village).short.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-");return"mcb-"+(P.datePrevue||todayIso())+"-"+P.type+(P.type==="meteo"||isList(P.type)?"":"-"+v)+(P.format==="story"||typ(P.type).storyOnly?"-story":"")+".png"}
function fallbackImg(blob){var fb=$("export-fallback");fb.hidden=false;fb.textContent="";var r=new FileReader();r.onload=function(){fb.appendChild(el("img",{src:r.result,alt:"Visuel à enregistrer",class:"fallback-img"}));fb.appendChild(el("div",{text:"Appuie longuement sur l’image pour l’enregistrer dans ta galerie."}))};r.readAsDataURL(blob)}
$("btn-export").onclick=function(){draw(true);cv.toBlob(function(blob){if(!blob){toast("Image impossible à générer");return}if(!S.downloads)return fallbackImg(blob);
  S.downloads.save({filename:fileName(),data:blob}).then(function(r){if(r&&r.status==="saved")toast("Image enregistrée. Ouvre Instagram pour publier.")},function(e){if(e&&e.code==="unavailable")fallbackImg(blob)})},"image/png")};
$("btn-copy").onclick=function(){var txt=$("p-legende").value;if(!txt){toast("La légende est vide");return}copyText(txt,"Légende copiée",$("p-legende"))};
/* Légende par Claude */
var legAbort=null;
$("btn-legende").onclick=function(){if(!S.sample){toast("Claude n’est pas disponible sur cette vue");return}if(legAbort){legAbort.abort();return}
  var t=typ(P.type),v=vil(P.village),m=S.meteo[P.meteoDate];var story=P.format==="story"||t.storyOnly;
  var what=isList(P.type)?t.name+" ; événements : "+(P.rows||[]).map(function(r){return frDate(r.date)+" "+vil(r.village).short+" : "+r.titre+(r.infos?" ("+r.infos+")":"")}).join(" | "):
    P.type==="teaser"?"teaser du happening de lancement ("+(P.compteur||"révélation")+"). Ne révèle pas le concept avant J-1, crée du mystère, invite à s’abonner et activer la cloche.":
    P.type==="meteo"?"story météo de demain ("+frDate(P.meteoDate)+")"+(m?" : "+V4.map(function(k){var x=m.villages&&m.villages[k];return vil(k).short+" "+(x?Math.round(x.tmin)+"°/"+Math.round(x.tmax)+"°":"?")}).join(", ")+(m.mer?" ; eau "+Math.round(m.mer.eau)+"°, "+(m.mer.dir!=null?windFrom(m.mer.dir).toLowerCase():"vent")+" à "+Math.round(m.mer.vent)+" km/h"+(isMistral(m.mer)?" (mistral)":""):""):""):
    t.name+" à "+v.name+" ; titre : "+(P.titre||"(vide)")+" ; détails : "+((P.details||"").replace(/\*\*/g,"")||"(aucun)");
  var brief=["Tu rédiges la légende Instagram d’un "+(story?"texte de story":"post")+" du compte @maison.cotebleue (« Maison Côte Bleue »), média local de La Couronne-Carro, Sausset-les-Pins, Carry-le-Rouet et Ensuès-la-Redonne (dont la calanque de La Redonne).","Promesse : « Ce qui se passe chez nous, au même endroit. » Ton : un voisin bien informé, chaleureux et direct. Tutoiement.",
    story?"Règles : 1 à 2 phrases courtes, pas de hashtags.":"Règles : moins de 120 mots, phrases courtes, 1 ou 2 emojis maximum, termine par un appel doux (s’abonner, écrire en message pour partager une info) puis une ligne de 3 à 5 hashtags locaux.",
    "N’invente aucun fait, date, horaire ni prix : utilise uniquement les infos ci-dessous. Cite la source à la fin si elle est fournie.","Réponds uniquement avec la légende.","","Contenu : "+what,P.source?"Source : "+P.source:""].join("\n");
  legAbort=new AbortController();var btn=$("btn-legende"),lab=btn.querySelector("span");var old=lab.textContent;lab.textContent="Arrêter";$("p-legende").value="Claude écrit…";
  S.sample(brief,{signal:legAbort.signal,cache:false,onText:function(u){$("p-legende").value=u.text}}).then(function(r){P.legende=$("p-legende").value=r.text.trim()},function(e){if(e&&e.text){P.legende=$("p-legende").value=e.text}else $("p-legende").value=P.legende||"";if(e&&e.code==="rate_limited")toast("Trop de demandes, réessaie dans un moment");else if(e&&e.code!=="cancelled")toast("Légende indisponible pour l’instant")}).then(function(){legAbort=null;lab.textContent=old})};

/* ---------- Stats ---------- */
function eng(p){var s=p.stats||{};var inter=(+s.likes||0)+(+s.commentaires||0)+(+s.enregistrements||0)+(+s.partages||0);return{reach:+s.portee||0,inter:inter,rate:s.portee?inter/s.portee:null}}
function renderAna(){var stats=S.stats.slice().sort(function(a,b){return a.date.localeCompare(b.date)});var pts=stats.filter(function(s){return s.abonnes!=null});var last=pts[pts.length-1];
  var since=addDays(todayIso(),-30),wk=addDays(todayIso(),-7);var prev=pts.filter(function(s){return s.date<=wk}).slice(-1)[0];
  var pubs=S.posts.filter(function(p){return p.statut==="publie"});var pubs30=pubs.filter(function(p){return(p.datePublie||"")>=since&&p.stats&&p.stats.portee});
  var avgReach=pubs30.length?pubs30.reduce(function(a,p){return a+eng(p).reach},0)/pubs30.length:null;var rates=pubs30.map(function(p){return eng(p).rate}).filter(function(r){return r!=null});var avgRate=rates.length?rates.reduce(function(a,b){return a+b},0)/rates.length:null;
  var msgs=stats.filter(function(s){return s.date>=since}).reduce(function(a,s){return a+(+s.messages||0)},0);var goal=2000,k=$("kpis");k.textContent="";
  function kpi(label,val,sub,extra){k.appendChild(el("div",{class:"kpi"},[el("div",{class:"k",text:label}),el("div",{class:"v",text:val}),extra||null,el("div",{class:"s",text:sub})]))}
  kpi("Abonnés",last?nf(last.abonnes):"–",last?"objectif "+nf(goal)+(prev?" · "+(last.abonnes-prev.abonnes>=0?"+":"")+nf(last.abonnes-prev.abonnes)+" en 7 j":""):"Premier relevé demain matin",el("div",{class:"bar"},[el("i",{style:"width:"+(last?Math.min(100,last.abonnes/goal*100):0)+"%"})]));
  kpi("Portée moyenne",avgReach==null?"–":nf(Math.round(avgReach)),pubs30.length+" posts publiés sur 30 j");kpi("Engagement",pct(avgRate),"interactions ÷ portée, 30 j");kpi("Messages reçus",nf(msgs),"infos et bons plans, 30 j");
  var box=$("chart-abonnes");box.textContent="";
  if(pts.length<2)box.appendChild(el("div",{class:"empty",text:pts.length?"Un seul relevé pour l’instant : la courbe apparaît dès le deuxième.":"Aucun relevé : le premier arrive avec la routine de 6h40."}));
  else{var W=640,H=220,L=48,R=16,T=14,B=30;var xs=pts.map(function(p){return parseIso(p.date).getTime()}),x0=xs[0],x1=xs[xs.length-1];var vals=pts.map(function(p){return+p.abonnes});var lo=Math.min.apply(null,vals),hi=Math.max.apply(null,vals);if(hi===lo){hi+=5;lo=Math.max(0,lo-5)}var sp=hi-lo;lo=Math.max(0,Math.floor(lo-sp*.1));hi=Math.ceil(hi+sp*.1);
    function X(t){return L+(t-x0)/((x1-x0)||1)*(W-L-R)}function Y(v){return T+(1-(v-lo)/(hi-lo))*(H-T-B)}var ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("class","chart");svg.setAttribute("role","img");svg.setAttribute("aria-label","Abonnés de "+nf(vals[0])+" à "+nf(vals[vals.length-1]));
    function sv(tag,a){var e=document.createElementNS(ns,tag);for(var q in a)e.setAttribute(q,a[q]);svg.appendChild(e);return e}
    [lo,Math.round((lo+hi)/2),hi].forEach(function(v){sv("line",{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:"currentColor","stroke-opacity":".12"});sv("text",{x:L-8,y:Y(v)+4,"text-anchor":"end","font-size":"11",fill:"currentColor","fill-opacity":".7"}).textContent=nf(v)});
    [0,pts.length-1].forEach(function(i){sv("text",{x:X(xs[i]),y:H-8,"text-anchor":i?"end":"start","font-size":"11",fill:"currentColor","fill-opacity":".7"}).textContent=frDate(pts[i].date)});
    var dp=pts.map(function(p,i){return(i?"L":"M")+X(xs[i]).toFixed(1)+" "+Y(vals[i]).toFixed(1)}).join(" ");sv("path",{d:dp+" L"+X(x1)+" "+(H-B)+" L"+X(x0)+" "+(H-B)+" Z",fill:"var(--brand)","fill-opacity":".12"});sv("path",{d:dp,fill:"none",stroke:"var(--brand)","stroke-width":"2.5"});
    pts.forEach(function(p,i){var c=sv("circle",{cx:X(xs[i]),cy:Y(vals[i]),r:i===pts.length-1?6:4,fill:i===pts.length-1?"var(--sun)":"var(--brand)",stroke:"var(--surface)","stroke-width":"2"});var ti=document.createElementNS(ns,"title");ti.textContent=frDate(p.date)+" : "+nf(vals[i])+" abonnés";c.appendChild(ti)});box.style.color="var(--ink)";box.appendChild(svg)}
  function bars(target,keyFn,names,order){var b=$(target);b.textContent="";var g={},max=0;pubs.forEach(function(p){var r=eng(p).rate;if(r==null)return;var q=keyFn(p);(g[q]=g[q]||[]).push(r)});order.forEach(function(q){if(g[q]){g[q].avg=g[q].reduce(function(a,c){return a+c},0)/g[q].length;max=Math.max(max,g[q].avg)}});
    if(!order.some(function(q){return g[q]})){b.appendChild(el("div",{class:"hint",text:"Apparaît dès qu’un post publié a ses chiffres."}));return}
    order.forEach(function(q){var a=g[q];if(!a)return;b.appendChild(el("div",{class:"hbar",title:names(q)+" : "+pct(a.avg)+" sur "+a.length+" post(s)"},[el("span",{text:names(q)}),el("div",{class:"track"},[el("i",{style:"width:"+Math.max(2,a.avg/max*100)+"%"})]),el("span",{class:"num",text:pct(a.avg)})]))})}
  bars("by-type",function(p){return p.type},function(q){return typ(q).name},RDV_ORDER.concat(PONCT_ORDER));bars("by-village",function(p){return p.village},function(q){return vil(q).short},VORDER);
  var tb=$("pub-rows");tb.textContent="";var sorted=pubs.slice().sort(function(a,b){return(b.datePublie||"").localeCompare(a.datePublie||"")});
  if(!sorted.length)tb.appendChild(el("tr",{},[el("td",{colspan:"7",text:"Aucun post publié pour l’instant."})]));
  sorted.forEach(function(p){var e=eng(p);tb.appendChild(el("tr",{},[el("td",{text:frDate(p.datePublie)}),el("td",{},[p.permalink?el("a",{href:p.permalink,target:"_blank",rel:"noopener",text:(p.titre||typ(p.type).name).slice(0,34)}):(p.titre||typ(p.type).name).slice(0,34)]),el("td",{text:typ(p.type).name}),el("td",{text:vil(p.village).short}),el("td",{class:"n",text:p.stats&&p.stats.portee?nf(e.reach):"–"}),el("td",{class:"n",text:p.stats?nf(e.inter):"–"}),el("td",{class:"n",text:pct(e.rate)})]))});
  var sy=S.sync;$("meta-status").textContent=sy&&sy.at?"Source : API Meta, mise à jour le "+frDate(sy.at.slice(0,10))+(sy.ok===false?" (échec : "+(sy.message||"erreur")+")":"")+".":"API Meta connectée : les chiffres arrivent chaque matin.";
  var cm=$("communaute");cm.hidden=!(sy&&sy.communaute);if(sy&&sy.communaute){cm.textContent="";cm.append(el("b",{text:"Ta communauté. "}),sy.communaute)}}
$("s-date").value=todayIso();
$("stat-form").addEventListener("submit",function(e){e.preventDefault();if(!S.db||$("s-messages").value==="")return;var d=$("s-date").value||todayIso();var ref=S.db.collection("stats").doc(d);var m=+$("s-messages").value;
  ref.get().then(function(sn){return sn.exists?ref.update({messages:m}):ref.set({date:d,messages:m})}).then(function(){$("s-messages").value="";toast("Enregistré")})});

/* ---------- Ménage automatique ---------- */
var purged={};
function purge(col,docs,test){if(!S.db)return;docs.forEach(function(d){if(purged[col+d.id]||!test(d))return;purged[col+d.id]=1;S.db.collection(col).doc(d.id).delete().catch(function(){purged[col+d.id]=0})})}
function stale(p){var lim=addDays(todayIso(),-7);return p.statut!=="publie"&&p.datePrevue&&p.datePrevue<lim}
function oldUndated(i){return!i.quand&&!i.fin&&i.date&&i.date<addDays(todayIso(),-14)}

/* ---------- Connexion ---------- */
function setConn(ok,txt){var b=$("conn");b.textContent="";b.append(el("span",{class:"dot",style:"background:"+(ok?"#2BB673":"#E0A100")}),txt)}
function snap(col,cb,q){return(q||S.db.collection(col)).onSnapshot(function(s){var docs=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});cb(docs,!(s.metadata&&s.metadata.fromCache))},function(){setConn(false,"Reconnexion…")})}
renderWeek();renderIdeas();renderAna();syncForm();
var C=window.claude;
if(!C||!C.use)setConn(false,"Hors ligne");
else{
  C.use("db").then(function(db){if(!db){setConn(false,"Base indisponible");return}S.db=db;setConn(true,"Synchronisé");
    snap("idees",function(d,live){S.ideas=d;renderIdeas();renderWeek();renderReseaux();if(live)purge("idees",d,function(i){return isPast(i)||oldUndated(i)})},db.collection("idees").limit(500));
    snap("posts",function(d,live){S.posts=d;renderWeek();renderAna();if(live)purge("posts",d,stale)},db.collection("posts").limit(500));
    snap("stats",function(d){S.stats=d.filter(function(x){return x.date});renderAna()},db.collection("stats").limit(800));
    snap("recaps",function(d,live){S.recaps=d.filter(function(x){return x.date});renderRecap();if(live)purge("recaps",d,function(r){return r.date<todayIso()})},db.collection("recaps").limit(60));
    snap("comptes",function(d){S.comptes=d;renderComptes()},db.collection("comptes").limit(300));
    snap("meteo",function(d,live){S.meteo={};d.forEach(function(m){S.meteo[m.date||m.id]=m});renderWeek();if(P.type==="meteo"){syncForm();draw()}if(live)purge("meteo",d,function(m){return(m.date||m.id)<todayIso()})},db.collection("meteo").limit(30));
    db.doc("reglages/meta").onSnapshot(function(s){S.sync=s.exists?s.data():null;renderAna();renderWeek()});
    db.doc("reglages/reseaux").onSnapshot(function(s){S.reseaux=s.exists?s.data():null;renderReseaux()});
  });
  C.use("assets").then(function(a){S.assets=a});C.use("downloads").then(function(d){S.downloads=d});
  C.use("sample").then(function(s){S.sample=s;if(!s)$("btn-legende").hidden=true});
}
