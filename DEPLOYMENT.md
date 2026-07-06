# 🍎 iOS应用打包部署保姆级教程

> 本教程专为Windows用户设计，全程图文并茂，手把手教你将黄金价格监控APP打包成iOS应用！

---

## 📋 前置准备

### 你需要准备的东西：

| 物品 | 说明 | 是否必须 |
|------|------|----------|
| Windows电脑 | 运行本项目代码 | ✅ 必须 |
| iPhone手机 | 安装和测试应用 | ✅ 必须 |
| GitHub账号 | 用于云端构建 | ✅ 必须 |
| Apple ID | 用于注册开发者账号 | ✅ 必须 |
| Apple Developer账号 | 用于代码签名（免费即可） | ✅ 必须 |
| 网络连接 | 需要访问GitHub和Apple官网 | ✅ 必须 |

### 检查本地环境

打开命令提示符（CMD）或PowerShell，运行以下命令：

```bash
# 检查Node.js版本（需要18+）
node -v

# 检查npm版本
npm -v

# 检查Git版本
git --version
```

如果没有安装，请先安装：
- Node.js: https://nodejs.org/（下载LTS版本）
- Git: https://git-scm.com/download/win

---

## 🚀 第一步：注册Apple Developer账号

### 1.1 访问Apple开发者官网

打开浏览器访问：https://developer.apple.com/programs/enroll/

### 1.2 选择账号类型

| 类型 | 价格 | 适合人群 |
|------|------|----------|
| **个人账号** | 免费 | 个人开发者、测试使用 |
| **公司/组织账号** | 每年99美元 | 公司、需要发布到App Store |

> 💡 **推荐**：先用免费个人账号进行测试，后续需要发布到App Store再升级。

### 1.3 使用Apple ID登录

使用你的Apple ID登录，如果没有Apple ID：
1. 访问 https://appleid.apple.com/
2. 点击 "创建您的Apple ID"
3. 按照提示完成注册

### 1.4 完成注册

登录后，系统会引导你完成注册流程。免费账号可以直接使用，不需要付费。

---

## 🌐 第二步：部署后端API服务

### 2.1 注册Vercel账号

Vercel是一个免费的云平台，可以部署我们的API服务。

1. 访问 https://vercel.com/
2. 点击 "Sign Up"
3. 使用GitHub账号登录（推荐）

### 2.2 创建新项目

1. 登录后点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择你的GitHub仓库（后续步骤会创建）

### 2.3 配置项目

1. 项目名称：`gold-price-monitor-api`
2. 框架预设：选择 `Other`
3. 构建命令：留空（Vercel会自动检测）
4. 输出目录：`dist`

### 2.4 部署

点击 "Deploy" 按钮，等待部署完成。

部署完成后，你会获得一个公网URL，类似：
`https://gold-price-monitor-api.vercel.app`

### 2.5 更新前端API地址

打开 `src/utils/api.ts` 文件：

```typescript
// 将这里的URL替换为你的Vercel部署地址
const BASE_URL = 'https://gold-price-monitor-api.vercel.app/api';
```

---

## 📦 第三步：创建GitHub仓库

### 3.1 创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - Repository name: `gold-price-monitor`
   - Description: 黄金价格监控APP
   - Public（公开仓库，免费构建）
3. 点击 "Create repository"

### 3.2 推送代码到GitHub

打开PowerShell，进入项目目录：

```bash
# 进入项目目录
cd G:\codex\huangjing

# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/gold-price-monitor.git

# 推送代码
git push -u origin main
```

---

## 🔑 第四步：配置代码签名证书

### 4.1 生成证书签名请求（CSR）

1. 打开Keychain Access（在Mac上操作，或使用虚拟机）
2. 菜单栏 -> Keychain Access -> Certificate Assistant -> Request a Certificate From a Certificate Authority
3. 填写信息：
   - User Email Address: 你的Apple ID邮箱
   - Common Name: 你的名字
   - CA Email Address: 留空
   - Choose "Saved to disk"
4. 点击 "Continue"，保存CSR文件

### 4.2 创建开发证书

