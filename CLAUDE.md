# 恐龍島求生記 Dino Island Survival — 專案架構與開發計劃

## 版本歷史
| 版本 | 日期 | 主要內容 | Commit |
|------|------|---------|--------|
| v3.3 | — | 烹飪鍋系統+特殊果實+Buff系統+恐龍攻擊修正 | a1ac398 |
| v3.4 | — | 無縫地圖渲染 — 消除格子感 (domain warping) | 552c5cf |
| v3.5 | — | 恐龍攻擊優化+互動整合(smartAction)+UI精簡 | e55530d |
| v3.6 | — | 多人連線支援2-6人 (TURN relay+重試+late join) | 35223fd |
| v3.7 | — | 多人HP同步+戰鬥特效共享+無敵安全閥 | dd3f459 |
| v3.8 | 2026-04-09 | 夜間挑戰系統 (恐龍蛋收集+迅猛龍狩獵) | 32c7784 |

當前版本: **v3.8**
每次改版需更新 `index.html` 所有 script 的 `?v=` 參數做 cache busting。

---

## 技術棧
| 技術 | 版本/來源 | 用途 |
|------|-----------|------|
| Phaser 3 | 3.80 (CDN) | 遊戲引擎、物理、場景管理 |
| PeerJS | 1.5.4 (CDN) | WebRTC P2P 多人連線 |
| Canvas 2D | 原生 | 程序化生成所有貼圖 (無外部圖片) |
| Web Audio API | 原生 | 程序化音效合成 |
| JavaScript | ES6+ | 純 JS，無打包工具 |

---

## 檔案結構與職責

```
index.html              — 入口，載入 CDN + 所有 JS (注意 ?v= 版號)
css/style.css           — 全域樣式 (Phaser 容器、觸控禁止選取等)
js/
  data.js    (12KB)     — 遊戲常數：地圖、玩家、資源、物品、配方、恐龍、夜間挑戰定義
  tiles.js   (10KB)     — 程序化地形貼圖生成 (TileGen)，domain warping + biome blending
  sprites.js (25KB)     — 程序化角色/物件貼圖生成 (SpriteGen)，含恐龍蛋
  audio.js   (10KB)     — 程序化音效合成 (AudioMgr)
  network.js (11KB)     — PeerJS 連線管理 (NetMgr)，STUN+TURN，2-6人
  game.js    (131KB)    — 主遊戲邏輯：5個場景、UI、AI、物理、合成、戰鬥、夜間挑戰
scripts/
  generate_all_assets.py        — 資產生成腳本
  create_leaderboard_and_update.py — 排行榜腳本
CLAUDE.md               — 本文件 (專案架構+開發計劃)
```

### 載入順序 (有依賴關係，順序不可變)
1. `data.js` → 純資料物件 `GAME_DATA`，無依賴
2. `tiles.js` → `TileGen`，依賴 `GAME_DATA`
3. `sprites.js` → `SpriteGen`，依賴 `GAME_DATA`
4. `audio.js` → `AudioMgr`，無外部依賴
5. `network.js` → `NetMgr`，依賴 PeerJS CDN
6. `game.js` → 所有 Phaser Scene，依賴以上全部

---

## Phaser 場景架構

| 場景 | 用途 | 關鍵方法 |
|------|------|---------|
| **BootScene** | 進度條 + 資源生成 | `create()` → TileGen/SpriteGen/AudioMgr |
| **MenuScene** | 主選單、角色選擇、名稱輸入 | `create()` |
| **LobbyScene** | 多人連線大廳 (建/加入房間) | `doCreateRoom()`, `doJoinRoom()`, `refreshSlots()` |
| **GameScene** | **核心遊戲邏輯** (全集中) | 見下方方法清單 |
| **UIScene** | HUD、面板、搖桿、按鈕 | `update()`, `buildXxxPanel()`, `toggleXxx()` |

### GameScene 方法分類

