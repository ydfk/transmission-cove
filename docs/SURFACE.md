# 任务工作台

Mode: Operate。桌面群晖用户高频查看下载和做种状态，需在大量任务中快速定位和批量控制。

## Direction contract

THESIS: 围绕任务表格组织工作台，让筛选、选择和详情形成连续操作路径。

OWN-WORLD: 用户指定 shadcn/ui；浅色石墨文字、微灰侧栏、蓝色操作强调、绿色上传状态。深色主题跟随系统。统一细描边图标、可读中文系统字体、表格数字等宽。

STORY: 连接当前服务器，识别状态，通过状态/目录/标签/Tracker 组合筛选任务，选中并操作，在详情面板完成深入管理。

FIRST VIEWPORT: 默认 256px、可拖动到 200–460px 的侧栏；八类任务状态、可折叠目录树/标签/Tracker，统计置于滚动区，左下固定区域仅设置；顶部标题、连接状态与新增任务合并为 54px 一行；紧随筛选工具栏；主体为 48px 行高、指标合并的虚拟表格与分页栏；底部可收起详情与速度、限速、TR/服务器/Web 信息。手机侧栏为最大 290px 抽屉，操作工具栏换行，底部信息三行。

FORM: 用户指定的 shadcn 工作台；辅助脚本执行失败，无随机 seed，按已讨论的表格与详情结构直接实现。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
