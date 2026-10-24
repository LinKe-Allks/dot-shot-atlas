#!/bin/bash
set -e
cd "$(dirname "$0")"
for id in dolly-in dolly-out pan truck orbit crane-reveal zoom; do
 "${BLENDER:-blender}" -b -t 4 --python render_camera_library.py -- "$id" > "$id.log" 2>&1
 ffmpeg -hide_banner -loglevel error -y -framerate 12 -i "$id/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart "$id.mp4"
 cp "$id/frame_0018.png" "$id.png"
 echo "READY $id"
done
"${PYTHON:-python3}" - <<'PY'
import json,glob
with open('manifest.json','w') as f:json.dump([json.load(open(p)) for p in sorted(glob.glob('manifest-*.json'))],f,indent=2)
PY
