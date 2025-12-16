# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

# 傑太業務系統 - 業務邏輯說明

## 列管項目 vs 許可證

> ⚠️ **重要概念：有列管不一定有許可證！**

| 狀態 | 說明 | 範例 |
|------|------|------|
| ✅ 有列管 + 有許可證 | 正常營運中 | 水污列管，有排放許可 |
| ⚠️ 有列管 + 無許可證 | 可能需要申請或已失效 | 毒物列管，許可已過期 |
| ❌ 無列管 | 不需要該類許可證 | 無空污製程 |

### 資料來源

| 資料 | API 來源 | 說明 |
|------|----------|------|
| 列管狀態 | EMS_S_01 | 即時查詢，可知道是否列管 |
| 水污許可到期日 | EMS_S_03 → Supabase | n8n 同步，需維護 |
| 毒物許可到期日 | EMS_S_05 → Supabase | n8n 同步，需維護 |
| 空污許可到期日 | ❌ 無公開 API | 需手動維護 |
| 廢棄物許可到期日 | ❌ 無公開 API | 需手動維護 |

### 查詢流程

```
輸入統編 → 
  1. EMS_S_01：取得管編列表 + 列管狀態（空/水/廢/毒/土）
  2. Supabase water_permits：用統編或管編查水污許可到期日
  3. Supabase toxic_permits：用統編或管編查毒物許可到期日
  4. Supabase factories：補充其他許可到期日（手動維護）
```
