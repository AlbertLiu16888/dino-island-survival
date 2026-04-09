// ===== PeerJS 多人連線管理器 (2-6人) =====
const NetMgr = {
    peer: null,
    connections: [],   // host: client connections
    hostConn: null,    // client: connection to host
    isHost: false,
    roomId: null,
    myId: null,
    playerName: '玩家',
    skinIdx: 0,
    ready: false,
    gameStarted: false,  // track if game has started
    _mapSeed: null,      // store seed for late joiners

    // Callbacks
    onPlayerJoin: null,
    onPlayerLeave: null,
    onStateUpdate: null,
    onPlayerInput: null,
    onPlayerList: null,
    onStartGame: null,
    onInitData: null,
    onError: null,

    // ICE 配置 — 多組 STUN + 免費 TURN 確保 NAT 穿透
    _iceConfig: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // 免費 TURN relay (OpenRelay)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ]
    },

    async createRoom() {
        this.isHost = true;
        this.gameStarted = false;
        this.roomId = this._genCode();
        return new Promise((resolve, reject) => {
            if (this.peer) { try { this.peer.destroy(); } catch(e){} }
            this.peer = new Peer('dino-' + this.roomId, {
                debug: 0,
                config: this._iceConfig,
                serialization: 'json'
            });
            const timeout = setTimeout(() => reject(new Error('連線逾時')), 15000);
            this.peer.on('open', id => {
                clearTimeout(timeout);
                this.myId = id;
                this.ready = true;
                // 持續監聽新連線 (支援遊戲中加入)
                this.peer.on('connection', conn => this._handleConn(conn));
                resolve(this.roomId);
            });
            this.peer.on('error', err => {
                clearTimeout(timeout);
                if (err.type === 'unavailable-id') {
                    this.roomId = this._genCode();
                    this.peer.destroy();
                    this.createRoom().then(resolve).catch(reject);
                } else {
                    if (this.onError) this.onError(err.message || '連線錯誤');
                    reject(err);
                }
            });
            // 斷線重連
            this.peer.on('disconnected', () => {
                if (!this.peer.destroyed) {
                    try { this.peer.reconnect(); } catch(e){}
                }
            });
        });
    },

    async joinRoom(code, retries) {
        this.isHost = false;
        this.roomId = code.toUpperCase();
        retries = retries || 0;
        const MAX_RETRIES = 2;

        return new Promise(async (resolve, reject) => {
            try {
                if (!this.peer || this.peer.destroyed) {
                    await this._initPeer();
                }
            } catch(e) { return reject(e); }

            const timeout = setTimeout(() => {
                if (retries < MAX_RETRIES) {
                    // 自動重試
                    this.joinRoom(code, retries + 1).then(resolve).catch(reject);
                } else {
                    reject(new Error('連線逾時，請確認代碼'));
                }
            }, 10000);

            const conn = this.peer.connect('dino-' + this.roomId, {
                reliable: true,
                serialization: 'json',
                metadata: { name: this.playerName, skinIdx: this.skinIdx || 0 }
            });

            conn.on('open', () => {
                clearTimeout(timeout);
                this.hostConn = conn;
                this.ready = true;
                conn.on('data', data => this._handleHostMsg(data));
                conn.on('close', () => {
                    this.ready = false;
                    if (this.onError) this.onError('與主機斷線');
                });
                resolve();
            });
            conn.on('error', err => {
                clearTimeout(timeout);
                if (retries < MAX_RETRIES) {
                    this.joinRoom(code, retries + 1).then(resolve).catch(reject);
                } else {
                    if (this.onError) this.onError('無法連線: ' + (err.message || err));
                    reject(err);
                }
            });
        });
    },

    _initPeer() {
        return new Promise((resolve, reject) => {
            this.peer = new Peer(null, {
                debug: 0,
                config: this._iceConfig,
                serialization: 'json'
            });
            const t = setTimeout(() => reject(new Error('Peer初始化逾時')), 12000);
            this.peer.on('open', id => { clearTimeout(t); this.myId = id; resolve(); });
            this.peer.on('error', err => { clearTimeout(t); reject(err); });
            this.peer.on('disconnected', () => {
                if (!this.peer.destroyed) {
                    try { this.peer.reconnect(); } catch(e){}
                }
            });
        });
    },

    _handleConn(conn) {
        conn.on('open', () => {
            // 檢查是否已存在 (防重複)
            if (this.connections.find(c => c.peer === conn.peer)) return;

            // 檢查人數上限
            if (this.connections.length >= 5) {
                try { conn.send({ t: 'err', msg: '房間已滿 (最多6人)' }); } catch(e){}
                conn.close();
                return;
            }

            const name = conn.metadata?.name || `玩家${this.connections.length + 2}`;
            conn.playerName = name;
            conn.peerId = conn.peer;
            conn.skinIdx = conn.metadata?.skinIdx || 0;
            this.connections.push(conn);

            conn.on('data', data => {
                if (this.onPlayerInput) this.onPlayerInput(conn.peer, data);
            });
            conn.on('close', () => {
                this.connections = this.connections.filter(c => c !== conn);
                if (this.onPlayerLeave) this.onPlayerLeave(conn.peer);
                this._broadcastPlayerList();
            });
            conn.on('error', () => {
                this.connections = this.connections.filter(c => c !== conn);
                if (this.onPlayerLeave) this.onPlayerLeave(conn.peer);
                this._broadcastPlayerList();
            });

            if (this.onPlayerJoin) this.onPlayerJoin(conn.peer, name);
            this._broadcastPlayerList();

            // 如果遊戲已開始，通知新玩家直接進入
            if (this.gameStarted && this._mapSeed) {
                try {
                    conn.send({ t: 'start', seed: this._mapSeed, lateJoin: true });
                } catch(e){}
            }
        });

        // 連線錯誤不阻止其他連線
        conn.on('error', (err) => {
            console.log('Connection error from', conn.peer, err.type);
        });
    },

    _handleHostMsg(data) {
        if (!data || !data.t) return;
        switch(data.t) {
            case 'pl': if (this.onPlayerList) this.onPlayerList(data.players); break;
            case 'start': if (this.onStartGame) this.onStartGame(data); break;
            case 'init': if (this.onInitData) this.onInitData(data); break;
            case 'init_res': if (this.onInitData) this.onInitData(data); break;
            case 's': if (this.onStateUpdate) this.onStateUpdate(data); break;
            case 'err':
                if (this.onError) this.onError(data.msg || '連線錯誤');
                break;
        }
    },

    broadcast(data) {
        const dead = [];
        for (let i = 0; i < this.connections.length; i++) {
            const conn = this.connections[i];
            if (conn.open) {
                try { conn.send(data); } catch(e) { dead.push(i); }
            } else if (!conn.peerConnection || conn.peerConnection.connectionState === 'failed') {
                dead.push(i);
            }
        }
        // 清理斷開的連線
        if (dead.length > 0) {
            for (let i = dead.length - 1; i >= 0; i--) {
                const conn = this.connections[dead[i]];
                if (this.onPlayerLeave) this.onPlayerLeave(conn.peer);
                this.connections.splice(dead[i], 1);
            }
            this._broadcastPlayerList();
        }
    },

    sendToHost(data) {
        if (this.hostConn?.open) try { this.hostConn.send(data); } catch(e) {}
    },

    sendStartGame(extra) {
        this.gameStarted = true;
        this._mapSeed = extra?.seed || Date.now();
        extra.seed = this._mapSeed;
        this.broadcast({ t: 'start', ...extra });
    },

    _broadcastPlayerList() {
        const players = [{ id: this.myId, name: this.playerName + ' (房主)', host: true }];
        this.connections.forEach(c => players.push({
            id: c.peer,
            name: c.playerName || '玩家',
            skinIdx: c.skinIdx || c.metadata?.skinIdx || 0
        }));
        this.broadcast({ t: 'pl', players });
        if (this.onPlayerList) this.onPlayerList(players);
    },

    getPlayerList() {
        const list = [{ id: this.myId, name: this.playerName + ' (房主)', host: true }];
        this.connections.forEach(c => list.push({
            id: c.peer,
            name: c.playerName || '玩家',
            skinIdx: c.skinIdx || c.metadata?.skinIdx || 0
        }));
        return list;
    },

    getPlayerCount() {
        return this.isHost ? this.connections.length + 1 : (this._lastPlayerList?.length || 1);
    },

    sendToPlayer(peerId, data) {
        const conn = this.connections.find(c => c.peer === peerId);
        if (conn?.open) try { conn.send(data); } catch(e) {}
    },

    _genCode() {
        const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let s = '';
        for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
        return s;
    },

    destroy() {
        if (this.peer) try { this.peer.destroy(); } catch(e) {}
        this.peer = null;
        this.connections = [];
        this.hostConn = null;
        this.ready = false;
        this.isHost = false;
        this.roomId = null;
        this.gameStarted = false;
        this._mapSeed = null;
    }
};
