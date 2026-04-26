import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "wardrobe-v2";
const CATEGORIES = ["Top","Bottom","Dress/Jumpsuit","Shoes","Outerwear","Accessory"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri"];
const WEEK_DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

const G = {
  bg: "#0D0D0D", surface: "#161616", card: "#1E1E1E", border: "#2A2A2A",
  text: "#F0EDE8", muted: "#6B6760", accent: "#C9A96E", accentDim: "#C9A96E22",
  rose: "#C97A7A", green: "#7AC99A", blue: "#7AA8C9", weekend: "#A87AC9", weekendDim: "#A87AC922",
  rental: "#7AC9B8", rentalDim: "#7AC9B822"
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');`;

const css = `
*{box-sizing:border-box;margin:0;padding:0;}
:root{--accent:${G.accent};}
body{background:${G.bg};color:${G.text};}
.app{font-family:'Outfit',sans-serif;min-height:100vh;background:${G.bg};max-width:480px;margin:0 auto;padding-bottom:90px;}
.serif{font-family:'Cormorant Garamond',serif;}
.header{padding:32px 24px 20px;position:relative;overflow:hidden;}
.header::before{content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:${G.accent}11;pointer-events:none;}
.header h1{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:300;letter-spacing:-0.5px;line-height:1.1;}
.header h1 em{font-style:italic;color:${G.accent};}
.header p{font-size:12px;color:${G.muted};margin-top:6px;font-weight:300;letter-spacing:0.5px;}
.nav{display:flex;gap:0;border-bottom:1px solid ${G.border};overflow-x:auto;scrollbar-width:none;padding:0 8px;}
.nav::-webkit-scrollbar{display:none;}
.nav button{flex-shrink:0;padding:12px 14px;background:none;border:none;font-family:'Outfit',sans-serif;font-size:11px;font-weight:500;color:${G.muted};cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;letter-spacing:0.8px;text-transform:uppercase;white-space:nowrap;}
.nav button.active{color:${G.accent};border-bottom-color:${G.accent};}
.section{padding:20px 24px;}
.section-label{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${G.muted};margin-bottom:14px;}
.card{background:${G.card};border-radius:14px;padding:16px;margin-bottom:10px;border:1px solid ${G.border};transition:border-color 0.2s;}
.card:hover{border-color:${G.accent}44;}
.piece-img{width:52px;height:52px;border-radius:8px;object-fit:cover;background:${G.border};flex-shrink:0;}
.piece-img-placeholder{width:52px;height:52px;border-radius:8px;background:${G.border};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:0.5px;}
.fab{position:fixed;bottom:84px;right:20px;background:${G.accent};color:${G.bg};border:none;border-radius:50%;width:54px;height:54px;font-size:22px;cursor:pointer;box-shadow:0 4px 20px ${G.accent}44;display:flex;align-items:center;justify-content:center;transition:transform 0.15s,box-shadow 0.15s;z-index:50;}
.fab:hover{transform:scale(1.06);box-shadow:0 6px 28px ${G.accent}66;}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:flex-end;backdrop-filter:blur(4px);}
.modal{background:${G.surface};border-radius:24px 24px 0 0;padding:28px 24px 48px;width:100%;max-height:88vh;overflow-y:auto;border-top:1px solid ${G.border};}
.modal h2{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:400;margin-bottom:20px;color:${G.text};}
.field{margin-bottom:16px;}
.field label{display:block;font-size:10px;font-weight:600;letter-spacing:1px;margin-bottom:8px;color:${G.muted};text-transform:uppercase;}
.field input,.field select,.field textarea{width:100%;padding:11px 14px;border:1px solid ${G.border};border-radius:10px;font-family:'Outfit',sans-serif;font-size:14px;background:${G.card};color:${G.text};outline:none;transition:border-color 0.2s;}
.field input:focus,.field select:focus,.field textarea:focus{border-color:${G.accent};}
.field select option{background:${G.card};}
.btn{padding:12px 20px;border-radius:10px;border:none;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;letter-spacing:0.3px;}
.btn-primary{background:${G.accent};color:${G.bg};width:100%;}
.btn-primary:hover{opacity:0.9;}
.btn-ghost{background:none;border:1px solid ${G.border};color:${G.muted};margin-right:8px;}
.btn-ghost:hover{border-color:${G.accent};color:${G.accent};}
.piece-chip{padding:8px 14px;border-radius:20px;border:1px solid ${G.border};font-size:12px;cursor:pointer;transition:all 0.15s;background:${G.card};color:${G.text};font-family:'Outfit',sans-serif;}
.piece-chip.selected{background:${G.accent};color:${G.bg};border-color:${G.accent};font-weight:600;}
.log-entry{padding:16px 0;border-bottom:1px solid ${G.border};}
.log-date{font-size:11px;color:${G.muted};font-weight:500;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:8px;}
.empty{text-align:center;padding:56px 24px;}
.empty .serif{font-style:italic;font-size:22px;color:${G.muted};margin-bottom:8px;display:block;}
.empty small{font-size:12px;color:${G.border};letter-spacing:0.3px;}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;scrollbar-width:none;}
.filter-row::-webkit-scrollbar{display:none;}
.filter-chip{padding:6px 14px;border-radius:20px;border:1px solid ${G.border};font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;background:${G.card};color:${G.muted};transition:all 0.15s;letter-spacing:0.3px;font-family:'Outfit',sans-serif;}
.filter-chip.active{background:${G.accent};color:${G.bg};border-color:${G.accent};}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300;color:${G.accent};line-height:1;}
.planner-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:20px;}
.planner-cell{background:${G.card};border:1px solid ${G.border};border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:all 0.2s;min-height:80px;display:flex;flex-direction:column;align-items:center;gap:4px;}
.planner-cell:hover{border-color:${G.accent}66;}
.planner-cell.has-outfit{border-color:${G.accent}44;background:${G.accentDim};}
.planner-day{font-size:10px;font-weight:600;letter-spacing:1px;color:${G.muted};text-transform:uppercase;margin-bottom:4px;}
.planner-piece{font-size:9px;color:${G.text};background:${G.border};border-radius:4px;padding:2px 4px;width:100%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.suggest-card{background:linear-gradient(135deg,${G.card},${G.accentDim});border:1px solid ${G.accent}44;border-radius:16px;padding:20px;margin-bottom:16px;text-align:center;}
.suggest-card .serif{font-size:28px;font-style:italic;color:${G.accent};display:block;margin-bottom:4px;}
.leaderboard-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${G.border};}
.lb-rank{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;color:${G.muted};width:28px;text-align:center;}
.lb-bar-wrap{flex:1;height:4px;background:${G.border};border-radius:2px;margin-top:4px;}
.lb-bar{height:4px;border-radius:2px;background:${G.accent};transition:width 0.6s ease;}
.pattern-day{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid ${G.border};}
.pattern-dots{display:flex;gap:4px;flex-wrap:wrap;}
.pattern-dot{width:8px;height:8px;border-radius:50%;background:${G.accent};opacity:0.8;}
.fav-card{background:${G.card};border:1px solid ${G.border};border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;}
.fav-card:hover{border-color:${G.accent}66;}
.repeat-warn{background:${G.rose}22;border:1px solid ${G.rose}44;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:${G.rose};}
.img-upload{width:100%;height:100px;border:1.5px dashed ${G.border};border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color 0.2s;font-size:13px;color:${G.muted};}
.img-upload:hover{border-color:${G.accent};}
.star{color:${G.accent};cursor:pointer;font-size:18px;transition:transform 0.15s;}
.star:hover{transform:scale(1.2);}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.fade-up{animation:fadeUp 0.35s ease both;}
.wfh-btn{width:100%;padding:16px;background:${G.card};border:1.5px dashed ${G.border};border-radius:14px;color:${G.muted};font-family:'Outfit',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;}
.wfh-btn:hover{border-color:#7AA8C966;color:#7AA8C9;}
.wfh-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;background:#7AA8C922;color:#7AA8C9;border:1px solid #7AA8C944;}
.planner-cell.is-wfh{border-color:#7AA8C944;background:#7AA8C911;}
.toggle-row{display:flex;gap:0;background:${G.card};border-radius:10px;padding:3px;margin-bottom:16px;}
.toggle-opt{flex:1;padding:8px;border:none;border-radius:8px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;background:none;color:${G.muted};}
.toggle-opt.active{background:${G.accent};color:${G.bg};}
.toggle-opt.active-weekend{background:${G.weekend};color:${G.bg};}
.weekend-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;background:${G.weekendDim};color:${G.weekend};border:1px solid ${G.weekend}44;}
.wardrobe-tabs{display:flex;gap:6px;margin-bottom:16px;}
.wardrobe-tab{flex:1;padding:10px;border-radius:10px;border:1.5px solid ${G.border};background:${G.card};font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;color:${G.muted};text-align:center;letter-spacing:0.3px;}
.wardrobe-tab.active-work{border-color:${G.accent};color:${G.accent};background:${G.accentDim};}
.wardrobe-tab.active-weekend{border-color:${G.weekend};color:${G.weekend};background:${G.weekendDim};}
.piece-chip.selected-weekend{background:${G.weekend};color:${G.bg};border-color:${G.weekend};font-weight:600;}
.lb-bar.weekend{background:${G.weekend};}
.lb-bar.rental{background:${G.rental};}
.rental-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;background:${G.rentalDim};color:${G.rental};border:1px solid ${G.rental}44;}
.rental-badge.returned{background:#2A2A2A;color:${G.muted};border-color:${G.border};}
.wardrobe-tab.active-rental{border-color:${G.rental};color:${G.rental};background:${G.rentalDim};}
.toggle-opt.active-rental{background:${G.rental};color:${G.bg};}
.return-btn{padding:6px 14px;border-radius:20px;border:1.5px solid ${G.rental}66;background:none;color:${G.rental};font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;letter-spacing:0.3px;}
.return-btn:hover{background:${G.rentalDim};}
.return-btn.done{border-color:${G.border};color:${G.muted};cursor:default;}
.rec-card{background:${G.card};border:1px solid ${G.border};border-radius:16px;padding:18px;margin-bottom:12px;transition:border-color 0.2s;}
.rec-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
.rec-title{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:400;line-height:1.2;}
.rec-why{font-size:13px;color:${G.muted};line-height:1.5;margin-bottom:12px;}
.rec-brands{display:flex;flex-direction:column;gap:8px;}
.rec-brand{background:${G.surface};border:1px solid ${G.border};border-radius:10px;padding:10px 12px;}
.rec-brand-name{font-size:13px;font-weight:600;margin-bottom:2px;}
.rec-brand-why{font-size:11px;color:${G.muted};line-height:1.4;}
.rec-brand-meta{display:flex;gap:6px;align-items:center;margin-top:6px;}
.eco-badge{padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;background:${G.green}22;color:${G.green};border:1px solid ${G.green}44;}
.price-badge{padding:2px 7px;border-radius:10px;font-size:10px;font-weight:500;background:${G.border};color:${G.muted};}
.rec-type-badge{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;flex-shrink:0;}
.disc-card{background:${G.card};border:1px solid ${G.border};border-radius:14px;padding:16px;margin-bottom:10px;}
.disc-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px;}
.disc-name{font-size:15px;font-weight:600;}
.disc-why{font-size:13px;color:${G.muted};line-height:1.5;margin-bottom:8px;}
.shimmer{background:linear-gradient(90deg,${G.card} 25%,${G.border} 50%,${G.card} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.recs-focus-row{display:flex;gap:6px;margin-bottom:20px;}
.recs-focus-btn{flex:1;padding:8px 6px;border-radius:10px;border:1px solid ${G.border};background:${G.card};font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;color:${G.muted};text-align:center;letter-spacing:0.3px;}
.recs-focus-btn.active{background:${G.accent};color:${G.bg};border-color:${G.accent};}
`;

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
  const [wardrobeView, setWardrobeView] = useState("work"); // "work" | "weekend" | "rental"
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
  const [logMode, setLogMode] = useState("office"); // "office" | "wfh" | "weekend"
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
      const categories = CATEGORIES;
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
{
  "gaps": [
    {
      "item": "string (specific item name)",
      "why": "string (1-2 sentences on why this fills a gap based on her actual wardrobe)",
      "category": "string",
      "wardrobeType": "work or weekend",
      "brands": [
        {"name": "string", "why": "string (1 sentence)", "ethical": true/false, "priceRange": "string e.g. $80-150"}
      ]
    }
  ],
  "trends": [
    {
      "trend": "string (trend name)",
      "description": "string (1-2 sentences)",
      "item": "string (specific piece to buy)",
      "category": "string",
      "wardrobeType": "work or weekend",
      "brands": [
        {"name": "string", "why": "string (1 sentence)", "ethical": true/false, "priceRange": "string"}
      ]
    }
  ],
  "brandDiscoveries": [
    {
      "name": "string",
      "why": "string (why she'd love it based on her current stores)",
      "specialty": "string",
      "priceRange": "string",
      "ethical": true/false,
      "ethicalNotes": "string (1 sentence on their practices)"
    }
  ]
}

Give 4-5 gap recommendations, 3-4 trend recommendations, and 4-5 brand discoveries. For each gap/trend, give 2-3 brand options. Make it specific to her actual wardrobe, not generic. Reference her real pieces where relevant.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const d = await res.json();
      const raw = d.content?.find(b => b.type === "text")?.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setRecs(parsed);
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

  const markReturned = (id) => {
    save({ ...data, pieces: data.pieces.map(p => p.id === id ? { ...p, returned: true, returnedDate: new Date().toISOString() } : p) });
  };

  const updatePiece = () => {
    if (!editingPiece?.name?.trim()) return;
    save({ ...data, pieces: data.pieces.map(p => p.id === editingPiece.id ? editingPiece : p) });
    setEditingPiece(null);
  };

  const deletePiece = (id) => {
    save({ ...data, pieces: data.pieces.filter(p => p.id !== id),
      wearLog: data.wearLog.map(e => ({ ...e, pieceIds: e.pieceIds.filter(x => x !== id) })) });
    setEditingPiece(null);
  };

  const checkRepeat = (ids) => {
    const combos = data.wearLog.filter(e => {
      const overlap = ids.filter(id => e.pieceIds.includes(id));
      return overlap.length >= Math.min(2, ids.length) && daysAgo(e.date) <= 14;
    });
    return combos.length > 0 ? combos[0] : null;
  };

  const logOutfit = () => {
    if (logMode === "wfh") {
      const entry = { id: Date.now().toString(), date: logDate, pieceIds: [], wfh: true };
      save({ ...data, wearLog: [...data.wearLog, entry] });
      setRepeatWarning(null); setShowLogOutfit(false); setLogMode("office");
      return;
    }
    if (!selectedPieces.length) return;
    const warn = checkRepeat(selectedPieces);
    if (warn && !repeatWarning) { setRepeatWarning(warn); return; }
    const entry = { id: Date.now().toString(), date: logDate, pieceIds: selectedPieces, weekend: logMode === "weekend" };
    save({ ...data, wearLog: [...data.wearLog, entry] });
    setSelectedPieces([]); setRepeatWarning(null); setShowLogOutfit(false); setLogMode("office");
  };

  const logFavorite = (fav) => {
    setSelectedPieces(fav.pieceIds);
    setShowLogOutfit(true);
  };

  const saveFavorite = () => {
    if (!favName.trim() || !selectedPieces.length) return;
    const fav = { id: Date.now().toString(), name: favName, pieceIds: selectedPieces };
    save({ ...data, favorites: [...data.favorites, fav] });
    setFavName(""); setShowAddFav(false);
  };

  const deleteFav = (id) => save({ ...data, favorites: data.favorites.filter(f => f.id !== id) });

  const planDay = (dayIdx, pieceIds, wfh) => {
    const plan = { ...(data.weekPlan[weekKey] || {}), [dayIdx]: wfh ? "wfh" : pieceIds };
    save({ ...data, weekPlan: { ...data.weekPlan, [weekKey]: plan } });
    setShowPlanDay(null); setSelectedPieces([]); setPlanMode("office");
  };

  const suggest = () => {
    const workPieces = data.pieces.filter(p => (p.wardrobeType || "work") === "work");
    if (!workPieces.length) return;
    const scored = workPieces.map(p => {
      const last = data.wearLog.filter(e => e.pieceIds.includes(p.id) && !e.weekend);
      const lastDate = last.length ? last.sort((a,b) => new Date(b.date)-new Date(a.date))[0].date : null;
      return { piece: p, score: daysAgo(lastDate) };
    });
    scored.sort((a,b) => b.score - a.score);
    const top = scored.slice(0, 3).map(s => s.piece);
    setSuggestion(top);
  };

  const getWears = (pid, year) => data.wearLog.filter(e => {
    const y = new Date(e.date).getFullYear();
    return e.pieceIds.includes(pid) && (!year || y === year);
  }).length;

  const getLastWorn = (pid) => {
    const e = data.wearLog.filter(x => x.pieceIds.includes(pid)).sort((a,b) => new Date(b.date)-new Date(a.date));
    return e[0]?.date || null;
  };

  const getMonthCount = (pid) => {
    const now = new Date();
    return data.wearLog.filter(e => {
      const d = new Date(e.date);
      return e.pieceIds.includes(pid) && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }).length;
  };

  const statusInfo = (pid) => {
    const c = getMonthCount(pid);
    if (c >= 3) return { label:`${c}× this month`, color: G.rose };
    if (c === 2) return { label:`${c}× this month`, color: "#C9A96E" };
    return { label: c > 0 ? `${c}× this month` : "Not worn yet", color: G.muted };
  };

  const currentYear = new Date().getFullYear();
  const rentalPieces = data.pieces.filter(p => p.rental);
  const workPieces = data.pieces.filter(p => !p.rental && (p.wardrobeType || "work") === "work");
  const weekendPieces = data.pieces.filter(p => !p.rental && p.wardrobeType === "weekend");
  const activeRentals = rentalPieces.filter(p => !p.returned);
  const returnedRentals = rentalPieces.filter(p => p.returned);
  const neverWorn = workPieces.filter(p => getWears(p.id, currentYear) === 0);
  const neverWornWeekend = weekendPieces.filter(p => getWears(p.id, currentYear) === 0);
  const sorted = [...workPieces].sort((a,b) => getWears(b.id, currentYear) - getWears(a.id, currentYear));
  const sortedWeekend = [...weekendPieces].sort((a,b) => getWears(b.id, currentYear) - getWears(a.id, currentYear));
  const sortedRental = [...rentalPieces].sort((a,b) => getWears(b.id, currentYear) - getWears(a.id, currentYear));
  const maxWears = sorted[0] ? getWears(sorted[0].id, currentYear) : 1;
  const maxWearsWknd = sortedWeekend[0] ? getWears(sortedWeekend[0].id, currentYear) : 1;
  const maxWearsRental = sortedRental[0] ? getWears(sortedRental[0].id, currentYear) : 1;
  const recentLog = [...data.wearLog].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,15);
  const filteredPieces = filterCat === "All"
    ? (wardrobeView==="weekend" ? weekendPieces : wardrobeView==="rental" ? rentalPieces : workPieces)
    : data.pieces.filter(p => p.category === filterCat && (wardrobeView==="rental" ? p.rental : !p.rental && (p.wardrobeType||"work") === wardrobeView));
  const thisWeekPlan = data.weekPlan[weekKey] || {};
  const wfhDaysThisYear = data.wearLog.filter(e => e.wfh && new Date(e.date).getFullYear() === currentYear).length;
  const officeDaysThisYear = data.wearLog.filter(e => !e.wfh && !e.weekend && new Date(e.date).getFullYear() === currentYear).length;
  const weekendDaysThisYear = data.wearLog.filter(e => e.weekend && new Date(e.date).getFullYear() === currentYear).length;

  // Day of week patterns
  const dayPatterns = DAYS.map((d, i) => {
    const entries = data.wearLog.filter(e => {
      const wd = new Date(e.date + "T12:00:00").getDay();
      return wd === (i + 1);
    });
    const pieceCounts = {};
    entries.forEach(e => e.pieceIds.forEach(pid => { pieceCounts[pid] = (pieceCounts[pid]||0)+1; }));
    const top = Object.entries(pieceCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([pid])=>data.pieces.find(p=>p.id===pid)).filter(Boolean);
    return { day: d, count: entries.length, top };
  });

  const handlePhoto = (e, isEdit) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      if (isEdit) setEditingPiece(p => ({ ...p, photo: ev.target.result }));
      else setNewPiece(p => ({ ...p, photo: ev.target.result }));
    };
    r.readAsDataURL(file);
  };

  const togglePiece = (id) => setSelectedPieces(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);

  const PieceSelector = ({ pieces }) => (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
      {pieces.length === 0 && <p style={{fontSize:13,color:G.muted}}>Add wardrobe pieces first.</p>}
      {pieces.map(p => (
        <button key={p.id} className={`piece-chip ${selectedPieces.includes(p.id)?"selected":""}`} onClick={()=>togglePiece(p.id)}>
          {p.photo && <img src={p.photo} style={{width:14,height:14,borderRadius:3,objectFit:"cover",marginRight:4,verticalAlign:"middle"}} />}
          {p.name}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <style>{FONTS}{css}</style>
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

        {/* TODAY */}
        {view === "today" && (
          <div className="section fade-up">
            <div className="section-label">What to wear today</div>
            {suggestion ? (
              <>
                <div className="suggest-card">
                  <span className="serif">Suggested picks</span>
                  <p style={{fontSize:12,color:G.muted,marginBottom:16}}>Based on what you haven't worn recently</p>
                  {suggestion.map(p => (
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,background:G.surface,borderRadius:10,padding:10,marginBottom:8}}>
                      {p.photo ? <img src={p.photo} className="piece-img" /> : <div className="piece-img-placeholder">👗</div>}
                      <div style={{textAlign:"left"}}>
                        <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                        <div style={{fontSize:11,color:G.muted}}>{p.category} · Last worn {daysAgo(getLastWorn(p.id)) > 300 ? "never this year" : `${daysAgo(getLastWorn(p.id))}d ago`}</div>
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
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:G.muted,marginBottom:20}}>Let's find something perfect.</p>
                  <button className="btn btn-primary" style={{width:"auto",padding:"12px 32px"}} onClick={suggest}>Suggest an outfit</button>
                </div>
                <button className="wfh-btn" onClick={()=>{setLogMode("wfh");setShowLogOutfit(true);}}>🏠 Log a work from home day</button>
                <button className="wfh-btn" style={{borderColor:`${G.weekend}44`,color:G.weekend,marginTop:8}} onClick={()=>{setLogMode("weekend");setShowLogOutfit(true);}}>🌿 Log a weekend outfit</button>

                {data.favorites.length > 0 && (
                  <>
                    <div className="section-label" style={{marginTop:8}}>Or wear a favourite</div>
                    {data.favorites.map(fav => (
                      <div key={fav.id} className="fav-card" onClick={()=>logFavorite(fav)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:500,fontSize:14}}>⭐ {fav.name}</div>
                            <div style={{fontSize:11,color:G.muted,marginTop:3}}>
                              {fav.pieceIds.map(id=>data.pieces.find(p=>p.id===id)?.name).filter(Boolean).join(" + ")}
                            </div>
                          </div>
                          <span style={{fontSize:11,color:G.accent}}>Wear →</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div className="section fade-up">
            <div className="section-label">Recent outfits</div>
            {recentLog.length === 0 && <div className="empty"><span className="serif">Nothing logged yet.</span><small>Tap ✓ to record today's look</small></div>}
            {recentLog.map(entry => (
              <div key={entry.id} className="log-entry">
                <div className="log-date">{fmtDate(entry.date)}</div>
                {entry.wfh ? (
                  <span className="wfh-badge">🏠 Work from home</span>
                ) : entry.weekend ? (
                  <span className="weekend-badge">🌿 Weekend</span>
                ) : (
                <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                  {entry.pieceIds.map(pid => {
                    const p = data.pieces.find(x=>x.id===pid);
                    return p ? (
                      <span key={pid} style={{display:"flex",alignItems:"center",gap:5,background:G.card,border:`1px solid ${G.border}`,borderRadius:20,padding:"4px 10px",fontSize:12}}>
                        {p.photo && <img src={p.photo} style={{width:14,height:14,borderRadius:3,objectFit:"cover"}} />}
                        {p.name}
                      </span>
                    ) : null;
                  })}
                </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* WARDROBE */}
        {view === "wardrobe" && (
          <div className="section fade-up">
            <div className="wardrobe-tabs">
              <button className={`wardrobe-tab ${wardrobeView==="work"?"active-work":""}`} onClick={()=>{setWardrobeView("work");setFilterCat("All");}}>🏢 Work ({workPieces.length})</button>
              <button className={`wardrobe-tab ${wardrobeView==="weekend"?"active-weekend":""}`} onClick={()=>{setWardrobeView("weekend");setFilterCat("All");}}>🌿 Weekend ({weekendPieces.length})</button>
              <button className={`wardrobe-tab ${wardrobeView==="rental"?"active-rental":""}`} onClick={()=>{setWardrobeView("rental");setFilterCat("All");}}>💎 Rentals ({activeRentals.length})</button>
            </div>
            <div className="filter-row">
              {["All",...CATEGORIES].map(c=>(
                <button key={c} className={`filter-chip ${filterCat===c?"active":""}`} onClick={()=>setFilterCat(c)}>{c}</button>
              ))}
            </div>
            {filteredPieces.length === 0 && <div className="empty"><span className="serif">No {wardrobeView} pieces yet.</span><small>Tap + to add your {wardrobeView==="weekend"?"weekend":wardrobeView==="rental"?"rentals":"work"} clothes</small></div>}
            {filteredPieces.map(p => {
              const s = statusInfo(p.id);
              const last = getLastWorn(p.id);
              const isWeekend = p.wardrobeType === "weekend";
              const isRental = p.rental;
              const borderCol = isRental ? `${G.rental}33` : isWeekend ? `${G.weekend}22` : undefined;
              return (
                <div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"flex-start",borderColor:borderCol}}>
                  <div style={{flex:"none"}} onClick={()=>setEditingPiece({...p})}>
                    {p.photo ? <img src={p.photo} className="piece-img" /> : <div className="piece-img-placeholder">{isRental?"💎":isWeekend?"👟":"👕"}</div>}
                  </div>
                  <div style={{flex:1,minWidth:0}} onClick={()=>setEditingPiece({...p})}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                      <span className="badge" style={{background:s.color+"22",color:s.color,flexShrink:0}}>{s.label}</span>
                    </div>
                    {isRental && (
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                        <span className={`rental-badge ${p.returned?"returned":""}`}>{p.returned ? "✓ Returned" : "💎 On loan"}</span>
                        {p.rentalService && <span style={{fontSize:11,color:G.muted}}>{p.rentalService}</span>}
                      </div>
                    )}
                    <div style={{fontSize:11,color:G.muted,marginTop:3}}>{p.category}{p.color?` · ${p.color}`:""}</div>
                    <div style={{fontSize:11,color:G.muted,marginTop:2}}>
                      {last ? `Last worn ${daysAgo(last)}d ago` : "Never worn"} · {getWears(p.id,currentYear)} wears this year
                    </div>
                  </div>
                  {isRental && !p.returned && (
                    <button className="return-btn" style={{flexShrink:0,alignSelf:"center"}} onClick={()=>markReturned(p.id)}>Return</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PLANNER */}
        {view === "plan" && (
          <div className="section fade-up">
            <div className="section-label">This week's plan</div>
            <div className="planner-grid">
              {DAYS.map((d,i) => {
                const dayPlan = thisWeekPlan[i] || [];
                const isWfh = dayPlan === "wfh";
                const pieces = isWfh ? [] : dayPlan.map(id=>data.pieces.find(p=>p.id===id)).filter(Boolean);
                return (
                  <div key={d} className={`planner-cell ${isWfh?"is-wfh":pieces.length?"has-outfit":""}`} onClick={()=>{setSelectedPieces(isWfh?[]:dayPlan);setShowPlanDay(i);}}>
                    <div className="planner-day">{d}</div>
                    {isWfh ? <span style={{fontSize:20}}>🏠</span> : pieces.length === 0 ? <span style={{fontSize:18,opacity:0.3}}>+</span> : pieces.slice(0,3).map(p=>(
                      p.photo ? <img key={p.id} src={p.photo} style={{width:"100%",height:28,objectFit:"cover",borderRadius:4}} /> :
                      <div key={p.id} className="planner-piece">{p.name}</div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="section-label" style={{marginTop:8}}>Saved favourites</div>
            {data.favorites.length === 0 && <div style={{fontSize:13,color:G.muted,marginBottom:16}}>Save outfit combos for quick re-logging.</div>}
            {data.favorites.map(fav => (
              <div key={fav.id} className="fav-card" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:500,fontSize:14}}>⭐ {fav.name}</div>
                  <div style={{fontSize:11,color:G.muted,marginTop:3}}>
                    {fav.pieceIds.map(id=>data.pieces.find(p=>p.id===id)?.name).filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:18}} onClick={()=>deleteFav(fav.id)}>×</button>
              </div>
            ))}
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setShowAddFav(true)}>+ Save new favourite combo</button>
          </div>
        )}

        {/* INSIGHTS */}
        {view === "insights" && (
          <div className="section fade-up">
            <div className="section-label">🏢 Most worn work pieces</div>
            {sorted.slice(0,6).map((p,i) => {
              const w = getWears(p.id, currentYear);
              return (
                <div key={p.id} className="leaderboard-row">
                  <div className="lb-rank">{i+1}</div>
                  {p.photo ? <img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:"cover"}} /> : <div style={{width:36,height:36,borderRadius:6,background:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👕</div>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                    <div className="lb-bar-wrap"><div className="lb-bar" style={{width:`${(w/Math.max(maxWears,1))*100}%`}}></div></div>
                  </div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:G.accent}}>{w}</div>
                </div>
              );
            })}
            {sorted.length === 0 && <div style={{fontSize:13,color:G.muted,marginBottom:16}}>No work outfits logged yet.</div>}

            {weekendPieces.length > 0 && (<>
              <div className="section-label" style={{marginTop:24}}>🌿 Most worn weekend pieces</div>
              {sortedWeekend.slice(0,6).map((p,i) => {
                const w = getWears(p.id, currentYear);
                return (
                  <div key={p.id} className="leaderboard-row">
                    <div className="lb-rank">{i+1}</div>
                    {p.photo ? <img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:"cover"}} /> : <div style={{width:36,height:36,borderRadius:6,background:`${G.weekend}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👟</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                      <div className="lb-bar-wrap"><div className="lb-bar weekend" style={{width:`${(w/Math.max(maxWearsWknd,1))*100}%`}}></div></div>
                    </div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:G.weekend}}>{w}</div>
                  </div>
                );
              })}
            </>)}

            {rentalPieces.length > 0 && (<>
              <div className="section-label" style={{marginTop:24}}>💎 Rental wear count</div>
              {sortedRental.slice(0,6).map((p,i) => {
                const w = getWears(p.id, currentYear);
                return (
                  <div key={p.id} className="leaderboard-row">
                    <div className="lb-rank">{i+1}</div>
                    {p.photo ? <img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:"cover"}} /> : <div style={{width:36,height:36,borderRadius:6,background:`${G.rentalDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💎</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500}}>{p.name}{p.returned && <span style={{fontSize:10,color:G.muted,marginLeft:6}}>returned</span>}</div>
                      {p.rentalService && <div style={{fontSize:11,color:G.muted}}>{p.rentalService}</div>}
                      <div className="lb-bar-wrap"><div className="lb-bar rental" style={{width:`${(w/Math.max(maxWearsRental,1))*100}%`}}></div></div>
                    </div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:G.rental}}>{w}</div>
                  </div>
                );
              })}
            </>)}

            <div className="section-label" style={{marginTop:24}}>Day of week patterns</div>
            {dayPatterns.map(({day, count, top}) => (
              <div key={day} className="pattern-day">
                <div style={{width:32,fontSize:11,fontWeight:600,color:G.muted,letterSpacing:0.5}}>{day}</div>
                <div style={{flex:1}}>
                  {top.length === 0 ? <span style={{fontSize:11,color:G.border}}>No data</span> : (
                    <div style={{fontSize:11,color:G.muted}}>{top.map(p=>p.name).join(", ")}</div>
                  )}
                </div>
                <div style={{fontSize:11,color:G.muted}}>{count} outfits</div>
              </div>
            ))}
          </div>
        )}

        {/* RECS */}
        {view === "recs" && (
          <div className="section fade-up">
            {!recs && !recsLoading && (
              <div style={{textAlign:"center",padding:"32px 0 24px"}}>
                <div style={{fontSize:56,marginBottom:16}}>✦</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:G.text,marginBottom:8}}>Your personal stylist.</p>
                <p style={{fontSize:13,color:G.muted,marginBottom:28,lineHeight:1.6}}>AI analyses your wardrobe data to find what's missing, what's trending, and which ethical brands match your style.</p>
                <button className="btn btn-primary" style={{width:"auto",padding:"14px 36px",fontSize:14}} onClick={()=>fetchRecs(data.pieces, data.wearLog)}>
                  Generate my recommendations
                </button>
                {data.pieces.length === 0 && <p style={{fontSize:12,color:G.muted,marginTop:16}}>Add some wardrobe pieces first for best results.</p>}
              </div>
            )}

            {recsLoading && (
              <div style={{padding:"16px 0"}}>
                <p style={{fontSize:13,color:G.muted,textAlign:"center",marginBottom:24,fontStyle:"italic"}}>Analysing your wardrobe…</p>
                {[180,140,200,160].map((w,i) => (
                  <div key={i} style={{marginBottom:12}}>
                    <div className="shimmer" style={{height:20,width:`${w}px`,marginBottom:8}}></div>
                    <div className="shimmer" style={{height:14,width:"90%",marginBottom:6}}></div>
                    <div className="shimmer" style={{height:14,width:"70%"}}></div>
                  </div>
                ))}
              </div>
            )}

            {recsError && (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <p style={{color:G.rose,marginBottom:16,fontSize:13}}>{recsError}</p>
                <button className="btn btn-ghost" onClick={()=>fetchRecs(data.pieces, data.wearLog)}>Try again</button>
              </div>
            )}

            {recs && (
              <>
                <div className="recs-focus-row">
                  {[["all","All"],["gaps","Gaps"],["trends","Trends"],["brands","Brands"]].map(([v,l])=>(
                    <button key={v} className={`recs-focus-btn ${recsFocus===v?"active":""}`} onClick={()=>setRecsFocus(v)}>{l}</button>
                  ))}
                </div>

                {(recsFocus==="all"||recsFocus==="gaps") && recs.gaps?.length > 0 && (<>
                  <div className="section-label">Wardrobe gaps to fill</div>
                  {recs.gaps.map((g,i) => (
                    <div key={i} className="rec-card">
                      <div className="rec-card-header">
                        <div className="rec-title">{g.item}</div>
                        <span className="rec-type-badge" style={{background: g.wardrobeType==="weekend"?`${G.weekend}22`:`${G.accent}22`, color: g.wardrobeType==="weekend"?G.weekend:G.accent}}>
                          {g.wardrobeType==="weekend"?"🌿":"🏢"} {g.category}
                        </span>
                      </div>
                      <p className="rec-why">{g.why}</p>
                      <div className="rec-brands">
                        {g.brands?.map((b,j) => (
                          <div key={j} className="rec-brand">
                            <div className="rec-brand-name">{b.name}</div>
                            <div className="rec-brand-why">{b.why}</div>
                            <div className="rec-brand-meta">
                              {b.ethical && <span className="eco-badge">♻ Ethical</span>}
                              <span className="price-badge">{b.priceRange}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>)}

                {(recsFocus==="all"||recsFocus==="trends") && recs.trends?.length > 0 && (<>
                  <div className="section-label" style={{marginTop: recsFocus==="all"?20:0}}>On-trend right now</div>
                  {recs.trends.map((t,i) => (
                    <div key={i} className="rec-card" style={{borderColor:`${G.blue}33`}}>
                      <div className="rec-card-header">
                        <div>
                          <div style={{fontSize:10,fontWeight:600,letterSpacing:1,color:G.blue,textTransform:"uppercase",marginBottom:4}}>{t.trend}</div>
                          <div className="rec-title">{t.item}</div>
                        </div>
                        <span className="rec-type-badge" style={{background:`${G.blue}22`,color:G.blue}}>
                          {t.wardrobeType==="weekend"?"🌿":"🏢"} {t.category}
                        </span>
                      </div>
                      <p className="rec-why">{t.description}</p>
                      <div className="rec-brands">
                        {t.brands?.map((b,j) => (
                          <div key={j} className="rec-brand">
                            <div className="rec-brand-name">{b.name}</div>
                            <div className="rec-brand-why">{b.why}</div>
                            <div className="rec-brand-meta">
                              {b.ethical && <span className="eco-badge">♻ Ethical</span>}
                              <span className="price-badge">{b.priceRange}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>)}

                {(recsFocus==="all"||recsFocus==="brands") && recs.brandDiscoveries?.length > 0 && (<>
                  <div className="section-label" style={{marginTop: recsFocus==="all"?20:0}}>Brands to discover</div>
                  {recs.brandDiscoveries.map((b,i) => (
                    <div key={i} className="disc-card">
                      <div className="disc-card-top">
                        <div className="disc-name">{b.name}</div>
                        <div style={{display:"flex",gap:5,flexShrink:0}}>
                          {b.ethical && <span className="eco-badge">♻ Ethical</span>}
                          <span className="price-badge">{b.priceRange}</span>
                        </div>
                      </div>
                      <p className="disc-why">{b.why}</p>
                      {b.ethicalNotes && <p style={{fontSize:11,color:G.green,lineHeight:1.4}}>♻ {b.ethicalNotes}</p>}
                      <p style={{fontSize:11,color:G.muted,marginTop:4}}>Speciality: {b.specialty}</p>
                    </div>
                  ))}
                </>)}

                <button className="btn btn-ghost" style={{width:"100%",marginTop:16}} onClick={()=>fetchRecs(data.pieces, data.wearLog)}>
                  ↻ Refresh recommendations
                </button>
              </>
            )}
          </div>
        )}

        {/* REPORT */}
        {view === "report" && (
          <div className="section fade-up">
            <div className="section-label">{currentYear} at a glance</div>
            <div className="card" style={{marginBottom:20}}>
              {[
                ["Work pieces", workPieces.length],
                ["Weekend pieces", weekendPieces.length],
                ["Active rentals", activeRentals.length],
                ["Office days logged", officeDaysThisYear],
                ["WFH days logged", wfhDaysThisYear],
                ["Weekend outfits logged", weekendDaysThisYear],
                ["Work pieces unworn", neverWorn.length],
                ["Weekend pieces unworn", neverWornWeekend.length],
              ].map(([label,val],i,arr)=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<arr.length-1?`1px solid ${G.border}`:"none"}}>
                  <span style={{fontSize:13,color:G.muted}}>{label}</span>
                  <span className="stat-num" style={{fontSize:26,color:
                    (label.includes("unworn")&&val>0) ? G.rose :
                    label.includes("WFH") ? G.blue :
                    label.includes("rental") ? G.rental :
                    label.includes("Weekend")||label.includes("weekend") ? G.weekend : G.accent
                  }}>{val}</span>
                </div>
              ))}
            </div>

            {neverWorn.length > 0 && (
              <>
                <div className="section-label">🏢 Consider donating · {neverWorn.length} work piece{neverWorn.length!==1?"s":""}</div>
                {neverWorn.map(p => (
                  <div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"center"}}>
                    {p.photo ? <img src={p.photo} className="piece-img" /> : <div className="piece-img-placeholder">👕</div>}
                    <div>
                      <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                      <div style={{fontSize:11,color:G.muted}}>{p.category}{p.color?` · ${p.color}`:""}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {neverWornWeekend.length > 0 && (
              <>
                <div className="section-label" style={{marginTop:8}}>🌿 Consider donating · {neverWornWeekend.length} weekend piece{neverWornWeekend.length!==1?"s":""}</div>
                {neverWornWeekend.map(p => (
                  <div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"center",borderColor:`${G.weekend}22`}}>
                    {p.photo ? <img src={p.photo} className="piece-img" /> : <div className="piece-img-placeholder">👟</div>}
                    <div>
                      <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                      <div style={{fontSize:11,color:G.muted}}>{p.category}{p.color?` · ${p.color}`:""}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {rentalPieces.length > 0 && (
              <>
                <div className="section-label" style={{marginTop:8}}>💎 Rental history this year</div>
                {rentalPieces.filter(p => getWears(p.id, currentYear) > 0 || !p.returned).map(p => (
                  <div key={p.id} className="card" style={{display:"flex",gap:12,alignItems:"center",borderColor:`${G.rental}33`}}>
                    {p.photo ? <img src={p.photo} className="piece-img" /> : <div className="piece-img-placeholder" style={{background:G.rentalDim}}>💎</div>}
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                      <div style={{fontSize:11,color:G.muted}}>{p.rentalService||"Rental"} · {getWears(p.id,currentYear)} wear{getWears(p.id,currentYear)!==1?"s":""} this year</div>
                    </div>
                    <span className={`rental-badge ${p.returned?"returned":""}`}>{p.returned?"✓ Returned":"On loan"}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* FAB */}
        <button className="fab" onClick={()=>{
          if(view==="wardrobe"){
            setNewPiece({name:"",category:"Top",color:"",photo:"",wardrobeType:wardrobeView==="rental"?"work":wardrobeView, rental:wardrobeView==="rental", rentalService:"", returned:false});
            setShowAddPiece(true);
          } else setShowLogOutfit(true);
        }}>
          {view==="wardrobe"?"＋":"✓"}
        </button>

        {/* ADD PIECE MODAL */}
        {showAddPiece && (
          <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowAddPiece(false)}>
            <div className="modal">
              <h2>Add a piece</h2>
              <div className="toggle-row" style={{marginBottom:16}}>
                <button className={`toggle-opt ${!newPiece.rental&&newPiece.wardrobeType==="work"?"active":""}`} onClick={()=>setNewPiece(p=>({...p,wardrobeType:"work",rental:false}))}>🏢 Work</button>
                <button className={`toggle-opt ${!newPiece.rental&&newPiece.wardrobeType==="weekend"?"active-weekend":""}`} onClick={()=>setNewPiece(p=>({...p,wardrobeType:"weekend",rental:false}))}>🌿 Weekend</button>
                <button className={`toggle-opt ${newPiece.rental?"active-rental":""}`} onClick={()=>setNewPiece(p=>({...p,rental:true}))}>💎 Rental</button>
              </div>
              {newPiece.rental && (
                <div className="field">
                  <label>Rental service (optional)</label>
                  <input placeholder="e.g. Rent the Runway, Nuuly…" value={newPiece.rentalService} onChange={e=>setNewPiece(p=>({...p,rentalService:e.target.value}))} />
                </div>
              )}
              <div className="field">
                <label>Photo</label>
                <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={e=>handlePhoto(e,false)} />
                {newPiece.photo ? (
                  <div style={{position:"relative"}}>
                    <img src={newPiece.photo} style={{width:"100%",height:120,objectFit:"cover",borderRadius:10}} />
                    <button onClick={()=>setNewPiece(p=>({...p,photo:""}))} style={{position:"absolute",top:8,right:8,background:G.bg,color:G.text,border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:16}}>×</button>
                  </div>
                ) : (
                  <div className="img-upload" onClick={()=>fileRef.current?.click()}>📷 Add photo</div>
                )}
              </div>
              <div className="field"><label>Name</label><input placeholder="e.g. Navy blazer" value={newPiece.name} onChange={e=>setNewPiece(p=>({...p,name:e.target.value}))} autoFocus /></div>
              <div className="field"><label>Category</label><select value={newPiece.category} onChange={e=>setNewPiece(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="field"><label>Color / notes</label><input placeholder="e.g. Camel, striped…" value={newPiece.color} onChange={e=>setNewPiece(p=>({...p,color:e.target.value}))} /></div>
              <div style={{display:"flex"}}><button className="btn btn-ghost" onClick={()=>setShowAddPiece(false)}>Cancel</button><button className="btn btn-primary" onClick={addPiece}>Add to wardrobe</button></div>
            </div>
          </div>
        )}

        {/* EDIT PIECE MODAL */}
        {editingPiece && (
          <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setEditingPiece(null)}>
            <div className="modal">
              <h2>Edit piece</h2>
              <div className="toggle-row" style={{marginBottom:16}}>
                <button className={`toggle-opt ${!editingPiece.rental&&(editingPiece.wardrobeType||"work")==="work"?"active":""}`} onClick={()=>setEditingPiece(p=>({...p,wardrobeType:"work",rental:false}))}>🏢 Work</button>
                <button className={`toggle-opt ${!editingPiece.rental&&editingPiece.wardrobeType==="weekend"?"active-weekend":""}`} onClick={()=>setEditingPiece(p=>({...p,wardrobeType:"weekend",rental:false}))}>🌿 Weekend</button>
                <button className={`toggle-opt ${editingPiece.rental?"active-rental":""}`} onClick={()=>setEditingPiece(p=>({...p,rental:true}))}>💎 Rental</button>
              </div>
              {editingPiece.rental && (
                <div className="field">
                  <label>Rental service (optional)</label>
                  <input placeholder="e.g. Rent the Runway, Nuuly…" value={editingPiece.rentalService||""} onChange={e=>setEditingPiece(p=>({...p,rentalService:e.target.value}))} />
                </div>
              )}
              <div className="field">
                <label>Photo</label>
                <input type="file" accept="image/*" ref={editFileRef} style={{display:"none"}} onChange={e=>handlePhoto(e,true)} />
                {editingPiece.photo ? (
                  <div style={{position:"relative"}}>
                    <img src={editingPiece.photo} style={{width:"100%",height:120,objectFit:"cover",borderRadius:10}} />
                    <button onClick={()=>setEditingPiece(p=>({...p,photo:""}))} style={{position:"absolute",top:8,right:8,background:G.bg,color:G.text,border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:16}}>×</button>
                  </div>
                ) : (
                  <div className="img-upload" onClick={()=>editFileRef.current?.click()}>📷 Add photo</div>
                )}
              </div>
              <div className="field"><label>Name</label><input value={editingPiece.name} onChange={e=>setEditingPiece(p=>({...p,name:e.target.value}))} /></div>
              <div className="field"><label>Category</label><select value={editingPiece.category} onChange={e=>setEditingPiece(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="field"><label>Color / notes</label><input value={editingPiece.color} onChange={e=>setEditingPiece(p=>({...p,color:e.target.value}))} /></div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                <button className="btn btn-ghost" style={{color:G.rose,borderColor:G.rose+"44"}} onClick={()=>deletePiece(editingPiece.id)}>Delete</button>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-ghost" onClick={()=>setEditingPiece(null)}>Cancel</button>
                  <button className="btn btn-primary" style={{width:"auto"}} onClick={updatePiece}>Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOG OUTFIT MODAL */}
        {showLogOutfit && (
          <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&(setShowLogOutfit(false),setSelectedPieces([]),setRepeatWarning(null),setLogMode("office"))}>
            <div className="modal">
              <h2>Log a day</h2>
              <div className="toggle-row">
                <button className={`toggle-opt ${logMode==="office"?"active":""}`} onClick={()=>setLogMode("office")}>🏢 Office</button>
                <button className={`toggle-opt ${logMode==="wfh"?"active":""}`} onClick={()=>{setLogMode("wfh");setSelectedPieces([]);setRepeatWarning(null);}}>🏠 WFH</button>
                <button className={`toggle-opt ${logMode==="weekend"?"active-weekend":""}`} onClick={()=>{setLogMode("weekend");setSelectedPieces([]);setRepeatWarning(null);}}>🌿 Weekend</button>
              </div>
              {logMode==="wfh" && (
                <p style={{fontSize:13,color:G.muted,marginBottom:16}}>WFH days are tracked separately and won't count against your wear frequency.</p>
              )}
              {repeatWarning && logMode==="office" && (
                <div className="repeat-warn">
                  ⚠️ You wore a similar combo on {fmtDate(repeatWarning.date)}. Log anyway?
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>setRepeatWarning(null)}>Change outfit</button>
                    <button className="btn" style={{flex:1,fontSize:12,background:G.rose,color:"white"}} onClick={logOutfit}>Log anyway</button>
                  </div>
                </div>
              )}
              <div className="field"><label>Date</label><input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} /></div>
              {logMode==="office" && (
                <div className="field">
                  <label>Pieces worn</label>
                  <PieceSelector pieces={[...workPieces, ...activeRentals]} />
                </div>
              )}
              {logMode==="weekend" && (
                <div className="field">
                  <label>Weekend pieces worn</label>
                  {weekendPieces.length === 0 && activeRentals.length === 0 && <p style={{fontSize:13,color:G.muted,marginBottom:8}}>No weekend pieces yet — add some in the Wardrobe tab.</p>}
                  <PieceSelector pieces={[...(weekendPieces.length ? weekendPieces : data.pieces.filter(p=>!p.rental)), ...activeRentals]} />
                </div>
              )}
              <div style={{display:"flex"}}>
                <button className="btn btn-ghost" onClick={()=>{setShowLogOutfit(false);setSelectedPieces([]);setRepeatWarning(null);setLogMode("office");}}>Cancel</button>
                <button className="btn btn-primary" onClick={logOutfit} style={{opacity:logMode==="wfh"||selectedPieces.length?1:0.4}}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* PLAN DAY MODAL */}
        {showPlanDay !== null && (
          <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&(setShowPlanDay(null),setSelectedPieces([]),setPlanMode("office"))}>
            <div className="modal">
              <h2>Plan {WEEK_DAYS_FULL[showPlanDay]}</h2>
              <div className="toggle-row">
                <button className={`toggle-opt ${planMode==="office"?"active":""}`} onClick={()=>setPlanMode("office")}>🏢 Office</button>
                <button className={`toggle-opt ${planMode==="wfh"?"active":""}`} onClick={()=>{setPlanMode("wfh");setSelectedPieces([]);}}>🏠 Work from home</button>
              </div>
              {planMode === "office" && (
                <div className="field">
                  <label>Pieces</label>
                  <PieceSelector pieces={data.pieces} />
                </div>
              )}
              {planMode === "wfh" && (
                <p style={{fontSize:13,color:G.muted,marginBottom:20}}>This day will be marked as WFH — no outfit needed.</p>
              )}
              <div style={{display:"flex"}}>
                <button className="btn btn-ghost" onClick={()=>{setShowPlanDay(null);setSelectedPieces([]);setPlanMode("office");}}>Cancel</button>
                <button className="btn btn-primary" onClick={()=>planDay(showPlanDay,selectedPieces,planMode==="wfh")}>Save plan</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD FAVOURITE MODAL */}
        {showAddFav && (
          <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowAddFav(false)}>
            <div className="modal">
              <h2>Save a favourite</h2>
              <div className="field"><label>Name this combo</label><input placeholder="e.g. Monday power look" value={favName} onChange={e=>setFavName(e.target.value)} autoFocus /></div>
              <div className="field">
                <label>Pieces in this combo</label>
                <PieceSelector pieces={data.pieces} />
              </div>
              <div style={{display:"flex"}}>
                <button className="btn btn-ghost" onClick={()=>setShowAddFav(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveFavorite} style={{opacity:favName&&selectedPieces.length?1:0.4}}>Save favourite</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
