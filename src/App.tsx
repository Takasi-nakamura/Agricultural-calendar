import {useEffect,useMemo,useState} from 'react';
import {CalendarDays,Check,ChevronLeft,ChevronRight,List,MapPin,Plus,Settings,Sun,CloudRain,CloudSun,Trash2,X} from 'lucide-react';

type Todo={id:number;date:string;text:string;done:boolean};
type Weather={date:string;max:number;min:number;rain:number;code:number};
type LongWeather={date:string;temp:number;rain:number;et0:number;soil:number};

const pad=(n:number)=>String(n).padStart(2,'0');
const key=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const weatherIcon=(code:number)=>code===0||code===1?<Sun size={18}/>:code<=3?<CloudSun size={18}/>:<CloudRain size={18}/>;

// 日本の祝日（祝日法に基づく主要な固定・移動祝日）
const nthMonday=(year:number,month:number,n:number)=>{const d=new Date(year,month-1,1);return new Date(year,month-1,1+((8-d.getDay())%7)+7*(n-1))};
const vernalEquinox=(year:number)=>new Date(year,2,Math.floor(20.8431+0.242194*(year-1980)-Math.floor((year-1980)/4)));
const autumnEquinox=(year:number)=>new Date(year,8,Math.floor(23.2488+0.242194*(year-1980)-Math.floor((year-1980)/4)));
const holidayMap=(year:number)=>{
 const h=new Map<string,string>();
 const add=(d:Date,name:string)=>h.set(key(d),name);
 add(new Date(year,0,1),'元日'); add(nthMonday(year,1,2),'成人の日');
 if(year>=2020)add(new Date(year,1,23),'天皇誕生日'); else if(year>=1989)add(new Date(year,11,23),'天皇誕生日');
 add(vernalEquinox(year),'春分の日'); add(new Date(year,3,29),'昭和の日'); add(new Date(year,4,3),'憲法記念日'); add(new Date(year,4,4),'みどりの日'); add(new Date(year,4,5),'こどもの日');
 add(nthMonday(year,7,3),'海の日'); add(new Date(year,7,11),'山の日'); add(nthMonday(year,9,3),'敬老の日'); add(autumnEquinox(year),'秋分の日'); add(nthMonday(year,10,2),'スポーツの日'); add(new Date(year,10,3),'文化の日'); add(new Date(year,10,23),'勤労感謝の日');
 if(year===2020){h.delete(key(new Date(year,6,20))); add(new Date(year,6,23),'海の日'); add(new Date(year,6,24),'スポーツの日');}
 if(year===2021){h.delete(key(new Date(year,6,19))); add(new Date(year,6,22),'海の日'); add(new Date(year,6,23),'スポーツの日');}
 // 日曜に重なる祝日は、直後の平日へ振替。祝日に挟まれた平日は休日。
 const base=new Set(h.keys());
 for(const [date,name] of [...h]){
   const d=new Date(date+'T00:00:00');
   if(d.getDay()===0){let x=new Date(d); do{x.setDate(x.getDate()+1)}while(base.has(key(x))); h.set(key(x),'振替休日');}
 }
 for(let d=1;d<=366;d++){
   const date=new Date(year,0,d); if(date.getFullYear()!==year)break;
   if(h.has(key(date)))continue;
   const prev=new Date(date); prev.setDate(prev.getDate()-1); const next=new Date(date); next.setDate(next.getDate()+1);
   if(h.has(key(prev))&&h.has(key(next)))h.set(key(date),'国民の休日');
 }
 return h;
};
const dayFacts:Record<string,string>={
 '01-05':'いちごの日','01-10':'110番の日','01-17':'防災とボランティアの日','02-02':'ツインテールの日','02-06':'海苔の日','02-22':'猫の日','03-03':'ひな祭り','03-08':'国際女性デー','03-10':'砂糖の日','03-11':'防災意識を考える日','04-04':'あんぱんの日','04-15':'いちご大福の日','05-05':'端午の節句','05-10':'コットンの日','05-12':'看護の日','06-04':'虫の日','06-06':'梅の日','06-21':'夏至','07-07':'七夕','07-10':'納豆の日','08-08':'そろばんの日','08-31':'野菜の日','09-09':'重陽の節句','09-10':'下水道の日','09-21':'国際平和デー','10-10':'目の愛護デー','10-15':'きのこの日','11-01':'紅茶の日','11-11':'介護の日','11-22':'いい夫婦の日','12-03':'カレンダーの日','12-22':'冬至'
};
const weatherClass=(code:number)=>code===0?'sunny':code<=3?'cloudy':code<=67||code>=80?'rainy':'stormy';


