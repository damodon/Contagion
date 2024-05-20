const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverDiv = document.getElementById('game-over');
const virusContainedDiv = document.getElementById('virus-contained');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let circles = [];
let lines = [];
let infectedCircles = new Set();
let spreadingInterval;
let gameOver = false;
let isDragging = false;

const numCircles = 37;
const maxConnections = 4;
const infectionInterval = 2500;
const baseRadius = 15;
const growthRate = 0.7;

class Circle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = baseRadius;
        this.infected = false;
        this.connections = [];
    }

    infect() {
        this.infected = true;
    }

    grow() {
        if (this.infected && this.radius < baseRadius * 1.5) {
            this.radius += growthRate;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.infected ? 'red' : 'green';
        ctx.fill();
        ctx.closePath();
    }
}

class Line {
    constructor(circle1, circle2) {
        this.circle1 = circle1;
        this.circle2 = circle2;
        this.severed = false;
    }

    draw() {
        if (!this.severed) {
            ctx.beginPath();
            ctx.moveTo(this.circle1.x, this.circle1.y);
            ctx.lineTo(this.circle2.x, this.circle2.y);
            ctx.strokeStyle = 'black';
            ctx.stroke();
            ctx.closePath();
        }
    }

    isClicked(x, y) {
        const dist1 = Math.sqrt((x - this.circle1.x) ** 2 + (y - this.circle1.y) ** 2);
        const dist2 = Math.sqrt((x - this.circle2.x) ** 2 + (y - this.circle2.y) ** 2);
        const length = Math.sqrt((this.circle1.x - this.circle2.x) ** 2 + (this.circle1.y - this.circle2.y) ** 2);
        return dist1 + dist2 >= length - 1 && dist1 + dist2 <= length + 1;
    }

    sever() {
        this.severed = true;
    }

    isConnected() {
        return !this.severed;
    }
}

function setup() {
    circles = [];
    lines = [];
    infectedCircles.clear();
    gameOver = false;
    gameOverDiv.style.display = 'none';
    virusContainedDiv.style.display = 'none';

    // Create circles with non-overlapping positions
    while (circles.length < numCircles) {
        const x = Math.random() * (canvas.width - 40) + 20;
        const y = Math.random() * (canvas.height - 40) + 20;
        let overlapping = false;

        for (const circle of circles) {
            const distance = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
            if (distance < baseRadius * 2) {
                overlapping = true;
                break;
            }
        }

        if (!overlapping) {
            circles.push(new Circle(x, y));
        }
    }

    // Create more linear connections
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length && circles[i].connections.length < maxConnections; j++) {
            if (circles[j].connections.length < maxConnections) {
                const distance = Math.sqrt((circles[i].x - circles[j].x) ** 2 + (circles[i].y - circles[j].y) ** 2);
                if (distance < canvas.width / 3) { // Limit the connection distance to reduce line intersections
                    circles[i].connections.push(j);
                    circles[j].connections.push(i);
                    lines.push(new Line(circles[i], circles[j]));
                }
            }
        }
    }

    // Infect initial circles
    const initialInfections = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < initialInfections; i++) {
        const index = Math.floor(Math.random() * circles.length);
        circles[index].infect();
        infectedCircles.add(index);
    }

    spreadingInterval = setInterval(spreadInfection, infectionInterval);

    requestAnimationFrame(update);
}

function spreadInfection() {
    if (infectedCircles.size === 0) {
        triggerGameOver();
        return;
    }

    const newInfections = new Set();
    for (const index of infectedCircles) {
        const circle = circles[index];
        for (const connection of circle.connections) {
            const line = lines.find(line => 
                (line.circle1 === circle && line.circle2 === circles[connection]) ||
                (line.circle2 === circle && line.circle1 === circles[connection])
            );
            if (line && line.isConnected() && !circles[connection].infected && !newInfections.has(connection)) {
                circles[connection].infect();
                newInfections.add(connection);
            }
        }
    }

    for (const index of newInfections) {
        infectedCircles.add(index);
    }

    if (newInfections.size === 0) {
        triggerVirusContained();
    }
}

function update() {
    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const line of lines) {
            line.draw();
        }

        for (const circle of circles) {
            circle.grow();
            circle.draw();
        }

        requestAnimationFrame(update);
    }
}

function triggerGameOver() {
    gameOver = true;
    clearInterval(spreadingInterval);
    gameOverDiv.style.display = 'block';
}

function triggerVirusContained() {
    gameOver = true;
    clearInterval(spreadingInterval);
    virusContainedDiv.style.display = 'block';
}

function checkLineClick(x, y) {
    for (const line of lines) {
        if (line.isClicked(x, y)) {
            line.sever();
            break;
        }
    }
}

canvas.addEventListener('mousedown', function(event) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    checkLineClick(x, y);
});

canvas.addEventListener('mousemove', function(event) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        checkLineClick(x, y);
    }
});

canvas.addEventListener('mouseup', function() {
    isDragging = false;
});

gameOverDiv.addEventListener('click', function() {
    setup();
});

virusContainedDiv.addEventListener('click', function() {
    setup();
});

setup();
