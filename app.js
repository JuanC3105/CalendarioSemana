(async function(){
  const DATA_URL = "./fussion_calendar.json";
  let data = [];
  try{
    data = await fetch(DATA_URL, {cache:"no-store"}).then(r=>r.json());
  }catch(e){
    console.error("No se pudo cargar el JSON", e);
    data = [];
  }

  const $search = document.getElementById("search");
  const $types = document.getElementById("type-filters");
  const $cal = document.getElementById("calendar");
  const $counter = document.getElementById("counter");

  function deriveDay(rec){
    const keys = Object.keys(rec);
    let dayKey = keys.find(k=>/^(día|dia|dia de la semana|día de la semana)$/i.test(k));
    if(dayKey){
      const v = String(rec[dayKey]||"").trim();
      return v || "Sin día";
    }
    let dateKey = keys.find(k=>/fecha/i.test(k));
    if(dateKey){
      const d = new Date(rec[dateKey]);
      if(!Number.isNaN(+d)){
        return d.toLocaleDateString('es-CO', {weekday:'long'});
      }
    }
    // Fallback: si no hay día, mete todo en "General"
    return "General";
  }

  function deriveType(rec){
    const keys = Object.keys(rec);
    let typeKey = keys.find(k=>/tipo|formato|pieza|content[_\n\r\s-]?type/i.test(k));
    if(typeKey) return String(rec[typeKey]||"").trim();
    // Si hay una columna que contenga 'Reel', usamos 'Reel' como tipo
    if(keys.some(k=>/reel/i.test(k))) return "Reel";
    if(keys.some(k=>/historia|story/i.test(k))) return "Historia";
    if(keys.some(k=>/post/i.test(k))) return "Post";
    return "Contenido";
  }

  // Chips de tipo
  const types = new Set(["Todos"]);
  data.forEach(r=> types.add(deriveType(r)));
  let activeType = "Todos";

  function renderTypeChips(){
    $types.innerHTML = "";
    Array.from(types).forEach(t=>{
      const b = document.createElement("button");
      b.className = "chip" + (t===activeType ? " active" : "");
      b.textContent = t;
      b.onclick = ()=>{ activeType = t; render(); };
      $types.appendChild(b);
    });
  }
  renderTypeChips();

  function filterRows(){
    const q = ($search.value||"").toLowerCase().trim();
    return data.filter(r=>{
      const t = deriveType(r);
      const typeOk = activeType==="Todos" || t.toLowerCase()===activeType.toLowerCase();
      const text = Object.entries(r).map(([k,v])=>`${k}: ${v}`).join("\n").toLowerCase();
      const qOk = !q || text.includes(q);
      return typeOk && qOk;
    });
  }

  function groupByDay(rows){
    const map = new Map();
    rows.forEach(it=>{
      const day = deriveDay(it);
      if(!map.has(day)) map.set(day, []);
      map.get(day).push(it);
    });
    const order = ["lunes","martes","miércoles","miercoles","jueves","viernes","sábado","sabado","domingo","general"];
    const sortKey = d => {
      const i = order.indexOf(String(d).toLowerCase());
      return i===-1 ? 999 : i;
    };
    return Array.from(map.entries()).sort((a,b)=>sortKey(a[0])-sortKey(b[0]));
  }

  function kvTable(rec){
    const wrap = document.createElement("div");
    wrap.className = "kv";
    Object.entries(rec).forEach(([k,v])=>{
      const kEl = document.createElement("div"); kEl.textContent = k;
      const vEl = document.createElement("div"); vEl.textContent = (v==null?\"\":String(v));
      wrap.appendChild(kEl); wrap.appendChild(vEl);
    });
    return wrap;
  }

  function render(){
    const rows = filterRows();
    $counter.textContent = `${rows.length} pieza(s) encontradas`;
    const groups = groupByDay(rows);
    $cal.innerHTML = "";
    if(groups.length===0){
      const p = document.createElement("p");
      p.className="empty";
      p.textContent = "No se encontraron piezas con ese filtro.";
      $cal.appendChild(p);
      return;
    }
    groups.forEach(([day, items])=>{
      const sec = document.createElement("section"); sec.className="day";
      const h2 = document.createElement("h2"); h2.textContent = day.charAt(0).toUpperCase()+day.slice(1);
      sec.appendChild(h2);
      const grid = document.createElement("div"); grid.className="grid";
      items.forEach(it=>{
        const card = document.createElement("article"); card.className="card";
        const b = document.createElement("span"); b.className="badge"; b.textContent = deriveType(it);
        card.appendChild(b);
        card.appendChild(kvTable(it));
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      $cal.appendChild(sec);
    });
  }

  $search.addEventListener("input", render);
  render();
})();