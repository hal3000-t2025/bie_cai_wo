// 游戏常量
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const TURTLE_SPEED = 5;
const MARIO_SPEED = 3;
const MARIO_JUMP_CHANCE = 0.08; // 马里奥跳跃的概率，从0.02增加到0.08
const MUSHROOM_SPAWN_INTERVAL = 3000; // 小蘑菇生成间隔（毫秒）
const FPS = 60; // 目标帧率
const FRAME_TIME = 1000 / FPS; // 每帧的理想时间（毫秒）

// 获取Canvas和Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameIntro = document.getElementById('gameIntro');
const gameCanvasContainer = document.getElementById('gameCanvasContainer');

// 获取弹窗元素
const aboutButton = document.getElementById('aboutButton');
const authorModal = document.getElementById('authorModal');
const closeModalBtn = document.querySelector('.close');

// 游戏状态
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = highScore;
let mushroomSpawnTimer = 0;
let gameOverTimer = null; // 用于跟踪游戏结束定时器

// 性能变量
let lastFrameTime = 0;
let deltaTime = 0;

// 加载图像
const turtleImg = new Image();
turtleImg.src = 'images/turtle.png';

const marioImg = new Image();
marioImg.src = 'images/mario.png';

// 不再需要背景图像，因为使用PNG图片作为背景
// const backgroundImg = new Image();
// backgroundImg.src = 'images/background.png';

const groundImg = new Image();
groundImg.src = 'images/ground.png';

// 创建小蘑菇图像
const mushroomImg = new Image();
mushroomImg.src = 'images/mushroom.png';

// 游戏对象
const ground = {
    y: canvas.height - 40,
    height: 40
};

const turtle = {
    x: canvas.width / 2,
    y: canvas.height - ground.height - 30, // 60/2 = 30，调整位置以适应新尺寸
    width: 60, // 从40增加到60 (150%)
    height: 60, // 从40增加到60 (150%)
    speed: 0,
    velocityY: 0,
    isJumping: false,
    isCrushed: false,
    rotation: 0,
    direction: 1 // 1表示向右，-1表示向左
};

const mario = {
    x: 50,
    y: canvas.height - ground.height - 45, // 90/2 = 45
    width: 50,
    height: 90,
    speed: MARIO_SPEED,
    velocityY: 0,
    isJumping: false,
    direction: 1 // 1表示向右，-1表示向左
};

// 小蘑菇对象
const mushroom = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    isActive: false
};

// 键盘控制
const keys = {
    left: false,
    right: false
};

// 事件监听器
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

startButton.addEventListener('click', startGame);

// 弹窗控制
aboutButton.addEventListener('click', () => {
    authorModal.style.display = 'block';
});

closeModalBtn.addEventListener('click', () => {
    authorModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === authorModal) {
        authorModal.style.display = 'none';
    }
});

// 游戏初始化
function init() {
    // 清除之前的游戏结束定时器
    if (gameOverTimer) {
        clearTimeout(gameOverTimer);
        gameOverTimer = null;
    }
    
    turtle.x = canvas.width / 2;
    turtle.y = canvas.height - ground.height - 30; // 60/2 = 30，调整位置以适应新尺寸
    turtle.velocityY = 0;
    turtle.isCrushed = false;
    turtle.rotation = 0;
    turtle.direction = 1; // 重置乌龟方向为向右
    
    mario.x = 50;
    mario.y = canvas.height - ground.height - 45; // 90/2 = 45
    mario.velocityY = 0;
    mario.isJumping = false;
    mario.direction = 1;
    
    // 重置小蘑菇状态
    mushroom.isActive = false;
    mushroomSpawnTimer = 0;
    
    score = 0;
    scoreElement.textContent = score;
}

// 开始游戏
function startGame() {
    if (!gameRunning) {
        // 隐藏封面图片，显示游戏画布
        gameIntro.style.display = 'none';
        gameCanvasContainer.style.display = 'block';
        
        init();
        gameRunning = true;
        startButton.textContent = '重新开始';
        lastFrameTime = 0; // 重置帧时间
        requestAnimationFrame(gameLoop);
    } else {
        // 移除所有"重新开始"按钮
        const restartButtons = document.getElementsByClassName('restart-button');
        while (restartButtons.length > 0) {
            if (restartButtons[0].parentNode) {
                restartButtons[0].parentNode.removeChild(restartButtons[0]);
            }
        }
        
        // 完全清除画布上的所有内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 重置游戏状态
        init();
        gameRunning = true;
        lastFrameTime = 0;
        
        // 确保游戏循环重新开始
        requestAnimationFrame(gameLoop);
    }
}

