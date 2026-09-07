# 全项目功能验收实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复当前测试与生命周期问题，并验证注册/登录提示、展示动画和主要工具页面正常工作。

**Architecture:** 保留现有 Vue 3、Pinia 和本地账户结构；通过统一测试环境模拟浏览器 API，按真实登录状态挂载受保护页面，并只修复已复现的生产生命周期缺陷。认证页面新增独立组件测试，真实浏览器检查作为最终验收层。

**Tech Stack:** Vue 3、TypeScript、Pinia、Vite、Vitest、Vue Test Utils、jsdom、Chromium。

---

### Task 1: 浏览器 API 测试环境

**Files:**
- Modify: `src/tests/setup.ts`
- Test: `src/tests/app.test.ts`

- [ ] 补充 Canvas 2D 动画所需方法和渐变替身。
- [ ] 补充立即报告可见状态的 `IntersectionObserver` 替身。
- [ ] 补充 `matchMedia` 与动画帧清理能力。
- [ ] 运行 `npm test -- --run src/tests/app.test.ts`，确认失败从环境异常推进到业务断言。

### Task 2: 页面测试登录前置条件

**Files:**
- Modify: `src/tests/app.test.ts`

- [ ] 新增测试账户和会话种子函数。
- [ ] 在每个测试前清理 localStorage 和 URL hash。
- [ ] 让工具页面测试以已登录用户身份挂载。
- [ ] 运行 `npm test -- --run src/tests/app.test.ts`，确认页面测试通过。

### Task 3: 生命周期与数值测试修复

**Files:**
- Modify: `src/user/authStore.ts`
- Modify: `src/features/font/stores/fontModuloStore.ts`
- Modify: `src/tests/audioProcessor.test.ts`
- Test: `src/tests/authStore.test.ts`
- Test: `src/tests/fontModuloStore.test.ts`
- Test: `src/tests/audioProcessor.test.ts`

- [ ] 用现有失败测试确认退出身份同步缺陷。
- [ ] 在会话设置入口同步更新水印身份。
- [ ] 新增字体 Store 销毁后不执行延迟生成的失败测试。
- [ ] 使用作用域清理取消字体生成计时器。
- [ ] 将 Float32 波形断言改为数值容差。
- [ ] 运行三个专项测试文件并确认没有未处理异常。

### Task 4: 认证页面专项回归

**Files:**
- Create: `src/tests/userAuthPage.test.ts`
- Test: `src/components/AuthShowcase.vue`
- Test: `src/pages/UserAuthPage.vue`

- [ ] 编写注册字段中性、错误和正确提示测试。
- [ ] 编写验证码发送错误、成功和倒计时测试。
- [ ] 编写登录错误及已有账户登录跳转测试。
- [ ] 编写展示动画自动轮播、手动切换和卸载清理测试。
- [ ] 运行 `npm test -- --run src/tests/userAuthPage.test.ts` 并确认通过。

### Task 5: 全量与浏览器验收

**Files:**
- Verify: `dist/`
- Verify: `docs/screenshots/`

- [ ] 运行 `npm test -- --run`，确认全部测试通过且无未处理异常。
- [ ] 运行 `npm run build`，确认类型检查和生产构建通过。
- [ ] 启动本地 Vite 服务并使用 Chromium 检查认证页。
- [ ] 保存桌面和移动截图，检查动画 Canvas、提示状态和布局。
- [ ] 检查浏览器控制台与网络错误并汇总结果。
