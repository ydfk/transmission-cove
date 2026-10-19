---
name: Transmission Cove
description: 中文优先、明暗一致的高密度传输管理界面
colors:
  background: "#ffffff"
  foreground: "#242a35"
  card: "#ffffff"
  primary: "#3566d6"
  primary-foreground: "#ffffff"
  secondary: "#eef2f9"
  muted: "#f2f4f7"
  muted-foreground: "#656e7e"
  accent: "#edf2fb"
  destructive: "#c13d47"
  border: "#e5e8ee"
  sidebar: "#f7f8fa"
  upload: "#258064"
  selection: "#edf3ff"
  selection-edge: "#c1d3fa"
  header: "#fafbfc"
  checking: "#8050b2"
  waiting: "#99600b"
  paused: "#6b7180"
  dark-background: "#15191f"
  dark-foreground: "#e3e7ef"
  dark-card: "#1c212a"
  dark-primary: "#88abff"
  dark-primary-foreground: "#111b31"
  dark-secondary: "#2a3344"
  dark-muted: "#242b35"
  dark-muted-foreground: "#a0aaba"
  dark-accent: "#263247"
  dark-destructive: "#ff8b94"
  dark-border: "#303744"
  dark-sidebar: "#191e26"
  dark-upload: "#6fd3ad"
  dark-selection: "#25344e"
  dark-selection-edge: "#3c547a"
  dark-header: "#1a2029"
  dark-checking: "#c6a1f4"
  dark-waiting: "#e6ba6e"
  dark-paused: "#aeb6c5"
typography:
  headline:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif'
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif'
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1
  body:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  control:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  md: "7px"
  lg: "10px"
  full: "calc(infinity * 1px)"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-ghost:
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    size: "32px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  input:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
  nav-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "6px 11px"
    height: "33px"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  progress:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: "3px"
  task-row-selected:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.foreground}"
    height: "48px"
  dialog:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  filter-section:
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "32px"
  directory-row:
    textColor: "{colors.muted-foreground}"
    rounded: "6px"
    height: "31px"
  statusbar:
    backgroundColor: "{colors.header}"
    textColor: "{colors.foreground}"
    padding: "5px 22px"
  compact-header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "54px"
    padding: "0 18px"
  table-header:
    backgroundColor: "{colors.header}"
    textColor: "{colors.muted-foreground}"
    height: "34px"
  list-pagination:
    textColor: "{colors.foreground}"
    padding: "5px 18px"
---

# Design System: Transmission Cove

## Overview

**Creative North Star: "有序的传输工作台"**

以现有任务工作台为视觉基准：浅色石墨文字与微灰分区承载高密度信息，蓝色指向操作和下载，绿色指向上传与做种。深色主题沿用相同的层级、布局与状态语义；中文系统字体、细描边图标和等宽数字让持续查看与批量操作保持清晰。

组件以克制、直接、可辨识为原则。主工作区使用连续表格和细分隔线，较强的空间分层留给菜单与弹窗。未来页面继承颜色、控件和信息密度，不必复刻本页的列结构。

**Key Characteristics:**

- 中文系统字体与细描边图标。
- 紧凑的数据行、稳定的数字宽度与明确的选择状态。
- 蓝色操作、绿色上传、红色错误的稳定语义。
- 明暗主题保持相同的信息层级。

本文件为代码扫描后固化的设计系统。依据为 `src/index.css`、`src/App.tsx`、`src/components/` 与 `.impeccable/review/` 中对应迭代截图。本轮紧凑布局核对了 `compact-pagination.png`、`desktop.png`、`desktop-dark.png`、`mobile.png`、`narrow-workspace-800.png` 与 `narrow-workspace-1100.png`。沿用 `docs/SURFACE.md` 已记录方向；没有参考 comp，也没有随机 seed。context、concept-seed、detect 辅助脚本因 Windows `cache_directory_failed` 无法运行，本文不声称其检查通过。截图中的任务为明确标注的演示数据；文档不构成群晖实机验收或全产品审核结论。

## Colors

颜色名称与 `src/index.css` 中的语义变量一一对应；frontmatter 中的 `dark-*` 记录 `.dark` 下同名变量的值，应用仍使用 `var(--primary)` 等变量，不新增 `--dark-primary`。颜色原值以 frontmatter 为准。

