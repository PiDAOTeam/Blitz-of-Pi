# 数据库导入和迁移说明

生产数据库：

- 数据库名：`blitzhashpi`
- 用户名：`blitzhashpi`

真实密码只保存在服务器和 `.env.production`，不要写入 Git。

## 导入前必须备份

在宝塔面板或命令行先导出当前数据库。确认备份文件可下载、可恢复后再继续。

数据库备份、生产快照、压缩包不要提交到 Git。

## 全新环境

全新数据库按顺序导入：

1. `database/mysql/init.sql`
2. `database/mysql/002_wallet_payment_rank.sql`
3. `database/mysql/003_pi_runtime_config.sql`
4. `database/mysql/004_admin_password.sql`
5. `database/mysql/005_operational_audit_hardening.sql`
6. `database/mysql/006_withdraw_admin_ops.sql`
7. `database/mysql/007_remove_mock_seed_data.sql`
8. `database/mysql/008_user_profile_avatar.sql`
9. `database/mysql/009_profile_onboarding.sql`
10. `database/mysql/010_add_starlight_rank.sql`
11. `database/mysql/011_auto_withdraw_payout.sql`
12. `database/mysql/012_payment_txid_null_fix.sql`

## 已有生产环境

已有生产环境不要重复导入 `init.sql` 覆盖数据。只导入生产库缺少的后续迁移脚本。

如果不确定当前生产库已经执行到哪一个版本，先停止操作，检查表结构或用备份库测试。

## 导入方式

- 宝塔数据库管理
- phpMyAdmin
- 命令行 `mysql`

命令行示例：

```bash
mysql -u blitzhashpi -p blitzhashpi < database/mysql/012_payment_txid_null_fix.sql
```