function App(){
 const now=new Date(); const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));
 const [selected,setSelected]=useState(key(now)); const [view,setView]=useState<'calendar'|'list'>('calendar');
 const [todos,setTodos]=useState<Todo[]>(()=>{try{const v=JSON.parse(localStorage.getItem('agri-todos')||'[]');return Array.isArray(v)?v:[]}catch{return[]}});
 const saved=(()=>{try{return JSON.parse(localStorage.getItem('agri-settings')||'null')}catch{return null}})();
 const [weather,setWeather]=useState<Weather[]>([]); const [longWeather,setLongWeather]=useState<LongWeather[]>([]); const [place,setPlace]=useState(saved?.place||'宇都宮市');
 const [lat,setLat]=useState(Number(saved?.lat)||36.5658); const [lon,setLon]=useState(Number(saved?.lon)||139.8836); const [loading,setLoading]=useState(false);
 const [adding,setAdding]=useState(false); const [settingsOpen,setSettingsOpen]=useState(false); const [searchPlace,setSearchPlace]=useState(saved?.place||'宇都宮市'); const [savingPlace,setSavingPlace]=useState(false); const [text,setText]=useState('');

 useEffect(()=>localStorage.setItem('agri-todos',JSON.stringify(todos)),[todos]);
 useEffect(()=>localStorage.setItem('agri-settings',JSON.stringify({place,lat,lon})),[place,lat,lon]);
 useEffect(()=>{setLoading(true); const shortUrl=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16`; const longUrl=`https://seasonal-api.open-meteo.com/v1/seasonal?latitude=${lat}&longitude=${lon}&daily=temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration,soil_temperature_0_to_7cm_mean&models=ec46&timezone=Asia%2FTokyo&forecast_days=28`; Promise.all([fetch(shortUrl).then(r=>r.json()),fetch(longUrl).then(r=>r.json())]).then(([d,l])=>{setWeather((d.daily?.time||[]).map((date:string,i:number)=>({date,max:Math.round(d.daily.temperature_2m_max[i]),min:Math.round(d.daily.temperature_2m_min[i]),rain:d.daily.precipitation_probability_max?.[i]??0,code:d.daily.weather_code[i]}))); setLongWeather((l.daily?.time||[]).slice(16,28).map((date:string,i:number)=>({date,temp:Math.round(l.daily.temperature_2m_mean[i+16]),rain:Number(l.daily.precipitation_sum?.[i+16]||0),et0:Number(l.daily.et0_fao_evapotranspiration?.[i+16]||0),soil:Number(l.daily.soil_temperature_0_to_7cm_mean?.[i+16]||0)})))}).catch(()=>{setWeather([]);setLongWeather([])}).finally(()=>setLoading(false));},[lat,lon]);
 const days=useMemo(()=>{const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate();return [...Array(start).fill(null),...Array.from({length:n},(_,i)=>new Date(y,m,i+1))]},[month]);
 const selectedTodos=todos.filter(t=>t.date===selected); const holidays=useMemo(()=>holidayMap(month.getFullYear()),[month]);
 const selectedHoliday=holidays.get(selected); const selectedFact=dayFacts[selected.slice(5)];
 const monthTodos=todos.filter(t=>t.date.startsWith(`${month.getFullYear()}-${pad(month.getMonth()+1)}`));
 const move=(n:number)=>setMonth(new Date(month.getFullYear(),month.getMonth()+n,1));
 const add=()=>{if(!text.trim())return;setTodos([...todos,{id:Date.now(),date:selected,text:text.trim(),done:false}]);setText('');setAdding(false)};
 const toggle=(id:number)=>setTodos(todos.map(t=>t.id===id?{...t,done:!t.done}:t));
 const remove=(id:number)=>setTodos(todos.filter(t=>t.id!==id));
 const weatherFor=(d:string)=>weather.find(w=>w.date===d); const longFor=(d:string)=>longWeather.find(w=>w.date===d);
 const monthName=month.toLocaleDateString('ja-JP',{year:'numeric',month:'long'});
 return <main>
  <header><div className="brand"><div className="logo">🌱</div><div><h1>農業カレンダー</h1><p>天気と農作業をひとつに</p></div></div><div className="place"><MapPin size={17}/>{place}<button onClick={()=>{setSearchPlace(place);setSettingsOpen(true)}} aria-label="設定"><Settings size={18}/></button></div></header>
  <section className="toolbar"><div className="nav"><button onClick={()=>move(-1)}><ChevronLeft/></button><strong>{monthName}</strong><button onClick={()=>move(1)}><ChevronRight/></button></div><div className="switch"><button className={view==='calendar'?'active':''} onClick={()=>setView('calendar')}><CalendarDays size={17}/>カレンダー</button><button className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={17}/>リスト</button></div></section>
  {view==='calendar'?<section className="calendar"><div className="week">{['月','火','水','木','金','土','日'].map(x=><div key={x}>{x}</div>)}</div><div className="grid">{days.map((d,i)=>d?<button className={`day ${key(d)===selected?'selected':''} ${key(d)===key(now)?'today':''} ${holidays.has(key(d))?'holiday':''}`} key={i} onClick={()=>setSelected(key(d))}><span>{d.getDate()}</span>{key(d)===key(now)&&<small className="today-badge">今日</small>}{holidays.get(key(d))&&<small className="holiday-name">{holidays.get(key(d))}</small>}{dayFacts[`${pad(d.getMonth()+1)}-${pad(d.getDate())}`]&&<small className="fact-name">{dayFacts[`${pad(d.getMonth()+1)}-${pad(d.getDate())}`]}</small>}{weatherFor(key(d))&&<div className={`weather ${weatherClass(weatherFor(key(d))!.code)}`}>{weatherIcon(weatherFor(key(d))!.code)}<b>{weatherFor(key(d))!.max}°</b><small>{weatherFor(key(d))!.rain}%</small></div>}{longFor(key(d))&&<div className="weather"><b>長期</b><small>{longFor(key(d))!.temp}°</small></div>}{todos.filter(t=>t.date===key(d)).length>0&&<i>{todos.filter(t=>t.date===key(d)).length}件</i>}</button>:<div key={i} className="empty"/>)}</div></section>:<section className="list">{monthTodos.length===0?<div className="no-data">この月の予定はありません</div>:monthTodos.sort((a,b)=>a.date.localeCompare(b.date)).map(t=><div className="todo-row" key={t.id}><button className={t.done?'check done':'check'} onClick={()=>toggle(t.id)}>{t.done&&<Check size={15}/>}</button><div><b>{new Date(t.date+'T00:00:00').toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',weekday:'short'})}</b><p className={t.done?'strike':''}>{t.text}</p></div><button className="icon" onClick={()=>remove(t.id)}><Trash2 size={16}/></button></div>)}</section>}
  <section className="detail"><div className="detail-head"><div><span>選択日</span><h2>{new Date(selected+'T00:00:00').toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long'})}</h2>{selectedHoliday&&<div className="holiday-detail">🎌 {selectedHoliday}</div>}{selectedFact&&<div className="fact-detail">今日は「{selectedFact}」</div>}</div>{weatherFor(selected)?<div className={`forecast ${weatherClass(weatherFor(selected)!.code)}`}>{weatherIcon(weatherFor(selected)!.code)}<strong>{weatherFor(selected)!.max}°</strong><span>降水 {weatherFor(selected)!.rain}%</span></div>:longFor(selected)?<div className="forecast"><strong>長期予測</strong><span>平均 {longFor(selected)!.temp}°</span></div>:null}</div><div className="todos">{longFor(selected)&&<div className="long-card"><b>17〜28日 長期予測（参考）</b><p>平均気温 {longFor(selected)!.temp}℃ ・ 降水量 {longFor(selected)!.rain.toFixed(1)}mm</p><small>広域モデルによる参考値です。日々の局地的な天気を保証するものではありません。</small></div>}{selectedTodos.length===0?<p className="muted">予定はありません</p>:selectedTodos.map(t=><div className="todo-row" key={t.id}><button className={t.done?'check done':'check'} onClick={()=>toggle(t.id)}>{t.done&&<Check size={15}/>}</button><p className={t.done?'strike':''}>{t.text}</p><button className="icon" onClick={()=>remove(t.id)}><Trash2 size={16}/></button></div>)}</div><button className="add" onClick={()=>setAdding(true)}><Plus size={19}/>この日に作業を追加</button></section>
  <footer>{loading?'天気を更新中…':<>天気データはOpen-Meteoから取得 · 詳細予報16日＋長期予測28日</>}<span>最終更新 {new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</span></footer>
  {settingsOpen&&<div className="modal-bg" onClick={()=>setSettingsOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSettingsOpen(false)}><X/></button><h2>場所の設定</h2><p>市区町村名を入力してください。</p><input autoFocus value={searchPlace} onChange={e=>setSearchPlace(e.target.value)} placeholder="例：宇都宮市"/><button className="save" disabled={savingPlace} onClick={async()=>{if(!searchPlace.trim())return;setSavingPlace(true);try{const u='https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(searchPlace.trim())+'&count=1&language=ja&format=json';const r=await fetch(u);const d=await r.json();const g=d.results?.[0];if(g){setPlace(g.name+(g.admin1?' '+g.admin1:''));setLat(g.latitude);setLon(g.longitude);setSettingsOpen(false)}}catch{}finally{setSavingPlace(false)}}}>{savingPlace?'検索中…':'この場所を使う'}</button></div></div>}
  {adding&&<div className="modal-bg" onClick={()=>setAdding(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAdding(false)}><X/></button><h2>作業を追加</h2><p>{selected}</p><input autoFocus value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="例：トマトに水やり"/><button className="save" onClick={add}>追加する</button></div></div>}
 </main>
}
export default App;