### Primary

- **传输蓝（primary）**：添加、保存、下载速度、下载进度、选中导航以及焦点。
- **按钮前景（primary-foreground）**：浅色主题为白色，深色主题为深墨蓝，以适配较亮的蓝色按钮。
- **蓝灰辅助面（secondary / accent / selection / selection-edge）**：分别承载次要控件、导航强调、任务选择、细边界。不要互换选择与悬停含义。

### Secondary

- **上传绿（upload）**：上传速度、做种进度和连接成功提示，属于操作状态而非第二品牌主色。
- **错误红（destructive）**：错误信息与删除确认，配合具体文字说明。
- **校验紫（checking）**：正在校验或等待校验的任务图标，以及校验筛选。
- **等待琥珀（waiting）**：等待下载、等待做种的任务图标；不新增独立的等待筛选项。
- **暂停灰（paused）**：暂停与未活动筛选图标、已暂停任务图标，与普通辅助文字区分。

### Neutral

- **工作底面（background / card）**：页面、任务行及组件浮层。
- **石墨文字（foreground）与辅助文字（muted-foreground）**：主信息和说明分级。
- **微灰分区（sidebar / header / muted）**：导航、表头、状态栏与标签栏容器。
- **细分隔（border）**：任务行、输入框和面板边界。

**The 状态语义 Rule.** 操作与下载使用 primary，上传、做种、已完成与活动中使用 upload，校验使用 checking，等待使用 waiting，暂停与未活动使用 paused，错误与危险操作使用 destructive；浅深主题保持语义一致。


sidecar 的 tonalRamp 是从实有颜色转换的 OKLCH 八级展示条（保持色相、色度并调整明度），用于设计面板比较，不是新增的生产主题变量。

## Typography

**Body Font:** Segoe UI → Microsoft YaHei UI → PingFang SC → system-ui → sans-serif；使用系统可用字体，无外部字体下载。

整体采用同一无衬线字族，通过字号、字重、行距与颜色建立层级。没有独立的展示字体；速率、容量、比例与计数用 `font-variant-numeric: tabular-nums`，不要把整个界面改成等宽字体。

### Hierarchy

- **Headline**：合并在顶栏中的工作区标题；桌面（18px），手机（16px），计数使用（12px）辅助文字。
- **Title**：弹窗标题。
- **Body**：正文与常规说明。
- **Label**：紧凑任务名称和数据层级；表头、状态栏与次级数字使用（11px），行内状态与标签使用（10px）。
- **Control**：常规按钮。输入框为（16px / 24px），在 Tailwind `md`（768px）以上变为（14px / 20px）；这是控件断点，与工作台的（760px）断点不同。

**The 数据优先 Rule.** 任务数字使用 tabular-nums；名称保持单行省略，状态与标签居于其下。

## Layout

空间取值来自现有布局与 Tailwind 工具类，frontmatter 的 spacing 是提取后的复用尺度，不代表项目新增了同名 CSS 变量。详情与表单区块仍使用（24px / 32px）留白；任务顶栏、工具栏和分页栏采用（18px）水平内边距，手机改为（10px / 12px）。组件内部常用（8px / 12px / 16px），细小状态间隔可使用实际实现中的（3px / 5px / 6px / 10px）。

工作台以 `100dvh` 填满视口、最小高度（420px），滚动发生在任务列表、侧栏或详情内部。当前表面使用默认（256px）、可调整为（200–460px）的侧栏、（54px）合并顶栏和最小高度（44px）的可换行状态栏；标题、数量、连接状态与演示徽章在顶栏垂直居中对齐。“添加任务”采用实心主色按钮，移至搜索框左侧；批量操作独立一行，统一使用 32px 的描边按钮及图标。可用宽度达到 1050px 时展开全部 12 项操作；700–1049px 将队列操作收入“更多”；更窄时保留开始、暂停、删除和校验。任务表头固定（34px），虚拟行高为桌面（48px）、手机（70px），多渲染（8）行作为滚动缓冲。桌面列宽可调整，横向滚动保留；实际列模板来自组件内联样式，优先于 CSS 中（1600px）宽屏规则。

