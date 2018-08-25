# dash-rxjs-6

## 下载

请在 [release 界面](https://github.com/xinshangshangxin/dash-rxjs-6/releases) 下载

## 原理

从 [https://rxjs-dev.firebaseapp.com/](https://rxjs-dev.firebaseapp.com/) 下载 `html` 构建离线版 `rxjs:6` 文档

## 本机构建

```bash
git clone https://github.com/xinshangshangxin/dash-rxjs-6.git
cd dash-rxjs-6
# 构建镜像
docker build -t dash-rxjs:6 .
# 运行容器复制 rxjs.docset 到当前路径
docker run -w /app -v $(pwd)/rxjs.docset:/app/rxjs.docset dash-rxjs:6 sh -c "node index.js"

# 或者本机存在node 环境, 直接构建
npm i
npm run build
node dist/
# rxjs.docset 在 dist 目录下
```
