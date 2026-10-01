# HeartBeatCat 示例插件

包含桌面组件（`widget/`）和推流页面（`streaming/`）。运行 `pnpm build` 后，产物位于 `dist/hrcat-widget-example/`，可安装的压缩包位于 `dist/hrcat-widget-example_0.0.3.hrcp`。

推流页面建议在 OBS 浏览器源中使用 **560 × 320** 视口。页面显示实时心率、近 30 秒趋势、均值与本次峰值；没有新数据时会显示等待状态，避免把旧数值误当作实时心率。插件设置可调整配色、显示单位、最大心率，以及趋势图和统计信息的可见性。设置变更会在已打开的推流页面中自动更新。

## 图片与其他公开资源

每个页面的 `public/` 文件会复制到该页面的构建目录。插件页面通过 `/p/hrcat-widget-example/widget/` 或 `/p/hrcat-widget-example/streaming/` 提供，因此组件中的公开资源应使用 Vite 的部署前缀：

```ts
const imageUrl = `${import.meta.env.BASE_URL}favicon_256.ico`
```

HTML 中使用 `%BASE_URL%favicon_256.ico`。不要写 `/favicon_256.ico`，它会请求服务器根目录，而不是插件目录。

`hrcat.config.ts` 中的 `icon` 是插件清单图标。构建时会从 `widget/public/`、`streaming/public/` 或根目录 `public/` 查找并复制到插件包根目录；配置了不存在的图标会使构建失败。
