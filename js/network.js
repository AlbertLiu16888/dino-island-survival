// ===== PeerJS 多人連線管理器 =====
const NetMgr = {
    peer: null,
    connections: [],   // host: client connections
    hostConn: null,    // client: connection to host
    isHost: false,
    roomId: null,
    myId: null,
    playerName: '玩家',
    ready: false,

    // Callbacks
    onPlayerJoin: null,   // (peerId, name)
    onPlayerLeave: null,  // (peerId)
    onStateUpdate: null,  // (data) — client receives from host
    onPlayerInput: null,  // (peerId, data) — host receives from client
    onPlayerList: null,   // (players[]) — lobby updates
    onStartGame: null,    // () — client receives start signal
    onInitData: null,     // (data) — client receives init game data
    onError: null,        // (msg)

    async createRoom() {
        this.isHost = true;
        this.roomId = this._genCode();
        return new Promise((resolve, reject) => {
            if (this.peer) { try { this.peer.destroy(); } catch(e){} }
            this.peer = new Peer('dino-' + this.roomId, {
                debug: 0,
                config: { iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]}
            });
            const timeout = setTimeout(() => reject(new Error('連線逾時')), 12000);
            this.peer.on('open', id => {
                clearTimeout(timeout);
                this.myId = id;
                this.ready = true;
                this.peer.on('connection', conn => this._handleConn(conn));
                resolve(this.roomId);
            });
            this.peer.on('error', err => {
                clearTimeout(timeout);
                // If ID taken, try another
                if (err.type === 'unavailable-id') {
                    this.roomId = this._genCode();
                    this.peer.destroy();
                    this.createRoom().then(resolve).catch(reject);
                } else {
                    if (this.onError) this.onError(err.message || '連線錯誤');
                    reject(err);
                }
            });
        });
    },

    async joinRoom(code) {
        this.isHost = false;
        this.roomId = code.toUpperCase();
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.peer || this.peer.destroyed) {
                    await this._initPeer();
                }
            } catch(e) { return reject(e); }

            const timeout = setTimeout(() => reject(new Error('連線逾時，請確認代碼')), 12000);
            const conn = this.peer.connect('dino-' + this.roomId, {
                reliable: true,
                metadata: { name: this.playerName }
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
                if (this.onError) this.onError('無法連線: ' + (err.message || err));
                reject(err);
            });
        });
    },

    _initPeer() {
        return new Promise((resolve, reject) => {
            this.peer = new Peer(null, {
                debug: 0,
                config: { iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]}
            });
            const t = setTimeout(() => reject(new Error('Peer初始化逾時')), 10000);
            this.peer.on('open', id => { clearTimeout(t); this.myId = id; resolve(); });
            this.peer.on('error', err => { clearTimeout(t); reject(err); });
        });
    },

    _handleConn(conn) {
        conn.on('open', () => {
            const name = conn.metadata?.name || `玩家${this.connections.length + 2}`;
            conn.playerName = name;
            conn.peerId = conn.peer;
            this.connections.push(conn);

            conn.on('data', data => {
                if (this.onPlayerInput) this.onPlayerInput(conn.peer, data);
            });
            conn.on('close', () => {
                this.connections = this.connections.filter(c => c !== conn);
                if (this.onPlayerLeave) this.onPlayerLeave(conn.peer);
                this._broadcastPlayerList();
            });

            if (this.onPlayerJoin) this.onPlayerJoin(conn.peer, name);
            this._broadcastPlayerList();
        });
    },

    _handleHostMsg(data) {
        if (!data || !data.t) return;
        switch(data.t) {
            case 'pl': if (this.onPlayerList) this.onPlayerList(data.players); break;
            case 'start': if (this.onStartGame) this.onStartGame(data); break;
            case 'init': if (this.onInitData) this.onInitData(data); break;
            case 's': if (this.onStateUpdate) this.onStateUpdate(data); break;
        }
    },

    broadcast(data) {
        for (const conn of this.connections) {
            if (conn.open) try { conn.send(data); } catch(e) {}
        }
    },

    sendToHost(data) {
        if (this.hostConn?.open) try { this.hostConn.send(data); } catch(e) {}
    },

    sendStartGame(extra) {
        this.broadcast({ t: 'start', ...extra });
    },

    _broadcastPlayerList() {
        const players = [{ id: this.myId, name: this.playerName + ' (房主)', host: true }];
        this.connections.forEach(c => players.push({ id: c.peer, name: c.playerName || '玩家' }));
        this.broadcast({ t: 'pl', players });
        if (this.onPlayerList) this.onPlayerList(players);
    },

    getPlayerList() {
        const list = [{ id: this.myId, name: this.playerName + ' (房主)', host: true }];
        this.connections.forEach(c => list.push({ id: c.peer, name: c.playerName || '玩家' }));
        return list;
    },

    getPlayerCount() {
        return this.isHost ? this.connections.length + 1 : (this._lastPlayerList?.length || 1);
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
    }
};
