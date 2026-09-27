# 每日模型更新作业手册

自动任务每天 **08:00 Asia/Shanghai** 执行。站点定位：**展示市面上最新的 AI 模型**。

**只有 `git push` 成功才算完成** —— 改了数据没推送 = 没做。

## 三个容易踩的结构事实

### ① 产物也要提交

| | 文件 |
| --- | --- |
| 源 | `data/models/<id>.json`、`scripts/merge-scores.mjs` |
| 产物 | `data/models.json`、`data/scores.json` |

产物**已被 git 跟踪，不在 `.gitignore`**。改完源必须 `npm run data` 重新生成，源和产物一起提交。只提交源会让线上数据和源脱节。

### ② 分数住在代码里

`scripts/merge-scores.mjs` 里是硬编码数组：`rowsOld`（旧代快照）、`rowsNew`（当前代），外加从 `aa-2026-08.mjs` 导入的 `AA` / `AA_TBV21` / `ZH`、从 `hist-scores.mjs` 导入的 `rowsHist`。

**改分数 = 改 `.mjs` 代码**，这是本项目唯一的分数入口（见 README）。行格式：

```
[model_id, arena, aa, swe_verified, livecodebench, gpqa, hle, aime25, tau2, terminal, mmmu, official_source, official_url]
```

`AS_NEW` 是硬编码的快照日期常量。加新一批分数要**新增快照层（新常量 + 新数组）**，不要覆盖旧层 —— 旧层是历史对照，覆盖会丢时间线。

### ③ 没有独立 validate，也没有 CI

仓库没有 `.github/workflows`。校验嵌在 `merge-data.mjs` 里，会在这些情况直接 throw：

- `id` 与文件名不一致
- `id` 重复
- `openness === 'open-weights'` 但 `weights_available !== true`
- `complete: true` 却少于 3 条 `highlights` / 3 条 `pitfalls`，或缺 `sheet.architecture_md`

**本地 `npm run build` 是唯一防线。**

## 流程

### 1. 检索

每天**独立**搜这五类，不能只做一次泛化搜索：

1. **前沿闭源新发布** —— OpenAI / Anthropic / Google / xAI / Meta
2. **开源权重新发布** —— DeepSeek / Qwen / Moonshot / Z.ai(GLM) / MiniMax / 腾讯 / 小米 / 阶跃 / NVIDIA / Mistral / IBM / 上海 AI 实验室
3. **定价变动** —— 降价、促销到期、计划涨价、取消涨价
4. **状态变动** —— 新版本替代旧版本、API 退役、权重开放
5. **新评测数据** —— Artificial Analysis、LMArena、官方公告表

信源优先级：**厂商官方公告 / 模型卡 / 定价页 > Artificial Analysis、LMArena > 券商研报、IT 媒体 > 聚合帖与社媒**。

判断不了是否已 GA 的，查官方有没有给出 API id 与定价。

### 2. 落数据

**新模型先建速览条目**（`complete: false`）：规格、定价、官方链接、`one_liner` 就够。

完整说明书（3 亮点 / 3 坑 / 五段 markdown / 三语 i18n）是内容活，**由人单独排期写，不要自动生成** —— 这站的卖点正是手写的「坑」，灌水会直接稀释可信度。项目已有此先例（`changelog.json` 里「收录 Claude 5 家族速览条目，规格与分数待补」）。

内容政策（来自 README，逐条遵守）：

- **闭源模型参数量一律写「未披露」**，`architecture.undisclosed = true`
- **厂商自称的分数标 `evidence: 'official'`**，第三方复测标 `'independent'`
- **许可证逐字抄官方**，不要意译
- **坑必须写**

**别忘替代关系。** 新版本发布时把被替代的旧条目 `status` 改成 `superseded`。漏这步，总榜会把过期模型和当前代混在一起排 —— 这是本站最容易出的错。

收尾：

- `data/meta.json`：`generated_at`、`data_cutoff` 改当天
- `data/changelog.json`：**每条改动加一行**（`type` 用 `new` / `up` / `down` / `doc`）。这是站点的「最新动态」，也是「展示最新」定位的直接体现。

### 3. 校验

命令一条一条跑，**不要用 `&&` 链、不要 `cd`**（审批系统不给命令链和 cwd 变更绑定授权）：

```
npm --prefix /root/.openclaw/workspace/AI-Gallery run data
```
```
npm --prefix /root/.openclaw/workspace/AI-Gallery run build
```

- `data` 输出 `scores: N | models: N | complete: N`，数字要符合预期
- `build` 末尾必须是 `prerender: N/N pages`，两个数相等
- 依赖缺失先跑 `npm --prefix /root/.openclaw/workspace/AI-Gallery ci`

**只跑 `data` 不够。** 必须跑完整 `build`：`tsc -b` 会抓出类型不匹配（新字段写错在这里炸），prerender 会抓出渲染期崩溃。没有 CI 兜底。

跑完 `git diff --stat` 确认只动了该动的文件。产物是确定性生成的，源没改就不该有 diff。

### 4. 提交并推送

```
git -C /root/.openclaw/workspace/AI-Gallery add data scripts
```
```
git -C /root/.openclaw/workspace/AI-Gallery commit -m "data: 模型库更新 YYYY-MM-DD"
```
```
git -C /root/.openclaw/workspace/AI-Gallery push origin main
```
```
git -C /root/.openclaw/workspace/AI-Gallery status -sb
```

- 最后一条是硬性收尾：必须看到干净的 `## main...origin/main`，不准 ahead 挂着就跑路
- push 失败**不许** `--force`，老实报错
- 无变动不产生空提交
- **别 `git add -A`**，用精确路径

### 5. 汇报

新增哪些模型、哪些翻了 `superseded`、分数/定价改了什么、`changelog` 加了几条、commit hash 与推送结果、以及**发现了但没落盘的及原因**。

## 硬性约束

- **没官方来源就不写。** 分数和定价是这站的全部可信度，宁可当天零改动。
- **传闻不入库。** 没有模型卡 / API id / 官方定价的，记进汇报，不建条目。
- **不覆盖历史快照层**，只新增。
- **不动前端代码**（`src/`）。只碰 `data/`、`scripts/`。
