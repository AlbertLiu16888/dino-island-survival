// ===== 恐龍島求生記 — 主遊戲引擎 v1.1 (使用實際圖片素材) =====
const D = GAME_DATA;
const TILE = D.MAP.TILE_SIZE;
const MW = D.MAP.WIDTH * TILE;
const MH = D.MAP.HEIGHT * TILE;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[rndInt(0, arr.length - 1)];

// Dino key → sprite asset mapping
const DINO_SPRITES = {
    raptor: 'dino_velociraptor', oviraptor: 'dino_oviraptor', trike: 'dino_triceratops',
    stego: 'dino_stegosaurus', dilopho: 'dino_dilophosaurus', allo: 'dino_allosaurus',
    trex: 'dino_trex', spino: 'dino_spinosaurus'
};
// Resource key → visual emoji+color fallback
const RES_ICONS = { wood: '🪵', stone: '🪨', herb: '🌿', iron: '⛏', fruit: '🍇' };

// ============================================
// Boot Scene — load assets
// ============================================
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const bar = this.add.rectangle(w/2, h/2, w*0.6, 20, 0x2F5233).setOrigin(0.5);
        const fill = this.add.rectangle(w/2 - w*0.3, h/2, 0, 16, 0x4CAF50).setOrigin(0, 0.5);
        const txt = this.add.text(w/2, h/2-40, '載入中...', {fontSize:'18px',fill:'#A8D08D',fontFamily:'Arial'}).setOrigin(0.5);
        this.load.on('progress', v => { fill.width = w*0.6*v; });
        this.load.on('complete', () => { txt.setText('完成!'); });

        const base = 'assets/';
        ['camp','grassland','forest','swamp','volcano','cave','bay','highland','temple','river','night_overlay','dusk_overlay'].forEach(s =>
            this.load.image('scene_'+s, base+'scenes/scene_'+s+'.png'));
        ['grass','forest','swamp','volcano','cave'].forEach(t =>
            this.load.image('tiles_'+t, base+'tiles/tiles_'+t+'.png'));
        ['base','attack','armor_grass','armor_leather','armor_iron','armor_steel','death'].forEach(c =>
            this.load.image('player_'+c, base+'characters/player_'+c+'.png'));
        ['velociraptor','oviraptor','archaeopteryx','dilophosaurus','deinonychus',
         'triceratops','ankylosaurus','parasaurolophus','pachycephalosaurus','stegosaurus',
         'pteranodon','trex','spinosaurus','allosaurus','ceratosaurus','therizinosaurus',
         'mosasaurus','giganotosaurus'].forEach(d =>
            this.load.image('dino_'+d, base+'dinosaurs/dino_'+d+'.png'));
        ['resources','weapons','armor','food','tools'].forEach(i =>
            this.load.image('items_'+i, base+'items/items_'+i+'.png'));
        ['hud_bars','minimap_frame','inventory','crafting','daynight_indicator',
         'dialogue_box','lobby','leaderboard','game_logo','loading_screen','safe_zone_border'].forEach(u =>
            this.load.image('ui_'+u, base+'ui/ui_'+u+'.png'));
        ['campfire','slash','damage','heal','poison','arrow','dino_death','earthquake'].forEach(e =>
            this.load.image('fx_'+e, base+'effects/fx_'+e+'.png'));
    }
    create() { this.scene.start('Menu'); }
}

// ============================================
// Menu Scene — 使用 Logo + Loading 圖片
// ============================================
class MenuScene extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;

        // Loading screen as background
        if (this.textures.exists('ui_loading_screen')) {
            const bg = this.add.image(w/2, h/2, 'ui_loading_screen');
            bg.setDisplaySize(w, h).setAlpha(0.5);
        }
        this.add.rectangle(0, 0, w, h, 0x0a1a0a, 0.6).setOrigin(0);

        // Logo image
        if (this.textures.exists('ui_game_logo')) {
            const logo = this.add.image(w/2, h*0.2, 'ui_game_logo');
            const logoScale = Math.min((w*0.8) / logo.width, (h*0.2) / logo.height);
            logo.setScale(logoScale);
        }
        this.add.text(w/2, h*0.38, '恐龍島求生記', {
            fontSize: Math.min(36,w*0.08)+'px', fill:'#A8D08D',
            fontFamily:'Arial', fontStyle:'bold', stroke:'#1B5E20', strokeThickness:4
        }).setOrigin(0.5);
        this.add.text(w/2, h*0.44, 'DINO ISLAND SURVIVAL', {
            fontSize: Math.min(14,w*0.035)+'px', fill:'#66BB6A', fontFamily:'Arial'
        }).setOrigin(0.5);

        // Scene preview thumbnails
        const previewKeys = ['scene_camp','scene_grassland','scene_forest','scene_swamp','scene_volcano'];
        const pw = Math.min(60, w*0.14), gap = 8;
        const totalW = previewKeys.length * pw + (previewKeys.length-1) * gap;
        const startX = w/2 - totalW/2 + pw/2;
        previewKeys.forEach((key, i) => {
            if (this.textures.exists(key)) {
                const img = this.add.image(startX + i*(pw+gap), h*0.52, key);
                img.setDisplaySize(pw, pw*0.6);
                img.setAlpha(0.85);
                // Border
                this.add.rectangle(startX + i*(pw+gap), h*0.52, pw+2, pw*0.6+2).setStrokeStyle(1, 0x4CAF50).setFillStyle(0,0);
            }
        });
        const biomeLabels = ['營地','草原','森林','沼澤','火山'];
        biomeLabels.forEach((lbl, i) => {
            this.add.text(startX + i*(pw+gap), h*0.52 + pw*0.35, lbl, {
                fontSize:'8px', fill:'#aaa', fontFamily:'Arial'
            }).setOrigin(0.5);
        });

        // Start button
        const btnW = Math.min(220, w*0.55), btnH = 50;
        const btn = this.add.rectangle(w/2, h*0.66, btnW, btnH, 0x2E7D32, 0.9).setInteractive({useHandCursor:true});
        this.add.text(w/2, h*0.66, '開始冒險', {fontSize:'22px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        btn.on('pointerover', () => btn.setFillStyle(0x388E3C));
        btn.on('pointerout', () => btn.setFillStyle(0x2E7D32));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Dino preview row
        const dinoKeys = ['dino_velociraptor','dino_triceratops','dino_trex','dino_spinosaurus','dino_allosaurus'];
        const dw = Math.min(50, w*0.11);
        const dTotalW = dinoKeys.length * dw + (dinoKeys.length-1) * gap;
        const dStartX = w/2 - dTotalW/2 + dw/2;
        dinoKeys.forEach((key, i) => {
            if (this.textures.exists(key)) {
                const img = this.add.image(dStartX + i*(dw+gap), h*0.78, key);
                const s = Math.min(dw/img.width, dw/img.height);
                img.setScale(s);
            }
        });

        const isMobile = this.sys.game.device.input.touch;
        const controlText = isMobile ? '觸控搖桿移動 | 點擊按鈕攻擊/採集' : 'WASD移動 | 空白鍵攻擊 | E採集 | I背包 | C合成 | F使用物品';
        this.add.text(w/2, h*0.87, controlText, {
            fontSize: Math.min(11,w*0.028)+'px', fill:'#81C784', fontFamily:'Arial',
            wordWrap:{width:w*0.85}, align:'center'
        }).setOrigin(0.5);
        this.add.text(w/2, h*0.94, 'v1.1 — 1~6人生存冒險 | 66張AI美術素材', {fontSize:'10px',fill:'#4CAF50',fontFamily:'Arial'}).setOrigin(0.5);
    }
}

