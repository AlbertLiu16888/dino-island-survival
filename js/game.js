// ===== 恐龍島求生記 — 主遊戲引擎 =====
const D = GAME_DATA;
const TILE = D.MAP.TILE_SIZE;
const MW = D.MAP.WIDTH * TILE;
const MH = D.MAP.HEIGHT * TILE;

// ============================================
// Utility
// ============================================
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[rndInt(0, arr.length - 1)];

// ============================================
// Boot Scene — load assets
// ============================================
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const bar = this.add.rectangle(w / 2, h / 2, w * 0.6, 20, 0x2F5233).setOrigin(0.5);
        const fill = this.add.rectangle(w / 2 - w * 0.3, h / 2, 0, 16, 0x4CAF50).setOrigin(0, 0.5);
        const txt = this.add.text(w / 2, h / 2 - 40, '載入中...', { fontSize: '18px', fill: '#A8D08D', fontFamily: 'Arial' }).setOrigin(0.5);
        this.load.on('progress', v => { fill.width = w * 0.6 * v; });
        this.load.on('complete', () => { txt.setText('完成!'); });

        // Load all generated assets
        const base = 'assets/';
        // Scenes
        ['camp', 'grassland', 'forest', 'swamp', 'volcano', 'cave', 'bay', 'highland', 'temple', 'river', 'night_overlay', 'dusk_overlay'].forEach(s =>
            this.load.image('scene_' + s, base + 'scenes/scene_' + s + '.png'));
        // Tiles
        ['grass', 'forest', 'swamp', 'volcano', 'cave'].forEach(t =>
            this.load.image('tiles_' + t, base + 'tiles/tiles_' + t + '.png'));
        // Characters
        ['base', 'attack', 'armor_grass', 'armor_leather', 'armor_iron', 'armor_steel', 'death'].forEach(c =>
            this.load.image('player_' + c, base + 'characters/player_' + c + '.png'));
        // Dinosaurs
        ['velociraptor', 'oviraptor', 'archaeopteryx', 'dilophosaurus', 'deinonychus',
         'triceratops', 'ankylosaurus', 'parasaurolophus', 'pachycephalosaurus', 'stegosaurus',
         'pteranodon', 'trex', 'spinosaurus', 'allosaurus', 'ceratosaurus', 'therizinosaurus',
         'mosasaurus', 'giganotosaurus'].forEach(d =>
            this.load.image('dino_' + d, base + 'dinosaurs/dino_' + d + '.png'));
        // Items
        ['resources', 'weapons', 'armor', 'food', 'tools'].forEach(i =>
            this.load.image('items_' + i, base + 'items/items_' + i + '.png'));
        // UI
        ['hud_bars', 'minimap_frame', 'inventory', 'crafting', 'daynight_indicator',
         'dialogue_box', 'lobby', 'leaderboard', 'game_logo', 'loading_screen', 'safe_zone_border'].forEach(u =>
            this.load.image('ui_' + u, base + 'ui/ui_' + u + '.png'));
        // Effects
        ['campfire', 'slash', 'damage', 'heal', 'poison', 'arrow', 'dino_death', 'earthquake'].forEach(e =>
            this.load.image('fx_' + e, base + 'effects/fx_' + e + '.png'));
    }
    create() { this.scene.start('Menu'); }
}

