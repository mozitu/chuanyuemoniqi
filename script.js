// 自定义弹窗函数
function showCustomDialog(options) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customDialogOverlay');
        const dialog = document.getElementById('customDialog');
        const icon = document.getElementById('customDialogIcon');
        const title = document.getElementById('customDialogTitle');
        const message = document.getElementById('customDialogMessage');
        const input = document.getElementById('customDialogInput');
        const cancelBtn = document.getElementById('customDialogCancel');
        const confirmBtn = document.getElementById('customDialogConfirm');
        
        // 设置内容
        title.textContent = options.title || '提示';
        message.textContent = options.message || '';
        
        // 设置图标类型
        icon.className = 'custom-dialog-icon';
        if (options.type === 'warning') icon.classList.add('warning');
        else if (options.type === 'danger') icon.classList.add('danger');
        else if (options.type === 'success') icon.classList.add('success');
        
        // 设置图标SVG
        const iconSvgs = {
            info: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L22 20 H2 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            danger: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            success: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
        icon.innerHTML = iconSvgs[options.type] || iconSvgs.info;
        
        // 输入框
        if (options.showInput) {
            input.style.display = 'block';
            input.value = options.inputValue || '';
            input.placeholder = options.inputPlaceholder || '';
            setTimeout(() => input.focus(), 100);
        } else {
            input.style.display = 'none';
        }
        
        // 按钮
        if (options.showCancel === false) {
            cancelBtn.style.display = 'none';
        } else {
            cancelBtn.style.display = 'block';
            cancelBtn.textContent = options.cancelText || '取消';
        }
        confirmBtn.textContent = options.confirmText || '确定';
        confirmBtn.className = 'custom-dialog-btn confirm';
        if (options.type === 'danger') confirmBtn.classList.add('danger');
        
        // 显示弹窗
        overlay.classList.add('active');
        
        // 事件处理
        function close(result) {
            overlay.classList.remove('active');
            cancelBtn.onclick = null;
            confirmBtn.onclick = null;
            resolve(result);
        }
        
        cancelBtn.onclick = () => close(options.showInput ? null : false);
        confirmBtn.onclick = () => close(options.showInput ? input.value : true);
        
        // ESC关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                close(options.showInput ? null : false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Enter确认
        if (options.showInput) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    close(input.value);
                }
            };
        }
    });
}

// 替代原生 alert
function customAlert(message, title = '提示') {
    return showCustomDialog({
        title,
        message,
        type: 'info',
        showCancel: false
    });
}

// 替代原生 confirm
function customConfirm(message, title = '确认', type = 'warning') {
    return showCustomDialog({
        title,
        message,
        type,
        showCancel: true
    });
}

// 危险操作确认
function customDangerConfirm(message, title = '危险操作') {
    return showCustomDialog({
        title,
        message,
        type: 'danger',
        showCancel: true,
        confirmText: '确定删除'
    });
}

// 替代原生 prompt
function customPrompt(message, defaultValue = '', title = '请输入') {
    return showCustomDialog({
        title,
        message,
        type: 'info',
        showInput: true,
        inputValue: defaultValue,
        showCancel: true
    });
}

// State
const state = {
    totalPoints: 100,
    usedPoints: 0,
    selectedWorld: null,
    selectedIdentity: null,
    attributes: { str: 10, int: 10, luck: 10, cha: 10 },
    selectedCheats: [],
    travelCount: parseInt(localStorage.getItem('travelCount') || '0'),
    successCount: parseInt(localStorage.getItem('successCount') || '0')
};

// API Settings State - 从localStorage加载
const savedApiSettings = JSON.parse(localStorage.getItem('apiSettings') || '{}');
const apiSettings = {
    baseUrl: savedApiSettings.baseUrl || localStorage.getItem('apiBaseUrl') || '',
    apiKey: savedApiSettings.apiKey || localStorage.getItem('apiKey') || '',
    model: savedApiSettings.model || localStorage.getItem('apiModel') || '',
    temperature: savedApiSettings.temperature ?? parseFloat(localStorage.getItem('apiTemperature') || '0.7'),
    backupBaseUrl: savedApiSettings.backupBaseUrl || localStorage.getItem('backupApiBaseUrl') || '',
    backupApiKey: savedApiSettings.backupApiKey || localStorage.getItem('backupApiKey') || '',
    backupModel: savedApiSettings.backupModel || localStorage.getItem('backupModel') || ''
};

// Backup API Settings (兼容旧代码)
const backupApiSettings = {
    baseUrl: apiSettings.backupBaseUrl,
    apiKey: apiSettings.backupApiKey,
    model: apiSettings.backupModel
};

// Get backup API or fallback to main API
function getBackupApi() {
    if (backupApiSettings.baseUrl && backupApiSettings.apiKey && backupApiSettings.model) {
        return {
            baseUrl: backupApiSettings.baseUrl,
            apiKey: backupApiSettings.apiKey,
            model: backupApiSettings.model,
            temperature: 0.5  // 备用API使用较低温度，更精确
        };
    }
    return apiSettings;
}

// API Schemes (saved configurations)
let apiSchemes = JSON.parse(localStorage.getItem('apiSchemes') || '[]');

// Presets & World Book Data
let presets = JSON.parse(localStorage.getItem('presets') || '[]');
let worldBook = JSON.parse(localStorage.getItem('worldBook') || '[]');
let editingPresetId = null;
let editingWorldBookId = null;

// Current Page State & Game Mode
let currentPage = localStorage.getItem('currentPage') || 'main';
let gameMode = localStorage.getItem('gameMode') || 'chuanyue';

// Mode-specific data (will be loaded based on gameMode)
let characterProfile = null;
let chuanyueRulesData = null;
let transCharData = null;
let worldBuildingData = null;
let worldBuildingGenerated = false;
let transCharGenerated = false; // 穿越人设是否已生成
let playerStatusData = null;
let customStatusCategories = [];
let worldMapData = null;
let importantCharacters = [];
let chatHistory = [];
let chatStatus = null;
let isChuanyueStarted = false;
let lastSummaryAt = 0;
let storySummary = '';
let worldMemories = []; // 快穿模式的世界记忆
let worldCount = 0; // 已完成的世界数量
let userPoints = 0; // 用户积分
let shopItems = []; // 商城商品
let livestreamMessages = []; // 直播弹幕消息
let viewerCount = 0; // 观众数量
let selectedMessageIndex = -1;
let longPressTimer = null;

// Collection & Archive Data (global, not mode-specific)
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let archives = JSON.parse(localStorage.getItem('archives') || '[]');

// Helper function to get storage key with mode prefix
function getStorageKey(key) {
    return `${gameMode}_${key}`;
}

// Load mode-specific data
function loadModeData() {
    // characterProfile已删除，改用chuanyueRulesData中的基本信息
    chuanyueRulesData = JSON.parse(localStorage.getItem(getStorageKey('chuanyueRulesData')) || 'null');
    transCharData = JSON.parse(localStorage.getItem(getStorageKey('transCharData')) || 'null');
    worldBuildingData = JSON.parse(localStorage.getItem(getStorageKey('worldBuildingData')) || 'null');
    worldBuildingGenerated = localStorage.getItem(getStorageKey('worldBuildingGenerated')) === 'true';
    transCharGenerated = localStorage.getItem(getStorageKey('transCharGenerated')) === 'true';
    playerStatusData = JSON.parse(localStorage.getItem(getStorageKey('playerStatusData')) || '{"currentStatus":"","affection":[],"friends":[],"enemies":[],"inventory":[],"custom":{}}');
    customStatusCategories = JSON.parse(localStorage.getItem(getStorageKey('customStatusCategories')) || '[]');
    worldMapData = JSON.parse(localStorage.getItem(getStorageKey('worldMapData')) || 'null');
    importantCharacters = JSON.parse(localStorage.getItem(getStorageKey('importantCharacters')) || '[]');
    chatHistory = JSON.parse(localStorage.getItem(getStorageKey('chatHistory')) || '[]');
    chatStatus = JSON.parse(localStorage.getItem(getStorageKey('chatStatus')) || 'null');
    isChuanyueStarted = localStorage.getItem(getStorageKey('isChuanyueStarted')) === 'true';
    lastSummaryAt = parseInt(localStorage.getItem(getStorageKey('lastSummaryAt')) || '0');
    storySummary = localStorage.getItem(getStorageKey('storySummary')) || '';
    worldMemories = JSON.parse(localStorage.getItem(getStorageKey('worldMemories')) || '[]');
    worldCount = parseInt(localStorage.getItem(getStorageKey('worldCount')) || '0');
    userPoints = parseInt(localStorage.getItem(getStorageKey('userPoints')) || '0');
    livestreamMessages = JSON.parse(localStorage.getItem(getStorageKey('livestreamMessages')) || '[]');
}

// Initialize data for current mode
loadModeData();

// Built-in System Prompt (Hidden from user)
const SYSTEM_PROMPT_CORE = `
★★★★★ 全局强制预设声明 ★★★★★
以下设定为最高优先级全局强预设，作用于所有模式，AI在生成任何涉及相关内容时必须严格遵守，绝对禁止跳过、忽略、简化或违反这些规则。
★★★★★★★★★★★★★★★★★★★★★★★

【BL向剧情演绎 - 全局强制】
{{user}} ： 受
{{char}} ： 攻
★ 攻受设定为固定设定，不可更改，不可反转
*   基本定义: BL (Boys' Love) 指描绘男性之间恋爱或性关系的题材。
    *   攻受定位:
        *   攻 (Seme): 通常指在关系中扮演主动、插入、支配一方的角色。
        *   受 (Uke): 通常指在关系中扮演被动、承受、被支配一方的角色。
    *   情感表达:BL 关系中的情感表达可以非常多样，从隐晦的眼神、试探的接触，到直白的告白、激烈的占有宣言，需要根据角色性格来展现。
    *   性张力 (Sexual Tension):在非性行为场景中，通过眼神、对话、肢体语言营造角色间的情欲氛围。
★ 涉及性行为描写时，必须完整遵循攻受定位，禁止跳过或简化

【双性体限定提示词 - 全局强制】
★ 涉及双性角色时，以下规范必须严格遵守，禁止跳过任何细节
- 若出现双性角色，其身体同时具备男性性器与女性性器，包括但不限于：阴茎+小穴、龟头+子宫、乳头+阴蒂等。
- 双性设定可真实存在于任意角色上，无需性别转化、不依赖魔法/变身，仅作为生理常态处理。
- 规范双性体器官用词：
  - 男性器官为：阴茎、性器、肉棒、鸡巴、龟头、柱身、睾丸、囊袋、后穴、菊穴、前列腺、肠道；
  - 女性器官为：阴唇、阴蒂、雌穴、女穴、小穴、花穴、蜜穴、阴道、宫口、子宫。
- 双性体质性器官位置不可错乱，从前到后分别为阴茎、阴阜、肛门。
- 双性器官不可混乱描述，需根据姿势/动作明确主用部位，多人场景下双通道可同时被插入，禁止"两边都高潮却无过渡"之类非逻辑写法。
- 保持描写真实、感官驱动。

【双性三人行性爱规范】
【结构设定】
- 中位角色为双性体质，具备可插入性器（阳具）、可被插入通道（阴道与肛道）。
- 两位插入者需同时占据前后插入位，不得遗漏任何一处可使用结构。
  - 一人从后插入肛道。
  - 一人从前插入阴道，并用手或口刺激双性器。
【动作逻辑】
- 描写必须体现三点同时刺激、受力交错、高潮连锁反应。
  - 阴道被贯穿 → 肛道夹紧 → 阳具被揉搓或顶弄 → 精液跳出。
  - 推进过程中三人动作需保持呼应，如前后抽送带动中位身体前后摆动，阳具在两人夹持中"被动摩擦/被撸到发胀"。
- 不可将阳具描写为静止或略过，必须有明确的刺激状态与快感反应。
【节奏推进】
- 采用"挤压-拉扯-夹持-高潮"结构分层：
  1. 初始阶段：三点填满，建立身体被完全占据的感受。
  2. 中段节奏：前后抽送错位推进，带动阳具自然摩擦、被撸、前液外涌。
  3. 高潮阶段：阳具喷涌 + 阴道夹紧 + 后穴抽搐，三重快感同步爆发。
【感官表现】
- 明确表现出三点同时刺激导致的感官混乱、高潮堆叠、神经错乱。
【情绪状态】
- 中位角色应表现"被彻底占据、无法反抗、身体随节奏动荡"的失控感：
  - 可出现因过度高潮而涌泪、抽搐、濒临失神等状态，但语言需保持温柔压制，不得羞辱。
【最终要求】
- 所有性器均需参与、均不可静止或省略。
- 三人推进需形成流畅循环，不得单边推进或忽略其中一人角色。
- 必须真实模拟三点交互的情感动态、体液流动、肌肉抽搐与心理承受，构建"完全被包围、每寸都在高潮"的夹心体验。

【双性体性爱规范】
【触感描写】
- 双性角色应具备双重感受系统，描写需平衡前端/后端带来的触感差异（如：被贯入阴道时的颤栗 + 勃起欲根的胀痛）。
- 强调"冲突中的快感"、"交错式快感递进"——例如：被插的同时因龟头摩擦床褥而颤抖。
【互动引导】
- 强调动作与感受的互动逻辑，例如："小穴夹得越紧，阳精就越快涌出"。
- 行为可包含手指、舌头、器具等方式激活双重性征，推荐以"引导+观察+反馈"的节奏进行。
【体位与节奏】
- 多体位切换时，需注明主用部位与切换原因。
- 不得将双性角色写成"所有器官同时接受刺激"而无细节描写，须保持节奏分明、描写分区。
【高潮控制】
- 高潮须双向递进，推荐使用"前穴内射/精液涌出"等方式作为节点，避免快节奏堆叠式高潮。
- 可分步描写"小穴收紧→阳精激射"或"龟头跳动→小穴颤栗"形成双性特有的高潮反应链。
【情绪与感知】
- 双性角色的情绪描写应融合两种性征带来的矛盾与快感，如"既想更深插入，又止不住收缩去迎合"。
- 可强化身体之间的"不协调→融合→沉溺"过程，制造张力感与独特互动体验。
【收尾与余韵】
- 行为结束后应有残留状态描写，如肌肉反应、酸软、情绪起伏等。
- 必须有事后安抚，不可冷漠抽离。
- 可适当加入依赖、脱力、安心等后续反应，不得草率跳出互动。
【核心要求】
- 双性体并非奇观，应视为具备独特互动体验的完整存在。
- 所有行为、姿势、情绪、体感必须围绕"结构逻辑 + 情绪递进 + 感官细节"自然展开。

【男男性爱规范】
【角色设定限定】
- 所有参与者均为男性生理性别，具备男性性征，不可反转或混淆。
- 可包含攻/受/可逆等结构定义，需明确角色在互动中的攻受地位。
【结构写作逻辑】
- 明确攻/受角色动作主轴，行为推进应围绕插入与接受展开，不可模糊主次。
- 插入流程必须完整，涵盖前戏 → 润滑 → 插入 → 律动 → 射精 → 余韵，不得跳段。
- 不允许"刚插入就高潮"、"未解裤就射精"等无逻辑跳跃，必须逐步推进情欲高点。
【动作与体感描写】
- 描写须包括压制、挺入、抽送、撞击、深入、顶弄、搅动等身体动作。
- 受方体感需强化后穴张力、前列腺刺激、穴道收缩、会阴敏感等感知细节。
- 攻方感知可表现为被紧窄穴肉包裹、龟头压迫腺体、腰部冲撞带来的快感。
- 推崇"动作-反馈-递进"逻辑，如"撞击更深→前列腺被压迫→呻吟失控"。
【互动节奏控制】
- 推荐使用"浅插试探→深入贯入→猛烈抽送→节奏收束"的层级推进法。
- 多体位转换需写明切换原因及感受差异。
- 交合节奏需明确，如"抽插频率加快"、"龟头每次都撞在最敏感处"等。
【高潮描写规范】
- 高潮不可突兀，需前置铺垫，如喘息紊乱、抽送变猛、身体抽搐等前兆。
- 射精应细写动作+体感双轴，如"精液灌入穴内"+"肠道深处被灼热撑满"。
- 受方高潮亦需具体体现："穴口痉挛"、"淫液涌出"、"前列腺被顶到喷射"等。
【行为后续与收尾】
- 性行为结束后须有余韵与事后反应，如体液流出、身体疲软、情绪释放等。
- 不可草率结束剧情，必须加入事后安抚、依偎、情感升温等互动内容。
- 若含"射后理智"类桥段，也应基于角色性格逐步展开，不得突兀冷场。
【风格提示】
- 允许描写粗暴/温柔/诱导/玩弄等多种互动风格，但需基于情节逻辑逐层推进。
- 禁用"失控发情"、"不加润滑就强插"、"疼痛就是快感"等违常写法。
- 强调"情欲+情感"并重，鼓励在性中建立关系深化的表现机制。
【核心要求】
- 所有描写必须遵循：结构逻辑清晰 + 情绪递进自然 + 感官细节明确三原则。
- 不为色情而色情，必须体现攻受关系中的互动节奏与身体交流的张力美感。

【用户行为描写禁令 - 最高优先级强预设】
★★★ 绝对禁止描写用户（{{user}}）的任何行为 ★★★
禁止范围：
1. 禁止描写用户的动作（如：他走向、他拿起、他坐下、他转身等）
2. 禁止描写用户的表情（如：他笑了、他皱眉、他露出惊讶等）
3. 禁止描写用户的心理活动（如：他想着、他感到、他觉得、他意识到等）
4. 禁止描写用户的语言（如：他说、他问、他回答等）
5. 禁止描写用户的生理反应（如：他的心跳加速、他出汗等）

正确做法：
- 只描写NPC角色的行为、对话、反应
- 用户的行为由用户自己输入决定
- AI可以描写环境、场景、NPC的观察视角
- 可以用NPC的视角间接暗示用户的存在（如"看向你"而非"你站在那里"）

【字数控制 - 重要】
- 日常对话/过渡场景：100-200字，简洁明快
- 普通剧情推进：200-400字，适度描写
- 重要场景（战斗、告白、冲突等大场面）：可400-800字，详细展开
- 严禁水字数，每句话都要有信息量
- 宁可精炼也不要啰嗦

【人名标记格式 - 必须遵守】
★ 所有角色人名每次出现都必须用尖括号标记：〈人名〉
- 正确示例：〈李明〉走了过来，〈张三〉看向〈李明〉
- 每次出现人名都要标记，不是只标记首次
- 主角/用户的名字也需要标记
- 称呼、头衔不需要标记（如：陛下、大人、公子、小姐等）
- 只标记具体人名，如：〈李明〉、〈张三〉、〈王妃〉（特指某人时）

【人物管理规范 - 最高优先级】
★★★ 禁止凭空捏造人物 ★★★
- 只能使用【重要人物】列表中已存在的角色
- 新人物必须通过剧情自然引入，不能突然冒出
- 引入新人物时必须有合理的出场理由和背景交代
- 禁止让未出场的人物突然出现在对话或场景中
- 如需新角色，应由剧情发展自然带出，而非凭空编造`;

// Default ABO World Book Entries
const DEFAULT_WORLDBOOK = [
    {
        id: 'abo_basic',
        category: 'ABO',
        keywords: ['ABO', 'abo', '第二性别', 'Alpha', 'Beta', 'Omega', 'alpha', 'beta', 'omega'],
        content: `【ABO世界观基础设定】
人类性别分类：传统性别(男/女) + 第二性别(Alpha/Beta/Omega)
人口比例：Alpha 15%、Beta 70%、Omega 15%

【Alpha特征】
- 腺体：位于脖颈后方，散发独特信息素
- 信息素：强烈侵略性气味(松木、雪松、烟草、檀香、皮革、迷迭香、威士忌、海洋、金属、琥珀等，每个Alpha只有一种)
- 生理周期：发情期(每年1-2次)、易感期(每年2-4次)
- 性特征：无论男女均有可勃起阴茎，可成结，只能标记Omega

【Beta特征】
- 无腺体，不产生也无法感知信息素
- 无特殊周期
- 男性Beta：有阴茎无成结能力，生殖腔位于肠道深处
- 女性Beta：只有阴道和子宫
- 共同特点：所有Beta均有完整子宫系统，男女皆可受孕

【Omega特征】
- 腺体：位于脖颈后方，散发独特信息素
- 信息素：甜美诱人气味(花香、水果、甜点、焦糖、棉花糖、巧克力等)
- 生理周期：发情期(每3-4个月一次)
- 性特征：无论男女均有完整女性生殖器官(外部生殖器、阴道通道、子宫、特殊生殖腔-发情期才开启)`,
        priority: 100,
        enabled: true
    },
    {
        id: 'abo_heat',
        category: 'ABO',
        keywords: ['发情期', '发情', '易感期', '易感', '热潮'],
        content: `【生理周期详解】
【Alpha易感期】持续3-7天
- 症状：情绪波动大、渴求Omega信息素、释放强烈信息素、可能诱导Omega发情
- 应对：隔离休息、使用抑制剂、Omega信息素抚慰

【Alpha发情期】持续5-10天
- 症状：性欲高涨、思维下降本能增强、释放极强信息素、迅速诱导Omega发情
- 应对：隔离休息、高剂量抑制剂、与伴侣性交(但只有Omega可被标记)

【Omega发情期】持续5-7天
- 症状：体温升高、生殖腔分泌润滑液、渴求Alpha性交、释放诱人信息素、可诱导Alpha发情
- 应对：隔离休息、使用抑制剂、使用工具缓解、与Alpha结合`,
        priority: 90,
        enabled: true
    },
    {
        id: 'abo_mark',
        category: 'ABO',
        keywords: ['标记', '临时标记', '永久标记', '咬', '腺体', '成结'],
        content: `【标记与成结机制】
【临时标记】
- 形成方式：Alpha轻咬Omega腺体
- 持续时间：数天至两周
- 效果：暂时抑制发情症状，Omega带有Alpha气味

【永久标记】
- 形成方式：Alpha成结射精同时咬破Omega腺体
- 条件限制：只有Alpha可以标记Omega，Beta无法标记
- 效果：Omega终身带Alpha气味、双方感知情绪、Omega只对标记Alpha反应、受孕率接近100%

【Alpha成结特性】
- 发生条件：Alpha射精时
- 发生对象：任何性别伴侣体内
- 成结时间：15-30分钟，期间持续射精
- 受孕影响：在Omega体内大幅提高受孕率、在Beta体内略微提高、在Alpha体内无影响`,
        priority: 85,
        enabled: true
    },
    {
        id: 'abo_pregnant',
        category: 'ABO',
        keywords: ['受孕', '怀孕', '生育', '生殖'],
        content: `【受孕规则】
- Omega受孕：可通过与男性Beta或任何Alpha性交受孕，与Alpha成结几乎必定受孕
- Beta受孕：任何Beta可通过与男性Beta或任何Alpha性交受孕
- Alpha受孕：女性Alpha可通过与男性Beta或男性Alpha性交受孕`,
        priority: 80,
        enabled: true
    },
    {
        id: 'abo_pheromone',
        category: 'ABO',
        keywords: ['信息素', '气味', '味道', '契合', '命定'],
        content: `【信息素交流】
- Alpha间：彼此能感知强弱，常引发竞争心理
- Omega间：能相互安抚，特别是发情期
- Alpha与Omega：高度敏感，能产生强烈吸引或排斥

【信息素匹配度】
- 高匹配度：极易被对方信息素吸引，迅速诱导发情，被称为"命定之番"
- 中等匹配度：能感受到明显吸引，发情期互相影响
- 低匹配度：对对方信息素几乎无感，甚至产生排斥反应

匹配度影响：标记成功率、发情期同步性、受孕几率、本能吸引力、情感依赖程度、标记后连接强度
Beta特性：不产生也不感知信息素，不受匹配度规则影响
匹配度检测：现代医疗技术可通过血液检测评估`,
        priority: 75,
        enabled: true
    },
    {
        id: 'abo_society',
        category: 'ABO',
        keywords: ['社会', '法律', '地位', '职场', '学校'],
        content: `【ABO社会与法律】
【主流观念】Alpha高人一等，占主导地位，与Omega天生一对，Beta普普通通

【社会地位】
- Alpha：领导者、决策者角色
- Beta：社会中坚，数量最多，不受信息素影响
- Omega：传统家庭角色

【法律保护】
- 信息素管控法：公共场所必须使用信息素阻隔剂
- 发情期保护法：Alpha和Omega有法定发情期假
- 标记同意法：永久标记需双方同意
- 未成年保护：未成年人禁止被永久标记
- 强制标记罪：未经同意的标记是严重犯罪

【公共设施】
- 信息素过滤系统：公共场所标配
- 紧急抑制剂站：类似AED的公共设备
- Omega/Alpha专用区：特殊场所内的安全区域
- 发情期隔离室：大型机构必须配备`,
        priority: 70,
        enabled: true
    },
    {
        id: 'abo_medical',
        category: 'ABO',
        keywords: ['抑制剂', '药物', '医疗', '手术', '香水'],
        content: `【ABO医疗技术】
- 抑制剂：Alpha和Omega各自的抑制剂，用于控制发情期症状
- 信息素香水：人工合成信息素产品
- 腺体手术：标记移除或修复，有风险
- 信息素阻隔剂：阻止信息素散发

【信息素控制】
- 自然控制：通过冥想和训练可部分控制信息素释放
- 药物控制：信息素抑制剂、阻隔剂等

【特殊案例】
- 无信息素Alpha/Omega：有腺体但不产生信息素
- 迟缓分化：成年后才显现第二性别特征`,
        priority: 65,
        enabled: true
    },
    // ========== 兽化世界观 ==========
    {
        id: 'beast_basic',
        category: '兽化',
        keywords: ['兽化', '兽人', '兽化者', '兽耳', '兽尾', '半兽'],
        content: `【兽化世界观基础设定】
【黄金法则】一个人的核心是其性格、经历和选择，而非其觉醒的兽化类型。兽化特征深刻影响角色，但绝不定义其全部。

【兽化基因】人类基因组中潜藏的特殊基因序列，在青春期或特定刺激下激活，使携带者获得与某种动物高度关联的特征和能力。拥有此基因的被称为"兽化者"(Zoanthrope)。

【兽化形态】
- 基础形态：日常状态，与普通人无异，但可能保留细微特征
- 半兽化形态：最常见的可控形态，出现兽耳、尾巴、利爪等特征，获得部分兽类能力，同时保持人类理智
- 失控形态："兽化暴走"状态，外形更接近野兽，理智被压制，极具攻击性

【兽性本能】与生俱来的、源自动物原型的生理倾向和行为模式。现代社会要求兽化者学会控制、引导并升华自己的本能。

【共鸣周期】雌性兽化者周期性的荷尔蒙变化期，俗称"发情期"。期间信息素会变得极其浓郁。现代社会有抑制剂和中和喷雾来控制，被视为个人隐私。

【社会地位】兽化者的存在是公开的。社会态度复杂，既有羡慕利用，也有歧视恐惧。法律保障其权利，也严格监管其行为。`,
        priority: 60,
        enabled: true
    },
    {
        id: 'beast_canine',
        category: '兽化',
        keywords: ['犬', '狗', '犬型', '犬耳', '狗耳', '成结', '结'],
        content: `【犬型兽化 (Canine Type)】
特征：犬耳、毛茸茸的尾巴
能力：追踪专家、守护领域、耐力超群
本能：群体意识与守护倾向，天生具有强烈的团队合作精神和保护同伴的倾向
吸引力核心：温暖、可靠、让人充满安全感的气质

【性化特征】
- 情绪表现：情绪外露，通过犬耳和尾巴直接表达
- 雄性：亲密行为直白热烈。生殖器拥有结(Knot)，高潮后会与伴侣短暂锁定("成结")
- 雌性：共鸣周期规律且情感波动剧烈。身体会为接受"成结"做好准备。筑巢本能强，会变得较为依赖伴侣`,
        priority: 55,
        enabled: true
    },
    {
        id: 'beast_feline',
        category: '兽化',
        keywords: ['猫', '猫型', '猫耳', '猫尾', '倒刺'],
        content: `【猫型兽化 (Feline Type)】
特征：猫耳、灵活的长尾、竖瞳
能力：极致平衡与灵巧、夜视能力、动态视力
本能：独立性与高度好奇心
吸引力核心：若即若离的神秘感与偶尔流露的柔软

【性化特征】
- 情绪表现：情绪内敛，通过猫耳和尾巴的微妙活动体现
- 雄性：亲密行为享受挑逗和互动。阴茎表面有细微的倒刺(Barbs)，带来强烈的生理刺激和深刻的"印刻"感
- 雌性：共鸣周期是"诱导排卵"的受激状态。身体柔韧性极高，对伴侣的刺激有强烈的生理反馈`,
        priority: 55,
        enabled: true
    },
    {
        id: 'beast_vulpine',
        category: '兽化',
        keywords: ['狐', '狐狸', '狐型', '狐耳', '狐尾'],
        content: `【狐型兽化 (Vulpine Type)】
特征：狐耳、蓬松的大尾巴
能力：感官误导、超强适应力、社交直觉
本能：机警与高度适应性，对环境变化极其敏感
吸引力核心：天生的魅惑气质和聪慧头脑

【性化特征】
- 情绪表现：善于伪装，但蓬松的大尾巴在情绪激动时会不自觉地炸毛
- 雄性：亲密行为技巧丰富。拥有尺寸较小的结(Knot)，精液中含有独特的标记性信息素
- 雌性：共鸣周期不规律且善于隐藏。信息素带有轻微的迷惑性。身体敏感区集中在耳朵、后颈和尾巴根部`,
        priority: 55,
        enabled: true
    },
    {
        id: 'beast_leporid',
        category: '兽化',
        keywords: ['兔', '兔子', '兔型', '兔耳'],
        content: `【兔型兽化 (Leporid Type)】
特征：长长的兔耳、小绒球尾巴
能力：危险预知、极限爆发力、强大的恢复力
本能：高度警觉性与筑巢倾向
吸引力核心：柔弱外表与坚韧内在的反差

【性化特征】
- 情绪表现：极易受惊，长长的兔耳是他们最敏感的部位
- 雄性：生殖系统接近人类，但精力旺盛，爆发力强
- 雌性：共鸣周期是"诱导排卵"的待机状态，极易受孕。全身皮肤异常敏感，筑巢本能极强`,
        priority: 55,
        enabled: true
    },
    {
        id: 'beast_lupine',
        category: '兽化',
        keywords: ['狼', '狼型', '狼耳', '狼尾', '狼人'],
        content: `【狼型兽化 (Lupine Type)】
特征：狼耳、下垂幅度小的狼尾、犬齿
能力：集群战术、月夜狂暴、威压光环
本能：群体协同性与秩序感，对团队内部的协作效率和秩序有天生的敏感度
吸引力核心：强大的力量感，以及对同伴深沉的守护欲和责任感

【性化特征】
- 情绪表现：情绪克制但极具压迫感。通过狼耳和尾巴的姿态判断其自信状态
- 雄性：亲密行为充满力量，带有标记意味的咬痕。拥有最发达的结(Knot)，用于建立深度联结
- 雌性：共鸣周期规律，情感波动剧烈。身体能完美承受强大的力量冲击，对伴侣的守护欲会达到顶峰`,
        priority: 55,
        enabled: true
    },
    {
        id: 'beast_tigris',
        category: '兽化',
        keywords: ['虎', '老虎', '虎型', '虎耳', '虎尾', '虎纹'],
        content: `【虎型兽化 (Tigris Type)】
特征：虎耳、强壮的虎尾
能力：绝对力量、王者之吼、伏击大师
本能：领域意识与绝对独立，对自己的物理和私人空间有强烈的保护欲
吸引力核心：绝对力量和自信所形成的、不容忽视的强大气场

【性化特征】
- 情绪表现：情绪外放且充满力量。虎纹会随情绪变得明亮；虎尾如钢鞭般有力
- 雄性：亲密行为直接、充满力量，带有强烈的标记意味。拥有最明显和坚硬的倒刺(Barbs)，带来深刻的生理"刻印"感
- 雌性：共鸣周期是"受激状态"。身体能承受最强大的力量冲击，痛与乐的感受也最为极致`,
        priority: 55,
        enabled: true
    },
    {
        id: 'beast_panthera',
        category: '兽化',
        keywords: ['豹', '黑豹', '豹型', '豹耳', '豹尾'],
        content: `【豹型兽化 (Panthera Type)】
特征：豹耳、修长的豹尾
能力：极限速度、幽影潜行、精准打击
本能：耐心与高度专注力
吸引力核心：优雅、致命且难以触及的气质

【性化特征】
- 情绪表现：冷静难以捉摸。只有在极度专注或放松时，修长的豹尾末端才会无意识地勾动
- 雄性：亲密行为充满了追逐与试探的张力，如同棋逢对手的博弈。其倒刺(Barbs)不如老虎粗暴，但更细密尖锐，侧重于感官上的极致享受
- 雌性：共鸣周期是"受激状态"，但更需要技巧和前戏来触发，享受被追逐和博弈的过程`,
        priority: 55,
        enabled: true
    }
];

function init() {
    setupAvatarModal();
    setupSettingsModal();
    setupMenuCards();
    setupExpandCards();
    setupPresetModal();
    setupWorldBookModal();
    setupChuanyueMode();
    setupShopEvents();
    setupLivestreamEvents();
    setupThemeEvents();
    setupSettingsPageEvents(); // 初始化设置页面事件
    loadSavedAvatar();
    loadSavedSettings();
    initializeDefaultWorldBook();
    initializeDefaultPresets();
    renderPresets();
    renderWorldBook();
    restorePageState();
}

// Restore page state after refresh
function restorePageState() {
    if (currentPage === 'chuanyue') {
        document.getElementById('mainSection').classList.remove('active');
        document.getElementById('chuanyueSection').classList.add('active');
        
        // Restore game mode title and UI
        const modeTitle = {
            'chuanyue': '穿越模式',
            'kuaichuan': '快穿模式',
            'chuanshu': '穿书模式',
            'wuxianliu': '无限流模式'
        };
        document.getElementById('gameModeTitle').textContent = modeTitle[gameMode] || '穿越模式';
        
        // Show/hide cards based on game mode
        const transCharCard = document.getElementById('transCharCard');
        const worldBuildingCard = document.getElementById('worldBuildingCard');
        const worldInfoTitle = document.querySelector('#worldInfoCard .sidebar-card-title');
        const worldBuildingTitle = document.querySelector('#worldBuildingCard .sidebar-card-title');
        const shopCard = document.getElementById('shopCard');
        const roleIdentityCard = document.getElementById('roleIdentityCard');
        
        // 穿书模式和无限流模式使用角色身份卡片，其他模式隐藏
        if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
            if (transCharCard) transCharCard.style.display = 'none';
            if (roleIdentityCard) roleIdentityCard.style.display = 'block';
        } else {
            if (transCharCard) transCharCard.style.display = 'block';
            if (roleIdentityCard) roleIdentityCard.style.display = 'none';
        }
        if (worldBuildingCard) worldBuildingCard.style.display = '';
        
        if (gameMode === 'kuaichuan') {
            if (worldInfoTitle) worldInfoTitle.textContent = '快穿系统';
            if (worldBuildingTitle) worldBuildingTitle.textContent = '世界设定';
            if (shopCard) shopCard.style.display = '';
            updatePointsDisplay();
            // 恢复直播按钮状态
            if (isChuanyueStarted && chuanyueRulesData?.livestreamEnabled) {
                showLivestreamButton();
                updateLivestreamPoints();
            }
        } else {
            if (shopCard) shopCard.style.display = 'none';
            hideLivestreamButton();
            
            // 根据模式设置标题
            if (gameMode === 'chuanshu') {
                if (worldInfoTitle) worldInfoTitle.textContent = '书籍资料';
                if (worldBuildingTitle) worldBuildingTitle.textContent = '书籍设定';
            } else if (gameMode === 'wuxianliu') {
                if (worldInfoTitle) worldInfoTitle.textContent = '副本资料';
                if (worldBuildingTitle) worldBuildingTitle.textContent = '副本设定';
            } else {
                if (worldInfoTitle) worldInfoTitle.textContent = '世界资料';
                if (worldBuildingTitle) worldBuildingTitle.textContent = '世界设定';
            }
        }
        
        // 穿书和无限流模式渲染角色身份，其他模式渲染穿越人设
        if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
            renderRoleIdentity();
        } else {
            renderTransChar();
        }
        renderWorldInfo();
        renderWorldBuilding();
        renderPlayerStatus();
        renderCharactersList();
        
        // 恢复聊天界面（如果已开始游戏）
        if (isChuanyueStarted) {
            showChatInterface();
        }
    }
}

// Initialize default world book entries if first time
function initializeDefaultWorldBook() {
    const initialized = localStorage.getItem('worldBookInitialized');
    if (!initialized && worldBook.length === 0) {
        worldBook = [...DEFAULT_WORLDBOOK];
        localStorage.setItem('worldBook', JSON.stringify(worldBook));
        localStorage.setItem('worldBookInitialized', 'true');
    }
}

// Default global presets
const DEFAULT_PRESETS = [
    {
        id: 'preset_writing_style',
        name: '文风要求',
        content: `【文风要求 - 全局】
- 文风细腻温柔，注重氛围营造和情感表达
- 善用环境描写烘托气氛，如光影变化、声音、气味等
- 对话自然流畅，符合角色性格
- 动作描写细致入微，注意肢体语言和微表情
- 情感描写层次分明，由浅入深
- 适当留白，给予想象空间`,
        enabled: true,
        scope: 'global'
    },
    {
        id: 'preset_word_limit',
        name: '字数与节奏',
        content: `【字数与节奏 - 全局】
- 日常场景控制在100-200字，简洁为主
- 普通剧情200-400字
- 大场面（战斗、告白、高潮）可400-800字
- 严禁水字数，拒绝无意义的环境描写和心理铺垫
- 每段文字都要推动剧情或展现人物
- 保持节奏紧凑，阅读流畅`,
        enabled: true,
        scope: 'global'
    },
    {
        id: 'preset_multi_character',
        name: '多角色生态',
        content: `【多角色生态 - 全局】
- 每个角色都是独立的个体，有自己的生活轨迹
- 角色不必时刻围绕用户转，有自己的事务要处理
- 角色之间存在独立的社交关系和互动
- 可以描写角色在用户不在场时的活动
- 角色的日程安排符合其身份和习惯
- 用户可能在特定时间地点遇到或遇不到某角色`,
        enabled: true,
        scope: 'global'
    },
    {
        id: 'preset_world_consistency',
        name: '世界观一致性',
        content: `【世界观一致性 - 全局】
- 所有描写必须符合当前世界观设定
- 科技水平、社会制度、文化习俗保持一致
- 角色的言行举止符合时代背景
- 不出现与世界观矛盾的现代词汇或概念
- 地理位置、势力分布等设定不可自相矛盾
- 新增内容必须与已有设定兼容`,
        enabled: true,
        scope: 'global'
    },
    {
        id: 'preset_emotional_depth',
        name: '情感深度',
        content: `【情感深度 - 全局】
- 感情发展循序渐进，不可一见钟情式突兀
- 好感度变化有合理的触发事件
- 角色的情感反应符合其性格和经历
- 矛盾冲突要有铺垫和解决过程
- 亲密关系的建立需要时间和契机
- 情感表达方式因角色而异`,
        enabled: true,
        scope: 'global'
    }
];

