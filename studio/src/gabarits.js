"use strict";
/* ---------- Données de marque ---------- */
var NUIT="#0B1B3F", BLEU="#0F4CDB", SOLEIL="#FFC93C", CIEL="#DCE8FF", BLANC="#FFFFFF", ENCRE2="#2B3A5E";
var VILLAGES={
  couronne:{name:"La Couronne-Carro",short:"Couronne-Carro",color:"#007277",tint:"#D1F3F4",deep:"#003A3F"},
  sausset:{name:"Sausset-les-Pins",short:"Sausset",color:"#007932",tint:"#DCF2DF",deep:"#003B0E"},
  carry:{name:"Carry-le-Rouet",short:"Carry",color:"#AD3300",tint:"#FFE4D9",deep:"#541500"},
  redonne:{name:"Ensuès-la-Redonne",short:"Ensuès",color:"#AC1B6E",tint:"#FFE2EE",deep:"#501133"},
  cotebleue:{name:"Côte Bleue",short:"Côte Bleue",color:BLEU,tint:CIEL,deep:NUIT}
};
var VORDER=["couronne","sausset","carry","redonne","cotebleue"], V4=["couronne","sausset","carry","redonne"];
var TYPES={
  semaine:{name:"Agenda semaine",rdv:true,list:true},
  weekend:{name:"Agenda week-end",rdv:true,list:true},
  meteo:{name:"Météo de demain",rdv:true,storyOnly:true},
  jour:{name:"Agenda du jour",list:true,storyOnly:true},
  agenda:{name:"Événement",pill:"Ce week-end",storyPill:"Aujourd’hui",title:"Ça bouge sur la Côte Bleue",details:"**[Heure]** [Événement]\n**[Heure]** [Événement]"},
  bonplan:{name:"Bon plan",pill:"Bon plan",title:"[Offre du moment]",details:"[Nom du commerce]\nJusqu’au [date]"},
  nouveau:{name:"Nouveauté",pill:"Nouveau",title:"[Nom du commerce]",details:"[Ce qu’ils proposent]"},
  pratique:{name:"Info pratique",pill:"Bon à savoir",title:"[Info pratique : travaux, fermeture]",details:"[Dates] · [Source]"},
  question:{name:"Question",pill:"Entre voisins",title:"[Question à la communauté ?]",details:""},
  teaser:{name:"Happening",title:"Quelque chose arrive sur la Côte Bleue",details:""}
};
var RDV_ORDER=["semaine","weekend","meteo"], PONCT_ORDER=["agenda","bonplan","nouveau","pratique","question","jour","teaser"], IDEA_TYPES=["agenda","bonplan","nouveau","pratique","question"];
function isList(k){return!!(TYPES[k]&&TYPES[k].list)}
function isSimple(k){return IDEA_TYPES.indexOf(k)>=0}
function typ(k){return TYPES[k]||TYPES.agenda}
function vil(k){return VILLAGES[k]||VILLAGES.cotebleue}

/* ---------- Dates ---------- */
function pad(n){return String(n).padStart(2,"0")}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function todayIso(){return iso(new Date())}
function parseIso(s){var p=(s||"").split("-");return new Date(+p[0],(+p[1]||1)-1,+p[2]||1)}
function addDays(s,n){var d=parseIso(s);d.setDate(d.getDate()+n);return iso(d)}
var JOURS=["dim.","lun.","mar.","mer.","jeu.","ven.","sam."], JOURSL=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"], JC=["DIM","LUN","MAR","MER","JEU","VEN","SAM"];
var MOIS=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."], MOISL=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
function frDate(s){if(!s)return"";var d=parseIso(s);return JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()]}
function mondayOf(s){var d=parseIso(s);return addDays(s,-((d.getDay()+6)%7))}
/* Période couverte par un agenda selon sa date de publication :
   semaine publiée le dimanche → lundi-dimanche suivants ; sinon la semaine en cours.
   week-end publié le jeudi → samedi-dimanche suivants. */
function period(type,ref){ref=ref||todayIso();var wd=parseIso(ref).getDay();
  if(type==="semaine"){var mon=wd===0?addDays(ref,1):mondayOf(ref);return{from:mon,to:addDays(mon,6)}}
  if(type==="weekend"){var sat=wd===0?addDays(ref,-1):addDays(ref,(6-wd+7)%7);return{from:addDays(sat,-1),to:addDays(sat,1)}}
  return{from:ref,to:ref}}
function monthPill(dates){var ms=[];dates.filter(Boolean).sort().forEach(function(s){var m=MOISL[parseIso(s).getMonth()];if(ms.indexOf(m)<0)ms.push(m)});if(!ms.length)ms=[MOISL[new Date().getMonth()]];return ms.length>1?ms.slice(0,2).join(" · "):"Agenda · "+ms[0]}

/* ---------- Images (photos encadrées) ---------- */
var IMGS={};
function imgFor(id){if(!id)return null;var e=IMGS[id];if(e)return e.ok?e.img:null;var img=new Image();e=IMGS[id]={img:img,ok:false};img.onload=function(){e.ok=true;if(window.__redraw)window.__redraw()};img.src=id.indexOf("blob:")===0?id:"/_blob/"+id;return null}

