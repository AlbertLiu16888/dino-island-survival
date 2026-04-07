// ===== 恐龍島求生記 — 主遊戲引擎 v3.0 =====
// 真實多人連線(PeerJS) + 觸控搖桿 + 攻擊採集合併按鈕
const D = GAME_DATA;
const TILE = D.MAP.TILE_SIZE;
const MW = D.MAP.WIDTH * TILE;
const MH = D.MAP.HEIGHT * TILE;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[rndInt(0, arr.length - 1)];
const RES_SPRITES = { wood:'sprite_wood', stone:'sprite_stone', herb:'sprite_herb', iron:'sprite_iron', fruit:'sprite_fruit' };
const DINO_SPRITE_KEYS = {
    raptor:'sprite_dino_raptor', oviraptor:'sprite_dino_oviraptor', trike:'sprite_dino_trike',
    stego:'sprite_dino_stego', dilopho:'sprite_dino_dilopho', allo:'sprite_dino_allo',
    trex:'sprite_dino_trex', spino:'sprite_dino_spino'
};
const PLAYER_TINTS = [0xFFFFFF, 0x42A5F5, 0xFF5252, 0xFFD54F, 0x66BB6A, 0xAB47BC];

// ============================================
// Boot Scene
// ============================================
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(w/2, h/2, w*0.6, 20, 0x2F5233).setOrigin(0.5);
        const fill = this.add.rectangle(w/2-w*0.3, h/2, 0, 16, 0x4CAF50).setOrigin(0, 0.5);
        this.add.text(w/2, h/2-40, '生成紋理中...', {fontSize:'18px',fill:'#A8D08D',fontFamily:'Arial'}).setOrigin(0.5);
        this.load.on('progress', v => { fill.width = w*0.6*v; });
    }
    create() { TileGen.generateAll(this); SpriteGen.generateAll(this); AudioMgr.init(); this.scene.start('Menu'); }
}

