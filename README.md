
### 支持的高亮类型

| 类型 | 示例 | 默认颜色 |
|------|------|----------|
| 命令提示符 | `Switch>`、`Router#` | 🟢 #008080 |
| 命令 | `enable`、`configure`、`show` | 🟠 #ff8c00 |
| 接口 | `GigabitEthernet0/1`、`Serial0/0/0` | 🔵 #003153 |
| IP地址 | `192.168.1.1`、`10.0.0.1` | 🟣 #656598 |
| 数字 | `255`、`0/1`、`100` | 🟤 #aa78aa |
| 注释 | `! This is a comment` | 🌿 #6a9955 |
| 文件名 | `running-config`、`flash:` | 💗 #ff69b4 |

## ⚙️ 配置说明

### 打开设置

1. Obsidian 设置 → 社区插件
2. 找到 "Cisco Code Highlighter"
3. 点击设置图标

### 颜色配置

你可以为每种元素类型单独设置颜色：
- 命令提示符
- 命令
- 接口
- IP地址
- 数字
- 注释
- 文件名
- 普通文本

### 关键词管理

自由管理高亮的关键词列表：
- 添加新命令（如 `access-list`、`vlan`）
- 删除不需要的命令
- 支持接口名称自定义
- 支持文件名自定义

### 显示设置

- **行号**：是否显示行号
- **调试模式**：在控制台输出处理信息（用于开发调试）

## 🛠️ 开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/BaiCarp/obsidian-cisco-code-highlighter.git
cd obsidian-cisco-code-highlighter

# 安装依赖
npm install

# 开发模式（自动编译）
npm run dev

# 生产构建
npm run build
```

### 项目结构

```
cisco-code-highlighter/
├── main.ts           # 插件主代码
├── styles.css        # 样式文件
├── manifest.json     # 插件清单
├── package.json      # 依赖配置
├── tsconfig.json     # TypeScript 配置
└── esbuild.config.mjs # 构建配置
```

## 📝 示例

### 基础配置

```cisco
Switch>enable
Switch#configure terminal
Switch(config)#hostname Core-Switch
Core-Switch(config)#interface GigabitEthernet0/1
Core-Switch(config-if)#ip address 192.168.1.1 255.255.255.0
Core-Switch(config-if)#no shutdown
Core-Switch(config-if)#exit
Core-Switch(config)#end
Core-Switch#write memory
```

### OSPF 配置

```cisco
Router>enable
Router#configure terminal
Router(config)#router ospf 1
Router(config-router)#network 10.0.0.0 0.0.0.255 area 0
Router(config-router)#network 192.168.1.0 0.0.0.255 area 0
Router(config-router)#passive-interface default
Router(config-router)#no passive-interface GigabitEthernet0/0
Router(config-router)#end
Router#copy running-config startup-config
```

### VLAN 配置

```cisco
Switch>enable
Switch#configure terminal
Switch(config)#vlan 10
Switch(config-vlan)#name Sales
Switch(config-vlan)#exit
Switch(config)#vlan 20
Switch(config-vlan)#name Engineering
Switch(config-vlan)#exit
Switch(config)#interface range GigabitEthernet1/0/1-24
Switch(config-if-range)#switchport mode access
Switch(config-if-range)#switchport access vlan 10
Switch(config-if-range)#spanning-tree portfast
Switch(config-if-range)#exit
Switch(config)#end
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Obsidian](https://obsidian.md) - 优秀的笔记软件
- 所有为这个插件提供反馈和建议的用户

## 📞 联系

- GitHub: [@BaiCarp](https://github.com/BaiCarp)
- 问题反馈: [Issues](https://github.com/BaiCarp/obsidian-cisco-code-highlighter/issues)

---

如果这个插件对你有帮助，请给一个 ⭐️ Star 支持一下！
