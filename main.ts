import { 
    App, 
    Plugin, 
    PluginSettingTab, 
    Setting, 
    Notice,
    MarkdownPostProcessorContext,
    MarkdownView
} from 'obsidian';

// ==================== 类型定义 ====================
interface PluginSettings {
    promptColor: string;
    commandColor: string;
    interfaceColor: string;
    ipColor: string;
    numberColor: string;
    commentColor: string;
    fileColor: string;
    textColor: string;
    commands: string[];
    interfaces: string[];
    files: string[];
    debugMode: boolean;
    lineNumbers: boolean;
    customCSS: string;
}

// ==================== 默认配置 ====================
const DEFAULT_SETTINGS: PluginSettings = {
    promptColor: '#008080',
    commandColor: '#ff8c00',
    interfaceColor: '#003153',
    ipColor: '#656598',
    numberColor: '#aa78aa',
    commentColor: '#6a9955',
    fileColor: '#ff69b4',
    textColor: 'var(--text-normal)',
    commands: [
        'access', 'access-class', 'access-list', 'access-lists', 'active', 'add', 'address', 'address-table', 'all', 'allowed', 'allow-untrusted', 'arp', 'arp-cache', 'any', 'ascii', 'authentication-retries', 'auto',
            'binding', 'boot', 'brief', 'broadcast', 'banner', 'both', 'bpduguard', 'buffered',
            'cdp', 'clear', 'client', 'clock', 'configure', 'configured', 'conflict', 'connect', 'copy', 'counters', 'crypto', 'channel-group', 'channel-protocol', 'cisco-phone', 'client-id', 'community', 'console', 'cos',
            'database', 'debug', 'delete', 'detail', 'dhcp', 'dir', 'disable', 'disconnect', 'domain', 'dtp', 'dynamic', 'databits', 'datetime', 'debugging', 'default', 'default-gateway', 'default-router', 'deny', 'description', 'desirable', 'destination', 'device', 'dns-server', 'do', 'domain-lookup', 'domain-name', 'dscp', 'dst-ip', 'dst-mac', 'duplex',
            'enable', 'entry', 'erase', 'etherchannel', 'event', 'events', 'end', 'exit', 'even', 'except', 'excluded-address', 'exec', 'exec-timeout', 'extend', 'extended',
            'flowcontrol', 'ftp', 'full',
            'generate', 'guard',
            'history', 'hosts', 'half', 'hardware', 'hardware-address', 'host', 'hostname',
            'icmp', 'id', 'inconsistentports', 'information', 'interface', 'ip', 'in',
            'key',
            'lease', 'lldp', 'load-balance', 'local', 'logging', 'logout', 'lacp', 'level', 'limit', 'line', 'link-type', 'load-balance', 'log', 'login', 'lookup',
            'mac', 'mac-address-table', 'memory', 'mls', 'mode', 'monitor', 'more', 'mypubkey', 'mac-address', 'mark', 'maximum', 'mdix', 'motd', 'motd-banner', 'msec',
            'name', 'neighbors', 'no', 'name-server', 'native', 'network', 'none', 'nonegotiate',
            'odd', 'on', 'option', 'out', 'output',
            'packet', 'packets', 'password', 'ping', 'pool', 'port-channel', 'port-security', 'portfast', 'privilege', 'processes', 'protocol', 'pagp', 'parity', 'passive', 'password-encryption', 'permit', 'point-to-point', 'portfast', 'port-priority', 'prefer', 'primary', 'priority', 'protect', 'pvst',
            'qos',
            'range', 'reload', 'remote', 'resume', 'rsa', 'rapid-pvst', 'rate', 'receive', 'relay', 'remark', 'remove', 'reset', 'restrict', 'ro', 'root', 'router', 'run', 'rw', 'rx',
            'sdm', 'server', 'session', 'sessions', 'set', 'setup', 'show', 'size', 'snmp', 'snooping', 'spanning-tree', 'ssh', 'static', 'status', 'sticky', 'storm-control', 'summary', 'sw-vlan', 'secondary', 'secret', 'service', 'shutdown', 'snmp-server', 'software', 'source', 'space', 'speed', 'src-dst-ip', 'src-dst-mac', 'src-ip', 'src-mac', 'standard', 'stopbits', 'subscriber-id', 'switchport', 'synchronous', 'system',
            'table', 'tcp', 'tech-support', 'telnet', 'terminal', 'totals', 'traceroute', 'transparent', 'trusted-sources', 'time-out', 'timestamps', 'timezone', 'transmit', 'transport', 'trap', 'trunk', 'trust', 'trust-all', 'tx', 'tx-ring-limit',
            'use', 'users', 'username',
            'v2-mode', 'verify ', 'version', 'vlan', 'vtp', 'violation', 'voice',
            'write', 'write-delay',
            'zeroize',
            '?'
    ],
    interfaces: [
        'FastEthernet', 'GigabitEthernet', 'TenGigabitEthernet', 'Serial',
        'Ethernet', 'Loopback', 'Vlan', 'Port-channel', 'Tunnel'
    ],
    files: [
        'flash:', 'ftp:', 'tftp:', 'nvram:', 'running-config', 'startup-config'
    ],
    debugMode: false,
    lineNumbers: true,
    customCSS: ''
};

