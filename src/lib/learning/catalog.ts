export type LearningTrack = "general" | "k3" | "manufacturing"

export interface LearningLesson {
  slug: string
  title: string
  summary: string
  skills: string[]
  duration: string
  exercise: string
}

export interface LearningModule {
  slug: string
  title: string
  months: string
  description: string
  outcome: string
  lessons: LearningLesson[]
}

export interface MiniPractice {
  slug: string
  title: string
  category: "python" | "data" | "agent" | "engineering"
  summary: string
  prerequisites: string[]
  deliverable: string
  duration: string
}

export interface ProjectGuide {
  businessBackground: string
  kpi: string
  roles: string
  dataContract: string
  buildSteps: string[]
  tests: string[]
  uat: string[]
  runbook: string[]
  troubleshooting: string[]
  extension: string
}

export interface EnterpriseProject {
  slug: string
  number: number
  track: LearningTrack
  title: string
  outcome: string
  summary: string
  prerequisites: string[]
  duration: string
  isGraduationRequired: boolean
  guide: ProjectGuide
}

export interface GraduationStatus {
  accepted: number
  required: number
  graduated: boolean
}

export const sourceLinks = [
  { title: "Runoob Python 3 教程", href: "https://www.runoob.com/python3/python3-tutorial.html" },
  { title: "Python 官方教程", href: "https://docs.python.org/3/tutorial/" },
  { title: "CS50P", href: "https://cs50.harvard.edu/python/" },
  { title: "Automate the Boring Stuff", href: "https://automatetheboringstuff.com/" },
  { title: "Google Python Class", href: "https://developers.google.com/edu/python" },
  { title: "FastAPI 文档", href: "https://fastapi.tiangolo.com/" },
  { title: "Runoob AI Agent 教程", href: "https://www.runoob.com/ai-agent/ai-agent-tutorial.html" },
  { title: "Hugging Face Agents Course", href: "https://huggingface.co/learn/agents-course/" },
  { title: "LangChain 文档", href: "https://python.langchain.com/docs/introduction/" },
  { title: "LangGraph 文档", href: "https://langchain-ai.github.io/langgraph/" },
  { title: "MCP 文档", href: "https://modelcontextprotocol.io/docs/getting-started/intro" },
  { title: "OWASP GenAI 安全指南", href: "https://genai.owasp.org/" },
]