// ============================================
// Menu Scene
// ============================================
class MenuScene extends Phaser.Scene {
    constructor() { super('Menu'); }
    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.selectedSkin=0;this.playerName='';this.nextTarget=null;
        if (this.textures.exists('tile_grass'))
            for (let ty=0;ty<Math.ceil(h/64);ty++) for(let tx=0;tx<Math.ceil(w/64);tx++)
                this.add.image(tx*64+32,ty*64+32,'tile_grass').setAlpha(0.3);
        this.add.rectangle(0,0,w,h,0x0a1a0a,0.6).setOrigin(0);
        this.add.text(w/2,h*0.08,'🦖',{fontSize:Math.min(48,w*0.12)+'px'}).setOrigin(0.5);
        this.add.text(w/2,h*0.17,'恐龍島求生記',{fontSize:Math.min(32,w*0.07)+'px',fill:'#A8D08D',fontFamily:'Arial',fontStyle:'bold',stroke:'#1B5E20',strokeThickness:4}).setOrigin(0.5);
        this.add.text(w/2,h*0.22,'🎯 在恐龍島上存活 10 天!',{fontSize:Math.min(13,w*0.032)+'px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

        // ===== Character Selection =====
        this.add.text(w/2,h*0.28,'選擇角色',{fontSize:'16px',fill:'#81C784',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        const skins=SpriteGen.PLAYER_SKINS;
        const cw=Math.min(52,w*0.13),cgap=8,ctotalW=skins.length*cw+(skins.length-1)*cgap,cstartX=w/2-ctotalW/2+cw/2;
        this.skinBorders=[];this.skinPreviews=[];
        skins.forEach((skin,i)=>{
            const cx=cstartX+i*(cw+cgap),cy=h*0.37;
            const border=this.add.rectangle(cx,cy,cw+4,cw+4,0x000000,0).setStrokeStyle(i===0?3:1,i===0?0x4CAF50:0x555555);
            const sk='sprite_player_'+i;
            if(this.textures.exists(sk)){
                const img=this.add.image(cx,cy,sk).setDisplaySize(cw-6,cw-6);
                this.skinPreviews.push(img);
            }
            this.add.text(cx,cy+cw/2+10,skin.name,{fontSize:'10px',fill:i===0?'#4CAF50':'#888',fontFamily:'Arial'}).setOrigin(0.5);
            border.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
                AudioMgr.playClick();this.selectedSkin=i;
                this.skinBorders.forEach((b,j)=>b.setStrokeStyle(j===i?3:1,j===i?0x4CAF50:0x555555));
            });
            this.skinBorders.push(border);
        });

        // ===== Name Input =====
        this.add.text(w/2,h*0.50,'玩家名稱:',{fontSize:'14px',fill:'#81C784',fontFamily:'Arial'}).setOrigin(0.5);
        const nameBoxW=Math.min(200,w*0.5);
        this.add.rectangle(w/2,h*0.56,nameBoxW,36,0x222222,0.9).setStrokeStyle(1,0x4CAF50);
        this.nameDisplay=this.add.text(w/2,h*0.56,'點擊輸入名稱',{fontSize:'14px',fill:'#666',fontFamily:'Arial'}).setOrigin(0.5);
        this.add.rectangle(w/2,h*0.56,nameBoxW,36,0x000000,0).setInteractive({useHandCursor:true}).on('pointerdown',()=>{
            const n=prompt('輸入玩家名稱 (最多8字):','探險家');
            if(n){this.playerName=n.substring(0,8);this.nameDisplay.setText(this.playerName).setColor('#fff');}
        });

        // ===== Play Buttons =====
        const btnW=Math.min(220,w*0.55),btnH=44;
        const soloBtn=this.add.rectangle(w/2,h*0.66,btnW,btnH,0x2E7D32,0.9).setInteractive({useHandCursor:true});
        this.add.text(w/2,h*0.66,'🎮 單人冒險',{fontSize:'18px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        soloBtn.on('pointerover',()=>soloBtn.setFillStyle(0x388E3C));soloBtn.on('pointerout',()=>soloBtn.setFillStyle(0x2E7D32));
        soloBtn.on('pointerdown',()=>{AudioMgr.resume();AudioMgr.playClick();
            const name=this.playerName||'探險家';
            this.scene.start('Game',{multi:false,skinIdx:this.selectedSkin,playerName:name});});

        const multiBtn=this.add.rectangle(w/2,h*0.74,btnW,btnH,0x1565C0,0.9).setInteractive({useHandCursor:true});
        this.add.text(w/2,h*0.74,'👥 多人連線',{fontSize:'18px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        multiBtn.on('pointerover',()=>multiBtn.setFillStyle(0x1976D2));multiBtn.on('pointerout',()=>multiBtn.setFillStyle(0x1565C0));
        multiBtn.on('pointerdown',()=>{AudioMgr.resume();AudioMgr.playClick();
            const name=this.playerName||'探險家';
            this.scene.start('Lobby',{skinIdx:this.selectedSkin,playerName:name});});

        const isMobile=this.sys.game.device.input.touch;
        this.add.text(w/2,h*0.82,isMobile?'觸控搖桿移動 | 點擊按鈕操作':'WASD移動 | 空白鍵攻擊 | E採集 | I背包 | C合成',{fontSize:Math.min(11,w*0.028)+'px',fill:'#81C784',fontFamily:'Arial',wordWrap:{width:w*0.85},align:'center'}).setOrigin(0.5);

        // Biome previews (compact row)
        const tileKeys=['tile_camp','tile_grass','tile_forest','tile_swamp','tile_volcano'];
        const biomeLabels=['營地','草原','森林','沼澤','火山'];
        const pw=Math.min(36,w*0.08),gap=4,totalW=tileKeys.length*pw+(tileKeys.length-1)*gap,startX=w/2-totalW/2+pw/2;
        tileKeys.forEach((key,i)=>{
            if(this.textures.exists(key))this.add.image(startX+i*(pw+gap),h*0.89,key).setDisplaySize(pw,pw).setAlpha(0.7);
            this.add.text(startX+i*(pw+gap),h*0.89+pw*0.6,biomeLabels[i],{fontSize:'8px',fill:'#777',fontFamily:'Arial'}).setOrigin(0.5);
        });
        this.add.text(w/2,h*0.97,'v3.1 — 10天生存 | 角色選擇 | 真實多人連線',{fontSize:'10px',fill:'#4CAF50',fontFamily:'Arial'}).setOrigin(0.5);
    }
}

// ============================================
// Lobby Scene — 真實 PeerJS 連線
// ============================================
class LobbyScene extends Phaser.Scene {
    constructor(){super('Lobby');}
    create(data){
        this._skinIdx=data?.skinIdx||0;
        this._playerName=data?.playerName||'探險家';
        const w=this.cameras.main.width,h=this.cameras.main.height;
        this.add.rectangle(0,0,w,h,0x0a1a0a).setOrigin(0);
        this.add.text(w/2,h*0.05,'👥 多人連線大廳',{fontSize:'22px',fill:'#42A5F5',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5);

        // Status text
        this.statusTxt=this.add.text(w/2,h*0.11,'',{fontSize:'13px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(0.5);

        // Room code display
        this.codeBg=this.add.rectangle(w/2,h*0.17,w*0.7,44,0x1a1a1a,0.8).setStrokeStyle(2,0x42A5F5);
        this.codeTxt=this.add.text(w/2,h*0.17,'',{fontSize:'18px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

        // Player slots
        this.playerSlots=[];
        const slotW=w*0.8,slotH=48;
        for(let i=0;i<6;i++){
            const sy=h*0.24+i*(slotH+6);
            const bg=this.add.rectangle(w/2,sy,slotW,slotH,0x1a1a1a,0.7).setStrokeStyle(1,0x444444);
            const numTxt=this.add.text(w/2-slotW/2+16,sy,`P${i+1}`,{fontSize:'15px',fill:'#666',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0,0.5);
            const nameTxt=this.add.text(w/2-slotW/2+55,sy,'空位',{fontSize:'14px',fill:'#555',fontFamily:'Arial'}).setOrigin(0,0.5);
            const statusTxt=this.add.text(w/2+slotW/2-16,sy,'',{fontSize:'12px',fill:'#81C784',fontFamily:'Arial'}).setOrigin(1,0.5);
            this.playerSlots.push({bg,numTxt,nameTxt,statusTxt});
        }

        // Action buttons
        const btnW=w*0.38,btnH=44;
        const createBtn=this.add.rectangle(w*0.28,h*0.70,btnW,btnH,0x2E7D32,0.9).setInteractive({useHandCursor:true});
        this.add.text(w*0.28,h*0.70,'🏠 建立房間',{fontSize:'16px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        createBtn.on('pointerdown',()=>this.doCreateRoom());

        const joinBtn=this.add.rectangle(w*0.72,h*0.70,btnW,btnH,0x1565C0,0.9).setInteractive({useHandCursor:true});
        this.add.text(w*0.72,h*0.70,'🔗 加入房間',{fontSize:'16px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
        joinBtn.on('pointerdown',()=>this.doJoinRoom());

        this.startBtn=this.add.rectangle(w/2,h*0.80,w*0.6,50,0x333333,0.5).setStrokeStyle(1,0x555);
        this.startBtnTxt=this.add.text(w/2,h*0.80,'🚀 開始遊戲 (等待連線...)',{fontSize:'18px',fill:'#777',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

        this.add.text(w/2,h*0.88,'← 返回主選單',{fontSize:'14px',fill:'#FF5252',fontFamily:'Arial'}).setOrigin(0.5)
            .setInteractive().on('pointerdown',()=>{AudioMgr.playClick();NetMgr.destroy();this.scene.start('Menu');});

        this.msgTxt=this.add.text(w/2,h*0.93,'',{fontSize:'12px',fill:'#81C784',fontFamily:'Arial'}).setOrigin(0.5);

        // Setup network callbacks
        NetMgr.onPlayerJoin=(id,name)=>{
            this.showMsg(`${name} 加入了!`,'#42A5F5');
            AudioMgr.playEquip();
            this.refreshSlots();
            this.updateStartBtn();
        };
        NetMgr.onPlayerLeave=(id)=>{
            this.showMsg('有玩家離開了','#FF9800');
            this.refreshSlots();
            this.updateStartBtn();
        };
        NetMgr.onPlayerList=(players)=>{
            this._clientPlayers=players;
            this.refreshSlotsClient(players);
        };
        NetMgr.onStartGame=(data)=>{
            // Client receives start signal
            this.scene.start('Game',{multi:true,isHost:false,mapSeed:data.seed,skinIdx:this._skinIdx,playerName:this._playerName});
        };
    }

    async doCreateRoom(){
        this.statusTxt.setText('正在建立房間...').setColor('#FFD54F');
        try{
            NetMgr.playerName=this._playerName;
            const code=await NetMgr.createRoom();
            this.codeTxt.setText(`房間代碼: ${code}`);
            this.codeBg.setStrokeStyle(2,0x4CAF50);
            this.statusTxt.setText('房間已建立! 等待其他玩家加入...').setColor('#81C784');
            this.refreshSlots();
            this.updateStartBtn();
        }catch(e){
            this.statusTxt.setText('建立失敗: '+e.message).setColor('#FF5252');
        }
    }

    async doJoinRoom(){
        const code=prompt('請輸入6位房間代碼:');
        if(!code||code.length!==6){this.showMsg('代碼必須為6位','#FF5252');return;}
        this.statusTxt.setText('正在連線...').setColor('#FFD54F');
        try{
            NetMgr.playerName=this._playerName;
            await NetMgr.joinRoom(code);
            this.codeTxt.setText(`已加入房間: ${code.toUpperCase()}`);
            this.codeBg.setStrokeStyle(2,0x4CAF50);
            this.statusTxt.setText('已連線! 等待房主開始遊戲...').setColor('#81C784');
            // Client can't start game
            this.startBtnTxt.setText('等待房主開始...');
        }catch(e){
            this.statusTxt.setText('加入失敗: '+e.message).setColor('#FF5252');
        }
    }

    refreshSlots(){
        if(!NetMgr.isHost)return;
        const players=NetMgr.getPlayerList();
        for(let i=0;i<6;i++){
            const s=this.playerSlots[i];
            if(i<players.length){
                const p=players[i];
                s.bg.setStrokeStyle(i===0?2:1,i===0?0x4CAF50:0x42A5F5);
                s.numTxt.setColor(i===0?'#4CAF50':'#42A5F5');
                s.nameTxt.setText(p.name).setColor('#fff');
                s.statusTxt.setText('✅ 已連線').setColor('#81C784');
            }else{
                s.bg.setStrokeStyle(1,0x444444);
                s.numTxt.setColor('#666');
                s.nameTxt.setText('空位').setColor('#555');
                s.statusTxt.setText('');
            }
        }
    }

    refreshSlotsClient(players){
        for(let i=0;i<6;i++){
            const s=this.playerSlots[i];
            if(i<players.length){
                const p=players[i];
                s.bg.setStrokeStyle(p.host?2:1,p.host?0x4CAF50:0x42A5F5);
                s.numTxt.setColor(p.host?'#4CAF50':'#42A5F5');
                s.nameTxt.setText(p.name).setColor('#fff');
                s.statusTxt.setText('✅ 已連線').setColor('#81C784');
            }else{
                s.bg.setStrokeStyle(1,0x444444);
                s.numTxt.setColor('#666');
                s.nameTxt.setText('空位').setColor('#555');
                s.statusTxt.setText('');
            }
        }
    }

    updateStartBtn(){
        if(!NetMgr.isHost)return;
        const count=NetMgr.getPlayerCount();
        if(count>=2){
            this.startBtn.setFillStyle(0x2E7D32,0.9).setInteractive({useHandCursor:true});
            this.startBtnTxt.setText(`🚀 開始遊戲 (${count}人)`).setColor('#fff');
            this.startBtn.off('pointerdown').on('pointerdown',()=>{
                AudioMgr.playClick();
                const seed=Date.now();
                NetMgr.sendStartGame({seed});
                this.scene.start('Game',{multi:true,isHost:true,mapSeed:seed,skinIdx:this._skinIdx,playerName:this._playerName});
            });
        }else{
            this.startBtn.setFillStyle(0x333333,0.5).removeInteractive();
            this.startBtnTxt.setText('🚀 開始遊戲 (等待玩家...)').setColor('#777');
        }
    }

    showMsg(t,c){this.msgTxt?.setText(t).setColor(c);this.time.delayedCall(3000,()=>{this.msgTxt?.setText('');});}
}

// ============================================
// Game Scene — v3.0 多人支援
// ============================================
class GameScene extends Phaser.Scene {
    constructor(){super('Game');}
    create(data){
        this.isMulti=data?.multi||false;
        this.isHost=data?.isHost!==false;
        this.mapSeed=data?.mapSeed||Date.now();
        this.skinIdx=data?.skinIdx||0;
        this.myName=data?.playerName||'探險家';

        this.mapData=[];this.resources=[];this.dinos=[];this.campfires=[];this.traps=[];this.arrows=[];
        this.gameTime=0;this.dayPhase=D.DAY_NIGHT.PHASES.DAY;this.dayTimer=0;
        this.kills=0;this.survivalTime=0;this.isMobile=this.sys.game.device.input.touch;
        this._bossWarnCd=0;this.currentDay=1;this.maxDays=10;this.gameWon=false;
        this.moveVec={x:0,y:0};this._pendingAction=null;
        this._removedResIds=[];this._nextResId=0;this._nextDinoId=0;

        // Remote players map
        this.remotePlayers=new Map();

        // Seeded random for deterministic map
        this._seed=this.mapSeed;
        this.generateMap();
        this.createPlayer();

        if(!this.isMulti||this.isHost){
            this.spawnResources();this.spawnDinos();
        }

        this.setupCamera();this.setupInput();
        this.scene.launch('UI',{gameScene:this});
        AudioMgr.startBGM(0);
        this.time.addEvent({delay:D.PLAYER.HUNGER_INTERVAL,callback:this.tickHunger,callbackScope:this,loop:true});
        this.time.addEvent({delay:500,callback:()=>{if(!this.player.sprinting&&this.player.stamina<D.PLAYER.MAX_STAMINA)this.player.stamina=Math.min(D.PLAYER.MAX_STAMINA,this.player.stamina+D.PLAYER.STAMINA_REGEN*2);},loop:true});

        if(!this.isMulti||this.isHost){
            this.time.addEvent({delay:30000,callback:this.respawnResources,callbackScope:this,loop:true});
            this.time.addEvent({delay:45000,callback:this.respawnDinos,callbackScope:this,loop:true});
        }

        if(this.isMulti) this.setupNetwork();
    }

    // ===== Multiplayer Network =====
    setupNetwork(){
        if(this.isHost){
            // Create remote player sprites for each connected client
            NetMgr.connections.forEach((conn,i)=>{
                this.createRemotePlayer(conn.peer,conn.playerName||`玩家${i+2}`,i+1);
            });
            // Handle new connections mid-game
            NetMgr.onPlayerJoin=(id,name)=>{
                const idx=this.remotePlayers.size+1;
                this.createRemotePlayer(id,name,idx);
                // Send init data to new player
                this.sendInitToPlayer(id);
            };
            NetMgr.onPlayerLeave=(id)=>this.removeRemotePlayer(id);
            NetMgr.onPlayerInput=(id,data)=>this.handleRemoteInput(id,data);

            // Send init to all current clients
            this.time.delayedCall(500,()=>{
                NetMgr.connections.forEach(conn=>{
                    this.sendInitToPlayer(conn.peer);
                });
            });

            // Broadcast state at 10fps
            this.time.addEvent({delay:100,callback:()=>this.broadcastState(),loop:true});
        }else{
            // Client mode
            NetMgr.onInitData=(data)=>this.applyInitData(data);
            NetMgr.onStateUpdate=(data)=>this.applyStateUpdate(data);

            // Send input at 20fps
            this.time.addEvent({delay:50,callback:()=>this.sendInputToHost(),loop:true});
        }
    }

    createRemotePlayer(peerId,name,index){
        const cx=MW/2+rnd(-60,60),cy=MH/2+rnd(-60,60);
        let sprite;
        if(this.textures.exists('sprite_player')){
            sprite=this.add.image(cx,cy,'sprite_player').setDepth(10);
            const pScale=(TILE*1.2)/Math.max(sprite.width,sprite.height);
            sprite.setScale(pScale);
        }else{
            sprite=this.add.rectangle(cx,cy,TILE*0.8,TILE*0.8,PLAYER_TINTS[index%6]).setDepth(10);
        }
        if(sprite.setTint)sprite.setTint(PLAYER_TINTS[index%6]);
        this.physics.add.existing(sprite);sprite.body.setCollideWorldBounds(true);
        const shadow=this.add.ellipse(cx,cy+12,20,8,0x000000,0.2).setDepth(9);
        const nameTxt=this.add.text(cx,cy-24,name,{fontSize:'10px',fill:'#42A5F5',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(11);
        const rp={sprite,shadow,nameTxt,peerId,name,index,
            hp:D.PLAYER.MAX_HP,hunger:D.PLAYER.MAX_HUNGER,stamina:D.PLAYER.MAX_STAMINA,
            atk:D.PLAYER.ATTACK_BASE,def:D.PLAYER.DEFENSE_BASE,
            alive:true,facing:{x:0,y:1},inventory:[],equipped:{weapon:null,armor:null}};
        this.remotePlayers.set(peerId,rp);
        return rp;
    }

    removeRemotePlayer(peerId){
        const rp=this.remotePlayers.get(peerId);
        if(rp){
            rp.sprite.destroy();rp.shadow.destroy();rp.nameTxt.destroy();
            this.remotePlayers.delete(peerId);
        }
    }

    sendInitToPlayer(peerId){
        const conn=NetMgr.connections.find(c=>c.peer===peerId);
        if(!conn||!conn.open)return;
        const resData=this.resources.filter(r=>r.active!==false).map(r=>({id:r.resId,x:Math.round(r.x),y:Math.round(r.y),t:r.type}));
        try{
            conn.send({t:'init',map:this.mapData,res:resData,dt:Math.round(this.dayTimer),cd:this.currentDay});
        }catch(e){}
    }

    broadcastState(){
        if(!NetMgr.isHost)return;
        // Build compact player array: host + remotes
        const players=[{id:'host',x:Math.round(this.player.x),y:Math.round(this.player.y),
            hp:Math.round(this.player.hp),hu:Math.round(this.player.hunger),
            fx:this.player.facing.x,fy:this.player.facing.y,a:this.player.alive?1:0,
            n:NetMgr.playerName||'房主'}];
        this.remotePlayers.forEach((rp,id)=>{
            players.push({id,x:Math.round(rp.sprite.x),y:Math.round(rp.sprite.y),
                hp:Math.round(rp.hp),hu:Math.round(rp.hunger),
                fx:rp.facing.x,fy:rp.facing.y,a:rp.alive?1:0,n:rp.name});
        });
        // Build compact dino array
        const dinos=this.dinos.filter(d=>d.alive).map(d=>({
            id:d.dinoId,x:Math.round(d.x),y:Math.round(d.y),
            hp:d.hp,mhp:d.maxHp,k:d.key,al:Math.round(d.alpha*10)/10,st:d.state
        }));

        const state={t:'s',p:players,d:dinos,rm:this._removedResIds,
            dt:Math.round(this.dayTimer),dp:this.dayPhase,k:this.kills,cd:this.currentDay};
        NetMgr.broadcast(state);
        this._removedResIds=[];
    }

    handleRemoteInput(peerId,data){
        if(!data)return;
        const rp=this.remotePlayers.get(peerId);
        if(!rp)return;
        // Update position
        if(data.x!==undefined){
            rp.sprite.x=data.x;rp.sprite.y=data.y;
            rp.shadow.setPosition(data.x,data.y+12);
            rp.nameTxt.setPosition(data.x,data.y-24);
        }
        if(data.fx!==undefined)rp.facing={x:data.fx,y:data.fy};
        if(rp.sprite.setFlipX)rp.sprite.setFlipX(rp.facing.x<0);

        // Process actions
        if(data.act==='attack')this.remoteAttack(rp);
        else if(data.act==='gather')this.remoteGather(rp);
    }

    remoteAttack(rp){
        AudioMgr.playAttack();
        const range=50,fx=rp.facing;
        const ax=rp.sprite.x+fx.x*20,ay=rp.sprite.y+fx.y*20;
        const slash=this.add.arc(ax,ay,range/2,0,180,false,0xFFFFFF,0.5).setDepth(20);
        this.tweens.add({targets:slash,alpha:0,scale:1.5,duration:200,onComplete:()=>slash.destroy()});
        this.dinos.forEach(dino=>{if(!dino.alive)return;if(dist({x:ax,y:ay},dino)<range){
            const dmg=Math.max(1,rp.atk-(dino.dinoData.def||0)/2);this.damageDino(dino,dmg);
            if(dino.dinoData.passive&&dino.state==='patrol')dino.state='chase';
        }});
    }

    remoteGather(rp){
        let closest=null,minD=55;
        this.resources.forEach(r=>{const d=dist(r,rp.sprite);if(d<minD){minD=d;closest=r;}});
        if(closest){
            this._removedResIds.push(closest.resId);
            AudioMgr.playGather();
            for(let i=0;i<3;i++){const p=this.add.circle(closest.x+rnd(-5,5),closest.y+rnd(-5,5),2,0x81C784,0.7).setDepth(20);this.tweens.add({targets:p,y:p.y-20,alpha:0,duration:400,onComplete:()=>p.destroy()});}
            closest.destroy();this.resources=this.resources.filter(r=>r!==closest);
        }
    }

    sendInputToHost(){
        if(!this.player?.alive)return;
        const data={
            x:Math.round(this.player.x),y:Math.round(this.player.y),
            fx:this.player.facing.x,fy:this.player.facing.y
        };
        if(this._pendingAction){data.act=this._pendingAction;this._pendingAction=null;}
        NetMgr.sendToHost(data);
    }

    applyInitData(data){
        if(!data)return;
        // Apply map if provided
        if(data.map)this.mapData=data.map;
        // Create resources from host data
        if(data.res){
            // Clear existing
            this.resources.forEach(r=>r.destroy());this.resources=[];
            data.res.forEach(r=>{ this.createResource(r.t,r.x,r.y,r.id); });
        }
        if(data.dt!==undefined)this.dayTimer=data.dt;
        if(data.cd!==undefined)this.currentDay=data.cd;
    }

    applyStateUpdate(data){
        if(!data)return;
        // Update day timer
        if(data.dt!==undefined)this.dayTimer=data.dt;
        if(data.dp!==undefined)this.dayPhase=data.dp;
        if(data.k!==undefined)this.kills=data.k;
        if(data.cd!==undefined)this.currentDay=data.cd;

        // Update/create remote player sprites
        if(data.p){
            data.p.forEach(pd=>{
                if(pd.id==='host'||pd.id===NetMgr.myId){
                    // This is us (client) or the host — for client, update host sprite
                    if(pd.id!=='host'||!this.isHost){
                        // Update/create host player sprite on client
                        if(!this.remotePlayers.has(pd.id)){
                            if(pd.id!==NetMgr.myId){
                                this.createRemotePlayer(pd.id,pd.n||'房主',0);
                            }
                        }
                        const rp=this.remotePlayers.get(pd.id);
                        if(rp){
                            rp.sprite.x=pd.x;rp.sprite.y=pd.y;
                            rp.shadow.setPosition(pd.x,pd.y+12);
                            rp.nameTxt.setPosition(pd.x,pd.y-24);
                            if(rp.sprite.setFlipX)rp.sprite.setFlipX(pd.fx<0);
                        }
                    }
                }else if(pd.id!==NetMgr.myId){
                    // Other remote player
                    if(!this.remotePlayers.has(pd.id)){
                        this.createRemotePlayer(pd.id,pd.n||'玩家',this.remotePlayers.size+1);
                    }
                    const rp=this.remotePlayers.get(pd.id);
                    if(rp){
                        rp.sprite.x=pd.x;rp.sprite.y=pd.y;
                        rp.shadow.setPosition(pd.x,pd.y+12);
                        rp.nameTxt.setPosition(pd.x,pd.y-24);
                        if(rp.sprite.setFlipX)rp.sprite.setFlipX(pd.fx<0);
                    }
                }
            });
        }

        // Update dinos on client
        if(data.d&&!this.isHost){
            const existingIds=new Set();
            data.d.forEach(dd=>{
                existingIds.add(dd.id);
                let dino=this.dinos.find(d=>d.dinoId===dd.id);
                if(!dino){
                    // Create new dino sprite
                    dino=this._createClientDino(dd);
                }
                if(dino){
                    dino.x=dd.x;dino.y=dd.y;dino.hp=dd.hp;dino.maxHp=dd.mhp;
                    dino.setAlpha(dd.al);
                    if(dino.body)dino.body.enable=dd.al>0;
                    if(dino.hpBg){dino.hpBg.setPosition(dd.x,dd.y-20).setAlpha(dd.al);}
                    if(dino.hpBar){dino.hpBar.setPosition(dd.x-dino.hpBarW/2,dd.y-20);dino.hpBar.width=dino.hpBarW*(dd.hp/dd.mhp);dino.hpBar.setAlpha(dd.al);}
                    if(dino.nameTxt)dino.nameTxt.setPosition(dd.x,dd.y-30).setAlpha(dd.al);
                    if(dino.shadow)dino.shadow.setPosition(dd.x,dd.y+15).setAlpha(dd.al>0?0.15:0);
                }
            });
            // Remove dinos not in state
            this.dinos=this.dinos.filter(d=>{
                if(!existingIds.has(d.dinoId)){
                    d.destroy();if(d.hpBg)d.hpBg.destroy();if(d.hpBar)d.hpBar.destroy();
                    if(d.nameTxt)d.nameTxt.destroy();if(d.shadow)d.shadow.destroy();
                    return false;
                }return true;
            });
        }

        // Remove gathered resources
        if(data.rm&&data.rm.length>0){
            data.rm.forEach(rid=>{
                const idx=this.resources.findIndex(r=>r.resId===rid);
                if(idx>=0){this.resources[idx].destroy();this.resources.splice(idx,1);}
            });
        }
    }

    _createClientDino(dd){
        const dinoData=D.DINOS[dd.k];
        if(!dinoData)return null;
        const sk=DINO_SPRITE_KEYS[dd.k];let dino;
        if(sk&&this.textures.exists(sk)){
            dino=this.add.image(dd.x,dd.y,sk).setDepth(5);
            const s=(dinoData.size*1.5)/Math.max(dino.width,dino.height);dino.setScale(s);
        }else{
            dino=this.add.circle(dd.x,dd.y,dinoData.size/2,dinoData.color).setDepth(5);
        }
        this.physics.add.existing(dino,true);
        dino.dinoId=dd.id;dino.key=dd.k;dino.hp=dd.hp;dino.maxHp=dd.mhp;dino.alive=true;
        dino.dinoData=dinoData;
        const shadow=this.add.ellipse(dd.x,dd.y+15,dinoData.size*0.8,dinoData.size*0.25,0x000000,0.15).setDepth(4);
        const barW=dinoData.boss?50:30,barH=dinoData.boss?6:4;
        dino.hpBg=this.add.rectangle(dd.x,dd.y-20,barW,barH,0x333333).setDepth(6);
        dino.hpBar=this.add.rectangle(dd.x-barW/2,dd.y-20,barW,barH,dinoData.boss?0xFF6D00:0xFF1744).setDepth(7).setOrigin(0,0.5);
        dino.hpBarW=barW;
        dino.nameTxt=this.add.text(dd.x,dd.y-30,(dinoData.boss?'👑 ':'')+dinoData.name,{fontSize:dinoData.boss?'13px':'10px',fill:dinoData.boss?'#FFD54F':'#fff',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7);
        dino.shadow=shadow;
        this.dinos.push(dino);return dino;
    }

    // ===== Day/Night =====
    get dayCycleLength(){const{DAY_DURATION,DUSK_DURATION,NIGHT_DURATION}=D.DAY_NIGHT;return DAY_DURATION+DUSK_DURATION+NIGHT_DURATION;}
    get dayProgress(){return this.dayTimer%this.dayCycleLength;}
    get phaseTimeLeft(){
        const{DAY_DURATION,DUSK_DURATION,NIGHT_DURATION}=D.DAY_NIGHT;const t=this.dayProgress;
        if(t<DAY_DURATION)return{phase:'day',left:DAY_DURATION-t,total:DAY_DURATION};
        if(t<DAY_DURATION+DUSK_DURATION)return{phase:'dusk',left:DAY_DURATION+DUSK_DURATION-t,total:DUSK_DURATION};
        return{phase:'night',left:this.dayCycleLength-t,total:NIGHT_DURATION};
    }
    get difficultyMult(){return 1+(this.currentDay-1)*0.2;}

    // ===== Map =====
    generateMap(){
        const W=D.MAP.WIDTH,H=D.MAP.HEIGHT,cx=W/2,cy=H/2;
        // Use seed for deterministic map
        let s=this._seed;
        const sRnd=()=>{s=(s*16807+0)%2147483647;return(s&0x7fffffff)/2147483647;};
        for(let y=0;y<H;y++){this.mapData[y]=[];for(let x=0;x<W;x++){
            const d=Math.hypot(x-cx,y-cy);let b;
            if(d<5)b=0;else if(d<20)b=1;else if(d<32)b=2;else if(d<38)b=3;else b=4;
            if(b>0&&b<4&&sRnd()<0.1)b=clamp(b+(sRnd()>0.5?1:-1),1,4);
            this.mapData[y][x]=b;
        }}
        this.renderMap();
    }
    renderMap(){
        const tileKeys={0:'tile_camp',1:'tile_grass',2:'tile_forest',3:'tile_swamp',4:'tile_volcano'};
        const transKeys={'1_2':'tile_grass_forest','2_1':'tile_grass_forest','1_3':'tile_grass_swamp','3_1':'tile_grass_swamp','2_3':'tile_forest_swamp','3_2':'tile_forest_swamp','3_4':'tile_swamp_volcano','4_3':'tile_swamp_volcano'};
        this.groundRT=this.add.renderTexture(0,0,MW,MH).setOrigin(0).setDepth(0);
        for(let y=0;y<D.MAP.HEIGHT;y+=2)for(let x=0;x<D.MAP.WIDTH;x+=2){const b=this.mapData[y]?.[x]??1,key=tileKeys[b];if(key&&this.textures.exists(key))this.groundRT.draw(key,x*TILE,y*TILE);}
        for(let y=0;y<D.MAP.HEIGHT;y+=2)for(let x=0;x<D.MAP.WIDTH;x+=2){const b=this.mapData[y]?.[x];if(b===undefined)continue;for(const[ox,oy]of[[2,0],[-2,0],[0,2],[0,-2]]){const nb=this.mapData[y+oy]?.[x+ox];if(nb!==undefined&&nb!==b){const tkey=transKeys[`${b}_${nb}`];if(tkey&&this.textures.exists(tkey)){this.groundRT.draw(tkey,x*TILE,y*TILE);break;}}}}
        const campCx=MW/2,campCy=MH/2;
        const gfx=this.add.graphics().setDepth(2);gfx.lineStyle(2,0xFFD54F,0.5);gfx.strokeCircle(campCx,campCy,5*TILE);
        for(let a=0;a<360;a+=10){const rad=a*Math.PI/180;gfx.fillStyle(0xFFD54F,0.15);gfx.fillCircle(campCx+Math.cos(rad)*5*TILE,campCy+Math.sin(rad)*5*TILE,3);}
        if(this.textures.exists('sprite_campfire')){const cf=this.add.image(campCx,campCy,'sprite_campfire').setDepth(3).setDisplaySize(TILE*2,TILE*2);this.tweens.add({targets:cf,scaleX:cf.scaleX*1.1,scaleY:cf.scaleY*1.1,yoyo:true,repeat:-1,duration:500});}
        this.physics.world.setBounds(0,0,MW,MH);
    }

    // ===== Player =====
    createPlayer(){
        const cx=MW/2,cy=MH/2;
        const skinKey='sprite_player_'+this.skinIdx;
        const useKey=this.textures.exists(skinKey)?skinKey:(this.textures.exists('sprite_player')?'sprite_player':null);
        this.player=useKey?this.add.image(cx,cy,useKey).setDepth(10):this.add.rectangle(cx,cy,TILE*0.8,TILE*0.8,0x8D6E63).setDepth(10);
        const pScale=(TILE*1.2)/Math.max(this.player.width,this.player.height);this.player.setScale(pScale);
        this.physics.add.existing(this.player);this.player.body.setCollideWorldBounds(true);
        const bs=TILE*0.6;this.player.body.setSize(bs,bs);this.player.body.setOffset((this.player.width-bs)/2,(this.player.height-bs)/2);
        this.playerShadow=this.add.ellipse(cx,cy+12,20,8,0x000000,0.2).setDepth(9);
        this.torchLight=this.add.circle(cx,cy,80,0xFF8F00,0).setDepth(1);
        Object.assign(this.player,{hp:D.PLAYER.MAX_HP,maxHp:D.PLAYER.MAX_HP,hunger:D.PLAYER.MAX_HUNGER,maxHunger:D.PLAYER.MAX_HUNGER,
            stamina:D.PLAYER.MAX_STAMINA,maxStamina:D.PLAYER.MAX_STAMINA,atk:D.PLAYER.ATTACK_BASE,def:D.PLAYER.DEFENSE_BASE,
            speed:D.PLAYER.SPEED,sprinting:false,inventory:[],equipped:{weapon:null,armor:null},
            facing:{x:0,y:1},alive:true,baseScale:pScale,invincible:false,poisoned:false,poisonTimer:null,lightRadius:0,torchActive:false});
        this.addItem('wood',5);this.addItem('stone',3);this.addItem('herb',3);this.addItem('fruit',5);
        // Player name above character
        this.playerNameTxt=this.add.text(cx,cy-22,this.myName,{fontSize:'11px',fill:'#A8D08D',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(11);
    }

    // ===== Resources =====
    spawnResources(){for(let y=0;y<D.MAP.HEIGHT;y++)for(let x=0;x<D.MAP.WIDTH;x++){const b=this.mapData[y][x];if(b===0)continue;for(const[key,res]of Object.entries(D.RESOURCES))if(res.biomes.includes(b)&&Math.random()<res.rate)this.createResource(key,x*TILE+TILE/2,y*TILE+TILE/2);}}
    createResource(type,x,y,id){
        let sk=RES_SPRITES[type];if(type==='wood'&&Math.random()<0.4&&this.textures.exists('sprite_wood2'))sk='sprite_wood2';
        let r;if(sk&&this.textures.exists(sk)){r=this.add.image(x,y,sk).setDepth(3);r.setScale((type==='wood'?TILE*1.4:TILE*1.0)/Math.max(r.width,r.height));}
        else{const c={wood:0x8D6E63,stone:0x9E9E9E,herb:0x4CAF50,iron:0xB0BEC5,fruit:0xE91E63};r=this.add.circle(x,y,7,c[type]||0xFFFFFF).setDepth(3);}
        this.physics.add.existing(r,true);r.type=type;r.resId=id!==undefined?id:this._nextResId++;
        this.tweens.add({targets:r,y:y-2,yoyo:true,repeat:-1,duration:1500+Math.random()*1000,ease:'Sine.easeInOut'});
        this.resources.push(r);return r;
    }
    respawnResources(){if(this.resources.length<400)for(let i=0;i<20;i++){const x=rndInt(5,D.MAP.WIDTH-5),y=rndInt(5,D.MAP.HEIGHT-5),b=this.mapData[y][x];if(b===0)continue;for(const[key,res]of Object.entries(D.RESOURCES))if(res.biomes.includes(b)&&Math.random()<0.3){this.createResource(key,x*TILE+TILE/2,y*TILE+TILE/2);break;}}}

    // ===== Dinosaurs =====
    spawnDinos(){for(const[key,data]of Object.entries(D.DINOS)){const count=data.boss?1:(data.pack||1)*3;for(let i=0;i<count;i++)this.createDino(key,data);}}
    createDino(key,data){
        let x,y,att=0;
        do{x=rndInt(3,D.MAP.WIDTH-3);y=rndInt(3,D.MAP.HEIGHT-3);att++;}while((!data.biomes.includes(this.mapData[y]?.[x])||this.mapData[y][x]===0)&&att<50);
        if(att>=50)return null;
        const px=x*TILE+TILE/2,py=y*TILE+TILE/2,sk=DINO_SPRITE_KEYS[key];let dino;
        if(sk&&this.textures.exists(sk)){dino=this.add.image(px,py,sk).setDepth(5);const s=(data.size*1.5)/Math.max(dino.width,dino.height);dino.setScale(s);dino.baseScale=s;}
        else{dino=this.add.circle(px,py,data.size/2,data.color).setDepth(5);dino.baseScale=1;}
        this.physics.add.existing(dino);dino.body.setCollideWorldBounds(true);
        const br=data.size*0.5;if(dino.type==='Image'){dino.body.setSize(br*2,br*2);dino.body.setOffset((dino.width-br*2)/2,(dino.height-br*2)/2);}else dino.body.setCircle(data.size/2);
        const shadow=this.add.ellipse(px,py+data.size*0.4,data.size*0.8,data.size*0.25,0x000000,0.15).setDepth(4);
        const dm=this.difficultyMult;
        const dinoId=this._nextDinoId++;
        Object.assign(dino,{key,dinoId,dinoData:{...data,hp:Math.floor(data.hp*dm),atk:Math.floor(data.atk*dm)},hp:Math.floor(data.hp*dm),maxHp:Math.floor(data.hp*dm),
            state:'patrol',patrolTarget:{x:px+rnd(-100,100),y:py+rnd(-100,100)},homeX:px,homeY:py,attackCd:0,alive:true,shadow,bossWarned:false});
        const barW=data.boss?50:30,barH=data.boss?6:4;
        dino.hpBg=this.add.rectangle(px,py-data.size-4,barW,barH,0x333333).setDepth(6);
        dino.hpBar=this.add.rectangle(px-barW/2,py-data.size-4,barW,barH,data.boss?0xFF6D00:0xFF1744).setDepth(7).setOrigin(0,0.5);
        dino.hpBarW=barW;
        dino.nameTxt=this.add.text(px,py-data.size-14,(data.boss?'👑 ':'')+data.name,{fontSize:data.boss?'13px':'10px',fill:data.boss?'#FFD54F':'#fff',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7);
        if(dino.type==='Image')this.tweens.add({targets:dino,scaleY:dino.scaleY*1.03,yoyo:true,repeat:-1,duration:800+Math.random()*400,ease:'Sine.easeInOut'});
        this.dinos.push(dino);return dino;
    }
    respawnDinos(){
        const alive=this.dinos.filter(d=>d.alive).length;
        const isNight=this.dayPhase===D.DAY_NIGHT.PHASES.NIGHT;
        const targetCount=15+this.currentDay*3+(isNight?10:0);
        if(alive<targetCount){
            const spawnCount=isNight?5+this.currentDay:3;
            const keys=Object.keys(D.DINOS);
            for(let i=0;i<spawnCount;i++){const key=pick(keys),data=D.DINOS[key];if(data.nightOnly&&!isNight)continue;this.createDino(key,data);}
        }
    }

    // ===== Camera =====
    setupCamera(){
        this.cameras.main.setBounds(0,0,MW,MH);this.cameras.main.startFollow(this.player,true,0.1,0.1);this.cameras.main.setZoom(1.8);
        this.overlay=this.add.rectangle(0,0,2000,2000,0x000033,0).setDepth(50).setScrollFactor(0);
        this.overlay.setPosition(this.cameras.main.width/2,this.cameras.main.height/2);
    }

    // ===== Input =====
    setupInput(){
        this.keys=this.input.keyboard?.addKeys({w:'W',a:'A',s:'S',d:'D',space:'SPACE',e:'E',i:'I',c:'C',f:'F',shift:'SHIFT',esc:'ESC'});
    }

    // ===== Inventory =====
    addItem(id,qty=1){const def=D.ITEMS[id];if(!def)return false;const inv=this.player.inventory;const ex=inv.find(s=>s.id===id&&s.qty<def.stack);if(ex){const a=Math.min(qty,def.stack-ex.qty);ex.qty+=a;if(qty-a>0)return this.addItem(id,qty-a);return true;}if(inv.length>=D.PLAYER.INV_SIZE)return false;inv.push({id,qty:Math.min(qty,def.stack)});return true;}
    removeItem(id,qty=1){const inv=this.player.inventory;let rem=qty;for(let i=inv.length-1;i>=0;i--){if(inv[i].id===id){const t=Math.min(rem,inv[i].qty);inv[i].qty-=t;rem-=t;if(inv[i].qty<=0)inv.splice(i,1);if(rem<=0)return true;}}return rem<=0;}
    countItem(id){return this.player.inventory.reduce((s,sl)=>sl.id===id?s+sl.qty:s,0);}
    hasItems(mats){return Object.entries(mats).every(([id,qty])=>this.countItem(id)>=qty);}
    findItemSlot(id){return this.player.inventory.findIndex(s=>s.id===id);}

    useItem(slot){
        const item=this.player.inventory[slot];if(!item)return;
        const def=D.ITEMS[item.id];
        if(def.type==='food'){
            if(def.hunger)this.player.hunger=Math.min(this.player.maxHunger,this.player.hunger+def.hunger);
            if(def.hp)this.player.hp=Math.min(this.player.maxHp,this.player.hp+def.hp);
            if(def.cleanse&&this.player.poisoned){this.player.poisoned=false;if(this.player.poisonTimer)this.player.poisonTimer.remove();}
            this.showFloatingText(this.player.x,this.player.y-20,def.hunger?`+${def.hunger} 飽食`:`+${def.hp} HP`,'#4CAF50');
            AudioMgr.playEat();item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
        }else if(def.type==='weapon'){
            this.player.equipped.weapon=item.id;this.player.atk=D.PLAYER.ATTACK_BASE+(def.atk||0);
            this.showFloatingText(this.player.x,this.player.y-20,`裝備 ${def.name}`,'#FFC107');AudioMgr.playEquip();
        }else if(def.type==='armor'){
            this.player.equipped.armor=item.id;this.player.def=D.PLAYER.DEFENSE_BASE+(def.def||0);
            this.showFloatingText(this.player.x,this.player.y-20,`裝備 ${def.name}`,'#2196F3');AudioMgr.playEquip();
        }else if(def.type==='tool'||def.type==='placeable'){
            this.usePlaceable(item,def,slot);
        }
    }

    // ===== Placeables =====
    usePlaceable(item,def,slot){
        const px=this.player.x,py=this.player.y;
        if(item.id==='torch'){
            this.player.torchActive=true;this.player.lightRadius=def.light;
            this.torchLight.setAlpha(0.08).setRadius(def.light/2);
            item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
            const torch=this.textures.exists('sprite_torch')?this.add.image(px+rnd(-10,10),py+rnd(-10,10),'sprite_torch').setDepth(4).setDisplaySize(TILE,TILE*1.2):this.add.circle(px,py,5,0xFF6D00).setDepth(4);
            const tGlow=this.add.circle(torch.x,torch.y,def.light/4,0xFF8F00,0.06).setDepth(3);
            this.tweens.add({targets:tGlow,alpha:0.1,yoyo:true,repeat:-1,duration:500});
            this.tweens.add({targets:torch,scaleX:(torch.scaleX||1)*1.05,scaleY:(torch.scaleY||1)*1.05,yoyo:true,repeat:-1,duration:300});
            this.showFloatingText(px,py-20,'放置火把🔥','#FF9800');AudioMgr.playPlace();
            this.time.delayedCall(def.duration*1000,()=>{this.player.torchActive=false;this.player.lightRadius=0;this.torchLight.setAlpha(0);torch.destroy();tGlow.destroy();this.showFloatingText(this.player.x,this.player.y-20,'火把熄滅','#9E9E9E');});
        }else if(item.id==='campfire'){
            let cf;
            if(this.textures.exists('sprite_campfire')){cf=this.add.image(px,py,'sprite_campfire').setDepth(4).setDisplaySize(TILE*1.5,TILE*1.5);this.tweens.add({targets:cf,scaleX:cf.scaleX*1.1,scaleY:cf.scaleY*1.1,yoyo:true,repeat:-1,duration:400});}
            else cf=this.add.circle(px,py,10,0xFF6D00).setDepth(4);
            const glow=this.add.circle(px,py,def.light/3,0xFF8F00,0.08).setDepth(3);this.tweens.add({targets:glow,alpha:0.12,yoyo:true,repeat:-1,duration:600});
            this.physics.add.existing(cf,true);cf.light=def.light;cf.glow=glow;this.campfires.push(cf);
            item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(px,py-20,'放置營火🔥','#FF6D00');AudioMgr.playPlace();
        }else if(item.id==='trap'){
            let trap;
            if(this.textures.exists('sprite_trap')){trap=this.add.image(px,py,'sprite_trap').setDepth(2).setDisplaySize(TILE*0.8,TILE*0.8).setAlpha(0.85);}
            else trap=this.add.circle(px,py,8,0x795548,0.6).setDepth(2);
            this.physics.add.existing(trap,true);trap.dmg=def.dmg;trap.active=true;this.traps.push(trap);
            item.qty--;if(item.qty<=0)this.player.inventory.splice(slot,1);
            this.showFloatingText(px,py-20,'放置陷阱⚠️','#795548');AudioMgr.playPlace();
        }
    }

    // ===== Crafting =====
    canCraft(recipe){if(!this.hasItems(recipe.mats))return false;if(recipe.needFire){const nf=this.campfires.some(cf=>dist(cf,this.player)<150);if(!nf&&!this.isInCamp(this.player.x,this.player.y))return false;}return true;}
    craft(recipe){if(!this.canCraft(recipe))return false;for(const[id,qty]of Object.entries(recipe.mats))this.removeItem(id,qty);this.addItem(recipe.result,recipe.qty);this.showFloatingText(this.player.x,this.player.y-20,`合成 ${D.ITEMS[recipe.result].name} x${recipe.qty}`,'#FFC107');AudioMgr.playCraft();return true;}

    // ===== Combat =====
    playerAttack(){
        if(!this.player.alive)return;
        if(this.isMulti&&!this.isHost){this._pendingAction='attack';return;}
        const weapon=this.player.equipped.weapon;
        const wDef=weapon?D.ITEMS[weapon]:null;
        if(wDef&&wDef.ranged){this.shootArrow();return;}
        AudioMgr.playAttack();
        const range=50+(wDef?.range||1)*10;
        const fx=this.player.facing,ax=this.player.x+fx.x*20,ay=this.player.y+fx.y*20;
        const slash=this.add.arc(ax,ay,range/2,0,180,false,0xFFFFFF,0.5).setDepth(20);
        slash.setAngle(Math.atan2(fx.y,fx.x)*180/Math.PI-90);
        this.tweens.add({targets:slash,alpha:0,scale:1.5,duration:200,onComplete:()=>slash.destroy()});
        this.dinos.forEach(dino=>{if(!dino.alive)return;if(dist({x:ax,y:ay},dino)<range){
            const dmg=Math.max(1,this.player.atk-dino.dinoData.def/2);this.damageDino(dino,dmg);
            if(dino.dinoData.passive&&dino.state==='patrol')dino.state='chase';
            if(dino.dinoData.reflect)this.damagePlayer(Math.floor(dmg*dino.dinoData.reflect),'反傷');
        }});
    }

    shootArrow(){
        AudioMgr.playAttack();
        const p=this.player,fx=p.facing;
        let arrow;
        if(this.textures.exists('sprite_arrow')){
            arrow=this.add.image(p.x,p.y,'sprite_arrow').setDepth(15);
            arrow.setAngle(Math.atan2(fx.y,fx.x)*180/Math.PI);arrow.setScale(1.5);
        }else{arrow=this.add.rectangle(p.x,p.y,12,3,0x8D6E63).setDepth(15);arrow.setAngle(Math.atan2(fx.y,fx.x)*180/Math.PI);}
        this.physics.add.existing(arrow);arrow.body.setVelocity(fx.x*400,fx.y*400);
        arrow.dmg=this.player.atk;arrow.life=1500;this.arrows.push(arrow);
        this.time.addEvent({delay:50,repeat:8,callback:()=>{if(!arrow.active)return;const t=this.add.circle(arrow.x,arrow.y,1.5,0xFFFFFF,0.4).setDepth(14);this.tweens.add({targets:t,alpha:0,scale:0,duration:200,onComplete:()=>t.destroy()});}});
    }

    updateArrows(delta){
        for(let i=this.arrows.length-1;i>=0;i--){
            const arrow=this.arrows[i];
            if(!arrow.active){this.arrows.splice(i,1);continue;}
            arrow.life-=delta;if(arrow.life<=0){arrow.destroy();this.arrows.splice(i,1);continue;}
            let hit=false;
            this.dinos.forEach(dino=>{if(!dino.alive||hit)return;if(dist(arrow,dino)<(dino.dinoData?.size||20)){
                const dmg=Math.max(1,arrow.dmg-(dino.dinoData?.def||0)/2);this.damageDino(dino,dmg);
                if(dino.dinoData?.passive&&dino.state==='patrol')dino.state='chase';hit=true;}});
            if(hit){arrow.destroy();this.arrows.splice(i,1);}
        }
    }

    damageDino(dino,dmg){
        dino.hp-=dmg;this.showFloatingText(dino.x,dino.y-20,`-${Math.floor(dmg)}`,'#FF5252');AudioMgr.playHit();
        if(dino.setTint){dino.setTint(0xFF0000);this.time.delayedCall(120,()=>{if(dino.alive&&dino.clearTint)dino.clearTint();});}
        const dx=dino.x-this.player.x,dy=dino.y-this.player.y,len=Math.hypot(dx,dy)||1;dino.x+=(dx/len)*3;dino.y+=(dy/len)*3;
        if(dino.dinoData?.flee)dino.state='flee';else if(dino.state==='patrol')dino.state='chase';
        if(dino.hp<=0)this.killDino(dino);
    }
    killDino(dino){
        dino.alive=false;dino.state='dead';this.kills++;
        if(dino.dinoData?.drops)dino.dinoData.drops.forEach(([id,qty])=>{if(Math.random()<0.8)this.addItem(id,qty);});
        this.showFloatingText(dino.x,dino.y-30,`+${dino.dinoData?.xp||0} XP`,'#FFD54F');AudioMgr.playDinoDeath();
        for(let i=0;i<6;i++){const p=this.add.circle(dino.x+rnd(-10,10),dino.y+rnd(-10,10),3,0xFFFFFF,0.6).setDepth(20);this.tweens.add({targets:p,x:p.x+rnd(-30,30),y:p.y+rnd(-30,30),alpha:0,scale:0,duration:400,onComplete:()=>p.destroy()});}
        this.tweens.add({targets:[dino,dino.hpBg,dino.hpBar,dino.nameTxt,dino.shadow].filter(Boolean),alpha:0,duration:500,onComplete:()=>{dino.destroy();if(dino.hpBg)dino.hpBg.destroy();if(dino.hpBar)dino.hpBar.destroy();if(dino.nameTxt)dino.nameTxt.destroy();if(dino.shadow)dino.shadow.destroy();}});
        this.dinos=this.dinos.filter(d=>d!==dino);
    }
    damagePlayer(dmg,label=''){
        if(this.player.invincible||!this.player.alive)return;
        const actual=Math.max(1,dmg-this.player.def/2);this.player.hp-=actual;
        this.showFloatingText(this.player.x,this.player.y-25,`-${Math.floor(actual)}${label?' '+label:''}`,'#FF1744');AudioMgr.playHit();
        if(this.player.setTint)this.player.setTint(0xFF0000);this.player.invincible=true;
        this.time.delayedCall(400,()=>{if(this.player.alive){if(this.player.clearTint)this.player.clearTint();this.player.invincible=false;}});
        this.cameras.main.shake(100,0.005);if(this.player.hp<=0)this.playerDeath();
    }
    playerDeath(){
        this.player.alive=false;if(this.player.setTint)this.player.setTint(0x555555);
        this.player.body.setVelocity(0,0);this.showFloatingText(this.player.x,this.player.y-40,'你倒下了...','#FF1744');AudioMgr.playPlayerDeath();
        const inv=this.player.inventory;for(let i=inv.length-1;i>=0;i--){if(D.ITEMS[inv[i].id]?.type==='resource'){const drop=Math.ceil(inv[i].qty*0.3);inv[i].qty-=drop;if(inv[i].qty<=0)inv.splice(i,1);}}
        this.time.delayedCall(3000,()=>{this.player.x=MW/2;this.player.y=MH/2;this.player.hp=D.PLAYER.MAX_HP/2;this.player.hunger=D.PLAYER.MAX_HUNGER/2;this.player.stamina=D.PLAYER.MAX_STAMINA;this.player.alive=true;if(this.player.clearTint)this.player.clearTint();this.showFloatingText(MW/2,MH/2-30,'在營地重生','#4CAF50');});
    }

    // ===== Gather =====
    gather(){
        if(!this.player.alive)return;
        if(this.isMulti&&!this.isHost){this._pendingAction='gather';return;}
        let closest=null,minD=45;
        this.resources.forEach(r=>{const d=dist(r,this.player);if(d<minD){minD=d;closest=r;}});
        if(closest){if(this.addItem(closest.type,1)){
            this.showFloatingText(closest.x,closest.y-10,`+1 ${D.RESOURCES[closest.type].name}`,'#81C784');AudioMgr.playGather();
            if(this.isMulti)this._removedResIds.push(closest.resId);
            for(let i=0;i<4;i++){const p=this.add.circle(closest.x+rnd(-5,5),closest.y+rnd(-5,5),2,0x81C784,0.7).setDepth(20);this.tweens.add({targets:p,y:p.y-20,alpha:0,duration:400,onComplete:()=>p.destroy()});}
            closest.destroy();this.resources=this.resources.filter(r=>r!==closest);
        }else this.showFloatingText(this.player.x,this.player.y-20,'背包已滿!','#FF5252');}
    }

    // Smart action: auto-detect attack or gather
    smartAction(){
        if(!this.player.alive)return;
        let nearRes=false,minD=50;
        this.resources.forEach(r=>{if(dist(r,this.player)<minD)nearRes=true;});
        if(nearRes)this.gather();
        else this.playerAttack();
    }

    // ===== Systems =====
    tickHunger(){if(!this.player.alive)return;const rate=this.player.sprinting?D.PLAYER.HUNGER_DECAY*2:D.PLAYER.HUNGER_DECAY;this.player.hunger=Math.max(0,this.player.hunger-rate);if(this.player.hunger<=0)this.damagePlayer(D.PLAYER.HUNGER_DAMAGE,'飢餓');}
    isInCamp(x,y){return dist({x,y},{x:MW/2,y:MH/2})<5*TILE;}
    getDayPhaseStr(){return ['☀️ 白天','🌅 黃昏','🌙 黑夜'][this.dayPhase];}
    getBiomeName(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return ['營地','草原','森林','沼澤','火山','洞穴'][this.mapData[ty]?.[tx]]||'未知';}
    showFloatingText(x,y,text,color='#fff'){const txt=this.add.text(x,y,text,{fontSize:'12px',fill:color,fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(100);this.tweens.add({targets:txt,y:y-30,alpha:0,duration:1200,onComplete:()=>txt.destroy()});}

    // ===== Main Update =====
    update(time,delta){
        if(this.gameWon)return;
        if(!this.player.alive)return;
        this.gameTime+=delta;this.survivalTime+=delta;

        if(!this.isMulti||this.isHost){
            this.updateDayNight(delta);
            this.updateDinoAI(delta);
        }else{
            // Client: just update visual overlay from received dayPhase
            this.updateDayVisuals();
        }

        this.updatePlayerMovement();
        this.updateArrows(delta);

        if(!this.isMulti||this.isHost){
            this.updateSwampDamage(delta);
            this.updateBossWarning(delta);
        }

        if(this.playerShadow)this.playerShadow.setPosition(this.player.x,this.player.y+12);
        if(this.playerNameTxt)this.playerNameTxt.setPosition(this.player.x,this.player.y-22);
        if(this.torchLight&&this.player.torchActive)this.torchLight.setPosition(this.player.x,this.player.y);
        if(this.player.facing.x<0&&this.player.setFlipX)this.player.setFlipX(true);
        else if(this.player.facing.x>0&&this.player.setFlipX)this.player.setFlipX(false);
        if(this.player.body.velocity.length()>10)this.player.y+=Math.sin(time*0.008)*0.3;
    }

    updateDayVisuals(){
        const t=this.dayTimer%this.dayCycleLength;
        if(t<D.DAY_NIGHT.DAY_DURATION){this.overlay.setAlpha(0);}
        else if(t<D.DAY_NIGHT.DAY_DURATION+D.DAY_NIGHT.DUSK_DURATION){this.overlay.setFillStyle(0x331100);this.overlay.setAlpha((t-D.DAY_NIGHT.DAY_DURATION)/D.DAY_NIGHT.DUSK_DURATION*0.3);}
        else{const torch=this.player.torchActive||this.campfires.some(cf=>dist(cf,this.player)<150);this.overlay.setFillStyle(0x000033);this.overlay.setAlpha(torch?0.35:0.6);}
    }

    updateDayNight(delta){
        const prevDay=this.currentDay;
        this.dayTimer+=delta;
        const cycle=this.dayCycleLength;
        this.currentDay=Math.floor(this.dayTimer/cycle)+1;
        if(this.currentDay>this.maxDays&&!this.gameWon){
            this.gameWon=true;
            this.showFloatingText(this.player.x,this.player.y-50,'🎉 恭喜! 你存活了10天!','#FFD54F');
            const cw=this.cameras.main.width,ch=this.cameras.main.height;
            this.add.rectangle(cw/2,ch/2,400,200,0x000000,0.8).setDepth(200).setScrollFactor(0);
            this.add.text(cw/2,ch/2-20,'🏆 任務完成!\n存活 10 天!',{fontSize:'24px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold',align:'center',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setDepth(201).setScrollFactor(0);
            this.add.text(cw/2,ch/2+40,`擊殺: ${this.kills} 🦖`,{fontSize:'16px',fill:'#81C784',fontFamily:'Arial'}).setOrigin(0.5).setDepth(201).setScrollFactor(0);
            return;
        }
        if(this.currentDay>prevDay&&this.currentDay<=this.maxDays){
            this.showFloatingText(this.player.x,this.player.y-50,`☀️ 第 ${this.currentDay} 天開始!`,'#FFD54F');
            if(this.currentDay>=3)this.showFloatingText(this.player.x,this.player.y-35,'恐龍變得更強了...','#FF5252');
        }
        const t=this.dayTimer%cycle;const prev=this.dayPhase;
        if(t<D.DAY_NIGHT.DAY_DURATION){this.dayPhase=D.DAY_NIGHT.PHASES.DAY;this.overlay.setAlpha(0);}
        else if(t<D.DAY_NIGHT.DAY_DURATION+D.DAY_NIGHT.DUSK_DURATION){this.dayPhase=D.DAY_NIGHT.PHASES.DUSK;this.overlay.setFillStyle(0x331100);this.overlay.setAlpha((t-D.DAY_NIGHT.DAY_DURATION)/D.DAY_NIGHT.DUSK_DURATION*0.3);}
        else{this.dayPhase=D.DAY_NIGHT.PHASES.NIGHT;const torch=this.player.torchActive||this.campfires.some(cf=>dist(cf,this.player)<150);this.overlay.setFillStyle(0x000033);this.overlay.setAlpha(torch?0.35:0.6);}
        if(prev!==this.dayPhase)AudioMgr.updateBGM(this.dayPhase);
    }

    updatePlayerMovement(){
        const p=this.player;let vx=0,vy=0;
        if(this.keys){
            if(this.keys.a.isDown)vx-=1;if(this.keys.d.isDown)vx+=1;if(this.keys.w.isDown)vy-=1;if(this.keys.s.isDown)vy+=1;
            p.sprinting=this.keys.shift.isDown&&p.stamina>0;
            if(Phaser.Input.Keyboard.JustDown(this.keys.space))this.smartAction();
            if(Phaser.Input.Keyboard.JustDown(this.keys.e))this.gather();
            if(Phaser.Input.Keyboard.JustDown(this.keys.i))this.events.emit('toggleInventory');
            if(Phaser.Input.Keyboard.JustDown(this.keys.c))this.events.emit('toggleCrafting');
            if(Phaser.Input.Keyboard.JustDown(this.keys.f)){if(p.inventory.length>0)this.useItem(0);}
        }
        // Mobile joystick via UIScene
        if(this.moveVec.x!==0||this.moveVec.y!==0){vx=this.moveVec.x;vy=this.moveVec.y;}
        const len=Math.hypot(vx,vy);if(len>0){vx/=len;vy/=len;p.facing={x:vx,y:vy};}
        const biome=this.mapData[Math.floor(p.y/TILE)]?.[Math.floor(p.x/TILE)];
        const spd=(p.sprinting?D.PLAYER.SPRINT_SPEED:p.speed)*(biome===D.MAP.BIOMES.SWAMP?0.7:1);
        p.body.setVelocity(vx*spd,vy*spd);
        if(p.sprinting&&len>0){p.stamina=Math.max(0,p.stamina-0.3);if(p.stamina<=0)p.sprinting=false;}
    }

    updateSwampDamage(delta){
        const biome=this.mapData[Math.floor(this.player.y/TILE)]?.[Math.floor(this.player.x/TILE)];
        if(biome===D.MAP.BIOMES.SWAMP){if(!this._swampT)this._swampT=0;this._swampT+=delta;
            if(this._swampT>10000){this._swampT=0;this.damagePlayer(1,'瘴氣');AudioMgr.playPoison();
                for(let i=0;i<4;i++){const p=this.add.circle(this.player.x+rnd(-15,15),this.player.y+rnd(-15,15),3,0x9C27B0,0.5).setDepth(20);this.tweens.add({targets:p,y:p.y-25,alpha:0,duration:600,onComplete:()=>p.destroy()});}}}
    }

    updateBossWarning(delta){
        this._bossWarnCd=Math.max(0,this._bossWarnCd-delta);if(this._bossWarnCd>0)return;
        const p=this.player,inCamp=this.isInCamp(p.x,p.y);if(inCamp)return;
        this.dinos.forEach(dino=>{if(!dino.alive||!dino.dinoData?.boss)return;const d=dist(dino,p);
            if(d<dino.dinoData.detectRange*1.5&&d>dino.dinoData.size+20){
                if(!dino.bossWarned){AudioMgr.playRoar();this.cameras.main.shake(200,0.008);
                    this.showFloatingText(p.x,p.y-40,`⚠️ ${dino.dinoData.name} 接近中!`,'#FF6D00');
                    const vign=this.add.rectangle(this.cameras.main.width/2,this.cameras.main.height/2,2000,2000,0xFF0000,0.15).setDepth(49).setScrollFactor(0);
                    this.tweens.add({targets:vign,alpha:0,duration:1500,onComplete:()=>vign.destroy()});
                    dino.bossWarned=true;this._bossWarnCd=8000;
                }else if(d<dino.dinoData.detectRange){AudioMgr.playBossWarning();this._bossWarnCd=3000;}
            }if(d>dino.dinoData.aggro)dino.bossWarned=false;
        });
    }

    updateDinoAI(delta){
        const p=this.player,isNight=this.dayPhase===D.DAY_NIGHT.PHASES.NIGHT,inCamp=this.isInCamp(p.x,p.y);
        // Find nearest player for each dino (host + remotes)
        const allPlayers=[{x:p.x,y:p.y,alive:p.alive,isLocal:true}];
        this.remotePlayers.forEach(rp=>{if(rp.alive)allPlayers.push({x:rp.sprite.x,y:rp.sprite.y,alive:true,isLocal:false});});

        this.dinos.forEach(dino=>{
            if(!dino.alive)return;
            if(dino.dinoData.nightOnly&&!isNight){dino.setAlpha(0);dino.body.enable=false;if(dino.hpBg)dino.hpBg.setAlpha(0);if(dino.hpBar)dino.hpBar.setAlpha(0);if(dino.nameTxt)dino.nameTxt.setAlpha(0);if(dino.shadow)dino.shadow.setAlpha(0);dino.state='patrol';return;}
            else{dino.setAlpha(1);dino.body.enable=true;if(dino.hpBg)dino.hpBg.setAlpha(1);if(dino.hpBar)dino.hpBar.setAlpha(1);if(dino.nameTxt)dino.nameTxt.setAlpha(1);if(dino.shadow)dino.shadow.setAlpha(0.15);}

            // Find nearest player
            let nearP=p,nearD=dist(dino,p);
            allPlayers.forEach(ap=>{const dd=dist(dino,ap);if(dd<nearD){nearD=dd;nearP=ap;}});
            const d=nearD,data=dino.dinoData;
            const nearInCamp=this.isInCamp(nearP.x,nearP.y);
            const nightMult=(isNight&&data.nightBuff)?1.5:1;
            switch(dino.state){
                case 'patrol':
                    if(dist(dino,dino.patrolTarget)<10||dist(dino,dino.patrolTarget)>500)
                        dino.patrolTarget={x:dino.homeX+rnd(-120,120),y:dino.homeY+rnd(-120,120)};
                    this.moveToward(dino,dino.patrolTarget,data.speed*0.4);
                    if(dino.setFlipX)dino.setFlipX(dino.body.velocity.x<0);
                    const detectR=isNight?data.detectRange*1.3:data.detectRange;
                    if(d<detectR&&!nearInCamp&&!data.passive)dino.state='chase';
                    break;
                case 'chase':
                    if(d>data.aggro||nearInCamp){dino.state='patrol';break;}
                    this.moveToward(dino,nearP,data.speed*nightMult);
                    if(dino.setFlipX)dino.setFlipX(nearP.x<dino.x);
                    if(d<data.size+15){dino.state='attack';dino.attackCd=0;}
                    break;
                case 'attack':
                    if(d>data.size+40){dino.state='chase';break;}
                    dino.body.setVelocity(0,0);
                    dino.attackCd-=delta;
                    if(dino.attackCd<=0){
                        // Damage nearest player
                        if(nearP.isLocal){
                            this.damagePlayer(data.atk*nightMult);
                            if(data.poison&&!p.poisoned){p.poisoned=true;this.showFloatingText(p.x,p.y-35,'中毒!','#9C27B0');AudioMgr.playPoison();
                                p.poisonTimer=this.time.addEvent({delay:1000,repeat:5,callback:()=>{if(p.alive&&p.poisoned)this.damagePlayer(2,'毒');}});
                                this.time.delayedCall(6000,()=>{p.poisoned=false;});}
                        }
                        dino.attackCd=isNight?900:1200;
                        if(dino.setTint){dino.setTint(0xFFAAAA);this.time.delayedCall(200,()=>{if(dino.alive&&dino.clearTint)dino.clearTint();});}
                    }break;
                case 'flee':
                    this.moveToward(dino,{x:dino.x+(dino.x-nearP.x),y:dino.y+(dino.y-nearP.y)},data.speed*1.3);
                    if(d>data.aggro)dino.state='patrol';break;
            }
            if(dino.alive){
                if(dino.hpBg)dino.hpBg.setPosition(dino.x,dino.y-data.size-4);
                if(dino.hpBar){dino.hpBar.setPosition(dino.x-dino.hpBarW/2,dino.y-data.size-4);dino.hpBar.width=dino.hpBarW*(dino.hp/dino.maxHp);}
                if(dino.nameTxt)dino.nameTxt.setPosition(dino.x,dino.y-data.size-14);
                if(dino.shadow)dino.shadow.setPosition(dino.x,dino.y+data.size*0.4);
            }
            this.traps.forEach(trap=>{if(trap.active&&dist(trap,dino)<20){
                this.damageDino(dino,trap.dmg);trap.active=false;if(trap.setAlpha)trap.setAlpha(0.2);
                this.showFloatingText(trap.x,trap.y-15,'陷阱觸發!','#FF9800');
                this.time.delayedCall(3000,()=>{trap.destroy();});this.traps=this.traps.filter(t=>t!==trap);
                const orig=dino.dinoData.speed;dino.dinoData.speed*=0.5;this.time.delayedCall(3000,()=>{dino.dinoData.speed=orig;});
            }});
        });
    }

    moveToward(obj,target,speed){const dx=target.x-obj.x,dy=target.y-obj.y,len=Math.hypot(dx,dy);if(len>2)obj.body.setVelocity((dx/len)*speed,(dy/len)*speed);else obj.body.setVelocity(0,0);}
}

// ============================================
// UI Scene — 觸控搖桿 + 合併按鈕 + 清晰顯示
// ============================================
class UIScene extends Phaser.Scene {
    constructor(){super('UI');}
    create(data){
        this.gs=data.gameScene;this.showInv=false;this.showCraft=false;this.craftPage=0;
        const w=this.cameras.main.width,h=this.cameras.main.height;
        const safeTop=16,safeLeft=12;
        this._mob=this.gs.isMobile;
        const fs=(base)=>this._mob?Math.max(base,Math.floor(base*1.3)):base;

        // ===== HUD bars (top-left) =====
        this.add.rectangle(safeLeft+80,safeTop+30,170,70,0x000000,0.4).setOrigin(0.5).setScrollFactor(0).setDepth(100);
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

        // ===== Day/Night timer (center-top) =====
        this.add.rectangle(w/2,safeTop+22,200,50,0x000000,0.55).setOrigin(0.5).setScrollFactor(0).setDepth(100).setStrokeStyle(1,0x333333);
        this.dayTxt=this.add.text(w/2,safeTop+10,'',{fontSize:fs(14)+'px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.dayCountTxt=this.add.text(w/2,safeTop+28,'',{fontSize:fs(13)+'px',fill:'#FF9800',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.biomeTxt=this.add.text(w/2,safeTop+44,'',{fontSize:fs(10)+'px',fill:'#aaa',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // ===== Stats (top-right) =====
        this.statsTxt=this.add.text(w-10,safeTop+8,'',{fontSize:fs(11)+'px',fill:'#81C784',fontFamily:'Arial',align:'right'}).setOrigin(1,0).setScrollFactor(0).setDepth(101);
        const sndBtn=this.add.text(w-10,safeTop+55,'🔊',{fontSize:'18px'}).setOrigin(1,0).setScrollFactor(0).setDepth(110).setInteractive();
        sndBtn.on('pointerdown',()=>{AudioMgr.toggleMute();sndBtn.setText(AudioMgr.masterGain?.gain.value>0?'🔊':'🔇');});

        // ===== Multiplayer indicator =====
        if(this.gs.isMulti){
            this.multiTxt=this.add.text(w-10,safeTop+75,'',{fontSize:'10px',fill:'#42A5F5',fontFamily:'Arial',align:'right'}).setOrigin(1,0).setScrollFactor(0).setDepth(101);
        }

        // ===== Mobile controls =====
        if(this._mob) this.createMobileControls(w,h);

        // ===== Panels =====
        this.invPanel=this.add.container(w/2,h/2).setDepth(200).setVisible(false).setScrollFactor(0);
        this.craftPanel=this.add.container(w/2,h/2).setDepth(200).setVisible(false).setScrollFactor(0);

        // ===== Quick bar =====
        const qS=this._mob?50:42;
        this.quickBar=this.add.container(w/2,h-(this._mob?90:50)).setDepth(105).setScrollFactor(0);
        this.quickSlots=[];
        for(let i=0;i<5;i++){const sx=(i-2)*(qS+4);
            const bg=this.add.rectangle(sx,0,qS,qS,0x1a1a1a,0.75).setStrokeStyle(2,0x4CAF50);
            const txt=this.add.text(sx,0,'',{fontSize:fs(11)+'px',fill:'#fff',fontFamily:'Arial',align:'center',wordWrap:{width:qS-4}}).setOrigin(0.5);
            const qty=this.add.text(sx+qS/2-2,qS/2-2,'',{fontSize:fs(10)+'px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(1,1);
            bg.setInteractive().on('pointerdown',()=>{AudioMgr.playClick();this.gs.useItem(i);});
            this.quickBar.add([bg,txt,qty]);this.quickSlots.push({bg,txt,qty});}

        this.gs.events.on('toggleInventory',()=>this.toggleInventory());
        this.gs.events.on('toggleCrafting',()=>this.toggleCrafting());
    }

    // ===== Mobile: Virtual Joystick + Action Buttons =====
    createMobileControls(w,h){
        this.joyPointerId=-1;
        this.joyBaseX=0;this.joyBaseY=0;

        // Joystick visual elements
        this.joyBase=this.add.circle(0,0,58,0xFFFFFF,0.06).setStrokeStyle(3,0xFFFFFF,0.25).setScrollFactor(0).setDepth(120).setVisible(false);
        this.joyKnob=this.add.circle(0,0,24,0x4CAF50,0.45).setStrokeStyle(2,0xFFFFFF,0.5).setScrollFactor(0).setDepth(121).setVisible(false);

        // Joystick touch zone hint (always visible, subtle)
        this.add.circle(90,h-160,10,0xFFFFFF,0.08).setScrollFactor(0).setDepth(115);
        this.add.text(90,h-130,'↕ 移動',{fontSize:'11px',fill:'#ffffff55',fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(115);

        // Touch handlers
        this.input.on('pointerdown',(pointer)=>{
            if(this.showInv||this.showCraft)return;
            // Left 45% of screen = joystick zone
            if(pointer.x<w*0.45&&this.joyPointerId===-1){
                this.joyPointerId=pointer.id;
                this.joyBaseX=pointer.x;this.joyBaseY=pointer.y;
                this.joyBase.setPosition(pointer.x,pointer.y).setVisible(true);
                this.joyKnob.setPosition(pointer.x,pointer.y).setVisible(true);
            }
        });
        this.input.on('pointermove',(pointer)=>{
            if(pointer.id===this.joyPointerId&&pointer.isDown){
                const dx=pointer.x-this.joyBaseX,dy=pointer.y-this.joyBaseY;
                const d=Math.hypot(dx,dy),maxD=55;
                const clamped=Math.min(d,maxD);
                const angle=Math.atan2(dy,dx);
                this.joyKnob.setPosition(
                    this.joyBaseX+Math.cos(angle)*clamped,
                    this.joyBaseY+Math.sin(angle)*clamped
                );
                const norm=clamped/maxD;
                this.gs.moveVec.x=Math.cos(angle)*norm;
                this.gs.moveVec.y=Math.sin(angle)*norm;
            }
        });
        this.input.on('pointerup',(pointer)=>{
            if(pointer.id===this.joyPointerId){
                this.joyPointerId=-1;
                this.joyBase.setVisible(false);this.joyKnob.setVisible(false);
                this.gs.moveVec.x=0;this.gs.moveVec.y=0;
            }
        });

        // ===== Action Buttons (right side) =====
        const btnR=w-50,btnBot=h-65;
        const mainBtnR=38;

        // Main action button — combined attack/gather (auto-detect)
        const mainBtn=this.add.circle(btnR,btnBot-70,mainBtnR,0xF44336,0.8).setStrokeStyle(3,0xFFFFFF,0.5).setScrollFactor(0).setDepth(115).setInteractive();
        this.mainBtnIcon=this.add.text(btnR,btnBot-70,'⚔️',{fontSize:'28px'}).setOrigin(0.5).setScrollFactor(0).setDepth(116);
        this.mainBtnLabel=this.add.text(btnR,btnBot-35,'攻擊',{fontSize:'11px',fill:'#fff',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(116);
        mainBtn.on('pointerdown',()=>{AudioMgr.resume();this.gs.smartAction();});

        // Inventory button
        const invBtn=this.add.circle(btnR-65,btnBot+10,26,0x1565C0,0.8).setStrokeStyle(2,0xFFFFFF,0.4).setScrollFactor(0).setDepth(115).setInteractive();
        this.add.text(btnR-65,btnBot+10,'🎒',{fontSize:'22px'}).setOrigin(0.5).setScrollFactor(0).setDepth(116);
        this.add.text(btnR-65,btnBot+35,'背包',{fontSize:'10px',fill:'#fff',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(116);
        invBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleInventory();});

        // Craft button
        const craftBtn=this.add.circle(btnR,btnBot+10,26,0xE65100,0.8).setStrokeStyle(2,0xFFFFFF,0.4).setScrollFactor(0).setDepth(115).setInteractive();
        this.add.text(btnR,btnBot+10,'🔨',{fontSize:'22px'}).setOrigin(0.5).setScrollFactor(0).setDepth(116);
        this.add.text(btnR,btnBot+35,'合成',{fontSize:'10px',fill:'#fff',fontFamily:'Arial',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(116);
        craftBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleCrafting();});

    }

    toggleInventory(){this.showInv=!this.showInv;this.showCraft=false;this.craftPanel.setVisible(false);if(this.showInv)this.buildInventoryPanel();this.invPanel.setVisible(this.showInv);}
    toggleCrafting(){this.showCraft=!this.showCraft;this.showInv=false;this.invPanel.setVisible(false);this.craftPage=0;if(this.showCraft)this.buildCraftPanel();this.craftPanel.setVisible(this.showCraft);}

    buildInventoryPanel(){
        this.invPanel.removeAll(true);
        const w=this.cameras.main.width,h=this.cameras.main.height;
        const pw=Math.min(320,w*0.88),ph=Math.min(400,h*0.65);
        const fs=(base)=>this._mob?Math.max(base,Math.floor(base*1.3)):base;
        this.invPanel.add(this.add.rectangle(0,0,pw,ph,0x1a1a1a,0.94).setStrokeStyle(2,0x4CAF50));
        this.invPanel.add(this.add.text(0,-ph/2+18,'🎒 背包',{fontSize:fs(16)+'px',fill:'#4CAF50',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
        const closeBtn=this.add.text(pw/2-20,-ph/2+12,'✕',{fontSize:fs(20)+'px',fill:'#ff5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleInventory();});this.invPanel.add(closeBtn);
        const ep=this.gs.player.equipped;
        this.invPanel.add(this.add.text(-pw/2+14,-ph/2+40,`武器: ${ep.weapon?D.ITEMS[ep.weapon].name:'無'} | 防具: ${ep.armor?D.ITEMS[ep.armor].name:'無'}`,{fontSize:fs(11)+'px',fill:'#FFD54F',fontFamily:'Arial'}));
        this.invPanel.add(this.add.text(-pw/2+14,-ph/2+58,`ATK:${this.gs.player.atk} DEF:${this.gs.player.def}`,{fontSize:fs(11)+'px',fill:'#81C784',fontFamily:'Arial'}));
        const inv=this.gs.player.inventory,cols=5,slotSize=Math.floor((pw-20)/cols);
        const startX=-cols*slotSize/2+slotSize/2,startY=-ph/2+82;
        for(let i=0;i<D.PLAYER.INV_SIZE;i++){
            const col=i%cols,row=Math.floor(i/cols),sx=startX+col*slotSize,sy=startY+row*slotSize;
            const bg=this.add.rectangle(sx,sy,slotSize-4,slotSize-4,0x333333,0.8).setStrokeStyle(1,0x555555).setInteractive();
            this.invPanel.add(bg);
            if(i<inv.length){const item=inv[i],def=D.ITEMS[item.id];
                if(def.type==='placeable'||def.type==='tool')bg.setStrokeStyle(2,0xFF9800);
                this.invPanel.add(this.add.text(sx,sy-8,def.name.substring(0,3),{fontSize:fs(12)+'px',fill:'#fff',fontFamily:'Arial'}).setOrigin(0.5));
                this.invPanel.add(this.add.text(sx+slotSize/2-6,sy+slotSize/2-6,`${item.qty}`,{fontSize:fs(10)+'px',fill:'#FFD54F',fontFamily:'Arial'}).setOrigin(1,1));
                const idx=i;bg.on('pointerdown',()=>{AudioMgr.playClick();this.gs.useItem(idx);this.buildInventoryPanel();});
            }
        }
    }

    buildCraftPanel(){
        this.craftPanel.removeAll(true);
        const w=this.cameras.main.width,h=this.cameras.main.height;
        const pw=Math.min(340,w*0.9),ph=Math.min(480,h*0.72);
        const fs=(base)=>this._mob?Math.max(base,Math.floor(base*1.3)):base;
        this.craftPanel.add(this.add.rectangle(0,0,pw,ph,0x1a1a1a,0.94).setStrokeStyle(2,0xFF9800));
        this.craftPanel.add(this.add.text(0,-ph/2+18,'🔨 合成',{fontSize:fs(16)+'px',fill:'#FF9800',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
        const closeBtn=this.add.text(pw/2-20,-ph/2+12,'✕',{fontSize:fs(20)+'px',fill:'#ff5252',fontFamily:'Arial'}).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown',()=>{AudioMgr.playClick();this.toggleCrafting();});this.craftPanel.add(closeBtn);
        const rowH=this._mob?56:48,contentH=ph-80,itemsPerPage=Math.floor(contentH/rowH);
        const totalPages=Math.ceil(D.RECIPES.length/itemsPerPage);
        const startIdx=this.craftPage*itemsPerPage,endIdx=Math.min(startIdx+itemsPerPage,D.RECIPES.length);
        const startY=-ph/2+48;
        for(let idx=startIdx;idx<endIdx;idx++){
            const r=D.RECIPES[idx],i=idx-startIdx,y=startY+i*rowH;
            const canCraft=this.gs.canCraft(r),def=D.ITEMS[r.result];
            const matsStr=Object.entries(r.mats).map(([id,qty])=>`${D.ITEMS[id].name}x${qty}`).join(' ');
            this.craftPanel.add(this.add.rectangle(0,y+rowH/2-4,pw-20,rowH-6,canCraft?0x1B5E20:0x333333,0.7).setStrokeStyle(1,canCraft?0x4CAF50:0x444444));
            this.craftPanel.add(this.add.text(-pw/2+18,y+6,`${def.name} x${r.qty}`,{fontSize:fs(13)+'px',fill:canCraft?'#A8D08D':'#777',fontFamily:'Arial',fontStyle:'bold'}));
            this.craftPanel.add(this.add.text(-pw/2+18,y+26,matsStr+(r.needFire?' 🔥':''),{fontSize:fs(10)+'px',fill:canCraft?'#81C784':'#555',fontFamily:'Arial'}));
            if(canCraft){const btn=this.add.text(pw/2-28,y+rowH/2-6,'製作',{fontSize:fs(13)+'px',fill:'#FFD54F',fontFamily:'Arial',fontStyle:'bold',backgroundColor:'#2E7D32',padding:{x:8,y:4}}).setOrigin(0.5).setInteractive();
                btn.on('pointerdown',()=>{this.gs.craft(r);this.buildCraftPanel();});this.craftPanel.add(btn);}
        }
        if(totalPages>1){const navY=ph/2-22;
            this.craftPanel.add(this.add.text(0,navY,`${this.craftPage+1} / ${totalPages}`,{fontSize:fs(12)+'px',fill:'#aaa',fontFamily:'Arial'}).setOrigin(0.5));
            if(this.craftPage>0){const pb=this.add.text(-pw/3,navY,'◀ 上一頁',{fontSize:fs(13)+'px',fill:'#42A5F5',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive();pb.on('pointerdown',()=>{AudioMgr.playClick();this.craftPage--;this.buildCraftPanel();});this.craftPanel.add(pb);}
            if(this.craftPage<totalPages-1){const nb=this.add.text(pw/3,navY,'下一頁 ▶',{fontSize:fs(13)+'px',fill:'#42A5F5',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setInteractive();nb.on('pointerdown',()=>{AudioMgr.playClick();this.craftPage++;this.buildCraftPanel();});this.craftPanel.add(nb);}
        }
    }

    update(){
        const p=this.gs.player;if(!p)return;
        this.hpFill.width=138*(p.hp/p.maxHp);this.hpTxt.setText(`${Math.floor(p.hp)}/${p.maxHp}`);
        this.hungerFill.width=138*(p.hunger/p.maxHunger);this.hungerTxt.setText(`${Math.floor(p.hunger)}/${p.maxHunger}`);
        this.staminaFill.width=138*(p.stamina/p.maxStamina);this.staminaTxt.setText(`${Math.floor(p.stamina)}/${p.maxStamina}`);
        this.hpFill.setFillStyle(p.hp>50?0x4CAF50:p.hp>25?0xFF9800:0xF44336);
        this.hungerFill.setFillStyle(p.hunger>40?0xFF9800:p.hunger>15?0xF44336:0xB71C1C);

        const gs=this.gs;
        const day=Math.min(gs.currentDay,gs.maxDays);
        const ptl=gs.phaseTimeLeft;
        const secs=Math.ceil(ptl.left/1000);
        const mins=Math.floor(secs/60),sec=secs%60;
        this.dayTxt.setText(`第 ${day}/${gs.maxDays} 天  ${gs.getDayPhaseStr()}`);
        const countdownStr=`${ptl.phase==='night'?'🌙':'⏱'} ${mins}:${sec.toString().padStart(2,'0')}`;
        this.dayCountTxt.setText(countdownStr);
        if(ptl.phase==='night')this.dayCountTxt.setColor('#FF5252');
        else if(ptl.phase==='dusk')this.dayCountTxt.setColor('#FF9800');
        else this.dayCountTxt.setColor('#81C784');

        this.biomeTxt.setText(`📍 ${gs.getBiomeName(p.x,p.y)}`);
        const survMins=Math.floor(gs.survivalTime/60000),survSecs=Math.floor((gs.survivalTime%60000)/1000);
        this.statsTxt.setText(`🦖 ${gs.kills} 擊殺\n⏱ ${survMins}:${survSecs.toString().padStart(2,'0')}`);

        // Update action button icon based on proximity
        if(this._mob&&this.mainBtnIcon){
            let nearRes=false;
            gs.resources.forEach(r=>{if(dist(r,p)<50)nearRes=true;});
            this.mainBtnIcon.setText(nearRes?'🪓':'⚔️');
            this.mainBtnLabel.setText(nearRes?'採集':'攻擊');
        }

        // Multiplayer indicator
        if(this.multiTxt&&gs.isMulti){
            const count=gs.remotePlayers.size+1;
            this.multiTxt.setText(`👥 ${count}人連線`);
        }

        // Quick bar
        for(let i=0;i<5;i++){const slot=this.quickSlots[i];
            if(i<p.inventory.length){const item=p.inventory[i];slot.txt.setText(D.ITEMS[item.id].name.substring(0,3));slot.qty.setText(item.qty>1?item.qty:'');}
            else{slot.txt.setText('');slot.qty.setText('');}}
    }
}

// ============================================
const config = {
    type: Phaser.AUTO, parent: 'game-container',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: '100%', height: '100%' },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [BootScene, MenuScene, LobbyScene, GameScene, UIScene],
    pixelArt: true, backgroundColor: '#0a1a0a', input: { activePointers: 3 }
};
const game = new Phaser.Game(config);
