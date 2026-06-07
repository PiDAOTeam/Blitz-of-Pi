# 数据库说明

Pi闪电战生产环境已经使用 MySQL，不再是早期的本地 JSON 文件方案。

生产数据库：

```text
数据库名：blitzhashpi
用户名：blitzhashpi
```

真实密码只保存在服务器 `.env.production` 和数据库管理面板，不写入 Git。

## 脚本顺序

全新数据库按顺序导入：

1. `mysql/init.sql`
2. `mysql/002_wallet_payment_rank.sql`
3. `mysql/003_pi_runtime_config.sql`
4. `mysql/004_admin_password.sql`
5. `mysql/005_operational_audit_hardening.sql`
6. `mysql/006_withdraw_admin_ops.sql`
7. `mysql/007_remove_mock_seed_data.sql`
8. `mysql/008_user_profile_avatar.sql`
9. `mysql/009_profile_onboarding.sql`
10. `mysql/010_add_starlight_rank.sql`
11. `mysql/011_auto_withdraw_payout.sql`
12. `mysql/012_payment_txid_null_fix.sql`

已有生产库不要重复执行 `init.sql` 覆盖数据，只执行缺少的迁移脚本。

## 当前主要数据

数据库承载：

- Pi 登录用户、昵称、头像、Pi UID / username
- 项目内 Pi 钱包余额、冻结余额和资金流水
- Pi 支付订单、充值、提现和自动出款状态
- 对战房间、结算记录、异常局和对账数据
- 后台运营配置、公告、门票、抽成、奖励比例
- 段位、周榜、奖励发放和邀请奖励

HashPi POINTS / POC 的真实余额在 HashPi 项目中保存。本项目只通过资产网关查询、冻结、结算和释放。

## 资产精度

- POINTS：整数资产，门票和结算金额必须是整数。
- POC：后端按 6 位小数处理，前端最多展示 2 位。
- Pi：沿用项目内 Pi 钱包精度。

## 生产操作要求

- 修改生产数据库前必须先备份。
- 数据库快照不要提交到 Git。
- 涉及钱包、支付、提现、对战结算的 SQL 必须先在备份库验证。
- 不确定迁移状态时，不要直接导入脚本，先检查表结构。