export const learningModules: LearningModule[] = [
  {
    slug: "python-start",
    title: "Python 起步与编程思维",
    months: "第 1–4 月",
    description: "从电脑、编辑器和终端开始，用小程序理解变量、判断、循环与函数。",
    outcome: "能独立写出可读、可调试的命令行程序。",
    lessons: [
      { slug: "python-environment", title: "搭建第一个 Python 环境", summary: "认识解释器、终端和脚本文件。", skills: ["python-basics"], duration: "45 分钟", exercise: "打印一张自己的学习名片" },
      { slug: "python-values", title: "变量、数据类型与输入", summary: "把现实世界的信息放进程序。", skills: ["python-basics"], duration: "60 分钟", exercise: "制作订单金额计算器" },
      { slug: "python-branches", title: "条件判断与循环", summary: "让程序能根据情况反复做事。", skills: ["python-control"], duration: "75 分钟", exercise: "制作质检结果分类器" },
      { slug: "python-functions", title: "函数与可读代码", summary: "把重复业务规则整理为可复用函数。", skills: ["python-functions"], duration: "75 分钟", exercise: "拆分交期提醒规则" },
    ],
  },
  {
    slug: "python-engineering",
    title: "Python 完整基础与工程习惯",
    months: "第 5–7 月",
    description: "掌握集合、文件、异常、模块、面向对象、虚拟环境与测试。",
    outcome: "能把脚本整理为可交付的小工具。",
    lessons: [
      { slug: "python-collections", title: "列表、字典与数据整理", summary: "用合适的数据结构组织业务记录。", skills: ["python-collections"], duration: "90 分钟", exercise: "整理供应商交付记录" },
      { slug: "python-files", title: "文件、CSV 与异常处理", summary: "稳妥读取现实文件并给出可理解错误。", skills: ["python-files"], duration: "90 分钟", exercise: "清洗物料清单 CSV" },
      { slug: "python-modules", title: "模块、虚拟环境与依赖", summary: "让项目在另一台电脑也能可靠运行。", skills: ["python-modules"], duration: "75 分钟", exercise: "创建可复用报表工具包" },
      { slug: "python-quality", title: "测试、日志与调试", summary: "用测试保证业务规则没有被改坏。", skills: ["python-testing"], duration: "90 分钟", exercise: "为库存预警规则写测试" },
    ],
  },
  {
    slug: "data-service",
    title: "数据、接口与后端服务",
    months: "第 8–10 月",
    description: "学习 HTTP、JSON、SQL、FastAPI、鉴权和 Docker，把脚本变成服务。",
    outcome: "能开发安全的只读业务接口并部署到内部环境。",
    lessons: [
      { slug: "http-json", title: "HTTP、JSON 与第三方接口", summary: "理解请求、响应、状态码和超时。", skills: ["http-json"], duration: "90 分钟", exercise: "读取模拟交付状态接口" },
      { slug: "sql-basics", title: "SQL 与业务数据口径", summary: "先理解数据口径，再写只读查询。", skills: ["sql-basics"], duration: "90 分钟", exercise: "查询订单交期风险" },
      { slug: "fastapi-basics", title: "FastAPI 服务与接口文档", summary: "把 Python 能力变成团队可调用的服务。", skills: ["fastapi"], duration: "120 分钟", exercise: "发布只读库存查询接口" },
      { slug: "docker-basics", title: "Docker 与内部部署", summary: "封装运行环境和健康检查。", skills: ["docker"], duration: "90 分钟", exercise: "容器化报表服务" },
    ],
  },
  {
    slug: "llm-foundation",
    title: "大模型、提示词与知识检索",
    months: "第 11–14 月",
    description: "从本地模拟器到本地 PyCharm 配置真实模型，建立可评测的对话与 RAG。",
    outcome: "能做出有引用、可复核的企业知识应用。",
    lessons: [
      { slug: "llm-api", title: "调用大模型与会话状态", summary: "理解消息、参数、费用和失败重试。", skills: ["llm-api"], duration: "90 分钟", exercise: "制作基础聊天机器人" },
      { slug: "prompting", title: "提示词与结构化输出", summary: "让模型稳定输出可被程序使用的结果。", skills: ["prompting"], duration: "90 分钟", exercise: "提取采购申请字段" },
      { slug: "embeddings", title: "Embedding、切分与检索", summary: "把文档变成可查、可引用的知识片段。", skills: ["embeddings", "rag"], duration: "120 分钟", exercise: "检索制度条款并附来源" },
      { slug: "rag-evaluation", title: "RAG 评测与安全边界", summary: "发现答非所问、幻觉与提示注入。", skills: ["evaluation", "security"], duration: "90 分钟", exercise: "建立 20 条知识库评测集" },
    ],
  },
  {
    slug: "agent-engineering",
    title: "Agent 工程化与受控执行",
    months: "第 15–18 月",
    description: "学习工具调用、工作流、MCP、审批、日志、评测与服务监控。",
    outcome: "能交付默认只读、人工审批后写入的企业 Agent。",
    lessons: [
      { slug: "tool-calling", title: "工具调用与业务校验", summary: "把模型建议和确定性业务规则分开。", skills: ["tool-calling"], duration: "120 分钟", exercise: "生成审批草稿预览" },
      { slug: "agent-workflow", title: "工作流与失败恢复", summary: "用状态机记录每一步和可恢复状态。", skills: ["agent-workflow"], duration: "120 分钟", exercise: "搭建工单升级流程" },
      { slug: "mcp", title: "MCP 与企业工具边界", summary: "在受控权限内向 Agent 暴露业务能力。", skills: ["mcp"], duration: "90 分钟", exercise: "设计只读订单查询工具" },
      { slug: "observability", title: "评测、审计与可观测性", summary: "让系统能解释、追踪和持续改进。", skills: ["observability"], duration: "90 分钟", exercise: "记录一次 Agent 决策链路" },
    ],
  },
  {
    slug: "agent-graduation",
    title: "通用 Agent 毕业项目",
    months: "第 19–22 月",
    description: "完成十个公司可用的基础 Agent 产品，形成上岗作品集。",
    outcome: "完成唯一毕业硬门槛。",
    lessons: [
      { slug: "delivery-discovery", title: "业务调研与 KPI", summary: "先定义业务负责人、范围和成功标准。", skills: ["delivery-discovery"], duration: "60 分钟", exercise: "写一页项目立项卡" },
      { slug: "delivery-uat", title: "UAT 与上线运行手册", summary: "把代码交给业务用户可验证、可使用。", skills: ["delivery-uat"], duration: "75 分钟", exercise: "完成一份上线检查清单" },
    ],
  },
  {
    slug: "k3-specialist",
    title: "金蝶云星空专项",
    months: "第 23–28 月",
    description: "围绕云星空主数据、供应链、制造、质量、审批和集成做 AI 二开。",
    outcome: "形成金蝶 AI Agent 专项作品集。",
    lessons: [
      { slug: "k3-governance", title: "云星空接口与数据治理", summary: "先核验数据字典与授权接口，再设计 Agent。", skills: ["k3-domain"], duration: "90 分钟", exercise: "建立字段核验清单" },
      { slug: "k3-safe-actions", title: "审批后写入与集成补偿", summary: "避免 AI 绕过业务权限或直接修改生产数据。", skills: ["k3-safe-action"], duration: "90 分钟", exercise: "设计单据草稿审批流" },
    ],
  },
  {
    slug: "manufacturing-erp",
    title: "离散制造 ERP 实战",
    months: "第 29–36 月",
    description: "连接需求、工程、采购、生产、质量、成本和交付，形成制造决策闭环。",
    outcome: "形成面向制造企业的独立交付作品库。",
    lessons: [
      { slug: "manufacturing-process", title: "离散制造业务全链路", summary: "从供产销质库存理解项目的真实上下游。", skills: ["manufacturing-domain"], duration: "90 分钟", exercise: "绘制订单到交付流程图" },
      { slug: "manufacturing-uat", title: "跨系统 UAT 与运营闭环", summary: "让 ERP、PLM、MES、WMS、QMS 的数据和责任闭环。", skills: ["manufacturing-uat"], duration: "90 分钟", exercise: "设计异常闭环看板" },
    ],
  },
]