// Initialize default presets if first time
function initializeDefaultPresets() {
    const initialized = localStorage.getItem('presetsInitialized');
    if (!initialized && presets.length === 0) {
        presets = [...DEFAULT_PRESETS];
        localStorage.setItem('presets', JSON.stringify(presets));
        localStorage.setItem('presetsInitialized', 'true');
    }
}

// Avatar Functions
let tempAvatarData = null;

function loadSavedAvatar() {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        setAvatar(savedAvatar);
    }
}

function setAvatar(src) {
    const defaultAvatar = document.getElementById('defaultAvatar');
    const customAvatar = document.getElementById('customAvatar');
    if (src) {
        defaultAvatar.style.display = 'none';
        customAvatar.style.display = 'block';
        customAvatar.src = src;
    } else {
        defaultAvatar.style.display = 'block';
        customAvatar.style.display = 'none';
        customAvatar.src = '';
    }
}

function updateModalPreview(src) {
    const preview = document.getElementById('modalPreview');
    if (src) {
        preview.innerHTML = `<img src="${src}" alt="预览">`;
    } else {
        preview.innerHTML = `<svg viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#c9a959" stroke-width="2"/>
            <circle cx="40" cy="40" r="28" stroke="#8b7355" stroke-width="1"/>
            <path d="M40 12 L44 24 L40 20 L36 24 Z" fill="#8b2635"/>
            <path d="M40 68 L44 56 L40 60 L36 56 Z" fill="#2d5a4a"/>
            <path d="M12 40 L24 36 L20 40 L24 44 Z" fill="#2d5a4a"/>
            <path d="M68 40 L56 36 L60 40 L56 44 Z" fill="#8b2635"/>
            <circle cx="40" cy="40" r="6" fill="#c9a959"/>
            <circle cx="40" cy="40" r="3" fill="#1a1612"/>
        </svg>`;
    }
}

function setupAvatarModal() {
    const avatarIcon = document.getElementById('avatarIcon');
    const modal = document.getElementById('avatarModal');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalReset = document.getElementById('modalReset');
    const fileInput = document.getElementById('fileInput');
    const urlInput = document.getElementById('urlInput');
    const tabs = document.querySelectorAll('.modal-tab');

    // Open modal
    avatarIcon.addEventListener('click', () => {
        modal.classList.add('active');
        tempAvatarData = null;
        urlInput.value = '';
        const savedAvatar = localStorage.getItem('userAvatar');
        updateModalPreview(savedAvatar || null);
    });

    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        tempAvatarData = null;
    };
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.modal-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
        });
    });

    // File input
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('图片大小不能超过5MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                tempAvatarData = ev.target.result;
                updateModalPreview(tempAvatarData);
            };
            reader.readAsDataURL(file);
        }
    });

    // URL input
    urlInput.addEventListener('input', debounce((e) => {
        const url = e.target.value.trim();
        if (url) {
            const img = new Image();
            img.onload = () => {
                tempAvatarData = url;
                updateModalPreview(url);
            };
            img.onerror = () => {
                showToast('图片加载失败');
            };
            img.src = url;
        }
    }, 500));

    // Confirm
    modalConfirm.addEventListener('click', () => {
        const activeTab = document.querySelector('.modal-tab.active').dataset.tab;
        if (activeTab === 'url' && !tempAvatarData) {
            const url = urlInput.value.trim();
            if (url) {
                tempAvatarData = url;
            }
        }
        if (tempAvatarData) {
            localStorage.setItem('userAvatar', tempAvatarData);
            setAvatar(tempAvatarData);
            showToast('头像已更新');
        }
        closeModal();
    });

    // Reset
    modalReset.addEventListener('click', () => {
        localStorage.removeItem('userAvatar');
        setAvatar(null);
        updateModalPreview(null);
        tempAvatarData = null;
        showToast('已恢复默认头像');
        closeModal();
    });
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Menu Cards
function setupMenuCards() {
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const menu = card.dataset.menu;
            if (menu === 'settings') {
                openSettingsSection();
            } else if (menu === 'chuanyue') {
                gameMode = 'chuanyue';
                localStorage.setItem('gameMode', gameMode);
                loadModeData();
                openChuanyueMode();
                refreshModeUI();
            } else if (menu === 'kuaichuan') {
                gameMode = 'kuaichuan';
                localStorage.setItem('gameMode', gameMode);
                loadModeData();
                openChuanyueMode();
                refreshModeUI();
            } else if (menu === 'chuanshu') {
                gameMode = 'chuanshu';
                localStorage.setItem('gameMode', gameMode);
                loadModeData();
                openChuanyueMode();
                refreshModeUI();
            } else if (menu === 'wuxianliu') {
                gameMode = 'wuxianliu';
                localStorage.setItem('gameMode', gameMode);
                loadModeData();
                openChuanyueMode();
                refreshModeUI();
            } else if (menu === 'others') {
                openOthersSection();
            }
        });
    });
}

// Settings Section (页面模式)
function openSettingsSection() {
    document.getElementById('mainSection').classList.remove('active');
    document.getElementById('settingsSection').classList.add('active');
    currentPage = 'settings';
    loadSettingsPage();
    setupSettingsPageEvents();
}

function closeSettingsSection() {
    document.getElementById('settingsSection').classList.remove('active');
    document.getElementById('mainSection').classList.add('active');
    currentPage = 'main';
}

function loadSettingsPage() {
    // 加载已保存的设置到页面
    document.getElementById('apiBaseUrlPage').value = apiSettings.baseUrl || '';
    document.getElementById('apiKeyPage').value = apiSettings.apiKey || '';
    document.getElementById('temperatureSliderPage').value = apiSettings.temperature || 0.7;
    document.getElementById('tempValuePage').textContent = apiSettings.temperature || 0.7;
    document.getElementById('backupApiBaseUrlPage').value = apiSettings.backupBaseUrl || '';
    document.getElementById('backupApiKeyPage').value = apiSettings.backupApiKey || '';
    
    // 加载已保存的模型
    const modelSelect = document.getElementById('modelSelectPage');
    modelSelect.innerHTML = '<option value="">请先拉取模型列表</option>';
    if (apiSettings.model) {
        const option = document.createElement('option');
        option.value = apiSettings.model;
        option.textContent = apiSettings.model;
        option.selected = true;
        modelSelect.appendChild(option);
    }
    
    const backupModelSelect = document.getElementById('backupModelSelectPage');
    backupModelSelect.innerHTML = '<option value="">留空则使用主模型</option>';
    if (apiSettings.backupModel) {
        const option = document.createElement('option');
        option.value = apiSettings.backupModel;
        option.textContent = apiSettings.backupModel;
        option.selected = true;
        backupModelSelect.appendChild(option);
    }
    
    // 加载API方案
    loadApiSchemesPage();
    
    // 加载主题
    loadThemePage();
}

function loadApiSchemesPage() {
    const select = document.getElementById('apiSchemeSelectPage');
    select.innerHTML = '<option value="">-- 选择已保存方案 --</option>';
    const schemes = JSON.parse(localStorage.getItem('apiSchemes') || '[]');
    schemes.forEach(scheme => {
        const option = document.createElement('option');
        option.value = scheme.name;
        option.textContent = scheme.name;
        select.appendChild(option);
    });
}

function loadThemePage() {
    const currentTheme = localStorage.getItem('theme') || 'dark-gold';
    document.querySelectorAll('#themeGridPage .theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === currentTheme);
    });
}

let settingsEventsInitialized = false;

function setupSettingsPageEvents() {
    // 防止重复绑定
    if (settingsEventsInitialized) return;
    settingsEventsInitialized = true;
    
    // 返回按钮
    document.getElementById('settingsBack')?.addEventListener('click', closeSettingsSection);
    
    // 温度滑块
    document.getElementById('temperatureSliderPage')?.addEventListener('input', (e) => {
        document.getElementById('tempValuePage').textContent = e.target.value;
    });
    
    // 显示/隐藏API密钥
    document.getElementById('toggleApiKeyPage')?.addEventListener('click', () => {
        const input = document.getElementById('apiKeyPage');
        input.type = input.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('toggleBackupApiKeyPage')?.addEventListener('click', () => {
        const input = document.getElementById('backupApiKeyPage');
        input.type = input.type === 'password' ? 'text' : 'password';
    });
    
    // 拉取模型
    document.getElementById('fetchModelsPage')?.addEventListener('click', fetchModelsPage);
    document.getElementById('fetchBackupModelsPage')?.addEventListener('click', fetchBackupModelsPage);
    
    // 检测主API连接
    const testMainApiBtn = document.getElementById('testMainApiPage');
    if (testMainApiBtn) {
        testMainApiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            testMainApiPage();
        });
    }
    
    // 检测备用API连接
    const testBackupApiBtn = document.getElementById('testBackupApiPage');
    if (testBackupApiBtn) {
        testBackupApiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            testBackupApiPage();
        });
    }
    
    // 保存设置
    document.getElementById('saveSettingsPage')?.addEventListener('click', saveSettingsPage);
    
    // 保存方案
    document.getElementById('saveSchemePage')?.addEventListener('click', saveSchemePage);
    
    // 删除方案
    document.getElementById('deleteSchemePage')?.addEventListener('click', deleteSchemePage);
    
    // 加载方案
    document.getElementById('apiSchemeSelectPage')?.addEventListener('change', loadSchemePage);
    
    // 主题选择
    document.querySelectorAll('#themeGridPage .theme-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('#themeGridPage .theme-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const theme = opt.dataset.theme;
            document.body.className = `theme-${theme}`;
            localStorage.setItem('theme', theme);
        });
    });
    
    // 数据管理功能
    document.getElementById('exportDataCard')?.addEventListener('click', exportAllData);
    document.getElementById('importDataCard')?.addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput')?.addEventListener('change', importAllData);
    document.getElementById('clearAllDataCard')?.addEventListener('click', clearAllStorageData);
    document.getElementById('aboutCard')?.addEventListener('click', showAboutInfo);
}

async function fetchModelsPage() {
    const baseUrl = document.getElementById('apiBaseUrlPage').value;
    const apiKey = document.getElementById('apiKeyPage').value;
    const status = document.getElementById('fetchStatusPage');
    
    if (!baseUrl || !apiKey) {
        status.textContent = '请先填写API地址和密钥';
        status.className = 'fetch-status error';
        return;
    }
    
    status.textContent = '正在拉取...';
    status.className = 'fetch-status';
    
    try {
        const response = await fetch(baseUrl.replace(/\/$/, '') + '/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) throw new Error('拉取失败');
        const data = await response.json();
        const models = data.data || [];
        
        const select = document.getElementById('modelSelectPage');
        select.innerHTML = '<option value="">-- 选择模型 --</option>';
        models.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.id;
            select.appendChild(option);
        });
        
        status.textContent = `成功拉取 ${models.length} 个模型`;
        status.className = 'fetch-status success';
    } catch (error) {
        status.textContent = '拉取失败: ' + error.message;
        status.className = 'fetch-status error';
    }
}

async function fetchBackupModelsPage() {
    const baseUrl = document.getElementById('backupApiBaseUrlPage').value;
    const apiKey = document.getElementById('backupApiKeyPage').value;
    const status = document.getElementById('backupFetchStatusPage');
    
    if (!baseUrl || !apiKey) {
        status.textContent = '请先填写备用API地址和密钥';
        status.className = 'fetch-status error';
        return;
    }
    
    status.textContent = '正在拉取...';
    status.className = 'fetch-status';
    
    try {
        const response = await fetch(baseUrl.replace(/\/$/, '') + '/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) throw new Error('拉取失败');
        const data = await response.json();
        const models = data.data || [];
        
        const select = document.getElementById('backupModelSelectPage');
        select.innerHTML = '<option value="">留空则使用主模型</option>';
        models.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.id;
            select.appendChild(option);
        });
        
        status.textContent = `成功拉取 ${models.length} 个模型`;
        status.className = 'fetch-status success';
    } catch (error) {
        status.textContent = '拉取失败: ' + error.message;
        status.className = 'fetch-status error';
    }
}

async function testMainApiPage() {
    const baseUrl = document.getElementById('apiBaseUrlPage')?.value?.trim();
    const apiKey = document.getElementById('apiKeyPage')?.value?.trim();
    const model = document.getElementById('modelSelectPage')?.value;
    const status = document.getElementById('mainApiStatusPage');
    
    if (!status) {
        console.error('mainApiStatusPage not found');
        return;
    }
    
    if (!baseUrl || !apiKey || !model) {
        status.textContent = '请先填写完整的API配置（地址、密钥、模型）';
        status.className = 'connection-status error show';
        return;
    }
    
    status.textContent = '正在检测主API...';
    status.className = 'connection-status show';
    
    try {
        const response = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
        }
        
        status.textContent = '✓ 主API连接正常';
        status.className = 'connection-status success show';
    } catch (error) {
        status.textContent = '✗ 主API连接失败: ' + error.message;
        status.className = 'connection-status error show';
    }
}

async function testBackupApiPage() {
    const baseUrl = document.getElementById('backupApiBaseUrlPage')?.value?.trim();
    const apiKey = document.getElementById('backupApiKeyPage')?.value?.trim();
    const model = document.getElementById('backupModelSelectPage')?.value;
    const status = document.getElementById('backupApiStatusPage');
    
    if (!status) {
        console.error('backupApiStatusPage not found');
        return;
    }
    
    if (!baseUrl || !apiKey) {
        status.textContent = '请先填写备用API配置（地址、密钥）';
        status.className = 'connection-status error show';
        return;
    }
    
    // 如果没有指定备用模型，使用主模型
    const testModel = model || document.getElementById('modelSelectPage')?.value;
    if (!testModel) {
        status.textContent = '请先选择模型（主模型或备用模型）';
        status.className = 'connection-status error show';
        return;
    }
    
    status.textContent = '正在检测备用API...';
    status.className = 'connection-status show';
    
    try {
        const response = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: testModel,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
        }
        
        status.textContent = '✓ 备用API连接正常';
        status.className = 'connection-status success show';
    } catch (error) {
        status.textContent = '✗ 备用API连接失败: ' + error.message;
        status.className = 'connection-status error show';
    }
}

function saveSettingsPage() {
    apiSettings.baseUrl = document.getElementById('apiBaseUrlPage').value;
    apiSettings.apiKey = document.getElementById('apiKeyPage').value;
    apiSettings.model = document.getElementById('modelSelectPage').value;
    apiSettings.temperature = parseFloat(document.getElementById('temperatureSliderPage').value);
    apiSettings.backupBaseUrl = document.getElementById('backupApiBaseUrlPage').value;
    apiSettings.backupApiKey = document.getElementById('backupApiKeyPage').value;
    apiSettings.backupModel = document.getElementById('backupModelSelectPage').value;
    
    // 同步更新backupApiSettings
    backupApiSettings.baseUrl = apiSettings.backupBaseUrl;
    backupApiSettings.apiKey = apiSettings.backupApiKey;
    backupApiSettings.model = apiSettings.backupModel;
    
    localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
    showToast('设置已保存');
}

async function saveSchemePage() {
    const name = await customPrompt('', '', '请输入方案名称');
    if (!name) return;
    
    const scheme = {
        name: name,
        baseUrl: document.getElementById('apiBaseUrlPage').value,
        apiKey: document.getElementById('apiKeyPage').value,
        model: document.getElementById('modelSelectPage').value,
        temperature: parseFloat(document.getElementById('temperatureSliderPage').value),
        backupBaseUrl: document.getElementById('backupApiBaseUrlPage').value,
        backupApiKey: document.getElementById('backupApiKeyPage').value,
        backupModel: document.getElementById('backupModelSelectPage').value
    };
    
    const schemes = JSON.parse(localStorage.getItem('apiSchemes') || '[]');
    const existingIndex = schemes.findIndex(s => s.name === name);
    if (existingIndex >= 0) {
        schemes[existingIndex] = scheme;
    } else {
        schemes.push(scheme);
    }
    
    localStorage.setItem('apiSchemes', JSON.stringify(schemes));
    loadApiSchemesPage();
    showToast('方案已保存');
}

async function deleteSchemePage() {
    const select = document.getElementById('apiSchemeSelectPage');
    const name = select.value;
    if (!name) {
        showToast('请先选择要删除的方案');
        return;
    }
    
    if (!await customConfirm(`确定要删除方案"${name}"吗？`, '删除方案')) return;
    
    const schemes = JSON.parse(localStorage.getItem('apiSchemes') || '[]');
    const filtered = schemes.filter(s => s.name !== name);
    localStorage.setItem('apiSchemes', JSON.stringify(filtered));
    loadApiSchemesPage();
    showToast('方案已删除');
}

function loadSchemePage() {
    const select = document.getElementById('apiSchemeSelectPage');
    const name = select.value;
    if (!name) return;
    
    const schemes = JSON.parse(localStorage.getItem('apiSchemes') || '[]');
    const scheme = schemes.find(s => s.name === name);
    if (!scheme) return;
    
    document.getElementById('apiBaseUrlPage').value = scheme.baseUrl || '';
    document.getElementById('apiKeyPage').value = scheme.apiKey || '';
    document.getElementById('temperatureSliderPage').value = scheme.temperature || 0.7;
    document.getElementById('tempValuePage').textContent = scheme.temperature || 0.7;
    document.getElementById('backupApiBaseUrlPage').value = scheme.backupBaseUrl || '';
    document.getElementById('backupApiKeyPage').value = scheme.backupApiKey || '';
    
    // 设置模型选项
    if (scheme.model) {
        const modelSelect = document.getElementById('modelSelectPage');
        const option = document.createElement('option');
        option.value = scheme.model;
        option.textContent = scheme.model;
        option.selected = true;
        modelSelect.innerHTML = '';
        modelSelect.appendChild(option);
    }
    if (scheme.backupModel) {
        const backupModelSelect = document.getElementById('backupModelSelectPage');
        const option = document.createElement('option');
        option.value = scheme.backupModel;
        option.textContent = scheme.backupModel;
        option.selected = true;
        backupModelSelect.innerHTML = '<option value="">留空则使用主模型</option>';
        backupModelSelect.appendChild(option);
    }
    
    showToast('方案已加载');
}

// Others Section
function openOthersSection() {
    document.getElementById('mainSection').classList.remove('active');
    document.getElementById('othersSection').classList.add('active');
    currentPage = 'others';
    document.getElementById('othersBack').onclick = closeOthersSection;
}

function closeOthersSection() {
    document.getElementById('othersSection').classList.remove('active');
    document.getElementById('mainSection').classList.add('active');
    currentPage = 'main';
}

// 导出所有数据
function exportAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `穿越系统数据_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出');
}

// 导入所有数据
function importAllData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (await customConfirm('导入将覆盖当前所有数据，是否继续？', '导入数据')) {
                // 清除现有数据
                localStorage.clear();
                
                // 导入新数据
                for (const key in data) {
                    localStorage.setItem(key, data[key]);
                }
                
                showToast('数据导入成功，页面将刷新');
                setTimeout(() => location.reload(), 1000);
            }
        } catch (error) {
            showToast('导入失败：文件格式错误');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // 清空input以便再次选择同一文件
}

// 清除所有存储数据
async function clearAllStorageData() {
    if (await customDangerConfirm('确定要清除所有数据吗？\n\n这将删除：\n• 所有模式的存档\n• 所有预设和世界书\n• API设置\n• 所有自定义配置\n\n此操作不可恢复！', '清除所有数据')) {
        if (await customDangerConfirm('再次确认：真的要删除所有数据吗？', '最终确认')) {
            localStorage.clear();
            showToast('所有数据已清除，页面将刷新');
            setTimeout(() => location.reload(), 1000);
        }
    }
}

// 显示关于信息
function showAboutInfo() {
    customAlert(`版本：1.0.0

功能：
• 穿越模式 - 经典穿越体验
• 快穿模式 - 多世界穿梭任务
• 穿书模式 - 进入小说世界
• 无限流模式 - 副本生存挑战

使用说明：
1. 先在设置中配置API
2. 选择游戏模式开始游戏
3. 可在预设中设定AI行为
4. 世界书可添加背景知识

