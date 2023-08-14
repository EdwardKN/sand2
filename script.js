var canvas = document.createElement("canvas");
var c = canvas.getContext("2d");
canvas.style.zIndex = "1"
document.body.appendChild(canvas)

canvas.width = 160*2;
canvas.height = 90*2;

var renderCanvas = document.createElement("canvas");
var renderC = renderCanvas.getContext("2d");
renderCanvas.style.zIndex = "10"
document.body.appendChild(renderCanvas)

var scale;

var mouseSize = 5;
var currentTool = 0;

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function fixCanvas() {
    if (window.innerWidth * 9 > window.innerHeight * 16) {
        renderCanvas.width = window.innerHeight * 16 / 9;
        renderCanvas.height = window.innerHeight;
        scale = renderCanvas.width / canvas.width

    } else {
        renderCanvas.width = window.innerWidth;
        renderCanvas.height = window.innerWidth * 9 / 16;
        scale = renderCanvas.height / canvas.height

    }
}

var mouse = {
    x: 1000,
    y: 1000,
    down: false
}

const chunkSize = 32;

function fixCanvas() {
    if (window.innerWidth * 9 > window.innerHeight * 16) {
        renderCanvas.width = window.innerHeight * 16 / 9;
        renderCanvas.height = window.innerHeight;
        scale = renderCanvas.width / canvas.width

    } else {
        renderCanvas.width = window.innerWidth;
        renderCanvas.height = window.innerWidth * 9 / 16;
        scale = renderCanvas.height / canvas.height

    }
}


renderCanvas.addEventListener("wheel", (e) => {
    currentTool += (Math.sign(e.deltaY))
});
renderCanvas.addEventListener("mousemove", function (e) {
    mouse.x = Math.floor(e.offsetX / scale)
    mouse.y = Math.floor(e.offsetY / scale)
})

renderCanvas.addEventListener("mousedown", function (e) {
    mouse.down = true;    
})

window.addEventListener("mouseup", e => {
    mouse.down = false;
})

window.addEventListener("keydown", e => {
    if (e.code === "KeyD" && player.directionX == 0) {
        player.directionX = -1;
    }
    if (e.code === "KeyA" && player.directionX == 0) {
        player.directionX = 1;
    }
    if (e.code === "KeyW" && player.directionY == 0) {
        player.directionY = 1;
    }
    if (e.code === "KeyS" && player.directionY == 0) {
        player.directionY = -1;
    }
})
window.addEventListener("keyup", e => {
    if (e.code === "KeyD" && player.directionX == -1) {
        player.directionX = 0;
    }
    if (e.code === "KeyA" && player.directionX == 1) {
        player.directionX = 0;
    }
    if (e.code === "KeyW" && player.directionY == 1) {
        player.directionY = 0;
    }
    if (e.code === "KeyS" && player.directionY == -1) {
        player.directionY = 0;
    }
})

window.onresize = fixCanvas;


async function update() {
    requestAnimationFrame(update);
    renderC.imageSmoothingEnabled = false;

    c.clearRect(0, 0, canvas.width, canvas.height);    

    if(mouse.down){
        buttonPress();
    }


    render();

    c.lineWidth = 1;
    c.strokeStyle = "black";
    c.strokeRect(mouse.x- mouseSize/2,mouse.y - mouseSize/2,mouseSize,mouseSize)

    renderC.fillStyle = "white"
    renderC.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderC.drawImage(canvas, 0, 0, renderCanvas.width, renderCanvas.height)

    renderC.fillStyle = "gray"
    renderC.fillText(fps, 100, 100)

}

async function render() {
    for (let x = 0 - Math.floor(player.x) - canvas.width / 4, n = canvas.width/2 - player.x + canvas.width/2; x < n; x++) {
        for (let y = 0 - Math.floor(player.y) - canvas.height / 4, g = canvas.height/2 - player.y + canvas.height/2; y < g; y++) {
            if(getElementAtCell(x,y) instanceof MovableSolid || getElementAtCell(x,y) instanceof Liquid || getElementAtCell(x,y) instanceof Gas){
                getElementAtCell(x,y).step()
            }
        }
    }
    for (let x = -Math.round(player.x / chunkSize) - 1, n = Math.round(canvas.width / chunkSize) - Math.round(player.x / chunkSize) + 1; x < n; x++) {
        for (let y = -Math.round(player.y / chunkSize) - 1, g = Math.round(canvas.height / chunkSize) - Math.round(player.y / chunkSize) + 1; y < g; y++) {
            if (chunks[x + "," + y]) {
                c.drawImage(chunks[x + "," + y].canvas, x * chunkSize + Math.floor(player.x), y * chunkSize + Math.floor(player.y))
            }
        }
    }
    player.update();
}

var times = [];
var fps;

function refreshLoop() {
    window.requestAnimationFrame(function () {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        fps = times.length;
        refreshLoop();
    });
}