export const miniPractices: MiniPractice[] = [
  { slug: "welcome-card", title: "学习名片生成器", category: "python", summary: "读取输入并输出格式化自我介绍。", prerequisites: ["python-basics"], deliverable: "命令行脚本", duration: "30 分钟" },
  { slug: "expense-calculator", title: "费用计算器", category: "python", summary: "把数量、单价和税率变成明确金额。", prerequisites: ["python-basics"], deliverable: "带输入校验的脚本", duration: "45 分钟" },
  { slug: "quality-classifier", title: "质检结果分类器", category: "python", summary: "根据规则输出合格、复检或不合格。", prerequisites: ["python-control"], deliverable: "规则程序", duration: "45 分钟" },
  { slug: "delivery-reminder", title: "交期提醒器", category: "python", summary: "循环判断多个订单的交付风险。", prerequisites: ["python-control"], deliverable: "风险列表", duration: "60 分钟" },
  { slug: "material-dictionary", title: "物料字典查询器", category: "python", summary: "按编码快速读取物料信息。", prerequisites: ["python-collections"], deliverable: "字典查询脚本", duration: "45 分钟" },
  { slug: "supplier-ranking", title: "供应商评分器", category: "python", summary: "从记录中计算透明的供应商评分。", prerequisites: ["python-functions", "python-collections"], deliverable: "可复用函数", duration: "60 分钟" },
  { slug: "csv-cleaner", title: "CSV 数据清洗器", category: "python", summary: "清理空行、重复编码和不规范日期。", prerequisites: ["python-files", "python-collections"], deliverable: "清洗后的 CSV", duration: "75 分钟" },
  { slug: "exception-journal", title: "异常日志记录器", category: "python", summary: "在失败时保存可定位的问题信息。", prerequisites: ["python-files"], deliverable: "日志文件", duration: "45 分钟" },
  { slug: "inventory-alert", title: "库存预警规则包", category: "python", summary: "把预警阈值放进可测试函数。", prerequisites: ["python-testing", "python-functions"], deliverable: "测试通过的规则包", duration: "75 分钟" },
  { slug: "report-exporter", title: "日报导出器", category: "python", summary: "把汇总结果导出为业务可读文件。", prerequisites: ["python-files", "python-testing"], deliverable: "日报脚本", duration: "75 分钟" },
  { slug: "delivery-api-reader", title: "交付状态接口读取器", category: "data", summary: "安全读取模拟 HTTP 接口并处理超时。", prerequisites: ["http-json"], deliverable: "API 客户端", duration: "60 分钟" },
  { slug: "json-normalizer", title: "JSON 订单标准化器", category: "data", summary: "把不一致接口返回转为统一对象。", prerequisites: ["http-json", "python-functions"], deliverable: "转换函数", duration: "60 分钟" },
  { slug: "order-query", title: "订单只读查询器", category: "data", summary: "用参数化 SQL 查询订单状态。", prerequisites: ["sql-basics"], deliverable: "只读查询", duration: "75 分钟" },
  { slug: "risk-dashboard-api", title: "交期风险 API", category: "data", summary: "把规则结果封装为 FastAPI 接口。", prerequisites: ["fastapi", "sql-basics"], deliverable: "带接口文档的服务", duration: "90 分钟" },
  { slug: "internal-healthcheck", title: "内部服务健康检查", category: "data", summary: "为业务工具添加可观测健康端点。", prerequisites: ["fastapi"], deliverable: "健康检查 API", duration: "45 分钟" },
  { slug: "report-service-container", title: "报表服务容器化", category: "data", summary: "将现有 FastAPI 服务放进可重复运行容器。", prerequisites: ["docker", "fastapi"], deliverable: "Docker 镜像配置", duration: "75 分钟" },
  { slug: "llm-chatbot", title: "基础聊天机器人", category: "agent", summary: "做出能保持对话上下文的本地聊天服务。", prerequisites: ["python-basics", "http-json", "llm-api"], deliverable: "聊天机器人", duration: "120 分钟" },
  { slug: "structured-extractor", title: "采购字段提取器", category: "agent", summary: "把自然语言转为待校验的结构化字段。", prerequisites: ["llm-api", "prompting"], deliverable: "JSON 提取器", duration: "90 分钟" },
  { slug: "meeting-summary", title: "会议纪要助手", category: "agent", summary: "提取结论、责任人和截止日。", prerequisites: ["llm-api", "prompting"], deliverable: "纪要生成服务", duration: "90 分钟" },
  { slug: "citation-search", title: "带引用的制度检索", category: "agent", summary: "每条回答都附原文片段。", prerequisites: ["embeddings", "rag"], deliverable: "检索问答原型", duration: "120 分钟" },
  { slug: "enterprise-rag", title: "小型企业知识助手", category: "agent", summary: "导入 20 篇文档并用评测集验证回答。", prerequisites: ["rag", "evaluation", "security"], deliverable: "RAG 小应用", duration: "180 分钟" },
  { slug: "approval-draft", title: "审批草稿助手", category: "agent", summary: "生成草稿而不是直接提交业务单据。", prerequisites: ["tool-calling", "prompting"], deliverable: "审批预览页", duration: "120 分钟" },
  { slug: "ticket-router", title: "工单分流助手", category: "agent", summary: "依据问题类型分流并提供依据。", prerequisites: ["tool-calling", "agent-workflow"], deliverable: "工单路由器", duration: "120 分钟" },
  { slug: "read-only-order-tool", title: "只读订单查询工具", category: "agent", summary: "把权限控制封装在工具层。", prerequisites: ["mcp", "sql-basics"], deliverable: "MCP 工具设计", duration: "90 分钟" },
  { slug: "agent-audit-log", title: "Agent 决策审计日志", category: "agent", summary: "保存输入、工具、结果与人工确认。", prerequisites: ["observability", "agent-workflow"], deliverable: "审计记录", duration: "90 分钟" },
  { slug: "rag-red-team", title: "知识库安全演练", category: "agent", summary: "用提示注入和越权问题检验防线。", prerequisites: ["security", "evaluation"], deliverable: "安全评测报告", duration: "90 分钟" },
  { slug: "project-readme", title: "项目交付 README", category: "engineering", summary: "让同事能独立安装、运行和验证项目。", prerequisites: ["python-modules"], deliverable: "运行手册", duration: "60 分钟" },
  { slug: "api-contract", title: "业务接口契约", category: "engineering", summary: "明确输入、输出、权限和失败返回。", prerequisites: ["fastapi", "delivery-discovery"], deliverable: "接口契约", duration: "75 分钟" },
  { slug: "uat-checklist", title: "业务 UAT 清单", category: "engineering", summary: "把可用定义为业务场景和验收证据。", prerequisites: ["delivery-uat"], deliverable: "UAT 文档", duration: "60 分钟" },
  { slug: "release-runbook", title: "内部上线运行手册", category: "engineering", summary: "记录发布、回滚、告警与联系人。", prerequisites: ["docker", "observability", "delivery-uat"], deliverable: "运行手册", duration: "90 分钟" },
]

