import { useState, useEffect, useRef, useCallback } from "react";

const CATEGORIES = ["Groceries","Dining","Gas","Shopping","Bills","Travel","Health","Entertainment","Other"];
const CARD_COLORS = [
  "#1a1a1a","#3a3a38","#707070","#a0a0a0", // black, charcoal, gray, silver
  "#b80000","#8b3a2a","#6b2040","#b04070", // red, brick, burgundy, pink
  "#1a3a5c","#1a3aaa","#0a6aaa","#0a7878", // navy, cobalt, sky blue, teal
  "#4a3080","#2a1a80","#6a208a","#b87060", // purple, indigo, violet, rose gold
  "#b8860b","#704010","#c86010","#2a5010", // gold, brown, orange, forest green
  "#1a5c4a","#1a7858","#3a5068","#4a5468", // dark teal, mint, steel, slate
];

/* ── Card presets: auto-detected from name ── */
const CARD_PRESETS = [
  { keys:["quicksilver"],              bg1:"#c8c8c8", bg2:"#909090", text:"#111", network:"visa",       label:"Capital One Quicksilver" },
  { keys:["venture x"],                bg1:"#1c1c2e", bg2:"#0c0c1a", text:"#fff", network:"visa",       label:"Capital One Venture X" },
  { keys:["venture"],                  bg1:"#0f3460", bg2:"#06183a", text:"#fff", network:"visa",       label:"Capital One Venture" },
  { keys:["savor one","savorone"],     bg1:"#2a1616", bg2:"#1a0808", text:"#fff", network:"mastercard", label:"Capital One SavorOne" },
  { keys:["savor"],                    bg1:"#1a0a0a", bg2:"#2a0a0a", text:"#fff", network:"mastercard", label:"Capital One Savor" },
  { keys:["sapphire reserve"],         bg1:"#1a1a1a", bg2:"#2c2c2c", text:"#fff", network:"visa",       label:"Chase Sapphire Reserve" },
  { keys:["sapphire preferred"],       bg1:"#0a2a5c", bg2:"#0a1a3c", text:"#fff", network:"visa",       label:"Chase Sapphire Preferred" },
  { keys:["sapphire"],                 bg1:"#0a2060", bg2:"#06143c", text:"#fff", network:"visa",       label:"Chase Sapphire" },
  { keys:["freedom unlimited"],        bg1:"#1a3a8c", bg2:"#0a1860", text:"#fff", network:"visa",       label:"Chase Freedom Unlimited" },
  { keys:["freedom flex"],             bg1:"#0a2860", bg2:"#06143c", text:"#fff", network:"mastercard", label:"Chase Freedom Flex" },
  { keys:["freedom"],                  bg1:"#0a2860", bg2:"#06143c", text:"#fff", network:"visa",       label:"Chase Freedom" },
  { keys:["amazon prime","amazon visa"],bg1:"#131921",bg2:"#080e16", text:"#fff", network:"visa",       label:"Amazon Prime Visa" },
  { keys:["amex platinum","platinum card"],bg1:"#808080",bg2:"#505050",text:"#fff",network:"amex",      label:"Amex Platinum" },
  { keys:["platinum"],                 bg1:"#808080", bg2:"#505050", text:"#fff", network:"amex",       label:"Amex Platinum" },
  { keys:["amex gold","gold card"],    bg1:"#c8940a", bg2:"#906806", text:"#fff", network:"amex",       label:"Amex Gold Card" },
  { keys:["blue cash preferred"],      bg1:"#0064cc", bg2:"#004499", text:"#fff", network:"amex",       label:"Amex Blue Cash Preferred" },
  { keys:["blue cash"],                bg1:"#006ecc", bg2:"#0050a0", text:"#fff", network:"amex",       label:"Amex Blue Cash" },
  { keys:["discover it","discover"],   bg1:"#f07000", bg2:"#c05200", text:"#fff", network:"discover",   label:"Discover it" },
  { keys:["double cash"],              bg1:"#003870", bg2:"#001e48", text:"#fff", network:"mastercard", label:"Citi Double Cash" },
  { keys:["custom cash"],              bg1:"#005c5c", bg2:"#003636", text:"#fff", network:"mastercard", label:"Citi Custom Cash" },
  { keys:["citi premier","premier"],   bg1:"#0a3870", bg2:"#081c44", text:"#fff", network:"mastercard", label:"Citi Premier" },
  { keys:["active cash","wells fargo"],bg1:"#cc1010", bg2:"#880808", text:"#fff", network:"visa",       label:"Wells Fargo Active Cash" },
  { keys:["cash rewards","bank of america","boa"],bg1:"#d01818",bg2:"#980808",text:"#fff",network:"visa",label:"BofA Cash Rewards" },
  { keys:["apple card"],               bg1:"#1c1c1e", bg2:"#3a3a3c", text:"#fff", network:"mastercard", label:"Apple Card" },
  { keys:["paypal"],                   bg1:"#003087", bg2:"#009cde", text:"#fff", network:"mastercard", label:"PayPal Cashback" },
  { keys:["bilt"],                     bg1:"#2c2c2c", bg2:"#181818", text:"#fff", network:"mastercard", label:"Bilt Rewards" },
  { keys:["united explorer","united"], bg1:"#002266", bg2:"#001040", text:"#fff", network:"visa",       label:"United Explorer" },
  { keys:["marriott bonvoy"],          bg1:"#8b1a1a", bg2:"#660e0e", text:"#fff", network:"amex",       label:"Marriott Bonvoy" },
  { keys:["hilton honors","hilton"],   bg1:"#1a3a6c", bg2:"#0a1a44", text:"#fff", network:"amex",       label:"Hilton Honors" },
  { keys:["delta gold","delta"],       bg1:"#003a7c", bg2:"#001e4c", text:"#fff", network:"amex",       label:"Delta SkyMiles Gold" },
  { keys:["southwest"],                bg1:"#304cb2", bg2:"#1e2e96", text:"#fff", network:"visa",       label:"Southwest Rapid Rewards" },
];

const getCardPreset = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  for (const p of CARD_PRESETS) {
    if (p.keys.some(k => lower.includes(k))) return p;
  }
  return null;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => Number(n||0).toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0});
const fmtFull = (n) => Number(n||0).toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2});
const pct = (used, limit) => limit ? Math.round((used / limit) * 100) : 0;
const barColor = (p) => p>=90?"#dc3545":p>=75?"#e8a020":p>=28?"#e8a020":p>=10?"#f59e0b":"#18845a";
const recPct = (spent, limit) => limit ? Math.min(Math.round(spent/(limit*0.28)*100), 100) : 0;
const recBarColor = (spent, limit) => { const p=limit?Math.round(spent/limit*100):0; return p>=28?"#e8a020":p>=10?"#f59e0b":"#18845a"; };
const alertStyle = (p) => {
  if (p>=90) return {bg:"#fde8e8",border:"#f5a0a0",text:"#7a1a1a",icon:"#a82020"};
  if (p>=75) return {bg:"#fdf4e0",border:"#f0c860",text:"#5a3800",icon:"#8a5500"};
  return null;
};
const dateStr = (d) => {
  const dt=new Date(d), now=new Date(), diff=Math.floor((now-dt)/86400000);
  if (diff===0) return "Today";
  if (diff===1) return "Yesterday";
  return dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const todayISO = () => new Date().toISOString().split("T")[0];

const STORAGE_KEY = "cardtrack_v2";
const PIN_KEY = "cardtrack_pin";
const NOTIF_KEY = "cardtrack_notif_seen";

const loadData = () => { try{const r=localStorage.getItem(STORAGE_KEY);if(r)return JSON.parse(r);}catch{} return{cards:[],transactions:[]}; };
const saveData = (d) => { try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}catch{} };

const catColors = {
  Groceries:{bg:"#e0f0e8",fg:"#0a5030"},Dining:{bg:"#f5e8e0",fg:"#6a2810"},
  Gas:{bg:"#f5f0d8",fg:"#5a3800"},Shopping:{bg:"#f5e0ea",fg:"#6a1838"},
  Bills:{bg:"#e8e0f5",fg:"#381880"},Travel:{bg:"#e0e8f5",fg:"#0a3060"},
  Health:{bg:"#e5f0d8",fg:"#284a08"},Entertainment:{bg:"#f5e0e0",fg:"#6a1818"},
  Other:{bg:"#eae8e0",fg:"#3a3830"},
};

const catIcons = {
  Groceries:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M4 4s0-2 3-2 3 2 3 2M3 10s1 2 4 2 4-2 4-2" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Dining:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke={c} strokeWidth="1.2"/><path d="M7 4v2h2" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Gas:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11V5l4-3 4 3v6H3z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Shopping:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="8" rx="1" stroke={c} strokeWidth="1.2"/><path d="M5 4V3a2 2 0 014 0v1" stroke={c} strokeWidth="1.2"/></svg>,
  Bills:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="1.5" stroke={c} strokeWidth="1.2"/><path d="M5 6h4M5 8.5h2.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Travel:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke={c} strokeWidth="1.2"/><path d="M2 7h10M7 2c-1.5 1.5-2 3-2 5s.5 3.5 2 5c1.5-1.5 2-3 2-5s-.5-3.5-2-5z" stroke={c} strokeWidth="1.2"/></svg>,
  Health:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 3h3v3h3v3h-3v3h-3v-3h-3v-3h3z" stroke={c} strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  Entertainment:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="7,2 8.5,5.5 12,5.5 9.2,7.8 10.2,11.2 7,9 3.8,11.2 4.8,7.8 2,5.5 5.5,5.5" stroke={c} strokeWidth="1.2" fill="none"/></svg>,
  Other:(c)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="7" r="1.2" fill={c}/><circle cx="7" cy="7" r="1.2" fill={c}/><circle cx="10" cy="7" r="1.2" fill={c}/></svg>,
};