- **1100px 及以下**：详情概览从三列变两列；桌面侧栏继续使用用户选择的宽度，不自动缩为固定值。
- **工作区容器宽度 700px 及以下**：`.workspace` 使用 `container-type: inline-size`。顶栏改为最小高度（54px）、允许换行；搜索独占一行，批量操作、显示列、选择提示与分页控件按剩余空间换行。此规则独立于视口宽度，覆盖宽侧栏挤压工作区的情况；例如（800px）视口配（460px）侧栏。任务表仍可横向滚动，不以裁掉操作控件换取单行。
- **760px 及以下**：侧栏折叠为可打开的抽屉，宽度为 min(290px, 85vw)；搜索独占一行，批量操作换行。任务仅保留选择、名称、进度与操作四列，速率移到名称下方。当前四列为（32px / minmax(0, 1fr) / 62px / 32px），行内状态图标保留并缩为（14px × 18px），大小文字与合并表头中的第二排序入口隐藏。手机顶栏最小高度（50px）、可换行，添加按钮仅显示图标并保留可访问名称。底栏改为三行：第一行传输速率与 TR / Web 版本，第二行限速，第三行服务器地址。
- **详情面板**：默认（320px）高，最小（200px），桌面最大（70dvh），手机最大（60dvh）；允许拖动或键盘调整。
- **设置与弹窗**：设置表单由两列转一列。通用 Modal 最大高度（90dvh）并内部纵向滚动；宽度最多为视口减（32px），常规桌面宽（512px），宽弹窗（768px）。

分页栏置于任务列表之后、详情面板之前，最小高度（44px），左右区分范围、每页数量和页码操作；窄工作区与手机按内容换行。详情收起后列表获得剩余高度。

这些精确尺寸记录任务工作台的实现，不要求未来所有页面复制相同列数或侧栏。

## Elevation & Depth

连续工作区以背景差异和细分隔线为主，输入框与描边按钮保留轻微阴影；菜单、弹窗和手机导航才承担明显浮起感。阴影、动效与断点的机器可读定义位于 sidecar，避免扩展 frontmatter 的规范之外字段。

### Shadow Vocabulary

- **轻控件**：Tailwind `shadow-xs`，用于输入框与描边按钮。
- **弹窗**：Tailwind `shadow-lg`，配合半透明黑色遮罩。
- **手机导航**：横向投影标出覆盖内容的侧栏。
- **表头与选中行**：1px 阴影只表达分隔/焦点边，不表达悬浮高度。

**The 分区优先 Rule.** 连续工作区依靠背景与分隔线建立层级，明显阴影只用于浮层。

## Shapes

按钮、输入框和导航使用适度圆角（rounded.md）；弹窗及标签栏使用较大圆角（rounded.lg）；徽章与进度条为胶囊。任务表格和详情面板保持直边连续面；任务行使用（1px）底部分隔。上传区域为虚线边界与（8px）圆角，是文件落点的专用处理。

统一使用 Lucide 细描边图标；常规按钮图标（16px），紧凑按钮（12px），导航（16px）。图标配合文字或可访问名称，不承担唯一解释。

## Components

### Buttons

主按钮用于添加、保存；描边按钮用于开始、暂停与次级表单操作；ghost 按钮容纳删除入口、更多、刷新和主题开关；确认删除使用 destructive。secondary 和 link 变体保留 shadcn 的既有 API，分别用于状态切换和轻量文字动作。

主按钮通常高（36px），紧凑按钮高（32px），紧凑图标按钮为（32px）正方形。带图标的默认按钮水平内边距为（12px），无图标为（16px）。悬停通过背景色透明度或 accent 变化反馈；控件禁用透明度为（0.5），焦点使用（3px）半透明 primary 环。全局可聚焦元素另有（2px）primary outline、偏移（2px）。

删除按钮浅色主题使用白字，深色使用 destructive 的（60%）背景与白字；不要直接把深色主题的 primary-foreground 套到危险按钮。frontmatter 的 destructive 条目记录浅色基态，完整深色与焦点状态见 sidecar。

### Chips

演示标记使用 secondary 徽章，胶囊边缘、（12px）文字。任务标签为行内文本与左侧分隔线，不将每个标签改成抢眼彩色胶囊。真实连接和演示必须有可辨识的文字状态。