// ==================== 规则引擎 ====================
class RuleEngine {
    private promptRegex: RegExp;
    private commandRegex: RegExp;
    private interfaceRegex: RegExp;
    private ipRegex: RegExp;
    private numberRegex: RegExp;
    private commentRegex: RegExp;
    private fileRegex: RegExp;
    private settings: PluginSettings;

    constructor(settings: PluginSettings) {
        this.settings = settings;
        this.compileRules();
    }

    private compileRules(): void {
        try {
            // 命令提示符正则
            this.promptRegex = /^(switch(?:\(config(?:-(?:if|vlan|line|route))?\))?[>#])/;

            // 命令关键词正则
            const escapedCommands = this.settings.commands
                .filter(c => c && c.trim())
                .map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .sort((a, b) => b.length - a.length);
            
            if (escapedCommands.length > 0) {
                this.commandRegex = new RegExp(`\\b(${escapedCommands.join('|')})\\b`, 'i');
            } else {
                this.commandRegex = /(?!)/;
            }

            // 接口正则
            const escapedInterfaces = this.settings.interfaces
                .filter(i => i && i.trim())
                .map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');
            
            if (escapedInterfaces.length > 0) {
                this.interfaceRegex = new RegExp(`\\b(${escapedInterfaces})\\d*(?:/\\d+)*(?:\\.\\d+)?\\b`, 'i');
            } else {
                this.interfaceRegex = /(?!)/;
            }

            // IP地址正则
            this.ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;

            // 数字正则
            this.numberRegex = /\b\d+(?:\/\d+)*\b/;

            // 注释正则
            this.commentRegex = /^!.*$/;

            // 文件名正则
            const escapedFiles = this.settings.files
                .filter(f => f && f.trim())
                .map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');
            
            if (escapedFiles.length > 0) {
                this.fileRegex = new RegExp(`\\b(${escapedFiles})\\b`, 'i');
            } else {
                this.fileRegex = /(?!)/;
            }

        } catch (error) {
            console.error('Error compiling rules:', error);
        }
    }

    // 安全的匹配方法
    private safeMatchAll(
        regex: RegExp, 
        line: string, 
        matches: any[], 
        className: string, 
        priority: number
    ): void {
        try {
            // 创建新的正则实例，避免 lastIndex 污染
            const safeRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
            let match;
            let count = 0;
            const MAX_MATCHES = 50; // 限制每行最多匹配次数，防止无限循环
            
            while ((match = safeRegex.exec(line)) !== null && count < MAX_MATCHES) {
                matches.push({
                    index: match.index,
                    length: match[0].length,
                    className: className,
                    priority: priority
                });
                count++;
                // 防止零长度匹配导致的无限循环
                if (match[0].length === 0) break;
            }
        } catch (error) {
            console.error(`Error matching ${className}:`, error);
        }
    }

    public findMatches(line: string): Array<{
        index: number;
        length: number;
        className: string;
        priority: number;
    }> {
        // 空行或过长的行直接返回
        if (!line || line.length > 5000) {
            return [];
        }

        const matches: Array<{
            index: number;
            length: number;
            className: string;
            priority: number;
        }> = [];

        try {
            // 注释匹配（最高优先级）
            if (this.commentRegex.test(line)) {
                const match = this.commentRegex.exec(line);
                if (match && match[0]) {
                    matches.push({
                        index: match.index,
                        length: match[0].length,
                        className: 'cisco-comment',
                        priority: 100
                    });
                }
                return matches;
            }

            // 安全地执行每个正则匹配
            this.safeMatchAll(this.promptRegex, line, matches, 'cisco-prompt', 95);
            this.safeMatchAll(this.ipRegex, line, matches, 'cisco-ip', 90);
            this.safeMatchAll(this.interfaceRegex, line, matches, 'cisco-interface', 85);
            this.safeMatchAll(this.commandRegex, line, matches, 'cisco-command', 80);
            this.safeMatchAll(this.fileRegex, line, matches, 'cisco-file', 75);
            this.safeMatchAll(this.numberRegex, line, matches, 'cisco-number', 70);

        } catch (error) {
            console.error('Error finding matches:', error);
            return [];
        }

        if (matches.length === 0) return [];

        // 按位置排序
        matches.sort((a, b) => a.index - b.index);
        
        // 合并重叠匹配
        return this.mergeOverlapping(matches);
    }

    private mergeOverlapping(matches: Array<{
        index: number;
        length: number;
        className: string;
        priority: number;
    }>): Array<{ index: number; length: number; className: string; priority: number }> {
        if (matches.length <= 1) return matches;

        const merged: typeof matches = [];
        for (const match of matches) {
            const last = merged[merged.length - 1];
            if (!last) {
                merged.push(match);
                continue;
            }

            const lastEnd = last.index + last.length;
            if (match.index >= lastEnd) {
                merged.push(match);
            } else if (match.priority > last.priority) {
                merged[merged.length - 1] = match;
            }
        }
        return merged;
    }

    public updateSettings(settings: PluginSettings): void {
        this.settings = settings;
        this.compileRules();
    }
}

// ==================== 高亮处理器 ====================
class HighlightProcessor {
    private ruleEngine: RuleEngine;
    private settings: PluginSettings;

    constructor(settings: PluginSettings) {
        this.settings = settings;
        this.ruleEngine = new RuleEngine(settings);
    }

    public processLine(line: string): string {
        try {
            if (!line) {
                return '<span class="cisco-text"> </span>';
            }

            // 限制行长度，避免性能问题
            if (line.length > 5000) {
                return `<span class="cisco-text">${this.escapeHtml(line.substring(0, 5000))}...</span>`;
            }

            const matches = this.ruleEngine.findMatches(line);

            if (matches.length === 0) {
                return `<span class="cisco-text">${this.escapeHtml(line)}</span>`;
            }

            let result = '';
            let lastIndex = 0;

            for (const match of matches) {
                // 添加匹配前的文本
                if (match.index > lastIndex) {
                    const text = line.substring(lastIndex, match.index);
                    if (text) {
                        result += `<span class="cisco-text">${this.escapeHtml(text)}</span>`;
                    }
                }

                // 添加高亮文本
                const highlighted = line.substr(match.index, match.length);
                result += `<span class="${match.className}">${this.escapeHtml(highlighted)}</span>`;

                lastIndex = match.index + match.length;
            }

            // 添加剩余文本
            if (lastIndex < line.length) {
                const text = line.substring(lastIndex);
                result += `<span class="cisco-text">${this.escapeHtml(text)}</span>`;
            }

            return result;

        } catch (error) {
            console.error('Error processing line:', error);
            return `<span class="cisco-text">${this.escapeHtml(line)}</span>`;
        }
    }

    private escapeHtml(text: string): string {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    public updateSettings(settings: PluginSettings): void {
        this.settings = settings;
        this.ruleEngine.updateSettings(settings);
    }

    public generateCSS(): string {
        let css = ':root {\n';
        css += `  --cisco-prompt: ${this.settings.promptColor};\n`;
        css += `  --cisco-command: ${this.settings.commandColor};\n`;
        css += `  --cisco-interface: ${this.settings.interfaceColor};\n`;
        css += `  --cisco-ip: ${this.settings.ipColor};\n`;
        css += `  --cisco-number: ${this.settings.numberColor};\n`;
        css += `  --cisco-comment: ${this.settings.commentColor};\n`;
        css += `  --cisco-file: ${this.settings.fileColor};\n`;
        css += `  --cisco-text: ${this.settings.textColor};\n`;
        css += '}\n\n';

        if (this.settings.customCSS) {
            css += '/* Custom CSS */\n';
            css += this.settings.customCSS;
        }

        return css;
    }
}

// ==================== 设置选项卡 ====================
class CiscoSettingTab extends PluginSettingTab {
    plugin: CiscoCodePlugin;

    constructor(app: App, plugin: CiscoCodePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Cisco Code Highlighter Settings' });

        // 颜色设置
        containerEl.createEl('h3', { text: 'Colors' });

        this.addColorSetting('Command Prompt', 'promptColor', 'e.g., Switch>');
        this.addColorSetting('Commands', 'commandColor', 'e.g., enable, configure');
        this.addColorSetting('Interfaces', 'interfaceColor', 'e.g., GigabitEthernet0/1');
        this.addColorSetting('IP Addresses', 'ipColor', 'e.g., 192.168.1.1');
        this.addColorSetting('Numbers', 'numberColor', 'e.g., 255, 0/1');
        this.addColorSetting('Comments', 'commentColor', 'Lines starting with !');
        this.addColorSetting('Files', 'fileColor', 'e.g., running-config');
        this.addColorSetting('Text', 'textColor', 'Default text color');

        // 关键词设置
        containerEl.createEl('h3', { text: 'Keywords' });

        this.addKeywordManager('Commands', 'commands');
        this.addKeywordManager('Interfaces', 'interfaces');
        this.addKeywordManager('Files', 'files');

        // 显示设置
        containerEl.createEl('h3', { text: 'Display' });

        new Setting(containerEl)
            .setName('Show line numbers')
            .setDesc('Display line numbers on the left side')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.lineNumbers)
                .onChange(async (value) => {
                    this.plugin.settings.lineNumbers = value;
                    await this.plugin.saveSettings();
                }));

        // 调试设置
        containerEl.createEl('h3', { text: 'Advanced' });

        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Log processing information to console')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Custom CSS')
            .setDesc('Add your own CSS rules to override styles')
            .addTextArea(textarea => textarea
                .setValue(this.plugin.settings.customCSS)
                .onChange(async (value) => {
                    this.plugin.settings.customCSS = value;
                    await this.plugin.saveSettings();
                }));

        // 操作按钮
        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('Reset to Defaults')
                .setWarning()
                .onClick(async () => {
                    this.plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
                    await this.plugin.saveSettings();
                    this.display();
                    new Notice('Settings reset to defaults');
                }))
            .addButton(button => button
                .setButtonText('Export Settings')
                .onClick(async () => {
                    await navigator.clipboard.writeText(
                        JSON.stringify(this.plugin.settings, null, 2)
                    );
                    new Notice('Settings copied to clipboard');
                }));
    }

    private addColorSetting(name: string, key: keyof PluginSettings, desc: string): void {
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(desc)
            .addColorPicker(color => color
                .setValue(this.plugin.settings[key] as string)
                .onChange(async (value) => {
                    (this.plugin.settings[key] as string) = value;
                    await this.plugin.saveSettings();
                }));
    }

    private addKeywordManager(name: string, key: keyof PluginSettings): void {
        const keywords = this.plugin.settings[key] as string[];
        const container = this.containerEl.createDiv();

        new Setting(container)
            .setName(name)
            .setDesc('Press Enter or click Add to add keywords')
            .addText(text => text
                .setPlaceholder('New keyword...')
                .onChange(() => {}))
            .addButton(button => button
                .setButtonText('Add')
                .setCta()
                .onClick(async () => {
                    const input = container.querySelector('input[placeholder="New keyword..."]') as HTMLInputElement;
                    if (input?.value && !keywords.includes(input.value)) {
                        keywords.push(input.value);
                        await this.plugin.saveSettings();
                        this.display();
                    }
                }));

        const tagContainer = container.createDiv({ cls: 'cisco-keyword-tags' });
        keywords.forEach((keyword, index) => {
            const tag = tagContainer.createSpan({ cls: 'cisco-keyword-tag', text: keyword });
            tag.createEl('button', { text: '×' }).addEventListener('click', async () => {
                keywords.splice(index, 1);
                await this.plugin.saveSettings();
                this.display();
            });
        });
    }
}

