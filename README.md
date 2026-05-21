# Lingling He · 个人学术网站

Static personal academic CV — plain HTML / CSS / JavaScript，无构建步骤。

## 在线访问

部署到 GitHub Pages 后：`https://<你的GitHub用户名>.github.io/<仓库名>/`

## 本地预览

直接双击 `index.html` 即可（数据已内联到 `js/data.js`，不需要服务器）。

如果想用本地服务器：

```bash
python3 -m http.server 8080
```

然后访问 <http://localhost:8080>。

## 修改内容

CV 数据存在两个文件里，需要保持同步：

- `content.json` — 可读的源数据
- `js/data.js` — 把同样的数据包成 `window.CV_DATA = ...;`，让 `file://` 直接打开也能用

修改 `content.json` 后，重新生成 `js/data.js`：

```bash
python3 -c "import json; d=json.load(open('content.json')); open('js/data.js','w').write('window.CV_DATA = '+json.dumps(d, ensure_ascii=False, indent=2)+';\n')"
```

## 换照片

把 `images/lingling.jpg` 替换成新照片（方形裁剪效果最好，建议 600×600 px 或更大）。

## 文件结构

```
site/
├── index.html        # 页面骨架
├── content.json      # CV 数据源
├── css/style.css     # 样式
├── js/
│   ├── app.js        # 渲染逻辑
│   └── data.js       # 由 content.json 生成
└── images/
    └── lingling.jpg  # 头像
```

## 部署到 GitHub Pages

1. 在 GitHub 创建一个新的 public 仓库
2. 把这个文件夹的内容推到该仓库
3. 仓库 Settings → Pages → Source 选 `main` 分支、根目录 `/`
4. 等 1 分钟左右，网址就生效了