// 游戏循环
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // 计算帧间隔时间
    if (!lastFrameTime) lastFrameTime = timestamp;
    deltaTime = timestamp - lastFrameTime;
    
    // 如果帧间隔时间小于目标帧时间，跳过这一帧
    if (deltaTime < FRAME_TIME) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // 更新上一帧时间
    lastFrameTime = timestamp;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制地面
    for (let i = 0; i < canvas.width; i += 70) {
        ctx.drawImage(groundImg, i, ground.y, 70, ground.height);
    }
    
    // 更新小蘑菇生成计时器
    mushroomSpawnTimer += deltaTime; // 使用实际帧间隔时间
    if (mushroomSpawnTimer >= MUSHROOM_SPAWN_INTERVAL) {
        mushroomSpawnTimer = 0;
        spawnMushroom();
    }
    
    // 更新乌龟位置
    if (!turtle.isCrushed) {
        updateTurtle();
    } else {
        updateTurtleState();
    }
    
    // 更新马里奥位置
    updateMario();
    
    // 检测碰撞
    checkCollision();
    
    // 检测乌龟是否吃到小蘑菇
    checkMushroomCollision();
    
    // 绘制小蘑菇（如果激活）
    if (mushroom.isActive) {
        ctx.drawImage(mushroomImg, mushroom.x - mushroom.width / 2, mushroom.y - mushroom.height / 2, mushroom.width, mushroom.height);
    }
    
    // 绘制乌龟（如果被踩中则旋转）
    if (turtle.isCrushed) {
        ctx.save();
        ctx.translate(turtle.x, turtle.y);
        ctx.rotate(turtle.rotation);
        ctx.drawImage(turtleImg, -turtle.width / 2, -turtle.height / 2, turtle.width, turtle.height);
        ctx.restore();
    } else {
        // 根据乌龟方向绘制
        if (turtle.direction === 1) {
            // 向右时正常绘制
            ctx.drawImage(turtleImg, turtle.x - turtle.width / 2, turtle.y - turtle.height / 2, turtle.width, turtle.height);
        } else {
            // 向左时水平翻转
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(turtleImg, -turtle.x - turtle.width / 2, turtle.y - turtle.height / 2, turtle.width, turtle.height);
            ctx.restore();
        }
    }
    
    // 绘制马里奥（根据方向翻转）
    if (mario.direction === 1) {
        ctx.drawImage(marioImg, mario.x - mario.width / 2, mario.y - mario.height / 2, mario.width, mario.height);
    } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(marioImg, -mario.x - mario.width / 2, mario.y - mario.height / 2, mario.width, mario.height);
        ctx.restore();
    }
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 更新乌龟位置
function updateTurtle() {
    if (keys.left) {
        turtle.x -= TURTLE_SPEED;
        turtle.direction = -1; // 向左移动时方向为左
    }
    if (keys.right) {
        turtle.x += TURTLE_SPEED;
        turtle.direction = 1; // 向右移动时方向为右
    }
    
    // 边界检查 - 修改为穿墙效果
    if (turtle.x < -turtle.width / 2) {
        turtle.x = canvas.width + turtle.width / 2;
    }
    if (turtle.x > canvas.width + turtle.width / 2) {
        turtle.x = -turtle.width / 2;
    }
}