1. 访问 https://developer.apple.com/account/resources/certificates/list
2. 点击 "+" 按钮
3. 选择 "Apple Development"
4. 点击 "Continue"
5. 选择你的CSR文件
6. 点击 "Continue" -> "Download"
7. 下载证书后双击安装到Keychain

### 4.3 创建App ID

1. 访问 https://developer.apple.com/account/resources/identifiers/list
2. 点击 "+" 按钮
3. 选择 "App IDs" -> "Continue"
4. 选择 "App" -> "Continue"
5. 填写信息：
   - Description: Gold Price Monitor
   - Bundle ID: `com.yourname.goldprice`（唯一标识符）
6. 勾选 "Push Notifications" 和 "Background Modes"
7. 点击 "Continue" -> "Register"

### 4.4 创建描述文件

1. 访问 https://developer.apple.com/account/resources/profiles/list
2. 点击 "+" 按钮
3. 选择 "iOS App Development" -> "Continue"
4. 选择你的App ID -> "Continue"
5. 选择你的开发证书 -> "Continue"
6. 选择你的测试设备（需要先添加设备）
7. 填写Profile Name: `GoldPriceMonitor_Development`
8. 点击 "Generate" -> "Download"

---

## ⚙️ 第五步：配置GitHub Secrets

### 5.1 获取Team ID

1. 访问 https://developer.apple.com/account
2. 在页面右上角可以看到你的Team ID（一串字母数字）

### 5.2 生成App专用密码

1. 访问 https://appleid.apple.com/
2. 登录你的Apple ID
3. 点击 "App专用密码"
4. 点击 "生成密码"
5. 输入密码标签（如：GitHub Actions）
6. 点击 "创建"
7. **复制生成的密码**（只显示一次！）

### 5.3 获取证书名称

1. 在Mac上打开Keychain Access
2. 找到你的开发证书
3. 双击打开，查看名称（如：Apple Development: xxx (ABCDEFGH12)）

### 5.4 添加GitHub Secrets

1. 访问你的GitHub仓库
2. 点击 "Settings" -> "Secrets and variables" -> "Actions"
3. 点击 "New repository secret"
4. 添加以下Secrets：

| Secret名称 | 值 | 获取方式 |
|------------|-----|----------|
| `APPLE_ID` | your@email.com | 你的Apple ID邮箱 |
| `APPLE_PASSWORD` | xxxx-xxxx-xxxx-xxxx | 生成的App专用密码 |
| `APPLE_TEAM_ID` | ABCDEFGH12 | Apple开发者网站 |
| `APPLE_SIGNING_IDENTITY` | Apple Development: xxx (ABCDEFGH12) | Keychain Access |
| `APPLE_PROVISIONING_PROFILE` | GoldPriceMonitor_Development | Apple开发者网站 |

---

## 🚀 第六步：触发GitHub Actions构建

### 6.1 手动触发构建

1. 访问你的GitHub仓库
2. 点击 "Actions" 标签页
3. 在左侧选择 "iOS Build"
4. 点击 "Run workflow"
5. 选择分支为 `main`
6. 点击 "Run workflow"

### 6.2 等待构建完成

构建过程大约需要5-10分钟，可以看到每一步的执行状态：

```
✓ Checkout code (1s)
✓ Set up Node.js (2s)
✓ Install npm dependencies (30s)
✓ Build frontend (1min)
✓ Sync Capacitor iOS (10s)
✓ Install CocoaPods dependencies (2min)
✓ Build iOS Debug (3min)
✓ Archive iOS Release (5min)
✓ Export IPA (1min)
✓ Upload build artifacts (5s)
```

### 6.3 下载构建产物

1. 构建完成后，点击构建记录
2. 滚动到页面底部，找到 "Artifacts"
3. 点击 "ios-build" 下载压缩包
4. 解压后可以看到 `.xcarchive` 和 `ipa` 文件

---

## 📱 第七步：安装应用到iPhone

### 7.1 添加测试设备