/* ── Icons ── */
const IconBack  = () => <svg width="11" height="19" viewBox="0 0 11 19" fill="none"><path d="M9.5 1L1 9.5L9.5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconPlus  = ({color="#fff",size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke={color} strokeWidth="2.2" strokeLinecap="round"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 5h8M6 5V4a1 1 0 011-1h2a1 1 0 011 1v1M5 5v7a1 1 0 001 1h4a1 1 0 001-1V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const IconEdit  = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 3.5l4 4M2 13.5V16h2.5L14.5 5.5l-3-3L2 13.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconAlert = ({color}) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.2"/><path d="M7 4.5v3M7 9.5v.01" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconExport= () => <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 2v9M5.5 5l3-3 3 3M3 12v3h11v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconLock  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>;
const IconHome  = ({active}) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.6" fill={active?"currentColor":"none"} fillOpacity={active?.15:0}/>{active&&<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.6" fill="none"/>}</svg>;
const IconCard  = ({active}) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill={active?"currentColor":"none"} fillOpacity={active?.12:0}/>{active&&<rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>}<path d="M2 10h20" stroke="currentColor" strokeWidth="1.6"/></svg>;
const IconStats = ({active}) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 20V12M9 20V7M13 20V14M19 20V9" stroke="currentColor" strokeWidth={active?2.2:1.6} strokeLinecap="round"/></svg>;
const IconBell  = ({active}) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3a6 6 0 016 6v3.5l2 2.5H3l2-2.5V9a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" fill={active?"currentColor":"none"} fillOpacity={active?.18:0}/><path d="M8.5 17a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

/* ── Credit Card Visual ── */
const ChipSVG = () => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
    <rect x="0.5" y="0.5" width="39" height="29" rx="4.5" fill="#c8a020" stroke="#a07808" strokeWidth="0.8"/>
    <rect x="14" y="0.5" width="12" height="29" fill="#a88010" opacity="0.45"/>
    <rect x="0.5" y="10" width="39" height="10" fill="#a88010" opacity="0.45"/>
    <rect x="14" y="10" width="12" height="10" fill="#906808" opacity="0.65"/>
    <line x1="14" y1="0.5" x2="14" y2="29.5" stroke="#906808" strokeWidth="0.7" opacity="0.8"/>
    <line x1="26" y1="0.5" x2="26" y2="29.5" stroke="#906808" strokeWidth="0.7" opacity="0.8"/>
    <line x1="0.5" y1="10" x2="39.5" y2="10" stroke="#906808" strokeWidth="0.7" opacity="0.8"/>
    <line x1="0.5" y1="20" x2="39.5" y2="20" stroke="#906808" strokeWidth="0.7" opacity="0.8"/>
  </svg>
);

const NetworkLogo = ({ network, textColor="#fff" }) => {
  if (network==="visa") return <span style={{fontFamily:"'Times New Roman',serif",fontSize:24,fontWeight:900,fontStyle:"italic",color:textColor,opacity:.9,letterSpacing:"-0.5px"}}>VISA</span>;
  if (network==="mastercard") return <svg width="40" height="26" viewBox="0 0 40 26"><circle cx="15" cy="13" r="13" fill="#eb001b" opacity=".9"/><circle cx="25" cy="13" r="13" fill="#f79e1b" opacity=".9"/></svg>;
  if (network==="amex") return <span style={{fontFamily:"sans-serif",fontSize:13,fontWeight:800,color:textColor,opacity:.9,letterSpacing:"2px"}}>AMEX</span>;
  if (network==="discover") return <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,color:textColor,opacity:.9,letterSpacing:".5px"}}>DISCOVER</span><div style={{width:14,height:14,borderRadius:"50%",background:"#f07000"}}/></div>;
  return null;
};

const CreditCardVisual = ({ card, style={} }) => {
  const p = getCardPreset(card.name);
  const bg1 = p?.bg1 || card.color;
  const bg2 = p?.bg2 || (card.color+"99");
  const tc = p?.text || "#fff";
  return (
    <div style={{width:"100%",aspectRatio:"1.586",borderRadius:18,background:`linear-gradient(135deg,${bg1} 0%,${bg2} 100%)`,padding:"18px 20px",display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"0 10px 36px rgba(0,0,0,.26),0 2px 8px rgba(0,0,0,.12)",position:"relative",overflow:"hidden",...style}}>
      <div style={{position:"absolute",right:-60,top:-60,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,.05)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:-90,bottom:-90,width:260,height:260,borderRadius:"50%",background:"rgba(255,255,255,.04)",pointerEvents:"none"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
        <span style={{fontSize:12,fontWeight:700,color:`${tc}cc`,maxWidth:"60%",lineHeight:1.3}}>{p?.label||card.name}</span>
        {p?.network&&<NetworkLogo network={p.network} textColor={tc}/>}
      </div>
      <div style={{position:"relative"}}><ChipSVG/></div>
      <div style={{fontFamily:"monospace",fontSize:15,letterSpacing:"4px",color:`${tc}55`,position:"relative"}}>•••• •••• •••• ••••</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",position:"relative"}}>
        <div>
          <div style={{fontSize:8,color:`${tc}50`,letterSpacing:"1.5px",marginBottom:2}}>CARDHOLDER</div>
          <div style={{fontSize:12,fontWeight:600,color:`${tc}dd`,textTransform:"uppercase",letterSpacing:".5px"}}>{card.name.slice(0,22)}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:`${tc}50`,letterSpacing:"1.5px",marginBottom:2}}>CREDIT LIMIT</div>
          <div style={{fontSize:13,fontWeight:700,color:`${tc}dd`,fontFamily:"monospace"}}>{fmt(card.limit)}</div>
        </div>
      </div>
    </div>
  );
};

/* ── Mandala Background ── */
const D2R=Math.PI/180;
const mpx=(c,r,a)=>c+r*Math.cos(a*D2R);
const mpy=(c,r,a)=>c+r*Math.sin(a*D2R);
const flamePetal=(c,r1,r2,a,hs)=>{const lx=mpx(c,r1,a-hs),ly=mpy(c,r1,a-hs),rx=mpx(c,r1,a+hs),ry=mpy(c,r1,a+hs),tx=mpx(c,r2,a),ty=mpy(c,r2,a),cm=r1*.15+r2*.85,c1x=mpx(c,cm,a-hs*.12),c1y=mpy(c,cm,a-hs*.12),c2x=mpx(c,cm,a+hs*.12),c2y=mpy(c,cm,a+hs*.12);return`M${lx},${ly} Q${c1x},${c1y} ${tx},${ty} Q${c2x},${c2y} ${rx},${ry} Z`;};
const lotusPetal=(c,r1,r2,a,hs)=>{const lx=mpx(c,r1,a-hs),ly=mpy(c,r1,a-hs),rx=mpx(c,r1,a+hs),ry=mpy(c,r1,a+hs),tx=mpx(c,r2,a),ty=mpy(c,r2,a),rm=r1*.25+r2*.75,rt=r2*1.04,c1x=mpx(c,rm,a-hs*.75),c1y=mpy(c,rm,a-hs*.75),c2x=mpx(c,rt,a-hs*.18),c2y=mpy(c,rt,a-hs*.18),c3x=mpx(c,rt,a+hs*.18),c3y=mpy(c,rt,a+hs*.18),c4x=mpx(c,rm,a+hs*.75),c4y=mpy(c,rm,a+hs*.75);return`M${lx},${ly} C${c1x},${c1y} ${c2x},${c2y} ${tx},${ty} C${c3x},${c3y} ${c4x},${c4y} ${rx},${ry} Z`;};
const teardrop=(c,r1,r2,a,hs)=>{const lx=mpx(c,r1,a-hs),ly=mpy(c,r1,a-hs),rx=mpx(c,r1,a+hs),ry=mpy(c,r1,a+hs),tx=mpx(c,r2,a),ty=mpy(c,r2,a),rm=r1*.4+r2*.6,c1x=mpx(c,rm,a-hs*.5),c1y=mpy(c,rm,a-hs*.5),c2x=mpx(c,rm,a+hs*.5),c2y=mpy(c,rm,a+hs*.5);return`M${lx},${ly} C${c1x},${c1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${c2x},${c2y} ${rx},${ry} Z`;};
function MandalaSVG({size=300,color='#1c3250',baseOpacity=0.09}){
  const c=size/2,s=size/300,r=v=>v*s,sw=0.45;
  const FR=(n,r1,r2,hs,off=0,fo=0.2)=>Array.from({length:n},(_,i)=>{const a=(360/n)*i+off;return<path key={i} d={flamePetal(c,r(r1),r(r2),a,hs)} fill={color} fillOpacity={fo} stroke={color} strokeWidth={sw}/>;});
  const LR=(n,r1,r2,hs,off=0,fo=0.18)=>Array.from({length:n},(_,i)=>{const a=(360/n)*i+off;return<path key={i} d={lotusPetal(c,r(r1),r(r2),a,hs)} fill={color} fillOpacity={fo} stroke={color} strokeWidth={sw}/>;});
  const TR=(n,r1,r2,hs,off=0,fo=0.22)=>Array.from({length:n},(_,i)=>{const a=(360/n)*i+off;return<path key={i} d={teardrop(c,r(r1),r(r2),a,hs)} fill={color} fillOpacity={fo} stroke={color} strokeWidth={sw}/>;});
  const DR=(n,rad,dr,off=0)=>Array.from({length:n},(_,i)=>{const a=(360/n)*i+off;return<circle key={i} cx={mpx(c,r(rad),a)} cy={mpy(c,r(rad),a)} r={r(dr)} fill={color}/>;});
  const SC=(n,rad,pr)=>Array.from({length:n},(_,i)=>{const a=(360/n)*i;return<circle key={i} cx={mpx(c,r(rad),a)} cy={mpy(c,r(rad),a)} r={r(pr)} fill="none" stroke={color} strokeWidth={sw*.7}/>;});
  const SP=(n,r1,r2,off=0)=>Array.from({length:n},(_,i)=>{const a=(360/n)*i+off;return<line key={i} x1={mpx(c,r(r1),a)} y1={mpy(c,r(r1),a)} x2={mpx(c,r(r2),a)} y2={mpy(c,r(r2),a)} stroke={color} strokeWidth={sw*.5}/>;});
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" opacity={baseOpacity}>
      <circle cx={c} cy={c} r={r(3.5)} fill={color}/>
      <circle cx={c} cy={c} r={r(5.5)} fill="none" stroke={color} strokeWidth={sw}/>
      {FR(8,5.5,15,9,0,.3)}{FR(8,5.5,11,6,22.5,.15)}
      <circle cx={c} cy={c} r={r(16)} fill="none" stroke={color} strokeWidth={sw}/>
      {DR(16,17.5,.9)}<circle cx={c} cy={c} r={r(19)} fill="none" stroke={color} strokeWidth={sw*.7}/>
      {TR(16,19,30,8,0,.2)}{TR(16,19,24,4,11.25,.1)}
      <circle cx={c} cy={c} r={r(31)} fill="none" stroke={color} strokeWidth={sw}/>
      {SC(32,33,2.5)}<circle cx={c} cy={c} r={r(36)} fill="none" stroke={color} strokeWidth={sw*.7}/>
      {SP(32,36,40,5.625)}{DR(32,40.5,.9,5.625)}
      {LR(16,40,56,11,0,.22)}{LR(16,40,50,6,11.25,.1)}
      <circle cx={c} cy={c} r={r(57)} fill="none" stroke={color} strokeWidth={sw}/>
      {SC(48,59.5,2.8)}<circle cx={c} cy={c} r={r(63)} fill="none" stroke={color} strokeWidth={sw*.7}/>
      {DR(48,64,.8,3.75)}{SP(24,57,63,7.5)}
      {FR(24,64,78,7,0,.18)}{TR(24,64,72,4,7.5,.1)}
      <circle cx={c} cy={c} r={r(79)} fill="none" stroke={color} strokeWidth={sw}/>
      <circle cx={c} cy={c} r={r(81)} fill="none" stroke={color} strokeWidth={sw*.6}/>
      {DR(48,82.5,.8)}{SC(48,84.5,2.2)}<circle cx={c} cy={c} r={r(87)} fill="none" stroke={color} strokeWidth={sw}/>
      {LR(16,87,108,10,0,.2)}{LR(16,87,100,5.5,11.25,.1)}{TR(32,87,94,3,5.625,.08)}
      <circle cx={c} cy={c} r={r(109)} fill="none" stroke={color} strokeWidth={sw}/>
      {SC(64,111.5,2.5)}<circle cx={c} cy={c} r={r(114.5)} fill="none" stroke={color} strokeWidth={sw*.8}/>
      {DR(64,116,.75,2.8125)}<circle cx={c} cy={c} r={r(117.5)} fill="none" stroke={color} strokeWidth={sw*.5}/>
      {FR(16,117.5,140,9,0,.18)}{LR(16,117.5,132,5,11.25,.1)}
      <circle cx={c} cy={c} r={r(142)} fill="none" stroke={color} strokeWidth={sw}/>
      {SC(80,144,2)}<circle cx={c} cy={c} r={r(147)} fill="none" stroke={color} strokeWidth={sw*.8}/>
      <circle cx={c} cy={c} r={r(149)} fill="none" stroke={color} strokeWidth={sw*.4}/>
    </svg>
  );
}
function MandalaBackground({color='#1c3250',centerSize=520,cornerSize=280,accentSize=170}){
  const off=-Math.round(cornerSize*.32);
  return(
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}><MandalaSVG size={centerSize} color={color} baseOpacity={0.14}/></div>
      <div style={{position:'absolute',top:off,left:off}}><MandalaSVG size={cornerSize} color={color} baseOpacity={0.09}/></div>
      <div style={{position:'absolute',top:off,right:off}}><MandalaSVG size={cornerSize} color={color} baseOpacity={0.09}/></div>
      <div style={{position:'absolute',bottom:off,left:off}}><MandalaSVG size={cornerSize} color={color} baseOpacity={0.09}/></div>
      <div style={{position:'absolute',bottom:off,right:off}}><MandalaSVG size={cornerSize} color={color} baseOpacity={0.09}/></div>
      <div style={{position:'absolute',top:'28%',right:-Math.round(accentSize*.32)}}><MandalaSVG size={accentSize} color={color} baseOpacity={0.07}/></div>
      <div style={{position:'absolute',bottom:'28%',left:-Math.round(accentSize*.32)}}><MandalaSVG size={accentSize} color={color} baseOpacity={0.07}/></div>
    </div>
  );
}