/* ---------- Canvas ---------- */
var cv=document.getElementById("canvas"), ctx=cv.getContext("2d");
var FD="'Fredoka', 'Nunito', sans-serif", FB="'Nunito', sans-serif";
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function setLS(px){try{ctx.letterSpacing=px+"px"}catch(e){}}
function logo(x,y,size,ring){var s=size/52;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle=NUIT;ctx.beginPath();ctx.arc(28,28,22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ring;ctx.beginPath();ctx.arc(24,24,22,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=NUIT;ctx.stroke();
  ctx.fillStyle=SOLEIL;ctx.beginPath();ctx.arc(24,24,13,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=BLEU;ctx.lineWidth=3;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(12,25);ctx.bezierCurveTo(16,21,20,29,24,25);ctx.bezierCurveTo(28,21,32,29,36,25);ctx.stroke();ctx.restore()}
function pillW(text,fs){ctx.save();ctx.font="800 "+fs+"px "+FB;setLS(fs*.14);var w=ctx.measureText(text.toUpperCase()).width+fs*1.3;ctx.restore();return w}
function pill(x,y,text,bg,fg,shadow,border,fs,bw,so){fs=fs||40;bw=bw||8;so=so||10;ctx.save();ctx.font="800 "+fs+"px "+FB;setLS(fs*.14);var t=text.toUpperCase();var w=ctx.measureText(t).width+fs*1.3,h=fs*1.75;
  ctx.translate(x,y+h/2);ctx.rotate(-3*Math.PI/180);
  if(shadow){ctx.fillStyle=shadow;rr(so,-h/2+so,w,h,h/2);ctx.fill()}
  ctx.fillStyle=bg;rr(0,-h/2,w,h,h/2);ctx.fill();if(border){ctx.lineWidth=bw;ctx.strokeStyle=border;ctx.stroke()}
  ctx.fillStyle=fg;ctx.textBaseline="middle";ctx.fillText(t,fs*.65,2);ctx.restore();return h}
function tokens(text){var out=[];(text||"").split("\n").forEach(function(line,li){if(li>0)out.push({br:true});var bold=false;line.split("**").forEach(function(seg,si){if(si>0)bold=!bold;seg.replace(/ ([?!:;»])/g,"\u00a0$1").replace(/(«) /g,"$1\u00a0").split(/([ \t]+)/).forEach(function(w){if(w==="")return;out.push({w:w,b:bold,sp:/^[ \t]+$/.test(w)})})})});return out}
function layout(text,font,boldFont,maxW){var lines=[[]],lw=0;tokens(text).forEach(function(t){if(t.br){lines.push([]);lw=0;return}ctx.font=t.b?boldFont:font;var w=ctx.measureText(t.w).width;var cur=lines[lines.length-1];if(t.sp){if(cur.length){cur.push({w:" ",b:t.b,width:w});lw+=w}return}if(lw+w>maxW&&cur.length){while(cur.length&&cur[cur.length-1].w===" "){lw-=cur.pop().width}lines.push([]);cur=lines[lines.length-1];lw=0}cur.push({w:t.w,b:t.b,width:w});lw+=w});return lines}
function drawLines(lines,x,y,lh,font,boldFont,color){ctx.fillStyle=color;ctx.textBaseline="top";lines.forEach(function(l,i){var cx=x;l.forEach(function(t){ctx.font=t.b?boldFont:font;ctx.fillText(t.w,cx,y+i*lh);cx+=t.width})});return lines.length*lh}
function fitTitle(text,maxW,maxH,maxSize,minSize){var size=maxSize,lines;for(;size>=minSize;size-=4){ctx.font="600 "+size+"px "+FD;lines=layout(text,ctx.font,ctx.font,maxW);if(lines.length*size*1.04<=maxH)break}return{size:Math.max(size,minSize),lines:lines}}
function drawTitle(fit,x,y,color,shadow){var f="600 "+fit.size+"px "+FD,lh=fit.size*1.04;if(shadow){drawLines(fit.lines,x+fit.size*.07,y+fit.size*.07,lh,f,f,shadow)}drawLines(fit.lines,x,y,lh,f,f,color);return fit.lines.length*lh}
function centerTitle(text,y,maxW,maxH,size0,W,color,shadow){var f=fitTitle(text,maxW,maxH,size0,50);var lh=f.size*1.04,font="600 "+f.size+"px "+FD;f.lines.forEach(function(l,i){var w=l.reduce(function(a,t){return a+t.width},0);var x=(W-w)/2;if(shadow)drawLines([l],x+f.size*.07,y+i*lh+f.size*.07,lh,font,font,shadow);drawLines([l],x,y+i*lh,lh,font,font,color||BLANC)});return f.lines.length*lh}
function centerLines(text,y,font,bold,lh,maxW,color,W){var lines=layout(text,font,bold,maxW);lines.forEach(function(l,i){var w=l.reduce(function(a,t){return a+t.width},0);drawLines([l],(W-w)/2,y+i*lh,lh,font,bold,color)});return lines.length*lh}
function zigzag(x,y,s,color,lw){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8*s,y-12*s,x+16*s,y);ctx.quadraticCurveTo(x+24*s,y+12*s,x+32*s,y);ctx.quadraticCurveTo(x+40*s,y-12*s,x+48*s,y);ctx.stroke();ctx.restore()}
function triangle(x,y,s,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y+26*s);ctx.lineTo(x+14*s,y);ctx.lineTo(x+28*s,y+26*s);ctx.closePath();ctx.fill()}
function ring(x,y,r,color,lw){ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}
function sticker(cx,cy,size,text){ctx.save();ctx.translate(cx,cy);ctx.rotate(12*Math.PI/180);var hs=size*.33;
  function star(dx,dy,fill,stroke){ctx.save();ctx.translate(dx,dy);ctx.fillStyle=fill;for(var i=0;i<2;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.beginPath();ctx.rect(-hs,-hs,hs*2,hs*2);ctx.fill();if(stroke){ctx.lineWidth=6;ctx.strokeStyle=stroke;ctx.stroke()}ctx.restore()}ctx.restore()}
  star(12,12,NUIT);star(0,0,BLANC,NUIT);star(0,0,BLANC);
  if(text){ctx.fillStyle=NUIT;ctx.textAlign="center";ctx.textBaseline="middle";var fs=size*.19;ctx.font="600 "+fs+"px "+FD;while(ctx.measureText(text).width>hs*1.9&&fs>20){fs-=4;ctx.font="600 "+fs+"px "+FD}ctx.fillText(text,0,4)}
  ctx.restore()}
function coverImg(img,x,y,w,h){var r=Math.max(w/img.width,h/img.height),iw=img.width*r,ih=img.height*r;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}
/* Photo dans un cadre : contour marine, ombre dure, le fond du gabarit reste visible autour */
function photoFrame(img,x,y,w,h,r,bw,so,label){r=r||28;bw=bw||8;so=so||14;ctx.fillStyle=NUIT;rr(x+so,y+so,w,h,r);ctx.fill();ctx.save();rr(x,y,w,h,r);ctx.clip();
  if(img)coverImg(img,x,y,w,h);else{ctx.fillStyle=CIEL;ctx.fillRect(x,y,w,h);if(label){ctx.fillStyle=ENCRE2;ctx.font="700 "+Math.max(22,Math.round(h/12))+"px "+FB;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,x+w/2,y+h/2);ctx.textAlign="left"}}
  if(img&&CREDIT&&w>=400){var ct="Photo non contractuelle · "+CREDIT;ctx.font="700 22px "+FB;ct=ellip(ct,"700 22px "+FB,w-60);var cw=ctx.measureText(ct).width+28;ctx.fillStyle="rgba(11,27,63,.72)";rr(x+16,y+h-16-38,cw,38,19);ctx.fill();ctx.fillStyle=BLANC;ctx.textBaseline="middle";ctx.fillText(ct,x+30,y+h-16-18)}
  ctx.restore();rr(x,y,w,h,r);ctx.lineWidth=bw;ctx.strokeStyle=NUIT;ctx.stroke()}
function dateBlock(x,y,w,h,day,num,fsS,fsB){ctx.fillStyle=NUIT;rr(x+4,y+4,w,h,14);ctx.fill();ctx.fillStyle=SOLEIL;rr(x,y,w,h,14);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=NUIT;ctx.stroke();
  ctx.fillStyle=NUIT;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.font="800 "+fsS+"px "+FB;setLS(fsS*.14);var tot=fsS+fsB*.82+6;var y0=y+(h-tot)/2;ctx.fillText(day,x+w/2+fsS*.07,y0+fsS*.85);setLS(0);ctx.font="600 "+fsB+"px "+FD;ctx.fillText(num,x+w/2,y0+fsS+6+fsB*.78);ctx.textAlign="left"}
