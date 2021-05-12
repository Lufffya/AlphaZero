const _default = {
    size: 800, // 棋盘外观大小
    shrink: 5, //  棋子大小 = 一格大小 - shrink
    width_hieght: 10, // 棋盘宽高
    gameover_cb: gameover, // 游戏结束回调方法
    bg_texture: 'static\\icon\\wood.png', //  背景纹理
    players: {
        Human: { name: "Human", color: "#000" },
        AI: { name: "AI", color: "#FFF" }
    }
}

class Gomoku {
    constructor(element) {
        Object.assign(this, _default)
        this.checkerboard = element // 棋盘渲染元素
        this.firstPlayer = this.players.Human // 指定先手玩家
        this.currentPlayer = this.firstPlayer
        this.cxt = this.checkerboard.getContext('2d')
        this.gap = this.size / this.width_hieght
        this.move = this.move.bind(this)
        this.bindEvent()
        this.init()
    }
    bindEvent() { // 绑定事件
        this.checkerboard.addEventListener('click', this.move)
    }
    init() { // 初始化
        document.getElementById('processPar').style.display = "inline-block"
        let this_quote = this
        this.initGame({ firstPlayer: this.firstPlayer.name }, function (result) {
            this_quote.cxt.clearRect(0, 0, this_quote.size, this_quote.size)
            this_quote.initSize()
            this_quote.over = false
            this_quote.pieces = []
            this_quote.previousWhite = []
            this_quote.setBackground()
            if (this_quote.firstPlayer.name == "AI") {
                setTimeout(function () {
                    this_quote.createPiece(result.x, result.y, this_quote.players.AI)
                    this_quote.currentPlayer = this_quote.players.Human
                })
            }
            document.getElementById('processPar').style.display = "none"
        })
    }
    initSize() { //初始化棋盘外观大小
        this.checkerboard.width = this.size
        this.checkerboard.height = this.size
        this.bounds = this.checkerboard.getBoundingClientRect()
    }
    setBackground() { // 设置背景图
        this.cxt.clearRect(0, 0, this.size, this.size)
        this.image = new Image()
        this.image.onload = () => {
            this.cxt.fillStyle = this.cxt.createPattern(this.image, 'repeat')
            this.cxt.fillRect(0, 0, this.size, this.size)
            this.createGridding()
        }
        this.image.src = this.bg_texture
    }
    createGridding() { // 生成网格
        this.cxt.strokeStyle = '#000'
        this.cxt.lineWidth = 1
        for (let x = 0; x < this.width_hieght; x++) {
            this.cxt.moveTo(x * this.gap + this.gap / 2, this.gap / 2)
            this.cxt.lineTo(x * this.gap + this.gap / 2, this.size - this.gap / 2)
            this.cxt.moveTo(this.gap / 2, x * this.gap + this.gap / 2)
            this.cxt.lineTo(this.size - this.gap / 2, x * this.gap + this.gap / 2)
            this.cxt.stroke()
        }
    }
    move(e) { // 点击事件
        if (document.getElementById('processPar').style.display != "none") {
            return false
        }
        if (this.over)
            return this.init()
        let this_quote = this
        let x = Math.abs(~~((e.clientY - this.bounds.bottom) / this.gap))
        let y = ~~((e.clientX - this.bounds.left) / this.gap)
        let index = this.getIndex(x, y)
        if (this.pieces.indexOf(index) > -1)
            return false
        this.createPiece(x, y, this.players.Human)
        this.pieces.push(index)
        this.movePiece({ is_human: true, x, y }, function (result) {
            if (this_quote.isWinner(result, this_quote.players.AI)) {
                return false
            }
            document.getElementById('processPar').style.display = "inline-block"
            this_quote.movePiece({ is_human: false }, function (result) {
                this_quote.createPiece(result.x, result.y, this_quote.players.AI)
                this_quote.previousWhite = [result.x, result.y]
                setTimeout(() => this_quote.isWinner(result, this_quote.players.Human), 100)
                document.getElementById('processPar').style.display = "none"
            })
        })
    }
    getIndex(x, y) { // 获取棋子坐标索引
        return y * 10 + x
    }
    createPiece(x, y, player) { //画一个棋子
        if (player.name == "AI") {
            // X axis
            let p1 = y * this.gap + this.gap / 2
            // Y axis
            let p2 = ((this.width_hieght - 1) - x) * this.gap + this.gap / 2
            // size
            let p3 = (this.gap - this.shrink) / 2

            this.cxt.fillStyle = player.color
            this.cxt.shadowColor = '#000'
            this.cxt.shadowBlur = 5

            this.cxt.beginPath()
            this.cxt.arc(p1, p2, p3, 0, 2 * Math.PI, true)
            this.cxt.closePath()

            this.cxt.fill()

            let pos_num = this.gap / 10
            let size_num = 10

            this.cxt.fillStyle = "Red";
            //up
            this.cxt.beginPath();
            this.cxt.arc(p1, p2 - pos_num, p3 / size_num, 0, 2 * Math.PI, true)
            this.cxt.closePath();
            this.cxt.fill()
            //down
            this.cxt.beginPath();
            this.cxt.arc(p1, p2 + pos_num, p3 / size_num, 0, 2 * Math.PI, true)
            this.cxt.closePath();
            this.cxt.fill()
            //left
            this.cxt.beginPath();
            this.cxt.arc(p1 - pos_num, p2, p3 / size_num, 0, 2 * Math.PI, true)
            this.cxt.closePath();
            this.cxt.fill()
            //right
            this.cxt.beginPath();
            this.cxt.arc(p1 + pos_num, p2, p3 / size_num, 0, 2 * Math.PI, true)
            this.cxt.closePath();
            this.cxt.fill()


            if (this.previousWhite.length > 0) {
                let _x = this.previousWhite[0]
                let _y = this.previousWhite[1]

                this.cxt.fillStyle = this.players.AI.color
                this.cxt.shadowColor = '#000'
                this.cxt.shadowBlur = 5
    
                this.cxt.beginPath()
                this.cxt.arc(_y * this.gap + this.gap / 2, ((this.width_hieght - 1) - _x) * this.gap + this.gap / 2, (this.gap - this.shrink) / 2, 0, 2 * Math.PI, true)
                this.cxt.closePath()
    
                this.cxt.fill()
            }
        }
        else {
            this.cxt.fillStyle = player.color
            this.cxt.shadowColor = '#000'
            this.cxt.shadowBlur = 5

            this.cxt.beginPath()
            this.cxt.arc(y * this.gap + this.gap / 2, ((this.width_hieght - 1) - x) * this.gap + this.gap / 2, (this.gap - this.shrink) / 2, 0, 2 * Math.PI, true)
            this.cxt.closePath()

            this.cxt.fill()
        }
    }
    isWinner(result, nextCurrentPlayer) {
        if (result.end) {
            this.over = result.end
            let text = ""
            if (result.winner != -1) {
                text = this.currentPlayer.name + "获得了胜利"
            } else {
                text = "获得平局"
            }
            this.gameover_cb(text)
            return true
        } else {
            this.currentPlayer = nextCurrentPlayer
            return false
        }
    }
    movePiece(data, callback) {
        $.ajax({
            url: "/move",
            data: data,
            method: "GET",
            dataType: "json",
            beforeSend: function () { },
            complete: function () { },
            success: function (result) {
                callback(result)
            },
            error: function (e) {
                alert(e.statusText)
            }
        })
    }
    initGame(data, callback) {
        $.ajax({
            url: "/init",
            data: data,
            method: "GET",
            dataType: "json",
            beforeSend: function () { },
            complete: function () { },
            success: function (result) {
                callback(result)
            },
            error: function (e) {
                alert(e.statusText)
            }
        })
    }
}

let gomoku = new Gomoku(document.getElementById('checkerboard'))

let bValue = gomoku.currentPlayer
Object.defineProperty(gomoku, 'currentPlayer', {
    get: function () {
        return bValue
    },
    set: function (newValue) {
        changePlayer(newValue)
        bValue = newValue
    },
    enumerable: true,
    configurable: true
})

function changePlayer(player) {
    document.getElementById('message').textContent = "当前玩家：" + player.name
}

function gameover(result) {
    document.getElementById('message').textContent = result
    alert(result)
}

changePlayer(bValue)