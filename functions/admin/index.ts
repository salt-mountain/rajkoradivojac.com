import type { Env } from '../_lib/types';
import { requireAdmin } from '../_lib/admin-auth';

// GET /admin — single-file dashboard. Gated by Cloudflare Access (and the header
// check here as a fail-closed backstop). Data comes from the /api/admin/* endpoints,
// which Access also gates; in production every fetch carries the Access session.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) {
    const cfAccess = [...request.headers.keys()].filter((k) =>
      k.toLowerCase().startsWith('cf-access'),
    );
    const email = request.headers.get('Cf-Access-Authenticated-User-Email') ?? '(absent)';
    const jwt = request.headers.get('Cf-Access-Jwt-Assertion') ? 'present' : 'absent';
    return new Response(
      'Forbidden - admin access required.\n\n' +
        'DEBUG (temporary):\n' +
        `Cf-Access-Authenticated-User-Email: ${email}\n` +
        `Cf-Access-Jwt-Assertion: ${jwt}\n` +
        `cf-access-* headers: ${cfAccess.join(', ') || '(none)'}\n`,
      { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
  return new Response(html(auth.email), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

const html = (adminEmail: string) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Subscribers — Admin</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
<div class="max-w-6xl mx-auto p-6">
  <header class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold">Subscribers</h1>
      <p class="text-sm text-slate-400">Signed in as ${adminEmail}</p>
    </div>
    <a href="/api/admin/export.csv" class="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded">Export CSV</a>
  </header>

  <div id="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6"></div>

  <div class="bg-slate-800 rounded-lg p-4 mb-6">
    <h2 class="font-semibold mb-3">Add subscriber</h2>
    <form id="add-form" class="flex flex-wrap gap-2 items-center">
      <input name="email" type="email" required placeholder="email@example.com" class="bg-slate-700 rounded px-3 py-2 text-sm flex-1 min-w-[200px]">
      <input name="name" type="text" placeholder="Name (optional)" class="bg-slate-700 rounded px-3 py-2 text-sm">
      <label class="text-xs text-slate-300 flex items-center gap-1"><input id="consent" type="checkbox" class="accent-teal-500"> They consented to email</label>
      <button class="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded" type="submit">Add</button>
      <span id="add-msg" class="text-xs"></span>
    </form>
  </div>

  <div class="flex flex-wrap gap-2 mb-3">
    <select id="status" class="bg-slate-700 rounded px-3 py-2 text-sm">
      <option value="all">All</option>
      <option value="confirmed">Confirmed</option>
      <option value="pending">Pending</option>
      <option value="unsubscribed">Unsubscribed</option>
    </select>
    <input id="search" type="text" placeholder="Search email or name…" class="bg-slate-700 rounded px-3 py-2 text-sm flex-1 min-w-[200px]">
  </div>

  <div class="bg-slate-800 rounded-lg overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-slate-700 text-slate-300 text-left">
        <tr><th class="p-3">Email</th><th class="p-3">Name</th><th class="p-3">Status</th><th class="p-3">Reqs</th><th class="p-3">Joined</th><th class="p-3"></th></tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </div>
  <div class="flex items-center justify-between mt-3 text-sm">
    <span id="count" class="text-slate-400"></span>
    <div class="flex gap-2">
      <button id="prev" class="bg-slate-700 px-3 py-1 rounded disabled:opacity-40">Prev</button>
      <button id="next" class="bg-slate-700 px-3 py-1 rounded disabled:opacity-40">Next</button>
    </div>
  </div>
</div>

<div id="detail" class="hidden fixed inset-0 bg-black/70 flex items-center justify-center p-4" onclick="if(event.target===this)this.classList.add('hidden')">
  <div class="bg-slate-800 rounded-lg max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
    <div id="detail-body"></div>
    <button onclick="document.getElementById('detail').classList.add('hidden')" class="mt-4 bg-slate-700 px-3 py-1 rounded text-sm">Close</button>
  </div>
</div>

<script>
const esc = (s) => (s==null?'':String(s)).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let page = 1;
const $ = (id) => document.getElementById(id);

function statusOf(r){ if(r.unsubscribed_at) return ['Unsubscribed','text-red-400']; if(r.confirmed_at) return ['Confirmed','text-green-400']; return ['Pending','text-amber-400']; }

async function loadStats(){
  const s = await (await fetch('/api/admin/stats')).json();
  const card = (label,val) => '<div class="bg-slate-800 rounded-lg p-3"><div class="text-xl font-bold">'+val+'</div><div class="text-xs text-slate-400">'+label+'</div></div>';
  $('stats').innerHTML = card('Total',s.total)+card('Confirmed',s.confirmed)+card('Pending',s.pending)+card('Unsubscribed',s.unsubscribed)+card('Last 30d',s.signups_30d);
}

async function load(){
  const status = $('status').value, search = encodeURIComponent($('search').value.trim());
  const data = await (await fetch('/api/admin/subscribers?status='+status+'&search='+search+'&page='+page)).json();
  $('rows').innerHTML = data.rows.map(r => {
    const [label,cls] = statusOf(r);
    return '<tr class="border-t border-slate-700">'
      + '<td class="p-3">'+esc(r.email)+'</td>'
      + '<td class="p-3">'+esc(r.name)+'</td>'
      + '<td class="p-3 '+cls+'">'+label+'</td>'
      + '<td class="p-3">'+r.request_count+'</td>'
      + '<td class="p-3 text-slate-400">'+esc((r.created_at||'').slice(0,10))+'</td>'
      + '<td class="p-3 text-right whitespace-nowrap">'
        + '<button class="text-teal-400 hover:underline mr-3" onclick="detail('+r.id+')">View</button>'
        + (r.unsubscribed_at?'':'<button class="text-amber-400 hover:underline mr-3" onclick="unsub('+r.id+')">Unsub</button>')
        + '<button class="text-red-400 hover:underline" onclick="del('+r.id+',\\''+esc(r.email)+'\\')">Delete</button>'
      + '</td></tr>';
  }).join('') || '<tr><td class="p-4 text-slate-400" colspan="6">No subscribers.</td></tr>';
  const shown = (data.page-1)*data.pageSize;
  $('count').textContent = data.total+' total';
  $('prev').disabled = data.page<=1;
  $('next').disabled = shown + data.rows.length >= data.total;
}

async function detail(id){
  const d = await (await fetch('/api/admin/subscribers/'+id)).json();
  const s = d.subscriber;
  $('detail-body').innerHTML = '<h3 class="font-bold text-lg mb-1">'+esc(s.email)+'</h3>'
    + '<p class="text-sm text-slate-400 mb-3">'+esc(s.name||'(no name)')+' · joined '+esc((s.created_at||'').slice(0,10))+'</p>'
    + '<table class="w-full text-sm"><thead class="text-slate-400 text-left"><tr><th>Book</th><th>Status</th><th>Sent</th></tr></thead><tbody>'
    + (d.requests.map(r => '<tr class="border-t border-slate-700"><td class="py-1">'+esc(r.book_slug)+'</td><td>'+esc(r.status)+'</td><td class="text-slate-400">'+esc((r.sent_at||'').slice(0,16))+'</td></tr>').join('')||'<tr><td class="py-2 text-slate-400" colspan="3">No requests.</td></tr>')
    + '</tbody></table>';
  $('detail').classList.remove('hidden');
}

async function unsub(id){ if(!confirm('Unsubscribe this person?'))return; await fetch('/api/admin/subscribers/'+id+'/unsubscribe',{method:'POST'}); load(); }
async function del(id,email){ if(!confirm('Permanently delete '+email+'? This erases their record and history.'))return; await fetch('/api/admin/subscribers/'+id,{method:'DELETE'}); load(); loadStats(); }
window.detail=detail; window.unsub=unsub; window.del=del;

$('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!$('consent').checked){ $('add-msg').textContent='Confirm consent first.'; $('add-msg').className='text-xs text-amber-400'; return; }
  const f = e.target;
  const res = await fetch('/api/admin/subscribers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,name:f.name.value})});
  if(res.ok){ f.reset(); $('consent').checked=false; $('add-msg').textContent='Added.'; $('add-msg').className='text-xs text-green-400'; load(); loadStats(); }
  else { $('add-msg').textContent='Failed (check the email).'; $('add-msg').className='text-xs text-red-400'; }
});

$('status').addEventListener('change',()=>{page=1;load();});
let t; $('search').addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{page=1;load();},300);});
$('prev').addEventListener('click',()=>{if(page>1){page--;load();}});
$('next').addEventListener('click',()=>{page++;load();});

loadStats(); load();
</script>
</body></html>`;