| 分類 | 方法 | 說明 |
|------|------|------|
| **初始化** | `create()`, `generateMap()`, `renderMap()`, `createPlayer()` | 場景建立 |
| **多人網路** | `setupNetwork()`, `broadcastState()`, `sendInputToHost()`, `handleRemoteInput()` | 網路核心 |
| **多人同步** | `applyStateUpdate()`, `applyInitData()`, `applyInitRes()`, `sendInitToPlayer()` | 狀態同步 |
| **遠端玩家** | `createRemotePlayer()`, `removeRemotePlayer()`, `remoteAttack()`, `remoteGather()` | 遠端操作 |
| **資源** | `spawnResources()`, `createResource()`, `respawnResources()`, `gather()` | 資源系統 |
| **恐龍** | `spawnDinos()`, `createDino()`, `respawnDinos()`, `updateDinoAI()` | 恐龍AI |
| **戰鬥** | `playerAttack()`, `shootArrow()`, `damageDino()`, `killDino()`, `damagePlayer()` | 戰鬥系統 |
| **物品** | `addItem()`, `removeItem()`, `countItem()`, `useItem()`, `craft()` | 物品管理 |
| **放置物** | `usePlaceable()`, `_createXxxVisual()` (torch/campfire/trap/chest/pot) | 建築放置 |
| **互動** | `smartAction()`, `getNearChest()`, `getNearCookingPot()`, `depositToChest()` | 玩家互動 |
| **夜間挑戰** | `startNightChallenge()`, `endNightChallenge()`, `spawnChallengeEggs()`, `updateEggChallenge()` | 夜間挑戰 |
| **日夜/環境** | `updateDayNight()`, `updateDayVisuals()`, `updateSwampDamage()`, `updateBossWarning()` | 環境系統 |
| **輔助** | `moveToward()`, `showFloatingText()`, `isInCamp()`, `getBiomeName()` | 通用工具 |

### UIScene 面板架構

| 面板 | 觸發 | 狀態變數 | 互斥管理 |
|------|------|---------|---------|
| 背包 | `I鍵` / 🎒按鈕 / `toggleInventory` | `showInv` | `_hideAllPanels()` |
| 合成 | `C鍵` / 🔨按鈕 / `toggleCrafting` | `showCraft` | `_hideAllPanels()` |
| 儲藏箱 | `R鍵` / Space靠近 / `toggleChest` | `showChest` | `_hideAllPanels()` |
| 烹飪鍋 | `T鍵` / Space靠近 / `toggleCookingPot` | `showPot` | `_hideAllPanels()` |
| 挑戰橫幅 | `challengeStart` 事件 | auto | 4秒後自動隱藏 |
| 挑戰結果 | `challengeResults` 事件 | auto | 8秒後自動隱藏/可點關閉 |
| 挑戰計分板 | 夜間挑戰active | `challengeBoard` | 挑戰結束自動隱藏 |

---

## 多人連線架構 (host-authority)

### 職責分離
| 職責 | Host | Client |
|------|------|--------|
| 恐龍AI | ✅ 計算 | ❌ 只接收 |
| 日夜循環 | ✅ 計算 | ❌ 只接收 |
| 傷害判定 | ✅ 計算 | ❌ 只接收 |
| 資源重生 | ✅ 計算 | ❌ 只接收 |
| 夜間挑戰 | ✅ 計算+計分 | ❌ 只接收 |
| 移動輸入 | ✅ 本地處理 | ✅ 發送給host |
| 攻擊/採集 | ✅ 本地處理 | 發送 `act` 給host |

### broadcastState 欄位速查 (30fps)

```
state = {
    t: 's',                          // 類型標記
    p: [{id,x,y,hp,hu,fx,fy,a,n,si,ce}],  // 玩家陣列 (ce=攜帶蛋)
    d: [{id,x,y,hp,mhp,k,al,st}],   // 恐龍陣列
    rm: [resId,...],                  // 已移除資源ID
    dt: dayTimer,                    // 日夜計時器
    dp: dayPhase,                    // 0=day, 1=dusk, 2=night
    k: kills,                        // 擊殺數
    cd: currentDay,                  // 當前天數
    pls: [{tp,id,x,y}],             // 新放置物 (一次性)
    chd: [{id,x,y,inv}],            // 儲藏箱內容
    cpd: [{id,x,y,sl}],             // 烹飪鍋內容
    fx: [{tp,x,y,fx,fy}],           // 戰鬥特效 (slash/arrow)
    nc: {tp,sc,eggs},               // 夜間挑戰狀態
    ncr: {type,ranking}             // 挑戰結果 (一次性)
}
```