function card(x,y,w,h,r,fill){ctx.fillStyle=NUIT;rr(x+6,y+6,w,h,r||20);ctx.fill();ctx.fillStyle=fill||BLANC;rr(x,y,w,h,r||20);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=NUIT;ctx.stroke()}
function ellip(text,font,maxW){ctx.font=font;if(ctx.measureText(text).width<=maxW)return text;while(text.length>1&&ctx.measureText(text+"…").width>maxW)text=text.slice(0,-1);return text.replace(/\s+$/,"")+"…"}
function evText(x,yc,maxW,r,vs,es,hs){var v=vil(r.village);var lines=[[vs,"800 "+vs+"px "+FB,BLEU,v.name.toUpperCase(),vs*.12],[es,"600 "+es+"px "+FD,NUIT,r.titre||"[Événement]",0],[hs,"600 "+hs+"px "+FB,ENCRE2,r.infos||"[Heure] · [Lieu]",0]];
  var tot=vs*1.25+es*1.08+hs*1.3;var y=yc-tot/2;ctx.textBaseline="top";
  lines.forEach(function(l,k){var f=l[1],t=l[3];if(k===1){var size=es;while(size>es*.75){f="600 "+size+"px "+FD;ctx.font=f;if(ctx.measureText(t).width<=maxW)break;size-=2}}setLS(l[4]);ctx.fillStyle=l[2];ctx.fillText(ellip(t,f,maxW-l[4]*t.length),x,y);setLS(0);y+=k===0?vs*1.25:k===1?es*1.08:hs*1.3})}
function footer(x,y,size,center,W){ctx.font="800 28px "+FB;var tw=ctx.measureText("Maison Côte Bleue").width;if(center)x=(W-(size+18+tw))/2;logo(x,y,size,BLEU);ctx.textBaseline="alphabetic";ctx.fillStyle=BLANC;ctx.font="800 28px "+FB;ctx.fillText("Maison Côte Bleue",x+size+18,y+size/2);ctx.fillStyle=CIEL;ctx.font="600 22px "+FB;ctx.fillText("@maison.cotebleue",x+size+18,y+size/2+28)}
function thumb(r,x,y,s){var img=imgFor(r.photoId);if(!r.photoId)return false;photoFrame(img,x,y,s,s,12,3,4,"");return true}

function themeOf(type){switch(type){
  case "bonplan":return{bg:SOLEIL,fg:NUIT,pillBg:NUIT,pillFg:BLANC,pillShadow:BLANC,pillBorder:null,shadow:BLANC,line:NUIT};
  case "pratique":return{bg:NUIT,fg:BLANC,pillBg:SOLEIL,pillFg:NUIT,pillShadow:null,pillBorder:null,shadow:null,line:BLANC};
  case "question":return{bg:BLANC,fg:BLEU,pillBg:BLEU,pillFg:BLANC,pillShadow:NUIT,pillBorder:NUIT,shadow:CIEL,line:NUIT};
  case "nouveau":return{bg:BLANC,fg:NUIT,pillBg:BLEU,pillFg:BLANC,pillShadow:NUIT,pillBorder:NUIT,shadow:null,line:NUIT};
  default:return{bg:BLEU,fg:BLANC,pillBg:BLANC,pillFg:BLEU,pillShadow:NUIT,pillBorder:NUIT,shadow:NUIT,line:NUIT}}}

/* Couleur de fond choisie dans l’atelier (vide = couleur du gabarit) */
var COULEURS=[["","Auto"],["bleu","Bleu"],["soleil","Soleil"],["nuit","Nuit"],["blanc","Blanc"],["ciel","Ciel"],["couronne","Turquoise"],["sausset","Pin"],["carry","Terracotta"],["redonne","Framboise"]];
function themeFor(P){var c=P&&P.couleur;if(!c)return themeOf(P.type);if(c==="bleu")return themeOf("agenda");if(c==="soleil")return themeOf("bonplan");if(c==="nuit")return themeOf("pratique");if(c==="blanc")return themeOf("question");
  if(c==="ciel")return{bg:CIEL,fg:NUIT,pillBg:BLEU,pillFg:BLANC,pillShadow:NUIT,pillBorder:NUIT,shadow:BLANC,line:NUIT};var v=VILLAGES[c];if(v)return{bg:v.color,fg:BLANC,pillBg:SOLEIL,pillFg:NUIT,pillShadow:NUIT,pillBorder:NUIT,shadow:v.deep,line:NUIT};return themeOf(P.type)}
/* Crédit de la photo principale, affiché dans le cadre avec la mention « non contractuelle » */
var CREDIT="";
/* ---------- Gabarits simples (événement, bon plan, nouveauté, info, question) ---------- */
function drawSimplePost(P,W,H){var M=76,t=typ(P.type),v=vil(P.village),th=themeFor(P);var title=P.titre||t.title,details=P.details!==""&&P.details!=null?P.details:(P.titre?"":t.details),pillTxt=P.pill||t.pill;
  var hasPhoto=!!P.photoId||P.type==="nouveau";ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);
  if(!hasPhoto){if(P.type==="agenda")zigzag(W-330,H-100,5.4,SOLEIL,20);if(P.type==="pratique")zigzag(702,1217,5.4,SOLEIL,20);if(P.type==="question")ring(W-170,H-330,75,SOLEIL,26)}
  else{zigzag(W-300,104,3.2,P.type==="bonplan"?NUIT:SOLEIL,14)}
  var ph=pill(64,64,pillTxt,th.pillBg,th.pillFg,th.pillShadow,th.pillBorder,40);
  if(P.type!=="question"&&!hasPhoto){ctx.font="800 38px "+FB;setLS(38*.14);ctx.fillStyle=th.fg;ctx.textAlign="right";ctx.textBaseline="middle";ctx.fillText(v.short.toUpperCase(),W-M,64+ph/2);ctx.textAlign="left";setLS(0)}
  var footH=200,footY=H-footH;ctx.fillStyle=th.line;ctx.fillRect(0,footY,W,10);logo(M-6,footY+(footH-120)/2+6,120,v.color);
  ctx.fillStyle=th.bg===BLANC?NUIT:th.fg;ctx.font="800 50px "+FB;ctx.textBaseline="middle";ctx.fillText("Maison Côte Bleue",M+140,footY+footH/2+4);
  if(hasPhoto&&P.type!=="question"){ctx.font="800 32px "+FB;setLS(32*.14);ctx.textAlign="right";ctx.fillText(v.short.toUpperCase(),W-M,footY+footH/2+4);ctx.textAlign="left";setLS(0)}
  var top=64+ph+40,bottom=footY-50,fh=hasPhoto?500:0,pg=hasPhoto?56:0;
  var avail=bottom-top-fh-pg,detFont="400 "+(hasPhoto?42:48)+"px "+FB,detBold="800 "+(hasPhoto?42:48)+"px "+FB,lh=hasPhoto?58:68;
  var detLines=details?layout(details,detFont,detBold,W-2*M-(P.type==="bonplan"&&!hasPhoto?300:0)):[];if(hasPhoto)detLines=detLines.slice(0,2);var detH=detLines.length*lh;
  var fit=fitTitle(title,W-2*M,avail-detH-(detH?28:0),hasPhoto?96:150,hasPhoto?56:72);var titleH=fit.lines.length*fit.size*1.04;
  var dg=hasPhoto?20:40;var y=top+Math.max(0,(avail-titleH-(detH?dg+detH:0))/2),photoY=y;
  if(!hasPhoto&&P.type==="agenda"&&y+titleH+(detH?dg+detH:0)<H-370){triangle(W-240,H-330,4.4,th.bg===BLEU?CIEL:SOLEIL);ring(140,H-290,42,SOLEIL,18)}
  if(hasPhoto){photoFrame(imgFor(P.photoId),M,y,W-2*M,fh,28,8,14,"[Photo]");y+=fh+pg}
  drawTitle(fit,M,y,th.fg,th.shadow);if(detH)drawLines(detLines,M,y+titleH+dg,lh,detFont,detBold,th.fg);
  if(P.type==="bonplan"&&P.sticker)sticker(hasPhoto?W-150:W-200,hasPhoto?photoY+60:footY-190,hasPhoto?240:300,P.sticker)}
