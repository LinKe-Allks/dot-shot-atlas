import bpy, math, os, json, sys
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene
sc.render.engine='BLENDER_WORKBENCH'
sc.render.resolution_x=640; sc.render.resolution_y=360; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.fps=12
sc.render.film_transparent=False
sh=sc.display.shading
sh.light='STUDIO'; sh.studio_light='paint.sl'; sh.color_type='MATERIAL'; sh.show_shadows=True; sh.show_cavity=True; sh.cavity_type='BOTH'; sh.curvature_ridge_factor=1.4; sh.curvature_valley_factor=1.1
sh.background_type='WORLD'; sc.world.color=(0.025,0.045,0.052)
sh.show_specular_highlight=True; sh.show_object_outline=False
sc.display.render_aa='8'
sc.view_settings.view_transform='Standard'
def mat(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);return m
teal=mat('Midnight teal',(0.035,.12,.15)); copper=mat('Burnished copper',(0.85,.29,.105)); gold=mat('Warm ochre',(0.95,.64,.24)); pale=mat('Ivory concrete',(.62,.71,.67)); dark=mat('Dark plinth',(.045,.08,.09))
def cube(name,loc,scale,material,bevel=.12):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:
  mod=o.modifiers.new('Soft architectural edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
cube('Studio floor',(0,2,-.25),(30,34,.5),teal)
cube('Sculpture plinth',(0,0,.5),(2.25,2.25,1),dark)
bpy.ops.mesh.primitive_torus_add(major_radius=1.13,minor_radius=.28,major_segments=64,minor_segments=16,location=(0,0,2.25),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='Copper orbital sculpture';o.data.materials.append(copper)
for p in o.data.polygons:p.use_smooth=True
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=.47,location=(0,0,2.25));o=bpy.context.object;o.name='Golden core';o.data.materials.append(gold)
for p in o.data.polygons:p.use_smooth=True
for i,(x,y,h) in enumerate([(-4,4,4),(0,5,5),(4,4,4.5),(-6,7,5),(6,7,5),(-3,-3,2.7),(3,-2.7,1.8)]):
 cube('Depth column %02d'%i,(x,y,h/2),(.65,.65,h),pale if i<5 else copper)
for x in range(-12,13,2):cube('Floor longitudinal inlay',(x,1,.015),(.025,25,.025),pale,0)
for y in range(-10,15,2):cube('Floor cross inlay',(0,y,.017),(25,.025,.025),pale,0)
# Lamps are retained for downstream physically lit Eevee/Cycles rerenders.
for name,loc,power,color,size in [('Warm key',(-4,-6,9),1800,(1,.7,.43),5),('Cool rim',(4,4,7),2200,(.3,.7,1),4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.8))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7,-13,6));cam=bpy.context.object;sc.camera=cam;cam.data.lens=42;cam.data.clip_end=100
N=36;sc.frame_start=1;sc.frame_end=N
specs={
 'dolly-in':{'start':(0,-16,4.8),'end':(0,-8,3.2),'target':(0,0,2),'lens':42,'note':'Camera translates forward from 16 m to 8 m; fixed 42 mm focal length. Perspective and foreground parallax change.'},
 'dolly-out':{'start':(0,-8,3.2),'end':(0,-16,4.8),'target':(0,0,2),'lens':42,'note':'Camera translates backward from 8 m to 16 m; fixed 42 mm focal length. Expands spatial context with parallax.'},
 'pan':{'start':(0,-12,4),'end':(0,-12,4),'target':(0,0,2),'lens':42,'note':'Camera position is stationary; yaw rotates from -12 to +12 degrees. No translational parallax.'},
 'truck':{'start':(-3.5,-12,4),'end':(3.5,-12,4),'target':(0,0,2),'lens':38,'note':'Camera translates laterally 7 m with constant orientation and fixed 38 mm lens. Clear foreground/background parallax.'},
 'orbit':{'start':(0,-12,4.6),'end':(0,-12,4.6),'target':(0,0,2),'lens':42,'note':'Camera travels on a 12 m radius arc, from -42 to +42 degrees, continually aiming at the subject.'},
 'crane-reveal':{'start':(0,-12,1.1),'end':(0,-12,9),'target':(0,0,2),'lens':42,'note':'Camera rises vertically 7.9 m at fixed horizontal position, tilting to keep the subject in frame; higher viewpoint reveals floor and depth.'},
 'zoom':{'start':(0,-14,4),'end':(0,-14,4),'target':(0,0,2),'lens':42,'note':'Camera position and orientation are stationary; focal length increases from 28 mm to 65 mm. Framing changes without perspective change.'}}
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(specs)
manifest=[]
for ident in selected:
 s=specs[ident];folder=os.path.join(ROOT,ident);os.makedirs(folder,exist_ok=True)
 cam.animation_data_clear();cam.data.animation_data_clear()
 start=Vector(s['start']);end=Vector(s['end']);target=Vector(s['target'])
 for f in range(1,N+1):
  t=(f-1)/(N-1);u=t*t*(3-2*t);cam.location=start.lerp(end,u);cam.data.lens=s['lens']
  if ident=='orbit':
   a=math.radians(-42+84*u);cam.location=(12*math.sin(a),-12*math.cos(a),4.6)
  cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
  if ident=='truck':cam.rotation_euler=(target-Vector((0,-12,4))).to_track_quat('-Z','Y').to_euler()
  if ident=='pan':cam.rotation_euler.z+=math.radians(-12+24*u)
  if ident=='zoom':cam.data.lens=28+37*u
  cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f);cam.data.keyframe_insert('lens',frame=f)
 for data in [cam,cam.data]:
  for curve in data.animation_data.action.fcurves:
   for point in curve.keyframe_points:point.interpolation='LINEAR'
 sc.frame_set(18);sc.render.filepath='//'+ident+'/frame_'
 for screen in bpy.data.screens:
  for area in screen.areas:
   for space in area.spaces:
    if space.type=='FILE_BROWSER' and space.params:
     space.params.directory=b'//';space.params.filename=''
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,ident+'.blend'))
 # sample-only option provided via environment variable
 if os.getenv('SAMPLE_ONLY'):
  sc.render.filepath=os.path.join(folder,'sample.png');bpy.ops.render.render(write_still=True);break
 bpy.ops.render.render(animation=True)
 manifest.append({'id':ident,'video':ident+'.mp4','poster':ident+'.png','blend':ident+'.blend','frames':N,'fps':12,'duration_seconds':3,'width':640,'height':360,'technical_notes':s['note'],'renderer':'Blender Workbench, studio lighting / material color / cavity and shadows','blender_version':bpy.app.version_string})
 with open(os.path.join(ROOT,'manifest-'+ident+'.json'),'w') as h:json.dump(manifest[-1],h,indent=2)