// ==================== 主插件类 ====================
export default class CiscoCodePlugin extends Plugin {
    settings: PluginSettings;
    private processor: HighlightProcessor;
    private styleEl: HTMLStyleElement | null = null;
    private refreshTimer: number | null = null;

    async onload(): Promise<void> {
        console.log('Loading Cisco Code Highlighter');

        await this.loadSettings();
        this.processor = new HighlightProcessor(this.settings);
        this.injectStyles();

        // 注册代码块处理器
        this.registerMarkdownCodeBlockProcessor('cisco', 
            (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
                this.processCodeBlock(source, el);
            });

        this.registerMarkdownCodeBlockProcessor('ios', 
            (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
                this.processCodeBlock(source, el);
            });

        // 添加命令
        this.addCommand({
            id: 'insert-cisco-block',
            name: 'Insert Cisco code block',
            editorCallback: (editor) => {
                editor.replaceSelection('```cisco\n\n```');
                const cursor = editor.getCursor();
                editor.setCursor(cursor.line - 1, 0);
            }
        });

        // 添加丝带图标
        this.addRibbonIcon('terminal', 'Insert Cisco code block', () => {
            const activeLeaf = this.app.workspace.activeLeaf;
            if (activeLeaf) {
                const view = activeLeaf.view;
                if (view instanceof MarkdownView) {
                    view.editor.replaceSelection('```cisco\n\n```');
                    const cursor = view.editor.getCursor();
                    view.editor.setCursor(cursor.line - 1, 0);
                }
            }
        });

        // 添加设置选项卡
        this.addSettingTab(new CiscoSettingTab(this.app, this));

        console.log('Cisco Code Highlighter loaded successfully');
    }

