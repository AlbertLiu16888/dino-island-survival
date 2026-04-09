// ===== 恐龍島求生記 — 遊戲資料 v3.3 =====
const GAME_DATA = {
    // 地圖設定
    MAP: {
        WIDTH: 80,        // tiles
        HEIGHT: 80,
        TILE_SIZE: 32,
        BIOMES: {
            CAMP: 0,
            GRASSLAND: 1,
            FOREST: 2,
            SWAMP: 3,
            VOLCANO: 4,
            CAVE: 5
        }
    },

    // 日夜循環 (毫秒)
    DAY_NIGHT: {
        DAY_DURATION: 120000,    // 2分鐘白天
        DUSK_DURATION: 30000,    // 30秒黃昏
        NIGHT_DURATION: 90000,   // 1.5分鐘黑夜
        PHASES: { DAY: 0, DUSK: 1, NIGHT: 2 }
    },

    // 玩家基礎屬性
    PLAYER: {
        MAX_HP: 100,
        MAX_HUNGER: 100,
        MAX_STAMINA: 100,
        SPEED: 160,
        SPRINT_SPEED: 240,
        ATTACK_BASE: 5,
        DEFENSE_BASE: 0,
        HUNGER_DECAY: 1,
        HUNGER_INTERVAL: 15000,
        HUNGER_DAMAGE: 2,
        STAMINA_REGEN: 0.5,
        INV_SIZE: 20
    },

    // 資源定義
    RESOURCES: {
        wood:  { name: '木材', icon: '🪵', biomes: [1, 2], rate: 0.08 },
        stone: { name: '石頭', icon: '🪨', biomes: [1, 2, 3], rate: 0.06 },
        herb:  { name: '草藥', icon: '🌿', biomes: [1, 2, 3], rate: 0.05 },
        iron:  { name: '鐵礦', icon: '⛏️', biomes: [3, 4], rate: 0.03 },
        fruit: { name: '野果', icon: '🍇', biomes: [1, 2], rate: 0.04 },
        speed_fruit: { name: '速度果實', icon: '💨', biomes: [2], rate: 0.015 },
        power_fruit: { name: '力量果實', icon: '💪', biomes: [3, 4], rate: 0.012 },
        hard_fruit:  { name: '堅硬果實', icon: '🛡️', biomes: [1, 3], rate: 0.012 }
    },

    // 物品定義
    ITEMS: {
        // 基礎資源
        wood:     { name: '木材', type: 'resource', stack: 99, desc: '基礎建材' },
        stone:    { name: '石頭', type: 'resource', stack: 99, desc: '基礎材料' },
        herb:     { name: '草藥', type: 'resource', stack: 99, desc: '藥用植物' },
        iron:     { name: '鐵礦', type: 'resource', stack: 99, desc: '金屬礦石' },
        leather:  { name: '皮革', type: 'resource', stack: 99, desc: '恐龍皮革' },
        bone:     { name: '骨頭', type: 'resource', stack: 99, desc: '恐龍骨骼' },
        meat:     { name: '生肉', type: 'resource', stack: 99, desc: '未烹飪的肉' },
        // 果實
        fruit:    { name: '野果', type: 'food', stack: 99, desc: '飢餓+8', hunger: 8 },
        speed_fruit: { name: '速度果實', type: 'food', stack: 99, desc: '速度+30% 30秒', hunger: 5, buff: 'speed', buffMult: 1.3, buffDur: 30 },
        power_fruit: { name: '力量果實', type: 'food', stack: 99, desc: '攻擊+50% 30秒', hunger: 5, buff: 'attack', buffMult: 1.5, buffDur: 30 },
        hard_fruit:  { name: '堅硬果實', type: 'food', stack: 99, desc: '防禦+10 30秒', hunger: 5, buff: 'defense', buffVal: 10, buffDur: 30 },
        // 烹飪食物
        cooked_meat: { name: '烤肉', type: 'food', stack: 99, desc: '飢餓+25 HP+5', hunger: 25, hp: 5 },
        stew:     { name: '燉湯', type: 'food', stack: 99, desc: '飢餓+50 HP+15', hunger: 50, hp: 15 },
        antidote: { name: '解毒藥', type: 'food', stack: 99, desc: '解除中毒', cleanse: true },
        heal_pot: { name: '治療藥水', type: 'food', stack: 99, desc: 'HP+40', hp: 40 },
        // 烹飪鍋料理
        speed_soup:  { name: '疾風湯', type: 'food', stack: 99, desc: '速度+40% 60秒 飢餓+30', hunger: 30, buff: 'speed', buffMult: 1.4, buffDur: 60 },
        power_steak: { name: '力量排餐', type: 'food', stack: 99, desc: '攻擊+80% 60秒 飢餓+30', hunger: 30, buff: 'attack', buffMult: 1.8, buffDur: 60 },
        iron_stew:   { name: '鐵壁燉鍋', type: 'food', stack: 99, desc: '防禦+20 60秒 飢餓+40', hunger: 40, buff: 'defense', buffVal: 20, buffDur: 60 },
        mega_feast:  { name: '豪華大餐', type: 'food', stack: 99, desc: 'HP+60 飢餓+80 全增益30秒', hunger: 80, hp: 60, buff: 'all', buffMult: 1.3, buffVal: 8, buffDur: 30 },
        fruit_salad: { name: '水果沙拉', type: 'food', stack: 99, desc: '飢餓+60 HP+20', hunger: 60, hp: 20 },
        herb_tea:    { name: '草本茶', type: 'food', stack: 99, desc: 'HP+30 解毒 飢餓+15', hunger: 15, hp: 30, cleanse: true },
        // 武器
        stone_axe:  { name: '石斧', type: 'weapon', stack: 1, atk: 8, desc: '攻擊+8' },
        stone_spear:{ name: '石矛', type: 'weapon', stack: 1, atk: 10, range: 1.3, desc: '攻擊+10' },
        iron_axe:   { name: '鐵斧', type: 'weapon', stack: 1, atk: 18, desc: '攻擊+18' },
        iron_spear: { name: '鐵矛', type: 'weapon', stack: 1, atk: 22, range: 1.5, desc: '攻擊+22' },
        wood_bow:   { name: '簡易弓', type: 'weapon', stack: 1, atk: 6, ranged: true, desc: '遠程攻擊+6' },
        // 防具
        grass_armor:{ name: '草甲', type: 'armor', slot: 'body', stack: 1, def: 3, desc: '防禦+3' },
        leather_armor:{ name: '皮甲', type: 'armor', slot: 'body', stack: 1, def: 8, desc: '防禦+8' },
        iron_armor: { name: '鐵甲', type: 'armor', slot: 'body', stack: 1, def: 15, desc: '防禦+15' },
        // 工具 & 放置物
        torch:    { name: '火把', type: 'tool', stack: 99, desc: '照亮周圍，驅趕小型恐龍', light: 150, duration: 120 },
        campfire: { name: '營火', type: 'placeable', stack: 99, desc: '安全據點，可合成/烹飪', light: 300 },
        trap:     { name: '石陷阱', type: 'placeable', stack: 99, desc: '傷害15，減速50%', dmg: 15 },
        chest:    { name: '儲藏箱', type: 'placeable', stack: 99, desc: '共享20格儲物空間', slots: 20 },
        cooking_pot: { name: '烹飪鍋', type: 'placeable', stack: 99, desc: '投入食材烹飪料理', slots: 3 }
    },

    // 基礎合成配方 (合成台)
    RECIPES: [
        { id: 'stone_axe', result: 'stone_axe', qty: 1, mats: { wood: 3, stone: 2 }, time: 3 },
        { id: 'stone_spear', result: 'stone_spear', qty: 1, mats: { wood: 4, stone: 3 }, time: 4 },
        { id: 'wood_bow', result: 'wood_bow', qty: 1, mats: { wood: 5, leather: 2 }, time: 5 },
        { id: 'iron_axe', result: 'iron_axe', qty: 1, mats: { wood: 2, iron: 6 }, time: 5, needFire: true },
        { id: 'iron_spear', result: 'iron_spear', qty: 1, mats: { wood: 3, iron: 8 }, time: 6, needFire: true },
        { id: 'grass_armor', result: 'grass_armor', qty: 1, mats: { herb: 10 }, time: 3 },
        { id: 'leather_armor', result: 'leather_armor', qty: 1, mats: { leather: 8, bone: 2 }, time: 5, needFire: true },
        { id: 'iron_armor', result: 'iron_armor', qty: 1, mats: { iron: 12, leather: 4 }, time: 8, needFire: true },
        { id: 'cooked_meat', result: 'cooked_meat', qty: 1, mats: { meat: 1 }, time: 3, needFire: true },
        { id: 'stew', result: 'stew', qty: 1, mats: { meat: 3, herb: 2 }, time: 6, needFire: true },
        { id: 'antidote', result: 'antidote', qty: 1, mats: { herb: 5 }, time: 3 },
        { id: 'heal_pot', result: 'heal_pot', qty: 1, mats: { herb: 8, meat: 1 }, time: 5, needFire: true },
        { id: 'torch', result: 'torch', qty: 2, mats: { wood: 2, herb: 1 }, time: 2 },
        { id: 'campfire', result: 'campfire', qty: 1, mats: { wood: 10, stone: 5 }, time: 5 },
        { id: 'trap', result: 'trap', qty: 1, mats: { stone: 5, wood: 3 }, time: 4 },
        { id: 'chest', result: 'chest', qty: 1, mats: { wood: 15, stone: 5, iron: 2 }, time: 6 },
        { id: 'cooking_pot', result: 'cooking_pot', qty: 1, mats: { stone: 10, iron: 5, wood: 5 }, time: 8, needFire: true }
    ],

    // 烹飪鍋食譜 (3格食材 → 料理)
    COOKING_RECIPES: [
        { id: 'speed_soup', result: 'speed_soup', qty: 1, name: '疾風湯',
          slots: ['speed_fruit','meat','herb'], desc: '速度+40% 60秒' },
        { id: 'power_steak', result: 'power_steak', qty: 1, name: '力量排餐',
          slots: ['power_fruit','meat','meat'], desc: '攻擊+80% 60秒' },
        { id: 'iron_stew', result: 'iron_stew', qty: 1, name: '鐵壁燉鍋',
          slots: ['hard_fruit','meat','stone'], desc: '防禦+20 60秒' },
        { id: 'mega_feast', result: 'mega_feast', qty: 1, name: '豪華大餐',
          slots: ['speed_fruit','power_fruit','hard_fruit'], desc: '全增益30秒' },
        { id: 'fruit_salad', result: 'fruit_salad', qty: 1, name: '水果沙拉',
          slots: ['fruit','speed_fruit','herb'], desc: '飢餓+60 HP+20' },
        { id: 'herb_tea', result: 'herb_tea', qty: 1, name: '草本茶',
          slots: ['herb','herb','fruit'], desc: 'HP+30 解毒' },
        { id: 'cooked_meat2', result: 'cooked_meat', qty: 3, name: '大量烤肉',
          slots: ['meat','meat','meat'], desc: '烤肉x3' },
        { id: 'stew2', result: 'stew', qty: 2, name: '大鍋燉湯',
          slots: ['meat','herb','fruit'], desc: '燉湯x2' }
    ],

    // 恐龍定義
    DINOS: {
        raptor: {
            name: '迅猛龍', hp: 30, atk: 12, def: 2, speed: 140,
            size: 24, color: 0x4CAF50, biomes: [1, 2, 3],
            drops: [['meat', 1], ['leather', 1]], xp: 10,
            aggro: 120, detectRange: 150, pack: 3, nightBuff: true
        },
        oviraptor: {
            name: '竊蛋龍', hp: 20, atk: 5, def: 1, speed: 160,
            size: 20, color: 0xFFEB3B, biomes: [1, 2],
            drops: [['meat', 1]], xp: 5,
            aggro: 80, detectRange: 100, flee: true
        },
        trike: {
            name: '三角龍', hp: 80, atk: 20, def: 15, speed: 80,
            size: 36, color: 0x795548, biomes: [1],
            drops: [['meat', 3], ['leather', 2], ['bone', 1]], xp: 25,
            aggro: 200, detectRange: 80, passive: true
        },
        stego: {
            name: '劍龍', hp: 70, atk: 15, def: 20, speed: 70,
            size: 34, color: 0xFF9800, biomes: [2],
            drops: [['meat', 3], ['bone', 2]], xp: 20,
            aggro: 180, detectRange: 80, passive: true, reflect: 0.3
        },
        dilopho: {
            name: '雙脊龍', hp: 35, atk: 15, def: 3, speed: 120,
            size: 26, color: 0x9C27B0, biomes: [3],
            drops: [['meat', 1]], xp: 15,
            aggro: 150, detectRange: 160, poison: true
        },
        allo: {
            name: '異特龍', hp: 150, atk: 35, def: 12, speed: 130,
            size: 40, color: 0x311B92, biomes: [2, 3],
            drops: [['meat', 4], ['leather', 3], ['bone', 2]], xp: 50,
            aggro: 250, detectRange: 200, nightOnly: true, nightBuff: true
        },
        trex: {
            name: '暴龍', hp: 200, atk: 45, def: 20, speed: 110,
            size: 48, color: 0xB71C1C, biomes: [4],
            drops: [['meat', 5], ['bone', 3]], xp: 100,
            aggro: 300, detectRange: 250, boss: true
        },
        spino: {
            name: '棘龍', hp: 180, atk: 40, def: 15, speed: 100,
            size: 46, color: 0x0D47A1, biomes: [3],
            drops: [['meat', 5], ['bone', 2]], xp: 80,
            aggro: 280, detectRange: 220, boss: true
        }
    }
};