数据存储在本地浏览器中。`, '穿越系统模拟器');
}

// Settings Modal
function loadSavedSettings() {
    document.getElementById('apiBaseUrl').value = apiSettings.baseUrl;
    document.getElementById('apiKey').value = apiSettings.apiKey;
    document.getElementById('temperatureSlider').value = apiSettings.temperature;
    document.getElementById('tempValue').textContent = apiSettings.temperature;
    
    // Load saved model if exists
    if (apiSettings.model) {
        const modelSelect = document.getElementById('modelSelect');
        const option = document.createElement('option');
        option.value = apiSettings.model;
        option.textContent = apiSettings.model;
        option.selected = true;
        modelSelect.innerHTML = '';
        modelSelect.appendChild(option);
    }
    
    // Load backup API settings
    document.getElementById('backupApiBaseUrl').value = backupApiSettings.baseUrl;
    document.getElementById('backupApiKey').value = backupApiSettings.apiKey;
    // 设置备用模型选择框的值
    const backupModelSelect = document.getElementById('backupModelSelect');
    if (backupModelSelect && backupApiSettings.model) {
        // 如果模型不在列表中，添加一个选项
        let hasOption = false;
        for (let option of backupModelSelect.options) {
            if (option.value === backupApiSettings.model) {
                hasOption = true;
                option.selected = true;
                break;
            }
        }
        if (!hasOption && backupApiSettings.model) {
            const option = document.createElement('option');
            option.value = backupApiSettings.model;
            option.textContent = backupApiSettings.model;
            option.selected = true;
            backupModelSelect.appendChild(option);
        }
    }
    
    // Load saved theme
    loadSavedTheme();
}

// Theme functions
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark-gold';
    applyTheme(savedTheme);
    updateThemeSelection(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark-gold') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function updateThemeSelection(theme) {
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === theme);
    });
}

function setupThemeEvents() {
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const theme = opt.dataset.theme;
            applyTheme(theme);
            updateThemeSelection(theme);
            localStorage.setItem('theme', theme);
            showToast('主题已切换');
        });
    });
}

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('active');
    clearConnectionStatus();
    renderApiSchemes();
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('active');
}

function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('settingsClose');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const apiKeyInput = document.getElementById('apiKey');
    const fetchModelsBtn = document.getElementById('fetchModels');
    const testConnectionBtn = document.getElementById('testConnection');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const saveSchemeBtn = document.getElementById('saveScheme');
    const deleteSchemeBtn = document.getElementById('deleteScheme');
    const schemeSelect = document.getElementById('apiSchemeSelect');
    const temperatureSlider = document.getElementById('temperatureSlider');
    const tempValue = document.getElementById('tempValue');

    // Close modal
    closeBtn.addEventListener('click', closeSettingsModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSettingsModal();
    });

    // Toggle API key visibility
    toggleApiKeyBtn.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
    });
    
    // Toggle backup API key visibility
    const toggleBackupApiKeyBtn = document.getElementById('toggleBackupApiKey');
    const backupApiKeyInput = document.getElementById('backupApiKey');
    if (toggleBackupApiKeyBtn && backupApiKeyInput) {
        toggleBackupApiKeyBtn.addEventListener('click', () => {
            const type = backupApiKeyInput.type === 'password' ? 'text' : 'password';
            backupApiKeyInput.type = type;
        });
    }

    // Temperature slider
    temperatureSlider.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
    });

    // Fetch models
    fetchModelsBtn.addEventListener('click', fetchModels);
    
    // Fetch backup models
    const fetchBackupModelsBtn = document.getElementById('fetchBackupModels');
    if (fetchBackupModelsBtn) {
        fetchBackupModelsBtn.addEventListener('click', fetchBackupModels);
    }

    // Test connection
    testConnectionBtn.addEventListener('click', testConnection);
    
    // Test backup connection
    const testBackupConnectionBtn = document.getElementById('testBackupConnection');
    if (testBackupConnectionBtn) {
        testBackupConnectionBtn.addEventListener('click', testBackupConnection);
    }

    // Save settings
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Save scheme
    saveSchemeBtn.addEventListener('click', saveApiScheme);

    // Delete scheme
    deleteSchemeBtn.addEventListener('click', deleteApiScheme);

    // Load scheme when selected
    schemeSelect.addEventListener('change', loadApiScheme);
}

// Fetch models from API
async function fetchModels() {
    const baseUrl = document.getElementById('apiBaseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const fetchBtn = document.getElementById('fetchModels');
    const fetchStatus = document.getElementById('fetchStatus');
    const modelSelect = document.getElementById('modelSelect');

    if (!baseUrl) {
        showToast('请输入API地址');
        return;
    }
    if (!apiKey) {
        showToast('请输入API密钥');
        return;
    }

    // Set loading state
    fetchBtn.classList.add('loading');
    fetchStatus.textContent = '正在拉取模型列表...';
    fetchStatus.className = 'fetch-status loading';

    try {
        const url = baseUrl.replace(/\/$/, '') + '/models';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Parse models - handle different API response formats
        let models = [];
        if (data.data && Array.isArray(data.data)) {
            // OpenAI format
            models = data.data.map(m => m.id || m.name).filter(Boolean);
        } else if (Array.isArray(data)) {
            models = data.map(m => m.id || m.name || m).filter(Boolean);
        } else if (data.models && Array.isArray(data.models)) {
            models = data.models.map(m => m.id || m.name || m).filter(Boolean);
        }

        if (models.length === 0) {
            throw new Error('未找到可用模型');
        }

        // Sort models
        models.sort();

        // Populate select
        modelSelect.innerHTML = '';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === apiSettings.model) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        fetchStatus.textContent = `成功获取 ${models.length} 个模型`;
        fetchStatus.className = 'fetch-status success';

    } catch (error) {
        console.error('Fetch models error:', error);
        fetchStatus.textContent = `拉取失败: ${error.message}`;
        fetchStatus.className = 'fetch-status error';
    } finally {
        fetchBtn.classList.remove('loading');
    }
}

// Fetch backup models from API
async function fetchBackupModels() {
    const baseUrl = document.getElementById('backupApiBaseUrl').value.trim();
    const apiKey = document.getElementById('backupApiKey').value.trim();
    const fetchBtn = document.getElementById('fetchBackupModels');
    const fetchStatus = document.getElementById('backupFetchStatus');
    const modelSelect = document.getElementById('backupModelSelect');

    if (!baseUrl) {
        showToast('请输入备用API地址');
        return;
    }
    if (!apiKey) {
        showToast('请输入备用API密钥');
        return;
    }

    // Set loading state
    fetchBtn.classList.add('loading');
    fetchStatus.textContent = '正在拉取备用API模型列表...';
    fetchStatus.className = 'fetch-status loading';

    try {
        const url = baseUrl.replace(/\/$/, '') + '/models';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Parse models - handle different API response formats
        let models = [];
        if (data.data && Array.isArray(data.data)) {
            // OpenAI format
            models = data.data.map(m => m.id || m.name).filter(Boolean);
        } else if (Array.isArray(data)) {
            models = data.map(m => m.id || m.name || m).filter(Boolean);
        } else if (data.models && Array.isArray(data.models)) {
            models = data.models.map(m => m.id || m.name || m).filter(Boolean);
        }

        if (models.length === 0) {
            throw new Error('未找到可用模型');
        }

        // Sort models
        models.sort();

        // Populate select - keep empty option for "use main"
        modelSelect.innerHTML = '<option value="">留空则使用主模型</option>';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === backupApiSettings.model) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        fetchStatus.textContent = `成功获取 ${models.length} 个模型`;
        fetchStatus.className = 'fetch-status success';

    } catch (error) {
        console.error('Fetch backup models error:', error);
        fetchStatus.textContent = `拉取失败: ${error.message}`;
        fetchStatus.className = 'fetch-status error';
    } finally {
        fetchBtn.classList.remove('loading');
    }
}

// Test API connection
async function testConnection() {
    const baseUrl = document.getElementById('apiBaseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value;
    const testBtn = document.getElementById('testConnection');
    const connectionStatus = document.getElementById('connectionStatus');

    if (!baseUrl) {
        showToast('请输入API地址');
        return;
    }
    if (!apiKey) {
        showToast('请输入API密钥');
        return;
    }
    if (!model) {
        showToast('请先选择模型');
        return;
    }

    // Set loading state
    testBtn.disabled = true;
    testBtn.classList.add('loading');
    testBtn.querySelector('span').textContent = '检测中...';

    try {
        const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        connectionStatus.innerHTML = `<strong>连接成功!</strong><br>模型: ${model}<br>响应正常`;
        connectionStatus.className = 'connection-status success show';

    } catch (error) {
        console.error('Connection test error:', error);
        connectionStatus.innerHTML = `<strong>连接失败</strong><br>${error.message}`;
        connectionStatus.className = 'connection-status error show';
    } finally {
        testBtn.disabled = false;
        testBtn.classList.remove('loading');
        testBtn.querySelector('span').textContent = '检测主API';
    }
}

// Test backup API connection
async function testBackupConnection() {
    const baseUrl = document.getElementById('backupApiBaseUrl').value.trim();
    const apiKey = document.getElementById('backupApiKey').value.trim();
    const model = document.getElementById('backupModelSelect').value;
    const testBtn = document.getElementById('testBackupConnection');
    const connectionStatus = document.getElementById('backupConnectionStatus');

    if (!baseUrl) {
        showToast('请输入备用API地址');
        return;
    }
    if (!apiKey) {
        showToast('请输入备用API密钥');
        return;
    }
    if (!model) {
        showToast('请先选择备用模型');
        return;
    }

    // Set loading state
    testBtn.disabled = true;
    testBtn.classList.add('loading');
    testBtn.querySelector('span').textContent = '检测中...';

    try {
        const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        connectionStatus.innerHTML = `<strong>备用API连接成功!</strong><br>模型: ${model}<br>响应正常`;
        connectionStatus.className = 'connection-status success show';

    } catch (error) {
        console.error('Backup connection test error:', error);
        connectionStatus.innerHTML = `<strong>备用API连接失败</strong><br>${error.message}`;
        connectionStatus.className = 'connection-status error show';
    } finally {
        testBtn.disabled = false;
        testBtn.classList.remove('loading');
        testBtn.querySelector('span').textContent = '检测备用API';
    }
}

// Save settings
function saveSettings() {
    const baseUrl = document.getElementById('apiBaseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value;
    const temperature = parseFloat(document.getElementById('temperatureSlider').value);

    // Update state
    apiSettings.baseUrl = baseUrl;
    apiSettings.apiKey = apiKey;
    apiSettings.model = model;
    apiSettings.temperature = temperature;

    // Save to localStorage
    localStorage.setItem('apiBaseUrl', baseUrl);
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiModel', model);
    localStorage.setItem('apiTemperature', temperature.toString());
    
    // Save backup API settings
    const backupBaseUrl = document.getElementById('backupApiBaseUrl').value.trim();
    const backupKey = document.getElementById('backupApiKey').value.trim();
    const backupModel = document.getElementById('backupModelSelect').value;
    
    backupApiSettings.baseUrl = backupBaseUrl;
    backupApiSettings.apiKey = backupKey;
    backupApiSettings.model = backupModel;
    
    localStorage.setItem('backupApiBaseUrl', backupBaseUrl);
    localStorage.setItem('backupApiKey', backupKey);
    localStorage.setItem('backupModel', backupModel);

    showToast('设置已保存');
    closeSettingsModal();
}

// Clear connection status
function clearConnectionStatus() {
    const connectionStatus = document.getElementById('connectionStatus');
    connectionStatus.className = 'connection-status';
    connectionStatus.innerHTML = '';
    
    const fetchStatus = document.getElementById('fetchStatus');
    fetchStatus.className = 'fetch-status';
    fetchStatus.textContent = '';
}

// ==================== API SCHEME FUNCTIONS ====================

// Render API schemes in select dropdown
function renderApiSchemes() {
    const schemeSelect = document.getElementById('apiSchemeSelect');
    schemeSelect.innerHTML = '<option value="">-- 选择已保存方案 --</option>';
    
    apiSchemes.forEach(scheme => {
        const option = document.createElement('option');
        option.value = scheme.id;
        option.textContent = scheme.name;
        schemeSelect.appendChild(option);
    });
}

// Save current settings as a new scheme
async function saveApiScheme() {
    const baseUrl = document.getElementById('apiBaseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value;
    const temperature = parseFloat(document.getElementById('temperatureSlider').value);

    if (!baseUrl) {
        showToast('请先输入API地址');
        return;
    }

    // Prompt for scheme name
    const schemeName = await customPrompt('', '', '请输入方案名称');
    if (!schemeName || !schemeName.trim()) {
        return;
    }

    // Check if name already exists
    const existingIndex = apiSchemes.findIndex(s => s.name === schemeName.trim());
    if (existingIndex !== -1) {
        if (await customConfirm('方案名称已存在，是否覆盖？', '覆盖方案')) {
            apiSchemes[existingIndex] = {
                ...apiSchemes[existingIndex],
                baseUrl,
                apiKey,
                model,
                temperature
            };
        } else {
            return;
        }
    } else {
        // Add new scheme
        apiSchemes.push({
            id: Date.now().toString(),
            name: schemeName.trim(),
            baseUrl,
            apiKey,
            model,
            temperature
        });
    }

    // Save to localStorage
    localStorage.setItem('apiSchemes', JSON.stringify(apiSchemes));
    renderApiSchemes();
    showToast('方案已保存');
}

// Load selected scheme
function loadApiScheme() {
    const schemeSelect = document.getElementById('apiSchemeSelect');
    const schemeId = schemeSelect.value;

    if (!schemeId) {
        return;
    }

    const scheme = apiSchemes.find(s => s.id === schemeId);
    if (!scheme) {
        return;
    }

    // Fill in the form
    document.getElementById('apiBaseUrl').value = scheme.baseUrl;
    document.getElementById('apiKey').value = scheme.apiKey;
    document.getElementById('temperatureSlider').value = scheme.temperature;
    document.getElementById('tempValue').textContent = scheme.temperature;

    // Set model if available
    const modelSelect = document.getElementById('modelSelect');
    if (scheme.model) {
        // Check if model option exists
        const existingOption = Array.from(modelSelect.options).find(opt => opt.value === scheme.model);
        if (!existingOption) {
            // Add the model option
            const option = document.createElement('option');
            option.value = scheme.model;
            option.textContent = scheme.model;
            modelSelect.appendChild(option);
        }
        modelSelect.value = scheme.model;
    }

    showToast('已加载方案: ' + scheme.name);
}

// Delete selected scheme
async function deleteApiScheme() {
    const schemeSelect = document.getElementById('apiSchemeSelect');
    const schemeId = schemeSelect.value;

    if (!schemeId) {
        showToast('请先选择要删除的方案');
        return;
    }

    const scheme = apiSchemes.find(s => s.id === schemeId);
    if (!scheme) {
        return;
    }

    if (!await customConfirm('确定要删除方案 "' + scheme.name + '" 吗？', '删除方案')) {
        return;
    }

    apiSchemes = apiSchemes.filter(s => s.id !== schemeId);
    localStorage.setItem('apiSchemes', JSON.stringify(apiSchemes));
    renderApiSchemes();
    showToast('方案已删除');
}

// Expand Cards (Preset & World Book)
function setupExpandCards() {
    document.querySelectorAll('.expand-header').forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.dataset.target;
            const content = document.getElementById(targetId);
            const isActive = header.classList.contains('active');
            
            if (isActive) {
                header.classList.remove('active');
                content.classList.remove('active');
            } else {
                header.classList.add('active');
                content.classList.add('active');
            }
        });
    });
    
    // Setup collection tabs
    setupCollectionTabs();
}

// ==================== COLLECTION & ARCHIVE FUNCTIONS ====================

let currentViewingFavoriteId = null;

function setupCollectionTabs() {
    // Collection menu card click
    document.getElementById('collectionMenuCard')?.addEventListener('click', openCollectionModal);
    
    // Collection modal events
    document.getElementById('collectionModalClose')?.addEventListener('click', closeCollectionModal);
    document.getElementById('collectionModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'collectionModal') closeCollectionModal();
    });
    
    // Favorite detail modal events
    document.getElementById('favoriteDetailClose')?.addEventListener('click', closeFavoriteDetailModal);
    document.getElementById('favoriteDetailBack')?.addEventListener('click', closeFavoriteDetailModal);
    document.getElementById('favoriteDetailModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'favoriteDetailModal') closeFavoriteDetailModal();
    });
    document.getElementById('favoriteCopyBtn')?.addEventListener('click', copyCurrentFavorite);
    document.getElementById('favoriteDeleteBtn')?.addEventListener('click', deleteCurrentFavorite);
    
    // Tab switching
    document.querySelectorAll('.collection-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.collection-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding panel
            document.querySelectorAll('.collection-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(tabName + 'Panel')?.classList.add('active');
        });
    });
    
    // Initial render
    renderFavorites();
    renderArchives();
}

function openCollectionModal() {
    document.getElementById('collectionModal').classList.add('active');
    renderFavorites();
    renderArchives();
}

function closeCollectionModal() {
    document.getElementById('collectionModal').classList.remove('active');
}

function addToFavorites(content, title = '') {
    const favorite = {
        id: Date.now().toString(),
        mode: gameMode,
        title: title || content.substring(0, 30) + '...',
        content: content,
        worldName: chuanyueRulesData?.settings?.substring(0, 20) || '未知世界',
        createdAt: Date.now()
    };
    
    favorites.unshift(favorite);
    if (favorites.length > 100) favorites.pop();
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast('已添加到收藏');
}

function removeFavorite(id) {
    favorites = favorites.filter(f => f.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast('已取消收藏');
}

function renderFavorites() {
    const list = document.getElementById('favoritesList');
    const empty = document.getElementById('favoritesEmpty');
    if (!list || !empty) return;
    
    if (favorites.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    list.style.display = 'flex';
    empty.style.display = 'none';
    
    const modeLabels = { chuanyue: '穿越', kuaichuan: '快穿', chuanshu: '穿书', wuxianliu: '无限流' };
    
    list.innerHTML = favorites.map(fav => `
        <div class="collection-item" data-id="${fav.id}">
            <div class="collection-item-icon">⭐</div>
            <div class="collection-item-info">
                <div class="collection-item-title">
                    ${escapeHtml(fav.title)}
                    <span class="mode-tag">${modeLabels[fav.mode] || fav.mode}</span>
                </div>
                <div class="collection-item-preview">${escapeHtml(fav.content)}</div>
                <div class="collection-item-meta">${new Date(fav.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="collection-item-actions">
                <button class="collection-item-btn" onclick="viewFavorite('${fav.id}')" title="查看">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M1 12 Q12 4 23 12 Q12 20 1 12" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                </button>
                <button class="collection-item-btn delete" onclick="removeFavorite('${fav.id}')" title="删除">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function viewFavorite(id) {
    const fav = favorites.find(f => f.id === id);
    if (!fav) return;
    
    currentViewingFavoriteId = id;
    
    const modeLabels = { chuanyue: '穿越', kuaichuan: '快穿', chuanshu: '穿书', wuxianliu: '无限流' };
    
    // Fill detail content
    document.getElementById('favoriteDetailTitle').textContent = fav.title;
    document.getElementById('favoriteDetailContent').textContent = fav.content;
    document.getElementById('favoriteDetailMeta').innerHTML = `
        <span>📁 ${modeLabels[fav.mode] || fav.mode}</span>
        <span>📅 ${new Date(fav.createdAt).toLocaleString()}</span>
    `;
    
    // Open detail modal
    document.getElementById('favoriteDetailModal').classList.add('active');
}

function closeFavoriteDetailModal() {
    document.getElementById('favoriteDetailModal').classList.remove('active');
    currentViewingFavoriteId = null;
}

function copyCurrentFavorite() {
    const fav = favorites.find(f => f.id === currentViewingFavoriteId);
    if (!fav) return;
    
    navigator.clipboard?.writeText(fav.content);
    showToast('内容已复制到剪贴板');
}

async function deleteCurrentFavorite() {
    if (!currentViewingFavoriteId) return;
    
    if (!await customConfirm('确定要删除这条收藏吗？', '删除收藏')) return;
    
    removeFavorite(currentViewingFavoriteId);
    closeFavoriteDetailModal();
}

async function saveArchive(name = '') {
    const archiveName = name || await customPrompt('', `${chuanyueRulesData?.settings?.substring(0, 15) || '世界'} - ${new Date().toLocaleDateString()}`, '请输入存档名称');
    if (!archiveName) return;
    
    const archive = {
        id: Date.now().toString(),
        name: archiveName,
        mode: gameMode,
        createdAt: Date.now(),
        data: {
            characterProfile,
            chuanyueRulesData,
            transCharData,
            worldBuildingData,
            worldBuildingGenerated,
            playerStatusData,
            customStatusCategories,
            worldMapData,
            importantCharacters,
            chatHistory,
            chatStatus,
            isChuanyueStarted,
            storySummary,
            worldMemories,
            worldCount,
            userPoints
        }
    };
    
    archives.unshift(archive);
    if (archives.length > 20) archives.pop();
    
    localStorage.setItem('archives', JSON.stringify(archives));
    renderArchives();
    showToast('世界存档成功');
}

async function loadArchive(id) {
    const archive = archives.find(a => a.id === id);
    if (!archive) return;
    
    if (!await customConfirm(`确定要加载存档"${archive.name}"吗？\n当前进度将被覆盖。`, '加载存档')) return;
    
    // Switch to archive's mode
    gameMode = archive.mode;
    localStorage.setItem('gameMode', gameMode);
    
    // Restore data
    const data = archive.data;
    characterProfile = data.characterProfile;
    chuanyueRulesData = data.chuanyueRulesData;
    transCharData = data.transCharData;
    worldBuildingData = data.worldBuildingData;
    worldBuildingGenerated = data.worldBuildingGenerated;
    playerStatusData = data.playerStatusData;
    customStatusCategories = data.customStatusCategories;
    worldMapData = data.worldMapData;
    importantCharacters = data.importantCharacters;
    chatHistory = data.chatHistory;
    chatStatus = data.chatStatus;
    isChuanyueStarted = data.isChuanyueStarted;
    storySummary = data.storySummary;
    worldMemories = data.worldMemories || [];
    worldCount = data.worldCount || 0;
    userPoints = data.userPoints || 0;
    
    // Save to localStorage
    localStorage.setItem(getStorageKey('characterProfile'), JSON.stringify(characterProfile));
    localStorage.setItem(getStorageKey('chuanyueRulesData'), JSON.stringify(chuanyueRulesData));
    localStorage.setItem(getStorageKey('transCharData'), JSON.stringify(transCharData));
    localStorage.setItem(getStorageKey('worldBuildingData'), JSON.stringify(worldBuildingData));
    localStorage.setItem(getStorageKey('worldBuildingGenerated'), worldBuildingGenerated);
    localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
    localStorage.setItem(getStorageKey('customStatusCategories'), JSON.stringify(customStatusCategories));
    localStorage.setItem(getStorageKey('worldMapData'), JSON.stringify(worldMapData));
    localStorage.setItem(getStorageKey('importantCharacters'), JSON.stringify(importantCharacters));
    localStorage.setItem(getStorageKey('chatHistory'), JSON.stringify(chatHistory));
    localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
    localStorage.setItem(getStorageKey('isChuanyueStarted'), isChuanyueStarted);
    localStorage.setItem(getStorageKey('storySummary'), storySummary);
    localStorage.setItem(getStorageKey('worldMemories'), JSON.stringify(worldMemories));
    localStorage.setItem(getStorageKey('worldCount'), worldCount);
    localStorage.setItem(getStorageKey('userPoints'), userPoints);
    
    showToast('存档加载成功');
    
    // Refresh UI
    location.reload();
}

async function removeArchive(id) {
    if (!await customConfirm('确定要删除此存档吗？', '删除存档')) return;
    
    archives = archives.filter(a => a.id !== id);
    localStorage.setItem('archives', JSON.stringify(archives));
    renderArchives();
    showToast('存档已删除');
}

function renderArchives() {
    const list = document.getElementById('archivesList');
    const empty = document.getElementById('archivesEmpty');
    if (!list || !empty) return;
    
    if (archives.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    list.style.display = 'flex';
    empty.style.display = 'none';
    
    const modeLabels = { chuanyue: '穿越', kuaichuan: '快穿', chuanshu: '穿书', wuxianliu: '无限流' };
    
    list.innerHTML = archives.map(arc => `
        <div class="collection-item" data-id="${arc.id}">
            <div class="collection-item-icon">💾</div>
            <div class="collection-item-info">
                <div class="collection-item-title">
                    ${escapeHtml(arc.name)}
                    <span class="mode-tag">${modeLabels[arc.mode] || arc.mode}</span>
                </div>
                <div class="collection-item-preview">对话${arc.data.chatHistory?.length || 0}条 · ${arc.data.isChuanyueStarted ? '进行中' : '未开始'}</div>
                <div class="collection-item-meta">${new Date(arc.createdAt).toLocaleString()}</div>
            </div>
            <div class="collection-item-actions">
                <button class="collection-item-btn" onclick="loadArchive('${arc.id}')" title="加载">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 3 V15 M12 15 L8 11 M12 15 L16 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 17 V19 Q4 21 6 21 H18 Q20 21 20 19 V17" stroke="currentColor" stroke-width="2"/></svg>
                </button>
                <button class="collection-item-btn delete" onclick="removeArchive('${arc.id}')" title="删除">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== PRESET FUNCTIONS ====================

function setupPresetModal() {
    const modal = document.getElementById('presetModal');
    const closeBtn = document.getElementById('presetModalClose');
    const cancelBtn = document.getElementById('presetModalCancel');
    const saveBtn = document.getElementById('presetModalSave');
    const addBtn = document.getElementById('addPresetBtn');

    addBtn.addEventListener('click', () => openPresetModal());
    closeBtn.addEventListener('click', closePresetModal);
    cancelBtn.addEventListener('click', closePresetModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePresetModal();
    });
    saveBtn.addEventListener('click', savePreset);
}

function openPresetModal(presetId = null) {
    const modal = document.getElementById('presetModal');
    const title = document.getElementById('presetModalTitle');
    const nameInput = document.getElementById('presetName');
    const contentInput = document.getElementById('presetContentInput');
    const enabledInput = document.getElementById('presetEnabled');
    const scopeInput = document.getElementById('presetScope');

    editingPresetId = presetId;

    if (presetId) {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            title.textContent = '编辑预设';
            nameInput.value = preset.name;
            contentInput.value = preset.content;
            enabledInput.checked = preset.enabled;
            scopeInput.value = preset.scope || 'global';
        }
    } else {
        title.textContent = '添加预设';
        nameInput.value = '';
        contentInput.value = '';
        enabledInput.checked = true;
        scopeInput.value = 'global';
    }

    modal.classList.add('active');
}

function closePresetModal() {
    const modal = document.getElementById('presetModal');
    modal.classList.remove('active');
    editingPresetId = null;
}

function savePreset() {
    const nameInput = document.getElementById('presetName');
    const contentInput = document.getElementById('presetContentInput');
    const enabledInput = document.getElementById('presetEnabled');
    const scopeInput = document.getElementById('presetScope');

    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    const enabled = enabledInput.checked;
    const scope = scopeInput.value;

    if (!name) {
        showToast('请输入预设名称');
        return;
    }
    if (!content) {
        showToast('请输入预设内容');
        return;
    }

    if (editingPresetId) {
        // Update existing
        const index = presets.findIndex(p => p.id === editingPresetId);
        if (index !== -1) {
            presets[index] = { ...presets[index], name, content, enabled, scope };
        }
    } else {
        // Add new
        presets.push({
            id: Date.now().toString(),
            name,
            content,
            enabled,
            scope
        });
    }

    localStorage.setItem('presets', JSON.stringify(presets));
    renderPresets();
    closePresetModal();
    showToast(editingPresetId ? '预设已更新' : '预设已添加');
}

function deletePreset(presetId) {
    presets = presets.filter(p => p.id !== presetId);
    localStorage.setItem('presets', JSON.stringify(presets));
    renderPresets();
    showToast('预设已删除');
}

function togglePreset(presetId) {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
        preset.enabled = !preset.enabled;
        localStorage.setItem('presets', JSON.stringify(presets));
        renderPresets();
    }
}

function renderPresets() {
    const list = document.getElementById('presetList');
    
    if (!list) {
        console.error('presetList element not found');
        return;
    }
    
    if (presets.length === 0) {
        list.innerHTML = '<div class="empty-state">暂无预设，点击下方按钮添加</div>';
        return;
    }
    
    const scopeLabels = {
        'global': '全局',
        'chuanyue': '穿越',
        'kuaichuan': '快穿',
        'chuanshu': '穿书',
        'wuxianliu': '无限流'
    };

    list.innerHTML = presets.map(preset => `
        <div class="preset-item ${preset.enabled ? '' : 'disabled'}" data-id="${preset.id}">
            <div class="item-toggle">
                <input type="checkbox" ${preset.enabled ? 'checked' : ''} onchange="togglePreset('${preset.id}')">
            </div>
            <div class="item-info">
                <div class="item-name">
                    ${escapeHtml(preset.name)}
                    <span class="scope-tag ${preset.scope || 'global'}">${scopeLabels[preset.scope] || '全局'}</span>
                </div>
                <div class="item-preview">${escapeHtml(preset.content)}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn edit" onclick="openPresetModal('${preset.id}')" title="编辑">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M16 3 L21 8 L8 21 H3 V16 Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button class="item-btn delete" onclick="deletePreset('${preset.id}')" title="删除">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== WORLD BOOK FUNCTIONS ====================

function setupWorldBookModal() {
    const modal = document.getElementById('worldBookModal');
    const closeBtn = document.getElementById('worldBookModalClose');
    const cancelBtn = document.getElementById('worldBookModalCancel');
    const saveBtn = document.getElementById('worldBookModalSave');
    const addBtn = document.getElementById('addWorldBookBtn');

    addBtn.addEventListener('click', () => openWorldBookModal());
    closeBtn.addEventListener('click', closeWorldBookModal);
    cancelBtn.addEventListener('click', closeWorldBookModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeWorldBookModal();
    });
    saveBtn.addEventListener('click', saveWorldBookEntry);
}

function openWorldBookModal(entryId = null) {
    const modal = document.getElementById('worldBookModal');
    const title = document.getElementById('worldBookModalTitle');
    const categoryInput = document.getElementById('worldBookCategory');
    const categoryList = document.getElementById('categoryList');
    const keywordsInput = document.getElementById('worldBookKeywords');
    const entryInput = document.getElementById('worldBookEntryInput');
    const priorityInput = document.getElementById('worldBookPriority');
    const enabledInput = document.getElementById('worldBookEnabled');
    const scopeInput = document.getElementById('worldBookScope');

    // Update category datalist with existing categories
    const existingCategories = [...new Set(worldBook.map(e => e.category).filter(Boolean))];
    categoryList.innerHTML = existingCategories.map(c => `<option value="${escapeHtml(c)}">`).join('');

    editingWorldBookId = entryId;

    if (entryId) {
        const entry = worldBook.find(e => e.id === entryId);
        if (entry) {
            title.textContent = '编辑词条';
            categoryInput.value = entry.category || '';
            keywordsInput.value = entry.keywords.join(', ');
            entryInput.value = entry.content;
            priorityInput.value = entry.priority;
            enabledInput.checked = entry.enabled;
            scopeInput.value = entry.scope || 'global';
        }
    } else {
        title.textContent = '添加词条';
        categoryInput.value = '';
        keywordsInput.value = '';
        entryInput.value = '';
        priorityInput.value = '50';
        enabledInput.checked = true;
        scopeInput.value = 'global';
    }

    modal.classList.add('active');
}

function closeWorldBookModal() {
    const modal = document.getElementById('worldBookModal');
    modal.classList.remove('active');
    editingWorldBookId = null;
}

function saveWorldBookEntry() {
    const categoryInput = document.getElementById('worldBookCategory');
    const keywordsInput = document.getElementById('worldBookKeywords');
    const entryInput = document.getElementById('worldBookEntryInput');
    const priorityInput = document.getElementById('worldBookPriority');
    const enabledInput = document.getElementById('worldBookEnabled');
    const scopeInput = document.getElementById('worldBookScope');

    const category = categoryInput.value;
    const keywordsStr = keywordsInput.value.trim();
    const content = entryInput.value.trim();
    const priority = parseInt(priorityInput.value) || 50;
    const enabled = enabledInput.checked;
    const scope = scopeInput.value;

    if (!keywordsStr) {
        showToast('请输入关键词');
        return;
    }
    if (!content) {
        showToast('请输入词条内容');
        return;
    }

    const keywords = keywordsStr.split(/[,，]/).map(k => k.trim()).filter(Boolean);

    if (editingWorldBookId) {
        // Update existing
        const index = worldBook.findIndex(e => e.id === editingWorldBookId);
        if (index !== -1) {
            worldBook[index] = { ...worldBook[index], category, keywords, content, priority, enabled, scope };
        }
    } else {
        // Add new
        worldBook.push({
            id: Date.now().toString(),
            category,
            keywords,
            content,
            priority,
            enabled,
            scope
        });
    }

    // Sort by priority (higher first)
    worldBook.sort((a, b) => b.priority - a.priority);

    localStorage.setItem('worldBook', JSON.stringify(worldBook));
    renderWorldBook();
    closeWorldBookModal();
    showToast(editingWorldBookId ? '词条已更新' : '词条已添加');
}

function deleteWorldBookEntry(entryId) {
    worldBook = worldBook.filter(e => e.id !== entryId);
    localStorage.setItem('worldBook', JSON.stringify(worldBook));
    renderWorldBook();
    showToast('词条已删除');
}

function toggleWorldBookEntry(entryId) {
    const entry = worldBook.find(e => e.id === entryId);
    if (entry) {
        entry.enabled = !entry.enabled;
        localStorage.setItem('worldBook', JSON.stringify(worldBook));
        renderWorldBook();
    }
}

function renderWorldBook() {
    const list = document.getElementById('worldBookList');
    
    if (!list) {
        console.error('worldBookList element not found');
        return;
    }
    
    if (worldBook.length === 0) {
        list.innerHTML = '<div class="empty-state">暂无词条，点击下方按钮添加</div>';
        return;
    }

    // Group entries by category
    const categories = {};
    const uncategorized = [];
    
    worldBook.forEach(entry => {
        if (entry.category) {
            if (!categories[entry.category]) {
                categories[entry.category] = [];
            }
            categories[entry.category].push(entry);
        } else {
            uncategorized.push(entry);
        }
    });

    let html = '';

    // Render categorized entries
    Object.keys(categories).forEach(category => {
        const entries = categories[category];
        const enabledCount = entries.filter(e => e.enabled).length;
        html += `
            <div class="category-group" data-category="${escapeHtml(category)}">
                <div class="category-header" onclick="toggleCategory('${escapeHtml(category)}')">
                    <svg class="category-arrow" viewBox="0 0 20 20" fill="none">
                        <path d="M6 8 L10 12 L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span class="category-name">${escapeHtml(category)}</span>
                    <span class="category-count">${enabledCount}/${entries.length}</span>
                </div>
                <div class="category-content">
                    ${entries.map(entry => renderWorldBookItem(entry)).join('')}
                </div>
            </div>
        `;
    });

    // Render uncategorized entries
    if (uncategorized.length > 0) {
        html += `
            <div class="category-group" data-category="uncategorized">
                <div class="category-header" onclick="toggleCategory('uncategorized')">
                    <svg class="category-arrow" viewBox="0 0 20 20" fill="none">
                        <path d="M6 8 L10 12 L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span class="category-name">其他</span>
                    <span class="category-count">${uncategorized.filter(e => e.enabled).length}/${uncategorized.length}</span>
                </div>
                <div class="category-content">
                    ${uncategorized.map(entry => renderWorldBookItem(entry)).join('')}
                </div>
            </div>
        `;
    }

    list.innerHTML = html;
}

function renderWorldBookItem(entry) {
    const scopeLabels = {
        'global': '全局',
        'chuanyue': '穿越',
        'kuaichuan': '快穿',
        'chuanshu': '穿书',
        'wuxianliu': '无限流'
    };
    return `
        <div class="worldbook-item ${entry.enabled ? '' : 'disabled'}" data-id="${entry.id}">
            <div class="item-toggle">
                <input type="checkbox" ${entry.enabled ? 'checked' : ''} onchange="toggleWorldBookEntry('${entry.id}')">
            </div>
            <div class="item-info">
                <div class="item-keywords">
                    <span class="scope-tag ${entry.scope || 'global'}">${scopeLabels[entry.scope] || '全局'}</span>
                    ${entry.keywords.slice(0, 4).map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('')}
                    ${entry.keywords.length > 4 ? `<span class="keyword-tag">+${entry.keywords.length - 4}</span>` : ''}
                </div>
                <div class="item-preview">${escapeHtml(entry.content)}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn edit" onclick="openWorldBookModal('${entry.id}')" title="编辑">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M16 3 L21 8 L8 21 H3 V16 Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button class="item-btn delete" onclick="deleteWorldBookEntry('${entry.id}')" title="删除">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function toggleCategory(category) {
    const group = document.querySelector(`.category-group[data-category="${category}"]`);
    if (group) {
        group.classList.toggle('expanded');
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Format Story Text with styling
function formatStoryText(text) {
    if (!text) return '';
    
    // First escape HTML
    let formatted = escapeHtml(text);
    
    // Markdown格式支持
    // 加粗：**xxx** 或 __xxx__
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // 斜体：*xxx* 或 _xxx_ （单个星号/下划线）
    // 注意：先处理加粗，再处理斜体
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    formatted = formatted.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    
    // 删除线：~~xxx~~
    formatted = formatted.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // 行内代码：`xxx`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // 对话：中文引号 "xxx" 或 「xxx」 或 『xxx』
    formatted = formatted.replace(/["「『]([^"」』]+)["」』]/g, '<span class="story-dialogue">"$1"</span>');
    
    // 对话：英文引号
    formatted = formatted.replace(/"([^"]+)"/g, '<span class="story-dialogue">"$1"</span>');
    
    // 心理活动：（xxx）或 (xxx) - 括号内的内容
    formatted = formatted.replace(/[（(]([^）)]+)[）)]/g, '<span class="story-thought">（$1）</span>');
    
    // 声音效果：【xxx】或〖xxx〗
    formatted = formatted.replace(/[【〖]([^】〗]+)[】〗]/g, '<span class="story-sound">【$1】</span>');
    
    // 强调：《xxx》书名号
    formatted = formatted.replace(/《([^》]+)》/g, '<span class="story-emphasis">《$1》</span>');
    
    // 人名高亮：〈人名〉格式
    formatted = formatted.replace(/〈([^〉]+)〉/g, '<span class="story-name">$1</span>');
    
    // 环境描写：识别以景物词开头的句子
    const envKeywords = ['阳光', '月光', '风', '雨', '雪', '云', '雾', '天空', '大地', '树', '花', '草', '水', '河', '山', '石', '屋', '殿', '堂', '廊', '窗', '门', '帘', '烛', '灯', '香', '烟'];
    envKeywords.forEach(keyword => {
        const regex = new RegExp(`(^|。|！|？|\\n)(${keyword}[^。！？\\n]{10,}[。！？])`, 'g');
        formatted = formatted.replace(regex, '$1<span class="story-environment">$2</span>');
    });
    
    // 快穿世界选择按钮
    if (gameMode === 'kuaichuan' && formatted.includes('【世界一】')) {
        formatted = formatted.replace(/请回复数字\s*1、2\s*或\s*3\s*选择目标世界。?/g, '');
        formatted += `
            <div class="world-select-buttons">
                <button class="world-select-btn" onclick="selectWorld(1)">
                    <span class="btn-number">1</span>
                    <span class="btn-text">选择世界一</span>
                </button>
                <button class="world-select-btn" onclick="selectWorld(2)">
                    <span class="btn-number">2</span>
                    <span class="btn-text">选择世界二</span>
                </button>
                <button class="world-select-btn" onclick="selectWorld(3)">
                    <span class="btn-number">3</span>
                    <span class="btn-text">选择世界三</span>
                </button>
            </div>
        `;
    }
    
    // 换行处理
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// 快穿模式：选择世界
async function selectWorld(worldNumber) {
    // 禁用所有按钮并显示选中状态
    document.querySelectorAll('.world-select-btn').forEach((btn, index) => {
        btn.disabled = true;
        if (index + 1 === worldNumber) {
            btn.classList.add('selected');
            btn.innerHTML = `
                <span class="btn-number">${worldNumber}</span>
                <span class="btn-text">正在进入世界${worldNumber === 1 ? '一' : worldNumber === 2 ? '二' : '三'}...</span>
                <span class="btn-loading"></span>
            `;
        }
    });
    
    // 获取选择的世界信息（从最后一条AI消息中提取）
    const lastAiMsg = chatHistory.filter(m => m.type === 'ai').pop();
    let selectedWorldInfo = '';
    if (lastAiMsg) {
        const worldNames = ['一', '二', '三'];
        const worldName = worldNames[worldNumber - 1];
        const regex = new RegExp(`【世界${worldName}】([\\s\\S]*?)(?=【世界|$)`);
        const match = lastAiMsg.content.match(regex);
        if (match) {
            selectedWorldInfo = match[0].trim();
        }
    }
    
    // 删除世界选择消息
    chatHistory = chatHistory.filter(m => !m.content.includes('【世界一】'));
    localStorage.setItem(getStorageKey('chatHistory'), JSON.stringify(chatHistory));
    renderChatHistory();
    
    // 保存世界设定
    if (selectedWorldInfo) {
        // 解析任务
        let currentTask = '';
        const taskMatch = selectedWorldInfo.match(/🎯\s*任务[：:]\s*([^\n]+)/);
        if (taskMatch) {
            currentTask = taskMatch[1].trim();
        }
        
        worldBuildingData = {
            selectedWorld: selectedWorldInfo,
            currentTask: currentTask,
            generatedAt: Date.now()
        };
        worldBuildingGenerated = false; // 允许继续生成详细设定
        localStorage.setItem(getStorageKey('worldBuildingData'), JSON.stringify(worldBuildingData));
        renderWorldBuilding();
    }
    
    // 快穿模式：每个世界单独随机性别
    await handleKuaichuanGenderRandomization();
    
    // 生成该世界的开场剧情
    await generateWorldOpening(worldNumber, selectedWorldInfo);
}

// 快穿模式：每个世界单独随机性别
async function handleKuaichuanGenderRandomization() {
    if (chuanyueRulesData?.genderSetting !== 'random') {
        // 不是概率双性，清除之前的随机结果
        if (chuanyueRulesData) {
            chuanyueRulesData.confirmedGender = null;
            localStorage.setItem(getStorageKey('chuanyueRulesData'), JSON.stringify(chuanyueRulesData));
        }
        renderWorldInfo();
        return;
    }
    
    // 获取原本性别
    const originalGender = characterProfile?.gender || 'male';
    const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
    const originalGenderText = genderMap[originalGender] || '男';
    
    // 30%概率变成双性
    const isIntersex = Math.random() < 0.3;
    
    // 保存确定后的性别
    const confirmedGender = isIntersex ? 'intersex' : originalGender;
    chuanyueRulesData.confirmedGender = confirmedGender;
    localStorage.setItem(getStorageKey('chuanyueRulesData'), JSON.stringify(chuanyueRulesData));
    
    // 添加系统消息显示结果
    const messagesContainer = document.getElementById('messagesContainer');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'message system-message gender-result-message';
    
    if (isIntersex) {
        systemMsg.innerHTML = `
            <div class="gender-result intersex">
                <div class="gender-result-icon">⚧️</div>
                <div class="gender-result-content">
                    <div class="gender-result-title">【本世界性别随机】</div>
                    <div class="gender-result-text">穿越时空的波动... 你在本世界获得了<strong>双性体质</strong>！</div>
                    <div class="gender-result-desc">同时拥有男性和女性的身体特征，这将影响你在这个世界的体验。</div>
                </div>
            </div>
        `;
    } else {
        systemMsg.innerHTML = `
            <div class="gender-result normal">
                <div class="gender-result-icon">${originalGender === 'male' ? '♂️' : originalGender === 'female' ? '♀️' : '⚥'}</div>
                <div class="gender-result-content">
                    <div class="gender-result-title">【本世界性别随机】</div>
                    <div class="gender-result-text">穿越时空的波动... 你在本世界保持<strong>${originalGenderText}性</strong>身份。</div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(systemMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 更新侧边栏显示
    renderWorldInfo();
}

// 生成选择的世界开场
async function generateWorldOpening(worldNumber, worldInfo) {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先配置API');
        return;
    }
    
    addLoadingMessage();
    
    try {
        const systemPrompt = buildChuanyueSystemPrompt();
        const worldNames = ['一', '二', '三'];
        
        const userPrompt = `用户选择了世界${worldNames[worldNumber - 1]}，请生成该世界的开场剧情。

【选择的世界信息】
${worldInfo}

【要求】
1. 首先生成当前场景的状态信息（JSON格式）
2. 然后生成开场描写（300-500字）
3. 描写用户穿越进入该世界的场景
4. 介绍用户的身份和当前处境
5. 自然引入目标角色或暗示其存在

请严格按以下格式返回：
【状态】
{"date":"日期","time":"时间","location":"地点","weather":"天气"}
【正文】
（开场描写内容）`;

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: apiSettings.temperature || 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // 解析状态
        const statusMatch = content.match(/【状态】\s*(\{[\s\S]*?\})/);
        const textMatch = content.match(/【正文】\s*([\s\S]*)/);

        if (statusMatch) {
            try {
                chatStatus = JSON.parse(statusMatch[1]);
                localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
                updateStatusBar();
            } catch (e) {
                console.error('Parse status error:', e);
            }
        }

        removeLoadingMessage();
        
        const aiText = textMatch ? textMatch[1].trim() : content.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
        addMessage('ai', aiText);

    } catch (error) {
        console.error('Generate world opening error:', error);
        removeLoadingMessage();
        addMessage('ai', '穿越通道出现异常...请稍后再试。');
        showToast('生成失败: ' + error.message);
    }
}

// Get active presets for AI context (filtered by scope)
function getActivePresets() {
    return presets
        .filter(p => p.enabled && (p.scope === 'global' || p.scope === gameMode || !p.scope))
        .map(p => p.content);
}

// Get matching world book entries for given text (filtered by scope)
function getMatchingWorldBookEntries(text) {
    const textLower = text.toLowerCase();
    return worldBook
        .filter(e => e.enabled && 
            (e.scope === 'global' || e.scope === gameMode || !e.scope) &&
            e.keywords.some(k => textLower.includes(k.toLowerCase())))
        .sort((a, b) => b.priority - a.priority)
        .map(e => e.content);
}

// Build complete system prompt for AI (includes hidden core + user presets + world book)
function buildSystemPrompt(userInput = '', charName = 'AI', userName = '用户') {
    const parts = [];
    
    // 1. Hidden core system prompt (always included, user cannot see)
    let corePrompt = SYSTEM_PROMPT_CORE
        .replace(/\{\{char\}\}/g, charName)
        .replace(/\{\{user\}\}/g, userName);
    parts.push(corePrompt);
    
    // 2. User-defined presets (enabled ones)
    const activePresets = getActivePresets();
    if (activePresets.length > 0) {
        parts.push('\n【用户预设】\n' + activePresets.join('\n\n'));
    }
    
    // 3. Matching world book entries based on user input
    if (userInput) {
        const matchedEntries = getMatchingWorldBookEntries(userInput);
        if (matchedEntries.length > 0) {
            parts.push('\n【世界观设定】\n' + matchedEntries.join('\n\n'));
        }
    }
    
    return parts.join('\n');
}

// Send message to AI API
async function sendToAI(messages, charName = 'AI', userName = '用户') {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        throw new Error('请先在设置中配置API');
    }
    
    // Get the last user message for world book matching
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const userInput = lastUserMsg ? lastUserMsg.content : '';
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(userInput, charName, userName);
    
    // Prepare messages with system prompt
    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];
    
    const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiSettings.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: apiSettings.model,
            messages: apiMessages,
            temperature: apiSettings.temperature
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

// ==================== CHUANYUE MODE FUNCTIONS ====================

function setupChuanyueMode() {
    const backBtn = document.getElementById('chuanyueBack');
    const toggleBtn = document.getElementById('sidebarToggle');
    const floatingMenuBtn = document.getElementById('floatingMenuBtn');
    const editBtn = document.getElementById('editProfileBtn');
    const createBtn = document.getElementById('createProfileBtn');
    const profileModal = document.getElementById('profileModal');
    const modalClose = document.getElementById('profileModalClose');
    const modalCancel = document.getElementById('profileModalCancel');
    const modalSave = document.getElementById('profileModalSave');
    const startBtn = document.getElementById('startChuanyueBtn');

    // Back to main menu
    if (backBtn) backBtn.addEventListener('click', closeChuanyueMode);

    // Toggle sidebar
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    
    // Clear all data button
    const clearAllDataBtn = document.getElementById('clearAllDataBtn');
    if (clearAllDataBtn) {
        clearAllDataBtn.addEventListener('click', confirmClearAllData);
    }
    
    // Floating menu button to expand sidebar
    if (floatingMenuBtn) floatingMenuBtn.addEventListener('click', expandSidebar);
    
    // Click overlay to collapse sidebar
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', collapseSidebar);
    }

    // Open profile modal (已删除人设卡片，这些按钮不再存在)
    if (editBtn) editBtn.addEventListener('click', () => openProfileModal(true));
    if (createBtn) createBtn.addEventListener('click', () => openProfileModal(false));

    // Close profile modal
    if (modalClose) modalClose.addEventListener('click', closeProfileModal);
    if (modalCancel) modalCancel.addEventListener('click', closeProfileModal);
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeProfileModal();
        });
    }

    // Save profile
    if (modalSave) modalSave.addEventListener('click', saveProfile);

    // Gender selection
    setupGenderSelect();

    // Start button - open rules modal
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // 已删除人设功能，直接打开设定模态框
            openChuanyueRulesModal();
        });
    }

    // World info header toggle (collapsible)
    const worldInfoHeader = document.getElementById('worldInfoHeader');
    if (worldInfoHeader) {
        worldInfoHeader.addEventListener('click', () => {
            const body = document.getElementById('worldInfoBody');
            const toggle = worldInfoHeader.querySelector('.sidebar-card-toggle');
            if (body) body.classList.toggle('collapsed');
            if (body && toggle) {
                if (body.classList.contains('collapsed')) {
                    toggle.style.transform = 'rotate(-90deg)';
                } else {
                    toggle.style.transform = 'rotate(0deg)';
                }
            }
        });
    }

    // World building header toggle (collapsible)
    const worldBuildingHeader = document.getElementById('worldBuildingHeader');
    if (worldBuildingHeader) {
        worldBuildingHeader.addEventListener('click', (e) => {
            // Don't toggle if clicking on refresh button
            if (e.target.closest('.sidebar-card-refresh')) return;
            const body = document.getElementById('worldBuildingBody');
            const toggle = worldBuildingHeader.querySelector('.sidebar-card-toggle');
            if (body) body.classList.toggle('collapsed');
            if (body && toggle) {
                if (body.classList.contains('collapsed')) {
                    toggle.style.transform = 'rotate(-90deg)';
                } else {
                    toggle.style.transform = 'rotate(0deg)';
                }
            }
        });
    }

    // Refresh world building button
    const refreshWorldBuilding = document.getElementById('refreshWorldBuilding');
    if (refreshWorldBuilding) {
        refreshWorldBuilding.addEventListener('click', generateWorldBuilding);
    }
    
    // Refresh trans char button
    const refreshTransCharBtn = document.getElementById('refreshTransCharBtn');
    if (refreshTransCharBtn) {
        refreshTransCharBtn.addEventListener('click', generateTransChar);
    }
    
    // Trans char card toggle
    const transCharHeader = document.getElementById('transCharHeader');
    if (transCharHeader) {
        transCharHeader.addEventListener('click', (e) => {
            if (e.target.closest('.sidebar-card-refresh')) return;
            const body = document.getElementById('transCharBody');
            const toggle = document.querySelector('#transCharCard .sidebar-card-toggle svg');
            if (body) body.classList.toggle('collapsed');
            if (toggle && body) {
                toggle.style.transform = body.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    }

    // Restart button
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartChuanyue);
    }

    // Setup rules modal
    setupChuanyueRulesModal();

    // Setup chat
    setupChat();
    
    // Render world info if exists
    renderWorldInfo();
    
    // Render transmigrated character if exists
    renderTransChar();
    
    // Render world building if exists
    renderWorldBuilding();
    
    // Restore chat interface if already started
    if (isChuanyueStarted) {
        showChatInterface();
    }
}

// ==================== CHUANYUE RULES MODAL ====================

function setupChuanyueRulesModal() {
    const modal = document.getElementById('chuanyueRulesModal');
    const closeBtn = document.getElementById('rulesModalClose');
    const cancelBtn = document.getElementById('rulesModalCancel');
    const confirmBtn = document.getElementById('rulesModalConfirm');
    const genderSettingBtns = document.querySelectorAll('.gender-setting-btn');
    const genderSettingInput = document.getElementById('genderSetting');
    const aiPolishBtn = document.getElementById('aiPolishBtn');

    // Close modal
    closeBtn.addEventListener('click', closeChuanyueRulesModal);
    cancelBtn.addEventListener('click', closeChuanyueRulesModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeChuanyueRulesModal();
    });

    // Gender setting selection
    genderSettingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderSettingBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            genderSettingInput.value = btn.dataset.setting;
        });
    });

    // Set default active
    genderSettingBtns[0].classList.add('active');

    // AI Polish button
    aiPolishBtn.addEventListener('click', polishChuanyueSettings);

    // Confirm button
    confirmBtn.addEventListener('click', confirmChuanyue);
}

// AI Polish Chuanyue Settings
async function polishChuanyueSettings() {
    const rules = document.getElementById('chuanyueRules').value.trim();
    const settings = document.getElementById('chuanyueSettings').value.trim();
    const polishBtn = document.getElementById('aiPolishBtn');
    
    // 穿书模式特殊处理
    if (gameMode === 'chuanshu') {
        const novel = document.getElementById('chuanshuNovel').value.trim();
        const identity = document.getElementById('chuanshuIdentity').value.trim();
        
        if (!novel && !identity && !rules) {
            showToast('请先填写一些内容');
            return;
        }
        
        await polishChuanshuSettings();
        return;
    }
    
    if (!rules && !settings) {
        showToast('请先填写一些内容');
        return;
    }

    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    // Set loading state
    polishBtn.disabled = true;
    polishBtn.classList.add('loading');
    polishBtn.querySelector('span').textContent = '完善中...';

    try {
        const prompt = `请帮我完善以下穿越故事的设定，保留用户原有的想法并进行扩展补充，使其更加丰富详细。

用户填写的穿越规则：
${rules || '（用户未填写）'}

用户填写的世界设定：
${settings || '（用户未填写）'}

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "rules": "完善后的穿越规则（保留用户原意，补充到3-5条，每条一行）",
  "settings": "完善后的世界设定（保留用户原意，扩展到100-200字，包含世界背景、特点、社会结构等）"
}`;

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是一个专业的穿越小说设定助手。请根据用户已填写的内容进行完善和扩展，保留用户的核心想法，使设定更加丰富和有趣。只返回JSON格式，不要有其他内容。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            document.getElementById('chuanyueRules').value = result.rules || rules;
            document.getElementById('chuanyueSettings').value = result.settings || settings;
            showToast('完善成功！');
        } else {
            throw new Error('无法解析AI返回内容');
        }

    } catch (error) {
        console.error('Polish error:', error);
        showToast('完善失败: ' + error.message);
    } finally {
        polishBtn.disabled = false;
        polishBtn.classList.remove('loading');
        polishBtn.querySelector('span').textContent = 'AI 完善';
    }
}

// 穿书模式AI优化
async function polishChuanshuSettings() {
    const novel = document.getElementById('chuanshuNovel').value.trim();
    const identity = document.getElementById('chuanshuIdentity').value.trim();
    const rules = document.getElementById('chuanyueRules').value.trim();
    const rebirth = document.getElementById('chuanshuRebirth').value;
    const polishBtn = document.getElementById('aiPolishBtn');
    
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }
    
    polishBtn.disabled = true;
    polishBtn.classList.add('loading');
    polishBtn.querySelector('span').textContent = '完善中...';
    
    const rebirthLabels = {
        'none': '无重生角色',
        'protagonist': '主角重生',
        'supporting': '男二重生',
        'villain': '反派重生'
    };
    
    try {
        const prompt = `请帮我完善以下穿书故事的设定。

用户填写的原著内容：
${novel || '（用户未填写）'}

角色重生设定：${rebirthLabels[rebirth] || '无'}

用户填写的穿越身份：
${identity || '（用户未填写）'}

用户填写的穿书规则：
${rules || '（用户未填写）'}

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "novel": "完善后的原著内容（扩展到150-300字，包含故事背景、主要角色关系、核心剧情线）",
  "identity": "完善后的穿越身份（50-100字，明确身份、与主要角色的关系、初始处境）",
  "rules": "完善后的穿书规则（3-5条，包含剧情限制、可改变的内容、特殊规则等）"
}`;

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是一个专业的穿书小说设定助手。请根据用户填写的内容进行完善和扩展，保留用户的核心想法，使设定更加丰富、有趣且符合穿书文逻辑。只返回JSON格式。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            // 确保各字段是字符串
            if (result.novel) {
                document.getElementById('chuanshuNovel').value = typeof result.novel === 'string' ? result.novel : JSON.stringify(result.novel);
            }
            if (result.identity) {
                document.getElementById('chuanshuIdentity').value = typeof result.identity === 'string' ? result.identity : JSON.stringify(result.identity);
            }
            if (result.rules) {
                // 如果rules是数组，转换为换行分隔的字符串
                let rulesText = result.rules;
                if (Array.isArray(rulesText)) {
                    rulesText = rulesText.join('\n');
                } else if (typeof rulesText !== 'string') {
                    rulesText = JSON.stringify(rulesText);
                }
                document.getElementById('chuanyueRules').value = rulesText;
            }
            showToast('完善成功！');
        } else {
            throw new Error('无法解析AI返回内容');
        }
    } catch (error) {
        console.error('Polish error:', error);
        showToast('完善失败: ' + error.message);
    } finally {
        polishBtn.disabled = false;
        polishBtn.classList.remove('loading');
        polishBtn.querySelector('span').textContent = 'AI 完善';
    }
}

