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

    // 6 player character skins
    PLAYER_SKINS: [
        { id:'hunter',  name:'獵人',   body:'#5D4037', belt:'#795548', legs:'#3E2723', boots:'#4E342E', arms:'#8D6E63', skin:'#FFCC80', hair:'#3E2723', hairStyle:'short', acc:null },
        { id:'warrior', name:'戰士',   body:'#B71C1C', belt:'#D32F2F', legs:'#4E342E', boots:'#3E2723', arms:'#FFAB91', skin:'#FFCC80', hair:'#212121', hairStyle:'mohawk', acc:'scar' },
        { id:'scout',   name:'斥候',   body:'#1B5E20', belt:'#4CAF50', legs:'#2E7D32', boots:'#1B5E20', arms:'#A1887F', skin:'#D7CCC8', hair:'#FF8F00', hairStyle:'ponytail', acc:null },
        { id:'mage',    name:'學者',   body:'#283593', belt:'#5C6BC0', legs:'#1A237E', boots:'#0D47A1', arms:'#90A4AE', skin:'#FFF3E0', hair:'#9E9E9E', hairStyle:'long', acc:'glasses' },
        { id:'pirate',  name:'海盜',   body:'#4E342E', belt:'#FF6F00', legs:'#3E2723', boots:'#212121', arms:'#8D6E63', skin:'#FFCC80', hair:'#1B1B1B', hairStyle:'bandana', acc:'eyepatch' },
        { id:'maiden',  name:'少女',   body:'#AD1457', belt:'#F48FB1', legs:'#880E4F', boots:'#C2185B', arms:'#FFAB91', skin:'#FFE0B2', hair:'#5D4037', hairStyle:'twintail', acc:'ribbon' },
    ],

    generatePlayerSkin(scene, skinIdx) {
        const skin = this.PLAYER_SKINS[skinIdx] || this.PLAYER_SKINS[0];
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        const key = 'sprite_player_' + skinIdx;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(S/2, S-2, 8, 3, 0, 0, Math.PI*2); ctx.fill();
        // Body
        ctx.fillStyle = skin.body;
        ctx.fillRect(S/2-5, S*0.35, 10, 14);
        // Belt
        ctx.fillStyle = skin.belt;
        ctx.fillRect(S/2-6, S*0.55, 12, 3);
        // Legs
        ctx.fillStyle = skin.legs;
        ctx.fillRect(S/2-5, S*0.6, 4, 10);
        ctx.fillRect(S/2+1, S*0.6, 4, 10);
        // Boots
        ctx.fillStyle = skin.boots;
        ctx.fillRect(S/2-6, S*0.85, 5, 3);
        ctx.fillRect(S/2+1, S*0.85, 5, 3);
        // Arms
        ctx.fillStyle = skin.arms;
        ctx.fillRect(S/2-8, S*0.38, 3, 10);
        ctx.fillRect(S/2+5, S*0.38, 3, 10);
        // Head
        ctx.fillStyle = skin.skin;
        ctx.beginPath(); ctx.arc(S/2, S*0.25, 6, 0, Math.PI*2); ctx.fill();

        // Hair styles
        ctx.fillStyle = skin.hair;
        if(skin.hairStyle==='short'){
            ctx.beginPath(); ctx.arc(S/2, S*0.22, 6, Math.PI, 2*Math.PI); ctx.fill();
            ctx.fillRect(S/2-6, S*0.18, 12, 3);
        }else if(skin.hairStyle==='mohawk'){
            ctx.fillRect(S/2-2, S*0.08, 4, 8);
            ctx.fillRect(S/2-3, S*0.12, 6, 4);
        }else if(skin.hairStyle==='ponytail'){
            ctx.beginPath(); ctx.arc(S/2, S*0.22, 6, Math.PI, 2*Math.PI); ctx.fill();
            ctx.fillRect(S/2+4, S*0.20, 3, 12);
        }else if(skin.hairStyle==='long'){
            ctx.beginPath(); ctx.arc(S/2, S*0.22, 7, Math.PI*0.8, Math.PI*2.2); ctx.fill();
            ctx.fillRect(S/2-7, S*0.22, 3, 10);
            ctx.fillRect(S/2+4, S*0.22, 3, 10);
        }else if(skin.hairStyle==='bandana'){
            ctx.fillStyle = '#D32F2F';
            ctx.fillRect(S/2-7, S*0.16, 14, 4);
            ctx.fillStyle = skin.hair;
            ctx.beginPath(); ctx.arc(S/2, S*0.15, 5, Math.PI, 2*Math.PI); ctx.fill();
        }else if(skin.hairStyle==='twintail'){
            ctx.beginPath(); ctx.arc(S/2, S*0.22, 6, Math.PI, 2*Math.PI); ctx.fill();
            ctx.fillRect(S/2-7, S*0.22, 3, 12);
            ctx.fillRect(S/2+4, S*0.22, 3, 12);
            ctx.beginPath(); ctx.arc(S/2-6, S*0.46, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(S/2+6, S*0.46, 3, 0, Math.PI*2); ctx.fill();
        }

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(S/2-3, S*0.23, 2, 2);
        ctx.fillRect(S/2+1, S*0.23, 2, 2);

        // Accessories
        if(skin.acc==='scar'){
            ctx.strokeStyle='#B71C1C';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(S/2-4,S*0.20);ctx.lineTo(S/2+2,S*0.30);ctx.stroke();
        }else if(skin.acc==='glasses'){
            ctx.strokeStyle='#FFD54F';ctx.lineWidth=1;
            ctx.strokeRect(S/2-4,S*0.22,3,3);ctx.strokeRect(S/2+1,S*0.22,3,3);
            ctx.beginPath();ctx.moveTo(S/2-1,S*0.23);ctx.lineTo(S/2+1,S*0.23);ctx.stroke();
        }else if(skin.acc==='eyepatch'){
            ctx.fillStyle='#212121';
            ctx.fillRect(S/2+1,S*0.22,3,3);
            ctx.strokeStyle='#212121';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(S/2+2,S*0.16);ctx.lineTo(S/2+2,S*0.23);ctx.stroke();
        }else if(skin.acc==='ribbon'){
            ctx.fillStyle='#E91E63';
            ctx.beginPath();ctx.moveTo(S/2,S*0.13);ctx.lineTo(S/2-4,S*0.08);ctx.lineTo(S/2,S*0.11);ctx.lineTo(S/2+4,S*0.08);ctx.closePath();ctx.fill();
        }

        if(scene.textures.exists(key)) scene.textures.remove(key);
        scene.textures.addCanvas(key, c);
        return key;
    },

    generatePlayer(scene) {
        // Generate default skin (index 0) as sprite_player for backward compat
        this.generatePlayerSkin(scene, 0);
        const c0 = scene.textures.get('sprite_player_0').getSourceImage();
        const c = document.createElement('canvas');
        c.width = c0.width; c.height = c0.height;
        c.getContext('2d').drawImage(c0, 0, 0);
        if(scene.textures.exists('sprite_player')) scene.textures.remove('sprite_player');
        scene.textures.addCanvas('sprite_player', c);
        // Generate all 6 skins
        for(let i=1; i<6; i++) this.generatePlayerSkin(scene, i);
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

    generateTrap(scene) {
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        // Spikes ring
        ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(S/2, S/2, 10, 0, Math.PI*2); ctx.stroke();
        // Spikes
        for (let a = 0; a < 8; a++) {
            const rad = (a/8)*Math.PI*2;
            const ix = S/2+Math.cos(rad)*7, iy = S/2+Math.sin(rad)*7;
            const ox = S/2+Math.cos(rad)*13, oy = S/2+Math.sin(rad)*13;
            ctx.fillStyle = '#9E9E9E';
            ctx.beginPath(); ctx.moveTo(ix-2,iy); ctx.lineTo(ox,oy); ctx.lineTo(ix+2,iy); ctx.closePath(); ctx.fill();
        }
        // Center
        ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.arc(S/2,S/2,4,0,Math.PI*2); ctx.fill();
        scene.textures.addCanvas('sprite_trap', c);
    },

    generateTorch(scene) {
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        // Stick
        ctx.fillStyle = '#5D4037'; ctx.fillRect(S/2-2, S*0.35, 4, S*0.55);
        // Flame
        ctx.fillStyle = '#FF6D00';
        ctx.beginPath(); ctx.moveTo(S/2-5,S*0.38); ctx.quadraticCurveTo(S/2-3,S*0.12,S/2,S*0.05);
        ctx.quadraticCurveTo(S/2+3,S*0.12,S/2+5,S*0.38); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFAB00';
        ctx.beginPath(); ctx.moveTo(S/2-2,S*0.35); ctx.quadraticCurveTo(S/2,S*0.12,S/2+2,S*0.35); ctx.closePath(); ctx.fill();
        // Glow
        const grad = ctx.createRadialGradient(S/2,S*0.25,2,S/2,S*0.25,12);
        grad.addColorStop(0,'rgba(255,160,0,0.3)'); grad.addColorStop(1,'rgba(255,80,0,0)');
        ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
        scene.textures.addCanvas('sprite_torch', c);
    },

    generateArrow(scene) {
        const S = 16, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        // Shaft
        ctx.fillStyle = '#8D6E63'; ctx.fillRect(2, S/2-1, S-4, 2);
        // Head
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath(); ctx.moveTo(S-2,S/2); ctx.lineTo(S-6,S/2-3); ctx.lineTo(S-6,S/2+3); ctx.closePath(); ctx.fill();
        // Fletching
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath(); ctx.moveTo(2,S/2-3); ctx.lineTo(5,S/2); ctx.lineTo(2,S/2+3); ctx.closePath(); ctx.fill();
        scene.textures.addCanvas('sprite_arrow', c);
    },

    // Generate all sprites
    generateDinoEgg(scene) {
        const S = 32, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(S/2, S-3, 8, 3, 0, 0, Math.PI*2); ctx.fill();
        // Egg body (cream oval)
        ctx.fillStyle = '#F5F0E0';
        ctx.beginPath(); ctx.ellipse(S/2, S/2, 8, 11, 0, 0, Math.PI*2); ctx.fill();
        // Darker outline
        ctx.strokeStyle = '#C8B98A';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(S/2, S/2, 8, 11, 0, 0, Math.PI*2); ctx.stroke();
        // Speckles
        const speckles = [[S/2-3,S/2-4],[S/2+2,S/2-6],[S/2+4,S/2+1],[S/2-4,S/2+3],[S/2+1,S/2+5],[S/2-2,S/2+7]];
        speckles.forEach(([sx,sy]) => {
            ctx.fillStyle = `rgba(139,119,80,${0.3+Math.random()*0.3})`;
            ctx.beginPath(); ctx.arc(sx, sy, 1+Math.random(), 0, Math.PI*2); ctx.fill();
        });
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.ellipse(S/2-2, S/2-5, 3, 4, -0.3, 0, Math.PI*2); ctx.fill();
        scene.textures.addCanvas('sprite_dino_egg', c);
    },

    generateAll(scene) {
        this.generateTree(scene);
        this.generateTree2(scene);
        this.generateRock(scene);
        this.generateIronOre(scene);
        this.generateHerb(scene);
        this.generateFruit(scene);
        this.generatePlayer(scene);
        this.generateCampfire(scene);
        this.generateTrap(scene);
        this.generateTorch(scene);
        this.generateArrow(scene);
        this.generateDinoEgg(scene);

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