interface ProjectSeed {
  title: string
  outcome: string
  summary: string
  prerequisites: string[]
  data: string
  action: string
  kpi: string
  safety: string
}

/** XMZADD 20260819 根据项目业务目标生成统一的企业交付教程骨架。 */
function createProject(track: LearningTrack, number: number, seed: ProjectSeed): EnterpriseProject {
  const trackLabel = track === "general" ? "通用 Agent" : track === "k3" ? "金蝶云星空" : "制造 ERP"

  return {
    slug: `${track}-${String(number).padStart(2, "0")}`,
    number,
    track,
    title: seed.title,
    outcome: seed.outcome,
    summary: seed.summary,
    prerequisites: seed.prerequisites,
    duration: track === "manufacturing" ? "24–36 小时" : "18–30 小时",
    isGraduationRequired: track === "general",
    guide: {
      businessBackground: `${trackLabel}项目：${seed.summary}。先和业务负责人确认只解决一个可度量问题，不以“模型效果看起来不错”代替价值。`,
      kpi: seed.kpi,
      roles: "业务负责人确认范围与验收；数据负责人提供脱敏样本；开发者实现服务与审计；最终使用者在 UAT 中确认结果。",
      dataContract: `输入仅使用${seed.data}。输出必须包含结论、依据、置信提示和下一步建议；${seed.safety}`,
      buildSteps: [
        `完成一页项目立项卡：用户、痛点、输入、输出、${seed.kpi}与明确排除项。`,
        `用脱敏样本建立最小数据集，为${seed.title}写出可重复的规则基线。`,
        "实现只读数据/工具层，先测试权限、参数校验、超时和空结果，不让模型直接接触生产写入权限。",
        `接入模型能力，执行${seed.action}，并将模型结果与确定性规则结果并列展示。`,
        "建立失败场景、人工复核、审计日志和回退路径；通过 UAT 后再编写部署运行手册。",
      ],
      tests: [
        "正常输入得到带依据的可读结果。",
        "缺少数据、权限不足、接口超时和模型失败均返回可操作提示。",
        "越权指令、提示注入和写入请求不会绕过人工确认。",
        "业务规则基线与 Agent 建议在评测样本上可追溯比较。",
      ],
      uat: [
        "业务负责人使用真实脱敏场景完成验收并确认 KPI。",
        "数据负责人确认字段口径、权限和脱敏范围。",
        "使用者能在不依赖开发者的情况下完成一次完整操作。",
        "发生错误时按运行手册完成停用、回退和问题留痕。",
      ],
      runbook: [
        "记录环境变量名称，不保存模型、接口或数据库密钥。",
        "记录健康检查、日志位置、评测集版本和责任人。",
        "写入或流程提交必须先展示预览，确认后才调用受权接口。",
      ],
      troubleshooting: [
        "回答没有依据：检查数据切分、检索结果和引用映射。",
        "建议不稳定：先缩小任务、补充结构化约束与规则基线。",
        "结果不符合业务口径：回到数据契约，由业务负责人确认口径。",
      ],
      extension: "完成首版后，补充真实 UAT 反馈、离线评测集和运营看板，再扩展到下一个受控业务场景。",
    },
  }
}

