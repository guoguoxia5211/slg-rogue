/**
 * 🏰 随机王国 v0.2.0
 * SLG 肉鸽 - 扩展核心玩法
 */

// ==================== 游戏数据 ====================
const TILES = {
    EMPTY: { symbol: '·', name: '空地' },
    PLAYER: { symbol: '♞', name: '玩家' },
    ENEMY: { symbol: '☠', name: '敌人' },
    CITY: { symbol: '♜', name: '城市' },
    RESOURCE: { symbol: '♦', name: '资源' },
    CHEST: { symbol: '📦', name: '宝箱' },
    SHOP: { symbol: '🏪', name: '商店' },
    BOSS: { symbol: '👹', name: 'BOSS' }
};

const ENEMIES = [
    { name: '史莱姆', hp: 20, attack: 5, exp: 10, gold: 5 },
    { name: '哥布林', hp: 30, attack: 8, exp: 15, gold: 10 },
    { name: '骷髅兵', hp: 40, attack: 12, exp: 20, gold: 15 },
    { name: '兽人', hp: 60, attack: 15, exp: 30, gold: 25 },
    { name: '黑暗骑士', hp: 100, attack: 25, exp: 50, gold: 50 }
];

const BOSSES = [
    { name: '哥布林王', hp: 150, attack: 20, exp: 100, gold: 100 },
    { name: '骷髅王', hp: 250, attack: 30, exp: 200, gold: 200 },
    { name: '魔王', hp: 500, attack: 50, exp: 500, gold: 500 }
];

const SKILLS = [
    { id: 'slash', name: '斩击', damage: 1.5, cost: 10, desc: '造成 150% 伤害' },
    { id: 'heal', name: '治疗', heal: 30, cost: 15, desc: '恢复 30 生命' },
    { id: 'buff', name: '强化', attack: 5, cost: 20, desc: '攻击 +5' }
];

const ITEMS = [
    { name: '铁剑', type: 'weapon', attack: 5, cost: 50 },
    { name: '钢剑', type: 'weapon', attack: 10, cost: 100 },
    { name: '皮甲', type: 'armor', defense: 3, cost: 50 },
    { name: '铁甲', type: 'armor', defense: 8, cost: 100 },
    { name: '血瓶', type: 'potion', heal: 50, cost: 30 }
];

const EVENTS = [
    { text: '遇到流浪商人', type: 'shop' },
    { text: '发现神秘喷泉', type: 'fountain' },
    { text: '踩到陷阱！', type: 'trap' },
    { text: '遇到受伤冒险者', type: 'adventurer' },
    { text: '发现古代遗迹', type: 'ruins' }
];

