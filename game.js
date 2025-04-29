class DinoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;

        // Load background layers with vertical offset property
        this.backgroundLayers = [
            { name: 'Sky', src: 'assets/Sky.png', speed: 0, yOffset: 0 },
            { name: 'DownLayer', src: 'assets/DownLayer.png', speed: 1, yOffset: 0 },
            { name: 'MiddleLayer', src: 'assets/MiddleLayer.png', speed: 2, yOffset: 0 },
            { name: 'Light', src: 'assets/Light.png', speed: 3, yOffset: 0 },
            { name: 'TopLayer', src: 'assets/TopLayer.png', speed: 4, yOffset: -2 }  // Add small offset for top layer
        ];

        // Initialize background properties
        this.backgrounds = [];
        this.backgroundsLoaded = 0;
        this.loadBackgrounds();

        // Load dino sprite
        this.dinoSprite = new Image();
        this.dinoSprite.src = 'assets/Sprite-0002.png';
        this.dinoSprite.onload = () => {
            this.dinoLoaded = true;
            // Start with original dino dimensions
            this.dino.width = this.dinoSprite.width;
            this.dino.height = this.dinoSprite.height;
            
            // Adjust scale if needed
            const desiredHeight = 60;
            this.dinoScale = desiredHeight / this.dino.height;
            this.dino.width *= this.dinoScale;
            this.dino.height *= this.dinoScale;
        };

        // Load brick wall sprite
        this.brickSprite = new Image();
        this.brickSprite.src = 'assets/Sprite-0003.png';
        this.brickSprite.onload = () => {
            this.brickLoaded = true;
            // Set default obstacle size based on brick sprite
            this.defaultObstacleSize = {
                width: this.brickSprite.width,
                height: this.brickSprite.height
            };
            
            // Adjust scale if needed
            const desiredHeight = 40; // Adjust this value to change obstacle size
            this.brickScale = desiredHeight / this.brickSprite.height;
        };

        // Load flying enemy sprite
        this.flyingEnemySprite = new Image();
        this.flyingEnemySprite.src = 'assets/Sprite-0004.png';
        this.flyingEnemySprite.onload = () => {
            this.flyingEnemyLoaded = true;
            // Calculate scale based on desired height (same as current flying obstacles)
            const desiredHeight = 30; // Match current flying obstacle height
            this.flyingEnemyScale = desiredHeight / this.flyingEnemySprite.height;
        };

        // Game state
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.gameSpeed = 5;
        this.gameOver = false;
        this.dinoLoaded = false;
        this.brickLoaded = false;
        this.flyingEnemyLoaded = false;

        // Dino properties
        this.dino = {
            x: 50,
            y: this.canvas.height - 60,
            width: 40,
            height: 60,
            velocityY: 0,
            jumping: false,
            speed: 5
        };

        // Obstacles array
        this.obstacles = [];
        this.obstacleTimer = 0;

        // Input handling
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);

        // Start the game loop
        this.lastTime = 0;
        this.animate(0);
    }

    loadBackgrounds() {
        this.backgroundLayers.forEach(layer => {
            const img = new Image();
            img.src = layer.src;
            img.onload = () => {
                this.backgroundsLoaded++;
                
                const scaledWidth = (img.width / img.height) * this.canvas.height;
                const copiesNeeded = Math.ceil(this.canvas.width / scaledWidth) + 1;

                this.backgrounds.push({
                    image: img,
                    positions: Array(copiesNeeded).fill(0).map((_, i) => i * scaledWidth),
                    width: scaledWidth,
                    speed: layer.speed,
                    name: layer.name,
                    yOffset: layer.yOffset  // Store the yOffset
                });
            };
        });
    }

    updateBackgrounds() {
        this.backgrounds.forEach(background => {
            // Move each copy of the background
            for (let i = 0; i < background.positions.length; i++) {
                background.positions[i] -= background.speed * (this.gameSpeed * 0.25);

                // If a copy moves completely off screen to the left
                if (background.positions[i] <= -background.width) {
                    // Find the rightmost position of all current copies
                    const rightmostPos = Math.max(...background.positions);
                    // Place this copy right after the rightmost one
                    background.positions[i] = rightmostPos + background.width;
                }
            }
        });
    }

    drawBackgrounds() {
        if (this.backgroundsLoaded < this.backgroundLayers.length) {
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        // Draw backgrounds in order (sky first, top layer last)
        this.backgrounds.forEach(background => {
            background.positions.forEach(xPosition => {
                this.ctx.drawImage(
                    background.image,
                    xPosition,
                    background.yOffset,  // Apply the yOffset here
                    background.width,
                    this.canvas.height
                );
            });
        });
    }

    // Handle player input
    handleInput() {
        // Jump (W or Space)
        if ((this.keys['w'] || this.keys[' ']) && !this.dino.jumping) {
            this.dino.velocityY = -15;
            this.dino.jumping = true;
        }

        // Move left (A)
        if (this.keys['a']) {
            this.dino.x = Math.max(0, this.dino.x - this.dino.speed);
        }

        // Move right (D)
        if (this.keys['d']) {
            this.dino.x = Math.min(this.canvas.width - this.dino.width, this.dino.x + this.dino.speed);
        }
    }

    // Update game objects
    update() {
        if (this.gameOver) return;

        // Update backgrounds
        this.updateBackgrounds();

        // Update score
        this.score++;
        document.getElementById('currentScore').textContent = Math.floor(this.score / 10);
        document.getElementById('highScore').textContent = Math.floor(this.highScore / 10);

        // Update game speed
        this.gameSpeed = 5 + Math.floor(this.score / 500);

        // Update dino
        this.dino.velocityY += 0.8; // Gravity
        this.dino.y += this.dino.velocityY;

        // Ground collision
        if (this.dino.y > this.canvas.height - this.dino.height) {
            this.dino.y = this.canvas.height - this.dino.height;
            this.dino.jumping = false;
            this.dino.velocityY = 0;
        }

        // Generate obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer > 60) {
            this.obstacleTimer = 0;
            if (Math.random() < 0.5) {
                const isFlying = Math.random() < 0.4;
                
                if (isFlying) {
                    // Use flying enemy sprite dimensions for flying obstacles
                    const obstacleWidth = this.flyingEnemyLoaded ? 
                        this.flyingEnemySprite.width * this.flyingEnemyScale : 30;
                    const obstacleHeight = this.flyingEnemyLoaded ? 
                        this.flyingEnemySprite.height * this.flyingEnemyScale : 30;
                    
                    this.obstacles.push({
                        x: this.canvas.width,
                        y: this.canvas.height - 150,
                        width: obstacleWidth,
                        height: obstacleHeight,
                        type: 'flying'
                    });
                } else {
                    // Ground obstacle code remains the same
                    const obstacleWidth = this.brickLoaded ? 
                        this.brickSprite.width * this.brickScale : 20;
                    const obstacleHeight = this.brickLoaded ? 
                        this.brickSprite.height * this.brickScale : 40;
                    
                    this.obstacles.push({
                        x: this.canvas.width,
                        y: this.canvas.height - obstacleHeight,
                        width: obstacleWidth,
                        height: obstacleHeight,
                        type: 'ground'
                    });
                }
            }
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.gameSpeed;

            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.dino, this.obstacles[i])) {
                this.gameOver = true;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('highScore', this.highScore);
                }
            }
        }
    }

    // Check collision between two rectangles
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // Draw game objects
    draw() {
        // Clear canvas and draw backgrounds
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackgrounds();

        // Draw ground (optional now since we have background layers)
        this.ctx.fillStyle = '#33333300';
        this.ctx.fillRect(0, this.canvas.height - 2, this.canvas.width, 2);

        // Draw dino
        if (this.dinoLoaded) {
            this.ctx.save();
            this.ctx.translate(this.dino.x, this.dino.y);
            this.ctx.scale(this.dinoScale, this.dinoScale);
            this.ctx.drawImage(this.dinoSprite, 0, 0);
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
        }

        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'flying' && this.flyingEnemyLoaded) {
                // Draw flying enemy sprite
                this.ctx.save();
                this.ctx.translate(obstacle.x, obstacle.y);
                this.ctx.scale(this.flyingEnemyScale, this.flyingEnemyScale);
                this.ctx.drawImage(this.flyingEnemySprite, 0, 0);
                this.ctx.restore();
            } else if (obstacle.type === 'ground' && this.brickLoaded) {
                // Draw brick sprite
                this.ctx.save();
                this.ctx.translate(obstacle.x, obstacle.y);
                this.ctx.scale(this.brickScale, this.brickScale);
                this.ctx.drawImage(this.brickSprite, 0, 0);
                this.ctx.restore();
            } else {
                // Fallback to rectangles if sprites aren't loaded
                this.ctx.fillStyle = obstacle.type === 'flying' ? 'purple' : 'red';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });

        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'black';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);

            if (this.keys['r']) {
                this.reset();
            }
        }
    }

    // Reset game state
    reset() {
        this.score = 0;
        this.gameSpeed = 5;
        this.gameOver = false;
        this.obstacles = [];
        this.dino.x = 50;
        this.dino.y = this.canvas.height - 60;
        this.dino.velocityY = 0;
        this.dino.jumping = false;

        // Reset background positions
        this.backgrounds.forEach(background => {
            const scaledWidth = background.width;
            background.positions = Array(background.positions.length)
                .fill(0)
                .map((_, i) => i * scaledWidth);
        });
    }

    // Game loop
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.handleInput();
        this.update();
        this.draw();

        requestAnimationFrame(this.animate.bind(this));
    }
}

// Start the game when the page loads
window.onload = () => {
    new DinoGame();
}; 