function drawSimpleStory(P,W,H){var M=90,t=typ(P.type),v=vil(P.village),th=themeFor(P);var title=P.titre||t.title,details=P.details!==""&&P.details!=null?P.details:(P.titre?"":t.details),pillTxt=P.pill||(P.type==="agenda"?t.storyPill:t.pill);
  var bg=th.bg,fg=th.fg,shadow=th.shadow,pBg=th.pillBg,pFg=th.pillFg;if(P.type==="agenda"&&!P.couleur){bg=v.color;fg=BLANC;shadow=v.deep;pBg=BLANC;pFg=v.color}
  var hasPhoto=!!P.photoId||P.type==="nouveau";ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(P.type==="agenda"){zigzag(W-330,190,5.4,SOLEIL,22);ring(150,H-230,50,SOLEIL,22);triangle(W-260,H-330,5.4,v.tint)}
  if(P.type==="pratique")zigzag(W-330,H-470,5.4,SOLEIL,22);
  logo(M,270,110,v.color);ctx.font="800 40px "+FB;setLS(40*.12);var lab=v.short.toUpperCase(),lw=ctx.measureText(lab).width+56;
  var lbg=P.type==="bonplan"?NUIT:(P.type==="question"?BLEU:(P.type==="nouveau"?BLEU:BLANC)),lfg=P.type==="bonplan"||P.type==="question"||P.type==="nouveau"?BLANC:(P.type==="agenda"?v.deep:NUIT);if(P.couleur){lbg=th.pillBg;lfg=th.pillFg}
  ctx.fillStyle=lbg;rr(M+136,290,lw,72,36);ctx.fill();ctx.fillStyle=lfg;ctx.textBaseline="middle";ctx.fillText(lab,M+164,328);setLS(0);
  var y=430,bottomMax=H-400,fh=hasPhoto?620+60:0,phH=44*1.75;
  var detFont="400 48px "+FB,detBold="800 48px "+FB,lh=68;var detLines=details?layout(details,detFont,detBold,W-2*M-(P.type==="bonplan"&&!hasPhoto?280:0)).slice(0,hasPhoto?3:6):[];var detH=detLines.length*lh;
  var avail=bottomMax-y-(P.type==="question"?300:0)-fh-phH-40;var fit=fitTitle(title,W-2*M,avail-detH-(detH?40:0),hasPhoto?110:170,64);var titleH=fit.lines.length*fit.size*1.04;
  y+=Math.max(0,(avail-titleH-(detH?40+detH:0))/2);var photoY=y;
  if(hasPhoto){photoFrame(imgFor(P.photoId),M,y,W-2*M,620,30,8,14,"[Photo]");y+=fh}
  phH=pill(M,y,pillTxt,pBg,pFg,P.type==="pratique"?null:NUIT,P.type==="pratique"?null:NUIT,44);y+=phH+40;
  drawTitle(fit,M,y,fg,shadow);if(detH)drawLines(detLines,M,y+titleH+40,lh,detFont,detBold,fg);
  if(P.type==="bonplan"&&P.sticker)sticker(hasPhoto?W-160:W-230,hasPhoto?photoY+40:bottomMax-200,hasPhoto?260:320,P.sticker);
  if(P.type==="question")ring(W-180,bottomMax-80,70,SOLEIL,26)}

/* ---------- Agendas ---------- */
function rowsDates(P){return(P.rows||[]).map(function(r){return r.date}).concat(P.type==="jour"?[P.datePrevue||todayIso()]:[])}
function defTitle(P){var v=vil(P.village);if(P.type==="semaine"&&P.format==="story"&&P.village!=="cotebleue")return"Ça bouge "+(P.village==="couronne"?"à la Couronne-Carro":"à "+v.short)+"\ncette semaine";
  return P.type==="semaine"?"Ça bouge\ncette semaine":P.type==="weekend"?"Ça bouge\nce week-end":P.type==="jour"?"Ça bouge\naujourd’hui":P.type==="meteo"?"Demain sur\nla Côte Bleue":"Quelque chose arrive\nsur la Côte Bleue"}
function maxRows(P){if(P.format==="carrousel")return CAR_MAX_ITEMS;if(P.type==="semaine")return P.format==="story"?6:5;if(P.type==="jour")return 5;return 6}
function perDayMax(P){return 3}
function singleVillage(rows){var vs={};rows.forEach(function(r){vs[r.village]=1});var k=Object.keys(vs);return k.length===1&&k[0]!=="cotebleue"?k[0]:null}
function drawList(P,W,H){var story=P.format==="story";var rows=(P.rows||[]).slice().sort(function(a,b){return a.date.localeCompare(b.date)});var pillTxt=P.pill||monthPill(rowsDates(P));var title=P.titre||defTitle(P);
  var vk=P.type==="semaine"&&story?P.village:(P.type==="jour"?singleVillage(rows):null);var v=vk&&vk!=="cotebleue"?vil(vk):null;var bg=v?v.color:BLEU,sh=v?v.deep:NUIT,pfg=v?v.color:BLEU;
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(P.type==="weekend")return drawWeekend(P,W,H,rows,pillTxt,title);
  if(P.type==="semaine"&&story&&v)rows=rows.filter(function(r){return r.village===vk});
  if(!rows.length)rows=[{date:period(P.type,P.datePrevue).from,village:vk||"cotebleue",titre:"",infos:""}];
  if(!story){zigzag(760,150,1.75,SOLEIL,9);triangle(930,282,1.85,CIEL);ring(1000,1230,20,SOLEIL,8)}else{zigzag(740,250,1.75,SOLEIL,9);triangle(930,1590,1.85,v?v.tint:CIEL);ring(990,240,18,SOLEIL,8)}
  var M=64,noDate=P.type==="jour",rh=noDate?120:132,gap=noDate?24:22,fy=story?H-470:H-34-64,n=Math.min(rows.length,maxRows(P));
  var f=noDate?fitTitle(title,W-2*M-222,230,104,64):fitTitle(title,W-2*M,story?240:220,story?104:96,60),fH=f.lines.length*f.size*1.04;
  var headH=26*1.75+22+(noDate?12+190+40:fH+(story?40:44)),lo=story?260:80;
  var top=lo+Math.max(0,(fy-36-lo-headH-(n*rh+(n-1)*gap))/2);var ph=pill(M,top,pillTxt,BLANC,pfg,NUIT,NUIT,26,3,4);var y=top+ph+22;
  if(noDate){var d=parseIso(P.datePrevue||todayIso());dateBlock(M,y+12,190,190,JC[d.getDay()],String(d.getDate()),34,110);drawTitle(f,M+222,y+12+(190-fH)/2,BLANC,sh);y+=12+190+40}
  else{drawTitle(f,M,y,BLANC,sh);y+=fH+(story?40:44)}
  rows.slice(0,maxRows(P)).forEach(function(r){card(M,y,W-2*M,rh);var x=M+16;if(!noDate){var d=parseIso(r.date);dateBlock(x,y+14,104,104,JC[d.getDay()],String(d.getDate()),22,56);x+=104+26}else x+=4;
    var isz=noDate?88:84;logo(x,y+(rh-isz)/2,isz,vil(r.village).color);x+=isz+26;var right=W-M-26;if(r.photoId){var ts=rh-28;thumb(r,W-M-14-ts,y+14,ts);right=W-M-14-ts-20}evText(x,y+rh/2,right-x,r,20,40,24);y+=rh+gap});
  if(story)fy=Math.max(fy,y+10);footer(M,fy,64,false,W);if(story&&v){ctx.fillStyle=CIEL;ctx.font="700 24px "+FB;ctx.textAlign="right";ctx.fillText(v.name,W-M,fy+40);ctx.textAlign="left"}}