// ==================== 游戏类 ====================
class Game {
    constructor() {
        this.mapSize = 6;
        this.map = [];
        this.player = {
            x: 0,
            y: 0,
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 0,
            gold: 0,
            exp: 0,
            level: 1,
            skills: [],
            equipment: { weapon: null, armor: null },
            potions: 1
        };
        this.turn = 1;
        this.log = [];
        this.citiesOwned = 0;
        this.bossKilled = false;
    }
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        this.generateMap();
        this.addLog('=== 新的冒险开始 ===', 'event');
        this.addLog('探索地图、占领城市、击败 BOSS！');
        this.addLog('按方向键或点击格子移动');
        this.render();
    }
    
    // 生成地图
    generateMap() {
        this.map = [];
        for (let y = 0; y < this.mapSize; y++) {
            const row = [];
            for (let x = 0; x < this.mapSize; x++) {
                row.push({ type: 'EMPTY', data: null, visited: false });
            }
            this.map.push(row);
        }
        
        this.player.x = 0;
        this.player.y = 0;
        this.map[0][0].visited = true;
        
        // 放置元素
        this.placeElement('CITY', 3);
        this.placeElement('ENEMY', 8);
        this.placeElement('RESOURCE', 4);
        this.placeElement('CHEST', 2);
        this.placeElement('SHOP', 1);
        
        // BOSS 在地图对角
        const boss = BOSSES[Math.floor(this.bossKilled ? 0 : Math.random() * BOSSES.length)];
        this.map[this.mapSize-1][this.mapSize-1] = { 
            type: 'BOSS', 
            data: { ...boss },
            visited: false
        };
        
        this.addLog('地图生成完毕');
        this.addLog('目标：击败右下角的 BOSS！', 'event');
    }
    
    placeElement(type, count) {
        let placed = 0;
        while (placed < count) {
            const x = Math.floor(Math.random() * this.mapSize);
            const y = Math.floor(Math.random() * this.mapSize);
            
            if (this.map[y][x].type === 'EMPTY' && (x !== 0 || y !== 0) && (x !== this.mapSize-1 || y !== this.mapSize-1)) {
                let data = null;
                if (type === 'ENEMY') {
                    data = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
                } else if (type === 'CHEST') {
                    data = { gold: Math.floor(Math.random() * 50) + 20 };
                }
                this.map[y][x] = { type, data, visited: false };
                placed++;
            }
        }
    }
    
    // 移动
    move(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (newX < 0 || newX >= this.mapSize || newY < 0 || newY >= this.mapSize) {
            this.addLog('无法移动到边界外');
            return;
        }
        
        this.player.x = newX;
        this.player.y = newY;
        this.map[newY][newX].visited = true;
        
        const tile = this.map[newY][newX];
        
        if (tile.type === 'ENEMY') {
            this.combat(tile.data, false);
        } else if (tile.type === 'BOSS') {
            this.combat(tile.data, true);
        } else if (tile.type === 'CITY') {
            this.occupyCity();
        } else if (tile.type === 'RESOURCE') {
            this.collectResource();
        } else if (tile.type === 'CHEST') {
            this.openChest(tile.data);
        } else if (tile.type === 'SHOP') {
            this.visitShop();
        } else {
            this.addLog(`移动到 (${newX}, ${newY})`);
        }
        
        this.render();
    }
    
    // 战斗系统
    combat(enemy, isBoss) {
        this.addLog(`⚔️ 遭遇 ${enemy.name}！HP:${enemy.hp} 攻:${enemy.attack}`, 'combat');
        
        // 战斗回合
        const fight = () => {
            // 玩家攻击
            let playerDmg = this.player.attack;
            
            // 技能选择（如果有）
            if (this.player.skills.length > 0 && Math.random() < 0.3) {
                const skill = this.player.skills[Math.floor(Math.random() * this.player.skills.length)];
                if (skill.id === 'slash') {
                    playerDmg = Math.floor(playerDmg * skill.damage);
                    this.addLog(`✨ 使用 ${skill.name}！`, 'event');
                }
            }
            
            // 暴击
            if (Math.random() < 0.1) {
                playerDmg *= 2;
                this.addLog('💥 暴击！', 'event');
            }
            
            enemy.hp -= playerDmg;
            this.addLog(`你攻击 ${enemy.name}，造成 ${playerDmg} 伤害`);
            
            if (enemy.hp <= 0) {
                this.winCombat(enemy, isBoss);
                return;
            }
            
            // 敌人攻击
            let enemyDmg = Math.max(1, enemy.attack - this.player.defense);
            this.player.hp -= enemyDmg;
            this.addLog(`${enemy.name} 反击，造成 ${enemyDmg} 伤害`, 'combat');
            
            this.render();
            
            if (this.player.hp <= 0) {
                this.gameOver();
                return;
            }
            
            // 继续战斗
            setTimeout(fight, 800);
        };
        
        setTimeout(fight, 500);
    }
    
    winCombat(enemy, isBoss) {
        this.addLog(`✨ 击败了 ${enemy.name}！`, 'loot');
        this.player.gold += enemy.gold;
        this.player.exp += enemy.exp;
        
        // 升级
        this.checkLevelUp();
        
        if (isBoss) {
            this.bossKilled = true;
            this.addLog('🏆 BOSS 已击败！游戏胜利！', 'event');
            setTimeout(() => {
                alert(`恭喜通关！\n回合数：${this.turn}\n等级：${this.player.level}`);
                location.reload();
            }, 1000);
            return;
        }
        
        this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null, visited: true };
        this.render();
    }
    
    checkLevelUp() {
        const expNeeded = this.player.level * 50;
        if (this.player.exp >= expNeeded) {
            this.player.level++;
            this.player.exp -= expNeeded;
            this.player.maxHp += 20;
            this.player.hp = this.player.maxHp;
            this.player.attack += 3;
            this.addLog(`🎉 升级！当前等级：${this.player.level}`, 'event');
            this.addLog('生命 +20，攻击 +3');
            
            // 学习技能
            if (this.player.level % 3 === 0 && this.player.skills.length < 3) {
                const skill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
                this.player.skills.push(skill);
                this.addLog(`学会了技能：${skill.name} - ${skill.desc}`, 'event');
            }
        }
    }
    
    // 占领城市
    occupyCity() {
        if (this.map[this.player.y][this.player.x].data && this.map[this.player.y][this.player.x].data.owned) {
            this.addLog('这座城市已经是你的了');
            return;
        }
        
        this.citiesOwned++;
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.map[this.player.y][this.player.x].data = { owned: true };
        this.addLog(`🏰 占领城市！ (${this.citiesOwned}/3)`, 'loot');
        this.addLog('生命上限 +20，生命回满');
        
        if (this.citiesOwned >= 3) {
            this.addLog('🎯 所有城市已占领！现在去击败 BOSS 吧！', 'event');
        }
    }
    
    // 收集资源
    collectResource() {
        const gold = Math.floor(Math.random() * 20) + 10;
        this.player.gold += gold;
        this.addLog(`💰 获得 ${gold} 金币`, 'loot');
        this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null, visited: true };
    }
    
    // 开宝箱
    openChest(chest) {
        this.player.gold += chest.gold;
        this.addLog(`📦 打开宝箱，获得 ${chest.gold} 金币！`, 'loot');
        
        // 几率获得装备
        if (Math.random() < 0.5) {
            const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            if (item.type === 'weapon') {
                this.player.equipment.weapon = item;
                this.player.attack += item.attack;
                this.addLog(`获得武器：${item.name} (攻击 +${item.attack})`, 'loot');
            } else if (item.type === 'armor') {
                this.player.equipment.armor = item;
                this.player.defense += item.defense;
                this.addLog(`获得护甲：${item.name} (防御 +${item.defense})`, 'loot');
            } else if (item.type === 'potion') {
                this.player.potions++;
                this.addLog('获得血瓶 x1', 'loot');
            }
        }
        
        this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null, visited: true };
        this.render();
    }
    
    // 商店
    visitShop() {
        this.addLog('=== 商店 ===', 'event');
        this.addLog('金币：' + this.player.gold);
        
        // 随机商品
        const shopItems = ITEMS.slice(0, 5);
        shopItems.forEach((item, i) => {
            this.addLog(`${i+1}. ${item.name} - ${item.cost} 金币 (${item.type === 'weapon' ? '攻+'+item.attack : item.type === 'armor' ? '防+'+item.defense : '治'+item.heal})`);
        });
        
        // 自动购买（简化）
        if (this.player.gold >= 30 && this.player.potions < 3) {
            this.player.gold -= 30;
            this.player.potions++;
            this.addLog('购买了 血瓶', 'loot');
        }
        
        this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null, visited: true };
        this.render();
    }
    
    // 使用血瓶
    usePotion() {
        if (this.player.potions > 0 && this.player.hp < this.player.maxHp) {
            this.player.potions--;
            const heal = 50;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            this.addLog(`🧪 使用血瓶，恢复 ${heal} 生命`, 'heal');
            this.render();
        } else {
            this.addLog('没有血瓶或生命已满');
        }
    }
    
    // 结束回合
    endTurn() {
        this.turn++;
        this.addLog(`=== 回合 ${this.turn} ===`);
        
        // 敌人行动
        this.enemyTurn();
        
        this.render();
    }
    
    // 敌人回合
    enemyTurn() {
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                if (this.map[y][x].type === 'ENEMY' || this.map[y][x].type === 'BOSS') {
                    const enemy = this.map[y][x].data;
                    const dist = Math.abs(this.player.x - x) + Math.abs(this.player.y - y);
                    
                    if (dist === 1) {
                        let enemyDmg = Math.max(1, enemy.attack - this.player.defense);
                        this.player.hp -= enemyDmg;
                        this.addLog(`${enemy.name} 攻击你，造成 ${enemyDmg} 伤害`, 'combat');
                        
                        if (this.player.hp <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
        }
    }
    
    // 游戏结束
    gameOver() {
        this.addLog('💀 你死了...', 'death');
        this.addLog(`存活回合：${this.turn} | 等级：${this.player.level} | 城市：${this.citiesOwned}`);
        setTimeout(() => {
            alert(`游戏结束！\n存活回合：${this.turn}\n等级：${this.player.level}\n城市：${this.citiesOwned}`);
            location.reload();
        }, 1000);
    }
    
    // 渲染
    render() {
        // 状态栏
        document.getElementById('hp').textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('attack').textContent = `${this.player.attack} (+${this.player.defense})`;
        document.getElementById('gold').textContent = this.player.gold;
        document.getElementById('turn').textContent = this.turn;
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('exp').textContent = `${this.player.exp}/${this.player.level * 50}`;
        
        // 地图
        const mapEl = document.getElementById('map');
        mapEl.innerHTML = '';
        
        for (let y = 0; y < this.mapSize; y++) {
            for (let x = 0; x < this.mapSize; x++) {
                const tile = this.map[y][x];
                const isPlayer = x === this.player.x && y === this.player.y;
                
                const tileEl = document.createElement('div');
                tileEl.className = 'tile';
                
                if (isPlayer) {
                    tileEl.classList.add('player');
                    tileEl.textContent = TILES.PLAYER.symbol;
                } else if (tile.visited || isPlayer) {
                    if (tile.type === 'ENEMY') {
                        tileEl.classList.add('enemy');
                        tileEl.textContent = TILES.ENEMY.symbol;
                    } else if (tile.type === 'BOSS') {
                        tileEl.classList.add('boss');
                        tileEl.textContent = TILES.BOSS.symbol;
                    } else if (tile.type === 'CITY') {
                        tileEl.classList.add('city');
                        tileEl.textContent = TILES.CITY.symbol;
                    } else if (tile.type === 'RESOURCE') {
                        tileEl.classList.add('resource');
                        tileEl.textContent = TILES.RESOURCE.symbol;
                    } else if (tile.type === 'CHEST') {
                        tileEl.classList.add('chest');
                        tileEl.textContent = TILES.CHEST.symbol;
                    } else if (tile.type === 'SHOP') {
                        tileEl.classList.add('shop');
                        tileEl.textContent = TILES.SHOP.symbol;
                    } else {
                        tileEl.classList.add('empty');
                        tileEl.textContent = TILES.EMPTY.symbol;
                    }
                } else {
                    tileEl.classList.add('fog');
                    tileEl.textContent = '?';
                }
                
                tileEl.onclick = () => {
                    const dx = x - this.player.x;
                    const dy = y - this.player.y;
                    if (Math.abs(dx) + Math.abs(dy) === 1) {
                        this.move(dx, dy);
                    }
                };
                
                mapEl.appendChild(tileEl);
            }
        }
        
        // 日志
        this.renderLog();
        
        // 装备
        const weaponName = this.player.equipment.weapon ? this.player.equipment.weapon.name : '无';
        const armorName = this.player.equipment.armor ? this.player.equipment.armor.name : '无';
        document.getElementById('weapon').textContent = weaponName;
        document.getElementById('armor').textContent = armorName;
        document.getElementById('potions').textContent = this.player.potions;
    }
    
    addLog(text, type = '') {
        this.log.unshift({ text, type });
        if (this.log.length > 30) this.log.pop();
        this.renderLog();
    }
    
    renderLog() {
        const logEl = document.getElementById('log');
        logEl.innerHTML = this.log.map(entry => 
            `<div class="log-entry log-${entry.type}">${entry.text}</div>`
        ).join('');
    }
}

// ==================== 游戏初始化 ====================
const game = new Game();