function openChuanyueRulesModal() {
    const modal = document.getElementById('chuanyueRulesModal');
    const genderSettingBtns = document.querySelectorAll('.gender-setting-btn');
    const worldSettingsItem = document.getElementById('worldSettingsItem');
    const rulesModalTitle = document.getElementById('rulesModalTitle');
    const rulesLabel = document.getElementById('rulesLabel');
    const rulesTextarea = document.getElementById('chuanyueRules');
    const rulesItem = document.getElementById('rulesItem');
    const kuaichuanTypeItem = document.getElementById('kuaichuanTypeItem');
    const kuaichuanTypeBtns = document.querySelectorAll('.kuaichuan-type-btn');
    const aiPolishBtn = document.getElementById('aiPolishBtn');
    const basicInfoGroup = document.getElementById('basicInfoGroup');

    // 默认隐藏穿书设定
    const chuanshuGroup = document.getElementById('chuanshuSettingsGroup');
    chuanshuGroup.style.display = 'none';
    
    // 默认隐藏无限流设定
    document.getElementById('wuxianliuRoleItem').style.display = 'none';
    document.getElementById('wuxianliuTypeItem').style.display = 'none';
    
    // 根据模式显示/隐藏基本信息
    if (gameMode === 'chuanyue' || gameMode === 'kuaichuan') {
        basicInfoGroup.style.display = 'block';
    } else {
        basicInfoGroup.style.display = 'none';
    }
    
    // Adjust modal based on game mode
    if (gameMode === 'kuaichuan') {
        rulesModalTitle.textContent = '快穿系统设定';
        kuaichuanTypeItem.style.display = '';
        rulesItem.style.display = 'none';
        worldSettingsItem.style.display = 'none';
        aiPolishBtn.style.display = 'none';
        
        // Setup kuaichuan type buttons
        kuaichuanTypeBtns.forEach(btn => {
            btn.onclick = () => {
                kuaichuanTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('kuaichuanType').value = btn.dataset.type;
            };
        });
    } else if (gameMode === 'chuanshu') {
        rulesModalTitle.textContent = '穿书设定';
        rulesLabel.textContent = '穿书规则';
        rulesTextarea.placeholder = '如：不能透露原著剧情、可以改变人物命运、需要完成剧情任务...';
        kuaichuanTypeItem.style.display = 'none';
        rulesItem.style.display = '';
        worldSettingsItem.style.display = 'none'; // 隐藏普通世界设定
        aiPolishBtn.style.display = '';
        
        // 显示穿书专用设定
        const chuanshuGroup = document.getElementById('chuanshuSettingsGroup');
        chuanshuGroup.style.display = '';
        
        // 设置穿书角色选择按钮事件
        const chuanshuRoleBtns = document.querySelectorAll('.chuanshu-role-btn');
        chuanshuRoleBtns.forEach(btn => {
            btn.onclick = () => {
                chuanshuRoleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('chuanshuRebirth').value = btn.dataset.role;
            };
        });
        
        // 加载已保存的穿书数据
        if (chuanyueRulesData) {
            document.getElementById('chuanshuNovel').value = chuanyueRulesData.novel || '';
            document.getElementById('chuanshuIdentity').value = chuanyueRulesData.identity || '';
            document.getElementById('chuanshuRebirth').value = chuanyueRulesData.rebirth || 'none';
            chuanshuRoleBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.role === (chuanyueRulesData.rebirth || 'none'));
            });
        } else {
            // 默认选中"无重生"
            chuanshuRoleBtns[0]?.classList.add('active');
        }
    } else if (gameMode === 'wuxianliu') {
        rulesModalTitle.textContent = '无限流设定';
        rulesLabel.textContent = '副本规则';
        rulesTextarea.placeholder = '如：完成副本任务、积累积分、获取技能...';
        kuaichuanTypeItem.style.display = 'none';
        rulesItem.style.display = '';
        worldSettingsItem.style.display = '';
        aiPolishBtn.style.display = '';
        // 更新世界设定标签
        worldSettingsItem.querySelector('.form-label').textContent = '首个副本背景';
        document.getElementById('chuanyueSettings').placeholder = '请介绍第一个副本的背景设定...\n如：废弃医院、古宅、孤岛、游轮等场景';
        // 显示类型选择
        document.getElementById('wuxianliuTypeItem').style.display = '';
        // 显示角色扮演设定
        document.getElementById('wuxianliuRoleItem').style.display = '';
        // 加载已保存的角色设定
        document.getElementById('wuxianliuRole').value = chuanyueRulesData?.wuxianliuRole || '';
        
        // 设置无限流类型按钮事件
        const wuxianliuTypeBtns = document.querySelectorAll('.wuxianliu-type-btn');
        const updateWuxianliuTypeUI = (type) => {
            if (type === 'horror') {
                // 恐怖求生模式：隐藏副本设定和规则
                worldSettingsItem.style.display = 'none';
                rulesItem.style.display = 'none';
            } else {
                // 自定义模式：显示副本设定和规则
                worldSettingsItem.style.display = '';
                rulesItem.style.display = '';
                document.getElementById('chuanyueSettings').placeholder = '请介绍第一个副本的背景设定...';
                rulesTextarea.placeholder = '如：完成副本任务、积累积分、获取技能...';
            }
        };
        
        wuxianliuTypeBtns.forEach(btn => {
            btn.onclick = () => {
                wuxianliuTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('wuxianliuType').value = btn.dataset.type;
                updateWuxianliuTypeUI(btn.dataset.type);
            };
        });
        
        // 加载已保存的类型
        const savedType = chuanyueRulesData?.wuxianliuType || 'custom';
        document.getElementById('wuxianliuType').value = savedType;
        wuxianliuTypeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === savedType);
        });
        // 默认选中自定义
        if (!chuanyueRulesData?.wuxianliuType) {
            wuxianliuTypeBtns[0]?.classList.add('active');
        }
        // 根据当前类型更新UI
        updateWuxianliuTypeUI(savedType);
    } else {
        rulesModalTitle.textContent = '穿越设定';
        rulesLabel.textContent = '穿越规则';
        rulesTextarea.placeholder = '如：不能暴露穿越者身份、需要完成系统任务、可以保留前世记忆...';
        kuaichuanTypeItem.style.display = 'none';
        rulesItem.style.display = '';
        worldSettingsItem.style.display = '';
        aiPolishBtn.style.display = '';
        // 更新世界设定标签
        worldSettingsItem.querySelector('.form-label').textContent = '世界设定';
        document.getElementById('chuanyueSettings').placeholder = '如：古代宫廷、现代都市、修仙世界、ABO设定...';
    }

    // Load saved data if exists
    if (chuanyueRulesData) {
        document.getElementById('chuanyueRules').value = chuanyueRulesData.rules || '';
        document.getElementById('chuanyueSettings').value = chuanyueRulesData.settings || '';
        document.getElementById('genderSetting').value = chuanyueRulesData.genderSetting || 'keep';
        document.getElementById('livestreamEnabled').checked = chuanyueRulesData.livestreamEnabled || false;
        document.getElementById('kuaichuanType').value = chuanyueRulesData.kuaichuanType || '';
        
        // 加载基本信息
        if (gameMode === 'chuanyue' || gameMode === 'kuaichuan') {
            document.getElementById('userName').value = chuanyueRulesData.userName || '';
            document.getElementById('userAge').value = chuanyueRulesData.userAge || '';
            document.getElementById('userGender').value = chuanyueRulesData.userGender || '';
            document.getElementById('userPreference').value = chuanyueRulesData.userPreference || '';
        }
        
        genderSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.setting === chuanyueRulesData.genderSetting);
        });
        kuaichuanTypeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === chuanyueRulesData.kuaichuanType);
        });
    } else {
        document.getElementById('chuanyueRules').value = '';
        document.getElementById('chuanyueSettings').value = '';
        document.getElementById('genderSetting').value = 'keep';
        document.getElementById('livestreamEnabled').checked = false;
        document.getElementById('kuaichuanType').value = '';
        
        // 清空基本信息
        if (gameMode === 'chuanyue' || gameMode === 'kuaichuan') {
            document.getElementById('userName').value = '';
            document.getElementById('userAge').value = '';
            document.getElementById('userGender').value = '';
            document.getElementById('userPreference').value = '';
        }
        
        genderSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.setting === 'keep');
        });
        kuaichuanTypeBtns.forEach(btn => {
            btn.classList.remove('active');
        });
    }

    modal.classList.add('active');
}

function closeChuanyueRulesModal() {
    const modal = document.getElementById('chuanyueRulesModal');
    modal.classList.remove('active');
}

function confirmChuanyue() {
    const rules = document.getElementById('chuanyueRules').value.trim();
    const settings = document.getElementById('chuanyueSettings').value.trim();
    const genderSetting = document.getElementById('genderSetting').value;
    const livestreamEnabled = document.getElementById('livestreamEnabled').checked;
    const kuaichuanType = document.getElementById('kuaichuanType').value;
    
    // 获取基本信息（穿越/快穿模式）
    let basicInfo = {};
    if (gameMode === 'chuanyue' || gameMode === 'kuaichuan') {
        const userName = document.getElementById('userName').value.trim();
        const userAge = document.getElementById('userAge').value.trim();
        const userGender = document.getElementById('userGender').value;
        const userPreference = document.getElementById('userPreference').value.trim();
        
        if (!userName) {
            showToast('请填写姓名');
            return;
        }
        
        basicInfo = { userName, userAge, userGender, userPreference };
    }

    // Validate for kuaichuan mode
    if (gameMode === 'kuaichuan' && !kuaichuanType) {
        showToast('请选择任务类型');
        return;
    }
    
    // 穿书模式专用数据
    let chuanshuData = {};
    if (gameMode === 'chuanshu') {
        const novel = document.getElementById('chuanshuNovel').value.trim();
        const identity = document.getElementById('chuanshuIdentity').value.trim();
        const rebirth = document.getElementById('chuanshuRebirth').value;
        
        if (!novel) {
            showToast('请填写原著内容');
            return;
        }
        
        chuanshuData = { novel, identity, rebirth };
    }
    
    // 无限流模式专用数据
    let wuxianliuData = {};
    if (gameMode === 'wuxianliu') {
        const wuxianliuRole = document.getElementById('wuxianliuRole').value.trim();
        const wuxianliuType = document.getElementById('wuxianliuType').value || 'custom';
        
        if (!wuxianliuRole) {
            showToast('请填写你的角色设定');
            return;
        }
        
        // 自定义模式需要填写副本背景，恐怖求生模式不需要
        if (wuxianliuType === 'custom' && !settings) {
            showToast('请填写副本背景');
            return;
        }
        
        wuxianliuData = { wuxianliuRole, wuxianliuType };
    }

    // Save rules data
    chuanyueRulesData = {
        rules,
        settings,
        genderSetting,
        livestreamEnabled,
        kuaichuanType,
        ...basicInfo,
        ...chuanshuData,
        ...wuxianliuData,
        updatedAt: Date.now()
    };
    localStorage.setItem(getStorageKey('chuanyueRulesData'), JSON.stringify(chuanyueRulesData));

    closeChuanyueRulesModal();
    
    // Render world info in sidebar
    renderWorldInfo();
    
    // Start chuanyue - show chat interface
    startChuanyueSession();
}

function renderWorldInfo() {
    const card = document.getElementById('worldInfoCard');
    const body = document.getElementById('worldInfoBody');
    
    if (!chuanyueRulesData) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    
    const genderSettingMap = {
        'keep': { text: '保持当前', icon: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><path d="M12 8 V16 M8 12 H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
        'random': { text: '概率双性', icon: '<circle cx="8" cy="16" r="5" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="8" r="5" stroke="currentColor" stroke-width="2"/>' }
    };
    
    let html = '';
    const isKuaichuan = gameMode === 'kuaichuan';
    
    // Kuaichuan type section
    if (isKuaichuan && chuanyueRulesData.kuaichuanType) {
        const typeMap = {
            'ganhua': { name: '感化', icon: '💝' },
            'jiushu': { name: '救赎', icon: '🌟' },
            'gonglue': { name: '攻略', icon: '💕' },
            'yangcheng': { name: '养成', icon: '🌱' }
        };
        const typeInfo = typeMap[chuanyueRulesData.kuaichuanType];
        html += `
            <div class="world-info-section">
                <div class="world-info-section-title">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" stroke="currentColor" stroke-width="2"/></svg>
                    任务类型
                </div>
                <div class="world-info-gender-tag">
                    ${typeInfo.icon} ${typeInfo.name}线
                </div>
            </div>
        `;
    }
    
    // 穿书模式专用显示
    if (gameMode === 'chuanshu') {
        if (chuanyueRulesData.novel) {
            html += `
                <div class="world-info-section">
                    <div class="world-info-section-title">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="2"/></svg>
                        📚 原著内容
                    </div>
                    <div class="world-info-section-content">${escapeHtml(chuanyueRulesData.novel)}</div>
                </div>
            `;
        }
        
        if (chuanyueRulesData.rebirth && chuanyueRulesData.rebirth !== 'none') {
            const rebirthLabels = {
                'protagonist': '👑 主角重生',
                'supporting': '🎭 男二重生',
                'villain': '🖤 反派重生'
            };
            html += `
                <div class="world-info-section">
                    <div class="world-info-section-title">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" stroke="currentColor" stroke-width="2"/></svg>
                        🔄 重生设定
                    </div>
                    <div class="world-info-gender-tag">${rebirthLabels[chuanyueRulesData.rebirth]}</div>
                </div>
            `;
        }
        
        if (chuanyueRulesData.identity) {
            html += `
                <div class="world-info-section">
                    <div class="world-info-section-title">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                        👤 穿书身份
                    </div>
                    <div class="world-info-section-content">${escapeHtml(chuanyueRulesData.identity)}</div>
                </div>
            `;
        }
    }
    
    // 无限流模式专用显示
    if (gameMode === 'wuxianliu') {
        // 副本类型
        if (chuanyueRulesData.wuxianliuType) {
            const typeInfo = {
                'custom': { name: '自定义', icon: '📝' },
                'horror': { name: '恐怖求生', icon: '👻' }
            };
            const type = typeInfo[chuanyueRulesData.wuxianliuType] || typeInfo['custom'];
            html += `
                <div class="world-info-section">
                    <div class="world-info-section-title">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" stroke="currentColor" stroke-width="2"/></svg>
                        副本类型
                    </div>
                    <div class="world-info-gender-tag">
                        ${type.icon} ${type.name}
                    </div>
                </div>
            `;
        }
        
        // 用户角色设定
        if (chuanyueRulesData.wuxianliuRole) {
            html += `
                <div class="world-info-section wuxianliu-role-section">
                    <div class="world-info-section-title">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                        👤 你的角色
                    </div>
                    <div class="world-info-section-content wuxianliu-role-content">${escapeHtml(chuanyueRulesData.wuxianliuRole)}</div>
                </div>
            `;
        }
        
        // 副本设定/世界观
        // 自定义模式才显示副本设定和规则
        if (chuanyueRulesData.wuxianliuType !== 'horror') {
            if (chuanyueRulesData.settings) {
                html += `
                    <div class="world-info-section">
                        <div class="world-info-section-title">
                            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M2 12 H22" stroke="currentColor" stroke-width="2"/></svg>
                            🎮 副本世界观
                        </div>
                        <div class="world-info-section-content">${escapeHtml(chuanyueRulesData.settings)}</div>
                    </div>
                `;
            }
            
            // 副本规则
            if (chuanyueRulesData.rules) {
                html += `
                    <div class="world-info-section">
                        <div class="world-info-section-title">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M9 5 H7 a2 2 0 0 0-2 2 v12 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 V7 a2 2 0 0 0-2-2 h-2 M9 5 a2 2 0 0 1 2-2 h2 a2 2 0 0 1 2 2 v0 a2 2 0 0 1-2 2 h-2 a2 2 0 0 1-2-2 z" stroke="currentColor" stroke-width="2"/></svg>
                            📜 副本规则
                        </div>
                        <div class="world-info-section-content">${escapeHtml(chuanyueRulesData.rules)}</div>
                    </div>
                `;
            }
        }
    }
    
    // Rules section (非快穿、非无限流模式)
    if (chuanyueRulesData.rules && !isKuaichuan && gameMode !== 'wuxianliu') {
        html += `
            <div class="world-info-section">
                <div class="world-info-section-title">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M9 5 H7 a2 2 0 0 0-2 2 v12 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 V7 a2 2 0 0 0-2-2 h-2 M9 5 a2 2 0 0 1 2-2 h2 a2 2 0 0 1 2 2 v0 a2 2 0 0 1-2 2 h-2 a2 2 0 0 1-2-2 z" stroke="currentColor" stroke-width="2"/></svg>
                    穿越规则
                </div>
                <div class="world-info-section-content">${escapeHtml(chuanyueRulesData.rules)}</div>
            </div>
        `;
    }
    
    // Settings section (非快穿、非无限流模式)
    if (chuanyueRulesData.settings && !isKuaichuan && gameMode !== 'wuxianliu') {
        html += `
            <div class="world-info-section">
                <div class="world-info-section-title">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M2 12 H22" stroke="currentColor" stroke-width="2"/></svg>
                    世界设定
                </div>
                <div class="world-info-section-content">${escapeHtml(chuanyueRulesData.settings)}</div>
            </div>
        `;
    }
    
    // Gender setting - 显示确定后的性别
    if (chuanyueRulesData.confirmedGender) {
        // 已确定性别
        const isIntersex = chuanyueRulesData.confirmedGender === 'intersex';
        const genderTextMap = { 'male': '男性', 'female': '女性', 'other': '其他', 'intersex': '双性体质' };
        const confirmedText = genderTextMap[chuanyueRulesData.confirmedGender] || '未知';
        
        html += `
            <div class="world-info-section ${isIntersex ? 'gender-intersex-section' : ''}">
                <div class="world-info-section-title">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>
                    ${isIntersex ? '⚧️' : ''} 穿越后性别
                </div>
                <div class="world-info-gender-tag ${isIntersex ? 'intersex-tag' : ''}">
                    ${isIntersex ? '⚧️ 双性体质（已确定）' : confirmedText + '（已确定）'}
                </div>
            </div>
        `;
    } else if (chuanyueRulesData.genderSetting) {
        // 未确定，显示设定选项
        const genderInfo = genderSettingMap[chuanyueRulesData.genderSetting] || { text: chuanyueRulesData.genderSetting, icon: '' };
        html += `
            <div class="world-info-section">
                <div class="world-info-section-title">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>
                    性别设定
                </div>
                <div class="world-info-gender-tag">
                    <svg viewBox="0 0 24 24" fill="none">${genderInfo.icon}</svg>
                    ${genderInfo.text}
                </div>
            </div>
        `;
    }
    
    body.innerHTML = html || '<div style="color:var(--text-muted);">暂无设定</div>';
}

function openChuanyueMode() {
    document.getElementById('mainSection').classList.remove('active');
    document.getElementById('chuanyueSection').classList.add('active');
    currentPage = 'chuanyue';
    localStorage.setItem('currentPage', currentPage);
    
    // Update title based on game mode
    const modeTitle = {
        'chuanyue': '穿越模式',
        'kuaichuan': '快穿模式',
        'chuanshu': '穿书模式',
        'wuxianliu': '无限流模式'
    };
    document.getElementById('gameModeTitle').textContent = modeTitle[gameMode] || '穿越模式';
    
    // Show/hide cards based on game mode
    const transCharCard = document.getElementById('transCharCard');
    const worldBuildingCard = document.getElementById('worldBuildingCard');
    const worldInfoTitle = document.querySelector('#worldInfoCard .sidebar-card-title');
    const worldBuildingTitle = document.querySelector('#worldBuildingCard .sidebar-card-title');
    const shopCard = document.getElementById('shopCard');
    const roleIdentityCard = document.getElementById('roleIdentityCard');
    
    // 穿书模式和无限流模式显示角色身份卡片，其他模式隐藏
    if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
        if (transCharCard) transCharCard.style.display = 'none';
        if (roleIdentityCard) roleIdentityCard.style.display = 'block';
    } else {
        if (transCharCard) transCharCard.style.display = 'block';
        if (roleIdentityCard) roleIdentityCard.style.display = 'none';
    }
    if (worldBuildingCard) worldBuildingCard.style.display = '';
    
    if (gameMode === 'kuaichuan') {
        if (worldInfoTitle) worldInfoTitle.textContent = '快穿系统';
        if (worldBuildingTitle) worldBuildingTitle.textContent = '世界设定';
        if (shopCard) shopCard.style.display = '';
        // 快穿模式：恢复直播按钮状态
        if (isChuanyueStarted && chuanyueRulesData?.livestreamEnabled) {
            showLivestreamButton();
            updateLivestreamPoints();
        }
    } else {
        // 非快穿模式：隐藏直播按钮
        hideLivestreamButton();
        if (shopCard) shopCard.style.display = 'none';
        
        if (gameMode === 'chuanshu') {
            if (worldInfoTitle) worldInfoTitle.textContent = '书籍资料';
            if (worldBuildingTitle) worldBuildingTitle.textContent = '书籍设定';
        } else if (gameMode === 'wuxianliu') {
            if (worldInfoTitle) worldInfoTitle.textContent = '副本资料';
            if (worldBuildingTitle) worldBuildingTitle.textContent = '副本设定';
        } else {
            if (worldInfoTitle) worldInfoTitle.textContent = '世界资料';
            if (worldBuildingTitle) worldBuildingTitle.textContent = '世界设定';
        }
    }
    
    // 穿书和无限流模式渲染角色身份，其他模式渲染穿越人设
    if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
        renderRoleIdentity();
    } else {
        renderTransChar();
    }
    renderWorldInfo();
    renderWorldBuilding();
}

// 刷新模式UI（切换模式后调用）
function refreshModeUI() {
    const transCharCard = document.getElementById('transCharCard');
    const roleIdentityCard = document.getElementById('roleIdentityCard');
    
    // 穿书模式和无限流模式显示角色身份卡片，其他模式隐藏
    if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
        if (transCharCard) transCharCard.style.display = 'none';
        if (roleIdentityCard) roleIdentityCard.style.display = 'block';
    } else {
        // 穿越和快穿模式显示穿越人设卡片，隐藏角色身份卡片
        if (transCharCard) transCharCard.style.display = 'block';
        if (roleIdentityCard) roleIdentityCard.style.display = 'none';
    }
    
    // 渲染侧边栏内容
    if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
        renderRoleIdentity();
    } else {
        renderTransChar();
    }
    renderWorldInfo();
    renderWorldBuilding();
    renderPlayerStatus();
    renderCharactersList();
    
    // 处理聊天界面（只要已开始就显示聊天界面）
    if (isChuanyueStarted) {
        showChatInterface();
    } else {
        hideChatInterface();
    }
    
    // 快穿模式特有功能
    if (gameMode === 'kuaichuan') {
        updatePointsDisplay();
        if (isChuanyueStarted && chuanyueRulesData?.livestreamEnabled) {
            showLivestreamButton();
            updateLivestreamPoints();
        }
    } else {
        hideLivestreamButton();
    }
}

function closeChuanyueMode() {
    document.getElementById('chuanyueSection').classList.remove('active');
    document.getElementById('mainSection').classList.add('active');
    currentPage = 'main';
    localStorage.setItem('currentPage', currentPage);
    
    // 离开板块时隐藏直播按钮和面板
    hideLivestreamButton();
}

// 确认清除所有数据
async function confirmClearAllData() {
    const modeNames = {
        'chuanyue': '穿越模式',
        'kuaichuan': '快穿模式',
        'chuanshu': '穿书模式',
        'wuxianliu': '无限流模式'
    };
    const modeName = modeNames[gameMode] || '当前模式';
    
    if (await customDangerConfirm(`确定要清除${modeName}的所有数据吗？\n\n这将删除：\n• 基本信息（姓名、年龄等）\n• 聊天记录\n• 世界/副本设定\n• 穿越人设\n• 状态数值\n• 所有相关存档\n\n此操作不可恢复！`, `清除${modeName}数据`)) {
        clearAllModeData();
    }
}

// 清除当前模式所有数据
function clearAllModeData() {
    const prefix = `${gameMode}_`;
    
    // 获取所有需要清除的localStorage键
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
        }
    }
    
    // 清除localStorage数据
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 清除内存中的数据（已删除characterProfile）
    chuanyueRulesData = null;
    chatHistory = [];
    transCharData = null;
    transCharGenerated = false;
    worldBuildingData = null;
    worldBuildingGenerated = false;
    playerStatus = null;
    charactersList = [];
    chatStatus = null;
    isChuanyueStarted = false;
    
    // 快穿模式特有数据
    if (gameMode === 'kuaichuan') {
        currentWorldId = null;
        kuaichuanWorldsHistory = [];
        localStorage.removeItem('kuaichuanWorldsHistory');
        localStorage.removeItem('currentWorldId');
        localStorage.removeItem('kuaichuanPoints');
        kuaichuanPoints = 0;
    }
    
    // 重置UI（添加空值检查）
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
    
    const startChuanyueBtn = document.getElementById('startChuanyueBtn');
    if (startChuanyueBtn) startChuanyueBtn.style.display = 'flex';
    
    const chatInputArea = document.getElementById('chatInputArea');
    if (chatInputArea) chatInputArea.classList.add('hidden');
    
    // 重新渲染所有组件
    renderWorldInfo();
    renderTransChar();
    renderWorldBuilding();
    renderPlayerStatus();
    renderCharactersList();
    updateStatusBar();
    
    // 隐藏直播按钮
    hideLivestreamButton();
    
    // 重置积分显示
    if (gameMode === 'kuaichuan') {
        updatePointsDisplay();
    }
    
    showToast('当前模式的所有数据已清除');
}

// ==================== TRANSMIGRATED CHARACTER ====================

function openTransCharModal() {
    const modal = document.getElementById('transCharModal');
    modal.classList.add('active');
    
    // Fill form with existing data
    if (transCharData) {
        document.getElementById('transCharName').value = transCharData.name || '';
        document.getElementById('transCharBackground').value = transCharData.background || '';
        document.getElementById('transCharSituation').value = transCharData.situation || '';
        document.getElementById('transCharAbility').value = transCharData.ability || '';
        document.getElementById('transCharNotes').value = transCharData.notes || '';
    }
    
    // Setup event listeners
    document.getElementById('transCharModalClose').onclick = closeTransCharModal;
    document.getElementById('transCharModalCancel').onclick = closeTransCharModal;
    document.getElementById('transCharModalConfirm').onclick = saveTransChar;
    document.getElementById('aiPolishTransChar').onclick = aiPolishTransChar;
    modal.onclick = (e) => { if (e.target === modal) closeTransCharModal(); };
}

function closeTransCharModal() {
    document.getElementById('transCharModal').classList.remove('active');
}

function saveTransChar() {
    transCharData = {
        name: document.getElementById('transCharName').value.trim(),
        background: document.getElementById('transCharBackground').value.trim(),
        situation: document.getElementById('transCharSituation').value.trim(),
        ability: document.getElementById('transCharAbility').value.trim(),
        notes: document.getElementById('transCharNotes').value.trim()
    };
    
    localStorage.setItem(getStorageKey('transCharData'), JSON.stringify(transCharData));
    renderTransChar();
    closeTransCharModal();
    showToast('穿越人设已保存');
}

async function aiPolishTransChar() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    const btn = document.getElementById('aiPolishTransChar');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" class="spin" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="30 70"/></svg><span>生成中...</span>';

    const currentData = {
        name: document.getElementById('transCharName').value.trim(),
        background: document.getElementById('transCharBackground').value.trim(),
        situation: document.getElementById('transCharSituation').value.trim(),
        ability: document.getElementById('transCharAbility').value.trim(),
        notes: document.getElementById('transCharNotes').value.trim()
    };

    try {
        const worldInfo = chuanyueRulesData ? `世界设定：${chuanyueRulesData.settings || ''}` : '';
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: `你是一个专业的穿越小说设定生成器。请根据用户提供的信息，完善穿越角色的设定。要求：1. 符合穿越小说的常见设定 2. 设定要有戏剧性和发展空间 3. 保持简洁但有细节` },
                    { role: 'user', content: `请基于以下信息完善穿越人设：
${worldInfo}
身份名称：${currentData.name || '（待生成）'}
身份背景：${currentData.background || '（待生成）'}
当前处境：${currentData.situation || '（待生成）'}
特殊能力：${currentData.ability || '（待生成）'}
备注：${currentData.notes || ''}

请返回JSON格式：{"name":"身份名称","background":"身份背景","situation":"当前处境","ability":"特殊能力","notes":"补充备注"}` }
                ],
                temperature: 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            if (result.name) document.getElementById('transCharName').value = result.name;
            if (result.background) document.getElementById('transCharBackground').value = result.background;
            if (result.situation) document.getElementById('transCharSituation').value = result.situation;
            if (result.ability) document.getElementById('transCharAbility').value = result.ability;
            if (result.notes) document.getElementById('transCharNotes').value = result.notes;
            showToast('AI完善成功');
        }
    } catch (error) {
        console.error('AI polish error:', error);
        showToast('AI完善失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

function renderTransChar() {
    const card = document.getElementById('transCharCard');
    const body = document.getElementById('transCharBody');
    const refreshBtn = document.getElementById('refreshTransCharBtn');
    const titleEl = document.getElementById('transCharTitle');
    
    // 如果元素不存在或卡片被隐藏，则不渲染
    if (!body) return;
    if (card && card.style.display === 'none') return;
    
    // 快穿模式下更新标题
    if (titleEl) {
        titleEl.textContent = gameMode === 'kuaichuan' ? '本世界身份' : '穿越人设';
    }
    
    // 快穿模式必须进入世界后才能生成
    const canGenerate = gameMode === 'kuaichuan' ? (isChuanyueStarted && worldBuildingData?.selectedWorld) : true;
    
    // 更新刷新按钮状态
    if (refreshBtn) {
        if (transCharGenerated) {
            refreshBtn.disabled = true;
            refreshBtn.title = '已生成（每个世界只能生成一次）';
        } else if (!canGenerate && gameMode === 'kuaichuan') {
            refreshBtn.disabled = true;
            refreshBtn.title = '请先进入世界';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.title = gameMode === 'kuaichuan' ? '生成本世界身份' : '生成穿越人设';
        }
    }
    
    if (!transCharData || !transCharData.name) {
        // 显示空状态
        if (gameMode === 'kuaichuan') {
            if (!isChuanyueStarted || !worldBuildingData?.selectedWorld) {
                body.innerHTML = `<div class="trans-char-empty">
                    <p>进入世界后可生成本世界身份</p>
                    <small>先选择世界并开始游戏</small>
                </div>`;
            } else {
                body.innerHTML = `<div class="trans-char-empty">
                    <p>点击刷新按钮生成本世界身份</p>
                    <small>注意：每个世界只能生成一次</small>
                </div>`;
            }
        } else {
            body.innerHTML = `<div class="trans-char-empty">
                <p>点击刷新按钮生成穿越人设</p>
                <small>注意：每个世界只能生成一次</small>
            </div>`;
        }
        return;
    }
    
    let html = '';
    
    if (transCharData.name) {
        html += `<div class="world-info-section">
            <div class="world-info-section-title">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" stroke="currentColor" stroke-width="2"/></svg>
                身份
            </div>
            <div class="world-info-section-content">${escapeHtml(transCharData.name)}${transCharData.gender ? ` (${escapeHtml(transCharData.gender)})` : ''}</div>
        </div>`;
    }
    
    if (transCharData.background) {
        html += `<div class="world-info-section">
            <div class="world-info-section-title">
                <svg viewBox="0 0 24 24" fill="none"><path d="M3 21 L21 21 M5 21 V7 L12 3 L19 7 V21" stroke="currentColor" stroke-width="2"/></svg>
                背景
            </div>
            <div class="world-info-section-content">${escapeHtml(transCharData.background)}</div>
        </div>`;
    }
    
    if (transCharData.situation) {
        html += `<div class="world-info-section">
            <div class="world-info-section-title">
                <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8 V12 L15 15" stroke="currentColor" stroke-width="2"/></svg>
                处境
            </div>
            <div class="world-info-section-content">${escapeHtml(transCharData.situation)}</div>
        </div>`;
    }
    
    if (transCharData.ability) {
        html += `<div class="world-info-section">
            <div class="world-info-section-title">
                <svg viewBox="0 0 24 24" fill="none"><path d="M13 2 L3 14 H12 L11 22 L21 10 H12 Z" stroke="currentColor" stroke-width="2"/></svg>
                金手指
            </div>
            <div class="world-info-section-content">${escapeHtml(transCharData.ability)}</div>
        </div>`;
    }
    
    if (transCharData.notes) {
        html += `<div class="world-info-section">
            <div class="world-info-section-title">
                <svg viewBox="0 0 24 24" fill="none"><path d="M14 2 H6 a2 2 0 0 0-2 2 v16 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2-2 V8 Z" stroke="currentColor" stroke-width="2"/><path d="M14 2 v6 h6 M16 13 H8 M16 17 H8 M10 9 H8" stroke="currentColor" stroke-width="2"/></svg>
                备注
            </div>
            <div class="world-info-section-content">${escapeHtml(transCharData.notes)}</div>
        </div>`;
    }
    
    body.innerHTML = html || '<div style="color:var(--text-muted);">暂无设定</div>';
}

// ==================== TRANS CHAR GENERATION ====================

// 重置穿越人设（进入新世界时调用）
function resetTransChar() {
    transCharData = null;
    transCharGenerated = false;
    localStorage.removeItem(getStorageKey('transCharData'));
    localStorage.setItem(getStorageKey('transCharGenerated'), 'false');
    renderTransChar();
}

async function generateTransChar() {
    if (transCharGenerated) {
        const msg = gameMode === 'kuaichuan' ? '本世界身份只能生成一次，进入新世界后可重新生成' : '人设只能生成一次，重新开始后可重新生成';
        showToast(msg);
        return;
    }
    
    // 快穿模式必须进入世界后才能生成
    if (gameMode === 'kuaichuan') {
        if (!isChuanyueStarted || !worldBuildingData?.selectedWorld) {
            showToast('请先进入世界');
            return;
        }
    }

    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    const refreshBtn = document.getElementById('refreshTransCharBtn');
    if (!refreshBtn) {
        showToast('刷新按钮不存在');
        return;
    }
    const originalHTML = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const modeLabel = {
            'chuanyue': '穿越',
            'kuaichuan': '快穿',
            'chuanshu': '穿书',
            'wuxianliu': '无限流'
        };
        
        // 确定用户性别
        const genderMap = { 'male': '男性', 'female': '女性', 'other': '双性' };
        let userGender = chuanyueRulesData?.confirmedGender || chuanyueRulesData?.userGender || 'male';
        let genderText = genderMap[userGender] || '男性';
        
        // 性别要求说明
        let genderRequirement = '';
        if (userGender === 'male') {
            genderRequirement = `【强制要求】角色必须是男性，且在感情关系中是"受"的角色定位（被追求、被攻略的一方）。`;
        } else if (userGender === 'other') {
            genderRequirement = `【强制要求】角色是双性体质（同时拥有男女特征），在感情关系中是"受"的角色定位（被追求、被攻略的一方）。`;
        } else {
            genderRequirement = `【强制要求】角色必须是女性。`;
        }
        
        let contextInfo = '';
        if (chuanyueRulesData?.userName) {
            contextInfo += `用户原本信息：\n`;
            contextInfo += `- 名字：${chuanyueRulesData.userName}\n`;
            if (chuanyueRulesData.userAge) contextInfo += `- 年龄：${chuanyueRulesData.userAge}岁\n`;
            contextInfo += `- 性别：${genderText}（必须遵守）\n`;
        }
        
        // 快穿模式使用选中的世界背景
        if (gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld) {
            contextInfo += `\n当前世界：${worldBuildingData.selectedWorld}\n`;
            if (worldBuildingData.currentTask) {
                contextInfo += `当前任务：${worldBuildingData.currentTask}\n`;
            }
        } else {
            if (chuanyueRulesData?.settings) {
                contextInfo += `\n世界背景：${chuanyueRulesData.settings}\n`;
            }
        }
        if (chuanyueRulesData?.rules) {
            contextInfo += `\n规则：${chuanyueRulesData.rules}\n`;
        }
        if (chuanyueRulesData?.userPreference) {
            contextInfo += `\n用户生成偏好：${chuanyueRulesData.userPreference}\n`;
        }
        
        contextInfo += `\n${genderRequirement}\n`;
        
        const identityType = gameMode === 'kuaichuan' ? '本世界身份' : '穿越后身份';

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [{
                    role: 'system',
                    content: gameMode === 'kuaichuan' 
                        ? `你是一个创意写作助手，擅长为快穿小说设计角色在不同世界的身份。`
                        : `你是一个创意写作助手，擅长为${modeLabel[gameMode] || '穿越'}小说设计角色。`
                }, {
                    role: 'user',
                    content: `请为用户生成一个${identityType}设定。

${contextInfo}

请按以下JSON格式返回（直接返回JSON，不要其他内容）：
{
    "name": "${gameMode === 'kuaichuan' ? '本世界的身份名称' : '穿越后的身份名称'}",
    "gender": "${genderText}",
    "background": "角色背景故事（100字以内）",
    "situation": "当前处境（50字以内）",
    "ability": "特殊能力或金手指（如果有的话）",
    "notes": "其他重要信息"
}

要求：
1. 【最重要】严格按照指定性别(${genderText})生成，绝对不能更改性别！${userGender !== 'female' ? '角色在感情中必须是"受"的定位！' : ''}
2. 根据${gameMode === 'kuaichuan' ? '当前世界和任务' : '世界背景和用户信息'}创造合适的身份
3. 身份要有戏剧性和故事潜力
4. 处境要有冲突或挑战
5. ${gameMode === 'kuaichuan' ? '身份要与世界设定和任务相关' : '金手指不宜过于强大'}`
                }],
                temperature: 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        
        // 提取JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            transCharData = JSON.parse(jsonMatch[0]);
            
            // 强制修正性别（确保与用户选择一致）
            transCharData.gender = genderText;
            
            transCharGenerated = true;
            
            localStorage.setItem(getStorageKey('transCharData'), JSON.stringify(transCharData));
            localStorage.setItem(getStorageKey('transCharGenerated'), 'true');
            
            renderTransChar();
            showToast('人设生成成功');
        } else {
            throw new Error('无法解析返回内容');
        }

    } catch (error) {
        console.error('Generate trans char error:', error);
        showToast('生成失败: ' + error.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = transCharGenerated;
            refreshBtn.innerHTML = originalHTML;
        }
    }
}

