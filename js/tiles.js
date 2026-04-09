// ===== 程式化無縫地圖生成器 v2 =====
// 全地圖連續噪聲 + 生態區漸層混合，消除格子感

const TileGen = {
    SIZE: 64,

    // ---- 雜訊函數 ----
    hash(x, y) {
        let h = x * 374761393 + y * 668265263;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) & 0xFF) / 255;
    },
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
    // 多層雜訊 — 使用世界座標，跨 tile 連續
    fbm(x, y, octaves) {
        octaves = octaves || 4;
        let v = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            v += this.noise(x, y, 24 / freq) * amp;
            amp *= 0.5; freq *= 2;
        }
        return v;
    },
    // 額外細節噪聲層
    detail(x, y) {
        return this.noise(x * 1.7 + 137, y * 1.7 + 241, 6) * 0.15;
    },

    // ---- 生態區顏色定義 [min, range] ----
    BIOME: {
        0: { r: [88, 42], g: [68, 32], b: [44, 22] },    // 營地 (暖棕色)
        1: { r: [42, 28], g: [92, 72], b: [22, 22] },    // 草原 (綠色)
        2: { r: [22, 32], g: [58, 52], b: [12, 22] },    // 森林 (深綠)
        3: { r: [28, 28], g: [35, 30], b: [38, 36] },    // 沼澤 (暗青)
        4: { r: [48, 82], g: [18, 32], b: [8, 18] },     // 火山 (暗紅)
    },

    biomeColor(biome, n) {
        const b = this.BIOME[biome] || this.BIOME[1];
        return {
            r: b.r[0] + n * b.r[1],
            g: b.g[0] + n * b.g[1],
            b: b.b[0] + n * b.b[1]
        };
    },

    lerp(a, b, t) { return a + (b - a) * t; },

    // ---- 主要生成：整張地圖一次繪製 ----
    generateMapTexture(scene, mapData, mapW, mapH, tileSize) {
        const W = mapW * tileSize;
        const H = mapH * tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(W, H);
        const buf = imgData.data;
        const clamp01 = v => v < 0 ? 0 : (v > 1 ? 1 : v);

        const biomeAt = (tx, ty) => {
            if (ty < 0 || ty >= mapH || tx < 0 || tx >= mapW) return 1;
            return mapData[ty][tx];
        };

        const STEP = 2;
        // Domain warping — 讓 biome 邊界彎曲有機
        const WARP_AMP = tileSize * 1.6;
        const WARP_SCALE = 26;

        // 快速雙重取樣混合：在扭曲座標周圍取2個樣本做漸層
        const BLEND_OFF = tileSize * 0.7;

        for (let py = 0; py < H; py += STEP) {
            for (let px = 0; px < W; px += STEP) {
                // 世界座標連續噪聲 (不依賴 biome)
                const n = this.fbm(px, py, 4) + this.detail(px, py);

                // 扭曲座標
                const warpNx = this.noise(px * 0.4 + 137, py * 0.4 + 241, WARP_SCALE) - 0.5;
                const warpNy = this.noise(px * 0.4 + 353, py * 0.4 + 479, WARP_SCALE) - 0.5;
                const wx = px + warpNx * WARP_AMP;
                const wy = py + warpNy * WARP_AMP;
                const wtx = Math.floor(Math.max(0, Math.min(W - 1, wx)) / tileSize);
                const wty = Math.floor(Math.max(0, Math.min(H - 1, wy)) / tileSize);
                const b1 = biomeAt(wtx, wty);

                // 第二次取樣 (偏移) — 用於邊界漸層
                const wx2 = px + warpNx * WARP_AMP + BLEND_OFF;
                const wy2 = py + warpNy * WARP_AMP + BLEND_OFF;
                const wtx2 = Math.floor(Math.max(0, Math.min(W - 1, wx2)) / tileSize);
                const wty2 = Math.floor(Math.max(0, Math.min(H - 1, wy2)) / tileSize);
                const b2 = biomeAt(wtx2, wty2);

                let col;
                if (b1 === b2) {
                    col = this.biomeColor(b1, n);
                } else {
                    // 在兩個 biome 之間做漸層
                    const c1 = this.biomeColor(b1, n);
                    const c2 = this.biomeColor(b2, n);
                    // 用扭曲噪聲的小數部分作為混合因子
                    const frac = clamp01(warpNx + 0.5);
                    const t = frac * frac * (3 - 2 * frac); // smoothstep
                    col = {
                        r: this.lerp(c1.r, c2.r, t * 0.5),
                        g: this.lerp(c1.g, c2.g, t * 0.5),
                        b: this.lerp(c1.b, c2.b, t * 0.5)
                    };
                }

                // 寫入 2x2 像素塊
                const cr = col.r | 0, cg = col.g | 0, cb = col.b | 0;
                for (let sy = 0; sy < STEP && py + sy < H; sy++) {
                    for (let sx = 0; sx < STEP && px + sx < W; sx++) {
                        const idx = ((py + sy) * W + (px + sx)) * 4;
                        buf[idx] = cr; buf[idx + 1] = cg; buf[idx + 2] = cb; buf[idx + 3] = 255;
                    }
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // ---- 裝飾層 ----
        this._addDecorations(ctx, mapData, mapW, mapH, tileSize);

        if (scene.textures.exists('ground_map')) scene.textures.remove('ground_map');
        scene.textures.addCanvas('ground_map', canvas);
    },

    // ---- 裝飾：草叢、石子、落葉、水窪、岩漿 ----
    _addDecorations(ctx, mapData, mapW, mapH, ts) {
        const total = mapW * mapH;

        for (let i = 0; i < total; i++) {
            const tx = i % mapW, ty = (i / mapW) | 0;
            const biome = mapData[ty][tx];
            const cx = tx * ts, cy = ty * ts;

            if (biome === 1) {
                // 草原：草叢
                for (let g = 0; g < 3; g++) {
                    const gx = cx + this.hash(tx + g, ty * 3) * ts;
                    const gy = cy + this.hash(ty + g, tx * 3) * ts;
                    const gh = 3 + this.hash(g, tx + ty) * 4;
                    ctx.strokeStyle = `rgba(${70 + this.hash(g, ty) * 40 | 0},${130 + this.hash(tx, g) * 50 | 0},40,0.35)`;
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (this.hash(g, i) - 0.5) * 4, gy - gh); ctx.stroke();
                }
            } else if (biome === 2) {
                // 森林：落葉
                if (this.hash(tx, ty) > 0.5) {
                    const lx = cx + this.hash(tx * 2, ty) * ts;
                    const ly = cy + this.hash(ty * 2, tx) * ts;
                    ctx.fillStyle = `rgba(${50 + this.hash(tx, ty * 5) * 45 | 0},${35 + this.hash(ty, tx * 5) * 30 | 0},8,0.3)`;
                    ctx.fillRect(lx, ly, 2 + this.hash(tx, ty + 1) * 2, 1.5);
                }
            } else if (biome === 3) {
                // 沼澤：水窪
                if (this.hash(tx * 7, ty * 7) > 0.6) {
                    const wx = cx + ts * 0.2 + this.hash(tx, ty + 9) * ts * 0.6;
                    const wy = cy + ts * 0.2 + this.hash(ty, tx + 9) * ts * 0.6;
                    const wr = 2 + this.hash(tx + ty, 0) * 4;
                    ctx.fillStyle = 'rgba(18,38,48,0.35)';
                    ctx.beginPath(); ctx.ellipse(wx, wy, wr, wr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
                }
            } else if (biome === 4) {
                // 火山：岩漿裂縫
                if (this.hash(tx * 3, ty * 3) > 0.7) {
                    const sx = cx + this.hash(tx, ty + 13) * ts;
                    const sy = cy + this.hash(ty, tx + 13) * ts;
                    ctx.strokeStyle = `rgba(255,${90 + this.hash(tx, ty * 2) * 80 | 0},0,0.4)`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + 6 + this.hash(tx + 1, ty) * 10, sy + 4 + this.hash(ty + 1, tx) * 8);
                    ctx.stroke();
                }
            } else if (biome === 0) {
                // 營地：小碎石
                if (this.hash(tx * 5, ty * 5) > 0.65) {
                    const px2 = cx + this.hash(tx, ty + 3) * ts;
                    const py2 = cy + this.hash(ty, tx + 3) * ts;
                    ctx.fillStyle = `rgba(120,110,90,0.3)`;
                    ctx.beginPath(); ctx.arc(px2, py2, 1.5, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
    },

    // ---- 保留舊方法：菜單背景用單 tile ----
    generateGrass(scene) {
        const S = this.SIZE, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x, y, 3);
                const g = 90 + n * 80, r = 40 + n * 30, b = 20 + n * 20;
                ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        scene.textures.addCanvas('tile_grass', c);
    },

    // ---- 菜單用小 tile 預覽 ----
    generateBiomePreview(scene, biome, key) {
        const S = 64, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const n = this.fbm(x + biome * 200, y + biome * 200, 3);
                const col = this.biomeColor(biome, n);
                ctx.fillStyle = `rgb(${col.r|0},${col.g|0},${col.b|0})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        scene.textures.addCanvas(key, c);
    },

    // 一次生成全部 (Boot Scene 用)
    generateAll(scene) {
        // 菜單背景 + biome 預覽
        this.generateGrass(scene);
        this.generateBiomePreview(scene, 0, 'tile_camp');
        this.generateBiomePreview(scene, 2, 'tile_forest');
        this.generateBiomePreview(scene, 3, 'tile_swamp');
        this.generateBiomePreview(scene, 4, 'tile_volcano');
        // ground_map 在 GameScene.renderMap() 中按需生成
    }
};