const generalSeeds: ProjectSeed[] = [
  { title: "企业知识库问答系统", outcome: "有引用、权限与评测的制度/SOP/资料问答服务", summary: "让员工快速找到可信制度和技术资料，而不是依赖未经验证的模型回答。", prerequisites: ["rag", "evaluation", "security", "fastapi"], data: "经授权的制度、SOP、产品与技术资料", action: "检索、引用并解释资料条款", kpi: "关键问题回答有依据率与业务采纳率", safety: "回答无依据时必须明确说明无法确认。" },
  { title: "智能客服与工单助手", outcome: "自动答复、转人工与完整工单上下文", summary: "处理常见客户问题并将复杂问题带着上下文交给人工。", prerequisites: ["rag", "tool-calling", "agent-workflow"], data: "FAQ、服务规则与脱敏历史工单", action: "答复、分类并生成工单草稿", kpi: "首次响应时间、转人工信息完整率与人工修订率", safety: "不承诺未在知识库中明确的服务条款。" },
  { title: "合同/发票/表单智能审查", outcome: "文档提取、规则校验与人工校对队列", summary: "把重复文档阅读变成可审阅的结构化流程。", prerequisites: ["prompting", "tool-calling", "evaluation"], data: "脱敏合同、发票、申请表与校验规则", action: "提取字段、检查缺失和标记风险", kpi: "字段提取准确率与人工校对节省时间", safety: "不替代法务或财务最终判断。" },
  { title: "自然语言数据查询与报表助手", outcome: "受控只读查询、图表与业务口径解释", summary: "让管理者通过自然语言获得受控的经营数据答案。", prerequisites: ["sql-basics", "tool-calling", "security", "fastapi"], data: "已定义语义层的脱敏只读业务数据", action: "生成受控查询、解释口径并展示结果", kpi: "查询正确率、口径争议率与自助分析比例", safety: "仅允许白名单指标和参数化只读查询。" },
  { title: "会议纪要与任务跟进助手", outcome: "纪要、责任人、截止日与催办闭环", summary: "把会议讨论转成可确认、可跟踪的行动事项。", prerequisites: ["llm-api", "prompting", "tool-calling"], data: "经参会人确认的文本或转写稿", action: "整理结论、责任人和任务草稿", kpi: "任务遗漏率与会后确认时长", safety: "任务创建前必须由会议主持人确认。" },
  { title: "销售线索与客户跟进助手", outcome: "客户上下文、行动建议与 CRM 审批写入", summary: "帮助销售将分散沟通转化为明确跟进行动。", prerequisites: ["rag", "tool-calling", "agent-workflow"], data: "脱敏客户档案、沟通记录与销售规则", action: "归纳风险、建议下一步并创建草稿", kpi: "跟进及时率与人工接受建议比例", safety: "CRM 写入仅允许审批后的草稿提交。" },
  { title: "审批与业务申请助手", outcome: "申请草稿、规则校验与审批后流转", summary: "减少申请人填表负担，同时保留完整审批控制。", prerequisites: ["tool-calling", "agent-workflow", "security"], data: "申请规则、字段说明和用户输入", action: "生成表单草稿并校验必填规则", kpi: "退单率与填报耗时", safety: "系统只生成草稿，禁止 Agent 直接提交审批。" },
  { title: "企业内部服务台助手", outcome: "IT、行政、人事请求的分类、检索与分派", summary: "统一内部服务入口，缩短问题定位与分派时间。", prerequisites: ["rag", "tool-calling", "agent-workflow"], data: "服务目录、SLA、知识库和脱敏工单", action: "分类、推荐知识和生成服务单", kpi: "首次解决率、分派准确率与 SLA 达标率", safety: "敏感人事信息必须按角色隔离。" },
  { title: "运营异常预警与分析助手", outcome: "指标异常、原因解释、待办与日报", summary: "把异常数字转化为负责人能处理的行动清单。", prerequisites: ["sql-basics", "tool-calling", "evaluation"], data: "脱敏指标、阈值规则和责任映射", action: "识别异常、解释可能原因并形成待办", kpi: "有效预警率、处理及时率与误报率", safety: "模型结论必须标为建议，并展示规则依据。" },
  { title: "跨系统业务流程助手", outcome: "邮件/表单/文档审核后受控同步业务系统", summary: "把跨系统重复录入变成可预览、可审计的协同流程。", prerequisites: ["fastapi", "tool-calling", "agent-workflow", "observability"], data: "经授权的表单、邮件、文档和目标系统接口", action: "提取信息、校验、预览并在确认后同步", kpi: "人工录入耗时、同步成功率与回退成功率", safety: "每次写入都要幂等键、用户确认和审计记录。" },
]

