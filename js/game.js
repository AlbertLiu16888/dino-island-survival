// ===== 恐龍島求生記 — 主遊戲引擎 v2.1 =====
// 修正: 手機字體放大, 合成卷軸, 恐龍AI修正, Boss警告音效, 多人大廳
const D = GAME_DATA;
const TILE = D.MAP.TILE_SIZE;
const MW = D.MAP.WIDTH * TILE;
const MH = D.MAP.HEIGHT * TILE;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[rndInt(0, arr.length - 1)];

const RES_SPRITES = { wood: 'sprite_wood', stone: 'sprite_stone', herb: 'sprite_herb', iron: 'sprite_iron', fruit: 'sprite_fruit' };
const DINO_SPRITE_KEYS = {
    raptor: 'sprite_dino_raptor', oviraptor: 'sprite_dino_oviraptor', trike: 'sprite_dino_trike',
    stego: 'sprite_dino_stego', dilopho: 'sprite_dino_dilopho', allo: 'sprite_dino_allo',
    trex: 'sprite_dino_trex', spino: 'sprite_dino_spino'
};

// ============================================
// Boot Scene
// ============================================
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(w/2, h/2, w*0.6, 20, 0x2F5233).setOrigin(0.5);
        const fill = this.add.rectangle(w/2 - w*0.3, h/2, 0, 16, 0x4CAF50).setOrigin(0, 0.5);
        this.add.text(w/2, h/2-40, '生成紋理中...', {fontSize:'18px',fill:'#A8D08D',fontFamily:'Arial'}).setOrigin(0.5);
        this.load.on('progress', v => { fill.width = w*0.6*v; });
    }
    create() {
        TileGen.generateAll(this);
        SpriteGen.generateAll(this);
        AudioMgr.init();
        this.scene.start('Menu');
    }
}

