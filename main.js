const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAZld2-FLleV-GvqjIma-51hpcVmperjx7LlAd79BnN-8Z7-NAoakyf3KVEqeYcaK6Ev83IMc6K7_v/pub?gid=0&single=true&output=csv';

function parseCSV(text){
  const rows = text.trim().split(/\r?\n/).map(r => r.split(','));
  const [header, ...lines] = rows;
  const idx = (k)=>header.indexOf(k);
  return lines.map(c => ({
    date: c[idx('date')],
    platform: c[idx('platform')],
    title: c[idx('title')],
    url: c[idx('url')]
  }));
}

function weekOf(dateStr){
  const d = new Date(dateStr);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const diff = Math.floor((d - first)/(1000*60*60*24));
  return Math.floor(diff/7) + 1;
}

function groupByWeek(items){
  const map = {};
  items.forEach(it=>{
    const w = weekOf(it.date);
    (map[w] ||= []).push(it);
  });
  return Object.entries(map).sort((a,b)=>a[0]-b[0]);
}

function renderList(grouped){
  const root = document.getElementById('weeks');
  root.innerHTML = '';
  grouped.forEach(([week, arr])=>{
    const title = document.createElement('div');
    title.className = 'week-title';
    title.textContent = `${week}주차 (${arr.length}건)`;
    root.appendChild(title);

    arr.sort((a,b)=>a.date.localeCompare(b.date));
    arr.forEach(it=>{
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `
        <div><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></div>
        <div class="meta">${it.date} · ${it.platform}</div>
      `;
      root.appendChild(row);
    });
  });
}

function renderTotals(items){
  const t = document.getElementById('totals');
  const counts = items.reduce((acc, it)=>{
    acc[it.platform] = (acc[it.platform]||0)+1;
    return acc;
  }, {});
  const blog = counts.blog||0, insta = counts.instagram||0, fb = counts.facebook||0;
  t.textContent = `블로그 ${blog} · 인스타 ${insta} · 페북 ${fb}`;
  if(items[0]){
    const m = items[0].date.slice(0,7);
    document.getElementById('month').textContent = m;
  }
  return counts;
}

function renderChart(counts){
  const ctx = document.getElementById('platformChart');
  const labels = ['blog','instagram','facebook'];
  const data = labels.map(l=>counts[l]||0);
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label:'게시물 수', data }] },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });
}

(async ()=>{
  const res = await fetch(CSV_URL + `?cachebust=${Date.now()}`, {cache:'no-store'});
  const text = await res.text();
  const items = parseCSV(text).filter(x=>x.title && x.url);
  const grouped = groupByWeek(items);
  renderList(grouped);
  const counts = renderTotals(items);
  renderChart(counts);
})();