// ============================================
// Menu Scene
// ============================================
class MenuScene extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(0, 0, w, h, 0x0a1a0a).setOrigin(0).setScrollFactor(0);

        // Logo
        if (this.textures.exists('ui_game_logo')) {
            this.add.image(w / 2, h * 0.22, 'ui_game_logo').setScale(Math.min(0.6, w / 800));
        }
        this.add.text(w / 2, h * 0.38, '恐龍島求生記', {
            fontSize: Math.min(36, w * 0.08) + 'px', fill: '#A8D08D',
            fontFamily: 'Arial', fontStyle: 'bold', stroke: '#1B5E20', strokeThickness: 4
        }).setOrigin(0.5);
        this.add.text(w / 2, h * 0.44, 'DINO ISLAND SURVIVAL', {
            fontSize: Math.min(14, w * 0.035) + 'px', fill: '#66BB6A', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Start button
        const btnW = Math.min(220, w * 0.55), btnH = 50;
        const btn = this.add.rectangle(w / 2, h * 0.58, btnW, btnH, 0x2E7D32, 0.9).setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(w / 2, h * 0.58, '開始冒險', {
            fontSize: '22px', fill: '#fff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);
        btn.on('pointerover', () => btn.setFillStyle(0x388E3C));
        btn.on('pointerout', () => btn.setFillStyle(0x2E7D32));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Controls info
        const isMobile = this.sys.game.device.input.touch;
        const controlText = isMobile ? '觸控搖桿移動 | 點擊按鈕攻擊/採集' : 'WASD移動 | 空白鍵攻擊 | E採集 | I背包 | C合成 | F使用物品';
        this.add.text(w / 2, h * 0.72, controlText, {
            fontSize: Math.min(12, w * 0.03) + 'px', fill: '#81C784', fontFamily: 'Arial',
            wordWrap: { width: w * 0.85 }, align: 'center'
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.92, 'v1.0 — 1~6人生存冒險', {
            fontSize: '11px', fill: '#4CAF50', fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
}

// ============================================
// Game Scene — Main Gameplay
// ============================================
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    create() {
        this.mapData = [];
        this.resources = [];
        this.dinos = [];
        this.campfires = [];
        this.traps = [];
        this.damageTexts = [];
        this.gameTime = 0;
        this.dayPhase = D.DAY_NIGHT.PHASES.DAY;
        this.dayTimer = 0;
        this.kills = 0;
        this.survivalTime = 0;
        this.isMobile = this.sys.game.device.input.touch;

        this.generateMap();
        this.createPlayer();
        this.spawnResources();
        this.spawnDinos();
        this.setupCamera();
        this.setupInput();
        this.scene.launch('UI', { gameScene: this });

        // Hunger timer
        this.time.addEvent({ delay: D.PLAYER.HUNGER_INTERVAL, callback: this.tickHunger, callbackScope: this, loop: true });
        // Stamina regen
        this.time.addEvent({ delay: 500, callback: () => {
            if (!this.player.sprinting && this.player.stamina < D.PLAYER.MAX_STAMINA)
                this.player.stamina = Math.min(D.PLAYER.MAX_STAMINA, this.player.stamina + D.PLAYER.STAMINA_REGEN * 2);
        }, loop: true });
        // Resource respawn
        this.time.addEvent({ delay: 30000, callback: this.respawnResources, callbackScope: this, loop: true });
        // Dino respawn
        this.time.addEvent({ delay: 45000, callback: this.respawnDinos, callbackScope: this, loop: true });
    }

    // ===== Map Generation =====
    generateMap() {
        const W = D.MAP.WIDTH, H = D.MAP.HEIGHT;
        const cx = W / 2, cy = H / 2;
        for (let y = 0; y < H; y++) {
            this.mapData[y] = [];
            for (let x = 0; x < W; x++) {
                const d = Math.hypot(x - cx, y - cy);
                let biome;
                if (d < 5) biome = D.MAP.BIOMES.CAMP;
                else if (d < 20) biome = D.MAP.BIOMES.GRASSLAND;
                else if (d < 32) biome = D.MAP.BIOMES.FOREST;
                else if (d < 38) biome = D.MAP.BIOMES.SWAMP;
                else biome = D.MAP.BIOMES.VOLCANO;
                // Add noise
                if (biome > 0 && biome < 4 && Math.random() < 0.1) biome = clamp(biome + (Math.random() > 0.5 ? 1 : -1), 1, 4);
                this.mapData[y][x] = biome;
            }
        }
        this.renderMap();
    }

    renderMap() {
        const colors = [0x2E7D32, 0x66BB6A, 0x33691E, 0x4A148C, 0xBF360C, 0x37474F];
        const gfx = this.add.graphics();
        for (let y = 0; y < D.MAP.HEIGHT; y++) {
            for (let x = 0; x < D.MAP.WIDTH; x++) {
                const b = this.mapData[y][x];
                let c = colors[b];
                // Slight variation
                const v = rndInt(-10, 10);
                const r = clamp(((c >> 16) & 0xFF) + v, 0, 255);
                const g = clamp(((c >> 8) & 0xFF) + v, 0, 255);
                const bl = clamp((c & 0xFF) + v, 0, 255);
                gfx.fillStyle((r << 16) | (g << 8) | bl);
                gfx.fillRect(x * TILE, y * TILE, TILE, TILE);
            }
        }
        // Camp boundary
        const campCx = D.MAP.WIDTH / 2 * TILE, campCy = D.MAP.HEIGHT / 2 * TILE;
        gfx.lineStyle(2, 0xFFD54F, 0.8);
        gfx.strokeCircle(campCx, campCy, 5 * TILE);

        // World bounds
        this.physics.world.setBounds(0, 0, MW, MH);
    }

    // ===== Player =====
    createPlayer() {
        const cx = D.MAP.WIDTH / 2 * TILE, cy = D.MAP.HEIGHT / 2 * TILE;
        this.player = this.add.circle(cx, cy, 12, 0xFFEB3B).setDepth(10);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setCircle(12);

        // Player state
        Object.assign(this.player, {
            hp: D.PLAYER.MAX_HP, maxHp: D.PLAYER.MAX_HP,
            hunger: D.PLAYER.MAX_HUNGER, maxHunger: D.PLAYER.MAX_HUNGER,
            stamina: D.PLAYER.MAX_STAMINA, maxStamina: D.PLAYER.MAX_STAMINA,
            atk: D.PLAYER.ATTACK_BASE, def: D.PLAYER.DEFENSE_BASE,
            speed: D.PLAYER.SPEED, sprinting: false,
            inventory: [], equipped: { weapon: null, armor: null },
            facing: { x: 0, y: 1 }, alive: true,
            invincible: false, poisoned: false, poisonTimer: null,
            lightRadius: 0, torchActive: false
        });

        // Give starting items
        this.addItem('wood', 5);
        this.addItem('stone', 3);
        this.addItem('herb', 3);
        this.addItem('fruit', 5);
    }

    // ===== Resources =====
    spawnResources() {
        for (let y = 0; y < D.MAP.HEIGHT; y++) {
            for (let x = 0; x < D.MAP.WIDTH; x++) {
                const b = this.mapData[y][x];
                if (b === 0) continue;
                for (const [key, res] of Object.entries(D.RESOURCES)) {
                    if (res.biomes.includes(b) && Math.random() < res.rate) {
                        this.createResource(key, x * TILE + TILE / 2, y * TILE + TILE / 2);
                    }
                }
            }
        }
    }

    createResource(type, x, y) {
        const res = D.RESOURCES[type];
        const colors = { wood: 0x8D6E63, stone: 0x9E9E9E, herb: 0x4CAF50, iron: 0xB0BEC5, fruit: 0xE91E63 };
        const r = this.add.circle(x, y, 6, colors[type] || 0xFFFFFF).setDepth(3).setAlpha(0.85);
        this.physics.add.existing(r, true);
        r.type = type;
        r.resData = res;
        this.resources.push(r);
        return r;
    }

    respawnResources() {
        if (this.resources.length < 400) {
            for (let i = 0; i < 20; i++) {
                const x = rndInt(5, D.MAP.WIDTH - 5);
                const y = rndInt(5, D.MAP.HEIGHT - 5);
                const b = this.mapData[y][x];
                if (b === 0) continue;
                for (const [key, res] of Object.entries(D.RESOURCES)) {
                    if (res.biomes.includes(b) && Math.random() < 0.3) {
                        this.createResource(key, x * TILE + TILE / 2, y * TILE + TILE / 2);
                        break;
                    }
                }
            }
        }
    }

    // ===== Dinosaurs =====
    spawnDinos() {
        for (const [key, data] of Object.entries(D.DINOS)) {
            const count = data.boss ? 1 : (data.pack || 1) * 3;
            for (let i = 0; i < count; i++) {
                this.createDino(key, data);
            }
        }
    }

    createDino(key, data) {
        let x, y, attempts = 0;
        do {
            x = rndInt(3, D.MAP.WIDTH - 3);
            y = rndInt(3, D.MAP.HEIGHT - 3);
            attempts++;
        } while ((!data.biomes.includes(this.mapData[y]?.[x]) || this.mapData[y][x] === 0) && attempts < 50);
        if (attempts >= 50) return null;

        const px = x * TILE + TILE / 2, py = y * TILE + TILE / 2;
        const dino = this.add.circle(px, py, data.size / 2, data.color).setDepth(5);
        this.physics.add.existing(dino);
        dino.body.setCollideWorldBounds(true);
        dino.body.setCircle(data.size / 2);

        Object.assign(dino, {
            key, dinoData: { ...data }, hp: data.hp, maxHp: data.hp,
            state: 'patrol',  // patrol, chase, attack, flee, dead
            patrolTarget: { x: px + rnd(-100, 100), y: py + rnd(-100, 100) },
            homeX: px, homeY: py, attackCd: 0, alive: true, visible: true
        });
        // HP bar bg
        dino.hpBg = this.add.rectangle(px, py - data.size / 2 - 8, 30, 4, 0x333333).setDepth(6);
        dino.hpBar = this.add.rectangle(px, py - data.size / 2 - 8, 30, 4, 0xFF1744).setDepth(7).setOrigin(0, 0.5);
        dino.hpBar.x = px - 15;
        dino.nameTxt = this.add.text(px, py - data.size / 2 - 16, data.name, {
            fontSize: '9px', fill: '#fff', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(7);

        this.dinos.push(dino);
        return dino;
    }

    respawnDinos() {
        const alive = this.dinos.filter(d => d.alive);
        if (alive.length < 15) {
            const keys = Object.keys(D.DINOS);
            for (let i = 0; i < 3; i++) {
                const key = pick(keys);
                const data = D.DINOS[key];
                if (data.nightOnly && this.dayPhase !== D.DAY_NIGHT.PHASES.NIGHT) continue;
                this.createDino(key, data);
            }
        }
    }

    // ===== Camera =====
    setupCamera() {
        this.cameras.main.setBounds(0, 0, MW, MH);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.8);

        // Day/night overlay
        this.overlay = this.add.rectangle(MW / 2, MH / 2, MW, MH, 0x000033, 0).setDepth(50).setScrollFactor(0);
        // Keep overlay covering camera view
        this.overlay.setScrollFactor(0);
        this.overlay.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);
        this.overlay.setSize(this.cameras.main.width * 2, this.cameras.main.height * 2);
    }

    // ===== Input =====
    setupInput() {
        this.keys = this.input.keyboard?.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D',
            space: 'SPACE', e: 'E', i: 'I', c: 'C', f: 'F',
            shift: 'SHIFT', esc: 'ESC'
        });

        // Mobile touch joystick
        if (this.isMobile) this.setupTouch();
        this.moveVec = { x: 0, y: 0 };
    }

    setupTouch() {
        this.joystick = { active: false, baseX: 0, baseY: 0, dx: 0, dy: 0 };
        this.input.on('pointerdown', (p) => {
            if (p.x < this.cameras.main.width * 0.4 && p.y > this.cameras.main.height * 0.5) {
                this.joystick.active = true;
                this.joystick.baseX = p.x;
                this.joystick.baseY = p.y;
            }
        });
        this.input.on('pointermove', (p) => {
            if (this.joystick.active) {
                this.joystick.dx = clamp((p.x - this.joystick.baseX) / 50, -1, 1);
                this.joystick.dy = clamp((p.y - this.joystick.baseY) / 50, -1, 1);
            }
        });
        this.input.on('pointerup', () => {
            this.joystick.active = false;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
        });
    }

    // ===== Inventory =====
    addItem(id, qty = 1) {
        const itemDef = D.ITEMS[id];
        if (!itemDef) return false;
        const inv = this.player.inventory;
        // Stack existing
        const existing = inv.find(s => s.id === id && s.qty < itemDef.stack);
        if (existing) {
            const add = Math.min(qty, itemDef.stack - existing.qty);
            existing.qty += add;
            if (qty - add > 0) return this.addItem(id, qty - add);
            return true;
        }
        // New slot
        if (inv.length >= D.PLAYER.INV_SIZE) return false;
        inv.push({ id, qty: Math.min(qty, itemDef.stack) });
        return true;
    }

    removeItem(id, qty = 1) {
        const inv = this.player.inventory;
        let remaining = qty;
        for (let i = inv.length - 1; i >= 0; i--) {
            if (inv[i].id === id) {
                const take = Math.min(remaining, inv[i].qty);
                inv[i].qty -= take;
                remaining -= take;
                if (inv[i].qty <= 0) inv.splice(i, 1);
                if (remaining <= 0) return true;
            }
        }
        return remaining <= 0;
    }

    countItem(id) {
        return this.player.inventory.reduce((sum, s) => s.id === id ? sum + s.qty : sum, 0);
    }

    hasItems(mats) {
        return Object.entries(mats).every(([id, qty]) => this.countItem(id) >= qty);
    }

    useItem(slot) {
        const item = this.player.inventory[slot];
        if (!item) return;
        const def = D.ITEMS[item.id];
        if (def.type === 'food') {
            if (def.hunger) this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + def.hunger);
            if (def.hp) this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.hp);
            if (def.cleanse && this.player.poisoned) {
                this.player.poisoned = false;
                if (this.player.poisonTimer) this.player.poisonTimer.remove();
            }
            this.showFloatingText(this.player.x, this.player.y - 20, def.hunger ? `+${def.hunger} 飽食` : `+${def.hp} HP`, '#4CAF50');
            item.qty--;
            if (item.qty <= 0) this.player.inventory.splice(slot, 1);
        } else if (def.type === 'weapon') {
            this.player.equipped.weapon = item.id;
            this.player.atk = D.PLAYER.ATTACK_BASE + (def.atk || 0);
            this.showFloatingText(this.player.x, this.player.y - 20, `裝備 ${def.name}`, '#FFC107');
        } else if (def.type === 'armor') {
            this.player.equipped.armor = item.id;
            this.player.def = D.PLAYER.DEFENSE_BASE + (def.def || 0);
            this.showFloatingText(this.player.x, this.player.y - 20, `裝備 ${def.name}`, '#2196F3');
        } else if (item.id === 'torch') {
            this.player.torchActive = true;
            this.player.lightRadius = def.light;
            item.qty--;
            if (item.qty <= 0) this.player.inventory.splice(slot, 1);
            this.showFloatingText(this.player.x, this.player.y - 20, '點燃火把', '#FF9800');
            this.time.delayedCall(def.duration * 1000, () => {
                this.player.torchActive = false;
                this.player.lightRadius = 0;
                this.showFloatingText(this.player.x, this.player.y - 20, '火把熄滅', '#9E9E9E');
            });
        } else if (item.id === 'campfire') {
            const cx = this.player.x, cy = this.player.y;
            const cf = this.add.circle(cx, cy, 10, 0xFF6D00).setDepth(4);
            this.physics.add.existing(cf, true);
            cf.light = def.light;
            this.campfires.push(cf);
            item.qty--;
            if (item.qty <= 0) this.player.inventory.splice(slot, 1);
            this.showFloatingText(cx, cy - 20, '放置營火', '#FF6D00');
        } else if (item.id === 'trap') {
            const tx = this.player.x, ty = this.player.y;
            const trap = this.add.circle(tx, ty, 8, 0x795548, 0.6).setDepth(2);
            this.physics.add.existing(trap, true);
            trap.dmg = def.dmg;
            trap.active = true;
            this.traps.push(trap);
            item.qty--;
            if (item.qty <= 0) this.player.inventory.splice(slot, 1);
            this.showFloatingText(tx, ty - 20, '放置陷阱', '#795548');
        }
    }

    // ===== Crafting =====
    canCraft(recipe) {
        if (!this.hasItems(recipe.mats)) return false;
        if (recipe.needFire) {
            const nearFire = this.campfires.some(cf => dist(cf, this.player) < 150);
            const inCamp = this.isInCamp(this.player.x, this.player.y);
            if (!nearFire && !inCamp) return false;
        }
        return true;
    }

    craft(recipe) {
        if (!this.canCraft(recipe)) return false;
        for (const [id, qty] of Object.entries(recipe.mats)) this.removeItem(id, qty);
        this.addItem(recipe.result, recipe.qty);
        this.showFloatingText(this.player.x, this.player.y - 20, `合成 ${D.ITEMS[recipe.result].name} x${recipe.qty}`, '#FFC107');
        return true;
    }

    // ===== Combat =====
    playerAttack() {
        if (!this.player.alive) return;
        const range = 50 + (D.ITEMS[this.player.equipped.weapon]?.range || 1) * 10;
        const fx = this.player.facing;
        const ax = this.player.x + fx.x * 20;
        const ay = this.player.y + fx.y * 20;

        // Attack flash
        const slash = this.add.circle(ax, ay, range / 2, 0xFFFFFF, 0.5).setDepth(20);
        this.tweens.add({ targets: slash, alpha: 0, scale: 1.5, duration: 200, onComplete: () => slash.destroy() });

        this.dinos.forEach(dino => {
            if (!dino.alive) return;
            if (dist({ x: ax, y: ay }, dino) < range) {
                const dmg = Math.max(1, this.player.atk - dino.dinoData.def / 2);
                this.damageDino(dino, dmg);
                if (dino.dinoData.passive && dino.state === 'patrol') dino.state = 'chase';
                if (dino.dinoData.reflect) {
                    const ref = Math.floor(dmg * dino.dinoData.reflect);
                    this.damagePlayer(ref, '反傷');
                }
            }
        });
    }

    damageDino(dino, dmg) {
        dino.hp -= dmg;
        this.showFloatingText(dino.x, dino.y - 20, `-${Math.floor(dmg)}`, '#FF5252');
        dino.setFillStyle(0xFFFFFF);
        this.time.delayedCall(100, () => { if (dino.alive) dino.setFillStyle(dino.dinoData.color); });

        if (dino.dinoData.flee) dino.state = 'flee';
        else if (dino.state === 'patrol') dino.state = 'chase';

        if (dino.hp <= 0) this.killDino(dino);
    }

    killDino(dino) {
        dino.alive = false;
        dino.state = 'dead';
        this.kills++;
        // Drops
        dino.dinoData.drops.forEach(([id, qty]) => {
            if (Math.random() < 0.8) this.addItem(id, qty);
        });
        this.showFloatingText(dino.x, dino.y - 30, `+${dino.dinoData.xp} XP`, '#FFD54F');
        // Death effect
        this.tweens.add({
            targets: [dino, dino.hpBg, dino.hpBar, dino.nameTxt],
            alpha: 0, scale: 0.3, duration: 500,
            onComplete: () => {
                dino.destroy();
                dino.hpBg.destroy();
                dino.hpBar.destroy();
                dino.nameTxt.destroy();
            }
        });
        this.dinos = this.dinos.filter(d => d !== dino);
    }

    damagePlayer(dmg, label = '') {
        if (this.player.invincible || !this.player.alive) return;
        const actual = Math.max(1, dmg - this.player.def / 2);
        this.player.hp -= actual;
        this.showFloatingText(this.player.x, this.player.y - 25, `-${Math.floor(actual)}${label ? ' ' + label : ''}`, '#FF1744');

        // Flash red
        this.player.setFillStyle(0xFF0000);
        this.player.invincible = true;
        this.time.delayedCall(400, () => {
            if (this.player.alive) {
                this.player.setFillStyle(0xFFEB3B);
                this.player.invincible = false;
            }
        });

        // Screen shake
        this.cameras.main.shake(100, 0.005);

        if (this.player.hp <= 0) this.playerDeath();
    }

    playerDeath() {
        this.player.alive = false;
        this.player.setFillStyle(0x555555);
        this.player.body.setVelocity(0, 0);
        this.showFloatingText(this.player.x, this.player.y - 40, '你倒下了...', '#FF1744');

        // Drop 30% resources
        const inv = this.player.inventory;
        for (let i = inv.length - 1; i >= 0; i--) {
            if (D.ITEMS[inv[i].id]?.type === 'resource') {
                const drop = Math.ceil(inv[i].qty * 0.3);
                inv[i].qty -= drop;
                if (inv[i].qty <= 0) inv.splice(i, 1);
            }
        }

        // Respawn after 3s
        this.time.delayedCall(3000, () => {
            const cx = D.MAP.WIDTH / 2 * TILE, cy = D.MAP.HEIGHT / 2 * TILE;
            this.player.x = cx; this.player.y = cy;
            this.player.hp = D.PLAYER.MAX_HP / 2;
            this.player.hunger = D.PLAYER.MAX_HUNGER / 2;
            this.player.stamina = D.PLAYER.MAX_STAMINA;
            this.player.alive = true;
            this.player.setFillStyle(0xFFEB3B);
            this.showFloatingText(cx, cy - 30, '在營地重生', '#4CAF50');
        });
    }

    // ===== Gather =====
    gather() {
        if (!this.player.alive) return;
        let closest = null, minD = 45;
        this.resources.forEach(r => {
            const d = dist(r, this.player);
            if (d < minD) { minD = d; closest = r; }
        });
        if (closest) {
            if (this.addItem(closest.type, 1)) {
                this.showFloatingText(closest.x, closest.y - 10, `+1 ${D.RESOURCES[closest.type].name}`, '#81C784');
                closest.destroy();
                this.resources = this.resources.filter(r => r !== closest);
            } else {
                this.showFloatingText(this.player.x, this.player.y - 20, '背包已滿!', '#FF5252');
            }
        }
    }

    // ===== Systems =====
    tickHunger() {
        if (!this.player.alive) return;
        const rate = this.player.sprinting ? D.PLAYER.HUNGER_DECAY * 2 : D.PLAYER.HUNGER_DECAY;
        this.player.hunger = Math.max(0, this.player.hunger - rate);
        if (this.player.hunger <= 0) {
            this.damagePlayer(D.PLAYER.HUNGER_DAMAGE, '飢餓');
        }
    }

    isInCamp(x, y) {
        const cx = D.MAP.WIDTH / 2 * TILE, cy = D.MAP.HEIGHT / 2 * TILE;
        return dist({ x, y }, { x: cx, y: cy }) < 5 * TILE;
    }

    getDayPhaseStr() {
        return ['☀️ 白天', '🌅 黃昏', '🌙 黑夜'][this.dayPhase];
    }

    getBiomeName(x, y) {
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        const b = this.mapData[ty]?.[tx];
        return ['營地', '草原', '森林', '沼澤', '火山', '洞穴'][b] || '未知';
    }

    showFloatingText(x, y, text, color = '#fff') {
        const txt = this.add.text(x, y, text, {
            fontSize: '11px', fill: color, fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: txt, y: y - 30, alpha: 0, duration: 1200, onComplete: () => txt.destroy() });
    }

    // ===== Main Update Loop =====
    update(time, delta) {
        if (!this.player.alive) return;
        this.gameTime += delta;
        this.survivalTime += delta;

        this.updateDayNight(delta);
        this.updatePlayerMovement(delta);
        this.updateDinoAI(delta);
        this.updateTraps();
        this.updateSwampDamage(delta);
    }

    updateDayNight(delta) {
        this.dayTimer += delta;
        const { DAY_DURATION, DUSK_DURATION, NIGHT_DURATION, PHASES } = D.DAY_NIGHT;
        const cycle = DAY_DURATION + DUSK_DURATION + NIGHT_DURATION;
        const t = this.dayTimer % cycle;

        if (t < DAY_DURATION) {
            this.dayPhase = PHASES.DAY;
            this.overlay.setAlpha(0);
        } else if (t < DAY_DURATION + DUSK_DURATION) {
            this.dayPhase = PHASES.DUSK;
            const p = (t - DAY_DURATION) / DUSK_DURATION;
            this.overlay.setFillStyle(0x331100);
            this.overlay.setAlpha(p * 0.3);
        } else {
            this.dayPhase = PHASES.NIGHT;
            const torch = this.player.torchActive || this.campfires.some(cf => dist(cf, this.player) < 150);
            this.overlay.setFillStyle(0x000033);
            this.overlay.setAlpha(torch ? 0.35 : 0.6);
        }
    }

    updatePlayerMovement() {
        const p = this.player;
        let vx = 0, vy = 0;

        if (this.keys) {
            if (this.keys.a.isDown) vx -= 1;
            if (this.keys.d.isDown) vx += 1;
            if (this.keys.w.isDown) vy -= 1;
            if (this.keys.s.isDown) vy += 1;
            p.sprinting = this.keys.shift.isDown && p.stamina > 0;

            if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this.playerAttack();
            if (Phaser.Input.Keyboard.JustDown(this.keys.e)) this.gather();
            if (Phaser.Input.Keyboard.JustDown(this.keys.i)) this.events.emit('toggleInventory');
            if (Phaser.Input.Keyboard.JustDown(this.keys.c)) this.events.emit('toggleCrafting');
            if (Phaser.Input.Keyboard.JustDown(this.keys.f)) {
                if (p.inventory.length > 0) this.useItem(0);
            }
        }

        if (this.joystick?.active) {
            vx = this.joystick.dx;
            vy = this.joystick.dy;
        }

        // Normalize
        const len = Math.hypot(vx, vy);
        if (len > 0) {
            vx /= len; vy /= len;
            p.facing = { x: vx, y: vy };
        }

        // Swamp slow
        const biome = this.mapData[Math.floor(p.y / TILE)]?.[Math.floor(p.x / TILE)];
        const speedMult = biome === D.MAP.BIOMES.SWAMP ? 0.7 : 1;

        const spd = (p.sprinting ? D.PLAYER.SPRINT_SPEED : p.speed) * speedMult;
        p.body.setVelocity(vx * spd, vy * spd);

        if (p.sprinting && len > 0) {
            p.stamina = Math.max(0, p.stamina - 0.3);
            if (p.stamina <= 0) p.sprinting = false;
        }
    }

    updateSwampDamage(delta) {
        const biome = this.mapData[Math.floor(this.player.y / TILE)]?.[Math.floor(this.player.x / TILE)];
        if (biome === D.MAP.BIOMES.SWAMP) {
            if (!this._swampDmgTimer) this._swampDmgTimer = 0;
            this._swampDmgTimer += delta;
            if (this._swampDmgTimer > 10000) {
                this._swampDmgTimer = 0;
                this.damagePlayer(1, '瘴氣');
            }
        }
    }

    updateDinoAI() {
        const p = this.player;
        const isNight = this.dayPhase === D.DAY_NIGHT.PHASES.NIGHT;
        const inCamp = this.isInCamp(p.x, p.y);

        this.dinos.forEach(dino => {
            if (!dino.alive) return;

            // Night-only check
            if (dino.dinoData.nightOnly && !isNight) {
                dino.setAlpha(0.3);
                dino.state = 'patrol';
                return;
            } else {
                dino.setAlpha(1);
            }

            const d = dist(dino, p);
            const data = dino.dinoData;
            const nightMult = (isNight && data.nightBuff) ? 1.5 : 1;

            switch (dino.state) {
                case 'patrol':
                    const td = dist(dino, dino.patrolTarget);
                    if (td < 10 || td > 500) {
                        dino.patrolTarget = {
                            x: dino.homeX + rnd(-120, 120),
                            y: dino.homeY + rnd(-120, 120)
                        };
                    }
                    this.moveToward(dino, dino.patrolTarget, data.speed * 0.4);

                    // Detect player
                    if (d < data.detectRange && !inCamp && !data.passive) {
                        dino.state = 'chase';
                    }
                    break;

                case 'chase':
                    if (d > data.aggro || inCamp) {
                        dino.state = 'patrol';
                        break;
                    }
                    this.moveToward(dino, p, data.speed * nightMult);
                    if (d < data.size + 15) {
                        dino.state = 'attack';
                        dino.attackCd = 0;
                    }
                    break;

                case 'attack':
                    if (d > data.size + 40) {
                        dino.state = 'chase';
                        break;
                    }
                    dino.body.setVelocity(0, 0);
                    dino.attackCd -= 16;
                    if (dino.attackCd <= 0) {
                        const dmg = data.atk * nightMult;
                        this.damagePlayer(dmg);
                        if (data.poison && !p.poisoned) {
                            p.poisoned = true;
                            this.showFloatingText(p.x, p.y - 35, '中毒!', '#9C27B0');
                            p.poisonTimer = this.time.addEvent({
                                delay: 1000, repeat: 5, callback: () => {
                                    if (p.alive && p.poisoned) this.damagePlayer(2, '毒');
                                }
                            });
                            this.time.delayedCall(6000, () => { p.poisoned = false; });
                        }
                        dino.attackCd = 1200;
                    }
                    break;

                case 'flee':
                    const fx = dino.x + (dino.x - p.x);
                    const fy = dino.y + (dino.y - p.y);
                    this.moveToward(dino, { x: fx, y: fy }, data.speed * 1.3);
                    if (d > data.aggro) dino.state = 'patrol';
                    break;
            }

            // Update HP bar
            if (dino.hpBg && dino.alive) {
                dino.hpBg.setPosition(dino.x, dino.y - data.size / 2 - 8);
                const ratio = dino.hp / dino.maxHp;
                dino.hpBar.setPosition(dino.x - 15, dino.y - data.size / 2 - 8);
                dino.hpBar.width = 30 * ratio;
                dino.nameTxt.setPosition(dino.x, dino.y - data.size / 2 - 16);
            }

            // Trap collision
            this.traps.forEach(trap => {
                if (trap.active && dist(trap, dino) < 20) {
                    this.damageDino(dino, trap.dmg);
                    trap.active = false;
                    trap.setAlpha(0.2);
                    this.time.delayedCall(3000, () => { trap.destroy(); });
                    this.traps = this.traps.filter(t => t !== trap);
                    // Slow
                    const origSpeed = dino.dinoData.speed;
                    dino.dinoData.speed *= 0.5;
                    this.time.delayedCall(3000, () => { dino.dinoData.speed = origSpeed; });
                }
            });
        });
    }

    moveToward(obj, target, speed) {
        const dx = target.x - obj.x;
        const dy = target.y - obj.y;
        const len = Math.hypot(dx, dy);
        if (len > 2) {
            obj.body.setVelocity((dx / len) * speed, (dy / len) * speed);
        } else {
            obj.body.setVelocity(0, 0);
        }
    }

    updateTraps() { /* handled in dino AI */ }
}

// ============================================
// UI Scene — HUD Overlay
// ============================================
class UIScene extends Phaser.Scene {
    constructor() { super('UI'); }

    create(data) {
        this.gs = data.gameScene;
        this.showInv = false;
        this.showCraft = false;
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const safeTop = 16, safeLeft = 12;

        // HP Bar
        this.hpBg = this.add.rectangle(safeLeft + 80, safeTop + 12, 140, 14, 0x333333).setOrigin(0.5).setScrollFactor(0);
        this.hpFill = this.add.rectangle(safeLeft + 11, safeTop + 12, 138, 12, 0xF44336).setOrigin(0, 0.5).setScrollFactor(0);
        this.hpTxt = this.add.text(safeLeft + 80, safeTop + 12, '', { fontSize: '10px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft, safeTop + 12, '❤️', { fontSize: '11px' }).setOrigin(0, 0.5).setScrollFactor(0);

        // Hunger Bar
        this.hungerBg = this.add.rectangle(safeLeft + 80, safeTop + 30, 140, 14, 0x333333).setOrigin(0.5).setScrollFactor(0);
        this.hungerFill = this.add.rectangle(safeLeft + 11, safeTop + 30, 138, 12, 0xFF9800).setOrigin(0, 0.5).setScrollFactor(0);
        this.hungerTxt = this.add.text(safeLeft + 80, safeTop + 30, '', { fontSize: '10px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft, safeTop + 30, '🍖', { fontSize: '11px' }).setOrigin(0, 0.5).setScrollFactor(0);

        // Stamina Bar
        this.staminaBg = this.add.rectangle(safeLeft + 80, safeTop + 48, 140, 14, 0x333333).setOrigin(0.5).setScrollFactor(0);
        this.staminaFill = this.add.rectangle(safeLeft + 11, safeTop + 48, 138, 12, 0xFDD835).setOrigin(0, 0.5).setScrollFactor(0);
        this.staminaTxt = this.add.text(safeLeft + 80, safeTop + 48, '', { fontSize: '10px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft, safeTop + 48, '⚡', { fontSize: '11px' }).setOrigin(0, 0.5).setScrollFactor(0);

        [this.hpBg, this.hpFill, this.hungerBg, this.hungerFill, this.staminaBg, this.staminaFill].forEach(b => b.setDepth(101));

        // Day/Night & Biome
        this.dayTxt = this.add.text(w / 2, safeTop + 8, '', { fontSize: '13px', fill: '#FFD54F', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.biomeTxt = this.add.text(w / 2, safeTop + 24, '', { fontSize: '10px', fill: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Kill count & survival time
        this.statsTxt = this.add.text(w - 10, safeTop + 8, '', { fontSize: '10px', fill: '#81C784', fontFamily: 'Arial', align: 'right' }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

        // Mobile buttons
        if (this.gs.isMobile) this.createMobileButtons(w, h);

        // Inventory panel
        this.invPanel = this.add.container(w / 2, h / 2).setDepth(200).setVisible(false).setScrollFactor(0);
        this.craftPanel = this.add.container(w / 2, h / 2).setDepth(200).setVisible(false).setScrollFactor(0);

        // Quick item bar (bottom center)
        this.quickBar = this.add.container(w / 2, h - 50).setDepth(105).setScrollFactor(0);
        this.quickSlots = [];
        for (let i = 0; i < 5; i++) {
            const sx = (i - 2) * 44;
            const bg = this.add.rectangle(sx, 0, 40, 40, 0x1a1a1a, 0.7).setStrokeStyle(1, 0x4CAF50);
            const txt = this.add.text(sx, 0, '', { fontSize: '9px', fill: '#fff', fontFamily: 'Arial', align: 'center', wordWrap: { width: 38 } }).setOrigin(0.5);
            const qty = this.add.text(sx + 16, 16, '', { fontSize: '8px', fill: '#FFD54F', fontFamily: 'Arial' }).setOrigin(1, 1);
            bg.setInteractive().on('pointerdown', () => this.gs.useItem(i));
            this.quickBar.add([bg, txt, qty]);
            this.quickSlots.push({ bg, txt, qty });
        }

        // Listen for toggle events
        this.gs.events.on('toggleInventory', () => this.toggleInventory());
        this.gs.events.on('toggleCrafting', () => this.toggleCrafting());
    }

    createMobileButtons(w, h) {
        const btnSize = 52;
        const margin = 16;
        const bottomY = h - 40;
        const rightX = w - margin;

        // Attack button
        const atkBtn = this.add.circle(rightX - btnSize / 2, bottomY - btnSize - 10, btnSize / 2, 0xF44336, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX - btnSize / 2, bottomY - btnSize - 10, '⚔️', { fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        atkBtn.on('pointerdown', () => this.gs.playerAttack());

        // Gather button
        const gatherBtn = this.add.circle(rightX - btnSize * 1.6, bottomY - btnSize / 2, btnSize / 2, 0x4CAF50, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX - btnSize * 1.6, bottomY - btnSize / 2, '🪓', { fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        gatherBtn.on('pointerdown', () => this.gs.gather());

        // Inventory button
        const invBtn = this.add.circle(rightX - btnSize / 2, bottomY + 10, btnSize / 3, 0x2196F3, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX - btnSize / 2, bottomY + 10, '🎒', { fontSize: '14px' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        invBtn.on('pointerdown', () => this.toggleInventory());

        // Craft button
        const craftBtn = this.add.circle(rightX - btnSize * 1.6, bottomY + 10, btnSize / 3, 0xFF9800, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX - btnSize * 1.6, bottomY + 10, '🔨', { fontSize: '14px' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        craftBtn.on('pointerdown', () => this.toggleCrafting());
    }

    toggleInventory() {
        this.showInv = !this.showInv;
        this.showCraft = false;
        this.craftPanel.setVisible(false);
        if (this.showInv) this.buildInventoryPanel();
        this.invPanel.setVisible(this.showInv);
    }

    toggleCrafting() {
        this.showCraft = !this.showCraft;
        this.showInv = false;
        this.invPanel.setVisible(false);
        if (this.showCraft) this.buildCraftPanel();
        this.craftPanel.setVisible(this.showCraft);
    }

    buildInventoryPanel() {
        this.invPanel.removeAll(true);
        const pw = 280, ph = 360;
        this.invPanel.add(this.add.rectangle(0, 0, pw, ph, 0x1a1a1a, 0.92).setStrokeStyle(2, 0x4CAF50));
        this.invPanel.add(this.add.text(0, -ph / 2 + 16, '🎒 背包', { fontSize: '15px', fill: '#4CAF50', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5));

        // Close button
        const closeBtn = this.add.text(pw / 2 - 16, -ph / 2 + 10, '✕', { fontSize: '16px', fill: '#ff5252', fontFamily: 'Arial' }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => this.toggleInventory());
        this.invPanel.add(closeBtn);

        // Equipped
        const ep = this.gs.player.equipped;
        this.invPanel.add(this.add.text(-pw / 2 + 12, -ph / 2 + 36, `武器: ${ep.weapon ? D.ITEMS[ep.weapon].name : '無'} | 防具: ${ep.armor ? D.ITEMS[ep.armor].name : '無'}`, { fontSize: '9px', fill: '#FFD54F', fontFamily: 'Arial' }));
        this.invPanel.add(this.add.text(-pw / 2 + 12, -ph / 2 + 50, `ATK:${this.gs.player.atk} DEF:${this.gs.player.def}`, { fontSize: '9px', fill: '#81C784', fontFamily: 'Arial' }));

        // Items grid
        const inv = this.gs.player.inventory;
        const cols = 5, slotSize = 46;
        const startX = -cols * slotSize / 2 + slotSize / 2;
        const startY = -ph / 2 + 80;

        for (let i = 0; i < D.PLAYER.INV_SIZE; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const sx = startX + col * slotSize, sy = startY + row * slotSize;
            const bg = this.add.rectangle(sx, sy, slotSize - 4, slotSize - 4, 0x333333, 0.8).setStrokeStyle(1, 0x555555).setInteractive();
            this.invPanel.add(bg);

            if (i < inv.length) {
                const item = inv[i];
                const def = D.ITEMS[item.id];
                const name = def.name.substring(0, 3);
                this.invPanel.add(this.add.text(sx, sy - 6, name, { fontSize: '10px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5));
                this.invPanel.add(this.add.text(sx + 14, sy + 14, `${item.qty}`, { fontSize: '8px', fill: '#FFD54F', fontFamily: 'Arial' }).setOrigin(1, 1));

                const idx = i;
                bg.on('pointerdown', () => {
                    this.gs.useItem(idx);
                    this.buildInventoryPanel(); // refresh
                });
            }
        }
    }

    buildCraftPanel() {
        this.craftPanel.removeAll(true);
        const pw = 300, ph = 400;
        this.craftPanel.add(this.add.rectangle(0, 0, pw, ph, 0x1a1a1a, 0.92).setStrokeStyle(2, 0xFF9800));
        this.craftPanel.add(this.add.text(0, -ph / 2 + 16, '🔨 合成', { fontSize: '15px', fill: '#FF9800', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5));

        const closeBtn = this.add.text(pw / 2 - 16, -ph / 2 + 10, '✕', { fontSize: '16px', fill: '#ff5252', fontFamily: 'Arial' }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => this.toggleCrafting());
        this.craftPanel.add(closeBtn);

        const recipes = D.RECIPES;
        const startY = -ph / 2 + 42;
        const rowH = 42;

        recipes.forEach((r, i) => {
            const y = startY + i * rowH;
            if (y > ph / 2 - 20) return;

            const canCraft = this.gs.canCraft(r);
            const def = D.ITEMS[r.result];
            const matsStr = Object.entries(r.mats).map(([id, qty]) => `${D.ITEMS[id].name}x${qty}`).join(' ');

            // Row bg
            const rowBg = this.add.rectangle(0, y + rowH / 2 - 4, pw - 20, rowH - 4, canCraft ? 0x1B5E20 : 0x333333, 0.6).setInteractive();
            this.craftPanel.add(rowBg);

            // Name
            this.craftPanel.add(this.add.text(-pw / 2 + 16, y + 4, `${def.name} x${r.qty}`, {
                fontSize: '11px', fill: canCraft ? '#A8D08D' : '#777', fontFamily: 'Arial', fontStyle: 'bold'
            }));
            // Materials
            this.craftPanel.add(this.add.text(-pw / 2 + 16, y + 20, matsStr + (r.needFire ? ' 🔥' : ''), {
                fontSize: '8px', fill: canCraft ? '#81C784' : '#555', fontFamily: 'Arial'
            }));
            // Craft button
            if (canCraft) {
                const btn = this.add.text(pw / 2 - 24, y + 12, '製作', {
                    fontSize: '10px', fill: '#FFD54F', fontFamily: 'Arial', fontStyle: 'bold',
                    backgroundColor: '#2E7D32', padding: { x: 6, y: 3 }
                }).setOrigin(0.5).setInteractive();
                btn.on('pointerdown', () => {
                    this.gs.craft(r);
                    this.buildCraftPanel(); // refresh
                });
                this.craftPanel.add(btn);
            }
        });
    }

    update() {
        const p = this.gs.player;
        if (!p) return;

        // Update bars
        this.hpFill.width = 138 * (p.hp / p.maxHp);
        this.hpTxt.setText(`${Math.floor(p.hp)}/${p.maxHp}`);
        this.hungerFill.width = 138 * (p.hunger / p.maxHunger);
        this.hungerTxt.setText(`${Math.floor(p.hunger)}/${p.maxHunger}`);
        this.staminaFill.width = 138 * (p.stamina / p.maxStamina);
        this.staminaTxt.setText(`${Math.floor(p.stamina)}/${p.maxStamina}`);

        // Color based on value
        this.hpFill.setFillStyle(p.hp > 50 ? 0x4CAF50 : p.hp > 25 ? 0xFF9800 : 0xF44336);
        this.hungerFill.setFillStyle(p.hunger > 40 ? 0xFF9800 : p.hunger > 15 ? 0xF44336 : 0xB71C1C);

        // Day/night text
        this.dayTxt.setText(this.gs.getDayPhaseStr());
        this.biomeTxt.setText(`📍 ${this.gs.getBiomeName(p.x, p.y)}`);

        // Stats
        const mins = Math.floor(this.gs.survivalTime / 60000);
        const secs = Math.floor((this.gs.survivalTime % 60000) / 1000);
        this.statsTxt.setText(`🦖 ${this.gs.kills} 擊殺\n⏱ ${mins}:${secs.toString().padStart(2, '0')}`);

        // Quick bar
        for (let i = 0; i < 5; i++) {
            const slot = this.quickSlots[i];
            if (i < p.inventory.length) {
                const item = p.inventory[i];
                const def = D.ITEMS[item.id];
                slot.txt.setText(def.name.substring(0, 3));
                slot.qty.setText(item.qty > 1 ? item.qty : '');
            } else {
                slot.txt.setText('');
                slot.qty.setText('');
            }
        }
    }
}

// ============================================
// Phaser Game Config
// ============================================
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene],
    pixelArt: true,
    backgroundColor: '#0a1a0a',
    input: { activePointers: 3 }
};

const game = new Phaser.Game(config);
