import {useEffect,useMemo,useState} from 'react';
import {CalendarDays,Check,ChevronLeft,ChevronRight,List,MapPin,Plus,Settings,Sun,CloudRain,CloudSun,Trash2,X} from 'lucide-react';

type Todo={id:number;date:string;text:string;done:boolean};
type Weather={date:string;max:number;min:number;rain:number;code:number};

const pad=(n:number)=>String(n).padStart(2,'0');
const key=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const weatherIcon=(code:number)=>code===0||code===1?<Sun size={18}/>:code<=3?<CloudSun size={18}/>:<CloudRain size={18}/>;

function App(){
 const now=new Date(); const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));
 const [selected,setSelected]=useState(key(now)); const [view,setView]=useState<'calendar'|'list'>('calendar');
 const [todos,setTodos]=useState<Todo[]>(()=>JSON.parse(localStorage.getItem('agri-todos')||'[]'));
 const [weather,setWeather]=useState<Weather[]>([]); const [place,setPlace]=useState('宇都宮市');
 const [lat,setLat]=useState(36.5658); const [lon,setLon]=useState(139.8836); const [loading,setLoading]=useState(false);
 const [adding,setAdding]=useState(false); const [text,setText]=useState('');

 useEffect(()=>localStorage.setItem('agri-todos',JSON.stringify(todos)),[todos]);
 useEffect(()=>{setLoading(true); fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16`).then(r=>r.json()).then(d=>setWeather((d.daily?.time||[]).map((date:string,i:number)=>({date,max:Math.round(d.daily.temperature_2m_max[i]),min:Math.round(d.daily.temperature_2m_min[i]),rain:d.daily.precipitation_probability_max?.[i]??0,code:d.daily.weather_code[i]})))).catch(()=>setWeather([])).finally(()=>setLoading(false));},[lat,lon]);
 const days=useMemo(()=>{const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate();return [...Array(start).fill(null),...Array.from({length:n},(_,i)=>new Date(y,m,i+1))]},[month]);
 const selectedTodos=todos.filter(t=>t.date===selected);
 const monthTodos=todos.filter(t=>t.date.startsWith(`${month.getFullYear()}-${pad(month.getMonth()+1)}`));
 const move=(n:number)=>setMonth(new Date(month.getFullYear(),month.getMonth()+n,1));
 const add=()=>{if(!text.trim())return;setTodos([...todos,{id:Date.now(),date:selected,text:text.trim(),done:false}]);setText('');setAdding(false)};
 const toggle=(id:number)=>setTodos(todos.map(t=>t.id===id?{...t,done:!t.done}:t));
 const remove=(id:number)=>setTodos(todos.filter(t=>t.id!==id));
 const weatherFor=(d:string)=>weather.find(w=>w.date===d);
 const monthName=month.toLocaleDateString('ja-JP',{year:'numeric',month:'long'});
 return <main>
  <header><div className="brand"><div className="logo">🌱</div><div><h1>農業カレンダー</h1><p>天気と農作業をひとつに</p></div></div><div className="place"><MapPin size={17}/>{place}<button><Settings size={18}/></button></div></header>
  <section className="toolbar"><div className="nav"><button onClick={()=>move(-1)}><ChevronLeft/></button><strong>{monthName}</strong><button onClick={()=>move(1)}><ChevronRight/></button></div><div className="switch"><button className={view==='calendar'?'active':''} onClick={()=>setView('calendar')}><CalendarDays size={17}/>カレンダー</button><button className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={17}/>リスト</button></div></section>
  {view==='calendar'?<section className="calendar"><div className="week">{['月','火','水','木','金','土','日'].map(x=><div key={x}>{x}</div>)}</div><div className="grid">{days.map((d,i)=>d?<button className={`day ${key(d)===selected?'selected':''} ${key(d)===key(now)?'today':''}`} key={i} onClick={()=>setSelected(key(d))}><span>{d.getDate()}</span>{weatherFor(key(d))&&<div className="weather">{weatherIcon(weatherFor(key(d))!.code)}<b>{weatherFor(key(d))!.max}°</b><small>{weatherFor(key(d))!.rain}%</small></div>}{todos.filter(t=>t.date===key(d)).length>0&&<i>{todos.filter(t=>t.date===key(d)).length}件</i>}</button>:<div key={i} className="empty"/>)}</div></section>:<section className="list">{monthTodos.length===0?<div className="no-data">この月の予定はありません</div>:monthTodos.sort((a,b)=>a.date.localeCompare(b.date)).map(t=><div className="todo-row" key={t.id}><button className={t.done?'check done':'check'} onClick={()=>toggle(t.id)}>{t.done&&<Check size={15}/>}</button><div><b>{new Date(t.date+'T00:00:00').toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',weekday:'short'})}</b><p className={t.done?'strike':''}>{t.text}</p></div><button className="icon" onClick={()=>remove(t.id)}><Trash2 size={16}/></button></div>)}</section>}
  <section className="detail"><div className="detail-head"><div><span>選択日</span><h2>{new Date(selected+'T00:00:00').toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long'})}</h2></div>{weatherFor(selected)&&<div className="forecast">{weatherIcon(weatherFor(selected)!.code)}<strong>{weatherFor(selected)!.max}°</strong><span>降水 {weatherFor(selected)!.rain}%</span></div>}</div><div className="todos">{selectedTodos.length===0?<p className="muted">予定はありません</p>:selectedTodos.map(t=><div className="todo-row" key={t.id}><button className={t.done?'check done':'check'} onClick={()=>toggle(t.id)}>{t.done&&<Check size={15}/>}</button><p className={t.done?'strike':''}>{t.text}</p><button className="icon" onClick={()=>remove(t.id)}><Trash2 size={16}/></button></div>)}</div><button className="add" onClick={()=>setAdding(true)}><Plus size={19}/>この日に作業を追加</button></section>
  <footer>{loading?'天気を更新中…':<>天気データはOpen-Meteoから取得 · 現在の予報範囲：最大16日</>}<span>最終更新 {new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</span></footer>
  {adding&&<div className="modal-bg" onClick={()=>setAdding(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAdding(false)}><X/></button><h2>作業を追加</h2><p>{selected}</p><input autoFocus value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="例：トマトに水やり"/><button className="save" onClick={add}>追加する</button></div></div>}
 </main>
}
export default App;