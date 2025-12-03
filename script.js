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

// API Settings State
const apiSettings = {
    baseUrl: localStorage.getItem('apiBaseUrl') || '',
    apiKey: localStorage.getItem('apiKey') || '',
    model: localStorage.getItem('apiModel') || '',
    temperature: parseFloat(localStorage.getItem('apiTemperature') || '0.7')
};

// Backup API Settings (for summary/stats, optional)
const backupApiSettings = {
    baseUrl: localStorage.getItem('backupApiBaseUrl') || '',
    apiKey: localStorage.getItem('backupApiKey') || '',
    model: localStorage.getItem('backupModel') || ''
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
    characterProfile = JSON.parse(localStorage.getItem(getStorageKey('characterProfile')) || 'null');
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

【字数限制取消】
- 无固定字数要求，可长可短
- 根据情节发展自然调节篇幅
- 重要场景可详细展开，过渡场景可简洁处理

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
        
        // 隐藏穿越人设卡片（人设自动合并到我的人设中）
        if (transCharCard) transCharCard.style.display = 'none';
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
        
        renderProfile();
        renderWorldInfo();
        renderTransChar();
        renderWorldBuilding();
        renderPlayerStatus();
        renderCharactersList();
        
        // 恢复聊天界面和消息（如果已开始游戏）
        if (isChuanyueStarted && chatHistory.length > 0) {
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
- 字数不设限制，可长可短
- 根据情节需要自然调节篇幅
- 重要场景（初遇、告白、亲密等）可详细展开
- 日常过渡可简洁处理
- 避免水字数的无意义描写
- 保持阅读节奏流畅`,
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
                openSettingsModal();
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
            }
        });
    });
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
    document.getElementById('backupModel').value = backupApiSettings.model;
    
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

    // Test connection
    testConnectionBtn.addEventListener('click', testConnection);

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
        testBtn.querySelector('span').textContent = '检测连接';
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
    const backupModel = document.getElementById('backupModel').value.trim();
    
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
function saveApiScheme() {
    const baseUrl = document.getElementById('apiBaseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value;
    const temperature = parseFloat(document.getElementById('temperatureSlider').value);

    if (!baseUrl) {
        showToast('请先输入API地址');
        return;
    }

    // Prompt for scheme name
    const schemeName = prompt('请输入方案名称：', '');
    if (!schemeName || !schemeName.trim()) {
        return;
    }

    // Check if name already exists
    const existingIndex = apiSchemes.findIndex(s => s.name === schemeName.trim());
    if (existingIndex !== -1) {
        if (confirm('方案名称已存在，是否覆盖？')) {
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
function deleteApiScheme() {
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

    if (!confirm('确定要删除方案 "' + scheme.name + '" 吗？')) {
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

function deleteCurrentFavorite() {
    if (!currentViewingFavoriteId) return;
    
    if (!confirm('确定要删除这条收藏吗？')) return;
    
    removeFavorite(currentViewingFavoriteId);
    closeFavoriteDetailModal();
}

function saveArchive(name = '') {
    const archiveName = name || prompt('请输入存档名称：', `${chuanyueRulesData?.settings?.substring(0, 15) || '世界'} - ${new Date().toLocaleDateString()}`);
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

function loadArchive(id) {
    const archive = archives.find(a => a.id === id);
    if (!archive) return;
    
    if (!confirm(`确定要加载存档"${archive.name}"吗？\n当前进度将被覆盖。`)) return;
    
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

function removeArchive(id) {
    if (!confirm('确定要删除此存档吗？')) return;
    
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
    
    // 生成该世界的开场剧情
    await generateWorldOpening(worldNumber, selectedWorldInfo);
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
    backBtn.addEventListener('click', closeChuanyueMode);

    // Toggle sidebar
    toggleBtn.addEventListener('click', toggleSidebar);
    
    // Floating menu button to expand sidebar
    floatingMenuBtn.addEventListener('click', expandSidebar);
    
    // Click overlay to collapse sidebar
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', collapseSidebar);
    }

    // Open profile modal
    editBtn.addEventListener('click', () => openProfileModal(true));
    createBtn.addEventListener('click', () => openProfileModal(false));

    // Close profile modal
    modalClose.addEventListener('click', closeProfileModal);
    modalCancel.addEventListener('click', closeProfileModal);
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeProfileModal();
    });

    // Save profile
    modalSave.addEventListener('click', saveProfile);

    // Gender selection
    setupGenderSelect();

    // Start button - open rules modal
    startBtn.addEventListener('click', () => {
        if (!characterProfile) {
            showToast('请先创建人设');
            openProfileModal(false);
            return;
        }
        openChuanyueRulesModal();
    });

    // World info header toggle (collapsible)
    const worldInfoHeader = document.getElementById('worldInfoHeader');
    worldInfoHeader.addEventListener('click', () => {
        const body = document.getElementById('worldInfoBody');
        const toggle = worldInfoHeader.querySelector('.sidebar-card-toggle');
        body.classList.toggle('collapsed');
        if (body.classList.contains('collapsed')) {
            toggle.style.transform = 'rotate(-90deg)';
        } else {
            toggle.style.transform = 'rotate(0deg)';
        }
    });

    // World building header toggle (collapsible)
    const worldBuildingHeader = document.getElementById('worldBuildingHeader');
    worldBuildingHeader.addEventListener('click', (e) => {
        // Don't toggle if clicking on refresh button
        if (e.target.closest('.sidebar-card-refresh')) return;
        const body = document.getElementById('worldBuildingBody');
        const toggle = worldBuildingHeader.querySelector('.sidebar-card-toggle');
        body.classList.toggle('collapsed');
        if (body.classList.contains('collapsed')) {
            toggle.style.transform = 'rotate(-90deg)';
        } else {
            toggle.style.transform = 'rotate(0deg)';
        }
    });

    // Refresh world building button
    document.getElementById('refreshWorldBuilding').addEventListener('click', generateWorldBuilding);
    
    // Refresh trans char button
    document.getElementById('refreshTransCharBtn').addEventListener('click', generateTransChar);
    
    // Trans char card toggle
    document.getElementById('transCharHeader').addEventListener('click', (e) => {
        if (e.target.closest('.sidebar-card-refresh')) return;
        const body = document.getElementById('transCharBody');
        const toggle = document.querySelector('#transCharCard .sidebar-card-toggle svg');
        body.classList.toggle('collapsed');
        if (toggle) {
            toggle.style.transform = body.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    });

    // Restart button
    document.getElementById('restartBtn').addEventListener('click', restartChuanyue);

    // Setup rules modal
    setupChuanyueRulesModal();

    // Setup chat
    setupChat();

    // Render saved profile if exists
    renderProfile();
    
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
        worldSettingsItem.style.display = '';
        aiPolishBtn.style.display = '';
        // 更新世界设定标签
        worldSettingsItem.querySelector('.form-label').textContent = '书籍设定';
        document.getElementById('chuanyueSettings').placeholder = '如：原著小说类型、主要角色、剧情背景...';
    } else if (gameMode === 'wuxianliu') {
        rulesModalTitle.textContent = '无限流设定';
        rulesLabel.textContent = '副本规则';
        rulesTextarea.placeholder = '如：完成副本任务、积累积分、获取技能...';
        kuaichuanTypeItem.style.display = 'none';
        rulesItem.style.display = '';
        worldSettingsItem.style.display = '';
        aiPolishBtn.style.display = '';
        // 更新世界设定标签
        worldSettingsItem.querySelector('.form-label').textContent = '副本设定';
        document.getElementById('chuanyueSettings').placeholder = '如：副本类型、难度等级、特殊规则...';
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

    // Validate for kuaichuan mode
    if (gameMode === 'kuaichuan' && !kuaichuanType) {
        showToast('请选择任务类型');
        return;
    }

    // Save rules data
    chuanyueRulesData = {
        rules,
        settings,
        genderSetting,
        livestreamEnabled,
        kuaichuanType,
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
    
    // Rules section
    if (chuanyueRulesData.rules && !isKuaichuan) {
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
    
    // Settings section (only for chuanyue mode)
    if (chuanyueRulesData.settings && !isKuaichuan) {
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
    
    // Gender setting
    if (chuanyueRulesData.genderSetting) {
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
    
    // 隐藏穿越人设卡片（人设自动合并到我的人设中）
    if (transCharCard) transCharCard.style.display = 'none';
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
    
    renderProfile();
    renderWorldInfo();
    renderTransChar();
    renderWorldBuilding();
}

// 刷新模式UI（切换模式后调用）
function refreshModeUI() {
    // 渲染侧边栏内容
    renderProfile();
    renderWorldInfo();
    renderTransChar();
    renderWorldBuilding();
    renderPlayerStatus();
    renderCharactersList();
    
    // 处理聊天界面
    if (isChuanyueStarted && chatHistory.length > 0) {
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
    
    // 更新刷新按钮状态
    if (refreshBtn) {
        if (transCharGenerated) {
            refreshBtn.disabled = true;
            refreshBtn.title = '已生成（每个世界只能生成一次）';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.title = '生成穿越人设';
        }
    }
    
    if (!transCharData || !transCharData.name) {
        // 显示空状态
        const modeLabel = {
            'chuanyue': '穿越',
            'kuaichuan': '本世界',
            'chuanshu': '穿书',
            'wuxianliu': '副本'
        };
        body.innerHTML = `<div class="trans-char-empty">
            <p>点击刷新按钮生成${modeLabel[gameMode] || '穿越'}人设</p>
            <small>注意：每个世界只能生成一次</small>
        </div>`;
        return;
    }
    
    let html = '';
    
    if (transCharData.name) {
        html += `<div class="world-info-section">
            <div class="world-info-section-title">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" stroke="currentColor" stroke-width="2"/></svg>
                身份
            </div>
            <div class="world-info-section-content">${escapeHtml(transCharData.name)}</div>
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
        const msg = gameMode === 'kuaichuan' ? '本世界人设只能生成一次，进入新世界后可重新生成' : '人设只能生成一次，重新开始后可重新生成';
        showToast(msg);
        return;
    }

    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    const refreshBtn = document.getElementById('refreshTransCharBtn');
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
        
        let contextInfo = '';
        if (characterProfile) {
            contextInfo += `用户原本信息：\n`;
            if (characterProfile.name) contextInfo += `- 名字：${characterProfile.name}\n`;
            if (characterProfile.age) contextInfo += `- 年龄：${characterProfile.age}岁\n`;
            if (characterProfile.gender) {
                const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
                contextInfo += `- 性别：${genderMap[characterProfile.gender] || characterProfile.gender}\n`;
            }
            if (characterProfile.personality) contextInfo += `- 性格：${characterProfile.personality}\n`;
        }
        
        if (chuanyueRulesData?.settings) {
            contextInfo += `\n世界背景：${chuanyueRulesData.settings}\n`;
        }
        if (chuanyueRulesData?.rules) {
            contextInfo += `\n规则：${chuanyueRulesData.rules}\n`;
        }

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
    "ability": "特殊能力或金手指（如果有的话）",
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

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        
        // 提取JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            transCharData = JSON.parse(jsonMatch[0]);
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
        refreshBtn.disabled = transCharGenerated;
        refreshBtn.innerHTML = originalHTML;
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
        if (characterProfile) {
            contextInfo += `用户原本信息：\n`;
            if (characterProfile.name) contextInfo += `- 名字：${characterProfile.name}\n`;
            if (characterProfile.age) contextInfo += `- 年龄：${characterProfile.age}岁\n`;
            if (characterProfile.gender) {
                const genderMap = { 'male': '男', 'female': '女', 'other': '其他' };
                contextInfo += `- 性别：${genderMap[characterProfile.gender] || characterProfile.gender}\n`;
            }
            if (characterProfile.personality) contextInfo += `- 性格：${characterProfile.personality}\n`;
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
            
            // 更新人设显示
            renderProfile();
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

    // 快穿模式不需要检查世界背景
    if (gameMode !== 'kuaichuan' && (!chuanyueRulesData || !chuanyueRulesData.settings)) {
        showToast('请先设置世界背景');
        return;
    }

    const refreshBtn = document.getElementById('refreshWorldBuilding');
    const originalHTML = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" class="spin"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="30 70"/></svg>';
    showToast('正在生成世界设定...');

    try {
        // 快穿模式：根据选择的世界生成设定
        let worldBackground = '';
        if (gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld) {
            worldBackground = worldBuildingData.selectedWorld;
        } else {
            worldBackground = chuanyueRulesData?.settings || '';
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
                    { role: 'system', content: `你是一个世界观设计师。用思维导图的简洁格式生成世界设定，每个分类列出3-5个关键词条，每个词条用括号简短说明。严格按JSON格式返回。` },
                    { role: 'user', content: `请根据以下世界背景生成简洁的世界设定思维导图：

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
}` }
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
        } else {
            throw new Error('解析失败');
        }

    } catch (error) {
        console.error('Generate world building error:', error);
        showToast('生成失败: ' + error.message);
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalHTML;
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

生成的人物应包含：
- 可攻略的恋爱对象（2-3人）
- 重要配角（导师、对手、朋友等）
- 反派或敌对角色（1-2人）

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

    const categories = [
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
            nodes += renderMindmapNode(cat.title, worldBuildingData[cat.key]);
        }
    });
    nodes += '</div>';

    if (hasContent) {
        body.innerHTML = nodes;
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

// ==================== PLAYER STATUS ====================

function openStatusModal() {
    document.getElementById('statusModal').classList.add('active');
    renderPlayerStatus();
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
}

// AI刷新状态
async function refreshStatusByAI() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先配置API');
        return;
    }
    
    if (chatHistory.length === 0) {
        showToast('暂无对话内容可供分析');
        return;
    }
    
    const btn = document.getElementById('statusRefreshBtn');
    btn.disabled = true;
    btn.classList.add('refreshing');
    showToast('AI正在分析当前状态...');
    
    try {
        // 获取最近的对话内容
        const recentChat = chatHistory.slice(-10).map(m => 
            `${m.type === 'user' ? '用户' : 'AI'}：${m.content}`
        ).join('\n');
        
        const worldInfo = gameMode === 'kuaichuan' && worldBuildingData?.selectedWorld 
            ? worldBuildingData.selectedWorld 
            : (chuanyueRulesData?.settings || '');
        
        const response = await fetch(apiSettings.baseUrl.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiSettings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: [
                    { role: 'system', content: '你是状态分析助手。根据对话内容分析角色当前状态，返回JSON格式。' },
                    { role: 'user', content: `根据以下对话和世界观，分析并更新角色状态：

【世界设定】
${worldInfo}

【最近对话】
${recentChat}

【当前状态数据】
${JSON.stringify(playerStatusData)}

请分析并返回更新后的状态，JSON格式：
{
  "currentStatus": "当前身体/精神/情绪状态描述",
  "affection": [{"name":"角色名","value":好感度数值0-100}],
  "friends": ["好友名1","好友名2"],
  "enemies": ["敌人名1"],
  "inventory": ["物品1","物品2"]
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
            const newStatus = JSON.parse(jsonMatch[0]);
            playerStatusData = { ...playerStatusData, ...newStatus };
            localStorage.setItem(getStorageKey('playerStatusData'), JSON.stringify(playerStatusData));
            renderPlayerStatus();
            showToast('状态已更新');
        }
    } catch (error) {
        console.error('Refresh status error:', error);
        showToast('刷新失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.classList.remove('refreshing');
    }
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

function editStatusSection(section) {
    let currentValue = '';
    let promptText = '';
    let isCustom = section.startsWith('custom_');
    let customKey = isCustom ? section.replace('custom_', '') : null;
    let customCat = isCustom ? customStatusCategories.find(c => c.key === customKey) : null;

    if (isCustom && customCat) {
        currentValue = playerStatusData.custom?.[customKey] || '';
        if (customCat.type === 'progress') {
            promptText = `输入${customCat.name}（0-100的数值）：`;
        } else {
            promptText = `输入${customCat.name}：`;
        }
    } else {
        switch (section) {
            case 'currentStatus':
                currentValue = playerStatusData.currentStatus || '';
                promptText = '输入当前状态描述：';
                break;
            case 'affection':
                currentValue = playerStatusData.affection.map(a => `${a.name}:${a.value}`).join(', ');
                promptText = '输入好感度（格式：角色名:数值, 如：林黛玉:50, 薛宝钗:30）：';
                break;
            case 'friends':
                currentValue = playerStatusData.friends.join(', ');
                promptText = '输入好友列表（用逗号分隔）：';
                break;
            case 'enemies':
                currentValue = playerStatusData.enemies.join(', ');
                promptText = '输入敌对列表（用逗号分隔）：';
                break;
            case 'inventory':
                currentValue = playerStatusData.inventory.map(i => typeof i === 'object' ? `${i.name}:${i.count}` : i).join(', ');
                promptText = '输入物品（格式：物品名或物品名:数量，用逗号分隔）：';
                break;
        }
    }

    const input = prompt(promptText, currentValue);
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

// ==================== WORLD MAP ====================

function openMapModal() {
    document.getElementById('mapModal').classList.add('active');
    renderWorldMap();
}

function closeMapModal() {
    document.getElementById('mapModal').classList.remove('active');
}

function showMapList() {
    document.getElementById('mapContent').style.display = 'block';
    document.getElementById('mapLocationDetail').style.display = 'none';
}

function renderWorldMap() {
    const content = document.getElementById('mapContent');
    const detail = document.getElementById('mapLocationDetail');
    
    content.style.display = 'block';
    detail.style.display = 'none';
    
    if (!worldMapData || !worldMapData.locations || worldMapData.locations.length === 0) {
        content.innerHTML = `<div class="map-empty">
            <p>尚未生成地图</p>
            <button class="map-generate-btn" id="mapGenerateBtn" onclick="generateWorldMap()">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 2 L12 6 M12 18 L12 22 M4.93 4.93 L7.76 7.76 M16.24 16.24 L19.07 19.07 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                生成世界地图
            </button>
        </div>`;
        return;
    }
    
    let html = '<div class="map-grid">';
    worldMapData.locations.forEach((loc, index) => {
        html += `<div class="map-location" onclick="showLocationDetail(${index})">
            <div class="map-location-icon">${loc.icon || '📍'}</div>
            <div class="map-location-name">${escapeHtml(loc.name)}</div>
            <div class="map-location-type">${escapeHtml(loc.type || '')}</div>
            <div class="map-location-brief">${escapeHtml(loc.brief || '')}</div>
        </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
}

function showLocationDetail(index) {
    if (!worldMapData || !worldMapData.locations || !worldMapData.locations[index]) return;
    
    const loc = worldMapData.locations[index];
    const content = document.getElementById('mapContent');
    const detail = document.getElementById('mapLocationDetail');
    const title = document.getElementById('mapDetailTitle');
    const body = document.getElementById('mapDetailBody');
    
    content.style.display = 'none';
    detail.style.display = 'block';
    
    title.textContent = `${loc.icon || '📍'} ${loc.name}`;
    
    let html = '';
    
    if (loc.type) {
        html += `<div class="map-detail-section">
            <div class="map-detail-label">地点类型</div>
            <div class="map-detail-value">${escapeHtml(loc.type)}</div>
        </div>`;
    }
    
    if (loc.description) {
        html += `<div class="map-detail-section">
            <div class="map-detail-label">详细描述</div>
            <div class="map-detail-value">${escapeHtml(loc.description)}</div>
        </div>`;
    }
    
    if (loc.features) {
        html += `<div class="map-detail-section">
            <div class="map-detail-label">特色/特产</div>
            <div class="map-detail-value">${escapeHtml(loc.features)}</div>
        </div>`;
    }
    
    if (loc.inhabitants) {
        html += `<div class="map-detail-section">
            <div class="map-detail-label">居民/势力</div>
            <div class="map-detail-value">${escapeHtml(loc.inhabitants)}</div>
        </div>`;
    }
    
    if (loc.dangers) {
        html += `<div class="map-detail-section">
            <div class="map-detail-label">危险程度</div>
            <div class="map-detail-value">${escapeHtml(loc.dangers)}</div>
        </div>`;
    }
    
    body.innerHTML = html || '<div class="status-empty">暂无详细信息</div>';
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

async function generateWorldMap() {
    if (!apiSettings.baseUrl || !apiSettings.apiKey || !apiSettings.model) {
        showToast('请先在设置中配置API');
        return;
    }

    if (!chuanyueRulesData || !chuanyueRulesData.settings) {
        showToast('请先设置世界背景');
        return;
    }

    const content = document.getElementById('mapContent');
    content.innerHTML = `<div class="map-empty">
        <div class="loading-spinner" style="margin: 0 auto 16px;"></div>
        <p>正在生成世界地图...</p>
    </div>`;

    try {
        const worldInfo = chuanyueRulesData.settings;
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
                    { role: 'system', content: `你是一个世界地图设计师。根据世界设定生成主要地点信息。严格按JSON格式返回。` },
                    { role: 'user', content: `根据以下世界设定，生成6-8个主要地点：

世界背景：${worldInfo}
详细设定：${worldBuilding}

请生成适合该世界的主要地点，包括：
- 主城/都城
- 各大势力所在地
- 特殊场所（如修仙世界的灵脉/秘境，末世的安全区/废墟等）
- 危险区域

返回JSON格式：
{
  "locations": [
    {
      "name": "地点名称",
      "icon": "适合的emoji图标",
      "type": "地点类型（如：都城/门派/秘境/废墟等）",
      "brief": "一句话简介",
      "description": "详细描述（2-3句话）",
      "features": "特色、特产或资源",
      "inhabitants": "主要居民或势力",
      "dangers": "危险程度和注意事项"
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
            worldMapData = JSON.parse(jsonMatch[0]);
            localStorage.setItem(getStorageKey('worldMapData'), JSON.stringify(worldMapData));
            renderWorldMap();
            showToast('地图生成完成');
        } else {
            throw new Error('解析失败');
        }

    } catch (error) {
        console.error('Generate world map error:', error);
        showToast('生成失败: ' + error.message);
        renderWorldMap();
    }
}

function restartChuanyue() {
    const modeName = gameMode === 'kuaichuan' ? '快穿' : '穿越';
    if (!confirm(`确定要重新开始${modeName}模式吗？\n\n这将清空以下内容：\n• 聊天记录\n• 穿越人设\n• 世界设定\n• 故事总结`)) {
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
    renderProfile();
    closeProfileModal();
    showToast('人设已保存');
}

function renderProfile() {
    const profileBody = document.getElementById('profileBody');

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
    document.getElementById('statusRefreshBtn').addEventListener('click', refreshStatusByAI);

    // Status edit buttons
    document.querySelectorAll('.status-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editStatusSection(btn.dataset.section));
    });

    // Map button
    document.getElementById('btnMap').addEventListener('click', () => {
        closeBottomSheet();
        openMapModal();
    });

    // Map modal
    document.getElementById('mapModalClose').addEventListener('click', closeMapModal);
    document.getElementById('mapModal').addEventListener('click', (e) => {
        if (e.target.id === 'mapModal') closeMapModal();
    });
    document.getElementById('mapGenerateBtn').addEventListener('click', generateWorldMap);
    document.getElementById('mapBackBtn').addEventListener('click', showMapList);

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

function editMessage() {
    hideContextMenu();
    if (selectedMessageIndex < 0 || selectedMessageIndex >= chatHistory.length) return;
    
    const msg = chatHistory[selectedMessageIndex];
    if (msg.type !== 'user') {
        showToast('只能编辑用户消息');
        return;
    }
    
    const newContent = prompt('编辑消息：', msg.content);
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
    
    // 自动生成穿越人设（静默）
    await autoGenerateTransChar();
    
    // Generate opening scene
    await generateOpeningScene();
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
        
        // 处理性别设置
        let genderInfo = '';
        const userGender = characterProfile?.gender || '男';
        
        if (chuanyueRulesData?.genderSetting === 'random') {
            // 概率双性：为每个世界随机决定
            const world1Intersex = Math.random() < 0.3;
            const world2Intersex = Math.random() < 0.3;
            const world3Intersex = Math.random() < 0.3;
            genderInfo = `
【性别设定 - 概率双性模式】
用户原本性别：${userGender}
- 世界一：${world1Intersex ? '⚧️ 双性体质（同时拥有男女特征）' : `保持${userGender}性`}
- 世界二：${world2Intersex ? '⚧️ 双性体质（同时拥有男女特征）' : `保持${userGender}性`}
- 世界三：${world3Intersex ? '⚧️ 双性体质（同时拥有男女特征）' : `保持${userGender}性`}

请在用户身份中明确标注该世界的性别状态！`;
        } else {
            genderInfo = `\n用户性别：${userGender}（保持不变）`;
        }
        
        const userPrompt = `【系统启动】请生成三个可供选择的世界。

任务类型：${typeName}
当前是第 ${worldCount + 1} 个世界
${genderInfo}

请生成三个完全不同类型的世界供用户选择，每个世界必须包含：
1. 世界类型（如：古代宫廷/现代都市/修仙世界/末世/ABO/校园/娱乐圈等）
2. 世界简介（30-50字）
3. 世界设定（该世界的特殊规则、背景、势力等，50-80字）
4. 任务目标（根据${typeName}类型设计）
5. 用户身份（姓名、身份、与目标的关系${chuanyueRulesData?.genderSetting === 'random' ? '、性别状态' : ''}）
6. 目标角色（姓名、身份、性格、当前状态、需要${typeName}的原因）

请严格按以下格式返回：

【📢快穿系统】检测到三个位面波动，请选择目标世界：

【世界一】
🌍 类型：xxx
📖 简介：xxx
⚙️ 设定：xxx
🎯 任务：xxx
👤 你的身份：xxx${chuanyueRulesData?.genderSetting === 'random' ? '（注明性别状态）' : ''}
💫 目标角色：xxx（攻）- xxx

【世界二】
🌍 类型：xxx
📖 简介：xxx
⚙️ 设定：xxx
🎯 任务：xxx
👤 你的身份：xxx${chuanyueRulesData?.genderSetting === 'random' ? '（注明性别状态）' : ''}
💫 目标角色：xxx（攻）- xxx

【世界三】
🌍 类型：xxx
📖 简介：xxx
⚙️ 设定：xxx
🎯 任务：xxx
👤 你的身份：xxx${chuanyueRulesData?.genderSetting === 'random' ? '（注明性别状态）' : ''}
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
        const userPrompt = `请生成穿越故事的开场场景。

要求：
1. 首先生成当前场景的状态信息（JSON格式）
2. 然后生成开场描写（200-400字）

请严格按以下格式返回：
【状态】
{"date":"日期（如：天启三年二月初五）","time":"24小时制时间（古代请用时辰+括号说明，如：07:30（卯时三刻））","location":"地点","weather":"天气"}
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
        : `你是一个专业的互动小说AI，正在运行一个穿越题材的角色扮演游戏。

`;

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

    // 穿越后的角色设定（所有模式）
    if (transCharData && transCharData.name) {
        const identityLabel = isKuaichuan ? '本世界身份' : '穿越后身份';
        prompt += `\n【${identityLabel}】\n`;
        prompt += `身份：${transCharData.name}\n`;
        if (transCharData.background) prompt += `背景：${transCharData.background}\n`;
        if (transCharData.situation) prompt += `当前处境：${transCharData.situation}\n`;
        if (transCharData.ability) prompt += `特殊能力/金手指：${transCharData.ability}\n`;
        if (transCharData.notes) prompt += `备注：${transCharData.notes}\n`;
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
        if (chuanyueRulesData.genderSetting === 'random') {
            prompt += `\n【性别设定】用户选择了"概率双性"，有一定概率在故事中变为双性体质。\n`;
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
    
    if (chatHistory.length === 0) {
        showToast('请先发送消息');
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
        
        // Add chat history (last 15 messages)
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

// Initialize
init();