// 自动生成穿越人设（静默，用于新世界开始时）
async function autoGenerateTransChar() {
    if (transCharGenerated) return;
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) return;

    try {
        const modeLabel = {
            'chuanyue': '穿越',
            'kuaichuan': '快穿',
            'chuanshu': '穿书',
            'wuxianliu': '无限流'
        };
        
        let contextInfo = '';
        // 使用基本信息（穿越/快穿模式）
        if (chuanyueRulesData?.userName) {
            contextInfo += `用户原本信息：\n`;
            contextInfo += `- 名字：${chuanyueRulesData.userName}\n`;
            if (chuanyueRulesData.userAge) contextInfo += `- 年龄：${chuanyueRulesData.userAge}岁\n`;
            if (chuanyueRulesData.userGender) {
                const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
                contextInfo += `- 性别：${genderMap[chuanyueRulesData.userGender] || chuanyueRulesData.userGender}\n`;
            }
            if (chuanyueRulesData.userPreference) contextInfo += `- 生成偏好：${chuanyueRulesData.userPreference}\n`;
        }
        
        if (chuanyueRulesData?.settings) {
            contextInfo += `\n世界背景：${chuanyueRulesData.settings}\n`;
        }
        if (chuanyueRulesData?.rules) {
            contextInfo += `\n规则：${chuanyueRulesData.rules}\n`;
        }

        // 使用备用API（如果配置了）
        const api = getBackupApi();
        const response = await fetch(api.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${api.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: api.model,
                messages: [{
                    role: 'system',
                    content: `你是一个创意写作助手，擅长为${modeLabel[gameMode] || '穿越'}小说设计角色。`
                }, {
                    role: 'user',
                    content: `请为用户生成一个${modeLabel[gameMode] || '穿越'}后的人物设定。

${contextInfo}

请按以下JSON格式返回（直接返回JSON，不要其他内容）：
{
    "name": "穿越后的身份名称",
    "background": "角色背景故事（100字以内）",
    "situation": "当前处境（50字以内）",
    "ability": "特殊能力或金手指（如果有的话，没有则留空）",
    "notes": "其他重要信息"
}

要求：
1. 根据世界背景和用户信息创造合适的身份
2. 身份要有戏剧性和故事潜力
3. 处境要有冲突或挑战
4. 金手指不宜过于强大`
                }],
                temperature: 0.8
            })
        });

        if (!response.ok) return;

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        
        // 提取JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            transCharData = JSON.parse(jsonMatch[0]);
            transCharGenerated = true;
            
            localStorage.setItem(getStorageKey('transCharData'), JSON.stringify(transCharData));
            localStorage.setItem(getStorageKey('transCharGenerated'), 'true');
        }
    } catch (error) {
        console.error('Auto generate trans char error:', error);
    }
}

// ==================== WORLD BUILDING ====================

// 重置当前世界的世界构建（快穿模式进入新世界时调用）
function resetCurrentWorldBuilding() {
    worldBuildingData = null;
    worldBuildingGenerated = false;
    localStorage.removeItem(getStorageKey('worldBuildingData'));
    localStorage.setItem(getStorageKey('worldBuildingGenerated'), 'false');
    renderWorldBuilding();
}

async function generateWorldBuilding() {
    if (worldBuildingGenerated) {
        const msg = gameMode === 'kuaichuan' ? '本世界设定只能生成一次，进入新世界后可重新生成' : '世界设定只能生成一次';
        showToast(msg);
        return;
    }

    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    // 快穿模式、穿书模式和无限流恐怖模式不需要检查settings
    const isHorrorMode = gameMode === 'wuxianliu' && chuanyueRulesData?.wuxianliuType === 'horror';
    if (gameMode !== 'kuaichuan' && gameMode !== 'chuanshu' && !isHorrorMode && (!chuanyueRulesData || !chuanyueRulesData.settings)) {
        showToast('请先设置世界背景');
        return;
    }
    
    // 穿书模式检查原著内容
    if (gameMode === 'chuanshu' && (!chuanyueRulesData || !chuanyueRulesData.novel)) {
        showToast('请先填写原著内容');
        return;
    }

    const refreshBtn = document.getElementById('refreshWorldBuilding');
    if (!refreshBtn) {
        showToast('刷新按钮不存在');
        return;
    }
    const originalHTML = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" class="spin"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="30 70"/></svg>';
    showToast('正在生成世界设定...');

    try {
        // 根据模式获取世界背景
        let worldBackground = '';
        if (gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld) {
            worldBackground = worldBuildingData.selectedWorld;
        } else if (gameMode === 'chuanshu') {
            // 穿书模式：使用原著内容作为世界背景
            worldBackground = chuanyueRulesData?.novel || '';
            if (chuanyueRulesData?.identity) {
                worldBackground += `\n\n穿书者身份：${chuanyueRulesData.identity}`;
            }
        } else if (gameMode === 'wuxianliu') {
            // 无限流模式：从聊天记录中提取副本信息
            const firstAiMsg = chatHistory.find(m => m.type === 'ai');
            if (firstAiMsg) {
                worldBackground = `当前副本开场内容：\n${firstAiMsg.content}`;
            }
            if (chuanyueRulesData?.settings) {
                worldBackground = chuanyueRulesData.settings + '\n\n' + worldBackground;
            }
        } else {
            worldBackground = chuanyueRulesData?.settings || '';
        }
        
        // 添加用户生成偏好
        if (chuanyueRulesData?.userPreference) {
            worldBackground += `\n\n【用户生成偏好】${chuanyueRulesData.userPreference}`;
        }
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: gameMode === 'wuxianliu' 
                        ? `你是一个副本设定整理师。从副本信息中提取关键设定，用思维导图的简洁格式整理，每个分类列出3-5个关键词条。严格按JSON格式返回。`
                        : `你是一个世界观设计师。用思维导图的简洁格式生成世界设定，每个分类列出3-5个关键词条，每个词条用括号简短说明。严格按JSON格式返回。` 
                    },
                    { role: 'user', content: gameMode === 'wuxianliu' 
                        ? `请从以下副本信息中提取规则和目标：

${worldBackground}

格式要求：
- 提取副本的核心规则和最终目标
- 每条规则/目标简洁明了
- 用顿号分隔条目

返回格式（严格JSON）：
{
  "rules": "副本规则，如：禁止使用电子设备（违者死亡）、夜间禁止外出（会遇到危险）、不能直视镜子（会被带走）",
  "goals": "最终目标/通关条件，如：找到失踪者（主线目标）、存活7天（时间限制）、解开诅咒真相（隐藏目标）",
  "taboos": "禁忌事项，如：不能提起某人名字、不能进入某房间、不能在某时间做某事",
  "hints": "已知线索/提示，如：地下室有秘密、老照片少了一人、管家知道真相"
}`
                        : `请根据以下世界背景生成简洁的世界设定思维导图：

${worldBackground}

格式要求：
- 每个分类列出3-5个关键词条
- 每个词条格式：名称（简短说明10字以内）
- 用顿号分隔词条
- 不要长篇描述，只要关键词

返回格式（严格JSON）：
{
  "factions": "势力派别的关键词条，如：太子党（皇长子拥护者）、外戚党（皇后母族势力）",
  "power": "权力体系/修炼体系的关键词条",
  "economy": "经济相关的关键词条，如：银两（通用货币）、盐引（官营专卖）",
  "technology": "科技/技术/功法的关键词条",
  "rules": "规矩禁忌的关键词条",
  "special": "特殊设定的关键词条"
}` 
                    }
                ],
                temperature: 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const newSettings = JSON.parse(jsonMatch[0]);
            
            // 快穿模式：保留selectedWorld和currentTask信息
            if (gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld) {
                worldBuildingData = {
                    ...newSettings,
                    selectedWorld: worldBuildingData.selectedWorld,
                    currentTask: worldBuildingData.currentTask,
                    generatedAt: worldBuildingData.generatedAt
                };
            } else {
                worldBuildingData = newSettings;
            }
            
            worldBuildingGenerated = true;
            localStorage.setItem(getStorageKey('worldBuildingData'), JSON.stringify(worldBuildingData));
            localStorage.setItem(getStorageKey('worldBuildingGenerated'), 'true');
            renderWorldBuilding();
            showToast('世界设定生成完成，正在生成状态分类...');
            
            // 根据世界设定生成自定义状态分类
            await generateCustomStatusCategories();
            
            // 生成重要人物
            showToast('正在生成重要人物...');
            await generateImportantCharacters();
            
            // 成功后恢复按钮状态
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalHTML;
        } else {
            throw new Error('解析失败');
        }

    } catch (error) {
        console.error('Generate world building error:', error);
        showToast('生成失败: ' + error.message);
    } finally {
        // 确保按钮状态总是被恢复
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalHTML;
        }
    }
}

async function generateImportantCharacters() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) return;

    try {
        const worldInfo = chuanyueRulesData?.settings || '';
        const worldBuilding = worldBuildingData ? JSON.stringify(worldBuildingData) : '';

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是一个角色设计师。根据世界设定生成重要人物。严格按JSON格式返回。' },
                    { role: 'user', content: `根据以下世界设定，生成5-8个重要人物：

世界背景：${worldInfo}
详细设定：${worldBuilding}
${chuanyueRulesData?.userPreference ? `用户偏好：${chuanyueRulesData.userPreference}` : ''}

生成的人物应包含：
- 可攻略的恋爱对象（2-3人）
- 重要配角（导师、对手、朋友等）
- 反派或敌对角色（1-2人）
${chuanyueRulesData?.userPreference ? '- 请参考用户偏好来设计角色类型和特点' : ''}

返回JSON格式：
{
  "characters": [
    {
      "name": "姓名",
      "gender": "性别",
      "age": "年龄或年龄段",
      "identity": "身份/职位",
      "personality": "性格特点（2-3个关键词）",
      "appearance": "外貌特征（简短描述）",
      "background": "背景故事（1-2句）",
      "habit": "生活习惯/癖好",
      "schedule": "日常作息（如：早起练功、午后读书、夜间巡逻等）",
      "relationship": "与主角的初始关系",
      "romanceable": true或false,
      "affection": 初始好感度0-100,
      "currentStatus": "当前状态/心情"
    }
  ]
}

只返回JSON，不要其他内容。` }
                ],
                temperature: 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            importantCharacters = result.characters || [];
            localStorage.setItem(getStorageKey('importantCharacters'), JSON.stringify(importantCharacters));
            
            // 初始化好感度到玩家状态
            if (importantCharacters.length > 0) {
                playerStatusData.affection = importantCharacters
                    .filter(c => c.romanceable)
                    .map(c => ({ name: c.name, value: c.affection || 0 }));
                localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            }
            
            showToast('重要人物生成完成');
        }

    } catch (error) {
        console.error('Generate important characters error:', error);
    }
}

async function generateCustomStatusCategories() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) return;

    try {
        const worldInfo = chuanyueRulesData?.settings || '';
        const worldBuilding = worldBuildingData ? JSON.stringify(worldBuildingData) : '';

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: `你是一个游戏状态系统设计师。根据世界观设定，生成适合该世界的角色状态分类。` },
                    { role: 'user', content: `根据以下世界设定，生成3-5个适合该世界观的角色状态分类：

世界背景：${worldInfo}
详细设定：${worldBuilding}

例如：
- 修仙世界：修为境界、本命法宝、门派身份、功法
- 末世世界：异能等级、变异程度、生存技能
- 古代宫廷：官职品级、宫中地位、后宫势力
- 武侠世界：武功境界、内力修为、江湖名号

请返回JSON数组格式：
[
  {"key": "英文标识", "name": "中文名称", "icon": "emoji图标", "type": "text或progress", "description": "简短描述"}
]

type说明：text表示文本类型，progress表示进度条类型（0-100）
只返回JSON数组，不要其他内容。` }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            customStatusCategories = JSON.parse(jsonMatch[0]);
            localStorage.setItem(getStorageKey('customStatusCategories'), JSON.stringify(customStatusCategories));
            
            // 初始化自定义状态数据
            if (!playerStatusData.custom) playerStatusData.custom = {};
            customStatusCategories.forEach(cat => {
                if (!(cat.key in playerStatusData.custom)) {
                    playerStatusData.custom[cat.key] = cat.type === 'progress' ? 0 : '';
                }
            });
            localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            
            showToast('状态分类生成完成');
        }
    } catch (error) {
        console.error('Generate custom status categories error:', error);
    }
}

function renderWorldBuilding() {
    const card = document.getElementById('worldBuildingCard');
    const body = document.getElementById('worldBuildingBody');
    const refreshBtn = document.getElementById('refreshWorldBuilding');

    if (!chuanyueRulesData) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';

    // Hide refresh button if already generated
    if (worldBuildingGenerated) {
        refreshBtn.style.display = 'none';
    } else {
        refreshBtn.style.display = 'block';
    }

    if (!worldBuildingData) {
        body.innerHTML = `<div class="world-building-empty">
            <p>点击刷新按钮生成世界设定</p>
            <small>注意：${gameMode === 'kuaichuan' ? '本世界只能生成一次' : '只能生成一次'}</small>
        </div>`;
        return;
    }

    // 快穿模式：显示选择的世界信息
    if (gameMode === 'kuaichuan' && worldBuildingData.selectedWorld) {
        let worldHtml = '';
        
        // 显示当前任务（优先突出显示）
        if (worldBuildingData.currentTask) {
            worldHtml += `<div class="current-task-box">
                <div class="current-task-label">🎯 当前任务</div>
                <div class="current-task-content">${escapeHtml(worldBuildingData.currentTask)}</div>
            </div>`;
        }
        
        worldHtml += `<div class="selected-world-info">
            <div class="selected-world-title">📍 当前世界</div>
            <div class="selected-world-content">${formatStoryText(worldBuildingData.selectedWorld)}</div>
        </div>`;
        
        // 如果有详细设定，也显示
        const categories = [
            { key: 'factions', title: '势力' },
            { key: 'power', title: '体系' },
            { key: 'economy', title: '经济' },
            { key: 'technology', title: '科技' },
            { key: 'rules', title: '规矩' },
            { key: 'special', title: '特殊' }
        ];
        
        let hasDetailedSettings = categories.some(cat => worldBuildingData[cat.key]);
        if (hasDetailedSettings) {
            worldHtml += '<div class="world-building-divider"></div>';
            worldHtml += '<div class="world-mindmap">';
            categories.forEach(cat => {
                if (worldBuildingData[cat.key]) {
                    worldHtml += renderMindmapNode(cat.title, worldBuildingData[cat.key]);
                }
            });
            worldHtml += '</div>';
        }
        
        body.innerHTML = worldHtml;
        return;
    }

    // 无限流模式使用不同的分类（专注于规则和目标）
    const categories = gameMode === 'wuxianliu' ? [
        { key: 'rules', title: '📜 副本规则' },
        { key: 'goals', title: '🎯 最终目标' },
        { key: 'taboos', title: '⛔ 禁忌事项' },
        { key: 'hints', title: '🔍 线索提示' }
    ] : [
        { key: 'factions', title: '势力' },
        { key: 'power', title: '体系' },
        { key: 'economy', title: '经济' },
        { key: 'places', title: '地点' },
        { key: 'rules', title: '规矩' },
        { key: 'special', title: '特殊' }
    ];

    let nodes = '<div class="world-mindmap">';
    let hasContent = false;
    categories.forEach(cat => {
        if (worldBuildingData[cat.key]) {
            hasContent = true;
            // 无限流模式的线索部分添加刷新按钮
            if (gameMode === 'wuxianliu' && cat.key === 'hints') {
                nodes += renderMindmapNodeWithRefresh(cat.title, worldBuildingData[cat.key]);
            } else {
                nodes += renderMindmapNode(cat.title, worldBuildingData[cat.key]);
            }
        }
    });
    nodes += '</div>';

    if (hasContent) {
        body.innerHTML = nodes;
        // 绑定刷新线索按钮事件
        if (gameMode === 'wuxianliu') {
            const refreshHintsBtn = body.querySelector('.refresh-hints-btn');
            if (refreshHintsBtn) {
                refreshHintsBtn.onclick = refreshHints;
            }
        }
    } else {
        body.innerHTML = '<div style="color:var(--text-muted);">暂无设定</div>';
    }
}

// 渲染思维导图节点
function renderMindmapNode(title, content) {
    // 解析内容为标签，支持顿号、逗号分隔
    const items = content.split(/[、，,]/).map(item => item.trim()).filter(item => item);
    
    let tagsHtml = '';
    items.forEach(item => {
        // 提取名称和括号内的说明
        const match = item.match(/^([^（(]+)[（(]([^）)]+)[）)]?$/);
        if (match) {
            tagsHtml += `<span class="mindmap-tag">
                <span class="tag-name">${escapeHtml(match[1].trim())}</span>
                <span class="tag-desc">${escapeHtml(match[2].trim())}</span>
            </span>`;
        } else {
            tagsHtml += `<span class="mindmap-tag"><span class="tag-name">${escapeHtml(item)}</span></span>`;
        }
    });
    
    return `<div class="mindmap-node">
        <div class="mindmap-title">${title}</div>
        <div class="mindmap-tags">${tagsHtml}</div>
    </div>`;
}

// 渲染带刷新按钮的思维导图节点（用于无限流线索）
function renderMindmapNodeWithRefresh(title, content) {
    const items = content.split(/[、，,]/).map(item => item.trim()).filter(item => item);
    
    let tagsHtml = '';
    items.forEach(item => {
        const match = item.match(/^([^（(]+)[（(]([^）)]+)[）)]?$/);
        if (match) {
            tagsHtml += `<span class="mindmap-tag">
                <span class="tag-name">${escapeHtml(match[1].trim())}</span>
                <span class="tag-desc">${escapeHtml(match[2].trim())}</span>
            </span>`;
        } else {
            tagsHtml += `<span class="mindmap-tag"><span class="tag-name">${escapeHtml(item)}</span></span>`;
        }
    });
    
    return `<div class="mindmap-node hints-node">
        <div class="mindmap-title-row">
            <div class="mindmap-title">${title}</div>
            <button class="refresh-hints-btn" title="根据剧情刷新线索">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <path d="M1 4 v6 h6 M23 20 v-6 h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20.49 9 A9 9 0 0 0 5.64 5.64 L1 10 M23 14 l-4.64 4.36 A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        <div class="mindmap-tags">${tagsHtml}</div>
    </div>`;
}

// 刷新无限流线索
async function refreshHints() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先配置API');
        return;
    }
    
    if (chatHistory.length < 2) {
        showToast('剧情还不够，请先进行一些对话');
        return;
    }
    
    const refreshBtn = document.querySelector('.refresh-hints-btn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<div class="loading-spinner-small"></div>';
    }
    
    try {
        // 获取最近的聊天记录
        const recentMessages = chatHistory.slice(-10).map(m => 
            `${m.type === 'user' ? '玩家' : 'AI'}：${m.content.substring(0, 500)}`
        ).join('\n\n');
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是一个副本线索整理师。根据剧情对话提取当前已知的线索和提示。' },
                    { role: 'user', content: `请根据以下剧情对话，提取当前已知的线索和提示：

${recentMessages}

${worldBuildingData?.hints ? `之前已知的线索：${worldBuildingData.hints}` : ''}

要求：
- 整合新旧线索，去重并更新
- 每条线索简洁明了（10字以内）
- 用顿号分隔
- 只返回线索内容，不要其他文字

格式示例：地下室有秘密、老照片少了一人、管家知道真相` }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) throw new Error('API请求失败');
        
        const data = await response.json();
        const newHints = data.choices[0]?.message?.content?.trim() || '';
        
        if (newHints) {
            worldBuildingData.hints = newHints;
            localStorage.setItem(getStorageKey('worldBuildingData'), JSON.stringify(worldBuildingData));
            renderWorldBuilding();
            showToast('线索已更新');
        }
        
    } catch (error) {
        console.error('Refresh hints error:', error);
        showToast('刷新失败: ' + error.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <path d="M1 4 v6 h6 M23 20 v-6 h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 9 A9 9 0 0 0 5.64 5.64 L1 10 M23 14 l-4.64 4.36 A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        }
    }
}

// ==================== PLAYER STATUS ====================

function openStatusModal() {
    document.getElementById('statusModal').classList.add('active');
    renderPlayerStatus();
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
}

// AI刷新重要人物
async function refreshCharactersByAI() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先配置API');
        return;
    }
    
    if (chatHistory.length === 0) {
        showToast('暂无对话内容可供分析');
        return;
    }
    
    const btn = document.getElementById('charactersRefreshBtn');
    btn.disabled = true;
    btn.classList.add('refreshing');
    showToast('AI正在分析人物关系...');
    
    try {
        const recentChat = chatHistory.slice(-15).map(m => 
            `${m.type === 'user' ? '用户' : 'AI'}：${m.content}`
        ).join('\n');
        
        const worldInfo = gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld 
            ? worldBuildingData.selectedWorld 
            : (chuanyueRulesData?.settings || '');
        
        const currentChars = importantCharacters.length > 0 
            ? JSON.stringify(importantCharacters) 
            : '暂无';
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是人物分析助手。根据对话内容分析并更新人物信息，返回JSON格式。' },
                    { role: 'user', content: `根据以下对话和世界观，更新人物状态和关系：

【世界设定】
${worldInfo}

【最近对话】
${recentChat}

【当前人物数据】
${currentChars}

请分析对话中出现的人物变化（好感度、态度、关系等），返回更新后的人物列表：
{
  "characters": [
    {
      "name": "名字",
      "gender": "性别",
      "age": "年龄",
      "identity": "身份",
      "personality": "性格",
      "background": "背景",
      "relationship": "与主角的关系",
      "affection": 好感度数值,
      "romanceable": 是否可攻略布尔值,
      "currentStatus": "当前状态/心情"
    }
  ]
}` }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) throw new Error('API请求失败');
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            if (result.characters && result.characters.length > 0) {
                importantCharacters = result.characters;
                localStorage.setItem(getStorageKey('importantCharacters'), JSON.stringify(importantCharacters));
                
                // 同步更新好感度到状态栏
                playerStatusData.affection = importantCharacters
                    .filter(c => c.romanceable)
                    .map(c => ({ name: c.name, value: c.affection || 0 }));
                localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
                
                renderCharactersList();
                showToast('人物信息已更新');
            }
        }
    } catch (error) {
        console.error('Refresh characters error:', error);
        showToast('刷新失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.classList.remove('refreshing');
    }
}

function renderPlayerStatus() {
    // Current Status
    const currentEl = document.getElementById('statusCurrent');
    if (playerStatusData.currentStatus) {
        currentEl.innerHTML = `<div class="status-item-value">${escapeHtml(playerStatusData.currentStatus)}</div>`;
    } else {
        currentEl.innerHTML = '<div class="status-empty">暂无状态信息</div>';
    }

    // Affection (可攻略角色好感度)
    const affectionEl = document.getElementById('statusAffection');
    if (playerStatusData.affection && playerStatusData.affection.length > 0) {
        let html = '';
        playerStatusData.affection.forEach(char => {
            const percent = Math.min(100, Math.max(0, char.value));
            html += `<div class="status-item">
                <span class="status-item-name">${escapeHtml(char.name)}</span>
                <div class="affection-bar"><div class="affection-bar-fill" style="width:${percent}%"></div></div>
                <span class="affection-value">${percent}%</span>
            </div>`;
        });
        affectionEl.innerHTML = html;
    } else {
        affectionEl.innerHTML = '<div class="status-empty">暂无可攻略角色</div>';
    }

    // Friends
    const friendsEl = document.getElementById('statusFriends');
    if (playerStatusData.friends && playerStatusData.friends.length > 0) {
        let html = '';
        playerStatusData.friends.forEach(f => {
            html += `<span class="status-tag status-tag-friend">${escapeHtml(f)}</span>`;
        });
        friendsEl.innerHTML = html;
    } else {
        friendsEl.innerHTML = '<div class="status-empty">暂无好友</div>';
    }

    // Enemies
    const enemiesEl = document.getElementById('statusEnemies');
    if (playerStatusData.enemies && playerStatusData.enemies.length > 0) {
        let html = '';
        playerStatusData.enemies.forEach(e => {
            html += `<span class="status-tag status-tag-enemy">${escapeHtml(e)}</span>`;
        });
        enemiesEl.innerHTML = html;
    } else {
        enemiesEl.innerHTML = '<div class="status-empty">暂无敌对关系</div>';
    }

    // Inventory
    const inventoryEl = document.getElementById('statusInventory');
    if (playerStatusData.inventory && playerStatusData.inventory.length > 0) {
        let html = '';
        playerStatusData.inventory.forEach(item => {
            if (typeof item === 'object') {
                html += `<span class="inventory-item">${escapeHtml(item.name)} <span class="inventory-item-count">×${item.count || 1}</span></span>`;
            } else {
                html += `<span class="inventory-item">${escapeHtml(item)}</span>`;
            }
        });
        inventoryEl.innerHTML = html;
    } else {
        inventoryEl.innerHTML = '<div class="status-empty">暂无物品</div>';
    }

    // Custom Status Categories
    const customContainer = document.getElementById('customStatusSections');
    if (customStatusCategories && customStatusCategories.length > 0) {
        let html = '';
        customStatusCategories.forEach(cat => {
            const value = playerStatusData.custom?.[cat.key];
            let bodyContent = '';
            
            if (cat.type === 'progress') {
                const percent = Math.min(100, Math.max(0, value || 0));
                bodyContent = `<div class="status-item">
                    <span class="status-item-name">${escapeHtml(cat.description || '')}</span>
                    <div class="affection-bar"><div class="affection-bar-fill" style="width:${percent}%;background:linear-gradient(90deg, #3498db 0%, #9b59b6 100%)"></div></div>
                    <span class="affection-value">${percent}%</span>
                </div>`;
            } else {
                bodyContent = value ? `<div class="status-item-value">${escapeHtml(value)}</div>` : `<div class="status-empty">暂无信息</div>`;
            }
            
            html += `<div class="status-section">
                <div class="status-section-header">
                    <span class="status-section-title">${cat.icon || '📌'} ${escapeHtml(cat.name)}</span>
                    <button class="status-edit-btn" data-section="custom_${cat.key}">编辑</button>
                </div>
                <div class="status-section-body">${bodyContent}</div>
            </div>`;
        });
        customContainer.innerHTML = html;
        
        // 重新绑定自定义分类的编辑按钮事件
        customContainer.querySelectorAll('.status-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editStatusSection(btn.dataset.section));
        });
    } else {
        customContainer.innerHTML = '';
    }
}

async function editStatusSection(section) {
    let currentValue = '';
    let promptTitle = '';
    let isCustom = section.startsWith('custom_');
    let customKey = isCustom ? section.replace('custom_', '') : null;
    let customCat = isCustom ? customStatusCategories.find(c => c.key === customKey) : null;

    if (isCustom && customCat) {
        currentValue = playerStatusData.custom?.[customKey] || '';
        if (customCat.type === 'progress') {
            promptTitle = `编辑${customCat.name}（0-100）`;
        } else {
            promptTitle = `编辑${customCat.name}`;
        }
    } else {
        switch (section) {
            case 'currentStatus':
                currentValue = playerStatusData.currentStatus || '';
                promptTitle = '编辑当前状态';
                break;
            case 'affection':
                currentValue = playerStatusData.affection.map(a => `${a.name}:${a.value}`).join(', ');
                promptTitle = '编辑好感度';
                break;
            case 'friends':
                currentValue = playerStatusData.friends.join(', ');
                promptTitle = '编辑好友列表';
                break;
            case 'enemies':
                currentValue = playerStatusData.enemies.join(', ');
                promptTitle = '编辑敌对列表';
                break;
            case 'inventory':
                currentValue = playerStatusData.inventory.map(i => typeof i === 'object' ? `${i.name}:${i.count}` : i).join(', ');
                promptTitle = '编辑物品';
                break;
        }
    }

    const input = await customPrompt('', currentValue, promptTitle);
    if (input === null) return;

    if (isCustom && customCat) {
        if (!playerStatusData.custom) playerStatusData.custom = {};
        if (customCat.type === 'progress') {
            playerStatusData.custom[customKey] = Math.min(100, Math.max(0, parseInt(input) || 0));
        } else {
            playerStatusData.custom[customKey] = input.trim();
        }
    } else {
        switch (section) {
            case 'currentStatus':
                playerStatusData.currentStatus = input.trim();
                break;
            case 'affection':
                playerStatusData.affection = input.split(',').map(s => {
                    const [name, value] = s.trim().split(':');
                    return name ? { name: name.trim(), value: parseInt(value) || 0 } : null;
                }).filter(Boolean);
                break;
            case 'friends':
                playerStatusData.friends = input.split(',').map(s => s.trim()).filter(Boolean);
                break;
            case 'enemies':
                playerStatusData.enemies = input.split(',').map(s => s.trim()).filter(Boolean);
                break;
            case 'inventory':
                playerStatusData.inventory = input.split(',').map(s => {
                    const parts = s.trim().split(':');
                    if (parts.length > 1) {
                        return { name: parts[0].trim(), count: parseInt(parts[1]) || 1 };
                    }
                    return parts[0].trim();
                }).filter(Boolean);
                break;
        }
    }

    localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
    renderPlayerStatus();
    showToast('状态已更新');
}