function buttonPress(){
    for (let i = 0; i < Math.pow(mouseSize, 2); i++) {
        let x = mouse.x + Math.floor(i / mouseSize) - Math.floor(mouseSize / 2 + player.x);
        let y = mouse.y + i % mouseSize - Math.floor(mouseSize / 2 + player.y)
        if(Math.abs(currentTool) % 4 == 0){
            elements[x + "," + y] = new MovableSolid(x,y,"#c2b280")
        }else if(Math.abs(currentTool) % 4 == 1){
            elements[x + "," + y] = new Liquid(x,y,"blue",5)
        }else if(Math.abs(currentTool) % 4 == 2){
            elements[x + "," + y] = new Gas(x,y,"gray",5)
        }else if(Math.abs(currentTool) % 4 == 3){
            elements[x + "," + y] = undefined;
            let tmpX = x >= 0 ? x % chunkSize : (chunkSize + x % (chunkSize));
            let tmpY = y >= 0 ? y % chunkSize : (chunkSize + y % (chunkSize));
            tmpX = tmpX == chunkSize ? 0 : tmpX;
            tmpY = tmpY == chunkSize ? 0 : tmpY;
            chunks[Math.floor(x / chunkSize) + "," + Math.floor(y / chunkSize)].context.clearRect(tmpX, tmpY, 1, 1);
        }
        if(Math.abs(currentTool) % 4 !== 3){
            elements[x + "," + y].draw()
        }
    }

}

function testGenerate() {
    for (let x = -150; x < 150; x++) {
        for (let y = -80; y < 80; y++) {
            let perlin = 0//getPerlinNoise(x, y, 20, 100)
            if (perlin > 0.5 || Math.abs(x) > 100 || Math.abs(y) > 40) {
                elements[x + "," + y] = new ImmovableSolid(x,y,"brown")
                elements[x + "," + y].draw()
            }
        }
    }
}

async function init() {
    fixCanvas();
    refreshLoop();
    update();
    testGenerate()

}

var elements = [];

var chunks = [];


class Element{
    constructor(x,y,color){
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x:1,
            y:1
        };

        if (this.color === undefined) {
            this.color = "black"
        }
    }
    async draw() {
        if (!chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)]) {
            chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)] = { canvas: document.createElement("canvas") };
            chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].canvas.width = chunkSize;
            chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].canvas.height = chunkSize;
            chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context = chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].canvas.getContext("2d")
        }
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize))
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize))
        tmpX = tmpX == chunkSize ? 0 : tmpX
        tmpY = tmpY == chunkSize ? 0 : tmpY
        chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context.fillStyle = this.color;
        chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context.fillRect(tmpX, tmpY, 1, 1);
    }
    async moveTo(x,y){
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize));
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize));
        tmpX = tmpX == chunkSize ? 0 : tmpX;
        tmpY = tmpY == chunkSize ? 0 : tmpY;
        chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context.clearRect(tmpX, tmpY, 1, 1);

        elements[this.x + "," + this.y] = undefined

        this.x = x;
        this.y = y;
        elements[x + "," + y] = this;
        this.draw();
    }
    async switchWith(x,y){
        let tmp = elements[x+ "," + y] 

        tmp.x = this.x;
        tmp.y = this.y;

        this.x = x;
        this.y = y;
        elements[x + "," + y] = this;

        elements[tmp.x + "," + tmp.y] = tmp;

        this.draw();
        tmp.draw();
        

    }
}

class Solid extends Element{
    
}

class Liquid extends Element{    
    constructor(x,y,color,dispersionRate){
        super(x,y,color);
        this.dispersionRate = dispersionRate
    }
    async step(){
        await sleep()
        let targetCell = getElementAtCell(this.x,this.y+1);
        
        if(targetCell == undefined){
            this.moveTo(this.x,this.y+1)
        }
        if(targetCell !== undefined){
            this.lookHorizontally(Math.random() > 0.5 ? -1 : 1);
        }
    }
    async lookHorizontally(dir){
        await sleep()
        let maxDir = 0;
        for(let i = 1; i < this.dispersionRate+1; i++){
            let targetCell1 = getElementAtCell(this.x+dir*i,this.y);
            let targetCell2 = getElementAtCell(this.x+dir*-i,this.y);
            if(targetCell1 == undefined){
                maxDir = i*dir
            }else if(targetCell2 == undefined){
                maxDir = i*dir*-1
            }else{
                i = undefined;
            }
        }
        if(maxDir !== 0){
            if(maxDir * dir < 0){
                this.lookHorizontally(-dir)
            }else{
                this.moveTo(this.x+maxDir,this.y)
            }
        }
    }
}
class Gas extends Element{
    constructor(x,y,color,dispersionRate){
        super(x,y,color);
        this.dispersionRate = dispersionRate
    }
    async step(){
        await sleep()
        let targetCell = getElementAtCell(this.x,this.y-1);
        
        if(targetCell == undefined){
            this.moveTo(this.x,this.y-1)
        }
        if(targetCell !== undefined){
            this.lookHorizontally(Math.random() > 0.5 ? -1 : 1);
        }
    }
    async lookHorizontally(dir){
        await sleep()
        let maxDir = 0;
        for(let i = 1; i < this.dispersionRate+1; i++){
            let targetCell1 = getElementAtCell(this.x+dir*i,this.y);
            let targetCell2 = getElementAtCell(this.x+dir*-i,this.y);
            if(targetCell1 == undefined){
                maxDir = i*dir
            }else if(targetCell2 == undefined){
                maxDir = i*dir*-1
            }else{
                i = undefined;
            }
        }
        if(maxDir !== 0){
            if(maxDir * dir < 0){
                this.lookHorizontally(-dir)
            }else{
                this.moveTo(this.x+maxDir,this.y)
            }
        }
    }
}