// ============================================
// Game Scene — 使用圖片素材渲染
// ============================================
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    create() {
        this.mapData = [];
        this.resources = [];
        this.dinos = [];
        this.campfires = [];
        this.traps = [];
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

        this.time.addEvent({ delay: D.PLAYER.HUNGER_INTERVAL, callback: this.tickHunger, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 500, callback: () => {
            if (!this.player.sprinting && this.player.stamina < D.PLAYER.MAX_STAMINA)
                this.player.stamina = Math.min(D.PLAYER.MAX_STAMINA, this.player.stamina + D.PLAYER.STAMINA_REGEN * 2);
        }, loop: true });
        this.time.addEvent({ delay: 30000, callback: this.respawnResources, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 45000, callback: this.respawnDinos, callbackScope: this, loop: true });
    }

    // ===== Map — 使用場景圖片鋪設 =====
    generateMap() {
        const W = D.MAP.WIDTH, H = D.MAP.HEIGHT;
        const cx = W/2, cy = H/2;
        for (let y = 0; y < H; y++) {
            this.mapData[y] = [];
            for (let x = 0; x < W; x++) {
                const d = Math.hypot(x - cx, y - cy);
                let biome;
                if (d < 5) biome = 0;
                else if (d < 20) biome = 1;
                else if (d < 32) biome = 2;
                else if (d < 38) biome = 3;
                else biome = 4;
                if (biome > 0 && biome < 4 && Math.random() < 0.1)
                    biome = clamp(biome + (Math.random() > 0.5 ? 1 : -1), 1, 4);
                this.mapData[y][x] = biome;
            }
        }
        this.renderMap();
    }

    renderMap() {
        // 用大張場景圖片鋪設各區域背景
        const sceneKeys = ['scene_camp', 'scene_grassland', 'scene_forest', 'scene_swamp', 'scene_volcano'];
        const biomeRegions = [
            { cx: 0.5, cy: 0.5, r: 0.07, key: 'scene_camp' },
            { cx: 0.5, cy: 0.5, r: 0.28, key: 'scene_grassland' },
            { cx: 0.35, cy: 0.35, r: 0.22, key: 'scene_forest' },
            { cx: 0.65, cy: 0.65, r: 0.22, key: 'scene_forest' },
            { cx: 0.3, cy: 0.7, r: 0.18, key: 'scene_swamp' },
            { cx: 0.7, cy: 0.3, r: 0.18, key: 'scene_swamp' },
            { cx: 0.15, cy: 0.15, r: 0.2, key: 'scene_volcano' },
            { cx: 0.85, cy: 0.85, r: 0.2, key: 'scene_volcano' },
            { cx: 0.15, cy: 0.85, r: 0.15, key: 'scene_cave' },
            { cx: 0.85, cy: 0.15, r: 0.15, key: 'scene_bay' },
            { cx: 0.5, cy: 0.2, r: 0.12, key: 'scene_highland' },
            { cx: 0.5, cy: 0.8, r: 0.12, key: 'scene_river' },
            { cx: 0.5, cy: 0.5, r: 0.05, key: 'scene_temple' },
        ];

        // Base color map
        const colors = [0x2E7D32, 0x66BB6A, 0x33691E, 0x4A148C, 0xBF360C];
        const gfx = this.add.graphics().setDepth(0);
        for (let y = 0; y < D.MAP.HEIGHT; y++) {
            for (let x = 0; x < D.MAP.WIDTH; x++) {
                const b = this.mapData[y][x];
                const c = colors[b];
                const v = rndInt(-8, 8);
                const r = clamp(((c>>16)&0xFF)+v,0,255);
                const g = clamp(((c>>8)&0xFF)+v,0,255);
                const bl = clamp((c&0xFF)+v,0,255);
                gfx.fillStyle((r<<16)|(g<<8)|bl);
                gfx.fillRect(x*TILE, y*TILE, TILE, TILE);
            }
        }

        // Overlay scene images on biome regions
        biomeRegions.forEach(region => {
            if (!this.textures.exists(region.key)) return;
            const img = this.add.image(MW * region.cx, MH * region.cy, region.key).setDepth(1);
            const targetW = MW * region.r * 2;
            const targetH = MH * region.r * 2;
            img.setDisplaySize(targetW, targetH);
            img.setAlpha(0.7);
        });

        // Tile overlays for ground detail
        const tileMap = { 1: 'tiles_grass', 2: 'tiles_forest', 3: 'tiles_swamp', 4: 'tiles_volcano' };
        for (let i = 0; i < 40; i++) {
            const bx = rndInt(3, D.MAP.WIDTH-3);
            const by = rndInt(3, D.MAP.HEIGHT-3);
            const biome = this.mapData[by]?.[bx];
            const tkey = tileMap[biome];
            if (tkey && this.textures.exists(tkey)) {
                const tileImg = this.add.image(bx*TILE+TILE/2, by*TILE+TILE/2, tkey).setDepth(1);
                tileImg.setDisplaySize(TILE*3, TILE*3).setAlpha(0.5);
            }
        }

        // Camp safe zone border
        const campCx = MW/2, campCy = MH/2;
        if (this.textures.exists('ui_safe_zone_border')) {
            for (let angle = 0; angle < 360; angle += 20) {
                const rad = angle * Math.PI / 180;
                const bx = campCx + Math.cos(rad) * 5 * TILE;
                const by = campCy + Math.sin(rad) * 5 * TILE;
                const border = this.add.image(bx, by, 'ui_safe_zone_border').setDepth(2);
                border.setDisplaySize(TILE*2, TILE*2).setAlpha(0.6).setAngle(angle);
            }
        }
        gfx.lineStyle(2, 0xFFD54F, 0.6);
        gfx.strokeCircle(campCx, campCy, 5*TILE);

        // 營地營火圖片
        if (this.textures.exists('fx_campfire')) {
            const cfImg = this.add.image(campCx, campCy, 'fx_campfire').setDepth(3);
            cfImg.setDisplaySize(TILE*2, TILE*2);
            this.tweens.add({ targets: cfImg, scaleX: cfImg.scaleX*1.1, scaleY: cfImg.scaleY*1.1, yoyo: true, repeat: -1, duration: 500 });
        }

        this.physics.world.setBounds(0, 0, MW, MH);
    }

    // ===== Player — 使用角色圖片 =====
    createPlayer() {
        const cx = MW/2, cy = MH/2;
        this.player = this.add.image(cx, cy, 'player_base').setDepth(10);
        const pScale = (TILE * 1.2) / Math.max(this.player.width, this.player.height);
        this.player.setScale(pScale);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        const bodySize = TILE * 0.6;
        this.player.body.setSize(bodySize, bodySize);
        this.player.body.setOffset((this.player.width - bodySize)/2, (this.player.height - bodySize)/2);

        Object.assign(this.player, {
            hp: D.PLAYER.MAX_HP, maxHp: D.PLAYER.MAX_HP,
            hunger: D.PLAYER.MAX_HUNGER, maxHunger: D.PLAYER.MAX_HUNGER,
            stamina: D.PLAYER.MAX_STAMINA, maxStamina: D.PLAYER.MAX_STAMINA,
            atk: D.PLAYER.ATTACK_BASE, def: D.PLAYER.DEFENSE_BASE,
            speed: D.PLAYER.SPEED, sprinting: false,
            inventory: [], equipped: { weapon: null, armor: null },
            facing: { x: 0, y: 1 }, alive: true, baseScale: pScale,
            invincible: false, poisoned: false, poisonTimer: null,
            lightRadius: 0, torchActive: false, currentArmor: 'player_base'
        });

        this.addItem('wood', 5);
        this.addItem('stone', 3);
        this.addItem('herb', 3);
        this.addItem('fruit', 5);
    }

    updatePlayerTexture() {
        const p = this.player;
        let texKey = 'player_base';
        if (p.equipped.armor) {
            const armorMap = {
                grass_armor: 'player_armor_grass', leather_armor: 'player_armor_leather',
                iron_armor: 'player_armor_iron'
            };
            texKey = armorMap[p.equipped.armor] || 'player_base';
        }
        if (texKey !== p.currentArmor && this.textures.exists(texKey)) {
            p.setTexture(texKey);
            const s = (TILE * 1.2) / Math.max(p.width, p.height);
            p.setScale(s);
            p.baseScale = s;
            p.currentArmor = texKey;
        }
    }

    // ===== Resources — 使用物品圖片 =====
    spawnResources() {
        for (let y = 0; y < D.MAP.HEIGHT; y++) {
            for (let x = 0; x < D.MAP.WIDTH; x++) {
                const b = this.mapData[y][x];
                if (b === 0) continue;
                for (const [key, res] of Object.entries(D.RESOURCES)) {
                    if (res.biomes.includes(b) && Math.random() < res.rate) {
                        this.createResource(key, x*TILE+TILE/2, y*TILE+TILE/2);
                    }
                }
            }
        }
    }

    createResource(type, x, y) {
        // Use items_resources image as a tinted identifier, plus emoji text
        const colors = { wood: 0x8D6E63, stone: 0x9E9E9E, herb: 0x4CAF50, iron: 0xB0BEC5, fruit: 0xE91E63 };
        const r = this.add.circle(x, y, 7, colors[type] || 0xFFFFFF).setDepth(3).setAlpha(0.8);
        // Add emoji label
        const icon = this.add.text(x, y, RES_ICONS[type] || '?', { fontSize: '12px' }).setOrigin(0.5).setDepth(4);
        this.physics.add.existing(r, true);
        r.type = type;
        r.icon = icon;
        this.resources.push(r);
        return r;
    }

    respawnResources() {
        if (this.resources.length < 400) {
            for (let i = 0; i < 20; i++) {
                const x = rndInt(5, D.MAP.WIDTH-5);
                const y = rndInt(5, D.MAP.HEIGHT-5);
                const b = this.mapData[y][x];
                if (b === 0) continue;
                for (const [key, res] of Object.entries(D.RESOURCES)) {
                    if (res.biomes.includes(b) && Math.random() < 0.3) {
                        this.createResource(key, x*TILE+TILE/2, y*TILE+TILE/2);
                        break;
                    }
                }
            }
        }
    }

    // ===== Dinosaurs — 使用恐龍圖片 =====
    spawnDinos() {
        for (const [key, data] of Object.entries(D.DINOS)) {
            const count = data.boss ? 1 : (data.pack || 1) * 3;
            for (let i = 0; i < count; i++) this.createDino(key, data);
        }
    }

    createDino(key, data) {
        let x, y, attempts = 0;
        do {
            x = rndInt(3, D.MAP.WIDTH-3);
            y = rndInt(3, D.MAP.HEIGHT-3);
            attempts++;
        } while ((!data.biomes.includes(this.mapData[y]?.[x]) || this.mapData[y][x] === 0) && attempts < 50);
        if (attempts >= 50) return null;

        const px = x*TILE+TILE/2, py = y*TILE+TILE/2;
        const spriteKey = DINO_SPRITES[key];
        let dino;

        if (spriteKey && this.textures.exists(spriteKey)) {
            dino = this.add.image(px, py, spriteKey).setDepth(5);
            const targetSize = data.size * 1.8;
            const s = targetSize / Math.max(dino.width, dino.height);
            dino.setScale(s);
            dino.baseScale = s;
        } else {
            dino = this.add.circle(px, py, data.size/2, data.color).setDepth(5);
            dino.baseScale = 1;
        }

        this.physics.add.existing(dino);
        dino.body.setCollideWorldBounds(true);
        const bodyR = data.size * 0.5;
        if (dino.type === 'Image') {
            dino.body.setSize(bodyR*2, bodyR*2);
            dino.body.setOffset((dino.width - bodyR*2)/2, (dino.height - bodyR*2)/2);
        } else {
            dino.body.setCircle(data.size/2);
        }

        Object.assign(dino, {
            key, dinoData: {...data}, hp: data.hp, maxHp: data.hp,
            state: 'patrol', patrolTarget: {x: px+rnd(-100,100), y: py+rnd(-100,100)},
            homeX: px, homeY: py, attackCd: 0, alive: true, isImage: !!spriteKey
        });

        // HP bar
        dino.hpBg = this.add.rectangle(px, py-data.size-4, 30, 4, 0x333333).setDepth(6);
        dino.hpBar = this.add.rectangle(px-15, py-data.size-4, 30, 4, data.boss ? 0xFF6D00 : 0xFF1744).setDepth(7).setOrigin(0, 0.5);
        dino.nameTxt = this.add.text(px, py-data.size-12, (data.boss?'👑 ':'')+data.name, {
            fontSize: data.boss?'11px':'9px', fill: data.boss?'#FFD54F':'#fff',
            fontFamily:'Arial', stroke:'#000', strokeThickness:2
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

        this.overlay = this.add.rectangle(0, 0, 2000, 2000, 0x000033, 0).setDepth(50).setScrollFactor(0);
        this.overlay.setPosition(this.cameras.main.width/2, this.cameras.main.height/2);
    }

    // ===== Input =====
    setupInput() {
        this.keys = this.input.keyboard?.addKeys({
            w:'W', a:'A', s:'S', d:'D', space:'SPACE', e:'E', i:'I', c:'C', f:'F', shift:'SHIFT', esc:'ESC'
        });
        if (this.isMobile) this.setupTouch();
        this.moveVec = {x:0, y:0};
    }

    setupTouch() {
        this.joystick = {active:false, baseX:0, baseY:0, dx:0, dy:0};
        this.input.on('pointerdown', p => {
            if (p.x < this.cameras.main.width*0.4 && p.y > this.cameras.main.height*0.5) {
                this.joystick.active = true;
                this.joystick.baseX = p.x; this.joystick.baseY = p.y;
            }
        });
        this.input.on('pointermove', p => {
            if (this.joystick.active) {
                this.joystick.dx = clamp((p.x-this.joystick.baseX)/50,-1,1);
                this.joystick.dy = clamp((p.y-this.joystick.baseY)/50,-1,1);
            }
        });
        this.input.on('pointerup', () => { this.joystick.active=false; this.joystick.dx=0; this.joystick.dy=0; });
    }

    // ===== Inventory =====
    addItem(id, qty=1) {
        const def = D.ITEMS[id]; if (!def) return false;
        const inv = this.player.inventory;
        const existing = inv.find(s => s.id===id && s.qty<def.stack);
        if (existing) { const add=Math.min(qty,def.stack-existing.qty); existing.qty+=add; if(qty-add>0) return this.addItem(id,qty-add); return true; }
        if (inv.length >= D.PLAYER.INV_SIZE) return false;
        inv.push({id, qty:Math.min(qty,def.stack)}); return true;
    }
    removeItem(id, qty=1) {
        const inv = this.player.inventory; let rem=qty;
        for (let i=inv.length-1;i>=0;i--) { if(inv[i].id===id){const t=Math.min(rem,inv[i].qty);inv[i].qty-=t;rem-=t;if(inv[i].qty<=0)inv.splice(i,1);if(rem<=0)return true;} }
        return rem<=0;
    }
    countItem(id) { return this.player.inventory.reduce((s,sl)=>sl.id===id?s+sl.qty:s,0); }
    hasItems(mats) { return Object.entries(mats).every(([id,qty])=>this.countItem(id)>=qty); }

    useItem(slot) {
        const item = this.player.inventory[slot]; if(!item) return;
        const def = D.ITEMS[item.id];
        if (def.type==='food') {
            if(def.hunger) this.player.hunger=Math.min(this.player.maxHunger, this.player.hunger+def.hunger);
            if(def.hp) this.player.hp=Math.min(this.player.maxHp, this.player.hp+def.hp);
            if(def.cleanse&&this.player.poisoned){this.player.poisoned=false;if(this.player.poisonTimer)this.player.poisonTimer.remove();}
            this.showFloatingText(this.player.x,this.player.y-20,def.hunger?`+${def.hunger} 飽食`:`+${def.hp} HP`,'#4CAF50');
            item.qty--; if(item.qty<=0)this.player.inventory.splice(slot,1);
        } else if (def.type==='weapon') {
            this.player.equipped.weapon=item.id;
            this.player.atk=D.PLAYER.ATTACK_BASE+(def.atk||0);
            this.showFloatingText(this.player.x,this.player.y-20,`裝備 ${def.name}`,'#FFC107');
        } else if (def.type==='armor') {
            this.player.equipped.armor=item.id;
            this.player.def=D.PLAYER.DEFENSE_BASE+(def.def||0);
            this.updatePlayerTexture();
            this.showFloatingText(this.player.x,this.player.y-20,`裝備 ${def.name}`,'#2196F3');
        } else if (item.id==='torch') {
            this.player.torchActive=true; this.player.lightRadius=def.light;
            item.qty--; if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(this.player.x,this.player.y-20,'點燃火把','#FF9800');
            this.time.delayedCall(def.duration*1000, ()=>{this.player.torchActive=false;this.player.lightRadius=0;this.showFloatingText(this.player.x,this.player.y-20,'火把熄滅','#9E9E9E');});
        } else if (item.id==='campfire') {
            const cx=this.player.x, cy=this.player.y;
            let cf;
            if(this.textures.exists('fx_campfire')){cf=this.add.image(cx,cy,'fx_campfire').setDepth(4);cf.setDisplaySize(TILE*1.5,TILE*1.5);this.tweens.add({targets:cf,scaleX:cf.scaleX*1.1,scaleY:cf.scaleY*1.1,yoyo:true,repeat:-1,duration:400});}
            else{cf=this.add.circle(cx,cy,10,0xFF6D00).setDepth(4);}
            this.physics.add.existing(cf,true); cf.light=def.light;
            this.campfires.push(cf);
            item.qty--; if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(cx,cy-20,'放置營火','#FF6D00');
        } else if (item.id==='trap') {
            const tx=this.player.x,ty=this.player.y;
            const trap=this.add.circle(tx,ty,8,0x795548,0.6).setDepth(2);
            this.physics.add.existing(trap,true); trap.dmg=def.dmg; trap.active=true;
            this.traps.push(trap);
            item.qty--; if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(tx,ty-20,'放置陷阱','#795548');
        }
    }

    // ===== Crafting =====
    canCraft(recipe) {
        if(!this.hasItems(recipe.mats)) return false;
        if(recipe.needFire){ const nearFire=this.campfires.some(cf=>dist(cf,this.player)<150); if(!nearFire&&!this.isInCamp(this.player.x,this.player.y)) return false; }
        return true;
    }
    craft(recipe) {
        if(!this.canCraft(recipe)) return false;
        for(const[id,qty] of Object.entries(recipe.mats)) this.removeItem(id,qty);
        this.addItem(recipe.result,recipe.qty);
        this.showFloatingText(this.player.x,this.player.y-20,`合成 ${D.ITEMS[recipe.result].name} x${recipe.qty}`,'#FFC107');
        return true;
    }

    // ===== Combat — 使用特效圖片 =====
    playerAttack() {
        if(!this.player.alive) return;
        const range=50+(D.ITEMS[this.player.equipped.weapon]?.range||1)*10;
        const fx=this.player.facing;
        const ax=this.player.x+fx.x*20, ay=this.player.y+fx.y*20;

        // Attack effect using fx_slash image
        let slash;
        if(this.textures.exists('fx_slash')){
            slash=this.add.image(ax,ay,'fx_slash').setDepth(20);
            slash.setDisplaySize(range,range).setAlpha(0.8);
            slash.setAngle(Math.atan2(fx.y,fx.x)*180/Math.PI);
        }else{
            slash=this.add.circle(ax,ay,range/2,0xFFFFFF,0.5).setDepth(20);
        }
        this.tweens.add({targets:slash,alpha:0,scale:slash.scale?slash.scale*1.5:1.5,duration:200,onComplete:()=>slash.destroy()});

        this.dinos.forEach(dino => {
            if(!dino.alive) return;
            if(dist({x:ax,y:ay},dino)<range){
                const dmg=Math.max(1,this.player.atk-dino.dinoData.def/2);
                this.damageDino(dino,dmg);
                if(dino.dinoData.passive&&dino.state==='patrol') dino.state='chase';
                if(dino.dinoData.reflect){this.damagePlayer(Math.floor(dmg*dino.dinoData.reflect),'反傷');}
            }
        });
    }

    damageDino(dino, dmg) {
        dino.hp -= dmg;
        this.showFloatingText(dino.x,dino.y-20,`-${Math.floor(dmg)}`,'#FF5252');

        // Damage flash using fx_damage
        if(this.textures.exists('fx_damage')){
            const fxd=this.add.image(dino.x,dino.y,'fx_damage').setDepth(20).setDisplaySize(dino.dinoData.size*2,dino.dinoData.size*2).setAlpha(0.7);
            this.tweens.add({targets:fxd,alpha:0,duration:300,onComplete:()=>fxd.destroy()});
        }
        // White flash
        if(dino.isImage){dino.setTint(0xFFFFFF);this.time.delayedCall(100,()=>{if(dino.alive)dino.clearTint();});}
        else{dino.setFillStyle(0xFFFFFF);this.time.delayedCall(100,()=>{if(dino.alive)dino.setFillStyle(dino.dinoData.color);});}

        if(dino.dinoData.flee) dino.state='flee';
        else if(dino.state==='patrol') dino.state='chase';
        if(dino.hp<=0) this.killDino(dino);
    }

    killDino(dino) {
        dino.alive=false; dino.state='dead'; this.kills++;
        dino.dinoData.drops.forEach(([id,qty])=>{if(Math.random()<0.8)this.addItem(id,qty);});
        this.showFloatingText(dino.x,dino.y-30,`+${dino.dinoData.xp} XP`,'#FFD54F');

        // Death effect using fx_dino_death
        if(this.textures.exists('fx_dino_death')){
            const fxd=this.add.image(dino.x,dino.y,'fx_dino_death').setDepth(20).setDisplaySize(dino.dinoData.size*2.5,dino.dinoData.size*2.5);
            this.tweens.add({targets:fxd,alpha:0,scale:fxd.scale*1.5,duration:600,onComplete:()=>fxd.destroy()});
        }
        this.tweens.add({targets:[dino,dino.hpBg,dino.hpBar,dino.nameTxt],alpha:0,duration:500,
            onComplete:()=>{dino.destroy();dino.hpBg.destroy();dino.hpBar.destroy();dino.nameTxt.destroy();}});
        this.dinos=this.dinos.filter(d=>d!==dino);
    }

    damagePlayer(dmg, label='') {
        if(this.player.invincible||!this.player.alive) return;
        const actual=Math.max(1,dmg-this.player.def/2);
        this.player.hp-=actual;
        this.showFloatingText(this.player.x,this.player.y-25,`-${Math.floor(actual)}${label?' '+label:''}`,'#FF1744');
        if(this.textures.exists('fx_damage')){
            const fxd=this.add.image(this.player.x,this.player.y,'fx_damage').setDepth(20).setDisplaySize(TILE*2,TILE*2).setAlpha(0.6);
            this.tweens.add({targets:fxd,alpha:0,duration:300,onComplete:()=>fxd.destroy()});
        }
        this.player.setTint(0xFF0000);
        this.player.invincible=true;
        this.time.delayedCall(400,()=>{if(this.player.alive){this.player.clearTint();this.player.invincible=false;}});
        this.cameras.main.shake(100,0.005);
        if(this.player.hp<=0) this.playerDeath();
    }

    playerDeath() {
        this.player.alive=false;
        if(this.textures.exists('player_death')) this.player.setTexture('player_death');
        this.player.setTint(0x555555);
        this.player.body.setVelocity(0,0);
        this.showFloatingText(this.player.x,this.player.y-40,'你倒下了...','#FF1744');
        const inv=this.player.inventory;
        for(let i=inv.length-1;i>=0;i--){if(D.ITEMS[inv[i].id]?.type==='resource'){const drop=Math.ceil(inv[i].qty*0.3);inv[i].qty-=drop;if(inv[i].qty<=0)inv.splice(i,1);}}
        this.time.delayedCall(3000,()=>{
            this.player.x=MW/2;this.player.y=MH/2;
            this.player.hp=D.PLAYER.MAX_HP/2;this.player.hunger=D.PLAYER.MAX_HUNGER/2;this.player.stamina=D.PLAYER.MAX_STAMINA;
            this.player.alive=true;this.player.clearTint();
            this.player.setTexture(this.player.currentArmor||'player_base');
            this.showFloatingText(MW/2,MH/2-30,'在營地重生','#4CAF50');
        });
    }

    // ===== Gather =====
    gather() {
        if(!this.player.alive) return;
        let closest=null, minD=45;
        this.resources.forEach(r=>{const d=dist(r,this.player);if(d<minD){minD=d;closest=r;}});
        if(closest){
            if(this.addItem(closest.type,1)){
                this.showFloatingText(closest.x,closest.y-10,`+1 ${D.RESOURCES[closest.type].name}`,'#81C784');
                if(closest.icon) closest.icon.destroy();
                closest.destroy();
                this.resources=this.resources.filter(r=>r!==closest);
            }else{this.showFloatingText(this.player.x,this.player.y-20,'背包已滿!','#FF5252');}
        }
    }

    // ===== Systems =====
    tickHunger() {
        if(!this.player.alive) return;
        const rate=this.player.sprinting?D.PLAYER.HUNGER_DECAY*2:D.PLAYER.HUNGER_DECAY;
        this.player.hunger=Math.max(0,this.player.hunger-rate);
        if(this.player.hunger<=0) this.damagePlayer(D.PLAYER.HUNGER_DAMAGE,'飢餓');
    }
    isInCamp(x,y) { return dist({x,y},{x:MW/2,y:MH/2})<5*TILE; }
    getDayPhaseStr() { return ['☀️ 白天','🌅 黃昏','🌙 黑夜'][this.dayPhase]; }
    getBiomeName(x,y) { const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE); return ['營地','草原','森林','沼澤','火山','洞穴'][this.mapData[ty]?.[tx]]||'未知'; }

    showFloatingText(x,y,text,color='#fff') {
        const txt=this.add.text(x,y,text,{fontSize:'11px',fill:color,fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(100);
        this.tweens.add({targets:txt,y:y-30,alpha:0,duration:1200,onComplete:()=>txt.destroy()});
    }

    // ===== Main Update =====
    update(time,delta) {
        if(!this.player.alive) return;
        this.gameTime+=delta; this.survivalTime+=delta;
        this.updateDayNight(delta);
        this.updatePlayerMovement();
        this.updateDinoAI();
        this.updateSwampDamage(delta);
        // Flip player sprite based on facing direction
        if(this.player.facing.x<0) this.player.setFlipX(true);
        else if(this.player.facing.x>0) this.player.setFlipX(false);
    }

    updateDayNight(delta) {
        this.dayTimer+=delta;
        const{DAY_DURATION,DUSK_DURATION,NIGHT_DURATION,PHASES}=D.DAY_NIGHT;
        const cycle=DAY_DURATION+DUSK_DURATION+NIGHT_DURATION;
        const t=this.dayTimer%cycle;
        if(t<DAY_DURATION){this.dayPhase=PHASES.DAY;this.overlay.setAlpha(0);}
        else if(t<DAY_DURATION+DUSK_DURATION){this.dayPhase=PHASES.DUSK;this.overlay.setFillStyle(0x331100);this.overlay.setAlpha((t-DAY_DURATION)/DUSK_DURATION*0.3);}
        else{this.dayPhase=PHASES.NIGHT;const torch=this.player.torchActive||this.campfires.some(cf=>dist(cf,this.player)<150);this.overlay.setFillStyle(0x000033);this.overlay.setAlpha(torch?0.35:0.6);}
    }

    updatePlayerMovement() {
        const p=this.player; let vx=0,vy=0;
        if(this.keys){
            if(this.keys.a.isDown)vx-=1;if(this.keys.d.isDown)vx+=1;if(this.keys.w.isDown)vy-=1;if(this.keys.s.isDown)vy+=1;
            p.sprinting=this.keys.shift.isDown&&p.stamina>0;
            if(Phaser.Input.Keyboard.JustDown(this.keys.space))this.playerAttack();
            if(Phaser.Input.Keyboard.JustDown(this.keys.e))this.gather();
            if(Phaser.Input.Keyboard.JustDown(this.keys.i))this.events.emit('toggleInventory');
            if(Phaser.Input.Keyboard.JustDown(this.keys.c))this.events.emit('toggleCrafting');
            if(Phaser.Input.Keyboard.JustDown(this.keys.f)){if(p.inventory.length>0)this.useItem(0);}
        }
        if(this.joystick?.active){vx=this.joystick.dx;vy=this.joystick.dy;}
        const len=Math.hypot(vx,vy);
        if(len>0){vx/=len;vy/=len;p.facing={x:vx,y:vy};}
        const biome=this.mapData[Math.floor(p.y/TILE)]?.[Math.floor(p.x/TILE)];
        const speedMult=biome===D.MAP.BIOMES.SWAMP?0.7:1;
        const spd=(p.sprinting?D.PLAYER.SPRINT_SPEED:p.speed)*speedMult;
        p.body.setVelocity(vx*spd,vy*spd);
        if(p.sprinting&&len>0){p.stamina=Math.max(0,p.stamina-0.3);if(p.stamina<=0)p.sprinting=false;}
    }

    updateSwampDamage(delta) {
        const biome=this.mapData[Math.floor(this.player.y/TILE)]?.[Math.floor(this.player.x/TILE)];
        if(biome===D.MAP.BIOMES.SWAMP){
            if(!this._swampT)this._swampT=0;this._swampT+=delta;
            if(this._swampT>10000){this._swampT=0;this.damagePlayer(1,'瘴氣');
                if(this.textures.exists('fx_poison')){const fxp=this.add.image(this.player.x,this.player.y,'fx_poison').setDepth(20).setDisplaySize(TILE*2,TILE*2).setAlpha(0.6);this.tweens.add({targets:fxp,alpha:0,duration:800,onComplete:()=>fxp.destroy()});}
            }
        }
    }

    updateDinoAI() {
        const p=this.player, isNight=this.dayPhase===D.DAY_NIGHT.PHASES.NIGHT, inCamp=this.isInCamp(p.x,p.y);
        this.dinos.forEach(dino=>{
            if(!dino.alive) return;
            if(dino.dinoData.nightOnly&&!isNight){dino.setAlpha(0.3);dino.state='patrol';return;}else{dino.setAlpha(1);}
            const d=dist(dino,p), data=dino.dinoData, nightMult=(isNight&&data.nightBuff)?1.5:1;
            switch(dino.state){
                case 'patrol':
                    if(dist(dino,dino.patrolTarget)<10||dist(dino,dino.patrolTarget)>500)
                        dino.patrolTarget={x:dino.homeX+rnd(-120,120),y:dino.homeY+rnd(-120,120)};
                    this.moveToward(dino,dino.patrolTarget,data.speed*0.4);
                    if(dino.isImage) dino.setFlipX(dino.body.velocity.x<0);
                    if(d<data.detectRange&&!inCamp&&!data.passive) dino.state='chase';
                    break;
                case 'chase':
                    if(d>data.aggro||inCamp){dino.state='patrol';break;}
                    this.moveToward(dino,p,data.speed*nightMult);
                    if(dino.isImage) dino.setFlipX(p.x<dino.x);
                    if(d<data.size+15) {dino.state='attack';dino.attackCd=0;}
                    break;
                case 'attack':
                    if(d>data.size+40){dino.state='chase';break;}
                    dino.body.setVelocity(0,0);
                    dino.attackCd-=16;
                    if(dino.attackCd<=0){
                        const dmg=data.atk*nightMult;
                        this.damagePlayer(dmg);
                        if(data.poison&&!p.poisoned){
                            p.poisoned=true;this.showFloatingText(p.x,p.y-35,'中毒!','#9C27B0');
                            p.poisonTimer=this.time.addEvent({delay:1000,repeat:5,callback:()=>{if(p.alive&&p.poisoned)this.damagePlayer(2,'毒');}});
                            this.time.delayedCall(6000,()=>{p.poisoned=false;});
                        }
                        dino.attackCd=1200;
                    }
                    break;
                case 'flee':
                    this.moveToward(dino,{x:dino.x+(dino.x-p.x),y:dino.y+(dino.y-p.y)},data.speed*1.3);
                    if(d>data.aggro) dino.state='patrol';
                    break;
            }
            if(dino.hpBg&&dino.alive){
                dino.hpBg.setPosition(dino.x,dino.y-data.size-4);
                dino.hpBar.setPosition(dino.x-15,dino.y-data.size-4);
                dino.hpBar.width=30*(dino.hp/dino.maxHp);
                dino.nameTxt.setPosition(dino.x,dino.y-data.size-12);
            }
            this.traps.forEach(trap=>{
                if(trap.active&&dist(trap,dino)<20){
                    this.damageDino(dino,trap.dmg);trap.active=false;trap.setAlpha(0.2);
                    this.time.delayedCall(3000,()=>{trap.destroy();});this.traps=this.traps.filter(t=>t!==trap);
                    const orig=dino.dinoData.speed;dino.dinoData.speed*=0.5;this.time.delayedCall(3000,()=>{dino.dinoData.speed=orig;});
                }
            });
        });
    }

    moveToward(obj,target,speed) {
        const dx=target.x-obj.x,dy=target.y-obj.y,len=Math.hypot(dx,dy);
        if(len>2) obj.body.setVelocity((dx/len)*speed,(dy/len)*speed);
        else obj.body.setVelocity(0,0);
    }
}

// ============================================
// UI Scene — 使用 UI 圖片
// ============================================
class UIScene extends Phaser.Scene {
    constructor() { super('UI'); }
    create(data) {
        this.gs = data.gameScene;
        this.showInv = false; this.showCraft = false;
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const safeTop = 16, safeLeft = 12;

        // HUD image background
        if (this.textures.exists('ui_hud_bars')) {
            const hud = this.add.image(safeLeft + 80, safeTop + 30, 'ui_hud_bars').setScrollFactor(0).setDepth(100);
            hud.setDisplaySize(170, 70).setAlpha(0.4).setOrigin(0.5);
        }

        // HP/Hunger/Stamina bars
        this.hpBg = this.add.rectangle(safeLeft+80, safeTop+12, 140, 14, 0x333333).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.hpFill = this.add.rectangle(safeLeft+11, safeTop+12, 138, 12, 0xF44336).setOrigin(0,0.5).setScrollFactor(0).setDepth(101);
        this.hpTxt = this.add.text(safeLeft+80, safeTop+12, '', {fontSize:'10px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft, safeTop+12, '❤️', {fontSize:'11px'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(102);

        this.hungerBg = this.add.rectangle(safeLeft+80, safeTop+30, 140, 14, 0x333333).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.hungerFill = this.add.rectangle(safeLeft+11, safeTop+30, 138, 12, 0xFF9800).setOrigin(0,0.5).setScrollFactor(0).setDepth(101);
        this.hungerTxt = this.add.text(safeLeft+80, safeTop+30, '', {fontSize:'10px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft, safeTop+30, '🍖', {fontSize:'11px'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(102);

        this.staminaBg = this.add.rectangle(safeLeft+80, safeTop+48, 140, 14, 0x333333).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.staminaFill = this.add.rectangle(safeLeft+11, safeTop+48, 138, 12, 0xFDD835).setOrigin(0,0.5).setScrollFactor(0).setDepth(101);
        this.staminaTxt = this.add.text(safeLeft+80, safeTop+48, '', {fontSize:'10px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft, safeTop+48, '⚡', {fontSize:'11px'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(102);

        // Day/Night indicator image
        if (this.textures.exists('ui_daynight_indicator')) {
            this.add.image(w/2, safeTop+20, 'ui_daynight_indicator').setScrollFactor(0).setDepth(100).setDisplaySize(40,40).setAlpha(0.5);
        }
        this.dayTxt = this.add.text(w/2, safeTop+8, '', {fontSize:'13px',fill:'#FFD54F',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.biomeTxt = this.add.text(w/2, safeTop+24, '', {fontSize:'10px',fill:'#aaa',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Minimap frame
        if (this.textures.exists('ui_minimap_frame')) {
            this.add.image(w-50, safeTop+50, 'ui_minimap_frame').setScrollFactor(0).setDepth(100).setDisplaySize(80,80).setAlpha(0.5);
        }
        this.statsTxt = this.add.text(w-10, safeTop+8, '', {fontSize:'10px',fill:'#81C784',fontFamily:'Arial',align:'right'}).setOrigin(1,0).setScrollFactor(0).setDepth(101);

        if (this.gs.isMobile) this.createMobileButtons(w, h);

        this.invPanel = this.add.container(w/2, h/2).setDepth(200).setVisible(false).setScrollFactor(0);
        this.craftPanel = this.add.container(w/2, h/2).setDepth(200).setVisible(false).setScrollFactor(0);

        // Quick bar
        this.quickBar = this.add.container(w/2, h-50).setDepth(105).setScrollFactor(0);
        this.quickSlots = [];
        for (let i = 0; i < 5; i++) {
            const sx = (i-2)*44;
            const bg = this.add.rectangle(sx,0,40,40,0x1a1a1a,0.7).setStrokeStyle(1,0x4CAF50);
            const txt = this.add.text(sx,0,'',{fontSize:'9px',fill:'#fff',fontFamily:'Arial',align:'center',wordWrap:{width:38}}).setOrigin(0.5);
            const qty = this.add.text(sx+16,16,'',{fontSize:'8px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(1,1);
            bg.setInteractive().on('pointerdown',()=>this.gs.useItem(i));
            this.quickBar.add([bg,txt,qty]);
            this.quickSlots.push({bg,txt,qty});
        }

        this.gs.events.on('toggleInventory', ()=>this.toggleInventory());
        this.gs.events.on('toggleCrafting', ()=>this.toggleCrafting());
    }

    createMobileButtons(w,h) {
        const btnSize=52, margin=16, bottomY=h-40, rightX=w-margin;
        const atkBtn=this.add.circle(rightX-btnSize/2, bottomY-btnSize-10, btnSize/2, 0xF44336, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize/2, bottomY-btnSize-10, '⚔️', {fontSize:'20px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        atkBtn.on('pointerdown',()=>this.gs.playerAttack());

        const gatherBtn=this.add.circle(rightX-btnSize*1.6, bottomY-btnSize/2, btnSize/2, 0x4CAF50, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize*1.6, bottomY-btnSize/2, '🪓', {fontSize:'20px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        gatherBtn.on('pointerdown',()=>this.gs.gather());

        const invBtn=this.add.circle(rightX-btnSize/2, bottomY+10, btnSize/3, 0x2196F3, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize/2, bottomY+10, '🎒', {fontSize:'14px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        invBtn.on('pointerdown',()=>this.toggleInventory());

        const craftBtn=this.add.circle(rightX-btnSize*1.6, bottomY+10, btnSize/3, 0xFF9800, 0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize*1.6, bottomY+10, '🔨', {fontSize:'14px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        craftBtn.on('pointerdown',()=>this.toggleCrafting());
    }

    toggleInventory() {
        this.showInv=!this.showInv; this.showCraft=false; this.craftPanel.setVisible(false);
        if(this.showInv) this.buildInventoryPanel();
        this.invPanel.setVisible(this.showInv);
    }
    toggleCrafting() {
        this.showCraft=!this.showCraft; this.showInv=false; this.invPanel.setVisible(false);
        if(this.showCraft) this.buildCraftPanel();
        this.craftPanel.setVisible(this.showCraft);
    }

    buildInventoryPanel() {
        this.invPanel.removeAll(true);
        const pw=280, ph=360;
        // Use inventory UI image as background
        if(this.textures.exists('ui_inventory')){
            const bgImg=this.add.image(0,0,'ui_inventory').setAlpha(0.3);
            bgImg.setDisplaySize(pw,ph);
            this.invPanel.add(bgImg);
        }
        this.invPanel.add(this.add.rectangle(0,0,pw,ph,0x1a1a1a,0.88).setStrokeStyle(2,0x4CAF50));
        this.invPanel.add(this.add.text(0,-ph/2+16,'🎒 背包',{fontSize:'15px',fill:'#4CAF50',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
        const closeBtn=this.add.text(pw/2-16,-ph/2+10,'✕',{fontSize:'16px',fill:'#ff5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown',()=>this.toggleInventory()); this.invPanel.add(closeBtn);

        const ep=this.gs.player.equipped;
        this.invPanel.add(this.add.text(-pw/2+12,-ph/2+36,`武器: ${ep.weapon?D.ITEMS[ep.weapon].name:'無'} | 防具: ${ep.armor?D.ITEMS[ep.armor].name:'無'}`,{fontSize:'9px',fill:'#FFD54F',fontFamily:'Arial'}));
        this.invPanel.add(this.add.text(-pw/2+12,-ph/2+50,`ATK:${this.gs.player.atk} DEF:${this.gs.player.def}`,{fontSize:'9px',fill:'#81C784',fontFamily:'Arial'}));

        const inv=this.gs.player.inventory, cols=5, slotSize=46;
        const startX=-cols*slotSize/2+slotSize/2, startY=-ph/2+80;
        for(let i=0;i<D.PLAYER.INV_SIZE;i++){
            const col=i%cols, row=Math.floor(i/cols);
            const sx=startX+col*slotSize, sy=startY+row*slotSize;
            const bg=this.add.rectangle(sx,sy,slotSize-4,slotSize-4,0x333333,0.8).setStrokeStyle(1,0x555555).setInteractive();
            this.invPanel.add(bg);
            if(i<inv.length){
                const item=inv[i], def=D.ITEMS[item.id];
                this.invPanel.add(this.add.text(sx,sy-6,def.name.substring(0,3),{fontSize:'10px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5));
                this.invPanel.add(this.add.text(sx+14,sy+14,`${item.qty}`,{fontSize:'8px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(1,1));
                const idx=i; bg.on('pointerdown',()=>{this.gs.useItem(idx);this.buildInventoryPanel();});
            }
        }
    }

    buildCraftPanel() {
        this.craftPanel.removeAll(true);
        const pw=300, ph=400;
        if(this.textures.exists('ui_crafting')){
            const bgImg=this.add.image(0,0,'ui_crafting').setAlpha(0.3);
            bgImg.setDisplaySize(pw,ph);
            this.craftPanel.add(bgImg);
        }
        this.craftPanel.add(this.add.rectangle(0,0,pw,ph,0x1a1a1a,0.88).setStrokeStyle(2,0xFF9800));
        this.craftPanel.add(this.add.text(0,-ph/2+16,'🔨 合成',{fontSize:'15px',fill:'#FF9800',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
        const closeBtn=this.add.text(pw/2-16,-ph/2+10,'✕',{fontSize:'16px',fill:'#ff5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown',()=>this.toggleCrafting()); this.craftPanel.add(closeBtn);

        const startY=-ph/2+42, rowH=42;
        D.RECIPES.forEach((r,i)=>{
            const y=startY+i*rowH; if(y>ph/2-20) return;
            const canCraft=this.gs.canCraft(r), def=D.ITEMS[r.result];
            const matsStr=Object.entries(r.mats).map(([id,qty])=>`${D.ITEMS[id].name}x${qty}`).join(' ');
            this.craftPanel.add(this.add.rectangle(0,y+rowH/2-4,pw-20,rowH-4,canCraft?0x1B5E20:0x333333,0.6).setInteractive());
            this.craftPanel.add(this.add.text(-pw/2+16,y+4,`${def.name} x${r.qty}`,{fontSize:'11px',fill:canCraft?'#A8D08D':'#777',fontFamily:'Arial',fontStyle:'bold'}));
            this.craftPanel.add(this.add.text(-pw/2+16,y+20,matsStr+(r.needFire?' 🔥':''),{fontSize:'8px',fill:canCraft?'#81C784':'#555',fontFamily:'Arial'}));
            if(canCraft){
                const btn=this.add.text(pw/2-24,y+12,'製作',{fontSize:'10px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold',backgroundColor:'#2E7D32',padding:{x:6,y:3}}).setOrigin(0.5).setInteractive();
                btn.on('pointerdown',()=>{this.gs.craft(r);this.buildCraftPanel();});
                this.craftPanel.add(btn);
            }
        });
    }

    update() {
        const p=this.gs.player; if(!p) return;
        this.hpFill.width=138*(p.hp/p.maxHp);this.hpTxt.setText(`${Math.floor(p.hp)}/${p.maxHp}`);
        this.hungerFill.width=138*(p.hunger/p.maxHunger);this.hungerTxt.setText(`${Math.floor(p.hunger)}/${p.maxHunger}`);
        this.staminaFill.width=138*(p.stamina/p.maxStamina);this.staminaTxt.setText(`${Math.floor(p.stamina)}/${p.maxStamina}`);
        this.hpFill.setFillStyle(p.hp>50?0x4CAF50:p.hp>25?0xFF9800:0xF44336);
        this.hungerFill.setFillStyle(p.hunger>40?0xFF9800:p.hunger>15?0xF44336:0xB71C1C);
        this.dayTxt.setText(this.gs.getDayPhaseStr());
        this.biomeTxt.setText(`📍 ${this.gs.getBiomeName(p.x,p.y)}`);
        const mins=Math.floor(this.gs.survivalTime/60000), secs=Math.floor((this.gs.survivalTime%60000)/1000);
        this.statsTxt.setText(`🦖 ${this.gs.kills} 擊殺\n⏱ ${mins}:${secs.toString().padStart(2,'0')}`);
        for(let i=0;i<5;i++){
            const slot=this.quickSlots[i];
            if(i<p.inventory.length){const item=p.inventory[i];slot.txt.setText(D.ITEMS[item.id].name.substring(0,3));slot.qty.setText(item.qty>1?item.qty:'');}
            else{slot.txt.setText('');slot.qty.setText('');}
        }
    }
}

// ============================================
// Phaser Config
// ============================================
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [BootScene, MenuScene, GameScene, UIScene],
    pixelArt: true,
    backgroundColor: '#0a1a0a',
    input: { activePointers: 3 }
};

const game = new Phaser.Game(config);
