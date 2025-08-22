const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAZld2-FLleV-GvqjIma-51hpcVmperjx7LlAd79BnN-8Z7-NAoakyf3KVEqeYcaK6Ev83IMc6K7_v/pub?gid=0&single=true&output=csv';

function parseCSV(text){
  const rows = text.trim().split(/\r?\n/).map(r => r.split(','));
  const [header, ...lines] = rows;
  // 현재 시트 구조: A=업로드날짜, B=플랫폼, C=주제, D=링크
  return lines.map(c => ({
    date: c[0],       // A열
    platform: c[1],   // B열
    title: c[2],      // C열
    url: c[3]         // D열
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
    const key = (it.platform || '').trim(); // '블로그'/'인스타'/'페북'
    acc[key] = (acc[key]||0)+1;
    return acc;
  }, {});
  const blog = counts['블로그']||0, insta = counts['인스타']||0, fb = counts['페북']||0;
  t.textContent = `블로그 ${blog} · 인스타 ${insta} · 페북 ${fb}`;

  // 월 표시: 가장 최근 데이터 기준(안전)
  if(items.length){
    const m = items
      .map(x=> (x.date||'').slice(0,7))
      .filter(Boolean)
      .sort()
      .pop();
    document.getElementById('month').textContent = m || '';
  }
  return {
    blog: blog,
    instagram: insta,
    facebook: fb
  };
}

function renderChart(counts){
  const ctx = document.getElementById('platformChart');
  const labels = ['블로그','인스타','페북'];
  const data = labels.map(l=>counts[l]||0);
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label:'게시물 수', data }] },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });
}

(async ()=>{
  const res = await fetch(CSV_URL + `&cachebust=${Date.now()}`, {cache:'no-store'});
  const text = await res.text();
  const items = parseCSV(text).filter(x=>x.title && x.url);
  const grouped = groupByWeek(items);
  renderList(grouped);
  const counts = renderTotals(items);
  renderChart(counts);
})();