### 同步檢查清單 (新增共享功能必查)
新增任何共享狀態必須處理以下 **5 個位置**：
1. ✅ `broadcastState()` — 每幀狀態廣播
2. ✅ `applyStateUpdate()` — client 接收並套用
3. ✅ `sendInitToPlayer()` — 新玩家加入時完整傳送
4. ✅ `applyInitData()` — 新玩家接收初始狀態
5. ✅ `handleRemoteInput()` — client 對 host 發送操作請求 (如需)

---

## 核心系統詳解

### 1. 日夜循環
| 階段 | 時長 | 效果 |
|------|------|------|
| ☀️ 白天 | 120秒 | 正常，恐龍低偵測 |
| 🌅 黃昏 | 30秒 | 畫面漸暗 (overlay 0~0.3) |
| 🌙 黑夜 | 90秒 | 恐龍nightBuff 1.5x、夜行龍出現、夜間挑戰觸發 |

### 2. 夜間挑戰系統
| 項目 | 蛋收集 (egg_collect) | 迅猛龍狩獵 (raptor_hunt) |
|------|---------------------|------------------------|
| 觸發 | 奇數夜 (Day 1,3,5...) | 偶數夜 (Day 2,4,6...) |
| 目標 | 撿蛋→帶回營地繳交 | 擊殺迅猛龍 |
| 限制 | 每次攜帶1顆 | 無限制 |
| 初始生成 | 15顆蛋 | 10隻額外迅猛龍 |
| 重生間隔 | 12秒/4顆 | 10秒/4隻 |
| 計分 | 繳交+1 | 擊殺+1 (lastAttackerId追蹤) |
| 獎勵 | 冠軍：金骨頭+治療藥水x3 | 同左 |

### 3. 物品系統
| 類型 | type值 | 用途 | 備註 |
|------|--------|------|------|
| resource | `resource` | 合成材料 | 死亡掉落30% |
| food | `food` | 回復/Buff | hunger/hp/buff/cleanse |
| weapon | `weapon` | 裝備武器 | atk/range/ranged |
| armor | `armor` | 裝備防具 | def/slot |
| tool | `tool` | 使用工具 | 火把 |
| placeable | `placeable` | 放置物 | 營火/陷阱/箱/鍋 |
| challenge | `challenge` | 挑戰物品 | 恐龍蛋 (不可使用) |

### 4. 恐龍AI狀態機
```
patrol ──(偵測到玩家)──→ chase ──(接近)──→ attack
  ↑                        │                  │
  └──(超出aggro範圍)──────┘                  │
  ↑                                          │
  └──(距離>size+50)─────────────────────────┘
  
特殊：flee (竊蛋龍被攻擊後逃跑)
超級護甲：attack狀態下不受擊退
```

---

## 開發規範

### 新增物品 Checklist
- [ ] `data.js` → `ITEMS` 添加定義
- [ ] `data.js` → `RESOURCES` 添加 (如果是可採集的)
- [ ] `data.js` → `RECIPES` 添加 (如果可合成)
- [ ] `data.js` → `COOKING_RECIPES` 添加 (如果是鍋料理)
- [ ] `sprites.js` → 添加貼圖 (如需要)
- [ ] `game.js` → `useItem()` 處理使用邏輯 (如果有特殊效果)

### 新增恐龍 Checklist
- [ ] `data.js` → `DINOS` 添加定義
- [ ] `sprites.js` → `generateDinoSprite()` 添加配置
- [ ] `game.js` → `DINO_SPRITE_KEYS` 添加映射
- [ ] `game.js` → 如有特殊AI行為，在 `updateDinoAI()` 添加

### 新增放置物 Checklist
- [ ] `data.js` → `ITEMS` 添加定義 (type: 'placeable')
- [ ] `game.js` → `usePlaceable()` 添加放置邏輯
- [ ] `game.js` → `_createXxxVisual()` 新增視覺方法
- [ ] `game.js` → `broadcastState()` 添加同步
- [ ] `game.js` → `applyStateUpdate()` 添加接收
- [ ] `game.js` → `sendInitToPlayer()` 添加初始傳送
- [ ] `game.js` → `applyInitData()` 添加初始接收