const k3Seeds: ProjectSeed[] = [
  { title: "业务对象与单据智能助手", outcome: "单据、字段、流程的可追溯问答", summary: "为金蝶二开和业务人员减少对象、字段和流程查找成本。", prerequisites: ["k3-domain", "rag", "security"], data: "经正确编码读取并核验的云星空字典、现有二开文档", action: "定位对象并引用核验来源", kpi: "字段解释可追溯率与定位耗时", safety: "未核验字段一律标为待确认，不生成生产 SQL。" },
  { title: "主数据质量治理助手", outcome: "主数据重复、缺失与异常编码治理清单", summary: "把主数据问题在业务影响扩大前转化为审核任务。", prerequisites: ["k3-domain", "sql-basics", "evaluation"], data: "测试账套或脱敏主数据", action: "发现重复、缺失和异常规则命中", kpi: "问题发现准确率与治理闭环率", safety: "仅输出候选清单，不直接修改主数据。" },
  { title: "BOM 与工程变更影响分析助手", outcome: "订单、库存、采购、工单影响评估", summary: "让工程变更在生效前就看到供应链和生产影响。", prerequisites: ["k3-domain", "manufacturing-domain", "tool-calling"], data: "测试账套 BOM、变更、订单、库存和工单数据", action: "追踪关联对象并形成影响报告", kpi: "影响覆盖率与变更漏评率", safety: "变更建议必须由工程和计划负责人审批。" },
  { title: "销售订单交期风险助手", outcome: "风险识别与责任处置清单", summary: "连接订单、库存、采购和生产信息预警交期风险。", prerequisites: ["k3-domain", "sql-basics", "agent-workflow"], data: "测试账套销售订单及相关供应数据", action: "识别风险并分派处置建议", kpi: "提前识别率与按期交付改善", safety: "交期承诺仍由授权业务角色确认。" },
  { title: "MRP 异常处置助手", outcome: "缺料、超储、冲突根因与建议", summary: "解释计划异常而不是黑箱式替代计划人员判断。", prerequisites: ["k3-domain", "manufacturing-domain", "evaluation"], data: "测试账套计划、库存、BOM和提前期数据", action: "归因并排序处置选项", kpi: "计划员采纳率与异常处理周期", safety: "禁止直接改写 MRP 计算结果。" },
  { title: "采购执行与供应商风险助手", outcome: "交期、价格、质量风险与催料建议", summary: "使采购人员优先处理真正影响生产和交付的事项。", prerequisites: ["k3-domain", "agent-workflow", "tool-calling"], data: "测试账套采购、来料、供应商和订单数据", action: "生成催料、升级或替代建议", kpi: "逾期处置及时率与缺料影响下降", safety: "供应商沟通内容需采购员确认后发送。" },
  { title: "库存差异与呆滞料分析助手", outcome: "盘点、调拨、处置候选清单", summary: "将库存账实差异和呆滞风险变成可审核行动。", prerequisites: ["k3-domain", "sql-basics", "evaluation"], data: "测试账套库存、单据流和物料状态", action: "交叉核对并输出处理候选", kpi: "盘点差异定位时长与呆滞处置闭环率", safety: "调拨、报废和调整只能生成人工审批草稿。" },
  { title: "质量异常与退货闭环助手", outcome: "质量、退货、供应商整改闭环", summary: "关联检验、退货和供应商整改，避免质量信息断裂。", prerequisites: ["k3-domain", "manufacturing-domain", "agent-workflow"], data: "测试账套质量、退货与供应商记录", action: "生成整改、验证与升级任务", kpi: "质量闭环周期与重复问题率", safety: "质量结论须由质量角色确认。" },
  { title: "审批单据智能填报与校验助手", outcome: "单据草稿、规则校验与人工审批", summary: "辅助填报业务单据而不绕过云星空审批控制。", prerequisites: ["k3-domain", "tool-calling", "k3-safe-action"], data: "已授权单据字段、规则和用户输入", action: "生成草稿并完成字段校验", kpi: "填报耗时、退单率与字段完整率", safety: "仅通过已授权接口生成草稿，确认后才允许提交。" },
  { title: "云星空集成运行健康助手", outcome: "同步失败、重复、延迟、差异定位与补偿", summary: "提升外部系统与云星空集成的可观测性和可恢复性。", prerequisites: ["k3-domain", "observability", "agent-workflow"], data: "脱敏集成日志、消息状态与测试接口", action: "归类失败、提出补偿步骤并记录审计", kpi: "故障发现时长、补偿成功率与重复处理率", safety: "补偿操作必须使用幂等键并经运维确认。" },
]