    onunload(): void {
        console.log('Unloading Cisco Code Highlighter');
        if (this.styleEl) {
            this.styleEl.remove();
        }
        if (this.refreshTimer) {
            window.clearTimeout(this.refreshTimer);
        }
    }

    async loadSettings(): Promise<void> {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.processor.updateSettings(this.settings);
        this.injectStyles();
        
        // 使用防抖刷新，避免频繁重绘
        if (this.refreshTimer) {
            window.clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = window.setTimeout(() => {
            this.refreshPreviews();
        }, 100);
    }

    private processCodeBlock(source: string, el: HTMLElement): void {
        try {
            // 限制代码块大小
            if (source.length > 50000) {
                console.warn('Code block too large, truncating');
                source = source.substring(0, 50000) + '\n... (truncated)';
            }

            const container = el.createDiv({ cls: 'cisco-block' });
            if (this.settings.lineNumbers) {
                container.addClass('has-line-numbers');
            }

            const lines = source.split('\n');
            const maxLines = Math.min(lines.length, 1000); // 限制最多1000行
            
            for (let i = 0; i < maxLines; i++) {
                const line = lines[i];
                const lineEl = container.createDiv({ cls: 'cisco-line' });

                if (this.settings.lineNumbers) {
                    lineEl.createSpan({ 
                        cls: 'line-number',
                        text: String(i + 1).padStart(3, ' ')
                    });
                }

                const contentSpan = lineEl.createSpan({ cls: 'cisco-content' });
                contentSpan.innerHTML = this.processor.processLine(line);
            }

            if (this.settings.debugMode) {
                console.log(`Processed code block: ${maxLines} lines`);
            }
        } catch (error) {
            console.error('Error processing Cisco code block:', error);
            el.createDiv({ 
                text: 'Error highlighting code block', 
                cls: 'cisco-block-error' 
            });
        }
    }

    private injectStyles(): void {
        if (this.styleEl) {
            this.styleEl.remove();
        }

        this.styleEl = document.createElement('style');
        this.styleEl.id = 'cisco-highlight-styles';
        this.styleEl.textContent = this.processor.generateCSS();
        document.head.appendChild(this.styleEl);
    }

    private refreshPreviews(): void {
        try {
            // 使用更安全的方式刷新预览，避免卡死
            this.app.workspace.iterateAllLeaves(leaf => {
                if (leaf.view.getViewType() === 'markdown') {
                    const view = leaf.view as any;
                    if (view.preview && view.preview.rerender) {
                        // 使用 requestAnimationFrame 避免阻塞
                        requestAnimationFrame(() => {
                            try {
                                view.preview.rerender(true);
                            } catch (e) {
                                console.error('Error refreshing preview:', e);
                            }
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error refreshing previews:', error);
        }
    }
}