// 更新马里奥位置
function updateMario() {
    // 马里奥的AI行为
    // 1. 向乌龟方向移动
    const distanceToTurtle = turtle.x - mario.x;
    
    // 只有当水平距离大于一定值时才移动，避免抖动
    if (Math.abs(distanceToTurtle) > 10) {
        if (distanceToTurtle > 0) {
            mario.x += mario.speed;
            mario.direction = 1;
        } else {
            mario.x -= mario.speed;
            mario.direction = -1;
        }
    }
    
    // 2. 随机跳跃
    if (!mario.isJumping && Math.random() < MARIO_JUMP_CHANCE) {
        mario.velocityY = JUMP_FORCE;
        mario.isJumping = true;
    }
    
    // 应用重力
    mario.velocityY += GRAVITY;
    mario.y += mario.velocityY;
    
    // 地面检测
    if (mario.y >= canvas.height - mario.height / 2 - ground.height) {
        mario.y = canvas.height - mario.height / 2 - ground.height;
        mario.velocityY = 0;
        mario.isJumping = false;
    }
    
    // 边界检查 - 穿墙效果
    if (mario.x < -mario.width / 2) {
        mario.x = canvas.width + mario.width / 2;
    }
    if (mario.x > canvas.width + mario.width / 2) {
        mario.x = -mario.width / 2;
    }
}

// 检测碰撞
function checkCollision() {
    // 如果乌龟已经被踩中，不再检测碰撞
    if (turtle.isCrushed) return;
    
    // 计算马里奥和乌龟之间的水平和垂直距离
    const dx = Math.abs(mario.x - turtle.x);
    const dy = Math.abs(mario.y - turtle.y);
    
    // 如果马里奥和乌龟水平距离足够近，且马里奥正在下落，且马里奥的底部接近乌龟的顶部，则乌龟被踩中
    if (dx < (mario.width + turtle.width) / 3 && 
        mario.velocityY > 0 && 
        mario.y - mario.height / 2 < turtle.y + turtle.height / 2 && 
        mario.y + mario.height / 2 > turtle.y - turtle.height / 2) {
        turtleCrushed();
    }
}

// 乌龟被踩中
function turtleCrushed() {
    turtle.isCrushed = true;
    turtle.velocityY = -15; // 初始向上的速度
    
    // 3秒后结束游戏
    gameOverTimer = setTimeout(gameOver, 3000);
}

// 更新乌龟状态（包括被踩后的抛物线运动）
function updateTurtleState() {
    if (turtle.isCrushed) {
        // 应用重力
        turtle.velocityY += GRAVITY;
        turtle.y += turtle.velocityY;
        
        // 增加旋转
        turtle.rotation += 0.1;
        
        // 如果乌龟完全离开画面，结束游戏
        if (turtle.y > canvas.height + 100) {
            // 清除之前的定时器，因为我们现在就要结束游戏
            if (gameOverTimer) {
                clearTimeout(gameOverTimer);
                gameOverTimer = null;
            }
            gameOver();
        }
    }
}