const manufacturingSeeds: ProjectSeed[] = [
  { title: "需求预测偏差分析助手", outcome: "滚动需求修正建议", summary: "解释预测、订单与实际消耗的差异并支持计划修正。", prerequisites: ["manufacturing-domain", "sql-basics", "evaluation"], data: "脱敏预测、订单、历史消耗和季节性数据", action: "计算偏差并给出复核建议", kpi: "预测偏差改善和计划采纳率", safety: "不自动替换计划预测。" },
  { title: "销售订单交期承诺助手", outcome: "可解释承诺日期", summary: "综合库存、产能、齐套和在制状态帮助销售做承诺。", prerequisites: ["manufacturing-domain", "tool-calling", "agent-workflow"], data: "订单、库存、产能、在制和物料齐套数据", action: "计算承诺候选并解释约束", kpi: "承诺准确率与延期沟通提前量", safety: "最终承诺由销售与计划授权人员确认。" },
  { title: "BOM/ECN 全链路影响分析", outcome: "订单、替代料、库存、采购、工单影响报告", summary: "在工程变更前识别受影响的离散制造业务链路。", prerequisites: ["manufacturing-domain", "k3-domain", "tool-calling"], data: "BOM、ECN、库存、采购、工单和订单数据", action: "追踪影响范围并生成处置清单", kpi: "变更影响覆盖率和停线风险下降", safety: "不得自动生效任何工程变更。" },
  { title: "MRP 缺料根因与处置助手", outcome: "缺料根因和处置排序", summary: "把缺料拆解为需求、供应、库存、BOM和提前期根因。", prerequisites: ["manufacturing-domain", "sql-basics", "agent-workflow"], data: "MRP、库存、采购、BOM和提前期数据", action: "分析根因并生成处置任务", kpi: "缺料处理周期和停工损失下降", safety: "计划调整需要计划员审批。" },
  { title: "替代料与停产料决策助手", outcome: "受控替代建议", summary: "同时校验技术、质量、库存和采购约束，避免单维替代。", prerequisites: ["manufacturing-domain", "evaluation", "tool-calling"], data: "物料、替代关系、质量、库存和供应数据", action: "生成替代候选与风险说明", kpi: "替代决策周期和一次通过率", safety: "替代启用必须经过工程与质量批准。" },
  { title: "供应商交付与质量评分助手", outcome: "可复核供应商评分", summary: "结合交期、来料质量、价格和响应表现指导供应商管理。", prerequisites: ["manufacturing-domain", "sql-basics", "evaluation"], data: "采购、到货、检验、价格与沟通记录", action: "计算评分并解释变化", kpi: "评分一致性和供应商改善闭环率", safety: "评分规则、权重和原始证据必须可查看。" },
  { title: "采购催料与升级协同助手", outcome: "催料、升级、替代和计划调整待办", summary: "按生产影响优先级组织采购催料与跨部门协同。", prerequisites: ["manufacturing-domain", "agent-workflow", "tool-calling"], data: "采购订单、缺料、生产计划和供应商数据", action: "排序风险并生成协同草稿", kpi: "催料及时率和关键缺料关闭率", safety: "对外沟通和订单变更必须人工确认。" },
  { title: "来料质量异常闭环助手", outcome: "检验、整改、退货与验证闭环", summary: "让来料不合格问题按责任、时限和验证完整闭环。", prerequisites: ["manufacturing-domain", "agent-workflow", "evaluation"], data: "来料检验、不合格、退货和整改记录", action: "建立 CAPA 任务和验证提醒", kpi: "关闭周期与重复不合格率", safety: "让步接收需质量授权。" },
  { title: "呆滞/超储库存处置助手", outcome: "消耗、调拨、退货、报废候选清单", summary: "区分库存可用性和处置路径，降低呆滞占用。", prerequisites: ["manufacturing-domain", "sql-basics", "evaluation"], data: "库存、需求、订单、寿命和物料状态", action: "识别候选并给出证据", kpi: "呆滞金额下降与建议采纳率", safety: "仅输出建议，不进行库存调整。" },
  { title: "齐套与备料就绪助手", outcome: "开工前缺件、错料、批次和库位风险清单", summary: "让车间在开工前知道真正影响齐套的问题。", prerequisites: ["manufacturing-domain", "tool-calling", "agent-workflow"], data: "生产订单、库存、批次、库位和领料数据", action: "检查齐套并安排备料优先级", kpi: "因缺料停工次数和备料及时率", safety: "领料和调拨只生成待办。" },
  { title: "排产与产能瓶颈分析助手", outcome: "瓶颈、产能冲突和调整方案", summary: "帮助计划员识别延期传播和关键工作中心冲突。", prerequisites: ["manufacturing-domain", "evaluation", "agent-workflow"], data: "工单、工艺、工作中心、产能和排程数据", action: "分析瓶颈并模拟调整建议", kpi: "计划达成率和瓶颈处置时长", safety: "不自动发布排程。" },
  { title: "生产订单进度异常助手", outcome: "停滞、延期、超领料异常与责任分派", summary: "将生产执行异常及时推送给正确责任人。", prerequisites: ["manufacturing-domain", "sql-basics", "agent-workflow"], data: "工单、报工、领料、工序和状态数据", action: "检测异常并生成处置任务", kpi: "异常发现时效和订单按期完成率", safety: "异常判定必须可回看原始单据。" },
  { title: "报工可信度与工时异常助手", outcome: "异常报工、工时偏差和不一致核验", summary: "发现实际生产数据中需要主管复核的可信度问题。", prerequisites: ["manufacturing-domain", "evaluation", "security"], data: "报工、工时、完工、领料和设备记录", action: "识别偏差并生成核验清单", kpi: "异常核验命中率与数据及时性", safety: "不直接修改报工或工时。" },
  { title: "设备点检与维修计划助手", outcome: "受控维修窗口和点检计划", summary: "结合设备告警、保养计划和生产安排减少意外停机。", prerequisites: ["manufacturing-domain", "agent-workflow", "tool-calling"], data: "设备、点检、告警、保养和排程数据", action: "推荐维修窗口并创建待审批任务", kpi: "计划外停机时长与点检完成率", safety: "维修计划需设备与生产负责人共同确认。" },
  { title: "过程质量异常与 CAPA 助手", outcome: "不良趋势、纠正预防和验证任务", summary: "让过程质量异常不仅被发现，还能验证改善是否有效。", prerequisites: ["manufacturing-domain", "evaluation", "agent-workflow"], data: "过程检验、不良、工艺、设备和 CAPA 数据", action: "识别趋势并组织 CAPA 草稿", kpi: "重复不良率和 CAPA 验证及时率", safety: "根因仅为假设，需质量团队验证。" },
  { title: "批次/序列号质量追溯助手", outcome: "供应商、物料、工序、设备和客户影响范围", summary: "在质量事件出现时快速锁定受影响范围和处置顺序。", prerequisites: ["manufacturing-domain", "k3-domain", "tool-calling"], data: "批次、序列号、检验、生产、发运和客户数据", action: "沿追溯链定位影响对象", kpi: "追溯完成时长和范围准确率", safety: "隔离、召回和客户通知必须按授权流程执行。" },
  { title: "制造成本偏差解释助手", outcome: "料工费、损耗偏差与改善事项", summary: "将成本数字还原为可被责任部门行动的原因。", prerequisites: ["manufacturing-domain", "sql-basics", "evaluation"], data: "标准成本、实际成本、工单、领料和报工数据", action: "拆解偏差并形成改善待办", kpi: "成本分析周期和改善闭环率", safety: "成本结论须经财务和制造共同复核。" },
  { title: "报价与订单毛利评审助手", outcome: "材料、工艺、产能、交期和毛利风险评审", summary: "在接单前把可制造性与盈利风险放到同一评审中。", prerequisites: ["manufacturing-domain", "tool-calling", "evaluation"], data: "报价、BOM、工艺、成本、产能和交期数据", action: "生成评审报告与风险条目", kpi: "报价评审周期和订单毛利偏差", safety: "报价审批仍由商业与财务权限控制。" },
  { title: "发运与准时交付风险助手", outcome: "未能按时发运风险和协同处理清单", summary: "在发运前提前组织计划、仓储和物流处置风险。", prerequisites: ["manufacturing-domain", "agent-workflow", "tool-calling"], data: "订单、完工、库存、包装、发运和物流状态", action: "预测风险并生成责任待办", kpi: "OTD 与风险提前发现时长", safety: "物流承诺和发运指令须由授权人员下达。" },
  { title: "制造运营日报与指挥助手", outcome: "供产销质库存晨会看板和闭环追踪", summary: "让管理者每天看到最关键的异常、责任和处置进度。", prerequisites: ["manufacturing-domain", "observability", "agent-workflow"], data: "已核验的供产销质库存指标与异常任务", action: "汇总、排序并生成日报", kpi: "晨会准备耗时和异常按期关闭率", safety: "日报需标注数据更新时间和待复核内容。" },
]

