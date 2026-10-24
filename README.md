# Shot Atlas · 镜头实验室

一个以画面理解摄影机语言的轻量学习网站：24 种镜头表达、7 段真实 Blender 运镜模拟，以及可修改的中英提示词。

## 使用

无需构建、数据库或账户配置。用本地静态服务器打开：

```sh
python -m http.server 8000
```

访问 `http://localhost:8000`。也可把根目录部署到任意静态托管服务。

## 内容

- 景别、机位、运镜、焦点/复合控制、转场共 24 条。
- 7 段 Blender 模拟：推镜、拉镜、水平摇镜、横移、环绕、升起揭示、变焦。
- 中英提示词、常见混淆、参考资料、搜索和分类筛选。
- 原创示意图、真实模拟片段和可复现 Blender 工程。

模拟原片为 **640×360 / 12 fps / 3 秒**，由 Blender 4.3.2 Workbench 实际渲染。Workbench 使用摄影棚照明；场景中保留的区域灯供 Eevee/Cycles 重渲染，不参与当前视频照明。

**Blender 几何模拟不等于 AI 视频实测。** 提示词是创作起点，不是跨模型通用的秘密触发词。复杂转场优先分别生成素材，再通过剪辑连接。图示、模拟场景与提示词示例场景可能不同，目的均为说明镜头语言。

## 目录

- `index.html`、`style.css`、`app.js`：无依赖前端。
- `catalog.js`：24 条研究整理的内容。
- `assets/diagrams/`：原创教学 SVG。
- `assets/motion/`：真实 Blender MP4 与海报。
- `assets/blender-sources.zip`：7 个 `.blend` 工程和复现脚本。
- `blender/`：可复现的源文件与技术说明。
- `scripts/check.py`：内容、资源和公开导出安全检查。
- `PUBLIC_EXPORT_MANIFEST.json`：交付文件 SHA-256 清单。

## 检查

```sh
python scripts/check.py
node --check app.js
node --check catalog.js
node tests/ui-behavior.test.cjs .
```

## 复现渲染

安装 Blender 4.3.2 与 FFmpeg 后，在 `blender/` 中执行 `bash render_all.sh`。可用 `BLENDER=/path/to/blender` 指定 Blender。默认生成 7 段片段，速度取决于设备。

## 来源与边界

资料支持范围和原始链接见 [来源说明](docs/SOURCES.md)，各镜头亦附对应链接。外部资料只保留链接及自行整理的说明，不复制其电影截图或视频。原始版本资料核验日期为 2026-10-24。

本导出不含个人 Notion 页面、账户凭据、私有站点配置或用户聊天。公开仓库和原有私有部署的访问范围相互独立。