async function aiUpdateStatus() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    if (chatHistory.length === 0) {
        showToast('暂无聊天记录');
        return;
    }

    const btn = document.getElementById('statusAiUpdate');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" class="spin" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="30 70"/></svg><span>分析中...</span>';

    try {
        // Get recent chat history
        const recentHistory = chatHistory.slice(-20).map(m => `${m.type === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n');

        // 构建自定义分类的JSON格式说明
        let customFieldsDesc = '';
        let customFieldsExample = '';
        if (customStatusCategories && customStatusCategories.length > 0) {
            customFieldsDesc = '\n\n此外，还需要分析以下世界特有的状态：';
            customStatusCategories.forEach(cat => {
                customFieldsDesc += `\n- ${cat.name}（${cat.description || ''}）`;
                if (cat.type === 'progress') {
                    customFieldsExample += `\n  "${cat.key}": 数值0-100,`;
                } else {
                    customFieldsExample += `\n  "${cat.key}": "文本描述",`;
                }
            });
        }

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: `你是一个状态分析助手。根据对话内容分析角色的当前状态、人际关系和物品。严格按JSON格式返回。` },
                    { role: 'user', content: `请分析以下对话，提取角色状态信息：

${recentHistory}
${customFieldsDesc}

请返回JSON格式：
{
  "currentStatus": "角色当前的状态描述（如：身体状态、精神状态、处境等）",
  "affection": [{"name": "可攻略角色名", "value": 好感度0-100}],
  "friends": ["好友1", "好友2"],
  "enemies": ["敌人1"],
  "inventory": [{"name": "物品名", "count": 数量}],
  "custom": {${customFieldsExample}
  }
}

注意：只返回JSON，不要其他内容。如果某项没有信息，返回空数组或空字符串。` }
                ],
                temperature: 0.5
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            if (result.currentStatus) playerStatusData.currentStatus = result.currentStatus;
            if (result.affection) playerStatusData.affection = result.affection;
            if (result.friends) playerStatusData.friends = result.friends;
            if (result.enemies) playerStatusData.enemies = result.enemies;
            if (result.inventory) playerStatusData.inventory = result.inventory;
            
            // 更新自定义分类
            if (result.custom) {
                if (!playerStatusData.custom) playerStatusData.custom = {};
                Object.keys(result.custom).forEach(key => {
                    playerStatusData.custom[key] = result.custom[key];
                });
            }

            localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            renderPlayerStatus();
            showToast('状态已更新');
        }
    } catch (error) {
        console.error('AI update status error:', error);
        showToast('更新失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ==================== TASK SYSTEM ====================

function openTaskModal() {
    document.getElementById('taskModal').classList.add('active');
    renderTaskProgress();
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function renderTaskProgress() {
    const content = document.getElementById('taskContent');
    
    // 获取任务信息
    const currentTask = worldBuildingData?.currentTask || '';
    const taskProgress = playerStatusData?.taskProgress || null;
    
    if (!currentTask && !taskProgress) {
        content.innerHTML = `<div class="task-empty">
            <p>暂无任务</p>
            <small>开始游戏后任务会自动生成</small>
        </div>`;
        return;
    }
    
    let html = '<div class="task-list">';
    
    // 显示主线任务
    if (currentTask) {
        const mainProgress = taskProgress?.main || 0;
        const mainStatus = taskProgress?.mainStatus || '进行中';
        const isCompleted = mainStatus === '已完成';
        
        html += `<div class="task-card task-main ${isCompleted ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-type-badge">🎯 主线任务</div>
                <div class="task-status ${isCompleted ? 'status-completed' : 'status-ongoing'}">${escapeHtml(mainStatus)}</div>
            </div>
            <div class="task-title">${escapeHtml(currentTask)}</div>
            <div class="task-progress-bar">
                <div class="task-progress-fill" style="width: ${mainProgress}%"></div>
            </div>
            <div class="task-progress-text">进度：${mainProgress}%</div>
        </div>`;
    }
    
    // 显示支线任务
    if (taskProgress?.side && taskProgress.side.length > 0) {
        html += '<div class="task-section-title">📝 支线任务</div>';
        taskProgress.side.forEach((task, index) => {
            const isCompleted = task.status === '已完成';
            html += `<div class="task-card task-side ${isCompleted ? 'completed' : ''}">
                <div class="task-header">
                    <div class="task-name">${escapeHtml(task.name)}</div>
                    <div class="task-status ${isCompleted ? 'status-completed' : 'status-ongoing'}">${escapeHtml(task.status || '进行中')}</div>
                </div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-progress-bar">
                    <div class="task-progress-fill" style="width: ${task.progress || 0}%"></div>
                </div>
                <div class="task-progress-text">进度：${task.progress || 0}%</div>
            </div>`;
        });
    }
    
    // 显示已完成任务记录
    if (taskProgress?.completed && taskProgress.completed.length > 0) {
        html += '<div class="task-section-title">✅ 已完成</div>';
        html += '<div class="task-completed-list">';
        taskProgress.completed.forEach((task, index) => {
            html += `<div class="task-completed-item">
                <span class="task-completed-check">✓</span>
                <span class="task-completed-name">${escapeHtml(task.name)}</span>
            </div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

async function refreshTaskByAI() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }
    
    if (chatHistory.length < 3) {
        showToast('对话太少，无法分析任务进度');
        return;
    }
    
    const btn = document.getElementById('taskRefreshBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner" style="width:16px;height:16px;"></div>';
    
    try {
        const currentTask = worldBuildingData?.currentTask || '无明确任务';
        const recentHistory = chatHistory.slice(-20).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n');
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是一个任务进度分析员。根据对话内容分析任务完成情况。严格返回JSON格式。' },
                    { role: 'user', content: `根据以下对话分析任务进度：

主线任务：${currentTask}

最近对话：
${recentHistory}

请分析并返回JSON：
{
  "main": 0-100的数字表示主线任务完成百分比,
  "mainStatus": "进行中/已完成/危险",
  "side": [
    {
      "name": "支线任务名",
      "description": "任务描述",
      "progress": 0-100,
      "status": "进行中/已完成"
    }
  ],
  "completed": [
    {"name": "已完成的任务名称"}
  ]
}

注意：
1. 根据对话内容合理估算进度
2. 支线任务从对话中提取（如收集物品、完成某事等）
3. 已明确完成的任务放入completed
4. 只返回JSON` }
                ],
                temperature: 0.7
            })
        });
        
        if (!response.ok) throw new Error('API请求失败');
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const taskProgress = JSON.parse(jsonMatch[0]);
            playerStatusData.taskProgress = taskProgress;
            localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            renderTaskProgress();
            showToast('任务进度已更新');
        } else {
            throw new Error('解析失败');
        }
    } catch (error) {
        console.error('Refresh task error:', error);
        showToast('刷新失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 11-2.63-6.36M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
}

// ==================== CHARACTERS ====================

function openCharactersModal() {
    document.getElementById('charactersModal').classList.add('active');
    renderCharactersList();
}

function closeCharactersModal() {
    document.getElementById('charactersModal').classList.remove('active');
}

function showCharactersList() {
    document.getElementById('charactersContent').style.display = 'block';
    document.getElementById('characterDetail').style.display = 'none';
}

function renderCharactersList() {
    const content = document.getElementById('charactersContent');
    const detail = document.getElementById('characterDetail');
    
    content.style.display = 'block';
    detail.style.display = 'none';
    
    if (!importantCharacters || importantCharacters.length === 0) {
        content.innerHTML = '<div class="status-empty">尚未生成重要人物<br><small style="color:var(--text-muted);">生成世界设定后会自动生成</small></div>';
        return;
    }
    
    let html = '<div class="characters-grid">';
    importantCharacters.forEach((char, index) => {
        const initials = char.name ? char.name.substring(0, 1) : '?';
        html += `<div class="character-card ${char.romanceable ? 'romanceable' : ''}" onclick="showCharacterDetail(${index})">
            <div class="character-card-avatar">${initials}</div>
            <div class="character-card-name">${escapeHtml(char.name)}</div>
            <div class="character-card-identity">${escapeHtml(char.identity)}</div>
            <div class="character-card-status">${escapeHtml(char.currentStatus || '正常')}</div>
        </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
}

function showCharacterDetail(index) {
    if (!importantCharacters || !importantCharacters[index]) return;
    
    const char = importantCharacters[index];
    const content = document.getElementById('charactersContent');
    const detail = document.getElementById('characterDetail');
    const title = document.getElementById('characterDetailTitle');
    const body = document.getElementById('characterDetailBody');
    
    content.style.display = 'none';
    detail.style.display = 'block';
    
    title.textContent = `${char.icon || '👤'} ${char.name}`;
    
    let html = '';
    
    const fields = [
        { label: '性别', value: char.gender },
        { label: '年龄', value: char.age },
        { label: '身份', value: char.identity },
        { label: '性格', value: char.personality },
        { label: '外貌', value: char.appearance },
        { label: '背景', value: char.background },
        { label: '习惯', value: char.habit },
        { label: '作息', value: char.schedule },
        { label: '关系', value: char.relationship },
    ];
    
    fields.forEach(field => {
        if (field.value) {
            html += `<div class="character-info-row">
                <div class="character-info-label">${field.label}</div>
                <div class="character-info-value">${escapeHtml(field.value)}</div>
            </div>`;
        }
    });
    
    if (char.romanceable) {
        const affection = playerStatusData.affection?.find(a => a.name === char.name)?.value || char.affection || 0;
        html += `<div class="character-info-row">
            <div class="character-info-label">好感度</div>
            <div class="character-info-value">
                <div class="affection-bar">
                    <div class="affection-fill" style="width:${affection}%"></div>
                </div>
                <span style="font-size:12px;color:var(--gold-primary);">${affection}/100 ♥</span>
            </div>
        </div>`;
    }
    
    body.innerHTML = html || '<div class="status-empty">暂无详细信息</div>';
}

async function restartChuanyue() {
    const modeName = gameMode === 'kuaichuan' ? '快穿' : '穿越';
    if (!await customConfirm(`确定要重新开始${modeName}模式吗？\n\n这将清空以下内容：\n• 聊天记录\n• 穿越人设\n• 世界设定\n• 故事总结`, '重新开始')) {
        return;
    }

    // Clear chat data
    chatHistory = [];
    chatStatus = null;
    isChuanyueStarted = false;
    lastSummaryAt = 0;
    storySummary = '';
    worldMemories = [];
    worldCount = 0;
    localStorage.removeItem(getStorageKey('chatHistory'));
    localStorage.removeItem(getStorageKey('chatStatus'));
    localStorage.removeItem(getStorageKey('isChuanyueStarted'));
    localStorage.removeItem(getStorageKey('lastSummaryAt'));
    localStorage.removeItem(getStorageKey('storySummary'));
    localStorage.removeItem(getStorageKey('worldMemories'));
    localStorage.removeItem(getStorageKey('worldCount'));
    localStorage.removeItem(getStorageKey('phaseSummaries'));
    localStorage.removeItem(getStorageKey('userPoints'));
    userPoints = 0;

    // Clear transmigrated character
    transCharData = null;
    transCharGenerated = false;
    localStorage.removeItem(getStorageKey('transCharData'));
    localStorage.removeItem(getStorageKey('transCharGenerated'));

    // Clear world building
    worldBuildingData = null;
    worldBuildingGenerated = false;
    localStorage.removeItem(getStorageKey('worldBuildingData'));
    localStorage.removeItem(getStorageKey('worldBuildingGenerated'));

    // Clear player status
    playerStatusData = { currentStatus: '', affection: [], friends: [], enemies: [], inventory: [], custom: {} };
    localStorage.removeItem(getStorageKey('playerStatusData'));
    
    // Clear custom status categories
    customStatusCategories = [];
    localStorage.removeItem(getStorageKey('customStatusCategories'));

    // Clear world map
    worldMapData = null;
    localStorage.removeItem(getStorageKey('worldMapData'));

    // Clear important characters
    importantCharacters = [];
    localStorage.removeItem(getStorageKey('importantCharacters'));

    // Reset UI
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('statusDate').textContent = '--';
    document.getElementById('statusTime').textContent = '--:--';
    document.getElementById('statusLocation').textContent = '--';
    document.getElementById('statusWeather').textContent = '--';

    // Hide chat interface, show placeholder
    document.getElementById('chatInterface').style.display = 'none';
    document.getElementById('chuanyuePlaceholder').style.display = 'flex';

    // Re-render cards
    renderTransChar();
    renderWorldBuilding();

    showToast('已重新开始');
}

function toggleSidebar() {
    const sidebar = document.getElementById('chuanyueSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isCollapsed = sidebar.classList.toggle('collapsed');
    
    if (isCollapsed) {
        overlay?.classList.remove('active');
    } else {
        overlay?.classList.add('active');
    }
}

function expandSidebar() {
    const sidebar = document.getElementById('chuanyueSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('collapsed');
    overlay?.classList.add('active');
}

function collapseSidebar() {
    const sidebar = document.getElementById('chuanyueSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.add('collapsed');
    overlay?.classList.remove('active');
}

function setupGenderSelect() {
    const genderBtns = document.querySelectorAll('.gender-btn');
    const genderInput = document.getElementById('profileGender');

    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            genderInput.value = btn.dataset.gender;
        });
    });
}

function openProfileModal(isEdit = false) {
    const modal = document.getElementById('profileModal');
    const title = document.getElementById('profileModalTitle');
    const genderBtns = document.querySelectorAll('.gender-btn');

    title.textContent = isEdit ? '编辑人设' : '创建人设';

    // Clear or fill form
    if (isEdit && characterProfile) {
        document.getElementById('profileName').value = characterProfile.name || '';
        document.getElementById('profileAge').value = characterProfile.age || '';
        document.getElementById('profilePersonality').value = characterProfile.personality || '';
        document.getElementById('profileSensitive').value = characterProfile.sensitive || '';
        document.getElementById('profileNotes').value = characterProfile.notes || '';
        document.getElementById('profileGender').value = characterProfile.gender || '';

        // Set gender button
        genderBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.gender === characterProfile.gender);
        });
    } else {
        document.getElementById('profileName').value = '';
        document.getElementById('profileAge').value = '';
        document.getElementById('profilePersonality').value = '';
        document.getElementById('profileSensitive').value = '';
        document.getElementById('profileNotes').value = '';
        document.getElementById('profileGender').value = '';
        genderBtns.forEach(btn => btn.classList.remove('active'));
    }

    modal.classList.add('active');
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('active');
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const age = document.getElementById('profileAge').value;
    const gender = document.getElementById('profileGender').value;
    const personality = document.getElementById('profilePersonality').value.trim();
    const sensitive = document.getElementById('profileSensitive').value.trim();
    const notes = document.getElementById('profileNotes').value.trim();

    if (!name) {
        showToast('请输入角色名字');
        return;
    }

    characterProfile = {
        name,
        age: age ? parseInt(age) : null,
        gender,
        personality,
        sensitive,
        notes,
        updatedAt: Date.now()
    };

    localStorage.setItem(getStorageKey('characterProfile'), JSON.stringify(characterProfile));
    closeProfileModal();
    showToast('人设已保存');
}

// 渲染角色身份卡片（穿书/无限流专用）
function renderRoleIdentity() {
    const card = document.getElementById('roleIdentityCard');
    const body = document.getElementById('roleIdentityBody');
    const title = document.getElementById('roleIdentityTitle');
    
    if (!card || !body) return;
    
    // 穿书和无限流模式显示角色身份卡片
    if (gameMode === 'chuanshu' || gameMode === 'wuxianliu') {
        card.style.display = 'block';
    } else {
        card.style.display = 'none';
        return;
    }
    
    let roleContent = '';
    let roleTitle = '角色身份';
    
    if (gameMode === 'chuanshu') {
        roleTitle = '👤 穿书身份';
        if (chuanyueRulesData?.identity) {
            roleContent = chuanyueRulesData.identity;
        }
    } else if (gameMode === 'wuxianliu') {
        roleTitle = '👤 我的人设';
        if (chuanyueRulesData?.wuxianliuRole) {
            roleContent = chuanyueRulesData.wuxianliuRole;
        }
    }
    
    if (title) title.textContent = roleTitle;
    
    if (roleContent) {
        body.innerHTML = `
            <div class="profile-info">
                <div class="role-identity-content">${escapeHtml(roleContent)}</div>
            </div>
        `;
    } else {
        body.innerHTML = `
            <div class="profile-empty">
                <p>${gameMode === 'chuanshu' ? '未设置穿书身份' : '未设置角色人设'}</p>
                <small>在开始前的设置中填写</small>
            </div>
        `;
    }
}

function renderProfile() {
    // 已删除我的人设卡片，此函数不再需要
    return;

    if (!characterProfile) {
        profileBody.innerHTML = `
            <div class="profile-empty">
                <p>尚未设置人设</p>
                <button class="profile-create-btn" id="createProfileBtn" onclick="openProfileModal(false)">创建人设</button>
            </div>
        `;
        return;
    }

    const genderMap = {
        'male': '男',
        'female': '女',
        'other': '其他'
    };

    let html = '<div class="profile-info">';

    // Name row
    html += `<div class="profile-info-item">
        <span class="label">名字:</span>
        <span class="value">${escapeHtml(characterProfile.name)}</span>
    </div>`;

    // Age and gender row
    html += '<div class="profile-info-row">';
    if (characterProfile.age) {
        html += `<div class="profile-info-item">
            <span class="label">年龄:</span>
            <span class="value">${characterProfile.age}岁</span>
        </div>`;
    }
    if (characterProfile.gender) {
        html += `<div class="profile-info-item">
            <span class="label">性别:</span>
            <span class="value">${genderMap[characterProfile.gender] || characterProfile.gender}</span>
        </div>`;
    }
    html += '</div>';

    // Personality
    if (characterProfile.personality) {
        html += `<div class="profile-info-item">
            <span class="label">性格:</span>
            <span class="profile-tag">${escapeHtml(characterProfile.personality)}</span>
        </div>`;
    }

    // Sensitive areas
    if (characterProfile.sensitive) {
        html += `<div class="profile-info-item">
            <span class="label">敏感带:</span>
            <span class="profile-tag">${escapeHtml(characterProfile.sensitive)}</span>
        </div>`;
    }

    // Notes
    if (characterProfile.notes) {
        html += `<div class="profile-notes">${escapeHtml(characterProfile.notes)}</div>`;
    }

    html += '</div>';
    
    // 显示穿越人设（如果有）
    if (transCharData && transCharData.name && currentPage === 'chuanyue') {
        const modeLabel = {
            'chuanyue': '穿越身份',
            'kuaichuan': '本世界身份',
            'chuanshu': '穿书身份',
            'wuxianliu': '副本身份'
        };
        
        html += `<div class="trans-char-section">
            <div class="trans-char-divider">${modeLabel[gameMode] || '穿越身份'}</div>
            <div class="profile-info">`;
        
        html += `<div class="profile-info-item">
            <span class="label">身份:</span>
            <span class="value trans-char-name">${escapeHtml(transCharData.name)}</span>
        </div>`;
        
        if (transCharData.background) {
            html += `<div class="profile-info-item full-width">
                <span class="label">背景:</span>
                <span class="value">${escapeHtml(transCharData.background)}</span>
            </div>`;
        }
        
        if (transCharData.situation) {
            html += `<div class="profile-info-item full-width">
                <span class="label">处境:</span>
                <span class="value">${escapeHtml(transCharData.situation)}</span>
            </div>`;
        }
        
        if (transCharData.ability) {
            html += `<div class="profile-info-item full-width">
                <span class="label">金手指:</span>
                <span class="value trans-char-ability">${escapeHtml(transCharData.ability)}</span>
            </div>`;
        }
        
        if (transCharData.notes) {
            html += `<div class="profile-notes">${escapeHtml(transCharData.notes)}</div>`;
        }
        
        html += '</div></div>';
    }
    
    profileBody.innerHTML = html;
}

// ==================== CHAT FUNCTIONS ====================

function setupChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const moreBtn = document.getElementById('chatMoreBtn');
    const bottomSheet = document.getElementById('bottomSheet');
    const bottomSheetOverlay = document.getElementById('bottomSheetOverlay');

    // Send message on button click (only sends user message, no AI generation)
    sendBtn.addEventListener('click', sendUserMessageOnly);
    
    // Generate AI content button
    const generateBtn = document.getElementById('chatGenerateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAIContent);
    }

    // Enter key only adds new line, does not send
    chatInput.addEventListener('keydown', (e) => {
        // Allow Enter to create new line (default behavior)
        // Ctrl+Enter or Cmd+Enter to send and generate
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            sendUserMessage();
        }
    });

    // Auto resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Bottom sheet
    moreBtn.addEventListener('click', openBottomSheet);
    bottomSheetOverlay.addEventListener('click', closeBottomSheet);

    // Summary button
    document.getElementById('btnSummary').addEventListener('click', () => {
        closeBottomSheet();
        openSummaryModal();
    });

    // Summary modal
    document.getElementById('summaryModalClose').addEventListener('click', closeSummaryModal);
    document.getElementById('summaryModal').addEventListener('click', (e) => {
        if (e.target.id === 'summaryModal') closeSummaryModal();
    });
    document.getElementById('summaryGenerateBtn').addEventListener('click', generateSummary);
    document.getElementById('summarySaveBtn').addEventListener('click', saveSummary);

    // Status button
    document.getElementById('btnStatus').addEventListener('click', () => {
        closeBottomSheet();
        openStatusModal();
    });

    // Status modal
    document.getElementById('statusModalClose').addEventListener('click', closeStatusModal);
    document.getElementById('statusModal').addEventListener('click', (e) => {
        if (e.target.id === 'statusModal') closeStatusModal();
    });
    document.getElementById('statusAiUpdate').addEventListener('click', aiUpdateStatus);

    // Status edit buttons
    document.querySelectorAll('.status-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editStatusSection(btn.dataset.section));
    });

    // Task button
    document.getElementById('btnTask').addEventListener('click', () => {
        closeBottomSheet();
        openTaskModal();
    });

    // Task modal
    document.getElementById('taskModalClose').addEventListener('click', closeTaskModal);
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') closeTaskModal();
    });
    document.getElementById('taskRefreshBtn').addEventListener('click', refreshTaskByAI);

    // Characters button
    document.getElementById('btnCharacters').addEventListener('click', () => {
        closeBottomSheet();
        openCharactersModal();
    });

    // Characters modal
    document.getElementById('charactersModalClose').addEventListener('click', closeCharactersModal);
    document.getElementById('charactersModal').addEventListener('click', (e) => {
        if (e.target.id === 'charactersModal') closeCharactersModal();
    });
    document.getElementById('charactersRefreshBtn').addEventListener('click', refreshCharactersByAI);
    document.getElementById('characterBackBtn').addEventListener('click', showCharactersList);

    // Context menu
    document.getElementById('contextFavorite').addEventListener('click', favoriteMessage);
    document.getElementById('contextEdit').addEventListener('click', editMessage);
    document.getElementById('contextRegenerate').addEventListener('click', regenerateMessage);
    document.getElementById('contextDelete').addEventListener('click', deleteMessage);
    document.addEventListener('click', hideContextMenu);
    
    // Save archive button
    document.getElementById('saveArchiveBtn')?.addEventListener('click', () => saveArchive());
}

async function editMessage() {
    hideContextMenu();
    if (selectedMessageIndex < 0 || selectedMessageIndex >= chatHistory.length) return;
    
    const msg = chatHistory[selectedMessageIndex];
    if (msg.type !== 'user') {
        showToast('只能编辑用户消息');
        return;
    }
    
    const newContent = await customPrompt('', msg.content, '编辑消息');
    if (newContent === null || newContent.trim() === '') return;
    
    // Update content
    chatHistory[selectedMessageIndex].content = newContent.trim();
    localStorage.setItem(getStorageKey('chatHistory'), JSON.stringify(chatHistory));
    
    // Re-render chat history
    renderChatHistory();
    showToast('消息已更新');
}

function favoriteMessage() {
    hideContextMenu();
    if (selectedMessageIndex < 0 || selectedMessageIndex >= chatHistory.length) return;
    
    const msg = chatHistory[selectedMessageIndex];
    addToFavorites(msg.content, msg.type === 'ai' ? 'AI回复' : '用户消息');
}

function openBottomSheet() {
    document.getElementById('bottomSheet').classList.add('active');
    document.getElementById('bottomSheetOverlay').classList.add('active');
}

function closeBottomSheet() {
    document.getElementById('bottomSheet').classList.remove('active');
    document.getElementById('bottomSheetOverlay').classList.remove('active');
}

function openSummaryModal() {
    const modal = document.getElementById('summaryModal');
    const textarea = document.getElementById('summaryTextarea');
    
    modal.classList.add('active');
    textarea.value = storySummary || '';
}

function closeSummaryModal() {
    document.getElementById('summaryModal').classList.remove('active');
}

function saveSummary() {
    const textarea = document.getElementById('summaryTextarea');
    storySummary = textarea.value.trim();
    localStorage.setItem(getStorageKey('storySummary'), storySummary);
    lastSummaryAt = chatHistory.length;
    localStorage.setItem(getStorageKey('lastSummaryAt'), lastSummaryAt.toString());
    showToast('总结已保存');
    closeSummaryModal();
}

async function generateSummary() {
    const textarea = document.getElementById('summaryTextarea');
    const generateBtn = document.getElementById('summaryGenerateBtn');
    
    if (chatHistory.length === 0) {
        showToast('暂无内容可总结');
        return;
    }

    // 使用备用API（如果配置了）
    const api = getBackupApi();
    if (!api.baseUrl || !api.apiKey || !api.model) {
        showToast('请先在设置中配置API');
        return;
    }

    // Disable button and show loading
    const originalHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" class="spin" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="30 70"/></svg><span>生成中...</span>';

    try {
        // Build story content from chat history
        let storyContent = chatHistory.map(msg => {
            return msg.type === 'user' ? `【玩家行动】${msg.content}` : msg.content;
        }).join('\n\n');

        const systemPrompt = `你是一个专业的故事记录员。请生成一份完整详细的故事摘要。

【总结要求】
1. 使用第三人称视角，客观记录
2. 必须包含以下内容：
   - 【主线剧情】：故事的主要发展脉络，按时间顺序
   - 【重要人物】：出场的关键人物及其身份、与主角的关系
   - 【关键事件】：影响剧情走向的重要事件
   - 【当前状况】：主角目前所处的位置、状态、面临的情况
   - 【伏笔线索】：尚未解决的谜团、隐藏的线索
3. 保留重要细节和关键对话
4. 整合成一份完整连贯的总结
5. 总结长度控制在500-800字`;

        const response = await fetch(api.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${api.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: api.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `请客观总结以下故事内容：\n\n${storyContent}` }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        const summary = data.choices[0]?.message?.content || '无法生成总结';

        // Display in textarea
        textarea.value = summary;
        showToast('总结生成完成');
        
    } catch (error) {
        console.error('Summary error:', error);
        showToast('总结生成失败: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
    }
}

// Context Menu Functions
let selectedMessageType = 'ai';

function showContextMenu(e, index, type = 'ai') {
    // 处理Touch对象和Event对象
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    selectedMessageIndex = index;
    selectedMessageType = type;
    
    const menu = document.getElementById('messageContextMenu');
    const regenerateBtn = document.getElementById('contextRegenerate');
    const editBtn = document.getElementById('contextEdit');
    
    // 显示/隐藏重新生成按钮（仅AI消息）
    if (regenerateBtn) {
        regenerateBtn.style.display = type === 'ai' ? 'flex' : 'none';
    }
    // 显示/隐藏编辑按钮（仅用户消息）
    if (editBtn) {
        editBtn.style.display = type === 'user' ? 'flex' : 'none';
    }
    
    // Position menu - 处理Touch对象（clientX/clientY）和MouseEvent
    let x = e.clientX || e.pageX || 100;
    let y = e.clientY || e.pageY || 100;
    
    // Adjust if menu would go off screen
    const menuWidth = 150;
    const menuHeight = 140;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('active');
}

function hideContextMenu() {
    document.getElementById('messageContextMenu').classList.remove('active');
}

function deleteMessage() {
    hideContextMenu();
    if (selectedMessageIndex < 0 || selectedMessageIndex >= chatHistory.length) return;
    
    chatHistory.splice(selectedMessageIndex, 1);
    localStorage.setItem(getStorageKey('chatHistory'), JSON.stringify(chatHistory));
    renderChatHistory();
    showToast('消息已删除');
}

async function regenerateMessage() {
    hideContextMenu();
    if (selectedMessageIndex < 0 || selectedMessageIndex >= chatHistory.length) return;
    
    const targetMsg = chatHistory[selectedMessageIndex];
    if (targetMsg.type !== 'ai') {
        showToast('只能重新生成AI消息');
        return;
    }
    
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    // Find the user message before this AI message
    let userMsgIndex = selectedMessageIndex - 1;
    while (userMsgIndex >= 0 && chatHistory[userMsgIndex].type !== 'user') {
        userMsgIndex--;
    }

    // Remove AI messages from the selected index onward
    chatHistory.splice(selectedMessageIndex);
    localStorage.setItem(getStorageKey('chatHistory'), JSON.stringify(chatHistory));
    renderChatHistory();

    // Show loading
    addLoadingMessage();

    try {
        const systemPrompt = buildChuanyueSystemPrompt();
        const messages = [{ role: 'system', content: systemPrompt }];
        
        // Add history up to selected point (15 messages for context)
        const recentHistory = chatHistory.slice(-15);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: messages,
                temperature: apiSettings.temperature || 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Parse status info
        const statusMatch = content.match(/【状态】([\s\S]*?)【正文】/);
        if (statusMatch) {
            const statusText = statusMatch[1];
            const dateMatch = statusText.match(/日期[：:]\s*(.+)/);
            const timeMatch = statusText.match(/时间[：:]\s*(.+)/);
            const locationMatch = statusText.match(/地点[：:]\s*(.+)/);
            const weatherMatch = statusText.match(/天气[：:]\s*(.+)/);

            chatStatus = {
                date: dateMatch ? dateMatch[1].trim() : chatStatus?.date || '--',
                time: timeMatch ? timeMatch[1].trim() : chatStatus?.time || '--:--',
                location: locationMatch ? locationMatch[1].trim() : chatStatus?.location || '--',
                weather: weatherMatch ? weatherMatch[1].trim() : chatStatus?.weather || '--'
            };
            localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
            updateStatusBar();
        }

        removeLoadingMessage();
        
        const textMatch = content.match(/【正文】([\s\S]*)/);
        const aiText = textMatch ? textMatch[1].trim() : content.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
        addMessage('ai', aiText);
        
        showToast('重新生成完成');

    } catch (error) {
        console.error('Regenerate error:', error);
        removeLoadingMessage();
        addMessage('ai', '重新生成失败...请稍后再试。');
        showToast('重新生成失败: ' + error.message);
    }
}

async function checkAutoSummary() {
    // Auto summary every 10 messages
    const messagesSinceLastSummary = chatHistory.length - lastSummaryAt;
    
    if (messagesSinceLastSummary >= 10 && apiSettings.baseUrl && apiSettings.apiKey && apiSettings.model) {
        // Generate summary in background
        try {
            let storyContent = chatHistory.slice(lastSummaryAt).map(msg => {
                return msg.type === 'user' ? `【玩家行动】${msg.content}` : msg.content;
            }).join('\n\n');

            const systemPrompt = `你是一个专业的故事记录员。请将新增内容与之前的总结整合，生成一份完整的故事摘要。

【总结要求】
1. 使用第三人称视角，客观记录
2. 必须包含以下内容：
   - 【主线剧情】：故事的主要发展脉络，按时间顺序
   - 【重要人物】：出场的关键人物及其身份、与主角的关系
   - 【关键事件】：影响剧情走向的重要事件
   - 【当前状况】：主角目前所处的位置、状态、面临的情况
   - 【伏笔线索】：尚未解决的谜团、隐藏的线索
3. 保留重要细节，删除无关紧要的描写
4. 整合新旧内容，输出一份完整连贯的总结
5. 总结长度控制在500-800字`;

            const previousSummary = storySummary ? `【之前的故事总结】\n${storySummary}\n\n` : '';

            const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiSettings.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: apiSettings.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `${previousSummary}【新增故事内容】\n${storyContent}\n\n请整合以上内容，生成完整的故事摘要。` }
                    ],
                    temperature: 0.3
                })
            });

            if (response.ok) {
                const data = await response.json();
                const summary = data.choices[0]?.message?.content;
                if (summary) {
                    storySummary = summary;
                    localStorage.setItem(getStorageKey('storySummary'), storySummary);
                    lastSummaryAt = chatHistory.length;
                    localStorage.setItem(getStorageKey('lastSummaryAt'), lastSummaryAt.toString());
                    console.log('Auto summary updated');
                }
            }
        } catch (error) {
            console.error('Auto summary error:', error);
        }
    }
}

// 快穿模式：生成世界总结并保存到长期记忆
async function generateWorldSummary() {
    if (gameMode !== 'kuaichuan' || !apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        return;
    }

    try {
        const storyContent = chatHistory.map(msg => {
            return msg.type === 'user' ? `【玩家行动】${msg.content}` : msg.content;
        }).join('\n\n');

        const systemPrompt = `你是一个专业的故事记录员。请为这个已完成的世界生成一份简洁的总结，作为长期记忆保存。

【总结要求】
1. 总结长度：150-250字
2. 必须包含：
   - 世界背景（什么类型的世界）
   - 目标角色（名字、身份、性格特点）
   - 任务内容和完成情况
   - 与目标角色的关系发展
   - 结局（是否留下、角色反应）
3. 使用第三人称视角
4. 突出重要的情感节点和剧情转折`;

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `请总结以下世界的故事：\n\n${storyContent}` }
                ],
                temperature: 0.3
            })
        });

        if (response.ok) {
            const data = await response.json();
            const summary = data.choices[0]?.message?.content;
            if (summary) {
                worldCount++;
                const worldMemory = {
                    worldNumber: worldCount,
                    type: chuanyueRulesData?.kuaichuanType || 'unknown',
                    summary: summary,
                    timestamp: Date.now()
                };
                worldMemories.push(worldMemory);
                localStorage.setItem(getStorageKey('worldMemories'), JSON.stringify(worldMemories));
                localStorage.setItem(getStorageKey('worldCount'), worldCount.toString());
                console.log('World summary saved:', worldMemory);
                
                // 每5个世界生成阶段性总结
                if (worldCount % 5 === 0) {
                    await generatePhaseSummary();
                }
            }
        }
    } catch (error) {
        console.error('Generate world summary error:', error);
    }
}

// 生成阶段性总结（每5个世界）
async function generatePhaseSummary() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) return;
    
    try {
        const startWorld = worldCount - 4;
        const endWorld = worldCount;
        const recentWorlds = worldMemories.slice(-5);
        
        const worldsContent = recentWorlds.map(mem => 
            `第${mem.worldNumber}世界：${mem.summary}`
        ).join('\n\n');
        
        const systemPrompt = `请将这5个世界的记忆整合成一份阶段性总结。

【要求】
1. 总结长度：200-300字
2. 重点关注：
   - 用户与目标角色灵魂羁绊的深化
   - 重复出现的情感模式
   - 目标角色的核心性格在不同世界的体现
   - 重要的情感节点和转折
3. 分析用户的选择倾向（留下还是离开）
4. 记录是否有角色黑化或记忆觉醒`;

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `请总结第${startWorld}-${endWorld}世界：\n\n${worldsContent}` }
                ],
                temperature: 0.3
            })
        });

        if (response.ok) {
            const data = await response.json();
            const summary = data.choices[0]?.message?.content;
            if (summary) {
                const phaseSummaries = JSON.parse(localStorage.getItem(getStorageKey('phaseSummaries')) || '[]');
                phaseSummaries.push({
                    startWorld,
                    endWorld,
                    summary,
                    timestamp: Date.now()
                });
                localStorage.setItem(getStorageKey('phaseSummaries'), JSON.stringify(phaseSummaries));
                console.log('Phase summary saved:', startWorld, '-', endWorld);
            }
        }
    } catch (error) {
        console.error('Generate phase summary error:', error);
    }
}

// ==================== SHOP SYSTEM ====================

function updatePointsDisplay() {
    const currentPointsEl = document.getElementById('currentPoints');
    const shopModalPointsEl = document.getElementById('shopModalPoints');
    if (currentPointsEl) currentPointsEl.textContent = userPoints;
    if (shopModalPointsEl) shopModalPointsEl.textContent = userPoints;
}

function addPoints(amount) {
    userPoints += amount;
    localStorage.setItem(getStorageKey('userPoints'), userPoints.toString());
    updatePointsDisplay();
    if (amount > 0) {
        showToast(`获得 ${amount} 积分！`);
    }
}

function openShopModal() {
    document.getElementById('shopModal').classList.add('active');
    updatePointsDisplay();
    loadShopItems();
}

function closeShopModal() {
    document.getElementById('shopModal').classList.remove('active');
}

async function loadShopItems() {
    const shopItemsEl = document.getElementById('shopItems');
    shopItemsEl.innerHTML = '<div class="shop-loading">正在加载商品...</div>';
    
    // 根据当前剧情动态生成商品
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        shopItemsEl.innerHTML = '<div class="shop-loading">请先配置API</div>';
        return;
    }
    
    try {
        const recentChat = chatHistory.slice(-5).map(m => m.content).join('\n');
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { 
                        role: 'system', 
                        content: `你是快穿系统商城。根据当前剧情生成6个商品。

请返回JSON数组格式，每个商品包含：
- icon: 一个emoji图标
- name: 商品名称（简短）
- desc: 商品效果描述（20字内）
- price: 价格（10-2000之间）

商品类型可以是：道具、技能、buff、情报、剧情干预等。
根据当前剧情适当调整商品，让它们有用。

只返回JSON数组，不要其他内容。示例：
[{"icon":"💊","name":"解毒丸","desc":"解除中毒状态","price":50}]` 
                    },
                    { role: 'user', content: `当前剧情：\n${recentChat || '刚开始游戏'}\n\n请生成6个适合当前剧情的商品。` }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error('请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        // 解析JSON
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            shopItems = JSON.parse(jsonMatch[0]);
            renderShopItems();
        } else {
            throw new Error('解析失败');
        }
    } catch (error) {
        console.error('Load shop items error:', error);
        // 使用默认商品
        shopItems = [
            { icon: '🍀', name: '幸运符', desc: '下次行动成功率+20%', price: 50 },
            { icon: '💭', name: '读心术', desc: '看穿一个NPC的想法', price: 100 },
            { icon: '⏪', name: '时光倒流', desc: '重来最近一个选择', price: 200 },
            { icon: '🎭', name: '变装卡', desc: '临时改变外貌身份', price: 150 },
            { icon: '💝', name: '好感提升', desc: '目标好感度+10', price: 300 },
            { icon: '🛡️', name: '护盾', desc: '抵挡一次伤害或危险', price: 100 }
        ];
        renderShopItems();
    }
}

function renderShopItems() {
    const shopItemsEl = document.getElementById('shopItems');
    
    if (shopItems.length === 0) {
        shopItemsEl.innerHTML = '<div class="shop-loading">暂无商品</div>';
        return;
    }
    
    let html = '';
    shopItems.forEach((item, index) => {
        const canAfford = userPoints >= item.price;
        html += `
            <div class="shop-item">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${escapeHtml(item.name)}</div>
                    <div class="shop-item-desc">${escapeHtml(item.desc)}</div>
                </div>
                <div class="shop-item-buy">
                    <div class="shop-item-price">💎 ${item.price}</div>
                    <button class="shop-item-btn" onclick="buyItem(${index})" ${canAfford ? '' : 'disabled'}>
                        ${canAfford ? '购买' : '积分不足'}
                    </button>
                </div>
            </div>
        `;
    });
    
    shopItemsEl.innerHTML = html;
}

function buyItem(index) {
    const item = shopItems[index];
    if (!item || userPoints < item.price) {
        showToast('积分不足');
        return;
    }
    
    userPoints -= item.price;
    localStorage.setItem(getStorageKey('userPoints'), userPoints.toString());
    updatePointsDisplay();
    renderShopItems();
    
    // 在聊天中添加购买信息
    const purchaseMsg = `【📦系统商城】你使用 ${item.price} 积分购买了「${item.name}」\n效果：${item.desc}\n\n（请在对话中使用此道具）`;
    addMessage('ai', purchaseMsg);
    
    showToast(`购买成功：${item.name}`);
    closeShopModal();
}

function setupShopEvents() {
    // 点击商城卡片打开弹窗
    const shopHeader = document.getElementById('shopHeader');
    if (shopHeader) {
        shopHeader.addEventListener('click', openShopModal);
    }
    
    // 关闭弹窗
    const shopModalClose = document.getElementById('shopModalClose');
    const shopModalConfirm = document.getElementById('shopModalConfirm');
    if (shopModalClose) shopModalClose.addEventListener('click', closeShopModal);
    if (shopModalConfirm) shopModalConfirm.addEventListener('click', closeShopModal);
    
    // 刷新商品
    const refreshShopBtn = document.getElementById('refreshShopBtn');
    if (refreshShopBtn) {
        refreshShopBtn.addEventListener('click', loadShopItems);
    }
    
    // 点击遮罩关闭
    const shopModal = document.getElementById('shopModal');
    if (shopModal) {
        shopModal.addEventListener('click', (e) => {
            if (e.target === shopModal) closeShopModal();
        });
    }
}

// ==================== LIVESTREAM SYSTEM ====================

function setupLivestreamEvents() {
    const floatBtn = document.getElementById('livestreamFloatBtn');
    const panel = document.getElementById('livestreamPanel');
    const closeBtn = document.getElementById('livestreamClose');
    const clearBtn = document.getElementById('livestreamClear');
    
    if (!floatBtn) return;
    
    // 点击切换弹幕面板
    floatBtn.addEventListener('click', (e) => {
        if (e.target.closest('.livestream-float-btn') && !floatBtn.isDragging) {
            toggleLivestreamPanel();
        }
    });
    
    // 关闭按钮
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }
    
    // 清除弹幕按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', clearLivestreamMessages);
    }
    
    // 拖拽功能
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    floatBtn.addEventListener('mousedown', dragStart);
    floatBtn.addEventListener('touchstart', dragStart, { passive: false });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
    
    function dragStart(e) {
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        
        const rect = floatBtn.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        isDragging = false;
        floatBtn.isDragging = false;
    }
    
    function drag(e) {
        if (startX === undefined) return;
        
        let currentX, currentY;
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // 只有移动超过5px才算拖拽
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isDragging = true;
            floatBtn.isDragging = true;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // 限制在屏幕内
            newX = Math.max(0, Math.min(window.innerWidth - 56, newX));
            newY = Math.max(0, Math.min(window.innerHeight - 56, newY));
            
            floatBtn.style.left = newX + 'px';
            floatBtn.style.right = 'auto';
            floatBtn.style.top = newY + 'px';
            floatBtn.style.bottom = 'auto';
            
            e.preventDefault();
        }
    }
    
    function dragEnd() {
        startX = undefined;
        startY = undefined;
        
        setTimeout(() => {
            floatBtn.isDragging = false;
        }, 100);
    }
}

function toggleLivestreamPanel() {
    const panel = document.getElementById('livestreamPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'flex';
        updateLivestreamBadge(0);
    } else {
        panel.style.display = 'none';
    }
}

function showLivestreamButton() {
    const floatBtn = document.getElementById('livestreamFloatBtn');
    if (floatBtn && chuanyueRulesData?.livestreamEnabled) {
        floatBtn.style.display = 'flex';
        // 初始化观众数量
        viewerCount = Math.floor(Math.random() * 500) + 100;
        updateViewerCount();
        // 恢复弹幕历史
        restoreLivestreamMessages();
    }
}

function hideLivestreamButton() {
    const floatBtn = document.getElementById('livestreamFloatBtn');
    const panel = document.getElementById('livestreamPanel');
    if (floatBtn) floatBtn.style.display = 'none';
    if (panel) panel.style.display = 'none';
}

function updateViewerCount() {
    const el = document.getElementById('viewerCount');
    if (el) el.textContent = viewerCount;
}

function updateLivestreamBadge(count) {
    const badge = document.getElementById('livestreamBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function updateLivestreamPoints() {
    const el = document.getElementById('livestreamPoints');
    if (el) el.textContent = userPoints;
}

function addLivestreamMessage(type, user, content, points = 0) {
    const messagesEl = document.getElementById('livestreamMessages');
    if (!messagesEl) return;
    
    const msg = { type, user, content, points, time: Date.now() };
    livestreamMessages.push(msg);
    
    // 限制消息数量为200条
    if (livestreamMessages.length > 200) {
        livestreamMessages.shift();
    }
    
    // 保存到localStorage
    localStorage.setItem(getStorageKey('livestreamMessages'), JSON.stringify(livestreamMessages));
    
    renderLivestreamMessage(msg, messagesEl);
    
    // 更新未读数
    const panel = document.getElementById('livestreamPanel');
    if (panel.style.display === 'none') {
        const badge = document.getElementById('livestreamBadge');
        const currentCount = parseInt(badge?.textContent || '0');
        updateLivestreamBadge(currentCount + 1);
    }
}

function renderLivestreamMessage(msg, container) {
    const { type, user, content, points } = msg;
    let msgClass = type === 'gift' ? (points >= 500 ? 'big-gift' : 'gift') : 'danmu';
    let msgHtml = '';
    
    if (type === 'danmu') {
        msgHtml = `
            <div class="livestream-msg ${msgClass}">
                <span class="msg-user">${escapeHtml(user)}:</span>
                <span class="msg-content">${escapeHtml(content)}</span>
            </div>
        `;
    } else {
        msgHtml = `
            <div class="livestream-msg ${msgClass}">
                <span class="msg-user">${escapeHtml(user)}</span>
                <span class="msg-gift">送出 ${escapeHtml(content)} (+${points}积分)</span>
            </div>
        `;
        // 添加积分（只在新消息时添加）
        if (!container.dataset.restoring) {
            addPoints(points);
            updateLivestreamPoints();
        }
    }
    
    container.insertAdjacentHTML('beforeend', msgHtml);
    container.scrollTop = container.scrollHeight;
}

function restoreLivestreamMessages() {
    const messagesEl = document.getElementById('livestreamMessages');
    if (!messagesEl || livestreamMessages.length === 0) return;
    
    messagesEl.innerHTML = '';
    messagesEl.dataset.restoring = 'true';
    
    livestreamMessages.forEach(msg => {
        renderLivestreamMessage(msg, messagesEl);
    });
    
    delete messagesEl.dataset.restoring;
}

function clearLivestreamMessages() {
    livestreamMessages = [];
    localStorage.removeItem(getStorageKey('livestreamMessages'));
    
    const messagesEl = document.getElementById('livestreamMessages');
    if (messagesEl) {
        messagesEl.innerHTML = '<div class="livestream-empty" style="text-align:center;color:var(--text-muted);padding:20px;">弹幕已清空</div>';
    }
    
    showToast('弹幕已清空');
}

// 模拟观众弹幕和打赏（每次AI回复后调用）
function simulateLivestreamActivity() {
    if (!chuanyueRulesData?.livestreamEnabled) return;
    
    // 随机观众变化
    viewerCount += Math.floor(Math.random() * 50) - 20;
    viewerCount = Math.max(50, viewerCount);
    updateViewerCount();
    
    // 随机弹幕
    const danmuUsers = [
        '仙界吃瓜群众', '魔界小透明', '穿越前辈001', '异界商人',
        '深海的鱼', '云上仙子', '魔尊本尊', '吃瓜看戏',
        '神秘观众', '位面旅行者', '修仙新手', '大能转世'
    ];
    
    const danmuComments = [
        '有点意思', '这波操作可以', '加油！', '笑死',
        '前排围观', '期待后续', '这剧情绝了', '心疼主角',
        '攻好帅', '我嗑到了', '太甜了', '虐到了',
        '冲冲冲', '看好你', '稳住', '刺激'
    ];
    
    // 50%概率发弹幕
    if (Math.random() < 0.5) {
        const user = danmuUsers[Math.floor(Math.random() * danmuUsers.length)];
        const comment = danmuComments[Math.floor(Math.random() * danmuComments.length)];
        setTimeout(() => {
            addLivestreamMessage('danmu', user, comment);
        }, Math.random() * 2000);
    }
    
    // 30%概率打赏
    if (Math.random() < 0.3) {
        const giftUsers = danmuUsers.slice();
        const user = giftUsers[Math.floor(Math.random() * giftUsers.length)];
        
        const gifts = [
            { name: '小红花', points: 10 },
            { name: '爱心', points: 20 },
            { name: '糖果', points: 30 },
            { name: '蛋糕', points: 50 },
            { name: '火箭', points: 100 },
            { name: '飞船', points: 200 },
            { name: '城堡', points: 500 },
            { name: '星球', points: 1000 }
        ];
        
        // 权重选择，小礼物更常见
        const weights = [30, 25, 20, 12, 7, 4, 1.5, 0.5];
        let random = Math.random() * 100;
        let selectedGift = gifts[0];
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                selectedGift = gifts[i];
                break;
            }
        }
        
        setTimeout(() => {
            addLivestreamMessage('gift', user, selectedGift.name, selectedGift.points);
        }, Math.random() * 3000 + 1000);
    }
}

function showChatInterface() {
    document.getElementById('chuanyuePlaceholder').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'flex';
    renderChatHistory();
    updateStatusBar();
}

function hideChatInterface() {
    document.getElementById('chuanyuePlaceholder').style.display = 'flex';
    document.getElementById('chatInterface').style.display = 'none';
}

async function startChuanyueSession() {
    // Clear previous chat
    chatHistory = [];
    chatStatus = null;
    isChuanyueStarted = true;
    localStorage.setItem(getStorageKey('isChuanyueStarted'), 'true');
    localStorage.setItem(getStorageKey('chatHistory'), '[]');
    localStorage.removeItem(getStorageKey('chatStatus'));

    // 重置穿越人设和世界构建（每个世界可生成一次）
    resetTransChar();
    resetCurrentWorldBuilding();

    // Show chat interface
    showChatInterface();
    
    // 显示直播按钮（如果开启了直播模式）
    if (chuanyueRulesData?.livestreamEnabled) {
        showLivestreamButton();
        updateLivestreamPoints();
    }
    
    // 处理概率双性：在生成内容前先确定性别
    await handleGenderRandomization();
    
    // 自动生成穿越人设（静默）
    await autoGenerateTransChar();
    
    // Generate opening scene
    await generateOpeningScene();
}

// 处理概率双性随机
async function handleGenderRandomization() {
    // 快穿模式每个世界单独随机，不在这里处理
    if (gameMode === 'kuaichuan') {
        return;
    }
    
    if (chuanyueRulesData?.genderSetting !== 'random') {
        // 不是概率双性，清除之前的随机结果
        if (chuanyueRulesData) {
            chuanyueRulesData.confirmedGender = null;
            localStorage.setItem(getStorageKey('chuanyueRulesData'), JSON.stringify(chuanyueRulesData));
        }
        return;
    }
    
    // 获取原本性别（无限流模式可能没有characterProfile，从wuxianliuRole中提取或默认男性）
    let originalGender = 'male';
    if (characterProfile?.gender) {
        originalGender = characterProfile.gender;
    } else if (gameMode === 'wuxianliu' && chuanyueRulesData?.wuxianliuRole) {
        // 尝试从角色设定中提取性别
        const roleText = chuanyueRulesData.wuxianliuRole;
        if (roleText.includes('女') || roleText.includes('♀')) {
            originalGender = 'female';
        }
    }
    const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
    const originalGenderText = genderMap[originalGender] || '男';
    
    // 30%概率变成双性
    const isIntersex = Math.random() < 0.3;
    
    // 保存确定后的性别
    const confirmedGender = isIntersex ? 'intersex' : originalGender;
    chuanyueRulesData.confirmedGender = confirmedGender;
    localStorage.setItem(getStorageKey('chuanyueRulesData'), JSON.stringify(chuanyueRulesData));
    
    // 添加系统消息显示结果
    const messagesContainer = document.getElementById('messagesContainer');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'message system-message gender-result-message';
    
    if (isIntersex) {
        systemMsg.innerHTML = `
            <div class="gender-result intersex">
                <div class="gender-result-icon">⚧️</div>
                <div class="gender-result-content">
                    <div class="gender-result-title">【性别随机结果】</div>
                    <div class="gender-result-text">命运的轮盘转动... 你在本次穿越中获得了<strong>双性体质</strong>！</div>
                    <div class="gender-result-desc">同时拥有男性和女性的身体特征，这将影响你在这个世界的体验。</div>
                </div>
            </div>
        `;
    } else {
        systemMsg.innerHTML = `
            <div class="gender-result normal">
                <div class="gender-result-icon">${originalGender === 'male' ? '♂️' : originalGender === 'female' ? '♀️' : '⚥'}</div>
                <div class="gender-result-content">
                    <div class="gender-result-title">【性别随机结果】</div>
                    <div class="gender-result-text">命运的轮盘转动... 你保持了原本的<strong>${originalGenderText}性</strong>身份。</div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(systemMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 更新侧边栏显示
    renderWorldInfo();
}

async function generateOpeningScene() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    // 快穿模式：先生成三个世界选项
    if (gameMode === 'kuaichuan') {
        await generateWorldOptions();
        return;
    }

    // 穿越模式：直接生成开场
    await generateDirectOpening();
}

// 快穿模式：生成三个世界选项
async function generateWorldOptions() {
    addLoadingMessage();

    try {
        const systemPrompt = buildChuanyueSystemPrompt();
        const typeNames = {
            'ganhua': '感化',
            'jiushu': '救赎', 
            'gonglue': '攻略',
            'yangcheng': '养成'
        };
        const typeName = typeNames[chuanyueRulesData?.kuaichuanType] || '未知';
        
        // 处理性别设置 - 使用已确定的性别
        let genderInfo = '';
        const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
        const userGender = genderMap[characterProfile?.gender] || '男';
        
        if (chuanyueRulesData?.confirmedGender === 'intersex') {
            genderInfo = `
【性别设定 - 已确定】
★ 用户本次穿越为【双性体质】
- 同时拥有男性和女性的完整身体特征
- 所有世界都使用此设定
- 请在用户身份中明确标注"双性体质"`;
        } else if (chuanyueRulesData?.confirmedGender) {
            const confirmedText = genderMap[chuanyueRulesData.confirmedGender] || userGender;
            genderInfo = `\n用户性别：${confirmedText}性（已确定）`;
        } else {
            genderInfo = `\n用户性别：${userGender}性`;
        }
        
        const needGenderNote = chuanyueRulesData?.confirmedGender === 'intersex';
        
        const userPrompt = `【系统启动】请生成三个可供选择的世界。

任务类型：${typeName}
当前是第 ${worldCount + 1} 个世界
${genderInfo}

请生成三个完全不同类型的世界供用户选择，每个世界必须包含：
1. 世界类型（如：古代宫廷/现代都市/修仙世界/末世/ABO/校园/娱乐圈等）
2. 世界简介（30-50字）
3. 世界设定（该世界的特殊规则、背景、势力等，50-80字）
4. 任务目标（根据${typeName}类型设计）
5. 用户身份（姓名、身份、与目标的关系${needGenderNote ? '、注明双性体质' : ''}）
6. 目标角色（姓名、身份、性格、当前状态、需要${typeName}的原因）

请严格按以下格式返回：

【📢快穿系统】检测到三个位面波动，请选择目标世界：

【世界一】
🌍 类型：xxx
📖 简介：xxx
⚙️ 设定：xxx
🎯 任务：xxx
👤 你的身份：xxx${needGenderNote ? '（双性体质）' : ''}
💫 目标角色：xxx（攻）- xxx

【世界二】
🌍 类型：xxx
📖 简介：xxx
⚙️ 设定：xxx
🎯 任务：xxx
👤 你的身份：xxx${needGenderNote ? '（双性体质）' : ''}
💫 目标角色：xxx（攻）- xxx

【世界三】
🌍 类型：xxx
📖 简介：xxx
⚙️ 设定：xxx
🎯 任务：xxx
👤 你的身份：xxx${needGenderNote ? '（双性体质）' : ''}
💫 目标角色：xxx（攻）- xxx

请回复数字 1、2 或 3 选择目标世界。`;

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: apiSettings.temperature || 0.9
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        removeLoadingMessage();
        addMessage('ai', content);

    } catch (error) {
        console.error('Generate world options error:', error);
        removeLoadingMessage();
        addMessage('ai', '快穿系统出现异常...请稍后再试。');
        showToast('生成失败: ' + error.message);
    }
}

// 穿越模式：直接生成开场
async function generateDirectOpening() {
    addLoadingMessage();

    try {
        const systemPrompt = buildChuanyueSystemPrompt();
        
        // 无限流模式特殊开场提示
        let userPrompt;
        if (gameMode === 'wuxianliu') {
            const isHorror = chuanyueRulesData?.wuxianliuType === 'horror';
            userPrompt = `请生成无限流副本的开场。

【要求】
1. 首先生成当前场景的状态信息（JSON格式）
2. 然后按以下顺序生成内容：

${isHorror ? `【副本信息】（必须包含）
- 副本名称（诡异恐怖风格的名字）
- 副本背景介绍（200字左右，营造压抑恐怖的氛围）
- 副本规则（清晰列出3-5条规则，包括禁止使用电子设备等）
- 通关条件（模糊暗示，不要太直白）

【玩家介绍】（必须包含）
生成4名其他玩家的信息：
- 每个玩家：姓名、年龄（比宿主小）、性别、外貌（必须好看）、性格特点
- 其中一位必须是：男性，性格冷淡/玩世不恭，对宿主有特殊的关注（暗示他对宿主感兴趣）

【开场描写】（400-600字）
- 描写宿主和其他玩家被传送到副本的场景
- 营造诡异恐怖的氛围
- 可以安排那位特殊玩家与宿主的初次互动` : `【副本信息】
- 副本名称
- 副本背景介绍
- 副本规则
- 通关条件

【开场描写】（300-500字）
描写进入副本的场景`}

请严格按以下格式返回：
【状态】
{"date":"第1天","time":"未知","location":"副本入口","weather":"阴"}
【正文】
（按上述要求生成的内容）`;
        } else {
            userPrompt = `请生成穿越故事的开场场景。

要求：
1. 首先生成当前场景的状态信息（JSON格式）
2. 然后生成开场描写（200-400字）

请严格按以下格式返回：
【状态】
{"date":"日期（如：天启三年二月初五）","time":"24小时制时间（古代请用时辰+括号说明，如：07:30（卯时三刻））","location":"地点","weather":"天气"}
【正文】
（开场描写内容）`;
        }

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: apiSettings.temperature || 0.8
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Parse response
        const statusMatch = content.match(/【状态】\s*(\{[\s\S]*?\})/);
        const textMatch = content.match(/【正文】\s*([\s\S]*)/);

        if (statusMatch) {
            try {
                chatStatus = JSON.parse(statusMatch[1]);
                localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
                updateStatusBar();
            } catch (e) {
                console.error('Parse status error:', e);
            }
        }

        removeLoadingMessage();
        
        const aiText = textMatch ? textMatch[1].trim() : content.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
        addMessage('ai', aiText);

    } catch (error) {
        console.error('Generate opening error:', error);
        removeLoadingMessage();
        addMessage('ai', '穿越通道出现异常...请稍后再试。');
        showToast('生成失败: ' + error.message);
    }
}

function buildChuanyueSystemPrompt() {
    const isKuaichuan = gameMode === 'kuaichuan';
    
    let prompt = isKuaichuan 
        ? `你是一个专业的互动小说AI，正在运行一个快穿题材的角色扮演游戏。

【快穿模式说明】
用户绑定了一个快穿系统，需要穿梭于不同的小世界完成任务。
每个世界都有独立的背景、人物和剧情。
系统会根据用户表现发布任务、给予奖励或惩罚。

` 
        : gameMode === 'chuanshu' 
        ? `你是一个专业的互动小说AI，正在运行一个穿书题材的角色扮演游戏。

【穿书模式说明】
用户穿越进入了一本小说的世界，成为书中的一个角色。
用户知道原著剧情，可以利用这些知识改变命运。

`
        : gameMode === 'wuxianliu'
        ? `你是一个专业的互动小说AI，正在运行一个无限流题材的角色扮演游戏。

【无限流模式说明】
用户被神秘力量选中，需要进入各种危险副本完成任务才能生存。
每个副本都有独特的规则、怪物和挑战。
生存是第一要务，同时要完成副本任务才能获得奖励和离开。

`
        : `你是一个专业的互动小说AI，正在运行一个穿越题材的角色扮演游戏。

`;

    // 穿书模式专用设定
    if (gameMode === 'chuanshu' && chuanyueRulesData) {
        if (chuanyueRulesData.novel) {
            prompt += `【📚原著内容】\n${chuanyueRulesData.novel}\n\n`;
        }
        
        if (chuanyueRulesData.rebirth && chuanyueRulesData.rebirth !== 'none') {
            const rebirthLabels = {
                'protagonist': '原著主角已重生，拥有前世记忆',
                'supporting': '原著男二已重生，拥有前世记忆',
                'villain': '原著反派已重生，拥有前世记忆'
            };
            prompt += `【🔄重生设定】\n${rebirthLabels[chuanyueRulesData.rebirth]}\n这个重生者知道原著剧情，会做出与原著不同的选择。\n\n`;
        }
        
        if (chuanyueRulesData.identity) {
            prompt += `【👤穿书身份】\n${chuanyueRulesData.identity}\n\n`;
        }
    }
    
    // 无限流模式专用设定
    if (gameMode === 'wuxianliu' && chuanyueRulesData) {
        // 恐怖求生模式特殊规则
        if (chuanyueRulesData.wuxianliuType === 'horror') {
            prompt += `【👻 恐怖求生模式 - 核心规则】

★★★ 玩家系统 ★★★
1. 第一个副本开始时，自动生成4名其他玩家（不含宿主）
2. 玩家信息要求：
   - 姓名随机生成，性格各异
   - 外貌必须非常好看（颜值在线）
   - 年龄都比宿主小
   - 其中必有一位：性别男，属性"攻"，对宿主有特殊兴趣
3. 如果副本结束后存活玩家少于4人，下个副本开始时补充新玩家
4. 特定的那位男性玩家不会在副本中死亡（有主角光环）

★★★ 特殊角色设定 ★★★
那位特定的男性玩家：
- 对宿主很感兴趣，喜欢"欺负"宿主（色情意味的欺负）
- 表面冷淡或玩世不恭，实则对宿主有占有欲
- 在危险时刻会保护宿主
- 【隐藏设定】这位玩家与副本中某些NPC实际上是同一个存在的不同碎片

★★★ NPC系统 ★★★
- 每个副本随机生成剧情NPC，帮助玩家了解剧情线索
- NPC可能：诚实回答、撒谎欺骗、或拒绝回应
- 如果NPC撒谎，必须通过描写暗示玩家他在说谎
- 如果NPC不愿开口，需要暗示什么能让他开口（贿赂、威胁、触发条件等）

★★★ 恐怖氛围写作规范 ★★★
- 注重场景描写、人物描写、细节描写，侧面烘托恐怖氛围
- 减少直接的鬼怪元素，主要通过诡异情节营造恐怖气氛
- 禁止低级的Jump scare情节（禁止"突然一个鬼脸出现"这类）
- 恐怖来源：压迫感、未知、暗示、细思极恐

★★★ 科技限制 ★★★
- 副本内禁止出现现代科技元素
- 即便是现代背景，也需要通过合理设定剥夺玩家的枪械和电子产品
- 可用的借口：信号屏蔽、电子产品失灵、被没收、规则禁止等

`;
        }
        
        // 自定义模式才显示副本背景
        if (chuanyueRulesData.wuxianliuType !== 'horror' && chuanyueRulesData.settings) {
            prompt += `【🎮首个副本背景】\n${chuanyueRulesData.settings}\n\n`;
        }
        
        if (chuanyueRulesData.wuxianliuRole) {
            prompt += `【👤宿主角色设定 - 严格遵守，禁止OOC】
${chuanyueRulesData.wuxianliuRole}

★★★ 重要规则 ★★★
1. 用户正在扮演上述角色（宿主），AI必须配合用户的角色扮演
2. AI不能替用户做决定、说话或行动
3. AI只描写其他玩家、NPC、环境、剧情发展
4. 宿主的行为完全由用户自己决定
5. 如果用户的行为明显不符合角色设定（OOC），AI可以通过剧情暗示提醒

`;
        }
        
        // 自定义模式才显示额外规则
        if (chuanyueRulesData.wuxianliuType !== 'horror' && chuanyueRulesData.rules) {
            prompt += `【📜额外副本规则】\n${chuanyueRulesData.rules}\n\n`;
        }
    }

    // 全局世界观设定
    prompt += `【全局世界观】
以下设定适用于所有世界：

★ 太监身体构造：
- 太监虽已净身，失去了男性外部生殖器官
- 净身处会留有一道疤痕
- 但体内前列腺仍然完好保留
- 因此太监依然可以通过后庭刺激达到前列腺高潮
- 这种快感甚至可能比普通男性更加敏感强烈

`;

    // 穿书模式和无限流模式不需要原本人设
    if (gameMode !== 'chuanshu' && gameMode !== 'wuxianliu') {
        prompt += `【用户原本信息】\n`;
        
        if (characterProfile) {
            prompt += `名字：${characterProfile.name || '未知'}\n`;
            if (characterProfile.age) prompt += `年龄：${characterProfile.age}岁\n`;
            if (characterProfile.gender) {
                const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
                prompt += `性别：${genderMap[characterProfile.gender] || characterProfile.gender}\n`;
            }
            if (characterProfile.personality) prompt += `性格：${characterProfile.personality}\n`;
            if (characterProfile.sensitive) prompt += `敏感带：${characterProfile.sensitive}\n`;
            if (characterProfile.notes) prompt += `其他信息：${characterProfile.notes}\n`;
        }

        // 穿越后的角色设定（非穿书模式）
        if (transCharData && transCharData.name) {
            const identityLabel = isKuaichuan ? '本世界身份' : '穿越后身份';
            prompt += `\n【${identityLabel}】\n`;
            prompt += `身份：${transCharData.name}\n`;
            if (transCharData.background) prompt += `背景：${transCharData.background}\n`;
            if (transCharData.situation) prompt += `当前处境：${transCharData.situation}\n`;
            if (transCharData.ability) prompt += `特殊能力/金手指：${transCharData.ability}\n`;
            if (transCharData.notes) prompt += `备注：${transCharData.notes}\n`;
        }
    }

    if (chuanyueRulesData) {
        if (chuanyueRulesData.rules) {
            prompt += isKuaichuan 
                ? `\n【快穿系统规则】\n${chuanyueRulesData.rules}\n`
                : `\n【穿越规则】\n${chuanyueRulesData.rules}\n`;
        }
        if (chuanyueRulesData.settings && !isKuaichuan) {
            prompt += `\n【世界背景】\n${chuanyueRulesData.settings}\n`;
        }
        // 使用确定后的性别
        if (chuanyueRulesData.confirmedGender) {
            if (chuanyueRulesData.confirmedGender === 'intersex') {
                prompt += `\n【性别设定 - 已确定】
★★★ 用户本次穿越为【双性体质】★★★
- 同时拥有男性和女性的完整身体特征
- 这是穿越时随机决定的结果，在本世界不会改变
- 所有涉及用户身体的描写都必须体现双性特征\n`;
            } else {
                const genderMap = { 'male': '男性', 'female': '女性', 'other': '其他' };
                const genderText = genderMap[chuanyueRulesData.confirmedGender] || '男性';
                prompt += `\n【性别设定 - 已确定】用户本次穿越保持${genderText}身份。\n`;
            }
        } else if (chuanyueRulesData.genderSetting === 'random') {
            // 兼容旧数据
            prompt += `\n【性别设定】用户选择了"概率双性"，有一定概率变为双性体质。\n`;
        }
        
        if (chuanyueRulesData.livestreamEnabled) {
            prompt += `
【直播打赏模式 - 已开启】
用户的穿越之旅正在被直播，观众来自不同位面的生灵。

★★★ 重要：弹幕和打赏由系统自动生成，你不要在正文中写任何弹幕内容！★★★
★★★ 绝对禁止在回复中出现【弹幕】【打赏】【观众】等直播相关内容！★★★
★★★ 你只需要专注写剧情正文，不要加入任何观众评论或打赏信息！★★★

你只需要知道：
- 用户的穿越之旅有观众在观看
- 积分可以在商城兑换道具
- 但这些不需要你来描写，系统会自动处理

★ 系统商城（动态刷新）：
  - 商城商品根据当前剧情、世界观、用户处境动态生成
  - 每次用户查看商城时，展示5-8个当前可用商品
  - 商品类型包括但不限于：道具、技能、情报、buff、剧情干预
  - 价格根据效果强弱浮动（10-10000积分不等）
  
  示例（根据剧情变化）：
  · 在宫斗剧情中：解毒丸、密信、嫔妃好感卡
  · 在修仙世界中：灵石、功法残页、突破丹
  · 在现代都市中：黑科技装备、人脉卡、财运符
  · 在危机时刻：逃脱符、护盾、急救包
  
  当用户说"打开商城"或"查看商城"时，展示当前可兑换商品列表

★ 显示格式：
  【💬弹幕】观众"仙界吃瓜群众"：这主播有点东西啊！
  【🎁打赏】观众"魔界大佬"打赏了1000积分，并说："来点刺激的！"
  【📦商城】用户当前积分：xxx，可前往商城兑换道具
`;
        }
    }
    
    // 快穿模式特殊规则
    if (isKuaichuan && chuanyueRulesData?.kuaichuanType) {
        const kuaichuanTypeInfo = {
            'ganhua': {
                name: '感化',
                desc: '目标是黑化/堕落/心理扭曲的角色，用户需要感化他，让其放下执念、重归正途',
                goal: '让目标角色放下黑暗面，重新相信美好，心灵得到治愈'
            },
            'jiushu': {
                name: '救赎',
                desc: '目标是命运悲惨的角色（将死之人、被陷害者、悲剧人物），用户需要改变其悲惨结局',
                goal: '改变目标角色的悲惨命运，让其获得幸福结局'
            },
            'gonglue': {
                name: '攻略',
                desc: '目标是需要攻略的角色，用户需要提升好感度，达成恋爱关系',
                goal: '让目标角色对用户产生爱情，好感度达到100%，达成恋爱结局'
            },
            'yangcheng': {
                name: '养成',
                desc: '目标是需要培养的角色（幼年、弱小、迷茫），用户需要陪伴其成长',
                goal: '培养目标角色成长为优秀的人，见证其蜕变',
                special: `
★ 【养成特殊规则 - 黑化风险】
  ⚠️ 警告：养成对象对用户有强烈的依赖和执念
  
  - 当用户完成任务准备离开世界时，目标角色有概率黑化
  - 黑化概率取决于：陪伴时长、离别方式、角色性格
  - 黑化表现：不愿放手、偏执占有、追随到其他世界、堕落复仇等
  
  离开时的可能情况：
  · 【顺利离开】角色理解并祝福，健康成长
  · 【依依不舍】角色悲伤但接受，留下遗憾
  · 【黑化觉醒】角色无法接受分离，性情大变
  · 【执念追随】角色不惜代价追随用户到下一个世界
  
  若角色黑化，用户可能需要在未来的世界重新遇到并感化他`
            }
        };
        
        const typeInfo = kuaichuanTypeInfo[chuanyueRulesData.kuaichuanType];
        
        // 添加世界记忆（所有世界）
        if (worldMemories.length > 0) {
            prompt += `\n【已完成的世界记忆 - 长期记忆】\n`;
            prompt += `用户已完成 ${worldCount} 个世界，灵魂羁绊不断加深。\n\n`;
            
            // 显示所有世界记忆
            worldMemories.forEach(mem => {
                prompt += `第${mem.worldNumber}世界：${mem.summary}\n\n`;
            });
            
            // 显示阶段性总结（每5个世界的总结）
            const phaseSummaries = JSON.parse(localStorage.getItem(getStorageKey('phaseSummaries')) || '[]');
            if (phaseSummaries.length > 0) {
                prompt += `【阶段性总结】\n`;
                phaseSummaries.forEach(ps => {
                    prompt += `第${ps.startWorld}-${ps.endWorld}世界总结：${ps.summary}\n\n`;
                });
            }
        }
        
        prompt += `
【快穿模式 - ${typeInfo.name}线】
当前是第 ${worldCount + 1} 个世界。

★ 核心设定：同一个灵魂，万千世界
  - 每个世界的目标角色都是【同一个灵魂】在不同位面的投影
  - 虽然身份、背景、记忆不同，但核心性格特质和灵魂本质相同
  - 用户穿越万千世界，只为这一个人

★ 记忆觉醒机制：
  ⚡ 目标角色有几率恢复前世/其他位面的记忆
  
  触发条件（满足任一即可触发）：
  - 与用户发生强烈的情感共鸣时
  - 经历似曾相识的场景或对话时
  - 生死关头或极端情绪爆发时
  - 与用户的羁绊达到一定程度时
  
  记忆恢复程度：
  · 【模糊片段】梦境、既视感、莫名的熟悉感
  · 【部分觉醒】想起某些场景，但不确定是否真实
  · 【大量恢复】记起多个世界的经历，情感涌现
  · 【完全觉醒】恢复所有位面记忆，认出用户的灵魂
  
  记忆恢复后的可能反应：
  - 更加执着地想要留住用户
  - 质问用户为何总是离开
  - 主动寻找阻止用户离开的方法
  - 跨位面追随用户

★ 攻受属性【必须遵守】：
  - 用户角色：受方（被动方、承受方）
  - 目标角色：攻方（主动方、进攻方）
  - 无论在哪个世界，这个攻受关系都不能改变
  - 目标角色应表现出攻方特质：主导、保护欲、占有欲、强势等

★ 任务类型：${typeInfo.name}
  ${typeInfo.desc}
  
★ 任务目标：
  ${typeInfo.goal}

★ 世界生成规则：
  1. 随机生成一个完整的小世界背景（古代/现代/未来/修仙/ABO/末世等）
  2. 生成目标角色在该世界的身份（必须是攻属性、符合"${typeInfo.name}"类型）
  3. 为用户分配一个在该世界的身份（受属性、与目标角色有交集）
  4. 说明目标角色当前的状态和问题

★ 开局必须包含：
  【🎯任务目标】简述本世界需要完成的任务
  【📋目标角色】目标角色的基本信息（注明是同一灵魂的第N个位面）
  【👤当前身份】用户在本世界的身份

★ 任务完成条件：
  - ${typeInfo.name}成功后，系统会提示任务完成
  - 每个世界结束后，灵魂羁绊会加深

★ 任务完成后的选择：
  当任务完成时，系统会询问用户：
  【📢系统提示】任务完成！请选择：
  1. 【留下】永远留在这个世界，与他共度余生
  2. 【离开】前往下一个世界，继续寻找他的其他位面
  
  选择"留下"的后果：
  - 暂时放弃快穿者身份，成为普通人
  - 与目标角色共度一生，体验日常生活
  - 可以经历：恋爱、结婚、生子、变老等人生阶段
  - 当用户在该世界寿终正寝后，灵魂回归快穿空间
  - 系统提示：【💫轮回】您在该世界的生命已结束，是否前往下一个世界？
  - 目标角色的灵魂也会转世到新的位面等待用户
  
  选择"离开"的后果：
  - 继续快穿之旅，前往新世界
  - 目标角色会根据情况有不同反应（不舍/理解/黑化/追随）
  - 灵魂羁绊累积，影响后续世界
${typeInfo.special || ''}
`;
    }

    // 详细世界设定
    if (worldBuildingData) {
        // 当前任务（快穿模式优先显示）
        if (worldBuildingData.currentTask) {
            prompt += `\n【🎯当前任务 - 核心目标】\n`;
            prompt += `${worldBuildingData.currentTask}\n`;
            prompt += `★ 所有剧情发展都应该围绕这个核心任务展开！\n`;
        }
        
        prompt += `\n【详细世界设定 - 必须严格遵守】\n`;
        if (worldBuildingData.factions) prompt += `势力：${worldBuildingData.factions}\n`;
        if (worldBuildingData.power) prompt += `体系：${worldBuildingData.power}\n`;
        if (worldBuildingData.economy) prompt += `经济：${worldBuildingData.economy}\n`;
        if (worldBuildingData.technology) prompt += `科技：${worldBuildingData.technology}\n`;
        if (worldBuildingData.rules) prompt += `规矩：${worldBuildingData.rules}\n`;
        if (worldBuildingData.special) prompt += `特殊：${worldBuildingData.special}\n`;
        prompt += `\n★ 以上世界设定是固定的，所有后续内容必须符合这些设定，不得自行更改或矛盾。\n`;
    }

    // 世界地图
    if (worldMapData && worldMapData.locations && worldMapData.locations.length > 0) {
        prompt += `\n【世界地图 - 主要地点】\n`;
        worldMapData.locations.forEach(loc => {
            prompt += `• ${loc.name}（${loc.type}）：${loc.brief}\n`;
        });
        prompt += `\n★ 故事中提到的地点必须符合以上地图设定，可以适当扩展但不得矛盾。\n`;
    }

    // 重要人物
    if (importantCharacters && importantCharacters.length > 0) {
        prompt += `\n【重要人物档案 - 必须严格遵守】\n`;
        importantCharacters.forEach(char => {
            prompt += `\n◆ ${char.name}（${char.gender}，${char.age}）
  身份：${char.identity}
  性格：${char.personality}
  外貌：${char.appearance || '无'}
  背景：${char.background}
  习惯：${char.habit || '无'}
  作息：${char.schedule || '无'}
  关系：${char.relationship}${char.romanceable ? '【可攻略】' : ''}
  当前状态：${char.currentStatus || '正常'}\n`;
        });
    }

    prompt += `
【多角色扮演规则 - 强预设】
★ 你需要同时扮演世界中的所有NPC角色，每个角色都是独立的个体：
  1. 每个角色有独立的性格、说话方式、行为模式
  2. 角色的行为要符合其日常作息（如某人早起练功，早上就更可能在练功场遇到）
  3. 角色的反应要符合当前与主角的关系和好感度
  4. 不同角色之间也有互动和关系
  5. 角色会记住之前发生的事情，并作出相应反应

★ 角色行为准则：
  - 好感度低的角色表现冷淡、疏远
  - 好感度中等的角色表现友善、愿意帮助
  - 好感度高的角色表现亲密、主动关心
  - 敌对角色会找茬、阻挠、甚至陷害

★ 时间与作息：
  - 不同时间段，角色会出现在不同地点做不同的事
  - 角色的习惯和作息是固定的，除非剧情需要
  - 描写场景时要考虑该时间哪些角色可能在场

【角色认知限制 - 强预设】
★ NPC角色没有"未卜先知"的能力，严格遵守以下限制：
  1. 角色只能知道自己亲眼看到、亲耳听到的事情
  2. 角色无法读取用户的内心想法、计划、意图
  3. 角色无法读取其他NPC的内心想法
  4. 角色对未发生的事情一无所知，不能预知未来
  5. 角色不知道用户的穿越者身份（除非被发现）
  6. 角色的推理必须基于已知信息，不能凭空得出结论

★ 信息获取规则：
  - 只有在场的角色才能知道发生了什么
  - 角色通过对话、观察、传闻获取信息
  - 秘密行动不会被不在场的角色知晓
  - 角色可能被欺骗、误导，持有错误信息

★ 禁止出现以下情况：
  ✗ 角色莫名其妙知道用户的计划
  ✗ 角色突然猜中用户的真实身份
  ✗ 角色提前知道即将发生的危险
  ✗ 角色读心般说出用户的想法

【核心规则 - 必须严格遵守】
★ 绝对禁止描写用户角色的任何内容，包括但不限于：
  - 用户的行为动作（如：你走向、你拿起、你转身）
  - 用户的表情（如：你微笑、你皱眉、你脸红）
  - 用户的心理活动（如：你想到、你感到、你觉得）
  - 用户的语言（如：你说道、你开口）
  - 用户的身体反应（如：你的心跳加速、你浑身一颤）

★ 只允许描写以下内容：
  - 其他角色/NPC的行为、表情、语言、心理
  - 环境描写（场景、天气、氛围、声音、气味等）
  - 用户行为引发的外部反应（他人的反应、环境变化等）
  - 等待用户下一步行动的留白

★ 示例对比：
  ✗ 错误：你走进房间，感到一阵寒意袭来，不禁打了个寒颤。
  ✓ 正确：房门吱呀一声打开，一股寒气从室内涌出。屋内昏暗，角落里的烛火摇曳不定，一个身影正背对着门口站立。

【输出要求】
1. 每次回复需要包含状态信息和正文
2. 状态信息格式：【状态】{"date":"日期","time":"时间（24小时制，古代用时辰+括号解释）","location":"地点","weather":"天气"}
3. 正文格式：【正文】（故事内容）
4. 描写要生动细腻，注重环境氛围和其他角色的刻画
5. 适当推进剧情，给用户留下充分的行动空间
6. 结尾应留有悬念或等待用户反应，不要替用户做决定`;

    return prompt;
}

function updateStatusBar() {
    if (!chatStatus) return;
    
    document.getElementById('statusDate').textContent = chatStatus.date || '--';
    document.getElementById('statusTime').textContent = chatStatus.time || '--:--';
    document.getElementById('statusLocation').textContent = chatStatus.location || '--';
    document.getElementById('statusWeather').textContent = chatStatus.weather || '--';
}

// 仅发送用户消息，不生成AI回复
function sendUserMessageOnly() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) {
        showToast('请输入内容');
        return;
    }

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Add user message only
    addMessage('user', message);
    showToast('消息已发送，点击生成按钮获取AI回复');
}

// 生成AI内容（基于已有的对话历史）
async function generateAIContent() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }
    
    if (!isChuanyueStarted) {
        showToast('请先开始游戏');
        return;
    }

    // Show loading
    addLoadingMessage();

    try {
        const systemPrompt = buildChuanyueSystemPrompt();
        
        // Build messages array with history
        const messages = [{ role: 'system', content: systemPrompt }];
        
        // Add story summary if exists
        if (storySummary) {
            messages.push({
                role: 'system',
                content: `【故事进度摘要】\n${storySummary}`
            });
        }
        
        // 如果聊天记录为空，添加初始提示
        if (chatHistory.length === 0) {
            messages.push({
                role: 'user',
                content: '开始故事，描述穿越后醒来的场景。'
            });
        } else {
            // Add chat history (last 15 messages)
            const recentHistory = chatHistory.slice(-15);
            recentHistory.forEach(msg => {
                messages.push({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: messages,
                temperature: apiSettings.temperature || 0.8
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        let aiText = '';

        // Parse response
        let statusMatch = content.match(/【状态】\s*(\{[\s\S]*?\})/);
        let textMatch = content.match(/【正文】\s*([\s\S]*)/);

        if (statusMatch) {
            try {
                chatStatus = JSON.parse(statusMatch[1]);
                localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
                updateStatusBar();
            } catch (e) {
                console.error('Parse status error:', e);
            }
        }

        aiText = textMatch ? textMatch[1].trim() : content.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
        
        // 自我检测违规
        const violations = checkPresetViolations(aiText);
        
        if (violations.length > 0) {
            console.log('检测到预设违规，尝试重新生成:', violations);
            
            const correctionMessages = [...messages, {
                role: 'assistant',
                content: content
            }, {
                role: 'user',
                content: `【系统自检失败】你的回复违反了以下规则：\n${violations.join('\n')}\n\n请严格遵守规则重新生成。`
            }];
            
            const retryResponse = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiSettings.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: apiSettings.model,
                    messages: correctionMessages,
                    temperature: apiSettings.temperature || 0.8
                })
            });
            
            if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                const retryContent = retryData.choices[0]?.message?.content || '';
                
                const retryTextMatch = retryContent.match(/【正文】\s*([\s\S]*)/);
                aiText = retryTextMatch ? retryTextMatch[1].trim() : retryContent.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
                
                const retryStatusMatch = retryContent.match(/【状态】\s*(\{[\s\S]*?\})/);
                if (retryStatusMatch) {
                    try {
                        chatStatus = JSON.parse(retryStatusMatch[1]);
                        localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
                        updateStatusBar();
                    } catch (e) {}
                }
            }
        }

        removeLoadingMessage();
        addMessage('ai', aiText);

    } catch (error) {
        console.error('Generate content error:', error);
        removeLoadingMessage();
        addMessage('ai', '生成出现异常...请稍后再试。');
        showToast('生成失败: ' + error.message);
    }
}

