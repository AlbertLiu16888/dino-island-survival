# 恐龍島求生記 Dino Island Survival — 專案架構

## 版本
當前版本: **v3.3**
每次改版需更新 `index.html` 所有 script 的 `?v=` 參數做 cache busting。

## 技術棧
- **引擎**: Phaser 3.80 (CDN)
- **多人連線**: PeerJS 1.5.4 WebRTC P2P，host-authority 架構
- **渲染**: Canvas 2D 程序化生成貼圖 (無外部圖片)
- **音效**: Web Audio API 程序化合成
- **語言**: 純 JavaScript (ES6+)，無打包工具

## 檔案結構

```
index.html          — 入口，載入 CDN + 所有 JS (注意 ?v= 版號)
css/style.css       — 全域樣式 (Phaser 容器、觸控禁止選取等)
js/
  data.js           — 遊戲常數：地圖、玩家、資源、物品、配方、恐龍定義
  tiles.js          — 程序化地形貼圖生成 (TileGen)
  sprites.js        — 程序化角色/物件貼圖生成 (SpriteGen)
  audio.js          — 程序化音效合成 (AudioGen)
  network.js        — PeerJS 連線管理 (NetworkManager)
  game.js           — 主遊戲邏輯：場景、UI、AI、物理、合成、戰鬥
scripts/
  generate_all_assets.py  — 資產生成腳本
  create_leaderboard_and_update.py — 排行榜腳本
```

## 架構概覽

### 載入順序 (有依賴關係，順序不可變)
1. `data.js` — 純資料物件 `GAME_DATA`，無依賴
2. `tiles.js` — `TileGen` class，依賴 `GAME_DATA`
3. `sprites.js` — `SpriteGen` class，依賴 `GAME_DATA`
4. `audio.js` — `AudioGen` class，無外部依賴
5. `network.js` — `NetworkManager` class，依賴 PeerJS CDN
6. `game.js` — 所有 Phaser Scene，依賴以上全部

### Phaser 場景
- **BootScene** — 載入進度條、呼叫 TileGen/SpriteGen/AudioGen 產生貼圖
- **MenuScene** — 主選單 (單人/建立房間/加入房間)
- **GameScene** — 主遊戲場景 (所有遊戲邏輯集中於此)

### 多人連線架構 (host-authority)
- Host 負責：恐龍 AI、日夜循環、資源重生、傷害判定
- Client 只發送輸入，接收狀態
- `broadcastState()` 每幀發送：玩家位置、恐龍狀態、放置物、儲藏箱/烹飪鍋內容
- 新玩家加入時 `sendInitToPlayer()` 發送完整地圖狀態
- 同步欄位速查：`pd`=放置物, `cd`=儲藏箱, `cpd`=烹飪鍋

### 核心系統
| 系統 | 說明 |
|------|------|
| 日夜循環 | DAY→DUSK→NIGHT，影響恐龍行為與視野 |
| 飢餓系統 | 隨時間/工作/奔跑下降，飽食≥60 緩慢回血，0 時扣血 |
| 合成系統 | 在營火旁開啟，消耗材料+時間製作物品 |
| 烹飪鍋 | 3格食材投入，匹配 COOKING_RECIPES (sorted array 比對) |
| Buff 系統 | speed/attack/defense/all，timed effects via delayedCall |
| 背包 | 20格，相同物品疊加至99 |
| 儲藏箱 | 放置後共享20格，多人可存取 |
| 放置物 | 營火/火把/陷阱/烹飪鍋，多人同步可見 |

## 開發規範

### 修改 data.js
- 新增物品：同時在 `RESOURCES`(如果是可採集的)、`ITEMS`、`RECIPES`(如果可合成) 添加
- 新增恐龍：在 `DINOS` 添加，並在 `sprites.js` 的 `SpriteGen` 添加對應貼圖
- 新增烹飪配方：在 `COOKING_RECIPES` 添加，slots 陣列會被 sorted 後比對

### 修改 game.js
- 新功能通常加在 `GameScene` 的方法中
- UI 面板統一用 `_hideAllPanels()` 管理互斥
- 放置物新增需處理：放置邏輯、視覺創建、多人同步(broadcastState/applyStateUpdate/sendInitToPlayer)
- 行動按鈕(手機)在 `createMobileButtons()` 中添加
- 鍵盤快捷鍵在 `create()` 的 keyboard 區塊添加

### 多人同步注意事項
- 放置物/儲藏箱/烹飪鍋等共享狀態必須在以下位置同步：
  1. `broadcastState()` — 每幀狀態廣播
  2. `applyStateUpdate()` — client 接收並套用
  3. `sendInitToPlayer()` — 新玩家加入時完整傳送
  4. `applyInitData()` — 新玩家接收初始狀態
  5. `handleRemoteInput()` — client 對 host 發送操作請求

### 已知陷阱
- **Phaser sprite vs plain object**: `allPlayers` 陣列中 index 0 是 `{x, y, isLocal:true}` 包裝物件，不是原始 sprite。直接用 sprite 參考會缺少 `isLocal` 等自訂屬性。
- **Preview 快取**: 改完程式碼需更新 `?v=` 版號，有時需重啟 server。
- **多 Phaser 實例**: 反覆 reload 可能產生多個 game instance，導致卡頓。建議 destroy 舊實例。

## 本地開發
```bash
python3 -m http.server 8080 -d "/Users/mac/claude projects/dino-island-survival"
```
開啟 http://localhost:8080

## Git
- Repository: `AlbertLiu16888/dino-island-survival`
- 每次改版 commit 後 push 並發送 Telegram 通知
