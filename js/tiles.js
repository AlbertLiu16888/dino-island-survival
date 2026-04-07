// ===== 程式化無縫 Tile 生成器 =====
// 用 Canvas 2D 繪製可完美四方連續的地面紋理

const TileGen = {
    SIZE: 64,

    // 簡易雜訊函數 (可四方連續)
    hash(x, y) {
        let h = x * 374761393 + y * 668265263;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) & 0xFF) / 255;
    },

    // 平滑雜訊 (wrap-around for seamless)
    noise(x, y, s) {
        const ix = Math.floor(x / s), iy = Math.floor(y / s);
        const fx = (x / s) - ix, fy = (y / s) - iy;
        const a = this.hash(ix & 0xFF, iy & 0xFF);
        const b = this.hash((ix + 1) & 0xFF, iy & 0xFF);
        const c = this.hash(ix & 0xFF, (iy + 1) & 0xFF);
        const d = this.hash((ix + 1) & 0xFF, (iy + 1) & 0xFF);
        const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
        return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    },

    // 多層雜訊
    fbm(x, y, octaves = 3) {
        let v = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            v += this.noise(x, y, 16 / freq) * amp;
            amp *= 0.5; freq *= 2;
        }
        return v;
    },

    hexColor(r, g, b) {
        return `rgb(${r|0},${g|0},${b|0})`;
    },

    // ========= 各 Biome Tile 生成 =========

    generateGrass(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x, y);
                const g = 90 + n * 80;
                const r = 40 + n * 30;
                const b = 20 + n * 20;
                ctx.fillStyle = this.hexColor(r, g, b);
                ctx.fillRect(x, y, 1, 1);
            }
        }
        // 草叢點綴
        for (let i = 0; i < 30; i++) {
            const gx = (this.hash(i, 0) * S) | 0, gy = (this.hash(0, i) * S) | 0;
            ctx.fillStyle = `rgba(100,${180 + (this.hash(i,i)*60)|0},60,0.6)`;
            ctx.fillRect(gx % S, gy % S, 2, 3);
        }
        scene.textures.addCanvas('tile_grass', c);
    },

    generateDirt(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x + 100, y + 100);
                const r = 100 + n * 50, g = 70 + n * 40, b = 40 + n * 20;
                ctx.fillStyle = this.hexColor(r, g, b);
                ctx.fillRect(x, y, 1, 1);
            }
        }
        // 小石子
        for (let i = 0; i < 15; i++) {
            const px = (this.hash(i, 3) * S) | 0, py = (this.hash(3, i) * S) | 0;
            ctx.fillStyle = `rgba(130,120,100,0.5)`;
            ctx.beginPath(); ctx.arc(px % S, py % S, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        scene.textures.addCanvas('tile_dirt', c);
    },

    generateForest(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x + 200, y + 200);
                const r = 25 + n * 30, g = 60 + n * 50, b = 15 + n * 20;
                ctx.fillStyle = this.hexColor(r, g, b);
                ctx.fillRect(x, y, 1, 1);
            }
        }
        // 落葉
        for (let i = 0; i < 25; i++) {
            const lx = (this.hash(i, 5) * S) | 0, ly = (this.hash(5, i) * S) | 0;
            ctx.fillStyle = `rgba(${60+this.hash(i,7)*40|0},${40+this.hash(i,8)*30|0},10,0.4)`;
            ctx.fillRect(lx % S, ly % S, 3, 2);
        }
        scene.textures.addCanvas('tile_forest', c);
    },

    generateSwamp(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x + 300, y + 300);
                const r = 30 + n * 25, g = 35 + n * 30, b = 40 + n * 35;
                ctx.fillStyle = this.hexColor(r, g, b);
                ctx.fillRect(x, y, 1, 1);
            }
        }
        // 水窪
        for (let i = 0; i < 8; i++) {
            const wx = (this.hash(i, 9) * S) | 0, wy = (this.hash(9, i) * S) | 0;
            ctx.fillStyle = 'rgba(20,40,50,0.5)';
            ctx.beginPath(); ctx.ellipse(wx % S, wy % S, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        // 毒氣泡
        for (let i = 0; i < 6; i++) {
            const bx = (this.hash(i, 11) * S) | 0, by = (this.hash(11, i) * S) | 0;
            ctx.fillStyle = 'rgba(100,200,50,0.3)';
            ctx.beginPath(); ctx.arc(bx % S, by % S, 2, 0, Math.PI * 2); ctx.fill();
        }
        scene.textures.addCanvas('tile_swamp', c);
    },

    generateVolcano(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x + 400, y + 400);
                const r = 50 + n * 80, g = 20 + n * 30, b = 10 + n * 15;
                ctx.fillStyle = this.hexColor(r, g, b);
                ctx.fillRect(x, y, 1, 1);
            }
        }
        // 岩漿裂縫
        for (let i = 0; i < 5; i++) {
            const sx = (this.hash(i, 13) * S) | 0, sy = (this.hash(13, i) * S) | 0;
            ctx.strokeStyle = `rgba(255,${100+this.hash(i,14)*100|0},0,0.6)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(sx % S, sy % S);
            ctx.lineTo((sx + 10 + this.hash(i, 15) * 15) % S, (sy + 8 + this.hash(i, 16) * 10) % S);
            ctx.stroke();
        }
        scene.textures.addCanvas('tile_volcano', c);
    },

    generateCamp(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x + 500, y + 500);
                const r = 90 + n * 40, g = 70 + n * 30, b = 45 + n * 20;
                ctx.fillStyle = this.hexColor(r, g, b);
                ctx.fillRect(x, y, 1, 1);
            }
        }
        scene.textures.addCanvas('tile_camp', c);
    },

    // 生態過渡 tile (混合兩種 biome)
    generateTransition(scene, nameA, nameB, key) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        const texA = scene.textures.get('tile_' + nameA)?.getSourceImage();
        const texB = scene.textures.get('tile_' + nameB)?.getSourceImage();
        if (texA) ctx.drawImage(texA, 0, 0);
        if (texB) {
            // 漸層混合
            const grad = ctx.createLinearGradient(0, 0, S, S);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, 'rgba(255,255,255,1)');
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = grad; ctx.fillRect(0, 0, S, S);
            ctx.globalCompositeOperation = 'destination-over';
            if (texB) ctx.drawImage(texB, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
        }
        scene.textures.addCanvas(key, c);
    },

    // 一次生成全部
    generateAll(scene) {
        this.generateCamp(scene);
        this.generateGrass(scene);
        this.generateDirt(scene);
        this.generateForest(scene);
        this.generateSwamp(scene);
        this.generateVolcano(scene);
        // 過渡 tiles
        this.generateTransition(scene, 'grass', 'forest', 'tile_grass_forest');
        this.generateTransition(scene, 'grass', 'swamp', 'tile_grass_swamp');
        this.generateTransition(scene, 'forest', 'swamp', 'tile_forest_swamp');
        this.generateTransition(scene, 'swamp', 'volcano', 'tile_swamp_volcano');
    }
};
