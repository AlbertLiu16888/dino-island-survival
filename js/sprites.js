// ===== Canvas-drawn Resource & Entity Sprites =====
// Replaces emoji circles with proper pixel-art style sprites

const SpriteGen = {
    SIZE: 32,

    // ===== Resource Sprites =====

    generateTree(scene) {
        const S = 48, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(S/2, S-4, 14, 5, 0, 0, Math.PI*2); ctx.fill();

        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(S/2-3, S/2, 6, S/2-4);
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(S/2-1, S/2+2, 2, S/2-6);

        // Foliage layers (bottom to top, darker to lighter)
        const layers = [
            { y: S/2-2, rx: 16, ry: 10, color: '#2E7D32' },
            { y: S/2-8, rx: 14, ry: 9, color: '#388E3C' },
            { y: S/2-14, rx: 11, ry: 8, color: '#43A047' },
            { y: S/2-18, rx: 7, ry: 6, color: '#4CAF50' },
        ];
        layers.forEach(l => {
            ctx.fillStyle = l.color;
            ctx.beginPath(); ctx.ellipse(S/2, l.y, l.rx, l.ry, 0, 0, Math.PI*2); ctx.fill();
        });

        // Highlights
        ctx.fillStyle = 'rgba(129,199,132,0.4)';
        ctx.beginPath(); ctx.ellipse(S/2-4, S/2-16, 4, 3, 0, 0, Math.PI*2); ctx.fill();

        scene.textures.addCanvas('sprite_wood', c);
    },

    generateTree2(scene) {
        const S = 48, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(S/2, S-3, 12, 4, 0, 0, Math.PI*2); ctx.fill();

        // Trunk (pine style)
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(S/2-2, S*0.4, 4, S*0.55);

        // Pine triangle layers
        const triLayers = [
            { y: S*0.45, w: 20, h: 14, color: '#1B5E20' },
            { y: S*0.30, w: 16, h: 12, color: '#2E7D32' },
            { y: S*0.18, w: 12, h: 10, color: '#388E3C' },
            { y: S*0.08, w: 7, h: 8, color: '#43A047' },
        ];
        triLayers.forEach(l => {
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.moveTo(S/2, l.y);
            ctx.lineTo(S/2 - l.w/2, l.y + l.h);
            ctx.lineTo(S/2 + l.w/2, l.y + l.h);
            ctx.closePath(); ctx.fill();
        });

        scene.textures.addCanvas('sprite_wood2', c);
    },

    generateRock(scene) {
        const S = 40, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(S/2+2, S-4, 14, 5, 0, 0, Math.PI*2); ctx.fill();

        // Main boulder
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.moveTo(S*0.2, S*0.7);
        ctx.lineTo(S*0.1, S*0.45);
        ctx.lineTo(S*0.25, S*0.25);
        ctx.lineTo(S*0.5, S*0.15);
        ctx.lineTo(S*0.75, S*0.25);
        ctx.lineTo(S*0.9, S*0.5);
        ctx.lineTo(S*0.8, S*0.75);
        ctx.closePath(); ctx.fill();

        // Light side
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.moveTo(S*0.5, S*0.15);
        ctx.lineTo(S*0.75, S*0.25);
        ctx.lineTo(S*0.7, S*0.5);
        ctx.lineTo(S*0.45, S*0.4);
        ctx.closePath(); ctx.fill();

        // Dark crevice
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.moveTo(S*0.3, S*0.5);
        ctx.lineTo(S*0.5, S*0.45);
        ctx.lineTo(S*0.45, S*0.6);
        ctx.closePath(); ctx.fill();

        // Small secondary rock
        ctx.fillStyle = '#8D8D8D';
        ctx.beginPath(); ctx.ellipse(S*0.25, S*0.65, 6, 5, -0.3, 0, Math.PI*2); ctx.fill();

        scene.textures.addCanvas('sprite_stone', c);
    },

    generateIronOre(scene) {
        const S = 40, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(S/2, S-4, 12, 4, 0, 0, Math.PI*2); ctx.fill();

        // Dark rock base
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.moveTo(S*0.15, S*0.7);
        ctx.lineTo(S*0.1, S*0.4);
        ctx.lineTo(S*0.3, S*0.2);
        ctx.lineTo(S*0.6, S*0.15);
        ctx.lineTo(S*0.85, S*0.3);
        ctx.lineTo(S*0.9, S*0.6);
        ctx.lineTo(S*0.7, S*0.75);
        ctx.closePath(); ctx.fill();

        // Iron veins (metallic blue-gray streaks)
        const veins = [
            { x: S*0.35, y: S*0.35, w: 8, h: 4, angle: 0.3 },
            { x: S*0.55, y: S*0.45, w: 10, h: 4, angle: -0.2 },
            { x: S*0.45, y: S*0.55, w: 7, h: 3, angle: 0.5 },
            { x: S*0.65, y: S*0.35, w: 6, h: 3, angle: -0.4 },
        ];
        veins.forEach(v => {
            ctx.save();
            ctx.translate(v.x, v.y); ctx.rotate(v.angle);
            ctx.fillStyle = '#B0BEC5';
            ctx.fillRect(-v.w/2, -v.h/2, v.w, v.h);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(-v.w/2, -v.h/2, v.w, v.h/2);
            ctx.restore();
        });

        // Metallic gleam spots
        ctx.fillStyle = 'rgba(200,220,240,0.5)';
        ctx.beginPath(); ctx.arc(S*0.4, S*0.3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(S*0.6, S*0.4, 1.5, 0, Math.PI*2); ctx.fill();

        scene.textures.addCanvas('sprite_iron', c);
    },

    generateHerb(scene) {
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.ellipse(S/2, S-3, 10, 3, 0, 0, Math.PI*2); ctx.fill();

        // Stems and leaves
        const stems = [
            { bx: S/2, by: S-5, tx: S/2-6, ty: S*0.3 },
            { bx: S/2, by: S-5, tx: S/2+5, ty: S*0.25 },
            { bx: S/2, by: S-5, tx: S/2, ty: S*0.2 },
            { bx: S/2, by: S-5, tx: S/2-3, ty: S*0.35 },
            { bx: S/2, by: S-5, tx: S/2+7, ty: S*0.4 },
        ];
        stems.forEach(s => {
            ctx.strokeStyle = '#388E3C';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(s.bx, s.by);
            ctx.quadraticCurveTo(s.bx, (s.by+s.ty)/2, s.tx, s.ty);
            ctx.stroke();

            // Leaf at tip
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.ellipse(s.tx, s.ty, 4, 2.5, Math.atan2(s.ty-s.by, s.tx-s.bx), 0, Math.PI*2);
            ctx.fill();
        });

        // Small flowers/buds
        ctx.fillStyle = '#C8E6C9';
        ctx.beginPath(); ctx.arc(S/2, S*0.2, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#A5D6A7';
        ctx.beginPath(); ctx.arc(S/2+5, S*0.25, 1.5, 0, Math.PI*2); ctx.fill();

        scene.textures.addCanvas('sprite_herb', c);
    },

    generateFruit(scene) {
        const S = 40, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.ellipse(S/2, S-3, 10, 4, 0, 0, Math.PI*2); ctx.fill();

        // Bush body
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath(); ctx.ellipse(S/2, S*0.55, 14, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#388E3C';
        ctx.beginPath(); ctx.ellipse(S/2-3, S*0.48, 10, 9, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath(); ctx.ellipse(S/2+4, S*0.42, 8, 7, 0, 0, Math.PI*2); ctx.fill();

        // Berries/fruits
        const berries = [
            { x: S*0.35, y: S*0.4, r: 3, color: '#E91E63' },
            { x: S*0.55, y: S*0.35, r: 3, color: '#E91E63' },
            { x: S*0.65, y: S*0.5, r: 2.5, color: '#C2185B' },
            { x: S*0.4, y: S*0.55, r: 2.5, color: '#AD1457' },
            { x: S*0.5, y: S*0.48, r: 3, color: '#E91E63' },
        ];
        berries.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.arc(b.x-1, b.y-1, b.r*0.4, 0, Math.PI*2); ctx.fill();
        });

        scene.textures.addCanvas('sprite_fruit', c);
    },

    // ===== Character Sprites =====

    generatePlayer(scene) {
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(S/2, S-2, 8, 3, 0, 0, Math.PI*2); ctx.fill();

        // Body
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(S/2-5, S*0.35, 10, 14);

        // Belt
        ctx.fillStyle = '#795548';
        ctx.fillRect(S/2-6, S*0.55, 12, 3);

        // Legs
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(S/2-5, S*0.6, 4, 10);
        ctx.fillRect(S/2+1, S*0.6, 4, 10);

        // Boots
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(S/2-6, S*0.85, 5, 3);
        ctx.fillRect(S/2+1, S*0.85, 5, 3);

        // Arms
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(S/2-8, S*0.38, 3, 10);
        ctx.fillRect(S/2+5, S*0.38, 3, 10);

        // Head
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath(); ctx.arc(S/2, S*0.25, 6, 0, Math.PI*2); ctx.fill();

        // Hair
        ctx.fillStyle = '#3E2723';
        ctx.beginPath(); ctx.arc(S/2, S*0.22, 6, Math.PI, 2*Math.PI); ctx.fill();
        ctx.fillRect(S/2-6, S*0.18, 12, 3);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(S/2-3, S*0.23, 2, 2);
        ctx.fillRect(S/2+1, S*0.23, 2, 2);

        scene.textures.addCanvas('sprite_player', c);
    },

    // ===== Dino Sprites =====

    generateDinoSprite(scene, key, color, size, features) {
        const S = size || 40, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(S/2, S-3, S*0.35, S*0.1, 0, 0, Math.PI*2); ctx.fill();

        // Body (oval)
        const bodyColor = color;
        ctx.fillStyle = bodyColor;
        ctx.beginPath(); ctx.ellipse(S/2, S*0.55, S*0.3, S*0.2, 0, 0, Math.PI*2); ctx.fill();

        // Head
        ctx.fillStyle = bodyColor;
        ctx.beginPath(); ctx.ellipse(S*0.7, S*0.35, S*0.15, S*0.12, 0.3, 0, Math.PI*2); ctx.fill();

        // Eye
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(S*0.74, S*0.32, S*0.04, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(S*0.75, S*0.32, S*0.02, 0, Math.PI*2); ctx.fill();

        // Mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(S*0.78, S*0.38); ctx.lineTo(S*0.85, S*0.36); ctx.stroke();

        // Tail
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(S*0.2, S*0.5);
        ctx.quadraticCurveTo(S*0.05, S*0.4, S*0.08, S*0.3);
        ctx.lineTo(S*0.15, S*0.35);
        ctx.quadraticCurveTo(S*0.12, S*0.45, S*0.25, S*0.55);
        ctx.closePath(); ctx.fill();

        // Legs
        ctx.fillStyle = bodyColor;
        ctx.fillRect(S*0.35, S*0.7, S*0.08, S*0.18);
        ctx.fillRect(S*0.57, S*0.7, S*0.08, S*0.18);

        // Feet
        ctx.fillStyle = '#333';
        ctx.fillRect(S*0.33, S*0.86, S*0.12, S*0.04);
        ctx.fillRect(S*0.55, S*0.86, S*0.12, S*0.04);

        // Belly (lighter shade)
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.ellipse(S/2, S*0.6, S*0.2, S*0.12, 0, 0, Math.PI*2); ctx.fill();

        // Special features
        if (features?.horns) {
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath();
            ctx.moveTo(S*0.72, S*0.25); ctx.lineTo(S*0.78, S*0.12); ctx.lineTo(S*0.8, S*0.27);
            ctx.closePath(); ctx.fill();
        }
        if (features?.plates) {
            ctx.fillStyle = bodyColor;
            for (let i = 0; i < 4; i++) {
                const px = S*0.3 + i * S*0.1;
                ctx.beginPath();
                ctx.moveTo(px, S*0.45);
                ctx.lineTo(px+S*0.03, S*0.3);
                ctx.lineTo(px+S*0.06, S*0.45);
                ctx.closePath(); ctx.fill();
            }
        }
        if (features?.sail) {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(S*0.3, S*0.5);
            ctx.quadraticCurveTo(S*0.45, S*0.1, S*0.6, S*0.45);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        if (features?.crest) {
            ctx.fillStyle = '#AB47BC';
            ctx.beginPath();
            ctx.moveTo(S*0.68, S*0.28);
            ctx.lineTo(S*0.65, S*0.12);
            ctx.lineTo(S*0.72, S*0.15);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(S*0.73, S*0.28);
            ctx.lineTo(S*0.75, S*0.14);
            ctx.lineTo(S*0.78, S*0.18);
            ctx.closePath(); ctx.fill();
        }
        if (features?.boss) {
            // Crown effect
            ctx.fillStyle = '#FFD54F';
            const crx = S*0.72, cry = S*0.15;
            ctx.beginPath();
            ctx.moveTo(crx-6, cry+4); ctx.lineTo(crx-5, cry-4);
            ctx.lineTo(crx-2, cry); ctx.lineTo(crx, cry-6);
            ctx.lineTo(crx+2, cry); ctx.lineTo(crx+5, cry-4);
            ctx.lineTo(crx+6, cry+4);
            ctx.closePath(); ctx.fill();
        }

        scene.textures.addCanvas('sprite_dino_' + key, c);
    },

    generateCampfire(scene) {
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');

        // Glow
        const grad = ctx.createRadialGradient(S/2, S/2, 2, S/2, S/2, S/2);
        grad.addColorStop(0, 'rgba(255,160,0,0.3)');
        grad.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, S, S);

        // Logs
        ctx.fillStyle = '#5D4037';
        ctx.save(); ctx.translate(S/2, S*0.7); ctx.rotate(-0.3);
        ctx.fillRect(-8, -2, 16, 4); ctx.restore();
        ctx.save(); ctx.translate(S/2, S*0.7); ctx.rotate(0.3);
        ctx.fillRect(-8, -2, 16, 4); ctx.restore();

        // Fire
        ctx.fillStyle = '#FF6D00';
        ctx.beginPath();
        ctx.moveTo(S/2-6, S*0.7);
        ctx.quadraticCurveTo(S/2-4, S*0.3, S/2, S*0.2);
        ctx.quadraticCurveTo(S/2+4, S*0.3, S/2+6, S*0.7);
        ctx.closePath(); ctx.fill();

        // Inner flame
        ctx.fillStyle = '#FFAB00';
        ctx.beginPath();
        ctx.moveTo(S/2-3, S*0.65);
        ctx.quadraticCurveTo(S/2-1, S*0.35, S/2, S*0.28);
        ctx.quadraticCurveTo(S/2+1, S*0.35, S/2+3, S*0.65);
        ctx.closePath(); ctx.fill();

        // Core
        ctx.fillStyle = '#FFF9C4';
        ctx.beginPath();
        ctx.moveTo(S/2-1, S*0.6);
        ctx.quadraticCurveTo(S/2, S*0.4, S/2+1, S*0.6);
        ctx.closePath(); ctx.fill();

        scene.textures.addCanvas('sprite_campfire', c);
    },

    // Generate all sprites
    generateAll(scene) {
        this.generateTree(scene);
        this.generateTree2(scene);
        this.generateRock(scene);
        this.generateIronOre(scene);
        this.generateHerb(scene);
        this.generateFruit(scene);
        this.generatePlayer(scene);
        this.generateCampfire(scene);

        // Dino sprites
        const dinoConfigs = {
            raptor:  { color: '#4CAF50', size: 36, features: {} },
            oviraptor: { color: '#FFEB3B', size: 32, features: {} },
            trike:   { color: '#795548', size: 48, features: { horns: true } },
            stego:   { color: '#FF9800', size: 46, features: { plates: true } },
            dilopho: { color: '#9C27B0', size: 38, features: { crest: true } },
            allo:    { color: '#311B92', size: 48, features: {} },
            trex:    { color: '#B71C1C', size: 56, features: { boss: true } },
            spino:   { color: '#0D47A1', size: 54, features: { sail: true, boss: true } },
        };
        for (const [key, cfg] of Object.entries(dinoConfigs)) {
            this.generateDinoSprite(scene, key, cfg.color, cfg.size, cfg.features);
        }
    }
};