1. 访问 https://developer.apple.com/account/resources/devices/list
2. 点击 "+" 按钮
3. 填写设备信息：
   - Name: iPhone 15 Pro（你的设备名称）
   - Device ID (UDID): 需要在手机上获取

### 7.2 获取UDID

**方法一：通过Xcode（需要Mac）**

1. 连接iPhone到Mac
2. 打开Xcode
3. 菜单栏 -> Window -> Devices and Simulators
4. 选择你的设备，复制UDID

**方法二：通过第三方工具**

1. 在iPhone上打开Safari
2. 访问 https://get.udid.io/
3. 按照提示操作，获取UDID

### 7.3 使用Xcode安装（推荐）

1. 在Mac上打开Xcode
2. 菜单栏 -> Window -> Devices and Simulators
3. 点击 "+" 按钮，选择下载的 `.ipa` 文件
4. 等待安装完成

### 7.4 使用第三方工具安装

推荐工具：
- **AltStore**: https://altstore.io/
- **Sideloadly**: https://sideloadly.io/

#### 使用AltStore安装：

1. 在电脑上安装AltServer
2. 在iPhone上安装AltStore
3. 连接iPhone到电脑
4. 在AltStore中点击 "+" 按钮
5. 选择下载的 `.ipa` 文件
6. 输入Apple ID和密码

---

## 🔧 第八步：调试和验证

### 8.1 信任开发者证书

1. 在iPhone上打开设置
2. 通用 -> VPN与设备管理
3. 找到你的开发者证书
4. 点击 "信任"

### 8.2 测试实时显示功能

1. 打开应用
2. 点击 "开启实时显示" 按钮
3. 如果是iPhone 14 Pro及以上机型，灵动岛会显示价格
4. 如果是其他机型，通知中心会显示实时价格卡片

### 8.3 验证价格更新

1. 等待20秒，价格应该自动刷新
2. 点击 "手动刷新" 按钮测试手动刷新
3. 检查通知中心的价格是否同步更新

---

## ⚠️ 常见问题解决

### Q1: 构建失败 - No such module 'Capacitor'

**原因**：CocoaPods依赖未正确安装

**解决方法**：
```bash
# 在ios/App目录下运行
cd ios/App
pod install --repo-update
```

### Q2: 构建失败 - Code signing required

**原因**：未正确配置代码签名

**解决方法**：
1. 检查GitHub Secrets是否正确
2. 确保描述文件包含你的测试设备
3. 确认证书未过期

### Q3: 应用安装后闪退

**原因**：
- 设备未在描述文件中
- 证书过期
- 应用权限不足

**解决方法**：
1. 检查设备UDID是否已添加到Apple开发者网站
2. 重新生成描述文件
3. 重新构建并安装

### Q4: 价格不更新

**原因**：
- 网络连接问题
- 后端API未部署
- API地址配置错误

**解决方法**：
1. 检查手机网络连接
2. 在浏览器中测试API地址
3. 确认 `src/utils/api.ts` 中的URL正确

### Q5: 通知不显示

**原因**：
- 通知权限未授权
- 应用在后台被杀死
- iOS版本不支持

**解决方法**：
1. 设置 -> 通知 -> 找到应用 -> 开启通知
2. 确保应用在后台运行
3. 检查iOS版本（灵动岛需要iOS 16.1+）

---

## 🎉 恭喜！你已完成部署！

现在你已经成功将黄金价格监控APP打包成iOS应用并安装到iPhone上了！

### 下一步可以做的事情：

1. **发布到App Store**：升级到付费开发者账号，提交审核
2. **添加更多功能**：价格预警、历史图表分析等
3. **优化UI**：根据用户反馈调整界面
4. **增加商品种类**：添加更多贵金属和大宗商品

---

## 📞 需要帮助？

如果在部署过程中遇到问题，可以：

1. 查看GitHub Actions的构建日志，找到具体错误
2. 在项目Issues中提问
3. 参考官方文档：
   - Capacitor: https://capacitorjs.com/docs
   - Apple Developer: https://developer.apple.com/documentation
   - GitHub Actions: https://docs.github.com/en/actions

---

*最后更新：2026年7月5日*