function drawWeekend(P,W,H,rows,pillTxt,title){var story=P.format==="story";var p=period("weekend",P.datePrevue);var M=64;
  if(!story){zigzag(760,150,1.75,SOLEIL,9);triangle(940,282,1.85,CIEL)}else{zigzag(740,250,1.75,SOLEIL,9);triangle(930,1590,1.85,CIEL)}
  var f=fitTitle(title,W-2*M,story?240:200,story?104:92,60),fH=f.lines.length*f.size*1.04;
  var mx=perDayMax(P);var days=[p.from,addDays(p.from,1),p.to].map(function(d){return{d:d,ev:rows.filter(function(r){return r.date===d}).slice(0,mx)}}).filter(function(x){return x.ev.length});if(!days.length)days=[{d:addDays(p.from,1),ev:[{village:"cotebleue",titre:"",infos:""}]}];
  var isz=story?88:80,es=story?44:40,dw=story?210:200,eg=story?30:24,eh=story?110:100,dg=story?26:22;
  var minC=150,ch2=story?128:112;var chOf=function(x){var n=x.ev.length;return Math.max(n*eh+(n-1)*eg,minC)+36};var fy=story?H-470:H-34-60;var cta=(P.details||"").trim(),ctaH,blk,lo=story?260:80;
  var calc=function(){ctaH=cta?ch2+26:0;blk=days.reduce(function(a,x){return a+chOf(x)},0)+(days.length-1)*dg+ctaH};calc();
  if(lo+26*1.75+30+fH+34+blk>fy-16){eh=story?100:90;eg=story?20:14;dg=story?18:14;minC=124;ch2=story?112:90;isz=story?82:74;calc()}
  if(lo+26*1.75+30+fH+34+blk>fy-16){f=fitTitle(title,W-2*M,story?200:150,story?88:76,56);fH=f.lines.length*f.size*1.04}var y=lo+Math.max(0,(fy-36-lo-(26*1.75+30+fH+34)-blk)/2);
  var ph=pill(M,y,pillTxt,BLANC,BLEU,NUIT,NUIT,26,3,4);y+=ph+30;drawTitle(f,M,y,BLANC,NUIT);y+=fH+34;
  days.forEach(function(x){var n=x.ev.length;var ch=chOf(x);card(M,y,W-2*M,ch);var dd=parseIso(x.d);dateBlock(M+18,y+18,dw,ch-36,JC[dd.getDay()],String(dd.getDate()),24,story?93:82);
    var ey=y+18+((ch-36)-(n*eh+(n-1)*eg))/2;x.ev.forEach(function(r){var ex=M+18+dw+22;logo(ex,ey+(eh-isz)/2,isz,vil(r.village).color);var right=W-M-24;if(r.photoId){thumb(r,W-M-18-isz,ey+(eh-isz)/2,isz);right=W-M-18-isz-16}evText(ex+isz+16,ey+eh/2,right-(ex+isz+16),r,17,es,24);ey+=eh+eg});y+=ch+dg});
  if(cta){var cy=y+4;card(M,cy,W-2*M,ch2,24,SOLEIL);var em=(cta.match(/^\p{Extended_Pictographic}\uFE0F?/u)||["\uD83E\uDD7E"])[0],txt=cta.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u,"");
    var cr=ch2*0.36,cx=M+24+cr,ccy=cy+ch2/2;ctx.fillStyle=BLANC;ctx.beginPath();ctx.arc(cx,ccy,cr,0,Math.PI*2);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=NUIT;ctx.stroke();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=Math.round(cr*1.15)+"px 'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',sans-serif";ctx.fillText(em,cx,ccy+2);ctx.textAlign="left";
    var tx=cx+cr+22,tw=W-M-24-tx;ctx.fillStyle=NUIT;ctx.textBaseline="alphabetic";ctx.font="600 "+(story?36:32)+"px "+FD;ctx.fillText(ellip(txt,"600 "+(story?36:32)+"px "+FD,tw),tx,ccy-4);
    ctx.font="700 "+(story?24:22)+"px "+FB;ctx.fillStyle=ENCRE2;ctx.fillText(story?"Dans la story suivante →":"À découvrir en story →",tx,ccy+(story?30:28))}
  footer(M,story?Math.max(fy,y+(cta?ctaH:0)+10):fy,60,false,W)}