### 新增夜間挑戰類型 Checklist
- [ ] `data.js` → `NIGHT_CHALLENGE.TYPES` 陣列添加類型名
- [ ] `game.js` → `startNightChallenge()` 添加類型初始化邏輯
- [ ] `game.js` → `endNightChallenge()` 確認清理邏輯
- [ ] `game.js` → 添加 `updateXxxChallenge()` 更新方法
- [ ] `game.js` → `update()` 中呼叫新的更新方法
- [ ] UIScene → `showChallengeBanner()` 添加描述文字
- [ ] UIScene → `updateChallengeBoard()` 確認顯示正確

### 版本發布流程
1. 修改程式碼
2. `index.html` 更新 `?v=` 版號 (所有 6 個 script tag)
3. `CLAUDE.md` 更新版本歷史表
4. `MenuScene` 更新底部版本文字
5. `node -c js/*.js` 語法檢查
6. Preview 測試功能
7. `git add` + `git commit`
8. `git push`
9. Telegram 通知

---

## 已知陷阱

| 陷阱 | 說明 | 解法 |
|------|------|------|
| Sprite vs Object | `allPlayers[0]` 是 `{x,y,isLocal:true}` 包裝，不是原始 sprite | 用 `.ref` 取得原始物件 |
| Preview 快取 | 改碼後瀏覽器用舊版 | 更新 `?v=` 版號 |
| 多實例 | 反覆 reload 產生多個 game | destroy 舊實例或重啟 |
| HP 同步 | Client 必須從 host 讀取自己的 HP | `applyStateUpdate` 中 `pd.id===NetMgr.myId` |
| Invincible 卡住 | `delayedCall` 可能失效 | 600ms 硬性安全閥 in `update()` |
| Texture 重複 | 重啟場景時 texture key 已存在 | `textures.exists()` + `textures.remove()` |
| 恐龍 stunlock | 玩家連擊→擊退→恐龍無法攻擊 | 攻擊狀態超級護甲+緩慢逼近 |
| 3人以上連線 | 純 STUN 無法穿透 NAT | TURN relay (OpenRelay) + 重試 |

---

## 未來擴展計劃

### 🔴 高優先 (v3.9~v4.0)
| 功能 | 描述 | 影響檔案 | 複雜度 |
|------|------|---------|--------|
| 經驗值/等級 | 擊殺恐龍得XP，升級解鎖合成配方 | data+game | 中 |
| 小地圖 | 右下角小地圖顯示位置、蛋、隊友 | game(UI) | 中 |
| 更多挑戰類型 | 草藥收集、生存競賽、Boss挑戰 | data+game | 低 |
| 恐龍馴服 | 餵食恐龍→跟隨/騎乘 | data+game+sprites | 高 |

### 🟡 中優先 (v4.1~v4.5)
| 功能 | 描述 | 影響檔案 | 複雜度 |
|------|------|---------|--------|
| 天氣系統 | 雨/霧/風暴影響視野和速度 | tiles+game | 中 |
| 洞穴探索 | biome 5 實作，地下層級 | data+tiles+game | 高 |
| 排行榜 | 全服最佳生存時間/擊殺排行 | 需後端 | 高 |
| 建築系統 | 木牆/石牆/門，可合成建築基地 | data+game+sprites | 高 |

### 🟢 低優先 (長期)
| 功能 | 描述 | 影響檔案 | 複雜度 |
|------|------|---------|--------|
| 音效強化 | 不同恐龍/biome 音效 | audio | 低 |
| 成就系統 | 解鎖成就+稱號 | data+game | 中 |
| 季節系統 | 春夏秋冬循環影響資源+恐龍 | data+tiles+game | 高 |
| 多地圖 | 不同島嶼，不同恐龍組合 | data+tiles+game | 中 |

---

## 本地開發
```bash
python3 -m http.server 8080 -d "/Users/mac/claude projects/dino-island-survival"
```
開啟 http://localhost:8080

## Git
- Repository: `AlbertLiu16888/dino-island-survival`
- 每次改版 commit 後 push 並發送 Telegram 通知
- Bot: `8663047703:AAEXk5u02YQTq6QEQ_mjMxIQXz3tkJ2hyDU`
- Chat: `7651454233`