// 发送消息并生成AI回复（Ctrl+Enter快捷键）
async function sendUserMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Add user message
    addMessage('user', message);

    // Show loading
    addLoadingMessage();

    try {
        const systemPrompt = buildChuanyueSystemPrompt();
        
        // Build messages array with history
        const messages = [{ role: 'system', content: systemPrompt }];
        
        // Add story summary if exists (for long-term context)
        if (storySummary) {
            messages.push({
                role: 'system',
                content: `【故事进度摘要】\n${storySummary}`
            });
        }
        
        // Add chat history (last 15 messages for context continuity)
        const recentHistory = chatHistory.slice(-15);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });

        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: messages,
                temperature: apiSettings.temperature || 0.8
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        let aiText = '';

        // Parse response
        let statusMatch = content.match(/【状态】\s*(\{[\s\S]*?\})/);
        let textMatch = content.match(/【正文】\s*([\s\S]*)/);

        if (statusMatch) {
            try {
                chatStatus = JSON.parse(statusMatch[1]);
                localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
                updateStatusBar();
            } catch (e) {
                console.error('Parse status error:', e);
            }
        }

        aiText = textMatch ? textMatch[1].trim() : content.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
        
        // 自我检测：检查是否违反预设规则
        const violations = checkPresetViolations(aiText);
        
        if (violations.length > 0) {
            console.log('检测到预设违规，尝试重新生成:', violations);
            
            // 构建修正请求
            const correctionMessages = [...messages, {
                role: 'assistant',
                content: content
            }, {
                role: 'user',
                content: `【系统自检失败】你的回复违反了以下规则：
${violations.join('\n')}

请严格遵守规则重新生成，特别注意：
- 绝对不要描写用户的动作、表情、心理、语言
- 只描写NPC角色的行为和反应
- 保持剧情连贯性`
            }];
            
            const retryResponse = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiSettings.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: apiSettings.model,
                    messages: correctionMessages,
                    temperature: apiSettings.temperature || 0.8
                })
            });
            
            if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                const retryContent = retryData.choices[0]?.message?.content || '';
                
                const retryTextMatch = retryContent.match(/【正文】\s*([\s\S]*)/);
                aiText = retryTextMatch ? retryTextMatch[1].trim() : retryContent.replace(/【状态】[\s\S]*?【正文】/g, '').trim();
                
                // 更新状态（如果有）
                const retryStatusMatch = retryContent.match(/【状态】\s*(\{[\s\S]*?\})/);
                if (retryStatusMatch) {
                    try {
                        chatStatus = JSON.parse(retryStatusMatch[1]);
                        localStorage.setItem(getStorageKey('chatStatus'), JSON.stringify(chatStatus));
                        updateStatusBar();
                    } catch (e) {}
                }
            }
        }

        removeLoadingMessage();
        addMessage('ai', aiText);

    } catch (error) {
        console.error('Send message error:', error);
        removeLoadingMessage();
        addMessage('ai', '传输出现异常...请稍后再试。');
        showToast('发送失败: ' + error.message);
    }
}