// 游戏结束
function gameOver() {
    if (!gameRunning) return; // 防止多次调用
    
    gameRunning = false;
    
    // 绘制游戏结束文字
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`最高分: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    
    // 移除所有现有的"重新开始"按钮
    const existingButtons = document.getElementsByClassName('restart-button');
    while (existingButtons.length > 0) {
        if (existingButtons[0].parentNode) {
            existingButtons[0].parentNode.removeChild(existingButtons[0]);
        }
    }
    
    // 创建一个新的"重新开始"按钮
    const restartButton = document.createElement('button');
    restartButton.textContent = '重新开始';
    restartButton.className = 'restart-button';
    restartButton.addEventListener('click', function() {
        // 点击按钮时立即移除自身
        if (restartButton.parentNode) {
            restartButton.parentNode.removeChild(restartButton);
        }
        startGame();
    });
    
    // 添加到游戏画布容器中
    gameCanvasContainer.appendChild(restartButton);
}

// 图像加载完成后开始游戏
let imagesLoaded = 0;
const totalImages = 4; // 从5减少到4，移除背景图像

// 预加载所有图像
function preloadImages() {
    // 设置图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 禁用开始按钮，直到所有图像加载完成
    startButton.disabled = true;
}

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        // 所有图像加载完成，显示开始按钮
        startButton.disabled = false;
    }
}

// 调用预加载函数
preloadImages();

// 添加图像加载事件
turtleImg.onload = imageLoaded;
marioImg.onload = imageLoaded;
// backgroundImg.onload = imageLoaded; // 移除背景图像加载事件
groundImg.onload = imageLoaded;
mushroomImg.onload = imageLoaded;

// 图像加载错误处理
turtleImg.onerror = function() {
    console.error('无法加载乌龟图像');
    this.src = 'data:image/png;base64,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';
    imageLoaded();
};

marioImg.onerror = function() {
    console.error('无法加载马里奥图像');
    this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGcElEQVR4nO2YW2xU1xWGv7XPZTwznvE9HmPj+z22wYDBEBJCaEJDaKGhSVqiNJFapTxUrXhIpT70oX2o+lY1UtU0VdWoUaJGbdKkSUiTQBJCwDYQg8EYjO347smM5+rLOWf1YcYwNr7EQNRK3ZJ1Zs7eZ6/1n7X+vfY+Ar7H/zXkbBpu3bq1xOv1rvf5fOt9Pt96n8+33ufzrfd6veuklJJzgJQSKSWGYWAYBrquYxgGuq6j6zq6rqPrOrquo2kamqahqiqKoqAoCl6vl/Lycqqrq6mpqaGmpobq6moqKyspKSmhqKiIwsJCCgoKyM/PJy8vj9zcXHJycsjOziYrK4vMzEwyMjJIT08nLS2N1NRUUlJSSE5OJikpicTERBISEkhISCA+Pp64uDji4uKIjY0lJiaG6OhooqKiiIqKIjIyksjISCIiIggPDycsLIzQ0FBCQkIIDg4mKCiIwMBAAgIC8Pf3x8/PD19fX3x8fHD29sbLywuPxzPnUxRFSSmlnJqaGh8fHx8bGxsbHRsbGx0dHR0dGRkZHR4eHh0aGhodHBwcHRgYGB0YGBjt7+8f7evrG+3t7R3t6ekZ7e7uHu3q6hrt7Owc7ejoGG1vbx9ta2sbbW1tHW1paRltbm4ebWpqGm1sbBxtaGgYra+vH62rqxutra0drampiZRSyqamptGGhobR+vr60bq6utHa2trRmpqa0erq6tGqqqqRysrKkYqKipHy8vKR0tLSkZKSkpHi4uKRoqKikcLCwpGCgoKR/Pz8kby8vJHc3NyRnJyckZycnJGsrKyRzMzMkYyMjJH09PSRtLS0kdTU1JGUlJSR5OTkkaSkpJHExMSRhISEkfj4+JG4uLiR2NjYkZiYmJHo6OiRqKiokYiIiJHw8PCRsLCwkdDQ0JGQkJCR4ODgkaAg54mKiiIyMpKIiAjCw8MJCwsjNDSUkJAQgoODCQoKIjAwEH9/f/z8/PD19cXHxwdvb2+8vLzweDxIKZFSYhgGuq6jaRqqqjI5OcnExAQTExOMj48zPj7O2NgYY2NjjI6OMjo6ysjICCMjIwwPDzM8PMzQ0BBDQ0MMDg4yODjIwMAA/f399Pf309fXR19fH729vfT09NDT00N3dzfd3d10dXXR2dlJR0cH7e3ttLe309bWRltbG62trbS0tNDc3ExzczNNTU00NTXR2NhIY2MjDQ0N1NfXU19fT11dHXV1ddTW1lJbW0tNTQ01NTVU/7OaqupqqqqqqKyspLKykoqKCsrLyykvL6esrIzS0lJKS0spKSmhuLiY4uJiioqKKCoqorCwkMLCQgoKCigoKCA/P5/8/Hzy8vLIy8sjNzeX3NxccnJyyMnJISsri6ysLDIzM8nMzCQjI4P09HTS09NJS0sjLS2N1NRUUlNTSUlJISUlheTkZJKTk0lKSiIpKYnExEQSExNJSEggISGB+Ph44uPjiYuLIy4ujri4OGJjY4mNjSUmJobo6Giio6OJjooiKiqKyMhIIiMjiYiIICIigvDwcMLCwggNDSU0NJSQkBCCg4MJDg4mKCiIwMBA/P398fPzw9fXFx8fH7y9vfHy8sLj8SClREqJYRjouv6d/wP/BbGJ7NFknJhgAAAAAElFTkSuQmCC';
    imageLoaded();
};

// backgroundImg.onerror = function() {
//     console.error('无法加载背景图像');
//     this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF7klEQVR4nO3XQQqCQBTG8f8bvULHiDxBJ+gEeYKO0BHqJtEVWkVtWkW0ahVBtIo2QdAi3AhBtpBmJswH3nKY+TGDDCillFJKKaXUP3HAABgBc2AFbIEAiIBYRLZAACyBGTAGuk6dJ+fABDgBcUFxKSdgDLSqhusAa+BaIVxqBfTLhusCxxrCpY5At0y4lk+4lA/UywKOagZMzYtCZoWbNQCmNhZwYzlgZCPgwXLAg42AmY/BzEbAzMdgZiNg5mMwsxEw8zGY2QiY+RjMbATMfAxmNgJmPgYzGwEzH4OZjYCZj8HMRsDMx2BmI2DmYzCzETDzMZhSSv2mO5mFzIKwLQjpAAAAAElFTkSuQmCC';
//     imageLoaded();
// };

groundImg.onerror = function() {
    console.error('无法加载地面图像');
    this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAAoCAYAAABD0IyuAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA+UlEQVR4nO3aQQqCQBTG8f8bvULHiDxBJ+gEeYKO0BHqJtEVWkVtWkW0ahVBtIo2QdAi3AhBtpBmJswH3nKY+TGDDCillFJKKaXUP3HAABgBc2AFbIEAiIBYRLZAACyBGTAGuk6dJ+fABDgBcUFxKSdgDLSqhusCa+BaIVxqBfTLhusCxxrCpY5At0y4lk+4lA/UywKOagZMzYtCZoWbNQCmNhZwYzlgZCPgwXLAg42AmY/BzEbAzMdgZiNg5mMwsxEw8zGY2QiY+RjMbATMfAxmNgJmPgYzGwEzH4OZjYCZj8HMRsDMx2BmI2DmYzCzETDzMZhSSv2mO5mFzIKwLQjpAAAAAElFTkSuQmCC';
    imageLoaded();
};

mushroomImg.onerror = function() {
    console.error('无法加载蘑菇图像');
    this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWklEQVR4nO2WMU7DQBBF3xhFKVJEuQEpJT0SB+AQHIFDUFJyAA5BSQlHoKOj5AApU6VMkSJFihQpQsrKlmxrPTO7XpuGX1rJO/P/jLwz9kLgP9AFRsAUWAAbYA0sgTkwBgZA+7cCO8AEWAFZRV0Dc2AANKoGt4ApsK0IK2sLvAOXZcGXwLwGqKw58FQUPKwZKmsE1HLBXeCjAaisCdA5Bj8DnxWgH8A9cAHcAa/AZ8WZvwGnKrgJvJQM2QEPQCPnWwt4LDnzF+BEBffNbIrqFWjl/GuYNRfVs9W3Ej4rgN5a/oYJLqoHq28lfFUA7Vv+hgkuqr7VtxLOKoD2LP/aBBfVyOpbCdcVQK8sf90EF9W11bcSxiVD3oC24W+bNRTVyOrbMfhQMuTBCMx/Gw9mTUX1bvXLcWXeVLMKoJlZQ+5NVeXlcQbcmvfxzLxvF+Y9OzPv1H/gT/UFuPe7SgYAHQgAAAAASUVORK5CYII=';
    imageLoaded();
};

// 生成小蘑菇
function spawnMushroom() {
    if (!gameRunning || mushroom.isActive || turtle.isCrushed) return;
    
    // 随机位置（避开马里奥和乌龟的位置）
    let x;
    do {
        x = Math.random() * (canvas.width - 100) + 50;
    } while (Math.abs(x - mario.x) < 100 || Math.abs(x - turtle.x) < 100);
    
    mushroom.x = x;
    mushroom.y = canvas.height - ground.height - mushroom.height / 2;
    mushroom.isActive = true;
}

// 检查乌龟是否吃到小蘑菇
function checkMushroomCollision() {
    if (!mushroom.isActive) return;
    
    // 计算乌龟和小蘑菇之间的距离
    const dx = Math.abs(turtle.x - mushroom.x);
    const dy = Math.abs(turtle.y - mushroom.y);
    
    // 如果距离足够近，乌龟吃到小蘑菇
    if (dx < (turtle.width + mushroom.width) / 3 && dy < (turtle.height + mushroom.height) / 3) {
        eatMushroom();
    }
}

// 乌龟吃到小蘑菇
function eatMushroom() {
    // 增加得分
    score += 10;
    scoreElement.textContent = score;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
    
    // 重置小蘑菇状态
    mushroom.isActive = false;
} 