### Cards / Containers

主工作区不使用独立卡片墙。详情通过顶部边线与内部 Tabs 分区；弹窗沿用 Dialog/AlertDialog 的圆角、边线、遮罩和阴影。标准 Modal 的滚动边界由 `forms.tsx` 维护，不在每个弹窗复制不同尺寸。

### Inputs / Fields

输入框是细边线、轻阴影和适度圆角。深色使用 border 的（30%）底色；占位文字使用 muted-foreground，输入文字使用 foreground。焦点与错误环沿用 shadcn；禁用输入降低透明度。字段标签持续可见，单位与时区写在标签或说明中。

### Navigation

默认项为 muted-foreground，悬停用 muted 底色与 foreground，当前项为 accent 底色、primary 文字及（600）字重。导航项最小高度（33px）、内边距（6px 11px），计数右对齐并使用等宽数字。手机导航覆盖在内容之上，遮罩和关闭入口保持明确。

状态筛选固定为全部、下载中、已暂停、已完成、校验中、活动中、未活动、错误八项，图标沿用状态色，当前项不覆盖图标原有状态语义。计数以当前服务器全部任务计算；已完成按完成进度、活动/未活动按实时上下行速度判断，各项可以重叠，不能解释为互斥分区。

自动连接当前实例，顶部展示任务标题、数量、连接状态与操作，不展示服务器列表。Shift 点击左下设置或 `?backend=1` 可打开隐藏的手动 RPC 切换表单，支持验证后切换及恢复自动连接；未连接时也可使用该入口。连接失败时提供重试；仅 RPC 返回 401 时显示“登录 Transmission”，打开用户名/密码认证表单，不把其他网络错误显示为登录要求。演示模式保留文字徽章与独立退出入口。

### Sidebar Groups & Statistics

目录分布、标签、Tracker 分组标题可折叠，标题最小高度（32px），展开箭头旋转（90deg）。已选分组标题显示“已筛选”，选中值与清除按钮放在折叠内容之外，因此收起后仍能识别并清除条件；同时在顶栏下方独立的筛选摘要条汇总条件，摘要条最小高度（32px）。分组折叠状态被记忆，折叠动作不清除筛选。

目录以真实路径层级形成树状列表，父目录包含子目录任务。每层使用（14px）左外边距、（14px）左内边距和（1px）竖线建立层级，目录行高（31px）、圆角（6px）。展开按钮与目录筛选按钮分离；路径过长可横向滚动，名称保持省略，完整路径通过 title 保留。选中后使用 accent 底色与 primary 文字，祖先目录可显示 primary 小圆点提示选中子目录。

数据统计与目录、标签、Tracker 同处侧栏滚动区；左下固定区域仅保留“设置”。数据统计包含累计统计和当前会话两个可独立折叠、记忆展开状态的分组，各展示已上传、已下载、已添加文件、会话次数和精确到秒的活动时间，底部保留任务总大小。数字右对齐、等宽，字号（11px），窄侧栏允许长数值换行。未连接、加载和读取失败显示对应文字，缺失字段显示破折号，不以零值伪装可用统计。

侧栏右边界为可聚焦的垂直分隔条，命中区域宽（7px），悬停或键盘焦点使用 selection-edge。拖动在（200–460px）内调整宽度并记忆，双击恢复（256px）；左右方向键每次调整（10px），Home / End 跳至最小 / 最大值。手机抽屉保持既定宽度并隐藏调整边界。

### Statusbar

底栏依次展示上下行实时速率、备用限速开关与有效限速、服务器地址、Transmission 版本和 Web 版本。下载/上传保持蓝/绿语义，地址使用 muted-foreground 并支持省略与完整 title，版本为辅助信息。桌面允许换行，手机使用固定三行信息结构，不隐藏地址或版本。

限速文案依据当前生效规则：备用限速启用时显示备用值，否则显示常规值或“不限速”；会话尚不可用时显示“—”。服务器地址展示当前连接或明确的“演示数据（未连接服务器）”，不把演示状态写成真实服务器地址。

### Task Row & Progress