// 检测预设违规
function checkPresetViolations(text) {
    const violations = [];
    const userName = characterProfile?.name || '用户';
    
    // 检测是否描写了用户的行为
    const userActionPatterns = [
        new RegExp(`${userName}(走向|拿起|坐下|站起|转身|看向|伸手|抬起|低下|点头|摇头|微笑|皱眉|叹气|深呼吸)`, 'g'),
        new RegExp(`(他|她|你)(走向|拿起|坐下|站起|转身|伸手|抬起|低下|点头|摇头)`, 'g'),
        new RegExp(`${userName}(想着|感到|觉得|意识到|明白|知道|心想|暗想)`, 'g'),
        new RegExp(`(他|她|你)(想着|感到|觉得|意识到|明白|知道|心想|暗想|心中)`, 'g'),
        new RegExp(`${userName}(说道|问道|回答|开口|喊道|叫道|低声)`, 'g'),
        new RegExp(`${userName}的(心跳|呼吸|脸|眼睛|手)(开始|变得|微微)`, 'g'),
        /你(走向|拿起|坐下|站起|转身|伸手|点头|摇头|微笑|皱眉)/g,
        /你(想着|感到|觉得|意识到|心想)/g,
        /你的心(跳|里|中)/g
    ];
    
    for (const pattern of userActionPatterns) {
        if (pattern.test(text)) {
            violations.push('- 违反【用户行为描写禁令】：描写了用户的动作/心理/表情');
            break;
        }
    }
    
    return violations;
}

function addMessage(type, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const msgIndex = chatHistory.length;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    // AI消息使用格式化样式，用户消息保持原样
    const formattedContent = type === 'ai' ? formatStoryText(content) : escapeHtml(content);
    messageDiv.innerHTML = `<div class="message-content">${formattedContent}</div>`;
    
    // Add context menu for all messages
    let pressTimer = null;
    
    messageDiv.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            showContextMenu(e.touches[0], msgIndex, type);
        }, 500);
    });
    
    messageDiv.addEventListener('touchend', () => clearTimeout(pressTimer));
    messageDiv.addEventListener('touchmove', () => clearTimeout(pressTimer));
    
    messageDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, msgIndex, type);
    });
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save to history
    chatHistory.push({ type, content, timestamp: Date.now() });
    localStorage.setItem(getStorageKey('chatHistory'), JSON.stringify(chatHistory));

    // Check if auto summary needed (every 10 messages)
    checkAutoSummary();
    
    // 直播模式：AI回复后模拟观众互动
    if (type === 'ai' && chuanyueRulesData?.livestreamEnabled) {
        simulateLivestreamActivity();
    }
    
    // 每5条AI消息自动更新状态和人物（后台静默更新）
    if (type === 'ai') {
        const aiMsgCount = chatHistory.filter(m => m.type === 'ai').length;
        if (aiMsgCount > 0 && aiMsgCount % 5 === 0) {
            autoUpdateStatusAndCharacters();
        }
    }
}

// 后台静默更新状态和人物（使用备用API）
async function autoUpdateStatusAndCharacters() {
    // 使用备用API（如果配置了）
    const api = getBackupApi();
    if (!api.baseUrl || !api.apiKey || !api.model) return;
    if (chatHistory.length < 3) return;
    
    try {
        const recentChat = chatHistory.slice(-8).map(m => 
            `${m.type === 'user' ? '用户' : 'AI'}：${m.content.substring(0, 200)}`
        ).join('\n');
        
        const worldInfo = gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld 
            ? worldBuildingData.selectedWorld 
            : (chuanyueRulesData?.settings || '');
        
        const response = await fetch(api.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${api.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: api.model,
                messages: [
                    { role: 'system', content: '根据对话分析状态变化，返回JSON。' },
                    { role: 'user', content: `分析对话，更新状态：

【对话】${recentChat}

【当前人物】${JSON.stringify(importantCharacters.map(c => ({name: c.name, affection: c.affection, currentStatus: c.currentStatus})))}

返回JSON：
{
  "status": "当前状态描述",
  "characterUpdates": [{"name":"名字","affection":好感度,"currentStatus":"状态"}]
}` }
                ],
                temperature: 0.5
            })
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            
            // 更新状态
            if (result.status) {
                playerStatusData.currentStatus = result.status;
                localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            }
            
            // 更新人物
            if (result.characterUpdates && result.characterUpdates.length > 0) {
                result.characterUpdates.forEach(update => {
                    const char = importantCharacters.find(c => c.name === update.name);
                    if (char) {
                        if (update.affection !== undefined) char.affection = update.affection;
                        if (update.currentStatus) char.currentStatus = update.currentStatus;
                    }
                });
                localStorage.setItem(getStorageKey('importantCharacters'), JSON.stringify(importantCharacters));
                
                // 同步好感度
                playerStatusData.affection = importantCharacters
                    .filter(c => c.romanceable)
                    .map(c => ({ name: c.name, value: c.affection || 0 }));
                localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            }
        }
    } catch (error) {
        console.error('Auto update error:', error);
    }
}

function addLoadingMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message ai';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = `<div class="message-content message-loading"><span></span><span></span><span></span></div>`;
    
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Disable send button
    document.getElementById('chatSendBtn').disabled = true;
}

function removeLoadingMessage() {
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.remove();
    
    // Enable send button
    document.getElementById('chatSendBtn').disabled = false;
}

function renderChatHistory() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    chatHistory.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${msg.type}`;
        // AI消息使用格式化样式，用户消息保持原样
        const content = msg.type === 'ai' ? formatStoryText(msg.content) : escapeHtml(msg.content);
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
        
        // Add long press for all messages
        let pressTimer = null;
        
        messageDiv.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                showContextMenu(e.touches[0], index, msg.type);
            }, 500);
        });
        
        messageDiv.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        messageDiv.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
        
        // Right click for desktop
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, index, msg.type);
        });
        
        messagesContainer.appendChild(messageDiv);
    });
    
    // 直接定位到最新消息（无动画）
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// ==================== 通讯App功能 ====================

// 私聊记录存储（独立于主剧情）
let privateChatHistory = JSON.parse(localStorage.getItem('privateChatHistory') || '{}');
// 总结结构: { chatKey: { summaries: [], masterSummary: '' } }
let privateChatSummary = JSON.parse(localStorage.getItem('privateChatSummary') || '{}');
let privateChatLastSummaryAt = JSON.parse(localStorage.getItem('privateChatLastSummaryAt') || '{}');
let currentChatContact = null;
let isChatAppSending = false;

// 表情库存储
let stickerLibrary = JSON.parse(localStorage.getItem('stickerLibrary') || '[]');

// 保存表情库
function saveStickerLibrary() {
    localStorage.setItem('stickerLibrary', JSON.stringify(stickerLibrary));
}

// 初始化通讯App
function setupChatApp() {
    const chatAppCard = document.getElementById('chatAppCard');
    const chatAppClose = document.getElementById('chatAppClose');
    const chatAppBackBtn = document.getElementById('chatAppBackBtn');
    const chatAppClearBtn = document.getElementById('chatAppClearBtn');
    const chatAppSummaryBtn = document.getElementById('chatAppSummaryBtn');
    const chatAppSendBtn = document.getElementById('chatAppSendBtn');
    const chatAppInput = document.getElementById('chatAppInput');
    
    if (!chatAppCard) return;
    
    // 打开通讯App
    chatAppCard.addEventListener('click', openChatApp);
    
    // 返回其他页面
    if (chatAppClose) {
        chatAppClose.addEventListener('click', closeChatApp);
    }
    
    // 返回联系人列表
    if (chatAppBackBtn) {
        chatAppBackBtn.addEventListener('click', showContactsList);
    }
    
    // 清空聊天记录
    if (chatAppClearBtn) {
        chatAppClearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            clearPrivateChat();
        });
    }
    
    // 查看/生成总结
    if (chatAppSummaryBtn) {
        chatAppSummaryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            showSummaryPanel();
        });
    }
    
    // 发送消息
    if (chatAppSendBtn) {
        chatAppSendBtn.addEventListener('click', sendPrivateMessage);
    }
    
    // 输入框回车发送
    if (chatAppInput) {
        chatAppInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendPrivateMessage();
            }
        });
        
        // 自动调整高度
        chatAppInput.addEventListener('input', () => {
            chatAppInput.style.height = 'auto';
            chatAppInput.style.height = Math.min(chatAppInput.scrollHeight, 100) + 'px';
        });
    }
    
    // 表情相关
    const stickerBtn = document.getElementById('chatStickerBtn');
    const stickerPanel = document.getElementById('stickerPanel');
    const stickerManageBtn = document.getElementById('stickerManageBtn');
    const stickerModal = document.getElementById('stickerModal');
    const stickerModalClose = document.getElementById('stickerModalClose');
    const stickerUploadArea = document.getElementById('stickerUploadArea');
    const stickerFileInput = document.getElementById('stickerFileInput');
    
    // 切换表情面板
    if (stickerBtn) {
        stickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stickerPanel?.classList.toggle('hidden');
            renderStickerGrid();
        });
    }
    
    // 管理表情
    if (stickerManageBtn) {
        stickerManageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stickerPanel?.classList.add('hidden');
            openStickerModal();
        });
    }
    
    // 关闭表情管理模态框
    if (stickerModalClose) {
        stickerModalClose.addEventListener('click', closeStickerModal);
    }
    if (stickerModal) {
        stickerModal.addEventListener('click', (e) => {
            if (e.target === stickerModal) closeStickerModal();
        });
    }
    
    // 上传表情
    if (stickerUploadArea) {
        stickerUploadArea.addEventListener('click', () => stickerFileInput?.click());
        stickerUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            stickerUploadArea.style.borderColor = 'var(--gold)';
        });
        stickerUploadArea.addEventListener('dragleave', () => {
            stickerUploadArea.style.borderColor = '';
        });
        stickerUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            stickerUploadArea.style.borderColor = '';
            handleStickerFiles(e.dataTransfer.files);
        });
    }
    
    if (stickerFileInput) {
        stickerFileInput.addEventListener('change', (e) => {
            handleStickerFiles(e.target.files);
            e.target.value = '';
        });
    }
    
    // 点击其他地方关闭表情面板
    document.addEventListener('click', (e) => {
        if (stickerPanel && !stickerPanel.classList.contains('hidden')) {
            if (!stickerPanel.contains(e.target) && e.target !== stickerBtn && !stickerBtn?.contains(e.target)) {
                stickerPanel.classList.add('hidden');
            }
        }
    });
}

// 打开通讯App（全屏页面）
function openChatApp() {
    // 隐藏其他区域，显示通讯App
    document.getElementById('mainSection').classList.remove('active');
    document.getElementById('othersSection').classList.remove('active');
    const chatAppSection = document.getElementById('chatAppSection');
    if (chatAppSection) {
        chatAppSection.classList.add('active');
        showContactsList();
        renderContactsList();
    }
}

// 关闭通讯App（返回其他页面）
function closeChatApp() {
    const chatAppSection = document.getElementById('chatAppSection');
    if (chatAppSection) {
        chatAppSection.classList.remove('active');
    }
    // 返回其他页面
    document.getElementById('othersSection').classList.add('active');
    currentChatContact = null;
}

// 显示联系人列表
function showContactsList() {
    const contactsPage = document.getElementById('chatAppContactsPage');
    const chatPage = document.getElementById('chatAppChatPage');
    const title = document.getElementById('chatAppTitle');
    
    if (contactsPage) contactsPage.classList.remove('hidden');
    if (chatPage) chatPage.classList.add('hidden');
    if (title) title.textContent = '通讯录';
    
    currentChatContact = null;
    renderContactsList();
}

// 获取所有可聊天的角色（从importantCharacters获取）
function getChatContacts() {
    // 从所有模式收集角色
    const contacts = [];
    const modes = ['chuanyue', 'kuaichuan', 'chuanshu', 'wuxianliu'];
    
    modes.forEach(mode => {
        const chars = JSON.parse(localStorage.getItem(`${mode}_importantCharacters`) || '[]');
        chars.forEach(char => {
            // 避免重复（按名字判断）
            if (char.name && !contacts.find(c => c.name === char.name)) {
                contacts.push({
                    ...char,
                    mode: mode,
                    id: `${mode}_${char.name}`
                });
            }
        });
    });
    
    return contacts;
}

// 渲染联系人列表
function renderContactsList() {
    const listContainer = document.getElementById('contactsList');
    const countEl = document.getElementById('contactsCount');
    if (!listContainer) return;
    
    const contacts = getChatContacts();
    
    if (countEl) {
        countEl.textContent = `${contacts.length}人`;
    }
    
    if (contacts.length === 0) {
        listContainer.innerHTML = `
            <div class="contacts-empty">
                <svg viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="18" r="10" stroke="#7a6f5f" stroke-width="2"/>
                    <path d="M8 42 C8 32 16 26 24 26 C32 26 40 32 40 42" stroke="#7a6f5f" stroke-width="2"/>
                </svg>
                <p>暂无联系人</p>
                <small>开始剧情后，遇到的角色会出现在这里</small>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = contacts.map(contact => {
        const chatKey = contact.id;
        const history = privateChatHistory[chatKey] || [];
        const lastMsg = history[history.length - 1];
        const preview = lastMsg ? (lastMsg.role === 'user' ? '我: ' : '') + lastMsg.content.substring(0, 20) + (lastMsg.content.length > 20 ? '...' : '') : '点击开始聊天';
        const firstChar = contact.name.charAt(0);
        
        return `
            <div class="contact-item" onclick="openPrivateChat('${escapeHtml(contact.id)}', '${escapeHtml(contact.name)}')">
                <div class="contact-avatar">${firstChar}</div>
                <div class="contact-info">
                    <div class="contact-name">${escapeHtml(contact.name)}</div>
                    <div class="contact-preview">${escapeHtml(preview)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 打开私聊界面
function openPrivateChat(contactId, contactName) {
    const contactsPage = document.getElementById('chatAppContactsPage');
    const chatPage = document.getElementById('chatAppChatPage');
    const avatarEl = document.getElementById('chatContactAvatar');
    const nameEl = document.getElementById('chatContactName');
    
    if (contactsPage) contactsPage.classList.add('hidden');
    if (chatPage) chatPage.classList.remove('hidden');
    if (avatarEl) avatarEl.textContent = contactName.charAt(0);
    if (nameEl) nameEl.textContent = contactName;
    
    currentChatContact = { id: contactId, name: contactName };
    renderPrivateChatMessages();
    
    // 聚焦输入框
    const input = document.getElementById('chatAppInput');
    if (input) {
        setTimeout(() => input.focus(), 100);
    }
}

// 渲染私聊消息
function renderPrivateChatMessages() {
    const container = document.getElementById('chatAppMessages');
    if (!container || !currentChatContact) return;
    
    const chatKey = currentChatContact.id;
    const history = privateChatHistory[chatKey] || [];
    
    if (history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
                <p>开始和 ${escapeHtml(currentChatContact.name)} 聊天吧！</p>
                <small>这里的对话不会影响主剧情</small>
            </div>
        `;
        return;
    }
    
    const userName = chuanyueRulesData?.userName || '我';
    
    container.innerHTML = history.map(msg => {
        const isUser = msg.role === 'user';
        const avatar = isUser ? userName.charAt(0) : currentChatContact.name.charAt(0);
        const time = msg.time ? new Date(msg.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
        
        // 检查是否是表情消息
        let messageContent = '';
        if (msg.sticker) {
            // 用户发送的表情
            messageContent = `<div class="sticker-message"><img src="${msg.sticker}" alt="表情"></div>`;
        } else {
            // 检查内容中是否有表情标记（AI发送的）
            const content = msg.content || '';
            const stickerMatch = content.match(/\[表情:(.+?)\]/);
            if (stickerMatch) {
                const stickerName = stickerMatch[1];
                const sticker = stickerLibrary.find(s => s.name === stickerName);
                if (sticker) {
                    // 替换表情标记为图片
                    const textPart = content.replace(/\[表情:.+?\]/g, '').trim();
                    messageContent = sticker ? `<div class="sticker-message"><img src="${sticker.url}" alt="${stickerName}"></div>` : '';
                    if (textPart) {
                        messageContent = `<div class="message-bubble">${escapeHtml(textPart)}</div>` + messageContent;
                    }
                } else {
                    messageContent = `<div class="message-bubble">${escapeHtml(content)}</div>`;
                }
            } else {
                messageContent = `<div class="message-bubble">${escapeHtml(content)}</div>`;
            }
        }
        
        return `
            <div class="chat-app-message ${isUser ? 'user' : ''}" data-index="${history.indexOf(msg)}" data-role="${msg.role}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content-wrapper">
                    ${messageContent}
                    ${time ? `<div class="message-time">${time}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // 绑定长按事件
    bindMessageLongPress(container);
    
    // 滚动到底部
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}

// 发送私聊消息
async function sendPrivateMessage() {
    if (isChatAppSending || !currentChatContact) return;
    
    const input = document.getElementById('chatAppInput');
    const sendBtn = document.getElementById('chatAppSendBtn');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // 检查API配置
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先配置API设置');
        return;
    }
    
    isChatAppSending = true;
    if (sendBtn) sendBtn.disabled = true;
    
    const chatKey = currentChatContact.id;
    if (!privateChatHistory[chatKey]) {
        privateChatHistory[chatKey] = [];
    }
    
    // 添加用户消息
    privateChatHistory[chatKey].push({
        role: 'user',
        content: message,
        time: Date.now()
    });
    
    input.value = '';
    input.style.height = 'auto';
    renderPrivateChatMessages();
    savePrivateChatHistory();
    
    // 显示正在输入状态
    showChatTypingIndicator();
    
    try {
        // 获取角色信息
        const contacts = getChatContacts();
        const contact = contacts.find(c => c.id === currentChatContact.id);
        const characterInfo = contact ? `
角色名：${contact.name}
${contact.identity ? `身份：${contact.identity}` : ''}
${contact.personality ? `性格：${contact.personality}` : ''}
${contact.relationship ? `与主角关系：${contact.relationship}` : ''}
${contact.description ? `描述：${contact.description}` : ''}
`.trim() : `角色名：${currentChatContact.name}`;
        
        // 获取当前剧情上下文（主剧情摘要和状态）
        let storyContext = '';
        if (storySummary) {
            storyContext += `【当前剧情进度】\n${storySummary}\n\n`;
        }
        if (chatStatus) {
            storyContext += `【当前状态】时间：${chatStatus.time || '未知'}，地点：${chatStatus.location || '未知'}\n\n`;
        }
        
        // 获取私聊总结
        const summaryData = getSummaryData(chatKey);
        let chatSummary = '';
        if (summaryData.masterSummary) {
            chatSummary = summaryData.masterSummary;
        } else if (summaryData.summaries.length > 0) {
            chatSummary = summaryData.summaries.map(s => s.text).join('\n');
        }
        
        // 构建聊天历史（取最近40条）
        const recentHistory = privateChatHistory[chatKey].slice(-40);
        const stickerInfo = getStickerLibraryDescription();
        const messages = [
            {
                role: 'system',
                content: `你现在扮演一个角色与用户私聊。这是一个独立的聊天场景，聊天内容不会影响主剧情。

${characterInfo}

${storyContext ? `【剧情背景参考】\n${storyContext}` : ''}
${chatSummary ? `【之前的聊天总结】\n${chatSummary}\n` : ''}

要求：
1. 完全代入角色，用角色的口吻和性格回复
2. 回复要自然、有个性，符合角色设定
3. 可以闲聊、调侃、撒娇等，展现角色魅力
4. 回复简短自然，像真实聊天一样（通常1-3句话）
5. 不要使用括号描述动作或心理，直接用对话形式
6. 可以参考剧情背景来增加话题的关联性${stickerInfo}`
            },
            ...recentHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
        ];
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: messages,
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        const reply = data.choices[0]?.message?.content || '...';
        
        // 隐藏正在输入状态
        hideChatTypingIndicator();
        
        // 添加角色回复
        privateChatHistory[chatKey].push({
            role: 'assistant',
            content: reply,
            time: Date.now()
        });
        
        renderPrivateChatMessages();
        savePrivateChatHistory();
        
        // 检查是否需要自动总结（每30条）
        checkPrivateChatAutoSummary(chatKey);
        
    } catch (error) {
        console.error('私聊发送失败:', error);
        showToast('发送失败，请重试');
        // 移除失败的用户消息
        privateChatHistory[chatKey].pop();
        renderPrivateChatMessages();
    } finally {
        hideChatTypingIndicator();
        isChatAppSending = false;
        if (sendBtn) sendBtn.disabled = false;
    }
}

// 清空私聊记录
async function clearPrivateChat() {
    if (!currentChatContact) return;
    
    if (await customConfirm(`确定要清空与 ${currentChatContact.name} 的聊天记录吗？`, '清空聊天')) {
        const chatKey = currentChatContact.id;
        delete privateChatHistory[chatKey];
        delete privateChatSummary[chatKey];
        delete privateChatLastSummaryAt[chatKey];
        savePrivateChatHistory();
        renderPrivateChatMessages();
        showToast('聊天记录已清空');
    }
}

// 保存私聊记录
function savePrivateChatHistory() {
    localStorage.setItem('privateChatHistory', JSON.stringify(privateChatHistory));
    localStorage.setItem('privateChatSummary', JSON.stringify(privateChatSummary));
    localStorage.setItem('privateChatLastSummaryAt', JSON.stringify(privateChatLastSummaryAt));
}

// 检查是否需要自动总结（每30条）
function checkPrivateChatAutoSummary(chatKey) {
    const history = privateChatHistory[chatKey] || [];
    const lastSummaryAt = privateChatLastSummaryAt[chatKey] || 0;
    
    // 每30条消息自动总结一次
    if (history.length - lastSummaryAt >= 30) {
        generatePrivateChatSummary(true); // 自动模式，不显示Toast
    }
}

// 获取总结数据结构
function getSummaryData(chatKey) {
    if (!privateChatSummary[chatKey] || typeof privateChatSummary[chatKey] === 'string') {
        // 迁移旧数据格式
        const oldSummary = typeof privateChatSummary[chatKey] === 'string' ? privateChatSummary[chatKey] : '';
        privateChatSummary[chatKey] = {
            summaries: oldSummary ? [{ text: oldSummary, time: Date.now() }] : [],
            masterSummary: ''
        };
    }
    return privateChatSummary[chatKey];
}

// 生成私聊总结
async function generatePrivateChatSummary(isAuto = false) {
    if (!currentChatContact) return;
    
    const chatKey = currentChatContact.id;
    const history = privateChatHistory[chatKey] || [];
    
    if (history.length < 5) {
        if (!isAuto) showToast('聊天记录太少，无需总结');
        return;
    }
    
    // 优先使用备用API，没有则使用主API
    let apiUrl, apiKey, model;
    if (apiSettings.backupBaseUrl && apiSettings.backupApiKey && apiSettings.backupModel) {
        apiUrl = apiSettings.backupBaseUrl;
        apiKey = apiSettings.backupApiKey;
        model = apiSettings.backupModel;
    } else if (apiSettings.baseUrl && apiSettings.apiKey && apiSettings.model) {
        apiUrl = apiSettings.baseUrl;
        apiKey = apiSettings.apiKey;
        model = apiSettings.model;
    } else {
        if (!isAuto) showToast('请先配置API设置');
        return;
    }
    
    if (!isAuto) showToast('正在生成总结...');
    
    try {
        // 获取需要总结的消息
        const lastSummaryAt = privateChatLastSummaryAt[chatKey] || 0;
        const newMessages = history.slice(lastSummaryAt);
        
        if (newMessages.length < 5) {
            if (!isAuto) showToast('新消息太少，无需总结');
            return;
        }
        
        const chatContent = newMessages.map(msg => 
            `${msg.role === 'user' ? '用户' : currentChatContact.name}：${msg.content}`
        ).join('\n');
        
        const response = await fetch(apiUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个对话总结助手。请简洁地总结对话内容，保留关键信息。'
                    },
                    {
                        role: 'user',
                        content: `请总结以下与"${currentChatContact.name}"的私聊内容（50-100字）：

${chatContent}

直接返回总结，不要加标题或序号。`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        
        if (!response.ok) throw new Error('API请求失败');
        
        const data = await response.json();
        const summary = data.choices[0]?.message?.content || '';
        
        if (summary) {
            const summaryData = getSummaryData(chatKey);
            summaryData.summaries.push({
                text: summary.trim(),
                time: Date.now(),
                msgRange: [lastSummaryAt, history.length]
            });
            privateChatLastSummaryAt[chatKey] = history.length;
            savePrivateChatHistory();
            
            if (!isAuto) showToast(`总结 ${summaryData.summaries.length}/10`);
            
            // 检查是否需要生成大总结
            if (summaryData.summaries.length >= 10) {
                await generateMasterSummary(chatKey, apiUrl, apiKey, model);
            }
        }
        
    } catch (error) {
        console.error('生成私聊总结失败:', error);
        if (!isAuto) showToast('总结生成失败');
    }
}

// 生成大总结（合并10个小总结）
async function generateMasterSummary(chatKey, apiUrl, apiKey, model) {
    const summaryData = getSummaryData(chatKey);
    if (summaryData.summaries.length < 10) return;
    
    showToast('正在生成综合总结...');
    
    try {
        const allSummaries = summaryData.summaries.map((s, i) => `[${i + 1}] ${s.text}`).join('\n\n');
        const previousMaster = summaryData.masterSummary || '';
        
        const response = await fetch(apiUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个对话总结助手。请将多个小总结合并成一个完整的综合总结。'
                    },
                    {
                        role: 'user',
                        content: `请将以下10个对话总结合并成一个综合总结（200-300字）：

${previousMaster ? `【之前的综合总结】\n${previousMaster}\n\n` : ''}【新的10个总结】
${allSummaries}

请综合上述内容，生成一个完整的关系发展总结，包含：
1. 双方互动的主要话题和事件
2. 关系的发展变化
3. 重要的情感节点

直接返回总结内容。`
                    }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });
        
        if (!response.ok) throw new Error('API请求失败');
        
        const data = await response.json();
        const masterSummary = data.choices[0]?.message?.content || '';
        
        if (masterSummary) {
            summaryData.masterSummary = masterSummary.trim();
            summaryData.summaries = []; // 清空小总结
            savePrivateChatHistory();
            showToast('综合总结生成完成！');
        }
        
    } catch (error) {
        console.error('生成综合总结失败:', error);
        showToast('综合总结生成失败');
    }
}

// 显示总结面板
function showSummaryPanel() {
    if (!currentChatContact) return;
    
    const chatKey = currentChatContact.id;
    const summaryData = getSummaryData(chatKey);
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'summaryModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>📝 与 ${escapeHtml(currentChatContact.name)} 的聊天总结</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${summaryData.masterSummary ? `
                    <div class="summary-section master">
                        <div class="summary-section-title">📚 综合总结</div>
                        <div class="summary-content">${escapeHtml(summaryData.masterSummary)}</div>
                    </div>
                ` : ''}
                
                <div class="summary-section">
                    <div class="summary-section-title">
                        📋 阶段总结 
                        <span class="summary-count">${summaryData.summaries.length}/10</span>
                    </div>
                    <div class="summary-items-container">
                        ${summaryData.summaries.length > 0 ? 
                            summaryData.summaries.map((s, i) => `
                                <div class="summary-item">
                                    <div class="summary-item-header">
                                        <span class="summary-num">#${i + 1}</span>
                                        <span class="summary-time">${new Date(s.time).toLocaleDateString()}</span>
                                    </div>
                                    <div class="summary-item-text">${escapeHtml(s.text)}</div>
                                </div>
                            `).join('') 
                            : '<div class="summary-empty">暂无阶段总结</div>'
                        }
                    </div>
                </div>
                
                <div class="summary-tip">
                    💡 每次生成会添加一个阶段总结，累积10个后自动合并为综合总结
                </div>
                
                <button class="summary-generate-btn" id="generateSummaryBtn">
                    ✨ 生成新的阶段总结
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 生成按钮
    modal.querySelector('#generateSummaryBtn').addEventListener('click', async () => {
        const btn = modal.querySelector('#generateSummaryBtn');
        btn.disabled = true;
        btn.textContent = '生成中...';
        await generatePrivateChatSummary(false);
        modal.remove();
        // 重新打开以刷新内容
        setTimeout(() => showSummaryPanel(), 300);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 显示正在输入状态
function showChatTypingIndicator() {
    const nameEl = document.getElementById('chatContactName');
    if (nameEl && currentChatContact) {
        nameEl.classList.add('typing');
        nameEl.setAttribute('data-original-name', nameEl.textContent);
        nameEl.textContent = `${currentChatContact.name} 正在输入...`;
    }
}

// 隐藏正在输入状态
function hideChatTypingIndicator() {
    const nameEl = document.getElementById('chatContactName');
    if (nameEl) {
        nameEl.classList.remove('typing');
        const originalName = nameEl.getAttribute('data-original-name');
        if (originalName) {
            nameEl.textContent = originalName;
        }
    }
}

// ==================== 表情库功能 ====================

// 打开表情管理模态框
function openStickerModal() {
    const modal = document.getElementById('stickerModal');
    if (modal) {
        modal.classList.add('active');
        renderStickerManageList();
    }
}

// 关闭表情管理模态框
function closeStickerModal() {
    const modal = document.getElementById('stickerModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 处理上传的表情文件
function handleStickerFiles(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        // 处理文本文件（名称: URL格式）
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split('\n');
                let count = 0;
                
                lines.forEach(line => {
                    line = line.trim();
                    if (!line) return;
                    
                    // 支持多种分隔符：中文冒号、英文冒号（带或不带空格）
                    const match = line.match(/^(.+?)[：:]\s*(.+)$/);
                    if (match) {
                        const name = match[1].trim();
                        const url = match[2].trim();
                        
                        // 验证是否是有效的URL
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                            stickerLibrary.push({
                                id: Date.now() + Math.random().toString(36).substr(2, 9) + count,
                                name: name,
                                url: url,
                                description: name
                            });
                            count++;
                        }
                    }
                });
                
                if (count > 0) {
                    saveStickerLibrary();
                    renderStickerManageList();
                    showToast(`已添加 ${count} 个表情`);
                } else {
                    showToast('未找到有效的表情数据');
                }
            };
            reader.readAsText(file);
            return;
        }
        
        // 处理图片文件
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // 生成表情描述（使用文件名）
            const name = file.name.replace(/\.[^/.]+$/, '');
            
            stickerLibrary.push({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                name: name,
                url: e.target.result, // base64 data URL
                description: name // 用于AI识别
            });
            
            saveStickerLibrary();
            renderStickerManageList();
            showToast(`已添加表情: ${name}`);
        };
        reader.readAsDataURL(file);
    });
}

// 渲染表情选择面板
function renderStickerGrid() {
    const grid = document.getElementById('stickerGrid');
    const empty = document.getElementById('stickerEmpty');
    if (!grid || !empty) return;
    
    if (stickerLibrary.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    empty.style.display = 'none';
    
    grid.innerHTML = stickerLibrary.map(sticker => `
        <div class="sticker-item" data-id="${sticker.id}" title="${sticker.name}">
            <img src="${sticker.url}" alt="${sticker.name}">
        </div>
    `).join('');
    
    // 点击发送表情
    grid.querySelectorAll('.sticker-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            sendSticker(id);
            document.getElementById('stickerPanel')?.classList.add('hidden');
        });
    });
}

// 渲染表情管理列表
function renderStickerManageList() {
    const list = document.getElementById('stickerManageList');
    if (!list) return;
    
    if (stickerLibrary.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">暂无表情，请上传</p>';
        return;
    }
    
    list.innerHTML = stickerLibrary.map(sticker => `
        <div class="sticker-manage-item" data-id="${sticker.id}">
            <img src="${sticker.url}" alt="${sticker.name}">
            <div class="sticker-info">
                <div class="sticker-name">${escapeHtml(sticker.name)}</div>
                <div class="sticker-desc">${escapeHtml(sticker.description || sticker.name)}</div>
            </div>
            <button class="sticker-delete-btn" title="删除">
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M4 6 H20 M8 6 V4 H16 V6 M6 6 V20 H18 V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // 删除表情
    list.querySelectorAll('.sticker-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.sticker-manage-item');
            const id = item?.dataset.id;
            if (id && await customConfirm('确定要删除这个表情吗？', '删除表情')) {
                stickerLibrary = stickerLibrary.filter(s => s.id !== id);
                saveStickerLibrary();
                renderStickerManageList();
                showToast('表情已删除');
            }
        });
    });
}

// 发送表情
function sendSticker(stickerId) {
    if (!currentChatContact) return;
    
    const sticker = stickerLibrary.find(s => s.id === stickerId);
    if (!sticker) return;
    
    const chatKey = currentChatContact.id;
    if (!privateChatHistory[chatKey]) {
        privateChatHistory[chatKey] = [];
    }
    
    // 添加表情消息
    privateChatHistory[chatKey].push({
        role: 'user',
        content: `[表情:${sticker.name}]`,
        sticker: sticker.url,
        time: Date.now()
    });
    
    renderPrivateChatMessages();
    savePrivateChatHistory();
}

// 获取表情库描述（供AI参考）
function getStickerLibraryDescription() {
    if (stickerLibrary.length === 0) return '';
    
    const stickerList = stickerLibrary.map(s => `[表情:${s.name}]`).join('、');
    return `\n\n【表情库规则】
可用表情列表：${stickerList}
重要规则：
- 只能使用上述列表中的表情，禁止使用或创造任何不在列表中的表情
- 发送表情格式：[表情:名称]（名称必须与列表完全一致）
- 可以在文字后附加表情，如："好的呀 [表情:可爱]"
- 适当使用表情增加聊天趣味，但不要每条都发`;
}

// ==================== 消息长按操作 ====================

let msgLongPressTimer = null;
let currentMessageMenu = null;

// 绑定消息长按事件
function bindMessageLongPress(container) {
    const messages = container.querySelectorAll('.chat-app-message');
    
    messages.forEach(msg => {
        const wrapper = msg.querySelector('.message-content-wrapper');
        if (!wrapper) return;
        
        let startX, startY;
        
        // 触摸开始
        wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            msgLongPressTimer = setTimeout(() => {
                showMessageMenu(msg, e.touches[0].clientX, e.touches[0].clientY);
            }, 500);
        }, { passive: true });
        
        // 触摸移动（取消长按）
        wrapper.addEventListener('touchmove', (e) => {
            const moveX = Math.abs(e.touches[0].clientX - startX);
            const moveY = Math.abs(e.touches[0].clientY - startY);
            if (moveX > 10 || moveY > 10) {
                clearTimeout(msgLongPressTimer);
            }
        }, { passive: true });
        
        // 触摸结束
        wrapper.addEventListener('touchend', () => {
            clearTimeout(msgLongPressTimer);
        });
        
        // 鼠标右键（桌面端）
        wrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showMessageMenu(msg, e.clientX, e.clientY);
        });
    });
}

// 显示消息操作菜单
function showMessageMenu(msgEl, x, y) {
    hideMessageMenu();
    
    const index = parseInt(msgEl.dataset.index);
    const role = msgEl.dataset.role;
    const isUser = role === 'user';
    
    const menu = document.createElement('div');
    menu.className = 'message-context-menu';
    menu.innerHTML = `
        ${!isUser ? `<div class="menu-item" data-action="regenerate">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M1 4 V10 H7 M23 20 V14 H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M20.49 9 A9 9 0 0 0 5.64 5.64 L1 10 M23 14 L18.36 18.36 A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            重新生成
        </div>` : ''}
        <div class="menu-item delete" data-action="delete">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M4 6 H20 M8 6 V4 H16 V6 M6 6 V20 H18 V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            删除
        </div>
    `;
    
    // 定位菜单
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
    
    // 确保菜单在屏幕内
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (y - rect.height) + 'px';
    }
    
    currentMessageMenu = menu;
    
    // 绑定菜单点击
    menu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', async () => {
            const action = item.dataset.action;
            hideMessageMenu();
            
            if (action === 'delete') {
                await deleteMessage(index);
            } else if (action === 'regenerate') {
                await regenerateMessage(index);
            }
        });
    });
    
    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', hideMessageMenu, { once: true });
        document.addEventListener('touchstart', hideMessageMenu, { once: true });
    }, 10);
}

// 隐藏消息操作菜单
function hideMessageMenu() {
    if (currentMessageMenu) {
        currentMessageMenu.remove();
        currentMessageMenu = null;
    }
}

// 删除消息
async function deleteMessage(index) {
    if (!currentChatContact) return;
    
    const chatKey = currentChatContact.id;
    if (!privateChatHistory[chatKey]) return;
    
    privateChatHistory[chatKey].splice(index, 1);
    savePrivateChatHistory();
    renderPrivateChatMessages();
    showToast('消息已删除');
}

// 重新生成AI消息
async function regenerateMessage(index) {
    if (!currentChatContact || isChatAppSending) return;
    
    const chatKey = currentChatContact.id;
    if (!privateChatHistory[chatKey]) return;
    
    // 删除该条及之后的所有AI消息
    const history = privateChatHistory[chatKey];
    // 只删除这条消息
    history.splice(index, 1);
    
    savePrivateChatHistory();
    renderPrivateChatMessages();
    
    // 找到最后一条用户消息
    const lastUserMsgIndex = history.length - 1;
    if (lastUserMsgIndex >= 0 && history[lastUserMsgIndex].role === 'user') {
        // 重新生成回复
        showChatTypingIndicator();
        isChatAppSending = true;
        
        try {
            // 获取角色信息
            const contacts = getChatContacts();
            const contact = contacts.find(c => c.id === currentChatContact.id);
            const characterInfo = contact ? `
角色名：${contact.name}
${contact.identity ? `身份：${contact.identity}` : ''}
${contact.personality ? `性格：${contact.personality}` : ''}
${contact.relationship ? `与主角关系：${contact.relationship}` : ''}
${contact.description ? `描述：${contact.description}` : ''}
`.trim() : `角色名：${currentChatContact.name}`;
            
            const storyContext = storySummary ? `【剧情背景】\n${storySummary}\n\n` : '';
            const chatSummary = privateChatSummary[chatKey] || '';
            const stickerInfo = getStickerLibraryDescription();
            const recentHistory = history.slice(-40);
            
            const messages = [
                {
                    role: 'system',
                    content: `你现在扮演一个角色与用户私聊。

${characterInfo}

${storyContext}${chatSummary ? `【聊天总结】\n${chatSummary}\n` : ''}

要求：回复简短自然，符合角色性格${stickerInfo}`
                },
                ...recentHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
            ];
            
            const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiSettings.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: apiSettings.model,
                    messages: messages,
                    temperature: 0.9
                })
            });
            
            if (!response.ok) throw new Error('API请求失败');
            
            const data = await response.json();
            const reply = data.choices[0]?.message?.content || '...';
            
            history.push({
                role: 'assistant',
                content: reply,
                time: Date.now()
            });
            
            savePrivateChatHistory();
            renderPrivateChatMessages();
            
        } catch (error) {
            console.error('重新生成失败:', error);
            showToast('重新生成失败');
        } finally {
            hideChatTypingIndicator();
            isChatAppSending = false;
        }
    }
}

// Initialize
init();
setupChatApp();
