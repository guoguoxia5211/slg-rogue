/**
 * 🏰 随机王国 v0.1.0
 * SLG 肉鸽核心框架
 */

// ==================== 游戏数据 ====================
const TILES = {
    EMPTY: { symbol: '·', name: '空地' },
    PLAYER: { symbol: '♞', name: '玩家' },
    ENEMY: { symbol: '☠', name: '敌人' },
    CITY: { symbol: '♜', name: '城市' },
    RESOURCE: { symbol: '♦', name: '资源' }
};

const ENEMIES = [
    { name: '史莱姆', hp: 20, attack: 5 },
    { name: '哥布林', hp: 30, attack: 8 },
    { name: '骷髅', hp: 40, attack: 12 }
];

// ==================== 游戏类 ====================
class Game {
    constructor() {
        this.mapSize = 5;
        this.map = [];
        this.player = {
            x: 0,
            y: 0,
            hp: 100,
            maxHp: 100,
            attack: 10,
            gold: 0
        };
        this.turn = 1;
        this.log = [];
    }
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        this.generateMap();
        this.addLog('=== 游戏开始 ===');
        this.addLog('探索地图，击败敌人，占领城市！');
        this.render();
    }
    
    // 生成地图
    generateMap() {
        this.map = [];
        for (let y = 0; y < this.mapSize; y++) {
            const row = [];
            for (let x = 0; x < this.mapSize; x++) {
                row.push({ type: 'EMPTY', data: null });
            }
            this.map.push(row);
        }
        
        // 玩家位置
        this.player.x = 0;
        this.player.y = 0;
        
        // 随机放置元素
        this.placeElement('CITY', 2);
        this.placeElement('ENEMY', 5);
        this.placeElement('RESOURCE', 3);
        
        this.addLog('地图已生成');
    }
    
    placeElement(type, count) {
        let placed = 0;
        while (placed < count) {
            const x = Math.floor(Math.random() * this.mapSize);
            const y = Math.floor(Math.random() * this.mapSize);
            
            if (this.map[y][x].type === 'EMPTY' && (x !== 0 || y !== 0)) {
                this.map[y][x] = {
                    type: type,
                    data: type === 'ENEMY' ? ENEMIES[Math.floor(Math.random() * ENEMIES.length)] : null
                };
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
        
        const tile = this.map[newY][newX];
        
        if (tile.type === 'ENEMY') {
            this.combat(tile.data);
        } else if (tile.type === 'CITY') {
            this.occupyCity();
        } else if (tile.type === 'RESOURCE') {
            this.collectResource();
        } else {
            this.addLog(`移动到 (${newX}, ${newY})`);
        }
        
        this.render();
    }
    
    // 战斗
    combat(enemy) {
        this.addLog(`⚔️ 遭遇 ${enemy.name}！`, 'combat');
        
        // 玩家先攻
        const playerDmg = this.player.attack;
        enemy.hp -= playerDmg;
        this.addLog(`你攻击 ${enemy.name}，造成 ${playerDmg} 伤害`);
        
        if (enemy.hp <= 0) {
            this.addLog(`✨ 击败了 ${enemy.name}！`, 'loot');
            this.player.gold += 10;
            this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null };
        } else {
            // 敌人反击
            const enemyDmg = enemy.attack;
            this.player.hp -= enemyDmg;
            this.addLog(`${enemy.name} 反击，造成 ${enemyDmg} 伤害`, 'combat');
            
            if (this.player.hp <= 0) {
                this.gameOver();
            }
        }
    }
    
    // 占领城市
    occupyCity() {
        this.addLog('🏰 占领了一座城市！', 'loot');
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null };
    }
    
    // 收集资源
    collectResource() {
        const gold = Math.floor(Math.random() * 20) + 10;
        this.player.gold += gold;
        this.addLog(`💰 获得 ${gold} 金币`, 'loot');
        this.map[this.player.y][this.player.x] = { type: 'EMPTY', data: null };
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
                if (this.map[y][x].type === 'ENEMY') {
                    const enemy = this.map[y][x].data;
                    const dist = Math.abs(this.player.x - x) + Math.abs(this.player.y - y);
                    
                    if (dist === 1) {
                        this.player.hp -= enemy.attack;
                        this.addLog(`${enemy.name} 攻击你，造成 ${enemy.attack} 伤害`, 'combat');
                        
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
        this.addLog(`存活回合：${this.turn}`);
        setTimeout(() => {
            alert(`游戏结束！存活 ${this.turn} 回合，获得 ${this.player.gold} 金币`);
            location.reload();
        }, 1000);
    }
    
    // 渲染
    render() {
        // 状态栏
        document.getElementById('hp').textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('attack').textContent = this.player.attack;
        document.getElementById('gold').textContent = this.player.gold;
        document.getElementById('turn').textContent = this.turn;
        
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
                } else if (tile.type === 'ENEMY') {
                    tileEl.classList.add('enemy');
                    tileEl.textContent = TILES.ENEMY.symbol;
                } else if (tile.type === 'CITY') {
                    tileEl.classList.add('city');
                    tileEl.textContent = TILES.CITY.symbol;
                } else if (tile.type === 'RESOURCE') {
                    tileEl.classList.add('resource');
                    tileEl.textContent = TILES.RESOURCE.symbol;
                } else {
                    tileEl.classList.add('empty');
                    tileEl.textContent = TILES.EMPTY.symbol;
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
    }
    
    addLog(text, type = '') {
        this.log.unshift({ text, type });
        if (this.log.length > 20) this.log.pop();
        this.renderLog();
    }
    
    renderLog() {
        const logEl = document.getElementById('log');
        logEl.innerHTML = this.log.map(entry => 
            `<div class="log-entry" style="color: ${entry.type === 'combat' ? '#f44' : entry.type === 'loot' ? '#ff0' : entry.type === 'death' ? '#f00' : '#fff'}">${entry.text}</div>`
        ).join('');
    }
}

// ==================== 游戏初始化 ====================
const game = new Game();