class MovableSolid extends Solid{
    async step(){
        await sleep()
        let targetCell = getElementAtCell(this.x,this.y+1);
        
        if(targetCell == undefined){
            this.moveTo(this.x,this.y+1)
        }
        if(targetCell instanceof Liquid || targetCell instanceof Gas){
            this.switchWith(this.x,this.y+1)
        }
        if(targetCell instanceof Solid){
            this.lookDiagonally(1);
        }
    }
    async lookDiagonally(dir){
        let targetCell = getElementAtCell(this.x+dir,this.y+1);

        if(targetCell == undefined){
            this.moveTo(this.x+dir,this.y+1)
        }
        if(targetCell instanceof Liquid || targetCell instanceof Gas){
            this.switchWith(this.x+dir,this.y+1)
        }
        if(targetCell instanceof Solid && dir !== -1){
            this.lookDiagonally(-1);
        }
    }
}
class ImmovableSolid extends Solid{

}

function getElementAtCell(x,y){
    return elements[x + "," + y]
}


class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speedLossX = 0.5;
        this.speedLossY = 0.5;
        this.directionX = 0;
        this.directionY = 0;
        this.clampX = 5;
        this.clampY = 7;
        this.speedToSpeedX = 1;
        this.speedToSpeedY = 1;
        this.w = 5
        this.h = 10;
        this.weight = 0.1
        this.gravityV = 0;
        this.gravityClamp = 4;
    }
    draw() {
        c.fillStyle = "black"
        c.fillRect(Math.floor(canvas.width / 2 - this.w / 2), Math.floor(canvas.height / 2 - this.h / 2), this.w, this.h)
    }
    update() {
        this.draw()


        this.vx = this.updateVelocity(this.vx, this.directionX, this.speedLossX, this.clampX, this.speedToSpeedX)
        this.vy = this.updateVelocity(this.vy, this.directionY, this.speedLossY, this.clampY, this.speedToSpeedY)

        this.gravityV = this.gravity(this.gravityV, this.gravityClamp)

        this.checkCollisions();

        this.x += this.vx

        this.y += this.vy + this.gravityV



    }

    checkCollisions() {
        let tmp = false;
        for (let i = 0; i < this.w; i++) {
            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2))]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2))] instanceof Solid)) {
                    tmp = true;
                }
            }
        }
        if (tmp) {
            this.gravityV = 0;
            if (this.vy < 0) {
                this.vy = 0;
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2) - 1)]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2) - 1)] instanceof Solid)) {
                        this.y++;
                    }
                }
            }
        }
        let tmp2 = false;
        for (let i = 0; i < this.w; i++) {

            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2 - 1))]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2 - 1))] instanceof Solid)) {
                    tmp2 = true;
                }
            }
        }
        if (tmp2) {
            if (this.directionY == 1) {
                this.vy = -this.gravityV;
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2))]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2))] instanceof Solid)) {
                        this.y--;
                    }
                }
            }
        }
        let tmp3 = false;
        for (let i = 0; i < this.h; i++) {
            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                    tmp3 = true;
                }
            }
        }
        if (tmp3) {
            if (this.directionX == 1) {
                this.vx = 0
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                        this.x--;
                    }
                }
            }
        }
        let tmp4 = false;
        for (let i = 0; i < this.h; i++) {
            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                    tmp4 = true;
                }
            }
        }
        if (tmp4) {
            if (this.directionX == -1) {
                this.vx = 0
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                        this.x++;
                    }
                }
            }
        }
    }
    updateVelocity(v, direction, speedloss, clamp, speedToSpeed) {
        v += speedToSpeed * direction;
        if (v > clamp) {
            v = clamp;
        }
        if (v < -clamp) {
            v = -clamp;
        }
        if (v > 0) {
            v -= speedloss
            if (v < 0) {
                v = 0;
            }
        } else if (v < 0) {
            v += speedloss
            if (v > 0) {
                v = 0;
            }
        }

        return v

    }
    gravity(v, clamp) {
        if (v > clamp) {
            v = clamp;
        }
        if (v < -clamp) {
            v = -clamp;
        }
        v -= this.weight;

        return v;
    }
}

var player = new Player(200, 100)


window.onload = init;
