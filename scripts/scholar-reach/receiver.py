# Local relay + writer for scripts/scholar-reach/browser-crawl.js. Usage: python3 receiver.py data/scholar-reach/raw
import http.server, json, os, sys, re, datetime
OUT = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); body = json.loads(self.rfile.read(n))
        name = re.sub(r'[^A-Za-z0-9_.-]', '_', body.get('name', 'x'))
        with open(os.path.join(OUT, name + '.json'), 'w') as f: json.dump(body, f, ensure_ascii=False, indent=1)
        print(datetime.datetime.now().strftime('%H:%M:%S'), body.get('kind'), name, body.get('msg', ''), len(body.get('results', [])), flush=True)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'ok')
    def do_GET(self):
        self.send_response(200); self.send_header('Content-Type','text/html'); self.end_headers()
        self.wfile.write(b"""<!doctype html><title>relay</title><body>relay <span id=c>0</span><script>
let c=0; window.addEventListener('message', async e => { if (e.origin !== 'https://scholar.google.com') return;
 try { const t = await fetch('/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(e.data.body)}).then(r=>r.text());
 document.getElementById('c').textContent=++c; e.source.postMessage({ack:e.data.id, ok:t}, e.origin);} catch(err){ e.source.postMessage({ack:e.data.id, err:String(err)}, e.origin);} });
if (window.opener) window.opener.postMessage({relayReady:true}, 'https://scholar.google.com');
</script>""")
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