任务名称、状态、标签形成两层，手机增加传输速率一层。名称前用状态图标替代统一文件图标，错误优先，其后依次识别暂停、校验、下载、做种和等待；颜色与图形、文字状态同时存在，手机也保留图标。选中行使用 selection 整行底色，当前详情行再加 selection-edge 细边；选择数量在工具栏下方单独呈现。进度条在任务行内高（3px），下载使用 primary，做种使用 upload，同时保留百分比文字。桌面状态图标缩为（19px × 22px），名称图标间距（8px）、行内状态上边距（3px）；手机沿用小图标。键盘 Enter/Space 与鼠标选择保持一致。

桌面将指标合并为“进度 / 大小”“下载 / 上传”“分享率 / Peers”三组，保留剩余时间与可选队列列。进度与大小并排在进度条上方，速率和分享率/Peers各用上下两行；合并表头中的每个指标都是独立排序按钮，排序箭头跟随实际指标。合并只改变视觉组织，不把两个数值绑定为同一种排序。

### Pagination & Selection

默认每页（50）条，预设为（25 / 50 / 100 / 200 / 500），另有“全部”和自定义整数（1–10000）；数量选择被记忆。自定义输入宽（76px）、高（32px），用“应用”提交。范围信息、每页数量、首页/上一页/下一页/末页与当前页码持续可见，边界按钮禁用。

翻页保留已选任务；表头复选框只选中或取消当前页任务。选择提示明确标注“包含其他页或筛选外任务”，批量操作范围以已选任务为准。改变搜索、筛选、排序或每页数量回到第一页，数据减少时校正页码。选择“全部”仍沿用虚拟渲染，不取消滚动缓冲。

### Motion

导航背景变化为（120ms）；常规 shadcn 控件沿用 Tailwind 默认（150ms）缓动；Dialog 过渡为（200ms）。动效服务于状态反馈，不改变布局重心。尊重 `prefers-reduced-motion`：动画和过渡降为（0.01ms），滚动恢复 auto。

## Do's and Don'ts

### Do:

- Do 使用实际 CSS 语义变量，让明暗主题一起变化。
- Do 同时用文字、图标或进度表达状态，颜色只提供辅助识别。
- Do 保留键盘焦点、禁用状态与清晰的危险操作文案。
- Do 在窄屏保留名称、状态、传输速度与进度，并验证弹窗内容可滚动。

### Don't:

- Don't 用大卡片替换适合密集任务管理的连续数据行。
- Don't 将演示数据或视觉截图表述为真实服务器验收。
- Don't 在新页面添加无任务含义的装饰阴影、渐变或状态颜色。
- Don't 为匹配截图硬编码主题颜色，或把本页列宽升级为所有页面的布局约束。

## 任务列表列配置

新用户默认使用完整列：任务名称、总大小、有效数据、已下载、已上传、进度、下载速度、上传速度、状态、添加时间、种子数、下载者数、分享率、优先级、用户标签和做种时长。“显示列”提供完整列、紧凑列预设及逐列勾选，还可添加剩余时间、连接数、队列、下载目录、完成时间。沿用已有列偏好与列宽，不重置用户选择。

完整列将速度、大小、状态和标签拆开，避免在名称与合并列重复显示；紧凑列沿用进度/大小、下载/上传、分享率/Peers 的组合。表格内部横向滚动，桌面复选框和名称列固定在左侧；手机维持名称与进度的简洁布局，不覆盖桌面列配置。列选择菜单支持连续勾选，并限制高度以便滚动。

种子数与下载者数使用 Tracker 报告的最大非负值，未知或读取失败显示破折号，不重复累加不同 Tracker 的统计。仅在显示或排序需要时发起独立的 30 秒批量查询，不在 3 秒任务列表刷新中携带 Tracker 统计与完整 Peers 数组。所有数值列按数值排序，缺失值始终置后。

## 品牌资源

侧栏使用 36px 的原创 Cove 标志：蓝色圆角底、白色 C 形海湾轮廓与双向传输箭头。`public/cove.svg` 是源文件，`docs/assets/icon.svg` 与其保持一致；浏览器使用同源 SVG / 32px PNG favicon，Apple 触控图标为 180px PNG。资源使用相对部署路径，兼容原生 Web 子目录。
