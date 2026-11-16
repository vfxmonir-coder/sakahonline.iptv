const SOURCES = {
  sports: ["https://iptv-org.github.io/iptv/categories/sports.m3u"],
  drama: ["https://iptv-org.github.io/iptv/categories/series.m3u","https://iptv-org.github.io/iptv/categories/entertainment.m3u"],
  news: ["https://iptv-org.github.io/iptv/categories/news.m3u"],
  movies: ["https://iptv-org.github.io/iptv/categories/movies.m3u"]
};
const FALLBACK = "https://iptv-org.github.io/iptv/index.m3u";
const $ = s => document.querySelector(s);
const video = $("#video"), grid = $("#channelGrid");
let channels=[], filtered=[], activeCategory="all", query="", shown=0, hls=null, deferredInstall=null;
const PAGE_SIZE=60;
const favorites = new Set(JSON.parse(localStorage.getItem("sakah-favorites")||"[]"));
function parseM3U(text, forcedCategory){
  const lines=text.replace(/\r/g,"").split("\n"); const out=[]; let meta=null;
  for(const raw of lines){const line=raw.trim();if(!line)continue;
    if(line.startsWith("#EXTINF")){meta=line;continue}
    if(line.startsWith("#"))continue;
    if(meta){
      const name=(meta.split(",").slice(1).join(",").trim()||"Unknown channel").replace(/\s*\([^)]*(?:p|HD|SD)[^)]*\)\s*$/i,"").trim();
      const attr=k=>{const m=meta.match(new RegExp(k+'="([^"]*)"','i'));return m?m[1]:""};
      out.push({id:line,name,logo:attr("tvg-logo"),group:attr("group-title"),category:forcedCategory||attr("group-title")||"General"});
      meta=null;
    }
  }return out;
}
function dedupe(items){const seen=new Set();return items.filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return true})}
async function getPlaylist(url,cat){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return parseM3U(await r.text(),cat)}
async function loadChannels(){
  $("#status").textContent="Loading channel playlists…";
  try{
    const jobs=Object.entries(SOURCES).map(async([cat,urls])=>{const parts=await Promise.allSettled(urls.map(u=>getPlaylist(u,cat)));return parts.filter(x=>x.status==="fulfilled").flatMap(x=>x.value)});
    const results=await Promise.all(jobs); channels=dedupe(results.flat());
    if(!channels.length) throw Error("Category playlists unavailable");
    $("#status").textContent="Channel lists updated from IPTV-Org. Streams may vary by broadcaster.";
  }catch(e){
    try{channels=dedupe(await getPlaylist(FALLBACK));$("#status").textContent="Using main playlist. Some channels may not have a category label."}
    catch(err){$("#status").textContent="Could not load playlists. Check your internet connection and reload.";grid.innerHTML='<div class="empty">Playlist could not be loaded. Please try again later.</div>';return}
  }
  applyFilter();
}
function categoryOf(c){
  const g=(c.category+" "+c.group+" "+c.name).toLowerCase();
  if(/sport|football|soccer|cricket|tennis|basketball/.test(g))return "sports";
  if(/news|breaking|headline/.test(g))return "news";
  if(/movie|cinema|film/.test(g))return "movies";
  if(/series|drama|entertainment|soap|serial/.test(g))return "drama";
  return (c.category||"").toLowerCase();
}
function applyFilter(){
  filtered=channels.filter(c=>{
    const cat=categoryOf(c);
    const ok=activeCategory==="all"||(activeCategory==="favorites"?favorites.has(c.id):activeCategory==="drama"?["drama","series","entertainment"].includes(cat):cat===activeCategory);
    return ok&&c.name.toLowerCase().includes(query);
  });
  shown=0;grid.innerHTML="";renderMore();
  $("#channelCount").textContent=filtered.length.toLocaleString()+" channels";
}
function renderMore(){
  const chunk=filtered.slice(shown,shown+PAGE_SIZE);
  if(!chunk.length&&shown===0){grid.innerHTML='<div class="empty">No channels found in this category.</div>'}
  chunk.forEach(c=>{
    const b=document.createElement("button");b.className="channel"+(video.dataset.src===c.id?" selected":"");b.type="button";
    const top=document.createElement("div");top.className="channel-top";
    if(c.logo){const img=document.createElement("img");img.loading="lazy";img.src=c.logo;img.alt="";img.onerror=()=>{top.innerHTML='<span class="letter">'+escapeHTML(c.name.slice(0,1).toUpperCase())+'</span>'};top.append(img)}
    else top.innerHTML='<span class="letter">'+escapeHTML(c.name.slice(0,1).toUpperCase())+'</span>';
    const n=document.createElement("div");n.className="channel-name";n.textContent=c.name;
    const m=document.createElement("div");m.className="channel-meta";
    const group=document.createElement("span");group.textContent=c.group||c.category||"Live";
    const f=document.createElement("span");f.className="fav";f.textContent=favorites.has(c.id)?"♥":"♡";
    m.append(group,f);b.append(top,n,m);b.addEventListener("click",()=>play(c));b.addEventListener("contextmenu",e=>{e.preventDefault();toggleFav(c)});
    b.title="Tap to play • Long-press/right-click to save favourite";grid.append(b);
  });
  shown+=chunk.length;$("#moreBtn").classList.toggle("hidden",shown>=filtered.length);
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toggleFav(c){if(favorites.has(c.id))favorites.delete(c.id);else favorites.add(c.id);localStorage.setItem("sakah-favorites",JSON.stringify([...favorites]));applyFilter()}
function play(c){
  if(hls){hls.destroy();hls=null}video.pause();video.removeAttribute("src");video.load();
  $("#playingName").textContent=c.name;$("#playerMessage").classList.add("hidden");$("#status").textContent="Connecting to "+c.name+"…";
  video.dataset.src=c.id;
  if(video.canPlayType("application/vnd.apple.mpegurl")){video.src=c.id;video.play().catch(()=>{})}
  else if(window.Hls&&Hls.isSupported()){hls=new Hls({enableWorker:true,lowLatencyMode:true});hls.loadSource(c.id);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));hls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal)$("#status").textContent="This stream is unavailable or unsupported. Try another channel."})}
  else {video.src=c.id;video.play().catch(()=>{$("#status").textContent="This browser cannot play this stream format."})}
  video.onerror=()=>{$("#status").textContent="Playback failed. The broadcaster may be offline or block browser playback."};
  video.onplaying=()=>{$("#status").textContent="Now playing • "+c.name};
  document.querySelector(".player-wrap").scrollIntoView({behavior:"smooth",block:"start"});
}
$("#categories").addEventListener("click",e=>{const b=e.target.closest("button[data-category]");if(!b)return;activeCategory=b.dataset.category;document.querySelectorAll(".cat").forEach(x=>x.classList.toggle("active",x===b));applyFilter()});
$("#search").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();applyFilter()});
$("#moreBtn").addEventListener("click",renderMore);
$("#fullBtn").addEventListener("click",()=>{const el=$("#videoBox");if(el.requestFullscreen)el.requestFullscreen();else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen()});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBtn").classList.add("hidden")});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
loadChannels();