/* ---------- Happening ---------- */
function bigLogo(cx,cy,r){ctx.fillStyle=NUIT;ctx.beginPath();ctx.arc(cx+14,cy+14,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=SOLEIL;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=NUIT;ctx.stroke();
  var s=r/16;ctx.save();ctx.translate(cx-24*s,cy-25*s);ctx.scale(s,s);ctx.strokeStyle=BLEU;ctx.lineWidth=2.4;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(12,25);ctx.bezierCurveTo(16,21,20,29,24,25);ctx.bezierCurveTo(28,21,32,29,36,25);ctx.stroke();ctx.restore()}
function iconsRow(keys,cy,maxSize,W){var n=keys.length;if(!n)return;var gap=30,size=Math.min(maxSize,(W-128-(n-1)*gap)/n);var x=(W-(n*size+(n-1)*gap))/2;keys.forEach(function(k){logo(x,cy-size/2,size,vil(k).color);x+=size+gap})}
function drawTeaser(P,W,H){var story=P.format==="story";var title=P.titre||defTitle(P);var vis=P.visuel||"logo";var keys=(P.villages&&P.villages.length)?P.villages:V4;
  /* Deux passes : on mesure le bloc, puis on le redessine centré verticalement. */
  function bg(){ctx.fillStyle=BLEU;ctx.fillRect(0,0,W,H);if(!story){zigzag(66,88,1.5,SOLEIL,10);triangle(928,66,2.1,CIEL)}else zigzag(66,170,1.6,SOLEIL,10)}
  function post(dy){var hasVis=!!P.photoId||vis!=="aucun";ring(100,730+dy,26,SOLEIL,9);zigzag(862,700+dy,1.5,SOLEIL,10);
    if(P.photoId){photoFrame(imgFor(P.photoId),140,180+dy,800,560,30,8,14,"")}else if(vis==="logo")bigLogo(540,480+dy,270);else if(vis==="villages")iconsRow(keys,480+dy,keys.length>2?210:270,W);
    var py=(hasVis?820:420)+dy;var pt=P.pill||"Bientôt";pill((W-pillW(pt,30))/2,py,pt,BLANC,BLEU,NUIT,NUIT,30,3,4);
    var y=py+90;y+=centerTitle(title,y,W-140,vis==="aucun"?420:250,vis==="aucun"?120:92,W,BLANC,NUIT);if(P.details)y+=30+centerLines(P.details,y+30,"600 40px "+FB,"800 40px "+FB,54,W-160,CIEL,W);
    return{top:(P.photoId?180:vis==="logo"?210:vis==="villages"?480-(keys.length>2?105:135):420)+dy,end:y}}
  function storyC(y){var top=y,b;if(P.compteur){var bx=333,bw=414,bh=417;ctx.fillStyle=NUIT;rr(bx+14,y+14,bw,bh,34);ctx.fill();ctx.fillStyle=SOLEIL;rr(bx,y,bw,bh,34);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=NUIT;ctx.stroke();
      ctx.fillStyle=NUIT;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.font="800 50px "+FB;setLS(3);ctx.fillText("COMPTE À",540,y+92);ctx.fillText("REBOURS",540,y+146);setLS(0);var fs=230;ctx.font="600 "+fs+"px "+FD;while(ctx.measureText(P.compteur).width>bw-50&&fs>90){fs-=10;ctx.font="600 "+fs+"px "+FD}ctx.fillText(P.compteur,540,y+bh-46);ctx.textAlign="left";y+=bh+70}
    else if(P.photoId){photoFrame(imgFor(P.photoId),90,y,900,560,30,8,14,"");y+=640}
    else if(vis==="logo"){bigLogo(540,y+200,200);y+=470}
    if(vis==="villages"){iconsRow(keys,y+80,keys.length>2?170:200,W);y+=200}
    var th=centerTitle(title,y,W-120,300,92,W,BLANC,NUIT);y+=th+34;
    if(P.details){y+=centerLines(P.details,y,"600 40px "+FB,"800 40px "+FB,54,W-160,CIEL,W)+30}
    var pt=P.pill||"Active la cloche";pill((W-pillW(pt,30))/2,y,pt,SOLEIL,NUIT,NUIT,NUIT,30,3,4);y+=110;
    footer(0,y,60,true,W);return{top:top,end:y+90}}
  bg();var r,lo,hi;
  if(!story){r=post(0);lo=150;hi=H-150;bg();var dy=Math.max(lo-r.top,lo+(hi-lo-(r.end-r.top))/2-r.top);post(dy);footer(64,H-120,64,false,W);return}
  r=storyC(380);lo=260;hi=H-300;bg();var y0=Math.max(lo,lo+(hi-lo-(r.end-r.top))/2);ring(130,Math.max(y0+(r.end-r.top)+40,1660),26,SOLEIL,9);triangle(925,Math.max(y0+(r.end-r.top)+30,1650),2.1,CIEL);storyC(y0)}

/* ---------- Météo ---------- */
function compass(deg){return["N","NE","E","SE","S","SO","O","NO"][Math.round(((deg%360)+360)%360/45)%8]}
var DIR16=["nord","nord-nord-est","nord-est","est-nord-est","est","est-sud-est","sud-est","sud-sud-est","sud","sud-sud-ouest","sud-ouest","ouest-sud-ouest","ouest","ouest-nord-ouest","nord-ouest","nord-nord-ouest"];
function windFrom(deg){var n=DIR16[Math.round(((deg%360)+360)%360/22.5)%16];return(/^[eo]/.test(n)?"Vent d’":"Vent du ")+n}
function isMistral(m){return m&&m.vent>=30&&m.dir!=null&&(m.dir>=290||m.dir<=30)}
function sunShape(cx,cy,r){ctx.fillStyle=SOLEIL;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=NUIT;ctx.stroke()}
function cloudShape(cx,cy,s,fill){var parts=[[cx-s*.38,cy+s*.08,s*.28],[cx,cy-s*.1,s*.38],[cx+s*.38,cy+s*.08,s*.28]];ctx.fillStyle=NUIT;parts.forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],p[2]+4,0,Math.PI*2);ctx.fill()});rr(cx-s*.66-4,cy+s*.02-4,s*1.32+8,s*.36+8,s*.18+4);ctx.fill();
  ctx.fillStyle=fill||BLANC;parts.forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill()});rr(cx-s*.66,cy+s*.02,s*1.32,s*.36,s*.18);ctx.fill()}
function wIcon(code,cx,cy,s){code=+code;if(code<=1){sunShape(cx,cy,s*.38);return}
  if(code===2){sunShape(cx+s*.22,cy-s*.18,s*.3);cloudShape(cx-s*.08,cy+s*.08,s*.8);return}
  if(code===3){cloudShape(cx,cy,s);return}
  if(code===45||code===48){ctx.strokeStyle=NUIT;ctx.lineWidth=7;ctx.lineCap="round";[-.25,0,.25].forEach(function(k,i){ctx.beginPath();ctx.moveTo(cx-s*.4+(i%2)*10,cy+k*s);ctx.lineTo(cx+s*.4,cy+k*s);ctx.stroke()});return}
  cloudShape(cx,cy-s*.12,s*.9);
  if(code>=95){ctx.fillStyle=SOLEIL;ctx.strokeStyle=NUIT;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+4,cy+s*.2);ctx.lineTo(cx-s*.14,cy+s*.48);ctx.lineTo(cx+2,cy+s*.48);ctx.lineTo(cx-s*.08,cy+s*.72);ctx.lineTo(cx+s*.18,cy+s*.4);ctx.lineTo(cx+2,cy+s*.4);ctx.closePath();ctx.fill();ctx.stroke();return}
  var snow=(code>=71&&code<=77)||code===85||code===86;[-.28,0,.28].forEach(function(k){if(snow){ctx.fillStyle=BLANC;ctx.strokeStyle=NUIT;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx+k*s,cy+s*.42,s*.07,0,Math.PI*2);ctx.fill();ctx.stroke()}else{ctx.strokeStyle=BLEU;ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(cx+k*s+6,cy+s*.3);ctx.lineTo(cx+k*s-4,cy+s*.5);ctx.stroke()}})}
