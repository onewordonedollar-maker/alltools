# 跨境工具合集

#### 介绍
亚马逊选品/运营重要的提效小工具合集

#### 软件架构
软件架构说明


#### 本地运行

1. 安装 Node.js 20+（推荐 20.11 及以上）
2. 启用 pnpm（仓库使用 pnpm 锁文件）：
   - `corepack enable`
   - `corepack prepare pnpm@9.0.0 --activate`
3. 安装依赖：`pnpm install`
4. 启动开发：`pnpm dev`
5. 生产构建：`pnpm build`
6. 本地预览生产环境：`pnpm start`

#### Vercel 部署说明

1. 将仓库推送到 GitHub/GitLab/Bitbucket
2. 在 Vercel 中导入该仓库
3. 使用默认 Framework（Next.js）
4. 构建配置无需手填，仓库内 `vercel.json` 已指定：
   - Install Command: `corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile`
   - Build Command: `pnpm build`
5. 点击 Deploy
6. 首次部署成功后，后续每次推送会自动触发重新部署

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
