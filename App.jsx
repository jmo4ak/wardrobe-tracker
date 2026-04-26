import { useState, useEffect, useRef } from "react";
import "./index.css";

const STORAGE_KEY = "wardrobe-v2";
const CATEGORIES = ["Top","Bottom","Dress/Jumpsuit","Shoes","Outerwear","Accessory"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri"];
const WEEK_DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

function getWeekKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split("T")[0];
}
function daysAgo(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr + "T12:00:00")) / 86400000);
}
function fmtDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
}

export default function WardrobeTracker() {
  const [data, setData] = useState({ pieces:[], wearLog:[], weekPlan:{}, favorites:[] });
  const [view, setView] = useState("today");
  const [wardrobeView, setWardrobeView] = useState("work");
  const [showAddPiece, setShowAddPiece] = useState(false);
  const [showLogOutfit, setShowLogOutfit] = useState(false);
  const [showPlanDay, setShowPlanDay] = useState(null);
  const [showAddFav, setShowAddFav] = useState(false);
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPiece, setNewPiece] = useState({ name:"", category:"Top", color:"", photo:"", wardrobeType:"work", rental:false, rentalService:"", returned:false });
  const [filterCat, setFilterCat] = useState("All");
  const [suggestion, setSuggestion] = useState(null);
  const [repeatWarning, setRepeatWarning] = useState(null);
  const [favName, setFavName] = useState("");
  const [editingPiece, setEditingPiece] = useState(null);
  const [logMode, setLogMode] = useState("office");
  const [planMode, setPlanMode] = useState("office");
  const [recs, setRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [recsFocus, setRecsFocus] = useState("all");
  const fileRef = useRef();
  const editFileRef = useRef();
  const weekKey = getWeekKey();

  const fetchRecs = async (pieces, wearLog) => {
    setRecsLoading(true); setRecsError(null); setRecs(null);
    try {
      const workPs = pieces.filter(p => !p.rental && (p.wardrobeType||"work")==="work");
      const weekendPs = pieces.filter(p => !p.rental && p.wardrobeType==="weekend");
      const wornCats = {};
      pieces.forEach(p => { wornCats[p.category] = (wornCats[p.category]||0)+1; });
      const topPieces = [...pieces].map(p => ({
        name: p.name, category: p.category, wardrobeType: p.wardrobeType||"work",
        wearsThisYear: wearLog.filter(e => e.pieceIds?.includes(p.id) && new Date(e.date).getFullYear()===new Date().getFullYear()).length,
        color: p.color || ""
      })).sort((a,b)=>b.wearsThisYear-a.wearsThisYear);

      const prompt = `You are a personal stylist with deep knowledge of sustainable and ethical fashion brands. Analyze this person's wardrobe and give tailored shopping recommendations.

WARDROBE SUMMARY:
- Work pieces (${workPs.length}): ${workPs.map(p=>`${p.name} (${p.category}${p.color?', '+p.color:''})`).join(', ') || 'none yet'}
- Weekend pieces (${weekendPs.length}): ${weekendPs.map(p=>`${p.name} (${p.category}${p.color?', '+p.color:''})`).join(', ') || 'none yet'}
- Category breakdown: ${Object.entries(wornCats).map(([k,v])=>`${k}: ${v}`).join(', ') || 'none yet'}
- Most worn this year: ${topPieces.slice(0,5).map(p=>`${p.name} (${p.wearsThisYear}x)`).join(', ') || 'none'}
- Total outfits logged: ${wearLog.filter(e=>!e.wfh).length}

SHOPPING PREFERENCES:
- Prioritize: ethical sourcing, sustainable materials, quality construction, longevity
- Budget: mid-range to accessible luxury (not exclusively designer, not fast fashion)
- Currently shops at: Tuckernuck, Anthropologie, Farm Rio, Old Navy (and open to new brands)
- Open to: new ethical/quality brands she may not know yet

Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble. Use exactly this structure:
{"gaps":[{"item":"string","why":"string","category":"string","wardrobeType":"work or weekend","brands":[{"name":"string","why":"string","ethical":true,"priceRange":"string"}]}],"trends":[{"trend":"string","description":"string","item":"string","category":"string","wardrobeType":"work or weekend","brands":[{"name":"string","why":"string","ethical":true,"priceRange":"string"}]}],"brandDiscoveries":[{"name":"string","why":"string","specialty":"string","priceRange":"string","ethical":true,"ethicalNotes":"string"}]}

Give 4-5 gap recommendations, 3-4 trend recommendations, and 4-5 brand discoveries. For each gap/trend, give 2-3 brand options. Make it specific to her actual wardrobe.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, messages: [{ role: "user", content: prompt }] })
      });
      const d = await res.json();
      const raw = d.content?.find(b => b.type === "text")?.text || "";
      setRecs(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch(e) {
      setRecsError("Couldn't generate recommendations. Please try again.");
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r?.value) setData(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  const save = async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addPiece = () => {
    if (!newPiece.name.trim()) return;
    const isRental = wardrobeView === "rental" || newPiece.rental;
    const piece = { id: Date.now().toString(), ...newPiece, rental: isRental, wardrobeType: isRental ? (newPiece.wardrobeType||"work") : newPiece.wardrobeType, addedDate: new Date().toISOString() };
    save({ ...data, pieces: [...data.pieces, piece] });
    setNewPiece({ name:"", category:"Top", color:"", photo:"", wardrobeType: wardrobeView==="rental"?"work":wardrobeView, rental: wardrobeView==="rental", rentalService:"", returned:false });
    setShowAddPiece(false);
  };
  const markReturned = (id) => save({ ...data, pieces: data.pieces.map(p => p.id === id ? { ...p, returned: true, returnedDate: new Date().toISOString() } : p) });
  const updatePiece = () => { if (!editingPiece?.name?.trim()) return; save({ ...data, pieces: data.pieces.map(p => p.id === editingPiece.id ? editingPiece : p) }); setEditingPiece(null); };
  const deletePiece = (id) => { save({ ...data, pieces: data.pieces.filter(p => p.id !== id), wearLog: data.wearLog.map(e => ({ ...e, pieceIds: e.pieceIds.filter(x => x !== id) })) }); setEditingPiece(null); };
  const checkRepeat = (ids) => { const combos = data.wearLog.filter(e => { const overlap = ids.filter(id => e.pieceIds.includes(id)); return overlap.length >= Math.min(2, ids.length) && daysAgo(e.date) <= 14; }); return combos.length > 0 ? combos[0] : null; };

  const logOutfit = () => {
    if (logMode === "wfh") {
      save({ ...data, wearLog: [...data.wearLog, { id: Date.now().toString(), date: logDate, pieceIds: [], wfh: true }] });
      setRepeatWarning(null); setShowLogOutfit(false); setLogMode("office"); return;
    }
    if (!selectedPieces.length) return;
    const warn = checkRepeat(selectedPieces);
    if (warn && !repeatWarning) { setRepeatWarning(warn); return; }
    save({ ...data, wearLog: [...data.wearLog, { id: Date.now().toString(), date: logDate, pieceIds: selectedPieces, weekend: logMode === "weekend" }] });
    setSelectedPieces([]); setRepeatWarning(null); setShowLogOutfit(false); setLogMode("office");
  };

  const logFavorite = (fav) => { setSelectedPieces(fav.pieceIds); setShowLogOutfit(true); };
  const saveFavorite = () => { if (!favName.trim() || !selectedPieces.length) return; save({ ...data, favorites: [...data.favorites, { id: Date.now().toString(), name: favName, pieceIds: selectedPieces }] }); setFavName(""); setShowAddFav(false); };
  const deleteFav = (id) => save({ ...data, favorites: data.favorites.filter(f => f.id !== id) });
  const planDay = (dayIdx, pieceIds, wfh) => { const plan = { ...(data.weekPlan[weekKey] || {}), [dayIdx]: wfh ? "wfh" : pieceIds }; save({ ...data, weekPlan: { ...data.weekPlan, [weekKey]: plan } }); setShowPlanDay(null); setSelectedPieces([]); setPlanMode("office"); };

  const suggest = () => {
    const wps = data.pieces.filter(p => !p.rental && (p.wardrobeType||"work")==="work");
    if (!wps.length) return;
    const scored = wps.map(p => { const last = data.wearLog.filter(e => e.pieceIds.includes(p.id) && !e.weekend); const lastDate = last.length ? last.sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date : null; return { piece: p, score: daysAgo(lastDate) }; });
    setSuggestion(scored.sort((a,b)=>b.score-a.score).slice(0,3).map(s=>s.piece));
  };

  const getWears = (pid, year) => data.wearLog.filter(e => { const y = new Date(e.date).getFullYear(); return e.pieceIds.includes(pid) && (!year || y === year); }).length;
  const getLastWorn = (pid) => { const e = data.wearLog.filter(x=>x.pieceIds.includes(pid)).sort((a,b)=>new Date(b.date)-new Date(a.date)); return e[0]?.date||null; };
  const getMonthCount = (pid) => { const now = new Date(); return data.wearLog.filter(e => { const d=new Date(e.date); return e.pieceIds.includes(pid) && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }).length; };
  const statusInfo = (pid) => { const c=getMonthCount(pid); if(c>=3) return {label:`${c}× this month`,color:"#C97A7A"}; if(c===2) return {label:`${c}× this month`,color:"#C9A96E"}; return {label:c>0?`${c}× this month`:"Not worn yet",color:"#6B6760"}; };

  const currentYear = new Date().getFullYear();
  const rentalPieces = data.pieces.filter(p=>p.rental);
  const workPieces = data.pieces.filter(p=>!p.rental&&(p.wardrobeType||"work")==="work");
  const weekendPieces = data.pieces.filter(p=>!p.rental&&p.wardrobeType==="weekend");
  const activeRentals = rentalPieces.filter(p=>!p.returned);
  const neverWorn = workPieces.filter(p=>getWears(p.id,currentYear)===0);
  const neverWornWeekend = weekendPieces.filter(p=>getWears(p.id,currentYear)===0);
  const sorted = [...workPieces].sort((a,b)=>getWears(b.id,currentYear)-getWears(a.id,currentYear));
  const sortedWeekend = [...weekendPieces].sort((a,b)=>getWears(b.id,currentYear)-getWears(a.id,currentYear));
  const sortedRental = [...rentalPieces].sort((a,b)=>getWears(b.id,currentYear)-getWears(a.id,currentYear));
  const maxWears = sorted[0]?getWears(sorted[0].id,currentYear):1;
  const maxWearsWknd = sortedWeekend[0]?getWears(sortedWeekend[0].id,currentYear):1;
  const maxWearsRental = sortedRental[0]?getWears(sortedRental[0].id,currentYear):1;
  const recentLog = [...data.wearLog].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15);
  const filteredPieces = filterCat==="All" ? (wardrobeView==="weekend"?weekendPieces:wardrobeView==="rental"?rentalPieces:workPieces) : data.pieces.filter(p=>p.category===filterCat&&(wardrobeView==="rental"?p.rental:!p.rental&&(p.wardrobeType||"work")===wardrobeView));
  const thisWeekPlan = data.weekPlan[weekKey]||{};
  const wfhDaysThisYear = data.wearLog.filter(e=>e.wfh&&new Date(e.date).getFullYear()===currentYear).length;
  const officeDaysThisYear = data.wearLog.filter(e=>!e.wfh&&!e.weekend&&new Date(e.date).getFullYear()===currentYear).length;
  const weekendDaysThisYear = data.wearLog.filter(e=>e.weekend&&new Date(e.date).getFullYear()===currentYear).length;
  const dayPatterns = DAYS.map((d,i) => { const entries=data.wearLog.filter(e=>new Date(e.date+"T12:00:00").getDay()===(i+1)); const pc={}; entries.forEach(e=>e.pieceIds.forEach(pid=>{pc[pid]=(pc[pid]||0)+1;})); const top=Object.entries(pc).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([pid])=>data.pieces.find(p=>p.id===pid)).filter(Boolean); return {day:d,count:entries.length,top}; });

  const handlePhoto = (e, isEdit) => { const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>{if(isEdit)setEditingPiece(p=>({...p,photo:ev.target.result}));else setNewPiece(p=>({...p,photo:ev.target.result}));}; r.readAsDataURL(file); };
  const togglePiece = (id) => setSelectedPieces(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const PieceSelector = ({ pieces }) => (
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
      {pieces.length===0 && <p style={{fontSize:13,color:"#6B6760"}}>Add wardrobe pieces first.</p>}
      {pieces.map(p=>(
        <button key={p.id} className={`piece-chip ${selectedPieces.includes(p.id)?"selected":""}`} onClick={()=>togglePiece(p.id)}>
          {p.photo && <img src={p.photo} style={{width:14,height:14,borderRadius:3,objectFit:"cover",marginRight:4,verticalAlign:"middle"}} />}
          {p.name}
        </button>
      ))}
    </div>
  );

  const PhotoField = ({ photo, onSet, onClear, refObj }) => (
    <div className="field">
      <label>Photo</label>
      <input type="file" accept="image/*" ref={refObj} style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onSet(ev.target.result);r.readAsDataURL(f);}} />
      {photo ? (
        <div style={{position:"relative"}}>
          <img src={photo} style={{width:"100%",height:120,objectFit:"cover",borderRadius:10}} />
          <button onClick={onClear} style={{position:"absolute",top:8,right:8,background:"#0D0D0D",color:"#F0EDE8",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:16}}>×</button>
        </div>
      ) : (
        <div className="img-upload" onClick={()=>refObj.current?.click()}>📷 Add photo</div>
      )}
    </div>
  );

  return (
    <div className="app">
      <div className="header">
        <h1 className="serif">The <em>Wardrobe</em><br/>Edit</h1>
        <p>Track · Plan · Refine</p>
      </div>

      <nav className="nav">
        {[["today","Today"],["log","Log"],["wardrobe","Wardrobe"],["plan","Planner"],["insights","Insights"],["recs","✦ Recs"],["report","Report"]].map(([v,l])=>(
          <button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{l}</button>
        ))}
      </nav>

      {view==="today" && (
        <div className="section fade-up">
          <div className="section-label">What to wear today</div>
          {suggestion ? (
            <>
              <div className="suggest-card">
                <span className="serif">Suggested picks</span>
                <p style={{fontSize:12,color:"#6B6760",marginBottom:16}}>Based on what you haven't worn recently</p>
                {suggestion.map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,background:"#161616",borderRadius:10,padding:10,marginBottom:8}}>
                    {p.photo?<img src={p.photo} className="piece-img"/>:<div className="piece-img-placeholder">👗</div>}
                    <div style={{textAlign:"left"}}>
                      <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#6B6760"}}>{p.category} · Last worn {daysAgo(getLastWorn(p.id))>300?"never this year":`${daysAgo(getLastWorn(p.id))}d ago`}</div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setSuggestion(null)}>Refresh suggestion</button>
              </div>
              <button className="btn btn-primary" onClick={()=>{setShowLogOutfit(true);setSuggestion(null);}}>Log today's outfit →</button>
            </>
          ) : (
            <>
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{fontSize:64,marginBottom:16}}>✨</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:"#6B6760",marginBottom:20}}>Let's find something perfect.</p>
                <button className="btn btn-primary" style={{width:"auto",padding:"12px 32px"}} onClick={suggest}>Suggest an outfit</button>
              </div>
              <button className="wfh-btn" onClick={()=>{setLogMode("wfh");setShowLogOutfit(true);}}>🏠 Log a work from home day</button>
              <button className="wfh-btn" style={{borderColor:"#A87AC944",color:"#A87AC9",marginTop:8}} onClick={()=>{setLogMode("weekend");setShowLogOutfit(true);}}>🌿 Log a weekend outfit</button>
              {data.favorites.length>0 && (
                <>
                  <div className="section-label" style={{marginTop:16}}>Or wear a favourite</div>
                  {data.favorites.map(fav=>(
                    <div key={fav.id} className="fav-card" onClick={()=>logFavorite(fav)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontWeight:500,fontSize:14}}>⭐ {fav.name}</div>
                          <div style={{fontSize:11,color:"#6B6760",marginTop:3}}>{fav.pieceIds.map(id=>data.pieces.find(p=>p.id===id)?.name).filter(Boolean).join(" + ")}</div>
                        </div>
                        <span style={{fontSize:11,color:"#C9A96E"}}>Wear →</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {view==="log" && (
        <div className="section fade-up">
          <div className="section-label">Recent outfits</div>
          {recentLog.length===0 && <div className="empty"><span className="serif">Nothing logged yet.</span><small>Tap ✓ to record today's look</small></div>}
          {recentLog.map(entry=>(
            <div key={entry.id} className="log-entry">
              <div className="log-date">{fmtDate(entry.date)}</div>
              {entry.wfh ? <span className="wfh-badge">🏠 Work from home</span>
              : entry.weekend ? <span className="weekend-badge">🌿 Weekend</span>
              : <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                  {entry.pieceIds.map(pid=>{const p=data.pieces.find(x=>x.id===pid);return p?(<span key={pid} style={{display:"flex",alignItems:"center",gap:5,background:"#1E1E1E",border:"1px solid #2A2A2A",borderRadius:20,padding:"4px 10px",fontSize:12}}>{p.photo&&<img src={p.photo} style={{width:14,height:14,borderRadius:3,objectFit:"cover"}}/>}{p.name}</span>):null;})}
                </div>}
            </div>
          ))}
        </div>
      )}

      {view==="wardrobe" && (
        <div className="section fade-up">
          <div className="wardrobe-tabs">
            <button className={`wardrobe-tab ${wardrobeView==="work"?"active-work":""}`} onClick={()=>{setWardrobeView("work");setFilterCat("All");}}>🏢 Work ({workPieces.length})</button>
            <button className={`wardrobe-tab ${wardrobeView==="weekend"?"active-weekend":""}`} onClick={()=>{setWardrobeView("weekend");setFilterCat("All");}}>🌿 Weekend ({weekendPieces.length})</button>
            <button className={`wardrobe-tab ${wardrobeView==="rental"?"active-rental":""}`} onClick={()=>{setWardrobeView("rental");setFilterCat("All");}}>💎 Rentals ({activeRentals.length})</button>
          </div>
          <div className="filter-row">
            {["All",...CATEGORIES].map(c=><button key={c} className={`filter-chip ${filterCat===c?"active":""}`} onClick={()=>setFilterCat(c)}>{c}</button>)}
          </div>
          {filteredPieces.length===0 && <div className="empty"><span className="serif">No {wardrobeView} pieces yet.</span><small>Tap + to add your {wardrobeView==="weekend"?"weekend":wardrobeView==="rental"?"rentals":"work"} clothes</small></div>}
          {filteredPieces.map(p=>{
            const s=statusInfo(p.id); const last=getLastWorn(p.id); const isRental=p.rental; const isWeekend=p.wardrobeType==="weekend";
            return (
              <div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"flex-start",borderColor:isRental?"#7AC9B833":isWeekend?"#A87AC922":undefined}}>
                <div style={{flexShrink:0}} onClick={()=>setEditingPiece({...p})}>
                  {p.photo?<img src={p.photo} className="piece-img"/>:<div className="piece-img-placeholder">{isRental?"💎":isWeekend?"👟":"👕"}</div>}
                </div>
                <div style={{flex:1,minWidth:0}} onClick={()=>setEditingPiece({...p})}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                    <span className="badge" style={{background:s.color+"22",color:s.color,flexShrink:0}}>{s.label}</span>
                  </div>
                  {isRental && <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><span className={`rental-badge ${p.returned?"returned":""}`}>{p.returned?"✓ Returned":"💎 On loan"}</span>{p.rentalService&&<span style={{fontSize:11,color:"#6B6760"}}>{p.rentalService}</span>}</div>}
                  <div style={{fontSize:11,color:"#6B6760",marginTop:3}}>{p.category}{p.color?` · ${p.color}`:""}</div>
                  <div style={{fontSize:11,color:"#6B6760",marginTop:2}}>{last?`Last worn ${daysAgo(last)}d ago`:"Never worn"} · {getWears(p.id,currentYear)} wears this year</div>
                </div>
                {isRental&&!p.returned&&<button className="return-btn" style={{flexShrink:0,alignSelf:"center"}} onClick={()=>markReturned(p.id)}>Return</button>}
              </div>
            );
          })}
        </div>
      )}

      {view==="plan" && (
        <div className="section fade-up">
          <div className="section-label">This week's plan</div>
          <div className="planner-grid">
            {DAYS.map((d,i)=>{
              const dayPlan=thisWeekPlan[i]||[]; const isWfh=dayPlan==="wfh";
              const pieces=isWfh?[]:dayPlan.map(id=>data.pieces.find(p=>p.id===id)).filter(Boolean);
              return (
                <div key={d} className={`planner-cell ${isWfh?"is-wfh":pieces.length?"has-outfit":""}`} onClick={()=>{setSelectedPieces(isWfh?[]:dayPlan);setShowPlanDay(i);}}>
                  <div className="planner-day">{d}</div>
                  {isWfh?<span style={{fontSize:20}}>🏠</span>:pieces.length===0?<span style={{fontSize:18,opacity:0.3}}>+</span>:pieces.slice(0,3).map(p=>(p.photo?<img key={p.id} src={p.photo} style={{width:"100%",height:28,objectFit:"cover",borderRadius:4}}/>:<div key={p.id} className="planner-piece">{p.name}</div>))}
                </div>
              );
            })}
          </div>
          <div className="section-label" style={{marginTop:8}}>Saved favourites</div>
          {data.favorites.length===0&&<div style={{fontSize:13,color:"#6B6760",marginBottom:16}}>Save outfit combos for quick re-logging.</div>}
          {data.favorites.map(fav=>(
            <div key={fav.id} className="fav-card" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:500,fontSize:14}}>⭐ {fav.name}</div><div style={{fontSize:11,color:"#6B6760",marginTop:3}}>{fav.pieceIds.map(id=>data.pieces.find(p=>p.id===id)?.name).filter(Boolean).join(" · ")}</div></div>
              <button style={{background:"none",border:"none",color:"#6B6760",cursor:"pointer",fontSize:18}} onClick={()=>deleteFav(fav.id)}>×</button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setShowAddFav(true)}>+ Save new favourite combo</button>
        </div>
      )}

      {view==="insights" && (
        <div className="section fade-up">
          <div className="section-label">🏢 Most worn work pieces</div>
          {sorted.slice(0,6).map((p,i)=>{const w=getWears(p.id,currentYear);return(<div key={p.id} className="leaderboard-row"><div className="lb-rank">{i+1}</div>{p.photo?<img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:"cover"}}/>:<div style={{width:36,height:36,borderRadius:6,background:"#2A2A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👕</div>}<div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500}}>{p.name}</div><div className="lb-bar-wrap"><div className="lb-bar" style={{width:`${(w/Math.max(maxWears,1))*100}%`}}></div></div></div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#C9A96E"}}>{w}</div></div>);})}
          {sorted.length===0&&<div style={{fontSize:13,color:"#6B6760",marginBottom:16}}>No work outfits logged yet.</div>}
          {weekendPieces.length>0&&(<><div className="section-label" style={{marginTop:24}}>🌿 Most worn weekend pieces</div>{sortedWeekend.slice(0,6).map((p,i)=>{const w=getWears(p.id,currentYear);return(<div key={p.id} className="leaderboard-row"><div className="lb-rank">{i+1}</div>{p.photo?<img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:"cover"}}/>:<div style={{width:36,height:36,borderRadius:6,background:"#A87AC922",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👟</div>}<div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500}}>{p.name}</div><div className="lb-bar-wrap"><div className="lb-bar weekend" style={{width:`${(w/Math.max(maxWearsWknd,1))*100}%`}}></div></div></div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#A87AC9"}}>{w}</div></div>);})}
          </>)}
          {rentalPieces.length>0&&(<><div className="section-label" style={{marginTop:24}}>💎 Rental wear count</div>{sortedRental.slice(0,6).map((p,i)=>{const w=getWears(p.id,currentYear);return(<div key={p.id} className="leaderboard-row"><div className="lb-rank">{i+1}</div>{p.photo?<img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:"cover"}}/>:<div style={{width:36,height:36,borderRadius:6,background:"#7AC9B822",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💎</div>}<div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500}}>{p.name}{p.returned&&<span style={{fontSize:10,color:"#6B6760",marginLeft:6}}>returned</span>}</div>{p.rentalService&&<div style={{fontSize:11,color:"#6B6760"}}>{p.rentalService}</div>}<div className="lb-bar-wrap"><div className="lb-bar rental" style={{width:`${(w/Math.max(maxWearsRental,1))*100}%`}}></div></div></div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#7AC9B8"}}>{w}</div></div>);})}
          </>)}
          <div className="section-label" style={{marginTop:24}}>Day of week patterns</div>
          {dayPatterns.map(({day,count,top})=>(<div key={day} className="pattern-day"><div style={{width:32,fontSize:11,fontWeight:600,color:"#6B6760",letterSpacing:0.5}}>{day}</div><div style={{flex:1}}>{top.length===0?<span style={{fontSize:11,color:"#2A2A2A"}}>No data</span>:<div style={{fontSize:11,color:"#6B6760"}}>{top.map(p=>p.name).join(", ")}</div>}</div><div style={{fontSize:11,color:"#6B6760"}}>{count} outfits</div></div>))}
        </div>
      )}

      {view==="recs" && (
        <div className="section fade-up">
          {!recs&&!recsLoading&&(
            <div style={{textAlign:"center",padding:"32px 0 24px"}}>
              <div style={{fontSize:56,marginBottom:16}}>✦</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:"#F0EDE8",marginBottom:8}}>Your personal stylist.</p>
              <p style={{fontSize:13,color:"#6B6760",marginBottom:28,lineHeight:1.6}}>AI analyses your wardrobe data to find what's missing, what's trending, and which ethical brands match your style.</p>
              <button className="btn btn-primary" style={{width:"auto",padding:"14px 36px",fontSize:14}} onClick={()=>fetchRecs(data.pieces,data.wearLog)}>Generate my recommendations</button>
              {data.pieces.length===0&&<p style={{fontSize:12,color:"#6B6760",marginTop:16}}>Add some wardrobe pieces first for best results.</p>}
            </div>
          )}
          {recsLoading&&(<div style={{padding:"16px 0"}}><p style={{fontSize:13,color:"#6B6760",textAlign:"center",marginBottom:24,fontStyle:"italic"}}>Analysing your wardrobe…</p>{[180,140,200,160].map((w,i)=>(<div key={i} style={{marginBottom:12}}><div className="shimmer" style={{height:20,width:`${w}px`,marginBottom:8}}></div><div className="shimmer" style={{height:14,width:"90%",marginBottom:6}}></div><div className="shimmer" style={{height:14,width:"70%"}}></div></div>))}</div>)}
          {recsError&&(<div style={{textAlign:"center",padding:"32px 0"}}><p style={{color:"#C97A7A",marginBottom:16,fontSize:13}}>{recsError}</p><button className="btn btn-ghost" onClick={()=>fetchRecs(data.pieces,data.wearLog)}>Try again</button></div>)}
          {recs&&(
            <>
              <div className="recs-focus-row">{[["all","All"],["gaps","Gaps"],["trends","Trends"],["brands","Brands"]].map(([v,l])=>(<button key={v} className={`recs-focus-btn ${recsFocus===v?"active":""}`} onClick={()=>setRecsFocus(v)}>{l}</button>))}</div>
              {(recsFocus==="all"||recsFocus==="gaps")&&recs.gaps?.length>0&&(<><div className="section-label">Wardrobe gaps to fill</div>{recs.gaps.map((g,i)=>(<div key={i} className="rec-card"><div className="rec-card-header"><div className="rec-title">{g.item}</div><span className="rec-type-badge" style={{background:g.wardrobeType==="weekend"?"#A87AC922":"#C9A96E22",color:g.wardrobeType==="weekend"?"#A87AC9":"#C9A96E"}}>{g.wardrobeType==="weekend"?"🌿":"🏢"} {g.category}</span></div><p className="rec-why">{g.why}</p><div className="rec-brands">{g.brands?.map((b,j)=>(<div key={j} className="rec-brand"><div className="rec-brand-name">{b.name}</div><div className="rec-brand-why">{b.why}</div><div className="rec-brand-meta">{b.ethical&&<span className="eco-badge">♻ Ethical</span>}<span className="price-badge">{b.priceRange}</span></div></div>))}</div></div>))}</>)}
              {(recsFocus==="all"||recsFocus==="trends")&&recs.trends?.length>0&&(<><div className="section-label" style={{marginTop:recsFocus==="all"?20:0}}>On-trend right now</div>{recs.trends.map((t,i)=>(<div key={i} className="rec-card" style={{borderColor:"#7AA8C933"}}><div className="rec-card-header"><div><div style={{fontSize:10,fontWeight:600,letterSpacing:1,color:"#7AA8C9",textTransform:"uppercase",marginBottom:4}}>{t.trend}</div><div className="rec-title">{t.item}</div></div><span className="rec-type-badge" style={{background:"#7AA8C922",color:"#7AA8C9"}}>{t.wardrobeType==="weekend"?"🌿":"🏢"} {t.category}</span></div><p className="rec-why">{t.description}</p><div className="rec-brands">{t.brands?.map((b,j)=>(<div key={j} className="rec-brand"><div className="rec-brand-name">{b.name}</div><div className="rec-brand-why">{b.why}</div><div className="rec-brand-meta">{b.ethical&&<span className="eco-badge">♻ Ethical</span>}<span className="price-badge">{b.priceRange}</span></div></div>))}</div></div>))}</>)}
              {(recsFocus==="all"||recsFocus==="brands")&&recs.brandDiscoveries?.length>0&&(<><div className="section-label" style={{marginTop:recsFocus==="all"?20:0}}>Brands to discover</div>{recs.brandDiscoveries.map((b,i)=>(<div key={i} className="disc-card"><div className="disc-card-top"><div className="disc-name">{b.name}</div><div style={{display:"flex",gap:5,flexShrink:0}}>{b.ethical&&<span className="eco-badge">♻ Ethical</span>}<span className="price-badge">{b.priceRange}</span></div></div><p className="disc-why">{b.why}</p>{b.ethicalNotes&&<p style={{fontSize:11,color:"#7AC99A",lineHeight:1.4}}>♻ {b.ethicalNotes}</p>}<p style={{fontSize:11,color:"#6B6760",marginTop:4}}>Speciality: {b.specialty}</p></div>))}</>)}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:16}} onClick={()=>fetchRecs(data.pieces,data.wearLog)}>↻ Refresh recommendations</button>
            </>
          )}
        </div>
      )}

      {view==="report" && (
        <div className="section fade-up">
          <div className="section-label">{currentYear} at a glance</div>
          <div className="card" style={{marginBottom:20}}>
            {[["Work pieces",workPieces.length],["Weekend pieces",weekendPieces.length],["Active rentals",activeRentals.length],["Office days logged",officeDaysThisYear],["WFH days logged",wfhDaysThisYear],["Weekend outfits logged",weekendDaysThisYear],["Work pieces unworn",neverWorn.length],["Weekend pieces unworn",neverWornWeekend.length]].map(([label,val],i,arr)=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<arr.length-1?"1px solid #2A2A2A":"none"}}>
                <span style={{fontSize:13,color:"#6B6760"}}>{label}</span>
                <span className="stat-num" style={{fontSize:26,color:(label.includes("unworn")&&val>0)?"#C97A7A":label.includes("WFH")?"#7AA8C9":label.includes("rental")?"#7AC9B8":(label.includes("Weekend")||label.includes("weekend"))?"#A87AC9":"#C9A96E"}}>{val}</span>
              </div>
            ))}
          </div>
          {neverWorn.length>0&&(<><div className="section-label">🏢 Consider donating · {neverWorn.length} work piece{neverWorn.length!==1?"s":""}</div>{neverWorn.map(p=>(<div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"center"}}>{p.photo?<img src={p.photo} className="piece-img"/>:<div className="piece-img-placeholder">👕</div>}<div><div style={{fontWeight:500,fontSize:14}}>{p.name}</div><div style={{fontSize:11,color:"#6B6760"}}>{p.category}{p.color?` · ${p.color}`:""}</div></div></div>))}</>)}
          {neverWornWeekend.length>0&&(<><div className="section-label" style={{marginTop:8}}>🌿 Consider donating · {neverWornWeekend.length} weekend piece{neverWornWeekend.length!==1?"s":""}</div>{neverWornWeekend.map(p=>(<div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"center",borderColor:"#A87AC922"}}>{p.photo?<img src={p.photo} className="piece-img"/>:<div className="piece-img-placeholder">👟</div>}<div><div style={{fontWeight:500,fontSize:14}}>{p.name}</div><div style={{fontSize:11,color:"#6B6760"}}>{p.category}{p.color?` · ${p.color}`:""}</div></div></div>))}</>)}
          {rentalPieces.length>0&&(<><div className="section-label" style={{marginTop:8}}>💎 Rental history this year</div>{rentalPieces.filter(p=>getWears(p.id,currentYear)>0||!p.returned).map(p=>(<div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"center",borderColor:"#7AC9B833"}}>{p.photo?<img src={p.photo} className="piece-img"/>:<div className="piece-img-placeholder" style={{background:"#7AC9B822"}}>💎</div>}<div style={{flex:1}}><div style={{fontWeight:500,fontSize:14}}>{p.name}</div><div style={{fontSize:11,color:"#6B6760"}}>{p.rentalService||"Rental"} · {getWears(p.id,currentYear)} wear{getWears(p.id,currentYear)!==1?"s":""} this year</div></div><span className={`rental-badge ${p.returned?"returned":""}`}>{p.returned?"✓ Returned":"On loan"}</span></div>))}</>)}
        </div>
      )}

      <button className="fab" onClick={()=>{if(view==="wardrobe"){setNewPiece({name:"",category:"Top",color:"",photo:"",wardrobeType:wardrobeView==="rental"?"work":wardrobeView,rental:wardrobeView==="rental",rentalService:"",returned:false});setShowAddPiece(true);}else setShowLogOutfit(true);}}>
        {view==="wardrobe"?"＋":"✓"}
      </button>

      {showAddPiece&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowAddPiece(false)}>
          <div className="modal">
            <h2>Add a piece</h2>
            <div className="toggle-row" style={{marginBottom:16}}>
              <button className={`toggle-opt ${!newPiece.rental&&newPiece.wardrobeType==="work"?"active":""}`} onClick={()=>setNewPiece(p=>({...p,wardrobeType:"work",rental:false}))}>🏢 Work</button>
              <button className={`toggle-opt ${!newPiece.rental&&newPiece.wardrobeType==="weekend"?"active-weekend":""}`} onClick={()=>setNewPiece(p=>({...p,wardrobeType:"weekend",rental:false}))}>🌿 Weekend</button>
              <button className={`toggle-opt ${newPiece.rental?"active-rental":""}`} onClick={()=>setNewPiece(p=>({...p,rental:true}))}>💎 Rental</button>
            </div>
            {newPiece.rental&&<div className="field"><label>Rental service (optional)</label><input placeholder="e.g. Rent the Runway, Nuuly…" value={newPiece.rentalService} onChange={e=>setNewPiece(p=>({...p,rentalService:e.target.value}))} /></div>}
            <PhotoField photo={newPiece.photo} onSet={v=>setNewPiece(p=>({...p,photo:v}))} onClear={()=>setNewPiece(p=>({...p,photo:""}))} refObj={fileRef} />
            <div className="field"><label>Name</label><input placeholder="e.g. Navy blazer" value={newPiece.name} onChange={e=>setNewPiece(p=>({...p,name:e.target.value}))} autoFocus /></div>
            <div className="field"><label>Category</label><select value={newPiece.category} onChange={e=>setNewPiece(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Color / notes</label><input placeholder="e.g. Camel, striped…" value={newPiece.color} onChange={e=>setNewPiece(p=>({...p,color:e.target.value}))} /></div>
            <div style={{display:"flex"}}><button className="btn btn-ghost" onClick={()=>setShowAddPiece(false)}>Cancel</button><button className="btn btn-primary" onClick={addPiece}>Add to wardrobe</button></div>
          </div>
        </div>
      )}

      {editingPiece&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setEditingPiece(null)}>
          <div className="modal">
            <h2>Edit piece</h2>
            <div className="toggle-row" style={{marginBottom:16}}>
              <button className={`toggle-opt ${!editingPiece.rental&&(editingPiece.wardrobeType||"work")==="work"?"active":""}`} onClick={()=>setEditingPiece(p=>({...p,wardrobeType:"work",rental:false}))}>🏢 Work</button>
              <button className={`toggle-opt ${!editingPiece.rental&&editingPiece.wardrobeType==="weekend"?"active-weekend":""}`} onClick={()=>setEditingPiece(p=>({...p,wardrobeType:"weekend",rental:false}))}>🌿 Weekend</button>
              <button className={`toggle-opt ${editingPiece.rental?"active-rental":""}`} onClick={()=>setEditingPiece(p=>({...p,rental:true}))}>💎 Rental</button>
            </div>
            {editingPiece.rental&&<div className="field"><label>Rental service (optional)</label><input placeholder="e.g. Rent the Runway, Nuuly…" value={editingPiece.rentalService||""} onChange={e=>setEditingPiece(p=>({...p,rentalService:e.target.value}))} /></div>}
            <PhotoField photo={editingPiece.photo} onSet={v=>setEditingPiece(p=>({...p,photo:v}))} onClear={()=>setEditingPiece(p=>({...p,photo:""}))} refObj={editFileRef} />
            <div className="field"><label>Name</label><input value={editingPiece.name} onChange={e=>setEditingPiece(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>Category</label><select value={editingPiece.category} onChange={e=>setEditingPiece(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Color / notes</label><input value={editingPiece.color} onChange={e=>setEditingPiece(p=>({...p,color:e.target.value}))} /></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              <button className="btn btn-ghost" style={{color:"#C97A7A",borderColor:"#C97A7A44"}} onClick={()=>deletePiece(editingPiece.id)}>Delete</button>
              <div style={{display:"flex",gap:8}}><button className="btn btn-ghost" onClick={()=>setEditingPiece(null)}>Cancel</button><button className="btn btn-primary" style={{width:"auto"}} onClick={updatePiece}>Save</button></div>
            </div>
          </div>
        </div>
      )}

      {showLogOutfit&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&(setShowLogOutfit(false),setSelectedPieces([]),setRepeatWarning(null),setLogMode("office"))}>
          <div className="modal">
            <h2>Log a day</h2>
            <div className="toggle-row">
              <button className={`toggle-opt ${logMode==="office"?"active":""}`} onClick={()=>setLogMode("office")}>🏢 Office</button>
              <button className={`toggle-opt ${logMode==="wfh"?"active":""}`} onClick={()=>{setLogMode("wfh");setSelectedPieces([]);setRepeatWarning(null);}}>🏠 WFH</button>
              <button className={`toggle-opt ${logMode==="weekend"?"active-weekend":""}`} onClick={()=>{setLogMode("weekend");setSelectedPieces([]);setRepeatWarning(null);}}>🌿 Weekend</button>
            </div>
            {logMode==="wfh"&&<p style={{fontSize:13,color:"#6B6760",marginBottom:16}}>WFH days are tracked separately and won't count against your wear frequency.</p>}
            {repeatWarning&&logMode==="office"&&(<div className="repeat-warn">⚠️ You wore a similar combo on {fmtDate(repeatWarning.date)}. Log anyway?<div style={{display:"flex",gap:8,marginTop:10}}><button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>setRepeatWarning(null)}>Change outfit</button><button className="btn" style={{flex:1,fontSize:12,background:"#C97A7A",color:"white"}} onClick={logOutfit}>Log anyway</button></div></div>)}
            <div className="field"><label>Date</label><input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} /></div>
            {logMode==="office"&&<div className="field"><label>Pieces worn</label><PieceSelector pieces={[...workPieces,...activeRentals]} /></div>}
            {logMode==="weekend"&&<div className="field"><label>Weekend pieces worn</label>{weekendPieces.length===0&&activeRentals.length===0&&<p style={{fontSize:13,color:"#6B6760",marginBottom:8}}>No weekend pieces yet — add some in the Wardrobe tab.</p>}<PieceSelector pieces={[...(weekendPieces.length?weekendPieces:data.pieces.filter(p=>!p.rental)),...activeRentals]} /></div>}
            <div style={{display:"flex"}}><button className="btn btn-ghost" onClick={()=>{setShowLogOutfit(false);setSelectedPieces([]);setRepeatWarning(null);setLogMode("office");}}>Cancel</button><button className="btn btn-primary" onClick={logOutfit} style={{opacity:logMode==="wfh"||selectedPieces.length?1:0.4}}>Save</button></div>
          </div>
        </div>
      )}

      {showPlanDay!==null&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&(setShowPlanDay(null),setSelectedPieces([]),setPlanMode("office"))}>
          <div className="modal">
            <h2>Plan {WEEK_DAYS_FULL[showPlanDay]}</h2>
            <div className="toggle-row">
              <button className={`toggle-opt ${planMode==="office"?"active":""}`} onClick={()=>setPlanMode("office")}>🏢 Office</button>
              <button className={`toggle-opt ${planMode==="wfh"?"active":""}`} onClick={()=>{setPlanMode("wfh");setSelectedPieces([]);}}>🏠 Work from home</button>
            </div>
            {planMode==="office"&&<div className="field"><label>Pieces</label><PieceSelector pieces={data.pieces} /></div>}
            {planMode==="wfh"&&<p style={{fontSize:13,color:"#6B6760",marginBottom:20}}>This day will be marked as WFH — no outfit needed.</p>}
            <div style={{display:"flex"}}><button className="btn btn-ghost" onClick={()=>{setShowPlanDay(null);setSelectedPieces([]);setPlanMode("office");}}>Cancel</button><button className="btn btn-primary" onClick={()=>planDay(showPlanDay,selectedPieces,planMode==="wfh")}>Save plan</button></div>
          </div>
        </div>
      )}

      {showAddFav&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowAddFav(false)}>
          <div className="modal">
            <h2>Save a favourite</h2>
            <div className="field"><label>Name this combo</label><input placeholder="e.g. Monday power look" value={favName} onChange={e=>setFavName(e.target.value)} autoFocus /></div>
            <div className="field"><label>Pieces in this combo</label><PieceSelector pieces={data.pieces} /></div>
            <div style={{display:"flex"}}><button className="btn btn-ghost" onClick={()=>setShowAddFav(false)}>Cancel</button><button className="btn btn-primary" onClick={saveFavorite} style={{opacity:favName&&selectedPieces.length?1:0.4}}>Save favourite</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
