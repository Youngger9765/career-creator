# Security Policy

## Pre-commit Security Checks

本專案使用多層次的安全檢查來防止敏感資訊洩漏和程式碼安全漏洞。

### 🔒 Secrets Detection (雙層防護)

1. **Gitleaks** - 掃描 git history 和 staged files
   - 檢測 API keys, tokens, passwords
   - 檢測 AWS, GCP, Azure credentials
   - 檢測 Private keys (RSA, SSH, etc.)

2. **Detect-Secrets** (Yelp) - 額外的 secret 偵測層
   - AWS Access Keys
   - GitHub Tokens
   - Basic Authentication
   - High Entropy Strings (Base64, Hex)
   - 排除誤報: Alembic revision IDs

### 🐍 Python Security (Bandit)

**嚴格度**: Medium/High only (`-ll`)

檢測項目：

- **硬編碼密碼** (HIGH severity)
- **SQL Injection 風險** (MEDIUM severity)
- **Request without timeout** (MEDIUM severity)
- **使用不安全的函式** (pickle, eval, exec)
- **弱加密演算法** (MD5, SHA1)

配置檔: `.bandit`

### 📦 Dependency Vulnerabilities

1. **Python Safety** - 檢查 Python 套件已知漏洞
   - 掃描 `requirements.txt`
   - 來源: Safety DB

2. **npm audit** - 檢查 Node.js 套件已知漏洞
   - 等級: HIGH and above
   - 掃描 `package.json`

### 🔑 Private Key Detection

自動偵測並阻止 commit：

- RSA private keys
- SSH private keys
- PGP private keys

## 測試安全檢查

```bash
# 測試所有安全檢查
pre-commit run --all-files

# 只測試 secrets detection
pre-commit run gitleaks --all-files
pre-commit run detect-secrets --all-files

# 只測試 Python security
pre-commit run bandit --all-files

# 只測試依賴套件
pre-commit run python-safety-dependencies-check --all-files
pre-commit run npm-audit --all-files
```

## 如果發現 Secret

### ❌ 已經 Commit 的 Secret

1. **立即更換** 該 secret/password/key
2. **從 git history 移除**:

   ```bash
   # 使用 BFG Repo-Cleaner
   java -jar bfg.jar --delete-files YOUR_SECRET_FILE
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push** (小心！)

   ```bash
   git push --force
   ```

### ✅ 未 Commit 的 Secret (Pre-commit 攔截)

1. 從 code 移除 secret
2. 將 secret 移到環境變數或 secrets manager
3. 重新 commit

## False Positives (誤報)

如果確定不是 secret，可以標記為 allowlist:

```python
# 使用 pragma 註解標記誤報
some_value = "EXAMPLE-ONLY"  # pragma: allowlist secret
```

## 回報安全問題

如果發現安全漏洞，請私下聯繫專案維護者，**不要公開 issue**。

## 安全最佳實踐

1. ✅ **永遠使用環境變數** 儲存敏感資訊
2. ✅ **定期更新依賴套件** (`pip-audit`, `npm audit`)
3. ✅ **Code Review** 時特別注意安全問題
4. ✅ **最小權限原則** - 只給需要的權限
5. ❌ **絕不 commit** `.env`, `credentials.json`, private keys
6. ❌ **絕不使用 `--no-verify`** 跳過 pre-commit hooks

---

**最後更新**: 2025-11-03
