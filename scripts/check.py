#!/usr/bin/env python3
"""Dependency-free checks for the distributable Shot Atlas tree."""
from pathlib import Path
import json,re,zipfile,io,hashlib
ROOT=Path(__file__).resolve().parents[1]
text=(ROOT/'catalog.js').read_text()
shots=json.loads(text.split('=',1)[1].strip().removesuffix(';'))
assert len(shots)==24 and len({s['id'] for s in shots})==24
required=('id','title','title_zh','title_en','category','definition','prompt_zh','prompt_en','keywords_en','source_urls')
for s in shots:
 assert all(s.get(k) for k in required),(s.get('id'),'missing field')
 assert 'notion_url' not in s
 assert all(u.startswith('https://') for u in s['source_urls'])
 assert (ROOT/'assets/diagrams'/f"{s['number']:02}.svg").is_file()
ids=['dolly-in','dolly-out','pan','truck','orbit','crane-reveal','zoom']
for ident in ids:
 for ext in ('mp4','jpg'):
  assert (ROOT/'assets/motion'/f'{ident}.{ext}').is_file()
 assert (ROOT/'blender'/f'{ident}.blend').is_file()
# Never publish private account routes, workspace IDs, signed credentials or host paths.
forbidden=[b'app.notion.com',b'notion.so/',b'notion.site/',b'appgprj_',b'file-upload://',b'X-Amz-',b'/workspace/',b'/home/agent',b'BEGIN PRIVATE KEY',b'BEGIN OPENSSH PRIVATE KEY']
def inspect(name,data):
 for p in forbidden:
  assert p.lower() not in data.lower(),f'private marker in {name}: {p!r}'
 if name.endswith('.zip'):
  with zipfile.ZipFile(io.BytesIO(data)) as z:
   for n in z.namelist():inspect(name+'!'+n,z.read(n))
for f in ROOT.rglob('*'):
 if not f.is_file() or '.git' in f.parts or f==Path(__file__):continue
 assert '.openai' not in f.parts and f.name not in ('.env',),f
 inspect(str(f.relative_to(ROOT)),f.read_bytes())
print('PASS: 24 unique shots, 24 diagrams, 7 videos/posters/Blender sources; public export scan clean.')