function drawMeteo(P,W,H,data){var M=64;ctx.fillStyle=BLEU;ctx.fillRect(0,0,W,H);
  var md=P.meteoDate||addDays(P.datePrevue||todayIso(),1);var d=parseIso(md);
  var f=fitTitle(P.titre||defTitle(P),W-2*M,200,96,60),rh=P.photoId?120:156,gap=P.photoId?14:20,mh=236;
  var blk=130+28*1.75+26+f.lines.length*f.size*1.04+34+(P.photoId?338:0)+4*rh+4*gap+6+mh+56;var o=Math.max(0,(H-340-220-blk)/2),t0=220+o;
  zigzag(770,t0+70,1.75,SOLEIL,9);triangle(950,Math.max(t0+blk+60,1640),1.85,CIEL);ring(110,Math.max(t0+blk+70,1650),18,SOLEIL,8);
  logo(M,t0,90,BLEU);ctx.fillStyle=BLANC;ctx.font="800 30px "+FB;ctx.textBaseline="alphabetic";ctx.fillText("Maison Côte Bleue",M+108,t0+40);ctx.fillStyle=CIEL;ctx.font="600 24px "+FB;ctx.fillText("@maison.cotebleue",M+108,t0+72);
  var y=t0+130;var ph=pill(M,y,P.pill||("Météo · "+JOURSL[d.getDay()]+" "+d.getDate()),SOLEIL,NUIT,NUIT,NUIT,28,3,4);y+=ph+26;
  drawTitle(f,M,y,BLANC,NUIT);y+=f.lines.length*f.size*1.04+34;
  if(P.photoId){photoFrame(imgFor(P.photoId),M,y,W-2*M,300,24,6,10,"");y+=300+38}
  V4.forEach(function(k){var v=vil(k),m=data&&data.villages&&data.villages[k];card(M,y,W-2*M,rh,20);var is=Math.round(rh*.62);logo(M+18,y+(rh-is)/2,is,v.color);
    ctx.fillStyle=NUIT;ctx.textBaseline="middle";ctx.font="600 42px "+FD;ctx.fillText(ellip(v.short,"600 42px "+FD,390),M+36+is,y+rh/2);
    wIcon(m?m.code:3,M+620,y+rh/2,rh*.62);
    ctx.textAlign="right";ctx.font="600 58px "+FD;ctx.fillStyle=NUIT;var hi=m?Math.round(m.tmax)+"°":"–";ctx.fillText(hi,W-M-24,y+rh/2);var hw=ctx.measureText(hi).width;ctx.font="700 38px "+FB;ctx.fillStyle=ENCRE2;ctx.fillText((m?Math.round(m.tmin)+"°":"–")+" /",W-M-24-hw-10,y+rh/2+3);ctx.textAlign="left";y+=rh+gap});
  var mer=data&&data.mer;y+=6;card(M,y,W-2*M,mh,20,SOLEIL);ctx.fillStyle=NUIT;ctx.textBaseline="alphabetic";ctx.font="800 24px "+FB;setLS(3);ctx.fillText("LA MER",M+28,y+50);setLS(0);
  var parts=[["Eau",mer&&mer.eau!=null?(mer.eauVeille?"≈ ":"")+Math.round(mer.eau)+"°":null],["Vent",mer&&mer.vent!=null?Math.round(mer.vent)+" km/h":null],["Vagues",mer&&mer.vagues!=null?String(Math.round(mer.vagues*10)/10).replace(".",",")+" m":null]];
  var known=parts.filter(function(p){return p[1]!=null});parts=known.length?known:parts.map(function(p){return[p[0],"–"]});
  var cw=(W-2*M-56)/parts.length;parts.forEach(function(p,i){var x=M+28+i*cw;ctx.font="700 26px "+FB;ctx.fillStyle=ENCRE2;ctx.fillText(p[0],x,y+98);ctx.font="600 48px "+FD;ctx.fillStyle=NUIT;ctx.fillText(ellip(p[1],"600 48px "+FD,cw-14),x,y+150)});
  if(mer&&mer.dir!=null){ctx.fillStyle=NUIT;ctx.fillRect(M+28,y+176,W-2*M-56,3);ctx.font="800 30px "+FB;ctx.fillText(ellip(windFrom(mer.dir)+(mer.rafales!=null?" · rafales à "+Math.round(mer.rafales)+" km/h":""),"800 30px "+FB,W-2*M-56),M+28,y+218)}
  if(isMistral(mer)){var t="Mistral";var w=pillW(t,24);pill(W-M-w-10,y-20,t,NUIT,BLANC,null,null,24)}
  if(data){ctx.fillStyle=CIEL;ctx.font="700 24px "+FB;ctx.textBaseline="alphabetic";ctx.textAlign="left";ctx.fillText("Source : "+(data.source||"Open-Meteo")+" · open-meteo.com",M+4,y+mh+48)}
  if(!data){ctx.fillStyle=CIEL;ctx.font="700 26px "+FB;ctx.textAlign="center";ctx.fillText("Prévisions en attente : elles arrivent vers 7h",W/2,y+mh+70);ctx.textAlign="left"}}

/* ---------- Carrousel : couverture, une slide par événement (ou par ligne de détails), slide de fin ---------- */
var CAR_MAX_ITEMS=8;
function canCarousel(k){return k!=="meteo"&&k!=="jour"&&k!=="teaser"}
function carItems(P){if(isList(P.type))return(P.rows||[]).slice().sort(function(a,b){return(a.date||"").localeCompare(b.date||"")}).slice(0,CAR_MAX_ITEMS).map(function(r){return{row:r}});
  return(P.details||"").split("\n").map(function(s){return s.trim()}).filter(Boolean).slice(0,CAR_MAX_ITEMS).map(function(l){return{line:l}})}
