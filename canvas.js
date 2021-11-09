class Canvas {
    constructor(element, defaultMode) {
        this.canvas = element;
        this.ctx = this.canvas.getContext('2d');
        this.Elements = [];
        this.modes = {
            none:0,
            line: 1,
            quadr1: 2,
            quadr2: 3,
            quadr3: 4,
            quadr4: 5,
            brush: 6,
            drawing: 7
        };
        this.mode = defaultMode;
        this.Active = null;
        this.bMouseDown = false;
        this.mdPos = {x:0,y:0};
       
        this.canvas.addEventListener('mousedown',(e) => {this.mousedown(e)});
        document.querySelector('#app').addEventListener('mouseup',(e) => {this.mouseup(e)});
        this.canvas.addEventListener('mousemove',(e) => {this.mousemove(e)});
    }
    
    mousedown(e) {
        this.bMouseDown = true;

        var pos = this.getMousePos(e);
        
        this.Elements.forEach((el) => {
            el.mousedown(pos);
        });


        if (this.insideObject(pos))
            return;

        if (this.mode == this.modes.brush) {
            this.mdPos = pos;
            this.mode = this.modes.drawing;

        }else if(this.mode == this.modes.quadr1) {
            this.Elements.push(new CanvasQuadr(pos));
            this.Active = this.Elements.length - 1;

            this.mode = this.modes.quadr2;
        }else if(this.mode == this.modes.quadr2) {
            this.Elements[this.Active].AddEndHandle(pos);
            this.mode = this.modes.quadr3;
        }else if(this.mode == this.modes.quadr3) {
            this.Elements[this.Active].AddTangentHandle(pos);
            this.mode = this.modes.quadr4;
        }
      

       
        this.render();
    }

    insideObject(pos) {
        var inside = false;
        this.Elements.forEach((el)=> {
           
            if(el.isInside(pos))
            {
                inside = true;
                return;
            }
                
        });
        return inside;
    }

    mouseup(e) {
        this.bMouseDown = false;
        var pos = this.getMousePos(e);
        this.Elements.forEach((el) => {
            el.mouseup(pos);
        });

        if(this.mode == this.modes.quadr4)
            this.mode = this.modes.quadr1;
        
        if(this.mode == this.modes.drawing)
            this.mode = this.modes.brush;
    }
    mousemove(e) {
        var pos = this.getMousePos(e);

        if (this.mode == this.modes.drawing) {

            if(e.ctrlKey == false)
            {
                this.ctx.lineWidth = 30;
                this.ctx.lineJoin = this.ctx.lineCap = 'round';
                
                this.ctx.moveTo(this.mdPos.x, this.mdPos.y);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.strokeStyle = 'rgb(0, 255, 0)';
                this.ctx.stroke();
                this.mdPos = pos;

            }else{
                this.ctx.moveTo(this.mdPos.x, this.mdPos.y)
                this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                this.ctx.arc(pos.x, pos.y,10, 0, Math.PI*2);
                this.ctx.fill();
                this.mdPos = pos;
            }

            
            
        }

        this.ctx.lineWidth = 4;
        this.Elements.forEach((el) => {
            el.mousemove(pos,this.bMouseDown);
        });

       
        this.render();

       
            
    }
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x_pos = e.clientX - rect.left;
        const y_pos = e.clientY - rect.top;

        return {x:x_pos,y:y_pos};
    }
    clear() {
        this.Elements = [];
        this.render();
    }
    render() {
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.Elements.forEach((el) => {
            if(el.visible)
                el.draw(this.ctx);
        });
    }
}

class CanvasElement {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.name = "CanvasElement";
        this.selected = true;
        this.visible = true;
    }
    isInside(pos) {return false;}
    mousedown(pos) {
        if(this.isInside(pos))
        {
            this.selected = true;
        }
    }
    get pos() {
        return {x:this.x,y:this.y};
    }
    mouseup(pos) {
        this.selected = false;
    }
    mousemove(pos,bMouseDown) {}
}

class CanvasArc extends CanvasElement {
    constructor(x,y,r,fill) {
        super(x,y);
        this.r = r;
        this.fill = fill;
    }
    isInside(pos) {
        var r = 5.0;

        if((this.x-r) < pos.x && pos.x<this.x+r)
        {
            if(this.y-r < pos.y && pos.y <this.y+r)
            {
             return true;
            }
        }
        return false;
    }


    mousemove(pos,bMouseDown)
    {
        if(this.isInside(pos) || this.selected)
        {
            this.r = 5.0;
            if(this.selected)
            {
                this.x = pos.x;
                this.y = pos.y;
            }

        }else{
            this.r = 3.0;
        }
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.fill;
        ctx.fill();
    }
}

class CanvasQuadr extends CanvasElement {
    constructor(pos) {
        super(pos.x,pos.y);
        this.name = "LaneBoundary";
        this.StartHandle = new CanvasArc(pos.x,pos.y,3,'rgb(90, 200, 226)');
        this.EndHandle = null;
        this.TangentHandle = null;
    }
    AddEndHandle(pos) {
        this.EndHandle = new CanvasArc(pos.x,pos.y,3,'rgb(90, 200, 226)');
    }
    AddTangentHandle(pos) {
        this.TangentHandle = new CanvasArc(pos.x,pos.y,3,'rgba(255, 255, 255,0.4)');
    }
    isInside(pos) {
        if(this.StartHandle.isInside(pos)) return true;
        if(this.EndHandle != null && this.EndHandle.isInside(pos)) return true;
        if(this.TangentHandle != null && this.TangentHandle.isInside(pos)) return true;
        return false; 
    }
    mousedown(pos) {
        this.StartHandle.mousedown(pos);

        if(this.EndHandle != null) this.EndHandle.mousedown(pos);
        if(this.TangentHandle != null) this.TangentHandle.mousedown(pos);
    }
    mouseup(pos) {
        this.StartHandle.mouseup(pos);

        if(this.EndHandle != null) this.EndHandle.mouseup(pos);
        if(this.TangentHandle != null) this.TangentHandle.mouseup(pos);
    }
    mousemove(pos,bMouseDown)
    {
        this.StartHandle.mousemove(pos,bMouseDown);
        if(this.EndHandle != null) this.EndHandle.mousemove(pos,bMouseDown);
        if(this.TangentHandle != null) this.TangentHandle.mousemove(pos,bMouseDown);
    }
    draw(ctx) {
        this.StartHandle.draw(ctx);
        if(this.EndHandle != null) this.EndHandle.draw(ctx);
        if(this.TangentHandle != null) this.TangentHandle.draw(ctx);

        if(this.EndHandle != null && this.TangentHandle != null) {
            ctx.beginPath();  
            ctx.moveTo(this.StartHandle.x, this.StartHandle.y);
            ctx.quadraticCurveTo(this.TangentHandle.x,this.TangentHandle.y ,this.EndHandle.x , this.EndHandle.y);
            ctx.strokeStyle = 'rgba(255, 255, 255,0.6) ';
            ctx.stroke();
        }
        
    }
}
