# GitHub GHCR + `docker run` 部署

代码推送到 GitHub 的 `main` 或 `master` 分支后，GitHub Actions 会自动生成：

```text
ghcr.io/你的GitHub用户名/你的仓库名:latest
```

第一次生成的镜像默认可能是私有镜像。进入 GitHub 仓库的 Packages 页面，将镜像可见性改为 Public，即可免登录拉取。

## 第一次安装

```bash
docker run -d \
  --name ios-battery \
  --restart unless-stopped \
  -p 3000:3000 \
  ghcr.io/你的GitHub用户名/你的仓库名:latest
```

打开：

```text
http://你的VPS公网IP:3000
```

如果 VPS 开启了防火墙，需要放行 TCP 3000 端口。

## 更新容器

GitHub Actions 构建完成后，在 VPS 执行：

```bash
docker pull ghcr.io/你的GitHub用户名/你的仓库名:latest
docker stop ios-battery
docker rm ios-battery
docker run -d \
  --name ios-battery \
  --restart unless-stopped \
  -p 3000:3000 \
  ghcr.io/你的GitHub用户名/你的仓库名:latest
```

## 常用检查命令

```bash
docker ps
docker logs -f ios-battery
docker restart ios-battery
```

## 停止网站

```bash
docker stop ios-battery
```
