# 追 VN：VNDB 视觉小说列表

追 VN 页面读取 [VNDB](https://vndb.org) 上的公开列表，用海报墙展示在玩、玩过、想玩、搁置和抛弃的视觉小说。数据在访客的浏览器里直接向 VNDB 官方 API 请求，不需要构建时抓取，列表更新后刷新页面即可。

## 启用

在 `config/site.yaml` 取消注释 `vndb` 段并填入用户 ID（形如 `u12345`，在 VNDB 个人页地址里）或用户名：

```yaml
vndb:
  userId: u12345
  # label: 追VN                 # 导航名称，默认使用 i18n 键 nav.vndb
  # icon: ri:gamepad-fill       # 导航图标
  # hideCoverAbove: 1.8         # 封面隐藏阈值，见下
```

注释掉整段即可关闭：页面、导航和 `/vn` 路由都会消失。修改配置后需要重启开发服务器或重新构建。账号的列表必须是公开的；标记为 `Blacklist` 的条目不会显示。

## 页面

- 顶部是状态筛选（全部 / 玩过 / 在玩 / 想玩 / 搁置 / 抛弃）、排序和你在 VNDB 上自报的游玩时长总和。
- 排序支持最近更新、添加时间、发行日期、完成日期、标题、我的评分和社区评分；没有对应数据的条目总是排在最后。
- 点击标题打开 VNDB 页面；点击封面打开详情窗口，显示大图、各语言标题、发行日期、游玩时长、开发商、发行商、语言、平台、评分、标签、外部链接和简介。窗口里的封面可以像文章图片一样放大。
- 详情在打开时才向 VNDB 请求，同一次访问内只请求一次。简介里的剧透块和剧透标签不会显示，成人向（sexual）标签也不显示。

## 封面隐藏

VNDB 用 0–2 的平均分标记封面的 `sexual` 与 `violence` 程度。任一项**大于** `hideCoverAbove`（默认 1.8）时，封面显示为占位图，图片地址不会写入页面，也不会被请求，直到访客点击「显示封面」。点开的封面可再次隐藏，刷新页面后恢复隐藏。阈值取值范围 0–2，超出范围时使用默认值。

## 已知限制

- VNDB API 只提供游玩时长的总和，不提供每部作品各自填报的时长；详情窗口里的游玩时长是社区平均值。
- 超过 2000 条列表时只读取前 2000 条（`MAX_API_PAGES` × 每页 100）。
- 标题的本地化只使用 VNDB 上的官方译名，缺失时退回原文标题。

## 代码位置

| 内容 | 位置 |
| --- | --- |
| 类型 | `src/types/vndb.ts` |
| API 客户端、排序、封面规则、描述解析 | `src/lib/vndb/` |
| 配置规范化 | `src/lib/config/vndb.ts` |
| 数据 hook | `src/hooks/useVndbData.ts`、`useVndbDetail.ts`、`useVndbShelf.ts`、`useVndbSelection.ts` |
| 组件 | `src/components/vndb/` |
| 页面 | `src/pages/vn.astro`、`src/pages/[lang]/vn.astro` |

测试：`pnpm test:vndb`。