/* ── Swipe Row ── */
function SwipeRow({ children, onDelete, onEdit, bg="#fff", style={} }) {
  const [sw, setSw] = useState({ v:0, anim:true });
  const startX = useRef(0), startY = useRef(0), startV = useRef(0);
  const swiped = useRef(false), dir = useRef(null); // dir: null | 'h' | 'v'
  const ACTION_W = onEdit ? 136 : 76;

  const ts = (e) => {
    startX.current=e.touches[0].clientX;
    startY.current=e.touches[0].clientY;
    startV.current=sw.v;
    swiped.current=false;
    dir.current=null;
    setSw(s=>({...s,anim:false}));
  };
  const tm = (e) => {
    const dx=e.touches[0].clientX-startX.current;
    const dy=e.touches[0].clientY-startY.current;
    // lock direction on first significant movement
    if(!dir.current&&(Math.abs(dx)>4||Math.abs(dy)>4))
      dir.current=Math.abs(dx)>Math.abs(dy)?'h':'v';
    if(dir.current==='v')return; // vertical scroll — do nothing
    e.preventDefault(); // horizontal swipe — block scroll
    if(Math.abs(dx)>8)swiped.current=true;
    setSw({v:Math.max(-ACTION_W,Math.min(0,startV.current+dx)),anim:false});
  };
  const te = () => { if(dir.current==='v'){setSw(s=>({...s,anim:true}));return;} setSw({v:sw.v<-55?-ACTION_W:0,anim:true}); };
  const close = () => setSw({v:0,anim:true});

  return (
    <div style={{position:"relative",overflow:"hidden",...style}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,display:"flex"}}>
        {onEdit&&<button onClick={()=>{close();onEdit();}} style={{width:60,background:"#1a3a5c",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Edit</button>}
        <button onClick={()=>{close();if(window.confirm("Delete this? This cannot be undone."))onDelete();}} style={{width:76,background:"#dc3545",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Delete</button>
      </div>
      <div
        style={{transform:`translateX(${sw.v}px)`,transition:sw.anim?"transform 0.25s ease":"none",background:bg,position:"relative",zIndex:1}}
        onClickCapture={e=>{if(swiped.current){e.stopPropagation();swiped.current=false;}}}
        onTouchStart={ts} onTouchMove={tm} onTouchEnd={te}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Theme ── */
const T = {
  bg:"#e9e4db", card:"#f5f1eb", border:"rgba(28,50,80,0.10)",
  text:"#1a2030", muted:"#7a7870", hint:"#9a9080",
  surface:"#dfd9cf", accent:"#1c3250",
  font:"'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  serif:"'DM Serif Display',Georgia,serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace",
  r:16, rs:12,
};

const S = {
  app:   { maxWidth:460, margin:"0 auto", fontFamily:T.font, background:T.bg, minHeight:"100vh", color:T.text, WebkitFontSmoothing:"antialiased", overflowX:"hidden" },
  card:  { background:T.card, borderRadius:T.r, border:`1px solid ${T.border}`, padding:"16px 18px", marginBottom:10 },
  btn:   { width:"100%", padding:"15px", borderRadius:T.rs, border:"none", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:T.font },
  input: { width:"100%", padding:"13px 14px", borderRadius:T.rs, border:`1.5px solid ${T.border}`, fontSize:15, background:T.surface, color:T.text, outline:"none", boxSizing:"border-box", fontFamily:T.font },
  label: { fontSize:12, color:T.muted, marginBottom:7, display:"block", fontWeight:600, letterSpacing:".3px" },
  toast: { position:"fixed", bottom:100, left:"50%", transform:"translateX(-50%)", background:T.text, color:"#fff", padding:"11px 24px", borderRadius:28, fontSize:13, fontWeight:600, zIndex:200, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,.2)" },
};

/* ── Notifications ── */
const sendNotif = (title, body) => {
  if (typeof Notification!=="undefined" && Notification.permission==="granted") {
    try { new Notification(title,{body,icon:"/icon-192.png"}); } catch {}
  }
};
const askNotif = async () => {
  if (typeof Notification==="undefined") return false;
  if (Notification.permission==="granted") return true;
  if (Notification.permission==="denied") return false;
  return (await Notification.requestPermission())==="granted";
};
const getNotifSeen = () => { try{return JSON.parse(localStorage.getItem(NOTIF_KEY)||"{}");}catch{return{};} };
const markSeen = (k) => { const s=getNotifSeen(); s[k]=true; localStorage.setItem(NOTIF_KEY,JSON.stringify(s)); };
const checkNotif = (card, newSpent, prevSpent) => {
  const p=pct(newSpent,card.limit), pp=pct(prevSpent,card.limit), seen=getNotifSeen();
  if (p>=90&&pp<90&&!seen[`${card.id}_90`]) { sendNotif("Credit Alert",`${card.name} at ${p}%! ${fmt(card.limit-newSpent)} left.`); markSeen(`${card.id}_90`); }
  else if (p>=75&&pp<75&&!seen[`${card.id}_75`]) { sendNotif("CardTrack",`${card.name} reached 75% — ${fmt(card.limit-newSpent)} left.`); markSeen(`${card.id}_75`); }
  else if (p>=28&&pp<28&&!seen[`${card.id}_28`]) { sendNotif("Put it away! 🛑",`${card.name} hit 28%. Stop here to protect your credit score.`); markSeen(`${card.id}_28`); }
};

/* ══════════════ PIN LOCK ══════════════ */
function PinLock({ onUnlock }) {
  const [pin,setPin]=useState(""); const [stored]=useState(localStorage.getItem(PIN_KEY));
  const [mode,setMode]=useState(stored?"unlock":"setup"); const [confirm2,setConfirm2]=useState("");
  const [err,setErr]=useState(""); const [step,setStep]=useState(1);

  const digit = (d) => {
    setErr("");
    if (mode==="setup") {
      if (step===1) { const n=pin+d; setPin(n); if(n.length===4){setStep(2);setConfirm2("");} }
      else { const n=confirm2+d; setConfirm2(n); if(n.length===4){if(n===pin){localStorage.setItem(PIN_KEY,pin);onUnlock();}else{setErr("PINs don't match");setPin("");setConfirm2("");setStep(1);}}}
    } else { const n=pin+d; setPin(n); if(n.length===4){if(n===stored)onUnlock();else{setErr("Wrong PIN");setPin("");}}}
  };
  const del = () => { setErr(""); if(mode==="setup"&&step===2)setConfirm2(c=>c.slice(0,-1));else setPin(p=>p.slice(0,-1)); };
  const cur = mode==="setup"&&step===2?confirm2:pin;

  return (
    <div style={{...S.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 30px",minHeight:"100vh",background:`linear-gradient(160deg,${T.accent} 0%,#0a1a2c 100%)`}}>
      <div style={{marginBottom:28,color:"rgba(255,255,255,.55)"}}><IconLock/></div>
      <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 6px",color:"#fff"}}>{mode==="setup"?(step===1?"Create your PIN":"Confirm your PIN"):"Enter your PIN"}</h1>
      <p style={{fontSize:13,color:"rgba(255,255,255,.45)",margin:"0 0 32px",textAlign:"center"}}>{mode==="setup"?(step===1?"Choose a 4-digit PIN":"Enter the same PIN again"):"Welcome back to CardTrack"}</p>
      <div style={{display:"flex",gap:14,marginBottom:32}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",background:i<cur.length?"#fff":"transparent",transition:"all .15s"}}/>)}
      </div>
      {err&&<div style={{color:"#ff8080",fontSize:13,marginBottom:16,fontWeight:500}}>{err}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>d===""?<div key={i}/>:
          <button key={i} onClick={()=>d==="⌫"?del():digit(String(d))} style={{width:72,height:72,borderRadius:"50%",border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.09)",color:"#fff",fontSize:d==="⌫"?20:26,fontWeight:400,cursor:"pointer",fontFamily:d==="⌫"?T.font:T.mono,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {d}
          </button>
        )}
      </div>
      {mode==="unlock"&&<button onClick={()=>{setMode("setup");setPin("");setStep(1);setErr("");}} style={{marginTop:28,background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:12,cursor:"pointer",fontFamily:T.font}}>Reset PIN</button>}
    </div>
  );
}

/* ══════════════ MAIN APP ══════════════ */
export default function CardTrack() {
  const [locked,setLocked]=useState(!!localStorage.getItem(PIN_KEY));
  const [data,setData]=useState(loadData);
  const [screen,setScreen]=useState("home");
  const [selCard,setSelCard]=useState(null);
  const [toast,setToast]=useState(null);
  const [notif,setNotif]=useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  const [over30,setOver30]=useState(null); // {cardId, p, limit, spent}
  const toastRef=useRef(null);

  useEffect(()=>{saveData(data);},[data]);
  useEffect(()=>{if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});},[]);
  useEffect(()=>{
    data.cards.forEach(card=>{
      if(!card.paymentDueDay)return;
      const today=new Date(),due=new Date(today.getFullYear(),today.getMonth(),card.paymentDueDay);
      if(due<today)due.setMonth(due.getMonth()+1);
      const days=Math.ceil((due-today)/86400000);
      if(days<=10){
        const key=`cardtrack_duenotif_${card.id}_${due.getMonth()}`;
        if(!localStorage.getItem(key)){
          sendNotif(`Pay ${card.name} in ${days} day${days!==1?"s":""}!`,`Pay your balance now to boost your credit score. On-time payments = 35% of your score.`);
          localStorage.setItem(key,"1");
        }
      }
    });
  },[data.cards]);

  const showToast=(m)=>{setToast(m);if(toastRef.current)clearTimeout(toastRef.current);toastRef.current=setTimeout(()=>setToast(null),2200);};
  const toggleNotif=async()=>{if(notif){setNotif(false);showToast("Notifications off");return;}const ok=await askNotif();setNotif(ok);showToast(ok?"Notifications enabled!":"Permission denied in settings");};

  const addCard=(c)=>{const id=uid();setData(d=>({...d,cards:[...d.cards,{...c,id}]}));showToast("Card added");return id;};
  const updateCard=(id,u)=>{setData(d=>({...d,cards:d.cards.map(c=>c.id===id?{...c,...u}:c)}));showToast("Card updated");};
  const deleteCard=(id)=>{setData(d=>({cards:d.cards.filter(c=>c.id!==id),transactions:d.transactions.filter(t=>t.cardId!==id)}));showToast("Card deleted");setScreen("home");};

  const addTxn=(txn)=>{
    const prev=data.transactions.filter(t=>t.cardId===txn.cardId).reduce((s,t)=>s+Number(t.amount),0);
    const card=data.cards.find(c=>c.id===txn.cardId);
    if(card)checkNotif(card,prev+Number(txn.amount),prev);
    const newSpent=prev+Number(txn.amount);
    if(card&&!card.useFullLimit&&pct(newSpent,card.limit)>=30){
      const seenKey=`cardtrack_over30_${card.id}`;
      if(!localStorage.getItem(seenKey))setOver30({cardId:card.id,p:Math.round(pct(newSpent,card.limit)),limit:card.limit,spent:newSpent});
    }
    setData(d=>({...d,transactions:[...d.transactions,{...txn,id:uid()}]}));
    showToast("Transaction saved");
  };
  const deleteTxn=(id)=>{setData(d=>({...d,transactions:d.transactions.filter(t=>t.id!==id)}));showToast("Deleted");};
  const cardSpent=useCallback((cid)=>data.transactions.filter(t=>t.cardId===cid).reduce((s,t)=>s+Number(t.amount),0),[data.transactions]);

  const totalSpent=data.transactions.reduce((s,t)=>s+Number(t.amount),0);
  const totalLimit=data.cards.reduce((s,c)=>s+Number(c.limit),0);
  const spentPct=pct(totalSpent,totalLimit);
  const alerts=data.cards.map(c=>({...c,spent:cardSpent(c.id),p:pct(cardSpent(c.id),c.limit)})).filter(c=>c.p>=75).sort((a,b)=>b.p-a.p);

  const exportCSV=()=>{
    const rows=[["Date","Card","Category","Description","Amount"]];
    data.transactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(t=>{const card=data.cards.find(c=>c.id===t.cardId);rows.push([t.date,card?.name||"?",t.category,t.description,t.amount]);});
    const blob=new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cardtrack.csv";a.click();
    showToast("Exported");
  };

  if (locked) return <PinLock onUnlock={()=>setLocked(false)}/>;

  /* ── OVER-30% MODAL ── */
  const Over30Modal=()=>{
    if(!over30)return null;
    const card=data.cards.find(c=>c.id===over30.cardId);
    const dismiss=(useRest)=>{
      localStorage.setItem(`cardtrack_over30_${over30.cardId}`,"1");
      if(useRest)updateCard(over30.cardId,{useFullLimit:true});
      setOver30(null);
    };
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div style={{background:T.card,borderRadius:"22px 22px 0 0",padding:"28px 22px 44px",width:"100%",maxWidth:460,boxShadow:"0 -8px 40px rgba(0,0,0,.18)"}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 24px"}}/>
          <div style={{fontSize:22,fontWeight:700,marginBottom:10}}>⚠️ You've used {over30.p}%</div>
          <div style={{fontSize:14,color:T.muted,lineHeight:1.6,marginBottom:24}}>
            You've already used <strong>{over30.p}%</strong> of <strong>{card?.name}</strong> — above the ideal 28% for a healthy credit score.<br/><br/>
            Do you want to keep tracking against the <strong>remaining {100-over30.p}%</strong>, or stay under the 28% recommendation?
          </div>
          <button onClick={()=>dismiss(true)} style={{...S.btn,background:T.accent,color:"#fff",borderRadius:T.rs,marginBottom:10}}>
            Yes — track remaining {fmt(over30.limit-over30.spent)} limit
          </button>
          <button onClick={()=>dismiss(false)} style={{...S.btn,background:T.surface,color:T.text,borderRadius:T.rs,border:`1px solid ${T.border}`}}>
            No — keep 28% guardrail
          </button>
        </div>
      </div>
    );
  };

  /* ── HOME ── */
  const Home=()=>{
    const r=36,circ=2*Math.PI*r,off=circ-(circ*Math.min(spentPct,100))/100;
    const has=data.cards.length>0;
    return(
      <div>
        <div className="page-top">
          <div>
            <div style={{fontSize:13,color:T.muted,fontWeight:500,marginBottom:2}}>Your spending</div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:"-.5px",fontFamily:T.serif}}>CardTrack</div>
          </div>
          {data.transactions.length>0&&<button onClick={exportCSV} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,padding:8,borderRadius:10}}><IconExport/></button>}
        </div>

        <div style={{padding:"0 14px"}}>
          {/* Spending widget */}
          {has&&(
            <div style={{background:`linear-gradient(135deg,${T.accent} 0%,#061830 100%)`,borderRadius:22,marginBottom:12,padding:"20px 18px",color:"#fff",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-60,top:-60,width:240,height:240,borderRadius:"50%",background:"rgba(255,255,255,.04)",pointerEvents:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative",marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontWeight:600,letterSpacing:"1px",marginBottom:6}}>SPENDING THIS CYCLE</div>
                  <div style={{fontSize:32,fontWeight:700,fontFamily:T.mono,letterSpacing:"-1.5px",lineHeight:1}}>{fmt(totalSpent)}</div>
                  {totalLimit>0&&<div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginTop:5}}>of {fmt(totalLimit)} total</div>}
                </div>
                {totalLimit>0&&(
                  <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
                    <svg width="80" height="80" style={{transform:"rotate(-90deg)",display:"block"}}>
                      <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,.12)" strokeWidth="7" fill="none"/>
                      <circle cx="40" cy="40" r={r} stroke={barColor(spentPct)} strokeWidth="7" fill="none" strokeDasharray={circ} strokeDashoffset={isNaN(off)?circ:off} strokeLinecap="round" style={{transition:"stroke-dashoffset .6s ease"}}/>
                    </svg>
                    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",lineHeight:1.25}}>
                      <div style={{fontSize:15,fontWeight:700}}>{spentPct}%</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.45)",fontWeight:500}}>USED</div>
                    </div>
                  </div>
                )}
              </div>
              {[...data.cards].sort((a,b)=>pct(cardSpent(b.id),b.limit)-pct(cardSpent(a.id),a.limit)).slice(0,3).map(c=>{const s=cardSpent(c.id),rp=recPct(s,c.limit),over=s>c.limit*.28;return(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,position:"relative"}}>
                  <div style={{width:7,height:7,borderRadius:2,background:c.color,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:"rgba(255,255,255,.65)",fontWeight:500}}>{c.name.length>20?c.name.slice(0,20)+"…":c.name}</span>
                      <span style={{fontSize:11,color:over?"#fca5a5":"rgba(255,255,255,.4)",fontFamily:T.mono}}>{fmt(s)}{over?" ↑":""}</span>
                    </div>
                    <div style={{height:3,background:"rgba(255,255,255,.1)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:`${rp}%`,height:"100%",background:over?"#dc3545":"#c9a96e",borderRadius:2}}/>
                    </div>
                  </div>
                </div>
              );})}
              {data.cards.length>3&&<div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:4}}>+{data.cards.length-3} more cards</div>}
              <div style={{display:"flex",gap:8,marginTop:14,position:"relative"}}>
                <button onClick={()=>setScreen("stats")} style={{flex:1,padding:"9px",borderRadius:12,background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.18)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>↗ Stats</button>
                <button onClick={toggleNotif} style={{padding:"9px 14px",borderRadius:12,background:notif?"rgba(255,255,255,.2)":"rgba(255,255,255,.08)",color:"#fff",border:`1px solid ${notif?"rgba(255,255,255,.3)":"rgba(255,255,255,.14)"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <IconBell active={notif}/>
                </button>
              </div>
            </div>
          )}

          {/* Alert banners */}
          {alerts.map(a=>{const al=alertStyle(a.p);return al?(
            <div key={a.id} style={{background:al.bg,border:`1px solid ${al.border}`,borderRadius:T.rs,padding:"11px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
              <IconAlert color={al.icon}/><span style={{fontSize:13,color:al.text,fontWeight:600}}>{a.name} at {a.p}% — {fmt(a.limit-a.spent)} left</span>
            </div>
          ):null})}

          {/* Billing due banners */}
          {data.cards.filter(card=>{
            if(!card.paymentDueDay)return false;
            const today=new Date(),due=new Date(today.getFullYear(),today.getMonth(),card.paymentDueDay);
            if(due<today)due.setMonth(due.getMonth()+1);
            return Math.ceil((due-today)/86400000)<=10;
          }).map(card=>{
            const today=new Date(),due=new Date(today.getFullYear(),today.getMonth(),card.paymentDueDay);
            if(due<today)due.setMonth(due.getMonth()+1);
            const days=Math.ceil((due-today)/86400000);
            const spent=cardSpent(card.id);
            return(
              <div key={card.id+"_due"} style={{background:"#eef4ff",border:"1px solid #a0c0f0",borderRadius:T.rs,padding:"14px 16px",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a3a8c",marginBottom:4}}>
                  💳 {card.name} — payment due in {days} day{days!==1?"s":""}
                </div>
                <div style={{fontSize:13,color:"#2a4a9c",lineHeight:1.5}}>
                  Pay your balance of <strong>{fmt(spent)}</strong> before the due date to boost your credit score. On-time payments are 35% of your score!
                </div>
              </div>
            );
          })}

          {/* 28% persuasion banner */}
          {has&&spentPct>=28&&spentPct<75&&(
            <div style={{background:"#fffbea",border:"1px solid #f0cc50",borderRadius:T.rs,padding:"14px 16px",marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:700,color:"#7a4a00",marginBottom:4}}>🛑 Put the card away — you've hit {spentPct}%</div>
              <div style={{fontSize:13,color:"#8a5800",lineHeight:1.55}}>You've reached the ideal 28% credit utilization limit. Every dollar above this quietly hurts your credit score. Your future self will thank you for stopping here.</div>
            </div>
          )}

          {/* Empty state */}
          {!has&&(
            <div style={{...S.card,textAlign:"center",padding:"64px 24px",marginTop:16}}>
              <div style={{width:68,height:68,borderRadius:"50%",background:T.surface,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                <IconCard active={false}/>
              </div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>No cards yet</div>
              <div style={{fontSize:14,color:T.muted,marginBottom:28,lineHeight:1.5}}>Add your first card to start tracking your spending</div>
              <button onClick={()=>setScreen("addCard")} style={{...S.btn,background:T.accent,color:"#fff",width:"auto",display:"inline-flex",alignItems:"center",gap:10,padding:"14px 32px",borderRadius:28,fontSize:16}}>
                <IconPlus size={16}/> Add card
              </button>
            </div>
          )}

          {/* Card list */}
          {data.cards.map(card=>{
            const spent=cardSpent(card.id),p=pct(spent,card.limit),isAlert=p>=90,cp=getCardPreset(card.name);
            return(
              <SwipeRow key={card.id} onDelete={()=>deleteCard(card.id)} onEdit={()=>{setSelCard(card.id);setScreen("editCard");}} bg={T.card} style={{borderRadius:T.r,marginBottom:10}}>
                <div onClick={()=>{setSelCard(card.id);setScreen("cardDetail");}} style={{...S.card,marginBottom:0,cursor:"pointer",border:isAlert?`1px solid #f0a0a0`:S.card.border,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:cp?.bg1||card.color,borderRadius:"4px 0 0 4px"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingLeft:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:46,height:30,borderRadius:7,background:`linear-gradient(135deg,${cp?.bg1||card.color} 0%,${cp?.bg2||card.color+"99"} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {cp?.network==="mastercard"&&<svg width="24" height="15" viewBox="0 0 40 26"><circle cx="15" cy="13" r="13" fill="#eb001b" opacity=".9"/><circle cx="25" cy="13" r="13" fill="#f79e1b" opacity=".9"/></svg>}
                        {cp?.network==="visa"&&<span style={{fontFamily:"serif",fontSize:10,fontWeight:900,fontStyle:"italic",color:cp?.text||"#fff",opacity:.9}}>VISA</span>}
                        {cp?.network==="amex"&&<span style={{fontFamily:"sans-serif",fontSize:7,fontWeight:800,color:cp?.text||"#fff",letterSpacing:"1px",opacity:.9}}>AMEX</span>}
                      </div>
                      <div>
                        <div style={{fontSize:15,fontWeight:600}}>{card.name}</div>
                        <div style={{fontSize:12,color:T.muted,marginTop:1}}>{fmt(card.limit)} limit</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:17,fontWeight:700,fontFamily:T.mono,color:isAlert?"#a82020":T.text}}>{fmt(spent)}</div>
                      <div style={{fontSize:12,color:isAlert?"#a82020":T.muted,fontWeight:isAlert?600:400,marginTop:1}}>{p}%</div>
                    </div>
                  </div>
                  <div style={{height:5,background:T.surface,borderRadius:3,marginLeft:10,overflow:"hidden"}}>
                    <div style={{width:`${recPct(spent,card.limit)}%`,height:"100%",background:recBarColor(spent,card.limit),borderRadius:3,transition:"width .4s ease"}}/>
                  </div>
                </div>
              </SwipeRow>
            );
          })}

          {/* Add next card — appears below cards when at least one exists */}
          {has&&(
            <button onClick={()=>setScreen("addCard")} style={{width:"100%",padding:"14px",borderRadius:T.r,border:`2px dashed rgba(0,0,0,0.15)`,background:"transparent",color:T.muted,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
              <IconPlus color={T.muted} size={14}/> Add your next card
            </button>
          )}

          <div className="bottom-spacer"/>
        </div>
      </div>
    );
  };

  /* ── CARDS SCREEN ── */
  const CardsScreen=()=>{
    const [expanded,setExpanded]=useState(false);
    const cardRef=useRef(null);
    const [cardH,setCardH]=useState(218);
    const [order,setOrder]=useState(()=>data.cards.map(c=>c.id));
    const [dragging,setDragging]=useState(null);
    const dragRef=useRef(null);
    const moveRef=useRef(null);
    const upRef=useRef(null);

    useEffect(()=>{if(cardRef.current)setCardH(cardRef.current.offsetHeight);},[]);
    useEffect(()=>{
      setOrder(prev=>{
        const kept=prev.filter(id=>data.cards.some(c=>c.id===id));
        const added=data.cards.filter(c=>!prev.includes(c.id)).map(c=>c.id);
        return[...kept,...added];
      });
    },[data.cards.length]);

    const orderedCards=order.map(id=>data.cards.find(c=>c.id===id)).filter(Boolean);
    const n=orderedCards.length;
    const PEEK=52,GAP=12,INFO_H=64;
    const cH=n>0?(expanded?n*(cardH+INFO_H+GAP)-GAP:cardH+(n-1)*PEEK):0;
    const getY=e=>e.touches?e.touches[0].clientY:e.clientY;

    const onDown=(e,i)=>{
      if(expanded)return;
      e.stopPropagation();
      dragRef.current={idx:i,startY:getY(e),currentY:getY(e),moved:false};
      setDragging({idx:i,dy:0});
    };

    moveRef.current=(e)=>{
      if(!dragRef.current)return;
      const y=getY(e);
      const raw=y-dragRef.current.startY;
      dragRef.current.currentY=y;
      dragRef.current.moved=Math.abs(raw)>8;
      // collapsed: allow up (bring to front) + slight down (expand hint)
      // expanded: allow slight up (collapse hint)
      const dy=expanded
        ?Math.min(0,raw)*0.4
        :raw>0?Math.min(raw*0.25,24):Math.max(raw*0.6,-cardH);
      setDragging({idx:dragRef.current.idx,dy});
    };

    upRef.current=()=>{
      if(!dragRef.current)return;
      const{idx,startY,currentY,moved}=dragRef.current;
      dragRef.current=null;
      const dy=(currentY||startY)-startY;
      setDragging(null);
      if(!moved){
        if(!expanded){const card=orderedCards[idx];if(card){setSelCard(card.id);setScreen("cardDetail");}}
      } else if(!expanded&&dy>60){
        setExpanded(true);                              // drag down → expand
      } else if(!expanded&&dy<-80){
        setOrder(prev=>{const ids=[...prev];const[id]=ids.splice(idx,1);ids.push(id);return ids;}); // drag up → bring to FRONT (bottom of fan)
      }
    };

    useEffect(()=>{
      const mv=e=>moveRef.current(e);
      const up=()=>upRef.current();
      window.addEventListener('mousemove',mv);
      window.addEventListener('mouseup',up);
      window.addEventListener('touchmove',mv,{passive:false});
      window.addEventListener('touchend',up);
      return()=>{
        window.removeEventListener('mousemove',mv);
        window.removeEventListener('mouseup',up);
        window.removeEventListener('touchmove',mv);
        window.removeEventListener('touchend',up);
      };
    },[]);

    return(
      <div>
        <div className="page-top">
          <div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:"-.5px"}}>My Cards</div>
            <div style={{fontSize:13,color:T.muted,marginTop:2}}>{n} card{n!==1?"s":""}</div>
          </div>
          {expanded&&(
            <button onClick={()=>setExpanded(false)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 16px",fontSize:13,fontWeight:500,color:T.accent,cursor:"pointer",fontFamily:T.font}}>
              Stack back
            </button>
          )}
</div>
        <div style={{padding:"0 14px"}}>
          {n===0&&(
            <div style={{...S.card,textAlign:"center",padding:"64px 24px",marginTop:16}}>
              <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>No cards yet</div>
              <div style={{fontSize:14,color:T.muted,marginBottom:28}}>Add your first card to start tracking</div>
              <button onClick={()=>setScreen("addCard")} style={{...S.btn,background:T.accent,color:"#fff",width:"auto",display:"inline-flex",alignItems:"center",gap:10,padding:"14px 32px",borderRadius:28}}>
                <IconPlus size={16}/> Add card
              </button>
            </div>
          )}
          {n>0&&(
            <>
              <div style={{position:"relative",height:cH,transition:"height 0.5s cubic-bezier(0.34,1.2,0.64,1)",marginBottom:20}}>
                {orderedCards.map((card,i)=>{
                  const spent=cardSpent(card.id);
                  const isDrag=dragging&&dragging.idx===i;
                  // fan downward: card[0]=top/back, card[n-1]=bottom/front (highest z)
                  const y=expanded?i*(cardH+INFO_H+GAP):i*PEEK+(isDrag?dragging.dy:0);
                  const zi=expanded?n-i:i+1;
                  return(
                    <div
                      key={card.id}
                      ref={i===0?cardRef:null}
                      style={{position:"absolute",left:0,right:0,top:0,transform:`translateY(${y}px)`,transformOrigin:"top center",zIndex:zi,transition:isDrag?"none":"transform 0.4s cubic-bezier(0.34,1.2,0.64,1)",cursor:expanded?"pointer":"grab",willChange:"transform",touchAction:"none"}}
                      onMouseDown={e=>onDown(e,i)}
                      onTouchStart={e=>onDown(e,i)}
                      onClick={expanded?()=>{setSelCard(card.id);setScreen("cardDetail");}:undefined}
                    >
                      <CreditCardVisual card={card}/>
                      <div style={{opacity:expanded?1:0,transform:expanded?"translateY(0)":"translateY(-6px)",transition:"opacity 0.3s ease 0.1s,transform 0.3s ease 0.1s",padding:"10px 4px 0",pointerEvents:expanded?"auto":"none"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:14,fontWeight:600}}>{fmt(spent)} <span style={{color:T.muted,fontWeight:400}}>spent</span></div>
                            <div style={{fontSize:12,color:T.muted,marginTop:2}}>{fmt(Math.max(0,Math.round(card.limit*.28)-spent))} left · {pct(spent,card.limit)}%</div>
                          </div>
                          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke={T.muted} strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </div>
                        <div style={{height:4,background:T.surface,borderRadius:3,marginTop:8,overflow:"hidden"}}>
                          <div style={{width:`${recPct(spent,card.limit)}%`,height:"100%",background:recBarColor(spent,card.limit),borderRadius:3}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!expanded&&n>1&&<p style={{textAlign:"center",fontSize:12,color:T.hint,marginTop:-10,marginBottom:16}}>↑ Drag card up to bring to front · ↓ Drag down to expand</p>}
              <button onClick={()=>setScreen("addCard")} style={{width:"100%",padding:"14px",borderRadius:T.r,border:`2px dashed rgba(0,0,0,0.15)`,background:"transparent",color:T.muted,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
                <IconPlus color={T.muted} size={14}/> Add your next card
              </button>
            </>
          )}
          <div className="bottom-spacer"/>
        </div>
      </div>
    );
  };

  /* ── ADD / EDIT CARD ── */
  const CardForm=({editId}={})=>{
    const ex=editId?data.cards.find(c=>c.id===editId):null;
    const [name,setName]=useState(ex?.name||"");
    const [limit,setLimit]=useState(ex?.limit?.toString()||"");
    const [color,setColor]=useState(ex?.color||CARD_COLORS[data.cards.length%CARD_COLORS.length]);
    const [day,setDay]=useState(ex?.billingDay?.toString()||"1");
    const [payDay,setPayDay]=useState(ex?.paymentDueDay?.toString()||"");
    const preset=getCardPreset(name);

    const onName=(e)=>{const n=e.target.value;setName(n);const p=getCardPreset(n);if(p&&!editId)setColor(p.bg1);};
    const save=()=>{
      if(!name.trim()||!limit)return;
      if(editId){updateCard(editId,{name:name.trim(),limit:Number(limit),color,billingDay:Number(day),paymentDueDay:Number(payDay)||null});setScreen("cardDetail");}
      else{const id=addCard({name:name.trim(),limit:Number(limit),color,billingDay:Number(day),paymentDueDay:Number(payDay)||null});setSelCard(id);setScreen("cardPurpose");}
    };

    return(
      <div>
        <div className="screen-header">
          <button onClick={()=>setScreen(editId?"cardDetail":"home")} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,padding:"6px",marginLeft:-6,display:"flex",alignItems:"center",gap:6,fontSize:17,fontWeight:500,fontFamily:T.font}}>
            <IconBack/> Back
          </button>
          <span style={{fontSize:17,fontWeight:600}}>{editId?"Edit Card":"Add Card"}</span>
          <div style={{width:60}}/>
        </div>
        <div style={{padding:"16px 14px"}}>
          <div style={{...S.card,padding:"20px 16px"}}>
            {preset?<CreditCardVisual card={{name:name||"Card name",limit:Number(limit)||0,color}}/>:(
              <div style={{textAlign:"center",padding:"8px 0 12px"}}>
                <div style={{width:80,height:52,borderRadius:12,background:`linear-gradient(135deg,${color} 0%,${color}99 100%)`,margin:"0 auto 16px",boxShadow:"0 4px 14px rgba(0,0,0,.18)"}}/>
                <div style={{fontSize:18,fontWeight:700}}>{name||"Card name"}</div>
                {limit&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>{fmt(Number(limit))} limit</div>}
              </div>
            )}
            {preset&&<div style={{marginTop:10,textAlign:"center",fontSize:12,color:T.muted,fontWeight:500}}>Detected: {preset.label}</div>}
          </div>

          <div style={S.card}>
            <label style={S.label}>Card name</label>
            <input style={S.input} value={name} onChange={onName} placeholder="e.g. Chase Sapphire Preferred"/>
          </div>
          <div style={S.card}>
            <label style={S.label}>Credit limit ($)</label>
            <input style={S.input} type="number" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="5000" inputMode="decimal"/>
          </div>
          <div style={S.card}>
            <label style={S.label}>Billing cycle day</label>
            <input style={S.input} type="number" min="1" max="31" value={day} onChange={e=>setDay(e.target.value)} placeholder="1" inputMode="numeric"/>
          </div>
          <div style={S.card}>
            <label style={S.label}>Payment due day (each month)</label>
            <input style={S.input} type="number" min="1" max="31" value={payDay} onChange={e=>setPayDay(e.target.value)} placeholder="e.g. 25" inputMode="numeric"/>
            <div style={{fontSize:11,color:T.hint,marginTop:6}}>We'll remind you 10 days before to pay and boost your credit score.</div>
          </div>
          {!preset&&(
            <div style={S.card}>
              <label style={S.label}>Card color</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {CARD_COLORS.map(c=>(
                  <button key={c} onClick={()=>setColor(c)} style={{width:40,height:40,borderRadius:10,background:c,border:color===c?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                    {color===c&&<IconCheck/>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={save} disabled={!name.trim()||!limit} style={{...S.btn,background:name.trim()&&limit?T.accent:"#ccc",color:"#fff",marginTop:4,borderRadius:T.rs}}>{editId?"Save Changes":"Add Card"}</button>
          {editId&&<button onClick={()=>{if(confirm("Delete this card and all its transactions?"))deleteCard(editId);}} style={{...S.btn,background:"#fde8e8",color:"#a82020",marginTop:10,border:"1px solid #f0a0a0",borderRadius:T.rs}}>Delete Card</button>}
        </div>
        <div className="bottom-spacer"/>
      </div>
    );
  };

  /* ── CARD PURPOSE ── */
  const CardPurpose=()=>{
    const card=data.cards.find(c=>c.id===selCard);
    if(!card){setScreen("home");return null;}
    const purposes=[
      {label:"Gas",        emoji:"⛽", cat:"Gas"},
      {label:"Dining",     emoji:"🍽️",  cat:"Dining"},
      {label:"Groceries",  emoji:"🛒", cat:"Groceries"},
      {label:"Travel",     emoji:"✈️",  cat:"Travel"},
      {label:"Shopping",   emoji:"🛍️",  cat:"Shopping"},
      {label:"Bills",      emoji:"💡", cat:"Bills"},
      {label:"Health",     emoji:"🏥", cat:"Health"},
      {label:"Misc / All", emoji:"🎯", cat:"Other"},
    ];
    const pick=(cat)=>{updateCard(selCard,{purpose:cat});setScreen("home");};
    return(
      <div style={{...S.app,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"32px 20px 0"}}>
          <div style={{marginBottom:6}}>
            <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${getCardPreset(card.name)?.bg1||card.color} 0%,${getCardPreset(card.name)?.bg2||card.color+"99"} 100%)`,marginBottom:18}}/>
            <div style={{fontSize:22,fontWeight:700,letterSpacing:"-.3px"}}>What's this card mainly for?</div>
            <div style={{fontSize:14,color:T.muted,marginTop:6,lineHeight:1.5}}>Pick one so we can help you track smarter.</div>
          </div>
        </div>
        <div style={{padding:"24px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,flex:1}}>
          {purposes.map(p=>(
            <button key={p.cat} onClick={()=>pick(p.cat)} style={{padding:"22px 16px",borderRadius:T.r,border:`1.5px solid ${T.border}`,background:T.card,cursor:"pointer",textAlign:"center",fontFamily:T.font,display:"flex",flexDirection:"column",alignItems:"center",gap:10,transition:"border .15s",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
              <span style={{fontSize:34,lineHeight:1}}>{p.emoji}</span>
              <span style={{fontSize:14,fontWeight:600,color:T.text}}>{p.label}</span>
            </button>
          ))}
        </div>
        <div style={{padding:"0 20px 40px",textAlign:"center"}}>
          <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:T.hint,fontSize:13,cursor:"pointer",fontFamily:T.font,padding:"12px 24px"}}>Skip for now</button>
        </div>
      </div>
    );
  };

  /* ── ADD TRANSACTION ── */
  const AddTxn=({fromCardId=null}={})=>{
    const [amount,setAmount]=useState("");
    const [cardId,setCardId]=useState(fromCardId||data.cards[0]?.id||"");
    const [cat,setCat]=useState("Other");
    const [desc,setDesc]=useState("");
    const [date,setDate]=useState(todayISO());
    const sc=data.cards.find(c=>c.id===cardId);
    const cur=sc?cardSpent(sc.id):0, newT=cur+(Number(amount)||0), newP=sc?pct(newT,sc.limit):0;
    const back=fromCardId?"cardDetail":"home";

    const overLimit=sc&&newT>sc.limit;
    const save=()=>{
      if(!amount||!cardId||overLimit)return;
      addTxn({amount:Number(amount),cardId,category:cat,description:desc.trim()||cat,date});
      setScreen(back);
    };

    if(!data.cards.length)return(
      <div>
        <div className="screen-header">
          <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,padding:"6px",marginLeft:-6,display:"flex",alignItems:"center",gap:6,fontSize:17,fontWeight:500,fontFamily:T.font}}><IconBack/> Back</button>
          <span style={{fontSize:17,fontWeight:600}}>Add Transaction</span><div style={{width:60}}/>
        </div>
        <div style={{padding:"60px 20px",textAlign:"center"}}>
          <div style={{fontSize:15,color:T.muted,marginBottom:14}}>Add a card first</div>
          <button onClick={()=>setScreen("addCard")} style={{...S.btn,background:T.accent,color:"#fff",width:"auto",display:"inline-flex",alignItems:"center",gap:8,padding:"12px 28px",borderRadius:24}}><IconPlus size={14}/>Add card</button>
        </div>
      </div>
    );

    return(
      <div>
        <div className="screen-header">
          <button onClick={()=>setScreen(back)} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,padding:"6px",marginLeft:-6,display:"flex",alignItems:"center",gap:6,fontSize:17,fontWeight:500,fontFamily:T.font}}><IconBack/> Back</button>
          <span style={{fontSize:17,fontWeight:600}}>Add Transaction</span>
          <div style={{width:60}}/>
        </div>
        <div style={{padding:"16px 14px"}}>
          {/* Amount input */}
          <div style={{...S.card,textAlign:"center",padding:"28px 18px"}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:600,letterSpacing:"1px",marginBottom:12}}>AMOUNT</div>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center"}}>
              <span style={{fontSize:28,color:T.muted,fontFamily:T.mono,marginRight:4}}>$</span>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus
                style={{fontSize:48,fontWeight:700,fontFamily:T.mono,color:T.text,background:"transparent",border:"none",borderBottom:`2.5px solid ${T.accent}`,outline:"none",width:"60%",textAlign:"center",padding:"0 0 4px",letterSpacing:"-1.5px"}}/>
            </div>
          </div>

          {/* Card picker */}
          <div style={S.card}>
            <label style={S.label}>Card</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {data.cards.map(c=>{const sel=c.id===cardId,cp=getCardPreset(c.name),left=c.limit-cardSpent(c.id);return(
                <button key={c.id} onClick={()=>setCardId(c.id)} style={{flex:"1 1 80px",padding:"10px 6px",borderRadius:T.rs,textAlign:"center",cursor:"pointer",background:sel?"#e8f0f8":T.card,border:sel?`2px solid ${T.accent}`:`1px solid ${T.border}`,fontFamily:T.font}}>
                  <div style={{width:36,height:22,borderRadius:5,background:`linear-gradient(135deg,${cp?.bg1||c.color} 0%,${cp?.bg2||c.color+"99"} 100%)`,margin:"0 auto 6px"}}/>
                  <div style={{fontSize:12,fontWeight:sel?600:400,color:sel?T.accent:T.muted}}>{c.name.length>9?c.name.slice(0,9)+"…":c.name}</div>
                  <div style={{fontSize:11,color:left<200?"#a82020":T.hint,marginTop:2}}>{fmt(left)}</div>
                </button>
              );})}
            </div>
          </div>

          {/* Category */}
          <div style={S.card}>
            <label style={S.label}>Category</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {CATEGORIES.map(c=>(
                <button key={c} onClick={()=>setCat(c)} style={{padding:"8px 14px",borderRadius:20,fontSize:13,cursor:"pointer",fontFamily:T.font,fontWeight:cat===c?600:400,background:cat===c?catColors[c].bg:T.surface,color:cat===c?catColors[c].fg:T.muted,border:cat===c?`1px solid ${catColors[c].fg}30`:"1px solid transparent"}}>{c}</button>
              ))}
            </div>
          </div>

          {/* Description + Date */}
          <div style={S.card}>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,minWidth:0}}><label style={S.label}>Description</label><input style={S.input} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Whole Foods"/></div>
              <div style={{width:120,flexShrink:0}}><label style={S.label}>Date</label><input style={{...S.input,padding:"13px 8px",fontSize:13}} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
            </div>
          </div>

          {/* Warning */}
          {sc&&amount&&(
            overLimit?(
              <div style={{background:"#fde8e8",borderRadius:T.rs,padding:"12px 14px",marginBottom:12,border:"1px solid #f0a0a0"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#7a1a1a",marginBottom:4}}>🚫 Exceeds credit limit — transaction blocked</div>
                <div style={{fontSize:12,color:"#a82020"}}>
                  {sc.name} limit is {fmt(sc.limit)}. Available: {fmt(Math.max(0,sc.limit-cardSpent(sc.id)))}. This transaction of {fmt(Number(amount))} is {fmt(newT-sc.limit)} over your limit.
                </div>
              </div>
            ):(
              <div style={{background:newP>=90?"#fde8e8":newP>=75?"#fdf4e0":newP>=28?"#fffbea":"#e8f5ee",borderRadius:T.rs,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"flex-start",gap:8,border:`1px solid ${newP>=90?"#f0a0a0":newP>=75?"#f0c860":newP>=28?"#f0cc50":"#68d0a0"}`}}>
                <div style={{marginTop:1}}><IconAlert color={newP>=90?"#a82020":newP>=75?"#8a5500":newP>=28?"#8a6000":"#18845a"}/></div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:newP>=90?"#7a1a1a":newP>=75?"#5a3800":newP>=28?"#7a4a00":"#0a5030"}}>
                    {newP>=28&&newP<75?"🛑 Stop here! ":newP>=75?"":"✓ "}
                    {sc.name} will be at {newP}%
                  </div>
                  <div style={{fontSize:12,color:newP>=90?"#a82020":newP>=75?"#8a5500":newP>=28?"#8a5800":"#18845a",marginTop:2}}>
                    {newP>=28&&newP<75?"You've hit the 28% ideal limit — putting this card away now protects your credit score.":newP<28?`Under ideal limit · recommended max ${fmt(Math.round(sc.limit*.28))}`:`${fmtFull(newT)} of ${fmt(sc.limit)} — ${fmt(Math.max(0,sc.limit-newT))} left`}
                  </div>
                </div>
              </div>
            )
          )}

          <button onClick={save} disabled={!amount||!cardId||overLimit} style={{...S.btn,background:!amount||!cardId||overLimit?"#ccc":T.accent,color:"#fff",borderRadius:T.rs,fontSize:16}}>
            {overLimit?"Transaction Blocked — Over Limit":"Save Transaction"}
          </button>
        </div>
        <div className="bottom-spacer"/>
      </div>
    );
  };

  /* ── CARD DETAIL ── */
  const CardDetail=()=>{
    const card=data.cards.find(c=>c.id===selCard);
    if(!card){setScreen("home");return null;}
    const txns=data.transactions.filter(t=>t.cardId===card.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const spent=cardSpent(card.id),p=pct(spent,card.limit),rem=card.limit-spent;
    const cs={}; txns.forEach(t=>{cs[t.category]=(cs[t.category]||0)+Number(t.amount);});
    const ce=Object.entries(cs).sort((a,b)=>b[1]-a[1]),mc=ce.length>0?ce[0][1]:1;
    const pr=getCardPreset(card.name);
    const hBg=pr?`linear-gradient(135deg,${pr.bg1} 0%,${pr.bg2} 100%)`:`linear-gradient(135deg,${card.color} 0%,${card.color}cc 100%)`;

    return(
      <div>
        <div style={{background:hBg}}>
          <div className="screen-header" style={{background:"transparent",borderBottom:"none"}}>
            <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",padding:"6px",marginLeft:-6,display:"flex",alignItems:"center",gap:6,fontSize:17,fontWeight:500,fontFamily:T.font}}>
              <IconBack/> Back
            </button>
            <button onClick={()=>setScreen("editCard")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",padding:8,borderRadius:10}}><IconEdit/></button>
          </div>
          <div style={{padding:"0 18px 24px"}}>
            <CreditCardVisual card={card}/>
            {card.purpose&&<div style={{textAlign:"center",marginTop:10}}><span style={{display:"inline-block",background:"rgba(255,255,255,.18)",color:"rgba(255,255,255,.85)",borderRadius:12,padding:"3px 12px",fontSize:11,fontWeight:600,letterSpacing:".5px"}}>{card.purpose.toUpperCase()}</span></div>}
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:6,marginTop:20}}>
              <span style={{fontSize:36,fontWeight:700,color:"#fff",fontFamily:T.mono,letterSpacing:"-1.5px"}}>{fmt(spent)}</span>
              <span style={{fontSize:15,color:"rgba(255,255,255,.4)"}}>/ {fmt(Math.round(card.limit*.28))} <span style={{fontSize:11,opacity:.6}}>limit</span></span>
            </div>
            <div style={{height:5,background:"rgba(255,255,255,.15)",borderRadius:3,marginTop:14,overflow:"hidden"}}>
              <div style={{width:`${recPct(spent,card.limit)}%`,height:"100%",background:spent>card.limit*.28?"#dc3545":"#c9a96e",borderRadius:3,transition:"width .4s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              <span style={{fontSize:12,color:spent>card.limit*.28?"#fca5a5":"rgba(255,255,255,.45)"}}>
                {spent>card.limit*.28?"Over ideal limit":""}
                {spent<=card.limit*.28&&`${fmt(spent)} of ${fmt(Math.round(card.limit*.28))} target`}
              </span>
              <span style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>{fmt(Math.max(0,Math.round(card.limit*.28)-spent))} left · Day {card.billingDay||1}</span>
            </div>
            <button onClick={()=>setScreen("addTxnCard")} style={{width:"100%",marginTop:18,padding:"14px",borderRadius:14,background:"rgba(255,255,255,.16)",border:"1px solid rgba(255,255,255,.28)",color:"#fff",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <IconPlus color="#fff" size={18}/> Add Transaction
            </button>
          </div>
        </div>

        <div style={{padding:"14px 14px 0"}}>
          {ce.length>0&&(
            <div style={S.card}>
              <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:".5px",marginBottom:14}}>BY CATEGORY</div>
              {ce.map(([c2,v])=>(
                <div key={c2} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:3,background:catColors[c2]?.fg||"#888"}}/><span style={{fontSize:14}}>{c2}</span></div>
                    <span style={{fontSize:14,color:T.muted,fontFamily:T.mono}}>{fmt(v)}</span>
                  </div>
                  <div style={{height:5,background:T.surface,borderRadius:3,marginTop:5}}>
                    <div style={{width:`${Math.round((v/mc)*100)}%`,height:"100%",background:catColors[c2]?.fg||"#888",borderRadius:3}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={S.card}>
            <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:".5px",marginBottom:6}}>TRANSACTIONS</div>
            {!txns.length&&<div style={{padding:"28px 0",textAlign:"center",fontSize:13,color:T.muted}}>No transactions yet</div>}
            {txns.map((t,i)=>{const cc=catColors[t.category]||catColors.Other;return(
              <SwipeRow key={t.id} onDelete={()=>deleteTxn(t.id)} bg={T.card} style={{borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:cc.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>{(catIcons[t.category]||catIcons.Other)(cc.fg)}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:500}}>{t.description}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:1}}>{t.category} · {dateStr(t.date)}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:600,fontFamily:T.mono}}>-{fmtFull(t.amount)}</div>
                  </div>
                </div>
              </SwipeRow>
            );})}
          </div>
        </div>
        <div className="bottom-spacer"/>
      </div>
    );
  };

  /* ── STATS ── */
  const Stats=()=>{
    const txns=data.transactions,total=txns.reduce((s,t)=>s+Number(t.amount),0),count=txns.length;
    const days=new Set(txns.map(t=>t.date)).size||1,avg=Math.round(total/days);
    const largest=txns.length?txns.reduce((m,t)=>Number(t.amount)>Number(m.amount)?t:m,txns[0]):null;
    const cs={}; txns.forEach(t=>{cs[t.category]=(cs[t.category]||0)+Number(t.amount);});
    const ce=Object.entries(cs).sort((a,b)=>b[1]-a[1]),mc=ce.length?ce[0][1]:1;
    const ms={}; txns.forEach(t=>{ms[t.description]=(ms[t.description]||0)+Number(t.amount);});
    const top=Object.entries(ms).sort((a,b)=>b[1]-a[1]).slice(0,5);

    return(
      <div>
        <div className="page-top" style={{borderBottom:`0.5px solid ${T.border}`,background:T.card,paddingBottom:16}}>
          <div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:"-.5px"}}>Stats</div>
            <div style={{fontSize:13,color:T.muted,marginTop:2}}>All time overview</div>
          </div>
        </div>
        <div style={{padding:"14px 14px 0"}}>
          {!txns.length?(
            <div style={{...S.card,textAlign:"center",padding:"48px 20px",marginTop:8}}>
              <div style={{fontSize:15,color:T.muted}}>Add transactions to see your stats</div>
            </div>
          ):(
            <>
              {/* Monthly spending bar chart */}
              {(()=>{
                const months=Array.from({length:6},(_,i)=>{
                  const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-5+i);
                  const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                  const label=d.toLocaleDateString('en-US',{month:'short'});
                  const amt=txns.filter(t=>t.date.startsWith(key)).reduce((s,t)=>s+Number(t.amount),0);
                  return{key,label,amt};
                });
                const maxAmt=Math.max(...months.map(m=>m.amt),1);
                const H=90,BW=32,GAP=10,PAD=10;
                const TW=months.length*(BW+GAP)-GAP+PAD*2;
                return(
                  <div style={{...S.card,marginBottom:12}}>
                    <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:".5px",marginBottom:14}}>MONTHLY SPENDING</div>
                    <svg viewBox={`0 0 ${TW} ${H+28}`} style={{width:"100%",overflow:"visible"}}>
                      {months.map((m,i)=>{
                        const barH=Math.max(2,(m.amt/maxAmt)*H);
                        const x=PAD+i*(BW+GAP), y=H-barH;
                        const isCur=i===5;
                        return(
                          <g key={m.key}>
                            <rect x={x} y={y} width={BW} height={barH} rx={5} fill={isCur?T.accent:m.amt===0?"#e8e6e0":"#b0bcd0"}/>
                            <text x={x+BW/2} y={H+14} textAnchor="middle" fontSize={9} fill={T.muted}>{m.label}</text>
                            {m.amt>0&&<text x={x+BW/2} y={Math.max(y-4,6)} textAnchor="middle" fontSize={8} fill={isCur?"#fff":T.muted}>{fmt(m.amt)}</text>}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}

              {/* Card utilization chart */}
              {data.cards.length>0&&(
                <div style={{...S.card,marginBottom:12}}>
                  <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:".5px",marginBottom:14}}>CARD UTILIZATION</div>
                  {data.cards.map(card=>{
                    const spent=cardSpent(card.id),p=pct(spent,card.limit),rp=recPct(spent,card.limit);
                    const color=recBarColor(spent,card.limit);
                    return(
                      <div key={card.id} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:13,fontWeight:500}}>{card.name.length>22?card.name.slice(0,22)+"…":card.name}</span>
                          <span style={{fontSize:12,color,fontWeight:600,fontFamily:T.mono}}>{p}%</span>
                        </div>
                        <div style={{position:"relative",height:10,background:T.surface,borderRadius:5}}>
                          <div style={{width:`${Math.min(p,100)}%`,height:"100%",background:color,borderRadius:5,transition:"width .4s"}}/>
                          <div style={{position:"absolute",left:"10%",top:-2,bottom:-2,width:1.5,background:"rgba(24,132,90,.4)",borderRadius:1}}/>
                          <div style={{position:"absolute",left:"28%",top:-2,bottom:-2,width:1.5,background:"rgba(26,58,92,.35)",borderRadius:1}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                          <span style={{fontSize:10,color:T.hint}}>{fmt(spent)} spent</span>
                          <span style={{fontSize:10,color:T.hint}}>target {fmt(Math.round(card.limit*.28))}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{display:"flex",gap:14,marginTop:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:2,background:"rgba(24,132,90,.5)",borderRadius:1}}/><span style={{fontSize:10,color:T.hint}}>10% mark</span></div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:2,background:"rgba(26,58,92,.4)",borderRadius:1}}/><span style={{fontSize:10,color:T.hint}}>28% target</span></div>
                  </div>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[{l:"Total spent",v:fmt(total)},{l:"Daily avg",v:fmt(avg)},{l:"Transactions",v:count},{l:"Largest",v:largest?fmt(largest.amount):"$0",sub:largest?.description}].map((m,i)=>(
                  <div key={i} style={{background:T.surface,borderRadius:T.rs,padding:16}}>
                    <div style={{fontSize:11,color:T.muted,fontWeight:600,letterSpacing:".3px",marginBottom:6}}>{m.l}</div>
                    <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,letterSpacing:"-.5px"}}>{m.v}</div>
                    {m.sub&&<div style={{fontSize:11,color:T.hint,marginTop:3}}>{m.sub}</div>}
                  </div>
                ))}
              </div>
              {ce.length>0&&(
                <div style={S.card}>
                  <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:".5px",marginBottom:14}}>BY CATEGORY</div>
                  {ce.map(([c2,v])=>(
                    <div key={c2} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:3,background:catColors[c2]?.fg||"#888"}}/><span style={{fontSize:13}}>{c2}</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:12,color:T.hint}}>{Math.round((v/total)*100)}%</span>
                          <span style={{fontSize:13,color:T.muted,fontFamily:T.mono}}>{fmt(v)}</span>
                        </div>
                      </div>
                      <div style={{height:5,background:T.surface,borderRadius:3,marginTop:4}}>
                        <div style={{width:`${Math.round((v/mc)*100)}%`,height:"100%",background:catColors[c2]?.fg||"#888",borderRadius:3}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {top.length>0&&(
                <div style={S.card}>
                  <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:".5px",marginBottom:6}}>TOP MERCHANTS</div>
                  {top.map(([name,v],i)=>{const cols=[catColors.Groceries,catColors.Travel,catColors.Bills,catColors.Shopping,catColors.Dining];const c2=cols[i%cols.length];return(
                    <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:8,background:c2.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c2.fg}}>{i+1}</div>
                        <div style={{fontSize:13,fontWeight:600}}>{name}</div>
                      </div>
                      <span style={{fontSize:14,fontWeight:600,fontFamily:T.mono}}>{fmt(v)}</span>
                    </div>
                  );})}
                </div>
              )}
            </>
          )}
          <div className="bottom-spacer"/>
        </div>
      </div>
    );
  };

  /* ── RENDER ── */
  const navScreens=["home","cardsScreen","stats","addTxn"];

  return (
    <div style={{...S.app,position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <MandalaBackground color={T.accent}/>

      {screen==="home"        && <Home/>}
      {screen==="cardsScreen" && <CardsScreen/>}
      {screen==="addCard"     && <CardForm/>}
      {screen==="editCard"    && <CardForm editId={selCard}/>}
      {screen==="cardPurpose" && <CardPurpose/>}
      {screen==="addTxn"      && <AddTxn/>}
      {screen==="addTxnCard"  && <AddTxn fromCardId={selCard}/>}
      {screen==="cardDetail"  && <CardDetail/>}
      {screen==="stats"       && <Stats/>}

      {navScreens.includes(screen)&&(
        <nav className="nav-bar">
          <button className="nav-item" onClick={()=>setScreen("home")} style={{color:screen==="home"?T.accent:T.muted}}>
            <IconHome active={screen==="home"}/>
            <span style={{fontSize:10,fontWeight:screen==="home"?600:400}}>Home</span>
          </button>
          <button className="nav-item" onClick={()=>setScreen("cardsScreen")} style={{color:screen==="cardsScreen"?T.accent:T.muted}}>
            <IconCard active={screen==="cardsScreen"}/>
            <span style={{fontSize:10,fontWeight:screen==="cardsScreen"?600:400}}>Cards</span>
          </button>
          <button className="nav-center" onClick={()=>setScreen("addTxn")}>
            <div className="nav-plus"><IconPlus color="#fff" size={20}/></div>
          </button>
          <button className="nav-item" onClick={()=>setScreen("stats")} style={{color:screen==="stats"?T.accent:T.muted}}>
            <IconStats active={screen==="stats"}/>
            <span style={{fontSize:10,fontWeight:screen==="stats"?600:400}}>Stats</span>
          </button>
        </nav>
      )}

      {toast&&<div style={S.toast}>{toast}</div>}
      <Over30Modal/>
    </div>
  );
}