export const enterpriseProjects: EnterpriseProject[] = [
  ...generalSeeds.map((seed, index) => createProject("general", index + 1, seed)),
  ...k3Seeds.map((seed, index) => createProject("k3", index + 1, seed)),
  ...manufacturingSeeds.map((seed, index) => createProject("manufacturing", index + 1, seed)),
]

/** XMZADD 20260819 按已掌握能力筛选当前可直接开始的小实战。 */
export function getUnlockedPractices(completedSkills: string[]): MiniPractice[] {
  const skillSet = new Set(completedSkills)
  return miniPractices.filter((practice) => practice.prerequisites.every((skill) => skillSet.has(skill)))
}

/** XMZADD 20260819 将已完成课程转换为可用于服务端解锁校验的能力集合。 */
export function getCompletedSkills(completedLessonSlugs: string[]) {
  const completed = new Set(completedLessonSlugs)
  const skills = new Set<string>()

  for (const module of learningModules) {
    for (const lesson of module.lessons) {
      if (!completed.has(lesson.slug)) continue
      for (const skill of lesson.skills) skills.add(skill)
    }
  }

  return Array.from(skills)
}

/** XMZADD 20260819 返回尚未满足的前置能力，阻止用户绕过学习路径开始练习或项目。 */
export function getUnmetPrerequisites(prerequisites: string[], completedSkills: string[]) {
  const completed = new Set(completedSkills)
  return prerequisites.filter((skill) => !completed.has(skill))
}

/** XMZADD 20260819 计算十个通用 Agent 毕业项目的完成状态。 */
export function getGraduationStatus(acceptedProjectSlugs: string[]): GraduationStatus {
  const accepted = new Set(acceptedProjectSlugs)
  const requiredProjects = enterpriseProjects.filter((project) => project.isGraduationRequired)
  const completedRequired = requiredProjects.filter((project) => accepted.has(project.slug)).length

  return {
    accepted: completedRequired,
    required: requiredProjects.length,
    graduated: completedRequired === requiredProjects.length,
  }
}