function carCount(P){return carItems(P).length+2}
function carCta(P){return P.cta||(P.type==="question"?"Réponds en commentaire\net tague qui vient avec toi":isList(P.type)?"Enregistre ce post\net envoie-le à qui cherche une sortie":"Enregistre ce post\net partage-le autour de toi")}
function carBg(P){var th=isList(P.type)&&!P.couleur?themeOf("agenda"):themeFor(P);ctx.fillStyle=th.bg;ctx.fillRect(0,0,1080,1350);return th}
function carCounter(i,n,th){var t=(i+1)+" / "+n;ctx.font="800 26px "+FB;var w=ctx.measureText(t).width+36;ctx.fillStyle=th.fg===BLANC?"rgba(255,255,255,.18)":"rgba(11,27,63,.08)";rr(1080-64-w,64,w,48,24);ctx.fill();ctx.fillStyle=th.fg;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(t,1080-64-w/2,89);ctx.textAlign="left"}
function carFooter(th){if(th.fg===BLANC){footer(64,1350-34-64,64,false,1080);return}logo(64,1350-34-64,64,BLEU);ctx.fillStyle=NUIT;ctx.font="800 28px "+FB;ctx.textBaseline="alphabetic";ctx.fillText("Maison Côte Bleue",64+82,1350-34-32);ctx.fillStyle=ENCRE2;ctx.font="600 22px "+FB;ctx.fillText("@maison.cotebleue",64+82,1350-34-4)}
function drawCarousel(P,W,H,i){var items=carItems(P),n=items.length+2;i=Math.max(0,Math.min(i||0,n-1));var th=carBg(P),M=64,t=typ(P.type);
  if(i===0){/* Couverture */
    zigzag(760,170,1.75,SOLEIL,9);triangle(930,300,1.85,th.fg===BLANC?CIEL:SOLEIL);ring(140,1010,34,SOLEIL,14);
    var pillTxt=P.pill||(isList(P.type)?monthPill(rowsDates(P)):t.pill||"Côte Bleue"),title=P.titre||(isList(P.type)?defTitle(P):t.title);
    var hasPhoto=!!P.photoId,f=fitTitle(title,W-2*M,hasPhoto?260:440,hasPhoto?100:140,64),fH=f.lines.length*f.size*1.04;
    var blk=26*1.75+30+fH+(hasPhoto?40+420:0)+60+70,y=Math.max(150,(H-120-blk)/2);
    var ph=pill(M,y,pillTxt,th.pillBg,th.pillFg,th.pillShadow,th.pillBorder,26,3,4);y+=ph+30;drawTitle(f,M,y,th.fg,th.shadow);y+=fH+40;
    if(hasPhoto){photoFrame(imgFor(P.photoId),M,y,W-2*M,420,28,8,14,"");y+=420+40}
    var g=items.length?"Glisse pour voir les "+items.length+" →":"Glisse →";ctx.font="800 30px "+FB;var gw=ctx.measureText(g).width+56;ctx.fillStyle=NUIT;rr(M+6,y+6,gw,70,35);ctx.fill();ctx.fillStyle=SOLEIL;rr(M,y,gw,70,35);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=NUIT;ctx.stroke();ctx.fillStyle=NUIT;ctx.textBaseline="middle";ctx.fillText(g,M+28,y+37);
    carCounter(0,n,th);carFooter(th);return n}
  if(i===n-1){/* Fin : appel à l'action */
    ring(W-160,250,60,SOLEIL,22);triangle(120,1040,2.4,th.fg===BLANC?CIEL:SOLEIL);
    var cta=carCta(P),f2=fitTitle(cta,W-2*M-40,460,104,60),h2=f2.lines.length*f2.size*1.04,y2=(H-120-(300+40+h2+40+80))/2;
    bigLogo(W/2,y2+150,130);y2+=340;var font="600 "+f2.size+"px "+FD;f2.lines.forEach(function(l,k){var w=l.reduce(function(a,tk){return a+tk.width},0);if(th.shadow)drawLines([l],(W-w)/2+f2.size*.07,y2+k*f2.size*1.04+f2.size*.07,f2.size*1.04,font,font,th.shadow);drawLines([l],(W-w)/2,y2+k*f2.size*1.04,f2.size*1.04,font,font,th.fg)});y2+=h2+40;
    var ab="Abonne-toi : @maison.cotebleue";ctx.font="800 32px "+FB;var aw=ctx.measureText(ab).width+60;ctx.fillStyle=th.fg===BLANC?BLANC:BLEU;rr((W-aw)/2,y2,aw,76,38);ctx.fill();ctx.fillStyle=th.fg===BLANC?BLEU:BLANC;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(ab,W/2,y2+40);ctx.textAlign="left";
    carCounter(i,n,th);return n}
  /* Slide d'un élément */
  var it=items[i-1];zigzag(W-240,H-210,1.6,SOLEIL,9);carCounter(i,n,th);
  var cx=M,cw=W-2*M,cy=200,chMax=H-200-150;
  if(it.row){var r=it.row,v=vil(r.village),hasP=!!r.photoId,ph2=hasP?420:0;
    ctx.font="600 30px "+FB;var tl=layout(r.titre||"[Événement]","600 76px "+FD,"600 76px "+FD,cw-80);var fs=76;while(tl.length>3&&fs>52){fs-=6;tl=layout(r.titre||"","600 "+fs+"px "+FD,"600 "+fs+"px "+FD,cw-80)}
    var il=layout(r.infos||"","600 40px "+FB,"800 40px "+FB,cw-80),ch=48+230+40+(hasP?ph2+36:0)+tl.length*fs*1.06+24+il.length*54+56;ch=Math.min(ch,chMax);var y=cy+Math.max(0,(chMax-ch)/2);
    card(cx,y,cw,ch,32);var yy=y+48;
    if(r.date){var d=parseIso(r.date);dateBlock(cx+40,yy,230,230,JC[d.getDay()],String(d.getDate()),40,120)}
    logo(cx+40+230+36,yy+20,120,v.color);ctx.fillStyle=v.color;ctx.font="800 30px "+FB;setLS(4);ctx.textBaseline="alphabetic";ctx.fillText(ellip(v.name.toUpperCase(),"800 30px "+FB,cw-40-230-36-40),cx+40+230+36,yy+200);setLS(0);
    if(r.date){ctx.fillStyle=ENCRE2;ctx.font="700 28px "+FB;var dd=parseIso(r.date);ctx.fillText(JOURSL[dd.getDay()]+" "+dd.getDate()+" "+MOIS[dd.getMonth()].replace(".",""),cx+40+230+36,yy+236)}
    yy+=230+40;if(hasP){var oc=CREDIT;CREDIT=r.photoCredit||"";photoFrame(imgFor(r.photoId),cx+40,yy,cw-80,ph2,24,6,10,"");CREDIT=oc;yy+=ph2+36}
    drawLines(tl,cx+40,yy,fs*1.06,"600 "+fs+"px "+FD,"600 "+fs+"px "+FD,NUIT);yy+=tl.length*fs*1.06+24;drawLines(il,cx+40,yy,54,"600 40px "+FB,"800 40px "+FB,ENCRE2)}
  else{var line=it.line,num=null,m=line.match(/^\*\*(\d+)\*\*\s*/);if(m){num=m[1];line=line.slice(m[0].length)}var parts=line.split(/\s+·\s+/),head=parts.shift(),sub=parts.join(" · ");
    var hl=layout(head,"600 96px "+FD,"600 96px "+FD,cw-80),hs=96;while(hl.length>3&&hs>60){hs-=6;hl=layout(head,"600 "+hs+"px "+FD,"600 "+hs+"px "+FD,cw-80)}var sl=sub?layout(sub,"600 44px "+FB,"800 44px "+FB,cw-80):[];
    var ch3=48+(num?220+40:0)+hl.length*hs*1.06+(sl.length?30+sl.length*60:0)+56,y3=cy+Math.max(0,(chMax-ch3)/2);card(cx,y3,cw,ch3,32);var y4=y3+48;
    if(num){ctx.fillStyle=NUIT;ctx.beginPath();ctx.arc(cx+40+110+8,y4+110+8,110,0,Math.PI*2);ctx.fill();ctx.fillStyle=SOLEIL;ctx.beginPath();ctx.arc(cx+40+110,y4+110,110,0,Math.PI*2);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=NUIT;ctx.stroke();ctx.fillStyle=NUIT;ctx.font="600 130px "+FD;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(num,cx+40+110,y4+118);ctx.textAlign="left";y4+=220+40}
    drawLines(hl,cx+40,y4,hs*1.06,"600 "+hs+"px "+FD,"600 "+hs+"px "+FD,BLEU);y4+=hl.length*hs*1.06;if(sl.length){y4+=30;drawLines(sl,cx+40,y4,60,"600 44px "+FB,"800 44px "+FB,ENCRE2)}}
  carFooter(th);return n}

/* ---------- Point d’entrée ---------- */
function render(P,meteoData,slide){CREDIT=P.photoCredit||"";if(P.format==="carrousel"&&canCarousel(P.type)){if(cv.height!==1350)cv.height=1350;ctx.setTransform(1,0,0,1,0,0);ctx.textAlign="left";setLS(0);return drawCarousel(P,1080,1350,slide||0)}
  var story=P.format==="story"||(TYPES[P.type]&&TYPES[P.type].storyOnly);var W=1080,H=story?1920:1350;if(cv.height!==H)cv.height=H;
  ctx.setTransform(1,0,0,1,0,0);ctx.textAlign="left";setLS(0);var Q=Object.assign({},P,{format:story?"story":"post"});
  if(isList(P.type))return drawList(Q,W,H);if(P.type==="teaser")return drawTeaser(Q,W,H);if(P.type==="meteo")return drawMeteo(Q,W,H,meteoData);
  if(story)drawSimpleStory(Q,W,H);else drawSimplePost(Q,W,H)}