// ============================================
// Menu Scene
// ============================================
class MenuScene extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        if (this.textures.exists('tile_grass')) {
            for (let ty = 0; ty < Math.ceil(h/64); ty++)
                for (let tx = 0; tx < Math.ceil(w/64); tx++)
                    this.add.image(tx*64+32, ty*64+32, 'tile_grass').setAlpha(0.3);
        }
        this.add.rectangle(0, 0, w, h, 0x0a1a0a, 0.6).setOrigin(0);
        this.add.text(w/2, h*0.15, '🦖', {fontSize: Math.min(60,w*0.15)+'px'}).setOrigin(0.5);
        this.add.text(w/2, h*0.27, '恐龍島求生記', {
            fontSize: Math.min(36,w*0.08)+'px', fill:'#A8D08D',
            fontFamily:'Arial', fontStyle:'bold', stroke:'#1B5E20', strokeThickness:4
        }).setOrigin(0.5);
        this.add.text(w/2, h*0.33, 'DINO ISLAND SURVIVAL', {
            fontSize: Math.min(14,w*0.035)+'px', fill:'#66BB6A', fontFamily:'Arial'
        }).setOrigin(0.5);

        // Biome previews
        const tileKeys = ['tile_camp','tile_grass','tile_forest','tile_swamp','tile_volcano'];
        const biomeLabels = ['營地','草原','森林','沼澤','火山'];
        const pw = Math.min(55, w*0.13), gap = 6;
        const totalW = tileKeys.length * pw + (tileKeys.length-1) * gap;
        const startX = w/2 - totalW/2 + pw/2;
        tileKeys.forEach((key, i) => {
            if (this.textures.exists(key)) {
                this.add.image(startX + i*(pw+gap), h*0.43, key).setDisplaySize(pw, pw).setAlpha(0.85);
                this.add.rectangle(startX + i*(pw+gap), h*0.43, pw+2, pw+2).setStrokeStyle(1, 0x4CAF50).setFillStyle(0,0);
            }
            this.add.text(startX + i*(pw+gap), h*0.43 + pw*0.55, biomeLabels[i], {fontSize:'9px', fill:'#aaa', fontFamily:'Arial'}).setOrigin(0.5);
        });

        // Dino previews
        const dinoKeys = ['sprite_dino_raptor','sprite_dino_trike','sprite_dino_trex','sprite_dino_spino','sprite_dino_stego'];
        const dw = Math.min(45, w*0.10);
        const dTotalW = dinoKeys.length * dw + (dinoKeys.length-1) * gap;
        const dStartX = w/2 - dTotalW/2 + dw/2;
        dinoKeys.forEach((key, i) => {
            if (this.textures.exists(key)) {
                const img = this.add.image(dStartX + i*(dw+gap), h*0.56, key);
                img.setScale(Math.min(dw/img.width, dw/img.height));
            }
        });

        // ===== Multiplayer Buttons =====
        const btnW = Math.min(220, w*0.55), btnH = 48;

        // Single player
        const soloBtn = this.add.rectangle(w/2, h*0.66, btnW, btnH, 0x2E7D32, 0.9).setInteractive({useHandCursor:true});
        this.add.text(w/2, h*0.66, '🎮 單人冒險', {fontSize:'20px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        soloBtn.on('pointerover', () => soloBtn.setFillStyle(0x388E3C));
        soloBtn.on('pointerout', () => soloBtn.setFillStyle(0x2E7D32));
        soloBtn.on('pointerdown', () => { AudioMgr.resume(); AudioMgr.playClick(); this.scene.start('Game'); });

        // Multiplayer
        const multiBtn = this.add.rectangle(w/2, h*0.74, btnW, btnH, 0x1565C0, 0.9).setInteractive({useHandCursor:true});
        this.add.text(w/2, h*0.74, '👥 多人房間', {fontSize:'20px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        multiBtn.on('pointerover', () => multiBtn.setFillStyle(0x1976D2));
        multiBtn.on('pointerout', () => multiBtn.setFillStyle(0x1565C0));
        multiBtn.on('pointerdown', () => { AudioMgr.resume(); AudioMgr.playClick(); this.scene.start('Lobby'); });

        const isMobile = this.sys.game.device.input.touch;
        const controlText = isMobile ? '觸控搖桿移動 | 點擊按鈕攻擊/採集' : 'WASD移動 | 空白鍵攻擊 | E採集 | I背包 | C合成';
        this.add.text(w/2, h*0.84, controlText, {
            fontSize: Math.min(12,w*0.03)+'px', fill:'#81C784', fontFamily:'Arial',
            wordWrap:{width:w*0.85}, align:'center'
        }).setOrigin(0.5);
        this.add.text(w/2, h*0.91, 'v2.1 — 1~6人連線生存冒險', {fontSize:'11px',fill:'#4CAF50',fontFamily:'Arial'}).setOrigin(0.5);
    }
}

// ============================================
// Lobby Scene — 多人等待大廳
// ============================================
class LobbyScene extends Phaser.Scene {
    constructor() { super('Lobby'); }
    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(0, 0, w, h, 0x0a1a0a).setOrigin(0);
        this.add.text(w/2, h*0.06, '👥 多人房間大廳', {fontSize:'22px',fill:'#42A5F5',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5);

        // Room ID display
        this.roomId = this.generateRoomId();
        this.add.rectangle(w/2, h*0.14, w*0.7, 44, 0x1a1a1a, 0.8).setStrokeStyle(2, 0x42A5F5);
        this.add.text(w/2, h*0.14, `房間代碼: ${this.roomId}`, {fontSize:'18px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

        // Player slots (1-6)
        this.players = [{ name: '你 (房主)', ready: true, color: 0x4CAF50 }];
        this.playerSlots = [];
        const slotW = w*0.8, slotH = 52;
        for (let i = 0; i < 6; i++) {
            const sy = h*0.22 + i * (slotH + 8);
            const bg = this.add.rectangle(w/2, sy, slotW, slotH, 0x1a1a1a, 0.7).setStrokeStyle(1, 0x444444);
            const numTxt = this.add.text(w/2 - slotW/2 + 16, sy, `P${i+1}`, {fontSize:'16px',fill:'#666',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0, 0.5);
            const nameTxt = this.add.text(w/2 - slotW/2 + 60, sy, '', {fontSize:'14px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0, 0.5);
            const statusTxt = this.add.text(w/2 + slotW/2 - 16, sy, '', {fontSize:'12px',fill:'#81C784',fontFamily:'Arial'}).setOrigin(1, 0.5);

            if (i === 0) {
                bg.setStrokeStyle(2, 0x4CAF50);
                numTxt.setColor('#4CAF50');
                nameTxt.setText('你 (房主)');
                statusTxt.setText('✅ 準備');
            } else {
                nameTxt.setText('等待加入...');
                nameTxt.setColor('#555');
                statusTxt.setText('空位');
                statusTxt.setColor('#555');
            }
            this.playerSlots.push({ bg, numTxt, nameTxt, statusTxt });
        }

        // Simulated player join (for demo)
        this.time.delayedCall(2000, () => this.addSimPlayer('探險家小明', 1));
        this.time.delayedCall(4500, () => this.addSimPlayer('恐龍獵人', 2));

        // Join code input area
        const joinY = h*0.72;
        this.add.text(w/2, joinY - 20, '或輸入代碼加入房間:', {fontSize:'12px',fill:'#aaa',fontFamily:'Arial'}).setOrigin(0.5);
        this.joinCodeBg = this.add.rectangle(w/2, joinY + 10, w*0.5, 40, 0x222222, 0.9).setStrokeStyle(1, 0x666666).setInteractive();
        this.joinCodeTxt = this.add.text(w/2, joinY + 10, '點擊輸入代碼', {fontSize:'14px',fill:'#666',fontFamily:'Arial'}).setOrigin(0.5);
        this.joinCodeBg.on('pointerdown', () => {
            const code = prompt('輸入房間代碼:');
            if (code && code.length === 6) {
                this.joinCodeTxt.setText(code).setColor('#FFD54F');
                this.showMsg('正在連線...', '#42A5F5');
                this.time.delayedCall(1500, () => this.showMsg('已加入房間!', '#4CAF50'));
            }
        });

        // Buttons
        const startBtn = this.add.rectangle(w/2, h*0.84, w*0.6, 50, 0x2E7D32, 0.9).setInteractive({useHandCursor:true});
        this.add.text(w/2, h*0.84, '🚀 開始遊戲', {fontSize:'20px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        startBtn.on('pointerdown', () => {
            AudioMgr.playClick();
            this.showMsg('遊戲開始!', '#FFD54F');
            this.time.delayedCall(800, () => this.scene.start('Game'));
        });

        const backBtn = this.add.text(w/2, h*0.92, '← 返回主選單', {fontSize:'14px',fill:'#FF5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => { AudioMgr.playClick(); this.scene.start('Menu'); });

        this.msgTxt = this.add.text(w/2, h*0.78, '', {fontSize:'13px',fill:'#81C784',fontFamily:'Arial'}).setOrigin(0.5);
    }

    generateRoomId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    addSimPlayer(name, slot) {
        if (slot >= 6) return;
        const s = this.playerSlots[slot];
        s.bg.setStrokeStyle(1, 0x42A5F5);
        s.numTxt.setColor('#42A5F5');
        s.nameTxt.setText(name).setColor('#fff');
        s.statusTxt.setText('✅ 準備').setColor('#81C784');
        this.showMsg(`${name} 加入了房間!`, '#42A5F5');
        AudioMgr.playEquip();
    }

    showMsg(text, color) {
        if (this.msgTxt) this.msgTxt.setText(text).setColor(color);
        this.time.delayedCall(3000, () => { if (this.msgTxt) this.msgTxt.setText(''); });
    }
}

// ============================================
// Game Scene
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
        this._bossWarnCd = 0; // boss warning cooldown

        this.generateMap();
        this.createPlayer();
        this.spawnResources();
        this.spawnDinos();
        this.setupCamera();
        this.setupInput();
        this.scene.launch('UI', { gameScene: this });

        AudioMgr.startBGM(0);

        this.time.addEvent({ delay: D.PLAYER.HUNGER_INTERVAL, callback: this.tickHunger, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 500, callback: () => {
            if (!this.player.sprinting && this.player.stamina < D.PLAYER.MAX_STAMINA)
                this.player.stamina = Math.min(D.PLAYER.MAX_STAMINA, this.player.stamina + D.PLAYER.STAMINA_REGEN * 2);
        }, loop: true });
        this.time.addEvent({ delay: 30000, callback: this.respawnResources, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 45000, callback: this.respawnDinos, callbackScope: this, loop: true });
    }

    // ===== Map =====
    generateMap() {
        const W = D.MAP.WIDTH, H = D.MAP.HEIGHT, cx = W/2, cy = H/2;
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
        const tileKeys = { 0:'tile_camp', 1:'tile_grass', 2:'tile_forest', 3:'tile_swamp', 4:'tile_volcano' };
        const transKeys = {
            '1_2':'tile_grass_forest','2_1':'tile_grass_forest','1_3':'tile_grass_swamp','3_1':'tile_grass_swamp',
            '2_3':'tile_forest_swamp','3_2':'tile_forest_swamp','3_4':'tile_swamp_volcano','4_3':'tile_swamp_volcano'
        };
        this.groundRT = this.add.renderTexture(0, 0, MW, MH).setOrigin(0).setDepth(0);
        for (let y = 0; y < D.MAP.HEIGHT; y += 2) {
            for (let x = 0; x < D.MAP.WIDTH; x += 2) {
                const b = this.mapData[y]?.[x] ?? 1;
                const key = tileKeys[b];
                if (key && this.textures.exists(key)) this.groundRT.draw(key, x*TILE, y*TILE);
            }
        }
        // Transitions
        for (let y = 0; y < D.MAP.HEIGHT; y += 2) {
            for (let x = 0; x < D.MAP.WIDTH; x += 2) {
                const b = this.mapData[y]?.[x]; if (b === undefined) continue;
                for (const [ox,oy] of [[2,0],[-2,0],[0,2],[0,-2]]) {
                    const nb = this.mapData[y+oy]?.[x+ox];
                    if (nb !== undefined && nb !== b) {
                        const tkey = transKeys[`${b}_${nb}`];
                        if (tkey && this.textures.exists(tkey)) { this.groundRT.draw(tkey, x*TILE, y*TILE); break; }
                    }
                }
            }
        }
        // Camp border
        const campCx = MW/2, campCy = MH/2;
        const gfx = this.add.graphics().setDepth(2);
        gfx.lineStyle(2, 0xFFD54F, 0.5); gfx.strokeCircle(campCx, campCy, 5*TILE);
        for (let a = 0; a < 360; a += 10) {
            const rad = a*Math.PI/180;
            gfx.fillStyle(0xFFD54F, 0.15); gfx.fillCircle(campCx+Math.cos(rad)*5*TILE, campCy+Math.sin(rad)*5*TILE, 3);
        }
        // Central campfire
        if (this.textures.exists('sprite_campfire')) {
            const cf = this.add.image(campCx, campCy, 'sprite_campfire').setDepth(3).setDisplaySize(TILE*2, TILE*2);
            this.tweens.add({ targets: cf, scaleX: cf.scaleX*1.1, scaleY: cf.scaleY*1.1, yoyo: true, repeat: -1, duration: 500 });
        }
        this.physics.world.setBounds(0, 0, MW, MH);
    }

    // ===== Player =====
    createPlayer() {
        const cx = MW/2, cy = MH/2;
        const texKey = this.textures.exists('sprite_player') ? 'sprite_player' : null;
        this.player = texKey ? this.add.image(cx, cy, texKey).setDepth(10) : this.add.rectangle(cx, cy, TILE*0.8, TILE*0.8, 0x8D6E63).setDepth(10);
        const pScale = (TILE*1.2)/Math.max(this.player.width, this.player.height);
        this.player.setScale(pScale);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        const bodySize = TILE*0.6;
        this.player.body.setSize(bodySize, bodySize);
        this.player.body.setOffset((this.player.width-bodySize)/2, (this.player.height-bodySize)/2);
        this.playerShadow = this.add.ellipse(cx, cy+12, 20, 8, 0x000000, 0.2).setDepth(9);
        Object.assign(this.player, {
            hp: D.PLAYER.MAX_HP, maxHp: D.PLAYER.MAX_HP,
            hunger: D.PLAYER.MAX_HUNGER, maxHunger: D.PLAYER.MAX_HUNGER,
            stamina: D.PLAYER.MAX_STAMINA, maxStamina: D.PLAYER.MAX_STAMINA,
            atk: D.PLAYER.ATTACK_BASE, def: D.PLAYER.DEFENSE_BASE,
            speed: D.PLAYER.SPEED, sprinting: false,
            inventory: [], equipped: { weapon: null, armor: null },
            facing: { x:0, y:1 }, alive: true, baseScale: pScale,
            invincible: false, poisoned: false, poisonTimer: null,
            lightRadius: 0, torchActive: false
        });
        this.addItem('wood', 5); this.addItem('stone', 3); this.addItem('herb', 3); this.addItem('fruit', 5);
    }

    // ===== Resources =====
    spawnResources() {
        for (let y = 0; y < D.MAP.HEIGHT; y++)
            for (let x = 0; x < D.MAP.WIDTH; x++) {
                const b = this.mapData[y][x]; if (b === 0) continue;
                for (const [key, res] of Object.entries(D.RESOURCES))
                    if (res.biomes.includes(b) && Math.random() < res.rate) this.createResource(key, x*TILE+TILE/2, y*TILE+TILE/2);
            }
    }
    createResource(type, x, y) {
        let spriteKey = RES_SPRITES[type];
        if (type==='wood' && Math.random()<0.4 && this.textures.exists('sprite_wood2')) spriteKey='sprite_wood2';
        let r;
        if (spriteKey && this.textures.exists(spriteKey)) {
            r = this.add.image(x, y, spriteKey).setDepth(3);
            const targetSize = type==='wood' ? TILE*1.4 : TILE*1.0;
            r.setScale(targetSize/Math.max(r.width, r.height));
        } else {
            const colors = { wood:0x8D6E63, stone:0x9E9E9E, herb:0x4CAF50, iron:0xB0BEC5, fruit:0xE91E63 };
            r = this.add.circle(x, y, 7, colors[type]||0xFFFFFF).setDepth(3);
        }
        this.physics.add.existing(r, true); r.type = type;
        this.tweens.add({ targets:r, y:y-2, yoyo:true, repeat:-1, duration:1500+Math.random()*1000, ease:'Sine.easeInOut' });
        this.resources.push(r); return r;
    }
    respawnResources() {
        if (this.resources.length < 400) for (let i = 0; i < 20; i++) {
            const x=rndInt(5,D.MAP.WIDTH-5), y=rndInt(5,D.MAP.HEIGHT-5), b=this.mapData[y][x]; if(b===0)continue;
            for (const [key, res] of Object.entries(D.RESOURCES))
                if (res.biomes.includes(b) && Math.random()<0.3) { this.createResource(key, x*TILE+TILE/2, y*TILE+TILE/2); break; }
        }
    }

    // ===== Dinosaurs =====
    spawnDinos() {
        for (const [key, data] of Object.entries(D.DINOS)) {
            const count = data.boss ? 1 : (data.pack||1)*3;
            for (let i = 0; i < count; i++) this.createDino(key, data);
        }
    }
    createDino(key, data) {
        let x, y, att=0;
        do { x=rndInt(3,D.MAP.WIDTH-3); y=rndInt(3,D.MAP.HEIGHT-3); att++; }
        while ((!data.biomes.includes(this.mapData[y]?.[x])||this.mapData[y][x]===0) && att<50);
        if (att>=50) return null;
        const px=x*TILE+TILE/2, py=y*TILE+TILE/2;
        const spriteKey = DINO_SPRITE_KEYS[key];
        let dino;
        if (spriteKey && this.textures.exists(spriteKey)) {
            dino = this.add.image(px, py, spriteKey).setDepth(5);
            const s = (data.size*1.5)/Math.max(dino.width, dino.height);
            dino.setScale(s); dino.baseScale = s;
        } else { dino = this.add.circle(px, py, data.size/2, data.color).setDepth(5); dino.baseScale=1; }
        this.physics.add.existing(dino); dino.body.setCollideWorldBounds(true);
        const bodyR = data.size*0.5;
        if (dino.type==='Image') { dino.body.setSize(bodyR*2,bodyR*2); dino.body.setOffset((dino.width-bodyR*2)/2,(dino.height-bodyR*2)/2); }
        else dino.body.setCircle(data.size/2);
        const shadow = this.add.ellipse(px, py+data.size*0.4, data.size*0.8, data.size*0.25, 0x000000, 0.15).setDepth(4);
        Object.assign(dino, {
            key, dinoData:{...data}, hp:data.hp, maxHp:data.hp,
            state:'patrol', patrolTarget:{x:px+rnd(-100,100),y:py+rnd(-100,100)},
            homeX:px, homeY:py, attackCd:0, alive:true, shadow, bossWarned:false
        });
        // HP bar — bigger for boss
        const barW = data.boss ? 50 : 30, barH = data.boss ? 6 : 4;
        dino.hpBg = this.add.rectangle(px, py-data.size-4, barW, barH, 0x333333).setDepth(6);
        dino.hpBar = this.add.rectangle(px-barW/2, py-data.size-4, barW, barH, data.boss?0xFF6D00:0xFF1744).setDepth(7).setOrigin(0,0.5);
        dino.hpBarW = barW;
        dino.nameTxt = this.add.text(px, py-data.size-14, (data.boss?'👑 ':'')+data.name, {
            fontSize: data.boss?'13px':'10px', fill: data.boss?'#FFD54F':'#fff',
            fontFamily:'Arial', stroke:'#000', strokeThickness:2
        }).setOrigin(0.5).setDepth(7);
        // Breathing animation
        if (dino.type==='Image')
            this.tweens.add({ targets:dino, scaleY:dino.scaleY*1.03, yoyo:true, repeat:-1, duration:800+Math.random()*400, ease:'Sine.easeInOut' });
        this.dinos.push(dino); return dino;
    }
    respawnDinos() {
        if (this.dinos.filter(d=>d.alive).length < 15) {
            const keys = Object.keys(D.DINOS);
            for (let i=0;i<3;i++) { const key=pick(keys),data=D.DINOS[key]; if(data.nightOnly&&this.dayPhase!==D.DAY_NIGHT.PHASES.NIGHT)continue; this.createDino(key,data); }
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
        this.keys = this.input.keyboard?.addKeys({ w:'W', a:'A', s:'S', d:'D', space:'SPACE', e:'E', i:'I', c:'C', f:'F', shift:'SHIFT', esc:'ESC' });
        if (this.isMobile) this.setupTouch();
        this.moveVec = {x:0, y:0};
    }
    setupTouch() {
        this.joystick = {active:false, baseX:0, baseY:0, dx:0, dy:0};
        this.input.on('pointerdown', p => {
            if (p.x < this.cameras.main.width*0.4 && p.y > this.cameras.main.height*0.5)
                { this.joystick.active=true; this.joystick.baseX=p.x; this.joystick.baseY=p.y; }
        });
        this.input.on('pointermove', p => {
            if (this.joystick.active) { this.joystick.dx=clamp((p.x-this.joystick.baseX)/50,-1,1); this.joystick.dy=clamp((p.y-this.joystick.baseY)/50,-1,1); }
        });
        this.input.on('pointerup', () => { this.joystick.active=false; this.joystick.dx=0; this.joystick.dy=0; });
    }

    // ===== Inventory =====
    addItem(id,qty=1){const def=D.ITEMS[id];if(!def)return false;const inv=this.player.inventory;const ex=inv.find(s=>s.id===id&&s.qty<def.stack);if(ex){const a=Math.min(qty,def.stack-ex.qty);ex.qty+=a;if(qty-a>0)return this.addItem(id,qty-a);return true;}if(inv.length>=D.PLAYER.INV_SIZE)return false;inv.push({id,qty:Math.min(qty,def.stack)});return true;}
    removeItem(id,qty=1){const inv=this.player.inventory;let rem=qty;for(let i=inv.length-1;i>=0;i--){if(inv[i].id===id){const t=Math.min(rem,inv[i].qty);inv[i].qty-=t;rem-=t;if(inv[i].qty<=0)inv.splice(i,1);if(rem<=0)return true;}}return rem<=0;}
    countItem(id){return this.player.inventory.reduce((s,sl)=>sl.id===id?s+sl.qty:s,0);}
    hasItems(mats){return Object.entries(mats).every(([id,qty])=>this.countItem(id)>=qty);}

    useItem(slot) {
        const item=this.player.inventory[slot]; if(!item)return;
        const def=D.ITEMS[item.id];
        if(def.type==='food'){
            if(def.hunger)this.player.hunger=Math.min(this.player.maxHunger,this.player.hunger+def.hunger);
            if(def.hp)this.player.hp=Math.min(this.player.maxHp,this.player.hp+def.hp);
            if(def.cleanse&&this.player.poisoned){this.player.poisoned=false;if(this.player.poisonTimer)this.player.poisonTimer.remove();}
            this.showFloatingText(this.player.x,this.player.y-20,def.hunger?`+${def.hunger} 飽食`:`+${def.hp} HP`,'#4CAF50');
            AudioMgr.playEat(); item.qty--; if(item.qty<=0)this.player.inventory.splice(slot,1);
        }else if(def.type==='weapon'){
            this.player.equipped.weapon=item.id; this.player.atk=D.PLAYER.ATTACK_BASE+(def.atk||0);
            this.showFloatingText(this.player.x,this.player.y-20,`裝備 ${def.name}`,'#FFC107'); AudioMgr.playEquip();
        }else if(def.type==='armor'){
            this.player.equipped.armor=item.id; this.player.def=D.PLAYER.DEFENSE_BASE+(def.def||0);
            this.showFloatingText(this.player.x,this.player.y-20,`裝備 ${def.name}`,'#2196F3'); AudioMgr.playEquip();
        }else if(item.id==='torch'){
            this.player.torchActive=true;this.player.lightRadius=def.light;
            item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(this.player.x,this.player.y-20,'點燃火把','#FF9800'); AudioMgr.playPlace();
            this.time.delayedCall(def.duration*1000,()=>{this.player.torchActive=false;this.player.lightRadius=0;this.showFloatingText(this.player.x,this.player.y-20,'火把熄滅','#9E9E9E');});
        }else if(item.id==='campfire'){
            const cx=this.player.x,cy=this.player.y; let cf;
            if(this.textures.exists('sprite_campfire')){cf=this.add.image(cx,cy,'sprite_campfire').setDepth(4).setDisplaySize(TILE*1.5,TILE*1.5);this.tweens.add({targets:cf,scaleX:cf.scaleX*1.1,scaleY:cf.scaleY*1.1,yoyo:true,repeat:-1,duration:400});}
            else cf=this.add.circle(cx,cy,10,0xFF6D00).setDepth(4);
            const glow=this.add.circle(cx,cy,def.light/3,0xFF8F00,0.08).setDepth(3);this.tweens.add({targets:glow,alpha:0.12,yoyo:true,repeat:-1,duration:600});
            this.physics.add.existing(cf,true);cf.light=def.light;this.campfires.push(cf);
            item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(cx,cy-20,'放置營火','#FF6D00');AudioMgr.playPlace();
        }else if(item.id==='trap'){
            const tx=this.player.x,ty=this.player.y;
            const trap=this.add.circle(tx,ty,8,0x795548,0.6).setDepth(2);
            this.physics.add.existing(trap,true);trap.dmg=def.dmg;trap.active=true;this.traps.push(trap);
            item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(tx,ty-20,'放置陷阱','#795548');AudioMgr.playPlace();
        }
    }

    // ===== Crafting =====
    canCraft(recipe){if(!this.hasItems(recipe.mats))return false;if(recipe.needFire){const nf=this.campfires.some(cf=>dist(cf,this.player)<150);if(!nf&&!this.isInCamp(this.player.x,this.player.y))return false;}return true;}
    craft(recipe){if(!this.canCraft(recipe))return false;for(const[id,qty] of Object.entries(recipe.mats))this.removeItem(id,qty);this.addItem(recipe.result,recipe.qty);this.showFloatingText(this.player.x,this.player.y-20,`合成 ${D.ITEMS[recipe.result].name} x${recipe.qty}`,'#FFC107');AudioMgr.playCraft();return true;}

    // ===== Combat =====
    playerAttack() {
        if(!this.player.alive)return; AudioMgr.playAttack();
        const range=50+(D.ITEMS[this.player.equipped.weapon]?.range||1)*10;
        const fx=this.player.facing, ax=this.player.x+fx.x*20, ay=this.player.y+fx.y*20;
        const slash=this.add.arc(ax,ay,range/2,0,180,false,0xFFFFFF,0.5).setDepth(20);
        slash.setAngle(Math.atan2(fx.y,fx.x)*180/Math.PI-90);
        this.tweens.add({targets:slash,alpha:0,scale:1.5,duration:200,onComplete:()=>slash.destroy()});
        this.dinos.forEach(dino=>{if(!dino.alive)return;if(dist({x:ax,y:ay},dino)<range){
            const dmg=Math.max(1,this.player.atk-dino.dinoData.def/2);this.damageDino(dino,dmg);
            if(dino.dinoData.passive&&dino.state==='patrol')dino.state='chase';
            if(dino.dinoData.reflect)this.damagePlayer(Math.floor(dmg*dino.dinoData.reflect),'反傷');
        }});
    }
    damageDino(dino,dmg){
        dino.hp-=dmg; this.showFloatingText(dino.x,dino.y-20,`-${Math.floor(dmg)}`,'#FF5252'); AudioMgr.playHit();
        if(dino.setTint){dino.setTint(0xFF0000);this.time.delayedCall(120,()=>{if(dino.alive&&dino.clearTint)dino.clearTint();});}
        const dx=dino.x-this.player.x,dy=dino.y-this.player.y,len=Math.hypot(dx,dy)||1;dino.x+=(dx/len)*3;dino.y+=(dy/len)*3;
        if(dino.dinoData.flee)dino.state='flee'; else if(dino.state==='patrol')dino.state='chase';
        if(dino.hp<=0)this.killDino(dino);
    }
    killDino(dino){
        dino.alive=false;dino.state='dead';this.kills++;
        dino.dinoData.drops.forEach(([id,qty])=>{if(Math.random()<0.8)this.addItem(id,qty);});
        this.showFloatingText(dino.x,dino.y-30,`+${dino.dinoData.xp} XP`,'#FFD54F'); AudioMgr.playDinoDeath();
        for(let i=0;i<6;i++){const p=this.add.circle(dino.x+rnd(-10,10),dino.y+rnd(-10,10),3,0xFFFFFF,0.6).setDepth(20);this.tweens.add({targets:p,x:p.x+rnd(-30,30),y:p.y+rnd(-30,30),alpha:0,scale:0,duration:400,onComplete:()=>p.destroy()});}
        this.tweens.add({targets:[dino,dino.hpBg,dino.hpBar,dino.nameTxt,dino.shadow],alpha:0,duration:500,
            onComplete:()=>{dino.destroy();dino.hpBg.destroy();dino.hpBar.destroy();dino.nameTxt.destroy();if(dino.shadow)dino.shadow.destroy();}});
        this.dinos=this.dinos.filter(d=>d!==dino);
    }
    damagePlayer(dmg,label=''){
        if(this.player.invincible||!this.player.alive)return;
        const actual=Math.max(1,dmg-this.player.def/2); this.player.hp-=actual;
        this.showFloatingText(this.player.x,this.player.y-25,`-${Math.floor(actual)}${label?' '+label:''}`,'#FF1744'); AudioMgr.playHit();
        if(this.player.setTint)this.player.setTint(0xFF0000);
        this.player.invincible=true;
        this.time.delayedCall(400,()=>{if(this.player.alive){if(this.player.clearTint)this.player.clearTint();this.player.invincible=false;}});
        this.cameras.main.shake(100,0.005); if(this.player.hp<=0)this.playerDeath();
    }
    playerDeath(){
        this.player.alive=false; if(this.player.setTint)this.player.setTint(0x555555);
        this.player.body.setVelocity(0,0); this.showFloatingText(this.player.x,this.player.y-40,'你倒下了...','#FF1744'); AudioMgr.playPlayerDeath();
        const inv=this.player.inventory;for(let i=inv.length-1;i>=0;i--){if(D.ITEMS[inv[i].id]?.type==='resource'){const drop=Math.ceil(inv[i].qty*0.3);inv[i].qty-=drop;if(inv[i].qty<=0)inv.splice(i,1);}}
        this.time.delayedCall(3000,()=>{
            this.player.x=MW/2;this.player.y=MH/2;this.player.hp=D.PLAYER.MAX_HP/2;this.player.hunger=D.PLAYER.MAX_HUNGER/2;this.player.stamina=D.PLAYER.MAX_STAMINA;
            this.player.alive=true;if(this.player.clearTint)this.player.clearTint();this.showFloatingText(MW/2,MH/2-30,'在營地重生','#4CAF50');
        });
    }

    // ===== Gather =====
    gather(){
        if(!this.player.alive)return; let closest=null,minD=45;
        this.resources.forEach(r=>{const d=dist(r,this.player);if(d<minD){minD=d;closest=r;}});
        if(closest){
            if(this.addItem(closest.type,1)){
                this.showFloatingText(closest.x,closest.y-10,`+1 ${D.RESOURCES[closest.type].name}`,'#81C784'); AudioMgr.playGather();
                for(let i=0;i<4;i++){const p=this.add.circle(closest.x+rnd(-5,5),closest.y+rnd(-5,5),2,0x81C784,0.7).setDepth(20);this.tweens.add({targets:p,y:p.y-20,alpha:0,duration:400,onComplete:()=>p.destroy()});}
                closest.destroy();this.resources=this.resources.filter(r=>r!==closest);
            }else this.showFloatingText(this.player.x,this.player.y-20,'背包已滿!','#FF5252');
        }
    }

    // ===== Systems =====
    tickHunger(){if(!this.player.alive)return;const rate=this.player.sprinting?D.PLAYER.HUNGER_DECAY*2:D.PLAYER.HUNGER_DECAY;this.player.hunger=Math.max(0,this.player.hunger-rate);if(this.player.hunger<=0)this.damagePlayer(D.PLAYER.HUNGER_DAMAGE,'飢餓');}
    isInCamp(x,y){return dist({x,y},{x:MW/2,y:MH/2})<5*TILE;}
    getDayPhaseStr(){return ['☀️ 白天','🌅 黃昏','🌙 黑夜'][this.dayPhase];}
    getBiomeName(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return ['營地','草原','森林','沼澤','火山','洞穴'][this.mapData[ty]?.[tx]]||'未知';}
    showFloatingText(x,y,text,color='#fff'){const txt=this.add.text(x,y,text,{fontSize:'12px',fill:color,fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(100);this.tweens.add({targets:txt,y:y-30,alpha:0,duration:1200,onComplete:()=>txt.destroy()});}

    // ===== Main Update =====
    update(time, delta) {
        if(!this.player.alive)return;
        this.gameTime+=delta; this.survivalTime+=delta;
        this.updateDayNight(delta);
        this.updatePlayerMovement();
        this.updateDinoAI(delta);
        this.updateSwampDamage(delta);
        this.updateBossWarning(delta);
        if(this.playerShadow) this.playerShadow.setPosition(this.player.x, this.player.y+12);
        if(this.player.facing.x<0 && this.player.setFlipX) this.player.setFlipX(true);
        else if(this.player.facing.x>0 && this.player.setFlipX) this.player.setFlipX(false);
        if(this.player.body.velocity.length()>10) this.player.y+=Math.sin(time*0.008)*0.3;
    }

    updateDayNight(delta){
        this.dayTimer+=delta;
        const{DAY_DURATION,DUSK_DURATION,NIGHT_DURATION,PHASES}=D.DAY_NIGHT;
        const cycle=DAY_DURATION+DUSK_DURATION+NIGHT_DURATION, t=this.dayTimer%cycle;
        const prev=this.dayPhase;
        if(t<DAY_DURATION){this.dayPhase=PHASES.DAY;this.overlay.setAlpha(0);}
        else if(t<DAY_DURATION+DUSK_DURATION){this.dayPhase=PHASES.DUSK;this.overlay.setFillStyle(0x331100);this.overlay.setAlpha((t-DAY_DURATION)/DUSK_DURATION*0.3);}
        else{this.dayPhase=PHASES.NIGHT;const torch=this.player.torchActive||this.campfires.some(cf=>dist(cf,this.player)<150);this.overlay.setFillStyle(0x000033);this.overlay.setAlpha(torch?0.35:0.6);}
        if(prev!==this.dayPhase) AudioMgr.updateBGM(this.dayPhase);
    }

    updatePlayerMovement(){
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
        const len=Math.hypot(vx,vy);if(len>0){vx/=len;vy/=len;p.facing={x:vx,y:vy};}
        const biome=this.mapData[Math.floor(p.y/TILE)]?.[Math.floor(p.x/TILE)];
        const spd=(p.sprinting?D.PLAYER.SPRINT_SPEED:p.speed)*(biome===D.MAP.BIOMES.SWAMP?0.7:1);
        p.body.setVelocity(vx*spd,vy*spd);
        if(p.sprinting&&len>0){p.stamina=Math.max(0,p.stamina-0.3);if(p.stamina<=0)p.sprinting=false;}
    }

    updateSwampDamage(delta){
        const biome=this.mapData[Math.floor(this.player.y/TILE)]?.[Math.floor(this.player.x/TILE)];
        if(biome===D.MAP.BIOMES.SWAMP){
            if(!this._swampT)this._swampT=0;this._swampT+=delta;
            if(this._swampT>10000){this._swampT=0;this.damagePlayer(1,'瘴氣');AudioMgr.playPoison();
                for(let i=0;i<4;i++){const p=this.add.circle(this.player.x+rnd(-15,15),this.player.y+rnd(-15,15),3,0x9C27B0,0.5).setDepth(20);this.tweens.add({targets:p,y:p.y-25,alpha:0,duration:600,onComplete:()=>p.destroy()});}
            }
        }
    }

    // ===== Boss proximity warning =====
    updateBossWarning(delta) {
        this._bossWarnCd = Math.max(0, this._bossWarnCd - delta);
        if (this._bossWarnCd > 0) return;
        const p = this.player, inCamp = this.isInCamp(p.x, p.y);
        if (inCamp) return;
        this.dinos.forEach(dino => {
            if (!dino.alive || !dino.dinoData.boss) return;
            const d = dist(dino, p);
            // Warning zone: when boss is approaching but not yet in attack range
            if (d < dino.dinoData.detectRange * 1.5 && d > dino.dinoData.size + 20) {
                if (!dino.bossWarned) {
                    // First time entering zone — roar + screen effect
                    AudioMgr.playRoar();
                    this.cameras.main.shake(200, 0.008);
                    this.showFloatingText(p.x, p.y - 40, `⚠️ ${dino.dinoData.name} 接近中!`, '#FF6D00');
                    // Red vignette flash
                    const vign = this.add.rectangle(this.cameras.main.width/2, this.cameras.main.height/2, 2000, 2000, 0xFF0000, 0.15).setDepth(49).setScrollFactor(0);
                    this.tweens.add({ targets: vign, alpha: 0, duration: 1500, onComplete: () => vign.destroy() });
                    dino.bossWarned = true;
                    this._bossWarnCd = 8000; // 8s cooldown
                } else if (d < dino.dinoData.detectRange) {
                    // Heartbeat when close
                    AudioMgr.playBossWarning();
                    this._bossWarnCd = 3000;
                }
            }
            if (d > dino.dinoData.aggro) dino.bossWarned = false;
        });
    }

    // ===== Dino AI — fixed attackCd with delta =====
    updateDinoAI(delta) {
        const p=this.player, isNight=this.dayPhase===D.DAY_NIGHT.PHASES.NIGHT, inCamp=this.isInCamp(p.x,p.y);
        this.dinos.forEach(dino=>{
            if(!dino.alive)return;
            if(dino.dinoData.nightOnly&&!isNight){dino.setAlpha(0.3);dino.state='patrol';return;}else{dino.setAlpha(1);}
            const d=dist(dino,p), data=dino.dinoData, nightMult=(isNight&&data.nightBuff)?1.5:1;
            switch(dino.state){
                case 'patrol':
                    if(dist(dino,dino.patrolTarget)<10||dist(dino,dino.patrolTarget)>500)
                        dino.patrolTarget={x:dino.homeX+rnd(-120,120),y:dino.homeY+rnd(-120,120)};
                    this.moveToward(dino,dino.patrolTarget,data.speed*0.4);
                    if(dino.setFlipX)dino.setFlipX(dino.body.velocity.x<0);
                    if(d<data.detectRange&&!inCamp&&!data.passive)dino.state='chase';
                    break;
                case 'chase':
                    if(d>data.aggro||inCamp){dino.state='patrol';break;}
                    this.moveToward(dino,p,data.speed*nightMult);
                    if(dino.setFlipX)dino.setFlipX(p.x<dino.x);
                    if(d<data.size+15){dino.state='attack';dino.attackCd=0;}
                    break;
                case 'attack':
                    if(d>data.size+40){dino.state='chase';break;}
                    dino.body.setVelocity(0,0);
                    dino.attackCd -= delta; // ← FIXED: was hardcoded 16, now uses actual delta
                    if(dino.attackCd<=0){
                        const dmg=data.atk*nightMult;
                        this.damagePlayer(dmg);
                        if(data.poison&&!p.poisoned){
                            p.poisoned=true;this.showFloatingText(p.x,p.y-35,'中毒!','#9C27B0');AudioMgr.playPoison();
                            p.poisonTimer=this.time.addEvent({delay:1000,repeat:5,callback:()=>{if(p.alive&&p.poisoned)this.damagePlayer(2,'毒');}});
                            this.time.delayedCall(6000,()=>{p.poisoned=false;});
                        }
                        dino.attackCd=1200;
                        // Attack lunge animation
                        if(dino.setTint){dino.setTint(0xFFAAAA);this.time.delayedCall(200,()=>{if(dino.alive&&dino.clearTint)dino.clearTint();});}
                    }
                    break;
                case 'flee':
                    this.moveToward(dino,{x:dino.x+(dino.x-p.x),y:dino.y+(dino.y-p.y)},data.speed*1.3);
                    if(d>data.aggro)dino.state='patrol';
                    break;
            }
            if(dino.alive){
                if(dino.hpBg)dino.hpBg.setPosition(dino.x,dino.y-data.size-4);
                if(dino.hpBar){dino.hpBar.setPosition(dino.x-dino.hpBarW/2,dino.y-data.size-4);dino.hpBar.width=dino.hpBarW*(dino.hp/dino.maxHp);}
                if(dino.nameTxt)dino.nameTxt.setPosition(dino.x,dino.y-data.size-14);
                if(dino.shadow)dino.shadow.setPosition(dino.x,dino.y+data.size*0.4);
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

    moveToward(obj,target,speed){const dx=target.x-obj.x,dy=target.y-obj.y,len=Math.hypot(dx,dy);if(len>2)obj.body.setVelocity((dx/len)*speed,(dy/len)*speed);else obj.body.setVelocity(0,0);}
}

// ============================================
// UI Scene — 放大字體 + 捲動合成面板
// ============================================
class UIScene extends Phaser.Scene {
    constructor() { super('UI'); }
    create(data) {
        this.gs = data.gameScene;
        this.showInv = false; this.showCraft = false;
        this.craftPage = 0;
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const safeTop = 16, safeLeft = 12;
        // Detect mobile for font scaling
        this._mob = this.gs.isMobile;
        const fs = (base) => this._mob ? Math.max(base, Math.floor(base*1.3)) : base;

        // HUD
        this.add.rectangle(safeLeft+80, safeTop+30, 170, 70, 0x000000, 0.4).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        this.hpBg=this.add.rectangle(safeLeft+80,safeTop+12,140,14,0x333333).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.hpFill=this.add.rectangle(safeLeft+11,safeTop+12,138,12,0xF44336).setOrigin(0,0.5).setScrollFactor(0).setDepth(101);
        this.hpTxt=this.add.text(safeLeft+80,safeTop+12,'',{fontSize:fs(11)+'px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft,safeTop+12,'❤️',{fontSize:'12px'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(102);

        this.hungerBg=this.add.rectangle(safeLeft+80,safeTop+30,140,14,0x333333).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.hungerFill=this.add.rectangle(safeLeft+11,safeTop+30,138,12,0xFF9800).setOrigin(0,0.5).setScrollFactor(0).setDepth(101);
        this.hungerTxt=this.add.text(safeLeft+80,safeTop+30,'',{fontSize:fs(11)+'px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft,safeTop+30,'🍖',{fontSize:'12px'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(102);

        this.staminaBg=this.add.rectangle(safeLeft+80,safeTop+48,140,14,0x333333).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.staminaFill=this.add.rectangle(safeLeft+11,safeTop+48,138,12,0xFDD835).setOrigin(0,0.5).setScrollFactor(0).setDepth(101);
        this.staminaTxt=this.add.text(safeLeft+80,safeTop+48,'',{fontSize:fs(11)+'px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.add.text(safeLeft,safeTop+48,'⚡',{fontSize:'12px'}).setOrigin(0,0.5).setScrollFactor(0).setDepth(102);

        this.dayTxt=this.add.text(w/2,safeTop+8,'',{fontSize:fs(14)+'px',fill:'#FFD54F',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.biomeTxt=this.add.text(w/2,safeTop+26,'',{fontSize:fs(11)+'px',fill:'#aaa',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.statsTxt=this.add.text(w-10,safeTop+8,'',{fontSize:fs(11)+'px',fill:'#81C784',fontFamily:'Arial',align:'right'}).setOrigin(1,0).setScrollFactor(0).setDepth(101);

        // Sound toggle
        const sndBtn=this.add.text(w-10,safeTop+50,'🔊',{fontSize:'18px'}).setOrigin(1,0).setScrollFactor(0).setDepth(110).setInteractive();
        sndBtn.on('pointerdown',()=>{AudioMgr.toggleMute();sndBtn.setText(AudioMgr.masterGain?.gain.value>0?'🔊':'🔇');});

        if(this.gs.isMobile)this.createMobileButtons(w,h);

        this.invPanel=this.add.container(w/2,h/2).setDepth(200).setVisible(false).setScrollFactor(0);
        this.craftPanel=this.add.container(w/2,h/2).setDepth(200).setVisible(false).setScrollFactor(0);

        // Quick bar — bigger slots
        const qSlotSize = this._mob ? 48 : 42;
        this.quickBar=this.add.container(w/2,h-50).setDepth(105).setScrollFactor(0);
        this.quickSlots=[];
        for(let i=0;i<5;i++){
            const sx=(i-2)*(qSlotSize+4);
            const bg=this.add.rectangle(sx,0,qSlotSize,qSlotSize,0x1a1a1a,0.7).setStrokeStyle(1,0x4CAF50);
            const txt=this.add.text(sx,0,'',{fontSize:fs(11)+'px',fill:'#fff',fontFamily:'Arial',align:'center',wordWrap:{width:qSlotSize-4}}).setOrigin(0.5);
            const qty=this.add.text(sx+qSlotSize/2-2,qSlotSize/2-2,'',{fontSize:fs(10)+'px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(1,1);
            bg.setInteractive().on('pointerdown',()=>{AudioMgr.playClick();this.gs.useItem(i);});
            this.quickBar.add([bg,txt,qty]); this.quickSlots.push({bg,txt,qty});
        }

        this.gs.events.on('toggleInventory',()=>this.toggleInventory());
        this.gs.events.on('toggleCrafting',()=>this.toggleCrafting());
    }

    createMobileButtons(w,h){
        const btnSize=56, margin=16, bottomY=h-44, rightX=w-margin;
        const atkBtn=this.add.circle(rightX-btnSize/2,bottomY-btnSize-10,btnSize/2,0xF44336,0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize/2,bottomY-btnSize-10,'⚔️',{fontSize:'22px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        atkBtn.on('pointerdown',()=>this.gs.playerAttack());

        const gatherBtn=this.add.circle(rightX-btnSize*1.6,bottomY-btnSize/2,btnSize/2,0x4CAF50,0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize*1.6,bottomY-btnSize/2,'🪓',{fontSize:'22px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        gatherBtn.on('pointerdown',()=>this.gs.gather());

        const invBtn=this.add.circle(rightX-btnSize/2,bottomY+14,btnSize/3,0x2196F3,0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize/2,bottomY+14,'🎒',{fontSize:'16px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        invBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleInventory();});

        const craftBtn=this.add.circle(rightX-btnSize*1.6,bottomY+14,btnSize/3,0xFF9800,0.7).setInteractive().setScrollFactor(0).setDepth(110);
        this.add.text(rightX-btnSize*1.6,bottomY+14,'🔨',{fontSize:'16px'}).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        craftBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleCrafting();});
    }

    toggleInventory(){this.showInv=!this.showInv;this.showCraft=false;this.craftPanel.setVisible(false);if(this.showInv)this.buildInventoryPanel();this.invPanel.setVisible(this.showInv);}
    toggleCrafting(){this.showCraft=!this.showCraft;this.showInv=false;this.invPanel.setVisible(false);this.craftPage=0;if(this.showCraft)this.buildCraftPanel();this.craftPanel.setVisible(this.showCraft);}

    buildInventoryPanel(){
        this.invPanel.removeAll(true);
        const w=this.cameras.main.width, h=this.cameras.main.height;
        const pw=Math.min(320, w*0.88), ph=Math.min(400, h*0.65);
        const fs = (base) => this._mob ? Math.max(base, Math.floor(base*1.3)) : base;

        this.invPanel.add(this.add.rectangle(0,0,pw,ph,0x1a1a1a,0.94).setStrokeStyle(2,0x4CAF50));
        this.invPanel.add(this.add.text(0,-ph/2+18,'🎒 背包',{fontSize:fs(16)+'px',fill:'#4CAF50',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
        const closeBtn=this.add.text(pw/2-20,-ph/2+12,'✕',{fontSize:fs(20)+'px',fill:'#ff5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleInventory();}); this.invPanel.add(closeBtn);

        const ep=this.gs.player.equipped;
        this.invPanel.add(this.add.text(-pw/2+14,-ph/2+40,`武器: ${ep.weapon?D.ITEMS[ep.weapon].name:'無'} | 防具: ${ep.armor?D.ITEMS[ep.armor].name:'無'}`,{fontSize:fs(11)+'px',fill:'#FFD54F',fontFamily:'Arial'}));
        this.invPanel.add(this.add.text(-pw/2+14,-ph/2+58,`ATK:${this.gs.player.atk} DEF:${this.gs.player.def}`,{fontSize:fs(11)+'px',fill:'#81C784',fontFamily:'Arial'}));

        const inv=this.gs.player.inventory, cols=5, slotSize=Math.floor((pw-20)/cols);
        const startX=-cols*slotSize/2+slotSize/2, startY=-ph/2+82;
        for(let i=0;i<D.PLAYER.INV_SIZE;i++){
            const col=i%cols,row=Math.floor(i/cols), sx=startX+col*slotSize, sy=startY+row*slotSize;
            const bg=this.add.rectangle(sx,sy,slotSize-4,slotSize-4,0x333333,0.8).setStrokeStyle(1,0x555555).setInteractive();
            this.invPanel.add(bg);
            if(i<inv.length){
                const item=inv[i],def=D.ITEMS[item.id];
                this.invPanel.add(this.add.text(sx,sy-8,def.name.substring(0,3),{fontSize:fs(12)+'px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5));
                this.invPanel.add(this.add.text(sx+slotSize/2-6,sy+slotSize/2-6,`${item.qty}`,{fontSize:fs(10)+'px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(1,1));
                if(def.desc) this.invPanel.add(this.add.text(sx,sy+10,def.desc.substring(0,6),{fontSize:'8px',fill:'#999',fontFamily:'Arial'}).setOrigin(0.5));
                const idx=i;bg.on('pointerdown',()=>{AudioMgr.playClick();this.gs.useItem(idx);this.buildInventoryPanel();});
            }
        }
    }

    buildCraftPanel(){
        this.craftPanel.removeAll(true);
        const w=this.cameras.main.width, h=this.cameras.main.height;
        const pw=Math.min(340, w*0.9), ph=Math.min(480, h*0.72);
        const fs = (base) => this._mob ? Math.max(base, Math.floor(base*1.3)) : base;

        this.craftPanel.add(this.add.rectangle(0,0,pw,ph,0x1a1a1a,0.94).setStrokeStyle(2,0xFF9800));
        this.craftPanel.add(this.add.text(0,-ph/2+18,'🔨 合成',{fontSize:fs(16)+'px',fill:'#FF9800',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
        const closeBtn=this.add.text(pw/2-20,-ph/2+12,'✕',{fontSize:fs(20)+'px',fill:'#ff5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleCrafting();}); this.craftPanel.add(closeBtn);

        // Pagination for scrolling
        const rowH = this._mob ? 56 : 48;
        const contentH = ph - 80; // available height for rows
        const itemsPerPage = Math.floor(contentH / rowH);
        const totalPages = Math.ceil(D.RECIPES.length / itemsPerPage);
        const startIdx = this.craftPage * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, D.RECIPES.length);

        const startY = -ph/2 + 48;
        for (let idx = startIdx; idx < endIdx; idx++) {
            const r = D.RECIPES[idx];
            const i = idx - startIdx;
            const y = startY + i * rowH;
            const canCraft = this.gs.canCraft(r), def = D.ITEMS[r.result];
            const matsStr = Object.entries(r.mats).map(([id,qty])=>`${D.ITEMS[id].name}x${qty}`).join(' ');
            this.craftPanel.add(this.add.rectangle(0, y+rowH/2-4, pw-20, rowH-6, canCraft?0x1B5E20:0x333333, 0.7).setStrokeStyle(1, canCraft?0x4CAF50:0x444444));
            this.craftPanel.add(this.add.text(-pw/2+18, y+6, `${def.name} x${r.qty}`, {fontSize:fs(13)+'px', fill:canCraft?'#A8D08D':'#777', fontFamily:'Arial', fontStyle:'bold'}));
            this.craftPanel.add(this.add.text(-pw/2+18, y+26, matsStr+(r.needFire?' 🔥':''), {fontSize:fs(10)+'px', fill:canCraft?'#81C784':'#555', fontFamily:'Arial'}));
            if(canCraft){
                const btn=this.add.text(pw/2-28, y+rowH/2-6, '製作', {fontSize:fs(13)+'px', fill:'#FFD54F', fontFamily:'Arial', fontStyle:'bold', backgroundColor:'#2E7D32', padding:{x:8,y:4}}).setOrigin(0.5).setInteractive();
                btn.on('pointerdown',()=>{this.gs.craft(r);this.buildCraftPanel();});
                this.craftPanel.add(btn);
            }
        }

        // Page navigation
        if (totalPages > 1) {
            const navY = ph/2 - 22;
            this.craftPanel.add(this.add.text(0, navY, `${this.craftPage+1} / ${totalPages}`, {fontSize:fs(12)+'px', fill:'#aaa', fontFamily:'Arial'}).setOrigin(0.5));
            if (this.craftPage > 0) {
                const prevBtn = this.add.text(-pw/3, navY, '◀ 上一頁', {fontSize:fs(13)+'px', fill:'#42A5F5', fontFamily:'Arial', fontStyle:'bold'}).setOrigin(0.5).setInteractive();
                prevBtn.on('pointerdown', () => { AudioMgr.playClick(); this.craftPage--; this.buildCraftPanel(); });
                this.craftPanel.add(prevBtn);
            }
            if (this.craftPage < totalPages - 1) {
                const nextBtn = this.add.text(pw/3, navY, '下一頁 ▶', {fontSize:fs(13)+'px', fill:'#42A5F5', fontFamily:'Arial', fontStyle:'bold'}).setOrigin(0.5).setInteractive();
                nextBtn.on('pointerdown', () => { AudioMgr.playClick(); this.craftPage++; this.buildCraftPanel(); });
                this.craftPanel.add(nextBtn);
            }
        }
    }

    update(){
        const p=this.gs.player;if(!p)return;
        this.hpFill.width=138*(p.hp/p.maxHp);this.hpTxt.setText(`${Math.floor(p.hp)}/${p.maxHp}`);
        this.hungerFill.width=138*(p.hunger/p.maxHunger);this.hungerTxt.setText(`${Math.floor(p.hunger)}/${p.maxHunger}`);
        this.staminaFill.width=138*(p.stamina/p.maxStamina);this.staminaTxt.setText(`${Math.floor(p.stamina)}/${p.maxStamina}`);
        this.hpFill.setFillStyle(p.hp>50?0x4CAF50:p.hp>25?0xFF9800:0xF44336);
        this.hungerFill.setFillStyle(p.hunger>40?0xFF9800:p.hunger>15?0xF44336:0xB71C1C);
        this.dayTxt.setText(this.gs.getDayPhaseStr());
        this.biomeTxt.setText(`📍 ${this.gs.getBiomeName(p.x,p.y)}`);
        const mins=Math.floor(this.gs.survivalTime/60000),secs=Math.floor((this.gs.survivalTime%60000)/1000);
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
    scene: [BootScene, MenuScene, LobbyScene, GameScene, UIScene],
    pixelArt: true,
    backgroundColor: '#0a1a0a',
    input: { activePointers: 3 }
};

const game = new Phaser.Game(config);
